import assert from 'node:assert/strict';
import test from 'node:test';
import {
    isAllowedPlexProxyUrl,
    mapContinueWatchingItem,
    mapPlayerItem,
    pickPlayerTmdbId,
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

test('mapPlayerItem maps cast and crew without file paths', () => {
    const movie = mapPlayerItem({
        ratingKey: '12',
        title: 'Heat',
        type: 'movie',
        studio: 'Warner Bros.',
        tagline: 'A Los Angeles crime saga',
        Director: [{ tag: 'Michael Mann' }],
        Writer: [{ tag: 'Michael Mann' }],
        Role: [
            { id: 1, tag: 'Al Pacino', role: 'Vincent Hanna', thumb: '/library/metadata/1/thumb' },
            { id: 2, tag: 'Robert De Niro', role: 'Neil McCauley' },
        ],
        Media: [{ Part: [{ file: '/secrets/heat.mkv' }] }],
    });
    assert.equal(movie.studio, 'Warner Bros.');
    assert.equal(movie.tagline, 'A Los Angeles crime saga');
    assert.deepEqual(movie.directors, ['Michael Mann']);
    assert.equal(movie.cast[0].name, 'Al Pacino');
    assert.equal(movie.cast[0].role, 'Vincent Hanna');
    assert.equal(JSON.stringify(movie).includes('/secrets/heat.mkv'), false);
});

test('mapPlayerItem extracts TMDB ids from Plex GUIDs', () => {
    const movie = mapPlayerItem({
        ratingKey: '12',
        title: 'Heat',
        type: 'movie',
        Guid: [{ id: 'imdb://tt0113277' }, { id: 'tmdb://949' }],
    });
    assert.equal(movie.tmdbId, 949);
    const show = mapPlayerItem({
        ratingKey: '9',
        title: 'The Wire',
        type: 'show',
        guid: 'com.plexapp.agents.themoviedb://1438?lang=en',
    });
    assert.equal(show.tmdbId, 1438);
    const episode = mapPlayerItem({
        ratingKey: '44',
        title: 'The Target',
        type: 'episode',
        grandparentTitle: 'The Wire',
        grandparentGuid: 'tmdb://1438',
        Guid: [{ id: 'tmdb://62085' }],
    });
    assert.equal(episode.tmdbId, 1438);
    const season = mapPlayerItem({
        ratingKey: '8',
        title: 'Season 1',
        type: 'season',
        grandparentGuid: 'tmdb://1438',
        Guid: [{ id: 'tmdb://3572' }],
    });
    assert.equal(season.tmdbId, 1438);
    assert.equal(pickPlayerTmdbId({ type: 'movie', Guid: [{ id: 'tvdb://1' }] }), null);
    assert.equal(pickPlayerTmdbId({ type: 'movie', Guid: { id: 'tmdb://27205' } }), 27205);
});

test('mapContinueWatchingItem uses show poster and show title for episodes', () => {
    const episode = mapContinueWatchingItem({
        ratingKey: '44',
        title: 'Episode 11',
        type: 'episode',
        thumb: '/library/metadata/44/thumb',
        parentThumb: '/library/metadata/8/thumb',
        grandparentThumb: '/library/metadata/9/thumb',
        grandparentTitle: 'The Wire',
        parentTitle: 'Season 1',
    });
    assert.equal(episode.ratingKey, '44');
    assert.equal(episode.canPlay, true);
    assert.equal(episode.title, 'The Wire');
    assert.equal(episode.thumb, '/library/metadata/9/thumb');
    const seasonOnly = mapContinueWatchingItem({
        ratingKey: '45',
        title: 'Episode 8',
        type: 'episode',
        thumb: '/library/metadata/45/thumb',
        parentThumb: '/library/metadata/8/thumb',
        grandparentTitle: 'The Wire',
    });
    assert.equal(seasonOnly.thumb, '/library/metadata/8/thumb');
    const movie = mapContinueWatchingItem({
        ratingKey: '12',
        title: 'Heat',
        type: 'movie',
        thumb: '/library/metadata/12/thumb',
    });
    assert.equal(movie.title, 'Heat');
    assert.equal(movie.thumb, '/library/metadata/12/thumb');
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
