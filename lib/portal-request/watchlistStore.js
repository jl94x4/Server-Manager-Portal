/**
 * JSON WatchlistStore under config/watchlist/ (Phase 9).
 * Per-user cache of Plex / imported watchlist items.
 */

import fs from 'fs/promises';
import path from 'path';

const INDEX_FILE = 'index.json';

const defaultIndex = () => ({
    version: 1,
    nextId: 1,
    ids: [],
});

/**
 * @param {object} [options]
 * @param {string} options.dataDir Absolute path to config/watchlist
 */
export const createJsonWatchlistStore = (options = {}) => {
    const dataDir = String(options.dataDir || '').trim();
    if (!dataDir) {
        throw new Error('[portal-request/watchlistStore] dataDir is required');
    }

    let chain = Promise.resolve();
    const withLock = (fn) => {
        const run = chain.then(fn, fn);
        chain = run.catch(() => {});
        return run;
    };

    const indexPath = () => path.join(dataDir, INDEX_FILE);
    const recordPath = (id) => path.join(dataDir, `${id}.json`);

    const ensureDir = async () => {
        await fs.mkdir(dataDir, { recursive: true });
    };

    const readJson = async (filePath, fallback) => {
        try {
            const raw = await fs.readFile(filePath, 'utf8');
            return JSON.parse(raw);
        } catch (error) {
            if (error?.code === 'ENOENT') return fallback;
            throw error;
        }
    };

    const writeJsonAtomic = async (filePath, value) => {
        await ensureDir();
        const tmp = `${filePath}.${process.pid}.${Date.now()}.tmp`;
        const payload = `${JSON.stringify(value, null, 2)}\n`;
        await fs.writeFile(tmp, payload, 'utf8');
        await fs.rename(tmp, filePath);
    };

    const loadIndex = async () => {
        await ensureDir();
        const index = await readJson(indexPath(), defaultIndex());
        if (!index || typeof index !== 'object') return defaultIndex();
        return {
            version: Number(index.version) || 1,
            nextId: Math.max(1, Number(index.nextId) || 1),
            ids: Array.isArray(index.ids) ? index.ids.map(String) : [],
        };
    };

    const saveIndex = async (index) => writeJsonAtomic(indexPath(), index);

    const readRecord = async (id) => {
        const record = await readJson(recordPath(id), null);
        return record && typeof record === 'object' ? record : null;
    };

    const list = async (opts = {}) => withLock(async () => {
        const index = await loadIndex();
        const records = [];
        for (const id of index.ids) {
            const record = await readRecord(id);
            if (!record) continue;
            if (opts.userId != null && String(record.userId) !== String(opts.userId)) continue;
            if (opts.mediaType && String(record.mediaType) !== String(opts.mediaType)) continue;
            if (opts.tmdbId != null && Number(record.tmdbId) !== Number(opts.tmdbId)) continue;
            records.push(record);
        }
        records.sort((a, b) => String(b.syncedAt || b.updatedAt || b.createdAt || '')
            .localeCompare(String(a.syncedAt || a.updatedAt || a.createdAt || '')));
        return records;
    });

    const upsertByUserMedia = async (partial = {}) => withLock(async () => {
        const userId = String(partial.userId || '').trim();
        const mediaType = partial.mediaType === 'tv' ? 'tv' : 'movie';
        const tmdbId = Number(partial.tmdbId);
        if (!userId) {
            const err = new Error('userId is required');
            err.status = 400;
            throw err;
        }
        if (!Number.isFinite(tmdbId) || tmdbId <= 0) {
            const err = new Error('tmdbId is required');
            err.status = 400;
            throw err;
        }

        const index = await loadIndex();
        let existing = null;
        for (const id of index.ids) {
            const record = await readRecord(id);
            if (!record) continue;
            if (String(record.userId) === userId
                && record.mediaType === mediaType
                && Number(record.tmdbId) === tmdbId) {
                existing = record;
                break;
            }
        }

        const now = new Date().toISOString();
        if (existing) {
            const next = {
                ...existing,
                title: partial.title != null ? String(partial.title) : existing.title,
                year: partial.year != null ? String(partial.year).slice(0, 4) : existing.year,
                overview: partial.overview != null ? String(partial.overview) : existing.overview,
                posterPath: partial.posterPath !== undefined ? partial.posterPath : existing.posterPath,
                backdropPath: partial.backdropPath !== undefined ? partial.backdropPath : existing.backdropPath,
                plexGuid: partial.plexGuid !== undefined ? partial.plexGuid : existing.plexGuid,
                plexRatingKey: partial.plexRatingKey !== undefined ? partial.plexRatingKey : existing.plexRatingKey,
                source: partial.source || existing.source || 'plex',
                syncedAt: now,
                updatedAt: now,
                meta: {
                    ...(existing.meta || {}),
                    ...(partial.meta && typeof partial.meta === 'object' ? partial.meta : {}),
                },
            };
            await writeJsonAtomic(recordPath(existing.id), next);
            return next;
        }

        const id = String(index.nextId);
        const record = {
            id,
            userId,
            mediaType,
            tmdbId,
            title: String(partial.title || 'Unknown title'),
            year: partial.year != null ? String(partial.year).slice(0, 4) : null,
            overview: String(partial.overview || ''),
            posterPath: partial.posterPath || null,
            backdropPath: partial.backdropPath || null,
            plexGuid: partial.plexGuid || null,
            plexRatingKey: partial.plexRatingKey || null,
            source: partial.source || 'plex',
            syncedAt: now,
            createdAt: now,
            updatedAt: now,
            meta: partial.meta && typeof partial.meta === 'object' ? partial.meta : {},
        };
        await writeJsonAtomic(recordPath(id), record);
        index.ids.push(id);
        index.nextId = Number(id) + 1;
        await saveIndex(index);
        return record;
    });

    const replaceUserItems = async (userId, items = []) => withLock(async () => {
        const key = String(userId || '').trim();
        if (!key) return [];
        const index = await loadIndex();
        const keepIds = [];
        const removed = [];
        for (const id of index.ids) {
            const record = await readRecord(id);
            if (!record) continue;
            if (String(record.userId) === key) {
                removed.push(id);
                try {
                    await fs.unlink(recordPath(id));
                } catch (error) {
                    if (error?.code !== 'ENOENT') throw error;
                }
            } else {
                keepIds.push(id);
            }
        }

        const created = [];
        let nextId = Math.max(1, Number(index.nextId) || 1);
        const now = new Date().toISOString();
        for (const partial of items) {
            const mediaType = partial.mediaType === 'tv' ? 'tv' : 'movie';
            const tmdbId = Number(partial.tmdbId);
            if (!Number.isFinite(tmdbId) || tmdbId <= 0) continue;
            const id = String(nextId);
            nextId += 1;
            const record = {
                id,
                userId: key,
                mediaType,
                tmdbId,
                title: String(partial.title || 'Unknown title'),
                year: partial.year != null ? String(partial.year).slice(0, 4) : null,
                overview: String(partial.overview || ''),
                posterPath: partial.posterPath || null,
                backdropPath: partial.backdropPath || null,
                plexGuid: partial.plexGuid || null,
                plexRatingKey: partial.plexRatingKey || null,
                source: partial.source || 'plex',
                syncedAt: now,
                createdAt: now,
                updatedAt: now,
                meta: partial.meta && typeof partial.meta === 'object' ? partial.meta : {},
            };
            await writeJsonAtomic(recordPath(id), record);
            keepIds.push(id);
            created.push(record);
        }

        await saveIndex({ version: 1, nextId, ids: keepIds });
        return created;
    });

    const remove = async (id) => withLock(async () => {
        const key = String(id || '').trim();
        const index = await loadIndex();
        if (!index.ids.includes(key)) return false;
        try {
            await fs.unlink(recordPath(key));
        } catch (error) {
            if (error?.code !== 'ENOENT') throw error;
        }
        index.ids = index.ids.filter((entry) => entry !== key);
        await saveIndex(index);
        return true;
    });

    return {
        list,
        upsertByUserMedia,
        replaceUserItems,
        remove,
        dataDir,
    };
};

export const createWatchlistStore = createJsonWatchlistStore;

export default createJsonWatchlistStore;
