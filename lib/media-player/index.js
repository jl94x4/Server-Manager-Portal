import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import {
    clampPlayOffsetMs,
    isAllowedPlexProxyUrl,
    isHlsPlaylist,
    mapContinueWatchingItem,
    mapPlayerItem,
    mapPlayerSection,
    rewritePlaylistUrls,
    rewritePlexUrlToOrigin,
} from './mapItem.js';

const PLAYABLE_TYPES = new Set(['movie', 'episode']);
const HLS_CLIENT_PROFILE = [
    'add-transcode-target(type=videoProfile&context=streaming&protocol=hls&container=mpegts&videoCodec=h264&audioCodec=aac)',
    'add-limitation(scope=videoCodec&scopeName=h264&type=upperBound&name=video.width&value=1920)',
    'add-limitation(scope=videoCodec&scopeName=h264&type=upperBound&name=video.height&value=1080)',
].join('+');

const HLS_START_ATTEMPTS = [
    {
        directPlay: '0',
        directStream: '1',
        directStreamAudio: '1',
        videoCodec: 'h264',
        audioCodec: 'aac',
        videoResolution: '1920x1080',
        maxVideoBitrate: '12000',
        videoQuality: '90',
    },
    {
        directPlay: '0',
        directStream: '0',
        directStreamAudio: '0',
        videoCodec: 'h264',
        audioCodec: 'aac',
        videoResolution: '1280x720',
        maxVideoBitrate: '4000',
        videoQuality: '60',
    },
];

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
}) => {
    const router = Router();

    const playerHeaders = (token) => {
        const base = plexClientHeaders(token);
        const identifier = String(base['X-Plex-Client-Identifier'] || clientId || 'portal');
        return {
            ...base,
            'X-Plex-Provides': 'player,controller',
            'X-Plex-Device-Name': 'Portal Media Player',
            'X-Plex-Client-Identifier': `${identifier}-media-player`,
            'X-Plex-Product': 'Portal Media Player',
            'X-Plex-Platform': 'Chrome',
            'X-Plex-Platform-Version': String(appVersion || '1'),
        };
    };

    const streamHeaders = (token) => ({
        ...playerHeaders(token),
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

    router.get('/home', requireAuth, requireMember, async (req, res) => {
        try {
            await withPlex(res, async ({ config, uri, token, headers }) => {
                const sectionsRes = await plexJson(fetchImpl, `${uri}/library/sections?X-Plex-Token=${encodeURIComponent(token)}`, headers);
                const sections = (sectionsRes?.MediaContainer?.Directory || [])
                    .filter((dir) => ['movie', 'show', 'artist'].includes(dir.type))
                    .map(mapPlayerSection);

                const [onDeckRes, ...recentResults] = await Promise.all([
                    plexJson(fetchImpl, `${uri}/library/onDeck?X-Plex-Container-Size=24&X-Plex-Token=${encodeURIComponent(token)}`, headers).catch(() => null),
                    ...sections.slice(0, 12).map((section) => plexJson(
                        fetchImpl,
                        `${uri}/library/sections/${encodeURIComponent(section.key)}/recentlyAdded?X-Plex-Container-Size=16&X-Plex-Token=${encodeURIComponent(token)}`,
                        headers,
                    ).then((data) => ({ section, data })).catch(() => ({ section, data: null }))),
                ]);

                const continueWatching = metadataList(onDeckRes).map((meta) => mapContinueWatchingItem(meta, config));
                const recentMovies = [];
                const recentShows = [];
                const recentMusic = [];
                for (const { section, data } of recentResults) {
                    for (const meta of metadataList(data)) {
                        const item = mapPlayerItem({
                            ...meta,
                            ratingKey: meta.grandparentRatingKey || meta.parentRatingKey || meta.ratingKey,
                            title: meta.grandparentTitle || meta.parentTitle || meta.title,
                            thumb: meta.grandparentThumb || meta.parentThumb || meta.thumb,
                            type: section.type === 'movie' ? 'movie' : section.type === 'show' ? 'show' : meta.type,
                        }, config);
                        if (section.type === 'movie') recentMovies.push(item);
                        else if (section.type === 'show') recentShows.push(item);
                        else recentMusic.push(item);
                    }
                }
                const dedupe = (list) => {
                    const seen = new Set();
                    return list.filter((row) => {
                        const key = row.ratingKey || row.title;
                        if (!key || seen.has(key)) return false;
                        seen.add(key);
                        return true;
                    }).slice(0, 24);
                };
                res.json({
                    libraries: sections,
                    continueWatching: dedupe(continueWatching),
                    recentMovies: dedupe(recentMovies),
                    recentShows: dedupe(recentShows),
                    recentMusic: dedupe(recentMusic),
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

    router.get('/libraries/:sectionKey', requireAuth, requireMember, async (req, res) => {
        try {
            const sectionKey = String(req.params.sectionKey || '').trim();
            if (!/^\d+$/.test(sectionKey)) return res.status(400).json({ error: 'Invalid library.' });
            const start = Math.max(0, Number(req.query.start) || 0);
            const size = Math.min(100, Math.max(1, Number(req.query.size) || 50));
            await withPlex(res, async ({ config, uri, token, headers }) => {
                const data = await plexJson(
                    fetchImpl,
                    `${uri}/library/sections/${encodeURIComponent(sectionKey)}/all?X-Plex-Container-Start=${start}&X-Plex-Container-Size=${size}&X-Plex-Token=${encodeURIComponent(token)}`,
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

    router.get('/item/:ratingKey', requireAuth, requireMember, async (req, res) => {
        try {
            const ratingKey = String(req.params.ratingKey || '').trim();
            if (!/^\d+$/.test(ratingKey)) return res.status(400).json({ error: 'Invalid title.' });
            await withPlex(res, async ({ config, uri, token, headers }) => {
                const data = await plexJson(
                    fetchImpl,
                    `${uri}/library/metadata/${encodeURIComponent(ratingKey)}?includeChildren=1&includeGuids=1&X-Plex-Token=${encodeURIComponent(token)}`,
                    headers,
                );
                const meta = metadataList(data)[0];
                if (!meta) return res.status(404).json({ error: 'Title not found.' });
                const item = mapPlayerItem(meta, config);
                const needsShowMeta = (item.type === 'episode' || item.type === 'season')
                    && item.grandparentRatingKey
                    && (!item.cast.length || !item.tmdbId);
                if (needsShowMeta) {
                    const showData = await plexJson(
                        fetchImpl,
                        `${uri}/library/metadata/${encodeURIComponent(item.grandparentRatingKey)}?includeGuids=1&X-Plex-Token=${encodeURIComponent(token)}`,
                        headers,
                    ).catch(() => null);
                    const show = metadataList(showData)[0];
                    if (show) {
                        const mappedShow = mapPlayerItem(show, config);
                        if (!item.cast.length) item.cast = mappedShow.cast;
                        if (!item.tmdbId) item.tmdbId = mappedShow.tmdbId;
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
                res.json({ item, children });
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
                const data = await plexJson(
                    fetchImpl,
                    `${uri}/library/metadata/${encodeURIComponent(ratingKey)}?X-Plex-Token=${encodeURIComponent(token)}`,
                    headers,
                );
                const meta = metadataList(data)[0];
                const item = mapPlayerItem(meta, config);
                if (!PLAYABLE_TYPES.has(item.type)) {
                    return res.status(400).json({ error: 'This title cannot be played yet. Open an episode or movie.' });
                }
                const offset = clampPlayOffsetMs(
                    Number(req.body?.offsetMs) || item.viewOffsetMs || 0,
                    item.durationMs,
                );
                const qs = new URLSearchParams();
                if (offset) qs.set('offset', String(offset));
                res.json({
                    sessionId: randomUUID(),
                    item,
                    src: `/api/media-player/hls/${encodeURIComponent(ratingKey)}/master.m3u8${qs.toString() ? `?${qs}` : ''}`,
                    offsetMs: offset,
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
            const offsetMs = clampPlayOffsetMs(Number(req.query.offset) || 0);
            await withPlex(res, async ({ uri, token }) => {
                const headers = streamHeaders(token);
                let lastDetail = '';
                for (const attempt of HLS_START_ATTEMPTS) {
                    const params = new URLSearchParams({
                        hasMDE: '1',
                        path: `/library/metadata/${ratingKey}`,
                        mediaIndex: '0',
                        partIndex: '0',
                        protocol: 'hls',
                        fastSeek: '1',
                        subtitleSize: '0',
                        audioBoost: '100',
                        location: plexStreamLocation(uri),
                        addDebugOverlay: '0',
                        autoAdjustQuality: '0',
                        copyts: '1',
                        subtitles: 'none',
                        session: randomUUID(),
                        ...attempt,
                    });
                    if (offsetMs) params.set('offset', String(Math.floor(offsetMs / 1000)));
                    addPlexIdentityParams(params, headers, token);
                    const startUrl = `${uri}/video/:/transcode/universal/start.m3u8?${params.toString()}`;
                    const plexRes = await fetchImpl(startUrl, { headers });
                    const body = await plexRes.text();
                    if (plexRes.ok && isHlsPlaylist(body)) {
                        const proxyPrefix = '/api/media-player/proxy?u=';
                        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
                        res.setHeader('Cache-Control', 'no-store');
                        return res.send(rewritePlaylistUrls(body, uri, proxyPrefix, plexRes.url || startUrl));
                    }
                    lastDetail = String(body || `HTTP ${plexRes.status}`).slice(0, 300);
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
