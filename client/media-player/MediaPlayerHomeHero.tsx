import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import {
    formatBackgroundPosition,
    prefetchImageFocalPoints,
    resolveImageFocalPoint,
    type FocalPoint,
} from '../shared/imageFocalPoint';
import { useDiscoverI18n } from './host';
import { plexLogoUrl } from './playerUtils';
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
    onOpenItem: (item: PlayerItem) => void;
    onPlay: (item: PlayerItem, opts?: PlayerPlayOptions) => void;
};

const SLIDE_MS = 10000;

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
            <img
                src={logoUrl}
                alt={slide.title}
                className="mt-1.5 max-h-10 w-auto max-w-[min(100%,14rem)] object-contain object-left drop-shadow-[0_8px_24px_rgba(0,0,0,0.55)] sm:mt-2 sm:max-h-20 sm:max-w-[min(100%,28rem)] lg:max-h-24"
            />
        );
    }
    return (
        <h2 className="mt-1.5 text-lg font-black tracking-tight text-white sm:mt-2 sm:text-3xl lg:text-4xl">
            {slide.title}
        </h2>
    );
};

export const MediaPlayerHomeHero: React.FC<Props> = ({ items, onOpenItem, onPlay }) => {
    const { t } = useDiscoverI18n();
    const [index, setIndex] = useState(0);
    const [paused, setPaused] = useState(false);
    const [focalByUrl, setFocalByUrl] = useState<Record<string, FocalPoint>>({});
    const slides = Array.isArray(items) ? items.filter((row) => row?.ratingKey && row?.title) : [];
    const slideKey = slides.map((row) => row.ratingKey).join('|');
    const backdropKey = slides.map((row) => row.backdropUrl || '').join('|');

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
            slides[index]?.backdropUrl,
            slides[(index + 1) % slides.length]?.backdropUrl,
            slides[(index + 2) % slides.length]?.backdropUrl,
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
        // backdropKey captures URL identity; slides.length keeps modulo safe
        // eslint-disable-next-line react-hooks/exhaustive-deps -- slides rebuilt each render
    }, [backdropKey, index, slides.length]);

    if (!slides.length) return null;

    const active = slides[Math.min(index, slides.length - 1)];
    const go = (delta: number) => {
        setIndex((current) => (current + delta + slides.length) % slides.length);
    };

    return (
        <section
            className="player-home-hero relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-[0_18px_50px_rgba(0,0,0,0.35)]"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            aria-roledescription="carousel"
            aria-label={t('mediaPlayerPage.homeHeroEyebrow')}
        >
            <div className="relative aspect-[21/9] min-h-[220px] max-h-[420px] w-full sm:min-h-[280px]">
                {slides.map((slide, slideIndex) => {
                    const visible = slideIndex === index;
                    const focal = slide.backdropUrl ? focalByUrl[slide.backdropUrl] : undefined;
                    return (
                        <div
                            key={slide.ratingKey}
                            className={`absolute inset-0 transition-opacity duration-700 ease-out ${visible ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
                            aria-hidden={!visible}
                        >
                            {slide.backdropUrl ? (
                                <img
                                    src={slide.backdropUrl}
                                    alt=""
                                    className={`h-full w-full object-cover transition-[transform,object-position] duration-[8s] ease-out ${visible ? 'scale-105' : 'scale-100'}`}
                                    style={{ objectPosition: formatBackgroundPosition(focal) }}
                                />
                            ) : (
                                <div className="h-full w-full bg-gradient-to-br from-zinc-800 to-zinc-950" />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/15" />
                            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/35 to-transparent" />
                        </div>
                    );
                })}

                <div className="absolute inset-0 flex flex-col justify-end gap-3 p-4 sm:gap-4 sm:p-7 lg:p-8">
                    <div className="max-w-2xl">
                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-plex">
                            {t('mediaPlayerPage.homeHeroEyebrow')}
                        </p>
                        <HeroTitle key={active.ratingKey} slide={active} />
                        <p className="mt-1 text-xs font-semibold text-white/65 sm:text-sm">
                            {[active.year, active.type === 'show' ? t('mediaPlayerPage.searchShows') : t('mediaPlayerPage.searchMovies')]
                                .filter(Boolean)
                                .join(' · ')}
                        </p>
                        {active.summary ? (
                            <p className="mt-3 hidden max-w-xl text-sm leading-relaxed text-white/75 sm:line-clamp-2 md:line-clamp-3">
                                {active.summary}
                            </p>
                        ) : null}
                        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 sm:mt-4 sm:gap-2">
                            {active.canPlay !== false ? (
                                <button
                                    type="button"
                                    onClick={() => onPlay(toPlayerItem(active))}
                                    className="inline-flex items-center gap-1.5 rounded-full bg-plex px-3 py-1.5 text-xs font-black text-zinc-950 shadow-lg shadow-plex/25 transition hover:bg-plex-hover sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm"
                                >
                                    <Play className="h-3.5 w-3.5 fill-current sm:h-4 sm:w-4" />
                                    {t('mediaPlayerPage.homeHeroPlay')}
                                </button>
                            ) : null}
                            <button
                                type="button"
                                onClick={() => onOpenItem(toPlayerItem(active))}
                                className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-white backdrop-blur transition hover:bg-white/15 sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm"
                            >
                                {t('mediaPlayerPage.homeHeroOpen')}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-1.5">
                            {slides.map((slide, slideIndex) => (
                                <button
                                    key={slide.ratingKey}
                                    type="button"
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
                                    onClick={() => go(-1)}
                                    className="rounded-full border border-white/15 bg-black/35 p-2 text-white/80 backdrop-blur hover:bg-black/55 hover:text-white"
                                    aria-label={t('mediaPlayerPage.homeHeroPrev')}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
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
        </section>
    );
};
