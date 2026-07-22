/**
 * JSON RequestStore under config/requests/ (Phase 5).
 * Interface stays stable for a later SQLite backend.
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
 * @param {string} options.dataDir Absolute path to config/requests
 */
export const createJsonRequestStore = (options = {}) => {
    const dataDir = String(options.dataDir || '').trim();
    if (!dataDir) {
        throw new Error('[portal-request/requestStore] dataDir is required');
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
            if (opts.status != null && Number(record.status) !== Number(opts.status)) continue;
            if (opts.mediaType && String(record.mediaType) !== String(opts.mediaType)) continue;
            if (opts.tmdbId != null && Number(record.tmdbId) !== Number(opts.tmdbId)) continue;
            records.push(record);
        }
        records.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
        return records;
    });

    const get = async (id) => withLock(async () => {
        const key = String(id || '').trim();
        if (!key) return null;
        return readRecord(key);
    });

    const create = async (partial = {}) => withLock(async () => {
        const index = await loadIndex();
        const id = String(index.nextId);
        const now = new Date().toISOString();
        const record = {
            id,
            userId: String(partial.userId || ''),
            mediaType: partial.mediaType === 'tv' ? 'tv' : 'movie',
            tmdbId: Number(partial.tmdbId),
            title: String(partial.title || 'Unknown title'),
            year: partial.year != null ? String(partial.year).slice(0, 4) : null,
            overview: String(partial.overview || ''),
            posterPath: partial.posterPath || null,
            backdropPath: partial.backdropPath || null,
            is4k: !!partial.is4k,
            seasons: Array.isArray(partial.seasons)
                ? partial.seasons.map((n) => Number(n)).filter((n) => Number.isFinite(n))
                : (partial.seasons === 'all' ? 'all' : []),
            rootFolder: partial.rootFolder != null ? String(partial.rootFolder) : null,
            qualityProfile: partial.qualityProfile != null ? Number(partial.qualityProfile) : null,
            profileId: partial.profileId != null ? Number(partial.profileId) : (
                partial.qualityProfile != null ? Number(partial.qualityProfile) : null
            ),
            serverId: partial.serverId != null ? Number(partial.serverId) : null,
            arrInstanceId: partial.arrInstanceId != null ? String(partial.arrInstanceId) : null,
            languageProfileId: partial.languageProfileId != null ? Number(partial.languageProfileId) : null,
            tags: Array.isArray(partial.tags)
                ? partial.tags.map((t) => Number(t)).filter((n) => Number.isFinite(n))
                : [],
            status: Number.isFinite(Number(partial.status)) ? Number(partial.status) : 1,
            createdAt: (() => {
                const raw = partial.createdAt;
                if (raw && !Number.isNaN(Date.parse(String(raw)))) return new Date(raw).toISOString();
                return now;
            })(),
            updatedAt: (() => {
                const raw = partial.updatedAt;
                if (raw && !Number.isNaN(Date.parse(String(raw)))) return new Date(raw).toISOString();
                return now;
            })(),
            meta: partial.meta && typeof partial.meta === 'object' ? partial.meta : {},
        };

        if (!record.userId) {
            const err = new Error('userId is required');
            err.status = 400;
            throw err;
        }
        if (!Number.isFinite(record.tmdbId) || record.tmdbId <= 0) {
            const err = new Error('tmdbId is required');
            err.status = 400;
            throw err;
        }

        await writeJsonAtomic(recordPath(id), record);
        index.ids.push(id);
        index.nextId = Number(id) + 1;
        await saveIndex(index);
        return record;
    });

    const update = async (id, patch = {}) => withLock(async () => {
        const key = String(id || '').trim();
        const existing = await readRecord(key);
        if (!existing) return null;
        const next = {
            ...existing,
            ...patch,
            id: existing.id,
            userId: patch.userId != null && String(patch.userId).trim()
                ? String(patch.userId)
                : existing.userId,
            updatedAt: new Date().toISOString(),
        };
        await writeJsonAtomic(recordPath(key), next);
        return next;
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
        get,
        create,
        update,
        remove,
        dataDir,
    };
};

/** @deprecated Alias — default store is JSON until a SqliteRequestStore exists. */
export const createRequestStore = createJsonRequestStore;

export default createJsonRequestStore;
