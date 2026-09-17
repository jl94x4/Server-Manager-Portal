import assert from 'node:assert/strict';
import test from 'node:test';
import {
    buildMediaPlayerHomeHero,
    clearMediaPlayerHomeHeroCache,
    isMediaPlayerHomeHeroEnabled,
} from './homeHero.js';

test('isMediaPlayerHomeHeroEnabled defaults on', () => {
    assert.equal(isMediaPlayerHomeHeroEnabled({}), true);
    assert.equal(isMediaPlayerHomeHeroEnabled({ mediaPlayerHomeHeroEnabled: true }), true);
    assert.equal(isMediaPlayerHomeHeroEnabled({ mediaPlayerHomeHeroEnabled: false }), false);
});

test('buildMediaPlayerHomeHero returns disabled payload when toggled off', async () => {
    clearMediaPlayerHomeHeroCache();
    const payload = await buildMediaPlayerHomeHero({
        config: { mediaPlayerHomeHeroEnabled: false, tmdbApiKey: 'x' },
    });
    assert.equal(payload.enabled, false);
    assert.deepEqual(payload.items, []);
});

test('buildMediaPlayerHomeHero matches TMDB trending via GUID and caches', async () => {
    clearMediaPlayerHomeHeroCache();
    let tmdbHits = 0;
    const fetchImpl = async (url) => {
        const href = String(url);
        if (href.includes('api.themoviedb.org')) {
            tmdbHits += 1;
            return {
                ok: true,
                json: async () => ({
                    results: [
                        {
                            id: 550,
                            media_type: 'movie',
                            title: 'Fight Club',
                            overview: 'Soap',
                            backdrop_path: '/fight.jpg',
                            poster_path: '/fight-poster.jpg',
                            release_date: '1999-10-15',
                        },
                        {
                            id: 1396,
                            media_type: 'tv',
                            name: 'Breaking Bad',
                            overview: 'Chemistry',
                            backdrop_path: '/bb.jpg',
                            first_air_date: '2008-01-20',
                        },
                    ],
                }),
            };
        }
        throw new Error(`unexpected ${href}`);
    };
    const plexJson = async (_fetch, url) => {
        const href = String(url);
        if (href.includes('/library/sections?')) {
            return {
                MediaContainer: {
                    Directory: [
                        { key: '1', type: 'movie', title: 'Movies' },
                        { key: '2', type: 'show', title: 'TV' },
                    ],
                },
            };
        }
        if (href.includes('tmdb%3A%2F%2F550') || href.includes('guid=tmdb')) {
            if (href.includes('550')) {
                return {
                    MediaContainer: {
                        Metadata: [{
                            ratingKey: '12',
                            title: 'Fight Club',
                            type: 'movie',
                            year: 1999,
                            Guid: [{ id: 'tmdb://550' }],
                        }],
                    },
                };
            }
        }
        if (href.includes('1396')) {
            return {
                MediaContainer: {
                    Metadata: [{
                        ratingKey: '44',
                        title: 'Breaking Bad',
                        type: 'show',
                        year: 2008,
                        Guid: [{ id: 'tmdb://1396' }],
                    }],
                },
            };
        }
        return { MediaContainer: { Metadata: [] } };
    };
    const mapPlayerItem = (meta) => ({
        ratingKey: String(meta.ratingKey),
        title: meta.title,
        type: meta.type,
        year: meta.year,
        logo: `/library/metadata/${meta.ratingKey}/clearLogo`,
        canPlay: true,
    });

    const first = await buildMediaPlayerHomeHero({
        config: {
            mediaPlayerHomeHeroEnabled: true,
            tmdbApiKey: 'test-key',
            serverIdentifier: 'server-1',
        },
        uri: 'http://plex.local',
        token: 'tok',
        headers: {},
        fetchImpl,
        plexJson,
        mapPlayerItem,
    });
    assert.equal(first.enabled, true);
    assert.equal(first.items.length, 2);
    assert.equal(first.items[0].title, 'Fight Club');
    assert.equal(first.items[0].ratingKey, '12');
    assert.ok(first.items[0].backdropUrl.includes('fight.jpg'));
    assert.equal(first.items[0].logo, '/library/metadata/12/clearLogo');
    assert.equal(first.items[1].title, 'Breaking Bad');
    assert.equal(first.reason, 'ok');

    const cached = await buildMediaPlayerHomeHero({
        config: {
            mediaPlayerHomeHeroEnabled: true,
            tmdbApiKey: 'test-key',
            serverIdentifier: 'server-1',
        },
        uri: 'http://plex.local',
        token: 'tok',
        headers: {},
        fetchImpl,
        plexJson,
        mapPlayerItem,
    });
    assert.equal(tmdbHits, 1);
    assert.equal(cached.items.length, 2);
    clearMediaPlayerHomeHeroCache();
});

test('buildMediaPlayerHomeHero falls back to Plex title search', async () => {
    clearMediaPlayerHomeHeroCache();
    const fetchImpl = async (url) => {
        if (String(url).includes('api.themoviedb.org')) {
            return {
                ok: true,
                json: async () => ({
                    results: [{
                        id: 27205,
                        media_type: 'movie',
                        title: 'Inception',
                        overview: 'Dreams',
                        backdrop_path: '/inception.jpg',
                        release_date: '2010-07-16',
                    }],
                }),
            };
        }
        throw new Error(`unexpected ${url}`);
    };
    const plexJson = async (_fetch, url) => {
        const href = String(url);
        if (href.includes('/library/sections?')) {
            return { MediaContainer: { Directory: [{ key: '1', type: 'movie' }] } };
        }
        if (href.includes('/hubs/search')) {
            return {
                MediaContainer: {
                    Hub: [{
                        Metadata: [{
                            ratingKey: '99',
                            title: 'Inception',
                            type: 'movie',
                            year: 2010,
                            Guid: [{ id: 'imdb://tt1375666' }],
                        }],
                    }],
                },
            };
        }
        return { MediaContainer: { Metadata: [] } };
    };
    const payload = await buildMediaPlayerHomeHero({
        config: { tmdbApiKey: 'key', serverIdentifier: 's2' },
        uri: 'http://plex.local',
        token: 'tok',
        headers: {},
        fetchImpl,
        plexJson,
        mapPlayerItem: (meta) => ({
            ratingKey: String(meta.ratingKey),
            title: meta.title,
            type: meta.type,
            year: meta.year,
            canPlay: true,
        }),
    });
    assert.equal(payload.items.length, 1);
    assert.equal(payload.items[0].ratingKey, '99');
    clearMediaPlayerHomeHeroCache();
});
