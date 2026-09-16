/**
 * Match Plex studio/network labels to Discover / TMDB streaming-network logos
 * (Netflix, Disney+, Apple TV+, HBO, …). Catalog lists are passed in so this
 * stays plain JS for node:test.
 */

const STREAMING_ALIASES = {
    netflix: 'netflix',
    'netflix original': 'netflix',
    'netflix originals': 'netflix',
    disney: 'disney',
    'disney plus': 'disney',
    disneyplus: 'disney',
    'disney channel': 'disney channel',
    apple: 'apple tv',
    appletv: 'apple tv',
    'apple tv': 'apple tv',
    'apple tv plus': 'apple tv',
    'apple tv+': 'apple tv',
    prime: 'prime video',
    'prime video': 'prime video',
    amazon: 'prime video',
    'amazon prime': 'prime video',
    'amazon prime video': 'prime video',
    hulu: 'hulu',
    hbo: 'hbo',
    'hbo max': 'hbo',
    max: 'hbo',
    paramount: 'paramount',
    'paramount plus': 'paramount',
    paramountplus: 'paramount',
    peacock: 'peacock',
    'peacock premium': 'peacock',
    'peacock tv': 'peacock',
    discovery: 'discovery',
    'discovery plus': 'discovery',
    discoveryplus: 'discovery',
    showtime: 'showtime',
    starz: 'starz',
    amc: 'amc',
    amcplus: 'amc',
    'amc plus': 'amc',
};

const normalizeCompanyName = (value = '') => String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[.+]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const compactCompanyName = (value = '') => normalizeCompanyName(value).replace(/\s+/g, '');

const aliasKey = (value = '') => {
    const normalized = normalizeCompanyName(value);
    const compact = compactCompanyName(value);
    return STREAMING_ALIASES[normalized]
        || STREAMING_ALIASES[compact]
        || normalized;
};

const catalogAliasKey = (name = '') => {
    const normalized = normalizeCompanyName(name);
    const compact = compactCompanyName(name);
    // Map catalog labels onto the same alias space ("Apple TV+" → "apple tv").
    return STREAMING_ALIASES[normalized]
        || STREAMING_ALIASES[compact]
        || STREAMING_ALIASES[normalized.replace(/ plus$/, '')]
        || normalized;
};

/** Match a Plex studio/network label to a Discover company logo entry. */
export const matchDiscoverCompanyByName = (name, list = []) => {
    const want = normalizeCompanyName(name);
    if (!want) return null;
    const wantAlias = aliasKey(name);
    const wantCompact = compactCompanyName(name);

    const rows = Array.isArray(list) ? list : [];
    const exact = rows.find((row) => {
        const known = normalizeCompanyName(row?.name);
        return known === want
            || compactCompanyName(row?.name) === wantCompact
            || catalogAliasKey(row?.name) === wantAlias;
    });
    if (exact) return exact;

    const ranked = [...rows].sort(
        (a, b) => normalizeCompanyName(b?.name).length - normalizeCompanyName(a?.name).length,
    );
    for (const row of ranked) {
        const known = normalizeCompanyName(row?.name);
        const knownCompact = compactCompanyName(row?.name);
        if (known.length < 2) continue;
        if (want.startsWith(`${known} `) || known.startsWith(`${want} `)) return row;
        if (wantCompact && knownCompact && (
            wantCompact === knownCompact
            || (knownCompact.length >= 5 && wantCompact.includes(knownCompact))
            || (wantCompact.length >= 5 && knownCompact.includes(wantCompact))
        )) return row;
        // Avoid tiny aliases ("dc") matching inside unrelated names.
        if (known.length >= 4 && (want.includes(known) || known.includes(want))) return row;
    }
    return null;
};

/**
 * Prefer streaming networks (Netflix, Disney+, Apple TV+, …) over movie studios,
 * even for movies — Netflix originals are networks, not traditional studios.
 */
export const resolvePlayerStudioLogo = (name, _mediaType, { networks = [], studios = [] } = {}) => (
    matchDiscoverCompanyByName(name, networks) || matchDiscoverCompanyByName(name, studios)
);

export const pickLogoPathFromTmdbCompanies = (name, companies = []) => {
    const want = normalizeCompanyName(name);
    if (!want) return '';
    const wantAlias = aliasKey(name);
    const wantCompact = compactCompanyName(name);
    const ranked = (Array.isArray(companies) ? companies : []).filter((row) => row?.logoPath && row?.name);
    const exact = ranked.find((row) => {
        const known = normalizeCompanyName(row.name);
        return known === want
            || compactCompanyName(row.name) === wantCompact
            || catalogAliasKey(row.name) === wantAlias;
    });
    if (exact?.logoPath) return String(exact.logoPath);
    const partial = ranked
        .sort((a, b) => normalizeCompanyName(b.name).length - normalizeCompanyName(a.name).length)
        .find((row) => {
            const known = normalizeCompanyName(row.name);
            const knownCompact = compactCompanyName(row.name);
            if (catalogAliasKey(row.name) === wantAlias) return true;
            if (knownCompact.length >= 5 && (wantCompact.includes(knownCompact) || knownCompact.includes(wantCompact))) {
                return true;
            }
            if (known.length < 4) return false;
            return want.includes(known) || known.includes(want);
        });
    return partial?.logoPath ? String(partial.logoPath) : '';
};

/**
 * Build clickable streaming-network logo rows from Plex + TMDB networks.
 * Prefers Netflix / Disney+ / Apple TV+ style networks over generic studios.
 */
export const buildStreamingNetworkLogos = ({
    plexName = '',
    mediaType = '',
    networks = [],
    studios = [],
    tmdbNetworks = [],
} = {}) => {
    const out = [];
    const seen = new Set();
    const add = (name, logoPath, key) => {
        const label = String(name || '').trim();
        if (!label) return;
        const id = String(key || catalogAliasKey(label) || label).toLowerCase();
        if (seen.has(id)) return;
        seen.add(id);
        out.push({
            name: label,
            logoPath: logoPath ? String(logoPath) : '',
            key: String(key || label),
        });
    };

    for (const row of Array.isArray(tmdbNetworks) ? tmdbNetworks : []) {
        const name = String(row?.name || '').trim();
        if (!name) continue;
        const catalog = resolvePlayerStudioLogo(name, mediaType, { networks, studios });
        add(name, row.logoPath || catalog?.logoPath || '', row.id || catalog?.id || name);
    }

    const plex = String(plexName || '').trim();
    if (plex) {
        const catalog = resolvePlayerStudioLogo(plex, mediaType, { networks, studios });
        add(plex, catalog?.logoPath || '', catalog?.id || plex);
    }

    return out;
};

/** TMDB flatrate providers for a region (Netflix, Disney+, Apple TV+, …). */
export const pickWatchProvidersForRegion = (watchProviders = [], region = 'US') => {
    const want = String(region || 'US').trim().toUpperCase() || 'US';
    const rows = Array.isArray(watchProviders) ? watchProviders : [];
    const hit = rows.find((row) => String(row?.iso_3166_1 || '').toUpperCase() === want)
        || rows.find((row) => String(row?.iso_3166_1 || '').toUpperCase() === 'US')
        || rows[0]
        || null;
    const providers = [].concat(hit?.flatrate || []);
    const out = [];
    const seen = new Set();
    for (const row of providers) {
        const name = String(row?.name || '').trim();
        const logoPath = String(row?.logoPath || '').trim();
        const id = String(row?.id || name).trim();
        if (!name || !logoPath) continue;
        // Collapse Peacock / Peacock Premium / etc. into one brand.
        const key = aliasKey(name) || id.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ name, logoPath, key: id });
    }
    return out;
};

/**
 * Studio/network first, then streaming providers — one row under Studio.
 * Prefer Discover catalog wordmarks over TMDB's tiny square provider icons.
 */
export const mergeStudioAndStreamingLogos = (
    studioLogos = [],
    streamingProviders = [],
    { networks = [], studios = [], mediaType = '' } = {},
) => {
    const out = [];
    const seen = new Set();
    const add = (name, logoPath, key, { requireCatalogLogo = false } = {}) => {
        const label = String(name || '').trim();
        if (!label) return;
        const catalog = resolvePlayerStudioLogo(label, mediaType, { networks, studios });
        if (requireCatalogLogo && !catalog?.logoPath) return;
        const resolvedLogo = catalog?.logoPath || (logoPath ? String(logoPath) : '') || '';
        const id = aliasKey(catalog?.name || label) || String(key || label).toLowerCase();
        if (seen.has(id)) return;
        seen.add(id);
        out.push({
            name: catalog?.name || label,
            // Catalog logos are horizontal white wordmarks; TMDB flatrate icons are tiny squares.
            logoPath: requireCatalogLogo ? String(catalog.logoPath) : resolvedLogo,
            key: String(catalog?.id || key || label),
        });
    };

    for (const row of Array.isArray(studioLogos) ? studioLogos : []) {
        add(row?.name, row?.logoPath, row?.key);
    }
    for (const row of Array.isArray(streamingProviders) ? streamingProviders : []) {
        // Only catalog wordmarks for streamers — raw TMDB provider badges look awful.
        add(row?.name, row?.logoPath, row?.key, { requireCatalogLogo: true });
    }
    return out;
};
