import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { DiscoverGridSizeSelect } from '../discovery/DiscoverGridSizeSelect';
import { useDiscoverGridSize } from '../discovery/useDiscoverGridSize';
import { discoveryTheme } from '../discovery/discoveryThemeClasses';
import { useDiscoverI18n } from '../discovery/i18n';
import { PosterGridSkeleton } from '../shared/skeletons';
import { upgraderPosterGridClass, upgraderPosterGridStyle } from '../shared/portalLayout';
import {
    fetchMediaPlayerCollections,
    fetchMediaPlayerLibraries,
    fetchMediaPlayerLibrary,
    fetchMediaPlayerLibraryFilters,
    fetchMediaPlayerLibraryHome,
} from './api';
import { MediaPlayerLibrariesPanel } from './MediaPlayerLibrariesPanel';
import { PlayerPosterCard } from './PlayerPosterCard';
import { PlayerRail } from './PlayerRail';
import type { PlayerItem, PlayerLibraryHub, PlayerSection } from './types';

type LibraryTab = 'home' | 'browse' | 'collections';

type Props = {
    sectionKey: string;
    tab: LibraryTab;
    onBack: () => void;
    onOpenItem: (item: PlayerItem) => void;
    onOpenLibrary: (section: PlayerSection, tab?: LibraryTab) => void;
    onOpenCollection: (sectionKey: string, item: PlayerItem) => void;
    onChangeTab: (tab: LibraryTab) => void;
    onPlay: (item: PlayerItem) => void;
};

const PAGE_SIZE = 50;

const SORT_IDS = [
    'addedAt:desc',
    'titleSort',
    'year:desc',
    'originallyAvailableAt:desc',
    'audienceRating:desc',
    'lastViewedAt:desc',
    'viewCount:desc',
] as const;

export const MediaPlayerLibrary: React.FC<Props> = ({
    sectionKey,
    tab,
    onBack,
    onOpenItem,
    onOpenLibrary,
    onOpenCollection,
    onChangeTab,
    onPlay,
}) => {
    const { t } = useDiscoverI18n();
    const [gridSize, setGridSize] = useDiscoverGridSize();
    const [title, setTitle] = useState(t('mediaPlayerPage.libraries'));
    const [hubs, setHubs] = useState<PlayerLibraryHub[]>([]);
    const [items, setItems] = useState<PlayerItem[]>([]);
    const [collections, setCollections] = useState<PlayerItem[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [libraries, setLibraries] = useState<PlayerSection[]>([]);
    const [sort, setSort] = useState<string>('addedAt:desc');
    const [genre, setGenre] = useState('');
    const [unwatched, setUnwatched] = useState(false);
    const [genres, setGenres] = useState<Array<{ key: string; title: string }>>([]);

    const loadHome = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchMediaPlayerLibraryHome(sectionKey);
            setTitle(data.title || t('mediaPlayerPage.libraries'));
            setHubs(data.hubs || []);
            setError(null);
        } catch (err: any) {
            setError(String(err?.message || t('mediaPlayerPage.loadError')));
        } finally {
            setLoading(false);
        }
    }, [sectionKey, t]);

    const loadBrowse = useCallback(async (start: number, append: boolean) => {
        if (append) setLoadingMore(true);
        else setLoading(true);
        try {
            const data = await fetchMediaPlayerLibrary(sectionKey, start, PAGE_SIZE, {
                sort,
                genre,
                unwatched,
            });
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
    }, [genre, sectionKey, sort, t, unwatched]);

    const loadCollections = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchMediaPlayerCollections(sectionKey);
            setTitle(data.title || t('mediaPlayerPage.collections'));
            setCollections(data.items || []);
            setError(null);
        } catch (err: any) {
            setError(String(err?.message || t('mediaPlayerPage.loadError')));
        } finally {
            setLoading(false);
        }
    }, [sectionKey, t]);

    useEffect(() => {
        if (tab === 'home') void loadHome();
        else if (tab === 'collections') void loadCollections();
        else {
            setItems([]);
            void loadBrowse(0, false);
        }
    }, [loadBrowse, loadCollections, loadHome, tab]);

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

    useEffect(() => {
        let cancelled = false;
        fetchMediaPlayerLibraryFilters(sectionKey)
            .then((data) => {
                if (!cancelled) setGenres(data.genres || []);
            })
            .catch(() => {
                if (!cancelled) setGenres([]);
            });
        return () => { cancelled = true; };
    }, [sectionKey]);

    const tabs: Array<{ id: LibraryTab; label: string }> = [
        { id: 'home', label: t('mediaPlayerPage.libraryHome') },
        { id: 'browse', label: t('mediaPlayerPage.browse') },
        { id: 'collections', label: t('mediaPlayerPage.collections') },
    ];

    const sortLabels: Record<string, string> = {
        'addedAt:desc': t('mediaPlayerPage.sortAdded'),
        titleSort: t('mediaPlayerPage.sortTitle'),
        'year:desc': t('mediaPlayerPage.sortYear'),
        'originallyAvailableAt:desc': t('mediaPlayerPage.sortReleased'),
        'audienceRating:desc': t('mediaPlayerPage.sortRating'),
        'lastViewedAt:desc': t('mediaPlayerPage.sortLastPlayed'),
        'viewCount:desc': t('mediaPlayerPage.sortPlayCount'),
    };

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

            <div className="flex flex-wrap gap-2 border-b border-border pb-1">
                {tabs.map((row) => (
                    <button
                        key={row.id}
                        type="button"
                        onClick={() => onChangeTab(row.id)}
                        className={`rounded-t-lg px-4 py-2 text-sm font-bold ${
                            tab === row.id
                                ? 'bg-white/5 text-plex'
                                : 'text-muted hover:text-text'
                        }`}
                    >
                        {row.label}
                    </button>
                ))}
            </div>

            {libraries.length ? (
                <MediaPlayerLibrariesPanel
                    libraries={libraries}
                    onOpenLibrary={(section) => onOpenLibrary(section, tab)}
                    activeKey={sectionKey}
                />
            ) : null}

            {tab === 'browse' ? (
                <div className="flex flex-wrap items-center gap-2">
                    <select
                        value={sort}
                        onChange={(event) => setSort(event.target.value)}
                        className="rounded-lg border border-border bg-white/5 px-3 py-2 text-xs font-bold text-text"
                        aria-label={t('mediaPlayerPage.sortLabel')}
                    >
                        {SORT_IDS.map((id) => (
                            <option key={id} value={id}>{sortLabels[id] || id}</option>
                        ))}
                    </select>
                    <select
                        value={genre}
                        onChange={(event) => setGenre(event.target.value)}
                        className="rounded-lg border border-border bg-white/5 px-3 py-2 text-xs font-bold text-text"
                        aria-label={t('mediaPlayerPage.genre')}
                    >
                        <option value="">{t('mediaPlayerPage.allGenres')}</option>
                        {genres.map((row) => (
                            <option key={row.key} value={row.key}>{row.title}</option>
                        ))}
                    </select>
                    <button
                        type="button"
                        onClick={() => setUnwatched((prev) => !prev)}
                        className={`rounded-lg border px-3 py-2 text-xs font-bold ${
                            unwatched ? 'border-plex/50 bg-plex/15 text-plex' : 'border-border bg-white/5 text-muted'
                        }`}
                    >
                        {t('mediaPlayerPage.unwatched')}
                    </button>
                </div>
            ) : null}

            {loading ? (
                <PosterGridSkeleton />
            ) : error ? (
                <div className={discoveryTheme.emptyState}>
                    <p className={discoveryTheme.emptyTitle}>{error}</p>
                </div>
            ) : tab === 'home' ? (
                hubs.length ? (
                    <div className="flex flex-col gap-6">
                        {hubs.map((hub) => (
                            <PlayerRail
                                key={hub.identifier || hub.title}
                                title={hub.title}
                                items={hub.items}
                                density={gridSize}
                                onOpenItem={onOpenItem}
                                onPlay={onPlay}
                                showProgress={/continue|ondeck/i.test(hub.identifier)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className={discoveryTheme.emptyState}>
                        <p className={discoveryTheme.emptyTitle}>{t('mediaPlayerPage.emptyLibrary')}</p>
                    </div>
                )
            ) : tab === 'collections' ? (
                collections.length ? (
                    <div className={upgraderPosterGridClass(gridSize)} style={upgraderPosterGridStyle(gridSize)}>
                        {collections.map((item) => (
                            <PlayerPosterCard
                                key={item.ratingKey}
                                item={item}
                                onOpenItem={() => onOpenCollection(sectionKey, item)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className={discoveryTheme.emptyState}>
                        <p className={discoveryTheme.emptyTitle}>{t('mediaPlayerPage.emptyCollections')}</p>
                    </div>
                )
            ) : !items.length ? (
                <div className={discoveryTheme.emptyState}>
                    <p className={discoveryTheme.emptyTitle}>{t('mediaPlayerPage.emptyLibrary')}</p>
                </div>
            ) : (
                <>
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
                    {items.length < total ? (
                        <button
                            type="button"
                            onClick={() => void loadBrowse(items.length, true)}
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
