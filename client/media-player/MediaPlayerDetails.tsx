import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Calendar, Check, ChevronDown, Clock, Eye, EyeOff, Film, Info, ListPlus, Loader2, Play, Star, Tv, Users } from 'lucide-react';
import {
    Carousel,
    CustomSelect,
    DiscoveryFactWidget,
    MediaRatingPills,
    NoPosterPlaceholder,
    useDiscoverGridSize,
    useDiscoverI18n,
    type CombinedRatings,
} from './host';
import { addMediaPlayerPlaylistItem, createMediaPlayerPlaylist, fetchMediaPlayerItem, fetchMediaPlayerItemMore, fetchMediaPlayerNeighbors, fetchMediaPlayerPlaylists, setMediaPlayerWatched } from './api';
import { MediaPlayerMediaInfo } from './MediaPlayerMediaInfo';
import { MediaPlayerThemeTune } from './MediaPlayerThemeTune';
import { EpisodeNeighbors, OverviewFacts, OverviewGenres, OverviewLinks, OverviewSummary } from './MediaPlayerOverview';
import { PlayerItemMenu } from './PlayerItemMenu';
import { PlayerRail } from './PlayerRail';
import { watchedTickPositionClass } from './playerSettings';
import { usePlayerSettings } from './usePlayerSettings';
import {
    formatBitrateMbps,
    formatEpisodeCode,
    formatPlayerDuration,
    formatPlayerResolution,
    isPlayerTrailer,
    plexImageUrl,
    plexBackdropUrl,
    plexLogoUrl,
    progressPercent,
    titleCaseProfile,
} from './playerUtils';
import { writePlayerScrollTop, readPlayerItemCache, takePlayerItemSeed, writePlayerItemCache } from './playerMemory';
import type { PlayerItem, PlayerLibraryHub, PlayerMediaPartInfo, PlayerPlayOptions, PlayerRatings } from './types';

type Props = {
    ratingKey: string;
    onBack: () => void;
    onOpenItem: (item: PlayerItem) => void;
    onOpenPerson: (person: { id: string; name: string; thumb?: string | null }) => void;
    onOpenStudio: (studio: { key: string; name: string; sectionKey?: string; mediaType?: 'movie' | 'show' }) => void;
    onPlay: (item: PlayerItem, opts?: PlayerPlayOptions) => void;
    onPlayNext?: (item: PlayerItem) => void;
    onToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
    isAdmin?: boolean;
    playlistsEnabled?: boolean;
    playing?: boolean;
    playbackActive?: boolean;
};

const SectionHeading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="flex items-center gap-3 mb-4 pr-16">
        <h3 className="text-xs font-black text-muted uppercase tracking-[0.2em]">{children}</h3>
        <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
    </div>
);

const CastAvatar: React.FC<{ name: string; thumb?: string | null }> = ({ name, thumb }) => {
    const [failed, setFailed] = useState(false);
    useEffect(() => {
        setFailed(false);
    }, [thumb]);
    const src = thumb && !failed ? plexImageUrl(thumb, 240, 240, { quality: 60 }) : '';
    return (
        <div
            data-tv-cast-avatar="1"
            className="relative w-36 h-36 rounded-full bg-white/5 border-2 border-border overflow-hidden transition-transform group-hover:scale-[1.03] group-hover:border-plex"
        >
            {src ? (
                <img
                    src={src}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={() => setFailed(true)}
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-muted bg-white/5" aria-hidden>
                    <Users className="w-12 h-12" />
                    <span className="sr-only">{name}</span>
                </div>
            )}
        </div>
    );
};

const typeLabel = (type: string) => {
    if (type === 'movie') return 'movie';
    if (type === 'show') return 'tv';
    if (type === 'season') return 'season';
    if (type === 'episode') return 'episode';
    return type;
};

const hasDetailsHero = (row?: PlayerItem | null) => Boolean(
    String(row?.thumb || '').trim() || String(row?.art || '').trim(),
);

const DetailsHeroSkeleton: React.FC<{ label: string }> = ({ label }) => (
    <div className="animate-fade-in" aria-busy="true" aria-live="polite">
        <span className="sr-only">{label}</span>
        <div className="flex flex-col md:flex-row gap-5 md:gap-6 lg:gap-10" aria-hidden="true">
            <div className="aspect-[2/3] w-[50%] max-w-[14.4rem] sm:max-w-[16.8rem] md:w-[19.2rem] lg:w-[21.6rem] flex-shrink-0 overflow-hidden rounded-3xl border border-white/10 bg-white/5 animate-pulse" />
            <div className="flex-1 min-w-0 flex flex-col gap-4 justify-end pb-2">
                <div className="h-3 w-20 rounded bg-white/10 animate-pulse" />
                <div className="h-10 w-2/3 max-w-md rounded-lg bg-white/10 animate-pulse" />
                <div className="h-4 w-24 rounded bg-white/10 animate-pulse" />
                <div className="space-y-2 max-w-xl">
                    <div className="h-4 w-full rounded bg-white/10 animate-pulse" />
                    <div className="h-4 w-5/6 rounded bg-white/10 animate-pulse" />
                    <div className="h-4 w-2/3 rounded bg-white/10 animate-pulse" />
                </div>
                <div className="flex gap-2 mt-1">
                    <div className="h-11 w-28 rounded-xl bg-white/10 animate-pulse" />
                    <div className="h-11 w-11 rounded-xl bg-white/10 animate-pulse" />
                    <div className="h-11 w-11 rounded-xl bg-white/10 animate-pulse" />
                </div>
            </div>
        </div>
    </div>
);

const toCombinedRatings = (ratings?: PlayerRatings | null): CombinedRatings | null => {
    if (!ratings) return null;
    return {
        rt: (ratings.rottenTomatoes || ratings.popcorn) ? {
            criticsScore: ratings.rottenTomatoes?.percent ?? undefined,
            audienceScore: ratings.popcorn?.percent ?? undefined,
            criticsRating: ratings.rottenTomatoes?.fresh === false ? 'Rotten' : 'Fresh',
            audienceRating: ratings.popcorn?.fresh === false ? 'Spilled' : 'Upright',
        } : undefined,
        imdb: ratings.imdb ? {
            criticsScore: ratings.imdb.value > 10 ? ratings.imdb.value / 10 : ratings.imdb.value,
            url: ratings.imdb.url,
        } : undefined,
    };
};

const ratingsHavePills = (ratings?: PlayerRatings | null) => (
    !!(ratings?.imdb || ratings?.rottenTomatoes || ratings?.popcorn || ratings?.tmdb)
);

const EPISODE_SWIPE_MIN_DX = 56;
const isCoarseMobileViewport = () => (
    typeof window !== 'undefined'
    && window.matchMedia('(max-width: 767px)').matches
);

const touchTargetBlocksEpisodeSwipe = (target: EventTarget | null) => {
    if (!(target instanceof Element)) return false;
    return Boolean(target.closest(
        'button, a, input, textarea, select, [role="slider"], [data-no-episode-swipe="1"]',
    ));
};

export const MediaPlayerDetails: React.FC<Props> = ({
    ratingKey,
    onBack,
    onOpenItem,
    onOpenPerson,
    onOpenStudio,
    onPlay,
    onPlayNext,
    onToast,
    isAdmin = false,
    playlistsEnabled = true,
    playing = false,
    playbackActive = false,
}) => {
    const { t } = useDiscoverI18n();
    const [settings] = usePlayerSettings();
    const [gridSize] = useDiscoverGridSize();
    const [item, setItem] = useState<PlayerItem | null>(() => readPlayerItemCache(ratingKey)?.item ?? null);
    const [children, setChildren] = useState<PlayerItem[]>(() => readPlayerItemCache(ratingKey)?.children || []);
    const [extras, setExtras] = useState<PlayerItem[]>(() => readPlayerItemCache(ratingKey)?.extras || []);
    const [related, setRelated] = useState<PlayerLibraryHub[]>(() => readPlayerItemCache(ratingKey)?.related || []);
    const [onDeck, setOnDeck] = useState<PlayerItem | null>(() => readPlayerItemCache(ratingKey)?.onDeck ?? null);
    const [neighbors, setNeighbors] = useState<{ previous: PlayerItem | null; next: PlayerItem | null }>({ previous: null, next: null });
    const [loading, setLoading] = useState(() => !readPlayerItemCache(ratingKey)?.item);
    const [error, setError] = useState<string | null>(null);
    const [posterFailed, setPosterFailed] = useState(false);
    const [backdropFailed, setBackdropFailed] = useState(false);
    const [posterReady, setPosterReady] = useState(false);
    const [backdropReady, setBackdropReady] = useState(false);
    const [logoFailed, setLogoFailed] = useState(false);
    const [logoReady, setLogoReady] = useState(false);
    const [mediaInfoOpen, setMediaInfoOpen] = useState(false);
    const [mediaInfoExpanded, setMediaInfoExpanded] = useState(true);
    const [mediaIndex, setMediaIndex] = useState(0);
    const [audioStreamId, setAudioStreamId] = useState('');
    const [subtitleStreamId, setSubtitleStreamId] = useState('');
    const [playlists, setPlaylists] = useState<PlayerItem[]>([]);
    const [playlistOpen, setPlaylistOpen] = useState(false);
    const [newPlaylistName, setNewPlaylistName] = useState('');
    const [playlistMessage, setPlaylistMessage] = useState('');
    const episodeSwipeRef = useRef<{ x: number; y: number } | null>(null);
    const neighborsRef = useRef(neighbors);
    neighborsRef.current = neighbors;
    const isTvShell = typeof document !== 'undefined' && (
        document.documentElement?.dataset?.tv === '1'
        || window.__PLEX_CLIENT__?.isTv === true
    );

    useLayoutEffect(() => {
        writePlayerScrollTop(0);
        const cached = readPlayerItemCache(ratingKey);
        const seed = takePlayerItemSeed(ratingKey);
        if (cached?.item) {
            setItem(cached.item);
            setChildren(cached.children || []);
            setExtras(cached.extras || []);
            setRelated(cached.related || []);
            setOnDeck(cached.onDeck ?? null);
            setLoading(false);
        } else if (seed && hasDetailsHero(seed)) {
            setItem(seed);
            setChildren([]);
            setExtras([]);
            setRelated([]);
            setOnDeck(null);
            setLoading(true);
        } else {
            setItem(null);
            setChildren([]);
            setExtras([]);
            setRelated([]);
            setOnDeck(null);
            setLoading(true);
        }
        setNeighbors({ previous: null, next: null });
        setError(null);
        setPosterFailed(false);
        setBackdropFailed(false);
        setPosterReady(false);
        setBackdropReady(false);
        setLogoFailed(false);
        setLogoReady(false);
        setMediaInfoOpen(false);
        setMediaInfoExpanded(true);
        setMediaIndex(0);
        setAudioStreamId('');
        setSubtitleStreamId('');
        setPlaylistOpen(false);
        setPlaylistMessage('');
    }, [ratingKey]);

    useEffect(() => {
        const onOverlayClose = () => {
            setPlaylistOpen(false);
            setMediaInfoOpen(false);
        };
        window.addEventListener('smp-tv-overlay-close', onOverlayClose);
        return () => window.removeEventListener('smp-tv-overlay-close', onOverlayClose);
    }, []);

    useEffect(() => {
        let cancelled = false;
        // Core first (title + seasons/episodes). Extras/related/on-deck land via /more.
        const morePromise = fetchMediaPlayerItemMore(ratingKey).catch(() => null);
        fetchMediaPlayerItem(ratingKey, { core: true })
            .then((data) => {
                if (cancelled) return false;
                setItem(data.item);
                setChildren(data.children || []);
                if (data.extras?.length) setExtras(data.extras);
                if (data.related?.length) setRelated(data.related);
                if (data.onDeck) setOnDeck(data.onDeck);
                setError(null);
                setLoading(false);
                return true;
            })
            .catch((err) => {
                if (cancelled) return false;
                let kept = false;
                setItem((prev) => {
                    if (prev && String(prev.ratingKey) === String(ratingKey)) {
                        kept = true;
                        return prev;
                    }
                    return null;
                });
                if (!kept) setError(String(err?.message || t('mediaPlayerPage.loadError')));
                setLoading(false);
                return false;
            })
            .then(async (ok) => {
                if (!ok || cancelled) return;
                const more = await morePromise;
                if (cancelled || !more) return;
                setExtras(more.extras || []);
                setRelated(more.related || []);
                if (more.onDeck !== undefined) setOnDeck(more.onDeck || null);
                const prev = readPlayerItemCache(ratingKey);
                if (prev?.item) {
                    writePlayerItemCache(ratingKey, {
                        ...prev,
                        extras: more.extras || [],
                        related: more.related || [],
                        onDeck: more.onDeck !== undefined ? more.onDeck : prev.onDeck,
                    });
                }
            });
        return () => { cancelled = true; };
        // Intentionally omit `t` — unstable translate refs must not restart the fetch loop.
    }, [ratingKey]);

    useEffect(() => {
        if (!item || item.type !== 'episode') {
            setNeighbors({ previous: null, next: null });
            return undefined;
        }
        let cancelled = false;
        fetchMediaPlayerNeighbors(item.ratingKey)
            .then((data) => {
                if (!cancelled) setNeighbors({ previous: data.previous || null, next: data.next || null });
            })
            .catch(() => {
                if (!cancelled) setNeighbors({ previous: null, next: null });
            });
        return () => { cancelled = true; };
    }, [item?.ratingKey, item?.type]);

    useEffect(() => {
        if (!settings.showPlaylists) {
            setPlaylists([]);
            return undefined;
        }
        let cancelled = false;
        fetchMediaPlayerPlaylists()
            .then((data) => {
                if (!cancelled) setPlaylists((data.items || []).filter((row) => !row.smart));
            })
            .catch(() => {
                if (!cancelled) setPlaylists([]);
            });
        return () => { cancelled = true; };
    }, [settings.showPlaylists]);

    useEffect(() => {
        if (!item || item.ratingKey !== ratingKey) return undefined;
        const src = plexLogoUrl(item.logo);
        setLogoReady(false);
        setLogoFailed(false);
        if (!src) {
            setLogoFailed(true);
            return undefined;
        }
        let cancelled = false;
        const img = new Image();
        const finish = (ok: boolean) => {
            if (cancelled) return;
            if (ok && img.naturalWidth > 0) setLogoReady(true);
            else setLogoFailed(true);
        };
        img.onload = () => finish(true);
        img.onerror = () => finish(false);
        img.src = src;
        if (img.complete) finish(img.naturalWidth > 0);
        return () => { cancelled = true; };
    }, [ratingKey, item?.ratingKey, item?.logo]);

    const trailer = useMemo(() => extras.find(isPlayerTrailer) || extras[0] || null, [extras]);
    const activeMediaPart = useMemo((): PlayerMediaPartInfo | null => {
        const mediaInfo = item?.mediaInfo || [];
        if (!mediaInfo.length) return null;
        const media = mediaInfo[Math.min(Math.max(0, mediaIndex), mediaInfo.length - 1)] || mediaInfo[0];
        return media?.parts?.[0] || null;
    }, [item?.mediaInfo, mediaIndex]);
    const audioTrackOptions = useMemo(
        () => (activeMediaPart?.audio || []).filter((row) => row.id),
        [activeMediaPart],
    );
    const subtitleTrackOptions = useMemo(
        () => (activeMediaPart?.subtitles || []).filter((row) => row.id),
        [activeMediaPart],
    );
    useEffect(() => {
        const preferredAudio = audioTrackOptions.find((row) => row.selected) || audioTrackOptions[0];
        const preferredSub = subtitleTrackOptions.find((row) => row.selected) || null;
        setAudioStreamId(preferredAudio?.id ? String(preferredAudio.id) : '');
        setSubtitleStreamId(preferredSub?.id ? String(preferredSub.id) : '');
    }, [item?.ratingKey, mediaIndex, audioTrackOptions, subtitleTrackOptions]);
    const mediaSummary = useMemo(() => {
        const mediaInfo = item?.mediaInfo || [];
        const first = mediaInfo[Math.min(Math.max(0, mediaIndex), Math.max(0, mediaInfo.length - 1))] || mediaInfo[0];
        const part = first?.parts?.[0] || activeMediaPart;
        if (!first && !part) return null;
        const resolution = formatPlayerResolution(part?.video?.height || first?.height, part?.video?.resolution || first?.videoResolution);
        const bitrate = formatBitrateMbps(part?.video?.bitrate || first?.bitrate);
        const codec = String(part?.video?.codec || first?.videoCodec || '').toUpperCase();
        const profile = titleCaseProfile(part?.video?.profile);
        const videoBits = [codec, profile].filter(Boolean).join(' ');
        const versions = [bitrate, resolution].filter(Boolean).join(', ');
        const selectedAudio = audioTrackOptions.find((row) => String(row.id) === String(audioStreamId))
            || part?.audio?.find((row) => row.selected)
            || part?.audio?.[0];
        const selectedSub = subtitleTrackOptions.find((row) => String(row.id) === String(subtitleStreamId))
            || null;
        return {
            versions: versions ? `${versions}${mediaInfo.length > 1 ? `, ${t('mediaPlayerPage.andMore')}` : ''}` : '',
            video: [resolution, videoBits ? `(${videoBits})` : ''].filter(Boolean).join(' '),
            audio: selectedAudio?.displayTitle || first?.audioCodec || '',
            subtitles: selectedSub?.displayTitle || '',
        };
    }, [activeMediaPart, audioStreamId, audioTrackOptions, item, mediaIndex, subtitleStreamId, subtitleTrackOptions, t]);
    const playOpts = useMemo((): PlayerPlayOptions => {
        const opts: PlayerPlayOptions = { mediaIndex };
        if (item?.type === 'movie' || item?.type === 'episode') {
            if (audioStreamId) opts.audioStreamId = audioStreamId;
            // Always send an explicit choice once the picker is shown ('' → Off).
            opts.subtitleStreamId = subtitleStreamId || '0';
        }
        return opts;
    }, [audioStreamId, item?.type, mediaIndex, subtitleStreamId]);

    useEffect(() => {
        setPosterReady(false);
        setPosterFailed(false);
        setBackdropReady(false);
        setBackdropFailed(false);
    }, [item?.ratingKey, item?.thumb, item?.art]);

    useEffect(() => {
        if (!isTvShell || !item?.canPlay) return undefined;
        let tries = 12;
        const tick = () => {
            const play = document.querySelector<HTMLElement>('[data-tv-play="1"]');
            if (play) {
                play.focus({ preventScroll: true });
                return;
            }
            if (tries-- <= 0) return;
            window.setTimeout(tick, 40);
        };
        const id = window.requestAnimationFrame(tick);
        return () => window.cancelAnimationFrame(id);
    }, [isTvShell, item?.ratingKey, item?.canPlay]);

    if (loading && !hasDetailsHero(item)) {
        return <DetailsHeroSkeleton label={t('mediaPlayerPage.loading')} />;
    }

    if (error || !item) {
        return (
            <div className="flex flex-col gap-4">
                <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-sm font-bold text-muted hover:text-text">
                    <ArrowLeft className="h-4 w-4" />
                    {t('mediaPlayerPage.back')}
                </button>
                <p className="font-bold text-text">{error || t('mediaPlayerPage.loadError')}</p>
            </div>
        );
    }

    const posterUrl = plexImageUrl(
        item.thumb,
        item.type === 'episode' ? 640 : 480,
        item.type === 'episode' ? 360 : 720,
        { quality: 70 },
    );
    const backdropUrl = plexBackdropUrl(item.art || item.thumb);
    const logoUrl = plexLogoUrl(item.logo);
    const showLogo = Boolean(logoUrl) && !logoFailed && logoReady;
    const showMissingPoster = !loading && (!posterUrl || posterFailed);
    const showPosterPulse = !showMissingPoster && (!posterReady || posterFailed || !posterUrl);
    const isEpisodeGrid = children.some((row) => row.type === 'episode');
    const canPlay = !!item.canPlay;
    const playLabel = item.type === 'show' || item.type === 'season'
        ? (Number(item.viewedLeafCount) > 0 ? t('mediaPlayerPage.resume') : t('mediaPlayerPage.play'))
        : (item.viewOffsetMs && item.viewOffsetMs > 15000
            ? t('mediaPlayerPage.resume')
            : t('mediaPlayerPage.play'));
    const genres = item.genres || [];
    const episodeCode = formatEpisodeCode(item);
    const watchedLeaves = Number(item.viewedLeafCount || 0);
    const totalLeaves = Number(item.leafCount || 0);
    const metaChips = [
        episodeCode ? { icon: null, label: episodeCode } : null,
        item.contentRating ? { icon: null, label: String(item.contentRating) } : null,
        item.year ? { icon: <Calendar className="h-3 w-3" />, label: String(item.year) } : null,
        item.durationMs ? { icon: <Clock className="h-3 w-3" />, label: formatPlayerDuration(item.durationMs) } : null,
        (item.type === 'show' || item.type === 'season') && totalLeaves > 0
            ? { icon: null, label: t('mediaPlayerPage.episodeProgressValue', { watched: watchedLeaves, total: totalLeaves }) }
            : null,
        !ratingsHavePills(item.ratings) && item.audienceRating ? { icon: <Star className="h-3 w-3 text-plex" />, label: String(item.audienceRating) } : null,
    ].filter(Boolean) as Array<{ icon: React.ReactNode; label: string }>;
    const streamRows = mediaSummary ? [
        mediaSummary.versions ? { label: t('mediaPlayerPage.versions'), value: mediaSummary.versions } : null,
        mediaSummary.video ? { label: t('mediaPlayerPage.video'), value: mediaSummary.video } : null,
        mediaSummary.audio ? { label: t('mediaPlayerPage.audio'), value: mediaSummary.audio } : null,
        { label: t('mediaPlayerPage.subtitles'), value: mediaSummary.subtitles || t('mediaPlayerPage.subtitlesOff') },
    ].filter(Boolean) as Array<{ label: string; value: string }> : [];
    const guestNames = new Set((item.guestStars || []).map((row) => String(row.name || '').toLowerCase()));
    const cast = (item.cast || []).filter((row) => !guestNames.has(String(row.name || '').toLowerCase()));
    const factMediaType = item.type === 'movie'
        ? 'movie'
        : (item.type === 'show' || item.type === 'season' || item.type === 'episode' ? 'tv' : null);
    const factMediaId = Number(item.tmdbId);
    const factTitle = item.type === 'episode' || item.type === 'season'
        ? (item.showTitle || item.title)
        : item.title;
    const showKey = item.type === 'season' ? item.parentRatingKey : item.grandparentRatingKey;
    const seasonKey = item.type === 'episode' ? item.parentRatingKey : (item.type === 'season' ? item.ratingKey : null);
    const showName = item.type === 'season' || item.type === 'episode' ? item.showTitle : null;
    const seasonLabel = item.type === 'episode'
        ? (item.seasonTitle || null)
        : (item.type === 'season' ? item.title : null);
    const openCrumb = (nextKey?: string | null) => {
        if (!nextKey || nextKey === item.ratingKey) return;
        const nextType = nextKey === seasonKey ? 'season' : 'show';
        onOpenItem({
            ratingKey: nextKey,
            title: nextType === 'season' ? (item.seasonTitle || item.title || '') : (item.showTitle || item.title || ''),
            type: nextType,
            thumb: item.thumb,
            art: item.art,
            showTitle: item.showTitle,
            canPlay: true,
        } as PlayerItem);
    };
    const tmdbScore = item.ratings?.tmdb?.percent != null ? `${item.ratings.tmdb.percent}%` : null;
    const posterTickClass = `${watchedTickPositionClass(
        item.type === 'episode' ? 'top-right' : settings.watchedTickPosition,
        { aboveProgress: progressPercent(item) > 0 },
    )} z-20 flex h-9 w-9 items-center justify-center rounded-full bg-plex text-zinc-950 shadow-lg ring-2 ring-black/30${
        item.type === 'episode'
            ? ''
            : ' opacity-0 transition-opacity duration-200 group-hover:opacity-100 [@media(hover:none)]:opacity-100'
    }`;
    const seasonTickClass = `${watchedTickPositionClass(settings.watchedTickPosition)} z-10 flex h-7 w-7 items-center justify-center rounded-full bg-plex text-zinc-950 shadow-md opacity-0 transition-opacity duration-200 group-hover:opacity-100 [@media(hover:none)]:opacity-100`;

    const onEpisodeSwipeStart = (event: React.TouchEvent) => {
        if (item.type !== 'episode' || playing || playbackActive) return;
        if (!isCoarseMobileViewport()) return;
        if (touchTargetBlocksEpisodeSwipe(event.target)) return;
        if (!neighborsRef.current.previous && !neighborsRef.current.next) return;
        const touch = event.touches[0];
        if (!touch) return;
        episodeSwipeRef.current = { x: touch.clientX, y: touch.clientY };
    };

    const onEpisodeSwipeEnd = (event: React.TouchEvent) => {
        const start = episodeSwipeRef.current;
        episodeSwipeRef.current = null;
        if (!start || item.type !== 'episode' || playing || playbackActive) return;
        if (!isCoarseMobileViewport()) return;
        const touch = event.changedTouches[0];
        if (!touch) return;
        const dx = touch.clientX - start.x;
        const dy = touch.clientY - start.y;
        if (Math.abs(dx) < EPISODE_SWIPE_MIN_DX) return;
        if (Math.abs(dx) < Math.abs(dy) * 1.2) return;
        const target = dx < 0 ? neighborsRef.current.next : neighborsRef.current.previous;
        if (target?.ratingKey) onOpenItem(target);
    };

    const onEpisodeSwipeCancel = () => {
        episodeSwipeRef.current = null;
    };

    const typeAndGenres = (
        <div className="media-details-kicker flex flex-wrap items-center gap-x-3 gap-y-2">
            <div className="flex items-center gap-2">
                {item.type === 'movie' ? <Film className="w-3.5 h-3.5 text-plex" /> : <Tv className="w-3.5 h-3.5 text-plex" />}
                <span className="text-[10px] font-bold uppercase tracking-widest text-plex">{typeLabel(item.type)}</span>
            </div>
            <OverviewGenres genres={genres} />
        </div>
    );

    const titleBlock = (
        <>
            {isTvShell ? null : typeAndGenres}
            {showName ? (
                showLogo ? (
                    <button
                        type="button"
                        onClick={() => openCrumb(showKey)}
                        disabled={!showKey}
                        className="self-start text-left disabled:cursor-default"
                    >
                        <img
                            src={logoUrl}
                            alt={showName}
                            className="h-10 sm:h-12 lg:h-16 w-auto max-w-[min(100%,26rem)] object-contain object-left drop-shadow-[0_10px_24px_rgba(0,0,0,0.7)]"
                        />
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={() => openCrumb(showKey)}
                        disabled={!showKey}
                        className="text-sm sm:text-lg font-black text-white/80 hover:text-plex transition-colors text-left disabled:hover:text-white/80 disabled:cursor-default"
                    >
                        {showName}
                    </button>
                )
            ) : null}
            {seasonLabel ? (
                item.type === 'episode' && seasonKey ? (
                    <button
                        type="button"
                        onClick={() => openCrumb(seasonKey)}
                        className="text-sm sm:text-base font-bold text-white/75 hover:text-plex transition-colors text-left"
                    >
                        {seasonLabel}
                    </button>
                ) : (
                    <p className="text-sm sm:text-base font-bold text-white/85">{seasonLabel}</p>
                )
            ) : null}
            {item.type === 'season' ? (
                <h1 className="sr-only">{item.title}</h1>
            ) : showLogo && !showName ? (
                <>
                    <img
                        src={logoUrl}
                        alt={item.title}
                        className="h-14 sm:h-20 lg:h-[6.5rem] w-auto max-w-[min(100%,32rem)] object-contain object-left drop-shadow-[0_12px_28px_rgba(0,0,0,0.75)]"
                    />
                    <h1 className="sr-only">{item.title}</h1>
                </>
            ) : (
                <h1 className="text-2xl sm:text-3xl lg:text-5xl font-black text-white leading-[1.08] tracking-tight drop-shadow-lg">
                    {item.title}
                </h1>
            )}
            {item.tagline ? (
                <p className="text-sm sm:text-base text-white/55 italic max-w-6xl">{item.tagline}</p>
            ) : null}
            <div className="flex flex-wrap items-center gap-1.5">
                {metaChips.map((chip) => (
                    <div key={chip.label} className="flex items-center gap-1 bg-black/45 px-2 py-1 rounded-md backdrop-blur-md border border-white/10 text-[11px] text-white/85 font-semibold">
                        {chip.icon}
                        {chip.label}
                    </div>
                ))}
            </div>
            <MediaRatingPills
                ratings={toCombinedRatings(item.ratings)}
                tmdbScore={tmdbScore}
                tmdbUrl={item.ratings?.tmdb?.url}
                interactive={!isTvShell}
            />
        </>
    );

    return (
        <div
            key={ratingKey}
            className="relative page-bleed-x md:w-full flex flex-col min-h-screen bg-card animate-fade-in pb-24 md:pb-16 rounded-none md:rounded-2xl lg:rounded-3xl overflow-x-hidden border-0 md:border border-white/5 shadow-2xl"
            onTouchStart={onEpisodeSwipeStart}
            onTouchEnd={onEpisodeSwipeEnd}
            onTouchCancel={onEpisodeSwipeCancel}
        >
            <div className="relative isolate">
                <div className="media-details-hero-backdrop absolute inset-x-0 top-0 h-[50rem] max-h-[92vh] sm:h-[52rem] md:h-[min(100vh,76rem)] md:max-h-none overflow-hidden pointer-events-none" aria-hidden>
                    {backdropUrl && !backdropFailed ? (
                        <img
                            key={backdropUrl}
                            src={backdropUrl}
                            alt=""
                            className={`absolute inset-0 w-full h-full object-cover object-[55%_30%] transition-opacity duration-700 ease-out md:object-[62%_28%] ${
                                backdropReady ? 'opacity-45 md:opacity-90' : 'opacity-0'
                            }`}
                            fetchPriority="high"
                            decoding="async"
                            onLoad={() => setBackdropReady(true)}
                            onError={() => setBackdropFailed(true)}
                        />
                    ) : (
                        <div className="absolute inset-0 bg-black" />
                    )}
                    <div className="media-details-hero-scrim-mobile absolute inset-0 bg-gradient-to-b from-black/50 via-card/65 via-[55%] to-card md:hidden" />
                    <div className="media-details-hero-scrim-bottom absolute inset-0 hidden md:block bg-gradient-to-t from-card from-0% via-card/65 via-[8%] to-transparent to-[36%]" />
                    <div className="media-details-hero-scrim-left absolute inset-0 hidden md:block bg-gradient-to-r from-card from-0% via-card/70 via-[28%] to-transparent to-[72%]" />
                </div>

                <div className={`media-details-hero-content relative z-10 w-full max-w-[2400px] mx-auto page-x sm:px-8 xl:px-12 pt-2 sm:pt-3 md:pt-2 ${children.length ? 'pb-5' : 'pb-8'}`}>
                    {!isTvShell ? (
                        <button
                            type="button"
                            onClick={onBack}
                            className="light-on-media mb-2 md:mb-3 inline-flex items-center gap-2 text-white/90 hover:text-white transition-colors bg-black/50 px-4 py-2 rounded-full backdrop-blur-md border border-white/10 hover:border-white/20 hover:bg-black/65"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span className="font-bold text-sm">{t('mediaPlayerPage.back')}</span>
                        </button>
                    ) : null}

                    {isTvShell && (item.type === 'episode' || item.type === 'season') ? (
                        <div className="mb-3 flex flex-wrap items-center gap-2" data-tv-rail="1">
                            {item.type === 'episode' && item.grandparentRatingKey ? (
                                <button
                                    type="button"
                                    data-tv-item="1"
                                    data-tv-action="1"
                                    onClick={() => onOpenItem({ ratingKey: String(item.grandparentRatingKey), type: 'show', title: item.showTitle || '', thumb: item.thumb, art: item.art, canPlay: true } as PlayerItem)}
                                    className="light-on-media inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/50 px-4 py-2 text-sm font-bold text-white/90 backdrop-blur-md transition-colors hover:bg-black/65 focus:border-plex focus:text-white"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    <span className="max-w-[24rem] truncate">{item.showTitle || t('mediaPlayerPage.back')}</span>
                                </button>
                            ) : null}
                            {item.type === 'episode' && item.parentRatingKey ? (
                                <button
                                    type="button"
                                    data-tv-item="1"
                                    data-tv-action="1"
                                    onClick={() => onOpenItem({ ratingKey: String(item.parentRatingKey), type: 'season', title: item.seasonTitle || '', thumb: item.thumb, art: item.art, showTitle: item.showTitle, canPlay: true } as PlayerItem)}
                                    className="light-on-media inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/50 px-4 py-2 text-sm font-bold text-white/90 backdrop-blur-md transition-colors hover:bg-black/65 focus:border-plex focus:text-white"
                                >
                                    <span className="max-w-[16rem] truncate">
                                        {item.seasonTitle || (item.parentIndex != null ? `Season ${item.parentIndex}` : t('mediaPlayerPage.seasons'))}
                                    </span>
                                </button>
                            ) : null}
                            {item.type === 'season' && item.parentRatingKey ? (
                                <button
                                    type="button"
                                    data-tv-item="1"
                                    data-tv-action="1"
                                    onClick={() => onOpenItem({ ratingKey: String(item.parentRatingKey), type: 'show', title: item.showTitle || '', thumb: item.thumb, art: item.art, canPlay: true } as PlayerItem)}
                                    className="light-on-media inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/50 px-4 py-2 text-sm font-bold text-white/90 backdrop-blur-md transition-colors hover:bg-black/65 focus:border-plex focus:text-white"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    <span className="max-w-[24rem] truncate">{item.showTitle || t('mediaPlayerPage.back')}</span>
                                </button>
                            ) : null}
                        </div>
                    ) : null}

                    {isTvShell ? (
                        <div className="media-details-kicker-row mb-4">
                            {typeAndGenres}
                        </div>
                    ) : null}

                    <div className="media-details-hero-row flex flex-col md:flex-row gap-5 md:gap-6 lg:gap-10">
                        <div className={`media-details-hero-poster w-full flex-shrink-0 flex flex-col gap-3 md:-mt-3 lg:-mt-4 ${item.type === 'episode' ? 'md:w-[28.8rem] lg:w-[33.6rem]' : 'md:w-[19.2rem] lg:w-[21.6rem]'}`}>
                            <div className={`flex flex-row md:flex-col gap-4 ${item.type === 'episode' ? 'items-start' : 'items-stretch'}`}>
                                <div
                                    className={
                                        item.type === 'episode'
                                            ? 'group relative aspect-video w-[min(70%,17.4rem)] sm:w-full sm:max-w-[21.6rem] md:max-w-none flex-shrink-0 overflow-hidden rounded-3xl border border-white/15 bg-black/50 shadow-[0_20px_60px_rgba(0,0,0,0.55)] ring-1 ring-white/10 outline-none'
                                            : 'group relative aspect-[2/3] w-[50%] max-w-[14.4rem] sm:max-w-[16.8rem] md:w-full md:max-w-none flex-shrink-0 overflow-hidden rounded-3xl border border-white/15 bg-black/50 shadow-[0_20px_60px_rgba(0,0,0,0.55)] ring-1 ring-white/10 outline-none'
                                    }
                                >
                                    <div data-tv-poster="1" className="pointer-events-none absolute inset-0 z-[5] rounded-[inherit]" aria-hidden />
                                    <div className="absolute -inset-4 bg-plex/10 blur-3xl opacity-40 pointer-events-none" />
                                    {posterUrl && !posterFailed ? (
                                        <img
                                            key={posterUrl}
                                            src={posterUrl}
                                            alt=""
                                            className={`relative z-0 w-full h-full object-cover transition-opacity duration-500 ease-out ${
                                                posterReady ? 'opacity-100' : 'opacity-0'
                                            }`}
                                            onLoad={() => setPosterReady(true)}
                                            onError={() => setPosterFailed(true)}
                                        />
                                    ) : null}
                                    {showPosterPulse ? (
                                        <div className="absolute inset-0 z-[1] animate-pulse bg-white/10" aria-hidden />
                                    ) : null}
                                    {showMissingPoster ? (
                                        <NoPosterPlaceholder />
                                    ) : null}
                                    {item.watched ? (
                                        <span
                                            title={t('mediaPlayerPage.watched')}
                                            className={posterTickClass}
                                        >
                                            <Check className="h-5 w-5 stroke-[2.5]" />
                                        </span>
                                    ) : null}
                                    {progressPercent(item) > 0 ? (
                                        <div className="absolute inset-x-0 bottom-0 z-[6] h-1.5 bg-black/70">
                                            <div className="h-full bg-plex" style={{ width: `${progressPercent(item)}%` }} />
                                        </div>
                                    ) : null}
                                    {item.themeKey && settings.playThemeTunes ? (
                                        <div className="relative z-10">
                                            <MediaPlayerThemeTune
                                                themeKey={item.themeKey}
                                                enabled
                                                paused={playing || playbackActive}
                                                playLabel={t('mediaPlayerPage.playTheme')}
                                                muteLabel={t('mediaPlayerPage.mute')}
                                                unmuteLabel={t('mediaPlayerPage.unmute')}
                                            />
                                        </div>
                                    ) : null}
                                </div>
                                <div className="light-on-media flex-1 min-w-0 flex flex-col justify-end gap-2 md:hidden">
                                    {titleBlock}
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col gap-4 pb-2">
                            <div className="light-on-media hidden md:flex flex-col gap-2.5">
                                {titleBlock}
                            </div>
                            <div className="media-details-panel flex w-full min-w-0 flex-col gap-5">
                                {item.summary ? (
                                    <OverviewSummary text={item.summary} />
                                ) : loading ? (
                                    <div className="space-y-2 max-w-xl" aria-hidden="true">
                                        <div className="h-4 w-full rounded bg-white/10 animate-pulse" />
                                        <div className="h-4 w-5/6 rounded bg-white/10 animate-pulse" />
                                        <div className="h-4 w-2/3 rounded bg-white/10 animate-pulse" />
                                    </div>
                                ) : (
                                    <OverviewSummary text={t('media.noDescription')} />
                                )}
                                {(canPlay
                                    || (item.versions || []).length > 1
                                    || trailer
                                    || item.mediaInfo?.length
                                    || (!loading && (
                                        item.type === 'movie'
                                        || item.type === 'episode'
                                        || item.type === 'show'
                                        || item.type === 'season'
                                    ))
                                ) ? (
                                    <div className="flex flex-col gap-2">
                                        <div className="relative z-20 flex flex-wrap items-center gap-2 overflow-visible" data-tv-rail="1">
                                            {canPlay ? (
                                                <button
                                                    type="button"
                                                    data-tv-item="1"
                                                    data-tv-action="1"
                                                    data-tv-play="1"
                                                    data-tv-key={`play:${item.ratingKey}`}
                                                    onClick={() => onPlay(onDeck || item, playOpts)}
                                                    disabled={playing}
                                                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-plex px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-plex/20 transition-colors hover:bg-plex-hover disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {playing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-current" />}
                                                    {playLabel}
                                                </button>
                                            ) : null}
                                            {(item.versions || []).length > 1 ? (
                                                <div className="min-w-[10.5rem] max-w-[16rem] flex-1 sm:flex-none">
                                                    <CustomSelect
                                                        value={String(mediaIndex)}
                                                        onChange={(value) => setMediaIndex(Number(value) || 0)}
                                                        options={(item.versions || []).map((row) => ({
                                                            value: String(row.mediaIndex),
                                                            label: row.label,
                                                        }))}
                                                        triggerProps={{
                                                            'data-tv-item': '1',
                                                            'data-tv-action': '1',
                                                        }}
                                                    />
                                                </div>
                                            ) : null}
                                            {trailer ? (
                                                <button
                                                    type="button"
                                                    data-tv-item="1"
                                                    data-tv-action="1"
                                                    onClick={() => onPlay(trailer, { offsetMs: 0, skipResume: true })}
                                                    disabled={playing}
                                                    title={t('mediaPlayerPage.trailer')}
                                                    aria-label={t('mediaPlayerPage.trailer')}
                                                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white transition-colors hover:border-plex/40 hover:bg-white/10 disabled:opacity-50"
                                                >
                                                    <Film className="h-4 w-4" />
                                                </button>
                                            ) : null}
                                            {item.mediaInfo?.length ? (
                                                <button
                                                    type="button"
                                                    data-tv-item="1"
                                                    data-tv-action="1"
                                                    onClick={() => setMediaInfoOpen(true)}
                                                    title={t('mediaPlayerPage.mediaInfo')}
                                                    aria-label={t('mediaPlayerPage.mediaInfo')}
                                                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white transition-colors hover:border-plex/40 hover:bg-white/10"
                                                >
                                                    <Info className="h-4 w-4" />
                                                </button>
                                            ) : null}
                                            {item.type === 'movie' || item.type === 'episode' || item.type === 'show' || item.type === 'season' ? (
                                                <button
                                                    type="button"
                                                    data-tv-item="1"
                                                    data-tv-action="1"
                                                    onClick={async () => {
                                                        const next = !item.watched;
                                                        setItem({ ...item, watched: next });
                                                        try {
                                                            await setMediaPlayerWatched(item.ratingKey, next);
                                                        } catch {
                                                            setItem({ ...item, watched: item.watched });
                                                        }
                                                    }}
                                                    title={item.watched ? t('mediaPlayerPage.markUnwatched') : t('mediaPlayerPage.markWatched')}
                                                    aria-label={item.watched ? t('mediaPlayerPage.markUnwatched') : t('mediaPlayerPage.markWatched')}
                                                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white transition-colors hover:border-plex/40 hover:bg-white/10"
                                                >
                                                    {item.watched ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            ) : null}
                                            {settings.showPlaylists
                                                && (item.type === 'movie' || item.type === 'episode' || item.type === 'show' || item.type === 'season') ? (
                                                <div className="relative">
                                                    <button
                                                        type="button"
                                                        data-tv-item="1"
                                                        data-tv-action="1"
                                                        onClick={() => setPlaylistOpen((open) => !open)}
                                                        title={t('mediaPlayerPage.addToPlaylist')}
                                                        aria-label={t('mediaPlayerPage.addToPlaylist')}
                                                        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white transition-colors hover:border-plex/40 hover:bg-white/10"
                                                    >
                                                        <ListPlus className="h-4 w-4" />
                                                    </button>
                                                    {playlistOpen ? (
                                                        <div
                                                            className="absolute left-0 z-20 mt-2 w-64 max-h-64 overflow-y-auto rounded-xl border border-white/15 bg-black/95 p-2 shadow-2xl sm:left-auto sm:right-0"
                                                            data-tv-select-menu="1"
                                                        >
                                                            {playlists.map((playlist) => (
                                                                <button
                                                                    key={playlist.ratingKey}
                                                                    type="button"
                                                                    onClick={async () => {
                                                                        try {
                                                                            await addMediaPlayerPlaylistItem(playlist.ratingKey, item.ratingKey);
                                                                            setPlaylistMessage(t('mediaPlayerPage.addedToPlaylist', { name: playlist.title }));
                                                                            setPlaylistOpen(false);
                                                                        } catch {
                                                                            setPlaylistMessage(t('mediaPlayerPage.playError'));
                                                                        }
                                                                    }}
                                                                    className="block w-full rounded-lg px-3 py-2 text-left text-xs font-bold text-white hover:bg-white/10"
                                                                >
                                                                    {playlist.title}
                                                                </button>
                                                            ))}
                                                            <form
                                                                className="mt-2 flex gap-1"
                                                                onSubmit={async (event) => {
                                                                    event.preventDefault();
                                                                    const title = newPlaylistName.trim();
                                                                    if (!title) return;
                                                                    try {
                                                                        const created = await createMediaPlayerPlaylist(title, item.ratingKey);
                                                                        if (created.item?.ratingKey) {
                                                                            setPlaylists((prev) => [created.item, ...prev]);
                                                                        }
                                                                        setNewPlaylistName('');
                                                                        setPlaylistMessage(t('mediaPlayerPage.addedToPlaylist', { name: title }));
                                                                        setPlaylistOpen(false);
                                                                    } catch {
                                                                        setPlaylistMessage(t('mediaPlayerPage.playError'));
                                                                    }
                                                                }}
                                                            >
                                                                <input
                                                                    value={newPlaylistName}
                                                                    onChange={(event) => setNewPlaylistName(event.target.value)}
                                                                    placeholder={t('mediaPlayerPage.playlistName')}
                                                                    className="min-w-0 flex-1 rounded-lg border border-white/15 bg-white/5 px-2 py-1.5 text-xs text-white"
                                                                />
                                                                <button type="submit" className="rounded-lg bg-plex px-2 py-1.5 text-[10px] font-black text-black">
                                                                    {t('mediaPlayerPage.createPlaylist')}
                                                                </button>
                                                            </form>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            ) : null}
                                            <PlayerItemMenu
                                                variant="toolbar"
                                                item={item}
                                                isAdmin={isAdmin}
                                                playlistsEnabled={playlistsEnabled && settings.showPlaylists}
                                                onPlayNext={onPlayNext}
                                                onWatchedChange={(_row, watched) => setItem((prev) => (prev ? { ...prev, watched } : prev))}
                                                onDeleted={() => onBack()}
                                                onToast={onToast}
                                            />
                                        </div>
                                        {settings.showPlaylists && playlistMessage ? (
                                            <p className="text-[11px] font-bold text-plex">{playlistMessage}</p>
                                        ) : null}
                                    </div>
                                ) : null}
                                <OverviewFacts
                                    item={item}
                                    onOpenPerson={onOpenPerson}
                                    onOpenItem={onOpenItem}
                                    onOpenStudio={onOpenStudio}
                                    aside={
                                        factMediaType && Number.isFinite(factMediaId) && factMediaId > 0 ? (
                                            <DiscoveryFactWidget
                                                mediaType={factMediaType}
                                                mediaId={factMediaId}
                                                title={factTitle}
                                            />
                                        ) : null
                                    }
                                />
                                <OverviewLinks item={item} />
                                {item.type === 'episode' ? (
                                    <>
                                        <p className="md:hidden text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                                            {t('mediaPlayerPage.swipeEpisodesHint')}
                                        </p>
                                        <EpisodeNeighbors
                                            previous={neighbors.previous}
                                            next={neighbors.next}
                                            onOpenItem={onOpenItem}
                                            onPlay={(row) => onPlay(row)}
                                        />
                                    </>
                                ) : null}
                                {(item.type === 'movie' || item.type === 'episode') && mediaSummary ? (
                                    <div className="flex flex-col gap-3" data-no-episode-swipe="1" data-tv-rail="1">
                                        {isTvShell ? (
                                            <h3 className="text-xs font-black text-muted uppercase tracking-[0.2em]">
                                                {t('mediaPlayerPage.mediaInfo')}
                                            </h3>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => setMediaInfoExpanded((open) => !open)}
                                                className="flex w-full items-center gap-3 pr-4 text-left"
                                                aria-expanded={mediaInfoExpanded}
                                            >
                                                <h3 className="text-xs font-black text-muted uppercase tracking-[0.2em]">
                                                    {t('mediaPlayerPage.mediaInfo')}
                                                </h3>
                                                <ChevronDown className={`h-4 w-4 shrink-0 text-muted transition-transform ${mediaInfoExpanded ? 'rotate-180' : ''}`} />
                                                <div className="h-px min-w-0 flex-1 bg-gradient-to-r from-border to-transparent" />
                                            </button>
                                        )}
                                        {isTvShell || mediaInfoExpanded ? (
                                            <div className="max-w-xl rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                                                <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-6 gap-y-2.5">
                                                    {mediaSummary.video ? (
                                                        <>
                                                            <span className="text-xs font-black uppercase tracking-wider text-muted">
                                                                {t('mediaPlayerPage.video')}
                                                            </span>
                                                            <span className="text-sm font-semibold text-text">{mediaSummary.video}</span>
                                                        </>
                                                    ) : null}
                                                    {audioTrackOptions.length ? (
                                                        <>
                                                            <span className="text-xs font-black uppercase tracking-wider text-muted">
                                                                {t('mediaPlayerPage.audio')}
                                                            </span>
                                                            {audioTrackOptions.length > 1 ? (
                                                                <CustomSelect
                                                                    value={audioStreamId || String(audioTrackOptions[0].id)}
                                                                    onChange={setAudioStreamId}
                                                                    options={audioTrackOptions.map((row) => ({
                                                                        value: String(row.id),
                                                                        label: String(row.displayTitle || row.language || t('mediaPlayerPage.audio')),
                                                                    }))}
                                                                    triggerProps={isTvShell ? {
                                                                        'data-tv-item': '1',
                                                                        'data-tv-action': '1',
                                                                        'aria-label': t('mediaPlayerPage.audio'),
                                                                    } : undefined}
                                                                />
                                                            ) : (
                                                                <span className="text-sm font-semibold text-text">
                                                                    {mediaSummary.audio || audioTrackOptions[0].displayTitle}
                                                                </span>
                                                            )}
                                                        </>
                                                    ) : mediaSummary.audio ? (
                                                        <>
                                                            <span className="text-xs font-black uppercase tracking-wider text-muted">
                                                                {t('mediaPlayerPage.audio')}
                                                            </span>
                                                            <span className="text-sm font-semibold text-text">{mediaSummary.audio}</span>
                                                        </>
                                                    ) : null}
                                                    <span className="text-xs font-black uppercase tracking-wider text-muted">
                                                        {t('mediaPlayerPage.subtitles')}
                                                    </span>
                                                    {subtitleTrackOptions.length ? (
                                                        <CustomSelect
                                                            value={subtitleStreamId || '0'}
                                                            onChange={(value) => setSubtitleStreamId(value === '0' ? '' : value)}
                                                            options={[
                                                                { value: '0', label: t('mediaPlayerPage.subtitlesOff') },
                                                                ...subtitleTrackOptions.map((row) => ({
                                                                    value: String(row.id),
                                                                    label: String(row.displayTitle || row.language || t('mediaPlayerPage.subtitles')),
                                                                })),
                                                            ]}
                                                            triggerProps={isTvShell ? {
                                                                'data-tv-item': '1',
                                                                'data-tv-action': '1',
                                                                'aria-label': t('mediaPlayerPage.subtitles'),
                                                            } : undefined}
                                                        />
                                                    ) : (
                                                        <span className="text-sm font-semibold text-text">
                                                            {t('mediaPlayerPage.subtitlesOff')}
                                                        </span>
                                                    )}
                                                </div>
                                                {!isTvShell && item.mediaInfo?.length ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => setMediaInfoOpen(true)}
                                                        className="mt-3 text-xs font-bold text-plex hover:text-plex-hover"
                                                    >
                                                        {t('mediaPlayerPage.mediaInfo')}
                                                    </button>
                                                ) : null}
                                            </div>
                                        ) : null}
                                    </div>
                                ) : streamRows.length ? (
                                    <div className="flex flex-col gap-3" data-tv-rail={isTvShell ? '1' : undefined}>
                                        {isTvShell ? (
                                            <h3 className="text-xs font-black text-muted uppercase tracking-[0.2em]">
                                                {t('mediaPlayerPage.mediaInfo')}
                                            </h3>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => setMediaInfoExpanded((open) => !open)}
                                                className="flex w-full items-center gap-3 pr-4 text-left"
                                                aria-expanded={mediaInfoExpanded}
                                            >
                                                <h3 className="text-xs font-black text-muted uppercase tracking-[0.2em]">
                                                    {t('mediaPlayerPage.mediaInfo')}
                                                </h3>
                                                <ChevronDown className={`h-4 w-4 shrink-0 text-muted transition-transform ${mediaInfoExpanded ? 'rotate-180' : ''}`} />
                                                <div className="h-px min-w-0 flex-1 bg-gradient-to-r from-border to-transparent" />
                                            </button>
                                        )}
                                        {isTvShell || mediaInfoExpanded ? (
                                            <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 max-w-xl">
                                                {streamRows.map((row) => (
                                                    <React.Fragment key={row.label}>
                                                        <span className="text-xs font-black uppercase tracking-wider text-muted pt-0.5">{row.label}</span>
                                                        {isTvShell ? (
                                                            <span className="text-left text-sm font-semibold text-text">{row.value}</span>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => item.mediaInfo?.length && setMediaInfoOpen(true)}
                                                                className="text-left text-sm font-semibold text-text hover:text-plex"
                                                            >
                                                                {row.value}
                                                            </button>
                                                        )}
                                                    </React.Fragment>
                                                ))}
                                            </div>
                                        ) : null}
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>

                    {children.length && !isEpisodeGrid ? (
                    <section className="media-details-seasons mt-6">
                        <SectionHeading>{t('mediaPlayerPage.seasons')}</SectionHeading>
                        <div className="flex flex-wrap gap-2.5 sm:gap-3" data-tv-rail="1">
                            {children.map((row) => {
                                const leaf = Number(row.leafCount || 0);
                                const viewed = Number(row.viewedLeafCount || 0);
                                const seasonWatched = Boolean(row.watched) || (leaf > 0 && viewed >= leaf);
                                return (
                                <div
                                    key={row.ratingKey}
                                    className="group w-[7.25rem] sm:w-[8.25rem] lg:w-[9rem] shrink-0"
                                    data-tv-season-poster="1"
                                >
                                    <button
                                        type="button"
                                        data-tv-item="1"
                                        data-tv-season-poster-btn="1"
                                        data-tv-key={row.ratingKey}
                                        onClick={() => onOpenItem({
                                            ...row,
                                            thumb: row.thumb || item.thumb,
                                            art: row.art || item.art,
                                            showTitle: row.showTitle || item.title || item.showTitle,
                                        })}
                                        className="block w-full overflow-hidden rounded-xl border-0 bg-transparent p-0 text-left outline-none"
                                        aria-label={row.title}
                                    >
                                        <div
                                            data-tv-season-art="1"
                                            className="relative overflow-hidden rounded-xl border border-white/10 bg-black/30"
                                        >
                                            {row.thumb || item.thumb ? (
                                                <img
                                                    src={plexImageUrl(row.thumb || item.thumb, 300, 450, { quality: 60 })}
                                                    alt=""
                                                    className="aspect-[2/3] w-full object-cover transition-transform group-hover:scale-[1.03]"
                                                />
                                            ) : (
                                                <NoPosterPlaceholder />
                                            )}
                                            {seasonWatched ? (
                                                <span
                                                    title={t('mediaPlayerPage.watched')}
                                                    className={seasonTickClass}
                                                >
                                                    <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                                                </span>
                                            ) : null}
                                        </div>
                                    </button>
                                    <div className="mt-1.5 truncate text-xs font-bold text-text group-hover:text-plex sm:text-sm">{row.title}</div>
                                    {row.leafCount ? (
                                        <div className="text-[10px] text-muted sm:text-[11px]">{t('common.episodeCount', { count: row.leafCount })}</div>
                                    ) : null}
                                </div>
                                );
                            })}
                        </div>
                    </section>
                    ) : null}

                    {children.length && isEpisodeGrid ? (
                    <section className="mt-6">
                        <SectionHeading>{t('mediaPlayerPage.episodes')}</SectionHeading>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" data-tv-rail="1">
                            {children.map((row) => (
                                <div key={row.ratingKey} className="group min-w-0">
                                    <button
                                        type="button"
                                        data-tv-item="1"
                                        data-tv-episode-btn="1"
                                        data-tv-key={row.ratingKey}
                                        onClick={() => onOpenItem({
                                            ...row,
                                            thumb: row.thumb || item.thumb,
                                            art: row.art || item.art,
                                            showTitle: row.showTitle || item.title || item.showTitle,
                                        })}
                                        className="block w-full overflow-hidden rounded-xl border-0 bg-transparent p-0 text-left outline-none"
                                        aria-label={row.title}
                                    >
                                        <div
                                            data-tv-episode-art="1"
                                            className="relative overflow-hidden rounded-xl border border-white/10 bg-black/30"
                                        >
                                            {row.thumb ? (
                                                <img
                                                    src={plexImageUrl(row.thumb, 426, 240, { quality: 60 })}
                                                    alt=""
                                                    className="aspect-video w-full object-cover transition-transform group-hover:scale-[1.03]"
                                                />
                                            ) : (
                                                <div className="flex aspect-video items-center justify-center text-[10px] font-bold uppercase tracking-widest text-muted">
                                                    {t('mediaPlayerPage.episodes')}
                                                </div>
                                            )}
                                            {row.watched ? (
                                                <span
                                                    title={t('mediaPlayerPage.watched')}
                                                    className="absolute right-1.5 top-1.5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-plex text-zinc-950 shadow-md"
                                                >
                                                    <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                                                </span>
                                            ) : null}
                                            {progressPercent(row) > 0 ? (
                                                <div className="absolute inset-x-0 bottom-0 h-1 bg-black/50">
                                                    <div className="h-full bg-plex" style={{ width: `${progressPercent(row)}%` }} />
                                                </div>
                                            ) : null}
                                        </div>
                                    </button>
                                    <div className="mt-2 truncate text-sm font-bold text-text group-hover:text-plex group-focus-within:text-plex">{row.title}</div>
                                    <div className="text-[11px] text-muted">
                                        {row.index != null ? `Episode ${row.index}` : ''}
                                        {row.durationMs ? ` · ${formatPlayerDuration(row.durationMs)}` : ''}
                                    </div>
                                    {row.summary ? (
                                        <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-muted">{row.summary}</p>
                                    ) : null}
                                </div>
                            ))}
                        </div>
                    </section>
                    ) : null}
                </div>
            </div>

            <div className="relative z-10 w-full max-w-[2400px] mx-auto page-x sm:px-8 xl:px-12 mt-2 md:mt-4 flex flex-col gap-8 md:gap-10 bg-card">

                {item.guestStars?.length ? (
                    <section className="border-t border-border pt-8" data-tv-rail="1">
                        <SectionHeading>{t('mediaPlayerPage.guestStars')}</SectionHeading>
                        <Carousel>
                            {item.guestStars.slice(0, 15).map((actor) => (
                                <button
                                    key={`guest-${actor.id}-${actor.name}`}
                                    type="button"
                                    data-tv-item="1"
                                    data-tv-cast="1"
                                    onClick={() => onOpenPerson({
                                        id: actor.id || actor.name,
                                        name: actor.name,
                                        thumb: actor.thumb,
                                    })}
                                    className="group flex flex-col items-center gap-3 w-40 flex-shrink-0 snap-start text-center outline-none"
                                >
                                    <CastAvatar name={actor.name} thumb={actor.thumb} />
                                    <div className="w-full px-1">
                                        <div className="text-sm font-bold text-text leading-tight line-clamp-2 group-hover:text-plex">{actor.name}</div>
                                        {actor.role ? (
                                            <div className="text-xs text-muted mt-1 leading-snug line-clamp-2">{actor.role}</div>
                                        ) : null}
                                    </div>
                                </button>
                            ))}
                        </Carousel>
                    </section>
                ) : null}

                {cast.length ? (
                    <section className="border-t border-border pt-8" data-tv-rail="1">
                        <SectionHeading>{t('media.topCast')}</SectionHeading>
                        <Carousel>
                            {cast.slice(0, 15).map((actor) => (
                                <button
                                    key={`${actor.id}-${actor.name}`}
                                    type="button"
                                    data-tv-item="1"
                                    data-tv-cast="1"
                                    onClick={() => onOpenPerson({
                                        id: actor.id || actor.name,
                                        name: actor.name,
                                        thumb: actor.thumb,
                                    })}
                                    className="group flex flex-col items-center gap-3 w-40 flex-shrink-0 snap-start text-center outline-none"
                                >
                                    <CastAvatar name={actor.name} thumb={actor.thumb} />
                                    <div className="w-full px-1">
                                        <div className="text-sm font-bold text-text leading-tight line-clamp-2 group-hover:text-plex">{actor.name}</div>
                                        {actor.role ? (
                                            <div className="text-xs text-muted mt-1 leading-snug line-clamp-2">{actor.role}</div>
                                        ) : null}
                                    </div>
                                </button>
                            ))}
                        </Carousel>
                    </section>
                ) : null}

                {extras.length ? (
                    <section className="border-t border-border pt-8">
                        <SectionHeading>{t('mediaPlayerPage.extras')}</SectionHeading>
                        <Carousel>
                            {extras.map((extra) => (
                                <button
                                    key={extra.ratingKey}
                                    type="button"
                                    onClick={() => onPlay(extra, { offsetMs: 0, skipResume: true })}
                                    className="group w-64 sm:w-72 flex-shrink-0 snap-start text-left"
                                >
                                    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black/30">
                                        {extra.thumb ? (
                                            <img
                                                src={plexImageUrl(extra.thumb, 426, 240, { quality: 60 })}
                                                alt=""
                                                className="aspect-video w-full object-cover transition-transform group-hover:scale-[1.03]"
                                            />
                                        ) : (
                                            <div className="flex aspect-video items-center justify-center bg-white/5">
                                                <Play className="h-8 w-8 text-white/70" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition-opacity group-hover:opacity-100">
                                            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-plex text-white shadow-lg">
                                                <Play className="h-5 w-5 fill-current" />
                                            </span>
                                        </div>
                                    </div>
                                    <div className="mt-2 truncate text-sm font-bold text-text group-hover:text-plex">{extra.title}</div>
                                    <div className="text-[11px] text-muted">
                                        {isPlayerTrailer(extra) ? t('mediaPlayerPage.trailer') : (extra.extraSubtype || extra.type)}
                                        {extra.durationMs ? ` · ${formatPlayerDuration(extra.durationMs)}` : ''}
                                    </div>
                                </button>
                            ))}
                        </Carousel>
                    </section>
                ) : null}

                {related.length ? (
                    <section className="border-t border-border pt-8 pb-4 flex flex-col gap-8">
                        {related.map((hub) => (
                            <PlayerRail
                                key={hub.identifier || hub.title}
                                title={hub.title}
                                items={hub.items}
                                density={gridSize}
                                onOpenItem={onOpenItem}
                                onPlay={onPlay}
                            />
                        ))}
                    </section>
                ) : null}
            </div>
            {mediaInfoOpen ? (
                <MediaPlayerMediaInfo item={item} onClose={() => setMediaInfoOpen(false)} />
            ) : null}
        </div>
    );
};
