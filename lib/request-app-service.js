export const isSeerrFamilyRequestApp = (type) => {
    const lower = String(type || '').toLowerCase();
    return lower === 'seerr' || lower === 'overseerr' || lower === 'jellyseerr';
};

export const isRequestAppConfigured = (config = {}) => {
    const type = String(config.requestAppType || 'none').toLowerCase();
    if (type === 'none' || !config.requestAppUrl || !config.requestAppApiKey) return false;
    return isSeerrFamilyRequestApp(type);
};

export const seerrRequestStatusLabel = (status) => {
    const value = Number(status);
    if (value === 1) return 'pending';
    if (value === 2) return 'approved';
    if (value === 3) return 'declined';
    return 'unknown';
};

export const isPendingSeerrRequest = (reqItem) => Number(reqItem?.status) === 1;

export const isDeclinedSeerrRequest = (reqItem) => {
    const status = reqItem?.status;
    if (status === 3 || status === '3') return true;
    return String(status || '').toLowerCase() === 'declined';
};

export const isApprovedSeerrRequest = (reqItem) => {
    const status = reqItem?.status;
    if (status === 2 || status === '2') return true;
    return String(status || '').toLowerCase() === 'approved';
};

/** Paginate Seerr list results until enough items match (e.g. declined has no API filter). */
export const collectSeerrRequestsMatching = async ({
    fetchPage,
    apiFilter = 'all',
    sort = 'modified',
    matchFn,
    take = 20,
    skip = 0,
    pageSize = 50,
    maxPages = 50,
}) => {
    const matched = [];
    let pageSkip = 0;
    let totalResults = Number.POSITIVE_INFINITY;

    for (let page = 0; page < maxPages && matched.length < skip + take && pageSkip < totalResults; page += 1) {
        const payload = await fetchPage(apiFilter, sort, pageSize, pageSkip);
        const batch = Array.isArray(payload?.results) ? payload.results : [];
        const reportedTotal = Number(payload?.pageInfo?.results);
        if (Number.isFinite(reportedTotal) && reportedTotal >= 0) totalResults = reportedTotal;

        if (!batch.length) break;

        for (const item of batch) {
            if (matchFn(item)) matched.push(item);
        }

        pageSkip += batch.length;
        if (pageSkip >= totalResults) break;
    }

    return matched.slice(skip, skip + take);
};

/** Portal tab filters vs Seerr query/filter allowed values (no `declined` on Seerr). */
export const resolveSeerrListQuery = (portalFilter, take = 20) => {
    if (portalFilter === 'declined') {
        return { apiFilter: 'all', clientFilter: 'declined', take, paginate: true };
    }
    if (portalFilter === 'pending') {
        return { apiFilter: 'pending', clientFilter: 'pending', take };
    }
    if (portalFilter === 'approved') {
        return { apiFilter: 'approved', clientFilter: null, take };
    }
    return { apiFilter: portalFilter, clientFilter: null, take };
};

export const applyPortalRequestStatusFilter = (results, clientFilter) => {
    if (!clientFilter) return results;
    if (clientFilter === 'declined') return results.filter(isDeclinedSeerrRequest);
    if (clientFilter === 'pending') return results.filter(isPendingSeerrRequest);
    return results;
};

export const resolveSeerrRequestType = (reqItem = {}, media = {}) => {
    const raw = reqItem?.type ?? media?.mediaType ?? media?.type;
    if (raw === 2 || raw === '2' || String(raw).toLowerCase() === 'tv') return 'tv';
    return 'movie';
};

const parseSeerrCountPayload = (payload = {}) => {
    const source = payload?.requests && typeof payload.requests === 'object' ? payload.requests : payload;
    const pending = Number(source?.pending);
    const approved = Number(source?.approved);
    const declined = Number(source?.declined);
    const total = Number(source?.total);
    return {
        pending: Number.isFinite(pending) ? pending : 0,
        approved: Number.isFinite(approved) ? approved : 0,
        declined: Number.isFinite(declined) ? declined : 0,
        total: Number.isFinite(total) ? total : 0,
    };
};

const TMDB_POSTER_SIZE = 'w342';

export const buildTmdbPosterUrl = (posterPath, size = TMDB_POSTER_SIZE) => {
    if (!posterPath) return '';
    const raw = String(posterPath);
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    const path = raw.startsWith('/') ? raw : `/${raw}`;
    return `https://image.tmdb.org/t/p/${size}${path}`;
};

/** Seerr imageproxy expects /imageproxy/tmdb/t/p/{size}/{file} — not /poster/ */
export const buildSeerrPosterUrl = (baseUrl, posterPath, size = TMDB_POSTER_SIZE) => {
    if (!posterPath) return '';
    const raw = String(posterPath);
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    const path = raw.startsWith('/') ? raw : `/${raw}`;
    const cleanBase = String(baseUrl || '').replace(/\/$/, '');
    return `${cleanBase}/imageproxy/tmdb/t/p/${size}${path}`;
};

export const buildRequestPosterUrl = (posterPath, seerrBaseUrl) => (
    buildTmdbPosterUrl(posterPath) || buildSeerrPosterUrl(seerrBaseUrl, posterPath)
);

const seerrMediaCacheKey = (type, tmdbId) => `${type}:${tmdbId}`;

const requestNeedsMediaEnrichment = (reqItem) => {
    const media = reqItem?.media || {};
    const hasTitle = !!(media.title || media.name || reqItem?.title || reqItem?.name);
    const hasPoster = !!(media.posterPath || media.poster);
    if (!(Number(media.tmdbId) > 0)) return false;
    return !hasTitle || !hasPoster;
};

export const enrichSeerrRequestResults = async (fetchSeerrJson, config, results) => {
    if (!Array.isArray(results) || results.length === 0) return results;

    const keysToFetch = new Map();
    for (const item of results) {
        if (!requestNeedsMediaEnrichment(item)) continue;
        const media = item?.media || {};
        const type = resolveSeerrRequestType(item, media);
        const tmdbId = Number(media.tmdbId);
        if (!Number.isFinite(tmdbId) || tmdbId <= 0) continue;
        const key = seerrMediaCacheKey(type, tmdbId);
        if (!keysToFetch.has(key)) keysToFetch.set(key, { type, tmdbId });
    }

    if (keysToFetch.size === 0) return results;

    const detailsCache = new Map();
    await Promise.all([...keysToFetch.entries()].map(async ([key, { type, tmdbId }]) => {
        const segment = type === 'tv' ? 'tv' : 'movie';
        const details = await fetchSeerrJson(config, `/api/v1/${segment}/${tmdbId}`).catch(() => null);
        if (details) detailsCache.set(key, details);
    }));

    if (detailsCache.size === 0) return results;

    return results.map((item) => {
        if (!requestNeedsMediaEnrichment(item)) return item;
        const media = item?.media || {};
        const type = resolveSeerrRequestType(item, media);
        const tmdbId = Number(media.tmdbId);
        const details = detailsCache.get(seerrMediaCacheKey(type, tmdbId));
        if (!details) return item;
        return {
            ...item,
            media: {
                ...media,
                title: details.title || media.title,
                name: details.name || media.name,
                posterPath: details.posterPath || media.posterPath,
                overview: details.overview || media.overview,
                releaseDate: details.releaseDate || media.releaseDate,
                firstAirDate: details.firstAirDate || media.firstAirDate,
                mediaType: details.mediaType || media.mediaType || type,
            },
        };
    });
};

export const mapSeerrRequestToDto = (reqItem, baseUrl) => {
    const media = reqItem?.media || {};
    const requestedBy = reqItem?.requestedBy || {};
    const posterPath = media.posterPath || media.poster || '';
    const title = media.title || media.name || reqItem?.title || reqItem?.name || 'Unknown title';
    const yearSource = media.releaseDate || media.firstAirDate || '';
    const cleanBase = String(baseUrl || '').replace(/\/$/, '');

    return {
        id: reqItem?.id,
        status: Number(reqItem?.status) || null,
        statusLabel: seerrRequestStatusLabel(reqItem?.status),
        type: resolveSeerrRequestType(reqItem, media),
        is4k: !!reqItem?.is4k,
        title,
        year: yearSource ? String(yearSource).slice(0, 4) : null,
        overview: media.overview || '',
        posterUrl: buildRequestPosterUrl(posterPath, cleanBase),
        requestedBy: {
            id: requestedBy.id || null,
            displayName: requestedBy.displayName || requestedBy.username || requestedBy.email || 'Unknown',
            avatar: requestedBy.avatar
            ? (String(requestedBy.avatar).startsWith('http')
                ? requestedBy.avatar
                : `${cleanBase}${String(requestedBy.avatar).startsWith('/') ? requestedBy.avatar : `/${requestedBy.avatar}`}`)
            : '',
        },
        createdAt: reqItem?.createdAt || null,
        updatedAt: reqItem?.updatedAt || null,
        mediaStatus: media.status ?? null,
        seerrUrl: `${cleanBase}/requests`,
    };
};

export const getRequestAppGate = (config = {}) => {
    if (!isRequestAppConfigured(config)) {
        return {
            configured: false,
            supported: false,
            ready: false,
            error: 'Set Request App Type, URL, and API key under Settings → Integrations.',
        };
    }
    if (!isSeerrFamilyRequestApp(config.requestAppType)) {
        return {
            configured: true,
            supported: false,
            ready: false,
            error: 'In-portal approval supports Seerr, Overseerr, and Jellyseerr only (not Ombi).',
        };
    }
    return { configured: true, supported: true, ready: true, error: null };
};

export const createRequestAppService = ({ fetchWithTimeout, resolveIntegrationUrlForFetch, resolveRequestAppFetchUrl }) => {
    const getCredentials = (config) => {
        if (!isRequestAppConfigured(config)) {
            throw new Error('Request app is not configured for in-portal approval');
        }
        const publicBaseUrl = resolveIntegrationUrlForFetch(config.requestAppUrl);
        const baseUrl = resolveRequestAppFetchUrl
            ? resolveRequestAppFetchUrl(config)
            : publicBaseUrl;
        return {
            type: String(config.requestAppType || 'none').toLowerCase(),
            baseUrl,
            publicBaseUrl,
            apiKey: config.requestAppApiKey,
        };
    };

    const seerrHeaders = (apiKey) => ({
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
    });

    const fetchSeerrJson = async (config, path, { method = 'GET', body = null } = {}) => {
        const { baseUrl, publicBaseUrl, apiKey } = getCredentials(config);
        let response;
        try {
            response = await fetchWithTimeout(`${baseUrl}${path}`, {
                method,
                headers: seerrHeaders(apiKey),
                ...(body ? { body: JSON.stringify(body) } : {}),
            }, 15000);
        } catch (err) {
            const code = err?.cause?.code || err?.code || err?.message || 'network error';
            const usingPublicOnly = publicBaseUrl === baseUrl;
            const dockerHint = /localhost|127\.0\.0\.1/i.test(baseUrl)
                ? ' If the portal runs in Docker, use your server LAN IP or docker service name instead of localhost.'
                : '';
            const proxyHint = usingPublicOnly && /^https:\/\//i.test(baseUrl)
                ? ' Public reverse-proxy URLs often fail from inside Docker — set an Internal fetch URL (docker network name or LAN IP) under Settings → Integrations.'
                : '';
            throw new Error(`Cannot reach request app at ${baseUrl}.${dockerHint}${proxyHint} (${code})`);
        }
        let data = null;
        try {
            data = await response.json();
        } catch {
            data = null;
        }
        if (!response.ok) {
            const message = data?.message || data?.error || `Request app returned HTTP ${response.status}`;
            if (response.status === 401 || response.status === 403) {
                throw new Error(`${message} — check the API key has MANAGE_REQUESTS permission.`);
            }
            throw new Error(message);
        }
        return data;
    };

    const listRequests = async (config, { filter = 'pending', take = 20, skip = 0, sort = 'added' } = {}) => {
        const { publicBaseUrl, baseUrl } = getCredentials(config);
        const linkBaseUrl = publicBaseUrl || baseUrl;
        const { apiFilter, clientFilter, take: pageTake, paginate } = resolveSeerrListQuery(filter, take);
        const fetchPage = async (filterValue, sortValue, batchTake, batchSkip) => {
            const params = new URLSearchParams({
                take: String(batchTake),
                skip: String(batchSkip),
                sort: sortValue,
            });
            if (filterValue) params.set('filter', filterValue);
            return fetchSeerrJson(config, `/api/v1/request?${params.toString()}`);
        };

        let payload;
        let results;

        if (paginate && clientFilter === 'declined') {
            results = await collectSeerrRequestsMatching({
                fetchPage,
                apiFilter: 'all',
                sort: 'modified',
                matchFn: isDeclinedSeerrRequest,
                take: pageTake,
                skip,
            });
            payload = { pageInfo: { pages: 1, results: results.length, page: 1 } };
        } else {
            payload = await fetchPage(apiFilter, sort, pageTake, skip);
            results = Array.isArray(payload?.results) ? payload.results : [];

            if (filter === 'pending' && results.length === 0) {
                const fallbackPayload = await fetchPage('all', 'added', pageTake, skip).catch(() => null);
                const fallbackResults = Array.isArray(fallbackPayload?.results) ? fallbackPayload.results : [];
                results = fallbackResults.filter(isPendingSeerrRequest);
                if (results.length > 0) payload = fallbackPayload;
            }

            if (clientFilter) {
                results = applyPortalRequestStatusFilter(results, clientFilter).slice(0, pageTake);
            }
        }

        results = await enrichSeerrRequestResults(fetchSeerrJson, config, results);

        const pageInfo = payload?.pageInfo || {};
        return {
            results: results.map((item) => mapSeerrRequestToDto(item, linkBaseUrl)),
            pageInfo: {
                pages: Number(pageInfo.pages) || 1,
                results: Number(pageInfo.results) || results.length,
                page: Number(pageInfo.page) || 1,
            },
        };
    };

    const getRequestCounts = async (config) => {
        const payload = await fetchSeerrJson(config, '/api/v1/request/count');
        return parseSeerrCountPayload(payload);
    };

    const approveRequest = (config, requestId) => (
        fetchSeerrJson(config, `/api/v1/request/${encodeURIComponent(requestId)}/approve`, { method: 'POST' })
    );

    const declineRequest = (config, requestId, reason = '') => (
        fetchSeerrJson(config, `/api/v1/request/${encodeURIComponent(requestId)}/decline`, {
            method: 'POST',
            body: reason ? { reason } : {},
        })
    );

    return {
        listRequests,
        getRequestCounts,
        approveRequest,
        declineRequest,
        isRequestAppConfigured,
        isSeerrFamilyRequestApp,
    };
};
