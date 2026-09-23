import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { readLibraryBrowseState, readLibraryHomeCache, writeLibraryBrowseState, writeLibraryHomeCache } from './playerMemory';
import { MediaPlayerLibrariesPanel } from './MediaPlayerLibrariesPanel';
import { PlayerPosterCard } from './PlayerPosterCard';
import { PlayerRail } from './PlayerRail';
import { playerCardImageUrl, prefetchPlayerImages } from './playerUtils';
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
    onPlayNext?: (item: PlayerItem) => void;
    onToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
    isAdmin?: boolean;
    playlistsEnabled?: boolean;
};

const PAGE_SIZE = 50;

const isContinueWatchingHub = (hub: PlayerLibraryHub) => (
    /continue\s*watch|ondeck|on[.\s_-]?deck|in[.\s_-]?progress/i.test(`${hub.identifier || ''} ${hub.title || ''}`)
);

const hubBlob = (hub: PlayerLibraryHub) => `${hub.identifier || ''} ${hub.title || ''}`;
const isRecentHub = (hub: PlayerLibraryHub) => /recently\s*added|recentlyadded/i.test(hubBlob(hub));
const isReleasedHub = (hub: PlayerLibraryHub) => /recently\s*released|recentlyreleased/i.test(hubBlob(hub));

const itemHead = (items: PlayerItem[] = []) => items.slice(0, 8).map((row) => row.ratingKey).join('|');

/** Paint library rows from the section list while the slower hub request is still in flight. */
const withLibraryListRows = (prev: PlayerLibraryHub[], recentItems: PlayerItem[], releasedItems: PlayerItem[]) => {
    const next = prev.slice();
    let insertAt = next.filter(isContinueWatchingHub).length;
    const push = (identifier: string, title: string, items: PlayerItem[]) => {
        if (!items.length) return;
        if (identifier === 'recentlyAdded' && next.some(isRecentHub)) return;
        if (identifier === 'recentlyReleased' && (next.some(isReleasedHub) || itemHead(items) === itemHead(recentItems))) return;
        if (next.some((hub) => hub.identifier === identifier)) return;
        next.splice(insertAt, 0, { identifier, title, items });
        insertAt += 1;
    };
    push('recentlyAdded', 'Recently Added', recentItems);
    push('recentlyReleased', 'Recently Released', releasedItems);
    return next;
};

const mergeServerLibraryHubs = (serverHubs: PlayerLibraryHub[], prev: PlayerLibraryHub[]) => {
    const server = serverHubs || [];
    const extras: PlayerLibraryHub[] = [];
    if (!server.some(isRecentHub)) {
        const row = prev.find((hub) => hub.identifier === 'recentlyAdded');
        if (row?.items?.length) extras.push(row);
    }
    const recentItems = extras[0]?.items || server.find(isRecentHub)?.items || [];
    if (!server.some(isReleasedHub)) {
        const row = prev.find((hub) => hub.identifier === 'recentlyReleased');
        if (row?.items?.length && itemHead(row.items) !== itemHead(recentItems)) extras.push(row);
    }
    if (!extras.length) return server;
    const seen = new Set(server.map((hub) => hub.identifier));
    return [...server, ...extras.filter((hub) => !seen.has(hub.identifier))];
};

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
    onPlayNext,
    onToast,
    isAdmin = false,
    playlistsEnabled = true,
}) => {
    const { t } = useDiscoverI18n();
    const homeLoadRef = useRef(0);
    const [gridSize, setGridSize] = useDiscoverGridSize();
    const [title, setTitle] = useState(t('mediaPlayerPage.libraries'));
    const [hubs, setHubs] = useState<PlayerLibraryHub[]>(() => readLibraryHomeCache(sectionKey)?.hubs || []);
    const [items, setItems] = useState<PlayerItem[]>([]);
    const [collections, setCollections] = useState<PlayerItem[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(() => tab === 'home' ? !readLibraryHomeCache(sectionKey)?.hubs?.length : true);
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
        const seq = homeLoadRef.current + 1;
        homeLoadRef.current = seq;
        const alive = () => homeLoadRef.current === seq;
        const cached = readLibraryHomeCache(sectionKey);
        if (cached?.hubs?.length) {
            setTitle(cached.title || t('mediaPlayerPage.libraries'));
            setHubs(cached.hubs);
            setLoading(false);
        } else {
            setLoading(true);
        }
        // Section lists return before promoted hubs. Paint them so a movie
        // library is not stuck on a single Continue Watching row.
        const listsPainted = Promise.all([
            fetchMediaPlayerLibrary(sectionKey, 0, 18, { sort: 'addedAt:desc' }),
            fetchMediaPlayerLibrary(sectionKey, 0, 18, { sort: 'originallyAvailableAt:desc' }),
        ]).then(([recent, released]) => {
            if (!alive()) return false;
            if (recent.title) setTitle(recent.title);
            const recentItems = recent.items || [];
            const releasedItems = released.items || [];
            setHubs((prev) => {
                const next = withLibraryListRows(prev, recentItems, releasedItems);
                return next;
            });
            setError(null);
            setLoading(false);
            return recentItems.length > 0 || releasedItems.length > 0;
        }).catch(() => false);
        try {
            const data = await fetchMediaPlayerLibraryHome(sectionKey);
            if (!alive()) return;
            setTitle(data.title || t('mediaPlayerPage.libraries'));
            setHubs((prev) => {
                const next = mergeServerLibraryHubs(data.hubs || [], prev);
                writeLibraryHomeCache(sectionKey, { ...data, hubs: next });
                return next;
            });
            setError(null);
        } catch (err: any) {
            const painted = await listsPainted;
            if (!alive()) return;
            if (!painted && !cached?.hubs?.length) {
                setError(String(err?.message || t('mediaPlayerPage.loadError')));
            }
        } finally {
            if (alive()) setLoading(false);
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
        const list = tab === 'collections' ? collections : tab === 'browse' ? items : [];
        if (!list.length) return;
        prefetchPlayerImages(list.slice(0, 18).map((item) => playerCardImageUrl(item.thumb, item.type === 'episode' ? '16/9' : '2/3')), 12);
    }, [collections, items, tab]);

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
        if (tab !== 'browse') return undefined;
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
    }, [sectionKey, tab]);

    useEffect(() => {
        const saved = readLibraryBrowseState(sectionKey);
        const cachedHome = readLibraryHomeCache(sectionKey);
        setHydrated(false);
        setSort(saved.sort);
        setGenre(saved.genre);
        setDecade(saved.decade);
        setResolution(saved.resolution);
        setStudio(saved.studio);
        setUnwatched(saved.unwatched);
        setInProgress(saved.inProgress);
        if (cachedHome?.hubs?.length) {
            setTitle(cachedHome.title || t('mediaPlayerPage.libraries'));
            setHubs(cachedHome.hubs);
        } else {
            setHubs([]);
        }
        setHydrated(true);
    }, [sectionKey, t]);

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

    const removeFromContinueWatching = (item: PlayerItem) => {
        const key = item.ratingKey;
        const filterItems = (list: PlayerItem[]) => list.filter((row) => row.ratingKey !== key);
        setHubs((prev) => prev.map((hub) => (
            isContinueWatchingHub(hub) ? { ...hub, items: filterItems(hub.items) } : hub
        )));
        setItems((prev) => filterItems(prev));
    };

    const removeItemEverywhere = (item: PlayerItem) => {
        const key = item.ratingKey;
        const filterItems = (list: PlayerItem[]) => list.filter((row) => row.ratingKey !== key);
        setItems((prev) => filterItems(prev));
        setCollections((prev) => filterItems(prev));
        setHubs((prev) => prev.map((hub) => ({ ...hub, items: filterItems(hub.items) })));
        setTotal((prev) => Math.max(0, prev - 1));
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

    const menuProps = {
        onPlayNext,
        onWatchedChange: (item: PlayerItem, watched: boolean) => patchWatched(item.ratingKey, watched),
        onRemovedFromContinueWatching: removeFromContinueWatching,
        onDeleted: removeItemEverywhere,
        onToast,
        isAdmin,
        playlistsEnabled,
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
                        {homeHubs.map((hub) => {
                            const isCw = isContinueWatchingHub(hub) || /continue|ondeck/i.test(hub.identifier);
                            return (
                            <PlayerRail
                                key={hub.identifier || hub.title}
                                title={hub.title}
                                items={hub.items}
                                density={gridSize}
                                onOpenItem={onOpenItem}
                                onPlay={onPlay}
                                onToggleWatched={toggleWatched}
                                showProgress={isCw}
                                showRemoveFromContinueWatching={isCw}
                                aspect={isCw ? '2/3' : undefined}
                                {...menuProps}
                            />
                            );
                        })}
                    </div>
                ) : (
                    <div className={discoveryTheme.emptyState}>
                        <p className={discoveryTheme.emptyTitle}>{t('mediaPlayerPage.emptyLibrary')}</p>
                    </div>
                )
            ) : tab === 'collections' ? (
                collections.length ? (
                    <div className={upgraderPosterGridClass(gridSize)} style={upgraderPosterGridStyle(gridSize)}>
                        {collections.map((item, index) => (
                            <PlayerPosterCard
                                key={item.ratingKey}
                                item={item}
                                imagePriority={index < 12}
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
                        {items.map((item, index) => (
                            <PlayerPosterCard
                                key={item.ratingKey}
                                item={item}
                                imagePriority={index < 12}
                                onOpenItem={onOpenItem}
                                onPlay={onPlay}
                                onToggleWatched={toggleWatched}
                                {...menuProps}
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
