import React, { useState, useEffect, useCallback } from 'react';
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
import { WatchlistPage } from './WatchlistPage';
import { scrollPortalToTop } from './discoverNavigationUtils';

export const DiscoveryDashboard: React.FC<{
    onItemClick: (item: any) => void;
    pushToast?: (msg: string, type: 'success' | 'error') => void;
}> = ({ pushToast }) => {
    const [path, setPath] = useState(() => {
        if (typeof window !== 'undefined') return window.location.pathname;
        return '/discovery';
    });

    const [query, setQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const { pendingCount: myPendingCount, refresh: refreshMyRequestCount } = useMyRequestCount(true);
    const { openCount: myOpenIssueCount, refresh: refreshMyIssueCount } = useMyIssueCount(true);
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

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
            <div className="w-full flex flex-col gap-8 pb-12">
                <DiscoverHeroHeader
                    query={query}
                    searchOpen={searchOpen}
                    searchLoading={searchLoading}
                    searchResults={searchResults}
                    onClose={() => setSearchOpen(false)}
                    onClear={() => { setQuery(''); setSearchOpen(false); setSearchResults([]); }}
                    onQueryChange={setQuery}
                    onFocus={() => query.trim().length >= 2 && setSearchOpen(true)}
                    formatItem={formatItem}
                    onSelect={(formatted) => {
                        if (formatted.type === 'person') {
                            navigate(`/discovery/person/${formatted.id}`);
                        } else {
                            navigate(`/discovery/${formatted.type}/${formatted.id}`);
                        }
                    }}
                />
                <WatchlistPage
                    formatItem={formatItem}
                    onSelect={(item) => navigate(`/discovery/${item.type}/${item.id}`)}
                    navigate={navigate}
                    pushToast={pushToast}
                />
            </div>
        );
    }

    const tabs = [
        { id: 'home', path: '/discovery', label: 'Discover', icon: Compass, count: 0, countColor: '' },
        { id: 'movies', path: '/discovery/movies', label: 'Movies', icon: Film, count: 0, countColor: '' },
        { id: 'series', path: '/discovery/series', label: 'Series', icon: Tv, count: 0, countColor: '' },
        { id: 'requests', path: '/discovery/requests', label: 'My Requests', icon: ClipboardList, count: myPendingCount, countColor: 'bg-plex text-black' },
        { id: 'issues', path: '/discovery/issues', label: 'My Issues', icon: AlertTriangle, count: myOpenIssueCount, countColor: 'bg-amber-500 text-black' },
    ];

    const activeTab = tabs.find(t => t.id === subRoute) || tabs[0];
    const ActiveIcon = activeTab.icon;

    return (
        <div className="w-full flex flex-col gap-8 pb-12">
            <DiscoverHeroHeader
                query={query}
                searchOpen={searchOpen}
                searchLoading={searchLoading}
                searchResults={searchResults}
                onClose={() => setSearchOpen(false)}
                onClear={() => { setQuery(''); setSearchOpen(false); setSearchResults([]); }}
                onQueryChange={setQuery}
                onFocus={() => query.trim().length >= 2 && setSearchOpen(true)}
                formatItem={formatItem}
                onSelect={(formatted) => {
                    if (formatted.type === 'person') {
                        navigate(`/discovery/person/${formatted.id}`);
                    } else {
                        navigate(`/discovery/${formatted.type}/${formatted.id}`);
                    }
                }}
            />

            {showTabs && (
                <>
                    <div className="w-full px-4 mb-4 mt-[-16px]">
                        {/* Mobile Dropdown */}
                        <div className="sm:hidden relative">
                            <button 
                                type="button"
                                onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
                                className="w-full flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 text-white font-bold"
                            >
                                <span className="flex items-center gap-2">
                                    <ActiveIcon className="w-5 h-5" /> {activeTab.label}
                                    {activeTab.count > 0 && (
                                        <span className={`ml-1 min-w-[1.25rem] h-5 px-1.5 rounded-full ${activeTab.countColor} text-[10px] font-black inline-flex items-center justify-center`}>
                                            {activeTab.count > 99 ? '99+' : activeTab.count}
                                        </span>
                                    )}
                                </span>
                                <ChevronDown className={`w-5 h-5 transition-transform ${isMobileNavOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isMobileNavOpen && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1b1e] border border-white/10 rounded-lg shadow-xl overflow-hidden z-50">
                                    {tabs.map(tab => (
                                        <button
                                            key={tab.id}
                                            type="button"
                                            onClick={() => { navigate(tab.path); setIsMobileNavOpen(false); }}
                                            className={`w-full flex items-center gap-2 p-3 text-left hover:bg-white/5 ${tab.id === subRoute ? 'text-white bg-white/5' : 'text-white/60'}`}
                                        >
                                            <tab.icon className="w-5 h-5" /> {tab.label}
                                            {tab.count > 0 && (
                                                <span className={`ml-auto min-w-[1.25rem] h-5 px-1.5 rounded-full ${tab.countColor} text-[10px] font-black inline-flex items-center justify-center`}>
                                                    {tab.count > 99 ? '99+' : tab.count}
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Desktop Tabs */}
                        <div className="hidden sm:flex border-b border-white/10">
                            <div className="flex gap-8">
                                {tabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => navigate(tab.path)}
                                        className={`flex items-center gap-2 pb-4 border-b-2 font-bold transition-all whitespace-nowrap ${tab.id === subRoute ? 'border-plex text-white' : 'border-transparent text-white/50 hover:text-white/80'}`}
                                    >
                                        <tab.icon className="w-5 h-5" /> {tab.label}
                                        {tab.count > 0 && (
                                            <span className={`ml-1 min-w-[1.25rem] h-5 px-1.5 rounded-full ${tab.countColor} text-[10px] font-black inline-flex items-center justify-center`}>
                                                {tab.count > 99 ? '99+' : tab.count}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="w-full mt-4">
                        {subRoute === 'home' && (
                            <DiscoverHome
                                onSelect={(item) => navigate(`/discovery/${item.type}/${item.id}`)}
                                formatItem={formatItem}
                                navigate={navigate}
                                pushToast={pushToast}
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
