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
});

test('aggregateTitleHistory handles empty input', () => {
    const out = aggregateTitleHistory([]);
    assert.equal(out.stats.plays, 0);
    assert.equal(out.stats.uniqueUsers, 0);
    assert.equal(out.stats.lastWatchedAt, null);
    assert.deepEqual(out.users, []);
});
