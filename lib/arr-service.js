import { randomUUID } from 'crypto';

export const ARR_TYPES = ['sonarr', 'radarr'];
const MAX_INSTANCES_PER_TYPE = 10;

const defaultInstanceId = (type) => `${type}-default`;

export const createArrInstance = ({
    type,
    name = '',
    url = '',
    apiKey = '',
    enabled = true,
    isDefault = false,
    id = randomUUID(),
} = {}) => ({
    id: String(id),
    type: type === 'radarr' ? 'radarr' : 'sonarr',
    name: String(name || (type === 'radarr' ? 'Radarr' : 'Sonarr')).trim(),
    url: String(url || '').trim(),
    apiKey: String(apiKey || ''),
    enabled: enabled !== false,
    isDefault: !!isDefault,
});

export const migrateArrConfig = (config = {}) => {
    const next = { ...config };
    if (Array.isArray(next.arrInstances) && next.arrInstances.length > 0) {
        return next;
    }

    const instances = [];
    if (next.sonarrUrl || next.sonarrApiKey) {
        instances.push(createArrInstance({
            id: defaultInstanceId('sonarr'),
            type: 'sonarr',
            name: 'Sonarr',
            url: next.sonarrUrl || '',
            apiKey: next.sonarrApiKey || '',
            enabled: true,
            isDefault: true,
        }));
    }
    if (next.radarrUrl || next.radarrApiKey) {
        instances.push(createArrInstance({
            id: defaultInstanceId('radarr'),
            type: 'radarr',
            name: 'Radarr',
            url: next.radarrUrl || '',
            apiKey: next.radarrApiKey || '',
            enabled: true,
            isDefault: true,
        }));
    }
    next.arrInstances = instances;
    return next;
};

export const syncLegacyArrFields = (config = {}) => {
    const next = migrateArrConfig(config);
    const sonarr = getDefaultArrInstance(next, 'sonarr');
    const radarr = getDefaultArrInstance(next, 'radarr');
    next.sonarrUrl = sonarr?.url || '';
    next.sonarrApiKey = sonarr?.apiKey || '';
    next.radarrUrl = radarr?.url || '';
    next.radarrApiKey = radarr?.apiKey || '';
    return next;
};

export const normalizeArrConfig = (config = {}) => syncLegacyArrFields(migrateArrConfig(config));

export const getArrInstances = (config = {}, { type = null, enabledOnly = false } = {}) => {
    const normalized = migrateArrConfig(config);
    let instances = Array.isArray(normalized.arrInstances) ? normalized.arrInstances : [];
    if (type) instances = instances.filter((entry) => entry?.type === type);
    if (enabledOnly) instances = instances.filter((entry) => entry?.enabled !== false);
    return instances;
};

export const getArrInstance = (config = {}, instanceId = '') => {
    const id = String(instanceId || '').trim();
    if (!id) return null;
    return getArrInstances(config).find((entry) => entry.id === id) || null;
};

export const getDefaultArrInstance = (config = {}, type = 'sonarr') => {
    const arrType = type === 'radarr' ? 'radarr' : 'sonarr';
    const instances = getArrInstances(config, { type: arrType, enabledOnly: true });
    return instances.find((entry) => entry.isDefault)
        || instances.find((entry) => entry.url && entry.apiKey)
        || instances[0]
        || null;
};

export const isArrInstanceReady = (instance) => !!(instance?.enabled !== false && instance?.url && instance?.apiKey);

export const isArrTypeConfigured = (config = {}, type = 'sonarr') => isArrInstanceReady(getDefaultArrInstance(config, type));

export const getArrCredentials = (config = {}, type = 'sonarr') => {
    const instance = getDefaultArrInstance(config, type);
    if (!isArrInstanceReady(instance)) return { url: '', apiKey: '', instance: null };
    return { url: instance.url, apiKey: instance.apiKey, instance };
};

const ensureSingleDefaultPerType = (instances = []) => {
    const next = instances.map((entry) => ({ ...entry }));
    for (const type of ARR_TYPES) {
        const typed = next.filter((entry) => entry.type === type);
        if (typed.length === 0) continue;
        let defaultIndex = typed.findIndex((entry) => entry.isDefault);
        if (defaultIndex < 0) defaultIndex = 0;
        const defaultId = typed[defaultIndex].id;
        next.forEach((entry) => {
            if (entry.type === type) entry.isDefault = entry.id === defaultId;
        });
    }
    return next;
};

export const sanitizeArrInstances = (
    incomingInstances,
    existingConfig = {},
    { resolveSecret, resolveConfigIntegrationUrl, secretMask = '••••••••' } = {}
) => {
    if (!Array.isArray(incomingInstances)) {
        return getArrInstances(existingConfig);
    }

    const existingInstances = getArrInstances(existingConfig);
    const existingById = new Map(existingInstances.map((entry) => [entry.id, entry]));
    const sanitized = [];

    for (const raw of incomingInstances.slice(0, MAX_INSTANCES_PER_TYPE * ARR_TYPES.length)) {
        const type = raw?.type === 'radarr' ? 'radarr' : raw?.type === 'sonarr' ? 'sonarr' : null;
        if (!type) continue;

        const id = String(raw?.id || randomUUID());
        const existing = existingById.get(id) || null;
        const name = String(raw?.name || existing?.name || (type === 'radarr' ? 'Radarr' : 'Sonarr')).trim() || (type === 'radarr' ? 'Radarr' : 'Sonarr');
        const safeUrl = resolveConfigIntegrationUrl
            ? resolveConfigIntegrationUrl(raw?.url, existing?.url || '')
            : String(raw?.url || existing?.url || '').trim();
        const apiKey = resolveSecret
            ? resolveSecret(raw?.apiKey, existing?.apiKey || '')
            : String(raw?.apiKey || existing?.apiKey || '');

        sanitized.push(createArrInstance({
            id,
            type,
            name,
            url: safeUrl,
            apiKey: apiKey === secretMask ? (existing?.apiKey || '') : apiKey,
            enabled: raw?.enabled !== false,
            isDefault: !!raw?.isDefault,
        }));
    }

    const typedCounts = ARR_TYPES.reduce((acc, type) => {
        acc[type] = sanitized.filter((entry) => entry.type === type).length;
        return acc;
    }, {});
    for (const type of ARR_TYPES) {
        if (typedCounts[type] > MAX_INSTANCES_PER_TYPE) {
            throw new Error(`Too many ${type} instances (max ${MAX_INSTANCES_PER_TYPE}).`);
        }
    }

    return ensureSingleDefaultPerType(sanitized);
};

export const maskArrInstancesForApi = (instances = [], secretMask = '••••••••') => (
    (Array.isArray(instances) ? instances : []).map((entry) => ({
        id: entry.id,
        type: entry.type,
        name: entry.name || '',
        url: entry.url || '',
        apiKey: entry.apiKey ? secretMask : '',
        enabled: entry.enabled !== false,
        isDefault: !!entry.isDefault,
    }))
);

export const mergeLegacyArrFieldsIntoInstances = (body = {}, existingConfig = {}, helpers = {}) => {
    const hasLegacySonarr = 'sonarrUrl' in body || 'sonarrApiKey' in body;
    const hasLegacyRadarr = 'radarrUrl' in body || 'radarrApiKey' in body;
    const hasInstances = Array.isArray(body.arrInstances);

    if (hasInstances) {
        return sanitizeArrInstances(body.arrInstances, existingConfig, helpers);
    }

    const instances = getArrInstances(existingConfig);
    const next = instances.map((entry) => ({ ...entry }));

    const upsertLegacy = (type, url, apiKey) => {
        const arrType = type === 'radarr' ? 'radarr' : 'sonarr';
        const existing = next.find((entry) => entry.type === arrType && entry.isDefault)
            || next.find((entry) => entry.type === arrType);
        const safeUrl = helpers.resolveConfigIntegrationUrl
            ? helpers.resolveConfigIntegrationUrl(url, existing?.url || '')
            : String(url || existing?.url || '').trim();
        const resolvedKey = helpers.resolveSecret
            ? helpers.resolveSecret(apiKey, existing?.apiKey || '')
            : String(apiKey || existing?.apiKey || '');

        if (existing) {
            existing.url = safeUrl;
            existing.apiKey = resolvedKey;
            existing.enabled = existing.enabled !== false;
            return;
        }
        if (!safeUrl && !resolvedKey) return;
        next.push(createArrInstance({
            id: defaultInstanceId(arrType),
            type: arrType,
            name: arrType === 'radarr' ? 'Radarr' : 'Sonarr',
            url: safeUrl,
            apiKey: resolvedKey,
            enabled: true,
            isDefault: true,
        }));
    };

    if (hasLegacySonarr) upsertLegacy('sonarr', body.sonarrUrl, body.sonarrApiKey);
    if (hasLegacyRadarr) upsertLegacy('radarr', body.radarrUrl, body.radarrApiKey);

    return ensureSingleDefaultPerType(next);
};

export const fetchArrInstance = async (instance, endpoint, {
    resolveUrl = (url) => url,
    fetchImpl = fetch,
    headers = {},
} = {}) => {
    if (!isArrInstanceReady(instance)) return null;
    try {
        const safeBaseUrl = resolveUrl(instance.url);
        const base = safeBaseUrl.endsWith('/') ? safeBaseUrl.slice(0, -1) : safeBaseUrl;
        const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        const response = await fetchImpl(`${base}${path}`, {
            headers: { 'X-Api-Key': instance.apiKey, Accept: 'application/json', ...headers },
        });
        if (!response.ok) return null;
        return await response.json();
    } catch {
        return null;
    }
};
