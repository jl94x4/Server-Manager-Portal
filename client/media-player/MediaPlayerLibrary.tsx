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
import { PlayerTvStatusPanel } from './PlayerTvStatusPanel';
import { continueWatchingRailAspect } from './playerSettings';
import { usePlayerSettings } from './usePlayerSettings';
import { mapContinueWatchingItemsForLayout, playerCardImageUrl, prefetchPlayerImages, withShowPoster } from './playerUtils';
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

const hubsComplete = (list: PlayerLibraryHub[]) => {
    const hasRecent = list.some(isRecentHub);
    const recentItems = list.find(isRecentHub)?.items || [];
    const hasReleased = list.some((hub) => isReleasedHub(hub) && itemHead(hub.items) !== itemHead(recentItems));
    return hasRecent && (hasReleased || list.filter((hub) => !isContinueWatchingHub(hub)).length >= 2);
};

const isTvShell = () => {
    try {
        return document.documentElement?.dataset?.tv === '1'
            || window.__PLEX_CLIENT__?.isTv === true;
    } catch {
        return false;
    }
};

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
    const [settings] = usePlayerSettings();
    const continueWatchingAspect = continueWatchingRailAspect(settings.continueWatchingLayout);
    const layoutContinueWatching = useCallback(
        (items: PlayerItem[]) => mapContinueWatchingItemsForLayout(items, settings.continueWatchingLayout),
        [settings.continueWatchingLayout],
    );
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
        }).map((hub) => (
            /recent/i.test(`${hub.identifier || ''} ${hub.title || ''}`)
                ? { ...hub, items: (hub.items || []).map(withShowPoster) }
                : hub
        ));
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
        // Extra list calls compete with the home request. Only use them when
        // the home payload is still missing Recently Added / Released.
        const paintLists = async () => {
            try {
                const [recent, released] = await Promise.all([
                    fetchMediaPlayerLibrary(sectionKey, 0, 18, { sort: 'addedAt:desc' }),
                    fetchMediaPlayerLibrary(sectionKey, 0, 18, { sort: 'originallyAvailableAt:desc' }),
                ]);
                if (!alive()) return false;
                if (recent.title) setTitle(recent.title);
                const recentItems = recent.items || [];
                const releasedItems = released.items || [];
                setHubs((prev) => withLibraryListRows(prev, recentItems, releasedItems));
                setError(null);
                setLoading(false);
                return recentItems.length > 0 || releasedItems.length > 0;
            } catch {
                return false;
            }
        };
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
            if (!hubsComplete(data.hubs || [])) await paintLists();
        } catch (err: any) {
            const painted = await paintLists();
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

    const librariesRequested = useRef(false);
    const filtersKey = useRef('');
    const landedKey = useRef('');

    useEffect(() => {
        if (librariesRequested.current) return undefined;
        const waiting = (tab === 'home' && loading && homeHubs.length === 0)
            || (tab === 'browse' && loading && items.length === 0)
            || (tab === 'collections' && loading && collections.length === 0);
        if (waiting) return undefined;
        librariesRequested.current = true;
        let started = false;
        let cancelled = false;
        const handle = window.setTimeout(() => {
            started = true;
            fetchMediaPlayerLibraries()
                .then((data) => {
                    if (!cancelled) setLibraries(data.libraries || []);
                })
                .catch(() => {
                    if (!cancelled) {
                        librariesRequested.current = false;
                        setLibraries([]);
                    }
                });
        }, 120);
        return () => {
            cancelled = true;
            window.clearTimeout(handle);
            if (!started) librariesRequested.current = false;
        };
    }, [collections.length, homeHubs.length, items.length, loading, tab]);

    useEffect(() => {
        if (tab !== 'browse') return undefined;
        if (loading && items.length === 0) return undefined;
        if (filtersKey.current === sectionKey) return undefined;
        filtersKey.current = sectionKey;
        let started = false;
        let cancelled = false;
        const handle = window.setTimeout(() => {
            started = true;
            fetchMediaPlayerLibraryFilters(sectionKey)
                .then((data) => {
                    if (cancelled) return;
                    setGenres(data.genres || []);
                    setDecades(data.decades || []);
                    setResolutions(data.resolutions || []);
                    setStudios(data.studios || []);
                })
                .catch(() => {
                    if (cancelled) return;
                    filtersKey.current = '';
                    setGenres([]);
                    setDecades([]);
                    setResolutions([]);
                    setStudios([]);
                });
        }, 80);
        return () => {
            cancelled = true;
            window.clearTimeout(handle);
            if (!started && filtersKey.current === sectionKey) filtersKey.current = '';
        };
    }, [items.length, loading, sectionKey, tab]);

    const posterReady = tab === 'home'
        ? homeHubs.some((hub) => hub.items?.length)
        : tab === 'collections'
            ? collections.length > 0
            : items.length > 0;

    useEffect(() => {
        if (!isTvShell() || !posterReady) return undefined;
        const token = `${sectionKey}:${tab}`;
        if (landedKey.current === token) return undefined;
        const handle = window.setTimeout(() => {
            landedKey.current = token;
            window.dispatchEvent(new Event('smp-tv-focus-posters'));
        }, 60);
        return () => window.clearTimeout(handle);
    }, [posterReady, sectionKey, tab]);

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

    const tvShell = isTvShell();

    return (
        <div className="flex flex-col gap-5 pb-8" data-tv-library="1">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <button
                        type="button"
                        tabIndex={tvShell ? -1 : undefined}
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
                        tabIndex={tvShell ? -1 : undefined}
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
                        triggerProps={tvShell ? { tabIndex: -1 } : undefined}
                        options={SORT_IDS.map((id) => ({ value: id, label: sortLabels[id] || id }))}
                    />
                    <CustomSelect
                        compact
                        value={genre}
                        onChange={setGenre}
                        className="min-w-[10rem]"
                        triggerProps={tvShell ? { tabIndex: -1 } : undefined}
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
                            triggerProps={tvShell ? { tabIndex: -1 } : undefined}
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
                            triggerProps={tvShell ? { tabIndex: -1 } : undefined}
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
                            triggerProps={tvShell ? { tabIndex: -1 } : undefined}
                            options={[
                                { value: '', label: t('mediaPlayerPage.allStudios') },
                                ...studios.map((row) => ({ value: row.key, label: row.title })),
                            ]}
                        />
                    ) : null}
                    <button
                        type="button"
                        tabIndex={tvShell ? -1 : undefined}
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
                        tabIndex={tvShell ? -1 : undefined}
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
                tvShell ? (
                    <PlayerTvStatusPanel
                        title={error}
                        onRetry={() => {
                            setError(null);
                            if (tab === 'home') void loadHome();
                            else if (tab === 'collections') void loadCollections();
                            else void loadBrowse(0, false);
                        }}
                        onBack={onBack}
                    />
                ) : (
                    <div className={discoveryTheme.emptyState}>
                        <p className={discoveryTheme.emptyTitle}>{error}</p>
                    </div>
                )
            ) : tab === 'home' ? (
                homeHubs.length ? (
                    <div className="tv-poster-rows flex flex-col gap-6">
                        {homeHubs.map((hub) => {
                            const isCw = isContinueWatchingHub(hub) || /continue|ondeck/i.test(hub.identifier);
                            return (
                            <PlayerRail
                                key={hub.identifier || hub.title}
                                title={hub.title}
                                items={isCw ? layoutContinueWatching(hub.items) : hub.items}
                                density={gridSize}
                                onOpenItem={onOpenItem}
                                onPlay={onPlay}
                                onToggleWatched={toggleWatched}
                                showProgress={isCw}
                                showRemoveFromContinueWatching={isCw}
                                aspect={isCw ? continueWatchingAspect : (/recent/i.test(`${hub.identifier || ''} ${hub.title || ''}`) ? '2/3' : undefined)}
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
                    <div
                        className={upgraderPosterGridClass(gridSize)}
                        style={upgraderPosterGridStyle(gridSize)}
                        data-tv-rail={tvShell ? '1' : undefined}
                        data-tv-poster-rail={tvShell ? '1' : undefined}
                    >
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
                    <div
                        className={upgraderPosterGridClass(gridSize)}
                        style={upgraderPosterGridStyle(gridSize)}
                        data-tv-rail={tvShell ? '1' : undefined}
                        data-tv-poster-rail={tvShell ? '1' : undefined}
                    >
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
                            tabIndex={tvShell ? -1 : undefined}
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
