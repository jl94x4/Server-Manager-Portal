/** Scroll the portal main view back to the top after in-app discovery navigation. */
export const scrollPortalToTop = () => {
    if (typeof window === 'undefined') return;
    window.scrollTo(0, 0);
    const container = document.getElementById('main-scroll-container');
    if (container) container.scrollTop = 0;
};

const DISCOVER_DETAIL_SEED_KEY = 'discover:detailSeed';

/** Stash a lightweight TMDB row so MediaDetailsPage can paint before the proxy returns. */
export const stashDiscoverDetailSeed = (item: any) => {
    if (typeof sessionStorage === 'undefined' || !item) return;
    try {
        const mediaType = item?.type === 'tv' || item?.mediaType === 'tv' ? 'tv' : 'movie';
        const id = Number(item?.id ?? item?.tmdbId);
        if (!Number.isFinite(id) || id <= 0) return;
        const title = item.title || item.name || '';
        sessionStorage.setItem(DISCOVER_DETAIL_SEED_KEY, JSON.stringify({
            id,
            tmdbId: id,
            mediaType,
            title: mediaType === 'movie' ? title : undefined,
            name: mediaType === 'tv' ? title : undefined,
            posterPath: item.posterPath || null,
            backdropPath: item.backdropPath || null,
            overview: item.overview || '',
            releaseDate: item.releaseDate || null,
            firstAirDate: item.firstAirDate || null,
            voteAverage: item.voteAverage,
            mediaInfo: item.mediaInfo || null,
            _seed: true,
        }));
    } catch {
        // ignore quota / private mode
    }
};

/** Read a seed that matches the current detail route; otherwise null. */
export const readDiscoverDetailSeed = (mediaType: string, mediaId: number) => {
    if (typeof sessionStorage === 'undefined') return null;
    try {
        const raw = sessionStorage.getItem(DISCOVER_DETAIL_SEED_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        const type = parsed?.mediaType === 'tv' ? 'tv' : 'movie';
        const id = Number(parsed?.id ?? parsed?.tmdbId);
        if (type !== mediaType || id !== Number(mediaId)) return null;
        return parsed;
    } catch {
        return null;
    }
};
