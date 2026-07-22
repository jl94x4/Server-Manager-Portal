/**
 * Library availability seam (Phase 3 implementation).
 * Resolves in-library / partial / downloading without Seerr mediaInfo.
 * Phase 1: stubs only — not wired into discovery filters.
 */

const notImplemented = (name) => {
    const err = new Error(`[portal-request/libraryAvailability] ${name} is not implemented yet (Phase 3).`);
    err.code = 'PORTAL_REQUEST_NOT_IMPLEMENTED';
    throw err;
};

/**
 * @param {object} [_config] Portal config (Plex / Sonarr / Radarr)
 */
export const createLibraryAvailability = (_config = {}) => ({
    /**
     * @param {'movie'|'tv'} _mediaType
     * @param {number} _tmdbId
     * @returns {Promise<import('./types.js').PortalMediaAvailability>}
     */
    getMediaStatus: async (_mediaType, _tmdbId) => notImplemented('getMediaStatus'),

    /**
     * Filter discover-style result arrays (hide available, etc.).
     * @param {object[]} _items
     * @param {object} [_opts]
     */
    filterAvailable: async (_items, _opts = {}) => notImplemented('filterAvailable'),

    /**
     * Enrich items with portal availability fields (same shape UI expects from mediaInfo).
     * @param {object[]} _items
     */
    enrichItems: async (_items) => notImplemented('enrichItems'),
});

export default createLibraryAvailability;
