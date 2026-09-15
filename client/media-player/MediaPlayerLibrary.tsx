import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import {
    CustomSelect,
    DiscoverGridSizeSelect,
    DiscoverHomeRowSkeleton,
    discoveryTheme,
    PosterGridSkeleton,
    upgraderPosterGridClass,
    upgraderPosterGridStyle,
    useDiscoverGridSize,
    useDiscoverI18n,
} from './host';
import {
    fetchMediaPlayerCollections,
    fetchMediaPlayerLibraries,
    fetchMediaPlayerLibrary,
    fetchMediaPlayerLibraryFilters,
    fetchMediaPlayerLibraryHome,
    setMediaPlayerWatched,
} from './api';
import { readLibraryBrowseState, writeLibraryBrowseState } from './playerMemory';
import { MediaPlayerLibrariesPanel } from './MediaPlayerLibrariesPanel';
import { PlayerPosterCard } from './PlayerPosterCard';
import { PlayerRail } from './PlayerRail';
import type { PlayerItem, PlayerLibraryHub, PlayerPlayOptions, PlayerSection } from './types';

type LibraryTab = 'home' | 'browse' | 'collections';

type Props = {
    sectionKey: string;
    tab: LibraryTab;
    onBack: () => void;
    onOpenItem: (item: PlayerItem) => void;
    onOpenLibrary: (section: PlayerSection, tab?: LibraryTab) => void;
    onOpenCollection: (sectionKey: string, item: PlayerItem) => void;
    onChangeTab: (tab: LibraryTab) => void;
    onPlay: (item: PlayerItem, opts?: PlayerPlayOptions) => void;
};

const PAGE_SIZE = 50;

const isContinueWatchingHub = (hub: PlayerLibraryHub) => (
    /continue\s*watch|ondeck|on[.\s_-]?deck|in[.\s_-]?progress/i.test(`${hub.identifier || ''} ${hub.title || ''}`)
);

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
    const [hydrated, setHydrated] = useState(false);
    const [libraries, setLibraries] = useState<PlayerSection[]>([]);
    const [sort, setSort] = useState<string>('addedAt:desc');
    const [genre, setGenre] = useState('');
    const [decade, setDecade] = useState('');
    const [resolution, setResolution] = useState('');
    const [studio, setStudio] = useState('');
    const [unwatched, setUnwatched] = useState(false);
    const [inProgress, setInProgress] = useState(false);
    const [genres, setGenres] = useState<Array<{ key: string; title: string }>>([]);
    const [decades, setDecades] = useState<Array<{ key: string; title: string }>>([]);
    const [resolutions, setResolutions] = useState<Array<{ key: string; title: string }>>([]);
    const [studios, setStudios] = useState<Array<{ key: string; title: string }>>([]);
    const homeHubs = useMemo(() => {
        let keptContinue = false;
        return hubs.filter((hub) => {
            if (!isContinueWatchingHub(hub)) return true;
            if (keptContinue) return false;
            keptContinue = true;
            return true;
        });
    }, [hubs]);

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
                decade,
                resolution,
                studio,
                unwatched,
                inProgress,
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
    }, [decade, genre, inProgress, resolution, sectionKey, sort, studio, t, unwatched]);

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
        else if (hydrated) {
            setItems([]);
            void loadBrowse(0, false);
        }
    }, [hydrated, loadBrowse, loadCollections, loadHome, tab]);

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
                if (cancelled) {
                    return;
                }
                setGenres(data.genres || []);
                setDecades(data.decades || []);
                setResolutions(data.resolutions || []);
                setStudios(data.studios || []);
            })
            .catch(() => {
                if (!cancelled) {
                    setGenres([]);
                    setDecades([]);
                    setResolutions([]);
                    setStudios([]);
                }
            });
        return () => { cancelled = true; };
    }, [sectionKey]);

    useEffect(() => {
        const saved = readLibraryBrowseState(sectionKey);
        setHydrated(false);
        setSort(saved.sort);
        setGenre(saved.genre);
        setDecade(saved.decade);
        setResolution(saved.resolution);
        setStudio(saved.studio);
        setUnwatched(saved.unwatched);
        setInProgress(saved.inProgress);
        setHydrated(true);
    }, [sectionKey]);

    useEffect(() => {
        if (!hydrated) return;
        writeLibraryBrowseState(sectionKey, {
            sort,
            genre,
            decade,
            resolution,
            studio,
            unwatched,
            inProgress,
        });
    }, [decade, genre, hydrated, inProgress, resolution, sectionKey, sort, studio, unwatched]);

    const patchWatched = (ratingKey: string, watched: boolean) => {
        const mapItems = (list: PlayerItem[]) => list.map((row) => (
            row.ratingKey === ratingKey ? { ...row, watched } : row
        ));
        setItems((prev) => mapItems(prev));
        setCollections((prev) => mapItems(prev));
        setHubs((prev) => prev.map((hub) => ({ ...hub, items: mapItems(hub.items) })));
    };

    const toggleWatched = async (item: PlayerItem) => {
        const next = !item.watched;
        patchWatched(item.ratingKey, next);
        try {
            await setMediaPlayerWatched(item.ratingKey, next);
        } catch {
            patchWatched(item.ratingKey, !!item.watched);
        }
    };

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
                    <CustomSelect
                        compact
                        value={sort}
                        onChange={setSort}
                        className="min-w-[11rem]"
                        options={SORT_IDS.map((id) => ({ value: id, label: sortLabels[id] || id }))}
                    />
                    <CustomSelect
                        compact
                        value={genre}
                        onChange={setGenre}
                        className="min-w-[10rem]"
                        options={[
                            { value: '', label: t('mediaPlayerPage.allGenres') },
                            ...genres.map((row) => ({ value: row.key, label: row.title })),
                        ]}
                    />
                    {decades.length ? (
                        <CustomSelect
                            compact
                            value={decade}
                            onChange={setDecade}
                            className="min-w-[10rem]"
                            options={[
                                { value: '', label: t('mediaPlayerPage.allDecades') },
                                ...decades.map((row) => ({ value: row.key, label: row.title })),
                            ]}
                        />
                    ) : null}
                    {resolutions.length ? (
                        <CustomSelect
                            compact
                            value={resolution}
                            onChange={setResolution}
                            className="min-w-[10rem]"
                            options={[
                                { value: '', label: t('mediaPlayerPage.allResolutions') },
                                ...resolutions.map((row) => ({ value: row.key, label: row.title })),
                            ]}
                        />
                    ) : null}
                    {studios.length ? (
                        <CustomSelect
                            compact
                            value={studio}
                            onChange={setStudio}
                            className="min-w-[10rem]"
                            options={[
                                { value: '', label: t('mediaPlayerPage.allStudios') },
                                ...studios.map((row) => ({ value: row.key, label: row.title })),
                            ]}
                        />
                    ) : null}
                    <button
                        type="button"
                        onClick={() => {
                            setUnwatched((prev) => !prev);
                            setInProgress(false);
                        }}
                        className={`rounded-lg border px-3 py-2 text-xs font-bold ${
                            unwatched ? 'border-plex/50 bg-plex/15 text-plex' : 'border-border bg-white/5 text-muted'
                        }`}
                    >
                        {t('mediaPlayerPage.unwatched')}
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setInProgress((prev) => !prev);
                            setUnwatched(false);
                        }}
                        className={`rounded-lg border px-3 py-2 text-xs font-bold ${
                            inProgress ? 'border-plex/50 bg-plex/15 text-plex' : 'border-border bg-white/5 text-muted'
                        }`}
                    >
                        {t('mediaPlayerPage.inProgress')}
                    </button>
                </div>
            ) : null}

            {loading ? (
                tab === 'home' ? (
                    <div className="flex flex-col gap-6">
                        <DiscoverHomeRowSkeleton />
                        <DiscoverHomeRowSkeleton />
                        <DiscoverHomeRowSkeleton />
                    </div>
                ) : (
                    <PosterGridSkeleton
                        className={upgraderPosterGridClass(gridSize)}
                        style={upgraderPosterGridStyle(gridSize)}
                    />
                )
            ) : error ? (
                <div className={discoveryTheme.emptyState}>
                    <p className={discoveryTheme.emptyTitle}>{error}</p>
                </div>
            ) : tab === 'home' ? (
                homeHubs.length ? (
                    <div className="flex flex-col gap-6">
                        {homeHubs.map((hub) => (
                            <PlayerRail
                                key={hub.identifier || hub.title}
                                title={hub.title}
                                items={hub.items}
                                density={gridSize}
                                onOpenItem={onOpenItem}
                                onPlay={onPlay}
                                onToggleWatched={toggleWatched}
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
                                onToggleWatched={toggleWatched}
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
