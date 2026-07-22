/**
 * Portal request persistence seam (Phase 5+ implementation).
 * JSON file store under the config volume; interface allows a later SQLite backend.
 * Phase 1: stubs only — not wired into request routes.
 */

const notImplemented = (name) => {
    const err = new Error(`[portal-request/requestStore] ${name} is not implemented yet (Phase 5).`);
    err.code = 'PORTAL_REQUEST_NOT_IMPLEMENTED';
    throw err;
};

/**
 * @param {object} [_options]
 * @param {string} [_options.dataDir] Absolute path to config/requests (later)
 * @returns {import('./types.js').RequestStore}
 */
export const createJsonRequestStore = (_options = {}) => ({
    list: async (_opts = {}) => notImplemented('list'),
    get: async (_id) => notImplemented('get'),
    create: async (_record) => notImplemented('create'),
    update: async (_id, _patch) => notImplemented('update'),
    remove: async (_id) => notImplemented('remove'),
});

/** @deprecated Alias — default store is JSON until a SqliteRequestStore exists. */
export const createRequestStore = createJsonRequestStore;

export default createJsonRequestStore;
