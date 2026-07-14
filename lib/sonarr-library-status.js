import {
    fetchArrInstanceJson,
    fetchSonarrEpisodesForSeries,
    getArrInstance,
    getArrInstances,
    isArrInstanceReady,
} from './arr-service.js';

const SEERR_MEDIA_PARTIAL = 4;
const SEERR_MEDIA_AVAILABLE = 5;

const SERIES_LIST_CACHE_MS = 2 * 60 * 1000;
const seriesListCache = new Map();

const episodeHasAired = (episode = {}) => {
    const raw = episode.airDateUtc || episode.airDate;
    if (!raw) return true;
    const parsed = Date.parse(raw);
    if (Number.isNaN(parsed)) return true;
    return parsed <= Date.now();
};

/** Group Sonarr episodes into per-season file counts (excludes specials by default). */
export const buildSonarrSeasonAvailability = (episodes = [], { includeSpecials = false } = {}) => {
    const bySeason = new Map();

    for (const episode of Array.isArray(episodes) ? episodes : []) {
        const seasonNumber = Number(episode?.seasonNumber);
        if (!Number.isFinite(seasonNumber)) continue;
        if (!includeSpecials && seasonNumber === 0) continue;

        if (!bySeason.has(seasonNumber)) {
            bySeason.set(seasonNumber, {
                seasonNumber,
                total: 0,
                withFile: 0,
                airedTotal: 0,
                airedWithFile: 0,
            });
        }

        const bucket = bySeason.get(seasonNumber);
        bucket.total += 1;
        if (episode.hasFile) bucket.withFile += 1;
        if (episodeHasAired(episode)) {
            bucket.airedTotal += 1;
            if (episode.hasFile) bucket.airedWithFile += 1;
        }
    }

    return Array.from(bySeason.values())
        .sort((a, b) => a.seasonNumber - b.seasonNumber)
        .map((season) => ({
            ...season,
            complete: season.airedTotal > 0
                ? season.airedWithFile >= season.airedTotal
                : season.total > 0 && season.withFile >= season.total,
        }));
};

const loadCachedSeriesList = async (instance, fetchOpts) => {
    const cacheKey = String(instance?.id || instance?.url || '');
    const cached = seriesListCache.get(cacheKey);
    if (cached && Date.now() - cached.at < SERIES_LIST_CACHE_MS) {
        return cached.list;
    }

    const list = await fetchArrInstanceJson(instance, '/api/v3/series', fetchOpts);
    const normalized = Array.isArray(list) ? list : [];
    seriesListCache.set(cacheKey, { at: Date.now(), list: normalized });
    return normalized;
};

export const resolveSonarrSeriesForTmdbShow = async (config, tmdbId, {
    resolveUrl,
    fetchImpl,
    upgraderItems = [],
} = {}) => {
    const id = Number(tmdbId);
    if (!Number.isFinite(id) || id <= 0) return null;

    const indexHit = (Array.isArray(upgraderItems) ? upgraderItems : []).find(
        (item) => item?.mediaType === 'show'
            && Number(item?.tmdbId) === id
            && item?.arrInstanceId
            && item?.arrEntityId,
    );
    if (indexHit) {
        const instance = getArrInstance(config, indexHit.arrInstanceId);
        if (isArrInstanceReady(instance)) {
            return {
                instance,
                seriesId: Number(indexHit.arrEntityId),
                source: 'upgrader-index',
            };
        }
    }

    const fetchOpts = { resolveUrl, fetchImpl };
    for (const instance of getArrInstances(config, { type: 'sonarr', enabledOnly: true })) {
        if (!isArrInstanceReady(instance)) continue;
        const list = await loadCachedSeriesList(instance, fetchOpts);
        const series = list.find((entry) => Number(entry?.tmdbId) === id);
        if (series?.id) {
            return {
                instance,
                seriesId: Number(series.id),
                series,
                source: 'sonarr',
            };
        }
    }

    return null;
};

export const fetchSonarrLibraryStatusForShow = async (config, tmdbId, opts = {}) => {
    const resolved = await resolveSonarrSeriesForTmdbShow(config, tmdbId, opts);
    if (!resolved) return { matched: false };

    const episodes = await fetchSonarrEpisodesForSeries(resolved.instance, resolved.seriesId, opts);
    const seasons = buildSonarrSeasonAvailability(episodes);
    const mainSeasons = seasons.filter((season) => season.seasonNumber > 0);
    const showComplete = mainSeasons.length > 0 && mainSeasons.every((season) => season.complete);

    return {
        matched: true,
        seriesId: resolved.seriesId,
        instanceId: resolved.instance.id,
        instanceName: resolved.instance.name || 'Sonarr',
        source: resolved.source,
        showComplete,
        seasons,
        episodeCount: episodes.length,
        fileCount: episodes.filter((episode) => episode?.hasFile).length,
    };
};

export const applySonarrLibraryStatusToTvDetails = (details, sonarrStatus) => {
    if (!sonarrStatus?.matched || !details || typeof details !== 'object') return details;

    const mediaInfo = { ...(details.mediaInfo || {}) };
    const librarySeasons = Array.isArray(mediaInfo.seasons) ? [...mediaInfo.seasons] : [];
    const bySeason = new Map(
        librarySeasons.map((season) => [Number(season?.seasonNumber), { ...season }]),
    );

    for (const season of sonarrStatus.seasons || []) {
        const seasonNumber = Number(season?.seasonNumber);
        if (!Number.isFinite(seasonNumber) || seasonNumber <= 0) continue;
        if (!(season.airedTotal > 0 || season.withFile > 0)) continue;

        const nextStatus = season.complete ? SEERR_MEDIA_AVAILABLE : SEERR_MEDIA_PARTIAL;
        const existing = bySeason.get(seasonNumber);
        if (existing) {
            if (season.complete || Number(existing.status) !== SEERR_MEDIA_AVAILABLE) {
                existing.status = nextStatus;
            }
            bySeason.set(seasonNumber, existing);
        } else {
            bySeason.set(seasonNumber, { seasonNumber, status: nextStatus });
        }
    }

    mediaInfo.seasons = Array.from(bySeason.values()).sort(
        (a, b) => Number(a.seasonNumber) - Number(b.seasonNumber),
    );

    if (sonarrStatus.showComplete) {
        mediaInfo.status = SEERR_MEDIA_AVAILABLE;
    } else if (mainSeasonsHaveFiles(sonarrStatus.seasons)) {
        mediaInfo.status = SEERR_MEDIA_PARTIAL;
    }

    return {
        ...details,
        mediaInfo,
        sonarrLibraryStatus: sonarrStatus,
    };
};

const mainSeasonsHaveFiles = (seasons = []) => (
    seasons.some((season) => Number(season?.seasonNumber) > 0 && Number(season?.withFile) > 0)
);

export const enrichTvDetailsWithSonarrLibraryStatus = async (config, details, opts = {}) => {
    if (!details || typeof details !== 'object') return details;
    const tmdbId = Number(details.id ?? details.tmdbId);
    if (!Number.isFinite(tmdbId) || tmdbId <= 0) return details;

    const sonarrStatus = await fetchSonarrLibraryStatusForShow(config, tmdbId, opts);
    if (!sonarrStatus.matched) return details;

    return applySonarrLibraryStatusToTvDetails(details, sonarrStatus);
};
