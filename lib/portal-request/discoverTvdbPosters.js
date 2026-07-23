/**
 * Fill missing Discover TV posters from TheTVDB when TMDB has none.
 */

import { resolveTvdbIdFromTmdb } from './sonarrSeriesMatch.js';
import { createTvdbClient } from './tvdbClient.js';

const isTvItem = (item) => {
    const type = item?.mediaType ?? item?.type ?? item?.media_type;
    return type === 'tv' || type === 2 || type === '2' || type === 'show';
};

const hasPoster = (item) => !!(
    item?.posterPath
    || item?.posterUrl
    || item?.poster
);

const itemTmdbId = (item) => {
    const id = Number(item?.tmdbId ?? item?.id);
    return Number.isFinite(id) && id > 0 ? id : null;
};

const itemTvdbHint = (item) => {
    const id = Number(
        item?.tvdbId
        ?? item?.externalIds?.tvdbId
        ?? item?.externalIds?.tvdb_id
        ?? item?.mediaInfo?.tvdbId,
    );
    return Number.isFinite(id) && id > 0 ? id : null;
};

const mapPool = async (items, concurrency, worker) => {
    const list = Array.isArray(items) ? items : [];
    const results = new Array(list.length);
    let cursor = 0;
    const runners = Array.from({ length: Math.min(concurrency, list.length) }, async () => {
        while (cursor < list.length) {
            const index = cursor;
            cursor += 1;
            results[index] = await worker(list[index], index);
        }
    });
    await Promise.all(runners);
    return results;
};

/**
 * Enrich a Discover list/detail payload so TV rows without TMDB art get a TVDB poster URL.
 * Sets absolute `posterPath` (client already accepts http(s) via resolve helpers).
 *
 * @param {object} config
 * @param {any} payload
 * @param {{ fetchImpl?: typeof fetch, timeoutMs?: number, concurrency?: number }} [options]
 */
export const enrichDiscoveryPayloadWithTvdbPosters = async (config, payload, options = {}) => {
    const apiKey = String(config?.tvdbApiKey || '').trim();
    if (!apiKey || payload == null) return payload;

    const fetchImpl = options.fetchImpl || fetch;
    const timeoutMs = Math.max(500, Number(options.timeoutMs) || 2500);
    const concurrency = Math.max(1, Math.min(6, Number(options.concurrency) || 4));
    const tvdb = createTvdbClient(config, { fetchImpl });
    if (!tvdb.enabled) return payload;

    const enrichOne = async (item) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) return item;
        if (!isTvItem(item) || hasPoster(item)) return item;

        const tmdbId = itemTmdbId(item);
        if (!tmdbId) return item;

        try {
            const hinted = itemTvdbHint(item);
            const tvdbId = hinted || await resolveTvdbIdFromTmdb(config, tmdbId, { fetchImpl });
            if (!tvdbId) return item;
            const posterUrl = await tvdb.getSeriesPosterUrl(tvdbId);
            if (!posterUrl) return item;
            return {
                ...item,
                posterPath: posterUrl,
                posterSource: 'tvdb',
                tvdbId,
            };
        } catch {
            return item;
        }
    };

    const run = async () => {
        if (Array.isArray(payload?.results)) {
            const results = await mapPool(payload.results, concurrency, enrichOne);
            return { ...payload, results };
        }
        if (payload && typeof payload === 'object' && !Array.isArray(payload) && isTvItem(payload)) {
            return enrichOne(payload);
        }
        return payload;
    };

    try {
        return await Promise.race([
            run(),
            new Promise((resolve) => {
                setTimeout(() => resolve(payload), timeoutMs);
            }),
        ]);
    } catch {
        return payload;
    }
};
