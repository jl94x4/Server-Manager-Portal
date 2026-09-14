import assert from 'node:assert/strict';
import test from 'node:test';
import { aggregateTitleHistory } from './titleStats.js';

test('aggregateTitleHistory rolls plays, hours, and unique users', () => {
    const out = aggregateTitleHistory([
        { user: 'Sam', userThumb: '/a', date: 1_700_000_000, duration: 3600 },
        { user: 'sam', userThumb: '/b', date: 1_700_086_400, duration: 1800 },
        { user: 'Frodo', date: 1_699_913_600, duration: 7200 },
    ]);
    assert.equal(out.stats.plays, 3);
    assert.equal(out.stats.uniqueUsers, 2);
    assert.equal(out.stats.totalSeconds, 12600);
    assert.equal(out.stats.lastWatchedAt, 1_700_086_400);
    assert.equal(out.users[0].user, 'sam');
    assert.equal(out.users[0].plays, 2);
    assert.equal(out.users[0].userThumb, '/b');
    assert.equal(out.users[1].user, 'Frodo');
    assert.ok(out.byMonth.length >= 1);
    assert.equal(out.byHour.length, 24);
    assert.deepEqual(out.byPlatform, [{ platform: 'Unknown', plays: 3 }]);
});

test('aggregateTitleHistory groups platform views and buckets the rest as Other', () => {
    const rows = [
        { user: 'A', date: 1, platform: 'tvOS', player: 'Living Room' },
        { user: 'B', date: 1, platform: 'tvOS' },
        { user: 'C', date: 1, platform: 'Android' },
        { user: 'D', date: 1, player: 'Chrome' },
        { user: 'E', date: 1, platform: 'Roku' },
        { user: 'F', date: 1, platform: 'Windows' },
        { user: 'G', date: 1, platform: 'iOS' },
        { user: 'H', date: 1, platform: 'Xbox' },
        { user: 'I', date: 1, platform: 'PlayStation' },
        { user: 'J', date: 1, platform: 'Linux' },
        { user: 'K', date: 1, platform: 'webOS' },
    ];
    const out = aggregateTitleHistory(rows);
    assert.equal(out.byPlatform[0].platform, 'tvOS');
    assert.equal(out.byPlatform[0].plays, 2);
    assert.equal(out.byPlatform.find((row) => row.platform === 'Chrome')?.plays, 1);
    assert.equal(out.byPlatform.at(-1).platform, 'Other');
    assert.equal(out.byPlatform.at(-1).plays, 2);
});

test('aggregateTitleHistory handles empty input', () => {
    const out = aggregateTitleHistory([]);
    assert.equal(out.stats.plays, 0);
    assert.equal(out.stats.uniqueUsers, 0);
    assert.equal(out.stats.lastWatchedAt, null);
    assert.deepEqual(out.users, []);
});
