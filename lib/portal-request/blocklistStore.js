/**
 * JSON BlocklistStore under config/blocklist/ (Phase 9).
 * Unique key: mediaType|tmdbId.
 */

import fs from 'fs/promises';
import path from 'path';

const INDEX_FILE = 'index.json';

const defaultIndex = () => ({
    version: 1,
    nextId: 1,
    ids: [],
});

const mediaKey = (mediaType, tmdbId) => `${mediaType === 'tv' ? 'tv' : 'movie'}|${Number(tmdbId)}`;

/**
 * @param {object} [options]
 * @param {string} options.dataDir Absolute path to config/blocklist
 */
export const createJsonBlocklistStore = (options = {}) => {
    const dataDir = String(options.dataDir || '').trim();
    if (!dataDir) {
        throw new Error('[portal-request/blocklistStore] dataDir is required');
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

    const findByTmdb = async (mediaType, tmdbId) => withLock(async () => {
        const type = mediaType === 'tv' ? 'tv' : 'movie';
        const idNum = Number(tmdbId);
        if (!Number.isFinite(idNum) || idNum <= 0) return null;
        const index = await loadIndex();
        for (const id of index.ids) {
            const record = await readRecord(id);
            if (!record) continue;
            if (record.mediaType === type && Number(record.tmdbId) === idNum) return record;
        }
        return null;
    });

    const list = async (opts = {}) => withLock(async () => {
        const index = await loadIndex();
        const search = String(opts.search || '').trim().toLowerCase();
        const filter = String(opts.filter || 'all').toLowerCase();
        const records = [];
        for (const id of index.ids) {
            const record = await readRecord(id);
            if (!record) continue;
            if (opts.mediaType && String(record.mediaType) !== String(opts.mediaType)) continue;
            if (opts.tmdbId != null && Number(record.tmdbId) !== Number(opts.tmdbId)) continue;
            if (filter === 'blocklistedTags' && !record.blocklistedTags) continue;
            if (filter === 'manual' && record.source === 'import' && record.blocklistedTags) continue;
            if (search) {
                const hay = `${record.title || ''} ${record.tmdbId || ''}`.toLowerCase();
                if (!hay.includes(search)) continue;
            }
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
        const mediaType = partial.mediaType === 'tv' ? 'tv' : 'movie';
        const tmdbId = Number(partial.tmdbId);
        if (!Number.isFinite(tmdbId) || tmdbId <= 0) {
            const err = new Error('tmdbId is required');
            err.status = 400;
            throw err;
        }

        const index = await loadIndex();
        for (const id of index.ids) {
            const existing = await readRecord(id);
            if (existing && existing.mediaType === mediaType && Number(existing.tmdbId) === tmdbId) {
                const err = new Error('This title is already blocklisted.');
                err.status = 409;
                throw err;
            }
        }

        const id = String(index.nextId);
        const now = new Date().toISOString();
        const record = {
            id,
            tmdbId,
            mediaType,
            title: String(partial.title || 'Unknown title'),
            year: partial.year != null ? String(partial.year).slice(0, 4) : null,
            overview: String(partial.overview || ''),
            posterPath: partial.posterPath || null,
            blocklistedTags: partial.blocklistedTags || null,
            source: partial.source || 'manual',
            addedByUserId: String(partial.addedByUserId || ''),
            createdAt: (() => {
                const raw = partial.createdAt;
                if (raw && !Number.isNaN(Date.parse(String(raw)))) return new Date(raw).toISOString();
                return now;
            })(),
            updatedAt: now,
            meta: partial.meta && typeof partial.meta === 'object' ? partial.meta : {},
            _key: mediaKey(mediaType, tmdbId),
        };

        await writeJsonAtomic(recordPath(id), record);
        index.ids.push(id);
        index.nextId = Number(id) + 1;
        await saveIndex(index);
        return record;
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

    const removeByTmdb = async (mediaType, tmdbId) => {
        const existing = await findByTmdb(mediaType, tmdbId);
        if (!existing) return false;
        return remove(existing.id);
    };

    return {
        list,
        get,
        create,
        remove,
        findByTmdb,
        removeByTmdb,
        dataDir,
    };
};

export const createBlocklistStore = createJsonBlocklistStore;

export default createJsonBlocklistStore;
