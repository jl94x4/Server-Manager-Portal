import assert from 'node:assert/strict';
import test from 'node:test';
import { planScrobbles, traktScrobbleBody } from './scrobble.js';

const movie = (progress, player = 'playing') => ({
    sessionKey: '1',
    type: 'movie',
    title: 'Heat',
    progress,
    player,
    ids: { imdb: 'tt0113277' },
});

test('live watch starts once, updates every 10 percent, and stops at 80', () => {
    const first = planScrobbles({}, [movie(5)]);
    assert.deepEqual(first.actions.map((step) => step.action), ['start']);

    const held = planScrobbles(first.next, [movie(8)]);
    assert.equal(held.actions.length, 0);

    const moved = planScrobbles(held.next, [movie(16)]);
    assert.deepEqual(moved.actions.map((step) => step.action), ['start']);

    const done = planScrobbles(moved.next, [movie(82)]);
    assert.deepEqual(done.actions.map((step) => step.action), ['stop']);

    const again = planScrobbles(done.next, [movie(90)]);
    assert.equal(again.actions.length, 0);
});

test('leaving a session paused below 80 percent does not mark it watched', () => {
    const started = planScrobbles({}, [movie(20)]);
    const left = planScrobbles(started.next, []);
    assert.deepEqual(left.actions.map((step) => step.action), ['pause']);
    assert.equal(traktScrobbleBody(left.actions[0].session).movie.ids.imdb, 'tt0113277');
});

test('a session already past 80 percent is marked watched once', () => {
    const first = planScrobbles({}, [movie(91)]);
    assert.deepEqual(first.actions.map((step) => step.action), ['stop']);
    const again = planScrobbles(first.next, [movie(95)]);
    assert.equal(again.actions.length, 0);
});

test('episode scrobbles use the show id plus season and episode', () => {
    const body = traktScrobbleBody({
        type: 'episode',
        progress: 12,
        season: 2,
        episode: 4,
        showIds: { tvdb: 81189 },
    });
    assert.equal(body.episode.season, 2);
    assert.equal(body.episode.number, 4);
    assert.equal(body.show.ids.tvdb, 81189);
});
