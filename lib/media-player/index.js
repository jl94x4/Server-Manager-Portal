import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import {
    clampPlayOffsetMs,
    isAllowedPlexProxyUrl,
    isHlsPlaylist,
    isPlaySessionId,
    isPlayerQualityId,
    actorQueryValues,
    studioQueryValues,
    buildPlayerHlsSrc,
    buildPlayerFileSrc,
    canHttpDirectPlay,
    isHevcVideo,
    normalizePlaybackCaps,
    pickPlayerPartId,
    pickMediaIndex,
    withSelectedMedia,
    mapContinueWatchingItem,
    isLibraryContinueWatchingHub,
    dedupeLibraryContinueWatchingHubs,
    withMemberContinueWatching,
    mapLibraryHubItem,
    mapPlayerExtras,
    mapPlayerFilterOptions,
    mapPlayerHubs,
    mapPlayerHomeHubs,
    mapPlayerItem,
    mapPlayerItemDetails,
    isPlayablePlexMeta,
    normalizePlayerItemType,
    mapPlayerMarkers,
    mapPlayerPlaybackMode,
    mapPlayerPlaybackOptions,
    mapPlayerPlaybackSource,
    normalizePlayerSettings,
    mapPlayerProfile,
    mapPlayerPlaylist,
    mapPlayerSection,
    mapPlayerVersions,
    mapRecentlyAddedItem,
    nextEpisodeInList,
    previousEpisodeInList,
    pickPersonFromMetadata,
    plexPlaylistUri,
    PLAYER_LIBRARY_SORT_IDS,
    resolvePlayOffsetMs,
    rewritePlaylistUrls,
    rewritePlexUrlToOrigin,
    transcodeSettingsForQuality,
    TIMELINE_STATES,
    buildPlexTimelineParams,
    ORIGINAL_PLAYER_QUALITY_ID,
    collectionChildItems,
    collectionChildPaths,
    withPlexContainerParams,
    pickPlayerThemePath,
    isPlayerThemePath,
} from './mapItem.js';
import { isPlexOwnerLocalAccountId } from '../plex/localAccountId.js';
import { fetchMemberOnDeckFromHistory } from '../plex/memberOnDeckFromHistory.js';
import { buildMediaPlayerHomeHero } from './homeHero.js';

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

const STREAM_IDENTITY = 'player';

const plexFetch = async (fetchImpl, url, headers, { timeoutMs } = {}) => {
    const extra = {};
    if (Number(timeoutMs) > 0 && typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
        extra.signal = AbortSignal.timeout(Math.floor(Number(timeoutMs)));
    }
    return fetchImpl(url, { headers, ...extra });
};

const plexJson = async (fetchImpl, url, headers, { timeoutMs } = {}) => {
    const res = await plexFetch(fetchImpl, url, headers, { timeoutMs });
    if (!res.ok) throw new Error(`Plex request failed (${res.status})`);
    try {
        return await res.json();
    } catch {
        throw new Error('Plex returned a non-JSON response.');
    }
};

const isPlexNotFound = (error) => /\(404\)/.test(String(error?.message || ''));

const plexJsonOrNull = async (fetchImpl, url, headers) => {
    try {
        return await plexJson(fetchImpl, url, headers);
    } catch (error) {
        if (isPlexNotFound(error)) return null;
        throw error;
    }
};

const isPlexAuthError = (error) => /\(401\)|\(403\)/.test(String(error?.message || ''));

const plexJsonWithAuth = async (fetchImpl, attempts, { timeoutMs } = {}) => {
    const list = (Array.isArray(attempts) ? attempts : []).filter((row) => row?.token && row?.url);
    const seen = new Set();
    let lastError;
    for (const attempt of list) {
        const key = String(attempt.token);
        if (seen.has(key)) continue;
        seen.add(key);
        try {
            return await plexJson(fetchImpl, attempt.url, attempt.headers, { timeoutMs });
        } catch (error) {
            lastError = error;
            if (!isPlexAuthError(error)) throw error;
        }
    }
    throw lastError || new Error('Plex request failed.');
};

const sendJsonError = (res, status, error, fallback) => {
    if (res.headersSent) return;
    const message = String((error && error.message) || fallback || 'Request failed.');
    res.status(status).json({ error: message });
};

const metadataList = (payload) => {
    const list = payload?.MediaContainer?.Metadata;
    if (Array.isArray(list)) return list;
    if (list && typeof list === 'object') return [list];
    return [];
};

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
    resolveMemberAccountId = async () => null,
    getMediaPlayerSettings = async () => ({ ...normalizePlayerSettings(), saved: false }),
    saveMediaPlayerSettings = async (_req, settings) => normalizePlayerSettings(settings),
    getMediaPlayerProfile = async (req) => mapPlayerProfile(req?.user || {}),
}) => {
    const router = Router();
    const homeCache = new Map();
    const HOME_CACHE_TTL_MS = 20000;
    const HOME_HUB_COUNT = 12;
    const HOME_PLEX_TIMEOUT_MS = 8000;

    const identityKey = (req) => {
        const raw = String(req?.user?.plexAccountId || req?.user?.plexId || req?.user?.id || 'anon');
        return raw.replace(/[^a-zA-Z0-9]/g, '').slice(0, 24) || 'anon';
    };

    const homeCacheKey = (req) => {
        const id = String(req?.user?.id || '').trim();
        const plex = String(req?.user?.plexAccountId || req?.user?.plexId || '').trim();
        const name = String(req?.user?.username || req?.user?.title || '').trim();
        const raw = [id, plex, name].filter(Boolean).join('|') || 'anon';
        return raw.slice(0, 80);
    };

    const deviceNameFor = (req) => {
        const name = String(req?.user?.username || req?.user?.title || '').trim();
        return name ? `Portal (${name})` : 'Portal Media Player';
    };

    const playerHeaders = (token, identity = 'player', deviceName = 'Portal Media Player') => {
        const base = plexClientHeaders(token);
        const identifier = String(base['X-Plex-Client-Identifier'] || clientId || 'portal');
        return {
            ...base,
            'X-Plex-Provides': 'player,controller',
            'X-Plex-Device-Name': deviceName || 'Portal Media Player',
            'X-Plex-Client-Identifier': `${identifier}-mp-${identity}`,
            'X-Plex-Product': 'Portal Media Player',
            'X-Plex-Platform': 'Chrome',
            'X-Plex-Platform-Version': String(appVersion || '1'),
        };
    };

    const streamHeaders = (token, identity = 'player', deviceName = 'Portal Media Player') => ({
        ...playerHeaders(token, identity, deviceName),
        Accept: 'application/x-mpegURL, application/vnd.apple.mpegurl, */*',
        'X-Plex-Product': 'Plex Web',
        'X-Plex-Device': 'Chrome',
        'X-Plex-Platform': 'Chrome',
        'X-Plex-Platform-Version': '120.0',
        'X-Plex-Provides': 'player',
    });

    const addPlexIdentityParams = (params, headers, token, { transcodeProfile = true } = {}) => {
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
        if (transcodeProfile) params.set('X-Plex-Client-Profile-Extra', HLS_CLIENT_PROFILE);
    };

    const playbackFor = async (req, serverToken) => {
        const memberToken = String(await resolveMemberPlexToken(req).catch(() => '') || '').trim();
        const token = memberToken || serverToken;
        const identity = identityKey(req);
        const userIdentity = memberToken ? identity : STREAM_IDENTITY;
        const deviceName = deviceNameFor(req);
        const serverHeaders = playerHeaders(serverToken, STREAM_IDENTITY, deviceName);
        const memberHeaders = memberToken ? playerHeaders(memberToken, identity, deviceName) : null;
        return {
            memberToken,
            token,
            streamToken: serverToken,
            identity: userIdentity,
            streamIdentity: STREAM_IDENTITY,
            headers: streamHeaders(token, userIdentity, deviceName),
            streamAuthHeaders: streamHeaders(serverToken, STREAM_IDENTITY, deviceName),
            metaHeaders: playerHeaders(token, userIdentity, deviceName),
            memberHeaders,
            serverHeaders,
            jsonAttempts: (urlForToken) => [
                { token, url: urlForToken(token), headers: playerHeaders(token, userIdentity, deviceName) },
                { token: serverToken, url: urlForToken(serverToken), headers: serverHeaders },
            ],
        };
    };

    const streamPairsFor = (playback) => {
        const pairs = [];
        const seen = new Set();
        const add = (token, identity, headers) => {
            const key = `${String(token || '')}\0${String(identity || '')}`;
            if (!token || seen.has(key)) return;
            seen.add(key);
            pairs.push({ token, identity, headers });
        };
        add(playback.token, playback.identity, playback.headers);
        add(playback.streamToken, playback.streamIdentity, playback.streamAuthHeaders);
        return pairs;
    };

    /** Never scrobble member progress with the owner token — that empties their Continue Watching. */
    const timelinePairsFor = (playback) => {
        if (playback?.memberToken) {
            return [{
                token: playback.memberToken,
                identity: playback.identity,
                headers: playback.headers,
            }];
        }
        return streamPairsFor(playback);
    };

    const jsonFor = (playback, pathAndQuery, opts) => plexJsonWithAuth(
        fetchImpl,
        playback.jsonAttempts((tok) => {
            const join = String(pathAndQuery).includes('?') ? '&' : '?';
            return `${pathAndQuery}${join}X-Plex-Token=${encodeURIComponent(tok)}`;
        }),
        opts,
    );

    const memberHistoryOnDeck = async (req, playback, { config, uri, sectionKey } = {}) => {
        const accountID = String(await resolveMemberAccountId(req, { config, uri }).catch(() => '') || '').trim();
        if (!accountID || isPlexOwnerLocalAccountId(accountID)) return [];
        const items = await fetchMemberOnDeckFromHistory({
            uri,
            token: playback.streamToken,
            accountID,
            headers: playback.serverHeaders,
            fetchImpl,
            timeoutMs: HOME_PLEX_TIMEOUT_MS,
            sectionKey,
        }).catch(() => []);
        return (Array.isArray(items) ? items : []).map((meta) => mapContinueWatchingItem(meta, config));
    };

    const jsonForMember = (playback, pathAndQuery, opts) => {
        const memberToken = String(playback?.memberToken || '').trim();
        if (!memberToken || !playback.memberHeaders) return Promise.resolve(null);
        const join = String(pathAndQuery).includes('?') ? '&' : '?';
        return plexJson(
            fetchImpl,
            `${pathAndQuery}${join}X-Plex-Token=${encodeURIComponent(memberToken)}`,
            playback.memberHeaders,
            opts,
        );
    };

    const jsonForServer = (playback, pathAndQuery, opts) => {
        const serverToken = String(playback?.streamToken || '').trim();
        if (!serverToken || !playback.serverHeaders) return Promise.resolve(null);
        const join = String(pathAndQuery).includes('?') ? '&' : '?';
        return plexJson(
            fetchImpl,
            `${pathAndQuery}${join}X-Plex-Token=${encodeURIComponent(serverToken)}`,
            playback.serverHeaders,
            opts,
        );
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
        try {
            return await fn({ config, uri, token: config.plexToken, headers: playerHeaders(config.plexToken) });
        } catch (error) {
            sendJsonError(res, 500, error, 'Plex request failed.');
        }
    };

    const resolvePlayableMeta = async (uri, playback, ratingKey, seedMeta = null) => {
        const meta = seedMeta || metadataList(await jsonFor(
            playback,
            `${uri}/library/metadata/${encodeURIComponent(ratingKey)}`,
        ))[0];
        if (!meta) return null;
        // Movies, episodes, and extras/trailers (Plex type trailer|clip|5|12).
        if (isPlayablePlexMeta(meta) && !['show', 'season'].includes(normalizePlayerItemType(meta))) {
            return meta;
        }
        const type = normalizePlayerItemType(meta);
        if (type !== 'show' && type !== 'season') return null;
        const unwatched = await jsonFor(
            playback,
            `${uri}/library/metadata/${encodeURIComponent(ratingKey)}/allLeaves?unwatched=1&X-Plex-Container-Start=0&X-Plex-Container-Size=1`,
        ).catch(() => null);
        const nextUnwatched = metadataList(unwatched)[0];
        if (nextUnwatched) return nextUnwatched;
        const first = await jsonFor(
            playback,
            `${uri}/library/metadata/${encodeURIComponent(ratingKey)}/allLeaves?X-Plex-Container-Start=0&X-Plex-Container-Size=1`,
        ).catch(() => null);
        return metadataList(first)[0] || null;
    };

    const fetchNeighborEpisode = async (uri, playback, ratingKey, direction) => {
        const data = await jsonFor(playback, `${uri}/library/metadata/${encodeURIComponent(ratingKey)}`);
        const meta = metadataList(data)[0];
        if (!meta || meta.type !== 'episode') return null;
        const seasonKey = meta.parentRatingKey;
        if (seasonKey) {
            const seasonKids = await jsonFor(
                playback,
                `${uri}/library/metadata/${encodeURIComponent(seasonKey)}/children?excludeAllLeaves=1&X-Plex-Container-Size=500`,
            ).catch(() => null);
            const list = metadataList(seasonKids);
            const neighbor = direction > 0
                ? nextEpisodeInList(list, meta.ratingKey)
                : previousEpisodeInList(list, meta.ratingKey);
            if (neighbor) return neighbor;
        }
        const showKey = meta.grandparentRatingKey;
        if (!showKey || !seasonKey) return null;
        const seasons = metadataList(await jsonFor(
            playback,
            `${uri}/library/metadata/${encodeURIComponent(showKey)}/children?excludeAllLeaves=1&X-Plex-Container-Size=100`,
        ).catch(() => null));
        const seasonIdx = seasons.findIndex((row) => String(row.ratingKey) === String(seasonKey));
        const neighborSeason = seasonIdx >= 0 ? seasons[seasonIdx + direction] : null;
        if (!neighborSeason?.ratingKey) return null;
        const kids = metadataList(await jsonFor(
            playback,
            `${uri}/library/metadata/${encodeURIComponent(neighborSeason.ratingKey)}/children?excludeAllLeaves=1&X-Plex-Container-Size=500`,
        ).catch(() => null));
        if (!kids.length) return null;
        return direction > 0 ? kids[0] : kids[kids.length - 1];
    };

    const fetchNextEpisode = (uri, playback, ratingKey) => (
        fetchNeighborEpisode(uri, playback, ratingKey, 1)
    );

    router.get('/me', requireAuth, requireMember, async (req, res) => {
        try {
            const profile = mapPlayerProfile(await getMediaPlayerProfile(req));
            res.json(profile);
        } catch (error) {
            res.status(error.status || 500).json({ error: error.message || 'Failed to load profile.' });
        }
    });

    router.get('/settings', requireAuth, requireMember, async (req, res) => {
        try {
            const settings = await getMediaPlayerSettings(req);
            res.json(settings);
        } catch (error) {
            res.status(error.status || 500).json({ error: error.message || 'Failed to load settings.' });
        }
    });

    router.put('/settings', requireAuth, requireMember, async (req, res) => {
        try {
            const settings = await saveMediaPlayerSettings(req, req.body || {});
            res.json({ ...normalizePlayerSettings(settings), saved: true });
        } catch (error) {
            res.status(error.status || 500).json({ error: error.message || 'Failed to save settings.' });
        }
    });

    const readHomeCache = (req) => {
        const key = homeCacheKey(req);
        const row = homeCache.get(key);
        if (!row) return null;
        if (Date.now() - row.at > HOME_CACHE_TTL_MS) {
            homeCache.delete(key);
            return null;
        }
        return row.payload;
    };

    const writeHomeCache = (req, payload) => {
        const key = homeCacheKey(req);
        homeCache.set(key, { at: Date.now(), payload });
        if (homeCache.size <= 40) return;
        const oldest = homeCache.keys().next().value;
        if (oldest && oldest !== key) homeCache.delete(oldest);
    };

    router.get('/home', requireAuth, requireMember, async (req, res) => {
        try {
            const cached = readHomeCache(req);
            if (cached) return res.json(cached);
            await withPlex(res, async ({ config, uri, token, headers }) => {
                const playback = await playbackFor(req, token);
                const hubQuery = `count=${HOME_HUB_COUNT}`;
                const hubOpts = { timeoutMs: HOME_PLEX_TIMEOUT_MS };
                const [sectionsRes, memberPromotedRes, memberHomeRes, onDeckRes] = await Promise.all([
                    plexJson(
                        fetchImpl,
                        `${uri}/library/sections?X-Plex-Token=${encodeURIComponent(token)}`,
                        headers,
                        hubOpts,
                    ),
                    jsonForMember(playback, `${uri}/hubs/promoted?${hubQuery}`, hubOpts).catch(() => null),
                    jsonForMember(playback, `${uri}/hubs/home?${hubQuery}`, hubOpts).catch(() => null),
                    jsonForMember(
                        playback,
                        `${uri}/library/onDeck?X-Plex-Container-Size=24`,
                        hubOpts,
                    ).catch(() => null),
                ]);
                const sections = (sectionsRes?.MediaContainer?.Directory || [])
                    .filter((dir) => ['movie', 'show', 'artist'].includes(dir.type))
                    .map(mapPlayerSection);

                const memberPromotedHubs = mapPlayerHomeHubs(memberPromotedRes?.MediaContainer?.Hub || [], config);
                const memberHomeHubs = mapPlayerHomeHubs(memberHomeRes?.MediaContainer?.Hub || [], config);
                let hubs = memberPromotedHubs.length
                    ? memberPromotedHubs
                    : (memberHomeHubs.length ? memberHomeHubs : null);
                const memberOwned = Boolean(hubs?.length);
                if (!hubs) {
                    let rawHubs = [];
                    const promotedRes = await jsonForServer(playback, `${uri}/hubs/promoted?${hubQuery}`, hubOpts).catch(() => null);
                    rawHubs = [].concat(promotedRes?.MediaContainer?.Hub || []);
                    if (!rawHubs.length) {
                        const homeHubsRes = await jsonForServer(playback, `${uri}/hubs/home?${hubQuery}`, hubOpts).catch(() => null);
                        rawHubs = [].concat(homeHubsRes?.MediaContainer?.Hub || []);
                    }
                    if (!rawHubs.length) {
                        const allHubs = await jsonForServer(playback, `${uri}/hubs?${hubQuery}`, hubOpts).catch(() => null);
                        rawHubs = [].concat(allHubs?.MediaContainer?.Hub || []);
                    }
                    hubs = mapPlayerHomeHubs(rawHubs, config);
                }
                hubs = dedupeLibraryContinueWatchingHubs(hubs);
                const onDeckItems = dedupeItems(metadataList(onDeckRes).map((meta) => mapContinueWatchingItem(meta, config)));
                const memberHubWatching = (
                    memberPromotedHubs.find((hub) => isLibraryContinueWatchingHub(hub))?.items
                    || memberHomeHubs.find((hub) => isLibraryContinueWatchingHub(hub))?.items
                    || []
                );
                let continueWatching = onDeckItems.length ? onDeckItems : dedupeItems(memberHubWatching);
                if (!continueWatching.length) {
                    continueWatching = await memberHistoryOnDeck(req, playback, { config, uri });
                }
                hubs = withMemberContinueWatching(hubs, continueWatching, { keepWhenEmpty: memberOwned });
                let recentByLibrary = [];
                let playlists = [];
                if (!hubs.some((hub) => !isLibraryContinueWatchingHub(hub))) {
                    const savedSettings = await getMediaPlayerSettings(req).catch(() => normalizePlayerSettings());
                    const [playlistsRes, ...recentResults] = await Promise.all([
                        savedSettings.showPlaylists === false
                            ? Promise.resolve(null)
                            : jsonForMember(playback, `${uri}/playlists?playlistType=video&X-Plex-Container-Size=24`, hubOpts).catch(() => null),
                        ...sections.slice(0, 12).map((section) => plexJson(
                            fetchImpl,
                            `${uri}/library/sections/${encodeURIComponent(section.key)}/recentlyAdded?X-Plex-Container-Size=16&X-Plex-Token=${encodeURIComponent(token)}`,
                            headers,
                            hubOpts,
                        ).then((data) => ({ section, data })).catch(() => ({ section, data: null }))),
                    ]);
                    recentByLibrary = recentResults.map(({ section, data }) => ({
                        library: section,
                        items: dedupeItems(metadataList(data).map((meta) => mapRecentlyAddedItem(meta, section, config))),
                    })).filter((row) => row.items.length);
                    playlists = savedSettings.showPlaylists === false
                        ? []
                        : metadataList(playlistsRes)
                            .filter((meta) => String(meta.playlistType || meta.type || 'video').toLowerCase() !== 'audio')
                            .map((meta) => mapPlayerPlaylist(meta, config))
                            .filter((row) => row.ratingKey);
                    playlists = dedupeItems(playlists, 24);
                }

                const payload = {
                    libraries: sections,
                    hubs,
                    continueWatching,
                    recentByLibrary,
                    playlists,
                };
                writeHomeCache(req, payload);
                res.json(payload);
            });
        } catch (error) {
            res.status(500).json({ error: error.message || 'Failed to load Media Player home.' });
        }
    });

    router.get('/home-hero', requireAuth, requireMember, async (req, res) => {
        try {
            await withPlex(res, async ({ config, uri, token, headers }) => {
                const payload = await buildMediaPlayerHomeHero({
                    config,
                    uri,
                    token,
                    headers,
                    fetchImpl,
                    plexJson,
                    mapPlayerItem,
                    force: String(req.query.refresh || '') === '1',
                });
                res.json(payload);
            });
        } catch (error) {
            res.status(500).json({ error: error.message || 'Failed to load Media Player hero.' });
        }
    });

    router.get('/search', requireAuth, requireMember, async (req, res) => {
        try {
            const query = String(req.query.q || '').trim();
            if (query.length < 2) return res.json({ results: [] });
            await withPlex(res, async ({ config, uri, token, headers }) => {
                const data = await plexJson(
                    fetchImpl,
                    `${uri}/hubs/search?query=${encodeURIComponent(query)}&limit=16&X-Plex-Token=${encodeURIComponent(token)}`,
                    headers,
                );
                const buckets = { show: [], movie: [], episode: [], other: [] };
                for (const hub of data?.MediaContainer?.Hub || []) {
                    for (const meta of hub.Metadata || []) {
                        if (!['movie', 'show', 'episode', 'artist', 'album', 'playlist'].includes(meta.type)) continue;
                        const item = meta.type === 'playlist'
                            ? mapPlayerPlaylist(meta, config)
                            : mapPlayerItem(meta, config);
                        if (!item?.ratingKey) continue;
                        if (item.type === 'show') buckets.show.push(item);
                        else if (item.type === 'movie') buckets.movie.push(item);
                        else if (item.type === 'episode') buckets.episode.push(item);
                        else buckets.other.push(item);
                    }
                }
                res.json({
                    results: [
                        ...buckets.show.slice(0, 16),
                        ...buckets.movie.slice(0, 16),
                        ...buckets.episode.slice(0, 16),
                        ...buckets.other.slice(0, 8),
                    ],
                });
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

    router.get('/studio/:studioKey', requireAuth, requireMember, async (req, res) => {
        try {
            const studioKey = String(req.params.studioKey || '').trim();
            const name = String(req.query.name || '').trim();
            const sectionKey = String(req.query.section || '').replace(/\D/g, '');
            const mediaType = String(req.query.type || '').trim() === 'show' ? 'show'
                : String(req.query.type || '').trim() === 'movie' ? 'movie'
                    : '';
            if (!studioKey && !name) return res.status(400).json({ error: 'Invalid studio.' });
            await withPlex(res, async ({ config, uri, token, headers }) => {
                const sectionsRes = await plexJson(fetchImpl, `${uri}/library/sections?X-Plex-Token=${encodeURIComponent(token)}`, headers);
                const sections = (sectionsRes?.MediaContainer?.Directory || [])
                    .filter((dir) => (mediaType ? dir.type === mediaType : (dir.type === 'movie' || dir.type === 'show')));
                const ordered = [
                    ...sections.filter((dir) => String(dir.key) === sectionKey),
                    ...sections.filter((dir) => String(dir.key) !== sectionKey),
                ];
                const filters = studioQueryValues(studioKey, name);
                const paramsToTry = mediaType === 'show' ? ['studio', 'network'] : ['studio'];
                const collected = [];
                for (const section of ordered) {
                    let found = false;
                    for (const param of paramsToTry) {
                        for (const filter of filters) {
                            const data = await plexJson(
                                fetchImpl,
                                `${uri}/library/sections/${encodeURIComponent(section.key)}/all?${param}=${encodeURIComponent(filter)}&X-Plex-Container-Start=0&X-Plex-Container-Size=500&X-Plex-Token=${encodeURIComponent(token)}`,
                                headers,
                            ).catch(() => null);
                            const metas = metadataList(data).filter((meta) => (
                                !mediaType || String(meta?.type || '') === mediaType
                            ));
                            collected.push(...metas);
                            if (metas.length) {
                                found = true;
                                break;
                            }
                        }
                        if (found) break;
                    }
                }
                const seen = new Set();
                const items = collected.filter((meta) => {
                    const key = String(meta?.ratingKey || meta?.title || '').trim();
                    if (!key || seen.has(key)) return false;
                    seen.add(key);
                    return true;
                }).slice(0, 500).map((meta) => mapPlayerItem(meta, config));
                res.json({
                    studio: { key: studioKey || name, name: name || studioKey },
                    items,
                });
            });
        } catch (error) {
            res.status(500).json({ error: error.message || 'Failed to load studio.' });
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
                    jsonForMember(
                        playback,
                        `${uri}/library/sections/${encodeURIComponent(sectionKey)}/onDeck?X-Plex-Container-Size=16`,
                    ).catch(() => null),
                ]);
                const section = directoryList(sectionRes)[0] || sectionRes?.MediaContainer || {};
                const hubs = [];
                let onDeckItems = metadataList(onDeckRes).map((meta) => mapContinueWatchingItem(meta, config));
                if (!onDeckItems.length) {
                    onDeckItems = await memberHistoryOnDeck(req, playback, { config, uri, sectionKey });
                }
                if (onDeckItems.length) {
                    hubs.push({ title: 'Continue Watching', identifier: 'continueWatching', items: onDeckItems });
                }
                const seen = new Set(hubs.map((hub) => hub.identifier));
                for (const hub of [].concat(hubsRes?.MediaContainer?.Hub || [])) {
                    const identifier = String(hub.hubIdentifier || hub.title || '');
                    if (isLibraryContinueWatchingHub(hub) || isLibraryContinueWatchingHub({ identifier, title: hub.title })) {
                        continue;
                    }
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
                    hubs: dedupeLibraryContinueWatchingHubs(hubs.filter((hub) => hub.items.length)),
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
                const filterUrl = (facet) => (
                    `${uri}/library/sections/${encodeURIComponent(sectionKey)}/${facet}?X-Plex-Token=${encodeURIComponent(token)}`
                );
                const [genreRes, decadeRes, resolutionRes, studioRes] = await Promise.all([
                    plexJson(fetchImpl, filterUrl('genre'), headers).catch(() => null),
                    plexJson(fetchImpl, filterUrl('decade'), headers).catch(() => null),
                    plexJson(fetchImpl, filterUrl('resolution'), headers).catch(() => null),
                    plexJson(fetchImpl, filterUrl('studio'), headers).catch(() => null),
                ]);
                res.json({
                    genres: mapPlayerFilterOptions(genreRes),
                    decades: mapPlayerFilterOptions(decadeRes),
                    resolutions: mapPlayerFilterOptions(resolutionRes),
                    studios: mapPlayerFilterOptions(studioRes),
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
            const decade = String(req.query.decade || '').trim();
            const resolution = String(req.query.resolution || '').trim();
            const studio = String(req.query.studio || '').trim();
            const unwatched = String(req.query.unwatched || '') === '1';
            const inProgress = String(req.query.inProgress || '') === '1';
            await withPlex(res, async ({ config, uri, token, headers }) => {
                const params = new URLSearchParams({
                    'X-Plex-Container-Start': String(start),
                    'X-Plex-Container-Size': String(size),
                    sort,
                    'X-Plex-Token': token,
                });
                if (genre) params.set('genre', genre);
                if (decade) params.set('decade', decade);
                if (resolution) params.set('resolution', resolution);
                if (studio) params.set('studio', studio);
                if (inProgress) params.set('filters', 'inProgress=1');
                else if (unwatched) params.set('unwatched', '1');
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
            const sectionHint = String(req.query.section || '').replace(/\D/g, '');
            if (!/^\d+$/.test(ratingKey)) return res.status(400).json({ error: 'Invalid collection.' });
            await withPlex(res, async ({ config, uri, token, headers }) => {
                const plexToken = token;
                const plexHeaders = headers;
                const tokenQs = `X-Plex-Token=${encodeURIComponent(plexToken)}`;

                // Overview collection pills often carry the tag/filter id, which is not
                // always a /library/metadata ratingKey — try several Plex shapes.
                let metaRes = await plexJsonOrNull(
                    fetchImpl,
                    `${uri}/library/metadata/${encodeURIComponent(ratingKey)}?includeChildren=1&includeGuids=1&${tokenQs}`,
                    plexHeaders,
                );
                if (!metaRes) {
                    metaRes = await plexJsonOrNull(
                        fetchImpl,
                        `${uri}/library/collections/${encodeURIComponent(ratingKey)}?includeChildren=1&includeGuids=1&${tokenQs}`,
                        plexHeaders,
                    );
                }

                let meta = metadataList(metaRes)[0] || null;
                let sectionId = String(meta?.librarySectionID || sectionHint || '').replace(/\D/g, '');

                const matchCollectionRow = (rows) => (Array.isArray(rows) ? rows : []).find((row) => {
                    const key = String(row?.ratingKey || '').trim();
                    const index = row?.index != null ? String(row.index).trim() : '';
                    return key === ratingKey || index === ratingKey;
                }) || null;

                if (!meta && sectionId) {
                    const listed = await plexJsonOrNull(
                        fetchImpl,
                        `${uri}/library/sections/${encodeURIComponent(sectionId)}/collections?X-Plex-Container-Size=500&${tokenQs}`,
                        plexHeaders,
                    );
                    const hit = matchCollectionRow(metadataList(listed));
                    if (hit) {
                        meta = hit;
                        sectionId = String(hit.librarySectionID || sectionId).replace(/\D/g, '');
                        metaRes = listed;
                    }
                }

                if (!meta) {
                    const sectionsRes = await plexJson(
                        fetchImpl,
                        `${uri}/library/sections?${tokenQs}`,
                        plexHeaders,
                    );
                    const sections = (sectionsRes?.MediaContainer?.Directory || [])
                        .filter((dir) => ['movie', 'show'].includes(dir.type))
                        .map((dir) => String(dir.key || '').trim())
                        .filter((key) => /^\d+$/.test(key));
                    const ordered = sectionId
                        ? [sectionId, ...sections.filter((id) => id !== sectionId)]
                        : sections;
                    for (const section of ordered) {
                        const listed = await plexJsonOrNull(
                            fetchImpl,
                            `${uri}/library/sections/${encodeURIComponent(section)}/collections?X-Plex-Container-Size=500&${tokenQs}`,
                            plexHeaders,
                        );
                        const hit = matchCollectionRow(metadataList(listed));
                        if (hit) {
                            meta = hit;
                            sectionId = section;
                            metaRes = listed;
                            break;
                        }
                    }
                    if (!meta) {
                        // Tag ids from item Collection[] often only work as section filters.
                        for (const section of ordered) {
                            const filtered = await plexJsonOrNull(
                                fetchImpl,
                                `${uri}/library/sections/${encodeURIComponent(section)}/all?collection=${encodeURIComponent(ratingKey)}&X-Plex-Container-Start=0&X-Plex-Container-Size=1&${tokenQs}`,
                                plexHeaders,
                            );
                            const total = Number(
                                filtered?.MediaContainer?.totalSize
                                || filtered?.MediaContainer?.size
                                || metadataList(filtered).length
                                || 0,
                            );
                            if (total > 0 || metadataList(filtered).length) {
                                sectionId = section;
                                meta = {
                                    ratingKey,
                                    title: 'Collection',
                                    type: 'collection',
                                    librarySectionID: section,
                                    key: `/library/sections/${section}/all?collection=${ratingKey}`,
                                };
                                metaRes = null;
                                break;
                            }
                        }
                    }
                }

                if (!meta) return res.status(404).json({ error: 'Collection not found.' });
                if (!meta.librarySectionID && sectionId) meta = { ...meta, librarySectionID: sectionId };

                const seen = new Set();
                const takeChildren = (payload) => {
                    const rows = [];
                    for (const row of collectionChildItems(payload, String(meta.ratingKey || ratingKey))) {
                        const key = String(row?.ratingKey || '').trim();
                        if (!key || seen.has(key)) continue;
                        seen.add(key);
                        rows.push(row);
                    }
                    return rows;
                };

                let childMetas = takeChildren(metaRes);
                if (!childMetas.length) {
                    const paths = collectionChildPaths(meta, String(meta.ratingKey || ratingKey));
                    // Prefer section filter with the original tag id when it differs from ratingKey.
                    if (sectionId && String(meta.ratingKey || '') !== ratingKey) {
                        paths.unshift(`/library/sections/${sectionId}/all?collection=${encodeURIComponent(ratingKey)}`);
                    }
                    for (const path of paths) {
                        for (let start = 0; start < 2000; start += 500) {
                            const page = await plexJsonOrNull(
                                fetchImpl,
                                `${uri}${withPlexContainerParams(path, plexToken, { start, size: 500 })}`,
                                plexHeaders,
                            );
                            const rows = takeChildren(page);
                            childMetas = childMetas.concat(rows);
                            const total = Number(page?.MediaContainer?.totalSize || page?.MediaContainer?.size || rows.length);
                            if (!rows.length || childMetas.length >= total || rows.length < 500) break;
                        }
                        if (childMetas.length) break;
                    }
                }

                res.json({
                    item: mapPlayerItem({ ...meta, type: meta.type || 'collection' }, config),
                    children: childMetas.map((row) => mapPlayerItem(row, config)),
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
                const next = await fetchNextEpisode(uri, playback, ratingKey);
                if (!next) return res.json({ item: null });
                res.json({ item: mapPlayerItem(next, config) });
            });
        } catch (error) {
            res.status(500).json({ error: error.message || 'Failed to load next episode.' });
        }
    });

    router.get('/neighbors/:ratingKey', requireAuth, requireMember, async (req, res) => {
        try {
            const ratingKey = String(req.params.ratingKey || '').trim();
            if (!/^\d+$/.test(ratingKey)) return res.status(400).json({ error: 'Invalid title.' });
            await withPlex(res, async ({ config, uri, token }) => {
                const playback = await playbackFor(req, token);
                const [previous, next] = await Promise.all([
                    fetchNeighborEpisode(uri, playback, ratingKey, -1),
                    fetchNeighborEpisode(uri, playback, ratingKey, 1),
                ]);
                res.json({
                    previous: previous ? mapPlayerItem(previous, config) : null,
                    next: next ? mapPlayerItem(next, config) : null,
                });
            });
        } catch (error) {
            res.status(500).json({ error: error.message || 'Failed to load episodes.' });
        }
    });

    router.get('/item/:ratingKey', requireAuth, requireMember, async (req, res) => {
        try {
            const ratingKey = String(req.params.ratingKey || '').trim();
            if (!/^\d+$/.test(ratingKey)) return res.status(400).json({ error: 'Invalid title.' });
            await withPlex(res, async ({ config, uri, token, headers }) => {
                const metaUrl = `${uri}/library/metadata/${encodeURIComponent(ratingKey)}?includeChildren=1&includeGuids=1&includeExtras=1&includeRelated=1&includeRelatedCount=16&includeMarkers=1&X-Plex-Token=${encodeURIComponent(token)}`;
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
                        if (!item.studio) item.studio = mappedShow.studio;
                        if (!item.studioKey) item.studioKey = mappedShow.studioKey;
                        if (!item.librarySectionID) item.librarySectionID = mappedShow.librarySectionID;
                        if (!item.countries?.length) item.countries = mappedShow.countries;
                        if (!item.collections?.length) item.collections = mappedShow.collections;
                        if (!item.collectionItems?.length) item.collectionItems = mappedShow.collectionItems;
                        const episodeCast = Array.isArray(item.cast) ? item.cast : [];
                        const showCast = Array.isArray(mappedShow.cast) ? mappedShow.cast : [];
                        const showNames = new Set(showCast.map((row) => String(row.name || '').toLowerCase()));
                        item.guestStars = episodeCast.filter((row) => !showNames.has(String(row.name || '').toLowerCase()));
                        if (item.type === 'episode' && showCast.length) {
                            const seen = new Set(episodeCast.map((row) => String(row.name || '').toLowerCase()));
                            item.cast = [
                                ...episodeCast,
                                ...showCast.filter((row) => !seen.has(String(row.name || '').toLowerCase())),
                            ];
                        } else if (!item.cast.length) {
                            item.cast = showCast;
                        }
                        if (!item.tmdbId) item.tmdbId = mappedShow.tmdbId;
                        item.externalIds = {
                            imdb: item.externalIds?.imdb || mappedShow.externalIds?.imdb || null,
                            tmdb: item.externalIds?.tmdb || mappedShow.externalIds?.tmdb || item.tmdbId || null,
                            tvdb: item.externalIds?.tvdb || mappedShow.externalIds?.tvdb || null,
                        };
                        if (!item.logo && mappedShow.logo) item.logo = mappedShow.logo;
                        if (!item.themeKey && mappedShow.themeKey) item.themeKey = mappedShow.themeKey;
                        if (!item.genres?.length) item.genres = mappedShow.genres;
                        if (!item.contentRating) item.contentRating = mappedShow.contentRating;
                        if (ratingsEmpty && mappedShow.ratings) item.ratings = mappedShow.ratings;
                        if (item.type === 'season') {
                            if (!item.summary) item.summary = mappedShow.summary;
                            if (!item.tagline) item.tagline = mappedShow.tagline;
                            if (!item.directorPeople?.length) item.directorPeople = mappedShow.directorPeople;
                            if (!item.writerPeople?.length) item.writerPeople = mappedShow.writerPeople;
                            if (!item.producers?.length) item.producers = mappedShow.producers;
                        }
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
                const playback = await playbackFor(req, token);
                let onDeck = null;
                if (item.type === 'show' || item.type === 'season') {
                    const playable = await resolvePlayableMeta(uri, playback, ratingKey, meta);
                    if (playable && String(playable.type || '') === 'episode') {
                        onDeck = mapPlayerItem(playable, config);
                    }
                }
                res.json({ item, children, extras, related, onDeck });
            });
        } catch (error) {
            res.status(500).json({ error: error.message || 'Failed to load title.' });
        }
    });

    const playInput = (req) => ({
        ...(req.query && typeof req.query === 'object' ? req.query : {}),
        ...(req.body && typeof req.body === 'object' ? req.body : {}),
    });

    const handlePlay = async (req, res) => {
        try {
            const ratingKey = String(req.params.ratingKey || '').trim();
            if (!/^\d+$/.test(ratingKey)) return res.status(400).json({ error: 'Invalid title.' });
            const input = playInput(req);
            await withPlex(res, async ({ config, uri, token, headers }) => {
                const playback = await playbackFor(req, token);
                const data = await jsonFor(
                    playback,
                    `${uri}/library/metadata/${encodeURIComponent(ratingKey)}?includeMarkers=1`,
                    { timeoutMs: 15000 },
                );
                const meta = metadataList(data)[0];
                const item = mapPlayerItem(meta, config);
                if (!item.canPlay) {
                    return res.status(400).json({ error: 'This title cannot be played yet. Open an episode, movie, trailer, or series.' });
                }
                const playable = await resolvePlayableMeta(uri, playback, ratingKey, meta);
                if (!playable) {
                    return res.status(400).json({ error: 'Nothing left to play in this title.' });
                }
                let playableMeta = playable;
                if (String(playable.ratingKey) !== String(ratingKey)) {
                    const playableData = await jsonFor(
                        playback,
                        `${uri}/library/metadata/${encodeURIComponent(playable.ratingKey)}?includeMarkers=1`,
                    ).catch(() => null);
                    playableMeta = metadataList(playableData)[0] || playable;
                }
                const mediaIndex = pickMediaIndex(input.mediaIndex, playableMeta);
                const selected = withSelectedMedia(playableMeta, mediaIndex);
                const playableItem = mapPlayerItem(selected, config);
                const offset = resolvePlayOffsetMs(
                    input.offsetMs,
                    playableItem.viewOffsetMs || 0,
                    playableItem.durationMs,
                );
                const sessionId = randomUUID();
                const savedSettings = await getMediaPlayerSettings(req).catch(() => normalizePlayerSettings());
                const options = mapPlayerPlaybackOptions(selected, {
                    audioLanguage: input.audioLanguage ?? savedSettings.audioLanguage,
                    subtitleMode: input.subtitleMode ?? savedSettings.subtitleMode,
                });
                const requestedQuality = String(input.qualityId || '');
                const qualityId = isPlayerQualityId(requestedQuality) ? requestedQuality : options.qualityId;
                const caps = normalizePlaybackCaps({
                    ...input,
                    subtitleStreamId: options.subtitleStreamId,
                });
                const allowHevc = caps.allowHevc;
                const allowAc3 = caps.allowAc3;
                const allowNativeHls = input.canPlayNativeHls === true
                    || input.canPlayNativeHls === 'true'
                    || input.canPlayNativeHls === '1'
                    || caps.client !== 'web';
                const subtitleStreamId = options.subtitleStreamId;
                const useDirectFile = qualityId === ORIGINAL_PLAYER_QUALITY_ID
                    && canHttpDirectPlay(selected, caps);
                const copyOriginal = qualityId !== ORIGINAL_PLAYER_QUALITY_ID
                    || !isHevcVideo(selected)
                    || (allowHevc && allowNativeHls);
                const srcOpts = {
                    sessionId,
                    offsetMs: offset,
                    qualityId,
                    audioStreamId: options.audioStreamId,
                    subtitleStreamId,
                    resume: true,
                    copy: copyOriginal,
                    mediaIndex,
                    client: caps.client,
                    allowHevc,
                    allowAc3,
                    textSubtitles: caps.textSubtitles,
                };
                res.json({
                    sessionId,
                    item: playableItem,
                    src: useDirectFile
                        ? buildPlayerFileSrc(playableItem.ratingKey, srcOpts)
                        : buildPlayerHlsSrc(playableItem.ratingKey, srcOpts),
                    offsetMs: offset,
                    ...options,
                    qualityId,
                    mediaIndex,
                    versions: mapPlayerVersions(playableMeta),
                    markers: mapPlayerMarkers(playableMeta),
                    playbackMode: mapPlayerPlaybackMode({ useDirectFile, copyOriginal, qualityId }),
                    source: mapPlayerPlaybackSource(selected),
                    canDirectPlay: canHttpDirectPlay(selected, { ...input, subtitleStreamId: '' }),
                    canCopyOriginal: copyOriginal,
                    client: caps.client,
                });
            });
        } catch (error) {
            sendJsonError(res, 500, error, 'Failed to start playback.');
        }
    };

    router.post('/play/:ratingKey', requireAuth, requireMember, handlePlay);
    router.get('/play/:ratingKey', requireAuth, requireMember, handlePlay);

    router.get('/hls/:ratingKey/master.m3u8', requireAuth, requireMember, async (req, res) => {
        try {
            const ratingKey = String(req.params.ratingKey || '').trim();
            if (!/^\d+$/.test(ratingKey)) return res.status(400).json({ error: 'Invalid title.' });
            const rawOffset = Math.max(0, Math.floor(Number(req.query.offset) || 0));
            const offsetMs = String(req.query.resume || '') === '1' ? clampPlayOffsetMs(rawOffset) : rawOffset;
            const qualityId = isPlayerQualityId(req.query.quality) ? String(req.query.quality) : ORIGINAL_PLAYER_QUALITY_ID;
            const audioStreamID = String(req.query.audioStreamID || '').replace(/\D/g, '');
            const subtitleStreamID = String(req.query.subtitleStreamID || '').replace(/\D/g, '');
            const allowCopy = qualityId !== ORIGINAL_PLAYER_QUALITY_ID || String(req.query.copy || '1') !== '0';
            const transcodeSession = isPlaySessionId(req.query.session) ? String(req.query.session) : randomUUID();
            const mediaIndex = String(Math.max(0, Math.floor(Number(req.query.mediaIndex) || 0)));
            await withPlex(res, async ({ uri, token }) => {
                const playback = await playbackFor(req, token);
                let lastDetail = '';
                const attempts = transcodeSettingsForQuality(qualityId)
                    .filter((attempt) => allowCopy || !attempt.copy);
                for (const pair of streamPairsFor(playback)) {
                    const attemptHeaders = {
                        ...pair.headers,
                        'X-Plex-Session-Identifier': transcodeSession,
                    };
                    for (const attempt of attempts) {
                        const { copy, ...plexAttempt } = attempt;
                        const params = new URLSearchParams({
                            hasMDE: '1',
                            path: `/library/metadata/${ratingKey}`,
                            mediaIndex,
                            partIndex: '0',
                            protocol: 'hls',
                            fastSeek: '1',
                            audioBoost: '100',
                            location: plexStreamLocation(uri),
                            addDebugOverlay: '0',
                            autoAdjustQuality: '0',
                            copyts: '1',
                            session: transcodeSession,
                            ...plexAttempt,
                            directPlay: '0',
                            directStream: subtitleStreamID ? '0' : plexAttempt.directStream,
                        });
                        if (audioStreamID) params.set('audioStreamID', audioStreamID);
                        if (subtitleStreamID) {
                            params.set('subtitleStreamID', subtitleStreamID);
                            params.set('subtitles', 'burn');
                            params.set('advancedSubtitles', 'burn');
                            params.set('subtitleSize', '100');
                        } else {
                            params.set('subtitleStreamID', '0');
                            params.set('subtitles', 'none');
                            params.set('advancedSubtitles', 'none');
                            params.set('subtitleSize', '0');
                        }
                        if (offsetMs) params.set('offset', String(Math.floor(offsetMs / 1000)));
                        addPlexIdentityParams(params, attemptHeaders, pair.token, { transcodeProfile: !copy });
                        const startUrl = `${uri}/video/:/transcode/universal/start.m3u8?${params.toString()}`;
                        let plexRes;
                        try {
                            plexRes = await plexFetch(fetchImpl, startUrl, attemptHeaders, { timeoutMs: 20000 });
                        } catch (error) {
                            lastDetail = /timeout|abort/i.test(String(error?.name || error?.message || ''))
                                ? 'Plex transcode start timed out.'
                                : String(error?.message || error || 'Plex transcode start failed.');
                            continue;
                        }
                        const body = await plexRes.text();
                        if (plexRes.ok && isHlsPlaylist(body)) {
                            const proxyPrefix = '/api/media-player/proxy?u=';
                            res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
                            res.setHeader('Cache-Control', 'no-store');
                            return res.send(rewritePlaylistUrls(body, uri, proxyPrefix, plexRes.url || startUrl));
                        }
                        lastDetail = String(body || `HTTP ${plexRes.status}`).slice(0, 300);
                        if (plexRes.status === 401 || plexRes.status === 403) break;
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

    const pipePlexBody = (plexRes, res) => {
        res.status(plexRes.status);
        res.setHeader('Cache-Control', 'no-store');
        for (const name of ['content-type', 'content-length', 'content-range', 'accept-ranges']) {
            const value = plexRes.headers.get(name);
            if (value) res.setHeader(name, value);
        }
        if (!res.getHeader('accept-ranges')) res.setHeader('Accept-Ranges', 'bytes');
        try {
            if (plexRes.body && typeof Readable.fromWeb === 'function') {
                return Readable.fromWeb(plexRes.body).pipe(res);
            }
        } catch {
            /* fall through to buffered copy */
        }
        return plexRes.arrayBuffer().then((buf) => res.send(Buffer.from(buf)));
    };

    router.get('/theme/:ratingKey', requireAuth, requireMember, async (req, res) => {
        try {
            const ratingKey = String(req.params.ratingKey || '').trim();
            if (!/^\d+$/.test(ratingKey)) return res.status(400).json({ error: 'Invalid title.' });
            await withPlex(res, async ({ uri, token }) => {
                const playback = await playbackFor(req, token);
                const data = await jsonFor(
                    playback,
                    `${uri}/library/metadata/${encodeURIComponent(ratingKey)}`,
                );
                const meta = metadataList(data)[0];
                const themePath = pickPlayerThemePath(meta);
                if (!meta || !isPlayerThemePath(themePath)) {
                    return res.status(404).json({ error: 'No theme music.' });
                }
                const qIndex = themePath.indexOf('?');
                const pathname = qIndex >= 0 ? themePath.slice(0, qIndex) : themePath;
                const themeQuery = new URLSearchParams(qIndex >= 0 ? themePath.slice(qIndex + 1) : '');
                let plexRes = null;
                let lastDetail = '';
                for (const pair of streamPairsFor(playback)) {
                    const params = new URLSearchParams(themeQuery);
                    params.set('X-Plex-Token', pair.token);
                    const headers = { ...pair.headers };
                    if (req.headers.range) headers.Range = String(req.headers.range);
                    plexRes = await fetchImpl(`${uri}${pathname}?${params.toString()}`, { headers });
                    if (plexRes.ok || plexRes.status === 206) break;
                    lastDetail = String(await plexRes.text().catch(() => '')).slice(0, 200);
                    if (plexRes.status !== 401 && plexRes.status !== 403 && plexRes.status !== 404) break;
                }
                if (!plexRes || (!plexRes.ok && plexRes.status !== 206)) {
                    return res.status(404).json({ error: 'No theme music.', detail: lastDetail });
                }
                return pipePlexBody(plexRes, res);
            });
        } catch (error) {
            res.status(500).json({ error: error.message || 'Failed to load theme music.' });
        }
    });

    router.get('/file/:ratingKey', requireAuth, requireMember, async (req, res) => {
        try {
            const ratingKey = String(req.params.ratingKey || '').trim();
            if (!/^\d+$/.test(ratingKey)) return res.status(400).json({ error: 'Invalid title.' });
            await withPlex(res, async ({ uri, token }) => {
                const playback = await playbackFor(req, token);
                const data = await jsonFor(
                    playback,
                    `${uri}/library/metadata/${encodeURIComponent(ratingKey)}`,
                );
                const meta = metadataList(data)[0];
                const mediaIndex = pickMediaIndex(req.query.mediaIndex, meta);
                const selected = withSelectedMedia(meta, mediaIndex);
                const partId = pickPlayerPartId(selected);
                const caps = normalizePlaybackCaps(req.query || {});
                if (!partId || !canHttpDirectPlay(selected, caps)) {
                    return res.status(409).json({ error: 'This title cannot Direct Play on this device.' });
                }
                let plexRes = null;
                let lastDetail = '';
                for (const pair of streamPairsFor(playback)) {
                    const headers = { ...pair.headers };
                    if (req.headers.range) headers.Range = String(req.headers.range);
                    plexRes = await fetchImpl(
                        `${uri}/library/parts/${encodeURIComponent(partId)}/file?X-Plex-Token=${encodeURIComponent(pair.token)}`,
                        { headers },
                    );
                    if (plexRes.ok || plexRes.status === 206) break;
                    lastDetail = String(await plexRes.text().catch(() => '')).slice(0, 200);
                    if (plexRes.status !== 401 && plexRes.status !== 403 && plexRes.status !== 404) break;
                }
                if (!plexRes || (!plexRes.ok && plexRes.status !== 206)) {
                    return res.status(502).json({ error: 'Plex refused Direct Play.', detail: lastDetail });
                }
                return pipePlexBody(plexRes, res);
            });
        } catch (error) {
            res.status(500).json({ error: error.message || 'Failed to start Direct Play.' });
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
                let lastDetail = '';
                for (const pair of timelinePairsFor(playback)) {
                    const params = buildPlexTimelineParams({
                        ratingKey,
                        state,
                        timeMs: req.body?.timeMs,
                        durationMs: req.body?.durationMs,
                        sessionId,
                        audioStreamId: req.body?.audioStreamId,
                        subtitleStreamId: req.body?.subtitleStreamId,
                    });
                    addPlexIdentityParams(params, pair.headers, pair.token, { transcodeProfile: false });
                    const plexRes = await fetchImpl(`${uri}/:/timeline?${params.toString()}`, {
                        headers: {
                            ...pair.headers,
                            Accept: 'application/json, text/plain, */*',
                            'X-Plex-Session-Identifier': sessionId || pair.identity,
                        },
                    });
                    if (plexRes.ok) return res.status(204).end();
                    lastDetail = String(await plexRes.text().catch(() => '')).slice(0, 200);
                    if (plexRes.status !== 401 && plexRes.status !== 403) {
                        return res.status(502).json({ error: 'Plex refused timeline update.', detail: lastDetail });
                    }
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
                for (const pair of streamPairsFor(playback)) {
                    const params = new URLSearchParams({ session: sessionId });
                    addPlexIdentityParams(params, pair.headers, pair.token, { transcodeProfile: false });
                    await plexFetch(
                        fetchImpl,
                        `${uri}/video/:/transcode/universal/stop?${params}`,
                        {
                            ...pair.headers,
                            'X-Plex-Session-Identifier': sessionId,
                        },
                        { timeoutMs: 5000 },
                    ).catch(() => null);
                }
                res.status(204).end();
            });
        } catch {
            res.status(204).end();
        }
    });

    router.get('/playlists', requireAuth, requireMember, async (req, res) => {
        try {
            await withPlex(res, async ({ config, uri, token }) => {
                const playback = await playbackFor(req, token);
                const data = await plexJson(
                    fetchImpl,
                    `${uri}/playlists?playlistType=video&X-Plex-Container-Size=200&X-Plex-Token=${encodeURIComponent(playback.token)}`,
                    playback.metaHeaders,
                ).catch(() => null);
                res.json({
                    items: metadataList(data)
                        .filter((meta) => String(meta.playlistType || meta.type || 'video').toLowerCase() !== 'audio')
                        .map((meta) => mapPlayerPlaylist(meta, config))
                        .filter((row) => row.ratingKey),
                });
            });
        } catch (error) {
            res.status(500).json({ error: error.message || 'Failed to load playlists.' });
        }
    });

    router.get('/playlists/:ratingKey', requireAuth, requireMember, async (req, res) => {
        try {
            const ratingKey = String(req.params.ratingKey || '').trim();
            if (!/^\d+$/.test(ratingKey)) return res.status(400).json({ error: 'Invalid playlist.' });
            await withPlex(res, async ({ config, uri, token }) => {
                const playback = await playbackFor(req, token);
                const [metaRes, itemsRes] = await Promise.all([
                    jsonFor(playback, `${uri}/playlists/${encodeURIComponent(ratingKey)}`),
                    jsonFor(
                        playback,
                        `${uri}/playlists/${encodeURIComponent(ratingKey)}/items?X-Plex-Container-Start=0&X-Plex-Container-Size=200`,
                    ).catch(() => null),
                ]);
                const meta = metadataList(metaRes)[0];
                if (!meta) return res.status(404).json({ error: 'Playlist not found.' });
                res.json({
                    item: mapPlayerPlaylist(meta, config),
                    children: metadataList(itemsRes || metaRes).map((row) => mapPlayerItem(row, config)),
                });
            });
        } catch (error) {
            res.status(500).json({ error: error.message || 'Failed to load playlist.' });
        }
    });

    router.post('/playlists', requireAuth, requireMember, async (req, res) => {
        try {
            const title = String(req.body?.title || '').trim();
            const ratingKey = String(req.body?.ratingKey || '').trim();
            if (!title) return res.status(400).json({ error: 'Playlist name is required.' });
            if (ratingKey && !/^\d+$/.test(ratingKey)) return res.status(400).json({ error: 'Invalid title.' });
            await withPlex(res, async ({ config, uri, token }) => {
                const playback = await playbackFor(req, token);
                const machine = String(config.serverIdentifier || '').trim();
                if (!machine) return res.status(503).json({ error: 'Plex is not configured.' });
                const params = new URLSearchParams({
                    title,
                    type: 'video',
                    smart: '0',
                    'X-Plex-Token': playback.token,
                });
                if (ratingKey) params.set('uri', plexPlaylistUri(machine, ratingKey));
                const plexRes = await fetchImpl(`${uri}/playlists?${params.toString()}`, {
                    method: 'POST',
                    headers: playback.metaHeaders,
                });
                if (!plexRes.ok) {
                    const detail = String(await plexRes.text().catch(() => '')).slice(0, 200);
                    return res.status(502).json({ error: 'Plex refused to create the playlist.', detail });
                }
                const data = await plexRes.json().catch(() => null);
                const created = metadataList(data)[0];
                res.json({ item: created ? mapPlayerPlaylist(created, config) : { title, type: 'playlist' } });
            });
        } catch (error) {
            res.status(500).json({ error: error.message || 'Failed to create playlist.' });
        }
    });

    router.post('/playlists/:ratingKey/items', requireAuth, requireMember, async (req, res) => {
        try {
            const playlistKey = String(req.params.ratingKey || '').trim();
            const ratingKey = String(req.body?.ratingKey || '').trim();
            if (!/^\d+$/.test(playlistKey) || !/^\d+$/.test(ratingKey)) {
                return res.status(400).json({ error: 'Invalid playlist item.' });
            }
            await withPlex(res, async ({ config, uri, token }) => {
                const playback = await playbackFor(req, token);
                const machine = String(config.serverIdentifier || '').trim();
                if (!machine) return res.status(503).json({ error: 'Plex is not configured.' });
                const params = new URLSearchParams({
                    uri: plexPlaylistUri(machine, ratingKey),
                    'X-Plex-Token': playback.token,
                });
                const plexRes = await fetchImpl(
                    `${uri}/playlists/${encodeURIComponent(playlistKey)}/items?${params.toString()}`,
                    { method: 'PUT', headers: playback.metaHeaders },
                );
                if (!plexRes.ok) {
                    const detail = String(await plexRes.text().catch(() => '')).slice(0, 200);
                    return res.status(502).json({ error: 'Plex refused to update the playlist.', detail });
                }
                res.status(204).end();
            });
        } catch (error) {
            res.status(500).json({ error: error.message || 'Failed to update playlist.' });
        }
    });

    const markWatched = (watched) => async (req, res) => {
        try {
            const ratingKey = String(req.params.ratingKey || '').trim();
            if (!/^\d+$/.test(ratingKey)) return res.status(400).json({ error: 'Invalid title.' });
            await withPlex(res, async ({ uri, token }) => {
                const playback = await playbackFor(req, token);
                const action = watched ? 'scrobble' : 'unscrobble';
                const params = new URLSearchParams({
                    identifier: 'com.plexapp.plugins.library',
                    key: ratingKey,
                    'X-Plex-Token': playback.token,
                });
                const plexRes = await fetchImpl(`${uri}/:/${action}?${params.toString()}`, {
                    headers: playback.metaHeaders,
                });
                if (!plexRes.ok) {
                    const detail = String(await plexRes.text().catch(() => '')).slice(0, 200);
                    return res.status(502).json({ error: 'Plex refused the watched update.', detail });
                }
                res.status(204).end();
            });
        } catch (error) {
            res.status(500).json({ error: error.message || 'Failed to update watched status.' });
        }
    };

    router.post('/scrobble/:ratingKey', requireAuth, requireMember, markWatched(true));
    router.post('/unscrobble/:ratingKey', requireAuth, requireMember, markWatched(false));

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
            const playback = await playbackFor(req, config.plexToken);
            let plexRes = null;
            for (const pair of streamPairsFor(playback)) {
                const headers = { ...pair.headers };
                if (req.headers.range) headers.Range = String(req.headers.range);
                plexRes = await fetchImpl(target, { headers });
                if (plexRes.ok || plexRes.status === 206) break;
                if (plexRes.status !== 401 && plexRes.status !== 403 && plexRes.status !== 404) break;
            }
            if (!plexRes) return res.status(502).json({ error: 'Stream proxy failed.' });
            const contentType = plexRes.headers.get('content-type') || '';
            res.status(plexRes.status);
            res.setHeader('Cache-Control', 'no-store');
            if (/mpegurl|x-mpegURL|vnd\.apple\.mpegurl/i.test(contentType) || target.includes('.m3u8')) {
                const body = await plexRes.text();
                res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
                return res.send(rewritePlaylistUrls(body, uri, '/api/media-player/proxy?u=', plexRes.url || target));
            }
            for (const name of ['content-type', 'content-length', 'content-range', 'accept-ranges']) {
                const value = plexRes.headers.get(name);
                if (value) res.setHeader(name, value);
            }
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
