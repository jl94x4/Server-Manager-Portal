import React, { useState, useEffect } from 'react';
import { Search, Sparkles, Tv, Film, PlayCircle, PlusCircle, CheckCircle, Clock, X, Loader2, Star, Calendar, Globe, Building } from 'lucide-react';
import { apiFetch } from '../shared/api';
import { DiscoverPosterCard } from '../screens'; 
import { pushToast } from '../shared/toast';

export const DiscoveryDashboard: React.FC<{
    onItemClick: (item: any) => void;
}> = ({ onItemClick }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    
    const [rows, setRows] = useState<{
        trending: any[];
        popularMovies: any[];
        popularTv: any[];
        upcomingMovies: any[];
    }>({ trending: [], popularMovies: [], popularTv: [], upcomingMovies: [] });

    const [loading, setLoading] = useState(true);
    const [searchLoading, setSearchLoading] = useState(false);
    
    // Modal State
    const [selectedItem, setSelectedItem] = useState<any | null>(null);
    const [extendedDetails, setExtendedDetails] = useState<any | null>(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [requestLoading, setRequestLoading] = useState(false);

    useEffect(() => {
        const fetchCategories = async () => {
            setLoading(true);
            try {
                const [trendingRes, popMoviesRes, popTvRes, upcomingRes] = await Promise.all([
                    apiFetch('/api/discovery/trending').catch(() => null),
                    apiFetch('/api/discovery/proxy/discover/movies?sortBy=popularity.desc').catch(() => null),
                    apiFetch('/api/discovery/proxy/discover/tv?sortBy=popularity.desc').catch(() => null),
                    apiFetch('/api/discovery/proxy/discover/movies/upcoming').catch(() => null)
                ]);

                setRows({
                    trending: trendingRes?.results || [],
                    popularMovies: popMoviesRes?.results || [],
                    popularTv: popTvRes?.results || [],
                    upcomingMovies: upcomingRes?.results || []
                });
            } catch (err) {
                console.error('Error fetching categories', err);
            }
            setLoading(false);
        };
        fetchCategories();
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

    // Format Overseerr results
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
                    <CheckCircle className="w-4 h-4" />
                </div>
            );
        } else if (isPending) {
            overlay = (
                <div className="absolute top-2 right-2 bg-amber-500/90 text-white rounded-full p-1 shadow-lg backdrop-blur-sm z-10 border border-amber-400/30">
                    <Clock className="w-4 h-4" />
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

    const openDetails = async (rawItem: any) => {
        const formatted = formatItem(rawItem);
        setSelectedItem(formatted);
        setExtendedDetails(null);
        setDetailsLoading(true);
        try {
            const endpoint = formatted.mediaType === 'movie' ? `/api/discovery/proxy/movie/${formatted.id}` : `/api/discovery/proxy/tv/${formatted.id}`;
            const res = await apiFetch(endpoint);
            if (!res.error) setExtendedDetails(res);
        } catch(e) {
            console.error('Failed to fetch extended details', e);
        }
        setDetailsLoading(false);
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
                setSelectedItem({
                    ...item,
                    isPending: true
                });
            }
        } catch (err: any) {
            pushToast(err.message || 'Failed to submit request', 'error');
        }
        setRequestLoading(false);
    };

    const DiscoveryRow = ({ title, items }: { title: string, items: any[] }) => {
        if (!items.length) return null;
        return (
            <div className="flex flex-col gap-3">
                <h2 className="text-xl font-bold text-white px-2 flex items-center gap-2">
                    {title}
                </h2>
                <div className="flex gap-4 overflow-x-auto pb-4 px-2 custom-scrollbar snap-x snap-mandatory">
                    {items.map((item, idx) => {
                        const formatted = formatItem(item);
                        return (
                            <div key={idx} className="w-[140px] sm:w-[160px] flex-shrink-0 snap-start relative group">
                                <DiscoverPosterCard
                                    item={formatted}
                                    overlay={formatted.overlay}
                                    showQualityBadges={false}
                                    onPosterClick={() => openDetails(item)}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

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

            {/* Results */}
            <div className="flex flex-col gap-4 px-2">
                {query.trim() ? (
                    <>
                        <h2 className="text-xl font-bold text-white px-2">Search Results</h2>
                        {results.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                {results.map((item, idx) => {
                                    const formatted = formatItem(item);
                                    return (
                                        <DiscoverPosterCard
                                            key={idx}
                                            item={formatted}
                                            overlay={formatted.overlay}
                                            showQualityBadges={false}
                                            onPosterClick={() => openDetails(item)}
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
                    </>
                ) : (
                    <div className="flex flex-col gap-8 mt-2">
                        {loading ? (
                            <div className="flex flex-col gap-8">
                                {[...Array(3)].map((_, r) => (
                                    <div key={r} className="flex flex-col gap-3">
                                        <div className="w-48 h-6 bg-white/5 rounded animate-pulse px-2 ml-2"></div>
                                        <div className="flex gap-4 overflow-hidden px-2">
                                            {[...Array(6)].map((_, i) => (
                                                <div key={i} className="w-[140px] sm:w-[160px] aspect-[2/3] rounded-xl bg-white/5 animate-pulse border border-white/5 flex-shrink-0"></div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <>
                                <DiscoveryRow title="Trending Now" items={rows.trending} />
                                <DiscoveryRow title="Popular Movies" items={rows.popularMovies} />
                                <DiscoveryRow title="Popular Series" items={rows.popularTv} />
                                <DiscoveryRow title="Upcoming Movies" items={rows.upcomingMovies} />
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Extended Details Modal */}
            {selectedItem && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-0 sm:p-4 animate-fade-in backdrop-blur-sm" onClick={() => setSelectedItem(null)}>
                    <div className="bg-card border border-border w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-4xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden relative isolate" onClick={e => e.stopPropagation()}>
                        
                        {/* Hero Backdrop */}
                        <div className="relative h-64 sm:h-80 flex-shrink-0 bg-black/50 overflow-hidden">
                            {(extendedDetails?.backdropPath || selectedItem.backdropPath) ? (
                                <img src={`https://image.tmdb.org/t/p/w1280${extendedDetails?.backdropPath || selectedItem.backdropPath}`} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
                            ) : null}
                            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
                            <div className="absolute inset-0 bg-gradient-to-r from-card/80 via-transparent to-transparent hidden sm:block" />
                            
                            <button onClick={() => setSelectedItem(null)} className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/60 rounded-full transition-colors text-white/70 hover:text-white z-20 border border-white/10">
                                <X className="w-5 h-5" />
                            </button>

                            <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col sm:flex-row sm:items-end gap-6 z-10">
                                <div className="w-28 sm:w-40 aspect-[2/3] rounded-lg overflow-hidden flex-shrink-0 shadow-2xl border border-white/10 bg-black/50 hidden sm:block">
                                    {selectedItem.thumbUrl ? (
                                        <img src={selectedItem.thumbUrl} alt="" className="w-full h-full object-cover" />
                                    ) : null}
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col justify-end">
                                    <div className="flex items-center gap-2 mb-2">
                                        {selectedItem.mediaType === 'movie' ? <Film className="w-4 h-4 text-plex" /> : <Tv className="w-4 h-4 text-plex" />}
                                        <span className="text-xs font-bold uppercase tracking-widest text-plex">{selectedItem.mediaType}</span>
                                        {extendedDetails?.status && (
                                            <>
                                                <span className="text-white/30">•</span>
                                                <span className="text-xs font-bold text-white/70">{extendedDetails.status}</span>
                                            </>
                                        )}
                                    </div>
                                    <h2 className="text-3xl sm:text-5xl font-bold text-white leading-tight drop-shadow-lg">
                                        {selectedItem.title}
                                    </h2>
                                    
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-sm text-white/80 font-medium">
                                        {selectedItem.year && (
                                            <div className="flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded-md backdrop-blur-sm border border-white/5">
                                                <Calendar className="w-4 h-4 text-white/50" />
                                                {selectedItem.year}
                                            </div>
                                        )}
                                        {extendedDetails?.voteAverage > 0 && (
                                            <div className="flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded-md backdrop-blur-sm border border-white/5">
                                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                                {extendedDetails.voteAverage.toFixed(1)}
                                            </div>
                                        )}
                                        {extendedDetails?.productionCountries?.[0] && (
                                            <div className="flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded-md backdrop-blur-sm border border-white/5">
                                                <Globe className="w-4 h-4 text-white/50" />
                                                {extendedDetails.productionCountries[0].iso_3166_1}
                                            </div>
                                        )}
                                        {extendedDetails?.runtime > 0 && (
                                            <div className="flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded-md backdrop-blur-sm border border-white/5">
                                                <Clock className="w-4 h-4 text-white/50" />
                                                {extendedDetails.runtime} min
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Content Scroll Area */}
                        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-6 bg-card flex flex-col gap-8">
                            
                            <div className="flex flex-col sm:flex-row gap-8">
                                <div className="flex-1 flex flex-col gap-6">
                                    <div className="flex flex-col gap-2">
                                        <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest">Overview</h3>
                                        <p className="text-base text-white/90 leading-relaxed">
                                            {extendedDetails?.overview || selectedItem.overview || 'No description available.'}
                                        </p>
                                    </div>

                                    {/* Crew / Networks */}
                                    {detailsLoading ? (
                                        <div className="h-10 flex items-center gap-3 text-muted"><Loader2 className="w-4 h-4 animate-spin" /> Loading details...</div>
                                    ) : extendedDetails && (
                                        <div className="flex flex-col gap-4">
                                            {extendedDetails.networks && extendedDetails.networks.length > 0 && (
                                                <div className="flex flex-col gap-2">
                                                    <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest">Networks</h3>
                                                    <div className="flex flex-wrap gap-4 items-center bg-black/20 p-4 rounded-xl border border-white/5">
                                                        {extendedDetails.networks.slice(0, 3).map((n: any) => (
                                                            <div key={n.id} className="flex items-center gap-2">
                                                                {n.logoPath ? (
                                                                    <img src={`https://image.tmdb.org/t/p/w92${n.logoPath}`} alt={n.name} className="h-6 object-contain filter invert opacity-80" />
                                                                ) : (
                                                                    <span className="font-bold text-white/80">{n.name}</span>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Sidebar / Action Area */}
                                <div className="w-full sm:w-64 flex-shrink-0 flex flex-col gap-4">
                                    <button 
                                        onClick={() => handleRequest(selectedItem)}
                                        disabled={requestLoading || selectedItem.isAvailable || selectedItem.isPending}
                                        className={`w-full py-4 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg ${
                                            selectedItem.isAvailable 
                                                ? 'bg-green-500/20 text-green-500 border border-green-500/30 cursor-default'
                                                : selectedItem.isPending 
                                                    ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30 cursor-default'
                                                    : 'bg-plex hover:bg-plex-hover text-white disabled:opacity-50 disabled:cursor-not-allowed'
                                        }`}
                                    >
                                        {requestLoading ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : selectedItem.isAvailable ? (
                                            <>
                                                <CheckCircle className="w-5 h-5" />
                                                Available on Server
                                            </>
                                        ) : selectedItem.isPending ? (
                                            <>
                                                <Clock className="w-5 h-5" />
                                                Request Pending
                                            </>
                                        ) : (
                                            <>
                                                <PlusCircle className="w-5 h-5" />
                                                Request {selectedItem.mediaType === 'tv' ? 'Series' : 'Movie'}
                                            </>
                                        )}
                                    </button>
                                    
                                    {extendedDetails?.genres && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {extendedDetails.genres.map((g: any) => (
                                                <span key={g.id} className="px-2 py-1 bg-white/5 border border-white/10 rounded-md text-xs font-medium text-white/70">
                                                    {g.name}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Cast Section */}
                            {!detailsLoading && extendedDetails?.credits?.cast && extendedDetails.credits.cast.length > 0 && (
                                <div className="flex flex-col gap-4 border-t border-white/5 pt-8">
                                    <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest">Top Cast</h3>
                                    <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                                        {extendedDetails.credits.cast.slice(0, 15).map((actor: any) => (
                                            <div key={actor.id} className="flex flex-col items-center gap-2 w-24 flex-shrink-0">
                                                <div className="w-16 h-16 rounded-full bg-black/40 border border-white/10 overflow-hidden">
                                                    {actor.profilePath ? (
                                                        <img src={`https://image.tmdb.org/t/p/w185${actor.profilePath}`} alt={actor.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-white/20">
                                                            <Globe className="w-8 h-8" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-sm font-bold text-white/90 leading-tight truncate w-full">{actor.name}</div>
                                                    <div className="text-xs text-white/50 truncate w-full mt-0.5">{actor.character}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
