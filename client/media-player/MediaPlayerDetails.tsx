import React, { useEffect, useState } from 'react';
import { ArrowLeft, Calendar, Clock, Film, Loader2, Play, Star, Tv, Users } from 'lucide-react';
import { NoPosterPlaceholder } from '../shared/NoPosterPlaceholder';
import { Carousel } from '../discovery/Carousel';
import { DiscoveryFactWidget } from '../discovery/DiscoveryFactWidget';
import { useDiscoverI18n } from '../discovery/i18n';
import { fetchMediaPlayerItem } from './api';
import { formatPlayerDuration, plexImageUrl, progressPercent } from './playerUtils';
import type { PlayerItem } from './types';

type Props = {
    ratingKey: string;
    onBack: () => void;
    onOpenItem: (item: PlayerItem) => void;
    onPlay: (item: PlayerItem) => void;
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

export const MediaPlayerDetails: React.FC<Props> = ({ ratingKey, onBack, onOpenItem, onPlay, playing = false }) => {
    const { t, locale } = useDiscoverI18n();
    const [item, setItem] = useState<PlayerItem | null>(null);
    const [children, setChildren] = useState<PlayerItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [posterFailed, setPosterFailed] = useState(false);
    const [backdropFailed, setBackdropFailed] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setPosterFailed(false);
        setBackdropFailed(false);
        fetchMediaPlayerItem(ratingKey)
            .then((data) => {
                if (cancelled) return;
                setItem(data.item);
                setChildren(data.children || []);
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

    const posterUrl = plexImageUrl(item.thumb, 400, 600);
    const backdropUrl = plexImageUrl(item.art || item.thumb, 1280, 720);
    const isEpisodeGrid = children.some((row) => row.type === 'episode');
    const canPlay = !!item.canPlay;
    const playLabel = item.viewOffsetMs && item.viewOffsetMs > 15000
        ? t('mediaPlayerPage.resume')
        : t('mediaPlayerPage.play');
    const airedDate = item.originallyAvailableAt ? new Date(item.originallyAvailableAt) : null;
    const aired = airedDate && !Number.isNaN(airedDate.getTime())
        ? airedDate.toLocaleDateString(locale || 'en', { day: 'numeric', month: 'short', year: 'numeric' })
        : '';
    const metaChips = [
        item.year ? { icon: <Calendar className="h-3 w-3" />, label: String(item.year) } : null,
        item.contentRating ? { icon: null, label: item.contentRating } : null,
        item.durationMs ? { icon: <Clock className="h-3 w-3" />, label: formatPlayerDuration(item.durationMs) } : null,
        item.audienceRating ? { icon: <Star className="h-3 w-3 text-plex" />, label: String(item.audienceRating) } : null,
    ].filter(Boolean) as Array<{ icon: React.ReactNode; label: string }>;
    const factRows = [
        item.studio ? { label: t('media.studio'), value: item.studio } : null,
        item.directors?.length ? { label: t('mediaPlayerPage.directedBy'), value: item.directors.join(', ') } : null,
        item.writers?.length ? { label: t('mediaPlayerPage.writtenBy'), value: item.writers.join(', ') } : null,
        aired ? { label: t('mediaPlayerPage.aired'), value: aired } : null,
    ].filter(Boolean) as Array<{ label: string; value: string }>;
    const cast = item.cast || [];
    const factMediaType = item.type === 'movie'
        ? 'movie'
        : (item.type === 'show' || item.type === 'season' || item.type === 'episode' ? 'tv' : null);
    const factMediaId = Number(item.tmdbId);
    const factTitle = item.type === 'episode' || item.type === 'season'
        ? (item.showTitle || item.title)
        : item.title;

    const titleBlock = (
        <>
            <div className="flex items-center gap-2 flex-wrap">
                {item.type === 'movie' ? <Film className="w-3.5 h-3.5 text-plex" /> : <Tv className="w-3.5 h-3.5 text-plex" />}
                <span className="text-[10px] font-bold uppercase tracking-widest text-plex">{typeLabel(item.type)}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-5xl font-black text-white leading-[1.08] tracking-tight drop-shadow-lg">
                {item.title}
            </h1>
            {item.showTitle ? (
                <p className="text-sm font-bold text-white/70">{item.showTitle}{item.seasonTitle ? ` · ${item.seasonTitle}` : ''}</p>
            ) : null}
            {item.tagline ? (
                <p className="text-sm sm:text-base text-white/55 italic max-w-4xl">{item.tagline}</p>
            ) : null}
            <div className="flex flex-wrap items-center gap-1.5">
                {metaChips.map((chip) => (
                    <div key={chip.label} className="flex items-center gap-1 bg-black/45 px-2 py-1 rounded-md backdrop-blur-md border border-white/10 text-[11px] text-white/85 font-semibold">
                        {chip.icon}
                        {chip.label}
                    </div>
                ))}
            </div>
            {item.genres?.length ? (
                <div className="flex flex-wrap gap-2">
                    {item.genres.map((genre) => (
                        <span key={genre} className="px-2.5 py-1 bg-white/[0.06] border border-white/10 rounded-lg text-xs font-semibold text-white/75 backdrop-blur-sm">
                            {genre}
                        </span>
                    ))}
                </div>
            ) : null}
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
                        <div className="w-full md:w-52 lg:w-60 flex-shrink-0 flex flex-col gap-4">
                            <div className="flex flex-row md:flex-col gap-4 items-stretch">
                                <div className="relative w-[38%] max-w-[10.5rem] sm:max-w-[12rem] md:w-full md:max-w-none aspect-[2/3] rounded-xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.55)] border border-white/15 bg-black/50 ring-1 ring-white/10 flex-shrink-0">
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
                                    onClick={() => onPlay(item)}
                                    disabled={playing}
                                    className="w-full py-3 px-2 sm:px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 sm:gap-2 transition-colors shadow-lg bg-plex hover:bg-plex-hover text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {playing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-current" />}
                                    {playLabel}
                                </button>
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
                {cast.length ? (
                    <section className="border-t border-border pt-8">
                        <SectionHeading>{t('media.topCast')}</SectionHeading>
                        <Carousel>
                            {cast.slice(0, 15).map((actor) => (
                                <div
                                    key={`${actor.id}-${actor.name}`}
                                    className="group flex flex-col items-center gap-3 w-36 sm:w-40 flex-shrink-0 snap-start"
                                >
                                    <div className="w-32 h-32 rounded-full bg-white/5 border-2 border-border overflow-hidden">
                                        {actor.thumb ? (
                                            <img
                                                src={plexImageUrl(actor.thumb, 300, 300)}
                                                alt=""
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-muted bg-white/5">
                                                <Users className="w-10 h-10" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-center w-full px-1">
                                        <div className="text-sm font-bold text-text leading-tight line-clamp-2">{actor.name}</div>
                                        {actor.role ? (
                                            <div className="text-xs text-muted mt-1 leading-snug line-clamp-2">{actor.role}</div>
                                        ) : null}
                                    </div>
                                </div>
                            ))}
                        </Carousel>
                    </section>
                ) : null}

                {children.length ? (
                    <section className="border-t border-border pt-8 pb-4">
                        <SectionHeading>
                            {isEpisodeGrid ? t('mediaPlayerPage.episodes') : t('mediaPlayerPage.seasons')}
                        </SectionHeading>
                        {isEpisodeGrid ? (
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                                {children.map((row) => (
                                    <button
                                        key={row.ratingKey}
                                        type="button"
                                        onClick={() => (row.canPlay ? onPlay(row) : onOpenItem(row))}
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
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                                {children.map((row) => (
                                    <button
                                        key={row.ratingKey}
                                        type="button"
                                        onClick={() => onOpenItem(row)}
                                        className="bg-white/5 border border-border rounded-xl p-3 flex gap-3 items-center min-w-0 text-left hover:bg-white/10 hover:border-plex/30 transition-colors"
                                    >
                                        <div className="w-11 h-16 rounded-md overflow-hidden flex-shrink-0 bg-white/5 border border-border">
                                            {row.thumb ? (
                                                <img src={plexImageUrl(row.thumb, 120, 180)} className="w-full h-full object-cover" alt="" />
                                            ) : (
                                                <NoPosterPlaceholder compact />
                                            )}
                                        </div>
                                        <div className="flex flex-col min-w-0 gap-1">
                                            <span className="font-bold text-text text-sm truncate">{row.title}</span>
                                            {row.leafCount ? (
                                                <span className="text-xs text-muted">{t('common.episodeCount', { count: row.leafCount })}</span>
                                            ) : null}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </section>
                ) : null}
            </div>
        </div>
    );
};
