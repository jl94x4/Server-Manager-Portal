import React, { useCallback, useMemo, useRef } from 'react';
import { Filter, Tv } from 'lucide-react';
import { FilterDrawer, FilterState } from './FilterDrawer';
import { DiscoverGridSizeSelect } from './DiscoverGridSizeSelect';
import { DiscoverPosterGrid } from './DiscoverPosterGrid';
import { useDiscoverGridSize } from './useDiscoverGridSize';
import {
    buildSeriesFilterPath,
    countActiveFilters,
    defaultSeriesFilters,
    parseFiltersFromSearch,
} from './discoverUrlUtils';
import { useDiscoveryPreferences } from './useDiscoveryPreferences';
import { findNetwork, TV_GENRES } from './discoverConstants';
import { useDiscoverInfiniteScroll } from './useDiscoverInfiniteScroll';
import { DiscoverInfiniteScrollFooter } from './DiscoverInfiniteScrollFooter';
import { discoverSkeletonCountForGrid } from './discoverPaginationUtils';
import { buildDiscoverSeriesApiUrl, fetchDiscoverPageWithBackfill } from './discoverFetchUtils';

export const DiscoverSeries: React.FC<{
    onSelect: (item: any) => void;
    formatItem: (item: any) => any;
    navigate: (path: string) => void;
}> = ({ onSelect, formatItem, navigate }) => {
    const { preferences } = useDiscoveryPreferences();
    const [gridSize, setGridSize] = useDiscoverGridSize();
    const containerRef = useRef<HTMLDivElement>(null);
    const [showFilters, setShowFilters] = React.useState(false);

    const [filters, setFilters] = React.useState<FilterState>(() =>
        parseFiltersFromSearch(typeof window !== 'undefined' ? window.location.search : '', defaultSeriesFilters()),
    );

    const readFiltersFromUrl = useCallback(() => {
        setFilters(parseFiltersFromSearch(window.location.search, defaultSeriesFilters()));
    }, []);

    React.useEffect(() => {
        readFiltersFromUrl();
        window.addEventListener('popstate', readFiltersFromUrl);
        window.addEventListener('portal-discovery-navigate', readFiltersFromUrl);
        return () => {
            window.removeEventListener('popstate', readFiltersFromUrl);
            window.removeEventListener('portal-discovery-navigate', readFiltersFromUrl);
        };
    }, [readFiltersFromUrl]);

    const resetKey = useMemo(
        () => `${JSON.stringify(filters)}:${preferences.hideAvailableMedia}:${gridSize}`,
        [filters, preferences.hideAvailableMedia, gridSize],
    );

    const fetchPage = useCallback(async (page: number) => fetchDiscoverPageWithBackfill(
        (nextPage) => buildDiscoverSeriesApiUrl(nextPage, filters),
        page,
        preferences.hideAvailableMedia,
    ), [filters, preferences.hideAvailableMedia]);

    const {
        results,
        loading,
        loadingMore,
        hasMore,
        sentinelRef,
    } = useDiscoverInfiniteScroll({
        resetKey,
        gridSize,
        containerRef,
        fetchPage,
    });

    const applyFilters = (newFilters: FilterState) => {
        setFilters(newFilters);
        navigate(buildSeriesFilterPath(newFilters));
    };

    const networkLabel = filters.network ? findNetwork(Number(filters.network))?.name : null;
    const genreLabel = filters.genre
        ? TV_GENRES.find((genre) => String(genre.id) === filters.genre)?.name
        : null;
    const activeFilterCount = countActiveFilters(filters, 'tv');
    const skeletonCount = discoverSkeletonCountForGrid(
        gridSize,
        containerRef.current?.clientWidth || (typeof window !== 'undefined' ? window.innerWidth : 1200),
    );

    return (
        <div className="w-full flex flex-col md:flex-row gap-8 px-4 sm:px-8 mt-4 relative">
            <div className="flex-1 flex flex-col gap-6" ref={containerRef}>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                            <Tv className="w-6 h-6 text-plex" /> Series
                        </h2>
                        {networkLabel && (
                            <p className="text-sm text-muted mt-1">Network: {networkLabel}</p>
                        )}
                        {genreLabel && !networkLabel && (
                            <p className="text-sm text-muted mt-1">Genre: {genreLabel}</p>
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
                    skeletonCount={skeletonCount}
                    emptyMessage={activeFilterCount > 0 ? 'No series match your filters.' : 'No series found.'}
                />

                <DiscoverInfiniteScrollFooter
                    sentinelRef={sentinelRef}
                    loadingMore={loadingMore}
                    hasMore={hasMore}
                    loading={loading}
                />
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
