import { apiFetch } from '../shared/api';
import type { FilterState } from './FilterDrawer';
import { appendDiscoverQuery, hasAdvancedDiscoverFilters } from './discoverUrlUtils';
import { filterDiscoverBrowseItems } from './discoverAvailability';
import { dedupeDiscoverResults } from './discoverItemUtils';
import type { DiscoverPagePayload } from './useDiscoverInfiniteScroll';

type DiscoverBrowseFilterOptions = {
    hideAvailable?: boolean;
    hideRequested?: boolean;
    /**
     * Trust mediaInfo already attached by the discovery proxy (disk cache + warm catalog).
     * Client must not round-trip /availability-batch — that caused badge pop-in after paint.
     */
    trustAttachedAvailability?: boolean;
};

/** Extra same-endpoint pages to scan when hide-available empties a single page (Seerr-style). */
const MAX_SEQUENTIAL_EXTRA_PAGES = 5;

export const buildDiscoverStudioApiUrl = (page: number, studioId: number | string, sort = 'popularity.desc') =>
    `/api/discovery/proxy/discover/movies/studio/${studioId}?page=${page}&sortBy=${encodeURIComponent(sort)}`;

export const buildDiscoverNetworkApiUrl = (page: number, networkId: number | string, sort = 'popularity.desc') =>
    `/api/discovery/proxy/discover/tv/network/${networkId}?page=${page}&sortBy=${encodeURIComponent(sort)}`;

export const buildDiscoverMoviesApiUrl = (page: number, filters: FilterState): string => {
    const sort = filters.sort || 'popularity.desc';
    const studioOnly = Boolean(filters.studio)
        && !hasAdvancedDiscoverFilters({ ...filters, studio: '', sort: 'popularity.desc' }, 'movie');

    if (studioOnly) {
        return buildDiscoverStudioApiUrl(page, filters.studio, sort);
    }

    let url = `/api/discovery/proxy/discover/movies?page=${page}&sortBy=${encodeURIComponent(sort)}`;
    return appendDiscoverQuery(url, filters, 'movie');
};

export const buildDiscoverSeriesApiUrl = (page: number, filters: FilterState): string => {
    const sort = filters.sort || 'popularity.desc';
    const networkOnly = Boolean(filters.network)
        && !hasAdvancedDiscoverFilters({ ...filters, network: '', sort: 'popularity.desc' }, 'tv');
    const keywordsOnly = Boolean(filters.keywords)
        && !hasAdvancedDiscoverFilters({ ...filters, keywords: '', keywordName: '', sort: 'popularity.desc' }, 'tv');

    if (keywordsOnly) {
        return `/api/discovery/proxy/discover/tv?keywords=${encodeURIComponent(filters.keywords)}&page=${page}&sortBy=${encodeURIComponent(sort)}`;
    }

    if (networkOnly) {
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
    const filtered = filterDiscoverBrowseItems(res?.results || [], options);
    return {
        results: dedupeDiscoverResults(filtered),
        totalPages: Math.max(1, Number(res?.totalPages) || 1),
    };
}

type HomeRowFetchOptions = {
    minItems?: number;
    maxPages?: number;
    maxItems?: number;
    needsBackfill?: boolean;
    hideRequested?: boolean;
    trustAttachedAvailability?: boolean;
    /** Parallel page fetches — Seerr-style home uses 1 (sequential). */
    pageConcurrency?: number;
    /** Drop poster-less titles so home never shows "POSTER NOT FOUND" tiles. */
    requirePoster?: boolean;
    /** Cancel in-flight page fetches (home remount / refresh). */
    signal?: AbortSignal;
};

const itemHasPoster = (item: any) => !!(
    item?.posterPath
    || item?.posterUrl
    || item?.poster
);

const applyHomeRowQualityFilters = (items: any[], options: HomeRowFetchOptions) => {
    let next = Array.isArray(items) ? items : [];
    if (options.requirePoster) next = next.filter(itemHasPoster);
    return next;
};

/**
 * Seerr-style home rail: one endpoint, sequential same-URL pages.
 * When hide-available is on, advance page 1→2… until minItems or maxPages — never alternate sorts.
 */
export async function fetchDiscoverHomeRowResults(
    buildUrl: (page: number) => string,
    hideAvailable: boolean,
    options: HomeRowFetchOptions = {},
): Promise<any[]> {
    const maxItems = options.maxItems ?? 20;
    const maxPages = options.maxPages ?? (hideAvailable ? 2 : 1);
    const minItems = Math.min(options.minItems ?? Math.min(10, maxItems), maxItems);
    const hideRequested = options.hideRequested === true;
    const signal = options.signal;
    const filterOptions: DiscoverBrowseFilterOptions = {
        hideAvailable,
        hideRequested,
        trustAttachedAvailability: options.trustAttachedAvailability !== false,
    };

    const fetchPage = (page: number) => (
        apiFetch(buildUrl(page), signal ? { signal } : {}).catch((err: any) => {
            if (signal?.aborted || err?.name === 'AbortError') return null;
            return null;
        })
    );

    let merged: any[] = [];
    let totalPages = Number.POSITIVE_INFINITY;

    for (let page = 1; page <= maxPages; page += 1) {
        if (signal?.aborted) break;
        const res = await fetchPage(page);
        if (!res) break;
        totalPages = Math.max(1, Number(res?.totalPages) || 1);
        const rawBatch = Array.isArray(res?.results) ? res.results : [];
        const batch = filterDiscoverBrowseItems(rawBatch, filterOptions);
        merged = dedupeDiscoverResults([
            ...merged,
            ...applyHomeRowQualityFilters(batch, options),
        ]);
        if (merged.length >= minItems || merged.length >= maxItems) break;
        if (page >= totalPages) break;
    }

    return merged.slice(0, maxItems);
}

/**
 * Seerr-style browse step: fetch page N, filter hide-available, and if the filtered
 * page is empty advance sequentially up to MAX_SEQUENTIAL_EXTRA_PAGES (same endpoint).
 * Replaces the old 50×4 parallel backfill storm.
 */
export async function fetchDiscoverPageWithAdvance(
    buildUrl: (page: number) => string,
    page: number,
    options: DiscoverBrowseFilterOptions = {},
): Promise<DiscoverPagePayload & { lastFetchedPage: number }> {
    const needsAdvance = !!options.hideAvailable || !!options.hideRequested;
    if (!needsAdvance) {
        const payload = await fetchDiscoverPage(buildUrl(page), options);
        return { ...payload, lastFetchedPage: page };
    }

    let merged: any[] = [];
    let totalPages = 1;
    let lastFetchedPage = page;
    const endPage = page + MAX_SEQUENTIAL_EXTRA_PAGES;

    for (let current = page; current <= endPage; current += 1) {
        const payload = await fetchDiscoverPage(buildUrl(current), options).catch(() => null);
        if (!payload) {
            lastFetchedPage = current;
            break;
        }
        totalPages = Math.max(1, Number(payload.totalPages) || 1);
        lastFetchedPage = current;
        merged = dedupeDiscoverResults([...merged, ...(payload.results || [])]);
        if (merged.length > 0 || current >= totalPages) {
            return { results: merged, totalPages, lastFetchedPage };
        }
    }

    return { results: merged, totalPages, lastFetchedPage };
}

/** @deprecated Use fetchDiscoverPageWithAdvance — kept as alias for any stray imports. */
export const fetchDiscoverPageWithBackfill = fetchDiscoverPageWithAdvance;
