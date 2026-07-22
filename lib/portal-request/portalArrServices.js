/**
 * Portal *arr service listings for request routing (Phase 6).
 * Emits Seerr-shaped server / options DTOs from portal Arr instances.
 */

import {
    fetchArrLanguageProfiles,
    fetchArrQualityProfiles,
    fetchArrRootFolders,
    fetchArrTags,
    getArrInstance,
    getArrInstances,
    getDefaultArrInstance,
    isArrInstanceReady,
} from '../arr-service.js';

const SERVICE_OPTIONS_CACHE_MS = 60 * 1000;
const serviceOptionsCache = new Map();

const arrTypeForMedia = (type) => {
    const normalized = String(type || '').toLowerCase();
    if (normalized === 'movie' || normalized === 'radarr') return 'radarr';
    return 'sonarr';
};

/** Prefer explicit instance.is4k; otherwise infer from name (e.g. "Sonarr 4K"). */
export const inferArrInstanceIs4k = (instance) => {
    if (instance?.is4k === true) return true;
    if (instance?.is4k === false) return false;
    const name = String(instance?.name || '').toLowerCase();
    return /\b(4k|uhd|2160p?)\b/i.test(name);
};

const readyInstancesForType = (config, type) => (
    getArrInstances(config, { type: arrTypeForMedia(type), enabledOnly: true })
        .filter((entry) => isArrInstanceReady(entry))
);

/** Stable 1-based numeric server id for UI selects (maps to instance list order). */
export const listPortalArrServers = (config, type) => {
    const instances = readyInstancesForType(config, type);
    return instances.map((instance, index) => ({
        id: index + 1,
        name: instance.name || (arrTypeForMedia(type) === 'radarr' ? 'Radarr' : 'Sonarr'),
        is4k: inferArrInstanceIs4k(instance),
        isDefault: !!instance.isDefault,
        instanceId: instance.id,
    }));
};

export const resolvePortalArrInstance = (config, type, serverId = null, arrInstanceId = null) => {
    const arrType = arrTypeForMedia(type);
    const instances = readyInstancesForType(config, type);

    if (arrInstanceId) {
        const byId = getArrInstance(config, arrInstanceId);
        if (byId && byId.type === arrType && isArrInstanceReady(byId)) return byId;
    }

    const key = String(serverId ?? '').trim();
    if (key) {
        const byUuid = instances.find((entry) => entry.id === key);
        if (byUuid) return byUuid;

        const numeric = Number(key);
        if (Number.isFinite(numeric) && numeric >= 1 && numeric <= instances.length) {
            return instances[numeric - 1];
        }
    }

    return getDefaultArrInstance(config, arrType) || instances[0] || null;
};

export const getPortalArrServiceOptions = async (config, type, serverId, {
    resolveUrl = (url) => url,
    fetchImpl = fetch,
    arrInstanceId = null,
    timeoutMs = 8000,
} = {}) => {
    const instance = resolvePortalArrInstance(config, type, serverId, arrInstanceId);
    if (!instance) {
        const err = new Error(`No ${arrTypeForMedia(type) === 'radarr' ? 'Radarr' : 'Sonarr'} instance is configured.`);
        err.status = 400;
        throw err;
    }

    const cacheKey = `${arrTypeForMedia(type)}:${instance.id}`;
    const cached = serviceOptionsCache.get(cacheKey);
    if (cached && Date.now() - cached.at < SERVICE_OPTIONS_CACHE_MS) {
        return cached.value;
    }

    const servers = listPortalArrServers(config, type);
    const serverMeta = servers.find((entry) => entry.instanceId === instance.id)
        || servers[0]
        || { id: 1, name: instance.name, is4k: false, isDefault: true, instanceId: instance.id };

    const fetchOpts = { resolveUrl, fetchImpl, timeoutMs };
    const [profiles, rootFolders, languageProfiles, tags] = await Promise.all([
        fetchArrQualityProfiles(instance, fetchOpts),
        fetchArrRootFolders(instance, fetchOpts),
        arrTypeForMedia(type) === 'sonarr'
            ? fetchArrLanguageProfiles(instance, fetchOpts).catch(() => [])
            : Promise.resolve([]),
        fetchArrTags(instance, fetchOpts),
    ]);

    const value = {
        server: {
            id: serverMeta.id,
            name: serverMeta.name,
            is4k: !!serverMeta.is4k,
            isDefault: !!serverMeta.isDefault,
            activeProfileId: profiles[0]?.id ?? null,
            activeDirectory: rootFolders[0]?.path || null,
            activeLanguageProfileId: languageProfiles[0]?.id ?? null,
            activeAnimeProfileId: null,
            activeAnimeDirectory: null,
            activeAnimeLanguageProfileId: null,
            instanceId: instance.id,
        },
        profiles,
        rootFolders,
        languageProfiles,
        tags,
        instanceId: instance.id,
    };
    serviceOptionsCache.set(cacheKey, { at: Date.now(), value });
    return value;
};

export default {
    listPortalArrServers,
    resolvePortalArrInstance,
    getPortalArrServiceOptions,
    inferArrInstanceIs4k,
};
