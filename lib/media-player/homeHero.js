/**
 * Media Player Home hero: TMDB trending-of-the-week slideshow (up to 5),
 * matched to Plex library titles. Cached for 24 hours when populated.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
const EMPTY_CACHE_MS = 5 * 60 * 1000;
const HERO_LIMIT = 5;
const TRENDING_SCAN = 24;

/** @type {{ key: string, expiresAt: number, payload: object } | null} */
let heroCache = null;

const tmdbImg = (path, size = 'w1280') => {
    const raw = String(path || '').trim();
    if (!raw) return '';
    if (/^https?:\/\//i.test(raw)) return raw;
    const normalized = raw.startsWith('/') ? raw : `/${raw}`;
    return `https://image.tmdb.org/t/p/${size}${normalized}`;
};

const guidCandidatesFor = (tmdbId) => {
    const id = Number(tmdbId);
    if (!Number.isFinite(id) || id <= 0) return [];
    return [
        `tmdb://${id}`,
        `com.plexapp.agents.themoviedb://${id}?lang=en`,
        `tmdb://${id}?lang=en`,
        `com.plexapp.agents.themoviedb://${id}`,
    ];
};

const metaMatchesTmdb = (meta, tmdbId) => {
    const needle = String(tmdbId);
    if (!needle || !meta) return false;
    const guidBlob = [
        meta.guid,
        meta.grandparentGuid,
        ...(Array.isArray(meta.Guid) ? meta.Guid.map((g) => g?.id || g) : []),
    ].map((v) => String(v || '')).join(' ').toLowerCase();
    return guidBlob.includes(`tmdb://${needle}`)
        || guidBlob.includes(`themoviedb://${needle}`)
        || guidBlob.includes(`tmdb:${needle}`);
};

const normalizeTitle = (value) => String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const titlesClose = (a, b) => {
    const left = normalizeTitle(a);
    const right = normalizeTitle(b);
    if (!left || !right) return false;
    return left === right || left.includes(right) || right.includes(left);
};

const metadataList = (payload) => {
    const list = payload?.MediaContainer?.Metadata;
    if (Array.isArray(list)) return list;
    if (list && typeof list === 'object') return [list];
    return [];
};

export const isMediaPlayerHomeHeroEnabled = (config = {}) => (
    config.mediaPlayerHomeHeroEnabled !== false
);

export const clearMediaPlayerHomeHeroCache = () => {
    heroCache = null;
};

const fetchTmdbTrendingWeek = async (fetchImpl, apiKey) => {
    const key = String(apiKey || '').trim();
    if (!key || key === '********' || /^•+$/.test(key)) return [];
    const res = await fetchImpl(
        `https://api.themoviedb.org/3/trending/all/week?api_key=${encodeURIComponent(key)}&page=1`,
    ).catch(() => null);
    if (!res?.ok) return [];
    const json = await res.json().catch(() => null);
    const rows = Array.isArray(json?.results) ? json.results : [];
    return rows
        .map((row) => {
            const mediaType = row?.media_type === 'tv' ? 'show' : row?.media_type === 'movie' ? 'movie' : '';
            const tmdbId = Number(row?.id);
            const title = String(row?.title || row?.name || '').trim();
            const backdropPath = String(row?.backdrop_path || '').trim();
            if (!mediaType || !Number.isFinite(tmdbId) || tmdbId <= 0 || !title || !backdropPath) return null;
            return {
                tmdbId,
                mediaType,
                title,
                overview: String(row?.overview || '').trim(),
                year: String(row?.release_date || row?.first_air_date || '').slice(0, 4) || null,
                backdropUrl: tmdbImg(backdropPath, 'w1280'),
                posterUrl: tmdbImg(row?.poster_path, 'w500'),
            };
        })
        .filter(Boolean)
        .slice(0, TRENDING_SCAN);
};

const plexGet = async (plexJson, fetchImpl, url, headers) => (
    plexJson(fetchImpl, url, headers, { timeoutMs: 8000 }).catch(() => null)
);

const findPlexByGuid = async ({
    fetchImpl,
    plexJson,
    uri,
    token,
    headers,
    tmdbId,
    mediaType,
    sections,
}) => {
    const plexType = mediaType === 'movie' ? 1 : 2;
    const guids = guidCandidatesFor(tmdbId);
    const wantedType = mediaType === 'movie' ? 'movie' : 'show';

    for (const guid of guids) {
        const data = await plexGet(
            plexJson,
            fetchImpl,
            `${uri}/library/all?type=${plexType}&guid=${encodeURIComponent(guid)}&includeGuids=1&X-Plex-Token=${encodeURIComponent(token)}`,
            headers,
        );
        const meta = metadataList(data)[0];
        if (meta?.ratingKey) return meta;
    }

    for (const section of sections) {
        if (String(section?.type || '') !== wantedType) continue;
        for (const guid of guids) {
            const data = await plexGet(
                plexJson,
                fetchImpl,
                `${uri}/library/sections/${encodeURIComponent(section.key)}/all?type=${plexType}&guid=${encodeURIComponent(guid)}&includeGuids=1&X-Plex-Token=${encodeURIComponent(token)}`,
                headers,
            );
            const meta = metadataList(data)[0];
            if (meta?.ratingKey) return meta;
        }
    }
    return null;
};

const findPlexByTitleSearch = async ({
    fetchImpl,
    plexJson,
    uri,
    token,
    headers,
    title,
    mediaType,
    tmdbId,
    year,
}) => {
    const data = await plexGet(
        plexJson,
        fetchImpl,
        `${uri}/hubs/search?query=${encodeURIComponent(title)}&limit=24&includeGuids=1&X-Plex-Token=${encodeURIComponent(token)}`,
        headers,
    );
    const wanted = mediaType === 'movie' ? 'movie' : 'show';
    const yearNum = year ? Number(year) : null;
    let fallback = null;
    for (const hub of [].concat(data?.MediaContainer?.Hub || [])) {
        for (const meta of metadataList({ MediaContainer: { Metadata: hub.Metadata } })) {
            if (String(meta?.type || '') !== wanted) continue;
            if (!meta?.ratingKey) continue;
            if (metaMatchesTmdb(meta, tmdbId)) return meta;
            if (!titlesClose(meta.title || meta.grandparentTitle, title)) continue;
            if (yearNum && Number(meta.year) && Math.abs(Number(meta.year) - yearNum) > 1) continue;
            if (!fallback) fallback = meta;
        }
    }
    return fallback;
};

const findPlexForTrending = async (opts) => {
    const byGuid = await findPlexByGuid(opts);
    if (byGuid?.ratingKey) return byGuid;
    return findPlexByTitleSearch(opts);
};

const toHeroItem = (meta, row, mapPlayerItem, config) => {
    const mapped = mapPlayerItem(meta, config);
    const ratingKey = String(mapped?.ratingKey || meta.ratingKey || '').trim();
    if (!ratingKey) return null;
    return {
        ratingKey,
        title: mapped?.title || row.title,
        type: mapped?.type || row.mediaType,
        year: mapped?.year || (row.year ? Number(row.year) : null),
        summary: mapped?.summary || row.overview,
        thumb: mapped?.thumb || null,
        art: mapped?.art || null,
        backdropUrl: row.backdropUrl,
        posterUrl: row.posterUrl || null,
        tmdbId: row.tmdbId,
        canPlay: mapped?.canPlay !== false,
    };
};

/**
 * Build hero slides: TMDB trending week ∩ Plex library (up to 5).
 * @returns {{ enabled: boolean, refreshedAt: number | null, expiresAt: number | null, items: object[], reason?: string }}
 */
export const buildMediaPlayerHomeHero = async ({
    config,
    uri,
    token,
    headers,
    fetchImpl = fetch,
    plexJson,
    mapPlayerItem,
    force = false,
} = {}) => {
    if (!isMediaPlayerHomeHeroEnabled(config)) {
        return { enabled: false, refreshedAt: null, expiresAt: null, items: [], reason: 'disabled' };
    }

    const cacheKey = [
        String(config?.serverIdentifier || ''),
        String(config?.tmdbApiKey || '').slice(0, 8),
        Math.floor(Date.now() / DAY_MS),
    ].join('|');

    if (!force && heroCache && heroCache.key === cacheKey && heroCache.expiresAt > Date.now()) {
        return heroCache.payload;
    }

    const apiKey = String(config?.tmdbApiKey || '').trim();
    if (!apiKey || apiKey === '********') {
        const payload = {
            enabled: true,
            refreshedAt: Date.now(),
            expiresAt: Date.now() + EMPTY_CACHE_MS,
            items: [],
            reason: 'missing-tmdb-key',
        };
        heroCache = { key: cacheKey, expiresAt: payload.expiresAt, payload };
        return payload;
    }

    const trending = await fetchTmdbTrendingWeek(fetchImpl, apiKey);
    if (!trending.length) {
        const payload = {
            enabled: true,
            refreshedAt: Date.now(),
            expiresAt: Date.now() + EMPTY_CACHE_MS,
            items: [],
            reason: 'tmdb-empty',
        };
        heroCache = { key: cacheKey, expiresAt: payload.expiresAt, payload };
        return payload;
    }

    const sectionsRes = await plexGet(
        plexJson,
        fetchImpl,
        `${uri}/library/sections?X-Plex-Token=${encodeURIComponent(token)}`,
        headers,
    );
    const sections = [].concat(sectionsRes?.MediaContainer?.Directory || [])
        .filter((dir) => dir?.type === 'movie' || dir?.type === 'show');

    const items = [];
    const seenKeys = new Set();

    for (const row of trending) {
        if (items.length >= HERO_LIMIT) break;
        const meta = await findPlexForTrending({
            fetchImpl,
            plexJson,
            uri,
            token,
            headers,
            tmdbId: row.tmdbId,
            mediaType: row.mediaType,
            title: row.title,
            year: row.year,
            sections,
        });
        if (!meta?.ratingKey) continue;
        const item = toHeroItem(meta, row, mapPlayerItem, config);
        if (!item || seenKeys.has(item.ratingKey)) continue;
        seenKeys.add(item.ratingKey);
        items.push(item);
    }

    const now = Date.now();
    const payload = {
        enabled: true,
        refreshedAt: now,
        expiresAt: now + (items.length ? DAY_MS : EMPTY_CACHE_MS),
        items,
        reason: items.length ? 'ok' : 'no-library-matches',
    };
    heroCache = { key: cacheKey, expiresAt: payload.expiresAt, payload };
    return payload;
};
