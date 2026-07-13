import React, { useState, useEffect } from 'react';
import { DiscoverHome } from './DiscoverHome';
import { MediaDetailsPage } from './MediaDetailsPage';
import { Search, Loader2 } from 'lucide-react';
import { apiFetch } from '../shared/api';
import { DiscoverPosterCard } from '../screens';
import { pushToast } from '../shared/toast';

export const DiscoveryDashboard: React.FC<{
    onItemClick: (item: any) => void;
}> = ({ onItemClick }) => {
    const [path, setPath] = useState(() => {
        if (typeof window !== 'undefined') return window.location.pathname;
        return '/discovery';
    });

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
    // ["discovery", "movie", "123"]
    
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
            />
        );
    }

    // Default to Home
    return (
        <div className="w-full flex flex-col gap-8 pb-12">
            <DiscoverHome 
                onSelect={(item) => navigate(`/discovery/${item.type}/${item.id}`)} 
                formatItem={formatItem}
            />
        </div>
    );
};
