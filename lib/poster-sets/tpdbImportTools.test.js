import assert from 'node:assert/strict';
import test from 'node:test';
import {
    buildTpdbImportBookmarklet,
    buildTpdbImportUserscript,
    extractTpdbSetUrl,
    posterSetsImportHash,
    posterSetsImportHref,
} from './tpdbImportTools.js';

test('extractTpdbSetUrl canonicalizes set and poster URLs', () => {
    assert.equal(extractTpdbSetUrl('https://theposterdb.com/set/362735'), 'https://theposterdb.com/set/362735');
    assert.equal(extractTpdbSetUrl('https://www.theposterdb.com/poster/set/362735?foo=1'), 'https://theposterdb.com/set/362735');
    assert.equal(extractTpdbSetUrl('https://theposterdb.com/poster/99'), 'https://theposterdb.com/poster/99');
    assert.equal(extractTpdbSetUrl('https://theposterdb.com/user/n3rdplum'), null);
    assert.equal(extractTpdbSetUrl('https://theposterdb.com/recent'), null);
    assert.equal(extractTpdbSetUrl('https://mediux.pro/sets/1'), null);
});

test('posterSetsImportHref opens discover with apply action', () => {
    const href = posterSetsImportHref('https://portal.example.com', 'https://theposterdb.com/set/1');
    assert.equal(href, 'https://portal.example.com/poster-sets#discover?url=https%3A%2F%2Ftheposterdb.com%2Fset%2F1&action=apply');
    assert.equal(posterSetsImportHash('https://theposterdb.com/set/1', { apply: false }), '#discover?url=https%3A%2F%2Ftheposterdb.com%2Fset%2F1');
});

test('bookmarklet and userscript bake the portal origin', () => {
    const root = 'https://portal.example.com/smp';
    const bookmarklet = buildTpdbImportBookmarklet(root);
    assert.match(bookmarklet, /^javascript:/);
    assert.match(bookmarklet, /portal\.example\.com\/smp/);
    assert.match(bookmarklet, /action=apply/);

    const script = buildTpdbImportUserscript({
        portalRoot: root,
        scriptUrl: `${root}/api/poster-sets/tpdb-import.user.js`,
    });
    assert.match(script, /@match\s+https:\/\/theposterdb\.com\/\*/);
    assert.match(script, /https:\/\/portal\.example\.com\/smp/);
    assert.match(script, /Import to Poster Sets/);
    assert.match(script, /@downloadURL\s+https:\/\/portal\.example\.com\/smp\/api\/poster-sets\/tpdb-import\.user\.js/);
});
