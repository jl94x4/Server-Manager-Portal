/**
 * Portal-native blocklist (Phase 9).
 * JSON under config/blocklist — no Seerr blocklist APIs.
 */

import { buildTmdbPosterUrl } from '../request-app-service.js';
import { createTmdbClient } from './tmdbClient.js';
import { createJsonBlocklistStore } from './blocklistStore.js';

const resolveMediaType = (value) => {
    const raw = String(value || '').toLowerCase();
    if (raw === 'tv' || raw === '2') return 'tv';
    return 'movie';
};

export const mapPortalBlocklistToDto = (record, user = {}) => {
    const mediaType = record?.mediaType === 'tv' ? 'tv' : 'movie';
    const posterPath = record?.posterPath || '';
    return {
        id: Number(record?.id) || record?.id || null,
        tmdbId: Number(record?.tmdbId) || null,
        mediaType,
        title: record?.title || 'Unknown title',
        createdAt: record?.createdAt || null,
        blocklistedTags: record?.blocklistedTags || null,
        posterUrl: buildTmdbPosterUrl(posterPath),
        posterPath: posterPath || null,
        addedBy: {
            id: record?.addedByUserId || user?.id || null,
            displayName: user?.username || user?.email || user?.displayName
                || record?.meta?.addedByName || 'Admin',
            avatar: user?.thumb || user?.avatar || '',
        },
        seerrUrl: '',
        engine: 'portal',
        source: record?.source || 'manual',
    };
};

/**
 * @param {object} options
 * @param {string} options.dataDir
 * @param {object} options.config
 * @param {(id: string) => Promise<object|null>} [options.resolveUser]
 */
export const createPortalBlocklistService = ({
    dataDir,
    config,
    resolveUser = async () => null,
} = {}) => {
    const store = createJsonBlocklistStore({ dataDir });

    const enrichDto = async (record) => {
        const user = await resolveUser(record?.addedByUserId).catch(() => null);
        return mapPortalBlocklistToDto(record, user || {});
    };

    const fetchTitleMeta = async (mediaType, tmdbId) => {
        const apiKey = String(config?.tmdbApiKey || '').trim();
        if (!apiKey) {
            return { title: mediaType === 'tv' ? `TV ${tmdbId}` : `Movie ${tmdbId}`, year: null, overview: '', posterPath: null };
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
            };
        } catch {
            return { title: mediaType === 'tv' ? `TV ${tmdbId}` : `Movie ${tmdbId}`, year: null, overview: '', posterPath: null };
        }
    };

    const listBlocklist = async ({ take = 30, skip = 0, search = '', filter = 'manual' } = {}) => {
        const all = await store.list({ search, filter });
        const pageTake = Math.min(50, Math.max(1, Number(take) || 30));
        const pageSkip = Math.max(0, Number(skip) || 0);
        const slice = all.slice(pageSkip, pageSkip + pageTake);
        const results = [];
        for (const record of slice) {
            results.push(await enrichDto(record));
        }
        return {
            results,
            pageInfo: {
                pages: Math.max(1, Math.ceil(all.length / pageTake)),
                results: all.length,
                page: Math.floor(pageSkip / pageTake) + 1,
            },
            total: all.length,
        };
    };

    const getBlocklistCount = async () => {
        const all = await store.list({ filter: 'all' });
        return all.length;
    };

    const searchBlocklistCandidates = async (query) => {
        const trimmed = String(query || '').trim();
        if (!trimmed) return [];
        const apiKey = String(config?.tmdbApiKey || '').trim();
        if (!apiKey) {
            const err = new Error('TMDB API key is required to search titles.');
            err.status = 400;
            throw err;
        }
        const client = createTmdbClient({ tmdbApiKey: apiKey, language: 'en' });
        const payload = await client.search(trimmed, { page: 1 });
        const results = Array.isArray(payload?.results) ? payload.results : [];
        return results
            .filter((item) => {
                const type = String(item?.mediaType || '').toLowerCase();
                return type === 'movie' || type === 'tv';
            })
            .map((item) => ({
                tmdbId: Number(item?.id) || null,
                mediaType: resolveMediaType(item?.mediaType),
                title: item?.title || item?.name || 'Unknown title',
                year: item?.releaseDate
                    ? String(item.releaseDate).slice(0, 4)
                    : (item?.firstAirDate ? String(item.firstAirDate).slice(0, 4) : null),
                posterPath: item?.posterPath || null,
                overview: item?.overview || '',
            }))
            .filter((item) => item.tmdbId);
    };

    const addToBlocklist = async (sessionUser, { tmdbId, mediaType, title, source = 'manual' } = {}) => {
        const type = resolveMediaType(mediaType);
        const idNum = Number(tmdbId);
        if (!Number.isFinite(idNum) || idNum <= 0) {
            const err = new Error('Valid TMDB ID is required.');
            err.status = 400;
            throw err;
        }

        const existing = await store.findByTmdb(type, idNum);
        if (existing) {
            const err = new Error('This title is already blocklisted.');
            err.status = 409;
            throw err;
        }

        const meta = await fetchTitleMeta(type, idNum);
        const record = await store.create({
            tmdbId: idNum,
            mediaType: type,
            title: title ? String(title).trim() : meta.title,
            year: meta.year,
            overview: meta.overview,
            posterPath: meta.posterPath,
            source,
            addedByUserId: String(sessionUser?.id || ''),
            meta: {
                addedByName: sessionUser?.username || sessionUser?.email || null,
                addedByEmail: sessionUser?.email || null,
            },
        });
        return enrichDto(record);
    };

    const removeFromBlocklist = async (tmdbId, mediaType) => {
        const type = resolveMediaType(mediaType);
        const idNum = Number(tmdbId);
        if (!Number.isFinite(idNum) || idNum <= 0) {
            const err = new Error('Valid TMDB ID is required.');
            err.status = 400;
            throw err;
        }
        const removed = await store.removeByTmdb(type, idNum);
        if (!removed) {
            const err = new Error('Blocklist entry not found.');
            err.status = 404;
            throw err;
        }
        return { success: true };
    };

    const isBlocked = async (mediaType, tmdbId) => {
        const found = await store.findByTmdb(mediaType, tmdbId);
        return !!found;
    };

    return {
        store,
        listBlocklist,
        getBlocklistCount,
        searchBlocklistCandidates,
        addToBlocklist,
        removeFromBlocklist,
        isBlocked,
        findByTmdb: (mediaType, tmdbId) => store.findByTmdb(mediaType, tmdbId),
    };
};

export default createPortalBlocklistService;
