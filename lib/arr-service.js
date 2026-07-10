import { randomUUID } from 'crypto';

export const ARR_TYPES = ['sonarr', 'radarr'];
const MAX_INSTANCES_PER_TYPE = 10;

const defaultInstanceId = (type) => `${type}-default`;

const normalizePlexLibraryIds = (value) => {
    if (!Array.isArray(value)) return [];
    return [...new Set(value.map((entry) => String(entry || '').trim()).filter(Boolean))];
};

export const createArrInstance = ({
    type,
    name = '',
    url = '',
    apiKey = '',
    enabled = true,
    isDefault = false,
    plexLibraryIds = [],
    id = randomUUID(),
} = {}) => ({
    id: String(id),
    type: type === 'radarr' ? 'radarr' : 'sonarr',
    name: String(name || (type === 'radarr' ? 'Radarr' : 'Sonarr')).trim(),
    url: String(url || '').trim(),
    apiKey: String(apiKey || ''),
    enabled: enabled !== false,
    isDefault: !!isDefault,
    plexLibraryIds: normalizePlexLibraryIds(plexLibraryIds),
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

export const getArrCredentials = (config = {}, type = 'sonarr', instanceId = null) => {
    const arrType = type === 'radarr' ? 'radarr' : 'sonarr';
    const instance = instanceId
        ? getArrInstance(config, instanceId)
        : getDefaultArrInstance(config, arrType);
    if (!instance || instance.type !== arrType || !isArrInstanceReady(instance)) {
        return { url: '', apiKey: '', instance: null };
    }
    return { url: instance.url, apiKey: instance.apiKey, instance };
};

export const getArrInstanceForLibrary = (config = {}, libraryId = '', mediaType = 'movie') => {
    const arrType = mediaType === 'movie' ? 'radarr' : 'sonarr';
    const libraryKey = String(libraryId || '').trim();
    if (libraryKey) {
        const mapped = getArrInstances(config, { type: arrType, enabledOnly: true })
            .find((entry) => normalizePlexLibraryIds(entry.plexLibraryIds).includes(libraryKey));
        if (mapped) return mapped;
    }
    return getDefaultArrInstance(config, arrType);
};

const lookupEntityInMaps = (item, maps) => {
    if (!maps) return null;
    return (item?.imdbId && maps.byImdb.get(String(item.imdbId)))
        || (item?.tmdbId != null && maps.byTmdb.get(String(item.tmdbId)))
        || (item?.tvdbId != null && maps.byTvdb.get(String(item.tvdbId)))
        || null;
};

const getCandidateArrInstances = (config = {}, item = {}) => {
    const arrType = item.mediaType === 'movie' ? 'radarr' : 'sonarr';
    const libraryKey = String(item.libraryId || '').trim();
    const enabled = getArrInstances(config, { type: arrType, enabledOnly: true });
    const libraryMapped = libraryKey
        ? enabled.filter((entry) => normalizePlexLibraryIds(entry.plexLibraryIds).includes(libraryKey))
        : [];
    const defaultInstance = getDefaultArrInstance(config, arrType);
    const ordered = [];
    const seen = new Set();
    const pushUnique = (entry) => {
        if (!entry || seen.has(entry.id)) return;
        seen.add(entry.id);
        ordered.push(entry);
    };
    libraryMapped.forEach(pushUnique);
    if (defaultInstance) pushUnique(defaultInstance);
    enabled.forEach(pushUnique);
    return { arrType, instances: ordered };
};

export const resolveSonarrSeriesForShow = (showItem, catalog, config = {}) => {
    const idMatch = resolveArrEntity(showItem, catalog, config);
    if (idMatch?.entity?.id && idMatch.type === 'sonarr') {
        return { ...idMatch, matchMethod: 'external_id' };
    }

    const titleKey = String(showItem?.title || '').trim().toLowerCase();
    const year = showItem?.year != null ? Number(showItem.year) : null;
    if (!titleKey || !catalog) {
        return idMatch?.entity
            ? idMatch
            : { type: 'none', entity: null, instanceId: null, instanceName: null, matchMethod: null, ambiguous: false, warning: null, candidates: [] };
    }

    const { instances } = getCandidateArrInstances(config, showItem);
    for (const instance of instances) {
        if (instance.type !== 'sonarr') continue;
        const items = catalog.instances?.[instance.id]?.items || [];
        const candidates = items.filter((entry) => String(entry.title || '').trim().toLowerCase() === titleKey);
        if (!candidates.length) continue;

        let match = candidates[0];
        if (candidates.length > 1) {
            const byYear = year
                ? candidates.find((entry) => Number(entry.year) === year)
                : null;
            if (byYear) match = byYear;
        }

        return {
            type: 'sonarr',
            entity: match,
            instanceId: instance.id,
            instanceName: instance.name || 'Sonarr',
            ambiguous: candidates.length > 1,
            warning: candidates.length > 1
                ? 'Multiple Sonarr series share this title — verify the match.'
                : 'Matched by title in Sonarr (no shared external ID).',
            matchMethod: 'title',
            candidates: [],
        };
    }

    return idMatch?.entity
        ? idMatch
        : { type: 'none', entity: null, instanceId: null, instanceName: null, matchMethod: null, ambiguous: false, warning: null, candidates: [] };
};

export const resolveArrEntity = (item, catalog, config = {}) => {
    const empty = {
        type: 'none',
        entity: null,
        instanceId: null,
        instanceName: null,
        ambiguous: false,
        warning: null,
        candidates: [],
    };
    if (!item || !catalog) return empty;

    const { arrType, instances } = getCandidateArrInstances(config, item);
    const lookupByInstance = catalog.lookupByInstance || {};
    const instancesById = catalog.instances || {};
    const matches = [];

    for (const instance of instances) {
        const maps = lookupByInstance[instance.id];
        const entity = lookupEntityInMaps(item, maps);
        if (entity) {
            matches.push({
                instanceId: instance.id,
                instanceName: instance.name || instancesById[instance.id]?.name || (arrType === 'radarr' ? 'Radarr' : 'Sonarr'),
                entity,
            });
        }
    }

    if (matches.length === 0) {
        const enabledForType = getArrInstances(config, { type: arrType, enabledOnly: true });
        if (enabledForType.length > 1) return empty;

        const fallbackMaps = item.mediaType === 'movie' ? catalog.lookup?.radarr : catalog.lookup?.sonarr;
        const entity = lookupEntityInMaps(item, fallbackMaps);
        if (!entity) return empty;
        const fallbackInstance = getArrInstanceForLibrary(config, item.libraryId, item.mediaType);
        return {
            type: arrType,
            entity,
            instanceId: fallbackInstance?.id || null,
            instanceName: fallbackInstance?.name || (arrType === 'radarr' ? 'Radarr' : 'Sonarr'),
            ambiguous: false,
            warning: fallbackInstance ? null : 'Matched in catalog but no ready instance is configured.',
            candidates: [],
        };
    }

    const primary = matches[0];
    const ambiguous = matches.length > 1;
    const candidateNames = matches.map((entry) => entry.instanceName).filter(Boolean);
    return {
        type: arrType,
        entity: primary.entity,
        instanceId: primary.instanceId,
        instanceName: primary.instanceName,
        ambiguous,
        warning: ambiguous
            ? `Title exists in multiple ${arrType === 'radarr' ? 'Radarr' : 'Sonarr'} instances (${candidateNames.join(', ')}). Using ${primary.instanceName}.`
            : null,
        candidates: matches.map((entry) => ({
            instanceId: entry.instanceId,
            instanceName: entry.instanceName,
        })),
    };
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
            plexLibraryIds: raw?.plexLibraryIds ?? existing?.plexLibraryIds ?? [],
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
        plexLibraryIds: normalizePlexLibraryIds(entry.plexLibraryIds),
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
    method = 'GET',
    body = null,
} = {}) => {
    if (!isArrInstanceReady(instance)) return null;
    try {
        const safeBaseUrl = resolveUrl(instance.url);
        const base = safeBaseUrl.endsWith('/') ? safeBaseUrl.slice(0, -1) : safeBaseUrl;
        const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        const response = await fetchImpl(`${base}${path}`, {
            method,
            headers: {
                'X-Api-Key': instance.apiKey,
                Accept: 'application/json',
                ...(body != null ? { 'Content-Type': 'application/json' } : {}),
                ...headers,
            },
            ...(body != null ? { body: JSON.stringify(body) } : {}),
        });
        if (!response.ok) return { ok: false, status: response.status, data: null };
        const contentType = response.headers.get('content-type') || '';
        const data = contentType.includes('application/json') ? await response.json() : null;
        return { ok: true, status: response.status, data };
    } catch {
        return { ok: false, status: 0, data: null };
    }
};

/** @deprecated use fetchArrInstance return shape — kept for existing GET callers */
export const fetchArrInstanceJson = async (instance, endpoint, options = {}) => {
    const result = await fetchArrInstance(instance, endpoint, options);
    return result?.ok ? result.data : null;
};

export const buildArrLookupMapsForItems = (items = []) => {
    const maps = { byImdb: new Map(), byTmdb: new Map(), byTvdb: new Map() };
    const addEntry = (entry) => {
        const imdb = entry?.imdbId ? String(entry.imdbId) : null;
        const tmdb = entry?.tmdbId != null ? String(entry.tmdbId) : null;
        const tvdb = entry?.tvdbId != null ? String(entry.tvdbId) : null;
        if (imdb) maps.byImdb.set(imdb, entry);
        if (tmdb) maps.byTmdb.set(tmdb, entry);
        if (tvdb) maps.byTvdb.set(tvdb, entry);
    };
    (Array.isArray(items) ? items : []).forEach(addEntry);
    return maps;
};

export const getArrInstanceCounts = (config = {}) => {
    const sonarrInstances = getArrInstances(config, { type: 'sonarr' });
    const radarrInstances = getArrInstances(config, { type: 'radarr' });
    const countReady = (instances) => instances.filter(isArrInstanceReady).length;
    return {
        sonarr: {
            total: sonarrInstances.length,
            enabled: sonarrInstances.filter((entry) => entry.enabled !== false).length,
            ready: countReady(sonarrInstances),
        },
        radarr: {
            total: radarrInstances.length,
            enabled: radarrInstances.filter((entry) => entry.enabled !== false).length,
            ready: countReady(radarrInstances),
        },
    };
};

export const fetchArrInstanceCatalogItems = async (instance, { resolveUrl = (url) => url, fetchImpl = fetch } = {}) => {
    if (!isArrInstanceReady(instance)) return [];
    const endpoint = instance.type === 'radarr' ? '/api/v3/movie' : '/api/v3/series';
    const payload = await fetchArrInstanceJson(instance, endpoint, { resolveUrl, fetchImpl });
    return Array.isArray(payload) ? payload : [];
};

export const fetchArrQualityProfiles = async (instance, { resolveUrl = (url) => url, fetchImpl = fetch } = {}) => {
    const payload = await fetchArrInstanceJson(instance, '/api/v3/qualityprofile', { resolveUrl, fetchImpl });
    if (!Array.isArray(payload)) return [];
    return payload.map((entry) => ({
        id: Number(entry.id),
        name: String(entry.name || `Profile ${entry.id}`),
    })).filter((entry) => Number.isFinite(entry.id));
};

export const updateArrEntityQualityProfile = async (instance, entity, type, qualityProfileId, { resolveUrl = (url) => url, fetchImpl = fetch } = {}) => {
    if (!entity?.id || !qualityProfileId) return { ok: false, reason: 'Missing entity or quality profile' };
    const arrType = type === 'radarr' ? 'radarr' : 'sonarr';
    const endpoint = arrType === 'radarr' ? `/api/v3/movie/${entity.id}` : `/api/v3/series/${entity.id}`;
    const result = await fetchArrInstance(instance, endpoint, {
        resolveUrl,
        fetchImpl,
        method: 'PUT',
        body: { ...entity, qualityProfileId: Number(qualityProfileId) },
    });
    if (!result?.ok) return { ok: false, reason: `Quality profile update failed (${result?.status || 'unknown'})` };
    return { ok: true, entity: result.data || { ...entity, qualityProfileId: Number(qualityProfileId) } };
};

export const triggerArrEntitySearch = async (instance, entity, type, { resolveUrl = (url) => url, fetchImpl = fetch } = {}) => {
    if (!entity?.id) return { ok: false, reason: 'Missing ARR entity id' };
    const arrType = type === 'radarr' ? 'radarr' : 'sonarr';
    const command = arrType === 'radarr'
        ? { name: 'MoviesSearch', movieIds: [entity.id] }
        : { name: 'SeriesSearch', seriesId: entity.id };
    const result = await fetchArrInstance(instance, '/api/v3/command', {
        resolveUrl,
        fetchImpl,
        method: 'POST',
        body: command,
    });
    if (!result?.ok) return { ok: false, reason: `Search command failed (${result?.status || 'unknown'})` };
    return { ok: true, commandId: result.data?.id || null };
};

export const fetchSonarrEpisodesForSeries = async (instance, seriesId, { resolveUrl = (url) => url, fetchImpl = fetch } = {}) => {
    const id = Number(seriesId || 0);
    if (!id) return [];
    const payload = await fetchArrInstanceJson(instance, `/api/v3/episode?seriesId=${id}`, { resolveUrl, fetchImpl });
    return Array.isArray(payload) ? payload : [];
};

export const fetchSonarrEpisodeFilesForSeries = async (instance, seriesId, { resolveUrl = (url) => url, fetchImpl = fetch } = {}) => {
    const id = Number(seriesId || 0);
    if (!id) return [];
    const payload = await fetchArrInstanceJson(instance, `/api/v3/episodefile?seriesId=${id}`, { resolveUrl, fetchImpl });
    return Array.isArray(payload) ? payload : [];
};

const sonarrSeriesIdsLikelyWithFiles = (seriesList = []) => {
    const withStats = (Array.isArray(seriesList) ? seriesList : [])
        .filter((series) => {
            const stats = series?.statistics || {};
            return Number(stats.episodeFileCount || 0) > 0 || Number(stats.sizeOnDisk || 0) > 0;
        })
        .map((series) => Number(series.id))
        .filter((id) => id > 0);
    if (withStats.length) return withStats;
    return (Array.isArray(seriesList) ? seriesList : [])
        .map((series) => Number(series.id))
        .filter((id) => id > 0);
};

const runConcurrentTasks = async (items = [], concurrency = 16, worker = async () => null) => {
    const list = Array.isArray(items) ? items : [];
    if (!list.length) return [];
    const limit = Math.max(1, Math.min(Number(concurrency) || 16, list.length));
    const results = new Array(list.length);
    let cursor = 0;
    const runners = Array.from({ length: limit }, async () => {
        while (cursor < list.length) {
            const index = cursor;
            cursor += 1;
            results[index] = await worker(list[index], index);
        }
    });
    await Promise.all(runners);
    return results;
};

export const fetchSonarrAllEpisodeFiles = async (instance, {
    resolveUrl = (url) => url,
    fetchImpl = fetch,
    seriesList = [],
    concurrency = 24,
} = {}) => {
    const bulkResult = await fetchArrInstance(instance, '/api/v3/episodefile', { resolveUrl, fetchImpl });
    if (bulkResult?.ok && Array.isArray(bulkResult.data) && bulkResult.data.length > 0) {
        return bulkResult.data;
    }

    const seriesIds = sonarrSeriesIdsLikelyWithFiles(seriesList);
    if (!seriesIds.length) return [];

    const perSeriesResults = await runConcurrentTasks(seriesIds, concurrency, async (seriesId) => (
        fetchSonarrEpisodeFilesForSeries(instance, seriesId, { resolveUrl, fetchImpl })
    ));
    return perSeriesResults.flat();
};

export const fetchSonarrAllEpisodes = async (instance, { resolveUrl = (url) => url, fetchImpl = fetch } = {}) => {
    const payload = await fetchArrInstanceJson(instance, '/api/v3/episode', { resolveUrl, fetchImpl });
    return Array.isArray(payload) ? payload : [];
};

export const fetchSonarrSeriesById = async (instance, seriesId, { resolveUrl = (url) => url, fetchImpl = fetch } = {}) => {
    const id = Number(seriesId || 0);
    if (!id) return null;
    return fetchArrInstanceJson(instance, `/api/v3/series/${id}`, { resolveUrl, fetchImpl });
};

export const triggerSonarrEpisodeSearch = async (instance, episodeIds = [], { resolveUrl = (url) => url, fetchImpl = fetch } = {}) => {
    const ids = (Array.isArray(episodeIds) ? episodeIds : []).map(Number).filter((id) => id > 0);
    if (!ids.length) return { ok: false, reason: 'No episode ids provided' };
    const result = await fetchArrInstance(instance, '/api/v3/command', {
        resolveUrl,
        fetchImpl,
        method: 'POST',
        body: { name: 'EpisodeSearch', episodeIds: ids },
    });
    if (!result?.ok) return { ok: false, reason: `Episode search failed (${result?.status || 'unknown'})` };
    return { ok: true, commandId: result.data?.id || null };
};

export const fetchArrQueueSummary = async (instance, { resolveUrl = (url) => url, fetchImpl = fetch } = {}) => {
    const payload = await fetchArrInstanceJson(instance, '/api/v3/queue', { resolveUrl, fetchImpl });
    if (!payload) return { total: 0, records: [] };
    const records = Array.isArray(payload?.records) ? payload.records : (Array.isArray(payload) ? payload : []);
    const total = Number(payload?.totalRecords ?? records.length ?? 0);
    return { total, records };
};

const slugifyArrTitle = (title = '') => String(title || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const buildArrDeepUrl = (instance, entity, type = null) => {
    if (!instance?.url || !entity) return null;
    const base = String(instance.url || '').replace(/\/+$/, '');
    const arrType = type || instance.type;
    if (arrType === 'radarr') {
        const tmdbId = entity.tmdbId ?? entity.foreignId;
        if (tmdbId == null) return null;
        return `${base}/movie/${tmdbId}`;
    }
    if (arrType === 'sonarr') {
        const slug = entity.titleSlug || slugifyArrTitle(entity.title);
        if (!slug) return null;
        return `${base}/series/${slug}`;
    }
    return null;
};
