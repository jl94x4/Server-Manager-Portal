import React, { useState, useEffect } from 'react';
import { Search, Sparkles, Tv, Film, PlayCircle, PlusCircle, CheckCircle, Clock, X, Loader2 } from 'lucide-react';
import { apiFetch } from '../shared/api';
import { DiscoverPosterCard } from '../screens'; 
import { pushToast } from '../shared/toast';

export const DiscoveryDashboard: React.FC<{
    onItemClick: (item: any) => void;
}> = ({ onItemClick }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [trending, setTrending] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchLoading, setSearchLoading] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any | null>(null);
    const [requestLoading, setRequestLoading] = useState(false);

    useEffect(() => {
        const fetchTrending = async () => {
            setLoading(true);
            try {
                const res = await apiFetch('/api/discovery/trending');
                if (res && res.results) {
                    setTrending(res.results);
                }
            } catch (err) {
                console.error('Error fetching trending', err);
            }
            setLoading(false);
        };
        fetchTrending();
    }, []);

    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }
        const timer = setTimeout(async () => {
            setSearchLoading(true);
            try {
                const res = await apiFetch(`/api/discovery/search?query=${encodeURIComponent(query)}`);
                if (res && res.results) {
                    setResults(res.results);
                }
            } catch (err) {
                console.error('Search error', err);
            }
            setSearchLoading(false);
        }, 500);
        return () => clearTimeout(timer);
    }, [query]);

    // Format Overseerr results to match DiscoverPosterCard
    const formatItem = (item: any) => {
        const isMovie = item.mediaType === 'movie';
        const title = isMovie ? item.title : item.name;
        const year = (item.releaseDate || item.firstAirDate || '').substring(0, 4);
        const posterUrl = item.posterPath ? `https://image.tmdb.org/t/p/w342${item.posterPath}` : '';
        const overview = item.overview;
        
        return {
            ...item,
            title,
            year,
            thumbUrl: posterUrl,
            overview,
            type: isMovie ? 'movie' : 'episode', // Map for details modal
            tags: [isMovie ? 'Movie' : 'TV Show'],
        };
    };

    const handleRequest = async (item: any) => {
        setRequestLoading(true);
        try {
            const res = await apiFetch('/api/discovery/request', {
                method: 'POST',
                body: JSON.stringify({
                    mediaType: item.mediaType,
                    mediaId: item.id
                })
            });
            
            if (res.error) {
                pushToast(res.error, 'error');
            } else {
                pushToast('Request submitted successfully!', 'success');
                setSelectedItem(null);
            }
        } catch (err: any) {
            pushToast(err.message || 'Failed to submit request', 'error');
        }
        setRequestLoading(false);
    };

    const displayItems = query.trim() ? results : trending;

    return (
        <div className="w-full flex flex-col gap-8 pb-12">
            {/* Search Hero */}
            <div className="relative w-full rounded-2xl overflow-hidden bg-gradient-to-br from-plex/20 to-black/40 border border-white/10 p-8 sm:p-12 flex flex-col items-center justify-center text-center shadow-2xl">
                <div className="absolute inset-0 bg-black/40 pointer-events-none"></div>
                <div className="relative z-10 max-w-2xl w-full flex flex-col gap-6 items-center">
                    <Sparkles className="w-12 h-12 text-plex opacity-80" />
                    <h1 className="text-3xl sm:text-5xl font-bold text-white tracking-tight drop-shadow-md">
                        Discover & Request
                    </h1>
                    <p className="text-muted text-sm sm:text-base max-w-lg leading-relaxed">
                        Search for any movie or TV show. If it's not on the server, you can request it instantly and it will be added automatically.
                    </p>
                    
                    <div className="w-full relative mt-4">
                        <Search className="w-6 h-6 text-muted absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search for a movie or TV show..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full bg-black/50 border-2 border-white/10 focus:border-plex rounded-xl py-4 pl-14 pr-6 text-lg text-white font-medium outline-none transition-all placeholder:text-muted/50 shadow-inner"
                        />
                        {searchLoading && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                <div className="w-5 h-5 border-2 border-plex/30 border-t-plex rounded-full animate-spin"></div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Results Grid */}
            <div className="flex flex-col gap-4 px-2">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        {query.trim() ? 'Search Results' : 'Trending Now'}
                        {!query.trim() && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-plex/20 text-plex uppercase tracking-wider">Popular</span>}
                    </h2>
                </div>
                
                {loading && !query.trim() ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {[...Array(12)].map((_, i) => (
                            <div key={i} className="aspect-[2/3] rounded-xl bg-white/5 animate-pulse border border-white/5"></div>
                        ))}
                    </div>
                ) : displayItems.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {displayItems.map((item, idx) => {
                            const formatted = formatItem(item);
                            return (
                                <DiscoverPosterCard
                                    key={idx}
                                    item={formatted}
                                    showQualityBadges={false}
                                    onPosterClick={() => setSelectedItem(formatted)}
                                />
                            );
                        })}
                    </div>
                ) : (
                    <div className="w-full py-20 flex flex-col items-center justify-center text-center gap-4 text-muted border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                        <Search className="w-10 h-10 opacity-20" />
                        <p>No results found for "{query}".</p>
                    </div>
                )}
            </div>

            {selectedItem && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 animate-fade-in backdrop-blur-sm" onClick={() => setSelectedItem(null)}>
                    <div className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden relative isolate" onClick={e => e.stopPropagation()}>
                        <div className="relative h-48 sm:h-56 flex-shrink-0 bg-black/50 border-b border-white/5 overflow-hidden">
                            {selectedItem.thumbUrl ? (
                                <img src={selectedItem.thumbUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30 blur-sm" />
                            ) : null}
                            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/80 to-transparent" />
                            
                            <button onClick={() => setSelectedItem(null)} className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/60 rounded-full transition-colors text-white/70 hover:text-white z-10 border border-white/10">
                                <X className="w-5 h-5" />
                            </button>

                            <div className="absolute bottom-0 left-0 right-0 p-5 flex gap-4">
                                <div className="w-20 aspect-[2/3] rounded-md overflow-hidden flex-shrink-0 shadow-lg border border-white/10 bg-black/50 z-10">
                                    {selectedItem.thumbUrl ? (
                                        <img src={selectedItem.thumbUrl} alt="" className="w-full h-full object-cover" />
                                    ) : null}
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col justify-end pb-1 z-10">
                                    <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight drop-shadow-md">
                                        {selectedItem.title}
                                    </h2>
                                    {selectedItem.year && (
                                        <span className="text-sm text-white/70 font-semibold drop-shadow-sm mt-1">
                                            {selectedItem.year}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-5 flex flex-col gap-6">
                            <p className="text-sm text-white/80 leading-relaxed max-h-40 overflow-y-auto custom-scrollbar">
                                {selectedItem.overview || 'No description available.'}
                            </p>

                            <button 
                                onClick={() => handleRequest(selectedItem)}
                                disabled={requestLoading}
                                className="w-full py-3 px-4 rounded-xl bg-plex hover:bg-plex-hover text-white font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                            >
                                {requestLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <PlusCircle className="w-5 h-5" />
                                        Request {selectedItem.mediaType === 'tv' ? 'Series' : 'Movie'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
