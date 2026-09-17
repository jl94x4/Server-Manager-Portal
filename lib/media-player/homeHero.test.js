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

test('buildMediaPlayerHomeHero matches TMDB trending to Plex and caches', async () => {
    clearMediaPlayerHomeHeroCache();
    let tmdbHits = 0;
    let plexHits = 0;
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
        plexHits += 1;
        const href = String(url);
        if (href.includes('tmdb%3A%2F%2F550') || href.includes('tmdb://550')) {
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
    assert.equal(first.items[1].title, 'Breaking Bad');

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
    assert.ok(plexHits >= 2);
    assert.equal(cached.items.length, 2);
    clearMediaPlayerHomeHeroCache();
});
