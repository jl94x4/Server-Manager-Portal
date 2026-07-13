import React, { useState, useEffect } from 'react';
import { Filter, X, Search, Calendar, Film } from 'lucide-react';
import { apiFetch } from '../shared/api';
import { DiscoverPosterCard } from '../screens';

export const DiscoverMovies: React.FC<{
    onSelect: (item: any) => void;
    formatItem: (item: any) => any;
}> = ({ onSelect, formatItem }) => {
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    
    // Filter State
    const [genre, setGenre] = useState('');
    const [year, setYear] = useState('');
    const [sort, setSort] = useState('popularity.desc');

    useEffect(() => {
        // Parse URL params for initial state if needed
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            if (params.get('genre')) setGenre(params.get('genre') || '');
            if (params.get('studio')) setGenre(params.get('studio') || ''); // Using genre state temporarily
        }
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                let url = `/api/discovery/proxy/discover/movies?sortBy=${sort}`;
                if (genre) url += `&withGenres=${genre}`;
                if (year) url += `&primaryReleaseYear=${year}`;
                
                const res = await apiFetch(url);
                if (res && res.results) {
                    setResults(res.results);
                }
            } catch (err) {
                console.error(err);
            }
            setLoading(false);
        };
        fetchData();
    }, [genre, year, sort]);

    return (
        <div className="w-full flex flex-col md:flex-row gap-8 px-4 sm:px-8 mt-4 relative">
            
            {/* Main Content */}
            <div className="flex-1 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                        <Film className="w-6 h-6 text-plex" /> Movies
                    </h2>
                    <button 
                        onClick={() => setShowFilters(!showFilters)}
                        className="md:hidden flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white/80 font-bold"
                    >
                        <Filter className="w-4 h-4" /> Filters
                    </button>
                </div>

                {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 animate-pulse">
                        {[...Array(15)].map((_, i) => (
                            <div key={i} className="w-full aspect-[2/3] rounded-xl bg-white/5 border border-white/10"></div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {results.map((rawItem, idx) => {
                            const formatted = formatItem(rawItem);
                            return (
                                <DiscoverPosterCard
                                    key={idx}
                                    item={formatted}
                                    overlay={formatted.overlay}
                                    showQualityBadges={false}
                                    onPosterClick={() => onSelect(formatted)}
                                />
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Filter Sidebar */}
            <div className={`fixed inset-0 z-50 bg-black/90 backdrop-blur-sm md:bg-transparent md:backdrop-blur-none md:static md:w-[300px] flex-shrink-0 flex flex-col gap-6 transition-transform duration-300 ${showFilters ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
                <div className="h-full md:h-auto bg-card border-l md:border border-white/10 p-6 md:rounded-2xl flex flex-col gap-6 overflow-y-auto custom-scrollbar shadow-2xl">
                    <div className="flex items-center justify-between md:hidden">
                        <h3 className="text-xl font-bold text-white">Filters</h3>
                        <button onClick={() => setShowFilters(false)} className="p-2 text-white/50 hover:text-white">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="hidden md:flex items-center gap-2 text-lg font-bold text-white border-b border-white/10 pb-4">
                        <Filter className="w-5 h-5 text-plex" /> Filters
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-white/50 uppercase tracking-widest">Sort By</label>
                        <select 
                            value={sort}
                            onChange={(e) => setSort(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white font-medium outline-none focus:border-plex"
                        >
                            <option value="popularity.desc">Popularity</option>
                            <option value="primary_release_date.desc">Release Date</option>
                            <option value="vote_average.desc">Top Rated</option>
                        </select>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-white/50 uppercase tracking-widest">Genre</label>
                        <select 
                            value={genre}
                            onChange={(e) => setGenre(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white font-medium outline-none focus:border-plex"
                        >
                            <option value="">All Genres</option>
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
                            <option value="10770">TV Movie</option>
                            <option value="53">Thriller</option>
                            <option value="10752">War</option>
                            <option value="37">Western</option>
                        </select>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-white/50 uppercase tracking-widest">Release Year</label>
                        <div className="relative">
                            <Calendar className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input 
                                type="number" 
                                placeholder="e.g. 2024" 
                                value={year}
                                onChange={(e) => setYear(e.target.value)}
                                className="w-full bg-black/50 border border-white/10 rounded-lg p-3 pl-10 text-white font-medium outline-none focus:border-plex"
                            />
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => {
                            setGenre('');
                            setYear('');
                            setSort('popularity.desc');
                            window.history.pushState({}, '', '/discovery/movies');
                        }}
                        className="mt-4 w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white font-bold transition-colors"
                    >
                        Clear Filters
                    </button>
                </div>
            </div>

        </div>
    );
};
