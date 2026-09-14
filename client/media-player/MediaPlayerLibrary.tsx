import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { DiscoverPosterCard } from '../screens';
import { DiscoverGridSizeSelect } from '../discovery/DiscoverGridSizeSelect';
import { useDiscoverGridSize } from '../discovery/useDiscoverGridSize';
import { discoveryTheme } from '../discovery/discoveryThemeClasses';
import { useDiscoverI18n } from '../discovery/i18n';
import { PosterGridSkeleton } from '../shared/skeletons';
import { upgraderPosterGridClass, upgraderPosterGridStyle } from '../shared/portalLayout';
import { fetchMediaPlayerLibraries, fetchMediaPlayerLibrary } from './api';
import { MediaPlayerLibrariesPanel } from './MediaPlayerLibrariesPanel';
import { toPosterCardItem } from './playerUtils';
import type { PlayerItem, PlayerSection } from './types';

type Props = {
    sectionKey: string;
    onBack: () => void;
    onOpenItem: (item: PlayerItem) => void;
    onOpenLibrary: (section: PlayerSection) => void;
};

const PAGE_SIZE = 50;

export const MediaPlayerLibrary: React.FC<Props> = ({ sectionKey, onBack, onOpenItem, onOpenLibrary }) => {
    const { t } = useDiscoverI18n();
    const [gridSize, setGridSize] = useDiscoverGridSize();
    const [title, setTitle] = useState(t('mediaPlayerPage.libraries'));
    const [items, setItems] = useState<PlayerItem[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [libraries, setLibraries] = useState<PlayerSection[]>([]);

    const load = useCallback(async (start: number, append: boolean) => {
        if (append) setLoadingMore(true);
        else setLoading(true);
        try {
            const data = await fetchMediaPlayerLibrary(sectionKey, start, PAGE_SIZE);
            setTitle(data.title || t('mediaPlayerPage.libraries'));
            setTotal(Number(data.total) || 0);
            setItems((prev) => append ? [...prev, ...(data.items || [])] : (data.items || []));
            setError(null);
        } catch (err: any) {
            setError(String(err?.message || t('mediaPlayerPage.loadError')));
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [sectionKey, t]);

    useEffect(() => {
        setItems([]);
        void load(0, false);
    }, [load]);

    useEffect(() => {
        let cancelled = false;
        fetchMediaPlayerLibraries()
            .then((data) => {
                if (!cancelled) setLibraries(data.libraries || []);
            })
            .catch(() => {
                if (!cancelled) setLibraries([]);
            });
        return () => { cancelled = true; };
    }, []);

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
                    <h1 className={discoveryTheme.heading}>{title}</h1>
                </div>
                <DiscoverGridSizeSelect value={gridSize} onChange={setGridSize} />
            </div>

            {libraries.length ? (
                <MediaPlayerLibrariesPanel
                    libraries={libraries}
                    onOpenLibrary={onOpenLibrary}
                    activeKey={sectionKey}
                />
            ) : null}

            {loading ? (
                <PosterGridSkeleton />
            ) : error ? (
                <div className={discoveryTheme.emptyState}>
                    <p className={discoveryTheme.emptyTitle}>{error}</p>
                </div>
            ) : !items.length ? (
                <div className={discoveryTheme.emptyState}>
                    <p className={discoveryTheme.emptyTitle}>{t('mediaPlayerPage.emptyLibrary')}</p>
                </div>
            ) : (
                <>
                    <div className={upgraderPosterGridClass(gridSize)} style={upgraderPosterGridStyle(gridSize)}>
                        {items.map((item) => (
                            <DiscoverPosterCard
                                key={item.ratingKey}
                                item={toPosterCardItem(item)}
                                aspect={item.type === 'artist' || item.type === 'album' ? 'square' : '2/3'}
                                showQualityBadges={false}
                                onPosterClick={() => onOpenItem(item)}
                            />
                        ))}
                    </div>
                    {items.length < total ? (
                        <button
                            type="button"
                            onClick={() => void load(items.length, true)}
                            disabled={loadingMore}
                            className="mx-auto rounded-lg bg-white/5 px-4 py-2 text-sm font-bold text-text hover:bg-white/10"
                        >
                            {loadingMore ? t('common.loadingMore') : t('mediaPlayerPage.loadMore')}
                        </button>
                    ) : null}
                </>
            )}
        </div>
    );
};
