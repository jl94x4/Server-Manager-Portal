/**
 * Media Player Home hero: TMDB trending-of-the-week slideshow (up to 5),
 * matched to Plex library titles. Cached for 24 hours.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
const HERO_LIMIT = 5;
const TRENDING_SCAN = 20;

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
    ];
};

const metaMatchesTmdb = (meta, tmdbId) => {
    const needle = String(tmdbId);
    if (!needle || !meta) return false;
    const guidBlob = [
        meta.guid,
        ...(Array.isArray(meta.Guid) ? meta.Guid.map((g) => g?.id || g) : []),
    ].map((v) => String(v || '')).join(' ').toLowerCase();
    return guidBlob.includes(`tmdb://${needle}`)
        || guidBlob.includes(`themoviedb://${needle}`)
        || guidBlob.includes(`tmdb:${needle}`);
};

export const isMediaPlayerHomeHeroEnabled = (config = {}) => (
    config.mediaPlayerHomeHeroEnabled !== false
);

export const clearMediaPlayerHomeHeroCache = () => {
    heroCache = null;
};

const fetchTmdbTrendingWeek = async (fetchImpl, apiKey) => {
    const key = String(apiKey || '').trim();
    if (!key) return [];
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

const findPlexByTmdb = async ({
    fetchImpl,
    plexJson,
    uri,
    token,
    headers,
    tmdbId,
    mediaType,
}) => {
    const plexType = mediaType === 'movie' ? 1 : 2;
    const guids = guidCandidatesFor(tmdbId);
    for (const guid of guids) {
        const data = await plexJson(
            fetchImpl,
            `${uri}/library/all?type=${plexType}&guid=${encodeURIComponent(guid)}&includeGuids=1&X-Plex-Token=${encodeURIComponent(token)}`,
            headers,
            { timeoutMs: 6000 },
        ).catch(() => null);
        const meta = data?.MediaContainer?.Metadata?.[0];
        if (meta?.ratingKey && metaMatchesTmdb(meta, tmdbId)) return meta;
        if (meta?.ratingKey) return meta;
    }
    return null;
};

/**
 * Build hero slides: TMDB trending week ∩ Plex library (up to 5).
 * @returns {{ enabled: boolean, refreshedAt: number | null, expiresAt: number | null, items: object[] }}
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
        return { enabled: false, refreshedAt: null, expiresAt: null, items: [] };
    }

    const cacheKey = [
        String(config?.serverIdentifier || ''),
        String(config?.tmdbApiKey || '').slice(0, 8),
        Math.floor(Date.now() / DAY_MS),
    ].join('|');

    if (!force && heroCache && heroCache.key === cacheKey && heroCache.expiresAt > Date.now()) {
        return heroCache.payload;
    }

    const trending = await fetchTmdbTrendingWeek(fetchImpl, config?.tmdbApiKey);
    const items = [];
    const seenKeys = new Set();

    for (const row of trending) {
        if (items.length >= HERO_LIMIT) break;
        const meta = await findPlexByTmdb({
            fetchImpl,
            plexJson,
            uri,
            token,
            headers,
            tmdbId: row.tmdbId,
            mediaType: row.mediaType,
        });
        if (!meta?.ratingKey) continue;
        const mapped = mapPlayerItem(meta, config);
        const ratingKey = String(mapped?.ratingKey || meta.ratingKey);
        if (!ratingKey || seenKeys.has(ratingKey)) continue;
        seenKeys.add(ratingKey);
        items.push({
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
        });
    }

    const now = Date.now();
    const payload = {
        enabled: true,
        refreshedAt: now,
        expiresAt: now + DAY_MS,
        items,
    };
    heroCache = { key: cacheKey, expiresAt: payload.expiresAt, payload };
    return payload;
};
