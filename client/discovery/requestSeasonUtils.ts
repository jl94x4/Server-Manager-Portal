/** Seerr / Jellyseerr media status codes (library state). */
export const MEDIA_STATUS = {
    UNKNOWN: 1,
    PENDING: 2,
    PROCESSING: 3,
    PARTIAL: 4,
    AVAILABLE: 5,
    BLACKLISTED: 6,
    DELETED: 7,
} as const;

/** Seerr request status codes. */
export const REQUEST_STATUS = {
    PENDING: 1,
    APPROVED: 2,
    DECLINED: 3,
    FAILED: 4,
} as const;

export type SeasonStatusInfo = {
    seasonNumber: number;
    name: string;
    episodeCount: number;
    posterPath?: string | null;
    libraryStatus: number | null;
    requestStatus: number | null;
    statusLabel: string;
    requestable: boolean;
};

/** True when Seerr's download tracker reports active Radarr/Sonarr queue items. */
export const hasActiveSeerrDownloads = (
    mediaInfo: any,
    opts?: { is4k?: boolean | null; seasonNumber?: number | null },
): boolean => {
    if (!mediaInfo || typeof mediaInfo !== 'object') return false;

    const hd = Array.isArray(mediaInfo.downloadStatus) ? mediaInfo.downloadStatus : [];
    const fourK = Array.isArray(mediaInfo.downloadStatus4k) ? mediaInfo.downloadStatus4k : [];
    let queues: any[] = [];
    if (opts?.is4k === true) queues = fourK;
    else if (opts?.is4k === false) queues = hd;
    else queues = [...hd, ...fourK];

    if (typeof opts?.seasonNumber === 'number' && Number.isFinite(opts.seasonNumber)) {
        return queues.some((item) => Number(item?.episode?.seasonNumber) === opts.seasonNumber);
    }

    return queues.length > 0;
};

export const isMediaActivelyProcessing = (
    mediaInfo: any,
    mediaStatus?: number | null,
): boolean => {
    const status = Number(mediaStatus ?? mediaInfo?.status);
    if (status !== MEDIA_STATUS.PROCESSING) return false;
    return hasActiveSeerrDownloads(mediaInfo);
};

export const resolveInProgressDisplay = (
    mediaInfo: any,
    mediaStatus?: number | null,
): { kind: 'processing' | 'requested'; label: string; detail: string } | null => {
    const status = Number(mediaStatus ?? mediaInfo?.status);
    if (status !== MEDIA_STATUS.PROCESSING) return null;

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

export const mediaLibraryStatusLabel = (status: number | null | undefined): string | null => {
    const value = Number(status);
    if (value === MEDIA_STATUS.AVAILABLE) return 'Available';
    if (value === MEDIA_STATUS.PARTIAL) return 'Partial';
    if (value === MEDIA_STATUS.PROCESSING) return 'Processing';
    if (value === MEDIA_STATUS.PENDING) return 'Pending';
    if (value === MEDIA_STATUS.BLACKLISTED) return 'Blacklisted';
    return null;
};

export const seasonStatusBadgeClass = (label: string, requestable: boolean): string => {
    if (label === 'Available') return 'bg-green-500/15 text-green-400 border-green-500/25';
    if (label === 'Processing' || label === 'Approved') return 'bg-blue-500/15 text-blue-300 border-blue-500/25';
    if (label === 'Requested') return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/25';
    if (label === 'Pending') return 'bg-amber-500/15 text-amber-400 border-amber-500/25';
    if (label === 'Declined') return 'bg-red-500/15 text-red-400 border-red-500/25';
    if (!requestable) return 'bg-white/5 text-white/40 border-white/10';
    return 'bg-white/5 text-white/50 border-white/10';
};

export type QuotaSlot = {
    limit: number;
    days: number;
    used: number;
    remaining: number | null;
};

export type RequestOptionsPayload = {
    mediaType: 'movie' | 'tv';
    tmdbId: number;
    title: string;
    mediaStatus: number | null;
    isBlacklisted: boolean;
    canRequest: boolean;
    canRequest4k: boolean;
    has4kServer: boolean;
    hasHdServer: boolean;
    permissions: {
        request: boolean;
        request4k: boolean;
    };
    quota: {
        standard?: QuotaSlot;
        fourK?: QuotaSlot;
    };
    seasons: SeasonStatusInfo[];
    userMapped: boolean;
    blockReason?: string | null;
    posterPath?: string | null;
};

export const formatQuotaHint = (slot: QuotaSlot | undefined, label: string): string | null => {
    if (!slot || slot.limit === 0) return null;
    const remaining = slot.remaining ?? Math.max(0, slot.limit - slot.used);
    return `${remaining} of ${slot.limit} ${label} requests left (${slot.days}-day window)`;
};

export const isMovieFullyAvailable = (mediaStatus: number | null | undefined) => (
    Number(mediaStatus) === MEDIA_STATUS.AVAILABLE
);

export const isMovieRequestPending = (mediaStatus: number | null | undefined) => {
    const value = Number(mediaStatus);
    return value === MEDIA_STATUS.PENDING || value === MEDIA_STATUS.PROCESSING;
};

/** Build per-season status from Seerr media detail payload (client-side, no extra API call). */
export const buildSeasonStatusFromDetails = (details: any): SeasonStatusInfo[] => {
    const mediaInfo = details?.mediaInfo || {};
    const tmdbSeasons = Array.isArray(details?.seasons) ? details.seasons : [];
    const librarySeasons = Array.isArray(mediaInfo?.seasons) ? mediaInfo.seasons : [];
    const libraryByNum = new Map<number, number | null>(
        librarySeasons.map((s: any) => [Number(s?.seasonNumber), Number(s?.status) || null]),
    );

    const requestedSeasonStatus = new Map<number, number>();
    const requests = Array.isArray(mediaInfo?.requests) ? mediaInfo.requests : [];
    for (const req of requests) {
        if (!Array.isArray(req?.seasons)) continue;
        const reqStatus = Number(req?.status);
        for (const season of req.seasons) {
            const num = Number(season?.seasonNumber);
            if (!Number.isFinite(num)) continue;
            const existing = requestedSeasonStatus.get(num);
            if (existing == null || reqStatus === 1) requestedSeasonStatus.set(num, reqStatus);
        }
    }

    return tmdbSeasons
        .filter((s: any) => Number(s?.seasonNumber) >= 0)
        .sort((a: any, b: any) => Number(a.seasonNumber) - Number(b.seasonNumber))
        .map((s: any) => {
            const seasonNumber = Number(s.seasonNumber);
            const libraryStatus = libraryByNum.get(seasonNumber) ?? null;
            const requestStatus = requestedSeasonStatus.get(seasonNumber) ?? null;

            let requestable = true;
            let statusLabel = 'Not requested';

            if (libraryStatus === MEDIA_STATUS.AVAILABLE) {
                requestable = false;
                statusLabel = 'Available';
            } else if (libraryStatus === MEDIA_STATUS.PROCESSING) {
                requestable = false;
                statusLabel = hasActiveSeerrDownloads(mediaInfo, { seasonNumber })
                    ? 'Processing'
                    : 'Requested';
            } else if (libraryStatus === MEDIA_STATUS.PENDING) {
                requestable = false;
                statusLabel = 'Pending';
            } else if (libraryStatus === MEDIA_STATUS.PARTIAL) {
                statusLabel = 'Partial';
            } else if (requestStatus === REQUEST_STATUS.PENDING) {
                requestable = false;
                statusLabel = 'Pending';
            } else if (requestStatus === REQUEST_STATUS.APPROVED) {
                requestable = false;
                statusLabel = 'Approved';
            } else if (requestStatus === REQUEST_STATUS.DECLINED) {
                requestable = false;
                statusLabel = 'Declined';
            }

            return {
                seasonNumber,
                name: s?.name || (seasonNumber === 0 ? 'Specials' : `Season ${seasonNumber}`),
                episodeCount: Number(s?.episodeCount) || 0,
                posterPath: s?.posterPath ?? null,
                libraryStatus,
                requestStatus,
                statusLabel,
                requestable,
            };
        });
};

export const getRequestButtonState = (
    mediaType: 'movie' | 'tv',
    mediaStatus: number | null | undefined,
    seasonRows: SeasonStatusInfo[],
    mediaInfo?: any,
) => {
    const status = Number(mediaStatus) || null;
    if (mediaType === 'movie') {
        if (status === MEDIA_STATUS.AVAILABLE) {
            return { label: 'Available', disabled: true, variant: 'available' as const };
        }
        if (status === MEDIA_STATUS.PROCESSING) {
            const label = isMediaActivelyProcessing(mediaInfo, status) ? 'Processing' : 'Requested';
            return { label, disabled: true, variant: 'pending' as const };
        }
        if (status === MEDIA_STATUS.PENDING) {
            return { label: 'Request Pending', disabled: true, variant: 'pending' as const };
        }
        if (status === MEDIA_STATUS.BLACKLISTED) {
            return { label: 'Blacklisted', disabled: true, variant: 'blocked' as const };
        }
        return { label: 'Request Movie', disabled: false, variant: 'action' as const };
    }

    if (status === MEDIA_STATUS.BLACKLISTED) {
        return { label: 'Blacklisted', disabled: true, variant: 'blocked' as const };
    }
    const requestableCount = seasonRows.filter((s) => s.requestable).length;
    if (requestableCount === 0 && seasonRows.length > 0) {
        return { label: 'All Seasons Requested', disabled: true, variant: 'available' as const };
    }
    if (status === MEDIA_STATUS.AVAILABLE && requestableCount === 0) {
        return { label: 'Available', disabled: true, variant: 'available' as const };
    }
    return {
        label: requestableCount > 0 && requestableCount < seasonRows.length ? 'Request Seasons' : 'Request Series',
        disabled: false,
        variant: 'action' as const,
    };
};
