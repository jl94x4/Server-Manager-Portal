/** Seerr media status: sent to Radarr/Sonarr but not necessarily downloading. */
export const SEERR_MEDIA_PROCESSING = 3;

/** Radarr/Sonarr queue states that mean bytes are still moving or waiting. */
const ACTIVE_QUEUE_STATUSES = new Set([
    'downloading',
    'queued',
    'paused',
    'delay',
    'warning',
    'downloadclientunavailable',
    'fallback',
    'unknown',
]);

/** Queue rows that are finished transferring (may linger during import). */
const INACTIVE_QUEUE_STATUSES = new Set([
    'completed',
    'failed',
]);

/**
 * Seerr attaches live Radarr/Sonarr queue rows as downloadStatus.
 * Those use string statuses + sizeLeft — not media status integers.
 */
export const isActiveSeerrDownloadItem = (item = {}) => {
    if (!item || typeof item !== 'object') return false;

    const sizeLeft = Number(item.sizeLeft ?? item.sizeleft);
    if (Number.isFinite(sizeLeft) && sizeLeft > 0) return true;

    const statusRaw = item.status;
    // Ignore mistaken numeric media-status values on download rows (e.g. 5 = available).
    if (
        typeof statusRaw === 'number'
        || (typeof statusRaw === 'string' && /^\d+$/.test(String(statusRaw).trim()))
    ) {
        return false;
    }

    const status = String(statusRaw || '').toLowerCase().trim();
    if (!status) return false;
    if (INACTIVE_QUEUE_STATUSES.has(status)) return false;
    if (ACTIVE_QUEUE_STATUSES.has(status)) return true;
    return false;
};

/**
 * True when Seerr's download tracker reports active Radarr/Sonarr queue items.
 * Empty arrays / completed queue leftovers mean nothing is downloading even if
 * media status is still "processing".
 */
export const hasActiveSeerrDownloads = (mediaInfo = {}, opts = {}) => {
    if (!mediaInfo || typeof mediaInfo !== 'object') return false;

    const hd = Array.isArray(mediaInfo.downloadStatus) ? mediaInfo.downloadStatus : [];
    const fourK = Array.isArray(mediaInfo.downloadStatus4k) ? mediaInfo.downloadStatus4k : [];
    let queues = [];
    if (opts.is4k === true) queues = fourK;
    else if (opts.is4k === false) queues = hd;
    else queues = [...hd, ...fourK];

    const activeQueues = queues.filter((item) => isActiveSeerrDownloadItem(item));

    const seasonNumber = Number(opts.seasonNumber);
    if (Number.isFinite(seasonNumber)) {
        return activeQueues.some((item) => Number(item?.episode?.seasonNumber) === seasonNumber);
    }

    return activeQueues.length > 0;
};

export const isMediaActivelyProcessing = (mediaInfo = {}, mediaStatus) => {
    const status = Number(mediaStatus ?? mediaInfo?.status);
    if (status !== SEERR_MEDIA_PROCESSING) return false;
    return hasActiveSeerrDownloads(mediaInfo);
};

export const resolveSeerrInProgressDisplay = (mediaInfo = {}, mediaStatus) => {
    const status = Number(mediaStatus ?? mediaInfo?.status);
    if (status !== SEERR_MEDIA_PROCESSING) return null;

    if (hasActiveSeerrDownloads(mediaInfo)) {
        return {
            kind: 'processing',
            label: 'Processing',
            detail: 'Your request is being downloaded or imported.',
        };
    }

    return {
        kind: 'requested',
        label: 'Requested',
        detail: 'Your request was sent to the media server and is waiting to download.',
    };
};
