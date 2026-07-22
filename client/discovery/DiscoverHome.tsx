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
    buildGenreSliderImage,
} from './discoverConstants';
import { enrichDiscoveryItems } from './discoverItemUtils';
import { portalRequestToDiscoveryRowItem } from './myRequestUtils';
import { filterHiddenAvailableItems, useDiscoveryPreferences } from './useDiscoveryPreferences';
import { fetchDiscoverHomeRowResults } from './discoverFetchUtils';
import { enrichDiscoverItemsWithAvailability } from './discoverAvailabilityEnrich';
import { WatchlistPanel } from './WatchlistPanel';
import { DiscoverHomeSkeleton } from '../shared/skeletons';
import { discoveryTheme } from './discoveryThemeClasses';
import { useLibraryQueueToggle } from './useLibraryQueueToggle';
import { DiscoverGridSizeSelect } from './DiscoverGridSizeSelect';
import { useDiscoverGridSize } from './useDiscoverGridSize';
import { discoverRowCardWidthClass } from '../shared/portalLayout';
import { useDiscoverI18n } from './i18n';

type GenreSliderItem = { id: number; name: string; image?: string; backdrops?: string[] };

const mapGenreSliderResponse = (payload: any): GenreSliderItem[] => {
    const list = Array.isArray(payload) ? payload : (Array.isArray(payload?.results) ? payload.results : []);
    return list
        .map((genre: any) => {
            const id = Number(genre?.id);
            const name = String(genre?.name || '').trim();
            if (!Number.isFinite(id) || !name) return null;
            const backdrops = genre?.backdrops || genre?.backdropPaths || genre?.backdrop_paths || [];
            return {
                id,
                name,
                image: genre?.image || buildGenreSliderImage(id, backdrops),
            };
        })
        .filter(Boolean) as GenreSliderItem[];
};

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
    const { t, locale } = useDiscoverI18n();
    const { preferences, loaded } = useDiscoveryPreferences();
    const { showLibraryQueue, toggleLibraryQueue } = useLibraryQueueToggle();
    const [gridSize, setGridSize] = useDiscoverGridSize();
    const posterCardClass = discoverRowCardWidthClass(gridSize);
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
            // Language filtering is applied server-side — only hide-available needs client backfill.
            const rowBackfill = { needsBackfill: hideAvailable, maxPages: hideAvailable ? 6 : 2, maxItems: 24 };
            // Load poster rows first — genre sliders must not block the home skeleton.
            const [
                addedRes, reqRes, watchlistRes, trendingRes,
                popularMovies,
                upcomingMovies,
                popularSeries,
                upcomingSeries,
            ] = await Promise.all([
                hideAvailable
                    ? Promise.resolve(null)
                    : apiFetch('/api/discovery/proxy/media?filter=allavailable&take=40&sort=mediaAdded').catch(() => null),
                apiFetch('/api/discovery/my-requests?filter=all&take=40').catch(() => null),
                apiFetch('/api/discovery/watchlist').catch(() => null),
                fetchDiscoverHomeRowResults(
                    (page) => `/api/discovery/proxy/discover/trending?page=${page}`,
                    hideAvailable,
                    rowBackfill,
                ).catch(() => []),
                fetchDiscoverHomeRowResults(
                    (page) => `/api/discovery/proxy/discover/movies?sortBy=popularity.desc&page=${page}`,
                    hideAvailable,
                    rowBackfill,
                ).catch(() => []),
                fetchDiscoverHomeRowResults(
                    (page) => `/api/discovery/proxy/discover/movies/upcoming?page=${page}`,
                    hideAvailable,
                    rowBackfill,
                ).catch(() => []),
                fetchDiscoverHomeRowResults(
                    (page) => `/api/discovery/proxy/discover/tv?sortBy=popularity.desc&page=${page}`,
                    hideAvailable,
                    rowBackfill,
                ).catch(() => []),
                fetchDiscoverHomeRowResults(
                    (page) => `/api/discovery/proxy/discover/tv/upcoming?page=${page}`,
                    hideAvailable,
                    rowBackfill,
                ).catch(() => []),
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
                trending: trendingRes,
                popularMovies,
                upcomingMovies,
                popularSeries,
                upcomingSeries,
            });
            setLoading(false);

            // Second pass: attach available/requested badges once *arr catalogs are warm.
            void (async () => {
                try {
                    const [
                        trending,
                        popularMoviesEnriched,
                        upcomingMoviesEnriched,
                        popularSeriesEnriched,
                        upcomingSeriesEnriched,
                    ] = await Promise.all([
                        enrichDiscoverItemsWithAvailability(trendingRes),
                        enrichDiscoverItemsWithAvailability(popularMovies),
                        enrichDiscoverItemsWithAvailability(upcomingMovies),
                        enrichDiscoverItemsWithAvailability(popularSeries),
                        enrichDiscoverItemsWithAvailability(upcomingSeries),
                    ]);
                    setRows((prev) => ({
                        ...prev,
                        trending,
                        popularMovies: popularMoviesEnriched,
                        upcomingMovies: upcomingMoviesEnriched,
                        popularSeries: popularSeriesEnriched,
                        upcomingSeries: upcomingSeriesEnriched,
                    }));
                } catch {
                    // Badges are best-effort; first paint already succeeded.
                }
            })();

            // Genre sliders after rows are visible (best-effort, no per-genre fan-out).
            try {
                const [movieGenreRes, tvGenreRes] = await Promise.all([
                    apiFetch('/api/discovery/proxy/discover/genreslider/movie').catch(() => null),
                    apiFetch('/api/discovery/proxy/discover/genreslider/tv').catch(() => null),
                ]);
                const mappedMovies = mapGenreSliderResponse(movieGenreRes);
                const mappedTv = mapGenreSliderResponse(tvGenreRes);
                setMovieGenres(mappedMovies.length
                    ? mappedMovies
                    : MOVIE_GENRES.map((g) => ({ id: g.id, name: g.name })));
                setTvGenres(mappedTv.length
                    ? mappedTv
                    : TV_GENRES.map((g) => ({ id: g.id, name: g.name })));
            } catch {
                setMovieGenres(MOVIE_GENRES.map((g) => ({ id: g.id, name: g.name })));
                setTvGenres(TV_GENRES.map((g) => ({ id: g.id, name: g.name })));
            }
        } catch (e) {
            console.error(e);
            setLoading(false);
        }
    }, [loaded, preferences.hideAvailableMedia, preferences.discoverLanguage, preferences.discoverRegion, locale]);

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
                                {t('common.viewAll')}
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
                            {t('common.viewAll')}
                        </button>
                    )}
                </div>
                <Carousel>
                    {items.map((rawItem, idx) => {
                        if (!rawItem) return null;
                        const formatted = formatItem(rawItem);
                        return (
                            <div key={`${title}-${formatted.id || idx}`} className={`${posterCardClass} flex-shrink-0 relative group`}>
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
                        <p className={discoveryTheme.personalEyebrow}>{t('home.forYou')}</p>
                        <h2 className="text-lg sm:text-xl font-black text-text mt-1">{t('home.libraryQueue')}</h2>
                        {showLibraryQueue && (
                            <p className="text-sm text-muted mt-1">{t('home.libraryQueueHint')}</p>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={toggleLibraryQueue}
                        className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-white/5 hover:bg-white/10 text-xs font-bold text-muted hover:text-text transition-colors"
                        aria-expanded={showLibraryQueue}
                        aria-controls="discover-library-queue"
                        title={showLibraryQueue ? t('home.hideLibraryQueue') : t('home.showLibraryQueue')}
                    >
                        {showLibraryQueue ? t('common.hide') : t('common.show')}
                        {showLibraryQueue ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                </div>

                {showLibraryQueue && (
                    <div id="discover-library-queue" className="flex flex-col gap-5">
                        <DiscoveryRow
                            title={t('home.yourRequests')}
                            items={rows.recentRequests}
                            onViewAll={() => navigate('/discovery/requests')}
                            empty={(
                                <EmptyRail
                                    title={t('home.noRequestsTitle')}
                                    body={t('home.noRequestsBody')}
                                    actionLabel={t('home.browseMovies')}
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
                                rowCardClassName={posterCardClass}
                            />
                        ) : (
                            <div className="flex flex-col gap-2">
                                <h2 className={`${discoveryTheme.sectionTitle} px-2`}>{t('watchlist.title', { provider: providerLabel })}</h2>
                                <EmptyRail
                                    title={t('home.watchlistEmptyTitle')}
                                    body={t('home.watchlistEmptyBody', { provider: providerLabel })}
                                    actionLabel={t('home.seeTrending')}
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
                <div className="px-3 flex items-end justify-between gap-3 flex-wrap">
                    <div>
                        <p className={discoveryTheme.personalEyebrow}>{t('home.browse')}</p>
                        <h2 className="text-lg sm:text-xl font-black text-text mt-1">{t('home.whatsPopular')}</h2>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                        <DiscoverGridSizeSelect value={gridSize} onChange={setGridSize} />
                        <button
                            type="button"
                            onClick={() => navigate('/discovery/movies')}
                            className="text-xs font-bold text-plex hover:underline inline-flex items-center gap-1"
                        >
                            <Film className="w-3.5 h-3.5" /> {t('home.allMovies')}
                        </button>
                    </div>
                </div>

                <DiscoveryRow title={t('home.recentlyAdded')} items={rows.recentlyAdded} />
                <div id="discover-trending">
                    <DiscoveryRow title={t('home.trending')} items={rows.trending} />
                </div>
                <DiscoveryRow title={t('home.popularMovies')} items={rows.popularMovies} onViewAll={() => navigate('/discovery/movies')} />
                {renderGenreSlider(t('home.movieGenres'), movieGenres, MOVIE_GENRES, '/discovery/movies')}
                <DiscoveryRow title={t('home.upcomingMovies')} items={rows.upcomingMovies} />

                <div className="flex flex-col gap-2 relative rounded-2xl border border-border/60 bg-white/[0.02] p-3 sm:p-4">
                    <h2 className={`${discoveryTheme.sectionTitle} px-1 pr-16`}>{t('home.studios')}</h2>
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

                <DiscoveryRow title={t('home.popularSeries')} items={rows.popularSeries} onViewAll={() => navigate('/discovery/series')} />
                {renderGenreSlider(t('home.seriesGenres'), tvGenres, TV_GENRES, '/discovery/series')}
                <DiscoveryRow title={t('home.upcomingSeries')} items={rows.upcomingSeries} />

                <div className="flex flex-col gap-2 relative rounded-2xl border border-border/60 bg-white/[0.02] p-3 sm:p-4">
                    <h2 className={`${discoveryTheme.sectionTitle} px-1 pr-16`}>{t('home.networks')}</h2>
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
