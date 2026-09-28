import {
    chunk,
    decideRating,
    decideWatched,
    episodeKey,
    hasAnyId,
    indexByIds,
    movieKey,
    normalizeRating,
} from './ids.js';
import { loadWatchSyncSnapshot, saveWatchSyncSnapshot } from './config.js';

const toIso = (value) => {
    if (value == null || value === '') return new Date().toISOString();
    if (typeof value === 'number' || /^\d+$/.test(String(value))) {
        const n = Number(value);
        const date = new Date(n > 1e12 ? n : n * 1000);
        return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
};

const traktIds = (ids) => {
    const out = {};
    if (ids?.imdb) out.imdb = ids.imdb;
    if (ids?.tmdb) out.tmdb = Number(ids.tmdb);
    if (ids?.tvdb) out.tvdb = Number(ids.tvdb);
    return out;
};

const preferShowIds = (ids) => {
    if (ids?.tvdb) return { tvdb: Number(ids.tvdb) };
    if (ids?.imdb) return { imdb: ids.imdb };
    if (ids?.tmdb) return { tmdb: Number(ids.tmdb) };
    return {};
};

const pool = async (items, limit, worker) => {
    const queue = [...(items || [])];
    const failed = [];
    const width = Math.min(Math.max(limit, 1), Math.max(queue.length, 1));
    const workers = Array.from({ length: queue.length ? width : 0 }, async () => {
        while (queue.length) {
            const item = queue.shift();
            try {
                await worker(item);
            } catch {
                failed.push(item);
            }
        }
    });
    await Promise.all(workers);
    return failed;
};

const revertPlexWatch = (item, nextMovies, nextEpisodes) => {
    if (item?.showIds) {
        const key = episodeKey(item.showIds, item.season, item.episode);
        if (key && nextEpisodes[key]) nextEpisodes[key].plexWatched = !!item.watched;
        return;
    }
    const key = movieKey(item?.ids);
    if (key && nextMovies[key]) nextMovies[key].plexWatched = !!item.watched;
};

const revertPlexRating = (item, nextMovies, nextEpisodes) => {
    const rating = normalizeRating(item?.previousRating);
    if (item?.showIds) {
        const key = episodeKey(item.showIds, item.season, item.episode);
        if (key && nextEpisodes[key]) nextEpisodes[key].plexRating = rating;
        return;
    }
    const key = movieKey(item?.ids);
    if (key && nextMovies[key]) nextMovies[key].plexRating = rating;
};

const groupHistoryShows = (episodes) => {
    const shows = new Map();
    for (const episode of episodes) {
        const key = movieKey(episode.showIds);
        if (!key) continue;
        if (!shows.has(key)) shows.set(key, { ids: preferShowIds(episode.showIds), seasons: new Map() });
        const show = shows.get(key);
        const season = Number(episode.season);
        if (!show.seasons.has(season)) show.seasons.set(season, []);
        show.seasons.get(season).push({
            number: Number(episode.episode),
            watched_at: toIso(episode.watchedAt),
        });
    }
    return [...shows.values()].map((show) => ({
        ids: show.ids,
        seasons: [...show.seasons.entries()].map(([number, episodesInSeason]) => ({
            number,
            episodes: episodesInSeason,
        })),
    }));
};

const indexWatchedEpisodes = (rows) => {
    const map = new Map();
    for (const row of rows || []) {
        const showIds = row?.show?.ids || {};
        for (const season of row.seasons || []) {
            for (const episode of season.episodes || []) {
                const key = episodeKey(showIds, season.number, episode.number);
                if (key) map.set(key, episode.last_watched_at || row.last_watched_at || null);
            }
        }
    }
    return map;
};

const indexRatedEpisodes = (rows) => {
    const map = new Map();
    for (const row of rows || []) {
        const showIds = row?.show?.ids || {};
        const season = row?.episode?.season;
        const number = row?.episode?.number;
        const key = episodeKey(showIds, season, number);
        if (key) map.set(key, normalizeRating(row.rating));
    }
    return map;
};

const emptySummary = () => ({
    plexMovies: 0,
    plexEpisodes: 0,
    traktWatchedMovies: 0,
    traktWatchedEpisodes: 0,
    watchedToTrakt: 0,
    watchedToPlex: 0,
    ratingsToTrakt: 0,
    ratingsToPlex: 0,
    collectionToTrakt: 0,
    watchlistToTrakt: 0,
    watchlistToPlex: 0,
    skipped: 0,
    failed: 0,
});

export const runWatchSync = async ({
    config,
    saveConfig,
    plex,
    trakt,
    plexConn,
    onProgress,
    shouldCancel,
    systemJob,
    markTaskStart,
    markTaskEnd,
}) => {
    const summary = emptySummary();
    const note = (message) => {
        if (typeof onProgress === 'function') onProgress(message);
    };
    if (systemJob && typeof markTaskStart === 'function') markTaskStart(systemJob);
    try {
        if (!config.clientId || !config.clientSecret) {
            throw new Error('Add a Trakt client ID and client secret on the Watch Sync page.');
        }
        if (!config.accessToken) throw new Error('Connect a Trakt account before syncing.');
        if (!plexConn?.base_url || !plexConn?.token) {
            throw new Error('Configure the Plex server URL and token under Settings → Media Player.');
        }

        let live = config;
        note('Refreshing Trakt login');
        live = await trakt.refreshIfNeeded(live, saveConfig);

        note('Reading Plex libraries');
        const library = await plex.collect(
            plexConn.base_url,
            plexConn.token,
            live.libraryIds,
            note,
        );
        summary.plexMovies = library.movies.length;
        summary.plexEpisodes = library.episodes.length;

        note('Reading Trakt');
        const [
            watchedMovies,
            watchedShows,
            ratingMovies,
            ratingEpisodes,
            collectionMovies,
            collectionShows,
            watchlistMovies,
            watchlistShows,
        ] = await Promise.all([
            live.plexToTrakt.watched || live.traktToPlex.watched ? trakt.watchedMovies(live) : [],
            live.plexToTrakt.watched || live.traktToPlex.watched ? trakt.watchedShows(live) : [],
            live.plexToTrakt.ratings || live.traktToPlex.ratings ? trakt.ratingsMovies(live) : [],
            live.plexToTrakt.ratings || live.traktToPlex.ratings ? trakt.ratingsEpisodes(live) : [],
            live.plexToTrakt.collection ? trakt.collectionMovies(live) : [],
            live.plexToTrakt.collection ? trakt.collectionShows(live) : [],
            live.plexToTrakt.watchlist || live.traktToPlex.watchlist ? trakt.watchlistMovies(live) : [],
            live.plexToTrakt.watchlist || live.traktToPlex.watchlist ? trakt.watchlistShows(live) : [],
        ]);

        const traktMovieWatched = indexByIds(watchedMovies, (row) => row?.movie?.ids || {});
        const traktMovieRatings = indexByIds(ratingMovies, (row) => row?.movie?.ids || {});
        const traktMovieCollection = indexByIds(collectionMovies, (row) => row?.movie?.ids || {});
        const traktShowCollection = indexByIds(collectionShows, (row) => row?.show?.ids || {});
        const traktMovieWatch = indexByIds(watchlistMovies, (row) => row?.movie?.ids || {});
        const traktShowWatch = indexByIds(watchlistShows, (row) => row?.show?.ids || {});
        const watchedEpisodeAt = indexWatchedEpisodes(watchedShows);
        const ratedEpisodes = indexRatedEpisodes(ratingEpisodes);
        summary.traktWatchedMovies = watchedMovies.length;
        summary.traktWatchedEpisodes = watchedEpisodeAt.size;

        const snapshot = await loadWatchSyncSnapshot();
        const nextMovies = { ...snapshot.movies };
        const nextEpisodes = { ...snapshot.episodes };

        const historyMovies = [];
        const historyEpisodes = [];
        const plexWatches = [];
        const ratingMoviesOut = [];
        const ratingEpisodesOut = [];
        const plexRates = [];
        const collectionOutMovies = [];
        const collectionOutShows = [];
        const watchlistOutMovies = [];
        const watchlistOutShows = [];
        const plexWatchlist = [];

        const cancel = () => (typeof shouldCancel === 'function' ? shouldCancel() : false);

        for (const movie of library.movies) {
            const key = movieKey(movie.ids);
            if (!key) {
                summary.skipped += 1;
                continue;
            }
            const prev = snapshot.movies[key] || null;
            const traktWatched = traktMovieWatched.find(movie.ids);
            const traktRatingRow = traktMovieRatings.find(movie.ids);
            const plexWatched = !!movie.watched;
            const traktIsWatched = !!traktWatched;
            const watchAction = decideWatched({
                plexWatched,
                traktWatched: traktIsWatched,
                prev,
                plexToTrakt: live.plexToTrakt.watched,
                traktToPlex: live.traktToPlex.watched,
                plexAt: movie.watchedAt,
                traktAt: traktWatched?.last_watched_at,
            });
            if (watchAction === 'toTrakt') historyMovies.push(movie);
            if (watchAction === 'toPlex') plexWatches.push(movie);

            const ratingAction = decideRating({
                plexRating: movie.rating,
                traktRating: traktRatingRow?.rating,
                prev,
                plexToTrakt: live.plexToTrakt.ratings,
                traktToPlex: live.traktToPlex.ratings,
            });
            if (ratingAction === 'toTrakt') ratingMoviesOut.push({ ids: traktIds(movie.ids), rating: normalizeRating(movie.rating) });
            if (ratingAction === 'toPlex') {
                plexRates.push({
                    ratingKey: movie.ratingKey,
                    rating: normalizeRating(traktRatingRow.rating),
                    ids: movie.ids,
                    previousRating: normalizeRating(movie.rating),
                });
            }

            if (live.plexToTrakt.collection && !traktMovieCollection.find(movie.ids)) {
                collectionOutMovies.push({ ids: traktIds(movie.ids) });
            }
            if (live.traktToPlex.watchlist && traktMovieWatch.find(movie.ids) && movie.plexGuid) {
                plexWatchlist.push(movie);
            }

            nextMovies[key] = {
                plexWatched: watchAction === 'toPlex' ? true : plexWatched,
                traktWatched: watchAction === 'toTrakt' ? true : traktIsWatched,
                plexRating: ratingAction === 'toPlex' ? normalizeRating(traktRatingRow.rating) : normalizeRating(movie.rating),
                traktRating: ratingAction === 'toTrakt' ? normalizeRating(movie.rating) : normalizeRating(traktRatingRow?.rating),
            };
        }

        for (const show of library.shows) {
            if (!hasAnyId(show.ids)) continue;
            if (live.plexToTrakt.collection && !traktShowCollection.find(show.ids)) {
                collectionOutShows.push({ ids: traktIds(show.ids) });
            }
            if (live.traktToPlex.watchlist && traktShowWatch.find(show.ids) && show.plexGuid) {
                plexWatchlist.push(show);
            }
        }

        for (const episode of library.episodes) {
            const key = episodeKey(episode.showIds, episode.season, episode.episode);
            if (!key) {
                summary.skipped += 1;
                continue;
            }
            const prev = snapshot.episodes[key] || null;
            const traktAt = watchedEpisodeAt.has(key) ? watchedEpisodeAt.get(key) : null;
            const traktWatched = watchedEpisodeAt.has(key);
            const traktRating = ratedEpisodes.has(key) ? ratedEpisodes.get(key) : null;
            const watchAction = decideWatched({
                plexWatched: episode.watched,
                traktWatched,
                prev,
                plexToTrakt: live.plexToTrakt.watched,
                traktToPlex: live.traktToPlex.watched,
                plexAt: episode.watchedAt,
                traktAt,
            });
            if (watchAction === 'toTrakt') historyEpisodes.push(episode);
            if (watchAction === 'toPlex') plexWatches.push(episode);

            const ratingAction = decideRating({
                plexRating: episode.rating,
                traktRating,
                prev,
                plexToTrakt: live.plexToTrakt.ratings,
                traktToPlex: live.traktToPlex.ratings,
            });
            if (ratingAction === 'toTrakt' && hasAnyId(episode.episodeIds)) {
                ratingEpisodesOut.push({ ids: traktIds(episode.episodeIds), rating: normalizeRating(episode.rating) });
            } else if (ratingAction === 'toTrakt') {
                summary.skipped += 1;
            }
            if (ratingAction === 'toPlex') {
                plexRates.push({
                    ratingKey: episode.ratingKey,
                    rating: traktRating,
                    showIds: episode.showIds,
                    season: episode.season,
                    episode: episode.episode,
                    previousRating: normalizeRating(episode.rating),
                });
            }

            nextEpisodes[key] = {
                plexWatched: watchAction === 'toPlex' ? true : !!episode.watched,
                traktWatched: watchAction === 'toTrakt' ? true : traktWatched,
                plexRating: ratingAction === 'toPlex' ? traktRating : normalizeRating(episode.rating),
                traktRating: ratingAction === 'toTrakt' && hasAnyId(episode.episodeIds)
                    ? normalizeRating(episode.rating)
                    : traktRating,
            };
        }

        if (cancel()) throw new Error('Sync cancelled');

        note(`Sending ${historyMovies.length + historyEpisodes.length} watches to Trakt`);
        for (const batch of chunk(historyMovies, 100)) {
            if (cancel()) throw new Error('Sync cancelled');
            await trakt.addHistory(live, {
                movies: batch.map((movie) => ({
                    ids: traktIds(movie.ids),
                    watched_at: toIso(movie.watchedAt),
                })),
            });
            summary.watchedToTrakt += batch.length;
        }
        for (const batch of chunk(groupHistoryShows(historyEpisodes), 20)) {
            if (cancel()) throw new Error('Sync cancelled');
            const episodeCount = batch.reduce((sum, show) => (
                sum + show.seasons.reduce((inner, season) => inner + season.episodes.length, 0)
            ), 0);
            await trakt.addHistory(live, { shows: batch });
            summary.watchedToTrakt += episodeCount;
        }

        note(`Marking ${plexWatches.length} items watched in Plex`);
        const failedWatches = await pool(plexWatches, 4, (item) => plex.scrobble(plexConn.base_url, plexConn.token, item.ratingKey));
        for (const item of failedWatches) revertPlexWatch(item, nextMovies, nextEpisodes);
        summary.failed += failedWatches.length;
        summary.watchedToPlex += plexWatches.length - failedWatches.length;

        for (const batch of chunk(ratingMoviesOut, 100)) {
            await trakt.addRatings(live, { movies: batch });
            summary.ratingsToTrakt += batch.length;
        }
        for (const batch of chunk(ratingEpisodesOut, 100)) {
            await trakt.addRatings(live, { episodes: batch });
            summary.ratingsToTrakt += batch.length;
        }
        const failedRates = await pool(plexRates, 4, (item) => plex.rate(plexConn.base_url, plexConn.token, item.ratingKey, item.rating));
        for (const item of failedRates) revertPlexRating(item, nextMovies, nextEpisodes);
        summary.failed += failedRates.length;
        summary.ratingsToPlex += plexRates.length - failedRates.length;

        for (const batch of chunk(collectionOutMovies, 100)) {
            await trakt.addCollection(live, { movies: batch });
            summary.collectionToTrakt += batch.length;
        }
        for (const batch of chunk(collectionOutShows, 100)) {
            await trakt.addCollection(live, { shows: batch });
            summary.collectionToTrakt += batch.length;
        }

        if (live.plexToTrakt.watchlist) {
            try {
                note('Reading Plex watchlist');
                const plexItems = await plex.watchlist(plexConn.token);
                for (const item of plexItems) {
                    if (!hasAnyId(item.ids)) continue;
                    const existing = item.type === 'show' ? traktShowWatch.find(item.ids) : traktMovieWatch.find(item.ids);
                    if (existing) continue;
                    if (item.type === 'show') watchlistOutShows.push({ ids: traktIds(item.ids) });
                    else watchlistOutMovies.push({ ids: traktIds(item.ids) });
                }
            } catch (error) {
                note(`Plex watchlist skipped: ${error.message}`);
            }
        }
        for (const batch of chunk(watchlistOutMovies, 100)) {
            await trakt.addWatchlist(live, { movies: batch });
            summary.watchlistToTrakt += batch.length;
        }
        for (const batch of chunk(watchlistOutShows, 100)) {
            await trakt.addWatchlist(live, { shows: batch });
            summary.watchlistToTrakt += batch.length;
        }
        if (live.traktToPlex.watchlist) {
            const failedWatchlist = await pool(plexWatchlist, 3, (item) => plex.addToWatchlist(plexConn.base_url, plexConn.token, item.plexGuid));
            summary.failed += failedWatchlist.length;
            summary.watchlistToPlex += plexWatchlist.length - failedWatchlist.length;
        }

        await saveWatchSyncSnapshot({ movies: nextMovies, episodes: nextEpisodes });
        const lastRun = {
            at: new Date().toISOString(),
            ok: summary.failed === 0,
            summary,
        };
        if (typeof saveConfig === 'function') {
            await saveConfig({ ...live, lastRunAt: lastRun.at, lastRun });
        }
        note('Sync finished');
        if (systemJob && typeof markTaskEnd === 'function') markTaskEnd(systemJob, null);
        return { ok: true, summary };
    } catch (error) {
        if (systemJob && typeof markTaskEnd === 'function') markTaskEnd(systemJob, error);
        throw error;
    }
};
