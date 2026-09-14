import assert from 'node:assert/strict';
import test from 'node:test';
import {
    dedupePersonCredits,
    mergeEnrichedPersonCredits,
    personCreditYear,
    splitPersonCredits,
} from './personCredits.js';

test('dedupePersonCredits keeps unique titles, prefers posters, and sorts newest first', () => {
    const out = dedupePersonCredits([
        { id: 1, mediaType: 'movie', title: 'Yesterday', releaseDate: '2019-06-28', popularity: 40 },
        { id: 1, mediaType: 'movie', title: 'Yesterday', releaseDate: '2019-06-28', posterPath: '/y.jpg', character: 'Jack' },
        { id: 2, mediaType: 'tv', name: 'EastEnders', firstAirDate: '2007-01-01', posterPath: '/e.jpg' },
        { id: 3, mediaType: 'movie', title: 'Tenet', releaseDate: '2020-08-26', posterPath: '/t.jpg' },
        { id: 4, mediaType: 'movie', title: '' },
        { mediaType: 'movie', title: 'No id' },
    ]);
    assert.deepEqual(out.map((row) => row.title || row.name), ['Tenet', 'Yesterday', 'EastEnders']);
    assert.equal(out[1].character, 'Jack');
    assert.equal(out[1].posterPath, '/y.jpg');
    assert.equal(personCreditYear(out[0]), '2020');
});

test('splitPersonCredits separates acting and crew filmography', () => {
    const out = splitPersonCredits({
        cast: [{ id: 10, mediaType: 'movie', title: 'Good Grief', releaseDate: '2023-01-01' }],
        crew: [{ id: 10, mediaType: 'movie', title: 'Good Grief', releaseDate: '2023-01-01', job: 'Producer' }],
    });
    assert.equal(out.cast.length, 1);
    assert.equal(out.crew.length, 1);
    assert.equal(out.crew[0].job, 'Producer');
});

test('mergeEnrichedPersonCredits patches availability onto matching titles', () => {
    const current = [
        { id: 1, mediaType: 'movie', title: 'Yesterday' },
        { id: 2, mediaType: 'tv', name: 'Damned' },
    ];
    const merged = mergeEnrichedPersonCredits(current, [
        { id: 2, mediaType: 'tv', name: 'Damned', mediaInfo: { status: 5 } },
    ]);
    assert.equal(merged[0].mediaInfo, undefined);
    assert.equal(merged[1].mediaInfo.status, 5);
});
