/**
 * Portal library availability (Phase 3).
 * Resolves in-library / partial / downloading without Seerr mediaInfo,
 * using Radarr (movies) + Sonarr (TV) catalogs with aggressive in-memory caches.
 */

import {
    fetchArrInstanceCatalogItems,
    fetchArrQueueSummary,
    getArrInstances,
    isArrInstanceReady,
    lookupSonarrSeriesByTmdb,
} from '../arr-service.js';
import {
    applySonarrLibraryStatusToTvDetails,
    enrichTvDetailsWithSonarrLibraryStatus,
    fetchSonarrLibraryStatusForShow,
} from '../sonarr-library-status.js';
import { filterAvailableMedia, shouldHideAvailableMediaItem } from '../discovery-settings.js';
import {
    buildSonarrSeriesIndexes,
    matchSonarrSeriesFromIndexes,
    resolveTmdbIdFromTvdb,
} from './sonarrSeriesMatch.js';

const SEERR_MEDIA_UNKNOWN = 1;
const SEERR_MEDIA_PROCESSING = 3;
const SEERR_MEDIA_PARTIAL = 4;
const SEERR_MEDIA_AVAILABLE = 5;

const CATALOG_CACHE_MS = 5 * 60 * 1000;
const QUEUE_CACHE_MS = 45 * 1000;
const STATUS_CACHE_MS = 90 * 1000;

const movieCatalogCache = new Map(); // key → { at, byTmdb: Map, list }
const seriesCatalogCache = new Map(); // key → { at, byTmdb: Map, list }
const queueCache = new Map(); // instanceKey → { at, movieIds: Set, seriesIds: Set }
const movieStatusCache = new Map(); // tmdbId → { at, value }
const movieCatalogInflight = new Map(); // instanceKey → Promise
const seriesCatalogInflight = new Map(); // instanceKey → Promise

const now = () => Date.now();

const instanceCacheKey = (instance) => String(instance?.id || instance?.url || '');

const isCatalogFresh = (cached) => cached && now() - cached.at < CATALOG_CACHE_MS;

/** Sync snapshot of cached catalogs — null if any required instance is cold. */
const peekMovieCatalogIndex = (config) => {
    const instances = getArrInstances(config, { type: 'radarr', enabledOnly: true })
        .filter(isArrInstanceReady);
    if (!instances.length) return new Map();
    const byTmdb = new Map();
    for (const instance of instances) {
        const cached = movieCatalogCache.get(instanceCacheKey(instance));
        if (!isCatalogFresh(cached)) return null;
        for (const [tmdb, entry] of cached.byTmdb.entries()) {
            if (!byTmdb.has(tmdb)) byTmdb.set(tmdb, entry);
        }
    }
    return byTmdb;
};

const peekSeriesCatalogIndexes = (config) => {
    const instances = getArrInstances(config, { type: 'sonarr', enabledOnly: true })
        .filter(isArrInstanceReady);
    if (!instances.length) {
        return { byTmdb: new Map(), byTvdb: new Map(), byTitleYear: new Map() };
    }
    const byTmdb = new Map();
    const byTvdb = new Map();
    const byTitleYear = new Map();
    for (const instance of instances) {
        const cached = seriesCatalogCache.get(instanceCacheKey(instance));
        if (!isCatalogFresh(cached)) return null;
        for (const [tmdb, entry] of (cached.byTmdb || new Map()).entries()) {
            if (!byTmdb.has(tmdb)) byTmdb.set(tmdb, entry);
        }
        for (const [tvdb, entry] of (cached.byTvdb || new Map()).entries()) {
            if (!byTvdb.has(tvdb)) byTvdb.set(tvdb, entry);
        }
        for (const [titleKey, entry] of (cached.byTitleYear || new Map()).entries()) {
            if (!byTitleYear.has(titleKey)) byTitleYear.set(titleKey, entry);
        }
    }
    return { byTmdb, byTvdb, byTitleYear };
};

const peekSeriesCatalogIndex = (config) => {
    const indexes = peekSeriesCatalogIndexes(config);
    return indexes ? indexes.byTmdb : null;
};

const loadInstanceMovieCatalog = async (instance, fetchOpts) => {
    const key = instanceCacheKey(instance);
    const cached = movieCatalogCache.get(key);
    if (isCatalogFresh(cached)) return cached;

    if (movieCatalogInflight.has(key)) return movieCatalogInflight.get(key);

    const pending = (async () => {
        const list = await fetchArrInstanceCatalogItems(instance, fetchOpts).catch(() => []);
        const index = new Map();
        for (const movie of list) {
            const tmdb = Number(movie?.tmdbId);
            if (!Number.isFinite(tmdb) || tmdb <= 0) continue;
            index.set(tmdb, { movie, instance });
        }
        const value = { at: now(), list, byTmdb: index };
        movieCatalogCache.set(key, value);
        return value;
    })().finally(() => {
        movieCatalogInflight.delete(key);
    });

    movieCatalogInflight.set(key, pending);
    return pending;
};

const loadInstanceSeriesCatalog = async (instance, fetchOpts) => {
    const key = instanceCacheKey(instance);
    const cached = seriesCatalogCache.get(key);
    if (isCatalogFresh(cached)) return cached;

    if (seriesCatalogInflight.has(key)) return seriesCatalogInflight.get(key);

    const pending = (async () => {
        const list = await fetchArrInstanceCatalogItems(instance, fetchOpts).catch(() => []);
        const indexes = buildSonarrSeriesIndexes(list, instance);
        const value = {
            at: now(),
            list,
            byTmdb: indexes.byTmdb,
            byTvdb: indexes.byTvdb,
            byTitleYear: indexes.byTitleYear,
        };
        seriesCatalogCache.set(key, value);
        return value;
    })().finally(() => {
        seriesCatalogInflight.delete(key);
    });

    seriesCatalogInflight.set(key, pending);
    return pending;
};

const loadMovieCatalogIndex = async (config, fetchOpts) => {
    const instances = getArrInstances(config, { type: 'radarr', enabledOnly: true })
        .filter(isArrInstanceReady);
    const byTmdb = new Map();
    await Promise.all(instances.map(async (instance) => {
        const cached = await loadInstanceMovieCatalog(instance, fetchOpts);
        for (const [tmdb, entry] of cached.byTmdb.entries()) {
            if (!byTmdb.has(tmdb)) byTmdb.set(tmdb, entry);
        }
    }));
    return byTmdb;
};

const loadSeriesCatalogIndexes = async (config, fetchOpts) => {
    const instances = getArrInstances(config, { type: 'sonarr', enabledOnly: true })
        .filter(isArrInstanceReady);
    const byTmdb = new Map();
    const byTvdb = new Map();
    const byTitleYear = new Map();
    await Promise.all(instances.map(async (instance) => {
        const cached = await loadInstanceSeriesCatalog(instance, fetchOpts);
        for (const [tmdb, entry] of (cached.byTmdb || new Map()).entries()) {
            if (!byTmdb.has(tmdb)) byTmdb.set(tmdb, entry);
        }
        for (const [tvdb, entry] of (cached.byTvdb || new Map()).entries()) {
            if (!byTvdb.has(tvdb)) byTvdb.set(tvdb, entry);
        }
        for (const [titleKey, entry] of (cached.byTitleYear || new Map()).entries()) {
            if (!byTitleYear.has(titleKey)) byTitleYear.set(titleKey, entry);
        }
    }));
    return { byTmdb, byTvdb, byTitleYear };
};

const loadSeriesCatalogIndex = async (config, fetchOpts) => {
    const indexes = await loadSeriesCatalogIndexes(config, fetchOpts);
    return indexes.byTmdb;
};

/** Fire-and-forget catalog warm so later enrichItems can be sync-fast. */
const warmCatalogsInBackground = (config, fetchOpts) => {
    loadMovieCatalogIndex(config, fetchOpts).catch(() => {});
    loadSeriesCatalogIndex(config, fetchOpts).catch(() => {});
};

const resolveMediaType = (item = {}) => {
    const raw = item?.mediaType ?? item?.media?.mediaType ?? item?.type;
    if (raw === 'movie' || raw === 1 || raw === '1') return 'movie';
    if (raw === 'tv' || raw === 2 || raw === '2') return 'tv';
    if (item?.firstAirDate && !item?.releaseDate) return 'tv';
    if (item?.releaseDate && !item?.firstAirDate) return 'movie';
    if (item?.name && !item?.title) return 'tv';
    if (item?.title && !item?.name) return 'movie';
    return null;
};

const resolveTmdbId = (item = {}) => {
    const id = Number(item?.tmdbId ?? item?.id);
    return Number.isFinite(id) && id > 0 ? id : null;
};

const movieHasFile = (movie = {}) => {
    if (movie.hasFile === true) return true;
    if (Number(movie.movieFileId) > 0) return true;
    if (movie.movieFile && (movie.movieFile.id || movie.movieFile.relativePath)) return true;
    return false;
};

const seriesStatsStatus = (series = {}) => {
    const stats = series?.statistics || {};
    const episodeCount = Number(stats.episodeCount) || 0;
    const episodeFileCount = Number(stats.episodeFileCount) || 0;
    if (episodeCount > 0 && episodeFileCount >= episodeCount) return SEERR_MEDIA_AVAILABLE;
    if (episodeFileCount > 0) return SEERR_MEDIA_PARTIAL;
    return SEERR_MEDIA_PROCESSING;
};

const loadQueueSets = async (instance, fetchOpts) => {
    const key = instanceCacheKey(instance);
    const cached = queueCache.get(key);
    if (cached && now() - cached.at < QUEUE_CACHE_MS) return cached;

    const movieIds = new Set();
    const seriesIds = new Set();
    try {
        const summary = await fetchArrQueueSummary(instance, fetchOpts);
        for (const row of summary.records || []) {
            const movieId = Number(row?.movieId);
            const seriesId = Number(row?.seriesId);
            if (Number.isFinite(movieId) && movieId > 0) movieIds.add(movieId);
            if (Number.isFinite(seriesId) && seriesId > 0) seriesIds.add(seriesId);
        }
    } catch {
        // Ignore queue failures — availability still works from catalog.
    }

    const value = { at: now(), movieIds, seriesIds };
    queueCache.set(key, value);
    return value;
};

const statusLabelFor = (status) => {
    if (status === SEERR_MEDIA_AVAILABLE) return 'available';
    if (status === SEERR_MEDIA_PARTIAL) return 'partial';
    if (status === SEERR_MEDIA_PROCESSING) return 'processing';
    return 'unknown';
};

/**
 * @param {object} config Portal config
 * @param {object} [options]
 * @param {(url: string) => string} [options.resolveUrl]
 * @param {typeof fetch} [options.fetchImpl]
 * @param {object[]} [options.upgraderItems]
 */
export const createLibraryAvailability = (config = {}, options = {}) => {
    const catalogTimeoutMs = Number(options.catalogTimeoutMs) > 0 ? Number(options.catalogTimeoutMs) : 8000;
    const fetchOpts = {
        resolveUrl: options.resolveUrl || ((url) => url),
        fetchImpl: options.fetchImpl || fetch,
        timeoutMs: catalogTimeoutMs,
    };
    const upgraderItems = Array.isArray(options.upgraderItems) ? options.upgraderItems : [];
    // Kick a background warm on factory create so the first home load is usually ready
    // by the time poster rows finish fetching TMDB.
    warmCatalogsInBackground(config, fetchOpts);

    const getMovieStatus = async (tmdbId) => {
        const id = Number(tmdbId);
        if (!Number.isFinite(id) || id <= 0) {
            return {
                mediaType: 'movie',
                tmdbId: id,
                inLibrary: false,
                partial: false,
                downloading: false,
                status: null,
                statusLabel: null,
                mediaInfo: null,
            };
        }

        const cached = movieStatusCache.get(String(id));
        if (cached && now() - cached.at < STATUS_CACHE_MS) return cached.value;

        const byTmdb = await loadMovieCatalogIndex(config, fetchOpts);
        const hit = byTmdb.get(id);
        if (!hit) {
            const miss = {
                mediaType: 'movie',
                tmdbId: id,
                inLibrary: false,
                partial: false,
                downloading: false,
                status: null,
                statusLabel: null,
                mediaInfo: null,
            };
            movieStatusCache.set(String(id), { at: now(), value: miss });
            return miss;
        }

        const { movie, instance } = hit;
        const queue = await loadQueueSets(instance, fetchOpts);
        const downloading = queue.movieIds.has(Number(movie.id));
        const hasFile = movieHasFile(movie);

        let status = SEERR_MEDIA_PROCESSING;
        if (hasFile && !downloading) status = SEERR_MEDIA_AVAILABLE;
        else if (hasFile && downloading) status = SEERR_MEDIA_PROCESSING;
        else if (downloading) status = SEERR_MEDIA_PROCESSING;

        const mediaInfo = {
            id: Number(movie.id) || id,
            tmdbId: id,
            status,
            mediaType: 'movie',
        };
        if (downloading) {
            mediaInfo.downloadStatus = [{ status: 'downloading', movieId: movie.id }];
        }

        const value = {
            mediaType: 'movie',
            tmdbId: id,
            inLibrary: hasFile,
            partial: false,
            downloading,
            status,
            statusLabel: statusLabelFor(status),
            mediaInfo,
            radarrLibraryStatus: {
                matched: true,
                movieId: movie.id,
                instanceId: instance.id,
                instanceName: instance.name || 'Radarr',
                hasFile,
                downloading,
            },
        };
        movieStatusCache.set(String(id), { at: now(), value });
        return value;
    };

    /** Fast list-path TV status from Sonarr series statistics (no episode fan-out). */
    const getTvListStatus = async (tmdbId, { title = '', year = null } = {}) => {
        const id = Number(tmdbId);
        if (!Number.isFinite(id) || id <= 0) {
            return {
                mediaType: 'tv',
                tmdbId: id,
                inLibrary: false,
                partial: false,
                downloading: false,
                status: null,
                statusLabel: null,
                mediaInfo: null,
            };
        }

        const indexes = await loadSeriesCatalogIndexes(config, fetchOpts);
        let hit = await matchSonarrSeriesFromIndexes(config, id, indexes, {
            fetchImpl: fetchOpts.fetchImpl || fetch,
            title,
            year,
        });

        if (!hit) {
            // Sonarr lookup fills the gap when library rows lack tmdbId but are already monitored.
            for (const instance of getArrInstances(config, { type: 'sonarr', enabledOnly: true }).filter(isArrInstanceReady)) {
                try {
                    const lookup = await lookupSonarrSeriesByTmdb(instance, id, fetchOpts);
                    if (lookup?.id) {
                        hit = { series: lookup, instance };
                        break;
                    }
                    const lookupTvdb = Number(lookup?.tvdbId);
                    if (Number.isFinite(lookupTvdb) && lookupTvdb > 0 && indexes.byTvdb.has(lookupTvdb)) {
                        hit = indexes.byTvdb.get(lookupTvdb);
                        break;
                    }
                } catch {
                    // try next instance
                }
            }
        }

        if (!hit?.series) {
            return {
                mediaType: 'tv',
                tmdbId: id,
                inLibrary: false,
                partial: false,
                downloading: false,
                status: null,
                statusLabel: null,
                mediaInfo: null,
            };
        }

        const { series, instance } = hit;
        const queue = await loadQueueSets(instance, fetchOpts);
        const downloading = queue.seriesIds.has(Number(series.id));
        let status = seriesStatsStatus(series);
        if (downloading && status === SEERR_MEDIA_AVAILABLE) status = SEERR_MEDIA_PARTIAL;

        const mediaInfo = {
            id: Number(series.id) || id,
            tmdbId: id,
            status,
            mediaType: 'tv',
        };
        if (downloading) {
            mediaInfo.downloadStatus = [{ status: 'downloading', seriesId: series.id }];
        }

        // Lightweight season hints from Sonarr season stats when present.
        const seasons = Array.isArray(series.seasons)
            ? series.seasons
                .map((season) => {
                    const seasonNumber = Number(season?.seasonNumber);
                    if (!Number.isFinite(seasonNumber) || seasonNumber <= 0) return null;
                    const stats = season?.statistics || {};
                    const episodeCount = Number(stats.episodeCount) || 0;
                    const episodeFileCount = Number(stats.episodeFileCount) || 0;
                    if (episodeFileCount <= 0) return null;
                    return {
                        seasonNumber,
                        status: episodeCount > 0 && episodeFileCount >= episodeCount
                            ? SEERR_MEDIA_AVAILABLE
                            : SEERR_MEDIA_PARTIAL,
                    };
                })
                .filter(Boolean)
            : [];
        if (seasons.length) mediaInfo.seasons = seasons;

        return {
            mediaType: 'tv',
            tmdbId: id,
            inLibrary: status === SEERR_MEDIA_AVAILABLE || status === SEERR_MEDIA_PARTIAL,
            partial: status === SEERR_MEDIA_PARTIAL,
            downloading,
            status,
            statusLabel: statusLabelFor(status),
            mediaInfo,
            sonarrLibraryStatus: {
                matched: true,
                seriesId: series.id,
                instanceId: instance.id,
                instanceName: instance.name || 'Sonarr',
                showComplete: status === SEERR_MEDIA_AVAILABLE && !downloading,
                hasActiveDownloads: downloading,
                source: 'catalog',
            },
        };
    };

    const getMediaStatus = async (mediaType, tmdbId) => {
        const type = mediaType === 'tv' ? 'tv' : 'movie';
        if (type === 'movie') return getMovieStatus(tmdbId);

        // Detail-grade Sonarr status (episode-aware) for single lookups.
        const sonarrStatus = await fetchSonarrLibraryStatusForShow(config, tmdbId, {
            ...fetchOpts,
            upgraderItems,
        });
        if (!sonarrStatus?.matched) {
            return {
                mediaType: 'tv',
                tmdbId: Number(tmdbId),
                inLibrary: false,
                partial: false,
                downloading: false,
                status: null,
                statusLabel: null,
                mediaInfo: null,
                sonarrLibraryStatus: sonarrStatus,
            };
        }

        let status = SEERR_MEDIA_UNKNOWN;
        if (sonarrStatus.showComplete && !sonarrStatus.hasActiveDownloads) {
            status = SEERR_MEDIA_AVAILABLE;
        } else if ((sonarrStatus.fileCount || 0) > 0 || (sonarrStatus.seasons || []).some((s) => s.withFile > 0)) {
            status = SEERR_MEDIA_PARTIAL;
        } else if (sonarrStatus.hasActiveDownloads) {
            status = SEERR_MEDIA_PROCESSING;
        } else {
            status = SEERR_MEDIA_PROCESSING;
        }

        const mediaInfo = {
            id: Number(sonarrStatus.seriesId) || Number(tmdbId),
            tmdbId: Number(tmdbId),
            status,
            mediaType: 'tv',
            seasons: (sonarrStatus.seasons || [])
                .filter((season) => Number(season?.seasonNumber) > 0 && (season.airedTotal > 0 || season.withFile > 0))
                .map((season) => ({
                    seasonNumber: season.seasonNumber,
                    status: season.complete ? SEERR_MEDIA_AVAILABLE : SEERR_MEDIA_PARTIAL,
                })),
        };
        if (sonarrStatus.hasActiveDownloads) {
            mediaInfo.downloadStatus = [{ status: 'downloading', seriesId: sonarrStatus.seriesId }];
        }

        return {
            mediaType: 'tv',
            tmdbId: Number(tmdbId),
            inLibrary: status === SEERR_MEDIA_AVAILABLE || status === SEERR_MEDIA_PARTIAL,
            partial: status === SEERR_MEDIA_PARTIAL,
            downloading: !!sonarrStatus.hasActiveDownloads,
            status,
            statusLabel: statusLabelFor(status),
            mediaInfo,
            sonarrLibraryStatus: sonarrStatus,
        };
    };

    /**
     * Enrich discover list items with mediaInfo.
     * @param {object[]} items
     * @param {object} [opts]
     * @param {boolean} [opts.blockForCatalog=false] When false (default), skip enrich if *arr
     *   catalogs are cold and warm them in the background — keeps Discover browse fast.
     */
    const enrichItems = async (items = [], opts = {}) => {
        if (!Array.isArray(items) || items.length === 0) return items;

        const blockForCatalog = opts.blockForCatalog === true;
        const needsMovies = items.some((item) => resolveMediaType(item) === 'movie');
        const needsTv = items.some((item) => resolveMediaType(item) === 'tv');

        let movieIndex = needsMovies ? peekMovieCatalogIndex(config) : new Map();
        let seriesIndex = needsTv ? peekSeriesCatalogIndex(config) : new Map();
        const catalogsCold = (needsMovies && movieIndex == null) || (needsTv && seriesIndex == null);

        if (catalogsCold) {
            warmCatalogsInBackground(config, fetchOpts);
            if (!blockForCatalog) {
                // Return TMDB payload immediately; next requests will enrich from cache.
                return items;
            }
            if (needsMovies) movieIndex = await loadMovieCatalogIndex(config, fetchOpts);
            if (needsTv) seriesIndex = await loadSeriesCatalogIndex(config, fetchOpts);
        }

        // Use fast path once catalogs are warm (Map lookups only).
        const enriched = await Promise.all(items.map(async (item) => {
            const mediaType = resolveMediaType(item);
            const tmdbId = resolveTmdbId(item);
            if (!mediaType || !tmdbId || mediaType === 'person') return item;

            try {
                const yearRaw = String(item?.firstAirDate || item?.releaseDate || '').slice(0, 4);
                const year = Number(yearRaw);
                const availability = mediaType === 'movie'
                    ? await getMovieStatus(tmdbId)
                    : await getTvListStatus(tmdbId, {
                        title: item?.title || item?.name || '',
                        year: Number.isFinite(year) && year > 1900 ? year : null,
                    });

                if (!availability?.mediaInfo) return item;

                return {
                    ...item,
                    mediaInfo: {
                        ...(item.mediaInfo || {}),
                        ...availability.mediaInfo,
                    },
                    ...(availability.sonarrLibraryStatus
                        ? { sonarrLibraryStatus: availability.sonarrLibraryStatus }
                        : {}),
                    ...(availability.radarrLibraryStatus
                        ? { radarrLibraryStatus: availability.radarrLibraryStatus }
                        : {}),
                };
            } catch {
                return item;
            }
        }));

        return enriched;
    };

    const enrichDetails = async (details = {}) => {
        if (!details || typeof details !== 'object' || Array.isArray(details)) return details;
        const mediaType = resolveMediaType(details);
        const tmdbId = resolveTmdbId(details);
        if (!mediaType || !tmdbId) return details;

        if (mediaType === 'movie') {
            const availability = await getMovieStatus(tmdbId);
            if (!availability?.mediaInfo) return details;
            return {
                ...details,
                mediaInfo: {
                    ...(details.mediaInfo || {}),
                    ...availability.mediaInfo,
                },
                radarrLibraryStatus: availability.radarrLibraryStatus,
            };
        }

        const enriched = await enrichTvDetailsWithSonarrLibraryStatus(config, details, {
            ...fetchOpts,
            upgraderItems,
        });
        if (enriched?.sonarrLibraryStatus?.matched && enriched.mediaInfo && !enriched.mediaInfo.id) {
            return {
                ...enriched,
                mediaInfo: {
                    ...enriched.mediaInfo,
                    id: Number(enriched.sonarrLibraryStatus.seriesId) || tmdbId,
                },
            };
        }
        // Ensure mediaInfo.id even when applySonarr already set status.
        if (enriched?.sonarrLibraryStatus?.matched) {
            return applySonarrLibraryStatusToTvDetails(
                {
                    ...enriched,
                    mediaInfo: {
                        ...(enriched.mediaInfo || {}),
                        id: Number(enriched.sonarrLibraryStatus.seriesId) || tmdbId,
                    },
                },
                enriched.sonarrLibraryStatus,
            );
        }
        return enriched;
    };

    const filterAvailable = async (items, opts = {}) => {
        const list = Array.isArray(items) ? items : [];
        const enriched = opts.enrich === false ? list : await enrichItems(list);
        if (opts.hideAvailable) return filterAvailableMedia(enriched);
        return enriched.filter((item) => !shouldHideAvailableMediaItem(item));
    };

    /** Snapshot every catalog title for the on-disk discovery availability cache. */
    const snapshotLibraryStatuses = async () => {
        const [movieIndex, seriesIndexes] = await Promise.all([
            loadMovieCatalogIndex(config, fetchOpts),
            loadSeriesCatalogIndexes(config, fetchOpts),
        ]);

        const byKey = {};
        const movieIds = [...movieIndex.keys()];
        const seriesIdSet = new Set([...seriesIndexes.byTmdb.keys()]);

        // Sonarr rows often lack tmdbId — map TVDB → TMDB so browse badges can key by TMDB.
        for (const [tvdb, entry] of seriesIndexes.byTvdb.entries()) {
            const existingTmdb = Number(entry?.series?.tmdbId);
            if (Number.isFinite(existingTmdb) && existingTmdb > 0) {
                seriesIdSet.add(existingTmdb);
                continue;
            }
            const resolvedTmdb = await resolveTmdbIdFromTvdb(config, tvdb, {
                fetchImpl: fetchOpts.fetchImpl || fetch,
            });
            if (resolvedTmdb) seriesIdSet.add(resolvedTmdb);
        }

        const seriesIds = [...seriesIdSet];

        // Chunk to keep event loop responsive on large libraries.
        const chunkSize = 200;
        for (let i = 0; i < movieIds.length; i += chunkSize) {
            const slice = movieIds.slice(i, i + chunkSize);
            await Promise.all(slice.map(async (tmdbId) => {
                const status = await getMovieStatus(tmdbId);
                if (!status?.mediaInfo) return;
                byKey[`movie:${tmdbId}`] = {
                    mediaInfo: status.mediaInfo,
                    radarrLibraryStatus: status.radarrLibraryStatus || null,
                    sonarrLibraryStatus: null,
                };
            }));
        }
        for (let i = 0; i < seriesIds.length; i += chunkSize) {
            const slice = seriesIds.slice(i, i + chunkSize);
            await Promise.all(slice.map(async (tmdbId) => {
                const status = await getTvListStatus(tmdbId);
                if (!status?.mediaInfo) return;
                byKey[`tv:${tmdbId}`] = {
                    mediaInfo: status.mediaInfo,
                    sonarrLibraryStatus: status.sonarrLibraryStatus || null,
                    radarrLibraryStatus: null,
                };
            }));
        }

        return {
            movieCount: movieIds.length,
            tvCount: seriesIds.length,
            itemCount: Object.keys(byKey).length,
            byKey,
        };
    };

    return {
        getMediaStatus,
        enrichItems,
        enrichDetails,
        filterAvailable,
        snapshotLibraryStatuses,
        /** Test / ops helpers */
        _caches: {
            movieCatalogCache,
            seriesCatalogCache,
            queueCache,
            movieStatusCache,
        },
    };
};

export default createLibraryAvailability;
