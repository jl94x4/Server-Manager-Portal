const TMDB_POSTER_SIZE = 'w342';

const buildTmdbPosterUrl = (posterPath, size = TMDB_POSTER_SIZE) => {
    if (!posterPath) return '';
    const raw = String(posterPath);
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    const path = raw.startsWith('/') ? raw : `/${raw}`;
    return `https://image.tmdb.org/t/p/${size}${path}`;
};

const buildSeerrPosterUrl = (baseUrl, posterPath, size = TMDB_POSTER_SIZE) => {
    if (!posterPath) return '';
    const raw = String(posterPath);
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    const path = raw.startsWith('/') ? raw : `/${raw}`;
    const cleanBase = String(baseUrl || '').replace(/\/$/, '');
    return `${cleanBase}/imageproxy/tmdb/t/p/${size}${path}`;
};

const buildRequestPosterUrl = (posterPath, seerrBaseUrl) => (
    buildTmdbPosterUrl(posterPath) || buildSeerrPosterUrl(seerrBaseUrl, posterPath)
);

const resolveBlocklistMediaType = (value) => {
    const raw = String(value || '').toLowerCase();
    if (raw === 'tv' || raw === '2') return 'tv';
    return 'movie';
};

const isMissingEndpointError = (error) => {
    const message = String(error?.message || '').toLowerCase();
    return message.includes('404') || message.includes('not found');
};

export const mapSeerrBlocklistItemToDto = (item, baseUrl) => {
    const user = item?.user || {};
    const media = item?.media || {};
    const posterPath = media.posterPath || media.poster || item?.posterPath || '';
    const cleanBase = String(baseUrl || '').replace(/\/$/, '');
    const mediaType = resolveBlocklistMediaType(item?.mediaType ?? media?.mediaType);

    return {
        id: item?.id ?? null,
        tmdbId: Number(item?.tmdbId) || null,
        mediaType,
        title: item?.title || media.title || media.name || 'Unknown title',
        createdAt: item?.createdAt || null,
        blocklistedTags: item?.blocklistedTags || null,
        posterUrl: buildRequestPosterUrl(posterPath, cleanBase),
        posterPath: posterPath || null,
        addedBy: {
            id: user.id ?? null,
            displayName: user.displayName || user.username || user.email || 'Unknown',
            avatar: user.avatar
                ? (String(user.avatar).startsWith('http')
                    ? user.avatar
                    : `${cleanBase}${String(user.avatar).startsWith('/') ? user.avatar : `/${user.avatar}`}`)
                : '',
        },
        seerrUrl: `${cleanBase}/${mediaType === 'tv' ? 'tv' : 'movie'}/${item?.tmdbId}`,
    };
};

export const createSeerrBlocklistService = ({
    fetchSeerrJson,
    getCredentials,
    listRequestUsers,
    resolveSeerrRequestUserId,
}) => {
    const fetchBlocklistJson = async (config, path, options = {}) => {
        try {
            return await fetchSeerrJson(config, path, options);
        } catch (error) {
            if (!isMissingEndpointError(error) || !path.includes('/blocklist')) throw error;
            const legacyPath = path.replace('/blocklist', '/blacklist');
            return fetchSeerrJson(config, legacyPath, options);
        }
    };

    const resolveActorSeerrUserId = async (config, sessionUser) => {
        const users = await listRequestUsers(config);
        const mapped = resolveSeerrRequestUserId(sessionUser, users);
        if (mapped) return mapped;
        const fallback = users.find((user) => Number(user.id) === 1) || users[0];
        if (!fallback?.id) {
            throw new Error('No Seerr user available to attribute this blocklist action.');
        }
        return fallback.id;
    };

    const listBlocklistPage = async (config, {
        take = 25,
        skip = 0,
        search = '',
        filter = 'manual',
    } = {}) => {
        const params = new URLSearchParams({
            take: String(Math.min(50, Math.max(1, Number(take) || 25))),
            skip: String(Math.max(0, Number(skip) || 0)),
        });
        if (search) params.set('search', String(search).trim());
        if (filter === 'all' || filter === 'manual' || filter === 'blocklistedTags') {
            params.set('filter', filter);
        }
        return fetchBlocklistJson(config, `/api/v1/blocklist?${params.toString()}`);
    };

    const listBlocklist = async (config, { take = 30, skip = 0, search = '', filter = 'manual' } = {}) => {
        const { publicBaseUrl, baseUrl } = getCredentials(config);
        const linkBaseUrl = publicBaseUrl || baseUrl;
        const payload = await listBlocklistPage(config, { take, skip, search, filter });
        const results = Array.isArray(payload?.results) ? payload.results : [];
        const pageInfo = payload?.pageInfo || { pages: 1, results: results.length, page: 1 };
        return {
            results: results.map((item) => mapSeerrBlocklistItemToDto(item, linkBaseUrl)),
            pageInfo,
            total: Number(pageInfo.results) || results.length,
        };
    };

    const getBlocklistCount = async (config) => {
        const payload = await listBlocklistPage(config, { take: 1, skip: 0, filter: 'all' });
        return Number(payload?.pageInfo?.results) || 0;
    };

    const searchBlocklistCandidates = async (config, query) => {
        const trimmed = String(query || '').trim();
        if (!trimmed) return [];
        const payload = await fetchSeerrJson(config, `/api/v1/search?query=${encodeURIComponent(trimmed)}&page=1`);
        const results = Array.isArray(payload?.results) ? payload.results : [];
        return results
            .filter((item) => {
                const type = String(item?.mediaType || '').toLowerCase();
                return type === 'movie' || type === 'tv';
            })
            .map((item) => ({
                tmdbId: Number(item?.id) || null,
                mediaType: resolveBlocklistMediaType(item?.mediaType),
                title: item?.title || item?.name || 'Unknown title',
                year: item?.releaseDate
                    ? String(item.releaseDate).slice(0, 4)
                    : (item?.firstAirDate ? String(item.firstAirDate).slice(0, 4) : null),
                posterPath: item?.posterPath || null,
                overview: item?.overview || '',
            }))
            .filter((item) => item.tmdbId);
    };

    const addToBlocklist = async (config, sessionUser, { tmdbId, mediaType, title }) => {
        const normalizedType = resolveBlocklistMediaType(mediaType);
        const numericTmdbId = Number(tmdbId);
        if (!Number.isFinite(numericTmdbId) || numericTmdbId <= 0) {
            throw new Error('Valid TMDB ID is required.');
        }

        const userId = await resolveActorSeerrUserId(config, sessionUser);
        const body = {
            tmdbId: numericTmdbId,
            mediaType: normalizedType,
            user: userId,
        };
        if (title) body.title = String(title).trim();

        try {
            await fetchBlocklistJson(config, '/api/v1/blocklist', { method: 'POST', body });
        } catch (error) {
            const message = String(error?.message || '');
            if (message.includes('412') || /already blocklisted/i.test(message)) {
                throw new Error('This title is already blocklisted.');
            }
            throw error;
        }

        const { publicBaseUrl, baseUrl } = getCredentials(config);
        return mapSeerrBlocklistItemToDto({
            tmdbId: numericTmdbId,
            mediaType: normalizedType,
            title: body.title || '',
            createdAt: new Date().toISOString(),
            user: { id: userId, displayName: sessionUser?.username || 'Admin' },
        }, publicBaseUrl || baseUrl);
    };

    const removeFromBlocklist = async (config, tmdbId, mediaType) => {
        const normalizedType = resolveBlocklistMediaType(mediaType);
        const numericTmdbId = Number(tmdbId);
        if (!Number.isFinite(numericTmdbId) || numericTmdbId <= 0) {
            throw new Error('Valid TMDB ID is required.');
        }
        const params = new URLSearchParams({ mediaType: normalizedType });
        await fetchBlocklistJson(
            config,
            `/api/v1/blocklist/${encodeURIComponent(String(numericTmdbId))}?${params.toString()}`,
            { method: 'DELETE' },
        );
        return { success: true };
    };

    return {
        listBlocklist,
        getBlocklistCount,
        searchBlocklistCandidates,
        addToBlocklist,
        removeFromBlocklist,
    };
};
