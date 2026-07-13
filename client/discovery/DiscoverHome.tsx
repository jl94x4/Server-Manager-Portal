import React, { useState, useEffect } from 'react';
import { Sparkles, Search } from 'lucide-react';
import { apiFetch } from '../shared/api';
import { DiscoverPosterCard } from '../screens';
import { Carousel } from './Carousel';

export const DiscoverHome: React.FC<{
    onSelect: (item: any) => void;
    formatItem: (item: any) => any;
}> = ({ onSelect, formatItem }) => {
    const [rows, setRows] = useState<{
        recentlyAdded: any[];
        recentRequests: any[];
        trending: any[];
        popularMovies: any[];
        upcomingMovies: any[];
        popularSeries: any[];
        upcomingSeries: any[];
    }>({
        recentlyAdded: [],
        recentRequests: [],
        trending: [],
        popularMovies: [],
        upcomingMovies: [],
        popularSeries: [],
        upcomingSeries: []
    });

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [
                    addedRes, reqRes, trendingRes,
                    popMovRes, upMovRes,
                    popTvRes, upTvRes
                ] = await Promise.all([
                    apiFetch('/api/discovery/proxy/media?filter=available&take=20&sort=mediaAdded').catch(() => null),
                    apiFetch('/api/discovery/proxy/request?filter=all&take=20').catch(() => null),
                    apiFetch('/api/discovery/trending').catch(() => null),
                    apiFetch('/api/discovery/proxy/discover/movies?sortBy=popularity.desc').catch(() => null),
                    apiFetch('/api/discovery/proxy/discover/movies/upcoming').catch(() => null),
                    apiFetch('/api/discovery/proxy/discover/tv?sortBy=popularity.desc').catch(() => null),
                    apiFetch('/api/discovery/proxy/discover/tv/upcoming').catch(() => null),
                ]);

                setRows({
                    recentlyAdded: addedRes?.results || [],
                    recentRequests: reqRes?.results?.map((r: any) => r.media) || [],
                    trending: trendingRes?.results || [],
                    popularMovies: popMovRes?.results || [],
                    upcomingMovies: upMovRes?.results || [],
                    popularSeries: popTvRes?.results || [],
                    upcomingSeries: upTvRes?.results || []
                });
            } catch (e) {
                console.error(e);
            }
            setLoading(false);
        };
        fetchData();
    }, []);

    const DiscoveryRow = ({ title, items }: { title: string, items: any[] }) => {
        if (!items || !items.length) return null;
        return (
            <div className="flex flex-col gap-3 relative">
                <h2 className="text-xl font-bold text-white px-2 flex items-center gap-2">
                    {title}
                </h2>
                <Carousel>
                    {items.map((rawItem, idx) => {
                        if (!rawItem) return null;
                        const formatted = formatItem(rawItem);
                        return (
                            <div key={idx} className="w-[140px] sm:w-[160px] flex-shrink-0 relative group">
                                <DiscoverPosterCard
                                    item={formatted}
                                    overlay={formatted.overlay}
                                    showQualityBadges={false}
                                    onPosterClick={() => onSelect(formatted)}
                                />
                            </div>
                        );
                    })}
                </Carousel>
            </div>
        );
    };

    const [query, setQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);

    useEffect(() => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }
        const timer = setTimeout(async () => {
            setSearchLoading(true);
            try {
                const res = await apiFetch(`/api/discovery/search?query=${encodeURIComponent(query)}`);
                if (res && res.results) {
                    setSearchResults(res.results);
                }
            } catch (err) {
                console.error('Search error', err);
            }
            setSearchLoading(false);
        }, 500);
        return () => clearTimeout(timer);
    }, [query]);

    if (loading) {
        return (
            <div className="flex flex-col gap-8 mt-4 px-2 w-full animate-pulse">
                {[...Array(4)].map((_, r) => (
                    <div key={r} className="flex flex-col gap-3">
                        <div className="w-48 h-6 bg-white/5 rounded px-2 ml-2"></div>
                        <div className="flex gap-4 overflow-hidden px-2">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="w-[140px] sm:w-[160px] aspect-[2/3] rounded-xl bg-white/5 border border-white/5 flex-shrink-0"></div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8 w-full max-w-full overflow-hidden pb-12">
            
            {/* Search Hero */}
            <div className="relative w-full rounded-2xl overflow-hidden bg-gradient-to-br from-plex/20 to-black/40 border border-white/10 p-8 sm:p-12 flex flex-col items-center justify-center text-center shadow-2xl">
                <div className="absolute inset-0 bg-black/40 pointer-events-none"></div>
                <div className="relative z-10 max-w-2xl w-full flex flex-col gap-6 items-center">
                    <Sparkles className="w-12 h-12 text-plex opacity-80" />
                    <h1 className="text-3xl sm:text-5xl font-bold text-white tracking-tight drop-shadow-md">
                        Discover & Request
                    </h1>
                    
                    <div className="w-full relative mt-4">
                        <Search className="w-6 h-6 text-muted absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search for a movie or TV show..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full bg-black/50 border-2 border-white/10 focus:border-plex rounded-xl py-4 pl-14 pr-6 text-lg text-white font-medium outline-none transition-all placeholder:text-muted/50 shadow-inner"
                        />
                        {searchLoading && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                <div className="w-5 h-5 border-2 border-plex/30 border-t-plex rounded-full animate-spin"></div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {query.trim() ? (
                <div className="flex flex-col gap-4 px-2">
                    <h2 className="text-xl font-bold text-white px-2">Search Results</h2>
                    {searchResults.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {searchResults.map((rawItem, idx) => {
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
                    ) : (
                        <div className="w-full py-20 flex flex-col items-center justify-center text-center gap-4 text-muted border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                            <Search className="w-10 h-10 opacity-20" />
                            <p>No results found for "{query}".</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex flex-col gap-8 mt-2 w-full max-w-full overflow-hidden">
                    <DiscoveryRow title="Trending Now" items={rows.trending} />
                    <DiscoveryRow title="Popular Movies" items={rows.popularMovies} />
                    
                    <div className="flex flex-col gap-3 relative">
                        <h2 className="text-xl font-bold text-white px-2">Movie Genres</h2>
                        <Carousel>
                            {[
                                { id: 28, name: 'Action', color: 'from-red-600/80 to-red-900/80' },
                                { id: 12, name: 'Adventure', color: 'from-orange-500/80 to-orange-800/80' },
                                { id: 16, name: 'Animation', color: 'from-blue-500/80 to-blue-800/80' },
                                { id: 35, name: 'Comedy', color: 'from-yellow-500/80 to-yellow-800/80' },
                                { id: 80, name: 'Crime', color: 'from-slate-600/80 to-slate-900/80' },
                                { id: 99, name: 'Documentary', color: 'from-emerald-600/80 to-emerald-900/80' }
                            ].map(g => (
                                <div key={g.id} onClick={() => window.history.pushState({}, '', `/discovery/movies?genre=${g.id}`) || window.dispatchEvent(new Event('popstate'))} className={`w-[160px] h-[80px] sm:w-[200px] sm:h-[100px] flex-shrink-0 rounded-xl bg-gradient-to-br ${g.color} p-4 flex items-end justify-start cursor-pointer hover:scale-105 transition-transform shadow-lg border border-white/10`}>
                                    <span className="text-lg font-bold text-white drop-shadow-md">{g.name}</span>
                                </div>
                            ))}
                        </Carousel>
                    </div>

                    <DiscoveryRow title="Upcoming Movies" items={rows.upcomingMovies} />
                    
                    <div className="flex flex-col gap-3 relative">
                        <h2 className="text-xl font-bold text-white px-2">Studios</h2>
                        <Carousel>
                            {[
                                { id: 2, name: 'Walt Disney', logo: 'https://image.tmdb.org/t/p/w300/wdrCwmRnLFJhEoG8GSfymY85KHT.png' },
                                { id: 25, name: '20th Century', logo: 'https://image.tmdb.org/t/p/w300/qZCc1lty5FzX30aOCVRXrxSRYcF.png' },
                                { id: 5, name: 'Sony Pictures', logo: 'https://image.tmdb.org/t/p/w300/71BqEFAF4V3qjjZAJ6NKeDOP2g4.png' },
                                { id: 174, name: 'Warner Bros', logo: 'https://image.tmdb.org/t/p/w300/ky0xOc5OrhvnX4ElzwaKzG2wz8t.png' },
                                { id: 33, name: 'Universal', logo: 'https://image.tmdb.org/t/p/w300/8lvHyhjvG0bIVMtd1S1sLcwk801.png' },
                                { id: 4, name: 'Paramount', logo: 'https://image.tmdb.org/t/p/w300/fycMZtIsqQ8Qv6iYh8sH0Wp21vV.png' }
                            ].map((c, i) => (
                                <div key={i} onClick={() => window.history.pushState({}, '', `/discovery/movies?studio=${c.id}`) || window.dispatchEvent(new Event('popstate'))} className="w-[140px] h-[80px] sm:w-[180px] sm:h-[100px] flex-shrink-0 rounded-xl bg-white/5 border border-white/10 p-4 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors shadow-lg">
                                    <img src={c.logo} alt={c.name} className="max-w-full max-h-full object-contain filter invert opacity-80" />
                                </div>
                            ))}
                        </Carousel>
                    </div>

                    <DiscoveryRow title="Popular Series" items={rows.popularSeries} />
                    
                    <div className="flex flex-col gap-3 relative">
                        <h2 className="text-xl font-bold text-white px-2">Series Genres</h2>
                        <Carousel>
                            {[
                                { id: 10759, name: 'Action & Adventure', color: 'from-purple-600/80 to-purple-900/80' },
                                { id: 16, name: 'Animation', color: 'from-cyan-500/80 to-cyan-800/80' },
                                { id: 35, name: 'Comedy', color: 'from-amber-500/80 to-amber-800/80' },
                                { id: 80, name: 'Crime', color: 'from-blue-600/80 to-blue-900/80' },
                                { id: 99, name: 'Documentary', color: 'from-emerald-500/80 to-emerald-800/80' },
                                { id: 18, name: 'Drama', color: 'from-pink-600/80 to-pink-900/80' }
                            ].map(g => (
                                <div key={g.id} onClick={() => window.history.pushState({}, '', `/discovery/series?genre=${g.id}`) || window.dispatchEvent(new Event('popstate'))} className={`w-[160px] h-[80px] sm:w-[200px] sm:h-[100px] flex-shrink-0 rounded-xl bg-gradient-to-br ${g.color} p-4 flex items-end justify-start cursor-pointer hover:scale-105 transition-transform shadow-lg border border-white/10`}>
                                    <span className="text-lg font-bold text-white drop-shadow-md">{g.name}</span>
                                </div>
                            ))}
                        </Carousel>
                    </div>

                    <DiscoveryRow title="Upcoming Series" items={rows.upcomingSeries} />

                    <div className="flex flex-col gap-3 relative">
                        <h2 className="text-xl font-bold text-white px-2">Networks</h2>
                        <Carousel>
                            {[
                                { id: 213, name: 'Netflix', logo: 'https://image.tmdb.org/t/p/w300/wwemzKWzjKYJFfCeiB57q3r4Bcm.png' },
                                { id: 2739, name: 'Disney+', logo: 'https://image.tmdb.org/t/p/w300/7rwgEs15tFwyR9NPQ5vpzxTj19Q.png' },
                                { id: 1024, name: 'Prime Video', logo: 'https://image.tmdb.org/t/p/w300/11A1K11yO4t0vJv7s43r0sWw9Hh.png' },
                                { id: 2552, name: 'Apple TV+', logo: 'https://image.tmdb.org/t/p/w300/6vA9x4kQk24jU3T9aH2wY4nN6H5.png' },
                                { id: 453, name: 'Hulu', logo: 'https://image.tmdb.org/t/p/w300/gJ8VX6JSu3cgXID5Lw2vG20N7S8.png' },
                                { id: 49, name: 'HBO', logo: 'https://image.tmdb.org/t/p/w300/tuomPhY2UtuPTqqFnKMVHvZwH0C.png' }
                            ].map((c, i) => (
                                <div key={i} onClick={() => window.history.pushState({}, '', `/discovery/series?network=${c.id}`) || window.dispatchEvent(new Event('popstate'))} className="w-[140px] h-[80px] sm:w-[180px] sm:h-[100px] flex-shrink-0 rounded-xl bg-white/5 border border-white/10 p-4 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors shadow-lg">
                                    <img src={c.logo} alt={c.name} className="max-w-full max-h-full object-contain filter invert opacity-80" />
                                </div>
                            ))}
                        </Carousel>
                    </div>

                </div>
            )}
        </div>
    );
};
