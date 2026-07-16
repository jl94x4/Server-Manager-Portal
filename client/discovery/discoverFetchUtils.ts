import { apiFetch } from '../shared/api';
import type { FilterState } from './FilterDrawer';
import { appendDiscoverQuery } from './discoverUrlUtils';
import { filterDiscoverBrowseItems } from './discoverAvailability';
import { dedupeDiscoverResults } from './discoverItemUtils';
import type { DiscoverPagePayload } from './useDiscoverInfiniteScroll';

/** Pages to scan per backfill window when hide-available / hide-requested empties results. */
const MAX_BACKFILL_PAGES = 25;

type DiscoverBrowseFilterOptions = {
    hideAvailable?: boolean;
    hideRequested?: boolean;
};

const needsDiscoverBackfill = (options: DiscoverBrowseFilterOptions) => (
    !!options.hideAvailable || !!options.hideRequested
);

export const buildDiscoverStudioApiUrl = (page: number, studioId: number | string, sort = 'popularity.desc') =>
    `/api/discovery/proxy/discover/movies/studio/${studioId}?page=${page}&sortBy=${encodeURIComponent(sort)}`;

export const buildDiscoverNetworkApiUrl = (page: number, networkId: number | string, sort = 'popularity.desc') =>
    `/api/discovery/proxy/discover/tv/network/${networkId}?page=${page}&sortBy=${encodeURIComponent(sort)}`;

export const buildDiscoverMoviesApiUrl = (page: number, filters: FilterState): string => {
    const sort = filters.sort || 'popularity.desc';
    const hasSecondaryFilters = Boolean(filters.year || filters.minRating);

    // Studio-only path (category page uses the same + query fallback).
    if (filters.studio && !filters.genre && !filters.keywords && !hasSecondaryFilters) {
        return buildDiscoverStudioApiUrl(page, filters.studio, sort);
    }

    // Always use the general discover endpoint with genre as a query param.
    // The dedicated /movies/genre/:id route is less reliable with sortBy / language
    // prefs and previously left genre chips returning empty grids.
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

    let url = `/api/discovery/proxy/discover/tv?page=${page}&sortBy=${encodeURIComponent(sort)}`;
    return appendDiscoverQuery(url, filters, 'tv');
};

export async function fetchDiscoverPage(
    url: string,
    options: DiscoverBrowseFilterOptions = {},
): Promise<DiscoverPagePayload> {
    const res = await apiFetch(url);
    return {
        results: dedupeDiscoverResults(filterDiscoverBrowseItems(res?.results || [], options)),
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
    const filterOptions = { hideAvailable };

    if (!hideAvailable) {
        const res = await apiFetch(buildUrl(1));
        return Array.isArray(res?.results) ? res.results : [];
    }

    let merged: any[] = [];
    for (let page = 1; page <= maxPages; page += 1) {
        const res = await apiFetch(buildUrl(page));
        const totalPages = Math.max(1, Number(res?.totalPages) || 1);
        const batch = filterDiscoverBrowseItems(res?.results || [], filterOptions);
        merged = dedupeDiscoverResults([...merged, ...batch]);
        if (merged.length >= minItems || page >= totalPages) break;
    }

    return merged.slice(0, 20);
}

/** Keep fetching pages when browse filtering empties early pages. */
export async function fetchDiscoverPageWithBackfill(
    buildUrl: (page: number) => string,
    page: number,
    options: DiscoverBrowseFilterOptions = {},
): Promise<DiscoverPagePayload & { lastFetchedPage: number }> {
    if (!needsDiscoverBackfill(options)) {
        const payload = await fetchDiscoverPage(buildUrl(page), options);
        return { ...payload, lastFetchedPage: page };
    }

    let merged: any[] = [];
    let totalPages = 1;
    let currentPage = page;
    const maxPage = page + MAX_BACKFILL_PAGES - 1;

    while (currentPage <= maxPage) {
        const payload = await fetchDiscoverPage(buildUrl(currentPage), options);
        totalPages = payload.totalPages;
        merged = dedupeDiscoverResults([...merged, ...payload.results]);

        if (merged.length > 0 || currentPage >= totalPages) {
            return {
                results: merged,
                totalPages,
                lastFetchedPage: currentPage,
            };
        }

        currentPage += 1;
    }

    // Keep the real totalPages when this window is empty so infinite scroll can
    // continue past popular titles that are already available/requested.
    const lastFetchedPage = Math.max(page, currentPage - 1);
    return {
        results: merged,
        totalPages,
        lastFetchedPage,
    };
}
