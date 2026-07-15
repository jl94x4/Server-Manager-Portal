const normalizeCombinedRatingsPayload = (payload) => {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
    const rt = payload.rt && typeof payload.rt === 'object' ? payload.rt : null;
    const imdb = payload.imdb && typeof payload.imdb === 'object' ? payload.imdb : null;
    if (!rt && !imdb) return null;
    return {
        ...(rt ? { rt } : {}),
        ...(imdb ? { imdb } : {}),
    };
};

const resolveImdbId = (details) => {
    if (!details || typeof details !== 'object') return null;
    return details.imdbId
        || details.imdb_id
        || details.externalIds?.imdbId
        || null;
};

export const fetchImdbRatingsFromRadarr = async (imdbId, fetchImpl, timeoutMs = 12000) => {
    const id = String(imdbId || '').trim();
    if (!id) return null;
    try {
        const response = await fetchImpl(`https://api.radarr.video/v1/movie/imdb/${encodeURIComponent(id)}`, {
            method: 'GET',
            headers: { Accept: 'application/json' },
        }, timeoutMs);
        if (!response.ok) return null;
        const data = await response.json();
        const entry = Array.isArray(data) ? data[0] : null;
        const imdb = entry?.MovieRatings?.Imdb;
        if (!entry?.ImdbId || imdb?.Value == null) return null;
        return {
            title: entry.Title,
            url: `https://www.imdb.com/title/${entry.ImdbId}`,
            criticsScore: imdb.Value,
            criticsScoreCount: imdb.Count,
        };
    } catch {
        return null;
    }
};

export const fetchDiscoveryCombinedRatings = async ({
    config,
    rawFetchOptional,
    fetchImpl,
    mediaType,
    mediaId,
}) => {
    const id = Number(mediaId);
    if (!Number.isFinite(id) || id <= 0) return null;
    const segment = mediaType === 'tv' ? 'tv' : 'movie';

    if (segment === 'movie') {
        const combined = await rawFetchOptional(config, `/api/v1/movie/${id}/ratingscombined`, { timeoutMs: 30000 });
        if (combined.ok) {
            const normalized = normalizeCombinedRatingsPayload(combined.data);
            if (normalized) return normalized;
            return {};
        }
        if (combined.status === 404) return {};

        const partial = {};
        const rtOnly = await rawFetchOptional(config, `/api/v1/movie/${id}/ratings`, { timeoutMs: 20000 });
        if (rtOnly.ok && rtOnly.data) partial.rt = rtOnly.data;

        const movie = await rawFetchOptional(config, `/api/v1/movie/${id}`, { timeoutMs: 15000 });
        if (movie.ok && movie.data) {
            const imdb = await fetchImdbRatingsFromRadarr(resolveImdbId(movie.data), fetchImpl);
            if (imdb) partial.imdb = imdb;
        }

        if (partial.rt || partial.imdb) return partial;
        if (combined.status === 404 || rtOnly.status === 404) return {};
        return null;
    }

    const rt = await rawFetchOptional(config, `/api/v1/tv/${id}/ratings`, { timeoutMs: 20000 });
    if (rt.ok && rt.data) return { rt: rt.data };
    if (rt.status === 404) return {};
    return null;
};
