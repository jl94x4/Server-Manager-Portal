import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import {
    clampPlayOffsetMs,
    isAllowedPlexProxyUrl,
    isHlsPlaylist,
    isPlaySessionId,
    isPlayerQualityId,
    actorQueryValues,
    buildPlayerHlsSrc,
    mapContinueWatchingItem,
    mapLibraryHubItem,
    mapPlayerExtras,
    mapPlayerHubs,
    mapPlayerItem,
    mapPlayerItemDetails,
    mapPlayerPlaybackOptions,
    mapPlayerSection,
    mapRecentlyAddedItem,
    nextEpisodeInList,
    pickPersonFromMetadata,
    PLAYER_LIBRARY_SORT_IDS,
    rewritePlaylistUrls,
    rewritePlexUrlToOrigin,
    transcodeSettingsForQuality,
    TIMELINE_STATES,
    buildPlexTimelineParams,
    DEFAULT_PLAYER_QUALITY_ID,
} from './mapItem.js';

const HLS_CLIENT_PROFILE = [
    'add-transcode-target(type=videoProfile&context=streaming&protocol=hls&container=mpegts&videoCodec=h264&audioCodec=aac)',
    'add-limitation(scope=videoCodec&scopeName=h264&type=upperBound&name=video.width&value=1920)',
    'add-limitation(scope=videoCodec&scopeName=h264&type=upperBound&name=video.height&value=1080)',
].join('+');

const plexStreamLocation = (uri) => {
    try {
        const host = new URL(uri).hostname.toLowerCase();
        if (
            host === 'localhost'
            || host.endsWith('.local')
            || host.endsWith('.plex.direct')
            || /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host)
        ) return 'lan';
    } catch {
        /* ignore */
    }
    return 'wan';
};

const plexJson = async (fetchImpl, url, headers) => {
    const res = await fetchImpl(url, { headers });
    if (!res.ok) throw new Error(`Plex request failed (${res.status})`);
    return res.json();
};

const metadataList = (payload) => payload?.MediaContainer?.Metadata || [];

const dedupeItems = (list, limit = 24) => {
    const seen = new Set();
    return (Array.isArray(list) ? list : []).filter((row) => {
        const key = row?.ratingKey || row?.title;
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
    }).slice(0, limit);
};

const directoryList = (payload) => payload?.MediaContainer?.Directory || [];

export const createMediaPlayerRouter = ({
    Router,
    requireAuth,
    requireMember,
    loadPortalConfig,
    getPlexConnectionUri,
    plexClientHeaders,
    fetchImpl = fetch,
    clientId = 'portal-media-player',
    appVersion = '1',
    resolveMemberPlexToken = async () => null,
}) => {
    const router = Router();

    const identityKey = (req) => {
        const raw = String(req?.user?.plexAccountId || req?.user?.plexId || req?.user?.id || 'anon');
        return raw.replace(/[^a-zA-Z0-9]/g, '').slice(0, 24) || 'anon';
    };

    const playerHeaders = (token, identity = 'player') => {
        const base = plexClientHeaders(token);
        const identifier = String(base['X-Plex-Client-Identifier'] || clientId || 'portal');
        return {
            ...base,
            'X-Plex-Provides': 'player,controller',
            'X-Plex-Device-Name': 'Portal Media Player',
            'X-Plex-Client-Identifier': `${identifier}-mp-${identity}`,
            'X-Plex-Product': 'Portal Media Player',
            'X-Plex-Platform': 'Chrome',
            'X-Plex-Platform-Version': String(appVersion || '1'),
        };
    };

    const streamHeaders = (token, identity = 'player') => ({
        ...playerHeaders(token, identity),
        Accept: 'application/x-mpegURL, application/vnd.apple.mpegurl, */*',
        'X-Plex-Product': 'Plex Web',
        'X-Plex-Device': 'Chrome',
        'X-Plex-Platform': 'Chrome',
        'X-Plex-Platform-Version': '120.0',
        'X-Plex-Provides': 'player',
    });

    const addPlexIdentityParams = (params, headers, token) => {
        params.set('X-Plex-Token', token);
        for (const key of [
            'X-Plex-Client-Identifier',
            'X-Plex-Product',
            'X-Plex-Platform',
            'X-Plex-Platform-Version',
            'X-Plex-Device',
            'X-Plex-Device-Name',
        ]) {
            if (headers[key]) params.set(key, headers[key]);
        }
        params.set('X-Plex-Client-Profile-Extra', HLS_CLIENT_PROFILE);
    };

    const playbackFor = async (req, serverToken) => {
        const memberToken = String(await resolveMemberPlexToken(req).catch(() => '') || '').trim();
        const token = memberToken || serverToken;
        const identity = identityKey(req);
        return {
            token,
            identity,
            headers: streamHeaders(token, identity),
            metaHeaders: playerHeaders(token, identity),
        };
    };

    const withPlex = async (res, fn) => {
        const config = await loadPortalConfig();
        if (String(config?.mediaServerType || 'plex').toLowerCase() !== 'plex') {
            return res.status(400).json({ error: 'Media Player currently supports Plex servers only.' });
        }
        if (!config?.plexToken || !config?.serverIdentifier) {
            return res.status(503).json({ error: 'Plex is not configured.' });
        }
        const uri = await getPlexConnectionUri(config);
        if (!uri) return res.status(503).json({ error: 'Cannot connect to Plex.' });
        return fn({ config, uri, token: config.plexToken, headers: playerHeaders(config.plexToken) });
    };

    const resolvePlayableMeta = async (uri, token, headers, ratingKey, seedMeta = null) => {
        const meta = seedMeta || metadataList(await plexJson(
            fetchImpl,
            `${uri}/library/metadata/${encodeURIComponent(ratingKey)}?X-Plex-Token=${encodeURIComponent(token)}`,
            headers,
        ))[0];
        if (!meta) return null;
        const type = String(meta.type || '');
        if (type === 'movie' || type === 'episode' || type === 'clip') return meta;
        if (type !== 'show' && type !== 'season') return null;
        const unwatched = await plexJson(
            fetchImpl,
            `${uri}/library/metadata/${encodeURIComponent(ratingKey)}/allLeaves?unwatched=1&X-Plex-Container-Start=0&X-Plex-Container-Size=1&X-Plex-Token=${encodeURIComponent(token)}`,
            headers,
        ).catch(() => null);
        const nextUnwatched = metadataList(unwatched)[0];
        if (nextUnwatched) return nextUnwatched;
        const first = await plexJson(
            fetchImpl,
            `${uri}/library/metadata/${encodeURIComponent(ratingKey)}/allLeaves?X-Plex-Container-Start=0&X-Plex-Container-Size=1&X-Plex-Token=${encodeURIComponent(token)}`,
            headers,
        ).catch(() => null);
        return metadataList(first)[0] || null;
    };

    const fetchNextEpisode = async (uri, token, headers, ratingKey) => {
        const data = await plexJson(
            fetchImpl,
            `${uri}/library/metadata/${encodeURIComponent(ratingKey)}?X-Plex-Token=${encodeURIComponent(token)}`,
            headers,
        );
        const meta = metadataList(data)[0];
        if (!meta || meta.type !== 'episode') return null;
        const seasonKey = meta.parentRatingKey;
        if (seasonKey) {
            const seasonKids = await plexJson(
                fetchImpl,
                `${uri}/library/metadata/${encodeURIComponent(seasonKey)}/children?excludeAllLeaves=1&X-Plex-Container-Size=500&X-Plex-Token=${encodeURIComponent(token)}`,
                headers,
            ).catch(() => null);
            const nextInSeason = nextEpisodeInList(metadataList(seasonKids), meta.ratingKey);
            if (nextInSeason) return nextInSeason;
        }
        const showKey = meta.grandparentRatingKey;
        if (!showKey || !seasonKey) return null;
        const seasons = metadataList(await plexJson(
            fetchImpl,
            `${uri}/library/metadata/${encodeURIComponent(showKey)}/children?excludeAllLeaves=1&X-Plex-Container-Size=100&X-Plex-Token=${encodeURIComponent(token)}`,
            headers,
        ).catch(() => null));
        const seasonIdx = seasons.findIndex((row) => String(row.ratingKey) === String(seasonKey));
        const nextSeason = seasonIdx >= 0 ? seasons[seasonIdx + 1] : null;
        if (!nextSeason?.ratingKey) return null;
        const nextKids = await plexJson(
            fetchImpl,
            `${uri}/library/metadata/${encodeURIComponent(nextSeason.ratingKey)}/children?excludeAllLeaves=1&X-Plex-Container-Size=1&X-Plex-Token=${encodeURIComponent(token)}`,
            headers,
        ).catch(() => null);
        return metadataList(nextKids)[0] || null;
    };

    router.get('/home', requireAuth, requireMember, async (req, res) => {
        try {
            await withPlex(res, async ({ config, uri, token, headers }) => {
                const playback = await playbackFor(req, token);
                const onDeckHeaders = playback.metaHeaders;
                const onDeckToken = playback.token;
                const sectionsRes = await plexJson(fetchImpl, `${uri}/library/sections?X-Plex-Token=${encodeURIComponent(token)}`, headers);
                const sections = (sectionsRes?.MediaContainer?.Directory || [])
                    .filter((dir) => ['movie', 'show', 'artist'].includes(dir.type))
                    .map(mapPlayerSection);

                const [onDeckRes, ...recentResults] = await Promise.all([
                    plexJson(fetchImpl, `${uri}/library/onDeck?X-Plex-Container-Size=24&X-Plex-Token=${encodeURIComponent(onDeckToken)}`, onDeckHeaders).catch(() => null),
                    ...sections.slice(0, 12).map((section) => plexJson(
                        fetchImpl,
                        `${uri}/library/sections/${encodeURIComponent(section.key)}/recentlyAdded?X-Plex-Container-Size=16&X-Plex-Token=${encodeURIComponent(token)}`,
                        headers,
                    ).then((data) => ({ section, data })).catch(() => ({ section, data: null }))),
                ]);

                const continueWatching = metadataList(onDeckRes).map((meta) => mapContinueWatchingItem(meta, config));
                const recentByLibrary = recentResults.map(({ section, data }) => ({
                    library: section,
                    items: dedupeItems(metadataList(data).map((meta) => mapRecentlyAddedItem(meta, section, config))),
                })).filter((row) => row.items.length);
                res.json({
                    libraries: sections,
                    continueWatching: dedupeItems(continueWatching),
                    recentByLibrary,
                });
            });
        } catch (error) {
            res.status(500).json({ error: error.message || 'Failed to load Media Player home.' });
        }
    });

    router.get('/search', requireAuth, requireMember, async (req, res) => {
        try {
            const query = String(req.query.q || '').trim();
            if (query.length < 2) return res.json({ results: [] });
            await withPlex(res, async ({ config, uri, token, headers }) => {
                const data = await plexJson(
                    fetchImpl,
                    `${uri}/hubs/search?query=${encodeURIComponent(query)}&limit=40&X-Plex-Token=${encodeURIComponent(token)}`,
                    headers,
                );
                const results = [];
                for (const hub of data?.MediaContainer?.Hub || []) {
                    for (const meta of hub.Metadata || []) {
                        if (!['movie', 'show', 'episode', 'artist', 'album'].includes(meta.type)) continue;
                        results.push(mapPlayerItem(meta, config));
                    }
                }
                res.json({ results: results.slice(0, 40) });
            });
        } catch (error) {
            res.status(500).json({ error: error.message || 'Search failed.' });
        }
    });

    router.get('/libraries', requireAuth, requireMember, async (req, res) => {
        try {
            await withPlex(res, async ({ uri, token, headers }) => {
                const data = await plexJson(fetchImpl, `${uri}/library/sections?X-Plex-Token=${encodeURIComponent(token)}`, headers);
                res.json({
                    libraries: (data?.MediaContainer?.Directory || [])
                        .filter((dir) => ['movie', 'show', 'artist'].includes(dir.type))
                        .map(mapPlayerSection),
                });
            });
        } catch (error) {
            res.status(500).json({ error: error.message || 'Failed to load libraries.' });
        }
    });

    router.get('/person/:actorId', requireAuth, requireMember, async (req, res) => {
        try {
            const actorId = String(req.params.actorId || '').trim();
            const name = String(req.query.name || '').trim();
            if (!actorId && !name) return res.status(400).json({ error: 'Invalid person.' });
            await withPlex(res, async ({ config, uri, token, headers }) => {
                const sectionsRes = await plexJson(fetchImpl, `${uri}/library/sections?X-Plex-Token=${encodeURIComponent(token)}`, headers);
                const sections = (sectionsRes?.MediaContainer?.Directory || [])
                    .filter((dir) => dir.type === 'movie' || dir.type === 'show');
                const filters = actorQueryValues(actorId, name);
                const collected = [];
                for (const section of sections) {
                    for (const filter of filters) {
                        const data = await plexJson(
                            fetchImpl,
                            `${uri}/library/sections/${encodeURIComponent(section.key)}/all?actor=${encodeURIComponent(filter)}&X-Plex-Container-Start=0&X-Plex-Container-Size=100&X-Plex-Token=${encodeURIComponent(token)}`,
                            headers,
                        ).catch(() => null);
                        const metas = metadataList(data);
                        collected.push(...metas);
                        if (metas.length) break;
                    }
                }
                const seen = new Set();
                const items = collected.filter((meta) => {
                    const key = String(meta?.ratingKey || meta?.title || '').trim();
                    if (!key || seen.has(key)) return false;
                    seen.add(key);
                    return true;
                }).slice(0, 100).map((meta) => mapPlayerItem(meta, config));
                const person = pickPersonFromMetadata(collected, { actorId, name });
                res.json({ person, items });
            });
        } catch (error) {
            res.status(500).json({ error: error.message || 'Failed to load person.' });
        }
    });

    router.get('/libraries/:sectionKey/home', requireAuth, requireMember, async (req, res) => {
        try {
            const sectionKey = String(req.params.sectionKey || '').trim();
            if (!/^\d+$/.test(sectionKey)) return res.status(400).json({ error: 'Invalid library.' });
            await withPlex(res, async ({ config, uri, token, headers }) => {
                const playback = await playbackFor(req, token);
                const [sectionRes, hubsRes, onDeckRes] = await Promise.all([
                    plexJson(fetchImpl, `${uri}/library/sections/${encodeURIComponent(sectionKey)}?X-Plex-Token=${encodeURIComponent(token)}`, headers).catch(() => null),
                    plexJson(fetchImpl, `${uri}/hubs/sections/${encodeURIComponent(sectionKey)}?count=16&X-Plex-Token=${encodeURIComponent(token)}`, headers).catch(() => null),
                    plexJson(
                        fetchImpl,
                        `${uri}/library/sections/${encodeURIComponent(sectionKey)}/onDeck?X-Plex-Container-Size=16&X-Plex-Token=${encodeURIComponent(playback.token)}`,
                        playback.metaHeaders,
                    ).catch(() => null),
                ]);
                const section = directoryList(sectionRes)[0] || sectionRes?.MediaContainer || {};
                const hubs = [];
                const onDeckItems = metadataList(onDeckRes).map((meta) => mapContinueWatchingItem(meta, config));
                if (onDeckItems.length) {
                    hubs.push({ title: 'Continue Watching', identifier: 'continueWatching', items: onDeckItems });
                }
                const seen = new Set(hubs.map((hub) => hub.identifier));
                for (const hub of [].concat(hubsRes?.MediaContainer?.Hub || [])) {
                    const identifier = String(hub.hubIdentifier || hub.title || '');
                    if (/continue|ondeck/i.test(identifier) && onDeckItems.length) continue;
                    const items = (hub.Metadata || []).map((meta) => mapLibraryHubItem(meta, hub, config)).filter((row) => row.ratingKey);
                    if (!items.length) continue;
                    if (seen.has(identifier)) continue;
                    seen.add(identifier);
                    hubs.push({
                        title: hub.title || identifier || 'Hub',
                        identifier,
                        items,
                    });
                }
                if (!hubs.length) {
                    const recent = await plexJson(
                        fetchImpl,
                        `${uri}/library/sections/${encodeURIComponent(sectionKey)}/recentlyAdded?X-Plex-Container-Size=16&X-Plex-Token=${encodeURIComponent(token)}`,
                        headers,
                    ).catch(() => null);
                    const mapped = mapPlayerSection({ ...section, key: sectionKey });
                    hubs.push({
                        title: 'Recently Added',
                        identifier: 'recentlyAdded',
                        items: metadataList(recent).map((meta) => mapRecentlyAddedItem(meta, mapped, config)),
                    });
                }
                res.json({
                    title: section.title || section.title1 || 'Library',
                    type: section.type || '',
                    hubs: hubs.filter((hub) => hub.items.length),
                });
            });
        } catch (error) {
            res.status(500).json({ error: error.message || 'Failed to load library home.' });
        }
    });

    router.get('/libraries/:sectionKey/filters', requireAuth, requireMember, async (req, res) => {
        try {
            const sectionKey = String(req.params.sectionKey || '').trim();
            if (!/^\d+$/.test(sectionKey)) return res.status(400).json({ error: 'Invalid library.' });
            await withPlex(res, async ({ uri, token, headers }) => {
                const genreRes = await plexJson(
                    fetchImpl,
                    `${uri}/library/sections/${encodeURIComponent(sectionKey)}/genre?X-Plex-Token=${encodeURIComponent(token)}`,
                    headers,
                ).catch(() => null);
                res.json({
                    genres: directoryList(genreRes).map((dir) => ({
                        key: String(dir.key || dir.id || ''),
                        title: dir.title || dir.tag || 'Genre',
                    })).filter((row) => row.key),
                });
            });
        } catch (error) {
            res.status(500).json({ error: error.message || 'Failed to load filters.' });
        }
    });

    router.get('/libraries/:sectionKey/collections', requireAuth, requireMember, async (req, res) => {
        try {
            const sectionKey = String(req.params.sectionKey || '').trim();
            if (!/^\d+$/.test(sectionKey)) return res.status(400).json({ error: 'Invalid library.' });
            await withPlex(res, async ({ config, uri, token, headers }) => {
                const data = await plexJson(
                    fetchImpl,
                    `${uri}/library/sections/${encodeURIComponent(sectionKey)}/collections?X-Plex-Container-Size=200&X-Plex-Token=${encodeURIComponent(token)}`,
                    headers,
                );
                const container = data?.MediaContainer || {};
                res.json({
                    title: container.title1 || container.librarySectionTitle || 'Collections',
                    items: metadataList(data).map((meta) => mapPlayerItem({ ...meta, type: meta.type || 'collection' }, config)),
                });
            });
        } catch (error) {
            res.status(500).json({ error: error.message || 'Failed to load collections.' });
        }
    });

    router.get('/libraries/:sectionKey', requireAuth, requireMember, async (req, res) => {
        try {
            const sectionKey = String(req.params.sectionKey || '').trim();
            if (!/^\d+$/.test(sectionKey)) return res.status(400).json({ error: 'Invalid library.' });
            const start = Math.max(0, Number(req.query.start) || 0);
            const size = Math.min(100, Math.max(1, Number(req.query.size) || 50));
            const sort = PLAYER_LIBRARY_SORT_IDS.has(String(req.query.sort || '')) ? String(req.query.sort) : 'addedAt:desc';
            const genre = String(req.query.genre || '').trim();
            const unwatched = String(req.query.unwatched || '') === '1';
            await withPlex(res, async ({ config, uri, token, headers }) => {
                const params = new URLSearchParams({
                    'X-Plex-Container-Start': String(start),
                    'X-Plex-Container-Size': String(size),
                    sort,
                    'X-Plex-Token': token,
                });
                if (genre) params.set('genre', genre);
                if (unwatched) params.set('unwatched', '1');
                const data = await plexJson(
                    fetchImpl,
                    `${uri}/library/sections/${encodeURIComponent(sectionKey)}/all?${params.toString()}`,
                    headers,
                );
                const container = data?.MediaContainer || {};
                res.json({
                    title: container.title1 || container.librarySectionTitle || 'Library',
                    type: container.viewGroup || container.librarySectionType || '',
                    total: Number(container.totalSize || container.size || 0),
                    items: metadataList(data).map((meta) => mapPlayerItem(meta, config)),
                });
            });
        } catch (error) {
            res.status(500).json({ error: error.message || 'Failed to load library.' });
        }
    });

    router.get('/collection/:ratingKey', requireAuth, requireMember, async (req, res) => {
        try {
            const ratingKey = String(req.params.ratingKey || '').trim();
            if (!/^\d+$/.test(ratingKey)) return res.status(400).json({ error: 'Invalid collection.' });
            await withPlex(res, async ({ config, uri, token, headers }) => {
                const [metaRes, kidsRes] = await Promise.all([
                    plexJson(
                        fetchImpl,
                        `${uri}/library/metadata/${encodeURIComponent(ratingKey)}?X-Plex-Token=${encodeURIComponent(token)}`,
                        headers,
                    ),
                    plexJson(
                        fetchImpl,
                        `${uri}/library/metadata/${encodeURIComponent(ratingKey)}/children?X-Plex-Container-Size=200&X-Plex-Token=${encodeURIComponent(token)}`,
                        headers,
                    ).catch(() => null),
                ]);
                const meta = metadataList(metaRes)[0];
                if (!meta) return res.status(404).json({ error: 'Collection not found.' });
                res.json({
                    item: mapPlayerItem({ ...meta, type: meta.type || 'collection' }, config),
                    children: metadataList(kidsRes).map((row) => mapPlayerItem(row, config)),
                });
            });
        } catch (error) {
            res.status(500).json({ error: error.message || 'Failed to load collection.' });
        }
    });

    router.get('/next/:ratingKey', requireAuth, requireMember, async (req, res) => {
        try {
            const ratingKey = String(req.params.ratingKey || '').trim();
            if (!/^\d+$/.test(ratingKey)) return res.status(400).json({ error: 'Invalid title.' });
            await withPlex(res, async ({ config, uri, token }) => {
                const playback = await playbackFor(req, token);
                const next = await fetchNextEpisode(uri, playback.token, playback.metaHeaders, ratingKey);
                if (!next) return res.json({ item: null });
                res.json({ item: mapPlayerItem(next, config) });
            });
        } catch (error) {
            res.status(500).json({ error: error.message || 'Failed to load next episode.' });
        }
    });

    router.get('/item/:ratingKey', requireAuth, requireMember, async (req, res) => {
        try {
            const ratingKey = String(req.params.ratingKey || '').trim();
            if (!/^\d+$/.test(ratingKey)) return res.status(400).json({ error: 'Invalid title.' });
            await withPlex(res, async ({ config, uri, token, headers }) => {
                const metaUrl = `${uri}/library/metadata/${encodeURIComponent(ratingKey)}?includeChildren=1&includeGuids=1&includeExtras=1&includeRelated=1&includeRelatedCount=16&X-Plex-Token=${encodeURIComponent(token)}`;
                const extrasUrl = `${uri}/library/metadata/${encodeURIComponent(ratingKey)}/extras?X-Plex-Token=${encodeURIComponent(token)}`;
                const relatedUrl = `${uri}/hubs/metadata/${encodeURIComponent(ratingKey)}/related?count=16&X-Plex-Token=${encodeURIComponent(token)}`;
                const [data, extrasRes, relatedRes] = await Promise.all([
                    plexJson(fetchImpl, metaUrl, headers),
                    plexJson(fetchImpl, extrasUrl, headers).catch(() => null),
                    plexJson(fetchImpl, relatedUrl, headers).catch(() => null),
                ]);
                const meta = metadataList(data)[0];
                if (!meta) return res.status(404).json({ error: 'Title not found.' });
                const item = mapPlayerItemDetails(meta, config);
                const ratingsEmpty = !item.ratings || Object.values(item.ratings).every((row) => !row);
                const showKey = item.type === 'season' ? item.parentRatingKey : item.grandparentRatingKey;
                if ((item.type === 'episode' || item.type === 'season') && showKey) {
                    const showData = await plexJson(
                        fetchImpl,
                        `${uri}/library/metadata/${encodeURIComponent(showKey)}?includeGuids=1&includeRelated=1&includeRelatedCount=16&X-Plex-Token=${encodeURIComponent(token)}`,
                        headers,
                    ).catch(() => null);
                    const show = metadataList(showData)[0];
                    if (show) {
                        const mappedShow = mapPlayerItemDetails(show, config);
                        if (!item.showTitle) item.showTitle = mappedShow.title;
                        if (item.type === 'episode' && mappedShow.cast.length) {
                            const seen = new Set(item.cast.map((row) => row.name.toLowerCase()));
                            item.cast = [
                                ...item.cast,
                                ...mappedShow.cast.filter((row) => !seen.has(row.name.toLowerCase())),
                            ];
                        } else if (!item.cast.length) {
                            item.cast = mappedShow.cast;
                        }
                        if (!item.tmdbId) item.tmdbId = mappedShow.tmdbId;
                        if (!item.genres?.length) item.genres = mappedShow.genres;
                        if (!item.contentRating) item.contentRating = mappedShow.contentRating;
                        if (ratingsEmpty && mappedShow.ratings) item.ratings = mappedShow.ratings;
                    }
                }
                let children = [];
                if (item.type === 'show' || item.type === 'season') {
                    const kids = await plexJson(
                        fetchImpl,
                        `${uri}/library/metadata/${encodeURIComponent(ratingKey)}/children?excludeAllLeaves=1&X-Plex-Container-Size=500&X-Plex-Token=${encodeURIComponent(token)}`,
                        headers,
                    ).catch(() => null);
                    children = metadataList(kids).map((row) => mapPlayerItem(row, config));
                }
                const extras = mapPlayerExtras(
                    metadataList(extrasRes).length
                        ? metadataList(extrasRes)
                        : [].concat(meta.Extras?.Metadata || []),
                    config,
                ).filter((row) => row.ratingKey !== item.ratingKey);
                const related = mapPlayerHubs(
                    [].concat(relatedRes?.MediaContainer?.Hub || meta.Related?.Hub || []),
                    config,
                );
                res.json({ item, children, extras, related });
            });
        } catch (error) {
            res.status(500).json({ error: error.message || 'Failed to load title.' });
        }
    });

    router.post('/play/:ratingKey', requireAuth, requireMember, async (req, res) => {
        try {
            const ratingKey = String(req.params.ratingKey || '').trim();
            if (!/^\d+$/.test(ratingKey)) return res.status(400).json({ error: 'Invalid title.' });
            await withPlex(res, async ({ config, uri, token, headers }) => {
                const playback = await playbackFor(req, token);
                const data = await plexJson(
                    fetchImpl,
                    `${uri}/library/metadata/${encodeURIComponent(ratingKey)}?X-Plex-Token=${encodeURIComponent(playback.token)}`,
                    playback.metaHeaders,
                );
                const meta = metadataList(data)[0];
                const item = mapPlayerItem(meta, config);
                if (!item.canPlay) {
                    return res.status(400).json({ error: 'This title cannot be played yet. Open an episode, movie, trailer, or series.' });
                }
                const playable = await resolvePlayableMeta(uri, playback.token, playback.metaHeaders, ratingKey, meta);
                if (!playable) {
                    return res.status(400).json({ error: 'Nothing left to play in this title.' });
                }
                const playableItem = mapPlayerItem(playable, config);
                const offset = clampPlayOffsetMs(
                    Number(req.body?.offsetMs) || playableItem.viewOffsetMs || 0,
                    playableItem.durationMs,
                );
                const sessionId = randomUUID();
                const options = mapPlayerPlaybackOptions(playable);
                const requestedQuality = String(req.body?.qualityId || '');
                const qualityId = isPlayerQualityId(requestedQuality) ? requestedQuality : options.qualityId;
                res.json({
                    sessionId,
                    item: playableItem,
                    src: buildPlayerHlsSrc(playableItem.ratingKey, {
                        sessionId,
                        offsetMs: offset,
                        qualityId,
                        audioStreamId: options.audioStreamId,
                        subtitleStreamId: options.subtitleStreamId,
                        resume: true,
                    }),
                    offsetMs: offset,
                    ...options,
                    qualityId,
                });
            });
        } catch (error) {
            res.status(500).json({ error: error.message || 'Failed to start playback.' });
        }
    });

    router.get('/hls/:ratingKey/master.m3u8', requireAuth, requireMember, async (req, res) => {
        try {
            const ratingKey = String(req.params.ratingKey || '').trim();
            if (!/^\d+$/.test(ratingKey)) return res.status(400).json({ error: 'Invalid title.' });
            const rawOffset = Math.max(0, Math.floor(Number(req.query.offset) || 0));
            const offsetMs = String(req.query.resume || '') === '1' ? clampPlayOffsetMs(rawOffset) : rawOffset;
            const qualityId = isPlayerQualityId(req.query.quality) ? String(req.query.quality) : DEFAULT_PLAYER_QUALITY_ID;
            const audioStreamID = String(req.query.audioStreamID || '').replace(/\D/g, '');
            const subtitleStreamID = String(req.query.subtitleStreamID || '').replace(/\D/g, '');
            const transcodeSession = isPlaySessionId(req.query.session) ? String(req.query.session) : randomUUID();
            await withPlex(res, async ({ uri, token }) => {
                const playback = await playbackFor(req, token);
                let lastDetail = '';
                const tokens = playback.token === token ? [playback.token] : [playback.token, token];
                const attempts = transcodeSettingsForQuality(qualityId);
                for (const playToken of tokens) {
                    const attemptHeaders = {
                        ...streamHeaders(playToken, playback.identity),
                        'X-Plex-Session-Identifier': transcodeSession,
                    };
                    for (const attempt of attempts) {
                        const params = new URLSearchParams({
                            hasMDE: '1',
                            path: `/library/metadata/${ratingKey}`,
                            mediaIndex: '0',
                            partIndex: '0',
                            protocol: 'hls',
                            fastSeek: '1',
                            audioBoost: '100',
                            location: plexStreamLocation(uri),
                            addDebugOverlay: '0',
                            autoAdjustQuality: '0',
                            copyts: '1',
                            session: transcodeSession,
                            ...attempt,
                            directStream: subtitleStreamID ? '0' : attempt.directStream,
                        });
                        if (audioStreamID) params.set('audioStreamID', audioStreamID);
                        if (subtitleStreamID) {
                            params.set('subtitleStreamID', subtitleStreamID);
                            params.set('subtitles', 'burn');
                            params.set('advancedSubtitles', 'burn');
                            params.set('subtitleSize', '100');
                        } else {
                            params.set('subtitles', 'none');
                            params.set('subtitleSize', '0');
                        }
                        if (offsetMs) params.set('offset', String(Math.floor(offsetMs / 1000)));
                        addPlexIdentityParams(params, attemptHeaders, playToken);
                        const startUrl = `${uri}/video/:/transcode/universal/start.m3u8?${params.toString()}`;
                        const plexRes = await fetchImpl(startUrl, { headers: attemptHeaders });
                        const body = await plexRes.text();
                        if (plexRes.ok && isHlsPlaylist(body)) {
                            const proxyPrefix = '/api/media-player/proxy?u=';
                            res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
                            res.setHeader('Cache-Control', 'no-store');
                            return res.send(rewritePlaylistUrls(body, uri, proxyPrefix, plexRes.url || startUrl));
                        }
                        lastDetail = String(body || `HTTP ${plexRes.status}`).slice(0, 300);
                    }
                }
                return res.status(502).json({
                    error: 'Plex refused to start transcode.',
                    detail: lastDetail,
                });
            });
        } catch (error) {
            res.status(500).json({ error: error.message || 'Failed to start HLS stream.' });
        }
    });

    router.post('/timeline', requireAuth, requireMember, async (req, res) => {
        try {
            const ratingKey = String(req.body?.ratingKey || '').trim();
            const state = String(req.body?.state || '').trim().toLowerCase();
            if (!/^\d+$/.test(ratingKey) || !TIMELINE_STATES.has(state)) {
                return res.status(400).json({ error: 'Invalid timeline update.' });
            }
            const sessionId = isPlaySessionId(req.body?.sessionId) ? String(req.body.sessionId) : '';
            await withPlex(res, async ({ uri, token }) => {
                const playback = await playbackFor(req, token);
                const params = buildPlexTimelineParams({
                    ratingKey,
                    state,
                    timeMs: req.body?.timeMs,
                    durationMs: req.body?.durationMs,
                    sessionId,
                });
                addPlexIdentityParams(params, playback.headers, playback.token);
                const timelineUrl = `${uri}/:/timeline?${params.toString()}`;
                const plexRes = await fetchImpl(timelineUrl, {
                    headers: {
                        ...playback.headers,
                        Accept: 'application/json, text/plain, */*',
                        'X-Plex-Session-Identifier': sessionId || playback.identity,
                    },
                });
                if (!plexRes.ok) {
                    const detail = String(await plexRes.text().catch(() => '')).slice(0, 200);
                    return res.status(502).json({ error: 'Plex refused timeline update.', detail });
                }
                res.status(204).end();
            });
        } catch (error) {
            res.status(500).json({ error: error.message || 'Failed to update timeline.' });
        }
    });

    router.post('/stop', requireAuth, requireMember, async (req, res) => {
        try {
            const sessionId = isPlaySessionId(req.body?.sessionId) ? String(req.body.sessionId) : '';
            if (!sessionId) return res.status(204).end();
            await withPlex(res, async ({ uri, token }) => {
                const playback = await playbackFor(req, token);
                const params = new URLSearchParams({ session: sessionId });
                addPlexIdentityParams(params, playback.headers, playback.token);
                await fetchImpl(`${uri}/video/:/transcode/universal/stop?${params}`, {
                    headers: {
                        ...playback.headers,
                        'X-Plex-Session-Identifier': sessionId,
                    },
                }).catch(() => null);
                res.status(204).end();
            });
        } catch {
            res.status(204).end();
        }
    });

    router.get('/proxy', requireAuth, requireMember, async (req, res) => {
        try {
            const config = await loadPortalConfig();
            if (String(config?.mediaServerType || 'plex').toLowerCase() !== 'plex') {
                return res.status(400).end();
            }
            const uri = await getPlexConnectionUri(config);
            if (!uri) return res.status(503).end();
            const raw = String(req.query.u || '');
            if (!raw) return res.status(400).end();
            let target;
            try {
                target = rewritePlexUrlToOrigin(decodeURIComponent(raw), uri);
            } catch {
                return res.status(400).end();
            }
            if (!isAllowedPlexProxyUrl(target, uri)) return res.status(403).end();
            const plexRes = await fetchImpl(target, { headers: streamHeaders(config.plexToken) });
            const contentType = plexRes.headers.get('content-type') || '';
            res.status(plexRes.status);
            res.setHeader('Cache-Control', 'no-store');
            if (/mpegurl|x-mpegURL|vnd\.apple\.mpegurl/i.test(contentType) || target.includes('.m3u8')) {
                const body = await plexRes.text();
                res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
                return res.send(rewritePlaylistUrls(body, uri, '/api/media-player/proxy?u=', plexRes.url || target));
            }
            if (contentType) res.setHeader('Content-Type', contentType);
            try {
                if (plexRes.body && typeof Readable.fromWeb === 'function') {
                    return Readable.fromWeb(plexRes.body).pipe(res);
                }
            } catch {
                /* fall through to buffered copy */
            }
            const buffer = Buffer.from(await plexRes.arrayBuffer());
            res.send(buffer);
        } catch (error) {
            res.status(502).json({ error: error.message || 'Stream proxy failed.' });
        }
    });

    return router;
};
