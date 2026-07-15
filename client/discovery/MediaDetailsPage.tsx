import React, { useState, useEffect, useMemo } from 'react';
import { PlusCircle, CheckCircle, Clock, ArrowLeft, Star, Calendar, Globe, Film, Tv, Loader2, Users, Ticket, Cloud, Disc, AlertTriangle } from 'lucide-react';
import { apiFetch } from '../shared/api';
import { portalUrl } from '../shared/basePath';
import { DiscoverPosterCard } from '../screens';
import { Carousel } from './Carousel';
import { DiscoveryFactWidget } from './DiscoveryFactWidget';
import { NoPosterPlaceholder } from '../shared/NoPosterPlaceholder';
import { filterHiddenAvailableItems, useDiscoveryPreferences } from './useDiscoveryPreferences';
import { tmdbBackdropUrl } from './discoverConstants';
import { RequestModal } from './RequestModal';
import { ReportIssueModal } from './ReportIssueModal';
import { resolveMediaAvailabilityState } from './discoverAvailability';
import { MediaStatusPanel } from './DiscoverStatusOverlay';
import { DiscoveryLogo } from './DiscoveryLogo';
import { scrollPortalToTop } from './discoverNavigationUtils';
import { MediaOverviewExtras } from './MediaOverviewExtras';
import type { CombinedRatings } from './mediaDetailUtils';
import { fetchCombinedRatings } from './mediaDetailUtils';
import {
    buildSeasonStatusFromDetails,
    getRequestButtonState,
    seasonStatusBadgeClass,
} from './requestSeasonUtils';

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

const formatOrdinalDay = (day: number) => {
    const mod100 = day % 100;
    if (mod100 >= 11 && mod100 <= 13) return `${day}th`;
    const mod10 = day % 10;
    if (mod10 === 1) return `${day}st`;
    if (mod10 === 2) return `${day}nd`;
    if (mod10 === 3) return `${day}rd`;
    return `${day}th`;
};

const formatRadarrReleaseDate = (value?: string | null) => {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    const day = parsed.getDate();
    const monthYear = parsed.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    return `${formatOrdinalDay(day)} ${monthYear}`;
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
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [posterFailed, setPosterFailed] = useState(false);
    const [radarrReleases, setRadarrReleases] = useState<RadarrReleaseDates | null>(null);
    const [ratings, setRatings] = useState<CombinedRatings | null>(null);
    const [requestModalOpen, setRequestModalOpen] = useState(false);
    const [issueModalOpen, setIssueModalOpen] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const fetchDetails = async () => {
            setLoading(true);
            setPosterFailed(false);
            try {
                const detailEndpoint = mediaType === 'movie'
                    ? `/api/discovery/proxy/movie/${mediaId}`
                    : `/api/discovery/proxy/tv/${mediaId}`;
                const recEndpoint = mediaType === 'movie'
                    ? `/api/discovery/proxy/movie/${mediaId}/recommendations`
                    : `/api/discovery/proxy/tv/${mediaId}/recommendations`;

                const [res, recRes] = await Promise.all([
                    apiFetch(detailEndpoint),
                    apiFetch(recEndpoint).catch(() => null),
                ]);

                if (cancelled) return;
                if (!res?.error) setDetails(res);
                if (recRes && !recRes.error && recRes.results) setRecommendations(recRes.results);
            } catch (err) {
                console.error(err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchDetails();
        return () => {
            cancelled = true;
        };
    }, [mediaId, mediaType]);

    useEffect(() => {
        if (mediaType !== 'tv' || loading || !details) return undefined;

        let cancelled = false;

        apiFetch(`/api/discovery/tv/${mediaId}/library-status`)
            .then((res) => {
                if (cancelled || !res?.sonarrLibraryStatus?.matched) return;
                setDetails((prev) => (prev ? {
                    ...prev,
                    sonarrLibraryStatus: res.sonarrLibraryStatus,
                    mediaInfo: {
                        ...(prev.mediaInfo || {}),
                        ...(res.sonarrLibraryStatus.showComplete ? { status: 5 } : {}),
                    },
                } : prev));
            })
            .catch(() => undefined);

        return () => {
            cancelled = true;
        };
    }, [mediaId, mediaType, loading, details?.id]);

    useEffect(() => {
        if (!details) {
            setRatings(null);
            return undefined;
        }
        let cancelled = false;
        fetchCombinedRatings(mediaType, mediaId)
            .then((res) => {
                if (!cancelled) setRatings(res);
            })
            .catch(() => {
                if (!cancelled) setRatings(null);
            });
        return () => {
            cancelled = true;
        };
    }, [details, mediaId, mediaType]);

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

    const refreshDetails = async () => {
        try {
            const endpoint = mediaType === 'movie'
                ? `/api/discovery/proxy/movie/${mediaId}`
                : `/api/discovery/proxy/tv/${mediaId}`;
            const res = await apiFetch(endpoint);
            if (!res.error) {
                setDetails(res);
                if (mediaType === 'tv') {
                    apiFetch(`/api/discovery/tv/${mediaId}/library-status`)
                        .then((lib) => {
                            if (!lib?.sonarrLibraryStatus?.matched) return;
                            setDetails((prev) => (prev ? {
                                ...prev,
                                sonarrLibraryStatus: lib.sonarrLibraryStatus,
                                mediaInfo: {
                                    ...(prev.mediaInfo || {}),
                                    ...(lib.sonarrLibraryStatus.showComplete ? { status: 5 } : {}),
                                },
                            } : prev));
                        })
                        .catch(() => undefined);
                }
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleRequestSuccess = (message: string) => {
        pushToast?.(message, 'success');
        refreshDetails();
    };

    const discoveryNavigate = (path: string) => {
        window.history.pushState({}, '', portalUrl(path));
        scrollPortalToTop();
        window.dispatchEvent(new Event('popstate'));
    };

    const openPerson = (personId: number) => {
        discoveryNavigate(`/discovery/person/${personId}`);
    };

    const openMedia = (type: string, id: number) => {
        discoveryNavigate(`/discovery/${type}/${id}`);
    };

    const openGenre = (genreId: number) => {
        const path = mediaType === 'movie'
            ? `/discovery/movies?genre=${genreId}`
            : `/discovery/series?genre=${genreId}`;
        discoveryNavigate(path);
    };

    const openKeyword = (keyword: { id: number; name: string }) => {
        const params = new URLSearchParams({
            keywords: String(keyword.id),
            keywordName: keyword.name,
        });
        const path = mediaType === 'movie'
            ? `/discovery/movies?${params.toString()}`
            : `/discovery/series?${params.toString()}`;
        discoveryNavigate(path);
    };

    const openStudio = (studioId: number) => {
        discoveryNavigate(`/discovery/movies/studio/${studioId}`);
    };

    const openNetwork = (networkId: number) => {
        discoveryNavigate(`/discovery/series/network/${networkId}`);
    };

    const seasonRows = useMemo(
        () => (mediaType === 'tv' && details ? buildSeasonStatusFromDetails(details) : []),
        [details, mediaType],
    );

    const availability = useMemo(
        () => (details ? resolveMediaAvailabilityState(details) : null),
        [details],
    );

    const handleRetryRequest = async () => {
        if (!availability?.userRequestId) return;
        try {
            const res = await apiFetch(`/api/discovery/my-requests/${availability.userRequestId}/retry`, {
                method: 'POST',
            });
            if (res?.error) throw new Error(res.error);
            pushToast?.(res?.message || 'Request retry submitted.', 'success');
            await refreshDetails();
        } catch (err: any) {
            pushToast?.(err?.message || 'Failed to retry request', 'error');
        }
    };

    const openMyRequests = () => {
        window.history.pushState({}, '', portalUrl('/discovery/requests'));
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
    const mediaStatus = details.mediaInfo?.status ?? null;
    const requestButton = getRequestButtonState(mediaType, mediaStatus, seasonRows, details.mediaInfo, details);
    const seerrMediaId = Number(details.mediaInfo?.id);
    const canReportIssue = Number.isFinite(seerrMediaId) && seerrMediaId > 0 && (
        mediaStatus === 4
        || mediaStatus === 5
        || availability?.kind === 'available'
        || availability?.kind === 'partial'
    );
    const posterUrl = details.posterPath ? `https://image.tmdb.org/t/p/w500${details.posterPath}` : '';
    const backdropUrl = tmdbBackdropUrl(details.backdropPath || '');
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
    if (details.tagline && mediaType === 'tv') {
        extraDetails.push({ label: 'Tagline', value: details.tagline });
    }

    const visibleRecommendations = filterHiddenAvailableItems(recommendations, preferences.hideAvailableMedia);
    const releaseDateRows = mediaType === 'movie' && radarrReleases
        ? [
            { key: 'cinema', icon: Ticket, label: 'Cinema', date: formatRadarrReleaseDate(radarrReleases.inCinemas) },
            { key: 'streaming', icon: Cloud, label: 'Streaming', date: formatRadarrReleaseDate(radarrReleases.digitalRelease) },
            { key: 'bluray', icon: Disc, label: 'Blu-ray', date: formatRadarrReleaseDate(radarrReleases.physicalRelease) },
        ].filter((row) => row.date)
        : [];

    return (
        <>
        <div className="w-[calc(100%+2rem)] -mx-4 md:mx-0 md:w-full flex flex-col min-h-screen bg-card animate-fade-in pb-24 md:pb-16 rounded-none md:rounded-2xl lg:rounded-3xl overflow-x-hidden border-0 md:border border-white/5 shadow-2xl">
            <div className="relative isolate">
                <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
                    {backdropUrl ? (
                        <img
                            src={backdropUrl}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover object-[center_20%] md:object-[78%_22%] opacity-25 md:opacity-80"
                            fetchPriority="high"
                            decoding="async"
                        />
                    ) : (
                        <div className="absolute inset-0 bg-black" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-card from-0% via-card via-[60%] md:via-card/90 md:via-[38%] to-card/40 md:to-transparent" />
                    <div className="absolute inset-0 hidden md:block bg-gradient-to-r from-card from-0% via-card/80 via-[32%] to-transparent to-[78%]" />
                </div>

                <div className="relative z-10 w-full max-w-[1600px] mx-auto px-4 sm:px-8 xl:px-12 pt-4 sm:pt-5 pb-8">
                    <button
                        type="button"
                        onClick={onBack}
                        className="mb-4 md:mb-6 inline-flex items-center gap-2 text-white/90 hover:text-white transition-colors bg-black/50 px-4 py-2 rounded-full backdrop-blur-md border border-white/10 hover:border-white/20 hover:bg-black/65"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-bold text-sm">Back to Discover</span>
                    </button>

                    <div className="flex flex-col md:flex-row gap-5 md:gap-6 lg:gap-10">
                <div className="w-full md:w-52 lg:w-60 flex-shrink-0 flex flex-col gap-4">
                    <div className="flex flex-row md:flex-col gap-4 items-stretch">
                        <div className="relative w-[38%] max-w-[10.5rem] sm:max-w-[12rem] md:w-full md:max-w-none aspect-[2/3] rounded-xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.55)] border border-white/15 bg-black/50 ring-1 ring-white/10 flex-shrink-0">
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

                        <div className="flex-1 min-w-0 flex flex-col justify-end gap-2 md:hidden">
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
                            <h1 className="text-2xl sm:text-3xl font-black text-white leading-[1.08] tracking-tight drop-shadow-lg">
                                {title}
                            </h1>
                            <div className="flex flex-wrap items-center gap-1.5">
                                {metaChips.slice(0, 4).map((chip) => (
                                    <div
                                        key={chip.label}
                                        className="flex items-center gap-1 bg-black/45 px-2 py-1 rounded-md backdrop-blur-md border border-white/10 text-[11px] text-white/85 font-semibold"
                                    >
                                        {chip.icon}
                                        {chip.label}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-2.5 w-full">
                    <button
                        type="button"
                        onClick={() => setRequestModalOpen(true)}
                        disabled={requestButton.disabled}
                        className={`w-full py-3 px-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-lg ${
                            requestButton.variant === 'available'
                                ? 'bg-green-500/20 text-green-500 border border-green-500/30 cursor-default'
                                : requestButton.variant === 'pending'
                                    ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30 cursor-default'
                                    : requestButton.variant === 'blocked'
                                        ? 'bg-red-500/15 text-red-400 border border-red-500/25 cursor-default'
                                        : 'bg-plex hover:bg-plex-hover text-white disabled:opacity-50 disabled:cursor-not-allowed'
                        }`}
                    >
                        {requestButton.variant === 'available' ? (
                            <><CheckCircle className="w-4 h-4" /> {requestButton.label}</>
                        ) : requestButton.variant === 'pending' ? (
                            <><Clock className="w-4 h-4" /> {requestButton.label}</>
                        ) : (
                            <><PlusCircle className="w-4 h-4" /> {requestButton.label}</>
                        )}
                    </button>

                    {canReportIssue && (
                        <button
                            type="button"
                            onClick={() => setIssueModalOpen(true)}
                            className="w-full py-3 px-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-100 border border-amber-500/30"
                        >
                            <AlertTriangle className="w-4 h-4" />
                            Report Issue
                        </button>
                    )}

                    {availability && availability.kind !== 'none' && (
                        <div className="sm:col-span-2 md:col-span-1">
                            <MediaStatusPanel
                                state={availability}
                                onViewRequests={availability.hasUserRequest ? openMyRequests : undefined}
                                onRetry={availability.kind === 'failed' ? handleRetryRequest : undefined}
                            />
                        </div>
                    )}

                    {details.homepage && (
                        <a
                            href={details.homepage}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full py-2.5 px-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors sm:col-span-2 md:col-span-1"
                        >
                            <Globe className="w-4 h-4" /> Visit Website
                        </a>
                    )}
                    </div>
                </div>

                <div className="flex-1 min-w-0 flex flex-col gap-4 pb-2">
                    <div className="hidden md:flex flex-col gap-2.5">
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

                    <p className="text-sm sm:text-base lg:text-[17px] text-white/82 leading-relaxed max-w-none md:max-w-3xl">
                        {details.overview || 'No description available.'}
                    </p>

                    {details.genres?.length > 0 && (
                        <div className="flex flex-wrap gap-2 md:hidden">
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

                    {releaseDateRows.length > 0 && (
                        <div className="w-fit max-w-full rounded-xl border border-white/10 bg-black/45 backdrop-blur-xl shadow-[0_8px_28px_rgba(0,0,0,0.28)] overflow-hidden ring-1 ring-white/[0.04]">
                            <div
                                className={`grid divide-white/[0.06] ${
                                    releaseDateRows.length === 1
                                        ? 'grid-cols-1'
                                        : releaseDateRows.length === 2
                                            ? 'grid-cols-2 divide-x'
                                            : 'grid-cols-3 divide-x'
                                }`}
                            >
                                {releaseDateRows.map((row) => {
                                    const Icon = row.icon;
                                    return (
                                        <div
                                            key={row.key}
                                            className="group relative px-3 py-2.5 flex items-start gap-2 min-w-0 sm:min-w-[8.5rem]"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                            <div className="relative w-7 h-7 shrink-0 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center group-hover:border-plex/30 group-hover:bg-plex/10 transition-colors">
                                                <Icon className="w-3.5 h-3.5 text-white/55 group-hover:text-plex transition-colors" aria-hidden />
                                            </div>
                                            <div className="relative flex flex-col gap-0.5 min-w-0 pt-0.5">
                                                <span className="text-[9px] font-bold uppercase tracking-wider text-white/40 leading-none">
                                                    {row.label}
                                                </span>
                                                <span className="text-xs font-semibold text-white/90 leading-snug">
                                                    {row.date}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <MediaOverviewExtras
                        mediaType={mediaType}
                        details={details}
                        ratings={ratings}
                        onOpenPerson={openPerson}
                        onOpenKeyword={openKeyword}
                        onOpenStudio={openStudio}
                        onOpenCollection={(collectionId) => {
                            window.open(`https://www.themoviedb.org/collection/${collectionId}`, '_blank', 'noopener,noreferrer');
                        }}
                    />

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
                                            <DiscoveryLogo
                                                logoPath={n.logoPath}
                                                alt={n.name}
                                                width={154}
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
            <div className="relative z-10 w-full max-w-[1600px] mx-auto px-4 sm:px-8 xl:px-12 mt-2 md:mt-4 flex flex-col gap-8 md:gap-10">
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

                {mediaType === 'tv' && seasonRows.length > 0 && (
                    <section className="border-t border-white/5 pt-8">
                        <SectionHeading>Seasons</SectionHeading>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                            {seasonRows.map((season) => (
                                <div key={season.seasonNumber} className="bg-white/[0.04] border border-white/10 rounded-xl p-3 flex gap-3 items-center min-w-0 hover:bg-white/[0.07] hover:border-white/15 transition-colors">
                                    <div className="w-11 h-16 rounded-md overflow-hidden flex-shrink-0 bg-black/40 border border-white/10">
                                        {season.posterPath ? (
                                            <img src={`https://image.tmdb.org/t/p/w92${season.posterPath}`} className="w-full h-full object-cover" alt="" />
                                        ) : (
                                            <NoPosterPlaceholder compact />
                                        )}
                                    </div>
                                    <div className="flex flex-col min-w-0 gap-1">
                                        <span className="font-bold text-white text-sm truncate">{season.name}</span>
                                        <span className="text-xs text-white/50">{season.episodeCount} episodes</span>
                                        <span className={`self-start text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full border ${seasonStatusBadgeClass(season.statusLabel, season.requestable)}`}>
                                            {season.statusLabel}
                                        </span>
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
        <RequestModal
            open={requestModalOpen}
            mediaType={mediaType}
            mediaId={mediaId}
            title={title}
            onClose={() => setRequestModalOpen(false)}
            onSuccess={handleRequestSuccess}
            onError={(msg) => pushToast?.(msg, 'error')}
        />
        {canReportIssue && (
            <ReportIssueModal
                open={issueModalOpen}
                mediaType={mediaType}
                title={title}
                seerrMediaId={seerrMediaId}
                onClose={() => setIssueModalOpen(false)}
                onSuccess={(msg) => pushToast?.(msg, 'success')}
                onError={(msg) => pushToast?.(msg, 'error')}
            />
        )}
        </>
    );
};
