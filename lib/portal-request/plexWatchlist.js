/**
 * Fetch a member's Plex watchlist via Discover provider (Phase 9).
 */

const DISCOVER_WATCHLIST_URL = 'https://discover.provider.plex.tv/library/sections/watchlist/all';

const extractTmdbId = (item = {}) => {
    const guids = Array.isArray(item.Guid)
        ? item.Guid
        : (Array.isArray(item.guid) ? item.guid : []);
    for (const entry of guids) {
        const raw = String(entry?.id || entry || '');
        const match = raw.match(/(?:tmdb|themoviedb):\/\/(\d+)/i);
        if (match) return Number(match[1]);
    }
    const single = String(item.guid || '');
    const match = single.match(/(?:tmdb|themoviedb):\/\/(\d+)/i);
    if (match) return Number(match[1]);
    return null;
};

const resolveMediaType = (item = {}) => {
    const type = String(item.type || item.librarySectionType || '').toLowerCase();
    if (type === 'show' || type === 'tv' || type === 'series' || type === '2') return 'tv';
    if (type === 'movie' || type === '1') return 'movie';
    if (item.firstAirDate || item.originallyAvailableAt && /show/i.test(String(item.type || ''))) return 'tv';
    return 'movie';
};

const mapPlexWatchlistItem = (item = {}) => {
    const tmdbId = extractTmdbId(item);
    if (!Number.isFinite(tmdbId) || tmdbId <= 0) return null;
    const mediaType = resolveMediaType(item);
    const title = item.title || item.originalTitle || item.name || 'Unknown title';
    const yearSource = item.year
        || (item.originallyAvailableAt ? String(item.originallyAvailableAt).slice(0, 4) : null)
        || null;
    return {
        id: tmdbId,
        tmdbId,
        mediaType,
        type: mediaType,
        title,
        name: title,
        year: yearSource != null ? String(yearSource).slice(0, 4) : null,
        overview: item.summary || item.overview || '',
        posterPath: null,
        backdropPath: null,
        releaseDate: mediaType === 'movie' ? (item.originallyAvailableAt || null) : null,
        firstAirDate: mediaType === 'tv' ? (item.originallyAvailableAt || null) : null,
        plexGuid: Array.isArray(item.Guid) ? (item.Guid[0]?.id || null) : (item.guid || null),
        plexRatingKey: item.ratingKey != null ? String(item.ratingKey) : null,
        source: 'plex',
    };
};

/**
 * @param {object} options
 * @param {string} options.plexToken
 * @param {(url: string, init?: object) => Promise<Response>} [options.fetchImpl]
 * @param {(token?: string, extra?: object) => object} [options.plexHeaders]
 */
export const fetchPlexWatchlist = async ({
    plexToken,
    fetchImpl = fetch,
    plexHeaders = () => ({}),
} = {}) => {
    const token = String(plexToken || '').trim();
    if (!token) return { results: [], source: 'none' };

    const url = `${DISCOVER_WATCHLIST_URL}?includeGuids=1&X-Plex-Token=${encodeURIComponent(token)}`;
    const response = await fetchImpl(url, {
        method: 'GET',
        headers: {
            Accept: 'application/json',
            ...plexHeaders(token),
        },
    });

    if (!response.ok) {
        const text = await response.text().catch(() => '');
        const err = new Error(`Plex watchlist failed (${response.status}): ${text.slice(0, 200)}`);
        err.status = response.status;
        throw err;
    }

    const payload = await response.json().catch(() => ({}));
    const container = payload?.MediaContainer || payload?.mediaContainer || payload || {};
    const rawItems = Array.isArray(container.Metadata)
        ? container.Metadata
        : (Array.isArray(container.metadata)
            ? container.metadata
            : (Array.isArray(container.Video) ? container.Video : []));

    const results = [];
    const seen = new Set();
    for (const item of rawItems) {
        const mapped = mapPlexWatchlistItem(item);
        if (!mapped) continue;
        const key = `${mapped.mediaType}:${mapped.tmdbId}`;
        if (seen.has(key)) continue;
        seen.add(key);
        results.push(mapped);
    }

    return { results, source: 'plex' };
};

export default fetchPlexWatchlist;
