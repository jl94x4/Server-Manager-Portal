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

const TMDB_POSTER_SIZE = 'w300_and_h450_bestv2';

export const buildSeerrPosterUrl = (baseUrl, posterPath) => {
    if (!posterPath) return '';
    const raw = String(posterPath);
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    const path = raw.startsWith('/') ? raw : `/${raw}`;
    const cleanBase = String(baseUrl || '').replace(/\/$/, '');
    return `${cleanBase}/imageproxy/tmdb/poster/${TMDB_POSTER_SIZE}${path}`;
};

export const mapSeerrRequestToDto = (reqItem, baseUrl) => {
    const media = reqItem?.media || {};
    const requestedBy = reqItem?.requestedBy || {};
    const posterPath = media.posterPath || media.poster || '';
    const rawType = String(reqItem?.type || media.mediaType || '').toLowerCase();
    const title = media.title || media.name || 'Unknown title';
    const yearSource = media.releaseDate || media.firstAirDate || '';
    const cleanBase = String(baseUrl || '').replace(/\/$/, '');

    return {
        id: reqItem?.id,
        status: Number(reqItem?.status) || null,
        statusLabel: seerrRequestStatusLabel(reqItem?.status),
        type: rawType === 'tv' ? 'tv' : 'movie',
        is4k: !!reqItem?.is4k,
        title,
        year: yearSource ? String(yearSource).slice(0, 4) : null,
        overview: media.overview || '',
        posterUrl: buildSeerrPosterUrl(cleanBase, posterPath),
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

export const createRequestAppService = ({ fetchWithTimeout, resolveIntegrationUrlForFetch }) => {
    const getCredentials = (config) => {
        if (!isRequestAppConfigured(config)) {
            throw new Error('Request app is not configured for in-portal approval');
        }
        return {
            type: String(config.requestAppType || 'none').toLowerCase(),
            baseUrl: resolveIntegrationUrlForFetch(config.requestAppUrl),
            apiKey: config.requestAppApiKey,
        };
    };

    const seerrHeaders = (apiKey) => ({
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
    });

    const fetchSeerrJson = async (config, path, { method = 'GET', body = null } = {}) => {
        const { baseUrl, apiKey } = getCredentials(config);
        const response = await fetchWithTimeout(`${baseUrl}${path}`, {
            method,
            headers: seerrHeaders(apiKey),
            ...(body ? { body: JSON.stringify(body) } : {}),
        }, 15000);
        let data = null;
        try {
            data = await response.json();
        } catch {
            data = null;
        }
        if (!response.ok) {
            const message = data?.message || data?.error || `Request app returned HTTP ${response.status}`;
            throw new Error(message);
        }
        return data;
    };

    const listRequests = async (config, { filter = 'pending', take = 20, skip = 0, sort = 'modified' } = {}) => {
        const { baseUrl } = getCredentials(config);
        const params = new URLSearchParams({
            take: String(take),
            skip: String(skip),
            sort,
        });
        if (filter) params.set('filter', filter);
        const payload = await fetchSeerrJson(config, `/api/v1/request?${params.toString()}`);
        const results = Array.isArray(payload?.results) ? payload.results : [];
        const pageInfo = payload?.pageInfo || {};
        return {
            results: results.map((item) => mapSeerrRequestToDto(item, baseUrl)),
            pageInfo: {
                pages: Number(pageInfo.pages) || 1,
                results: Number(pageInfo.results) || results.length,
                page: Number(pageInfo.page) || 1,
            },
        };
    };

    const getRequestCounts = async (config) => {
        const payload = await fetchSeerrJson(config, '/api/v1/request/count');
        return {
            pending: Number(payload?.pending) || 0,
            approved: Number(payload?.approved) || 0,
            declined: Number(payload?.declined) || 0,
            total: Number(payload?.total) || 0,
        };
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
