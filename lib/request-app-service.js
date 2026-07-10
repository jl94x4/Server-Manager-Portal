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

export const isFailedSeerrRequest = (reqItem) => {
    const status = reqItem?.status;
    if (status === 4 || status === '4') return true;
    return String(status || '').toLowerCase() === 'failed';
};

const parseSeerrTags = (tags) => {
    if (Array.isArray(tags)) return tags.map((t) => Number(t)).filter((n) => Number.isFinite(n));
    if (tags === 'none' || tags === null || tags === undefined) return [];
    if (typeof tags === 'string' && tags.trim()) {
        return tags.split(',').map((t) => Number(t.trim())).filter((n) => Number.isFinite(n));
    }
    return [];
};

const mapSeerrSeasons = (seasons) => {
    if (!Array.isArray(seasons)) return [];
    return seasons.map((s) => ({
        seasonNumber: Number(s?.seasonNumber ?? s?.season_number) || 0,
        status: Number(s?.status) || null,
        statusLabel: seerrRequestStatusLabel(s?.status),
    })).filter((s) => s.seasonNumber >= 0);
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
    if (portalFilter === 'processing') {
        return { apiFilter: 'processing', clientFilter: null, take };
    }
    if (portalFilter === 'available') {
        return { apiFilter: 'available', clientFilter: null, take };
    }
    if (portalFilter === 'failed') {
        return { apiFilter: 'failed', clientFilter: null, take };
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
    const processing = Number(source?.processing);
    const available = Number(source?.available);
    const failed = Number(source?.failed);
    const completed = Number(source?.completed);
    return {
        pending: Number.isFinite(pending) ? pending : 0,
        approved: Number.isFinite(approved) ? approved : 0,
        declined: Number.isFinite(declined) ? declined : 0,
        processing: Number.isFinite(processing) ? processing : 0,
        available: Number.isFinite(available) ? available : 0,
        failed: Number.isFinite(failed) ? failed : null,
        completed: Number.isFinite(completed) ? completed : 0,
        total: Number.isFinite(total) ? total : 0,
    };
};

const fetchSeerrFailedRequestCount = async (fetchSeerrJson, config) => {
    const params = new URLSearchParams({ filter: 'failed', take: '1', skip: '0', sort: 'modified' });
    const payload = await fetchSeerrJson(config, `/api/v1/request?${params.toString()}`);
    const failedTotal = Number(payload?.pageInfo?.results);
    return Number.isFinite(failedTotal) && failedTotal >= 0 ? failedTotal : 0;
};

const TMDB_POSTER_SIZE = 'w342';
const TMDB_BACKDROP_SIZE = 'w1280';

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

export const buildTmdbBackdropUrl = (backdropPath, size = TMDB_BACKDROP_SIZE) => {
    if (!backdropPath) return '';
    const raw = String(backdropPath);
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    const path = raw.startsWith('/') ? raw : `/${raw}`;
    return `https://image.tmdb.org/t/p/${size}${path}`;
};

export const buildSeerrBackdropUrl = (baseUrl, backdropPath, size = TMDB_BACKDROP_SIZE) => {
    if (!backdropPath) return '';
    const raw = String(backdropPath);
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    const path = raw.startsWith('/') ? raw : `/${raw}`;
    const cleanBase = String(baseUrl || '').replace(/\/$/, '');
    return `${cleanBase}/imageproxy/tmdb/t/p/${size}${path}`;
};

export const buildRequestBackdropUrl = (backdropPath, seerrBaseUrl) => (
    buildTmdbBackdropUrl(backdropPath) || buildSeerrBackdropUrl(seerrBaseUrl, backdropPath)
);

const seerrMediaCacheKey = (type, tmdbId) => `${type}:${tmdbId}`;

const requestNeedsMediaEnrichment = (reqItem) => {
    const media = reqItem?.media || {};
    const hasTitle = !!(media.title || media.name || reqItem?.title || reqItem?.name);
    const hasPoster = !!(media.posterPath || media.poster);
    const hasBackdrop = !!(media.backdropPath || media.backdrop);
    if (!(Number(media.tmdbId) > 0)) return false;
    return !hasTitle || !hasPoster || !hasBackdrop;
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
                backdropPath: details.backdropPath || media.backdropPath,
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
    const backdropPath = media.backdropPath || media.backdrop || '';
    const title = media.title || media.name || reqItem?.title || reqItem?.name || 'Unknown title';
    const yearSource = media.releaseDate || media.firstAirDate || '';
    const cleanBase = String(baseUrl || '').replace(/\/$/, '');
    const type = resolveSeerrRequestType(reqItem, media);
    const status = Number(reqItem?.status) || null;
    const tmdbId = Number(media.tmdbId) || null;

    const routingParts = [];
    if (reqItem?.profileName) routingParts.push(reqItem.profileName);
    else if (reqItem?.profileId) routingParts.push(`Profile #${reqItem.profileId}`);
    if (reqItem?.rootFolder) routingParts.push(reqItem.rootFolder);

    return {
        id: reqItem?.id,
        status,
        statusLabel: seerrRequestStatusLabel(reqItem?.status),
        type,
        is4k: !!reqItem?.is4k,
        title,
        year: yearSource ? String(yearSource).slice(0, 4) : null,
        overview: media.overview || '',
        posterUrl: buildRequestPosterUrl(posterPath, cleanBase),
        backdropUrl: buildRequestBackdropUrl(backdropPath, cleanBase),
        requestedBy: {
            id: requestedBy.id || null,
            displayName: requestedBy.displayName || requestedBy.username || requestedBy.email || 'Unknown',
            email: requestedBy.email || null,
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
        tmdbId,
        mediaId: Number(media.id) || null,
        serverId: reqItem?.serverId ?? null,
        profileId: reqItem?.profileId ?? null,
        profileName: reqItem?.profileName || null,
        rootFolder: reqItem?.rootFolder || null,
        languageProfileId: reqItem?.languageProfileId ?? null,
        tags: parseSeerrTags(reqItem?.tags),
        seasons: mapSeerrSeasons(reqItem?.seasons),
        routingSummary: routingParts.length ? routingParts.join(' · ') : null,
        canRemove: reqItem?.canRemove ?? null,
        canRetry: status === 4 || isFailedSeerrRequest(reqItem),
        isAnime: !!media?.isAnime,
    };
};

export const buildSeerrUpdateBody = (detail, overrides = {}) => {
    const type = detail?.type || 'movie';
    const mediaType = type === 'tv' ? 'tv' : 'movie';
    const body = { mediaType };

    if (overrides.serverId != null) body.serverId = Number(overrides.serverId);
    if (overrides.profileId != null) body.profileId = Number(overrides.profileId);
    if (overrides.rootFolder != null) body.rootFolder = String(overrides.rootFolder);
    if (overrides.languageProfileId != null) body.languageProfileId = Number(overrides.languageProfileId);
    if (overrides.userId != null) body.userId = Number(overrides.userId);
    if (Array.isArray(overrides.tags)) body.tags = overrides.tags.map((t) => Number(t)).filter((n) => Number.isFinite(n));
    if (type === 'tv' && Array.isArray(overrides.seasons)) {
        body.seasons = overrides.seasons.map((n) => Number(n)).filter((n) => Number.isFinite(n));
    }

    return body;
};

export const hasRequestOverrides = (overrides = {}) => (
    overrides.serverId != null
    || overrides.profileId != null
    || overrides.rootFolder != null
    || overrides.languageProfileId != null
    || overrides.userId != null
    || Array.isArray(overrides.tags)
    || Array.isArray(overrides.seasons)
);

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
        if (response.status === 204) return { success: true };
        return data;
    };

    const findSeerrRequestById = async (config, requestId) => {
        for (let skip = 0; skip < 1000; skip += 50) {
            const params = new URLSearchParams({ take: '50', skip: String(skip), sort: 'modified', filter: 'all' });
            const payload = await fetchSeerrJson(config, `/api/v1/request?${params.toString()}`);
            const batch = Array.isArray(payload?.results) ? payload.results : [];
            const found = batch.find((r) => String(r?.id) === String(requestId));
            if (found) return found;
            if (batch.length < 50) break;
        }
        return null;
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
        const [payload, failedCount] = await Promise.all([
            fetchSeerrJson(config, '/api/v1/request/count'),
            fetchSeerrFailedRequestCount(fetchSeerrJson, config).catch(() => 0),
        ]);
        const counts = parseSeerrCountPayload(payload);
        counts.failed = counts.failed ?? failedCount;
        return counts;
    };

    const getRequest = async (config, requestId) => {
        const { publicBaseUrl, baseUrl } = getCredentials(config);
        const linkBaseUrl = publicBaseUrl || baseUrl;
        let raw = await fetchSeerrJson(config, `/api/v1/request/${encodeURIComponent(requestId)}`).catch(() => null);
        if (!raw?.media) {
            const fromList = await findSeerrRequestById(config, requestId);
            if (fromList) {
                raw = { ...fromList, ...raw, media: fromList.media || raw?.media, seasons: fromList.seasons || raw?.seasons };
            }
        }
        if (!raw) throw new Error('Request not found');
        const enriched = await enrichSeerrRequestResults(fetchSeerrJson, config, [raw]);
        const item = enriched[0] || raw;
        const dto = mapSeerrRequestToDto(item, linkBaseUrl);

        if (dto.type === 'tv' && dto.tmdbId) {
            try {
                const tvDetails = await fetchSeerrJson(config, `/api/v1/tv/${dto.tmdbId}`);
                dto.isAnime = !!tvDetails?.isAnime;
                dto.tvSeasons = Array.isArray(tvDetails?.seasons)
                    ? tvDetails.seasons.map((s) => ({
                        seasonNumber: Number(s?.seasonNumber ?? s?.season_number) || 0,
                        name: s?.name || `Season ${s?.seasonNumber ?? s?.season_number}`,
                        episodeCount: Number(s?.episodeCount ?? s?.episode_count) || 0,
                    }))
                    : [];
            } catch {
                dto.tvSeasons = dto.seasons.map((s) => ({
                    seasonNumber: s.seasonNumber,
                    name: s.seasonNumber === 0 ? 'Specials' : `Season ${s.seasonNumber}`,
                    episodeCount: 0,
                }));
            }
        }

        return dto;
    };

    const listServiceServers = async (config, type) => {
        const segment = type === 'movie' ? 'radarr' : 'sonarr';
        const servers = await fetchSeerrJson(config, `/api/v1/service/${segment}`);
        return (Array.isArray(servers) ? servers : []).map((s) => ({
            id: s.id,
            name: s.name,
            is4k: !!s.is4k,
            isDefault: !!s.isDefault,
        }));
    };

    const getServiceOptions = async (config, type, serverId) => {
        const segment = type === 'movie' ? 'radarr' : 'sonarr';
        const data = await fetchSeerrJson(config, `/api/v1/service/${segment}/${encodeURIComponent(serverId)}`);
        const server = data?.server || {};
        return {
            server: {
                id: server.id,
                name: server.name,
                is4k: !!server.is4k,
                isDefault: !!server.isDefault,
                activeProfileId: server.activeProfileId ?? null,
                activeDirectory: server.activeDirectory || null,
                activeLanguageProfileId: server.activeLanguageProfileId ?? null,
                activeAnimeProfileId: server.activeAnimeProfileId ?? null,
                activeAnimeDirectory: server.activeAnimeDirectory || null,
                activeAnimeLanguageProfileId: server.activeAnimeLanguageProfileId ?? null,
            },
            profiles: (data?.profiles || []).map((p) => ({ id: p.id, name: p.name })),
            rootFolders: (data?.rootFolders || []).map((f) => ({
                id: f.id,
                path: f.path,
                freeSpace: f.freeSpace ?? null,
            })),
            languageProfiles: (data?.languageProfiles || []).map((lp) => ({ id: lp.id, name: lp.name })),
            tags: (data?.tags || []).map((t) => ({ id: t.id, label: t.label || t.name || String(t.id) })),
        };
    };

    const listRequestUsers = async (config) => {
        const payload = await fetchSeerrJson(config, '/api/v1/user?take=1000&sort=displayname');
        const results = Array.isArray(payload?.results) ? payload.results : [];
        return results.map((u) => ({
            id: u.id,
            displayName: u.displayName || u.username || u.email || `User #${u.id}`,
            email: u.email || null,
            avatar: u.avatar || null,
        }));
    };

    const getAdvancedRequestDefaults = async (config, { mediaType, tmdbId, userId, is4k }) => {
        try {
            return await fetchSeerrJson(config, '/api/v1/overrideRule/advancedRequest', {
                method: 'POST',
                body: {
                    mediaType: mediaType === 'tv' ? 'tv' : 'movie',
                    tmdbId: Number(tmdbId),
                    userId: Number(userId),
                    is4k: !!is4k,
                },
            });
        } catch {
            return null;
        }
    };

    const updateRequest = async (config, requestId, overrides, existingDetail = null) => {
        const detail = existingDetail || await getRequest(config, requestId);
        const body = buildSeerrUpdateBody(detail, overrides);
        if (detail.type === 'tv' && !Array.isArray(body.seasons)) {
            body.seasons = (detail.seasons || []).map((s) => s.seasonNumber);
        }
        return fetchSeerrJson(config, `/api/v1/request/${encodeURIComponent(requestId)}`, {
            method: 'PUT',
            body,
        });
    };

    const approveRequest = (config, requestId) => (
        fetchSeerrJson(config, `/api/v1/request/${encodeURIComponent(requestId)}/approve`, { method: 'POST' })
    );

    const approveRequestWithOptions = async (config, requestId, overrides = null) => {
        if (overrides && hasRequestOverrides(overrides)) {
            await updateRequest(config, requestId, overrides);
        }
        return approveRequest(config, requestId);
    };

    const declineRequest = (config, requestId, reason = '') => (
        fetchSeerrJson(config, `/api/v1/request/${encodeURIComponent(requestId)}/decline`, {
            method: 'POST',
            body: reason ? { reason } : {},
        })
    );

    const deleteRequest = (config, requestId) => (
        fetchSeerrJson(config, `/api/v1/request/${encodeURIComponent(requestId)}`, { method: 'DELETE' })
    );

    const retryRequest = (config, requestId) => (
        fetchSeerrJson(config, `/api/v1/request/${encodeURIComponent(requestId)}/retry`, { method: 'POST' })
    );

    return {
        listRequests,
        getRequestCounts,
        getRequest,
        listServiceServers,
        getServiceOptions,
        listRequestUsers,
        getAdvancedRequestDefaults,
        updateRequest,
        approveRequest,
        approveRequestWithOptions,
        declineRequest,
        deleteRequest,
        retryRequest,
        isRequestAppConfigured,
        isSeerrFamilyRequestApp,
    };
};
