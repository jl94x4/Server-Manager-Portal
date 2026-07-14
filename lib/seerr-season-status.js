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
