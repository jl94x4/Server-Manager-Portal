import assert from 'node:assert/strict';
import test from 'node:test';
import {
    buildMediaPlayerHomeHero,
    clearMediaPlayerHomeHeroCache,
    easterSundayUtc,
    isMediaPlayerHomeHeroEnabled,
    isSeasonalHeroInWindow,
    normalizeMediaPlayerHomeHeroMode,
    resolveEffectiveHeroMode,
} from './homeHero.js';

test('isMediaPlayerHomeHeroEnabled defaults on', () => {
    assert.equal(isMediaPlayerHomeHeroEnabled({}), true);
    assert.equal(isMediaPlayerHomeHeroEnabled({ mediaPlayerHomeHeroEnabled: true }), true);
    assert.equal(isMediaPlayerHomeHeroEnabled({ mediaPlayerHomeHeroEnabled: false }), false);
});

test('normalizeMediaPlayerHomeHeroMode reads mode and legacy enabled flag', () => {
    assert.equal(normalizeMediaPlayerHomeHeroMode({}), 'trending_week');
    assert.equal(normalizeMediaPlayerHomeHeroMode({ mediaPlayerHomeHeroEnabled: false }), 'off');
    assert.equal(
        normalizeMediaPlayerHomeHeroMode({
            mediaPlayerHomeHeroEnabled: false,
            mediaPlayerHomeHeroMode: 'seasonal_halloween',
        }),
        'seasonal_halloween',
    );
    assert.equal(normalizeMediaPlayerHomeHeroMode({ mediaPlayerHomeHeroMode: 'continue_watching' }), 'continue_watching');
    assert.equal(normalizeMediaPlayerHomeHeroMode({ mediaPlayerHomeHeroMode: 'nope' }), 'trending_week');
});

test('isSeasonalHeroInWindow covers fixed holiday ranges', () => {
    assert.equal(isSeasonalHeroInWindow('seasonal_halloween', new Date(Date.UTC(2026, 9, 15))), true);
    assert.equal(isSeasonalHeroInWindow('seasonal_halloween', new Date(Date.UTC(2026, 8, 30))), false);
    assert.equal(isSeasonalHeroInWindow('seasonal_christmas', new Date(Date.UTC(2026, 10, 20))), true);
    assert.equal(isSeasonalHeroInWindow('seasonal_christmas', new Date(Date.UTC(2026, 11, 27))), false);
    assert.equal(isSeasonalHeroInWindow('seasonal_nye', new Date(Date.UTC(2026, 11, 30))), true);
    assert.equal(isSeasonalHeroInWindow('seasonal_nye', new Date(Date.UTC(2027, 0, 2))), true);
    assert.equal(isSeasonalHeroInWindow('seasonal_nye', new Date(Date.UTC(2026, 11, 20))), false);
    assert.equal(isSeasonalHeroInWindow('seasonal_thanksgiving', new Date(Date.UTC(2026, 10, 20))), true);
    assert.equal(isSeasonalHeroInWindow('seasonal_thanksgiving', new Date(Date.UTC(2026, 10, 10))), false);
});

test('isSeasonalHeroInWindow uses Western Easter window', () => {
    const easter2026 = easterSundayUtc(2026);
    assert.equal(easter2026.toISOString().slice(0, 10), '2026-04-05');
    assert.equal(isSeasonalHeroInWindow('seasonal_easter', easter2026), true);
    assert.equal(isSeasonalHeroInWindow('seasonal_easter', new Date(easter2026.getTime() - 7 * 86400000)), true);
    assert.equal(isSeasonalHeroInWindow('seasonal_easter', new Date(easter2026.getTime() + 86400000)), true);
    assert.equal(isSeasonalHeroInWindow('seasonal_easter', new Date(easter2026.getTime() - 8 * 86400000)), false);
    assert.equal(isSeasonalHeroInWindow('seasonal_easter', new Date(easter2026.getTime() + 2 * 86400000)), false);
});

test('resolveEffectiveHeroMode falls back to trending_week outside seasonal window when limited', () => {
    const july = new Date(Date.UTC(2026, 6, 1));
    assert.equal(
        resolveEffectiveHeroMode({
            mediaPlayerHomeHeroMode: 'seasonal_halloween',
            mediaPlayerHomeHeroSeasonalInWindowOnly: true,
        }, july),
        'trending_week',
    );
    assert.equal(
        resolveEffectiveHeroMode({
            mediaPlayerHomeHeroMode: 'seasonal_halloween',
            mediaPlayerHomeHeroSeasonalInWindowOnly: false,
        }, july),
        'seasonal_halloween',
    );
    assert.equal(
        resolveEffectiveHeroMode({
            mediaPlayerHomeHeroMode: 'seasonal_halloween',
            mediaPlayerHomeHeroSeasonalInWindowOnly: true,
        }, new Date(Date.UTC(2026, 9, 20))),
        'seasonal_halloween',
    );
    assert.equal(
        resolveEffectiveHeroMode({ mediaPlayerHomeHeroMode: 'off' }, july),
        'off',
    );
});

test('buildMediaPlayerHomeHero returns disabled payload when toggled off', async () => {
    clearMediaPlayerHomeHeroCache();
    const payload = await buildMediaPlayerHomeHero({
        config: { mediaPlayerHomeHeroEnabled: false, tmdbApiKey: 'x' },
    });
    assert.equal(payload.enabled, false);
    assert.equal(payload.mode, 'off');
    assert.equal(payload.effectiveMode, 'off');
    assert.deepEqual(payload.items, []);
});

test('buildMediaPlayerHomeHero continue_watching maps viewer items and skips cache', async () => {
    clearMediaPlayerHomeHeroCache();
    const mapPlayerItem = (meta) => ({
        ratingKey: String(meta.ratingKey),
        title: meta.title,
        type: meta.type,
        year: meta.year,
        art: meta.art,
        thumb: meta.thumb,
        canPlay: true,
    });
    const first = await buildMediaPlayerHomeHero({
        config: { mediaPlayerHomeHeroMode: 'continue_watching' },
        mapPlayerItem,
        continueWatchingItems: [
            {
                ratingKey: 'cw-1',
                title: 'Almost Finished',
                type: 'movie',
                year: 2020,
                art: '/library/metadata/cw-1/art',
                summary: 'Keep going',
            },
        ],
    });
    assert.equal(first.enabled, true);
    assert.equal(first.effectiveMode, 'continue_watching');
    assert.equal(first.items.length, 1);
    assert.equal(first.items[0].ratingKey, 'cw-1');
    assert.equal(first.items[0].title, 'Almost Finished');

    const second = await buildMediaPlayerHomeHero({
        config: { mediaPlayerHomeHeroMode: 'continue_watching' },
        mapPlayerItem,
        continueWatchingItems: [
            {
                ratingKey: 'cw-2',
                title: 'Different Viewer',
                type: 'show',
                year: 2021,
                art: '/library/metadata/cw-2/art',
            },
        ],
    });
    assert.equal(second.items[0].ratingKey, 'cw-2');
    clearMediaPlayerHomeHeroCache();
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
    assert.equal(first.effectiveMode, 'trending_week');
    assert.equal(first.items.length, 2);
    assert.equal(first.items[0].title, 'Fight Club');
    assert.equal(first.items[0].ratingKey, '12');
    assert.ok(first.items[0].backdropUrl.includes('/original/fight.jpg'));
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
