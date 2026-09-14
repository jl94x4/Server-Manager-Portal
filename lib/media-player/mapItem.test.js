import assert from 'node:assert/strict';
import test from 'node:test';
import {
    isAllowedPlexProxyUrl,
    mapPlayerItem,
    rewritePlaylistUrls,
    rewritePlexUrlToOrigin,
} from './mapItem.js';

test('mapPlayerItem marks movies and episodes as playable', () => {
    const movie = mapPlayerItem({ ratingKey: '12', title: 'Heat', type: 'movie', year: 1995 });
    assert.equal(movie.canPlay, true);
    assert.equal(movie.year, 1995);
    const show = mapPlayerItem({ ratingKey: '9', title: 'The Wire', type: 'show' });
    assert.equal(show.canPlay, false);
    const episode = mapPlayerItem({
        ratingKey: '44',
        title: 'The Target',
        type: 'episode',
        grandparentTitle: 'The Wire',
        parentIndex: 1,
        index: 1,
    });
    assert.equal(episode.canPlay, true);
    assert.equal(episode.showTitle, 'The Wire');
});

test('isAllowedPlexProxyUrl only allows the configured PMS origin', () => {
    const origin = 'http://192.168.1.10:32400';
    assert.equal(isAllowedPlexProxyUrl('http://192.168.1.10:32400/video/:/transcode/universal/session/1/index.m3u8', origin), true);
    assert.equal(isAllowedPlexProxyUrl('http://evil.example/steal', origin), false);
    assert.equal(isAllowedPlexProxyUrl('file:///etc/passwd', origin), false);
});

test('rewritePlaylistUrls points segments at the portal proxy and keeps PMS host', () => {
    const body = [
        '#EXTM3U',
        '#EXT-X-MAP:URI="session/1/init.mp4"',
        'http://127.0.0.1:32400/video/:/transcode/universal/session/1/seg0.ts?X-Plex-Token=secret',
    ].join('\n');
    const out = rewritePlaylistUrls(body, 'http://192.168.1.10:32400', '/api/media-player/proxy?u=');
    assert.match(out, /URI="\/api\/media-player\/proxy\?u=/);
    assert.match(out, /192\.168\.1\.10(%3A|:)32400/);
    assert.equal(out.includes('secret'), false);
    assert.equal(rewritePlexUrlToOrigin('http://127.0.0.1:32400/foo', 'http://192.168.1.10:32400'), 'http://192.168.1.10:32400/foo');
});
