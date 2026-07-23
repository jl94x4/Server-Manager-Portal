/**
 * File-backed discovery availability cache (library badges for Discover browse).
 * Rebuilt by a background task from Sonarr/Radarr catalogs; pending requests stay per-user.
 */

const CACHE_VERSION = 1;

/** Match Sonarr title keys written during the 12h availability snapshot. */
const normalizeTitleKey = (title = '', year = null) => {
    const cleaned = String(title || '')
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/['\u2018\u2019\u0060]/g, '')
        .replace(/&/g, ' and ')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()
        .replace(/\s+/g, ' ');
    const y = Number(year);
    return Number.isFinite(y) && y > 1900 ? `${cleaned}|${y}` : cleaned;
};

export const emptyDiscoveryAvailabilityCache = () => ({
    version: CACHE_VERSION,
    generatedAt: null,
    itemCount: 0,
    movieCount: 0,
    tvCount: 0,
    byKey: {},
});

export const normalizeDiscoveryAvailabilityCache = (raw = null) => {
    const base = emptyDiscoveryAvailabilityCache();
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return base;
    const byKey = raw.byKey && typeof raw.byKey === 'object' && !Array.isArray(raw.byKey)
        ? raw.byKey
        : {};
    return {
        version: Number(raw.version) || CACHE_VERSION,
        generatedAt: raw.generatedAt ? String(raw.generatedAt) : null,
        itemCount: Number(raw.itemCount) || Object.keys(byKey).length,
        movieCount: Number(raw.movieCount) || 0,
        tvCount: Number(raw.tvCount) || 0,
        byKey,
    };
};

export const availabilityCacheKey = (mediaType, tmdbId) => {
    const type = mediaType === 'tv' ? 'tv' : (mediaType === 'movie' ? 'movie' : null);
    const id = Number(tmdbId);
    if (!type || !Number.isFinite(id) || id <= 0) return null;
    return `${type}:${id}`;
};

export const lookupDiscoveryAvailability = (cache, mediaType, tmdbId) => {
    const key = availabilityCacheKey(mediaType, tmdbId);
    if (!key) return null;
    const entry = cache?.byKey?.[key];
    return entry && typeof entry === 'object' ? entry : null;
};

const resolveItemMediaType = (item = {}) => {
    const raw = item?.mediaType ?? item?.media?.mediaType ?? item?.type;
    if (raw === 'movie' || raw === 1 || raw === '1') return 'movie';
    if (raw === 'tv' || raw === 2 || raw === '2') return 'tv';
    if (item?.firstAirDate && !item?.releaseDate) return 'tv';
    if (item?.releaseDate && !item?.firstAirDate) return 'movie';
    return null;
};

const resolveItemTmdbId = (item = {}) => {
    const id = Number(item?.tmdbId ?? item?.id);
    return Number.isFinite(id) && id > 0 ? id : null;
};

/** Merge shared library cache onto a discover list item. */
export const mergeAvailabilityEntryOntoItem = (item, entry) => {
    if (!item || !entry?.mediaInfo) return item;
    return {
        ...item,
        mediaInfo: {
            ...(item.mediaInfo || {}),
            ...entry.mediaInfo,
        },
        ...(entry.sonarrLibraryStatus ? { sonarrLibraryStatus: entry.sonarrLibraryStatus } : {}),
        ...(entry.radarrLibraryStatus ? { radarrLibraryStatus: entry.radarrLibraryStatus } : {}),
    };
};

export const applyDiscoveryAvailabilityCacheToItems = (items, cache) => {
    if (!Array.isArray(items) || !items.length) return items;
    const byKey = cache?.byKey;
    if (!byKey || typeof byKey !== 'object') return items;
    return items.map((item) => {
        const mediaType = resolveItemMediaType(item);
        const tmdbId = resolveItemTmdbId(item);
        let entry = (mediaType && tmdbId) ? byKey[`${mediaType}:${tmdbId}`] : null;
        // Sonarr often lacked tmdbId at scan time — fall back to normalized title keys.
        if (!entry && mediaType === 'tv') {
            const title = item?.name || item?.title || item?.originalName || '';
            const year = Number(String(item?.firstAirDate || '').slice(0, 4)) || null;
            const withYear = normalizeTitleKey(title, year);
            const noYear = normalizeTitleKey(title, null);
            entry = (withYear && byKey[`tvTitle:${withYear}`])
                || (noYear && byKey[`tvTitle:${noYear}`])
                || null;
        }
        if (!entry && mediaType === 'movie') {
            const title = item?.title || item?.originalTitle || '';
            const year = Number(String(item?.releaseDate || '').slice(0, 4)) || null;
            const withYear = normalizeTitleKey(title, year);
            entry = (withYear && byKey[`movieTitle:${withYear}`]) || null;
        }
        return entry ? mergeAvailabilityEntryOntoItem(item, entry) : item;
    });
};

/** Apply cache to common discovery JSON shapes (results / mediaInfo lists / detail objects). */
export const applyDiscoveryAvailabilityCacheToPayload = (data, cache) => {
    if (!data || typeof data !== 'object') return data;
    if (Array.isArray(data.results)) {
        return { ...data, results: applyDiscoveryAvailabilityCacheToItems(data.results, cache) };
    }
    if (Array.isArray(data)) {
        return applyDiscoveryAvailabilityCacheToItems(data, cache);
    }
    // Movie / TV detail payloads are a single object with id + mediaType.
    const mediaType = resolveItemMediaType(data);
    const tmdbId = resolveItemTmdbId(data);
    if (mediaType && tmdbId) {
        const entry = lookupDiscoveryAvailability(cache, mediaType, tmdbId);
        return entry ? mergeAvailabilityEntryOntoItem(data, entry) : data;
    }
    return data;
};

/**
 * Rebuild the on-disk cache from live *arr catalogs.
 * @returns {{ itemCount: number, movieCount: number, tvCount: number, generatedAt: string }}
 */
export const rebuildDiscoveryAvailabilityCache = async ({
    config,
    createLibraryAvailability,
    saveFile,
    cachePath,
}) => {
    const library = createLibraryAvailability(config, { warmOnCreate: true });
    const snapshot = await library.snapshotLibraryStatuses();
    const payload = {
        version: CACHE_VERSION,
        generatedAt: new Date().toISOString(),
        itemCount: snapshot.itemCount,
        movieCount: snapshot.movieCount,
        tvCount: snapshot.tvCount,
        byKey: snapshot.byKey,
    };
    await saveFile(cachePath, payload);
    return {
        itemCount: payload.itemCount,
        movieCount: payload.movieCount,
        tvCount: payload.tvCount,
        generatedAt: payload.generatedAt,
    };
};

export default {
    emptyDiscoveryAvailabilityCache,
    normalizeDiscoveryAvailabilityCache,
    availabilityCacheKey,
    lookupDiscoveryAvailability,
    mergeAvailabilityEntryOntoItem,
    applyDiscoveryAvailabilityCacheToItems,
    applyDiscoveryAvailabilityCacheToPayload,
    rebuildDiscoveryAvailabilityCache,
};
