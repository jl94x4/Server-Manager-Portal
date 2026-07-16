import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DiscoverHeroHeader } from './DiscoverHeroHeader';
import { DiscoverHome } from './DiscoverHome';
import { DiscoverMovies } from './DiscoverMovies';
import { DiscoverSeries } from './DiscoverSeries';
import { DiscoverCategoryPage } from './DiscoverCategoryPage';
import { MediaDetailsPage } from './MediaDetailsPage';
import { PersonDetailsPage } from './PersonDetailsPage';
import { Film, Tv, Compass, ClipboardList, AlertTriangle, ChevronDown } from 'lucide-react';
import { apiFetch } from '../shared/api';
import { portalUrl, stripBasePath } from '../shared/basePath';
import { normalizeRawDiscoveryItem } from './discoverItemUtils';
import { resolveMediaAvailabilityState } from './discoverAvailability';
import { DiscoverStatusOverlay } from './DiscoverStatusOverlay';
import { MyRequestsPage } from './MyRequestsPage';
import { MyIssuesPage } from './MyIssuesPage';
import { useMyRequestCount } from './useMyRequestCount';
import { useMyIssueCount } from './useMyIssueCount';
import { useDiscoveryMe } from './useDiscoveryMe';
import { WatchlistPage } from './WatchlistPage';
import { scrollPortalToTop } from './discoverNavigationUtils';
import { discoveryTheme } from './discoveryThemeClasses';

export const DiscoveryDashboard: React.FC<{
    onItemClick: (item: any) => void;
    pushToast?: (msg: string, type: 'success' | 'error') => void;
    mediaServerType?: string;
}> = ({ pushToast, mediaServerType = 'plex' }) => {
    const [path, setPath] = useState(() => {
        if (typeof window !== 'undefined') return window.location.pathname;
        return '/discovery';
    });

    const [query, setQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const searchInputRef = useRef<HTMLInputElement | null>(null);
    const { pendingCount: myPendingCount, refresh: refreshMyRequestCount } = useMyRequestCount(true);
    const { openCount: myOpenIssueCount, refresh: refreshMyIssueCount } = useMyIssueCount(true);
    const { profile: discoveryMe } = useDiscoveryMe(true);
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
    const providerLabel = String(mediaServerType || 'plex').toLowerCase() === 'jellyfin'
        ? 'Jellyfin'
        : String(mediaServerType || 'plex').toLowerCase() === 'emby'
            ? 'Emby'
            : 'Plex';

    const refreshPath = useCallback(() => {
        setPath(window.location.pathname);
    }, []);

    useEffect(() => {
        const handlePopState = () => refreshPath();
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [refreshPath]);

    useEffect(() => {
        scrollPortalToTop();
    }, [path]);

    const navigate = useCallback((newPath: string) => {
        const [pathname, ...rest] = newPath.split('?');
        const search = rest.length ? `?${rest.join('?')}` : '';
        const target = `${portalUrl(pathname)}${search}`;
        window.history.pushState({}, '', target);
        setPath(window.location.pathname);
        setSearchOpen(false);
        scrollPortalToTop();
        window.dispatchEvent(new Event('portal-discovery-navigate'));
    }, []);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
            const target = event.target as HTMLElement | null;
            const tag = target?.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable) return;
            event.preventDefault();
            searchInputRef.current?.focus();
            searchInputRef.current?.select();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);

    useEffect(() => {
        const q = query.trim();
        if (q.length < 2) {
            setSearchResults([]);
            setSearchLoading(false);
            return undefined;
        }
        setSearchLoading(true);
        const timer = window.setTimeout(async () => {
            try {
                const res = await apiFetch(`/api/discovery/search?query=${encodeURIComponent(q)}`);
                setSearchResults(Array.isArray(res?.results) ? res.results : []);
                setSearchOpen(true);
            } catch (e) {
                console.error(e);
                setSearchResults([]);
            } finally {
                setSearchLoading(false);
            }
        }, 350);
        return () => window.clearTimeout(timer);
    }, [query]);

    const formatItem = (rawItem: any) => {
        const item = normalizeRawDiscoveryItem(rawItem);
        const isPerson = item.mediaType === 'person';
        const isMovie = item.mediaType === 'movie';
        const title = isPerson ? item.name : (isMovie ? (item.title || item.name) : (item.name || item.title));
        const year = (item.releaseDate || item.firstAirDate || '').substring(0, 4);
        const posterUrl = item.posterPath ? `https://image.tmdb.org/t/p/w342${item.posterPath}` : '';
        const profileUrl = item.profilePath ? `https://image.tmdb.org/t/p/w185${item.profilePath}` : '';
        const overview = item.overview;
        const mediaType = isPerson ? 'person' : (isMovie ? 'movie' : 'tv');

        const availability = resolveMediaAvailabilityState(item);
        const overlay = !isPerson && availability.kind !== 'none'
            ? <DiscoverStatusOverlay state={availability} />
            : null;

        return {
            ...item,
            id: item.tmdbId || item.id,
            mediaType,
            title,
            year,
            thumbUrl: isPerson ? profileUrl : posterUrl,
            overview,
            type: mediaType,
            tags: [isPerson ? 'Person' : (isMovie ? 'Movie' : 'TV Show')],
            status: item.mediaInfo?.status,
            availability,
            isAvailable: availability.kind === 'available',
            isPartial: availability.kind === 'partial',
            isPending: availability.kind === 'pending' || availability.kind === 'processing',
            overlay,
        };
    };

    const heroProps = {
        query,
        searchOpen,
        searchLoading,
        searchResults,
        onClose: () => setSearchOpen(false),
        onClear: () => { setQuery(''); setSearchOpen(false); setSearchResults([]); },
        onQueryChange: setQuery,
        onFocus: () => query.trim().length >= 2 && setSearchOpen(true),
        formatItem,
        navigate,
        searchInputRef,
        onSelect: (formatted: any) => {
            if (formatted.type === 'person') {
                navigate(`/discovery/person/${formatted.id}`);
            } else {
                navigate(`/discovery/${formatted.type}/${formatted.id}`);
            }
        },
    };

    const routeParts = stripBasePath(path).split('/').filter(Boolean);
    const subRoute = routeParts[1] || 'home';

    if (routeParts.length >= 4 && routeParts[1] === 'movies' && routeParts[2] === 'studio') {
        const id = parseInt(routeParts[3], 10);
        if (!Number.isNaN(id)) {
            return (
                <DiscoverCategoryPage
                    kind="studio"
                    id={id}
                    onBack={() => navigate('/discovery')}
                    onSelect={(item) => navigate(`/discovery/${item.type}/${item.id}`)}
                    formatItem={formatItem}
                />
            );
        }
    }

    if (routeParts.length >= 4 && routeParts[1] === 'series' && routeParts[2] === 'network') {
        const id = parseInt(routeParts[3], 10);
        if (!Number.isNaN(id)) {
            return (
                <DiscoverCategoryPage
                    kind="network"
                    id={id}
                    onBack={() => navigate('/discovery')}
                    onSelect={(item) => navigate(`/discovery/${item.type}/${item.id}`)}
                    formatItem={formatItem}
                />
            );
        }
    }

    if (routeParts.length >= 3 && routeParts[1] === 'person') {
        const id = parseInt(routeParts[2], 10);
        return (
            <PersonDetailsPage
                personId={id}
                onBack={() => window.history.back()}
                onSelect={(item) => navigate(`/discovery/${item.type}/${item.id}`)}
                formatItem={formatItem}
            />
        );
    }

    if (routeParts.length >= 3 && (routeParts[1] === 'movie' || routeParts[1] === 'tv')) {
        const type = routeParts[1] as 'movie' | 'tv';
        const id = parseInt(routeParts[2], 10);
        return (
            <MediaDetailsPage
                mediaType={type}
                mediaId={id}
                onBack={() => navigate('/discovery')}
                formatItem={formatItem}
                pushToast={pushToast}
            />
        );
    }

    const showTabs = ['home', 'movies', 'series', 'requests', 'issues'].includes(subRoute);

    if (subRoute === 'watchlist') {
        return (
            <div className="discovery-theme w-full flex flex-col gap-4 pb-8">
                <DiscoverHeroHeader {...heroProps} />
                <WatchlistPage
                    formatItem={formatItem}
                    onSelect={(item) => navigate(`/discovery/${item.type}/${item.id}`)}
                    navigate={navigate}
                    pushToast={pushToast}
                    providerLabel={providerLabel}
                />
            </div>
        );
    }

    const canSeeIssuesTab = Boolean(
        discoveryMe?.permissions?.createIssues || discoveryMe?.permissions?.viewIssues
    );

    const tabs = [
        { id: 'home', path: '/discovery', label: 'Discover', icon: Compass, count: 0, countColor: '' },
        { id: 'movies', path: '/discovery/movies', label: 'Movies', icon: Film, count: 0, countColor: '' },
        { id: 'series', path: '/discovery/series', label: 'Series', icon: Tv, count: 0, countColor: '' },
        { id: 'requests', path: '/discovery/requests', label: 'My Requests', icon: ClipboardList, count: myPendingCount, countColor: 'bg-plex/25 text-plex' },
        ...(canSeeIssuesTab
            ? [{ id: 'issues', path: '/discovery/issues', label: 'My Issues', icon: AlertTriangle, count: myOpenIssueCount, countColor: 'bg-amber-500/25 text-amber-300' }]
            : []),
    ];

    const activeTab = tabs.find(t => t.id === subRoute) || tabs[0];
    const ActiveIcon = activeTab.icon;

    const renderTabBadge = (tab: typeof tabs[number], active: boolean) => {
        if (!tab.count) return null;
        return (
            <span className={`min-w-[1.25rem] h-5 px-1.5 rounded-full text-[10px] font-black inline-flex items-center justify-center ${
                active ? (tab.countColor || 'bg-plex/25 text-plex') : 'bg-plex text-background'
            }`}>
                {tab.count > 99 ? '99+' : tab.count}
            </span>
        );
    };

    return (
        <div className="discovery-theme w-full flex flex-col gap-4 pb-8">
            <DiscoverHeroHeader {...heroProps} />

            {showTabs && (
                <>
                    <div className={`w-full ${discoveryTheme.tabSticky}`}>
                        <div className="sm:hidden relative">
                            <button
                                type="button"
                                onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
                                className={discoveryTheme.mobileNavBtn}
                            >
                                <span className="flex items-center gap-2">
                                    <ActiveIcon className="w-5 h-5" /> {activeTab.label}
                                    {renderTabBadge(activeTab, true)}
                                </span>
                                <ChevronDown className={`w-5 h-5 transition-transform ${isMobileNavOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isMobileNavOpen && (
                                <div className={discoveryTheme.mobileNavMenu}>
                                    {tabs.map(tab => (
                                        <button
                                            key={tab.id}
                                            type="button"
                                            onClick={() => { navigate(tab.path); setIsMobileNavOpen(false); }}
                                            className={`${discoveryTheme.mobileNavItem} ${tab.id === subRoute ? discoveryTheme.mobileNavItemActive : ''}`}
                                        >
                                            <tab.icon className="w-5 h-5" /> {tab.label}
                                            {tab.count > 0 && (
                                                <span className="ml-auto min-w-[1.25rem] h-5 px-1.5 rounded-full bg-plex text-black text-[10px] font-black inline-flex items-center justify-center">
                                                    {tab.count > 99 ? '99+' : tab.count}
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className={`hidden sm:flex ${discoveryTheme.tabBar}`}>
                            {tabs.map(tab => {
                                const active = tab.id === subRoute;
                                return (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => navigate(tab.path)}
                                        className={`${discoveryTheme.tab} ${active ? discoveryTheme.tabActive : ''}`}
                                    >
                                        <tab.icon className="w-4 h-4" />
                                        {tab.label}
                                        {renderTabBadge(tab, active)}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="w-full mt-1">
                        {subRoute === 'home' && (
                    <DiscoverHome
                        onSelect={(item) => navigate(`/discovery/${item.type}/${item.id}`)}
                        formatItem={formatItem}
                        navigate={navigate}
                        pushToast={pushToast}
                        providerLabel={providerLabel}
                    />
                        )}
                        {subRoute === 'movies' && (
                            <DiscoverMovies
                                onSelect={(item) => navigate(`/discovery/${item.type}/${item.id}`)}
                                formatItem={formatItem}
                                navigate={navigate}
                            />
                        )}
                        {subRoute === 'series' && (
                            <DiscoverSeries
                                onSelect={(item) => navigate(`/discovery/${item.type}/${item.id}`)}
                                formatItem={formatItem}
                                navigate={navigate}
                            />
                        )}
                        {subRoute === 'requests' && (
                            <MyRequestsPage
                                navigate={navigate}
                                pushToast={pushToast}
                                onCountsChange={refreshMyRequestCount}
                            />
                        )}
                        {subRoute === 'issues' && (
                            <MyIssuesPage
                                navigate={navigate}
                                pushToast={pushToast}
                                onCountsChange={refreshMyIssueCount}
                            />
                        )}
                    </div>
                </>
            )}
        </div>
    );
};
