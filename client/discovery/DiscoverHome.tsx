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
                    apiFetch('/api/discovery/proxy/discover/movies?sortBy=popularity.desc&withOriginalLanguage=en').catch(() => null),
                    apiFetch('/api/discovery/proxy/discover/movies/upcoming?withOriginalLanguage=en').catch(() => null),
                    apiFetch('/api/discovery/proxy/discover/tv?sortBy=popularity.desc&withOriginalLanguage=en').catch(() => null),
                    apiFetch('/api/discovery/proxy/discover/tv/upcoming?withOriginalLanguage=en').catch(() => null),
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
                                <div key={g.id} onClick={() => { window.history.pushState({}, '', `/discovery/movies?genre=${g.id}`); window.dispatchEvent(new Event('popstate')); }} className={`w-[160px] h-[80px] sm:w-[200px] sm:h-[100px] flex-shrink-0 rounded-xl bg-gradient-to-br ${g.color} p-4 flex items-end justify-start cursor-pointer hover:scale-105 transition-transform shadow-lg border border-white/10`}>
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
                                { id: 2, name: 'Walt Disney', logo: 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Disney%2B_logo.svg' },
                                { id: 25, name: '20th Century', logo: 'https://upload.wikimedia.org/wikipedia/commons/c/cc/20th_Century_Studios_logo.svg' },
                                { id: 5, name: 'Sony Pictures', logo: 'https://upload.wikimedia.org/wikipedia/commons/8/87/Sony_Pictures_Television_logo.svg' },
                                { id: 174, name: 'Warner Bros', logo: 'https://upload.wikimedia.org/wikipedia/commons/d/d2/Warner_Bros._%282019%29_logo.svg' },
                                { id: 33, name: 'Universal', logo: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Universal_Pictures_logo.svg' },
                                { id: 4, name: 'Paramount', logo: 'https://upload.wikimedia.org/wikipedia/commons/8/8b/Paramount_Pictures_2022.svg' },
                                { id: 41077, name: 'A24', logo: 'https://upload.wikimedia.org/wikipedia/commons/b/b5/A24_logo.svg' }
                            ].map((c, i) => (
                                <div key={i} onClick={() => { window.history.pushState({}, '', `/discovery/movies?studio=${c.id}`); window.dispatchEvent(new Event('popstate')); }} className="w-[140px] h-[80px] sm:w-[180px] sm:h-[100px] flex-shrink-0 rounded-xl bg-white/5 border border-white/10 p-4 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors shadow-lg">
                                    <img src={c.logo} alt={c.name} className="max-w-[80%] max-h-[80%] object-contain drop-shadow-md" />
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
                                <div key={g.id} onClick={() => { window.history.pushState({}, '', `/discovery/series?genre=${g.id}`); window.dispatchEvent(new Event('popstate')); }} className={`w-[160px] h-[80px] sm:w-[200px] sm:h-[100px] flex-shrink-0 rounded-xl bg-gradient-to-br ${g.color} p-4 flex items-end justify-start cursor-pointer hover:scale-105 transition-transform shadow-lg border border-white/10`}>
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
                                { id: 213, name: 'Netflix', logo: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg' },
                                { id: 2739, name: 'Disney+', logo: 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Disney%2B_logo.svg' },
                                { id: 1024, name: 'Prime Video', logo: 'https://upload.wikimedia.org/wikipedia/commons/f/f1/Prime_Video.svg' },
                                { id: 2552, name: 'Apple TV+', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/28/Apple_TV_Plus_Logo.svg' },
                                { id: 453, name: 'Hulu', logo: 'https://upload.wikimedia.org/wikipedia/commons/e/e4/Hulu_Logo.svg' },
                                { id: 49, name: 'HBO', logo: 'https://upload.wikimedia.org/wikipedia/commons/d/de/HBO_logo.svg' },
                                { id: 4, name: 'BBC', logo: 'https://upload.wikimedia.org/wikipedia/commons/5/5f/BBC_blocks_dark_mode.svg' },
                                { id: 9, name: 'ITV', logo: 'https://upload.wikimedia.org/wikipedia/commons/4/4b/ITVX_logo.svg' },
                                { id: 214, name: 'Sky', logo: 'https://upload.wikimedia.org/wikipedia/commons/8/8b/Sky_logo_2020.svg' }
                            ].map((c, i) => (
                                <div key={i} onClick={() => { window.history.pushState({}, '', `/discovery/series?network=${c.id}`); window.dispatchEvent(new Event('popstate')); }} className="w-[140px] h-[80px] sm:w-[180px] sm:h-[100px] flex-shrink-0 rounded-xl bg-zinc-100 p-4 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform shadow-lg">
                                    <img src={c.logo} alt={c.name} className="max-w-[80%] max-h-[80%] object-contain" />
                                </div>
                            ))}
                        </Carousel>
                    </div>

                </div>
    );
};
