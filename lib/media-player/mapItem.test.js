import assert from 'node:assert/strict';
import test from 'node:test';
import {
    actorQueryValues,
    buildPlexTimelineParams,
    clampPlayOffsetMs,
    isAllowedPlexProxyUrl,
    isPlaySessionId,
    mapContinueWatchingItem,
    mapPlayerItem,
    mapPlayerPlaybackOptions,
    pickPersonFromMetadata,
    pickPlayerTmdbId,
    rewritePlaylistUrls,
    rewritePlexUrlToOrigin,
    transcodeSettingsForQuality,
    buildPlayerHlsSrc,
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
    const season = mapPlayerItem({
        ratingKey: '8',
        title: 'Season 1',
        type: 'season',
        parentTitle: 'The Wire',
        parentRatingKey: '9',
    });
    assert.equal(season.showTitle, 'The Wire');
    assert.equal(season.seasonTitle, 'Season 1');
    assert.equal(season.parentRatingKey, '9');
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
    assert.equal(movie.cast[0].id, '1');
    assert.equal(movie.cast[0].name, 'Al Pacino');
    assert.equal(movie.cast[0].role, 'Vincent Hanna');
    assert.equal(JSON.stringify(movie).includes('/secrets/heat.mkv'), false);
});

test('playback options map quality audio and subtitles without file paths', () => {
    const meta = {
        ratingKey: '12',
        title: 'Heat',
        type: 'movie',
        Media: [{
            videoResolution: '4k',
            width: 3840,
            height: 2160,
            Part: [{
                file: '/secrets/heat.mkv',
                Stream: [
                    { id: 10, streamType: 1, height: 2160, width: 3840, codec: 'hevc' },
                    {
                        id: 20,
                        streamType: 2,
                        selected: true,
                        codec: 'eac3',
                        channels: 6,
                        language: 'English',
                        displayTitle: 'English (EAC3 5.1)',
                    },
                    { id: 21, streamType: 2, codec: 'aac', channels: 2, language: 'English', displayTitle: 'English (AAC Stereo)' },
                    { id: 30, streamType: 3, codec: 'srt', language: 'English', displayTitle: 'English (SRT)' },
                    { id: 31, streamType: 3, codec: 'srt', language: 'Spanish', displayTitle: 'Spanish (SRT)', selected: true },
                ],
            }],
        }],
    };
    const options = mapPlayerPlaybackOptions(meta);
    assert.equal(options.qualityId, '1080-12');
    assert.equal(options.qualities.some((row) => row.id === '1080-12'), true);
    assert.equal(options.qualities.some((row) => row.label.includes('4k')), false);
    assert.equal(options.audioStreamId, '20');
    assert.equal(options.audioTracks.length, 2);
    assert.equal(options.audioTracks[1].label, 'English (AAC Stereo)');
    assert.equal(options.subtitleStreamId, '31');
    assert.equal(options.subtitles[0].label, 'English (SRT)');
    assert.equal(JSON.stringify(options).includes('/secrets/heat.mkv'), false);
    const sevenTwenty = mapPlayerPlaybackOptions({
        Media: [{ height: 720, videoResolution: '720', Part: [{ Stream: [{ id: 1, streamType: 1, height: 720 }] }] }],
    });
    assert.equal(sevenTwenty.qualities.some((row) => row.id.startsWith('1080')), false);
    assert.equal(sevenTwenty.qualityId, '720-4');
    const attempts = transcodeSettingsForQuality('1080-12');
    assert.equal(attempts[0].videoResolution, '1920x1080');
    assert.equal(attempts[1].videoResolution, '1280x720');
    const src = buildPlayerHlsSrc('12', {
        sessionId: '11111111-1111-4111-8111-111111111111',
        offsetMs: 80000,
        qualityId: '720-4',
        audioStreamId: '20',
        subtitleStreamId: '30',
        resume: true,
    });
    assert.match(src, /quality=720-4/);
    assert.match(src, /audioStreamID=20/);
    assert.match(src, /subtitleStreamID=30/);
    assert.match(src, /resume=1/);
    assert.equal(buildPlayerHlsSrc('12', { qualityId: '../etc/passwd' }).includes('quality='), false);
});

test('actor filters prefer the Plex role id then the name', () => {
    assert.deepEqual(actorQueryValues('1', 'Al Pacino'), ['1', 'Al Pacino']);
    assert.deepEqual(actorQueryValues('Al Pacino', 'Al Pacino'), ['Al Pacino']);
    const person = pickPersonFromMetadata([
        {
            Role: [
                { id: 1, tag: 'Al Pacino', thumb: '/library/metadata/1/thumb' },
                { id: 2, tag: 'Robert De Niro' },
            ],
        },
    ], { actorId: '1', name: 'Al Pacino' });
    assert.equal(person.id, '1');
    assert.equal(person.name, 'Al Pacino');
    assert.equal(person.thumb, '/library/metadata/1/thumb');
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

test('rewritePlaylistUrls resolves relative session paths from the playlist URL', () => {
    const body = [
        '#EXTM3U',
        '#EXT-X-MAP:URI="session/1/init.mp4"',
        'session/1/index.m3u8',
    ].join('\n');
    const playlistUrl = 'http://192.168.1.10:32400/video/:/transcode/universal/start.m3u8';
    const out = rewritePlaylistUrls(body, 'http://192.168.1.10:32400', '/api/media-player/proxy?u=', playlistUrl);
    assert.match(out, /transcode%2Funiversal%2Fsession%2F1%2Findex\.m3u8/);
    assert.match(out, /transcode%2Funiversal%2Fsession%2F1%2Finit\.mp4/);
});

test('clampPlayOffsetMs skips tiny and near-end resumes', () => {
    assert.equal(clampPlayOffsetMs(1200, 1_500_000), 0);
    assert.equal(clampPlayOffsetMs(1_490_000, 1_500_000), 0);
    assert.equal(clampPlayOffsetMs(80_000, 1_500_000), 80_000);
});

test('buildPlexTimelineParams reports playhead to Plex', () => {
    const params = buildPlexTimelineParams({
        ratingKey: '44',
        state: 'playing',
        timeMs: 12500,
        durationMs: 1500000,
        sessionId: '11111111-1111-4111-8111-111111111111',
    });
    assert.equal(params.get('ratingKey'), '44');
    assert.equal(params.get('key'), '/library/metadata/44');
    assert.equal(params.get('state'), 'playing');
    assert.equal(params.get('time'), '12500');
    assert.equal(params.get('duration'), '1500000');
    assert.equal(params.get('X-Plex-Session-Identifier'), '11111111-1111-4111-8111-111111111111');
    assert.equal(isPlaySessionId('not-a-session'), false);
});
