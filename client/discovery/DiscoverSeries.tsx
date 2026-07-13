import React, { useState, useEffect, useCallback } from 'react';
import { Filter, Tv } from 'lucide-react';
import { apiFetch } from '../shared/api';
import { FilterDrawer, FilterState } from './FilterDrawer';
import { DiscoverGridSizeSelect } from './DiscoverGridSizeSelect';
import { DiscoverPosterGrid } from './DiscoverPosterGrid';
import { useDiscoverGridSize } from './useDiscoverGridSize';
import {
    appendDiscoverQuery,
    buildSeriesFilterPath,
    countActiveFilters,
    defaultSeriesFilters,
    parseFiltersFromSearch,
} from './discoverUrlUtils';
import { findNetwork } from './discoverConstants';

export const DiscoverSeries: React.FC<{
    onSelect: (item: any) => void;
    formatItem: (item: any) => any;
    navigate: (path: string) => void;
}> = ({ onSelect, formatItem, navigate }) => {
    const [gridSize, setGridSize] = useDiscoverGridSize();
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [filters, setFilters] = useState<FilterState>(() =>
        parseFiltersFromSearch(typeof window !== 'undefined' ? window.location.search : '', defaultSeriesFilters()),
    );

    const readFiltersFromUrl = useCallback(() => {
        setFilters(parseFiltersFromSearch(window.location.search, defaultSeriesFilters()));
    }, []);

    useEffect(() => {
        readFiltersFromUrl();
        window.addEventListener('popstate', readFiltersFromUrl);
        return () => window.removeEventListener('popstate', readFiltersFromUrl);
    }, [readFiltersFromUrl]);

    useEffect(() => {
        setPage(1);
        setResults([]);
    }, [filters]);

    useEffect(() => {
        const fetchData = async () => {
            if (page === 1) setLoading(true);
            else setLoadingMore(true);

            try {
                let url = `/api/discovery/proxy/discover/tv?page=${page}&sortBy=${filters.sort}&language=en`;
                url = appendDiscoverQuery(url, filters, 'tv');
                const res = await apiFetch(url);
                if (res?.results) {
                    setResults((prev) => (page === 1 ? res.results : [...prev, ...res.results]));
                    if (res.totalPages) setTotalPages(res.totalPages);
                }
            } catch (err) {
                console.error(err);
            }
            setLoading(false);
            setLoadingMore(false);
        };
        fetchData();
    }, [filters, page]);

    const applyFilters = (newFilters: FilterState) => {
        setFilters(newFilters);
        navigate(buildSeriesFilterPath(newFilters));
    };

    const networkLabel = filters.network ? findNetwork(Number(filters.network))?.name : null;
    const activeFilterCount = countActiveFilters(filters, 'tv');

    return (
        <div className="w-full flex flex-col md:flex-row gap-8 px-4 sm:px-8 mt-4 relative">
            <div className="flex-1 flex flex-col gap-6">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                            <Tv className="w-6 h-6 text-plex" /> Series
                        </h2>
                        {networkLabel && (
                            <p className="text-sm text-muted mt-1">Network: {networkLabel}</p>
                        )}
                    </div>
                    <div className="flex items-center gap-3 flex-wrap justify-end">
                        <DiscoverGridSizeSelect value={gridSize} onChange={setGridSize} />
                        <button
                            type="button"
                            onClick={() => setShowFilters(true)}
                            className="relative flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-white/80 hover:text-white font-bold transition-colors"
                        >
                            <Filter className="w-4 h-4" /> Filters
                            {activeFilterCount > 0 && (
                                <span className="absolute -top-2 -right-2 min-w-[20px] h-5 px-1 rounded-full bg-plex text-black text-xs font-black flex items-center justify-center">
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                <DiscoverPosterGrid
                    items={results}
                    gridSize={gridSize}
                    formatItem={formatItem}
                    onSelect={onSelect}
                    loading={loading}
                />

                {!loading && page < totalPages && (
                    <div className="flex justify-center mt-8 mb-12">
                        <button
                            type="button"
                            onClick={() => setPage((p) => p + 1)}
                            disabled={loadingMore}
                            className="px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-white font-bold transition-all disabled:opacity-50"
                        >
                            {loadingMore ? 'Loading…' : 'Load More'}
                        </button>
                    </div>
                )}
            </div>

            <FilterDrawer
                isOpen={showFilters}
                onClose={() => setShowFilters(false)}
                type="tv"
                filters={filters}
                onApply={applyFilters}
                onClear={() => applyFilters(defaultSeriesFilters())}
            />
        </div>
    );
};
