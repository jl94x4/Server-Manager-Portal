/**
 * Portal-native Discover / request engine seams.
 * Phase 2: TMDB client is wired behind discoverySource=tmdb.
 *
 * @see docs/development/seerr-uncouple-inventory.md
 */

export { createTmdbClient, buildTmdbDiscoverQuery } from './tmdbClient.js';
export { createTmdbDiscoverRouter } from './tmdbDiscover.js';
export { createLibraryAvailability } from './libraryAvailability.js';
export { createJsonRequestStore, createRequestStore } from './requestStore.js';
export { createPortalRequestService, mapPortalRecordToDto } from './portalRequestService.js';
export {
    listPortalArrServers,
    resolvePortalArrInstance,
    getPortalArrServiceOptions,
} from './portalArrServices.js';
export { syncPortalRequestStatuses } from './requestStatusSync.js';
