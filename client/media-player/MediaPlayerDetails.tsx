import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Calendar, Clock, Eye, EyeOff, Film, Info, ListPlus, Loader2, Play, Star, Tv, Users } from 'lucide-react';
import { NoPosterPlaceholder } from '../shared/NoPosterPlaceholder';
import { Carousel } from '../discovery/Carousel';
import { DiscoveryFactWidget } from '../discovery/DiscoveryFactWidget';
import { MediaRatingPills } from '../discovery/MediaRatingPills';
import type { CombinedRatings } from '../discovery/mediaDetailUtils';
import { useDiscoverI18n } from '../discovery/i18n';
import { useDiscoverGridSize } from '../discovery/useDiscoverGridSize';
import { addMediaPlayerPlaylistItem, createMediaPlayerPlaylist, fetchMediaPlayerItem, fetchMediaPlayerPlaylists, setMediaPlayerWatched } from './api';
import { MediaPlayerMediaInfo } from './MediaPlayerMediaInfo';
import { PlayerRail } from './PlayerRail';
import {
    formatBitrateMbps,
    formatPlayerDuration,
    formatPlayerResolution,
    isPlayerTrailer,
    plexImageUrl,
    progressPercent,
    titleCaseProfile,
} from './playerUtils';
import type { PlayerItem, PlayerLibraryHub, PlayerPlayOptions, PlayerRatings } from './types';

type Props = {
    ratingKey: string;
    onBack: () => void;
    onOpenItem: (item: PlayerItem) => void;
    onOpenPerson: (person: { id: string; name: string; thumb?: string | null }) => void;
    onPlay: (item: PlayerItem, opts?: PlayerPlayOptions) => void;
    playing?: boolean;
};

const SectionHeading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="flex items-center gap-3 mb-4 pr-16">
        <h3 className="text-xs font-black text-muted uppercase tracking-[0.2em]">{children}</h3>
        <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
    </div>
);

const typeLabel = (type: string) => {
    if (type === 'movie') return 'movie';
    if (type === 'show') return 'tv';
    if (type === 'season') return 'season';
    if (type === 'episode') return 'episode';
    return type;
};

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

export const MediaPlayerDetails: React.FC<Props> = ({ ratingKey, onBack, onOpenItem, onOpenPerson, onPlay, playing = false }) => {
    const { t, locale } = useDiscoverI18n();
    const [gridSize] = useDiscoverGridSize();
    const [item, setItem] = useState<PlayerItem | null>(null);
    const [children, setChildren] = useState<PlayerItem[]>([]);
    const [extras, setExtras] = useState<PlayerItem[]>([]);
    const [related, setRelated] = useState<PlayerLibraryHub[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [posterFailed, setPosterFailed] = useState(false);
    const [backdropFailed, setBackdropFailed] = useState(false);
    const [mediaInfoOpen, setMediaInfoOpen] = useState(false);
    const [mediaIndex, setMediaIndex] = useState(0);
    const [playlists, setPlaylists] = useState<PlayerItem[]>([]);
    const [playlistOpen, setPlaylistOpen] = useState(false);
    const [newPlaylistName, setNewPlaylistName] = useState('');
    const [playlistMessage, setPlaylistMessage] = useState('');

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setPosterFailed(false);
        setBackdropFailed(false);
        setMediaInfoOpen(false);
        fetchMediaPlayerItem(ratingKey)
            .then((data) => {
                if (cancelled) return;
                setItem(data.item);
                setChildren(data.children || []);
                setExtras(data.extras || []);
                setRelated(data.related || []);
                setMediaIndex(0);
                setPlaylistOpen(false);
                setPlaylistMessage('');
                setError(null);
            })
            .catch((err) => {
                if (cancelled) return;
                setError(String(err?.message || t('mediaPlayerPage.loadError')));
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => { cancelled = true; };
    }, [ratingKey, t]);

    useEffect(() => {
        let cancelled = false;
        fetchMediaPlayerPlaylists()
            .then((data) => {
                if (!cancelled) setPlaylists((data.items || []).filter((row) => !row.smart));
            })
            .catch(() => {
                if (!cancelled) setPlaylists([]);
            });
        return () => { cancelled = true; };
    }, [ratingKey]);

    const trailer = useMemo(() => extras.find(isPlayerTrailer) || extras[0] || null, [extras]);
    const mediaSummary = useMemo(() => {
        const mediaInfo = item?.mediaInfo || [];
        const first = mediaInfo[0];
        const part = first?.parts?.[0];
        if (!first && !part) return null;
        const resolution = formatPlayerResolution(part?.video?.height || first?.height, part?.video?.resolution || first?.videoResolution);
        const bitrate = formatBitrateMbps(part?.video?.bitrate || first?.bitrate);
        const codec = String(part?.video?.codec || first?.videoCodec || '').toUpperCase();
        const profile = titleCaseProfile(part?.video?.profile);
        const videoBits = [codec, profile].filter(Boolean).join(' ');
        const versions = [bitrate, resolution].filter(Boolean).join(', ');
        const selectedSub = part?.subtitles?.find((row) => row.selected);
        return {
            versions: versions ? `${versions}${mediaInfo.length > 1 ? `, ${t('mediaPlayerPage.andMore')}` : ''}` : '',
            video: [resolution, videoBits ? `(${videoBits})` : ''].filter(Boolean).join(' '),
            audio: part?.audio?.[0]?.displayTitle || first?.audioCodec || '',
            subtitles: selectedSub?.displayTitle || '',
        };
    }, [item, t]);

    if (loading && !item) {
        return (
            <div className="flex min-h-[40vh] items-center justify-center text-muted">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
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

    const posterUrl = plexImageUrl(item.thumb, item.type === 'episode' ? 640 : 400, item.type === 'episode' ? 360 : 600);
    const backdropUrl = plexImageUrl(item.art || item.thumb, 1280, 720);
    const isEpisodeGrid = children.some((row) => row.type === 'episode');
    const canPlay = !!item.canPlay;
    const playLabel = item.type === 'show' || item.type === 'season'
        ? (Number(item.viewedLeafCount) > 0 ? t('mediaPlayerPage.resume') : t('mediaPlayerPage.play'))
        : (item.viewOffsetMs && item.viewOffsetMs > 15000
            ? t('mediaPlayerPage.resume')
            : t('mediaPlayerPage.play'));
    const airedDate = item.originallyAvailableAt ? new Date(item.originallyAvailableAt) : null;
    const aired = airedDate && !Number.isNaN(airedDate.getTime())
        ? airedDate.toLocaleDateString(locale || 'en', { day: 'numeric', month: 'short', year: 'numeric' })
        : '';
    const genres = item.genres || [];
    const genreLine = genres.length > 2
        ? `${genres.slice(0, 2).join(', ')}, ${t('mediaPlayerPage.andMore')}`
        : genres.join(', ');
    const metaChips = [
        item.contentRating ? { icon: null, label: String(item.contentRating) } : null,
        item.year ? { icon: <Calendar className="h-3 w-3" />, label: String(item.year) } : null,
        item.durationMs ? { icon: <Clock className="h-3 w-3" />, label: formatPlayerDuration(item.durationMs) } : null,
        genreLine ? { icon: null, label: genreLine } : null,
        !ratingsHavePills(item.ratings) && item.audienceRating ? { icon: <Star className="h-3 w-3 text-plex" />, label: String(item.audienceRating) } : null,
    ].filter(Boolean) as Array<{ icon: React.ReactNode; label: string }>;
    const factRows = [
        item.studio ? { label: t('media.studio'), value: item.studio } : null,
        item.writers?.length ? { label: t('mediaPlayerPage.writtenBy'), value: item.writers.join(', ') } : null,
        aired ? { label: t('mediaPlayerPage.aired'), value: aired } : null,
    ].filter(Boolean) as Array<{ label: string; value: string }>;
    const streamRows = mediaSummary ? [
        mediaSummary.versions ? { label: t('mediaPlayerPage.versions'), value: mediaSummary.versions } : null,
        mediaSummary.video ? { label: t('mediaPlayerPage.video'), value: mediaSummary.video } : null,
        mediaSummary.audio ? { label: t('mediaPlayerPage.audio'), value: mediaSummary.audio } : null,
        { label: t('mediaPlayerPage.subtitles'), value: mediaSummary.subtitles || t('mediaPlayerPage.subtitlesOff') },
    ].filter(Boolean) as Array<{ label: string; value: string }> : [];
    const cast = item.cast || [];
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
    const seasonName = item.type === 'episode' ? item.seasonTitle : null;
    const openCrumb = (nextKey?: string | null) => {
        if (!nextKey || nextKey === item.ratingKey) return;
        onOpenItem({ ratingKey: nextKey, title: '', type: 'show' });
    };
    const tmdbScore = item.ratings?.tmdb?.percent != null ? `${item.ratings.tmdb.percent}%` : null;

    const titleBlock = (
        <>
            <div className="flex items-center gap-2 flex-wrap">
                {item.type === 'movie' ? <Film className="w-3.5 h-3.5 text-plex" /> : <Tv className="w-3.5 h-3.5 text-plex" />}
                <span className="text-[10px] font-bold uppercase tracking-widest text-plex">{typeLabel(item.type)}</span>
            </div>
            {showName ? (
                <button
                    type="button"
                    onClick={() => openCrumb(showKey)}
                    disabled={!showKey}
                    className="text-sm sm:text-lg font-black text-white/80 hover:text-plex transition-colors text-left disabled:hover:text-white/80 disabled:cursor-default"
                >
                    {showName}
                </button>
            ) : null}
            {seasonName ? (
                <button
                    type="button"
                    onClick={() => openCrumb(seasonKey)}
                    disabled={!seasonKey}
                    className="text-sm font-bold text-white/70 hover:text-plex transition-colors text-left disabled:hover:text-white/70 disabled:cursor-default"
                >
                    {seasonName}
                </button>
            ) : null}
            <h1 className="text-2xl sm:text-3xl lg:text-5xl font-black text-white leading-[1.08] tracking-tight drop-shadow-lg">
                {item.title}
            </h1>
            {item.tagline ? (
                <p className="text-sm sm:text-base text-white/55 italic max-w-4xl">{item.tagline}</p>
            ) : null}
            {item.directors?.length ? (
                <p className="text-sm text-white/70">{t('mediaPlayerPage.directedBy')} {item.directors.join(', ')}</p>
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
            />
        </>
    );

    return (
        <div className="page-bleed-x md:w-full flex flex-col min-h-screen bg-card animate-fade-in pb-24 md:pb-16 rounded-none md:rounded-2xl lg:rounded-3xl overflow-x-hidden border-0 md:border border-white/5 shadow-2xl">
            <div className="relative isolate">
                <div className="media-details-hero-backdrop absolute inset-x-0 top-0 h-[34rem] max-h-[72vh] sm:h-[36rem] md:h-[min(72vh,52rem)] md:max-h-none overflow-hidden pointer-events-none" aria-hidden>
                    {backdropUrl && !backdropFailed ? (
                        <img
                            src={backdropUrl}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover scale-110 object-[32%_30%] opacity-45 md:scale-[1.15] md:object-[22%_28%] md:opacity-90"
                            onError={() => setBackdropFailed(true)}
                        />
                    ) : (
                        <div className="absolute inset-0 bg-black" />
                    )}
                    <div className="media-details-hero-scrim-mobile absolute inset-0 bg-gradient-to-b from-black/50 via-card/65 via-[55%] to-card md:hidden" />
                    <div className="media-details-hero-scrim-bottom absolute inset-0 hidden md:block bg-gradient-to-t from-card from-0% via-card/80 via-[38%] to-transparent" />
                    <div className="media-details-hero-scrim-left absolute inset-0 hidden md:block bg-gradient-to-r from-card from-0% via-card/70 via-[32%] to-transparent to-[78%]" />
                </div>

                <div className="relative z-10 w-full max-w-[1600px] mx-auto page-x sm:px-8 xl:px-12 pt-4 sm:pt-5 pb-8">
                    <button
                        type="button"
                        onClick={onBack}
                        className="light-on-media mb-4 md:mb-6 inline-flex items-center gap-2 text-white/90 hover:text-white transition-colors bg-black/50 px-4 py-2 rounded-full backdrop-blur-md border border-white/10 hover:border-white/20 hover:bg-black/65"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-bold text-sm">{t('mediaPlayerPage.back')}</span>
                    </button>

                    <div className="flex flex-col md:flex-row gap-5 md:gap-6 lg:gap-10">
                        <div className={`w-full flex-shrink-0 flex flex-col gap-3 ${item.type === 'episode' ? 'md:w-80 lg:w-96' : 'md:w-52 lg:w-60'}`}>
                            <div className="flex flex-row md:flex-col gap-4 items-stretch">
                                <div className={`relative w-[38%] max-w-[10.5rem] sm:max-w-[12rem] md:w-full md:max-w-none rounded-xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.55)] border border-white/15 bg-black/50 ring-1 ring-white/10 flex-shrink-0 ${item.type === 'episode' ? 'aspect-video max-w-[14rem] sm:max-w-[16rem]' : 'aspect-[2/3]'}`}>
                                    <div className="absolute -inset-4 bg-plex/10 blur-3xl opacity-40 pointer-events-none" />
                                    {posterUrl && !posterFailed ? (
                                        <img src={posterUrl} alt="" className="relative w-full h-full object-cover" onError={() => setPosterFailed(true)} />
                                    ) : (
                                        <NoPosterPlaceholder />
                                    )}
                                </div>
                                <div className="light-on-media flex-1 min-w-0 flex flex-col justify-end gap-2 md:hidden">
                                    {titleBlock}
                                </div>
                            </div>
                            {canPlay ? (
                                <button
                                    type="button"
                                    onClick={() => onPlay(item, { mediaIndex })}
                                    disabled={playing}
                                    className="w-full py-3 px-2 sm:px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 sm:gap-2 transition-colors shadow-lg bg-plex hover:bg-plex-hover text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {playing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-current" />}
                                    {playLabel}
                                </button>
                            ) : null}
                            {(item.versions || []).length > 1 ? (
                                <select
                                    value={mediaIndex}
                                    onChange={(event) => setMediaIndex(Number(event.target.value) || 0)}
                                    className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2.5 text-xs font-bold text-white"
                                    aria-label={t('mediaPlayerPage.selectVersion')}
                                >
                                    {(item.versions || []).map((row) => (
                                        <option key={row.id} value={row.mediaIndex}>{row.label}</option>
                                    ))}
                                </select>
                            ) : null}
                            {item.type === 'movie' || item.type === 'episode' || item.type === 'show' || item.type === 'season' ? (
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            const next = !item.watched;
                                            setItem({ ...item, watched: next });
                                            try {
                                                await setMediaPlayerWatched(item.ratingKey, next);
                                            } catch {
                                                setItem({ ...item, watched: item.watched });
                                            }
                                        }}
                                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-2 py-2.5 text-xs font-bold text-white hover:bg-white/10"
                                    >
                                        {item.watched ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                        {item.watched ? t('mediaPlayerPage.markUnwatched') : t('mediaPlayerPage.markWatched')}
                                    </button>
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => setPlaylistOpen((open) => !open)}
                                            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-2 py-2.5 text-xs font-bold text-white hover:bg-white/10"
                                        >
                                            <ListPlus className="h-3.5 w-3.5" />
                                            {t('mediaPlayerPage.addToPlaylist')}
                                        </button>
                                        {playlistOpen ? (
                                            <div className="absolute left-0 right-0 z-20 mt-2 max-h-64 overflow-y-auto rounded-xl border border-white/15 bg-black/95 p-2 shadow-2xl">
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
                                </div>
                            ) : null}
                            {playlistMessage ? (
                                <p className="text-[11px] font-bold text-plex">{playlistMessage}</p>
                            ) : null}
                            {trailer || item.mediaInfo?.length ? (
                                <div className={`grid gap-2 ${trailer && item.mediaInfo?.length ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                    {trailer ? (
                                        <button
                                            type="button"
                                            onClick={() => onPlay(trailer, { offsetMs: 0, skipResume: true })}
                                            disabled={playing}
                                            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-2 py-2.5 text-xs font-bold text-white hover:bg-white/10 disabled:opacity-50"
                                        >
                                            <Play className="h-3.5 w-3.5 fill-current" />
                                            {t('mediaPlayerPage.trailer')}
                                        </button>
                                    ) : null}
                                    {item.mediaInfo?.length ? (
                                        <button
                                            type="button"
                                            onClick={() => setMediaInfoOpen(true)}
                                            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-2 py-2.5 text-xs font-bold text-white hover:bg-white/10"
                                        >
                                            <Info className="h-3.5 w-3.5" />
                                            {t('mediaPlayerPage.mediaInfo')}
                                        </button>
                                    ) : null}
                                </div>
                            ) : null}
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col gap-4 pb-2">
                            <div className="light-on-media hidden md:flex flex-col gap-2.5">
                                {titleBlock}
                            </div>
                            <div className="media-details-panel flex flex-col gap-4 max-w-5xl">
                                <p className="text-sm sm:text-base lg:text-[17px] text-text leading-relaxed">
                                    {item.summary || t('media.noDescription')}
                                </p>
                                {streamRows.length ? (
                                    <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 max-w-xl">
                                        {streamRows.map((row) => (
                                            <React.Fragment key={row.label}>
                                                <span className="text-xs font-bold uppercase tracking-wider text-muted pt-0.5">{row.label}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => item.mediaInfo?.length && setMediaInfoOpen(true)}
                                                    className="text-left text-sm font-semibold text-text hover:text-plex"
                                                >
                                                    {row.value}
                                                </button>
                                            </React.Fragment>
                                        ))}
                                    </div>
                                ) : null}
                                {factRows.length ? (
                                    <div className="flex flex-col gap-3">
                                        <SectionHeading>{t('media.details')}</SectionHeading>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                                            {factRows.map((row) => (
                                                <div key={row.label} className="flex flex-col gap-0.5 min-w-0">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted">{row.label}</span>
                                                    <span className="text-sm text-text leading-snug">{row.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : null}
                                {factMediaType && Number.isFinite(factMediaId) && factMediaId > 0 ? (
                                    <DiscoveryFactWidget
                                        mediaType={factMediaType}
                                        mediaId={factMediaId}
                                        title={factTitle}
                                    />
                                ) : null}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="relative z-10 w-full max-w-[1600px] mx-auto page-x sm:px-8 xl:px-12 mt-2 md:mt-4 flex flex-col gap-8 md:gap-10 bg-card">
                {children.length && !isEpisodeGrid ? (
                    <section className="border-t border-border pt-8">
                        <SectionHeading>{t('mediaPlayerPage.seasons')}</SectionHeading>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                            {children.map((row) => (
                                <button
                                    key={row.ratingKey}
                                    type="button"
                                    onClick={() => onOpenItem(row)}
                                    className="group min-w-0 w-[85%] text-left"
                                >
                                    <div className="overflow-hidden rounded-xl border border-white/10 bg-black/30">
                                        {row.thumb ? (
                                            <img
                                                src={plexImageUrl(row.thumb, 400, 600)}
                                                alt=""
                                                className="aspect-[2/3] w-full object-cover transition-transform group-hover:scale-[1.03]"
                                            />
                                        ) : (
                                            <NoPosterPlaceholder />
                                        )}
                                    </div>
                                    <div className="mt-2 truncate text-sm font-bold text-text group-hover:text-plex">{row.title}</div>
                                    {row.leafCount ? (
                                        <div className="text-[11px] text-muted">{t('common.episodeCount', { count: row.leafCount })}</div>
                                    ) : null}
                                </button>
                            ))}
                        </div>
                    </section>
                ) : null}

                {children.length && isEpisodeGrid ? (
                    <section className="border-t border-border pt-8">
                        <SectionHeading>{t('mediaPlayerPage.episodes')}</SectionHeading>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                            {children.map((row) => (
                                <button
                                    key={row.ratingKey}
                                    type="button"
                                    onClick={() => onOpenItem(row)}
                                    className="group min-w-0 text-left"
                                >
                                    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black/30">
                                        {row.thumb ? (
                                            <img
                                                src={plexImageUrl(row.thumb, 640, 360)}
                                                alt=""
                                                className="aspect-video w-full object-cover transition-transform group-hover:scale-[1.03]"
                                            />
                                        ) : (
                                            <div className="flex aspect-video items-center justify-center text-[10px] font-bold uppercase tracking-widest text-muted">
                                                {t('mediaPlayerPage.episodes')}
                                            </div>
                                        )}
                                        {progressPercent(row) > 0 ? (
                                            <div className="absolute inset-x-0 bottom-0 h-1 bg-black/50">
                                                <div className="h-full bg-plex" style={{ width: `${progressPercent(row)}%` }} />
                                            </div>
                                        ) : null}
                                    </div>
                                    <div className="mt-2 truncate text-sm font-bold text-text group-hover:text-plex">{row.title}</div>
                                    <div className="text-[11px] text-muted">
                                        {row.index != null ? `Episode ${row.index}` : ''}
                                        {row.durationMs ? ` · ${formatPlayerDuration(row.durationMs)}` : ''}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </section>
                ) : null}

                {cast.length ? (
                    <section className="border-t border-border pt-8">
                        <SectionHeading>{t('media.topCast')}</SectionHeading>
                        <Carousel>
                            {cast.slice(0, 15).map((actor) => (
                                <button
                                    key={`${actor.id}-${actor.name}`}
                                    type="button"
                                    onClick={() => onOpenPerson({
                                        id: actor.id || actor.name,
                                        name: actor.name,
                                        thumb: actor.thumb,
                                    })}
                                    className="group flex flex-col items-center gap-3 w-40 flex-shrink-0 snap-start text-center"
                                >
                                    <div className="w-36 h-36 rounded-full bg-white/5 border-2 border-border overflow-hidden transition-transform group-hover:scale-[1.03] group-hover:border-plex">
                                        {actor.thumb ? (
                                            <img
                                                src={plexImageUrl(actor.thumb, 400, 400)}
                                                alt=""
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-muted bg-white/5">
                                                <Users className="w-12 h-12" />
                                            </div>
                                        )}
                                    </div>
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
                                    onClick={() => extra.canPlay ? onPlay(extra, { offsetMs: 0, skipResume: true }) : onOpenItem(extra)}
                                    className="group w-64 sm:w-72 flex-shrink-0 snap-start text-left"
                                >
                                    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black/30">
                                        {extra.thumb ? (
                                            <img
                                                src={plexImageUrl(extra.thumb, 640, 360)}
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
