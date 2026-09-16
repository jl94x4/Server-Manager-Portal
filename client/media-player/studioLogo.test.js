import assert from 'node:assert/strict';
import test from 'node:test';
import {
    matchDiscoverCompanyByName,
    pickLogoPathFromTmdbCompanies,
    resolvePlayerStudioLogo,
} from './studioLogo.js';

const networks = [
    { id: 49, name: 'HBO', logoPath: '/tuomPhY2UtuPTqqFnKMVHvSb724.png' },
    { id: 213, name: 'Netflix', logoPath: '/wwemzKWzjKYJFfCeiB57q3r4Bcm.png' },
];

const studios = [
    { id: 174, name: 'Warner Bros. Pictures', logoPath: '/ky0xOc5OrhzkZ1N6KyUxacfQsCk.png' },
    { id: 33, name: 'Universal', logoPath: '/8lvHyhjr8oUKOOy2dKXoALWKdp0.png' },
];

test('matchDiscoverCompanyByName finds HBO exactly', () => {
    const hit = matchDiscoverCompanyByName('HBO', networks);
    assert.equal(hit?.name, 'HBO');
    assert.ok(hit?.logoPath);
});

test('resolvePlayerStudioLogo prefers networks for TV titles', () => {
    const hit = resolvePlayerStudioLogo('HBO', 'show', { networks, studios });
    assert.equal(hit?.name, 'HBO');
});

test('resolvePlayerStudioLogo matches Warner Bros studio for movies', () => {
    const hit = resolvePlayerStudioLogo('Warner Bros.', 'movie', { networks, studios });
    assert.equal(hit?.name, 'Warner Bros. Pictures');
});

test('pickLogoPathFromTmdbCompanies matches by name', () => {
    assert.equal(pickLogoPathFromTmdbCompanies('HBO', [
        { name: 'HBO', logoPath: '/tuomPhY2UtuPTqqFnKMVHvSb724.png' },
        { name: 'AMC', logoPath: '/other.png' },
    ]), '/tuomPhY2UtuPTqqFnKMVHvSb724.png');
    assert.equal(pickLogoPathFromTmdbCompanies('Unknown', [
        { name: 'HBO', logoPath: '/tuomPhY2UtuPTqqFnKMVHvSb724.png' },
    ]), '');
});
