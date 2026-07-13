import React, { useState } from 'react';
import { X, Filter, Calendar, Star, Hash } from 'lucide-react';

export interface FilterState {
    sort: string;
    genre: string;
    year: string;
    network: string; // Only for series
    studio: string;  // Only for movies
    minRating: string;
}

interface FilterDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'movie' | 'tv';
    filters: FilterState;
    onApply: (filters: FilterState) => void;
    onClear: () => void;
}

export const FilterDrawer: React.FC<FilterDrawerProps> = ({ isOpen, onClose, type, filters, onApply, onClear }) => {
    const [localFilters, setLocalFilters] = useState<FilterState>(filters);

    // Sync local filters when props change (e.g. initial load)
    React.useEffect(() => {
        setLocalFilters(filters);
    }, [filters]);

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
            {/* Backdrop */}
            <div 
                className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />

            {/* Drawer */}
            <div 
                className={`fixed top-0 right-0 h-full w-full max-w-[400px] bg-card border-l border-white/10 z-[101] shadow-2xl flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10 bg-black/20">
                    <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                        <Filter className="w-6 h-6 text-plex" /> Filters
                    </h2>
                    <button 
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Filter Options */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col gap-8">
                    
                    {/* Sort By */}
                    <div className="flex flex-col gap-3">
                        <label className="text-xs font-black text-white/40 uppercase tracking-[0.2em]">Sort By</label>
                        <select 
                            value={localFilters.sort}
                            onChange={(e) => setLocalFilters({ ...localFilters, sort: e.target.value })}
                            className="w-full bg-black/50 border border-white/10 focus:border-plex rounded-xl p-4 text-white font-medium outline-none transition-colors shadow-inner"
                        >
                            <option value="popularity.desc">Most Popular</option>
                            <option value="vote_average.desc">Top Rated</option>
                            {type === 'movie' ? (
                                <>
                                    <option value="revenue.desc">Highest Revenue</option>
                                    <option value="primary_release_date.desc">Release Date (Newest)</option>
                                    <option value="primary_release_date.asc">Release Date (Oldest)</option>
                                </>
                            ) : (
                                <>
                                    <option value="first_air_date.desc">Premiere Date (Newest)</option>
                                    <option value="first_air_date.asc">Premiere Date (Oldest)</option>
                                </>
                            )}
                        </select>
                    </div>

                    {/* Minimum Rating */}
                    <div className="flex flex-col gap-3">
                        <label className="text-xs font-black text-white/40 uppercase tracking-[0.2em]">Minimum User Score</label>
                        <div className="relative">
                            <Star className="w-5 h-5 text-plex absolute left-4 top-1/2 -translate-y-1/2" />
                            <select 
                                value={localFilters.minRating}
                                onChange={(e) => setLocalFilters({ ...localFilters, minRating: e.target.value })}
                                className="w-full bg-black/50 border border-white/10 focus:border-plex rounded-xl p-4 pl-12 text-white font-medium outline-none transition-colors shadow-inner appearance-none"
                            >
                                <option value="">Any Score</option>
                                <option value="9">Masterpiece (9+)</option>
                                <option value="8">Great (8+)</option>
                                <option value="7">Good (7+)</option>
                                <option value="6">Okay (6+)</option>
                                <option value="5">Mediocre (5+)</option>
                            </select>
                        </div>
                    </div>

                    {/* Genre */}
                    <div className="flex flex-col gap-3">
                        <label className="text-xs font-black text-white/40 uppercase tracking-[0.2em]">Genre</label>
                        <select 
                            value={localFilters.genre}
                            onChange={(e) => setLocalFilters({ ...localFilters, genre: e.target.value })}
                            className="w-full bg-black/50 border border-white/10 focus:border-plex rounded-xl p-4 text-white font-medium outline-none transition-colors shadow-inner"
                        >
                            <option value="">All Genres</option>
                            {type === 'movie' ? (
                                <>
                                    <option value="28">Action</option>
                                    <option value="12">Adventure</option>
                                    <option value="16">Animation</option>
                                    <option value="35">Comedy</option>
                                    <option value="80">Crime</option>
                                    <option value="99">Documentary</option>
                                    <option value="18">Drama</option>
                                    <option value="10751">Family</option>
                                    <option value="14">Fantasy</option>
                                    <option value="36">History</option>
                                    <option value="27">Horror</option>
                                    <option value="10402">Music</option>
                                    <option value="9648">Mystery</option>
                                    <option value="10749">Romance</option>
                                    <option value="878">Science Fiction</option>
                                    <option value="53">Thriller</option>
                                    <option value="10752">War</option>
                                    <option value="37">Western</option>
                                </>
                            ) : (
                                <>
                                    <option value="10759">Action & Adventure</option>
                                    <option value="16">Animation</option>
                                    <option value="35">Comedy</option>
                                    <option value="80">Crime</option>
                                    <option value="99">Documentary</option>
                                    <option value="18">Drama</option>
                                    <option value="10751">Family</option>
                                    <option value="10762">Kids</option>
                                    <option value="9648">Mystery</option>
                                    <option value="10763">News</option>
                                    <option value="10764">Reality</option>
                                    <option value="10765">Sci-Fi & Fantasy</option>
                                    <option value="10766">Soap</option>
                                    <option value="10767">Talk</option>
                                    <option value="10768">War & Politics</option>
                                    <option value="37">Western</option>
                                </>
                            )}
                        </select>
                    </div>

                    {/* Network / Studio */}
                    {type === 'tv' ? (
                        <div className="flex flex-col gap-3">
                            <label className="text-xs font-black text-white/40 uppercase tracking-[0.2em]">Network</label>
                            <select 
                                value={localFilters.network}
                                onChange={(e) => setLocalFilters({ ...localFilters, network: e.target.value })}
                                className="w-full bg-black/50 border border-white/10 focus:border-plex rounded-xl p-4 text-white font-medium outline-none transition-colors shadow-inner"
                            >
                                <option value="">All Networks</option>
                                <option value="213">Netflix</option>
                                <option value="2739">Disney+</option>
                                <option value="1024">Amazon Prime Video</option>
                                <option value="2552">Apple TV+</option>
                                <option value="453">Hulu</option>
                                <option value="49">HBO</option>
                                <option value="4">BBC</option>
                                <option value="9">ITV</option>
                                <option value="214">Sky</option>
                                <option value="4330">Paramount+</option>
                                <option value="3186">Peacock</option>
                                <option value="67">Showtime</option>
                                <option value="174">AMC</option>
                                <option value="287">The CW</option>
                                <option value="2">ABC</option>
                                <option value="16">CBS</option>
                                <option value="6">NBC</option>
                                <option value="19">FOX</option>
                            </select>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            <label className="text-xs font-black text-white/40 uppercase tracking-[0.2em]">Studio</label>
                            <select 
                                value={localFilters.studio}
                                onChange={(e) => setLocalFilters({ ...localFilters, studio: e.target.value })}
                                className="w-full bg-black/50 border border-white/10 focus:border-plex rounded-xl p-4 text-white font-medium outline-none transition-colors shadow-inner"
                            >
                                <option value="">All Studios</option>
                                <option value="2">Walt Disney Pictures</option>
                                <option value="25">20th Century Studios</option>
                                <option value="5">Columbia Pictures (Sony)</option>
                                <option value="174">Warner Bros. Pictures</option>
                                <option value="33">Universal Pictures</option>
                                <option value="4">Paramount Pictures</option>
                                <option value="41077">A24</option>
                                <option value="3">Pixar</option>
                                <option value="420">Marvel Studios</option>
                                <option value="521">DreamWorks</option>
                                <option value="12">New Line Cinema</option>
                                <option value="14">Miramax</option>
                                <option value="1632">Lionsgate</option>
                            </select>
                        </div>
                    )}

                    {/* Release Year */}
                    <div className="flex flex-col gap-3">
                        <label className="text-xs font-black text-white/40 uppercase tracking-[0.2em]">Release Year</label>
                        <div className="relative">
                            <Calendar className="w-5 h-5 text-white/30 absolute left-4 top-1/2 -translate-y-1/2" />
                            <input 
                                type="number" 
                                placeholder="e.g. 2024" 
                                value={localFilters.year}
                                onChange={(e) => setLocalFilters({ ...localFilters, year: e.target.value })}
                                className="w-full bg-black/50 border border-white/10 focus:border-plex rounded-xl p-4 pl-12 text-white font-medium outline-none transition-colors shadow-inner"
                            />
                        </div>
                    </div>

                </div>

                {/* Footer Buttons */}
                <div className="p-6 border-t border-white/10 bg-black/20 flex gap-4">
                    <button 
                        onClick={handleClear}
                        className="flex-1 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-bold transition-colors"
                    >
                        Clear All
                    </button>
                    <button 
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
