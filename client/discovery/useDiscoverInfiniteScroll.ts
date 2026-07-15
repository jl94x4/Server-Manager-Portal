import { useCallback, useEffect, useRef, useState } from 'react';
import type { UpgraderGridSize } from '../shared/portalLayout';
import { mergeDiscoverResults } from './discoverItemUtils';
import { initialDiscoverPagesForGrid, DISCOVER_API_PAGE_SIZE } from './discoverPaginationUtils';

export type DiscoverPagePayload = {
    results: any[];
    totalPages: number;
    lastFetchedPage?: number;
};

type Options = {
    resetKey: string;
    gridSize: UpgraderGridSize;
    containerRef: React.RefObject<HTMLElement | null>;
    fetchPage: (page: number) => Promise<DiscoverPagePayload>;
};

export function useDiscoverInfiniteScroll({
    resetKey,
    gridSize,
    containerRef,
    fetchPage,
}: Options) {
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
                while (merged.length < targetItemCount && pageNumber <= maxTotalPages) {
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
                    setResults(merged);
                    setLoadedPage(lastPage);
                    setTotalPages(maxTotalPages);
                }
            } catch (e) {
                console.error(e);
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
            setResults((prev) => mergeDiscoverResults(prev, batch));
            setLoadedPage(payload.lastFetchedPage ?? nextPage);
            setTotalPages(Math.max(1, Number(payload.totalPages) || totalPages));
        } catch (e) {
            console.error(e);
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
