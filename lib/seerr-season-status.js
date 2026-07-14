export const isReturningSeries = (details = {}) => (
    details?.inProduction === true
    || String(details?.status || '').toLowerCase() === 'returning series'
);

/** Whether a season still has unaired episodes scheduled (currently airing). */
export const isSeasonStillAiring = (details = {}, seasonNumber) => {
    const next = details?.nextEpisodeToAir;
    if (next && Number(next.seasonNumber) === seasonNumber) return true;

    const last = details?.lastEpisodeToAir;
    const tmdbSeason = (Array.isArray(details?.seasons) ? details.seasons : []).find(
        (s) => Number(s?.seasonNumber ?? s?.season_number) === seasonNumber,
    );
    const totalEpisodes = Number(tmdbSeason?.episodeCount ?? tmdbSeason?.episode_count) || 0;

    if (last && Number(last.seasonNumber) === seasonNumber) {
        if (totalEpisodes > Number(last.episodeNumber)) return true;
        if (isReturningSeries(details)) return true;
    }

    return false;
};

/** Label for a season Seerr marks as PARTIAL (tracked in Sonarr with not-all episodes). */
export const resolvePartialSeasonLabel = (details = {}, seasonNumber) => (
    isSeasonStillAiring(details, seasonNumber) ? 'Up to date' : 'Partial'
);

/** Prefer "Up to date" over request/approval labels for ongoing seasons on returning series. */
export const resolveMonitoredSeasonLabel = (details = {}, seasonNumber, fallback) => (
    isReturningSeries(details) && isSeasonStillAiring(details, seasonNumber) ? 'Up to date' : fallback
);

export const isSeasonUpToDateLabel = (label) => label === 'Up to date';

export const isSeasonHandledInLibrary = (label) => (
    label === 'Available'
    || label === 'Up to date'
    || label === 'Requested'
    || label === 'Processing'
    || label === 'Pending'
    || label === 'Approved'
);

const SEERR_MEDIA_PROCESSING = 3;
const SEERR_MEDIA_PARTIAL = 4;
const SEERR_MEDIA_AVAILABLE = 5;

/**
 * Seerr often lacks per-season rows even when Sonarr is monitoring a season.
 * Infer "Up to date" for aired seasons on returning/partial shows already in the library.
 */
export const inferMissingLibrarySeasonStatus = (details = {}, mediaInfo = {}, seasonRow = {}) => {
    if (!seasonRow?.requestable || seasonRow?.statusLabel !== 'Not requested') return null;
    if (!Number(mediaInfo?.id)) return null;

    const showStatus = Number(mediaInfo?.status);
    const librarySeasons = Array.isArray(mediaInfo?.seasons) ? mediaInfo.seasons : [];
    const hasTrackedSeason = librarySeasons.some(
        (s) => [SEERR_MEDIA_PROCESSING, SEERR_MEDIA_PARTIAL, SEERR_MEDIA_AVAILABLE, 2].includes(Number(s?.status)),
    );
    const showInLibrary = showStatus === SEERR_MEDIA_PROCESSING
        || showStatus === SEERR_MEDIA_PARTIAL
        || showStatus === SEERR_MEDIA_AVAILABLE
        || hasTrackedSeason;
    if (!showInLibrary && !isReturningSeries(details)) return null;

    const seasonNumber = Number(seasonRow.seasonNumber);
    const lastAiredSeason = Number(details?.lastEpisodeToAir?.seasonNumber);
    if (!Number.isFinite(seasonNumber) || !Number.isFinite(lastAiredSeason)) return null;
    if (seasonNumber > lastAiredSeason) return null;

    const knownSeasonNumbers = librarySeasons
        .map((s) => Number(s?.seasonNumber ?? s?.season_number))
        .filter((n) => Number.isFinite(n));

    const requests = Array.isArray(mediaInfo?.requests) ? mediaInfo.requests : [];
    for (const req of requests) {
        if (!Array.isArray(req?.seasons)) continue;
        for (const season of req.seasons) {
            const num = Number(season?.seasonNumber ?? season?.season_number);
            if (Number.isFinite(num)) knownSeasonNumbers.push(num);
        }
    }

    if (!knownSeasonNumbers.length) {
        if (showStatus === SEERR_MEDIA_PARTIAL && isReturningSeries(details)) {
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

    return null;
};

export const applyMissingLibrarySeasonInference = (details = {}, mediaInfo = {}, seasonRows = []) => (
    seasonRows.map((row) => {
        const inferred = inferMissingLibrarySeasonStatus(details, mediaInfo, row);
        if (!inferred) return row;
        return { ...row, ...inferred };
    })
);
