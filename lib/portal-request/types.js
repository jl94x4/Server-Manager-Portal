/**
 * JSDoc shapes for the portal-native request engine.
 * Keep aligned with client/requests/types.ts as the UI contract.
 */

/**
 * @typedef {'movie' | 'tv'} PortalMediaType
 */

/**
 * @typedef {object} PortalMediaAvailability
 * @property {PortalMediaType} mediaType
 * @property {number} tmdbId
 * @property {boolean} inLibrary
 * @property {boolean} [partial]
 * @property {boolean} [downloading]
 * @property {number | null} [status] Seerr-compatible: 3 processing, 4 partial, 5 available
 * @property {string | null} [statusLabel]
 * @property {object | null} [mediaInfo] Seerr-shaped fragment for Discover UI overlays
 * @property {object} [sonarrLibraryStatus]
 * @property {object} [radarrLibraryStatus]
 */

/**
 * @typedef {object} PortalRequestRecord
 * @property {string} id Portal-owned id (string; UI may coerce)
 * @property {PortalMediaType} mediaType
 * @property {number} tmdbId
 * @property {string} title
 * @property {string | null} [year]
 * @property {boolean} [is4k]
 * @property {number[]} [seasons]
 * @property {string} requestedByUserId Portal user id
 * @property {string} status pending|approved|declined|available|failed|…
 * @property {number | null} [serverId]
 * @property {number | null} [profileId]
 * @property {string | null} [rootFolder]
 * @property {number[]} [tags]
 * @property {string} createdAt ISO
 * @property {string} updatedAt ISO
 * @property {object} [meta] Extra fields for *arr sync, decline reason, etc.
 */

/**
 * @typedef {object} RequestStore
 * @property {(opts?: object) => Promise<PortalRequestRecord[]>} list
 * @property {(id: string) => Promise<PortalRequestRecord | null>} get
 * @property {(record: Partial<PortalRequestRecord>) => Promise<PortalRequestRecord>} create
 * @property {(id: string, patch: Partial<PortalRequestRecord>) => Promise<PortalRequestRecord | null>} update
 * @property {(id: string) => Promise<boolean>} remove
 */

export {};
