import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import {
    formatBackgroundPosition,
    prefetchImageFocalPoints,
    resolveImageFocalPoint,
    type FocalPoint,
} from '../shared/imageFocalPoint';
import { resolvePortalAssetUrl } from '../shared/basePath';
import { useDiscoverI18n } from './host';
import { PlayerClearLogo } from './PlayerClearLogo';
import { plexBackdropUrl, plexLogoUrl } from './playerUtils';
import type { PlayerItem, PlayerPlayOptions } from './types';

export type HomeHeroSlide = {
    ratingKey: string;
    title: string;
    type: string;
    year?: number | null;
    summary?: string;
    thumb?: string | null;
    art?: string | null;
    logo?: string | null;
    backdropUrl?: string | null;
    posterUrl?: string | null;
    tmdbId?: number | null;
    canPlay?: boolean;
};

type Props = {
    items: HomeHeroSlide[];
    effectiveMode?: string | null;
    onOpenItem: (item: PlayerItem) => void;
    onPlay: (item: PlayerItem, opts?: PlayerPlayOptions) => void;
};

const heroMediaKindLabel = (
    type: string | undefined,
    translate: (key: string) => string,
): string => {
    const kind = String(type || '').toLowerCase();
    if (kind === 'show' || kind === 'episode' || kind === 'season') {
        return translate('mediaPlayerPage.searchShows');
    }
    if (kind === 'movie') return translate('mediaPlayerPage.searchMovies');
    return '';
};

/** Capacitor <img> needs absolute portal URL + access_token (rail posters already do this). */
const heroBackdropSrc = (slide: HomeHeroSlide): string => {
    if (slide.art) return plexBackdropUrl(slide.art);
    if (slide.backdropUrl) return resolvePortalAssetUrl(slide.backdropUrl);
    if (slide.thumb) return plexBackdropUrl(slide.thumb);
    if (slide.posterUrl) return resolvePortalAssetUrl(slide.posterUrl);
    return '';
};

const SLIDE_MS = 10000;
const SWIPE_MIN_DX = 48;

const toPlayerItem = (slide: HomeHeroSlide): PlayerItem => ({
    ratingKey: slide.ratingKey,
    title: slide.title,
    type: slide.type || 'movie',
    year: slide.year,
    summary: slide.summary,
    thumb: slide.thumb,
    art: slide.art,
    logo: slide.logo,
    tmdbId: slide.tmdbId,
    canPlay: slide.canPlay !== false,
});

const HeroTitle: React.FC<{ slide: HomeHeroSlide }> = ({ slide }) => {
    const logoUrl = plexLogoUrl(slide.logo);
    const [logoFailed, setLogoFailed] = useState(false);
    const [logoReady, setLogoReady] = useState(false);

    useEffect(() => {
        setLogoFailed(false);
        setLogoReady(false);
        if (!logoUrl) {
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
        img.src = logoUrl;
        if (img.complete) finish(img.naturalWidth > 0);
        return () => { cancelled = true; };
    }, [logoUrl, slide.ratingKey]);

    const showLogo = Boolean(logoUrl) && !logoFailed && logoReady;
    if (showLogo) {
        return (
            <PlayerClearLogo
                src={logoUrl}
                alt={slide.title}
                className="player-home-hero-logo max-h-8 w-auto max-w-[min(100%,12rem)] object-contain object-left drop-shadow-[0_8px_24px_rgba(0,0,0,0.55)] sm:max-h-14 sm:max-w-[min(100%,22rem)] lg:max-h-16"
            />
        );
    }
    return (
        <h2 className="player-home-hero-title text-base font-black tracking-tight text-white sm:text-2xl lg:text-3xl">
            {slide.title}
        </h2>
    );
};

export const MediaPlayerHomeHero: React.FC<Props> = ({ items, effectiveMode, onOpenItem, onPlay }) => {
    const { t } = useDiscoverI18n();
    const modeKey = String(effectiveMode || 'trending_week').trim() || 'trending_week';
    const modeEyebrowKey = `mediaPlayerPage.homeHeroEyebrowModes.${modeKey}`;
    const modeEyebrow = t(modeEyebrowKey);
    const eyebrow = modeEyebrow === modeEyebrowKey
        ? t('mediaPlayerPage.homeHeroEyebrow')
        : modeEyebrow;
    const [index, setIndex] = useState(0);
    const [paused, setPaused] = useState(false);
    const [focalByUrl, setFocalByUrl] = useState<Record<string, FocalPoint>>({});
    const swipeRef = useRef<{ x: number; y: number } | null>(null);
    const slides = Array.isArray(items) ? items.filter((row) => row?.ratingKey && row?.title) : [];
    const slideKey = slides.map((row) => row.ratingKey).join('|');
    const backdropKey = slides.map((row) => heroBackdropSrc(row)).join('|');

    useEffect(() => {
        setIndex(0);
    }, [slideKey]);

    useEffect(() => {
        if (paused || slides.length < 2) return undefined;
        const timer = window.setInterval(() => {
            setIndex((current) => (current + 1) % slides.length);
        }, SLIDE_MS);
        return () => window.clearInterval(timer);
    }, [paused, slides.length]);

    useEffect(() => {
        if (!slides.length) return undefined;
        let cancelled = false;
        const urls = [
            heroBackdropSrc(slides[index]),
            heroBackdropSrc(slides[(index + 1) % slides.length]),
            heroBackdropSrc(slides[(index + 2) % slides.length]),
        ].filter((url): url is string => Boolean(url));

        prefetchImageFocalPoints(urls);

        const warm = async () => {
            for (const url of urls) {
                if (cancelled) return;
                const focal = await resolveImageFocalPoint(url);
                if (cancelled) return;
                setFocalByUrl((prev) => (prev[url] ? prev : { ...prev, [url]: focal }));
            }
        };

        void warm();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- slides rebuilt each render
    }, [backdropKey, index, slides.length]);

    if (!slides.length) return null;

    const active = slides[Math.min(index, slides.length - 1)];
    const go = (delta: number) => {
        setIndex((current) => (current + delta + slides.length) % slides.length);
    };

    const onTouchStart = (event: React.TouchEvent) => {
        if (slides.length < 2) return;
        const touch = event.touches[0];
        if (!touch) return;
        swipeRef.current = { x: touch.clientX, y: touch.clientY };
        setPaused(true);
    };

    const onTouchEnd = (event: React.TouchEvent) => {
        const start = swipeRef.current;
        swipeRef.current = null;
        setPaused(false);
        if (!start || slides.length < 2) return;
        const touch = event.changedTouches[0];
        if (!touch) return;
        const dx = touch.clientX - start.x;
        const dy = touch.clientY - start.y;
        if (Math.abs(dx) < SWIPE_MIN_DX) return;
        if (Math.abs(dx) < Math.abs(dy) * 1.15) return;
        go(dx < 0 ? 1 : -1);
    };

    const onTouchCancel = () => {
        swipeRef.current = null;
        setPaused(false);
    };

    return (
        <section
            data-tv-page-top="1"
            className="player-home-hero relative touch-pan-y overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-[0_18px_50px_rgba(0,0,0,0.35)]"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            onTouchCancel={onTouchCancel}
            aria-roledescription="carousel"
            aria-label={eyebrow}
        >
            <div className="relative aspect-[21/9] min-h-[200px] max-h-[380px] w-full overflow-hidden sm:min-h-[250px]">
                {slides.map((slide, slideIndex) => {
                    const visible = slideIndex === index;
                    const backdropSrc = heroBackdropSrc(slide);
                    const focal = backdropSrc ? focalByUrl[backdropSrc] : undefined;
                    return (
                        <div
                            key={slide.ratingKey}
                            className={`absolute inset-0 overflow-hidden transition-opacity duration-700 ease-out ${visible ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
                            aria-hidden={!visible}
                        >
                            {backdropSrc ? (
                                <div className="absolute inset-0 overflow-hidden">
                                    <img
                                        src={backdropSrc}
                                        alt=""
                                        className="h-full w-full object-cover"
                                        style={{ objectPosition: formatBackgroundPosition(focal) }}
                                    />
                                </div>
                            ) : (
                                <div className="h-full w-full bg-gradient-to-br from-zinc-800 to-zinc-950" />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 via-[42%] to-transparent to-[72%]" />
                        </div>
                    );
                })}

                <div className="absolute inset-0 flex flex-col justify-between gap-2 p-3 sm:gap-3 sm:p-5 lg:p-6">
                    <p className="player-home-hero-eyebrow shrink-0 text-[10px] font-black uppercase tracking-[0.22em] text-plex drop-shadow-[0_2px_8px_rgba(0,0,0,0.65)]">
                        {eyebrow}
                    </p>
                    <div className="player-home-hero-copy min-h-0">
                        <div className="max-w-2xl">
                            <HeroTitle key={active.ratingKey} slide={active} />
                            <p className="mt-1 text-xs font-semibold text-white/65 sm:text-sm">
                                {[active.year, heroMediaKindLabel(active.type, t)]
                                    .filter(Boolean)
                                    .join(' · ')}
                            </p>
                            {active.summary ? (
                                <p className="player-home-hero-summary mt-2 hidden max-w-xl text-xs leading-relaxed text-white/75 sm:line-clamp-2">
                                    {active.summary}
                                </p>
                            ) : null}
                            <div className="mt-2.5 flex flex-wrap items-center gap-2 sm:mt-3" data-tv-rail="1">
                                {active.canPlay !== false ? (
                                    <button
                                        type="button"
                                        data-tv-item="1"
                                        data-tv-action="1"
                                        data-tv-play="1"
                                        data-tv-key="home-hero-play"
                                        onClick={() => onPlay(toPlayerItem(active))}
                                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-plex px-4 text-sm font-bold text-white shadow-lg shadow-plex/20 transition-colors hover:bg-plex-hover"
                                    >
                                        <Play className="h-4 w-4 fill-current" />
                                        {t('mediaPlayerPage.homeHeroPlay')}
                                    </button>
                                ) : null}
                                <button
                                    type="button"
                                    data-tv-item="1"
                                    data-tv-action="1"
                                    onClick={() => onOpenItem(toPlayerItem(active))}
                                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 text-sm font-bold text-white transition-colors hover:border-plex/40 hover:bg-white/10"
                                >
                                    {t('mediaPlayerPage.homeHeroOpen')}
                                </button>
                            </div>
                        </div>

                        <div className="mt-2.5 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-1.5">
                                {slides.map((slide, slideIndex) => (
                                    <button
                                        key={slide.ratingKey}
                                        type="button"
                                        tabIndex={-1}
                                        aria-label={`${slide.title}`}
                                        aria-current={slideIndex === index ? 'true' : undefined}
                                        onClick={() => setIndex(slideIndex)}
                                        className={`h-1.5 rounded-full transition-all ${
                                            slideIndex === index ? 'w-6 bg-plex' : 'w-1.5 bg-white/35 hover:bg-white/55'
                                        }`}
                                    />
                                ))}
                            </div>
                            {slides.length > 1 ? (
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        tabIndex={-1}
                                        onClick={() => go(-1)}
                                        className="rounded-full border border-white/15 bg-black/35 p-2 text-white/80 backdrop-blur hover:bg-black/55 hover:text-white"
                                        aria-label={t('mediaPlayerPage.homeHeroPrev')}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>
                                    <button
                                        type="button"
                                        tabIndex={-1}
                                        onClick={() => go(1)}
                                        className="rounded-full border border-white/15 bg-black/35 p-2 text-white/80 backdrop-blur hover:bg-black/55 hover:text-white"
                                        aria-label={t('mediaPlayerPage.homeHeroNext')}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
