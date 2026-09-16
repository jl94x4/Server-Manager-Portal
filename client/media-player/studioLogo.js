/**
 * Match Plex studio/network labels to Discover / TMDB company logos.
 * Catalog lists are passed in so this stays plain JS for node:test.
 */

const normalizeCompanyName = (value = '') => String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[.+]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Match a Plex studio/network label to a Discover company logo entry. */
export const matchDiscoverCompanyByName = (name, list = []) => {
    const want = normalizeCompanyName(name);
    if (!want) return null;

    const rows = Array.isArray(list) ? list : [];
    const exact = rows.find((row) => normalizeCompanyName(row?.name) === want);
    if (exact) return exact;

    const ranked = [...rows].sort(
        (a, b) => normalizeCompanyName(b?.name).length - normalizeCompanyName(a?.name).length,
    );
    for (const row of ranked) {
        const known = normalizeCompanyName(row?.name);
        if (known.length < 2) continue;
        if (want.startsWith(`${known} `) || known.startsWith(`${want} `)) return row;
        // Avoid tiny aliases ("dc") matching inside unrelated names.
        if (known.length >= 4 && (want.includes(known) || known.includes(want))) return row;
    }
    return null;
};

/** Prefer networks for TV, studios for movies; fall back across both catalogs. */
export const resolvePlayerStudioLogo = (name, mediaType, { networks = [], studios = [] } = {}) => {
    const isMovie = String(mediaType || '').toLowerCase() === 'movie';
    const primary = isMovie ? studios : networks;
    const secondary = isMovie ? networks : studios;
    return matchDiscoverCompanyByName(name, primary) || matchDiscoverCompanyByName(name, secondary);
};

export const pickLogoPathFromTmdbCompanies = (name, companies = []) => {
    const want = normalizeCompanyName(name);
    if (!want) return '';
    const ranked = (Array.isArray(companies) ? companies : []).filter((row) => row?.logoPath && row?.name);
    const exact = ranked.find((row) => normalizeCompanyName(row.name) === want);
    if (exact?.logoPath) return String(exact.logoPath);
    const partial = ranked
        .sort((a, b) => normalizeCompanyName(b.name).length - normalizeCompanyName(a.name).length)
        .find((row) => {
            const known = normalizeCompanyName(row.name);
            if (known.length < 4) return false;
            return want.includes(known) || known.includes(want);
        });
    return partial?.logoPath ? String(partial.logoPath) : '';
};
