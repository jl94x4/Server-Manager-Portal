import React, { useState, useEffect, useCallback } from 'react';
import { DiscoverHome } from './DiscoverHome';
import { DiscoverMovies } from './DiscoverMovies';
import { DiscoverSeries } from './DiscoverSeries';
import { DiscoverCategoryPage } from './DiscoverCategoryPage';
import { MediaDetailsPage } from './MediaDetailsPage';
import { PersonDetailsPage } from './PersonDetailsPage';
import { Search, Loader2, Sparkles, Film, Tv, Compass, X } from 'lucide-react';
import { apiFetch } from '../shared/api';
import { portalUrl, stripBasePath } from '../shared/basePath';

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

    const refreshPath = useCallback(() => {
        setPath(window.location.pathname);
    }, []);

    useEffect(() => {
        const handlePopState = () => refreshPath();
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [refreshPath]);

    const navigate = useCallback((newPath: string) => {
        const [pathname, ...rest] = newPath.split('?');
        const search = rest.length ? `?${rest.join('?')}` : '';
        const target = `${portalUrl(pathname)}${search}`;
        window.history.pushState({}, '', target);
        setPath(window.location.pathname);
        setSearchOpen(false);
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

    const formatItem = (item: any) => {
        const isPerson = item.mediaType === 'person';
        const isMovie = item.mediaType === 'movie';
        const title = isPerson ? item.name : (isMovie ? item.title : item.name);
        const year = (item.releaseDate || item.firstAirDate || '').substring(0, 4);
        const posterUrl = item.posterPath ? `https://image.tmdb.org/t/p/w342${item.posterPath}` : '';
        const profileUrl = item.profilePath ? `https://image.tmdb.org/t/p/w185${item.profilePath}` : '';
        const overview = item.overview;
        const mediaType = isPerson ? 'person' : (isMovie ? 'movie' : 'tv');

        const status = item.mediaInfo?.status;
        const isAvailable = status === 4 || status === 5;
        const isPending = status === 2 || status === 3;

        let overlay = null;
        if (!isPerson) {
            if (isAvailable) {
                overlay = (
                    <div className="absolute top-2 right-2 bg-green-500/90 text-white rounded-full p-1 shadow-lg backdrop-blur-sm z-10 border border-green-400/30">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    </div>
                );
            } else if (isPending) {
                overlay = (
                    <div className="absolute top-2 right-2 bg-amber-500/90 text-white rounded-full p-1 shadow-lg backdrop-blur-sm z-10 border border-amber-400/30">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    </div>
                );
            }
        }

        return {
            ...item,
            id: item.id,
            mediaType,
            title,
            year,
            thumbUrl: isPerson ? profileUrl : posterUrl,
            overview,
            type: mediaType,
            tags: [isPerson ? 'Person' : (isMovie ? 'Movie' : 'TV Show')],
            status,
            isAvailable,
            isPending,
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

    const showTabs = ['home', 'movies', 'series'].includes(subRoute);

    return (
        <div className="w-full flex flex-col gap-8 pb-12">
            <div className="relative w-full rounded-2xl overflow-hidden bg-gradient-to-br from-plex/20 to-black/40 border border-white/10 p-8 sm:p-12 flex flex-col items-center justify-center text-center shadow-2xl">
                <div className="absolute inset-0 bg-black/40 pointer-events-none" />
                <div className="relative z-10 max-w-2xl w-full flex flex-col gap-6 items-center">
                    <Sparkles className="w-12 h-12 text-plex opacity-80" />
                    <h1 className="text-3xl sm:text-5xl font-bold text-white tracking-tight drop-shadow-md">
                        Discover & Request
                    </h1>

                    <div className="w-full relative mt-4">
                        <Search className="w-6 h-6 text-muted absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search for a movie, TV show, or person..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onFocus={() => query.trim().length >= 2 && setSearchOpen(true)}
                            className="w-full bg-black/50 border-2 border-white/10 focus:border-plex rounded-xl py-4 pl-14 pr-12 text-lg text-white font-medium outline-none transition-all placeholder:text-muted/50 shadow-inner"
                        />
                        {query && (
                            <button
                                type="button"
                                onClick={() => { setQuery(''); setSearchOpen(false); setSearchResults([]); }}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                        {searchOpen && query.trim().length >= 2 && (
                            <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-[420px] overflow-y-auto custom-scrollbar rounded-xl border border-white/10 bg-zinc-950/95 backdrop-blur-xl shadow-2xl">
                                {searchLoading ? (
                                    <div className="flex items-center justify-center gap-2 p-6 text-muted">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Searching…
                                    </div>
                                ) : searchResults.length === 0 ? (
                                    <div className="p-6 text-center text-muted text-sm">No results found.</div>
                                ) : (
                                    searchResults.slice(0, 20).map((rawItem, idx) => {
                                        const formatted = formatItem(rawItem);
                                        const isPerson = formatted.type === 'person';
                                        return (
                                            <button
                                                key={`${formatted.id}-${idx}`}
                                                type="button"
                                                onClick={() => navigate(
                                                    isPerson
                                                        ? `/discovery/person/${formatted.id}`
                                                        : `/discovery/${formatted.type}/${formatted.id}`,
                                                )}
                                                className="w-full flex items-center gap-4 p-3 hover:bg-white/5 border-b border-white/5 last:border-0 text-left transition-colors"
                                            >
                                                <div className={`${isPerson ? 'w-12 h-12 rounded-full' : 'w-12 h-[72px] rounded-md'} overflow-hidden bg-white/5 flex-shrink-0`}>
                                                    {formatted.thumbUrl ? (
                                                        <img src={formatted.thumbUrl} alt="" className="w-full h-full object-cover" />
                                                    ) : null}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-bold text-white truncate">{formatted.title}</div>
                                                    <div className="text-xs text-muted">
                                                        {isPerson ? formatted.tags?.[0] : `${formatted.year}${formatted.year ? ' · ' : ''}${formatted.tags?.[0]}`}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

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
                        </div>
                    </div>

                    <div className="w-full mt-4">
                        {subRoute === 'home' && (
                            <DiscoverHome
                                onSelect={(item) => navigate(`/discovery/${item.type}/${item.id}`)}
                                formatItem={formatItem}
                                navigate={navigate}
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
