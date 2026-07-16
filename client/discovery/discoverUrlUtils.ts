import { portalUrl } from '../shared/basePath';
import type { FilterState } from './FilterDrawer';
import { normalizeWatchRegion } from './filterControls';

export const defaultMovieFilters = (): FilterState => ({
    sort: 'popularity.desc',
    genre: '',
    year: '',
    dateGte: '',
    dateLte: '',
    network: '',
    networkName: '',
    studio: '',
    studioName: '',
    minRating: '',
    voteAverageGte: '',
    voteAverageLte: '',
    voteCountGte: '',
    voteCountLte: '',
    keywords: '',
    keywordName: '',
    excludeKeywords: '',
    excludeKeywordName: '',
    language: '',
    certification: '',
    withRuntimeGte: '',
    withRuntimeLte: '',
    watchProviders: '',
    watchRegion: '',
    status: '',
});

export const defaultSeriesFilters = (): FilterState => defaultMovieFilters();

const firstParam = (params: URLSearchParams, ...keys: string[]) => {
    for (const key of keys) {
        const value = params.get(key);
        if (value) return value;
    }
    return '';
};

export const parseFiltersFromSearch = (search: string, defaults: FilterState): FilterState => {
    const params = new URLSearchParams(search);
    const year = params.get('year') || '';
    const minRating = params.get('minRating') || '';
    let dateGte = firstParam(params, 'dateGte', 'primaryReleaseDateGte', 'firstAirDateGte');
    let dateLte = firstParam(params, 'dateLte', 'primaryReleaseDateLte', 'firstAirDateLte');
    if (year && !dateGte && !dateLte) {
        dateGte = `${year}-01-01`;
        dateLte = `${year}-12-31`;
    }

    const voteAverageGte = params.get('voteAverageGte') || minRating || '';
    const voteAverageLte = params.get('voteAverageLte') || '';

    return {
        ...defaults,
        sort: params.get('sort') || defaults.sort,
        genre: params.get('genre') || '',
        year,
        dateGte,
        dateLte,
        studio: params.get('studio') || '',
        studioName: params.get('studioName') || '',
        network: params.get('network') || '',
        networkName: params.get('networkName') || '',
        minRating,
        voteAverageGte,
        voteAverageLte,
        voteCountGte: params.get('voteCountGte') || '',
        voteCountLte: params.get('voteCountLte') || '',
        keywords: params.get('keywords') || '',
        keywordName: params.get('keywordName') || '',
        excludeKeywords: params.get('excludeKeywords') || '',
        excludeKeywordName: params.get('excludeKeywordName') || '',
        language: params.get('language') || '',
        certification: params.get('certification') || '',
        withRuntimeGte: params.get('withRuntimeGte') || '',
        withRuntimeLte: params.get('withRuntimeLte') || '',
        watchProviders: params.get('watchProviders') || '',
        watchRegion: params.get('watchRegion') || '',
        status: params.get('status') || '',
    };
};

const isDefaultSort = (sort: string) => !sort || sort === 'popularity.desc';

const hasNonDefaultRuntime = (filters: FilterState) => (
    (filters.withRuntimeGte && filters.withRuntimeGte !== '0')
    || (filters.withRuntimeLte && filters.withRuntimeLte !== '400')
);

const hasNonDefaultScore = (filters: FilterState) => (
    (filters.voteAverageGte && filters.voteAverageGte !== '1' && filters.voteAverageGte !== '0')
    || (filters.voteAverageLte && filters.voteAverageLte !== '10')
    || Boolean(filters.minRating)
);

const hasNonDefaultVoteCount = (filters: FilterState) => (
    (filters.voteCountGte && filters.voteCountGte !== '0')
    || (filters.voteCountLte && filters.voteCountLte !== '1000' && filters.voteCountLte !== '5000')
);

export const hasAdvancedDiscoverFilters = (filters: FilterState, type: 'movie' | 'tv') => (
    Boolean(
        filters.genre
        || filters.year
        || filters.dateGte
        || filters.dateLte
        || filters.minRating
        || filters.keywords
        || filters.excludeKeywords
        || filters.language
        || filters.certification
        || filters.watchProviders
        || hasNonDefaultRuntime(filters)
        || hasNonDefaultScore(filters)
        || hasNonDefaultVoteCount(filters)
        || (type === 'movie' && filters.studio)
        || (type === 'tv' && (filters.network || filters.status))
        || !isDefaultSort(filters.sort),
    )
);

const writeFilterParams = (params: URLSearchParams, filters: FilterState, type: 'movie' | 'tv') => {
    if (!isDefaultSort(filters.sort)) params.set('sort', filters.sort);
    if (filters.genre) params.set('genre', filters.genre);
    if (filters.dateGte) params.set('dateGte', filters.dateGte);
    if (filters.dateLte) params.set('dateLte', filters.dateLte);
    if (filters.voteAverageGte && filters.voteAverageGte !== '1') params.set('voteAverageGte', filters.voteAverageGte);
    if (filters.voteAverageLte && filters.voteAverageLte !== '10') params.set('voteAverageLte', filters.voteAverageLte);
    if (filters.voteCountGte && filters.voteCountGte !== '0') params.set('voteCountGte', filters.voteCountGte);
    if (filters.voteCountLte && filters.voteCountLte !== '1000' && filters.voteCountLte !== '5000') {
        params.set('voteCountLte', filters.voteCountLte);
    }
    if (filters.keywords) params.set('keywords', filters.keywords);
    if (filters.keywordName) params.set('keywordName', filters.keywordName);
    if (filters.excludeKeywords) params.set('excludeKeywords', filters.excludeKeywords);
    if (filters.excludeKeywordName) params.set('excludeKeywordName', filters.excludeKeywordName);
    if (filters.language) params.set('language', filters.language);
    if (filters.certification) params.set('certification', filters.certification);
    if (filters.withRuntimeGte && filters.withRuntimeGte !== '0') params.set('withRuntimeGte', filters.withRuntimeGte);
    if (filters.withRuntimeLte && filters.withRuntimeLte !== '400') params.set('withRuntimeLte', filters.withRuntimeLte);
    if (filters.watchProviders) params.set('watchProviders', filters.watchProviders);
    if (filters.watchRegion && filters.watchProviders) params.set('watchRegion', filters.watchRegion);
    if (type === 'movie') {
        if (filters.studio) params.set('studio', filters.studio);
        if (filters.studioName) params.set('studioName', filters.studioName);
    } else {
        if (filters.network) params.set('network', filters.network);
        if (filters.networkName) params.set('networkName', filters.networkName);
        if (filters.status) params.set('status', filters.status);
    }
};

export const buildMovieFilterPath = (filters: FilterState) => {
    const onlyStudio = Boolean(filters.studio) && !hasAdvancedDiscoverFilters({ ...filters, studio: '', sort: 'popularity.desc' }, 'movie');
    if (onlyStudio && isDefaultSort(filters.sort)) {
        return `/discovery/movies/studio/${filters.studio}`;
    }

    const params = new URLSearchParams();
    writeFilterParams(params, filters, 'movie');
    const qs = params.toString();
    return qs ? `/discovery/movies?${qs}` : '/discovery/movies';
};

export const buildSeriesFilterPath = (filters: FilterState) => {
    const onlyNetwork = Boolean(filters.network) && !hasAdvancedDiscoverFilters({ ...filters, network: '', sort: 'popularity.desc' }, 'tv');
    if (onlyNetwork && isDefaultSort(filters.sort)) {
        return `/discovery/series/network/${filters.network}`;
    }

    const params = new URLSearchParams();
    writeFilterParams(params, filters, 'tv');
    const qs = params.toString();
    return qs ? `/discovery/series?${qs}` : '/discovery/series';
};

export const appendDiscoverQuery = (baseUrl: string, filters: FilterState, type: 'movie' | 'tv') => {
    let url = baseUrl;
    if (filters.genre) url += `&genre=${encodeURIComponent(filters.genre)}`;
    if (filters.keywords) url += `&keywords=${encodeURIComponent(filters.keywords)}`;
    if (filters.excludeKeywords) url += `&excludeKeywords=${encodeURIComponent(filters.excludeKeywords)}`;
    if (filters.language) url += `&language=${encodeURIComponent(filters.language)}`;
    if (filters.certification) {
        // TMDB treats `|` as OR within a certification country.
        const certification = filters.certification.replace(/,/g, '|');
        url += `&certification=${encodeURIComponent(certification)}`;
        url += '&certificationCountry=US';
    }
    if (filters.withRuntimeGte && filters.withRuntimeGte !== '0') {
        url += `&withRuntimeGte=${encodeURIComponent(filters.withRuntimeGte)}`;
    }
    if (filters.withRuntimeLte && filters.withRuntimeLte !== '400') {
        url += `&withRuntimeLte=${encodeURIComponent(filters.withRuntimeLte)}`;
    }
    if (filters.voteAverageGte && filters.voteAverageGte !== '1') {
        url += `&voteAverageGte=${encodeURIComponent(filters.voteAverageGte)}`;
    } else if (filters.minRating) {
        url += `&voteAverageGte=${encodeURIComponent(filters.minRating)}`;
    }
    if (filters.voteAverageLte && filters.voteAverageLte !== '10') {
        url += `&voteAverageLte=${encodeURIComponent(filters.voteAverageLte)}`;
    }
    if (filters.voteCountGte && filters.voteCountGte !== '0') {
        url += `&voteCountGte=${encodeURIComponent(filters.voteCountGte)}`;
    }
    if (filters.voteCountLte && filters.voteCountLte !== '1000' && filters.voteCountLte !== '5000') {
        url += `&voteCountLte=${encodeURIComponent(filters.voteCountLte)}`;
    }
    if (filters.watchProviders) {
        url += `&watchProviders=${encodeURIComponent(filters.watchProviders)}`;
        const region = normalizeWatchRegion(filters.watchRegion || 'US');
        url += `&watchRegion=${encodeURIComponent(region)}`;
    }

    const dateGte = filters.dateGte || (filters.year ? `${filters.year}-01-01` : '');
    const dateLte = filters.dateLte || (filters.year ? `${filters.year}-12-31` : '');

    if (type === 'movie') {
        if (dateGte) url += `&primaryReleaseDateGte=${encodeURIComponent(dateGte)}`;
        if (dateLte) url += `&primaryReleaseDateLte=${encodeURIComponent(dateLte)}`;
        if (filters.studio) url += `&studio=${encodeURIComponent(filters.studio)}`;
    } else {
        if (dateGte) url += `&firstAirDateGte=${encodeURIComponent(dateGte)}`;
        if (dateLte) url += `&firstAirDateLte=${encodeURIComponent(dateLte)}`;
        if (filters.network) url += `&network=${encodeURIComponent(filters.network)}`;
        if (filters.status) url += `&status=${encodeURIComponent(filters.status)}`;
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
    if (!isDefaultSort(filters.sort)) count += 1;
    if (filters.genre) count += 1;
    if (filters.dateGte || filters.dateLte || filters.year) count += 1;
    if (hasNonDefaultScore(filters)) count += 1;
    if (hasNonDefaultVoteCount(filters)) count += 1;
    if (hasNonDefaultRuntime(filters)) count += 1;
    if (filters.keywords) count += 1;
    if (filters.excludeKeywords) count += 1;
    if (filters.language) count += 1;
    if (filters.certification) count += 1;
    if (filters.watchProviders) count += 1;
    if (type === 'movie' && filters.studio) count += 1;
    if (type === 'tv' && filters.network) count += 1;
    if (type === 'tv' && filters.status) count += 1;
    return count;
};
