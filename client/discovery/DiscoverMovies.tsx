import React, { useState, useEffect, useCallback } from 'react';
import { Filter, Film } from 'lucide-react';
import { apiFetch } from '../shared/api';
import { DiscoverPosterCard } from '../screens';
import { FilterDrawer, FilterState } from './FilterDrawer';
import {
    appendDiscoverQuery,
    buildMovieFilterPath,
    countActiveFilters,
    defaultMovieFilters,
    parseFiltersFromSearch,
} from './discoverUrlUtils';
import { findStudio } from './discoverConstants';

export const DiscoverMovies: React.FC<{
    onSelect: (item: any) => void;
    formatItem: (item: any) => any;
    navigate: (path: string) => void;
}> = ({ onSelect, formatItem, navigate }) => {
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [filters, setFilters] = useState<FilterState>(() =>
        parseFiltersFromSearch(typeof window !== 'undefined' ? window.location.search : '', defaultMovieFilters()),
    );

    const readFiltersFromUrl = useCallback(() => {
        setFilters(parseFiltersFromSearch(window.location.search, defaultMovieFilters()));
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
                let url = `/api/discovery/proxy/discover/movies?page=${page}&sortBy=${filters.sort}&language=en`;
                url = appendDiscoverQuery(url, filters, 'movie');
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
        navigate(buildMovieFilterPath(newFilters));
    };

    const studioLabel = filters.studio ? findStudio(Number(filters.studio))?.name : null;
    const activeFilterCount = countActiveFilters(filters, 'movie');

    return (
        <div className="w-full flex flex-col md:flex-row gap-8 px-4 sm:px-8 mt-4 relative">
            <div className="flex-1 flex flex-col gap-6">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                            <Film className="w-6 h-6 text-plex" /> Movies
                        </h2>
                        {studioLabel && (
                            <p className="text-sm text-muted mt-1">Studio: {studioLabel}</p>
                        )}
                    </div>
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

                {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 animate-pulse">
                        {[...Array(15)].map((_, i) => (
                            <div key={i} className="w-full aspect-[2/3] rounded-xl bg-white/5 border border-white/10" />
                        ))}
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                            {results.map((rawItem, idx) => {
                                const formatted = formatItem(rawItem);
                                return (
                                    <DiscoverPosterCard
                                        key={`${formatted.id}-${idx}`}
                                        item={formatted}
                                        overlay={formatted.overlay}
                                        showQualityBadges={false}
                                        onPosterClick={() => onSelect(formatted)}
                                    />
                                );
                            })}
                        </div>

                        {page < totalPages && (
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
                    </>
                )}
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
