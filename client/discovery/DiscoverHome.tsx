import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronUp, ClipboardList, Film, Sparkles } from 'lucide-react';
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
import { portalRequestToDiscoveryRowItem } from './myRequestUtils';
import { filterHiddenAvailableItems, useDiscoveryPreferences } from './useDiscoveryPreferences';
import { fetchDiscoverHomeRowResults } from './discoverFetchUtils';
import { WatchlistPanel } from './WatchlistPanel';
import { DiscoverHomeSkeleton } from '../shared/skeletons';
import { discoveryTheme } from './discoveryThemeClasses';
import { useLibraryQueueToggle } from './useLibraryQueueToggle';

type GenreSliderItem = { id: number; name: string; image?: string };

const EmptyRail: React.FC<{
    title: string;
    body: string;
    actionLabel: string;
    onAction: () => void;
    icon: React.ReactNode;
}> = ({ title, body, actionLabel, onAction, icon }) => (
    <div className={`${discoveryTheme.emptyState} !py-8 px-4 flex flex-col items-center gap-3`}>
        <div className="w-10 h-10 rounded-full bg-plex/15 text-plex flex items-center justify-center">
            {icon}
        </div>
        <div>
            <p className={discoveryTheme.emptyTitle}>{title}</p>
            <p className={discoveryTheme.emptyBody}>{body}</p>
        </div>
        <button
            type="button"
            onClick={onAction}
            className="mt-1 px-4 py-2 rounded-lg bg-plex text-black text-xs font-black hover:bg-plex-hover transition-colors"
        >
            {actionLabel}
        </button>
    </div>
);

export const DiscoverHome: React.FC<{
    onSelect: (item: any) => void;
    formatItem: (item: any) => any;
    navigate: (path: string) => void;
    pushToast?: (msg: string, type: 'success' | 'error') => void;
    providerLabel?: string;
}> = ({ onSelect, formatItem, navigate, pushToast, providerLabel = 'Plex' }) => {
    const { preferences, loaded } = useDiscoveryPreferences();
    const { showLibraryQueue, toggleLibraryQueue } = useLibraryQueueToggle();
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

    const loadData = useCallback(async () => {
        if (!loaded) return;
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
                    : apiFetch('/api/discovery/proxy/media?filter=allavailable&take=40&sort=mediaAdded').catch(() => null),
                apiFetch('/api/discovery/my-requests?filter=all&take=40').catch(() => null),
                apiFetch('/api/discovery/watchlist').catch(() => null),
                fetchDiscoverHomeRowResults(
                    (page) => `/api/discovery/proxy/discover/trending?page=${page}`,
                    hideAvailable,
                ).catch(() => []),
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

            const myRequestItems = Array.isArray(reqRes?.results)
                ? reqRes.results.map(portalRequestToDiscoveryRowItem)
                : [];

            const [
                recentlyAdded,
                recentRequests,
                plexWatchlist,
            ] = await Promise.all([
                enrichDiscoveryItems(addedRes?.results || []),
                enrichDiscoveryItems(myRequestItems),
                enrichDiscoveryItems(watchlistRes?.results || []),
            ]);

            setRows({
                recentlyAdded,
                recentRequests: filterHiddenAvailableItems(recentRequests, hideAvailable),
                plexWatchlist,
                trending: Array.isArray(trendingRes) ? trendingRes : filterHiddenAvailableItems(trendingRes?.results || [], hideAvailable),
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
    }, [loaded, preferences.hideAvailableMedia, preferences.discoverLanguage, preferences.discoverRegion]);

    useEffect(() => {
        loadData();
        return undefined;
    }, [loadData]);

    const DiscoveryRow = ({
        title,
        items,
        onViewAll,
        empty,
    }: {
        title: string;
        items: any[];
        onViewAll?: () => void;
        empty?: React.ReactNode;
    }) => {
        if (!items?.length) {
            if (!empty) return null;
            return (
                <div className="flex flex-col gap-2 relative">
                    <div className="flex items-center gap-3 min-w-0 px-2 pr-16">
                        <h2 className={`${discoveryTheme.sectionTitle} truncate`}>{title}</h2>
                        {onViewAll && (
                            <button type="button" onClick={onViewAll} className="shrink-0 text-xs font-bold text-plex hover:underline">
                                View All
                            </button>
                        )}
                    </div>
                    {empty}
                </div>
            );
        }
        return (
            <div className="flex flex-col gap-2 relative">
                <div className="flex items-center gap-3 min-w-0 px-2 pr-16">
                    <h2 className={`${discoveryTheme.sectionTitle} truncate`}>{title}</h2>
                    {onViewAll && (
                        <button type="button" onClick={onViewAll} className="shrink-0 text-xs font-bold text-plex hover:underline">
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
            <div className="flex flex-col gap-2 relative">
                <h2 className={`${discoveryTheme.sectionTitle} px-2 pr-16`}>{title}</h2>
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
        return <DiscoverHomeSkeleton />;
    }

    return (
        <div className="flex flex-col gap-6 w-full max-w-full overflow-hidden pb-8 px-1">
            <section className={discoveryTheme.personalPanel}>
                <div className="px-1 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className={discoveryTheme.personalEyebrow}>For you</p>
                        <h2 className="text-lg sm:text-xl font-black text-text mt-1">Your library queue</h2>
                        {showLibraryQueue && (
                            <p className="text-sm text-muted mt-1">Requests and watchlist first — then browse what’s new.</p>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={toggleLibraryQueue}
                        className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-white/5 hover:bg-white/10 text-xs font-bold text-muted hover:text-text transition-colors"
                        aria-expanded={showLibraryQueue}
                        aria-controls="discover-library-queue"
                        title={showLibraryQueue ? 'Hide library queue' : 'Show library queue'}
                    >
                        {showLibraryQueue ? 'Hide' : 'Show'}
                        {showLibraryQueue ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                </div>

                {showLibraryQueue && (
                    <div id="discover-library-queue" className="flex flex-col gap-5">
                        <DiscoveryRow
                            title="Your Requests"
                            items={rows.recentRequests}
                            onViewAll={() => navigate('/discovery/requests')}
                            empty={(
                                <EmptyRail
                                    title="No requests yet"
                                    body="Find something good and send it to the queue."
                                    actionLabel="Browse movies"
                                    onAction={() => navigate('/discovery/movies')}
                                    icon={<ClipboardList className="w-5 h-5" />}
                                />
                            )}
                        />

                        {rows.plexWatchlist.length > 0 ? (
                            <WatchlistPanel
                                items={rows.plexWatchlist}
                                formatItem={formatItem}
                                onSelect={onSelect}
                                navigate={navigate}
                                pushToast={pushToast}
                                onRefresh={loadData}
                                variant="row"
                                providerLabel={providerLabel}
                            />
                        ) : (
                            <div className="flex flex-col gap-2">
                                <h2 className={`${discoveryTheme.sectionTitle} px-2`}>Your {providerLabel} Watchlist</h2>
                                <EmptyRail
                                    title="Watchlist is empty"
                                    body={`Sync from ${providerLabel} in Seerr, or start from trending titles.`}
                                    actionLabel="See trending"
                                    onAction={() => {
                                        document.getElementById('discover-trending')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    }}
                                    icon={<Sparkles className="w-5 h-5" />}
                                />
                            </div>
                        )}
                    </div>
                )}
            </section>

            <section className={discoveryTheme.browseSection}>
                <div className="px-3 flex items-end justify-between gap-3">
                    <div>
                        <p className={discoveryTheme.personalEyebrow}>Browse</p>
                        <h2 className="text-lg sm:text-xl font-black text-text mt-1">What’s popular</h2>
                    </div>
                    <button
                        type="button"
                        onClick={() => navigate('/discovery/movies')}
                        className="text-xs font-bold text-plex hover:underline inline-flex items-center gap-1"
                    >
                        <Film className="w-3.5 h-3.5" /> All movies
                    </button>
                </div>

                <DiscoveryRow title="Recently Added" items={rows.recentlyAdded} />
                <div id="discover-trending">
                    <DiscoveryRow title="Trending" items={rows.trending} />
                </div>
                <DiscoveryRow title="Popular Movies" items={rows.popularMovies} onViewAll={() => navigate('/discovery/movies')} />
                {renderGenreSlider('Movie Genres', movieGenres, MOVIE_GENRES, '/discovery/movies')}
                <DiscoveryRow title="Upcoming Movies" items={rows.upcomingMovies} />

                <div className="flex flex-col gap-2 relative rounded-2xl border border-border/60 bg-white/[0.02] p-3 sm:p-4">
                    <h2 className={`${discoveryTheme.sectionTitle} px-1 pr-16`}>Studios</h2>
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

                <div className="flex flex-col gap-2 relative rounded-2xl border border-border/60 bg-white/[0.02] p-3 sm:p-4">
                    <h2 className={`${discoveryTheme.sectionTitle} px-1 pr-16`}>Networks</h2>
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
            </section>
        </div>
    );
};
