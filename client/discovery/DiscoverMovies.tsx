import React, { useCallback, useMemo, useRef } from 'react';
import { Filter, Film } from 'lucide-react';
import { FilterDrawer, FilterState } from './FilterDrawer';
import { DiscoverGridSizeSelect } from './DiscoverGridSizeSelect';
import { DiscoverPosterGrid } from './DiscoverPosterGrid';
import { useDiscoverGridSize } from './useDiscoverGridSize';
import {
    buildMovieFilterPath,
    countActiveFilters,
    defaultMovieFilters,
    parseFiltersFromSearch,
} from './discoverUrlUtils';
import { useDiscoveryPreferences } from './useDiscoveryPreferences';
import { findStudio, MOVIE_GENRES } from './discoverConstants';
import { useDiscoverInfiniteScroll } from './useDiscoverInfiniteScroll';
import { DiscoverInfiniteScrollFooter } from './DiscoverInfiniteScrollFooter';
import { discoverSkeletonCountForGrid } from './discoverPaginationUtils';
import { buildDiscoverMoviesApiUrl, fetchDiscoverPageWithBackfill } from './discoverFetchUtils';
import { DiscoverHideRequestedToggle } from './DiscoverHideRequestedToggle';
import { useHideRequestedToggle } from './useHideRequestedToggle';
import { discoveryTheme } from './discoveryThemeClasses';

export const DiscoverMovies: React.FC<{
    onSelect: (item: any) => void;
    formatItem: (item: any) => any;
    navigate: (path: string) => void;
}> = ({ onSelect, formatItem, navigate }) => {
    const { preferences } = useDiscoveryPreferences();
    const { hideRequested, setHideRequested } = useHideRequestedToggle();
    const [gridSize, setGridSize] = useDiscoverGridSize();
    const containerRef = useRef<HTMLDivElement>(null);
    const [showFilters, setShowFilters] = React.useState(false);

    const [filters, setFilters] = React.useState<FilterState>(() =>
        parseFiltersFromSearch(typeof window !== 'undefined' ? window.location.search : '', defaultMovieFilters()),
    );

    const readFiltersFromUrl = useCallback(() => {
        setFilters(parseFiltersFromSearch(window.location.search, defaultMovieFilters()));
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
        () => `${JSON.stringify(filters)}:${preferences.hideAvailableMedia}:${hideRequested}:${gridSize}`,
        [filters, preferences.hideAvailableMedia, hideRequested, gridSize],
    );

    const browseFilterOptions = useMemo(() => ({
        hideAvailable: preferences.hideAvailableMedia,
        hideRequested,
    }), [preferences.hideAvailableMedia, hideRequested]);

    const fetchPage = useCallback(async (page: number) => fetchDiscoverPageWithBackfill(
        (nextPage) => buildDiscoverMoviesApiUrl(nextPage, filters),
        page,
        browseFilterOptions,
    ), [filters, browseFilterOptions]);

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
        navigate(buildMovieFilterPath(newFilters));
    };

    const studioLabel = filters.studio ? findStudio(Number(filters.studio))?.name : null;
    const genreLabel = filters.genre
        ? MOVIE_GENRES.find((genre) => String(genre.id) === filters.genre)?.name
        : null;
    const keywordLabel = filters.keywordName || null;
    const activeFilterCount = countActiveFilters(filters, 'movie');
    const skeletonCount = discoverSkeletonCountForGrid(
        gridSize,
        containerRef.current?.clientWidth || (typeof window !== 'undefined' ? window.innerWidth : 1200),
    );

    return (
        <div className="w-full flex flex-col md:flex-row gap-8 px-4 sm:px-8 mt-4 relative">
            <div className="flex-1 flex flex-col gap-6" ref={containerRef}>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                        <h2 className={`${discoveryTheme.heading} flex items-center gap-2`}>
                            <Film className="w-6 h-6 text-plex" /> Movies
                        </h2>
                        {studioLabel && (
                            <p className="text-sm text-muted mt-1">Studio: {studioLabel}</p>
                        )}
                        {genreLabel && !studioLabel && (
                            <p className="text-sm text-muted mt-1">Genre: {genreLabel}</p>
                        )}
                        {keywordLabel && (
                            <p className="text-sm text-muted mt-1">Keyword: {keywordLabel}</p>
                        )}
                    </div>
                    <div className="flex items-center gap-3 flex-wrap justify-end">
                        <DiscoverGridSizeSelect value={gridSize} onChange={setGridSize} />
                        <DiscoverHideRequestedToggle checked={hideRequested} onChange={setHideRequested} />
                        <button
                            type="button"
                            onClick={() => setShowFilters(true)}
                            className={`relative ${discoveryTheme.toolbarBtn}`}
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
                    emptyMessage={
                        activeFilterCount > 0 || hideRequested
                            ? 'No movies match your filters.'
                            : 'No movies found.'
                    }
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
                type="movie"
                filters={filters}
                onApply={applyFilters}
                onClear={() => applyFilters(defaultMovieFilters())}
            />
        </div>
    );
};
