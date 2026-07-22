/**
 * Direct TMDB client seam (Phase 2 implementation).
 * Phase 1: stubs only — not wired into discovery routes.
 */

const notImplemented = (name) => {
    const err = new Error(`[portal-request/tmdbClient] ${name} is not implemented yet (Phase 2).`);
    err.code = 'PORTAL_REQUEST_NOT_IMPLEMENTED';
    throw err;
};

/**
 * @param {object} [_config] Portal config (will read TMDB key / language later)
 */
export const createTmdbClient = (_config = {}) => ({
    search: async (_query, _opts = {}) => notImplemented('search'),
    trending: async (_opts = {}) => notImplemented('trending'),
    movie: async (_tmdbId, _opts = {}) => notImplemented('movie'),
    tv: async (_tmdbId, _opts = {}) => notImplemented('tv'),
    discoverMovies: async (_opts = {}) => notImplemented('discoverMovies'),
    discoverTv: async (_opts = {}) => notImplemented('discoverTv'),
    person: async (_personId, _opts = {}) => notImplemented('person'),
    genres: async (_mediaType, _opts = {}) => notImplemented('genres'),
});

export default createTmdbClient;
