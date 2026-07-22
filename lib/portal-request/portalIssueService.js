/**
 * Portal-native issues (Phase 8).
 * JSON store under config/issues — no Seerr issue APIs.
 */

import { buildTmdbBackdropUrl, buildTmdbPosterUrl } from '../request-app-service.js';
import {
    seerrIssueStatusLabel,
    seerrIssueTypeLabel,
    SeerrIssueStatus,
} from '../seerr-issue-service.js';
import { createTmdbClient } from './tmdbClient.js';
import { createJsonIssueStore } from './issueStore.js';

const ISSUE_STATUS_OPEN = SeerrIssueStatus.OPEN;
const ISSUE_STATUS_RESOLVED = SeerrIssueStatus.RESOLVED;

const filterIssueTab = (dto, filter) => {
    const status = Number(dto?.status);
    if (!filter || filter === 'all') return true;
    if (filter === 'open') return status === ISSUE_STATUS_OPEN;
    if (filter === 'resolved' || filter === 'closed') return status === ISSUE_STATUS_RESOLVED;
    return true;
};

const mapComment = (comment = {}) => ({
    id: comment.id != null ? Number(comment.id) : null,
    message: String(comment.message || ''),
    createdAt: comment.createdAt || null,
    updatedAt: comment.updatedAt || null,
    user: {
        id: comment.userId || comment.user?.id || null,
        displayName: comment.displayName || comment.user?.displayName || 'Member',
        avatar: comment.avatar || comment.user?.avatar || '',
    },
});

export const mapPortalIssueToDto = (record, user = {}) => {
    const status = Number(record?.status) || ISSUE_STATUS_OPEN;
    const posterPath = record?.posterPath || '';
    const backdropPath = record?.backdropPath || '';
    const comments = Array.isArray(record?.comments) ? record.comments.map(mapComment) : [];

    return {
        id: Number(record?.id),
        status,
        statusLabel: seerrIssueStatusLabel(status),
        issueType: Number(record?.issueType) || 4,
        issueTypeLabel: seerrIssueTypeLabel(record?.issueType),
        problemSeason: record?.problemSeason != null ? Number(record.problemSeason) : null,
        problemEpisode: record?.problemEpisode != null ? Number(record.problemEpisode) : null,
        type: record?.mediaType === 'tv' ? 'tv' : 'movie',
        title: record?.title || 'Unknown title',
        year: record?.year || null,
        overview: record?.overview || '',
        posterUrl: buildTmdbPosterUrl(posterPath),
        backdropUrl: buildTmdbBackdropUrl(backdropPath),
        posterPath: posterPath || null,
        tmdbId: Number(record?.tmdbId) || null,
        mediaId: null,
        createdAt: record?.createdAt || null,
        updatedAt: record?.updatedAt || null,
        createdBy: {
            id: record?.userId || user?.id || null,
            displayName: user?.username || user?.email || record?.meta?.createdByName || 'Member',
            email: user?.email || record?.meta?.createdByEmail || null,
            avatar: user?.thumb || user?.avatar || '',
        },
        modifiedBy: record?.meta?.modifiedBy || null,
        comments,
        commentCount: comments.length,
        seerrUrl: '',
        engine: 'portal',
    };
};

const fetchTitleMeta = async (config, mediaType, tmdbId) => {
    const apiKey = String(config?.tmdbApiKey || '').trim();
    if (!apiKey) {
        return {
            title: mediaType === 'tv' ? `TV ${tmdbId}` : `Movie ${tmdbId}`,
            year: null,
            overview: '',
            posterPath: null,
            backdropPath: null,
        };
    }
    try {
        const client = createTmdbClient({ tmdbApiKey: apiKey, language: 'en' });
        const details = mediaType === 'tv'
            ? await client.tv(tmdbId, { language: 'en' })
            : await client.movie(tmdbId, { language: 'en' });
        const title = mediaType === 'tv' ? (details?.name || `TV ${tmdbId}`) : (details?.title || `Movie ${tmdbId}`);
        const yearSource = mediaType === 'tv' ? details?.firstAirDate : details?.releaseDate;
        return {
            title,
            year: yearSource ? String(yearSource).slice(0, 4) : null,
            overview: details?.overview || '',
            posterPath: details?.posterPath || null,
            backdropPath: details?.backdropPath || null,
        };
    } catch {
        return {
            title: mediaType === 'tv' ? `TV ${tmdbId}` : `Movie ${tmdbId}`,
            year: null,
            overview: '',
            posterPath: null,
            backdropPath: null,
        };
    }
};

/**
 * @param {object} options
 * @param {string} options.dataDir
 * @param {object} options.config
 * @param {(id: string) => Promise<object|null>} [options.resolveUser]
 */
export const createPortalIssueService = ({
    dataDir,
    config,
    resolveUser = async () => null,
} = {}) => {
    const store = createJsonIssueStore({ dataDir });

    const enrichDto = async (record) => {
        const user = await resolveUser(record?.userId).catch(() => null);
        return mapPortalIssueToDto(record, user || {});
    };

    const createIssue = async (user, body = {}) => {
        const mediaType = body.mediaType === 'tv' ? 'tv' : 'movie';
        const tmdbId = Number(body.tmdbId ?? body.mediaId);
        if (!Number.isFinite(tmdbId) || tmdbId <= 0) {
            const err = new Error('Invalid tmdbId');
            err.status = 400;
            throw err;
        }
        const issueType = Number(body.issueType);
        if (![1, 2, 3, 4].includes(issueType)) {
            const err = new Error('Invalid issueType');
            err.status = 400;
            throw err;
        }
        const message = String(body.message || '').trim();
        if (message.length < 3) {
            const err = new Error('Please describe the issue (at least 3 characters).');
            err.status = 400;
            throw err;
        }

        const meta = await fetchTitleMeta(config, mediaType, tmdbId);
        const now = new Date().toISOString();
        const record = await store.create({
            userId: String(user?.id || ''),
            mediaType,
            tmdbId,
            title: meta.title,
            year: meta.year,
            overview: meta.overview,
            posterPath: meta.posterPath,
            backdropPath: meta.backdropPath,
            issueType,
            status: ISSUE_STATUS_OPEN,
            problemSeason: mediaType === 'tv' && body.problemSeason != null ? Number(body.problemSeason) : null,
            problemEpisode: mediaType === 'tv' && body.problemEpisode != null ? Number(body.problemEpisode) : null,
            comments: [{
                id: 1,
                message,
                createdAt: now,
                updatedAt: now,
                userId: String(user?.id || ''),
                displayName: user?.username || user?.email || 'Member',
                avatar: user?.thumb || user?.avatar || '',
            }],
            meta: {
                createdByName: user?.username || user?.email || null,
                createdByEmail: user?.email || null,
            },
        });

        return mapPortalIssueToDto(record, user);
    };

    const listMemberIssues = async (user, { filter = 'all', take = 20, skip = 0 } = {}) => {
        const records = await store.list({ userId: String(user?.id || '') });
        const dtos = [];
        for (const record of records) dtos.push(await enrichDto(record));
        const filtered = dtos.filter((item) => filterIssueTab(item, filter));
        return {
            userMapped: true,
            results: filtered.slice(skip, skip + take),
            pageInfo: { total: filtered.length, take, skip },
        };
    };

    const getMemberIssueCounts = async (user) => {
        const records = await store.list({ userId: String(user?.id || '') });
        let open = 0;
        let resolved = 0;
        for (const record of records) {
            if (Number(record.status) === ISSUE_STATUS_RESOLVED) resolved += 1;
            else open += 1;
        }
        return {
            userMapped: true,
            open,
            resolved,
            closed: resolved,
            total: records.length,
        };
    };

    const listIssues = async ({ filter = 'open', take = 20, skip = 0 } = {}) => {
        const records = await store.list();
        const dtos = [];
        for (const record of records) dtos.push(await enrichDto(record));
        const filtered = dtos.filter((item) => filterIssueTab(item, filter));
        const total = filtered.length;
        return {
            results: filtered.slice(skip, skip + take),
            pageInfo: {
                pages: Math.max(1, Math.ceil(total / Math.max(1, take))),
                page: Math.floor(skip / Math.max(1, take)) + 1,
                results: total,
            },
        };
    };

    const getIssueCounts = async () => {
        const records = await store.list();
        let open = 0;
        let resolved = 0;
        for (const record of records) {
            if (Number(record.status) === ISSUE_STATUS_RESOLVED) resolved += 1;
            else open += 1;
        }
        return { open, resolved, closed: resolved, total: records.length };
    };

    const getIssue = async (issueId) => {
        const record = await store.get(issueId);
        if (!record) {
            const err = new Error('Issue not found');
            err.status = 404;
            throw err;
        }
        return enrichDto(record);
    };

    const assertMemberOwnsIssue = async (user, issueId) => {
        const record = await store.get(issueId);
        if (!record) {
            const err = new Error('Issue not found');
            err.status = 404;
            throw err;
        }
        if (String(record.userId) !== String(user?.id || '')) {
            const err = new Error('You can only manage your own issues.');
            err.status = 403;
            throw err;
        }
        return { record, issue: await enrichDto(record) };
    };

    const addIssueComment = async (issueId, message, actor = null) => {
        const record = await store.get(issueId);
        if (!record) {
            const err = new Error('Issue not found');
            err.status = 404;
            throw err;
        }
        const text = String(message || '').trim();
        if (text.length < 1) {
            const err = new Error('Comment is required');
            err.status = 400;
            throw err;
        }
        const now = new Date().toISOString();
        const comments = Array.isArray(record.comments) ? [...record.comments] : [];
        const nextId = comments.reduce((max, c) => Math.max(max, Number(c.id) || 0), 0) + 1;
        comments.push({
            id: nextId,
            message: text,
            createdAt: now,
            updatedAt: now,
            userId: String(actor?.id || ''),
            displayName: actor?.username || actor?.email || 'Admin',
            avatar: actor?.thumb || actor?.avatar || '',
        });
        const updated = await store.update(issueId, {
            comments,
            meta: {
                ...(record.meta || {}),
                modifiedBy: actor ? {
                    id: actor.id,
                    displayName: actor.username || actor.email || 'Admin',
                } : (record.meta?.modifiedBy || null),
            },
        });
        return enrichDto(updated);
    };

    const updateIssueStatus = async (issueId, status, actor = null) => {
        const record = await store.get(issueId);
        if (!record) {
            const err = new Error('Issue not found');
            err.status = 404;
            throw err;
        }
        const nextStatus = String(status).toLowerCase() === 'resolved'
            ? ISSUE_STATUS_RESOLVED
            : ISSUE_STATUS_OPEN;
        const updated = await store.update(issueId, {
            status: nextStatus,
            meta: {
                ...(record.meta || {}),
                modifiedBy: actor ? {
                    id: actor.id,
                    displayName: actor.username || actor.email || 'Admin',
                } : (record.meta?.modifiedBy || null),
            },
        });
        return enrichDto(updated);
    };

    const deleteIssue = async (issueId) => {
        const removed = await store.remove(issueId);
        if (!removed) {
            const err = new Error('Issue not found');
            err.status = 404;
            throw err;
        }
        return true;
    };

    return {
        store,
        createIssue,
        listMemberIssues,
        getMemberIssueCounts,
        listIssues,
        getIssueCounts,
        getIssue,
        assertMemberOwnsIssue,
        addIssueComment,
        updateIssueStatus,
        deleteIssue,
    };
};

export default createPortalIssueService;
