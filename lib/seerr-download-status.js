/** Seerr media status: sent to Radarr/Sonarr but not necessarily downloading. */
export const SEERR_MEDIA_PROCESSING = 3;

/**
 * True when Seerr's download tracker reports active Radarr/Sonarr queue items.
 * Empty arrays mean nothing is downloading even if media status is "processing".
 */
export const hasActiveSeerrDownloads = (mediaInfo = {}, opts = {}) => {
    if (!mediaInfo || typeof mediaInfo !== 'object') return false;

    const hd = Array.isArray(mediaInfo.downloadStatus) ? mediaInfo.downloadStatus : [];
    const fourK = Array.isArray(mediaInfo.downloadStatus4k) ? mediaInfo.downloadStatus4k : [];
    let queues = [];
    if (opts.is4k === true) queues = fourK;
    else if (opts.is4k === false) queues = hd;
    else queues = [...hd, ...fourK];

    // Some Seerr payloads keep "downloadStatus" entries around even after the item
    // is effectively available. Treat `status:5` as completed/available, not active.
    const activeQueues = queues.filter((item) => {
        const s = Number(item?.status);
        return !(Number.isFinite(s) && s === 5);
    });

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
