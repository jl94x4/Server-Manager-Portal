/**
 * Portal-native member request helpers (Phase 5).
 * Persists pending requests in JSON; no *arr push until Phase 6.
 */

import {
    buildTmdbBackdropUrl,
    buildTmdbPosterUrl,
    countMemberRequests,
    filterMemberRequestTab,
    seerrRequestStatusLabel,
} from '../request-app-service.js';
import { createTmdbClient } from './tmdbClient.js';
import { createJsonRequestStore } from './requestStore.js';

const REQUEST_STATUS_PENDING = 1;

export const mapPortalRecordToDto = (record, user = {}) => {
    const status = Number(record?.status) || null;
    const posterPath = record?.posterPath || '';
    const backdropPath = record?.backdropPath || '';
    const seasons = record?.seasons === 'all'
        ? []
        : (Array.isArray(record?.seasons)
            ? record.seasons.map((seasonNumber) => ({ seasonNumber: Number(seasonNumber) }))
            : []);

    const routingParts = [];
    if (record?.profileId) routingParts.push(`Profile #${record.profileId}`);
    if (record?.rootFolder) routingParts.push(record.rootFolder);

    return {
        id: Number(record?.id),
        status,
        statusLabel: seerrRequestStatusLabel(status),
        type: record?.mediaType === 'tv' ? 'tv' : 'movie',
        is4k: !!record?.is4k,
        title: record?.title || 'Unknown title',
        year: record?.year || null,
        overview: record?.overview || '',
        posterUrl: buildTmdbPosterUrl(posterPath),
        backdropUrl: buildTmdbBackdropUrl(backdropPath),
        requestedBy: {
            id: record?.userId || user?.id || null,
            displayName: user?.username || user?.email || user?.displayName || 'Member',
            email: user?.email || null,
            avatar: user?.thumb || user?.avatar || '',
        },
        modifiedBy: null,
        declineReason: record?.meta?.declineReason || null,
        createdAt: record?.createdAt || null,
        updatedAt: record?.updatedAt || null,
        mediaStatus: null,
        isDownloading: false,
        seerrUrl: '',
        tmdbId: Number(record?.tmdbId) || null,
        mediaId: null,
        serverId: record?.serverId ?? null,
        profileId: record?.profileId ?? null,
        profileName: null,
        rootFolder: record?.rootFolder || null,
        languageProfileId: record?.languageProfileId ?? null,
        tags: Array.isArray(record?.tags) ? record.tags : [],
        seasons,
        routingSummary: routingParts.length ? routingParts.join(' · ') : null,
        canRemove: null,
        canRetry: false,
        isAnime: false,
        posterPath: posterPath || null,
        canCancel: status === REQUEST_STATUS_PENDING,
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
 */
export const createPortalRequestService = ({ dataDir, config }) => {
    const store = createJsonRequestStore({ dataDir });

    const createMemberRequest = async (user, body = {}) => {
        const mediaType = body.mediaType === 'tv' ? 'tv' : 'movie';
        const tmdbId = Number(body.mediaId ?? body.tmdbId);
        if (!Number.isFinite(tmdbId) || tmdbId <= 0) {
            const err = new Error('Invalid mediaId');
            err.status = 400;
            throw err;
        }

        const meta = await fetchTitleMeta(config, mediaType, tmdbId);
        const record = await store.create({
            userId: String(user?.id || ''),
            mediaType,
            tmdbId,
            title: meta.title,
            year: meta.year,
            overview: meta.overview,
            posterPath: meta.posterPath,
            backdropPath: meta.backdropPath,
            is4k: !!body.is4k,
            seasons: mediaType === 'tv' ? (body.seasons ?? 'all') : [],
            rootFolder: body.rootFolder,
            qualityProfile: body.profileId,
            profileId: body.profileId,
            serverId: body.serverId,
            arrInstanceId: body.arrInstanceId || null,
            languageProfileId: body.languageProfileId,
            tags: body.tags,
            status: REQUEST_STATUS_PENDING,
            meta: {},
        });

        return mapPortalRecordToDto(record, user);
    };

    const listMemberRequests = async (user, { filter = 'all', take = 20, skip = 0 } = {}) => {
        const records = await store.list({ userId: String(user?.id || '') });
        const dtos = records.map((record) => mapPortalRecordToDto(record, user));
        const filtered = dtos.filter((item) => filterMemberRequestTab(item, filter));
        const page = filtered.slice(skip, skip + take);
        return {
            userMapped: true,
            results: page,
            pageInfo: {
                total: filtered.length,
                take,
                skip,
            },
        };
    };

    const getMemberRequestCounts = async (user) => {
        const records = await store.list({ userId: String(user?.id || '') });
        const dtos = records.map((record) => mapPortalRecordToDto(record, user));
        return {
            userMapped: true,
            ...countMemberRequests(dtos),
        };
    };

    const cancelMemberRequest = async (user, requestId) => {
        const record = await store.get(requestId);
        if (!record) {
            const err = new Error('Request not found');
            err.status = 404;
            throw err;
        }
        if (String(record.userId) !== String(user?.id || '')) {
            const err = new Error('You can only manage your own requests.');
            err.status = 403;
            throw err;
        }
        if (Number(record.status) !== REQUEST_STATUS_PENDING) {
            const err = new Error('Only pending requests can be cancelled.');
            err.status = 400;
            throw err;
        }
        await store.remove(requestId);
        return true;
    };

    return {
        store,
        createMemberRequest,
        listMemberRequests,
        getMemberRequestCounts,
        cancelMemberRequest,
    };
};

export default createPortalRequestService;
