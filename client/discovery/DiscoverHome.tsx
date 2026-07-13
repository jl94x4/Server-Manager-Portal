import React, { useState, useEffect } from 'react';
import { Sparkles, Search } from 'lucide-react';
import { apiFetch } from '../shared/api';
import { DiscoverPosterCard } from '../screens';

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
            <div className="flex flex-col gap-3">
                <h2 className="text-xl font-bold text-white px-2 flex items-center gap-2">
                    {title}
                </h2>
                <div className="flex gap-4 overflow-x-auto pb-4 px-2 custom-scrollbar snap-x snap-mandatory">
                    {items.map((rawItem, idx) => {
                        if (!rawItem) return null;
                        const formatted = formatItem(rawItem);
                        return (
                            <div key={idx} className="w-[140px] sm:w-[160px] flex-shrink-0 snap-start relative group">
                                <DiscoverPosterCard
                                    item={formatted}
                                    overlay={formatted.overlay}
                                    showQualityBadges={false}
                                    onPosterClick={() => onSelect(formatted)}
                                />
                            </div>
                        );
                    })}
                </div>
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
                    <DiscoveryRow title="Recently Added" items={rows.recentlyAdded} />
                    <DiscoveryRow title="Recent Requests" items={rows.recentRequests} />
                    <DiscoveryRow title="Trending Now" items={rows.trending} />
                    <DiscoveryRow title="Popular Movies" items={rows.popularMovies} />
                    <DiscoveryRow title="Upcoming Movies" items={rows.upcomingMovies} />
                    <DiscoveryRow title="Popular Series" items={rows.popularSeries} />
                    <DiscoveryRow title="Upcoming Series" items={rows.upcomingSeries} />
                </div>
            )}
        </div>
    );
};
