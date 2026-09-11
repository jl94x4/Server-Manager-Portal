import assert from 'node:assert/strict';
import test from 'node:test';
import { parseTpdbUserHandle } from './tpdbUserHandle.js';

test('parseTpdbUserHandle reads TPDB user URLs', () => {
    assert.equal(
        parseTpdbUserHandle('https://theposterdb.com/user/fwlolx'),
        'fwlolx',
    );
    assert.equal(
        parseTpdbUserHandle('https://theposterdb.com/user/fwlolx?section=uploads&page=2'),
        'fwlolx',
    );
    assert.equal(parseTpdbUserHandle('@fwlolx'), 'fwlolx');
    assert.equal(parseTpdbUserHandle('fwlolx'), 'fwlolx');
});

test('parseTpdbUserHandle ignores set URLs and numeric ids', () => {
    assert.equal(parseTpdbUserHandle('https://theposterdb.com/set/362735'), null);
    assert.equal(parseTpdbUserHandle('https://theposterdb.com/poster/1'), null);
    assert.equal(parseTpdbUserHandle('362735'), null);
    assert.equal(parseTpdbUserHandle('https://mediux.pro/sets/24522'), null);
    assert.equal(parseTpdbUserHandle(''), null);
});
