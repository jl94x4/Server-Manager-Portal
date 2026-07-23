import { apiFetch } from '../shared/api';
import type { FilterState } from './FilterDrawer';
import { appendDiscoverQuery, hasAdvancedDiscoverFilters } from './discoverUrlUtils';
import { filterDiscoverBrowseItems } from './discoverAvailability';
import { dedupeDiscoverResults } from './discoverItemUtils';
import type { DiscoverPagePayload } from './useDiscoverInfiniteScroll';

/** Pages to scan per backfill window when hide-available / hide-requested empties results. */
const MAX_BACKFILL_PAGES = 50;

type DiscoverBrowseFilterOptions = {
    hideAvailable?: boolean;
    hideRequested?: boolean;
    /**
     * Trust mediaInfo already attached by the discovery proxy (disk cache + warm catalog).
     * Client must not round-trip /availability-batch — that caused badge pop-in after paint.
     */
    trustAttachedAvailability?: boolean;
};

const needsDiscoverBackfill = (options: DiscoverBrowseFilterOptions) => (
    !!options.hideAvailable || !!options.hideRequested
);

/**
 * Browse lists ship with disk-cache / warm-catalog mediaInfo from the proxy.
 */
async function filterDiscoverResultsWithAvailability(
    items: any[],
    options: DiscoverBrowseFilterOptions,
): Promise<any[]> {
    const list = Array.isArray(items) ? items : [];
    if (!list.length || !needsDiscoverBackfill(options)) {
        return filterDiscoverBrowseItems(list, options);
    }

    // Drop titles the proxy already marked available/requested.
    // Do not live-call /availability-batch here — that stamped badges after paint ("pop-in").
    return filterDiscoverBrowseItems(list, options);
}

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
    const filtered = await filterDiscoverResultsWithAvailability(res?.results || [], options);
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
    /** Parallel TMDB page fetches per round (hide-available refill). */
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

/** Fetch enough items for a discover home carousel row. */
export async function fetchDiscoverHomeRowResults(
    buildUrl: (page: number) => string,
    hideAvailable: boolean,
    options: HomeRowFetchOptions = {},
): Promise<any[]> {
    // Ultrawide layouts need ~30–40 posters before a row fills; fetch enough to scroll.
    const maxItems = options.maxItems ?? 40;
    const maxPages = options.maxPages ?? 8;
    // Never chase more items than we will keep — otherwise hide-available scans every page.
    const minItems = Math.min(options.minItems ?? Math.min(24, maxItems), maxItems);
    // Only hide requested when callers opt in — available/partial hide stays independent.
    const hideRequested = options.hideRequested === true;
    const signal = options.signal;
    const filterOptions: DiscoverBrowseFilterOptions = {
        hideAvailable,
        hideRequested,
        // Home must stay Seerr-fast: trust proxy cache, never N availability-batch calls.
        trustAttachedAvailability: options.trustAttachedAvailability !== false,
    };
    const needsBackfill = options.needsBackfill ?? needsDiscoverBackfill(filterOptions);
    const concurrency = Math.max(1, Math.min(options.pageConcurrency ?? (needsBackfill ? 4 : 1), 8));
    const fetchPage = (page: number) => (
        apiFetch(buildUrl(page), signal ? { signal } : {}).catch((err: any) => {
            if (signal?.aborted || err?.name === 'AbortError') return null;
            return null;
        })
    );

    if (!needsBackfill) {
        let merged: any[] = [];
        const pageLimit = Math.min(options.maxPages ?? 2, maxPages);
        for (let page = 1; page <= pageLimit; page += 1) {
            if (signal?.aborted) break;
            const res = await fetchPage(page);
            if (!res) continue;
            const totalPages = Math.max(1, Number(res?.totalPages) || 1);
            const batch = Array.isArray(res?.results) ? res.results : [];
            merged = dedupeDiscoverResults([...merged, ...batch]);
            if (merged.length >= maxItems || page >= totalPages) break;
        }
        return applyHomeRowQualityFilters(merged, options).slice(0, maxItems);
    }

    let merged: any[] = [];
    let totalPages = Number.POSITIVE_INFINITY;

    for (let page = 1; page <= maxPages && merged.length < minItems;) {
        if (signal?.aborted) break;
        const chunk: number[] = [];
        for (let i = 0; i < concurrency && page + i <= maxPages; i += 1) {
            if (page + i > totalPages) break;
            chunk.push(page + i);
        }
        if (!chunk.length) break;

        const responses = await Promise.all(chunk.map((p) => fetchPage(p)));
        for (const res of responses) {
            if (!res) continue;
            totalPages = Math.min(totalPages, Math.max(1, Number(res?.totalPages) || 1));
            const rawBatch = Array.isArray(res?.results) ? res.results : [];
            const batch = await filterDiscoverResultsWithAvailability(rawBatch, filterOptions);
            merged = dedupeDiscoverResults([...merged, ...applyHomeRowQualityFilters(batch, options)]);
        }

        page += chunk.length;
        if (merged.length >= minItems) break;
        if (page > totalPages) break;
    }

    return merged.slice(0, maxItems);
}

/**
 * Fill a home row from multiple TMDB discover sorts/endpoints.
 * When hide-available is on, popularity alone is mostly already-owned — mix in newer/less-owned lists.
 */
export async function fetchDiscoverHomeRowResultsFromSources(
    sources: Array<(page: number) => string>,
    hideAvailable: boolean,
    options: HomeRowFetchOptions = {},
): Promise<any[]> {
    const list = Array.isArray(sources) ? sources.filter(Boolean) : [];
    if (!list.length) return [];

    const maxItems = options.maxItems ?? 40;
    const minItems = Math.min(options.minItems ?? Math.min(24, maxItems), maxItems);
    let merged: any[] = [];

    for (const buildUrl of list) {
        if (merged.length >= minItems) break;
        const remainingMin = Math.max(0, minItems - merged.length);
        const batch = await fetchDiscoverHomeRowResults(buildUrl, hideAvailable, {
            ...options,
            maxItems: Math.max(remainingMin, maxItems - merged.length),
            minItems: remainingMin,
        });
        merged = dedupeDiscoverResults([...merged, ...batch]);
    }

    return merged.slice(0, maxItems);
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

    // Prefer cache stamps from the proxy; live-enrich only when callers opt in.
    const filterOpts: DiscoverBrowseFilterOptions = {
        ...options,
        trustAttachedAvailability: options.trustAttachedAvailability !== false,
    };

    let merged: any[] = [];
    let totalPages = 1;
    let currentPage = page;
    const maxPage = page + MAX_BACKFILL_PAGES - 1;
    const concurrency = 4;

    while (currentPage <= maxPage) {
        const chunk: number[] = [];
        for (let i = 0; i < concurrency && currentPage + i <= maxPage; i += 1) {
            chunk.push(currentPage + i);
        }

        const payloads = await Promise.all(
            chunk.map((p) => fetchDiscoverPage(buildUrl(p), filterOpts).catch(() => null)),
        );

        let hitEnd = false;
        for (let i = 0; i < payloads.length; i += 1) {
            const payload = payloads[i];
            if (!payload) continue;
            totalPages = payload.totalPages;
            merged = dedupeDiscoverResults([...merged, ...payload.results]);
            if (chunk[i] >= totalPages) hitEnd = true;
        }

        const lastFetchedPage = chunk[chunk.length - 1] || currentPage;
        if (merged.length > 0 || hitEnd || lastFetchedPage >= totalPages) {
            return {
                results: merged,
                totalPages,
                lastFetchedPage,
            };
        }

        currentPage += chunk.length;
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
