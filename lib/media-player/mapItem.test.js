import assert from 'node:assert/strict';
import test from 'node:test';
import {
    actorQueryValues,
    buildPlexTimelineParams,
    clampPlayOffsetMs,
    isAllowedPlexProxyUrl,
    isPlaySessionId,
    mapContinueWatchingItem,
    mapPlayerExtras,
    mapPlayerHubs,
    mapPlayerItem,
    mapPlayerItemDetails,
    mapPlayerMediaInfo,
    mapPlayerPlaybackMode,
    mapPlayerPlaybackOptions,
    mapPlayerPlaylist,
    mapPlayerRatings,
    mapRecentlyAddedItem,
    pickMediaIndex,
    applyHomeRowOrder,
    applyLibraryNavOrder,
    defaultHomeRowIds,
    collapseHomeRowOrder,
    normalizeHomeRowOrder,
    normalizeLibraryNavOrder,
    normalizePlayerSettings,
    pickPlayerAudioStreamId,
    pickPlayerSubtitleStreamId,
    playerLanguageMatches,
    plexPlaylistUri,
    resolvePlayOffsetMs,
    withSelectedMedia,
    normalizePlaybackCaps,
    canHttpDirectPlay,
    nextEpisodeInList,
    previousEpisodeInList,
    pickPersonFromMetadata,
    pickPlayerTmdbId,
    rewritePlaylistUrls,
    rewritePlexUrlToOrigin,
    transcodeSettingsForQuality,
    buildPlayerFileSrc,
    buildPlayerHlsSrc,
    collectionChildItems,
    collectionChildPaths,
    safePlexLibraryPath,
    withPlexContainerParams,
} from './mapItem.js';

test('mapPlayerItem marks movies and episodes as playable', () => {
    const movie = mapPlayerItem({ ratingKey: '12', title: 'Heat', type: 'movie', year: 1995 });
    assert.equal(movie.canPlay, true);
    assert.equal(movie.year, 1995);
    const show = mapPlayerItem({ ratingKey: '9', title: 'The Wire', type: 'show' });
    assert.equal(show.canPlay, true);
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

test('recently added TV maps to the show and next-episode walks the season', () => {
    const added = mapRecentlyAddedItem({
        ratingKey: '44',
        title: 'The Target',
        type: 'episode',
        grandparentRatingKey: '9',
        grandparentTitle: 'The Wire',
        grandparentThumb: '/library/metadata/9/thumb',
    }, { type: 'show' });
    assert.equal(added.ratingKey, '9');
    assert.equal(added.title, 'The Wire');
    assert.equal(added.type, 'show');
    assert.equal(added.canPlay, true);
    const collection = mapPlayerItem({ ratingKey: '80', title: 'Neo-noir', type: 'collection', childCount: 12 });
    assert.equal(collection.canPlay, false);
    assert.equal(collection.childCount, 12);
    const next = nextEpisodeInList([
        { ratingKey: '44' },
        { ratingKey: '45' },
        { ratingKey: '46' },
    ], '44');
    assert.equal(next.ratingKey, '45');
    assert.equal(nextEpisodeInList([{ ratingKey: '46' }], '46'), null);
    assert.equal(previousEpisodeInList([
        { ratingKey: '44' },
        { ratingKey: '45' },
        { ratingKey: '46' },
    ], '46').ratingKey, '45');
    assert.equal(previousEpisodeInList([{ ratingKey: '44' }], '44'), null);
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
    assert.equal(movie.directorPeople[0].name, 'Michael Mann');
    assert.deepEqual(movie.countries, []);
    assert.equal(movie.cast[0].id, '1');
    assert.equal(movie.cast[0].name, 'Al Pacino');
    assert.equal(movie.cast[0].role, 'Vincent Hanna');
    assert.equal(JSON.stringify(movie).includes('/secrets/heat.mkv'), false);
    const detailed = mapPlayerItem({
        ratingKey: '12',
        title: 'Heat',
        type: 'movie',
        Country: [{ tag: 'United States' }],
        Collection: [{ tag: 'Crime Classics' }],
        Producer: [{ id: 9, tag: 'Art Linson' }],
        lastViewedAt: 1700000000,
        originallyAvailableAt: '1995-12-15',
    });
    assert.deepEqual(detailed.countries, ['United States']);
    assert.deepEqual(detailed.collections, ['Crime Classics']);
    assert.equal(detailed.producers[0].name, 'Art Linson');
    assert.equal(detailed.lastViewedAt, 1700000000);
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
    assert.equal(options.qualityId, 'original');
    assert.equal(options.qualities[0].id, 'original');
    assert.equal(options.qualities.some((row) => row.id === '1080-12'), true);
    assert.equal(options.qualities.some((row) => row.label.includes('4k')), false);
    assert.equal(options.audioStreamId, '20');
    assert.equal(options.audioTracks.length, 2);
    assert.equal(options.audioTracks[1].label, 'English (AAC Stereo)');
    assert.equal(options.subtitleStreamId, null);
    assert.equal(options.subtitles[0].label, 'English (SRT)');
    assert.equal(JSON.stringify(options).includes('/secrets/heat.mkv'), false);
    const forcedSubs = mapPlayerPlaybackOptions({
        Media: [{
            Part: [{
                Stream: [
                    { id: 1, streamType: 1, height: 1080, codec: 'h264' },
                    { id: 40, streamType: 3, codec: 'srt', forced: true },
                    { id: 41, streamType: 3, codec: 'srt', selected: true },
                ],
            }],
        }],
    });
    assert.equal(forcedSubs.subtitleStreamId, '40');
    const sevenTwenty = mapPlayerPlaybackOptions({
        Media: [{ height: 720, videoResolution: '720', Part: [{ Stream: [{ id: 1, streamType: 1, height: 720 }] }] }],
    });
    assert.equal(sevenTwenty.qualities.some((row) => row.id.startsWith('1080')), false);
    assert.equal(sevenTwenty.qualityId, 'original');
    const originalAttempts = transcodeSettingsForQuality('original');
    assert.equal(originalAttempts[0].directPlay, '0');
    assert.equal(originalAttempts[0].directStream, '1');
    assert.equal(originalAttempts[0].directStreamAudio, '0');
    assert.equal(originalAttempts[0].audioCodec, 'aac');
    assert.equal(originalAttempts[0].maxAudioChannels, '2');
    assert.equal(originalAttempts[0].copy, true);
    assert.equal(originalAttempts[1].directPlay, '1');
    assert.equal(originalAttempts[1].directStream, '1');
    assert.equal(originalAttempts.at(-1).directStream, '0');
    const attempts = transcodeSettingsForQuality('1080-12');
    assert.equal(attempts[0].videoResolution, '1920x1080');
    assert.equal(attempts[0].directStream, '0');
    assert.equal(attempts[0].directStreamAudio, '0');
    assert.equal(attempts[1].videoResolution, '1280x720');
    const retarget = buildPlayerHlsSrc('12', {
        sessionId: '22222222-2222-4222-8222-222222222222',
        offsetMs: 125000,
        qualityId: '720-4',
        audioStreamId: '21',
        subtitleStreamId: '31',
    });
    assert.match(retarget, /session=22222222-2222-4222-8222-222222222222/);
    assert.match(retarget, /offset=125000/);
    assert.equal(retarget.includes('11111111-1111-4111-8111-111111111111'), false);
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
    assert.match(buildPlayerHlsSrc('12', { qualityId: 'original' }), /quality=original/);
});

test('HTTP Direct Play is only offered for browser-safe MP4 files', () => {
    const mp4 = {
        Media: [{
            container: 'mp4',
            videoCodec: 'h264',
            audioCodec: 'aac',
            Part: [{
                id: 99,
                container: 'mp4',
                Stream: [
                    { streamType: 1, codec: 'h264', height: 1080 },
                    { streamType: 2, codec: 'aac', selected: true },
                ],
            }],
        }],
    };
    assert.equal(canHttpDirectPlay(mp4), true);
    assert.equal(canHttpDirectPlay(mp4, { subtitleStreamId: '31' }), false);
    assert.equal(canHttpDirectPlay({
        Media: [{
            container: 'mkv',
            videoCodec: 'h264',
            Part: [{ id: 1, container: 'mkv', Stream: [{ streamType: 1, codec: 'h264' }, { streamType: 2, codec: 'aac' }] }],
        }],
    }), false);
    assert.equal(canHttpDirectPlay({
        Media: [{
            container: 'mp4',
            videoCodec: 'hevc',
            Part: [{ id: 1, container: 'mp4', Stream: [{ streamType: 1, codec: 'hevc' }, { streamType: 2, codec: 'aac' }] }],
        }],
    }), false);
    assert.equal(canHttpDirectPlay({
        Media: [{
            container: 'mp4',
            videoCodec: 'hevc',
            Part: [{ id: 1, container: 'mp4', Stream: [{ streamType: 1, codec: 'hevc' }, { streamType: 2, codec: 'aac' }] }],
        }],
    }, { allowHevc: true }), true);
    const mkv = {
        Media: [{
            container: 'mkv',
            videoCodec: 'hevc',
            audioCodec: 'truehd',
            Part: [{
                id: 7,
                container: 'mkv',
                Stream: [
                    { streamType: 1, codec: 'hevc' },
                    { streamType: 2, codec: 'truehd', selected: true },
                    { streamType: 3, codec: 'srt', id: 40 },
                ],
            }],
        }],
    };
    assert.equal(canHttpDirectPlay(mkv), false);
    assert.equal(canHttpDirectPlay(mkv, { client: 'android', subtitleStreamId: '40' }), true);
    assert.equal(canHttpDirectPlay(mkv, { client: 'ios', canPlayHevc: false }), false);
    assert.equal(normalizePlaybackCaps({ client: 'android' }).client, 'android');
    assert.equal(normalizePlaybackCaps({ client: 'android' }).textSubtitles, true);
    assert.match(buildPlayerFileSrc('12', { client: 'android', sessionId: '11111111-1111-1111-1111-111111111111' }), /client=android/);
    assert.match(buildPlayerHlsSrc('12', { qualityId: 'original', copy: false }), /copy=0/);
    assert.equal(JSON.stringify(mp4.Media[0].Part[0]).includes('file'), false);
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

test('mapPlayerRatings maps IMDb RT popcorn and TMDB scores', () => {
    const ratings = mapPlayerRatings({
        type: 'movie',
        Guid: [{ id: 'imdb://tt0113277' }, { id: 'tmdb://949' }],
        Rating: [
            { image: 'imdb://image.rating', value: 6.3 },
            { image: 'rottentomatoes://image.rating.ripe', value: 6.5, type: 'critic' },
            { image: 'rottentomatoes://image.rating.upright', value: 6.3, type: 'audience' },
            { image: 'themoviedb://image.rating', value: 6.3 },
        ],
    });
    assert.equal(ratings.imdb.percent, 63);
    assert.equal(ratings.imdb.url, 'https://www.imdb.com/title/tt0113277/');
    assert.equal(ratings.rottenTomatoes.percent, 65);
    assert.equal(ratings.rottenTomatoes.fresh, true);
    assert.equal(ratings.popcorn.percent, 63);
    assert.equal(ratings.popcorn.fresh, true);
    assert.equal(ratings.tmdb.percent, 63);
    assert.match(ratings.tmdb.url, /themoviedb\.org\/movie\/949/);
});

test('mapPlayerItemDetails keeps filenames and never leaks filesystem paths', () => {
    const details = mapPlayerItemDetails({
        ratingKey: '12',
        title: 'Motor City',
        type: 'movie',
        Media: [{
            bitrate: 15693,
            videoResolution: '4k',
            videoCodec: 'hevc',
            videoProfile: 'main',
            width: 3840,
            height: 2160,
            container: 'mkv',
            Part: [{
                file: '/var/lib/plexmediaserver/Library/secret/4kmovies/Motor City (2026)/Motor City (2026).mkv',
                size: 12161810432,
                container: 'mkv',
                duration: 6218000,
                Stream: [
                    { streamType: 1, codec: 'hevc', profile: 'main', bitrate: 14993, width: 3840, height: 2160, bitDepth: 8 },
                    { streamType: 2, codec: 'eac3', channels: 6, language: 'English', displayTitle: 'English (EAC3 5.1)' },
                ],
            }],
        }],
    });
    assert.equal(details.canPlay, true);
    assert.equal(details.mediaInfo[0].parts[0].fileName, 'Motor City (2026).mkv');
    const json = JSON.stringify(details);
    assert.equal(json.includes('/var/lib'), false);
    assert.equal(json.includes('plexmediaserver'), false);
    assert.equal(json.includes('/secrets/'), false);
    assert.equal(json.includes('4kmovies'), false);
    const windows = mapPlayerMediaInfo({
        Media: [{ Part: [{ file: 'C:\\\\Plex\\\\Library\\\\secret\\\\Heat.mkv' }] }],
    });
    assert.equal(windows[0].parts[0].fileName, 'Heat.mkv');
    assert.equal(JSON.stringify(windows).includes('Library'), false);
});

test('collection children come from hubs, directories, and nested includeChildren', () => {
    const fromHub = collectionChildItems({
        MediaContainer: {
            Hub: [{ Metadata: [{ ratingKey: '101', title: 'Heat', type: 'movie' }] }],
        },
    }, '831577');
    assert.equal(fromHub.length, 1);
    assert.equal(fromHub[0].title, 'Heat');

    const fromDirectory = collectionChildItems({
        MediaContainer: {
            Directory: [{ ratingKey: '9', title: 'The Wire', type: 'show' }],
        },
    }, '80');
    assert.equal(fromDirectory[0].ratingKey, '9');

    const nested = collectionChildItems({
        MediaContainer: {
            Metadata: {
                ratingKey: '831577',
                title: "Valentine's Day Movies",
                type: 'collection',
                Children: {
                    Metadata: [
                        { ratingKey: '12', title: 'Heat', type: 'movie' },
                        { ratingKey: '831577', title: "Valentine's Day Movies", type: 'collection' },
                    ],
                },
            },
        },
    }, '831577');
    assert.equal(nested.length, 1);
    assert.equal(nested[0].ratingKey, '12');
});

test('collection child paths prefer the collection key and smart-filter content', () => {
    assert.equal(
        safePlexLibraryPath('server://abc/com.plexapp.plugins.library/library/sections/6/all?type=1'),
        '/library/sections/6/all?type=1',
    );
    const paths = collectionChildPaths({
        ratingKey: '831577',
        key: '/library/metadata/831577',
        content: 'server://abc/com.plexapp.plugins.library/library/sections/6/all?type=1',
        librarySectionID: 6,
        index: 12,
    }, '831577');
    assert.deepEqual(paths, [
        '/library/metadata/831577/children',
        '/library/collections/831577/children',
        '/library/sections/6/all?type=1',
        '/library/sections/6/all?collection=831577',
        '/library/sections/6/all?collection=12',
    ]);
    const qs = withPlexContainerParams('/library/sections/6/all?type=1', 'tok', { start: 0, size: 500 });
    assert.equal(qs.includes('type=1'), true);
    assert.equal(qs.includes('X-Plex-Container-Size=500'), true);
    assert.equal(qs.includes('X-Plex-Token=tok'), true);
});

test('clips and extras are playable and related hubs keep titles', () => {
    const clip = mapPlayerItem({ ratingKey: '99', title: 'Trailer', type: 'clip', extraType: 1, subtype: 'trailer' });
    assert.equal(clip.canPlay, true);
    assert.equal(clip.extraType, '1');
    assert.equal(clip.extraSubtype, 'trailer');
    const extras = mapPlayerExtras([{ ratingKey: '99', title: 'Motor City Trailer', extraType: 1, subtype: 'trailer' }]);
    assert.equal(extras[0].type, 'clip');
    assert.equal(extras[0].canPlay, true);
    const hubs = mapPlayerHubs([{
        title: 'More with Alan Ritchson',
        hubIdentifier: 'actor.more',
        Metadata: [{ ratingKey: '80', title: 'Reacher', type: 'show' }],
    }]);
    assert.equal(hubs[0].title, 'More with Alan Ritchson');
    assert.equal(hubs[0].items[0].title, 'Reacher');
});

test('markers, versions, watched, and play offset resolution', () => {
    const details = mapPlayerItemDetails({
        ratingKey: '12',
        title: 'Heat',
        type: 'movie',
        viewCount: 1,
        viewOffset: 120000,
        duration: 600000,
        Marker: [
            { type: 'intro', startTimeOffset: 8000, endTimeOffset: 72000 },
            { type: 'credits', startTimeOffset: 540000, endTimeOffset: 590000 },
        ],
        Media: [
            { id: 1, videoResolution: '4k', videoCodec: 'hevc', container: 'mkv', height: 2160, Part: [{ id: 9 }] },
            { id: 2, videoResolution: '1080', videoCodec: 'h264', container: 'mp4', height: 1080, Part: [{ id: 10 }] },
        ],
    });
    assert.equal(details.watched, true);
    assert.equal(details.markers.intro.startMs, 8000);
    assert.equal(details.markers.credits.endMs, 590000);
    assert.equal(details.versions.length, 2);
    assert.equal(details.versions[0].label.includes('4K'), true);
    assert.equal(details.versions[1].mediaIndex, 1);

    const show = mapPlayerItem({ type: 'show', leafCount: 13, viewedLeafCount: 13, viewCount: 0, ratingKey: '9', title: 'The Wire' });
    assert.equal(show.watched, true);
    const unwatchedShow = mapPlayerItem({ type: 'show', leafCount: 13, viewedLeafCount: 2, ratingKey: '9', title: 'The Wire' });
    assert.equal(unwatchedShow.watched, false);

    assert.equal(resolvePlayOffsetMs(undefined, 120000, 600000), 120000);
    assert.equal(resolvePlayOffsetMs(0, 120000, 600000), 0);
    assert.equal(resolvePlayOffsetMs(2000, 120000, 600000), 0);

    const selected = withSelectedMedia({ Media: [{ id: 1 }, { id: 2 }] }, 1);
    assert.equal(selected.Media[0].id, 2);
    assert.equal(pickMediaIndex(9, { Media: [{ id: 1 }, { id: 2 }] }), 1);
    assert.equal(mapPlayerPlaybackMode({ useDirectFile: true }), 'directPlay');
    assert.equal(mapPlayerPlaybackMode({ useDirectFile: false, copyOriginal: true, qualityId: 'original' }), 'directStream');
    assert.equal(mapPlayerPlaybackMode({ useDirectFile: false, copyOriginal: false, qualityId: 'original' }), 'transcode');

    const playlist = mapPlayerPlaylist({ ratingKey: '55', title: 'Night movies', playlistType: 'video', leafCount: 4, smart: 0 });
    assert.equal(playlist.type, 'playlist');
    assert.equal(playlist.canPlay, false);
    assert.equal(playlist.leafCount, 4);
    assert.equal(plexPlaylistUri('abc', '12'), 'server://abc/com.plexapp.plugins.library/library/metadata/12');
});

test('player settings pick audio language and subtitle mode', () => {
    const settings = normalizePlayerSettings({
        mixLibraries: 'yes',
        autoplayNext: false,
        defaultQualityId: '720-4',
        audioLanguage: 'EN',
        subtitleMode: 'always',
        autoSkipIntro: true,
        autoSkipCredits: 'true',
    });
    assert.equal(settings.mixLibraries, false);
    assert.equal(settings.autoplayNext, false);
    assert.equal(settings.defaultQualityId, '720-4');
    assert.equal(settings.audioLanguage, 'en');
    assert.equal(settings.subtitleMode, 'always');
    assert.equal(settings.autoSkipIntro, true);
    assert.equal(settings.autoSkipCredits, false);
    assert.equal(settings.showPlaylists, true);
    assert.deepEqual(settings.homeRowOrder, []);
    assert.deepEqual(settings.libraryNavOrder, []);
    assert.equal(normalizePlayerSettings({ audioLanguage: 'not-a-code' }).audioLanguage, '');
    assert.equal(normalizePlayerSettings({ showPlaylists: false }).showPlaylists, false);
    assert.deepEqual(
        normalizeHomeRowOrder(['playlists', 'libraries', 'libraries', 'recent:12', 'nope', 'recent:movie']),
        ['playlists', 'libraries', 'recent:12', 'recent:movie'],
    );
    assert.deepEqual(
        collapseHomeRowOrder(['recent:2', 'continueWatching', 'libraries', 'playlists', 'recent:1']),
        ['recents', 'continueWatching', 'playlists'],
    );
    assert.deepEqual(
        applyHomeRowOrder(defaultHomeRowIds(), ['recent:2', 'continueWatching', 'gone']),
        ['recents', 'continueWatching', 'playlists'],
    );
    assert.deepEqual(
        applyLibraryNavOrder([{ key: '1' }, { key: '2' }, { key: '3' }], ['3', '1']),
        [{ key: '3' }, { key: '1' }, { key: '2' }],
    );
    assert.deepEqual(
        normalizePlayerSettings({ homeRowOrder: ['recent:5', 'playlists', 'recent:2'] }).libraryNavOrder,
        ['5', '2'],
    );
    assert.deepEqual(
        normalizeLibraryNavOrder(['5', '5', 'no pe', 'ok_lib']),
        ['5', 'ok_lib'],
    );
    assert.equal(playerLanguageMatches('English', 'en'), true);
    assert.equal(playerLanguageMatches('eng', 'en'), true);
    assert.equal(playerLanguageMatches('es', 'en'), false);

    const audioTracks = [
        { id: '20', language: 'Japanese', languageTag: 'ja', selected: true },
        { id: '21', language: 'English', languageTag: 'en' },
    ];
    const subtitles = [
        { id: '40', language: 'English', languageTag: 'en', forced: true },
        { id: '41', language: 'English', languageTag: 'en', forced: false },
        { id: '42', language: 'Spanish', languageTag: 'es', forced: false, selected: true },
    ];
    assert.equal(pickPlayerAudioStreamId(audioTracks, 'en'), '21');
    assert.equal(pickPlayerAudioStreamId(audioTracks, ''), '20');
    assert.equal(pickPlayerSubtitleStreamId(subtitles, 'off', 'en'), null);
    assert.equal(pickPlayerSubtitleStreamId(subtitles, 'forced', 'en'), '40');
    assert.equal(pickPlayerSubtitleStreamId(subtitles, 'always', 'en'), '41');
    assert.equal(pickPlayerSubtitleStreamId(subtitles, 'always', 'es'), '42');

    const preferred = mapPlayerPlaybackOptions({
        Media: [{
            Part: [{
                Stream: [
                    { id: 1, streamType: 1, height: 1080, codec: 'h264' },
                    { id: 20, streamType: 2, selected: true, codec: 'aac', language: 'Japanese', languageTag: 'ja' },
                    { id: 21, streamType: 2, codec: 'aac', language: 'English', languageTag: 'en' },
                    { id: 40, streamType: 3, codec: 'srt', language: 'English', languageTag: 'en', forced: true },
                    { id: 41, streamType: 3, codec: 'srt', language: 'English', languageTag: 'en' },
                ],
            }],
        }],
    }, { audioLanguage: 'en', subtitleMode: 'always' });
    assert.equal(preferred.audioStreamId, '21');
    assert.equal(preferred.subtitleStreamId, '41');
});
