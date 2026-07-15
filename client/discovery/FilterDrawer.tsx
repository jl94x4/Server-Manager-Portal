import React, { useMemo, useState } from 'react';
import { X, Filter, Calendar, Star } from 'lucide-react';
import { CustomSelect } from '../shared/ui';
import { DISCOVER_NETWORKS, DISCOVER_STUDIOS, MOVIE_GENRES, TV_GENRES } from './discoverConstants';
import { discoveryTheme } from './discoveryThemeClasses';

export interface FilterState {
    sort: string;
    genre: string;
    year: string;
    network: string; // Only for series
    studio: string;  // Only for movies
    minRating: string;
    keywords: string;
    keywordName: string;
}

interface FilterDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'movie' | 'tv';
    filters: FilterState;
    onApply: (filters: FilterState) => void;
    onClear: () => void;
}

const MOVIE_SORT_OPTIONS = [
    { value: 'popularity.desc', label: 'Most Popular' },
    { value: 'vote_average.desc', label: 'Top Rated' },
    { value: 'revenue.desc', label: 'Highest Revenue' },
    { value: 'primary_release_date.desc', label: 'Release Date (Newest)' },
    { value: 'primary_release_date.asc', label: 'Release Date (Oldest)' },
];

const TV_SORT_OPTIONS = [
    { value: 'popularity.desc', label: 'Most Popular' },
    { value: 'vote_average.desc', label: 'Top Rated' },
    { value: 'first_air_date.desc', label: 'Premiere Date (Newest)' },
    { value: 'first_air_date.asc', label: 'Premiere Date (Oldest)' },
];

const RATING_OPTIONS = [
    { value: '', label: 'Any Score' },
    { value: '9', label: 'Masterpiece (9+)' },
    { value: '8', label: 'Great (8+)' },
    { value: '7', label: 'Good (7+)' },
    { value: '6', label: 'Okay (6+)' },
    { value: '5', label: 'Mediocre (5+)' },
];

const filterLabelClass = 'text-xs font-black text-muted uppercase tracking-[0.2em]';

export const FilterDrawer: React.FC<FilterDrawerProps> = ({ isOpen, onClose, type, filters, onApply, onClear }) => {
    const [localFilters, setLocalFilters] = useState<FilterState>(filters);

    React.useEffect(() => {
        setLocalFilters(filters);
    }, [filters]);

    const sortOptions = type === 'movie' ? MOVIE_SORT_OPTIONS : TV_SORT_OPTIONS;
    const genreOptions = useMemo(() => [
        { value: '', label: 'All Genres' },
        ...(type === 'movie' ? MOVIE_GENRES : TV_GENRES).map((genre) => ({
            value: String(genre.id),
            label: genre.name,
        })),
    ], [type]);

    const studioOptions = useMemo(() => [
        { value: '', label: 'All Studios' },
        ...DISCOVER_STUDIOS.map((studio) => ({ value: String(studio.id), label: studio.name })),
    ], []);

    const networkOptions = useMemo(() => [
        { value: '', label: 'All Networks' },
        ...DISCOVER_NETWORKS.map((network) => ({ value: String(network.id), label: network.name })),
    ], []);

    const handleApply = () => {
        onApply(localFilters);
        onClose();
    };

    const handleClear = () => {
        onClear();
        onClose();
    };

    return (
        <>
            <div
                className={`${discoveryTheme.drawerOverlay} ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />

            <div
                className={`${discoveryTheme.drawerPanel} ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                <div className={discoveryTheme.drawerHeader}>
                    <h2 className={discoveryTheme.drawerTitle}>
                        <Filter className="w-6 h-6 text-plex" /> Filters
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-white/10 text-muted hover:text-text transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col gap-8">
                    <div className="flex flex-col gap-3">
                        <label className={filterLabelClass}>Sort By</label>
                        <CustomSelect
                            value={localFilters.sort}
                            onChange={(sort) => setLocalFilters({ ...localFilters, sort })}
                            options={sortOptions}
                            className="w-full"
                        />
                    </div>

                    <div className="flex flex-col gap-3">
                        <label className={`${filterLabelClass} flex items-center gap-2`}>
                            <Star className="w-4 h-4 text-plex" /> Minimum User Score
                        </label>
                        <CustomSelect
                            value={localFilters.minRating}
                            onChange={(minRating) => setLocalFilters({ ...localFilters, minRating })}
                            options={RATING_OPTIONS}
                            className="w-full"
                        />
                    </div>

                    <div className="flex flex-col gap-3">
                        <label className={filterLabelClass}>Genre</label>
                        <CustomSelect
                            value={localFilters.genre}
                            onChange={(genre) => setLocalFilters({ ...localFilters, genre })}
                            options={genreOptions}
                            className="w-full"
                        />
                    </div>

                    {type === 'tv' ? (
                        <div className="flex flex-col gap-3">
                            <label className={filterLabelClass}>Network</label>
                            <CustomSelect
                                value={localFilters.network}
                                onChange={(network) => setLocalFilters({ ...localFilters, network })}
                                options={networkOptions}
                                className="w-full"
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            <label className={filterLabelClass}>Studio</label>
                            <CustomSelect
                                value={localFilters.studio}
                                onChange={(studio) => setLocalFilters({ ...localFilters, studio })}
                                options={studioOptions}
                                className="w-full"
                            />
                        </div>
                    )}

                    <div className="flex flex-col gap-3">
                        <label className={filterLabelClass}>Release Year</label>
                        <div className="relative">
                            <Calendar className="w-5 h-5 text-muted/60 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                                type="number"
                                placeholder="e.g. 2024"
                                value={localFilters.year}
                                onChange={(e) => setLocalFilters({ ...localFilters, year: e.target.value })}
                                className="w-full bg-background/60 border border-border focus:border-plex rounded-xl p-4 pl-12 text-text font-medium outline-none transition-colors shadow-inner"
                            />
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-border bg-background/20 flex gap-4">
                    <button
                        type="button"
                        onClick={handleClear}
                        className="flex-1 py-4 bg-white/5 hover:bg-white/10 border border-border rounded-xl text-text font-bold transition-colors"
                    >
                        Clear All
                    </button>
                    <button
                        type="button"
                        onClick={handleApply}
                        className="flex-1 py-4 bg-plex hover:bg-plex-hover rounded-xl text-black font-black transition-colors shadow-[0_0_15px_rgba(229,160,13,0.3)]"
                    >
                        Apply Filters
                    </button>
                </div>
            </div>
        </>
    );
};
