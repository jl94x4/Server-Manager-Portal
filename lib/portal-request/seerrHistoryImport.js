/**
 * One-shot Seerr → portal JSON migration (Phase 9 slice).
 * Copies request + issue history into config/requests and config/issues.
 */

import {
    enrichSeerrRequestResults,
    resolveSeerrRequestType,
} from '../request-app-service.js';
import { createJsonRequestStore } from './requestStore.js';
import { createJsonIssueStore } from './issueStore.js';
import { createJsonBlocklistStore } from './blocklistStore.js';

const norm = (value) => String(value || '').trim().toLowerCase();

const parseIso = (value, fallback = null) => {
    if (!value) return fallback;
    const ms = Date.parse(String(value));
    if (Number.isNaN(ms)) return fallback;
    return new Date(ms).toISOString();
};

/** Map a Seerr user onto a portal users.json entry id. */
export const resolvePortalUserFromSeerr = (seerrUser, portalUsers = []) => {
    if (!seerrUser || !Array.isArray(portalUsers) || !portalUsers.length) return null;
    const email = norm(seerrUser.email);
    const username = norm(seerrUser.username || seerrUser.displayName);
    const plexId = String(seerrUser.plexId ?? '').trim();

    for (const user of portalUsers) {
        if (email && user.email && norm(user.email) === email) return user;
        if (username) {
            if (user.username && norm(user.username) === username) return user;
            if (user.displayName && norm(user.displayName) === username) return user;
        }
        if (plexId && (String(user.plexId || '') === plexId || String(user.id || '') === plexId)) {
            return user;
        }
    }
    return null;
};

const mapSeasonsForStore = (reqItem, mediaType) => {
    if (mediaType !== 'tv') return [];
    const seasons = reqItem?.seasons;
    if (seasons === 'all') return 'all';
    if (!Array.isArray(seasons) || !seasons.length) return 'all';
    const numbers = seasons
        .map((entry) => Number(entry?.seasonNumber ?? entry?.season_number ?? entry))
        .filter((n) => Number.isFinite(n) && n >= 0);
    return numbers.length ? numbers : 'all';
};

const extractPosterPath = (media = {}) => {
    const raw = media.posterPath || media.poster || '';
    if (!raw) return null;
    const path = String(raw);
    if (path.startsWith('http://') || path.startsWith('https://')) {
        const match = path.match(/\/t\/p\/[^/]+(\/.+)$/);
        return match ? match[1] : null;
    }
    return path.startsWith('/') ? path : `/${path}`;
};

const extractBackdropPath = (media = {}) => {
    const raw = media.backdropPath || media.backdrop || '';
    if (!raw) return null;
    const path = String(raw);
    if (path.startsWith('http://') || path.startsWith('https://')) {
        const match = path.match(/\/t\/p\/[^/]+(\/.+)$/);
        return match ? match[1] : null;
    }
    return path.startsWith('/') ? path : `/${path}`;
};

const pageSeerrAll = async (fetchPage, { maxItems = 5000, pageSize = 50 } = {}) => {
    const all = [];
    let skip = 0;
    while (all.length < maxItems) {
        const payload = await fetchPage(pageSize, skip);
        const batch = Array.isArray(payload?.results) ? payload.results : [];
        if (!batch.length) break;
        all.push(...batch);
        skip += batch.length;
        const total = Number(payload?.pageInfo?.results);
        if (Number.isFinite(total) && total >= 0 && skip >= total) break;
        if (batch.length < pageSize) break;
    }
    return all.slice(0, maxItems);
};

/**
 * @param {object} options
 * @param {object} options.config
 * @param {(config: object, path: string, opts?: object) => Promise<any>} options.fetchSeerrJson
 * @param {string} options.requestsDir
 * @param {string} options.issuesDir
 * @param {string} [options.blocklistDir]
 * @param {object[]} options.portalUsers
 * @param {boolean} [options.includeIssues]
 * @param {boolean} [options.includeBlocklist]
 * @param {number} [options.maxRequests]
 * @param {number} [options.maxIssues]
 * @param {number} [options.maxBlocklist]
 */
export const importSeerrHistoryToPortal = async ({
    config,
    fetchSeerrJson,
    requestsDir,
    issuesDir,
    blocklistDir = '',
    portalUsers = [],
    includeIssues = true,
    includeBlocklist = true,
    maxRequests = 5000,
    maxIssues = 2000,
    maxBlocklist = 5000,
} = {}) => {
    if (typeof fetchSeerrJson !== 'function') {
        throw new Error('fetchSeerrJson is required');
    }
    if (!requestsDir) throw new Error('requestsDir is required');

    const requestStore = createJsonRequestStore({ dataDir: requestsDir });
    const existingRequests = await requestStore.list();
    const importedSeerrRequestIds = new Set(
        existingRequests
            .map((row) => row?.meta?.seerrRequestId)
            .filter((id) => id != null)
            .map((id) => String(id)),
    );
    // Also dedupe by user+title key when seerr id missing on older portal rows.
    const existingRequestKeys = new Set(
        existingRequests.map((row) => (
            `${row.userId}|${row.mediaType}|${row.tmdbId}|${row.is4k ? '4k' : 'hd'}`
        )),
    );

    const summary = {
        requests: { scanned: 0, imported: 0, skippedExisting: 0, skippedUnmapped: 0, skippedInvalid: 0 },
        issues: { scanned: 0, imported: 0, skippedExisting: 0, skippedUnmapped: 0, skippedInvalid: 0 },
        blocklist: { scanned: 0, imported: 0, skippedExisting: 0, skippedUnmapped: 0, skippedInvalid: 0 },
    };

    const rawRequests = await pageSeerrAll(
        async (take, skip) => {
            const params = new URLSearchParams({
                take: String(take),
                skip: String(skip),
                sort: 'added',
                filter: 'all',
            });
            return fetchSeerrJson(config, `/api/v1/request?${params.toString()}`);
        },
        { maxItems: maxRequests },
    );

    // Enrich posters/titles in chunks so sparse Seerr media payloads still store art.
    const CHUNK = 40;
    const enrichedRequests = [];
    for (let i = 0; i < rawRequests.length; i += CHUNK) {
        const slice = rawRequests.slice(i, i + CHUNK);
        const enriched = await enrichSeerrRequestResults(fetchSeerrJson, config, slice);
        enrichedRequests.push(...enriched);
    }

    for (const reqItem of enrichedRequests) {
        summary.requests.scanned += 1;
        const seerrId = reqItem?.id;
        if (seerrId != null && importedSeerrRequestIds.has(String(seerrId))) {
            summary.requests.skippedExisting += 1;
            continue;
        }

        const media = reqItem?.media || {};
        const mediaType = resolveSeerrRequestType(reqItem, media);
        const tmdbId = Number(media.tmdbId);
        if (!Number.isFinite(tmdbId) || tmdbId <= 0) {
            summary.requests.skippedInvalid += 1;
            continue;
        }

        const seerrUser = reqItem?.requestedBy || {};
        const portalUser = resolvePortalUserFromSeerr(seerrUser, portalUsers);
        if (!portalUser?.id) {
            summary.requests.skippedUnmapped += 1;
            continue;
        }

        const userId = String(portalUser.id);
        const is4k = !!reqItem?.is4k;
        const dedupeKey = `${userId}|${mediaType}|${tmdbId}|${is4k ? '4k' : 'hd'}`;
        if (existingRequestKeys.has(dedupeKey) && seerrId == null) {
            summary.requests.skippedExisting += 1;
            continue;
        }

        const title = media.title || media.name || 'Unknown title';
        const yearSource = media.releaseDate || media.firstAirDate || '';
        const status = Number.isFinite(Number(reqItem?.status)) ? Number(reqItem.status) : 1;

        await requestStore.create({
            userId,
            mediaType,
            tmdbId,
            title,
            year: yearSource ? String(yearSource).slice(0, 4) : null,
            overview: media.overview || '',
            posterPath: extractPosterPath(media),
            backdropPath: extractBackdropPath(media),
            is4k,
            seasons: mapSeasonsForStore(reqItem, mediaType),
            rootFolder: reqItem?.rootFolder != null ? String(reqItem.rootFolder) : null,
            qualityProfile: reqItem?.profileId != null ? Number(reqItem.profileId) : null,
            profileId: reqItem?.profileId != null ? Number(reqItem.profileId) : null,
            serverId: reqItem?.serverId != null ? Number(reqItem.serverId) : null,
            languageProfileId: reqItem?.languageProfileId != null ? Number(reqItem.languageProfileId) : null,
            tags: Array.isArray(reqItem?.tags)
                ? reqItem.tags.map((t) => Number(t)).filter((n) => Number.isFinite(n))
                : [],
            status,
            createdAt: parseIso(reqItem?.createdAt),
            updatedAt: parseIso(reqItem?.updatedAt, parseIso(reqItem?.createdAt)),
            meta: {
                seerrRequestId: seerrId != null ? Number(seerrId) : null,
                importedFromSeerr: true,
                importedAt: new Date().toISOString(),
                requestedByName: seerrUser.displayName || seerrUser.username || seerrUser.email || null,
                requestedByEmail: seerrUser.email || null,
                mediaStatus: media.status ?? null,
                isDownloading: false,
                profileName: reqItem?.profileName || null,
                declineReason: reqItem?.reason || reqItem?.declineReason || null,
                seerrMediaId: media.id != null ? Number(media.id) : null,
            },
        });

        if (seerrId != null) importedSeerrRequestIds.add(String(seerrId));
        existingRequestKeys.add(dedupeKey);
        summary.requests.imported += 1;
    }

    if (includeIssues && issuesDir) {
        const issueStore = createJsonIssueStore({ dataDir: issuesDir });
        const existingIssues = await issueStore.list();
        const importedSeerrIssueIds = new Set(
            existingIssues
                .map((row) => row?.meta?.seerrIssueId)
                .filter((id) => id != null)
                .map((id) => String(id)),
        );

        const rawIssues = await pageSeerrAll(
            async (take, skip) => {
                const params = new URLSearchParams({
                    take: String(take),
                    skip: String(skip),
                    sort: 'added',
                });
                return fetchSeerrJson(config, `/api/v1/issue?${params.toString()}`);
            },
            { maxItems: maxIssues },
        );

        for (const issue of rawIssues) {
            summary.issues.scanned += 1;
            const seerrId = issue?.id;
            if (seerrId != null && importedSeerrIssueIds.has(String(seerrId))) {
                summary.issues.skippedExisting += 1;
                continue;
            }

            const media = issue?.media || {};
            const mediaType = resolveSeerrRequestType({ type: media.mediaType ?? media.type }, media);
            const tmdbId = Number(media.tmdbId);
            if (!Number.isFinite(tmdbId) || tmdbId <= 0) {
                summary.issues.skippedInvalid += 1;
                continue;
            }

            const seerrUser = issue?.createdBy || {};
            const portalUser = resolvePortalUserFromSeerr(seerrUser, portalUsers);
            if (!portalUser?.id) {
                summary.issues.skippedUnmapped += 1;
                continue;
            }

            const title = media.title || media.name || 'Unknown title';
            const yearSource = media.releaseDate || media.firstAirDate || '';
            const comments = Array.isArray(issue?.comments)
                ? issue.comments.map((comment, index) => {
                    const commentUser = comment?.user || {};
                    const mapped = resolvePortalUserFromSeerr(commentUser, portalUsers);
                    return {
                        id: comment?.id != null ? Number(comment.id) : index + 1,
                        message: String(comment?.message || ''),
                        createdAt: parseIso(comment?.createdAt, new Date().toISOString()),
                        updatedAt: parseIso(comment?.updatedAt, parseIso(comment?.createdAt)),
                        userId: mapped?.id != null ? String(mapped.id) : String(portalUser.id),
                        displayName: commentUser.displayName || commentUser.username || portalUser.username || 'Member',
                        avatar: commentUser.avatar || '',
                    };
                })
                : [];

            await issueStore.create({
                userId: String(portalUser.id),
                mediaType,
                tmdbId,
                title,
                year: yearSource ? String(yearSource).slice(0, 4) : null,
                overview: media.overview || '',
                posterPath: extractPosterPath(media),
                backdropPath: extractBackdropPath(media),
                issueType: Number(issue?.issueType) || 4,
                status: Number.isFinite(Number(issue?.status)) ? Number(issue.status) : 1,
                problemSeason: issue?.problemSeason != null ? Number(issue.problemSeason) : null,
                problemEpisode: issue?.problemEpisode != null ? Number(issue.problemEpisode) : null,
                comments,
                createdAt: parseIso(issue?.createdAt),
                updatedAt: parseIso(issue?.updatedAt, parseIso(issue?.createdAt)),
                meta: {
                    seerrIssueId: seerrId != null ? Number(seerrId) : null,
                    importedFromSeerr: true,
                    importedAt: new Date().toISOString(),
                    createdByName: seerrUser.displayName || seerrUser.username || seerrUser.email || null,
                    createdByEmail: seerrUser.email || null,
                },
            });

            if (seerrId != null) importedSeerrIssueIds.add(String(seerrId));
            summary.issues.imported += 1;
        }
    }

    if (includeBlocklist && blocklistDir) {
        const blocklistStore = createJsonBlocklistStore({ dataDir: blocklistDir });
        const existingBlocklist = await blocklistStore.list({ filter: 'all' });
        const existingKeys = new Set(
            existingBlocklist.map((row) => `${row.mediaType}|${row.tmdbId}`),
        );
        const importedSeerrIds = new Set(
            existingBlocklist
                .map((row) => row?.meta?.seerrBlocklistId)
                .filter((id) => id != null)
                .map((id) => String(id)),
        );

        const fetchBlocklistPage = async (take, skip) => {
            const params = new URLSearchParams({
                take: String(take),
                skip: String(skip),
                filter: 'all',
            });
            try {
                return await fetchSeerrJson(config, `/api/v1/blocklist?${params.toString()}`);
            } catch (error) {
                const message = String(error?.message || '').toLowerCase();
                if (message.includes('404') || message.includes('not found')) {
                    return fetchSeerrJson(config, `/api/v1/blacklist?${params.toString()}`);
                }
                throw error;
            }
        };

        const rawBlocklist = await pageSeerrAll(fetchBlocklistPage, { maxItems: maxBlocklist });
        for (const item of rawBlocklist) {
            summary.blocklist.scanned += 1;
            const seerrId = item?.id;
            if (seerrId != null && importedSeerrIds.has(String(seerrId))) {
                summary.blocklist.skippedExisting += 1;
                continue;
            }

            const media = item?.media || {};
            const mediaType = resolveSeerrRequestType(
                { type: item?.mediaType ?? media.mediaType ?? media.type },
                media,
            );
            const tmdbId = Number(item?.tmdbId ?? media.tmdbId);
            if (!Number.isFinite(tmdbId) || tmdbId <= 0) {
                summary.blocklist.skippedInvalid += 1;
                continue;
            }

            const key = `${mediaType}|${tmdbId}`;
            if (existingKeys.has(key)) {
                summary.blocklist.skippedExisting += 1;
                continue;
            }

            const seerrUser = item?.user || {};
            const portalUser = resolvePortalUserFromSeerr(seerrUser, portalUsers);
            const title = item?.title || media.title || media.name || 'Unknown title';

            try {
                await blocklistStore.create({
                    tmdbId,
                    mediaType,
                    title,
                    year: null,
                    overview: media.overview || '',
                    posterPath: extractPosterPath(media) || extractPosterPath(item),
                    blocklistedTags: item?.blocklistedTags || null,
                    source: 'import',
                    addedByUserId: portalUser?.id != null ? String(portalUser.id) : '',
                    createdAt: parseIso(item?.createdAt),
                    meta: {
                        seerrBlocklistId: seerrId != null ? Number(seerrId) : null,
                        importedFromSeerr: true,
                        importedAt: new Date().toISOString(),
                        addedByName: seerrUser.displayName || seerrUser.username || seerrUser.email || null,
                    },
                });
                existingKeys.add(key);
                if (seerrId != null) importedSeerrIds.add(String(seerrId));
                summary.blocklist.imported += 1;
            } catch (error) {
                if (/already blocklisted/i.test(error?.message || '')) {
                    summary.blocklist.skippedExisting += 1;
                } else {
                    summary.blocklist.skippedInvalid += 1;
                }
            }
        }
    }

    return summary;
};

export default importSeerrHistoryToPortal;
