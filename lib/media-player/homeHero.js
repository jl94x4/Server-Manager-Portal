/**
 * Media Player Home hero modes: trending week, seasonal themes, continue watching,
 * and library-driven catalogs. Cached when populated (keyed by effective mode).
 */

const DAY_MS = 24 * 60 * 60 * 1000;
const EMPTY_CACHE_MS = 5 * 60 * 1000;
const HERO_LIMIT = 15;
const TRENDING_SCAN = 40;
const SEASONAL_SCAN = 40;

/** @type {{ key: string, expiresAt: number, payload: object } | null} */
let heroCache = null;

export const MEDIA_PLAYER_HOME_HERO_MODES = [
    'off',
    'trending_week',
    'continue_watching',
    'seasonal_halloween',
    'seasonal_christmas',
    'seasonal_nye',
    'seasonal_easter',
    'seasonal_thanksgiving',
    'recently_added',
    'most_watched',
    'unwatched_picks',
    'new_releases',
    'random_spotlight',
];

const MODE_SET = new Set(MEDIA_PLAYER_HOME_HERO_MODES);

const SEASONAL_MODES = new Set([
    'seasonal_halloween',
    'seasonal_christmas',
    'seasonal_nye',
    'seasonal_easter',
    'seasonal_thanksgiving',
]);

const SEASONAL_QUERIES = {
    seasonal_halloween: ['halloween', 'horror', 'scary movie'],
    seasonal_christmas: ['christmas', 'holiday', 'xmas'],
    seasonal_nye: ['new year', 'new years eve', 'celebration'],
    seasonal_easter: ['easter', 'spring holiday'],
    seasonal_thanksgiving: ['thanksgiving', 'family dinner'],
};

const tmdbImg = (path, size = 'original') => {
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

const directoryList = (payload) => [].concat(payload?.MediaContainer?.Directory || []);

/** Western (Gregorian) Easter Sunday for a given year. */
export const easterSundayUtc = (year) => {
    const y = Math.floor(Number(year));
    const a = y % 19;
    const b = Math.floor(y / 100);
    const c = y % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(Date.UTC(y, month - 1, day));
};

const ymdUtc = (date) => {
    const d = date instanceof Date ? date : new Date(date);
    return {
        y: d.getUTCFullYear(),
        m: d.getUTCMonth() + 1,
        day: d.getUTCDate(),
        time: Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
    };
};

const inInclusiveRange = (now, start, end) => {
    const t = ymdUtc(now).time;
    return t >= start && t <= end;
};

export const isSeasonalHeroMode = (mode) => SEASONAL_MODES.has(String(mode || ''));

export const isSeasonalHeroInWindow = (mode, now = new Date()) => {
    const id = String(mode || '');
    const { y, m, day, time } = ymdUtc(now);
    if (id === 'seasonal_halloween') {
        return m === 10 && day >= 1 && day <= 31;
    }
    if (id === 'seasonal_christmas') {
        const start = Date.UTC(y, 10, 20);
        const end = Date.UTC(y, 11, 26);
        return inInclusiveRange(now, start, end);
    }
    if (id === 'seasonal_nye') {
        if (m === 12 && day >= 28) return true;
        if (m === 1 && day <= 2) return true;
        return false;
    }
    if (id === 'seasonal_thanksgiving') {
        return m === 11 && day >= 15 && day <= 30;
    }
    if (id === 'seasonal_easter') {
        const easter = easterSundayUtc(y);
        const palm = new Date(easter.getTime() - 7 * DAY_MS);
        const monday = new Date(easter.getTime() + 1 * DAY_MS);
        return time >= ymdUtc(palm).time && time <= ymdUtc(monday).time;
    }
    return false;
};

/**
 * Resolve configured mode. Legacy `mediaPlayerHomeHeroEnabled: false` → off.
 */
export const normalizeMediaPlayerHomeHeroMode = (config = {}) => {
    if (config.mediaPlayerHomeHeroEnabled === false && config.mediaPlayerHomeHeroMode == null) {
        return 'off';
    }
    const raw = String(config.mediaPlayerHomeHeroMode || '').trim();
    if (MODE_SET.has(raw)) return raw;
    if (config.mediaPlayerHomeHeroEnabled === false) return 'off';
    return 'trending_week';
};

export const isMediaPlayerHomeHeroEnabled = (config = {}) => (
    normalizeMediaPlayerHomeHeroMode(config) !== 'off'
);

export const resolveEffectiveHeroMode = (config = {}, now = new Date()) => {
    const mode = normalizeMediaPlayerHomeHeroMode(config);
    if (mode === 'off') return 'off';
    const inWindowOnly = config.mediaPlayerHomeHeroSeasonalInWindowOnly === true;
    if (inWindowOnly && isSeasonalHeroMode(mode) && !isSeasonalHeroInWindow(mode, now)) {
        return 'trending_week';
    }
    return mode;
};

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
        .map((row) => mapTmdbListRow(row))
        .filter(Boolean)
        .slice(0, TRENDING_SCAN);
};

const mapTmdbListRow = (row) => {
    const mediaType = row?.media_type === 'tv' || row?.first_air_date
        ? 'show'
        : (row?.media_type === 'movie' || row?.release_date || row?.title ? 'movie' : '');
    const resolvedType = mediaType === 'show' || mediaType === 'movie'
        ? mediaType
        : (row?.media_type === 'tv' ? 'show' : row?.media_type === 'movie' ? 'movie' : '');
    const tmdbId = Number(row?.id);
    const title = String(row?.title || row?.name || '').trim();
    const backdropPath = String(row?.backdrop_path || '').trim();
    if (!resolvedType || !Number.isFinite(tmdbId) || tmdbId <= 0 || !title || !backdropPath) return null;
    return {
        tmdbId,
        mediaType: resolvedType,
        title,
        overview: String(row?.overview || '').trim(),
        year: String(row?.release_date || row?.first_air_date || '').slice(0, 4) || null,
        backdropUrl: tmdbImg(backdropPath, 'original'),
        posterUrl: tmdbImg(row?.poster_path, 'w500'),
    };
};

const fetchTmdbSeasonalCandidates = async (fetchImpl, apiKey, mode) => {
    const key = String(apiKey || '').trim();
    const queries = SEASONAL_QUERIES[mode] || [];
    if (!key || key === '********' || !queries.length) return [];
    const seen = new Set();
    const out = [];
    for (const query of queries) {
        const res = await fetchImpl(
            `https://api.themoviedb.org/3/search/multi?api_key=${encodeURIComponent(key)}&query=${encodeURIComponent(query)}&include_adult=false&page=1`,
        ).catch(() => null);
        if (!res?.ok) continue;
        const json = await res.json().catch(() => null);
        for (const row of [].concat(json?.results || [])) {
            if (row?.media_type !== 'movie' && row?.media_type !== 'tv') continue;
            const mapped = mapTmdbListRow(row);
            if (!mapped || seen.has(mapped.tmdbId)) continue;
            seen.add(mapped.tmdbId);
            out.push(mapped);
            if (out.length >= SEASONAL_SCAN) return out;
        }
    }
    return out;
};

const plexGet = async (plexJson, fetchImpl, url, headers, timeoutMs = 4500) => (
    plexJson(fetchImpl, url, headers, { timeoutMs }).catch(() => null)
);

const findPlexByGuid = async ({
    fetchImpl,
    plexJson,
    uri,
    token,
    headers,
    tmdbId,
    mediaType,
}) => {
    const plexType = mediaType === 'movie' ? 1 : 2;
    const guids = guidCandidatesFor(tmdbId).slice(0, 2);

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

/** Match rows in order with limited concurrency; stop once `limit` hits are found. */
const matchUntilLimit = async (rows, limit, concurrency, mapper) => {
    const hits = [];
    let next = 0;
    let stop = false;

    const workers = Array.from({ length: Math.min(concurrency, rows.length) }, async () => {
        while (!stop) {
            const index = next;
            next += 1;
            if (index >= rows.length) return;
            const item = await mapper(rows[index], index);
            if (stop) return;
            if (!item) continue;
            hits.push({ index, item });
            if (hits.length >= limit) stop = true;
        }
    });
    await Promise.all(workers);
    return hits
        .sort((a, b) => a.index - b.index)
        .map((row) => row.item)
        .slice(0, limit);
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
        summary: mapped?.summary || row.overview || '',
        thumb: mapped?.thumb || null,
        art: mapped?.art || null,
        logo: mapped?.logo || null,
        backdropUrl: row.backdropUrl || null,
        posterUrl: row.posterUrl || null,
        tmdbId: row.tmdbId ?? mapped?.tmdbId ?? null,
        canPlay: mapped?.canPlay !== false,
    };
};

const plexImageProxyUrl = (path, width = 1920, height = 1080) => {
    const raw = String(path || '').trim();
    if (!raw) return '';
    if (/^https?:\/\//i.test(raw)) return raw;
    return `/api/plex/image?path=${encodeURIComponent(raw)}&width=${width}&height=${height}`;
};

const metaToHeroSlide = (meta, mapPlayerItem, config, extras = {}) => {
    const mapped = mapPlayerItem(meta, config);
    const ratingKey = String(mapped?.ratingKey || meta.ratingKey || '').trim();
    if (!ratingKey) return null;
    const artPath = mapped?.art || meta.art || meta.grandparentArt || meta.parentArt || null;
    const thumbPath = mapped?.thumb || meta.thumb || meta.grandparentThumb || null;
    return {
        ratingKey,
        title: mapped?.title || meta.title || meta.grandparentTitle || 'Untitled',
        type: mapped?.type || meta.type || 'movie',
        year: mapped?.year || meta.year || null,
        summary: mapped?.summary || meta.summary || '',
        thumb: mapped?.thumb || null,
        art: mapped?.art || null,
        logo: mapped?.logo || null,
        backdropUrl: extras.backdropUrl
            || plexImageProxyUrl(artPath, 1920, 1080)
            || plexImageProxyUrl(thumbPath, 780, 1170)
            || null,
        posterUrl: plexImageProxyUrl(thumbPath, 500, 750) || null,
        tmdbId: mapped?.tmdbId || null,
        canPlay: mapped?.canPlay !== false,
        viewOffsetMs: mapped?.viewOffsetMs || Number(meta.viewOffset) || 0,
    };
};

const continueWatchingToSlides = (items, mapPlayerItem, config) => {
    const out = [];
    const seen = new Set();
    for (const row of [].concat(items || [])) {
        const ratingKey = String(row?.ratingKey || '').trim();
        if (!ratingKey || seen.has(ratingKey)) continue;
        seen.add(ratingKey);
        const artPath = row.art || row.thumb || null;
        const slide = {
            ratingKey,
            title: row.title || row.showTitle || 'Untitled',
            type: row.type || 'movie',
            year: row.year || null,
            summary: row.summary || '',
            thumb: row.thumb || null,
            art: row.art || null,
            logo: row.logo || null,
            backdropUrl: plexImageProxyUrl(artPath, 1920, 1080) || null,
            posterUrl: plexImageProxyUrl(row.thumb, 500, 750) || null,
            tmdbId: row.tmdbId || null,
            canPlay: row.canPlay !== false,
            viewOffsetMs: row.viewOffsetMs || 0,
        };
        if (!slide.backdropUrl && mapPlayerItem) {
            /* keep as-is — UI has gradient fallback */
        }
        out.push(slide);
        if (out.length >= HERO_LIMIT) break;
    }
    return out;
};

const fetchLibrarySections = async ({ fetchImpl, plexJson, uri, token, headers }) => {
    const sectionsRes = await plexGet(
        plexJson,
        fetchImpl,
        `${uri}/library/sections?X-Plex-Token=${encodeURIComponent(token)}`,
        headers,
        8000,
    );
    return directoryList(sectionsRes).filter((dir) => dir?.type === 'movie' || dir?.type === 'show');
};

const enrichMeta = async ({ fetchImpl, plexJson, uri, token, headers, meta }) => {
    if (!meta?.ratingKey) return meta;
    const detail = await plexGet(
        plexJson,
        fetchImpl,
        `${uri}/library/metadata/${encodeURIComponent(meta.ratingKey)}?includeImages=1&includeGuids=1&X-Plex-Token=${encodeURIComponent(token)}`,
        headers,
        6000,
    );
    return metadataList(detail)[0] || meta;
};

const buildFromTmdbCandidates = async ({
    candidates,
    config,
    uri,
    token,
    headers,
    fetchImpl,
    plexJson,
    mapPlayerItem,
}) => {
    const sections = await fetchLibrarySections({ fetchImpl, plexJson, uri, token, headers });
    const matched = await matchUntilLimit(candidates, HERO_LIMIT, 5, async (row) => {
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
        if (!meta?.ratingKey) return null;
        const full = await enrichMeta({ fetchImpl, plexJson, uri, token, headers, meta });
        return toHeroItem(full, row, mapPlayerItem, config);
    });
    const items = [];
    const seenKeys = new Set();
    for (const item of matched) {
        if (!item?.ratingKey || seenKeys.has(item.ratingKey)) continue;
        seenKeys.add(item.ratingKey);
        items.push(item);
    }
    return items;
};

const querySectionAll = async ({
    fetchImpl,
    plexJson,
    uri,
    token,
    headers,
    sectionKey,
    type,
    sort,
    extra = '',
    size = 24,
}) => {
    const qs = [
        `type=${type}`,
        `sort=${encodeURIComponent(sort)}`,
        'includeGuids=1',
        'includeImages=1',
        `X-Plex-Container-Start=0`,
        `X-Plex-Container-Size=${size}`,
        `X-Plex-Token=${encodeURIComponent(token)}`,
        extra,
    ].filter(Boolean).join('&');
    const data = await plexGet(
        plexJson,
        fetchImpl,
        `${uri}/library/sections/${encodeURIComponent(sectionKey)}/all?${qs}`,
        headers,
        8000,
    );
    return metadataList(data);
};

const buildFromLibraryQuery = async ({
    config,
    uri,
    token,
    headers,
    fetchImpl,
    plexJson,
    mapPlayerItem,
    sort,
    extra = '',
    preferUnwatched = false,
}) => {
    const sections = await fetchLibrarySections({ fetchImpl, plexJson, uri, token, headers });
    const pools = await Promise.all(sections.slice(0, 8).map(async (section) => {
        const plexType = section.type === 'movie' ? 1 : 2;
        const filter = preferUnwatched ? 'unwatched=1' : extra;
        return querySectionAll({
            fetchImpl,
            plexJson,
            uri,
            token,
            headers,
            sectionKey: section.key,
            type: plexType,
            sort,
            extra: filter,
            size: 20,
        });
    }));
    const flat = pools.flat().filter((meta) => meta?.ratingKey && (meta.type === 'movie' || meta.type === 'show'));
    const items = [];
    const seen = new Set();
    for (const meta of flat) {
        const key = String(meta.ratingKey);
        if (seen.has(key)) continue;
        seen.add(key);
        const full = await enrichMeta({ fetchImpl, plexJson, uri, token, headers, meta });
        const slide = metaToHeroSlide(full, mapPlayerItem, config);
        if (slide?.backdropUrl || slide?.thumb) items.push(slide);
        if (items.length >= HERO_LIMIT) break;
    }
    return items;
};

const seededShuffle = (items, seed) => {
    const out = [...items];
    let state = Math.abs(Number(seed) || 1) % 2147483647 || 1;
    for (let i = out.length - 1; i > 0; i -= 1) {
        state = (state * 16807) % 2147483647;
        const j = state % (i + 1);
        [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
};

const buildRandomSpotlight = async (opts) => {
    const sections = await fetchLibrarySections(opts);
    const pools = await Promise.all(sections.slice(0, 6).map(async (section) => {
        const plexType = section.type === 'movie' ? 1 : 2;
        return querySectionAll({
            ...opts,
            sectionKey: section.key,
            type: plexType,
            sort: 'random',
            size: 30,
        });
    }));
    let flat = pools.flat().filter((meta) => meta?.ratingKey && (meta.type === 'movie' || meta.type === 'show'));
    const daySeed = Math.floor(Date.now() / DAY_MS);
    flat = seededShuffle(flat, daySeed).slice(0, HERO_LIMIT * 2);
    const items = [];
    const seen = new Set();
    for (const meta of flat) {
        const key = String(meta.ratingKey);
        if (seen.has(key)) continue;
        seen.add(key);
        const full = await enrichMeta({ ...opts, meta });
        const slide = metaToHeroSlide(full, opts.mapPlayerItem, opts.config);
        if (slide) items.push(slide);
        if (items.length >= HERO_LIMIT) break;
    }
    return items;
};

const emptyPayload = (mode, effectiveMode, reason, enabled = true) => ({
    enabled,
    mode,
    effectiveMode,
    refreshedAt: Date.now(),
    expiresAt: Date.now() + EMPTY_CACHE_MS,
    items: [],
    reason,
});

/**
 * Build hero slides for the configured (or effective) mode.
 * @returns {{ enabled, mode, effectiveMode, refreshedAt, expiresAt, items, reason? }}
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
    continueWatchingItems = [],
    now = new Date(),
} = {}) => {
    const mode = normalizeMediaPlayerHomeHeroMode(config);
    const effectiveMode = resolveEffectiveHeroMode(config, now);

    if (effectiveMode === 'off') {
        return {
            enabled: false,
            mode,
            effectiveMode: 'off',
            refreshedAt: null,
            expiresAt: null,
            items: [],
            reason: 'disabled',
        };
    }

    // Continue Watching is per-viewer — never share cache across users.
    const useCache = effectiveMode !== 'continue_watching';
    const cacheKey = [
        'hero-modes-v1',
        effectiveMode,
        String(config?.serverIdentifier || ''),
        String(config?.tmdbApiKey || '').slice(0, 8),
        Math.floor(Date.now() / DAY_MS),
    ].join('|');

    if (useCache && !force && heroCache && heroCache.key === cacheKey && heroCache.expiresAt > Date.now()) {
        return { ...heroCache.payload, mode, effectiveMode };
    }

    let items = [];
    let reason = 'ok';

    try {
        if (effectiveMode === 'continue_watching') {
            items = continueWatchingToSlides(continueWatchingItems, mapPlayerItem, config);
            reason = items.length ? 'ok' : 'no-continue-watching';
        } else if (effectiveMode === 'trending_week' || isSeasonalHeroMode(effectiveMode)) {
            const apiKey = String(config?.tmdbApiKey || '').trim();
            if (!apiKey || apiKey === '********') {
                const payload = emptyPayload(mode, effectiveMode, 'missing-tmdb-key');
                if (useCache) heroCache = { key: cacheKey, expiresAt: payload.expiresAt, payload };
                return payload;
            }
            const candidates = effectiveMode === 'trending_week'
                ? await fetchTmdbTrendingWeek(fetchImpl, apiKey)
                : await fetchTmdbSeasonalCandidates(fetchImpl, apiKey, effectiveMode);
            if (!candidates.length) {
                const payload = emptyPayload(mode, effectiveMode, 'tmdb-empty');
                if (useCache) heroCache = { key: cacheKey, expiresAt: payload.expiresAt, payload };
                return payload;
            }
            items = await buildFromTmdbCandidates({
                candidates,
                config,
                uri,
                token,
                headers,
                fetchImpl,
                plexJson,
                mapPlayerItem,
            });
            reason = items.length ? 'ok' : 'no-library-matches';
        } else if (effectiveMode === 'recently_added') {
            items = await buildFromLibraryQuery({
                config, uri, token, headers, fetchImpl, plexJson, mapPlayerItem,
                sort: 'addedAt:desc',
            });
            reason = items.length ? 'ok' : 'no-library-matches';
        } else if (effectiveMode === 'most_watched') {
            items = await buildFromLibraryQuery({
                config, uri, token, headers, fetchImpl, plexJson, mapPlayerItem,
                sort: 'viewCount:desc',
            });
            reason = items.length ? 'ok' : 'no-library-matches';
        } else if (effectiveMode === 'unwatched_picks') {
            items = await buildFromLibraryQuery({
                config, uri, token, headers, fetchImpl, plexJson, mapPlayerItem,
                sort: 'audienceRating:desc',
                preferUnwatched: true,
            });
            reason = items.length ? 'ok' : 'no-library-matches';
        } else if (effectiveMode === 'new_releases') {
            items = await buildFromLibraryQuery({
                config, uri, token, headers, fetchImpl, plexJson, mapPlayerItem,
                sort: 'originallyAvailableAt:desc',
            });
            reason = items.length ? 'ok' : 'no-library-matches';
        } else if (effectiveMode === 'random_spotlight') {
            items = await buildRandomSpotlight({
                config, uri, token, headers, fetchImpl, plexJson, mapPlayerItem,
            });
            reason = items.length ? 'ok' : 'no-library-matches';
        } else {
            reason = 'unknown-mode';
        }
    } catch {
        reason = 'build-error';
        items = [];
    }

    const refreshedAt = Date.now();
    const payload = {
        enabled: true,
        mode,
        effectiveMode,
        refreshedAt,
        expiresAt: refreshedAt + (items.length ? DAY_MS : EMPTY_CACHE_MS),
        items,
        reason,
    };
    if (useCache) heroCache = { key: cacheKey, expiresAt: payload.expiresAt, payload };
    return payload;
};
