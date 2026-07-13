import React, { useState, useEffect } from 'react';
import { PlayCircle, PlusCircle, CheckCircle, Clock, ArrowLeft, Star, Calendar, Globe, Film, Tv, Loader2 } from 'lucide-react';
import { apiFetch } from '../shared/api';
import { DiscoverPosterCard } from '../screens';

export const MediaDetailsPage: React.FC<{
    mediaType: 'movie' | 'tv';
    mediaId: number;
    onBack: () => void;
    formatItem: (item: any) => any;
    pushToast?: (msg: string, type: 'success' | 'error') => void;
}> = ({ mediaType, mediaId, onBack, formatItem, pushToast }) => {
    const [details, setDetails] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [requestLoading, setRequestLoading] = useState(false);
    const [recommendations, setRecommendations] = useState<any[]>([]);

    useEffect(() => {
        const fetchDetails = async () => {
            setLoading(true);
            try {
                const endpoint = mediaType === 'movie' ? `/api/discovery/proxy/movie/${mediaId}` : `/api/discovery/proxy/tv/${mediaId}`;
                const res = await apiFetch(endpoint);
                if (!res.error) {
                    setDetails(res);
                }
                
                // Fetch recommendations
                const recEndpoint = mediaType === 'movie' ? `/api/discovery/proxy/movie/${mediaId}/recommendations` : `/api/discovery/proxy/tv/${mediaId}/recommendations`;
                const recRes = await apiFetch(recEndpoint);
                if (!recRes.error && recRes.results) {
                    setRecommendations(recRes.results);
                }
            } catch (err) {
                console.error(err);
            }
            setLoading(false);
        };
        fetchDetails();
    }, [mediaId, mediaType]);

    const handleRequest = async () => {
        if (!details) return;
        setRequestLoading(true);
        try {
            const res = await apiFetch('/api/discovery/request', {
                method: 'POST',
                body: JSON.stringify({
                    mediaType: mediaType,
                    mediaId: mediaId
                })
            });
            
            if (res.error) {
                if (pushToast) pushToast(res.error, 'error');
            } else {
                if (pushToast) pushToast('Request submitted successfully!', 'success');
                setDetails({
                    ...details,
                    mediaInfo: {
                        ...details.mediaInfo,
                        status: 2 // Pending
                    }
                });
            }
        } catch (err: any) {
            if (pushToast) pushToast(err.message || 'Failed to submit request', 'error');
        }
        setRequestLoading(false);
    };

    if (loading || !details) {
        return (
            <div className="w-full h-[80vh] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-plex animate-spin" />
            </div>
        );
    }

    const title = mediaType === 'movie' ? details.title : details.name;
    const year = (details.releaseDate || details.firstAirDate || '').substring(0, 4);
    const status = details.mediaInfo?.status;
    const isAvailable = status === 4 || status === 5;
    const isPending = status === 2 || status === 3;
    const posterUrl = details.posterPath ? `https://image.tmdb.org/t/p/w500${details.posterPath}` : '';

    return (
        <div className="w-full flex flex-col min-h-screen bg-card animate-fade-in pb-20">
            {/* Top Navigation Bar */}
            <div className="sticky top-0 z-50 w-full px-4 sm:px-8 py-4 flex items-center bg-gradient-to-b from-black/80 to-transparent">
                <button onClick={onBack} className="flex items-center gap-2 text-white/80 hover:text-white transition-colors bg-black/40 px-4 py-2 rounded-full backdrop-blur-md border border-white/10">
                    <ArrowLeft className="w-5 h-5" />
                    <span className="font-bold text-sm">Back to Discover</span>
                </button>
            </div>

            {/* Hero Backdrop */}
            <div className="relative w-full h-[50vh] sm:h-[60vh] -mt-[72px] bg-black">
                {details.backdropPath ? (
                    <img src={`https://image.tmdb.org/t/p/original${details.backdropPath}`} alt="" className="w-full h-full object-cover opacity-40" />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-card/80 via-transparent to-transparent hidden md:block" />
            </div>

            {/* Main Content Area */}
            <div className="relative z-10 w-full max-w-[1600px] mx-auto px-4 sm:px-8 xl:px-12 -mt-32 sm:-mt-48 flex flex-col md:flex-row gap-8 lg:gap-16">
                
                {/* Left Column (Poster & Actions) */}
                <div className="flex flex-col gap-6 w-48 sm:w-[280px] flex-shrink-0 mx-auto md:mx-0">
                    <div className="w-full aspect-[2/3] rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-black/50">
                        {posterUrl ? (
                            <img src={posterUrl} alt="" className="w-full h-full object-cover" />
                        ) : null}
                    </div>

                    <button 
                        onClick={handleRequest}
                        disabled={requestLoading || isAvailable || isPending}
                        className={`w-full py-4 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg ${
                            isAvailable 
                                ? 'bg-green-500/20 text-green-500 border border-green-500/30 cursor-default'
                                : isPending 
                                    ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30 cursor-default'
                                    : 'bg-plex hover:bg-plex-hover text-white disabled:opacity-50 disabled:cursor-not-allowed'
                        }`}
                    >
                        {requestLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : isAvailable ? (
                            <>
                                <CheckCircle className="w-5 h-5" />
                                Available
                            </>
                        ) : isPending ? (
                            <>
                                <Clock className="w-5 h-5" />
                                Request Pending
                            </>
                        ) : (
                            <>
                                <PlusCircle className="w-5 h-5" />
                                Request {mediaType === 'tv' ? 'Series' : 'Movie'}
                            </>
                        )}
                    </button>
                    
                    {details.homepage && (
                        <a href={details.homepage} target="_blank" rel="noreferrer" className="w-full py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors">
                            <Globe className="w-4 h-4" /> Visit Website
                        </a>
                    )}
                </div>

                {/* Right Column (Details) */}
                <div className="flex-1 min-w-0 flex flex-col gap-8 pt-4 sm:pt-8">
                    {/* Header Info */}
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                            {mediaType === 'movie' ? <Film className="w-4 h-4 text-plex" /> : <Tv className="w-4 h-4 text-plex" />}
                            <span className="text-xs font-bold uppercase tracking-widest text-plex">{mediaType}</span>
                            {details.status && (
                                <>
                                    <span className="text-white/30">•</span>
                                    <span className="text-xs font-bold text-white/70">{details.status}</span>
                                </>
                            )}
                        </div>
                        <h1 className="text-4xl sm:text-6xl font-black text-white leading-tight drop-shadow-lg tracking-tight">
                            {title}
                        </h1>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-sm text-white/80 font-medium">
                            {year && (
                                <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-lg backdrop-blur-sm border border-white/5">
                                    <Calendar className="w-4 h-4 text-white/50" />
                                    {year}
                                </div>
                            )}
                            {details.voteAverage > 0 && (
                                <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-lg backdrop-blur-sm border border-white/5">
                                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                    {details.voteAverage.toFixed(1)}
                                </div>
                            )}
                            {details.productionCountries?.[0] && (
                                <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-lg backdrop-blur-sm border border-white/5">
                                    <Globe className="w-4 h-4 text-white/50" />
                                    {details.productionCountries[0].iso_3166_1}
                                </div>
                            )}
                            {details.runtime > 0 && (
                                <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-lg backdrop-blur-sm border border-white/5">
                                    <Clock className="w-4 h-4 text-white/50" />
                                    {details.runtime} min
                                </div>
                            )}
                        </div>
                        
                        {details.genres && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {details.genres.map((g: any) => (
                                    <span key={g.id} className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-sm font-semibold text-white/80">
                                        {g.name}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    <p className="text-lg text-white/90 leading-relaxed max-w-4xl">
                        {details.overview || 'No description available.'}
                    </p>

                    {details.networks && details.networks.length > 0 && (
                        <div className="flex flex-col gap-3">
                            <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest">Networks</h3>
                            <div className="flex flex-wrap gap-4 items-center bg-black/20 p-4 rounded-xl border border-white/5 w-fit">
                                {details.networks.map((n: any) => (
                                    <div key={n.id} className="flex items-center gap-2">
                                        {n.logoPath ? (
                                            <img src={`https://image.tmdb.org/t/p/w92${n.logoPath}`} alt={n.name} className="h-8 object-contain filter invert opacity-80" />
                                        ) : (
                                            <span className="font-bold text-white/80">{n.name}</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Cast Section */}
                    {details.credits?.cast && details.credits.cast.length > 0 && (
                        <div className="flex flex-col gap-4 border-t border-white/5 pt-8 w-full overflow-hidden">
                            <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest">Top Cast</h3>
                            <div className="flex gap-6 overflow-x-auto pb-4 custom-scrollbar">
                                {details.credits.cast.slice(0, 15).map((actor: any) => (
                                    <div 
                                        key={actor.id} 
                                        onClick={() => {
                                            window.history.pushState({}, '', `/discovery/person/${actor.id}`);
                                            window.dispatchEvent(new Event('popstate'));
                                        }}
                                        className="flex flex-col items-center gap-3 w-32 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                                    >
                                        <div className="w-24 h-24 rounded-full bg-black/40 border border-white/10 overflow-hidden shadow-lg">
                                            {actor.profilePath ? (
                                                <img src={`https://image.tmdb.org/t/p/w185${actor.profilePath}`} alt={actor.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-white/20">
                                                    <Globe className="w-8 h-8" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-center">
                                            <div className="text-sm font-bold text-white/90 leading-tight text-center">{actor.name}</div>
                                            <div className="text-xs text-white/50 text-center mt-1 leading-snug line-clamp-2">{actor.character}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Seasons (if TV) */}
                    {mediaType === 'tv' && details.seasons && details.seasons.length > 0 && (
                        <div className="flex flex-col gap-4 border-t border-white/5 pt-8 w-full">
                            <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest">Seasons</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {details.seasons.map((s: any) => (
                                    <div key={s.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex gap-4 items-center">
                                        {s.posterPath ? (
                                            <img src={`https://image.tmdb.org/t/p/w92${s.posterPath}`} className="w-12 rounded object-cover" alt="" />
                                        ) : <div className="w-12 h-16 bg-black/40 rounded"></div>}
                                        <div className="flex flex-col">
                                            <span className="font-bold text-white">{s.name}</span>
                                            <span className="text-sm text-white/50">{s.episodeCount} Episodes</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Recommendations */}
                    {recommendations.length > 0 && (
                        <div className="flex flex-col gap-4 border-t border-white/5 pt-8 w-full overflow-hidden">
                            <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest">Recommendations</h3>
                            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                                {recommendations.map((item, idx) => {
                                    const formatted = formatItem(item);
                                    return (
                                        <div key={idx} className="w-[140px] sm:w-[160px] flex-shrink-0 snap-start">
                                            {/* Since we can't link to a new page directly here without a router, we might want to lift routing logic. 
                                                For now we will pass a simple href if we were using a router, but here we can just invoke an onClick prop if we want it to drill down. 
                                                Let's leave it simple for now. 
                                            */}
                                            <DiscoverPosterCard
                                                item={formatted}
                                                overlay={formatted.overlay}
                                                showQualityBadges={false}
                                                onPosterClick={() => {
                                                    // In a real app we would pushState to the new item. 
                                                    // For now, let's just push it to the URL and let the parent handle it
                                                    window.history.pushState({}, '', `/discovery/${formatted.type}/${formatted.id}`);
                                                    window.dispatchEvent(new Event('popstate'));
                                                }}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
