import React, { useEffect, useState } from 'react';
import { ArrowLeft, Film, Loader2, Play, Star, Tv } from 'lucide-react';
import { NoPosterPlaceholder } from '../shared/NoPosterPlaceholder';
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

export const MediaPlayerDetails: React.FC<Props> = ({ ratingKey, onBack, onOpenItem, onPlay, playing = false }) => {
    const { t } = useDiscoverI18n();
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
    const metaChips = [
        item.year ? String(item.year) : '',
        item.contentRating || '',
        formatPlayerDuration(item.durationMs),
        item.audienceRating ? String(item.audienceRating) : '',
    ].filter(Boolean);

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
                            <div className="relative w-[38%] max-w-[10.5rem] sm:max-w-[12rem] md:w-full md:max-w-none aspect-[2/3] rounded-xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.55)] border border-white/15 bg-black/50 ring-1 ring-white/10 flex-shrink-0">
                                {posterUrl && !posterFailed ? (
                                    <img src={posterUrl} alt="" className="relative w-full h-full object-cover" onError={() => setPosterFailed(true)} />
                                ) : (
                                    <NoPosterPlaceholder />
                                )}
                            </div>
                            {canPlay ? (
                                <button
                                    type="button"
                                    onClick={() => onPlay(item)}
                                    disabled={playing}
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-plex px-4 py-3 text-sm font-black text-black hover:bg-plex-hover disabled:opacity-60"
                                >
                                    {playing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-current" />}
                                    {playLabel}
                                </button>
                            ) : null}
                        </div>

                        <div className="min-w-0 flex-1 pt-1">
                            <div className="hidden md:flex items-center gap-2 flex-wrap mb-3">
                                {item.type === 'movie' ? <Film className="w-3.5 h-3.5 text-plex" /> : <Tv className="w-3.5 h-3.5 text-plex" />}
                                <span className="text-[10px] font-bold uppercase tracking-widest text-plex">{item.type}</span>
                            </div>
                            <h1 className="text-3xl sm:text-5xl font-black text-white leading-[1.08] tracking-tight drop-shadow-lg">
                                {item.title}
                            </h1>
                            {item.showTitle ? (
                                <p className="mt-2 text-sm font-bold text-white/70">{item.showTitle}{item.seasonTitle ? ` · ${item.seasonTitle}` : ''}</p>
                            ) : null}
                            <div className="mt-4 flex flex-wrap items-center gap-1.5">
                                {metaChips.map((chip) => (
                                    <div key={chip} className="flex items-center gap-1 bg-black/45 px-2 py-1 rounded-md backdrop-blur-md border border-white/10 text-[11px] text-white/85 font-semibold">
                                        {chip === String(item.audienceRating) ? <Star className="h-3 w-3 text-plex" /> : null}
                                        {chip}
                                    </div>
                                ))}
                            </div>
                            {item.summary ? (
                                <p className="mt-5 max-w-3xl text-sm leading-relaxed text-white/80">{item.summary}</p>
                            ) : null}
                            {item.genres?.length ? (
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {item.genres.map((genre) => (
                                        <span key={genre} className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[11px] font-bold text-white/80">
                                            {genre}
                                        </span>
                                    ))}
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>

            {children.length ? (
                <div className="relative z-10 w-full max-w-[1600px] mx-auto page-x sm:px-8 xl:px-12 pb-10">
                    <h2 className="mb-4 text-xs font-black uppercase tracking-[0.2em] text-muted">
                        {isEpisodeGrid ? t('mediaPlayerPage.episodes') : t('mediaPlayerPage.seasons')}
                    </h2>
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
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                            {children.map((row) => (
                                <button
                                    key={row.ratingKey}
                                    type="button"
                                    onClick={() => onOpenItem(row)}
                                    className="group min-w-0 text-left"
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
                                        <div className="text-[11px] text-muted">{row.leafCount} {t('mediaPlayerPage.episodes')}</div>
                                    ) : null}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            ) : null}
        </div>
    );
};
