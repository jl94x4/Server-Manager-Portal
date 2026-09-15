import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { createMediaPlayerRouter } from './index.js';

const oakStreetMeta = {
    MediaContainer: {
        Metadata: [{
            ratingKey: '637418',
            title: 'The End of Oak Street',
            type: 'movie',
            duration: 6000000,
            Media: [
                {
                    videoResolution: '4k',
                    height: 2160,
                    videoCodec: 'hevc',
                    audioCodec: 'eac3',
                    container: 'mkv',
                    Part: [{
                        id: 101,
                        container: 'mkv',
                        Stream: [
                            { id: 10, streamType: 1, codec: 'hevc', profile: 'main 10', height: 2160 },
                            { id: 20, streamType: 2, codec: 'eac3', selected: true, channels: 6, language: 'English' },
                        ],
                    }],
                },
                {
                    title: '1080p · H264 · MKV',
                    videoResolution: '1080',
                    height: 1080,
                    videoCodec: 'h264',
                    audioCodec: 'aac',
                    container: 'mkv',
                    Part: [{
                        id: 102,
                        container: 'mkv',
                        Stream: [
                            { id: 30, streamType: 1, codec: 'h264', height: 1080 },
                            { id: 40, streamType: 2, codec: 'aac', selected: true, channels: 2, language: 'English' },
                        ],
                    }],
                },
            ],
        }],
    },
};

const listen = (app) => new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => resolve(server));
});

const createApp = ({ fetchImpl, resolveMemberPlexToken } = {}) => {
    const app = express();
    app.use(express.json());
    app.use('/api/media-player', createMediaPlayerRouter({
        Router: express.Router,
        requireAuth: (_req, _res, next) => next(),
        requireMember: (_req, _res, next) => next(),
        loadPortalConfig: async () => ({
            mediaServerType: 'plex',
            plexToken: 'server-token',
            serverIdentifier: 'abc',
        }),
        getPlexConnectionUri: async () => 'http://127.0.0.1:32400',
        plexClientHeaders: (token) => ({
            Accept: 'application/json',
            'X-Plex-Token': token,
            'X-Plex-Client-Identifier': 'test',
        }),
        resolveMemberPlexToken: resolveMemberPlexToken || (async () => 'member-token'),
        fetchImpl: fetchImpl || (async (url) => {
            if (String(url).includes('/library/metadata/637418')) {
                return { ok: true, json: async () => oakStreetMeta };
            }
            throw new Error(`unexpected ${url}`);
        }),
    }));
    return app;
};

test('POST /play returns an HLS session for a 4K title with an H264 version', async () => {
    const app = createApp();
    const server = await listen(app);
    try {
        const port = server.address().port;
        const res = await fetch(`http://127.0.0.1:${port}/api/media-player/play/637418`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client: 'web',
                mediaIndex: 1,
                qualityId: '1080-12',
                canPlayHevc: false,
                canPlayAc3: false,
                canPlayNativeHls: false,
            }),
        });
        const body = await res.json();
        assert.equal(res.status, 200);
        assert.equal(body.item.ratingKey, '637418');
        assert.equal(body.item.title, 'The End of Oak Street');
        assert.equal(body.mediaIndex, 1);
        assert.equal(body.qualityId, '1080-12');
        assert.match(String(body.src), /\/api\/media-player\/hls\/637418\/master\.m3u8/);
        assert.match(String(body.src), /quality=1080-12/);
        assert.equal(JSON.stringify(body).includes('/library/parts'), false);
        assert.equal(body.versions.length, 2);
        assert.equal(body.versions[1].label, '1080p · H264 · MKV');
    } finally {
        await new Promise((resolve) => server.close(resolve));
    }
});

test('POST /play falls back to the server token when the member token cannot load metadata', async () => {
    const app = createApp({
        fetchImpl: async (url) => {
            const href = String(url);
            if (href.includes('X-Plex-Token=member-token')) {
                return { ok: false, status: 401, json: async () => ({}) };
            }
            if (href.includes('/library/metadata/637418')) {
                return { ok: true, json: async () => oakStreetMeta };
            }
            throw new Error(`unexpected ${url}`);
        },
    });
    const server = await listen(app);
    try {
        const port = server.address().port;
        const res = await fetch(`http://127.0.0.1:${port}/api/media-player/play/637418`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ client: 'web' }),
        });
        const body = await res.json();
        assert.equal(res.status, 200, body.error);
        assert.match(String(body.src), /\/api\/media-player\/hls\/637418\/master\.m3u8/);
    } finally {
        await new Promise((resolve) => server.close(resolve));
    }
});

test('GET /play starts a session without a POST body', async () => {
    const app = createApp();
    const server = await listen(app);
    try {
        const port = server.address().port;
        const res = await fetch(`http://127.0.0.1:${port}/api/media-player/play/637418?client=web&mediaIndex=1&qualityId=1080-12`);
        const body = await res.json();
        assert.equal(res.status, 200, body.error);
        assert.equal(body.mediaIndex, 1);
        assert.equal(body.qualityId, '1080-12');
        assert.match(String(body.src), /\/api\/media-player\/hls\/637418\/master\.m3u8/);
    } finally {
        await new Promise((resolve) => server.close(resolve));
    }
});

test('POST /play returns JSON when Plex metadata fails', async () => {
    const app = createApp({
        resolveMemberPlexToken: async () => null,
        fetchImpl: async () => {
            throw new Error('Plex is unreachable');
        },
    });
    const server = await listen(app);
    try {
        const port = server.address().port;
        const res = await fetch(`http://127.0.0.1:${port}/api/media-player/play/637418`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ client: 'web' }),
        });
        const body = await res.json();
        assert.equal(res.status, 500);
        assert.equal(body.error, 'Plex is unreachable');
    } finally {
        await new Promise((resolve) => server.close(resolve));
    }
});
