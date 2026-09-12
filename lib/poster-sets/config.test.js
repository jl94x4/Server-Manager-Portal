import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizePosterSetsConfig, warmMediaAllows } from './config.js';

test('normalizePosterSetsConfig persists library cache build scope', () => {
    const saved = normalizePosterSetsConfig({
        tpdbCacheWarmMedia: 'show',
        tpdbCacheWarmSource: 'recent',
        tpdbCacheSkipCached: false,
        tpdbCacheFollowedCreatorsOnly: true,
    });
    assert.equal(saved.tpdbCacheWarmMedia, 'show');
    assert.equal(saved.tpdbCacheWarmSource, 'recent');
    assert.equal(saved.tpdbCacheSkipCached, false);
    assert.equal(saved.tpdbCacheFollowedCreatorsOnly, true);
});

test('normalizePosterSetsConfig defaults build scope to movies + TV', () => {
    const saved = normalizePosterSetsConfig({});
    assert.equal(saved.tpdbCacheWarmMedia, 'all');
    assert.equal(saved.tpdbCacheWarmSource, 'full');
    assert.equal(saved.tpdbCacheSkipCached, true);
    assert.equal(saved.tpdbCacheFollowedCreatorsOnly, false);
});

test('normalizePosterSetsConfig maps tv/series warm media to show', () => {
    assert.equal(normalizePosterSetsConfig({ tpdbCacheWarmMedia: 'tv' }).tpdbCacheWarmMedia, 'show');
    assert.equal(normalizePosterSetsConfig({ tpdbCacheWarmMedia: 'series' }).tpdbCacheWarmMedia, 'show');
});

test('normalizePosterSetsConfig rejects unknown media filters', () => {
    const saved = normalizePosterSetsConfig({
        tpdbCacheWarmMedia: 'anime',
        tpdbCacheWarmSource: 'everything',
    });
    assert.equal(saved.tpdbCacheWarmMedia, 'all');
    assert.equal(saved.tpdbCacheWarmSource, 'full');
});

test('normalizePosterSetsConfig defaults on-add cache and first-run flags', () => {
    const saved = normalizePosterSetsConfig({});
    assert.equal(saved.tpdbCacheOnLibraryAdd, true);
    assert.equal(saved.tpdbFirstRunBackfillDone, false);
});

test('warmMediaAllows honors TV-only and movies-only scopes', () => {
    assert.equal(warmMediaAllows('show', 'movie'), false);
    assert.equal(warmMediaAllows('show', 'show'), true);
    assert.equal(warmMediaAllows('tv', 'series'), true);
    assert.equal(warmMediaAllows('movie', 'show'), false);
    assert.equal(warmMediaAllows('movie', 'movie'), true);
    assert.equal(warmMediaAllows('all', 'movie'), true);
    assert.equal(warmMediaAllows('all', 'show'), true);
});
