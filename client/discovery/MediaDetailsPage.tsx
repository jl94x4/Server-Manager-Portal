import React, { useState, useEffect } from 'react';
import { PlusCircle, CheckCircle, Clock, ArrowLeft, Star, Calendar, Globe, Film, Tv, Loader2, Users } from 'lucide-react';
import { apiFetch } from '../shared/api';
import { DiscoverPosterCard } from '../screens';
import { Carousel } from './Carousel';
import { DiscoveryFactWidget } from './DiscoveryFactWidget';
import { NoPosterPlaceholder } from '../shared/NoPosterPlaceholder';
import { filterHiddenAvailableItems, useDiscoveryPreferences } from './useDiscoveryPreferences';

const SectionHeading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest">{children}</h3>
);

export const MediaDetailsPage: React.FC<{
    mediaType: 'movie' | 'tv';
    mediaId: number;
    onBack: () => void;
    formatItem: (item: any) => any;
    pushToast?: (msg: string, type: 'success' | 'error') => void;
}> = ({ mediaType, mediaId, onBack, formatItem, pushToast }) => {
    const { preferences } = useDiscoveryPreferences();
    const [details, setDetails] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [requestLoading, setRequestLoading] = useState(false);
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [posterFailed, setPosterFailed] = useState(false);

    useEffect(() => {
        const fetchDetails = async () => {
            setLoading(true);
            setPosterFailed(false);
            try {
                const endpoint = mediaType === 'movie'
                    ? `/api/discovery/proxy/movie/${mediaId}`
                    : `/api/discovery/proxy/tv/${mediaId}`;
                const res = await apiFetch(endpoint);
                if (!res.error) setDetails(res);

                const recEndpoint = mediaType === 'movie'
                    ? `/api/discovery/proxy/movie/${mediaId}/recommendations`
                    : `/api/discovery/proxy/tv/${mediaId}/recommendations`;
                const recRes = await apiFetch(recEndpoint);
                if (!recRes.error && recRes.results) setRecommendations(recRes.results);
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
                body: JSON.stringify({ mediaType, mediaId }),
            });
            if (res.error) {
                pushToast?.(res.error, 'error');
            } else {
                pushToast?.('Request submitted successfully!', 'success');
                setDetails({
                    ...details,
                    mediaInfo: { ...details.mediaInfo, status: 2 },
                });
            }
        } catch (err: any) {
            pushToast?.(err.message || 'Failed to submit request', 'error');
        }
        setRequestLoading(false);
    };

    const openPerson = (personId: number) => {
        window.history.pushState({}, '', `/discovery/person/${personId}`);
        window.dispatchEvent(new Event('popstate'));
    };

    const openMedia = (type: string, id: number) => {
        window.history.pushState({}, '', `/discovery/${type}/${id}`);
        window.dispatchEvent(new Event('popstate'));
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
    const creators = details.createdBy?.map((c: any) => c.name).filter(Boolean).join(', ');
    const productionCompanies = details.productionCompanies?.slice(0, 4).map((c: any) => c.name).join(' · ');

    const metaChips: { icon: React.ReactNode; label: string }[] = [];
    if (year) metaChips.push({ icon: <Calendar className="w-3.5 h-3.5 text-white/50" />, label: year });
    if (details.voteAverage > 0) {
        metaChips.push({
            icon: <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />,
            label: details.voteAverage.toFixed(1),
        });
    }
    if (details.productionCountries?.[0]) {
        metaChips.push({
            icon: <Globe className="w-3.5 h-3.5 text-white/50" />,
            label: details.productionCountries[0].iso_3166_1,
        });
    }
    if (mediaType === 'movie' && details.runtime > 0) {
        metaChips.push({ icon: <Clock className="w-3.5 h-3.5 text-white/50" />, label: `${details.runtime} min` });
    }
    if (mediaType === 'tv' && details.numberOfSeasons) {
        metaChips.push({
            icon: <Tv className="w-3.5 h-3.5 text-white/50" />,
            label: `${details.numberOfSeasons} season${details.numberOfSeasons === 1 ? '' : 's'}`,
        });
    }
    if (mediaType === 'tv' && details.numberOfEpisodes) {
        metaChips.push({
            icon: <Film className="w-3.5 h-3.5 text-white/50" />,
            label: `${details.numberOfEpisodes} eps`,
        });
    }

    const extraDetails: { label: string; value: string }[] = [];
    if (details.tagline) extraDetails.push({ label: 'Tagline', value: details.tagline });
    if (creators) extraDetails.push({ label: 'Created by', value: creators });
    if (details.originalLanguage) {
        extraDetails.push({ label: 'Language', value: details.originalLanguage.toUpperCase() });
    }
    if (mediaType === 'tv' && details.lastAirDate) {
        extraDetails.push({ label: 'Last aired', value: details.lastAirDate.substring(0, 10) });
    }
    if (productionCompanies) extraDetails.push({ label: 'Studio', value: productionCompanies });

    const visibleRecommendations = filterHiddenAvailableItems(recommendations, preferences.hideAvailableMedia);

    return (
        <div className="w-full flex flex-col min-h-screen bg-card animate-fade-in pb-16 rounded-2xl md:rounded-3xl overflow-x-hidden border border-white/5 shadow-2xl">
            <div className="sticky top-0 z-50 w-full px-4 sm:px-8 py-4 flex items-center bg-gradient-to-b from-black/80 to-transparent">
                <button
                    type="button"
                    onClick={onBack}
                    className="flex items-center gap-2 text-white/80 hover:text-white transition-colors bg-black/40 px-4 py-2 rounded-full backdrop-blur-md border border-white/10"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="font-bold text-sm">Back to Discover</span>
                </button>
            </div>

            <div className="relative w-full h-[40vh] sm:h-[45vh] -mt-[72px] bg-black">
                {details.backdropPath ? (
                    <img
                        src={`https://image.tmdb.org/t/p/w1280${details.backdropPath}`}
                        alt=""
                        className="w-full h-full object-cover opacity-35"
                    />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-card/90 via-card/30 to-transparent hidden md:block" />
            </div>

            {/* Poster + core info */}
            <div className="relative z-10 w-full max-w-[1600px] mx-auto px-4 sm:px-8 xl:px-12 -mt-24 sm:-mt-32 flex flex-col md:flex-row gap-6 lg:gap-10">
                <div className="flex flex-col gap-4 w-40 sm:w-52 lg:w-56 flex-shrink-0 mx-auto md:mx-0">
                    <div className="w-full aspect-[2/3] rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-black/50">
                        {posterUrl && !posterFailed ? (
                            <img
                                src={posterUrl}
                                alt=""
                                className="w-full h-full object-cover"
                                onError={() => setPosterFailed(true)}
                            />
                        ) : (
                            <NoPosterPlaceholder />
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={handleRequest}
                        disabled={requestLoading || isAvailable || isPending}
                        className={`w-full py-3 px-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-lg ${
                            isAvailable
                                ? 'bg-green-500/20 text-green-500 border border-green-500/30 cursor-default'
                                : isPending
                                    ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30 cursor-default'
                                    : 'bg-plex hover:bg-plex-hover text-white disabled:opacity-50 disabled:cursor-not-allowed'
                        }`}
                    >
                        {requestLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isAvailable ? (
                            <><CheckCircle className="w-4 h-4" /> Available</>
                        ) : isPending ? (
                            <><Clock className="w-4 h-4" /> Request Pending</>
                        ) : (
                            <><PlusCircle className="w-4 h-4" /> Request {mediaType === 'tv' ? 'Series' : 'Movie'}</>
                        )}
                    </button>

                    {details.homepage && (
                        <a
                            href={details.homepage}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full py-2.5 px-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors"
                        >
                            <Globe className="w-4 h-4" /> Visit Website
                        </a>
                    )}
                </div>

                <div className="flex-1 min-w-0 flex flex-col gap-5 pt-2 sm:pt-4 pb-2">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                            {mediaType === 'movie' ? <Film className="w-3.5 h-3.5 text-plex" /> : <Tv className="w-3.5 h-3.5 text-plex" />}
                            <span className="text-[10px] font-bold uppercase tracking-widest text-plex">{mediaType}</span>
                            {details.status && (
                                <>
                                    <span className="text-white/30">•</span>
                                    <span className="text-[10px] font-bold text-white/60 uppercase tracking-wide">{details.status}</span>
                                </>
                            )}
                        </div>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight tracking-tight">
                            {title}
                        </h1>
                        {details.tagline && mediaType === 'movie' && (
                            <p className="text-sm text-white/50 italic">{details.tagline}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                            {metaChips.map((chip) => (
                                <div
                                    key={chip.label}
                                    className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-md backdrop-blur-sm border border-white/5 text-xs text-white/80 font-medium"
                                >
                                    {chip.icon}
                                    {chip.label}
                                </div>
                            ))}
                        </div>
                        {details.genres?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-1">
                                {details.genres.map((g: any) => (
                                    <span key={g.id} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-md text-xs font-semibold text-white/70">
                                        {g.name}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    <p className="text-sm sm:text-base text-white/80 leading-relaxed max-w-3xl">
                        {details.overview || 'No description available.'}
                    </p>

                    <DiscoveryFactWidget mediaType={mediaType} mediaId={mediaId} />

                    {extraDetails.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 max-w-3xl">
                            {extraDetails.map((row) => (
                                <div key={row.label} className="flex flex-col gap-0.5 min-w-0">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/35">{row.label}</span>
                                    <span className="text-sm text-white/75 truncate">{row.value}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {details.networks?.length > 0 && (
                        <div className="flex flex-col gap-2">
                            <SectionHeading>Networks</SectionHeading>
                            <div className="flex flex-wrap gap-3 items-center">
                                {details.networks.map((n: any) => (
                                    <div key={n.id} className="flex items-center">
                                        {n.logoPath ? (
                                            <img
                                                src={`https://image.tmdb.org/t/p/w92${n.logoPath}`}
                                                alt={n.name}
                                                className="h-4 max-w-[64px] object-contain filter invert opacity-70"
                                            />
                                        ) : (
                                            <span className="text-xs font-semibold text-white/70">{n.name}</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Full-width rows below — no nested page scrollbars */}
            <div className="relative z-10 w-full max-w-[1600px] mx-auto px-4 sm:px-8 xl:px-12 mt-6 flex flex-col gap-8">
                {details.credits?.cast?.length > 0 && (
                    <section className="border-t border-white/5 pt-6">
                        <SectionHeading>Top Cast</SectionHeading>
                        <Carousel>
                            {details.credits.cast.slice(0, 15).map((actor: any) => (
                                <button
                                    key={actor.id}
                                    type="button"
                                    onClick={() => openPerson(actor.id)}
                                    className="flex flex-col items-center gap-2 w-24 flex-shrink-0 snap-start cursor-pointer hover:opacity-80 transition-opacity border-0 bg-transparent p-0"
                                >
                                    <div className="w-16 h-16 rounded-full bg-black/40 border border-white/10 overflow-hidden shadow-lg">
                                        {actor.profilePath ? (
                                            <img
                                                src={`https://image.tmdb.org/t/p/w185${actor.profilePath}`}
                                                alt={actor.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-white/20">
                                                <Users className="w-6 h-6" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-center w-full px-1">
                                        <div className="text-xs font-bold text-white/90 leading-tight line-clamp-2">{actor.name}</div>
                                        <div className="text-[10px] text-white/45 mt-0.5 leading-snug line-clamp-2">{actor.character}</div>
                                    </div>
                                </button>
                            ))}
                        </Carousel>
                    </section>
                )}

                {mediaType === 'tv' && details.seasons?.length > 0 && (
                    <section className="border-t border-white/5 pt-6">
                        <SectionHeading>Seasons</SectionHeading>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mt-3">
                            {details.seasons.filter((s: any) => s.seasonNumber >= 0).map((s: any) => (
                                <div key={s.id} className="bg-white/5 border border-white/10 rounded-lg p-3 flex gap-3 items-center min-w-0">
                                    <div className="w-10 h-14 rounded overflow-hidden flex-shrink-0 bg-black/40">
                                        {s.posterPath ? (
                                            <img src={`https://image.tmdb.org/t/p/w92${s.posterPath}`} className="w-full h-full object-cover" alt="" />
                                        ) : (
                                            <NoPosterPlaceholder compact />
                                        )}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-bold text-white text-sm truncate">{s.name}</span>
                                        <span className="text-xs text-white/50">{s.episodeCount} episodes</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {visibleRecommendations.length > 0 && (
                    <section className="border-t border-white/5 pt-6 pb-4">
                        <SectionHeading>Recommendations</SectionHeading>
                        <Carousel>
                            {visibleRecommendations.map((item, idx) => {
                                const formatted = formatItem(item);
                                return (
                                    <div key={`${formatted.id}-${idx}`} className="w-[120px] sm:w-[140px] flex-shrink-0 snap-start">
                                        <DiscoverPosterCard
                                            item={formatted}
                                            overlay={formatted.overlay}
                                            showQualityBadges={false}
                                            onPosterClick={() => openMedia(formatted.type, formatted.id)}
                                        />
                                    </div>
                                );
                            })}
                        </Carousel>
                    </section>
                )}
            </div>
        </div>
    );
};
