import React, { useEffect, useState } from 'react';
import { ArrowLeft, Users } from 'lucide-react';
import { DiscoverGridSizeSelect } from '../discovery/DiscoverGridSizeSelect';
import { useDiscoverGridSize } from '../discovery/useDiscoverGridSize';
import { discoveryTheme } from '../discovery/discoveryThemeClasses';
import { useDiscoverI18n } from '../discovery/i18n';
import { PosterGridSkeleton } from '../shared/skeletons';
import { upgraderPosterGridClass, upgraderPosterGridStyle } from '../shared/portalLayout';
import { fetchMediaPlayerPerson } from './api';
import { plexImageUrl } from './playerUtils';
import { PlayerPosterCard } from './PlayerPosterCard';
import type { PlayerItem } from './types';

type Props = {
    actorId: string;
    name?: string;
    thumb?: string | null;
    onBack: () => void;
    onOpenItem: (item: PlayerItem) => void;
    onPlay: (item: PlayerItem) => void;
};

export const MediaPlayerPerson: React.FC<Props> = ({ actorId, name, thumb, onBack, onOpenItem, onPlay }) => {
    const { t } = useDiscoverI18n();
    const [gridSize, setGridSize] = useDiscoverGridSize();
    const [title, setTitle] = useState(name || t('navigation.person'));
    const [photo, setPhoto] = useState(thumb || null);
    const [items, setItems] = useState<PlayerItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [photoFailed, setPhotoFailed] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setPhotoFailed(false);
        fetchMediaPlayerPerson(actorId, name || '')
            .then((data) => {
                if (cancelled) return;
                setTitle(data.person?.name || name || t('navigation.person'));
                setPhoto(thumb || data.person?.thumb || null);
                setItems(data.items || []);
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

    const photoUrl = photo ? plexImageUrl(photo, 300, 300) : '';

    return (
        <div className="flex flex-col gap-5 pb-8">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <button
                        type="button"
                        onClick={onBack}
                        className="mb-2 inline-flex items-center gap-2 text-sm font-bold text-muted hover:text-text"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        {t('mediaPlayerPage.back')}
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 sm:h-20 sm:w-20 overflow-hidden rounded-full border-2 border-border bg-white/5 flex-shrink-0">
                            {photoUrl && !photoFailed ? (
                                <img src={photoUrl} alt="" className="h-full w-full object-cover" onError={() => setPhotoFailed(true)} />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-muted">
                                    <Users className="h-8 w-8" />
                                </div>
                            )}
                        </div>
                        <div>
                            <p className={discoveryTheme.personalEyebrow}>{t('mediaPlayerPage.onThisServer')}</p>
                            <h1 className={discoveryTheme.heading}>{title}</h1>
                        </div>
                    </div>
                </div>
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
                <div className={upgraderPosterGridClass(gridSize)} style={upgraderPosterGridStyle(gridSize)}>
                    {items.map((item) => (
                        <PlayerPosterCard
                            key={item.ratingKey}
                            item={item}
                            onOpenItem={onOpenItem}
                            onPlay={onPlay}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
