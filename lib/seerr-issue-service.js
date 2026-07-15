const TMDB_POSTER_SIZE = 'w342';
const TMDB_BACKDROP_SIZE = 'w1280';

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

const buildTmdbBackdropUrl = (backdropPath, size = TMDB_BACKDROP_SIZE) => {
    if (!backdropPath) return '';
    const raw = String(backdropPath);
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    const path = raw.startsWith('/') ? raw : `/${raw}`;
    return `https://image.tmdb.org/t/p/${size}${path}`;
};

const buildSeerrBackdropUrl = (baseUrl, backdropPath, size = TMDB_BACKDROP_SIZE) => {
    if (!backdropPath) return '';
    const raw = String(backdropPath);
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    const path = raw.startsWith('/') ? raw : `/${raw}`;
    const cleanBase = String(baseUrl || '').replace(/\/$/, '');
    return `${cleanBase}/imageproxy/tmdb/t/p/${size}${path}`;
};

const buildRequestPosterUrl = (posterPath, seerrBaseUrl) => (
    buildTmdbPosterUrl(posterPath) || buildSeerrPosterUrl(seerrBaseUrl, posterPath)
);

const buildRequestBackdropUrl = (backdropPath, seerrBaseUrl) => (
    buildTmdbBackdropUrl(backdropPath) || buildSeerrBackdropUrl(seerrBaseUrl, backdropPath)
);

const resolveIssueMediaType = (media = {}) => {
    const raw = media?.mediaType ?? media?.type;
    if (raw === 2 || raw === '2' || String(raw).toLowerCase() === 'tv') return 'tv';
    return 'movie';
};

export const SeerrIssueType = {
    VIDEO: 1,
    AUDIO: 2,
    SUBTITLES: 3,
    OTHER: 4,
};

export const SeerrIssueStatus = {
    OPEN: 1,
    RESOLVED: 2,
};

export const seerrIssueTypeLabel = (type) => {
    const value = Number(type);
    if (value === SeerrIssueType.VIDEO) return 'Video';
    if (value === SeerrIssueType.AUDIO) return 'Audio';
    if (value === SeerrIssueType.SUBTITLES) return 'Subtitles';
    if (value === SeerrIssueType.OTHER) return 'Other';
    return 'Unknown';
};

export const seerrIssueStatusLabel = (status) => {
    const value = Number(status);
    if (value === SeerrIssueStatus.OPEN) return 'open';
    if (value === SeerrIssueStatus.RESOLVED) return 'resolved';
    return 'unknown';
};

export const isOpenSeerrIssue = (issue) => Number(issue?.status) === SeerrIssueStatus.OPEN;

export const ISSUE_TYPE_OPTIONS = [
    { value: SeerrIssueType.VIDEO, label: 'Video' },
    { value: SeerrIssueType.AUDIO, label: 'Audio' },
    { value: SeerrIssueType.SUBTITLES, label: 'Subtitles' },
    { value: SeerrIssueType.OTHER, label: 'Other' },
];

export const mapSeerrIssueToDto = (issue, baseUrl) => {
    const media = issue?.media || {};
    const createdBy = issue?.createdBy || {};
    const modifiedBy = issue?.modifiedBy || {};
    const posterPath = media.posterPath || media.poster || '';
    const backdropPath = media.backdropPath || media.backdrop || '';
    const title = media.title || media.name || 'Unknown title';
    const yearSource = media.releaseDate || media.firstAirDate || '';
    const cleanBase = String(baseUrl || '').replace(/\/$/, '');
    const type = resolveIssueMediaType(media);
    const comments = Array.isArray(issue?.comments)
        ? issue.comments.map((comment) => ({
            id: comment?.id ?? null,
            message: comment?.message || '',
            createdAt: comment?.createdAt || null,
            updatedAt: comment?.updatedAt || null,
            user: {
                id: comment?.user?.id ?? null,
                displayName: comment?.user?.displayName || comment?.user?.username || 'Unknown',
                avatar: comment?.user?.avatar
                    ? (String(comment.user.avatar).startsWith('http')
                        ? comment.user.avatar
                        : `${cleanBase}${String(comment.user.avatar).startsWith('/') ? comment.user.avatar : `/${comment.user.avatar}`}`)
                    : '',
            },
        }))
        : [];

    return {
        id: issue?.id,
        status: Number(issue?.status) || null,
        statusLabel: seerrIssueStatusLabel(issue?.status),
        issueType: Number(issue?.issueType) || null,
        issueTypeLabel: seerrIssueTypeLabel(issue?.issueType),
        problemSeason: Number(issue?.problemSeason) || null,
        problemEpisode: Number(issue?.problemEpisode) || null,
        type,
        title,
        year: yearSource ? String(yearSource).slice(0, 4) : null,
        overview: media.overview || '',
        posterUrl: buildRequestPosterUrl(posterPath, cleanBase),
        backdropUrl: buildRequestBackdropUrl(backdropPath, cleanBase),
        posterPath: posterPath || null,
        tmdbId: Number(media.tmdbId) || null,
        mediaId: Number(media.id) || null,
        createdAt: issue?.createdAt || null,
        updatedAt: issue?.updatedAt || null,
        createdBy: {
            id: createdBy.id || null,
            displayName: createdBy.displayName || createdBy.username || createdBy.email || 'Unknown',
            email: createdBy.email || null,
            avatar: createdBy.avatar
                ? (String(createdBy.avatar).startsWith('http')
                    ? createdBy.avatar
                    : `${cleanBase}${String(createdBy.avatar).startsWith('/') ? createdBy.avatar : `/${createdBy.avatar}`}`)
                : '',
        },
        modifiedBy: modifiedBy.id ? {
            id: modifiedBy.id,
            displayName: modifiedBy.displayName || modifiedBy.username || 'Unknown',
        } : null,
        comments,
        commentCount: comments.length,
        seerrUrl: `${cleanBase}/issues/${issue?.id}`,
    };
};

export const createSeerrIssueService = ({
    fetchSeerrJson,
    resolveMemberSeerrUserId,
    getCredentials,
}) => {
    const listIssuePage = async (config, { filter = 'all', take = 20, skip = 0, sort = 'added' } = {}) => {
        const params = new URLSearchParams({
            take: String(Math.min(50, Math.max(1, Number(take) || 20))),
            skip: String(Math.max(0, Number(skip) || 0)),
            sort: sort === 'modified' ? 'modified' : 'added',
        });
        if (filter === 'open' || filter === 'resolved') params.set('filter', filter);
        return fetchSeerrJson(config, `/api/v1/issue?${params.toString()}`);
    };

    const issueBelongsToUser = (issue, userId) => (
        Number(issue?.createdBy?.id) === Number(userId)
    );

    const matchesMemberIssueFilter = (issue, filter) => {
        if (filter === 'open') return isOpenSeerrIssue(issue);
        if (filter === 'resolved') return !isOpenSeerrIssue(issue);
        return true;
    };

    const collectMemberIssues = async (config, userId, { filter = 'all', take = 20, skip = 0 } = {}) => {
        const matched = [];
        let pageSkip = 0;
        const pageSize = 50;
        const apiFilter = filter === 'open' || filter === 'resolved' ? filter : 'all';

        for (let page = 0; page < 50 && matched.length < skip + take; page += 1) {
            const payload = await listIssuePage(config, {
                filter: apiFilter,
                take: pageSize,
                skip: pageSkip,
            });
            const results = Array.isArray(payload?.results) ? payload.results : [];
            if (!results.length) break;

            for (const item of results) {
                if (!issueBelongsToUser(item, userId)) continue;
                if (!matchesMemberIssueFilter(item, filter)) continue;
                matched.push(item);
            }

            pageSkip += results.length;
            const total = Number(payload?.pageInfo?.results);
            if (Number.isFinite(total) && total >= 0 && pageSkip >= total) break;
            if (results.length < pageSize) break;
        }

        return matched.slice(skip, skip + take);
    };

    const fetchAllMemberIssues = async (config, userId, { maxItems = 500 } = {}) => {
        const all = [];
        let pageSkip = 0;
        const pageSize = 50;

        while (all.length < maxItems) {
            const payload = await listIssuePage(config, { filter: 'all', take: pageSize, skip: pageSkip });
            const results = Array.isArray(payload?.results) ? payload.results : [];
            if (!results.length) break;

            for (const item of results) {
                if (issueBelongsToUser(item, userId)) all.push(item);
            }

            pageSkip += results.length;
            const total = Number(payload?.pageInfo?.results);
            if (Number.isFinite(total) && total >= 0 && pageSkip >= total) break;
            if (results.length < pageSize) break;
        }

        return all.slice(0, maxItems);
    };

    const getIssueCounts = async (config) => {
        const payload = await fetchSeerrJson(config, '/api/v1/issue/count');
        return {
            total: Number(payload?.total) || 0,
            open: Number(payload?.open) || 0,
            closed: Number(payload?.closed) || 0,
            video: Number(payload?.video) || 0,
            audio: Number(payload?.audio) || 0,
            subtitles: Number(payload?.subtitles) || 0,
            others: Number(payload?.others) || 0,
        };
    };

    const listIssues = async (config, { filter = 'open', take = 30, skip = 0, sort = 'added' } = {}) => {
        const { publicBaseUrl, baseUrl } = getCredentials(config);
        const linkBaseUrl = publicBaseUrl || baseUrl;
        const payload = await listIssuePage(config, { filter, take, skip, sort });
        const results = Array.isArray(payload?.results) ? payload.results : [];
        return {
            results: results.map((item) => mapSeerrIssueToDto(item, linkBaseUrl)),
            pageInfo: payload?.pageInfo || { pages: 1, results: results.length, page: 1 },
        };
    };

    const listMemberIssues = async (config, sessionUser, { filter = 'all', take = 20, skip = 0 } = {}) => {
        const { publicBaseUrl, baseUrl } = getCredentials(config);
        const linkBaseUrl = publicBaseUrl || baseUrl;
        const userId = await resolveMemberSeerrUserId(config, sessionUser);
        if (!userId) {
            return {
                userMapped: false,
                results: [],
                pageInfo: { pages: 0, results: 0, page: 1 },
                error: 'Your portal account is not linked to a Seerr user.',
            };
        }

        const pageTake = Math.min(50, Math.max(1, Number(take) || 20));
        const pageSkip = Math.max(0, Number(skip) || 0);
        const filtered = await collectMemberIssues(config, userId, {
            filter,
            take: pageTake,
            skip: pageSkip,
        });

        return {
            userMapped: true,
            results: filtered.map((item) => mapSeerrIssueToDto(item, linkBaseUrl)),
            pageInfo: {
                pages: 1,
                results: filtered.length,
                page: Math.floor(pageSkip / pageTake) + 1,
            },
        };
    };

    const getMemberIssueCounts = async (config, sessionUser) => {
        const userId = await resolveMemberSeerrUserId(config, sessionUser);
        if (!userId) {
            return { userMapped: false, open: 0, resolved: 0, total: 0 };
        }

        const results = await fetchAllMemberIssues(config, userId);
        const open = results.filter(isOpenSeerrIssue).length;
        const resolved = results.length - open;
        return { userMapped: true, open, resolved, total: results.length };
    };

    const getIssue = async (config, issueId) => {
        const { publicBaseUrl, baseUrl } = getCredentials(config);
        const linkBaseUrl = publicBaseUrl || baseUrl;
        const raw = await fetchSeerrJson(config, `/api/v1/issue/${encodeURIComponent(issueId)}`);
        return mapSeerrIssueToDto(raw, linkBaseUrl);
    };

    const assertMemberOwnsIssue = async (config, sessionUser, issueId) => {
        const userId = await resolveMemberSeerrUserId(config, sessionUser);
        if (!userId) throw new Error('Your portal account is not linked to a Seerr user.');
        const issue = await getIssue(config, issueId);
        if (Number(issue?.createdBy?.id) !== Number(userId)) {
            throw new Error('You can only manage your own issues.');
        }
        return { userId, issue };
    };

    const createIssue = async (config, sessionUser, {
        mediaId,
        issueType,
        message,
        problemSeason = null,
        problemEpisode = null,
    }) => {
        const userId = await resolveMemberSeerrUserId(config, sessionUser);
        if (!userId) throw new Error('Your portal account is not linked to a Seerr user.');

        const body = {
            mediaId: Number(mediaId),
            issueType: Number(issueType),
            message: String(message || '').trim(),
            userId,
        };
        if (!body.message) throw new Error('Issue description is required.');
        if (!Number.isFinite(body.mediaId) || body.mediaId <= 0) throw new Error('Invalid media.');
        if (!Number.isFinite(body.issueType) || body.issueType < 1 || body.issueType > 4) {
            throw new Error('Invalid issue type.');
        }
        if (Number.isFinite(Number(problemSeason)) && Number(problemSeason) > 0) {
            body.problemSeason = Number(problemSeason);
        }
        if (Number.isFinite(Number(problemEpisode)) && Number(problemEpisode) > 0) {
            body.problemEpisode = Number(problemEpisode);
        }

        const raw = await fetchSeerrJson(config, '/api/v1/issue', { method: 'POST', body });
        const { publicBaseUrl, baseUrl } = getCredentials(config);
        return mapSeerrIssueToDto(raw, publicBaseUrl || baseUrl);
    };

    const addIssueComment = async (config, issueId, message) => {
        const trimmed = String(message || '').trim();
        if (!trimmed) throw new Error('Comment is required.');
        return fetchSeerrJson(config, `/api/v1/issue/${encodeURIComponent(issueId)}/comment`, {
            method: 'POST',
            body: { message: trimmed },
        });
    };

    const updateIssueStatus = async (config, issueId, status) => {
        const normalized = String(status || '').toLowerCase();
        if (normalized !== 'open' && normalized !== 'resolved') {
            throw new Error('Status must be open or resolved.');
        }
        return fetchSeerrJson(config, `/api/v1/issue/${encodeURIComponent(issueId)}/${normalized}`, {
            method: 'POST',
        });
    };

    const deleteIssue = async (config, issueId) => (
        fetchSeerrJson(config, `/api/v1/issue/${encodeURIComponent(issueId)}`, { method: 'DELETE' })
    );

    return {
        getIssueCounts,
        listIssues,
        listMemberIssues,
        getMemberIssueCounts,
        getIssue,
        createIssue,
        addIssueComment,
        updateIssueStatus,
        deleteIssue,
        assertMemberOwnsIssue,
    };
};
