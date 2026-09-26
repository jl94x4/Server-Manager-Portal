import React, { useEffect, useLayoutEffect, useState } from 'react';
import { ArrowLeft, Film } from 'lucide-react';
import {
    DiscoverGridSizeSelect,
    discoveryTheme,
    PersonProfileHeader,
    PosterGridSkeleton,
    upgraderPosterGridClass,
    upgraderPosterGridStyle,
    useDiscoverGridSize,
    useDiscoverI18n,
} from './host';
import { fetchPlayerPersonBundle, setMediaPlayerWatched } from './api';
import { writePlayerScrollTop } from './playerMemory';
import { plexImageUrl, playerCardImageUrl, prefetchPlayerImages } from './playerUtils';
import { PlayerPosterCard } from './PlayerPosterCard';
import type { PlayerItem, PlayerPersonProfile, PlayerPlayOptions } from './types';

type Props = {
    actorId: string;
    name?: string;
    thumb?: string | null;
    onBack: () => void;
    onOpenItem: (item: PlayerItem) => void;
    onPlay: (item: PlayerItem, opts?: PlayerPlayOptions) => void;
};

export const MediaPlayerPerson: React.FC<Props> = ({ actorId, name, thumb, onBack, onOpenItem, onPlay }) => {
    const { t } = useDiscoverI18n();
    const [gridSize, setGridSize] = useDiscoverGridSize();
    const [title, setTitle] = useState(name || t('navigation.person'));
    const [photo, setPhoto] = useState(thumb || null);
    const [profile, setProfile] = useState<PlayerPersonProfile | null>(null);
    const [items, setItems] = useState<PlayerItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useLayoutEffect(() => {
        writePlayerScrollTop(0);
    }, [actorId]);

    useEffect(() => {
        writePlayerScrollTop(0);
        const isTv = typeof document !== 'undefined' && (
            document.documentElement?.dataset?.tv === '1'
            || window.__PLEX_CLIENT__?.isTv === true
        );
        if (!isTv) return undefined;
        const id = window.setTimeout(() => {
            writePlayerScrollTop(0);
            const back = document.querySelector<HTMLElement>('[data-tv-person-back="1"]');
            back?.focus({ preventScroll: true });
        }, 40);
        return () => window.clearTimeout(id);
    }, [actorId, loading]);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setProfile(null);

        fetchPlayerPersonBundle(actorId, name, thumb)
            .then((data) => {
                if (cancelled) return;
                setTitle(data.person.name || t('navigation.person'));
                setPhoto(data.person.thumb || null);
                setItems(data.items || []);
                setProfile(data.profile);
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
    }, [actorId, name, t, thumb]);

    useEffect(() => {
        prefetchPlayerImages(items.slice(0, 12).map((item) => playerCardImageUrl(item.thumb)), 12);
    }, [items]);

    const toggleWatched = async (item: PlayerItem) => {
        const next = !item.watched;
        setItems((prev) => prev.map((row) => (
            row.ratingKey === item.ratingKey ? { ...row, watched: next } : row
        )));
        try {
            await setMediaPlayerWatched(item.ratingKey, next);
        } catch {
            setItems((prev) => prev.map((row) => (
                row.ratingKey === item.ratingKey ? { ...row, watched: item.watched } : row
            )));
        }
    };

    const photoUrl = photo ? plexImageUrl(photo, 300, 450, { quality: 60 }) : '';
    const headerPerson = profile || { name: title };

    return (
        <div className="flex flex-col gap-8 pb-8">
            <div data-tv-rail="1">
                <button
                    type="button"
                    data-tv-item="1"
                    data-tv-action="1"
                    data-tv-person-back="1"
                    data-tv-key={`person-back:${actorId}`}
                    onClick={onBack}
                    className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-muted hover:text-text"
                >
                    <ArrowLeft className="h-4 w-4" />
                    {t('mediaPlayerPage.back')}
                </button>
                {loading ? (
                    <div
                        className="grid grid-cols-[6.75rem_minmax(0,1fr)] sm:grid-cols-[9.5rem_minmax(0,1fr)] md:grid-cols-[minmax(14rem,22rem)_minmax(0,1fr)] gap-x-4 gap-y-4 md:gap-x-8"
                        aria-hidden="true"
                    >
                        <div className="aspect-[2/3] rounded-2xl bg-white/5 animate-pulse" />
                        <div className="flex flex-col gap-3">
                            <div className="h-10 w-2/3 max-w-md rounded-lg bg-white/5 animate-pulse" />
                            <div className="h-8 w-1/2 max-w-sm rounded-full bg-white/5 animate-pulse" />
                            <div className="h-28 rounded-xl bg-white/5 animate-pulse" />
                        </div>
                    </div>
                ) : (
                    <PersonProfileHeader
                        person={headerPerson}
                        fallbackPhotoUrl={photoUrl}
                        showBiography
                    />
                )}
            </div>

            <section className="flex flex-col gap-5 border-t border-border pt-8">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <h2 className="text-2xl font-black text-text flex items-center gap-3">
                        <Film className="w-6 h-6 text-plex" /> {t('mediaPlayerPage.onThisServer')}
                        {!loading && items.length ? (
                            <span className="text-sm font-bold text-muted tracking-normal">
                                {t('person.creditCount', { count: items.length })}
                            </span>
                        ) : null}
                    </h2>
                    <DiscoverGridSizeSelect value={gridSize} onChange={setGridSize} />
                </div>

                {loading ? (
                    <PosterGridSkeleton
                        className={upgraderPosterGridClass(gridSize)}
                        style={upgraderPosterGridStyle(gridSize)}
                    />
                ) : error ? (
                    <div className={discoveryTheme.emptyState}>
                        <p className={discoveryTheme.emptyTitle}>{error}</p>
                    </div>
                ) : !items.length ? (
                    <div className={discoveryTheme.emptyState}>
                        <p className={discoveryTheme.emptyTitle}>{t('mediaPlayerPage.emptyPerson', { name: title })}</p>
                    </div>
                ) : (
                    <div
                        className={upgraderPosterGridClass(gridSize)}
                        style={upgraderPosterGridStyle(gridSize)}
                        data-tv-rail="1"
                        data-tv-poster-grid="1"
                    >
                        {items.map((item, index) => (
                            <PlayerPosterCard
                                key={item.ratingKey}
                                item={item}
                                onOpenItem={onOpenItem}
                                onPlay={onPlay}
                                onToggleWatched={toggleWatched}
                                imagePriority={index < 8}
                                loading={index < 12 ? 'eager' : 'lazy'}
                            />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};
