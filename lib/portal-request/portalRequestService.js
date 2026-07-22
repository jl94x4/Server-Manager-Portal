/**
 * Portal-native request helpers (Phases 5–7).
 * Phase 5: create / list / cancel pending JSON requests.
 * Phase 6: admin approve → *arr push, decline / retry / delete.
 * Phase 7: sync mediaStatus / isDownloading from *arr.
 */

import {
    addRadarrMovie,
    addSonarrSeries,
    fetchArrInstance,
} from '../arr-service.js';
import {
    buildTmdbBackdropUrl,
    buildTmdbPosterUrl,
    buildMemberSeasonOptions,
    countMemberRequests,
    filterMemberRequestTab,
    seerrRequestStatusLabel,
} from '../request-app-service.js';
import { createTmdbClient } from './tmdbClient.js';
import { createJsonRequestStore } from './requestStore.js';
import { createLibraryAvailability } from './libraryAvailability.js';
import {
    getPortalArrServiceOptions,
    listPortalArrServers,
    resolvePortalArrInstance,
} from './portalArrServices.js';
import { evaluatePortalMemberQuota } from './portalQuota.js';
import { syncPortalRequestStatuses } from './requestStatusSync.js';

const REQUEST_STATUS_PENDING = 1;
const REQUEST_STATUS_APPROVED = 2;
const REQUEST_STATUS_DECLINED = 3;
const REQUEST_STATUS_FAILED = 4;

const ADMIN_FILTERS = new Set(['pending', 'approved', 'declined', 'processing', 'available', 'failed', 'all']);

const isPortalRequestAvailable = (dto) => {
    if (Number(dto?.status) !== REQUEST_STATUS_APPROVED) return false;
    if (dto?.isDownloading) return false;
    const mediaStatus = Number(dto?.mediaStatus);
    return mediaStatus === 4 || mediaStatus === 5;
};

const isPortalRequestProcessing = (dto) => {
    if (Number(dto?.status) !== REQUEST_STATUS_APPROVED) return false;
    if (isPortalRequestAvailable(dto)) return false;
    if (dto?.isDownloading) return true;
    const mediaStatus = Number(dto?.mediaStatus);
    return !Number.isFinite(mediaStatus) || mediaStatus === 3 || mediaStatus <= 0;
};

const filterAdminRequestTab = (dto, filter) => {
    const status = Number(dto?.status);
    if (!filter || filter === 'all') return true;
    if (filter === 'pending') return status === REQUEST_STATUS_PENDING;
    if (filter === 'declined') return status === REQUEST_STATUS_DECLINED;
    if (filter === 'failed') return status === REQUEST_STATUS_FAILED;
    if (filter === 'available') return isPortalRequestAvailable(dto);
    if (filter === 'processing') return isPortalRequestProcessing(dto);
    if (filter === 'approved') return status === REQUEST_STATUS_APPROVED && !isPortalRequestAvailable(dto);
    return true;
};

const countAdminRequests = (dtos = []) => {
    const counts = {
        pending: 0,
        approved: 0,
        declined: 0,
        processing: 0,
        available: 0,
        failed: 0,
        completed: 0,
        total: 0,
    };
    for (const item of dtos) {
        counts.total += 1;
        const status = Number(item?.status);
        if (status === REQUEST_STATUS_PENDING) counts.pending += 1;
        else if (status === REQUEST_STATUS_DECLINED) counts.declined += 1;
        else if (status === REQUEST_STATUS_FAILED) counts.failed += 1;
        else if (status === REQUEST_STATUS_APPROVED) {
            if (isPortalRequestAvailable(item)) {
                counts.available += 1;
                counts.completed += 1;
            } else {
                counts.approved += 1;
                if (isPortalRequestProcessing(item)) counts.processing += 1;
            }
        }
    }
    return counts;
};

const hasRequestOverrides = (overrides) => {
    if (!overrides || typeof overrides !== 'object') return false;
    return [
        'serverId',
        'profileId',
        'rootFolder',
        'languageProfileId',
        'userId',
        'tags',
        'seasons',
        'arrInstanceId',
    ].some((key) => overrides[key] != null && overrides[key] !== '');
};

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

    const displayName = user?.username || user?.email || user?.displayName || record?.meta?.requestedByName || 'Member';
    const canRetry = status === REQUEST_STATUS_FAILED
        || (status === REQUEST_STATUS_APPROVED && !!record?.meta?.arrError);

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
            displayName,
            email: user?.email || record?.meta?.requestedByEmail || null,
            avatar: user?.thumb || user?.avatar || '',
        },
        modifiedBy: record?.meta?.modifiedBy || null,
        declineReason: record?.meta?.declineReason || null,
        createdAt: record?.createdAt || null,
        updatedAt: record?.updatedAt || null,
        mediaStatus: record?.meta?.mediaStatus ?? null,
        isDownloading: !!record?.meta?.isDownloading,
        seerrUrl: '',
        tmdbId: Number(record?.tmdbId) || null,
        mediaId: record?.meta?.arrEntityId != null ? Number(record.meta.arrEntityId) : null,
        serverId: record?.serverId ?? null,
        profileId: record?.profileId ?? null,
        profileName: record?.meta?.profileName || null,
        rootFolder: record?.rootFolder || null,
        languageProfileId: record?.languageProfileId ?? null,
        tags: Array.isArray(record?.tags) ? record.tags : [],
        seasons,
        routingSummary: routingParts.length ? routingParts.join(' · ') : null,
        canRemove: true,
        canRetry,
        isAnime: !!record?.meta?.isAnime,
        posterPath: posterPath || null,
        canCancel: status === REQUEST_STATUS_PENDING,
        engine: 'portal',
        arrInstanceId: record?.arrInstanceId || record?.meta?.arrInstanceId || null,
        arrError: record?.meta?.arrError || null,
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

const applyOverridesToRecord = (record, overrides = {}) => {
    if (!hasRequestOverrides(overrides)) return record;
    const next = { ...record };
    if (overrides.serverId != null && overrides.serverId !== '') {
        next.serverId = Number(overrides.serverId);
    }
    if (overrides.arrInstanceId) next.arrInstanceId = String(overrides.arrInstanceId);
    if (overrides.profileId != null && overrides.profileId !== '') {
        next.profileId = Number(overrides.profileId);
        next.qualityProfile = Number(overrides.profileId);
    }
    if (overrides.rootFolder != null && overrides.rootFolder !== '') {
        next.rootFolder = String(overrides.rootFolder);
    }
    if (overrides.languageProfileId != null && overrides.languageProfileId !== '') {
        next.languageProfileId = Number(overrides.languageProfileId);
    }
    if (Array.isArray(overrides.tags)) {
        next.tags = overrides.tags.map((t) => Number(t)).filter((n) => Number.isFinite(n));
    }
    if (Array.isArray(overrides.seasons)) {
        next.seasons = overrides.seasons.map((n) => Number(n)).filter((n) => Number.isFinite(n));
    }
    if (overrides.userId != null && overrides.userId !== '') {
        next.userId = String(overrides.userId);
    }
    return next;
};

/**
 * @param {object} options
 * @param {string} options.dataDir
 * @param {object} options.config
 * @param {(url: string) => string} [options.resolveUrl]
 * @param {typeof fetch} [options.fetchImpl]
 * @param {(id: string) => Promise<object|null>} [options.resolveUser]
 * @param {() => Promise<object[]>} [options.listUsers]
 * @param {(mediaType: string, tmdbId: number) => Promise<boolean>} [options.isBlocked]
 */
export const createPortalRequestService = ({
    dataDir,
    config,
    resolveUrl = (url) => url,
    fetchImpl = fetch,
    resolveUser = async () => null,
    listUsers = async () => [],
    isBlocked = async () => false,
} = {}) => {
    const store = createJsonRequestStore({ dataDir });
    const fetchOpts = { resolveUrl, fetchImpl };

    const enrichDto = async (record) => {
        const user = await resolveUser(record?.userId).catch(() => null);
        return mapPortalRecordToDto(record, user || {});
    };

    const createMemberRequest = async (user, body = {}) => {
        const mediaType = body.mediaType === 'tv' ? 'tv' : 'movie';
        const tmdbId = Number(body.mediaId ?? body.tmdbId);
        if (!Number.isFinite(tmdbId) || tmdbId <= 0) {
            const err = new Error('Invalid mediaId');
            err.status = 400;
            throw err;
        }

        const meta = await fetchTitleMeta(config, mediaType, tmdbId);
        if (await isBlocked(mediaType, tmdbId).catch(() => false)) {
            const err = new Error('This title is blacklisted.');
            err.status = 403;
            throw err;
        }
        let arrInstanceId = body.arrInstanceId ? String(body.arrInstanceId) : null;
        let serverId = body.serverId != null ? Number(body.serverId) : null;
        if (!arrInstanceId && Number.isFinite(serverId)) {
            const instance = resolvePortalArrInstance(config, mediaType, serverId, null);
            if (instance) arrInstanceId = instance.id;
        }

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
            serverId: Number.isFinite(serverId) ? serverId : null,
            arrInstanceId,
            languageProfileId: body.languageProfileId,
            tags: body.tags,
            status: REQUEST_STATUS_PENDING,
            meta: {
                requestedByName: user?.username || user?.email || null,
                requestedByEmail: user?.email || null,
            },
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

    const listAdminRequests = async ({ filter = 'pending', take = 20, skip = 0 } = {}) => {
        const safeFilter = ADMIN_FILTERS.has(String(filter)) ? String(filter) : 'pending';
        const records = await store.list();
        const dtos = [];
        for (const record of records) {
            dtos.push(await enrichDto(record));
        }
        const filtered = dtos.filter((item) => filterAdminRequestTab(item, safeFilter));
        const page = filtered.slice(skip, skip + take);
        const total = filtered.length;
        const pages = Math.max(1, Math.ceil(total / Math.max(1, take)));
        return {
            results: page,
            pageInfo: {
                pages,
                page: Math.floor(skip / Math.max(1, take)) + 1,
                results: total,
            },
        };
    };

    const getAdminRequestCounts = async () => {
        const records = await store.list();
        const dtos = records.map((record) => mapPortalRecordToDto(record));
        return countAdminRequests(dtos);
    };

    const getAdminRequest = async (requestId) => {
        const record = await store.get(requestId);
        if (!record) {
            const err = new Error('Request not found');
            err.status = 404;
            throw err;
        }
        return enrichDto(record);
    };

    const listPortalRequestUsers = async () => {
        const users = await listUsers().catch(() => []);
        return (Array.isArray(users) ? users : []).map((user) => ({
            id: user?.id,
            displayName: user?.username || user?.email || `User ${user?.id}`,
            email: user?.email || null,
            username: user?.username || null,
            plexId: user?.plexId ?? user?.id ?? null,
            avatar: user?.thumb || user?.avatar || null,
        }));
    };

    const pushRecordToArr = async (record) => {
        const mediaType = record.mediaType === 'tv' ? 'tv' : 'movie';
        let profileId = record.profileId != null ? Number(record.profileId) : null;
        let rootFolder = record.rootFolder ? String(record.rootFolder) : '';
        let languageProfileId = record.languageProfileId != null ? Number(record.languageProfileId) : null;
        let tags = Array.isArray(record.tags) ? record.tags : [];

        const instance = resolvePortalArrInstance(
            config,
            mediaType,
            record.serverId,
            record.arrInstanceId,
        );
        if (!instance) {
            return {
                ok: false,
                reason: `No ${mediaType === 'tv' ? 'Sonarr' : 'Radarr'} instance is configured in the portal.`,
            };
        }

        // Fill missing routing from live *arr defaults.
        if (!Number.isFinite(profileId) || !rootFolder) {
            const options = await getPortalArrServiceOptions(config, mediaType, record.serverId, {
                ...fetchOpts,
                arrInstanceId: instance.id,
            });
            if (!Number.isFinite(profileId)) {
                profileId = Number(options.server?.activeProfileId ?? options.profiles[0]?.id);
            }
            if (!rootFolder) {
                rootFolder = String(options.server?.activeDirectory || options.rootFolders[0]?.path || '');
            }
            if (!Number.isFinite(languageProfileId) && options.languageProfiles?.length) {
                languageProfileId = Number(options.server?.activeLanguageProfileId ?? options.languageProfiles[0]?.id);
            }
        }

        const servers = listPortalArrServers(config, mediaType);
        const serverMeta = servers.find((entry) => entry.instanceId === instance.id);

        const pushResult = mediaType === 'tv'
            ? await addSonarrSeries(instance, {
                tmdbId: record.tmdbId,
                qualityProfileId: profileId,
                rootFolderPath: rootFolder,
                languageProfileId,
                tags,
                seasons: record.seasons === 'all' ? 'all' : (record.seasons || 'all'),
                search: true,
                ...fetchOpts,
            })
            : await addRadarrMovie(instance, {
                tmdbId: record.tmdbId,
                qualityProfileId: profileId,
                rootFolderPath: rootFolder,
                tags,
                search: true,
                ...fetchOpts,
            });

        if (!pushResult.ok) return pushResult;

        return {
            ok: true,
            created: !!pushResult.created,
            entity: pushResult.entity,
            instance,
            serverId: serverMeta?.id ?? record.serverId ?? null,
            profileId,
            rootFolder,
            languageProfileId,
        };
    };

    const updateAdminRequest = async (requestId, overrides = {}, adminUser = null) => {
        const existing = await store.get(requestId);
        if (!existing) {
            const err = new Error('Request not found');
            err.status = 404;
            throw err;
        }
        const patched = applyOverridesToRecord(existing, overrides);
        if (overrides?.arrInstanceId || overrides?.serverId != null) {
            const instance = resolvePortalArrInstance(
                config,
                patched.mediaType,
                patched.serverId,
                patched.arrInstanceId,
            );
            if (instance) patched.arrInstanceId = instance.id;
        }
        const updated = await store.update(requestId, {
            ...patched,
            meta: {
                ...(existing.meta || {}),
                ...(patched.meta || {}),
                modifiedBy: adminUser ? {
                    id: adminUser.id,
                    displayName: adminUser.username || adminUser.email || 'Admin',
                } : (existing.meta?.modifiedBy || null),
            },
        });
        return enrichDto(updated);
    };

    const approveAdminRequest = async (requestId, overrides = null, adminUser = null) => {
        let record = await store.get(requestId);
        if (!record) {
            const err = new Error('Request not found');
            err.status = 404;
            throw err;
        }

        if (hasRequestOverrides(overrides)) {
            await updateAdminRequest(requestId, overrides, adminUser);
            record = await store.get(requestId);
        }

        const pushResult = await pushRecordToArr(record);
        if (!pushResult.ok) {
            const failed = await store.update(requestId, {
                status: REQUEST_STATUS_FAILED,
                meta: {
                    ...(record.meta || {}),
                    arrError: pushResult.reason || 'Failed to push to *arr',
                    modifiedBy: adminUser ? {
                        id: adminUser.id,
                        displayName: adminUser.username || adminUser.email || 'Admin',
                    } : (record.meta?.modifiedBy || null),
                },
            });
            const err = new Error(pushResult.reason || 'Failed to push to *arr');
            err.status = 502;
            err.request = await enrichDto(failed);
            throw err;
        }

        const approved = await store.update(requestId, {
            status: REQUEST_STATUS_APPROVED,
            serverId: pushResult.serverId ?? record.serverId,
            arrInstanceId: pushResult.instance?.id || record.arrInstanceId,
            profileId: pushResult.profileId ?? record.profileId,
            qualityProfile: pushResult.profileId ?? record.qualityProfile,
            rootFolder: pushResult.rootFolder || record.rootFolder,
            languageProfileId: pushResult.languageProfileId ?? record.languageProfileId,
            meta: {
                ...(record.meta || {}),
                arrError: null,
                arrEntityId: pushResult.entity?.id ?? null,
                arrInstanceId: pushResult.instance?.id || null,
                arrInstanceName: pushResult.instance?.name || null,
                arrCreated: !!pushResult.created,
                mediaStatus: 3,
                isDownloading: true,
                modifiedBy: adminUser ? {
                    id: adminUser.id,
                    displayName: adminUser.username || adminUser.email || 'Admin',
                } : (record.meta?.modifiedBy || null),
            },
        });

        return enrichDto(approved);
    };

    const declineAdminRequest = async (requestId, reason = '', adminUser = null) => {
        const record = await store.get(requestId);
        if (!record) {
            const err = new Error('Request not found');
            err.status = 404;
            throw err;
        }
        const declined = await store.update(requestId, {
            status: REQUEST_STATUS_DECLINED,
            meta: {
                ...(record.meta || {}),
                declineReason: String(reason || '').trim() || null,
                modifiedBy: adminUser ? {
                    id: adminUser.id,
                    displayName: adminUser.username || adminUser.email || 'Admin',
                } : (record.meta?.modifiedBy || null),
            },
        });
        return enrichDto(declined);
    };

    const deleteAdminRequest = async (requestId) => {
        const removed = await store.remove(requestId);
        if (!removed) {
            const err = new Error('Request not found');
            err.status = 404;
            throw err;
        }
        return true;
    };

    const retryAdminRequest = async (requestId, adminUser = null) => {
        const record = await store.get(requestId);
        if (!record) {
            const err = new Error('Request not found');
            err.status = 404;
            throw err;
        }
        const status = Number(record.status);
        if (status !== REQUEST_STATUS_FAILED && status !== REQUEST_STATUS_APPROVED) {
            const err = new Error('Only failed or approved requests can be retried.');
            err.status = 400;
            throw err;
        }
        return approveAdminRequest(requestId, null, adminUser);
    };

    const retryMemberRequest = async (user, requestId) => {
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
        return retryAdminRequest(requestId, user);
    };

    const createPortalTag = async ({ mediaType, label, serverName = '', serverId = null }) => {
        const cleanLabel = String(label || '').trim();
        if (!cleanLabel) {
            const err = new Error('Tag label is required');
            err.status = 400;
            throw err;
        }
        const instance = resolvePortalArrInstance(config, mediaType, serverId, null)
            || (() => {
                const servers = listPortalArrServers(config, mediaType);
                const nameKey = String(serverName || '').trim().toLowerCase();
                const match = nameKey
                    ? servers.find((s) => String(s.name || '').toLowerCase() === nameKey)
                    : servers.find((s) => s.isDefault) || servers[0];
                return match ? resolvePortalArrInstance(config, mediaType, match.id, match.instanceId) : null;
            })();
        if (!instance) {
            const err = new Error('No matching *arr instance is configured.');
            err.status = 400;
            throw err;
        }

        const created = await fetchArrInstance(instance, '/api/v3/tag', {
            ...fetchOpts,
            method: 'POST',
            body: { label: cleanLabel },
        });
        if (created?.ok && created.data?.id != null) {
            return { id: Number(created.data.id), label: String(created.data.label || cleanLabel) };
        }

        const listed = await fetchArrInstance(instance, '/api/v3/tag', fetchOpts);
        const tags = Array.isArray(listed?.data) ? listed.data : [];
        const existing = tags.find((tag) => (
            String(tag?.label || '').trim().toLowerCase() === cleanLabel.toLowerCase()
        ));
        if (existing?.id != null) {
            return { id: Number(existing.id), label: String(existing.label || cleanLabel) };
        }
        const err = new Error(created?.data?.message || 'Failed to create tag in *arr');
        err.status = created?.status || 502;
        throw err;
    };

    /**
     * Member request modal payload (Seerr-shaped) without calling Seerr.
     * TMDB supplies title/overview/poster/seasons; *arr supplies library season status.
     */
    const getMemberRequestOptions = async (user, { mediaType, mediaId } = {}) => {
        const type = mediaType === 'tv' ? 'tv' : 'movie';
        const tmdbId = Number(mediaId);
        if (!Number.isFinite(tmdbId) || tmdbId <= 0) {
            const err = new Error('Invalid mediaId');
            err.status = 400;
            throw err;
        }

        const apiKey = String(config?.tmdbApiKey || '').trim();
        if (!apiKey) {
            const err = new Error('TMDB API key is required for portal request options.');
            err.status = 400;
            throw err;
        }

        const client = createTmdbClient({ tmdbApiKey: apiKey, language: 'en' });
        const details = type === 'tv'
            ? await client.tv(tmdbId, { language: 'en' })
            : await client.movie(tmdbId, { language: 'en' });

        const library = createLibraryAvailability(config, {
            resolveUrl,
            fetchImpl,
            upgraderItems: [],
        });
        const statusPayload = await library.getMediaStatus(type, tmdbId).catch(() => null);
        const mediaInfo = statusPayload?.mediaInfo && typeof statusPayload.mediaInfo === 'object'
            ? { ...statusPayload.mediaInfo }
            : {};

        const related = await store.list({ mediaType: type, tmdbId });
        const portalRequestRows = related
            .filter((row) => Number(row?.status) !== REQUEST_STATUS_DECLINED)
            .map((row) => {
                let seasons = [];
                if (type === 'tv') {
                    if (row.seasons === 'all') {
                        seasons = (details?.seasons || [])
                            .map((s) => Number(s?.seasonNumber))
                            .filter((n) => Number.isFinite(n) && n >= 0)
                            .map((seasonNumber) => ({ seasonNumber }));
                    } else if (Array.isArray(row.seasons)) {
                        seasons = row.seasons
                            .map((n) => Number(n))
                            .filter((n) => Number.isFinite(n))
                            .map((seasonNumber) => ({ seasonNumber }));
                    }
                }
                return {
                    id: row.id,
                    status: Number(row.status) || REQUEST_STATUS_PENDING,
                    is4k: !!row.is4k,
                    seasons,
                };
            });
        mediaInfo.requests = [
            ...(Array.isArray(mediaInfo.requests) ? mediaInfo.requests : []),
            ...portalRequestRows,
        ];

        const servers = listPortalArrServers(config, type);
        const has4kServer = servers.some((server) => !!server.is4k);
        const hasHdServer = servers.some((server) => !server.is4k) || (servers.length > 0 && !has4kServer);
        const memberRecords = await store.list({ userId: String(user?.id || '') });
        const quotaEval = evaluatePortalMemberQuota(config, memberRecords);

        const seasons = type === 'tv' ? buildMemberSeasonOptions(details, mediaInfo) : [];
        let mediaStatus = Number(mediaInfo?.status ?? statusPayload?.status) || null;
        const blocked = await isBlocked(type, tmdbId).catch(() => false);
        if (blocked) mediaStatus = 6;
        const isBlacklisted = mediaStatus === 6 || blocked;

        let blockReason = null;
        let canRequest = !isBlacklisted && servers.length > 0;
        if (isBlacklisted) blockReason = 'This title is blacklisted.';
        else if (!servers.length) {
            blockReason = type === 'tv'
                ? 'No Sonarr instance is configured.'
                : 'No Radarr instance is configured.';
        }

        if (canRequest && type === 'movie') {
            if (mediaStatus === 5) {
                canRequest = false;
                blockReason = blockReason || 'This movie is already available.';
            } else if (mediaStatus === 2 || mediaStatus === 3) {
                canRequest = false;
                blockReason = blockReason || 'This title is already requested or downloading.';
            }
        } else if (canRequest && type === 'tv') {
            const requestableCount = seasons.filter((s) => s.requestable).length;
            if (requestableCount === 0) {
                canRequest = false;
                blockReason = blockReason || 'All seasons are already requested or available.';
            }
        }

        if (
            canRequest
            && quotaEval.standardQuotaBlocked
            && (!has4kServer || quotaEval.fourKQuotaBlocked)
        ) {
            canRequest = false;
            blockReason = `You have used all ${quotaEval.quota.standard.limit} requests for this period.`;
        }

        const title = type === 'tv'
            ? (details?.name || details?.title || '')
            : (details?.title || details?.name || '');

        return {
            mediaType: type,
            tmdbId,
            title,
            overview: details?.overview || '',
            mediaStatus: Number.isFinite(mediaStatus) ? mediaStatus : null,
            isBlacklisted,
            isAnime: !!details?.isAnime,
            canRequest,
            canRequest4k: has4kServer,
            canRequestAdvanced: servers.length > 0,
            canCreateIssues: true,
            has4kServer,
            hasHdServer,
            standardQuotaBlocked: quotaEval.standardQuotaBlocked,
            fourKQuotaBlocked: quotaEval.fourKQuotaBlocked,
            seerrUserId: null,
            servers,
            permissions: {
                request: true,
                request4k: has4kServer,
                requestAdvanced: servers.length > 0,
                createIssues: true,
            },
            quota: quotaEval.quota,
            seasons,
            userMapped: true,
            blockReason,
            posterPath: details?.posterPath || null,
            engine: 'portal',
        };
    };

    return {
        store,
        createMemberRequest,
        listMemberRequests,
        getMemberRequestCounts,
        cancelMemberRequest,
        listAdminRequests,
        getAdminRequestCounts,
        getAdminRequest,
        listPortalRequestUsers,
        updateAdminRequest,
        approveAdminRequest,
        declineAdminRequest,
        deleteAdminRequest,
        retryAdminRequest,
        retryMemberRequest,
        createPortalTag,
        getMemberRequestOptions,
        listPortalArrServers: (type) => listPortalArrServers(config, type),
        getPortalArrServiceOptions: (type, serverId) => getPortalArrServiceOptions(config, type, serverId, fetchOpts),
        syncRequestStatuses: () => syncPortalRequestStatuses({
            config,
            store,
            resolveUrl,
            fetchImpl,
        }),
    };
};

export default createPortalRequestService;
