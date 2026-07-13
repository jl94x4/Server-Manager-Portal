import { useCallback, useEffect, useRef, useState } from 'react';
import type { UpgraderGridSize } from '../shared/portalLayout';
import { initialDiscoverPagesForGrid } from './discoverPaginationUtils';

export type DiscoverPagePayload = {
    results: any[];
    totalPages: number;
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

            fetchingRef.current = false;
            let merged: any[] = [];
            let lastPage = 0;
            let maxTotalPages = 1;

            try {
                for (let pageNumber = 1; pageNumber <= initialPages; pageNumber += 1) {
                    if (cancelled) return;
                    const payload = await fetchPage(pageNumber);
                    maxTotalPages = Math.max(1, Number(payload.totalPages) || 1);
                    const batch = Array.isArray(payload.results) ? payload.results : [];
                    merged = pageNumber === 1 ? batch : [...merged, ...batch];
                    lastPage = pageNumber;
                    if (pageNumber >= maxTotalPages) break;
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
        fetchingRef.current = false;
        try {
            const payload = await fetchPage(nextPage);
            const batch = Array.isArray(payload.results) ? payload.results : [];
            setResults((prev) => [...prev, ...batch]);
            setLoadedPage(nextPage);
            setTotalPages(Math.max(1, Number(payload.totalPages) || totalPages));
        } catch (e) {
            console.error(e);
        } finally {
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
