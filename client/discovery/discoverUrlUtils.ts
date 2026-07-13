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

export const buildMovieFilterPath = (filters: FilterState) => {
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
    if (filters.genre) url += `&genre=${filters.genre}`;
    if (filters.minRating) url += `&voteAverageGte=${filters.minRating}`;
    if (type === 'movie') {
        if (filters.year) url += `&primaryReleaseYear=${filters.year}`;
        if (filters.studio) url += `&studio=${filters.studio}`;
    } else {
        if (filters.year) url += `&firstAirDateYear=${filters.year}`;
        if (filters.network) url += `&network=${filters.network}`;
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
