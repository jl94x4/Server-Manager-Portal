import assert from 'node:assert/strict';
import test from 'node:test';
import { createTraktClient } from './trakt.js';

test('retries an empty Trakt 420 instead of failing the sync', async () => {
    const statuses = [420, 201];
    const fetchImpl = async () => {
        const status = statuses.shift();
        return new Response(status === 201 ? '{"added":{"movies":1}}' : '', {
            status,
            statusText: status === 420 ? '<none>' : 'Created',
        });
    };
    const notes = [];
    const trakt = createTraktClient({
        fetchImpl,
        minWriteGapMs: 0,
        retryDelay: () => 0,
        log: (message) => notes.push(message),
    });
    const result = await trakt.addHistory({ clientId: 'abc', accessToken: 'token' }, { movies: [{ ids: { imdb: 'tt1' } }] });
    assert.equal(result.status, 201);
    assert.equal(statuses.length, 0);
    assert.match(notes[0], /420/);
});
