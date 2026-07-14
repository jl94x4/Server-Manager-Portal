import React, { useState, useEffect } from 'react';
import { PlusCircle, CheckCircle, Clock, ArrowLeft, Star, Calendar, Globe, Film, Tv, Loader2, Users, Ticket, Cloud, Disc } from 'lucide-react';
import { apiFetch } from '../shared/api';
import { DiscoverPosterCard } from '../screens';
import { Carousel } from './Carousel';
import { DiscoveryFactWidget } from './DiscoveryFactWidget';
import { NoPosterPlaceholder } from '../shared/NoPosterPlaceholder';
import { filterHiddenAvailableItems, useDiscoveryPreferences } from './useDiscoveryPreferences';
import { tmdbBackdropUrl } from './discoverConstants';

const SectionHeading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="flex items-center gap-3 mb-4">
        <h3 className="text-xs font-black text-white/50 uppercase tracking-[0.2em]">{children}</h3>
        <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
    </div>
);

type RadarrReleaseDates = {
    inCinemas?: string | null;
    digitalRelease?: string | null;
    physicalRelease?: string | null;
};

const formatRadarrReleaseDate = (value?: string | null) => {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
};

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
    const [radarrReleases, setRadarrReleases] = useState<RadarrReleaseDates | null>(null);

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

    useEffect(() => {
        if (mediaType !== 'movie') {
            setRadarrReleases(null);
            return;
        }
        let cancelled = false;
        apiFetch(`/api/discovery/radarr-releases?tmdbId=${mediaId}`)
            .then((res) => {
                if (!cancelled && res?.configured && res?.releases) {
                    setRadarrReleases(res.releases);
                }
            })
            .catch(() => {
                if (!cancelled) setRadarrReleases(null);
            });
        return () => {
            cancelled = true;
        };
    }, [mediaId, mediaType]);

    const handleRequest = async () => {
        if (!details) return;
        setRequestLoading(true);
        try {
            const res = await apiFetch('/api/discovery/request', {
                method: 'POST',
                body: JSON.stringify({
                    mediaType,
                    mediaId,
                    ...(mediaType === 'tv' ? { seasons: 'all' } : {}),
                }),
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

    const openGenre = (genreId: number) => {
        const path = mediaType === 'movie'
            ? `/discovery/movies?genre=${genreId}`
            : `/discovery/series?genre=${genreId}`;
        window.history.pushState({}, '', path);
        window.dispatchEvent(new Event('popstate'));
    };

    const openNetwork = (networkId: number) => {
        window.history.pushState({}, '', `/discovery/series/network/${networkId}`);
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
    const backdropUrl = tmdbBackdropUrl(details.backdropPath || '');
    const creators = details.createdBy?.map((c: any) => c.name).filter(Boolean).join(', ');
    const productionCompanies = details.productionCompanies?.slice(0, 4).map((c: any) => c.name).join(' · ');
    const director = details.credits?.crew?.find((c: any) => c.job === 'Director')?.name;
    const voteCountLabel = details.voteCount > 0
        ? `${details.voteCount >= 1000 ? `${(details.voteCount / 1000).toFixed(1)}k` : details.voteCount} votes`
        : null;

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
    if (director && mediaType === 'movie') extraDetails.push({ label: 'Director', value: director });
    if (creators) extraDetails.push({ label: 'Created by', value: creators });
    if (details.originalLanguage) {
        extraDetails.push({ label: 'Language', value: details.originalLanguage.toUpperCase() });
    }
    if (mediaType === 'tv' && details.lastAirDate) {
        extraDetails.push({ label: 'Last aired', value: details.lastAirDate.substring(0, 10) });
    }
    if (productionCompanies) extraDetails.push({ label: 'Studio', value: productionCompanies });

    const visibleRecommendations = filterHiddenAvailableItems(recommendations, preferences.hideAvailableMedia);
    const releaseDateRows = mediaType === 'movie' && radarrReleases
        ? [
            { key: 'cinema', icon: Ticket, label: 'Cinema release', date: formatRadarrReleaseDate(radarrReleases.inCinemas) },
            { key: 'streaming', icon: Cloud, label: 'Streaming release', date: formatRadarrReleaseDate(radarrReleases.digitalRelease) },
            { key: 'bluray', icon: Disc, label: 'Blu-ray release', date: formatRadarrReleaseDate(radarrReleases.physicalRelease) },
        ].filter((row) => row.date)
        : [];

    return (
        <div className="w-full flex flex-col min-h-screen bg-card animate-fade-in pb-16 rounded-2xl md:rounded-3xl overflow-x-hidden border border-white/5 shadow-2xl">
            <div className="relative isolate">
                <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
                    {backdropUrl ? (
                        <img
                            src={backdropUrl}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover object-[78%_22%] opacity-80"
                            fetchPriority="high"
                            decoding="async"
                        />
                    ) : (
                        <div className="absolute inset-0 bg-black" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-card from-0% via-card/90 via-[38%] to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-card from-0% via-card/80 via-[32%] to-transparent to-[78%]" />
                </div>

                <div className="relative z-10 w-full max-w-[1600px] mx-auto px-4 sm:px-8 xl:px-12 pt-4 sm:pt-5 pb-8">
                    <button
                        type="button"
                        onClick={onBack}
                        className="mb-6 inline-flex items-center gap-2 text-white/90 hover:text-white transition-colors bg-black/50 px-4 py-2 rounded-full backdrop-blur-md border border-white/10 hover:border-white/20 hover:bg-black/65"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-bold text-sm">Back to Discover</span>
                    </button>

                    <div className="flex flex-col md:flex-row gap-6 lg:gap-10">
                <div className="flex flex-col gap-4 w-44 sm:w-52 lg:w-60 flex-shrink-0 mx-auto md:mx-0">
                    <div className="relative w-full aspect-[2/3] rounded-xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.55)] border border-white/15 bg-black/50 ring-1 ring-white/10">
                        <div className="absolute -inset-4 bg-plex/10 blur-3xl opacity-40 pointer-events-none" />
                        {posterUrl && !posterFailed ? (
                            <img
                                src={posterUrl}
                                alt=""
                                className="relative w-full h-full object-cover"
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

                <div className="flex-1 min-w-0 flex flex-col gap-4 pb-2">
                    <div className="flex flex-col gap-2.5">
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
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-[1.05] tracking-tight drop-shadow-lg">
                            {title}
                        </h1>
                        {details.tagline && mediaType === 'movie' && (
                            <p className="text-sm sm:text-base text-white/55 italic max-w-2xl">{details.tagline}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-2">
                            {metaChips.map((chip) => (
                                <div
                                    key={chip.label}
                                    className="flex items-center gap-1.5 bg-black/45 px-3 py-1.5 rounded-lg backdrop-blur-md border border-white/10 text-xs text-white/85 font-semibold shadow-sm"
                                >
                                    {chip.icon}
                                    {chip.label}
                                </div>
                            ))}
                            {voteCountLabel && (
                                <div className="text-[11px] text-white/40 font-medium px-1">
                                    {voteCountLabel}
                                </div>
                            )}
                        </div>
                        {details.genres?.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {details.genres.map((g: any) => (
                                    <button
                                        key={g.id}
                                        type="button"
                                        onClick={() => openGenre(g.id)}
                                        className="px-2.5 py-1 bg-white/[0.06] border border-white/10 rounded-lg text-xs font-semibold text-white/75 backdrop-blur-sm transition-colors hover:bg-plex/15 hover:border-plex/40 hover:text-white cursor-pointer"
                                    >
                                        {g.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <p className="text-sm sm:text-base lg:text-[17px] text-white/82 leading-relaxed max-w-3xl">
                        {details.overview || 'No description available.'}
                    </p>

                    {releaseDateRows.length > 0 && (
                        <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-8 max-w-3xl">
                            <h3 className="text-base sm:text-lg font-bold text-white shrink-0">Release Dates</h3>
                            <div className="flex flex-col gap-2.5">
                                {releaseDateRows.map((row) => {
                                    const Icon = row.icon;
                                    return (
                                        <div key={row.key} className="flex items-center gap-3 text-white/70">
                                            <Icon className="w-4 h-4 text-white/45 shrink-0" aria-hidden />
                                            <span className="text-sm sm:text-base">{row.date}</span>
                                            <span className="sr-only">{row.label}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <DiscoveryFactWidget mediaType={mediaType} mediaId={mediaId} />

                    {extraDetails.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 max-w-3xl">
                            {extraDetails.map((row) => (
                                <div key={row.label} className="flex flex-col gap-0.5 min-w-0">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/35">{row.label}</span>
                                    <span className="text-sm text-white/80">{row.value}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {details.networks?.length > 0 && (
                        <div className="flex flex-col gap-2">
                            <SectionHeading>Networks</SectionHeading>
                            <div className="flex flex-wrap gap-5 items-center">
                                {details.networks.map((n: any) => (
                                    <button
                                        key={n.id}
                                        type="button"
                                        onClick={() => openNetwork(n.id)}
                                        className="flex items-center rounded-lg border border-transparent px-2 py-1.5 transition-all hover:border-white/15 hover:bg-white/[0.04] cursor-pointer"
                                        title={`Browse ${n.name}`}
                                    >
                                        {n.logoPath ? (
                                            <img
                                                src={`https://image.tmdb.org/t/p/w154${n.logoPath}`}
                                                alt={n.name}
                                                className="h-6 max-w-[120px] object-contain opacity-90 hover:opacity-100 transition-opacity"
                                            />
                                        ) : (
                                            <span className="text-xs font-semibold text-white/70 hover:text-white transition-colors">{n.name}</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                    </div>
                </div>
            </div>

            {/* Full-width rows below — no nested page scrollbars */}
            <div className="relative z-10 w-full max-w-[1600px] mx-auto px-4 sm:px-8 xl:px-12 mt-4 flex flex-col gap-10">
                {details.credits?.cast?.length > 0 && (
                    <section className="border-t border-white/5 pt-8">
                        <SectionHeading>Top Cast</SectionHeading>
                        <Carousel>
                            {details.credits.cast.slice(0, 15).map((actor: any) => (
                                <button
                                    key={actor.id}
                                    type="button"
                                    onClick={() => openPerson(actor.id)}
                                    className="group flex flex-col items-center gap-3 w-36 sm:w-40 flex-shrink-0 snap-start cursor-pointer transition-all duration-200 border-0 bg-transparent p-0 hover:-translate-y-1"
                                >
                                    <div className="w-32 h-32 rounded-full bg-black/40 border-2 border-white/10 group-hover:border-plex/40 overflow-hidden shadow-xl ring-0 group-hover:ring-4 group-hover:ring-plex/10 transition-all">
                                        {actor.profilePath ? (
                                            <img
                                                src={`https://image.tmdb.org/t/p/w342${actor.profilePath}`}
                                                alt={actor.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-white/20 bg-white/5">
                                                <Users className="w-10 h-10" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-center w-full px-1">
                                        <div className="text-sm font-bold text-white/95 leading-tight line-clamp-2 group-hover:text-white transition-colors">{actor.name}</div>
                                        <div className="text-xs text-white/45 mt-1 leading-snug line-clamp-2">{actor.character}</div>
                                    </div>
                                </button>
                            ))}
                        </Carousel>
                    </section>
                )}

                {mediaType === 'tv' && details.seasons?.length > 0 && (
                    <section className="border-t border-white/5 pt-8">
                        <SectionHeading>Seasons</SectionHeading>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                            {details.seasons.filter((s: any) => s.seasonNumber >= 0).map((s: any) => (
                                <div key={s.id} className="bg-white/[0.04] border border-white/10 rounded-xl p-3 flex gap-3 items-center min-w-0 hover:bg-white/[0.07] hover:border-white/15 transition-colors">
                                    <div className="w-11 h-16 rounded-md overflow-hidden flex-shrink-0 bg-black/40 border border-white/10">
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
                    <section className="border-t border-white/5 pt-8 pb-4">
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
