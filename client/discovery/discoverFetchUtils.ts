import { apiFetch } from '../shared/api';
import type { FilterState } from './FilterDrawer';
import { appendDiscoverQuery } from './discoverUrlUtils';
import { filterHiddenAvailableItems } from './useDiscoveryPreferences';
import type { DiscoverPagePayload } from './useDiscoverInfiniteScroll';

const MAX_BACKFILL_PAGES = 15;

export const buildDiscoverStudioApiUrl = (page: number, studioId: number | string, sort = 'popularity.desc') =>
    `/api/discovery/proxy/discover/movies/studio/${studioId}?page=${page}&sortBy=${encodeURIComponent(sort)}`;

export const buildDiscoverNetworkApiUrl = (page: number, networkId: number | string, sort = 'popularity.desc') =>
    `/api/discovery/proxy/discover/tv/network/${networkId}?page=${page}&sortBy=${encodeURIComponent(sort)}`;

export const buildDiscoverMoviesApiUrl = (page: number, filters: FilterState): string => {
    const sort = filters.sort || 'popularity.desc';
    const hasSecondaryFilters = Boolean(filters.year || filters.minRating);

    if (filters.studio && !filters.genre && !filters.keywords && !hasSecondaryFilters) {
        return buildDiscoverStudioApiUrl(page, filters.studio, sort);
    }

    if (filters.genre && !filters.studio && !filters.keywords && !hasSecondaryFilters) {
        return `/api/discovery/proxy/discover/movies/genre/${filters.genre}?page=${page}&sortBy=${encodeURIComponent(sort)}`;
    }

    let url = `/api/discovery/proxy/discover/movies?page=${page}&sortBy=${encodeURIComponent(sort)}`;
    return appendDiscoverQuery(url, filters, 'movie');
};

export const buildDiscoverSeriesApiUrl = (page: number, filters: FilterState): string => {
    const sort = filters.sort || 'popularity.desc';
    const hasSecondaryFilters = Boolean(filters.year || filters.minRating);

    if (filters.keywords && !filters.genre && !filters.network && !hasSecondaryFilters) {
        return `/api/discovery/proxy/discover/tv?keywords=${encodeURIComponent(filters.keywords)}&page=${page}&sortBy=${encodeURIComponent(sort)}`;
    }

    if (filters.network && !filters.genre && !filters.keywords && !hasSecondaryFilters) {
        return buildDiscoverNetworkApiUrl(page, filters.network, sort);
    }

    if (filters.genre && !filters.network && !filters.keywords && !hasSecondaryFilters) {
        return `/api/discovery/proxy/discover/tv/genre/${filters.genre}?page=${page}&sortBy=${encodeURIComponent(sort)}`;
    }

    let url = `/api/discovery/proxy/discover/tv?page=${page}&sortBy=${encodeURIComponent(sort)}`;
    return appendDiscoverQuery(url, filters, 'tv');
};

export async function fetchDiscoverPage(
    url: string,
    hideAvailable: boolean,
): Promise<DiscoverPagePayload> {
    const res = await apiFetch(url);
    return {
        results: filterHiddenAvailableItems(res?.results || [], hideAvailable),
        totalPages: Math.max(1, Number(res?.totalPages) || 1),
    };
}

/** Fetch enough items for a discover home carousel row. */
export async function fetchDiscoverHomeRowResults(
    buildUrl: (page: number) => string,
    hideAvailable: boolean,
    options: { minItems?: number; maxPages?: number } = {},
): Promise<any[]> {
    const minItems = options.minItems ?? 10;
    const maxPages = options.maxPages ?? 8;

    if (!hideAvailable) {
        const res = await apiFetch(buildUrl(1));
        return Array.isArray(res?.results) ? res.results : [];
    }

    let merged: any[] = [];
    for (let page = 1; page <= maxPages; page += 1) {
        const res = await apiFetch(buildUrl(page));
        const totalPages = Math.max(1, Number(res?.totalPages) || 1);
        const batch = filterHiddenAvailableItems(res?.results || [], true);
        merged = [...merged, ...batch];
        if (merged.length >= minItems || page >= totalPages) break;
    }

    return merged.slice(0, 20);
}

/** Keep fetching pages when hide-available filtering empties early pages. */
export async function fetchDiscoverPageWithBackfill(
    buildUrl: (page: number) => string,
    page: number,
    hideAvailable: boolean,
): Promise<DiscoverPagePayload & { lastFetchedPage: number }> {
    if (!hideAvailable) {
        const payload = await fetchDiscoverPage(buildUrl(page), hideAvailable);
        return { ...payload, lastFetchedPage: page };
    }

    let merged: any[] = [];
    let totalPages = 1;
    let currentPage = page;
    const maxPage = page + MAX_BACKFILL_PAGES - 1;

    while (currentPage <= maxPage) {
        const payload = await fetchDiscoverPage(buildUrl(currentPage), hideAvailable);
        totalPages = payload.totalPages;
        merged = [...merged, ...payload.results];

        if (merged.length > 0 || currentPage >= totalPages) {
            return {
                results: merged,
                totalPages,
                lastFetchedPage: currentPage,
            };
        }

        currentPage += 1;
    }

    const lastFetchedPage = Math.max(page, currentPage - 1);
    return {
        results: merged,
        // Stop infinite scroll when hide-available backfill finds nothing.
        totalPages: merged.length > 0 ? totalPages : lastFetchedPage,
        lastFetchedPage,
    };
}
