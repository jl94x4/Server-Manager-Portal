import React, { useState, useEffect, useCallback } from 'react';
import { DiscoverHeroHeader } from './DiscoverHeroHeader';
import { DiscoverHome } from './DiscoverHome';
import { DiscoverMovies } from './DiscoverMovies';
import { DiscoverSeries } from './DiscoverSeries';
import { DiscoverCategoryPage } from './DiscoverCategoryPage';
import { MediaDetailsPage } from './MediaDetailsPage';
import { PersonDetailsPage } from './PersonDetailsPage';
import { Film, Tv, Compass, ClipboardList, AlertTriangle } from 'lucide-react';
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

    const showTabs = ['home', 'movies', 'series', 'requests'].includes(subRoute);

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

    if (subRoute === 'issues') {
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
                <div className="flex w-full border-b border-white/10 px-4 mt-[-16px]">
                    <div className="flex gap-8 overflow-x-auto custom-scrollbar">
                        <button type="button" onClick={() => navigate('/discovery')} className="flex items-center gap-2 pb-4 border-b-2 font-bold transition-all border-transparent text-white/50 hover:text-white/80 whitespace-nowrap">
                            <Compass className="w-5 h-5" /> Discover
                        </button>
                        <button type="button" onClick={() => navigate('/discovery/movies')} className="flex items-center gap-2 pb-4 border-b-2 font-bold transition-all border-transparent text-white/50 hover:text-white/80 whitespace-nowrap">
                            <Film className="w-5 h-5" /> Movies
                        </button>
                        <button type="button" onClick={() => navigate('/discovery/series')} className="flex items-center gap-2 pb-4 border-b-2 font-bold transition-all border-transparent text-white/50 hover:text-white/80 whitespace-nowrap">
                            <Tv className="w-5 h-5" /> Series
                        </button>
                        <button type="button" onClick={() => navigate('/discovery/requests')} className="flex items-center gap-2 pb-4 border-b-2 font-bold transition-all border-transparent text-white/50 hover:text-white/80 whitespace-nowrap">
                            <ClipboardList className="w-5 h-5" /> My Requests
                            {myPendingCount > 0 && (
                                <span className="ml-1 min-w-[1.25rem] h-5 px-1.5 rounded-full bg-plex text-black text-[10px] font-black inline-flex items-center justify-center">
                                    {myPendingCount > 99 ? '99+' : myPendingCount}
                                </span>
                            )}
                        </button>
                        <button type="button" onClick={() => navigate('/discovery/issues')} className="flex items-center gap-2 pb-4 border-b-2 font-bold transition-all border-plex text-white whitespace-nowrap">
                            <AlertTriangle className="w-5 h-5" /> My Issues
                            {myOpenIssueCount > 0 && (
                                <span className="ml-1 min-w-[1.25rem] h-5 px-1.5 rounded-full bg-amber-500 text-black text-[10px] font-black inline-flex items-center justify-center">
                                    {myOpenIssueCount > 99 ? '99+' : myOpenIssueCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
                <MyIssuesPage
                    navigate={navigate}
                    pushToast={pushToast}
                    onCountsChange={refreshMyIssueCount}
                />
            </div>
        );
    }

    if (subRoute === 'requests') {
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
                <div className="flex w-full border-b border-white/10 px-4 mt-[-16px]">
                    <div className="flex gap-8 overflow-x-auto custom-scrollbar">
                        <button type="button" onClick={() => navigate('/discovery')} className="flex items-center gap-2 pb-4 border-b-2 font-bold transition-all border-transparent text-white/50 hover:text-white/80 whitespace-nowrap">
                            <Compass className="w-5 h-5" /> Discover
                        </button>
                        <button type="button" onClick={() => navigate('/discovery/movies')} className="flex items-center gap-2 pb-4 border-b-2 font-bold transition-all border-transparent text-white/50 hover:text-white/80 whitespace-nowrap">
                            <Film className="w-5 h-5" /> Movies
                        </button>
                        <button type="button" onClick={() => navigate('/discovery/series')} className="flex items-center gap-2 pb-4 border-b-2 font-bold transition-all border-transparent text-white/50 hover:text-white/80 whitespace-nowrap">
                            <Tv className="w-5 h-5" /> Series
                        </button>
                        <button type="button" onClick={() => navigate('/discovery/requests')} className="flex items-center gap-2 pb-4 border-b-2 font-bold transition-all border-plex text-white whitespace-nowrap">
                            <ClipboardList className="w-5 h-5" /> My Requests
                            {myPendingCount > 0 && (
                                <span className="ml-1 min-w-[1.25rem] h-5 px-1.5 rounded-full bg-plex text-black text-[10px] font-black inline-flex items-center justify-center">
                                    {myPendingCount > 99 ? '99+' : myPendingCount}
                                </span>
                            )}
                        </button>
                        <button type="button" onClick={() => navigate('/discovery/issues')} className="flex items-center gap-2 pb-4 border-b-2 font-bold transition-all border-transparent text-white/50 hover:text-white/80 whitespace-nowrap">
                            <AlertTriangle className="w-5 h-5" /> My Issues
                            {myOpenIssueCount > 0 && (
                                <span className="ml-1 min-w-[1.25rem] h-5 px-1.5 rounded-full bg-amber-500 text-black text-[10px] font-black inline-flex items-center justify-center">
                                    {myOpenIssueCount > 99 ? '99+' : myOpenIssueCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
                <MyRequestsPage
                    navigate={navigate}
                    pushToast={pushToast}
                    onCountsChange={refreshMyRequestCount}
                />
            </div>
        );
    }

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
                    <div className="flex w-full border-b border-white/10 px-4 mt-[-16px]">
                        <div className="flex gap-8">
                            <button
                                type="button"
                                onClick={() => navigate('/discovery')}
                                className={`flex items-center gap-2 pb-4 border-b-2 font-bold transition-all ${subRoute === 'home' ? 'border-plex text-white' : 'border-transparent text-white/50 hover:text-white/80'}`}
                            >
                                <Compass className="w-5 h-5" /> Discover
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/discovery/movies')}
                                className={`flex items-center gap-2 pb-4 border-b-2 font-bold transition-all ${subRoute === 'movies' ? 'border-plex text-white' : 'border-transparent text-white/50 hover:text-white/80'}`}
                            >
                                <Film className="w-5 h-5" /> Movies
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/discovery/series')}
                                className={`flex items-center gap-2 pb-4 border-b-2 font-bold transition-all ${subRoute === 'series' ? 'border-plex text-white' : 'border-transparent text-white/50 hover:text-white/80'}`}
                            >
                                <Tv className="w-5 h-5" /> Series
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/discovery/requests')}
                                className={`flex items-center gap-2 pb-4 border-b-2 font-bold transition-all ${subRoute === 'requests' ? 'border-plex text-white' : 'border-transparent text-white/50 hover:text-white/80'}`}
                            >
                                <ClipboardList className="w-5 h-5" /> My Requests
                                {myPendingCount > 0 && (
                                    <span className="ml-1 min-w-[1.25rem] h-5 px-1.5 rounded-full bg-plex text-black text-[10px] font-black inline-flex items-center justify-center">
                                        {myPendingCount > 99 ? '99+' : myPendingCount}
                                    </span>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/discovery/issues')}
                                className={`flex items-center gap-2 pb-4 border-b-2 font-bold transition-all ${subRoute === 'issues' ? 'border-plex text-white' : 'border-transparent text-white/50 hover:text-white/80'}`}
                            >
                                <AlertTriangle className="w-5 h-5" /> My Issues
                                {myOpenIssueCount > 0 && (
                                    <span className="ml-1 min-w-[1.25rem] h-5 px-1.5 rounded-full bg-amber-500 text-black text-[10px] font-black inline-flex items-center justify-center">
                                        {myOpenIssueCount > 99 ? '99+' : myOpenIssueCount}
                                    </span>
                                )}
                            </button>
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
                    </div>
                </>
            )}
        </div>
    );
};
