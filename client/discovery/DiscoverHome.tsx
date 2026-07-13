import React, { useState, useEffect } from 'react';
import { apiFetch } from '../shared/api';
import { DiscoverPosterCard } from '../screens';
import { Carousel } from './Carousel';
import { CompanyCard, GenreCard } from './DiscoverCards';
import {
    DISCOVER_NETWORKS,
    DISCOVER_STUDIOS,
    MOVIE_GENRES,
    TV_GENRES,
} from './discoverConstants';
import { enrichDiscoveryItems } from './discoverItemUtils';
import { filterHiddenAvailableItems, useDiscoveryPreferences } from './useDiscoveryPreferences';
import { fetchDiscoverHomeRowResults } from './discoverFetchUtils';

type GenreSliderItem = { id: number; name: string; image?: string };

export const DiscoverHome: React.FC<{
    onSelect: (item: any) => void;
    formatItem: (item: any) => any;
    navigate: (path: string) => void;
}> = ({ onSelect, formatItem, navigate }) => {
    const { preferences, loaded } = useDiscoveryPreferences();
    const [rows, setRows] = useState({
        recentlyAdded: [] as any[],
        recentRequests: [] as any[],
        plexWatchlist: [] as any[],
        trending: [] as any[],
        popularMovies: [] as any[],
        upcomingMovies: [] as any[],
        popularSeries: [] as any[],
        upcomingSeries: [] as any[],
    });
    const [movieGenres, setMovieGenres] = useState<GenreSliderItem[]>([]);
    const [tvGenres, setTvGenres] = useState<GenreSliderItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!loaded) return undefined;
        const fetchData = async () => {
            setLoading(true);
            try {
                const hideAvailable = preferences.hideAvailableMedia;
                const [
                    addedRes, reqRes, watchlistRes, trendingRes,
                    popularMovies,
                    upcomingMovies,
                    popularSeries,
                    upcomingSeries,
                    movieGenreRes, tvGenreRes,
                ] = await Promise.all([
                    hideAvailable
                        ? Promise.resolve(null)
                        : apiFetch('/api/discovery/proxy/media?filter=allavailable&take=20&sort=mediaAdded').catch(() => null),
                    apiFetch('/api/discovery/proxy/request?filter=all&take=20&sort=modified&skip=0').catch(() => null),
                    apiFetch('/api/discovery/proxy/discover/watchlist').catch(() => null),
                    apiFetch('/api/discovery/trending').catch(() => null),
                    fetchDiscoverHomeRowResults(
                        (page) => `/api/discovery/proxy/discover/movies?sortBy=popularity.desc&page=${page}`,
                        hideAvailable,
                    ).catch(() => []),
                    fetchDiscoverHomeRowResults(
                        (page) => `/api/discovery/proxy/discover/movies/upcoming?page=${page}`,
                        hideAvailable,
                    ).catch(() => []),
                    fetchDiscoverHomeRowResults(
                        (page) => `/api/discovery/proxy/discover/tv?sortBy=popularity.desc&page=${page}`,
                        hideAvailable,
                    ).catch(() => []),
                    fetchDiscoverHomeRowResults(
                        (page) => `/api/discovery/proxy/discover/tv/upcoming?page=${page}`,
                        hideAvailable,
                    ).catch(() => []),
                    apiFetch('/api/discovery/proxy/discover/genreslider/movie').catch(() => null),
                    apiFetch('/api/discovery/proxy/discover/genreslider/tv').catch(() => null),
                ]);

                const [
                    recentlyAdded,
                    recentRequests,
                    plexWatchlist,
                ] = await Promise.all([
                    enrichDiscoveryItems(addedRes?.results || []),
                    enrichDiscoveryItems(reqRes?.results || []),
                    enrichDiscoveryItems(watchlistRes?.results || []),
                ]);

                setRows({
                    recentlyAdded,
                    recentRequests: filterHiddenAvailableItems(recentRequests, hideAvailable),
                    plexWatchlist: filterHiddenAvailableItems(plexWatchlist, hideAvailable),
                    trending: filterHiddenAvailableItems(trendingRes?.results || [], hideAvailable),
                    popularMovies,
                    upcomingMovies,
                    popularSeries,
                    upcomingSeries,
                });

                if (Array.isArray(movieGenreRes) && movieGenreRes.length) {
                    setMovieGenres(movieGenreRes);
                }
                if (Array.isArray(tvGenreRes) && tvGenreRes.length) {
                    setTvGenres(tvGenreRes);
                }
            } catch (e) {
                console.error(e);
            }
            setLoading(false);
        };
        fetchData();
        return undefined;
    }, [loaded, preferences.hideAvailableMedia, preferences.discoverLanguage, preferences.discoverRegion]);

    const DiscoveryRow = ({ title, items, onViewAll }: { title: string; items: any[]; onViewAll?: () => void }) => {
        if (!items?.length) return null;
        return (
            <div className="flex flex-col gap-3 relative">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-xl font-bold text-white">{title}</h2>
                    {onViewAll && (
                        <button type="button" onClick={onViewAll} className="text-xs font-bold text-plex hover:underline">
                            View All
                        </button>
                    )}
                </div>
                <Carousel>
                    {items.map((rawItem, idx) => {
                        if (!rawItem) return null;
                        const formatted = formatItem(rawItem);
                        return (
                            <div key={`${title}-${formatted.id || idx}`} className="w-[140px] sm:w-[160px] flex-shrink-0 relative group">
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

    const renderGenreSlider = (
        title: string,
        apiGenres: GenreSliderItem[],
        fallbackGenres: typeof MOVIE_GENRES,
        basePath: '/discovery/movies' | '/discovery/series',
    ) => {
        const items = apiGenres.length
            ? apiGenres
            : fallbackGenres.map((g) => ({ id: g.id, name: g.name, image: undefined as string | undefined }));

        return (
            <div className="flex flex-col gap-3 relative">
                <h2 className="text-xl font-bold text-white px-2">{title}</h2>
                <Carousel>
                    {items.map((g) => {
                        const fallback = fallbackGenres.find((fg) => fg.id === g.id);
                        return (
                            <GenreCard
                                key={g.id}
                                name={g.name}
                                image={g.image}
                                gradient={fallback?.gradient}
                                onClick={() => navigate(`${basePath}?genre=${g.id}`)}
                            />
                        );
                    })}
                </Carousel>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex flex-col gap-8 mt-4 px-2 w-full animate-pulse">
                {[...Array(5)].map((_, r) => (
                    <div key={r} className="flex flex-col gap-3">
                        <div className="w-48 h-6 bg-white/5 rounded px-2 ml-2" />
                        <div className="flex gap-4 overflow-hidden px-2">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="w-[170px] h-[100px] rounded-xl bg-white/5 border border-white/5 flex-shrink-0" />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-10 w-full max-w-full overflow-hidden pb-12">
            <DiscoveryRow title="Recently Added" items={rows.recentlyAdded} />
            <DiscoveryRow title="Recent Requests" items={rows.recentRequests} />
            <DiscoveryRow title="Your Plex Watchlist" items={rows.plexWatchlist} />
            <DiscoveryRow title="Trending" items={rows.trending} />
            <DiscoveryRow title="Popular Movies" items={rows.popularMovies} onViewAll={() => navigate('/discovery/movies')} />
            {renderGenreSlider('Movie Genres', movieGenres, MOVIE_GENRES, '/discovery/movies')}
            <DiscoveryRow title="Upcoming Movies" items={rows.upcomingMovies} />

            <div className="flex flex-col gap-3 relative">
                <h2 className="text-xl font-bold text-white px-2">Studios</h2>
                <Carousel>
                    {DISCOVER_STUDIOS.map((studio) => (
                        <CompanyCard
                            key={studio.id}
                            name={studio.name}
                            logoPath={studio.logoPath}
                            onClick={() => navigate(`/discovery/movies/studio/${studio.id}`)}
                        />
                    ))}
                </Carousel>
            </div>

            <DiscoveryRow title="Popular Series" items={rows.popularSeries} onViewAll={() => navigate('/discovery/series')} />
            {renderGenreSlider('Series Genres', tvGenres, TV_GENRES, '/discovery/series')}
            <DiscoveryRow title="Upcoming Series" items={rows.upcomingSeries} />

            <div className="flex flex-col gap-3 relative">
                <h2 className="text-xl font-bold text-white px-2">Networks</h2>
                <Carousel>
                    {DISCOVER_NETWORKS.map((network) => (
                        <CompanyCard
                            key={`${network.id}-${network.name}`}
                            name={network.name}
                            logoPath={network.logoPath}
                            onClick={() => navigate(`/discovery/series/network/${network.id}`)}
                        />
                    ))}
                </Carousel>
            </div>
        </div>
    );
};
