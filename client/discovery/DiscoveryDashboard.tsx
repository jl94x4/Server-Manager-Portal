import React, { useState, useEffect } from 'react';
import { DiscoverHome } from './DiscoverHome';
import { DiscoverMovies } from './DiscoverMovies';
import { DiscoverSeries } from './DiscoverSeries';
import { MediaDetailsPage } from './MediaDetailsPage';
import { PersonDetailsPage } from './PersonDetailsPage';
import { Search, Loader2, Sparkles, Film, Tv, Compass } from 'lucide-react';
import { apiFetch } from '../shared/api';

export const DiscoveryDashboard: React.FC<{
    onItemClick: (item: any) => void;
    pushToast?: (msg: string, type: 'success' | 'error') => void;
}> = ({ onItemClick, pushToast }) => {
    const [path, setPath] = useState(() => {
        if (typeof window !== 'undefined') return window.location.pathname;
        return '/discovery';
    });

    const [query, setQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);

    useEffect(() => {
        const handlePopState = () => {
            setPath(window.location.pathname);
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    const navigate = (newPath: string) => {
        window.history.pushState({}, '', newPath);
        setPath(newPath);
    };

    // Shared Format function
    const formatItem = (item: any) => {
        const isMovie = item.mediaType === 'movie';
        const title = isMovie ? item.title : item.name;
        const year = (item.releaseDate || item.firstAirDate || '').substring(0, 4);
        const posterUrl = item.posterPath ? `https://image.tmdb.org/t/p/w342${item.posterPath}` : '';
        const overview = item.overview;
        const mediaType = isMovie ? 'movie' : 'tv';
        
        const status = item.mediaInfo?.status;
        const isAvailable = status === 4 || status === 5;
        const isPending = status === 2 || status === 3;
        
        let overlay = null;
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

        return {
            ...item,
            id: item.id,
            mediaType,
            title,
            year,
            thumbUrl: posterUrl,
            overview,
            type: mediaType,
            tags: [isMovie ? 'Movie' : 'TV Show'],
            status,
            isAvailable,
            isPending,
            overlay,
        };
    };

    // Sub-Routing Logic
    const routeParts = path.split('/').filter(Boolean);
    const subRoute = routeParts[1] || 'home'; // "movie", "tv", "person", "movies", "series", "home"
    
    // Details Pages
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
                onBack={() => {
                    navigate('/discovery');
                }} 
                formatItem={formatItem}
                pushToast={pushToast}
            />
        );
    }

    // Main App with Tabs
    return (
        <div className="w-full flex flex-col gap-8 pb-12">
            
            {/* Search Hero (Persists across main tabs) */}
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
                            onChange={(e) => {
                                setQuery(e.target.value);
                                // Move Search Logic here or keep it decoupled
                            }}
                            className="w-full bg-black/50 border-2 border-white/10 focus:border-plex rounded-xl py-4 pl-14 pr-6 text-lg text-white font-medium outline-none transition-all placeholder:text-muted/50 shadow-inner"
                        />
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex w-full border-b border-white/10 px-4 mt-[-16px]">
                <div className="flex gap-8">
                    <button 
                        onClick={() => navigate('/discovery')}
                        className={`flex items-center gap-2 pb-4 border-b-2 font-bold transition-all ${subRoute === 'home' ? 'border-plex text-white' : 'border-transparent text-white/50 hover:text-white/80'}`}
                    >
                        <Compass className="w-5 h-5" /> Discover
                    </button>
                    <button 
                        onClick={() => navigate('/discovery/movies')}
                        className={`flex items-center gap-2 pb-4 border-b-2 font-bold transition-all ${subRoute === 'movies' ? 'border-plex text-white' : 'border-transparent text-white/50 hover:text-white/80'}`}
                    >
                        <Film className="w-5 h-5" /> Movies
                    </button>
                    <button 
                        onClick={() => navigate('/discovery/series')}
                        className={`flex items-center gap-2 pb-4 border-b-2 font-bold transition-all ${subRoute === 'series' ? 'border-plex text-white' : 'border-transparent text-white/50 hover:text-white/80'}`}
                    >
                        <Tv className="w-5 h-5" /> Series
                    </button>
                </div>
            </div>

            {/* Tab Content */}
            <div className="w-full mt-4">
                {subRoute === 'home' && (
                    <DiscoverHome 
                        onSelect={(item) => navigate(`/discovery/${item.type}/${item.id}`)} 
                        formatItem={formatItem}
                    />
                )}
                {subRoute === 'movies' && (
                    <DiscoverMovies
                        onSelect={(item) => navigate(`/discovery/${item.type}/${item.id}`)} 
                        formatItem={formatItem}
                    />
                )}
                {subRoute === 'series' && (
                    <DiscoverSeries
                        onSelect={(item) => navigate(`/discovery/${item.type}/${item.id}`)} 
                        formatItem={formatItem}
                    />
                )}
            </div>
        </div>
    );
};
