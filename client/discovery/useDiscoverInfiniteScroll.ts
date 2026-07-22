import { useCallback, useEffect, useRef, useState } from 'react';
import type { UpgraderGridSize } from '../shared/portalLayout';
import { mergeDiscoverResults } from './discoverItemUtils';
import { filterDiscoverBrowseItems } from './discoverAvailability';
import { initialDiscoverPagesForGrid, DISCOVER_API_PAGE_SIZE } from './discoverPaginationUtils';

export type DiscoverPagePayload = {
    results: any[];
    totalPages: number;
    lastFetchedPage?: number;
};

type BrowseFilterOptions = {
    hideAvailable?: boolean;
    hideRequested?: boolean;
};

type Options = {
    resetKey: string;
    gridSize: UpgraderGridSize;
    containerRef: React.RefObject<HTMLElement | null>;
    fetchPage: (page: number) => Promise<DiscoverPagePayload>;
    /** Re-applied after live badge enrich so newly-marked available titles drop out. */
    filterOptions?: BrowseFilterOptions;
};

/** Cap how far the first paint scans when hide filters empty early pages. */
const MAX_INITIAL_SCAN_PAGES = 80;

export function useDiscoverInfiniteScroll({
    resetKey,
    gridSize,
    containerRef,
    fetchPage,
    filterOptions,
}: Options) {
    const filterOptionsRef = useRef(filterOptions);
    filterOptionsRef.current = filterOptions;
    const [results, setResults] = useState<any[]>([]);
    const [loadedPage, setLoadedPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const sentinelRef = useRef<HTMLDivElement>(null);
    const fetchingRef = useRef(false);

    const hasMore = loadedPage < totalPages;

    useEffect(() => {
        let cancelled = false;

        const runInitialLoad = async () => {
            setLoading(true);
            setResults([]);
            setLoadedPage(0);
            setTotalPages(1);

            const width = containerRef.current?.clientWidth
                || (typeof window !== 'undefined' ? Math.max(window.innerWidth - 320, 640) : 1200);
            const initialPages = initialDiscoverPagesForGrid(gridSize, width);
            const targetItemCount = initialPages * DISCOVER_API_PAGE_SIZE;

            fetchingRef.current = false;
            let merged: any[] = [];
            let lastPage = 0;
            let maxTotalPages = 1;

            try {
                let pageNumber = 1;
                while (
                    merged.length < targetItemCount
                    && pageNumber <= maxTotalPages
                    && lastPage < MAX_INITIAL_SCAN_PAGES
                ) {
                    if (cancelled) return;
                    const payload = await fetchPage(pageNumber);
                    maxTotalPages = Math.max(1, Number(payload.totalPages) || 1);
                    const batch = Array.isArray(payload.results) ? payload.results : [];
                    merged = mergeDiscoverResults(merged, batch);
                    lastPage = payload.lastFetchedPage ?? pageNumber;
                    if (lastPage >= maxTotalPages) break;
                    pageNumber = lastPage + 1;
                }

                if (!cancelled) {
                    // Server stamps mediaInfo (disk cache + warm catalog). Re-apply hide only —
                    // do not client availability-batch (that made badges pop in after paint).
                    setResults(filterDiscoverBrowseItems(merged, filterOptionsRef.current || {}));
                    setLoadedPage(lastPage);
                    setTotalPages(maxTotalPages);
                }
            } catch (e) {
                console.error(e);
                if (!cancelled) {
                    setResults([]);
                    // Prevent stuck "Loading more…" when the first fetch fails
                    setLoadedPage(1);
                    setTotalPages(1);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        runInitialLoad();
        return () => {
            cancelled = true;
            fetchingRef.current = false;
        };
    }, [resetKey, fetchPage, gridSize, containerRef]);

    const loadNextPage = useCallback(async () => {
        if (fetchingRef.current || loading || loadingMore || !hasMore) return;
        const nextPage = loadedPage + 1;
        if (nextPage > totalPages) return;

        setLoadingMore(true);
        fetchingRef.current = true;
        try {
            const payload = await fetchPage(nextPage);
            const batch = Array.isArray(payload.results) ? payload.results : [];
            const batch = Array.isArray(payload.results) ? payload.results : [];
            const filteredBatch = filterDiscoverBrowseItems(batch, filterOptionsRef.current || {});
            setResults((prev) => mergeDiscoverResults(prev, filteredBatch));
            setLoadedPage(payload.lastFetchedPage ?? nextPage);
            setTotalPages(Math.max(1, Number(payload.totalPages) || totalPages));
        } catch (e) {
            console.error(e);
            // Stop the sentinel loop on repeated failures
            setLoadedPage(totalPages);
        } finally {
            fetchingRef.current = false;
            setLoadingMore(false);
        }
    }, [fetchPage, hasMore, loadedPage, loading, loadingMore, totalPages]);

    useEffect(() => {
        if (loading || loadingMore || !hasMore) return undefined;
        const node = sentinelRef.current;
        if (!node) return undefined;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((entry) => entry.isIntersecting)) {
                    loadNextPage();
                }
            },
            { root: null, rootMargin: '600px 0px 400px 0px', threshold: 0.01 },
        );

        observer.observe(node);
        return () => observer.disconnect();
    }, [hasMore, loadNextPage, loading, loadingMore, results.length]);

    return {
        results,
        loading,
        loadingMore,
        hasMore,
        sentinelRef,
    };
}
