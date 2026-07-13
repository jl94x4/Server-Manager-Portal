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
                    apiFetch('/api/discovery/proxy/discover/movies?sortBy=popularity.desc&language=en').catch(() => null),
                    apiFetch('/api/discovery/proxy/discover/movies/upcoming?language=en').catch(() => null),
                    apiFetch('/api/discovery/proxy/discover/tv?sortBy=popularity.desc&language=en').catch(() => null),
                    apiFetch('/api/discovery/proxy/discover/tv/upcoming?language=en').catch(() => null),
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
                                { id: 28, name: 'Action', color: 'from-red-600 to-red-900' },
                                { id: 12, name: 'Adventure', color: 'from-orange-600 to-orange-900' },
                                { id: 16, name: 'Animation', color: 'from-blue-600 to-blue-900' },
                                { id: 35, name: 'Comedy', color: 'from-yellow-500 to-yellow-800' },
                                { id: 80, name: 'Crime', color: 'from-slate-700 to-slate-900' },
                                { id: 99, name: 'Documentary', color: 'from-emerald-600 to-emerald-900' },
                                { id: 18, name: 'Drama', color: 'from-purple-600 to-purple-900' },
                                { id: 14, name: 'Fantasy', color: 'from-fuchsia-600 to-fuchsia-900' },
                                { id: 27, name: 'Horror', color: 'from-red-900 to-black' },
                                { id: 878, name: 'Sci-Fi', color: 'from-cyan-600 to-cyan-900' },
                            ].map((g) => (
                                <div key={g.id} onClick={() => { window.history.pushState({}, '', `/discovery/movies?genre=${g.id}`); window.dispatchEvent(new Event('popstate')); }} className={`w-[140px] h-[80px] sm:w-[180px] sm:h-[100px] flex-shrink-0 rounded-xl bg-gradient-to-br ${g.color} p-4 flex items-end justify-start cursor-pointer hover:scale-105 transition-transform shadow-lg border border-white/10`}>
                                    <span className="text-white font-black drop-shadow-md">{g.name}</span>
                                </div>
                            ))}
                        </Carousel>
                    </div>

                    <div className="flex flex-col gap-3 relative">
                        <h2 className="text-xl font-bold text-white px-2">Studios</h2>
                        <Carousel>
                            {[
                                { id: 2, name: 'Walt Disney', logo: 'https://image.tmdb.org/t/p/w300/wdrCwmRnLFJhEoG8GSfymY85KHT.png' },
                                { id: 25, name: '20th Century', logo: 'https://image.tmdb.org/t/p/w300/qZCc1lty5FzX30aOCVRXrxSRYcF.png' },
                                { id: 5, name: 'Sony Pictures', logo: 'https://image.tmdb.org/t/p/w300/71BqEFAF4V3qjjZAJ6NKeDOP2g4.png' },
                                { id: 174, name: 'Warner Bros', logo: 'https://image.tmdb.org/t/p/w300/ky0xOc5OrhvnX4ElzwaKzG2wz8t.png' },
                                { id: 33, name: 'Universal', logo: 'https://image.tmdb.org/t/p/w300/8lvHyhjvG0bIVMtd1S1sLcwk801.png' },
                                { id: 4, name: 'Paramount', logo: 'https://image.tmdb.org/t/p/w300/fycMZtIsqQ8Qv6iYh8sH0Wp21vV.png' },
                                { id: 41077, name: 'A24', text: true }
                            ].map((c, i) => (
                                c.text ? 
                                <TextCard key={i} name={c.name} onClick={() => { window.history.pushState({}, '', `/discovery/movies?studio=${c.id}`); window.dispatchEvent(new Event('popstate')); }} /> :
                                <ImageCard key={i} name={c.name} logo={c.logo!} onClick={() => { window.history.pushState({}, '', `/discovery/movies?studio=${c.id}`); window.dispatchEvent(new Event('popstate')); }} />
                            ))}
                        </Carousel>
                    </div>

                    {rows.popularSeries?.length > 0 && (
                        <div className="flex flex-col gap-3 relative">
                            <h2 className="text-xl font-bold text-white px-2">Popular Series</h2>
                            <Carousel>
                                {rows.popularSeries.map((item: any, idx: number) => (
                                    <div key={`pop-tv-${idx}`} className="w-[140px] sm:w-[180px] flex-shrink-0">
                                        <DiscoverPosterCard
                                            item={formatItem(item)}
                                            showQualityBadges={true}
                                            onPosterClick={() => onSelect(formatItem(item))}
                                        />
                                    </div>
                                ))}
                            </Carousel>
                        </div>
                    )}

                    <div className="flex flex-col gap-3 relative">
                        <h2 className="text-xl font-bold text-white px-2">Series Genres</h2>
                        <Carousel>
                            {[
                                { id: 10759, name: 'Action & Adventure', color: 'from-purple-700 to-purple-900' },
                                { id: 16, name: 'Animation', color: 'from-cyan-600 to-cyan-800' },
                                { id: 35, name: 'Comedy', color: 'from-amber-500 to-amber-700' },
                                { id: 80, name: 'Crime', color: 'from-blue-700 to-blue-900' },
                                { id: 99, name: 'Documentary', color: 'from-emerald-600 to-emerald-900' },
                                { id: 18, name: 'Drama', color: 'from-pink-700 to-pink-900' },
                                { id: 10765, name: 'Sci-Fi & Fantasy', color: 'from-indigo-600 to-indigo-900' },
                            ].map((g) => (
                                <div key={g.id} onClick={() => { window.history.pushState({}, '', `/discovery/series?genre=${g.id}`); window.dispatchEvent(new Event('popstate')); }} className={`w-[140px] h-[80px] sm:w-[180px] sm:h-[100px] flex-shrink-0 rounded-xl bg-gradient-to-br ${g.color} p-4 flex items-end justify-start cursor-pointer hover:scale-105 transition-transform shadow-lg border border-white/10`}>
                                    <span className="text-white font-black drop-shadow-md">{g.name}</span>
                                </div>
                            ))}
                        </Carousel>
                    </div>

                    <div className="flex flex-col gap-3 relative">
                        <h2 className="text-xl font-bold text-white px-2">Networks</h2>
                        <Carousel>
                            {[
};
