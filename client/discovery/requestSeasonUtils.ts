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

/** Whether a season still has unaired episodes scheduled (currently airing). */
export const isReturningSeries = (details: any): boolean => {
    const status = String(details?.status || '').toLowerCase();
    if (status === 'in production') return false;
    return details?.inProduction === true || status === 'returning series';
};

export const isEndedShow = (details: any): boolean => {
    if (details?.inProduction === true) return false;
    const status = String(details?.status || '').toLowerCase();
    return status === 'ended' || status === 'canceled' || status === 'cancelled';
};

export const isMainSeasonNumber = (seasonNumber: number) => Number(seasonNumber) > 0;

export const isSeasonStillAiring = (details: any, seasonNumber: number): boolean => {
    const next = details?.nextEpisodeToAir;
    if (next && Number(next.seasonNumber) === seasonNumber) return true;

    const last = details?.lastEpisodeToAir;
    const tmdbSeason = (Array.isArray(details?.seasons) ? details.seasons : []).find(
        (s: any) => Number(s?.seasonNumber ?? s?.season_number) === seasonNumber,
    );
    const totalEpisodes = Number(tmdbSeason?.episodeCount ?? tmdbSeason?.episode_count) || 0;

    if (last && Number(last.seasonNumber) === seasonNumber) {
        if (totalEpisodes > Number(last.episodeNumber)) return true;
        if (isReturningSeries(details)) return true;
    }

    return false;
};

/** Label for a season Seerr marks as PARTIAL (tracked in Sonarr with not-all episodes). */
export const resolvePartialSeasonLabel = (details: any, seasonNumber: number): string => (
    isSeasonStillAiring(details, seasonNumber) ? 'Up to date' : 'Partial'
);

/** Prefer "Up to date" over request/approval labels for ongoing seasons on returning series. */
export const resolveMonitoredSeasonLabel = (
    details: any,
    seasonNumber: number,
    fallback: string,
): string => (
    isReturningSeries(details) && isSeasonStillAiring(details, seasonNumber) ? 'Up to date' : fallback
);

export const isSeasonUpToDateLabel = (label: string) => label === 'Up to date';

export const isSeasonHandledInLibrary = (label: string) => (
    label === 'Available'
    || label === 'Up to date'
    || label === 'Requested'
    || label === 'Processing'
    || label === 'Pending'
    || label === 'Approved'
);

/**
 * Seerr often lacks per-season rows even when Sonarr is monitoring a season.
 * Infer "Up to date" for aired seasons on returning/partial shows already in the library.
 */
export const inferMissingLibrarySeasonStatus = (
    details: any,
    mediaInfo: any,
    seasonRow: SeasonStatusInfo,
): { requestable: boolean; statusLabel: string } | null => {
    if (!seasonRow.requestable || seasonRow.statusLabel !== 'Not requested') return null;
    if (!Number(mediaInfo?.id)) return null;

    const showStatus = Number(mediaInfo?.status);
    const librarySeasons = Array.isArray(mediaInfo?.seasons) ? mediaInfo.seasons : [];
    const hasTrackedSeason = librarySeasons.some(
        (s: any) => [
            MEDIA_STATUS.PROCESSING,
            MEDIA_STATUS.PARTIAL,
            MEDIA_STATUS.AVAILABLE,
            MEDIA_STATUS.PENDING,
        ].includes(Number(s?.status)),
    );
    const showInLibrary = showStatus === MEDIA_STATUS.PROCESSING
        || showStatus === MEDIA_STATUS.PARTIAL
        || showStatus === MEDIA_STATUS.AVAILABLE
        || hasTrackedSeason;
    if (!showInLibrary && !isReturningSeries(details)) return null;

    const seasonNumber = Number(seasonRow.seasonNumber);
    const lastAiredSeason = Number(details?.lastEpisodeToAir?.seasonNumber);
    if (!Number.isFinite(seasonNumber) || !Number.isFinite(lastAiredSeason)) return null;
    if (seasonNumber > lastAiredSeason) return null;

    const knownSeasonNumbers = librarySeasons
        .map((s: any) => Number(s?.seasonNumber))
        .filter((n: number) => Number.isFinite(n));

    const requests = Array.isArray(mediaInfo?.requests) ? mediaInfo.requests : [];
    for (const req of requests) {
        if (!Array.isArray(req?.seasons)) continue;
        for (const season of req.seasons) {
            const num = Number(season?.seasonNumber);
            if (Number.isFinite(num)) knownSeasonNumbers.push(num);
        }
    }

    if (!knownSeasonNumbers.length) {
        if (showStatus === MEDIA_STATUS.PARTIAL && isReturningSeries(details)) {
            return { requestable: false, statusLabel: 'Up to date' };
        }
        return null;
    }
    const maxKnownSeason = Math.max(...knownSeasonNumbers);
    if (seasonNumber > maxKnownSeason + 1) return null;

    if (isSeasonStillAiring(details, seasonNumber)) {
        return { requestable: false, statusLabel: 'Up to date' };
    }

    if (isReturningSeries(details) && seasonNumber <= lastAiredSeason) {
        return { requestable: false, statusLabel: 'Up to date' };
    }

    if (isEndedShow(details) && showInLibrary && seasonNumber > 0 && seasonNumber <= lastAiredSeason) {
        const mainLibrarySeasons = librarySeasons.filter(
            (s: any) => isMainSeasonNumber(Number(s?.seasonNumber)),
        );
        if (mainLibrarySeasons.length > 0 || showStatus === MEDIA_STATUS.PARTIAL || showStatus === MEDIA_STATUS.AVAILABLE) {
            return { requestable: false, statusLabel: 'Available' };
        }
    }

    return null;
};

export const applyMissingLibrarySeasonInference = (
    details: any,
    mediaInfo: any,
    seasonRows: SeasonStatusInfo[],
): SeasonStatusInfo[] => (
    seasonRows.map((row) => {
        const inferred = inferMissingLibrarySeasonStatus(details, mediaInfo, row);
        if (!inferred) return row;
        return { ...row, ...inferred };
    })
);

/** Prefer Sonarr episode files over stale Seerr season rows when enrichment is present. */
export const applySonarrLibrarySeasonOverrides = (
    details: any,
    seasonRows: SeasonStatusInfo[],
): SeasonStatusInfo[] => {
    const sonarr = details?.sonarrLibraryStatus;
    if (!sonarr?.matched || !Array.isArray(sonarr.seasons)) return seasonRows;

    const bySeason = new Map<number, any>(
        sonarr.seasons.map((season: any) => [Number(season.seasonNumber), season]),
    );

    return seasonRows.map((row) => {
        const seasonNumber = Number(row.seasonNumber);
        if (!isMainSeasonNumber(seasonNumber)) return row;

        const probe = bySeason.get(seasonNumber);
        if (!probe) return row;

        if (probe.complete) {
            return {
                ...row,
                requestable: false,
                statusLabel: 'Available',
                libraryStatus: MEDIA_STATUS.AVAILABLE,
            };
        }

        if (Number(probe.airedWithFile) > 0 || Number(probe.withFile) > 0) {
            return {
                ...row,
                requestable: false,
                statusLabel: resolvePartialSeasonLabel(details, seasonNumber),
                libraryStatus: MEDIA_STATUS.PARTIAL,
            };
        }

        return row;
    });
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
    if (label === 'Available' || label === 'Up to date') return 'bg-green-500/15 text-green-400 border-green-500/25';
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
    isAnime?: boolean;
    canRequest: boolean;
    canRequest4k: boolean;
    canRequestAdvanced?: boolean;
    has4kServer: boolean;
    hasHdServer: boolean;
    seerrUserId?: number | null;
    servers?: {
        id: number;
        name: string;
        is4k: boolean;
        isDefault: boolean;
    }[];
    permissions: {
        request: boolean;
        request4k: boolean;
        requestAdvanced?: boolean;
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

    return applySonarrLibrarySeasonOverrides(
        details,
        applyMissingLibrarySeasonInference(details, mediaInfo, tmdbSeasons
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
                const fallback = hasActiveSeerrDownloads(mediaInfo, { seasonNumber })
                    ? 'Processing'
                    : 'Requested';
                statusLabel = resolveMonitoredSeasonLabel(details, seasonNumber, fallback);
            } else if (libraryStatus === MEDIA_STATUS.PENDING) {
                requestable = false;
                statusLabel = 'Pending';
            } else if (libraryStatus === MEDIA_STATUS.PARTIAL) {
                requestable = false;
                statusLabel = resolvePartialSeasonLabel(details, seasonNumber);
            } else if (requestStatus === REQUEST_STATUS.PENDING) {
                requestable = false;
                statusLabel = 'Pending';
            } else if (requestStatus === REQUEST_STATUS.APPROVED) {
                requestable = false;
                statusLabel = resolveMonitoredSeasonLabel(details, seasonNumber, 'Approved');
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
        })),
    );
};

export const getRequestButtonState = (
    mediaType: 'movie' | 'tv',
    mediaStatus: number | null | undefined,
    seasonRows: SeasonStatusInfo[],
    mediaInfo?: any,
    details?: any,
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
        if (details && isReturningSeries(details)) {
            return { label: 'Up to date', disabled: true, variant: 'available' as const };
        }
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
