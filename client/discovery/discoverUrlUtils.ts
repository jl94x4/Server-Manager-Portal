import { portalUrl } from '../shared/basePath';
import type { FilterState } from './FilterDrawer';

export const defaultMovieFilters = (): FilterState => ({
    sort: 'popularity.desc',
    genre: '',
    year: '',
    network: '',
    studio: '',
    minRating: '',
});

export const defaultSeriesFilters = (): FilterState => ({
    sort: 'popularity.desc',
    genre: '',
    year: '',
    network: '',
    studio: '',
    minRating: '',
});

export const parseFiltersFromSearch = (search: string, defaults: FilterState): FilterState => {
    const params = new URLSearchParams(search);
    return {
        ...defaults,
        sort: params.get('sort') || defaults.sort,
        genre: params.get('genre') || '',
        year: params.get('year') || '',
        studio: params.get('studio') || '',
        network: params.get('network') || '',
        minRating: params.get('minRating') || '',
    };
};

const hasSecondaryMovieFilters = (filters: FilterState) => (
    Boolean(filters.genre || filters.year || filters.minRating || (filters.sort && filters.sort !== 'popularity.desc'))
);

const hasSecondarySeriesFilters = (filters: FilterState) => (
    Boolean(filters.genre || filters.year || filters.minRating || (filters.sort && filters.sort !== 'popularity.desc'))
);

export const buildMovieFilterPath = (filters: FilterState) => {
    if (filters.studio && !hasSecondaryMovieFilters(filters)) {
        return `/discovery/movies/studio/${filters.studio}`;
    }

    const params = new URLSearchParams();
    if (filters.sort && filters.sort !== 'popularity.desc') params.set('sort', filters.sort);
    if (filters.genre) params.set('genre', filters.genre);
    if (filters.year) params.set('year', filters.year);
    if (filters.studio) params.set('studio', filters.studio);
    if (filters.minRating) params.set('minRating', filters.minRating);
    const qs = params.toString();
    return qs ? `/discovery/movies?${qs}` : '/discovery/movies';
};

export const buildSeriesFilterPath = (filters: FilterState) => {
    if (filters.network && !hasSecondarySeriesFilters(filters)) {
        return `/discovery/series/network/${filters.network}`;
    }

    const params = new URLSearchParams();
    if (filters.sort && filters.sort !== 'popularity.desc') params.set('sort', filters.sort);
    if (filters.genre) params.set('genre', filters.genre);
    if (filters.year) params.set('year', filters.year);
    if (filters.network) params.set('network', filters.network);
    if (filters.minRating) params.set('minRating', filters.minRating);
    const qs = params.toString();
    return qs ? `/discovery/series?${qs}` : '/discovery/series';
};

export const appendDiscoverQuery = (baseUrl: string, filters: FilterState, type: 'movie' | 'tv') => {
    let url = baseUrl;
    if (filters.genre) url += `&genre=${encodeURIComponent(filters.genre)}`;
    if (filters.minRating) url += `&voteAverageGte=${encodeURIComponent(filters.minRating)}`;
    if (type === 'movie') {
        if (filters.year) {
            url += `&primaryReleaseDateGte=${encodeURIComponent(`${filters.year}-01-01`)}`;
            url += `&primaryReleaseDateLte=${encodeURIComponent(`${filters.year}-12-31`)}`;
        }
        if (filters.studio) url += `&studio=${encodeURIComponent(filters.studio)}`;
    } else {
        if (filters.year) {
            url += `&firstAirDateGte=${encodeURIComponent(`${filters.year}-01-01`)}`;
            url += `&firstAirDateLte=${encodeURIComponent(`${filters.year}-12-31`)}`;
        }
        if (filters.network) url += `&network=${encodeURIComponent(filters.network)}`;
    }
    return url;
};

export const syncDiscoverUrl = (path: string) => {
    const next = portalUrl(path);
    if (`${window.location.pathname}${window.location.search}` !== next) {
        window.history.replaceState({}, '', next);
    }
};

export const countActiveFilters = (filters: FilterState, type: 'movie' | 'tv'): number => {
    let count = 0;
    if (filters.sort !== 'popularity.desc') count += 1;
    if (filters.genre) count += 1;
    if (filters.year) count += 1;
    if (filters.minRating) count += 1;
    if (type === 'movie' && filters.studio) count += 1;
    if (type === 'tv' && filters.network) count += 1;
    return count;
};
