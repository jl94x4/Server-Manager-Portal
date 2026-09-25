import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Film, Music, Search, Tv } from 'lucide-react';
import {
    DiscoverGridSizeSelect,
    DiscoverHomeRowSkeleton,
    DiscoverSectionHeader,
    discoveryTheme,
    useDiscoverGridSize,
    useDiscoverI18n,
    posterGridScaleRem,
    upgraderLandscapeGridStyle,
    upgraderPosterGridClass,
    upgraderPosterGridStyle,
} from './host';
import { fetchMediaPlayerHome, fetchMediaPlayerHomeHero, fetchMediaPlayerHomeHeroRefresh, searchMediaPlayer, setMediaPlayerWatched } from './api';
import { MediaPlayerHomeHero, type HomeHeroSlide } from './MediaPlayerHomeHero';
import { PlayerPosterCard } from './PlayerPosterCard';
import { PlayerRail } from './PlayerRail';
import {
    applyHomeRowOrder,
    applyLibraryNavOrder,
    applyLibraryNavOrderToHubs,
    continueWatchingRailAspect,
    PLAYER_SETTINGS_DRAFT_EVENT,
    PLAYER_SETTINGS_EVENT,
} from './playerSettings';
import { consumePlayerSearchFocus, isPlayerHomeCacheFresh, PLAYER_HOME_RESET_EVENT, PLAYER_SEARCH_INPUT_ID, PLAYER_SEARCH_OPEN_EVENT, readHeroSlidesCache, readPlayerHomeCache, usePlayerNetworkStatus, writeHeroSlidesCache, writePlayerHomeCache } from './playerMemory';
import { PlayerTvStatusPanel } from './PlayerTvStatusPanel';
import { mapContinueWatchingItemsForLayout, withShowPoster } from './playerUtils';
import { usePlayerSettings } from './usePlayerSettings';
import type { PlayerHome, PlayerItem, PlayerLibraryHub, PlayerPlayOptions, PlayerSection } from './types';

type Props = {
    active?: boolean;
    onOpenItem: (item: PlayerItem) => void;
    onPlay: (item: PlayerItem, opts?: PlayerPlayOptions) => void;
    onOpenLibrary?: (section: PlayerSection) => void;
    onPlayNext?: (item: PlayerItem) => void;
    onToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
    isAdmin?: boolean;
    playlistsEnabled?: boolean;
};

const libraryChipIcon = (type: string) => {
    if (type === 'show') return Tv;
    if (type === 'artist') return Music;
    return Film;
};

const isContinueWatchingHub = (hub: PlayerLibraryHub) => (
    /continue\s*watch|ondeck|on[.\s_-]?deck|in[.\s_-]?progress/i.test(`${hub.identifier || ''} ${hub.title || ''}`)
);

const isPlaylistHub = (hub: PlayerLibraryHub) => (
    Boolean(hub.playlistRatingKey) || /playlist/i.test(`${hub.identifier || ''} ${hub.title || ''}`)
);

const dedupeItems = (list: PlayerItem[]) => {
    const seen = new Set<string>();
    return list.filter((row) => {
        const key = row.dedupeKey || row.ratingKey || row.title;
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
    }).slice(0, 24);
};

export const MediaPlayerHome: React.FC<Props> = ({
    active = true,
    onOpenItem,
    onPlay,
    onOpenLibrary,
    onPlayNext,
    onToast,
    isAdmin = false,
    playlistsEnabled = true,
}) => {
    const { t } = useDiscoverI18n();
    const [settings] = usePlayerSettings();
    const [draftLibraryOrder, setDraftLibraryOrder] = useState<string[] | null>(null);
    const libraryNavOrder = draftLibraryOrder || settings.libraryNavOrder;
    const [gridSize, setGridSize] = useDiscoverGridSize();
    /** Home rails sit 15% larger than the shared poster density slider. */
    const homePosterDensity = posterGridScaleRem(posterGridScaleRem(gridSize) * 1.15);
    const [home, setHome] = useState<PlayerHome | null>(() => readPlayerHomeCache());
    const [heroSlides, setHeroSlides] = useState<HomeHeroSlide[]>(() => readHeroSlidesCache() || []);
    const [heroEffectiveMode, setHeroEffectiveMode] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [homeStale, setHomeStale] = useState(false);
    const [loading, setLoading] = useState(() => !readPlayerHomeCache());
    const networkOnline = usePlayerNetworkStatus();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<PlayerItem[]>([]);
    const [searching, setSearching] = useState(false);
    const [searchActive, setSearchActive] = useState(false);
    /** TV: focus can land on search without IME; Select/Enter arms editing and opens the keyboard. */
    const [searchArmed, setSearchArmed] = useState(false);
    const searchRef = useRef<HTMLInputElement>(null);
    const isTvShell = typeof document !== 'undefined' && (
        document.documentElement?.dataset?.tv === '1'
        || window.__PLEX_CLIENT__?.isTv === true
    );
    const searchReadOnly = isTvShell && !searchArmed;

    useEffect(() => {
        const openSearch = () => {
            setSearchActive(true);
            window.setTimeout(() => {
                searchRef.current?.focus({ preventScroll: false });
                if (!isTvShell) searchRef.current?.select();
            }, 0);
        };
        if (consumePlayerSearchFocus()) openSearch();
        window.addEventListener(PLAYER_SEARCH_OPEN_EVENT, openSearch);
        return () => window.removeEventListener(PLAYER_SEARCH_OPEN_EVENT, openSearch);
    }, [isTvShell]);

    useEffect(() => {
        if (!searchArmed || !isTvShell) return;
        const input = searchRef.current;
        if (!input) return;
        input.focus();
        input.select();
    }, [searchArmed, isTvShell]);

    useEffect(() => {
        const clearSearch = () => {
            setQuery('');
            setResults([]);
            setSearching(false);
            setSearchArmed(false);
            setSearchActive(false);
            searchRef.current?.blur();
        };
        window.addEventListener(PLAYER_HOME_RESET_EVENT, clearSearch);
        return () => window.removeEventListener(PLAYER_HOME_RESET_EVENT, clearSearch);
    }, []);

    useEffect(() => {
        const onDraft = (event: Event) => {
            const detail = (event as CustomEvent<{ libraryNavOrder?: string[] }>).detail;
            setDraftLibraryOrder(Array.isArray(detail?.libraryNavOrder) ? detail.libraryNavOrder : null);
        };
        const clearDraft = () => setDraftLibraryOrder(null);
        window.addEventListener(PLAYER_SETTINGS_DRAFT_EVENT, onDraft);
        window.addEventListener(PLAYER_SETTINGS_EVENT, clearDraft);
        return () => {
            window.removeEventListener(PLAYER_SETTINGS_DRAFT_EVENT, onDraft);
            window.removeEventListener(PLAYER_SETTINGS_EVENT, clearDraft);
        };
    }, []);

    useEffect(() => {
        setDraftLibraryOrder(null);
    }, [settings.libraryNavOrder]);

    const refreshHome = useCallback((opts?: { force?: boolean }) => {
        const cachedHome = readPlayerHomeCache();
        if (!cachedHome) setLoading(true);
        else {
            setHome(cachedHome);
            setLoading(false);
        }
        if (!opts?.force && cachedHome && isPlayerHomeCacheFresh()) {
            setLoading(false);
            return Promise.resolve();
        }
        return fetchMediaPlayerHome()
            .then((data) => {
                writePlayerHomeCache(data);
                setHome(data);
                setError(null);
                setHomeStale(false);
            })
            .catch((err) => {
                if (readPlayerHomeCache()) {
                    setHomeStale(true);
                } else {
                    setError(String(err?.message || t('mediaPlayerPage.loadError')));
                }
            })
            .finally(() => {
                setLoading(false);
            });
    }, [t]);

    useEffect(() => {
        if (!active) return undefined;
        let cancelled = false;
        void refreshHome().then(() => {
            if (cancelled) return;
        });
        const cachedHero = readHeroSlidesCache();
        fetchMediaPlayerHomeHero()
            .then((data) => {
                if (cancelled) return;
                const mode = data?.effectiveMode ? String(data.effectiveMode) : null;
                if (mode) setHeroEffectiveMode(mode);
                const items = data?.enabled && Array.isArray(data.items) ? data.items : [];
                if (items.length) {
                    writeHeroSlidesCache(items);
                    setHeroSlides(items);
                    return undefined;
                }
                // Don't reuse another mode's slides when disabled or Continue Watching (per-viewer).
                if (!data?.enabled || mode === 'continue_watching') {
                    writeHeroSlidesCache([]);
                    setHeroSlides([]);
                    return undefined;
                }
                // Keep prior slides on empty short-cache; only force-refresh when we have nothing.
                if (cachedHero?.length) return undefined;
                if (data?.enabled && data?.reason !== 'disabled') {
                    return fetchMediaPlayerHomeHeroRefresh().then((retry) => {
                        if (cancelled) return;
                        if (retry?.effectiveMode) setHeroEffectiveMode(String(retry.effectiveMode));
                        if (retry?.enabled && Array.isArray(retry.items) && retry.items.length) {
                            writeHeroSlidesCache(retry.items);
                            setHeroSlides(retry.items);
                        }
                    }).catch(() => undefined);
                }
                return undefined;
            })
            .catch(() => {
                if (!cancelled && !cachedHero?.length) setHeroSlides([]);
            });
        return () => { cancelled = true; };
    }, [active, refreshHome]);

    useEffect(() => {
        const trimmed = query.trim();
        if (trimmed.length < 2) {
            setResults([]);
            setSearching(false);
            return undefined;
        }
        let cancelled = false;
        setSearching(true);
        const timer = window.setTimeout(() => {
            searchMediaPlayer(trimmed)
                .then((data) => {
                    if (!cancelled) setResults(data.results || []);
                })
                .catch(() => {
                    if (!cancelled) setResults([]);
                })
                .finally(() => {
                    if (!cancelled) setSearching(false);
                });
        }, 280);
        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [query]);

    const orderedLibraries = useMemo(
        () => applyLibraryNavOrder(home?.libraries || [], libraryNavOrder),
        [home?.libraries, libraryNavOrder],
    );

    const recentRails = useMemo(() => {
        const rows = home?.recentByLibrary || [];
        const byKey = new Map(rows.map((row) => [String(row.library.key), row]));
        if (!settings.mixLibraries) {
            return orderedLibraries.map((library) => {
                const row = byKey.get(String(library.key));
                return {
                    id: `recent:${library.key}`,
                    title: t('mediaPlayerPage.recentlyAddedIn', { name: library.title }),
                    items: (row?.items || []).map(withShowPoster),
                };
            }).filter((row) => row.items.length);
        }
        const typeOrder: Array<'movie' | 'show' | 'artist'> = [];
        const seenTypes = new Set<string>();
        for (const library of orderedLibraries) {
            const type = library.type === 'show' ? 'show' : library.type === 'artist' ? 'artist' : 'movie';
            if (seenTypes.has(type)) continue;
            seenTypes.add(type);
            typeOrder.push(type);
        }
        for (const type of ['movie', 'show', 'artist'] as const) {
            if (!seenTypes.has(type)) typeOrder.push(type);
        }
        const buckets: Record<'movie' | 'show' | 'artist', PlayerItem[]> = { movie: [], show: [], artist: [] };
        for (const row of rows) {
            if (row.library.type === 'show') buckets.show.push(...row.items);
            else if (row.library.type === 'artist') buckets.artist.push(...row.items);
            else buckets.movie.push(...row.items);
        }
        const titles = {
            movie: t('mediaPlayerPage.recentlyAddedMovies'),
            show: t('mediaPlayerPage.recentlyAddedShows'),
            artist: t('mediaPlayerPage.recentlyAddedMusic'),
        };
        return typeOrder.map((type) => ({
            id: `recent:${type}`,
            title: titles[type],
            items: dedupeItems(buckets[type]).map(withShowPoster),
        })).filter((row) => row.items.length);
    }, [home, orderedLibraries, settings.mixLibraries, t]);

    const hideContinueWatchingRail = heroEffectiveMode === 'continue_watching';
    const showContinueWatchingRail = settings.showContinueWatching && !hideContinueWatchingRail;
    const continueWatchingAspect = continueWatchingRailAspect(settings.continueWatchingLayout);
    const layoutContinueWatching = useCallback(
        (items: PlayerItem[]) => mapContinueWatchingItemsForLayout(items, settings.continueWatchingLayout),
        [settings.continueWatchingLayout],
    );

    const plexHubs = useMemo(() => {
        const filtered = (home?.hubs || []).filter((hub) => {
            if (!hub.items?.length) return false;
            if (!showContinueWatchingRail && isContinueWatchingHub(hub)) return false;
            if (!settings.showPlaylists && isPlaylistHub(hub)) return false;
            return true;
        }).map((hub) => (
            /recent/i.test(`${hub.identifier || ''} ${hub.title || ''}`)
                ? { ...hub, items: hub.items.map(withShowPoster) }
                : hub
        ));
        return applyLibraryNavOrderToHubs(filtered, orderedLibraries, libraryNavOrder);
    }, [home, libraryNavOrder, orderedLibraries, showContinueWatchingRail, settings.showPlaylists]);

    const searchGroups = useMemo(() => {
        const shows: PlayerItem[] = [];
        const movies: PlayerItem[] = [];
        const episodes: PlayerItem[] = [];
        const more: PlayerItem[] = [];
        for (const row of results) {
            if (row.type === 'show') shows.push(row);
            else if (row.type === 'movie') movies.push(row);
            else if (row.type === 'episode') episodes.push(row);
            else more.push(row);
        }
        return [
            { id: 'show', title: t('mediaPlayerPage.searchShows'), items: shows, aspect: '2/3' as const },
            { id: 'movie', title: t('mediaPlayerPage.searchMovies'), items: movies, aspect: '2/3' as const },
            { id: 'episode', title: t('mediaPlayerPage.searchEpisodes'), items: episodes, aspect: '16/9' as const },
            { id: 'more', title: t('mediaPlayerPage.searchMore'), items: more, aspect: '2/3' as const },
        ].filter((group) => group.items.length);
    }, [results, t]);

    const hasRails = useMemo(() => (
        !!home && (
            plexHubs.length
            || (showContinueWatchingRail && home.continueWatching.length)
            || recentRails.some((row) => row.items.length)
            || (settings.showPlaylists && (home.playlists || []).length)
        )
    ), [home, plexHubs, recentRails, showContinueWatchingRail, settings.showPlaylists]);

    const patchWatched = (ratingKey: string, watched: boolean) => {
        setHome((prev) => {
            if (!prev) return prev;
            const mapItems = (list: PlayerItem[]) => list.map((row) => (
                row.ratingKey === ratingKey ? { ...row, watched } : row
            ));
            return {
                ...prev,
                continueWatching: mapItems(prev.continueWatching),
                playlists: mapItems(prev.playlists || []),
                recentByLibrary: prev.recentByLibrary.map((row) => ({ ...row, items: mapItems(row.items) })),
                hubs: (prev.hubs || []).map((hub) => ({ ...hub, items: mapItems(hub.items) })),
            };
        });
        setResults((prev) => prev.map((row) => (row.ratingKey === ratingKey ? { ...row, watched } : row)));
    };

    const removeFromContinueWatching = (item: PlayerItem) => {
        const key = item.ratingKey;
        setHome((prev) => {
            if (!prev) return prev;
            const filterItems = (list: PlayerItem[]) => list.filter((row) => row.ratingKey !== key);
            return {
                ...prev,
                continueWatching: filterItems(prev.continueWatching),
                hubs: (prev.hubs || []).map((hub) => (
                    isContinueWatchingHub(hub) ? { ...hub, items: filterItems(hub.items) } : hub
                )),
            };
        });
    };

    const removeItemEverywhere = (item: PlayerItem) => {
        const key = item.ratingKey;
        setHome((prev) => {
            if (!prev) return prev;
            const filterItems = (list: PlayerItem[]) => list.filter((row) => row.ratingKey !== key);
            return {
                ...prev,
                continueWatching: filterItems(prev.continueWatching),
                playlists: filterItems(prev.playlists || []),
                recentByLibrary: prev.recentByLibrary.map((row) => ({ ...row, items: filterItems(row.items) })),
                hubs: (prev.hubs || []).map((hub) => ({ ...hub, items: filterItems(hub.items) })),
            };
        });
        setResults((prev) => prev.filter((row) => row.ratingKey !== key));
        setHeroSlides((prev) => prev.filter((row) => row.ratingKey !== key));
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

    const railMenuProps = {
        onPlayNext,
        onWatchedChange: (item: PlayerItem, watched: boolean) => patchWatched(item.ratingKey, watched),
        onRemovedFromContinueWatching: removeFromContinueWatching,
        onDeleted: removeItemEverywhere,
        onToast,
        isAdmin,
        playlistsEnabled,
    };

    const hasPlexContentHubs = plexHubs.some((hub) => !isContinueWatchingHub(hub));
    const homeSections = !home ? [] : hasPlexContentHubs ? plexHubs.map((hub, hubIndex) => {
        const viewAllKey = hub.collectionRatingKey || hub.playlistRatingKey;
        const isCw = isContinueWatchingHub(hub);
        return (
            <PlayerRail
                key={hub.identifier}
                title={hub.title}
                items={isCw ? layoutContinueWatching(hub.items) : hub.items}
                density={homePosterDensity}
                staggerIndex={hubIndex}
                onOpenItem={onOpenItem}
                onPlay={onPlay}
                onToggleWatched={toggleWatched}
                showProgress={isCw}
                showRemoveFromContinueWatching={isCw}
                aspect={isCw ? continueWatchingAspect : (/recent/i.test(`${hub.identifier || ''} ${hub.title || ''}`) ? '2/3' : undefined)}
                onViewAll={viewAllKey ? () => onOpenItem({
                    ratingKey: viewAllKey,
                    title: hub.title,
                    type: hub.collectionRatingKey ? 'collection' : 'playlist',
                }) : undefined}
                viewAllLabel={viewAllKey ? t('common.viewAll') : undefined}
                {...railMenuProps}
            />
        );
    }) : applyHomeRowOrder(
        ['continueWatching', 'recents', 'playlists'],
        settings.homeRowOrder,
    ).map((id, rowIndex) => {
        if (id === 'continueWatching') {
            return showContinueWatchingRail ? (
                <PlayerRail
                    key="continueWatching"
                    title={t('mediaPlayerPage.continueWatching')}
                    items={layoutContinueWatching(home.continueWatching)}
                    density={homePosterDensity}
                    staggerIndex={rowIndex}
                    onOpenItem={onOpenItem}
                    onPlay={onPlay}
                    onToggleWatched={toggleWatched}
                    showProgress
                    showRemoveFromContinueWatching
                    aspect={continueWatchingAspect}
                    {...railMenuProps}
                />
            ) : null;
        }
        if (id === 'playlists') {
            return settings.showPlaylists ? (
                <PlayerRail
                    key="playlists"
                    title={t('mediaPlayerPage.playlists')}
                    items={home.playlists || []}
                    density={homePosterDensity}
                    staggerIndex={rowIndex}
                    onOpenItem={onOpenItem}
                    onPlay={onPlay}
                />
            ) : null;
        }
        if (id !== 'recents') return null;
        return (
            <React.Fragment key="recents">
                {recentRails.map((row, recentIndex) => (
                    <PlayerRail
                        key={row.id}
                        title={row.title}
                        items={row.items}
                        density={homePosterDensity}
                        staggerIndex={rowIndex + recentIndex}
                        onOpenItem={onOpenItem}
                        onPlay={onPlay}
                        onToggleWatched={toggleWatched}
                        aspect="2/3"
                        {...railMenuProps}
                    />
                ))}
            </React.Fragment>
        );
    });

    if (loading && !home) {
        if (isTvShell && error) {
            return (
                <PlayerTvStatusPanel
                    title={error}
                    onRetry={() => { setError(null); void refreshHome({ force: true }); }}
                />
            );
        }
        return (
            <div className="flex flex-col gap-6 pb-8" aria-busy="true" aria-label={t('mediaPlayerPage.navHome')}>
                <div className="h-[300px] animate-pulse rounded-2xl bg-white/5 sm:h-[380px]" />
                <DiscoverHomeRowSkeleton />
                <DiscoverHomeRowSkeleton showViewAll />
                <DiscoverHomeRowSkeleton />
                <DiscoverHomeRowSkeleton showViewAll />
            </div>
        );
    }

    if (isTvShell && error && !home) {
        return (
            <PlayerTvStatusPanel
                title={error}
                onRetry={() => { setError(null); void refreshHome({ force: true }); }}
            />
        );
    }

    return (
        <div className="tv-poster-rows flex flex-col gap-6 pb-8">
            {!searchActive && heroSlides.length ? (
                <MediaPlayerHomeHero
                    items={heroSlides}
                    effectiveMode={heroEffectiveMode}
                    onOpenItem={onOpenItem}
                    onPlay={onPlay}
                />
            ) : null}
            <h1 className="sr-only">{t('mediaPlayerPage.navHome')}</h1>
            {!isTvShell && searchActive && (!orderedLibraries.length || !onOpenLibrary) ? (
                <div className="flex justify-end">
                    <DiscoverGridSizeSelect value={gridSize} onChange={setGridSize} />
                </div>
            ) : null}

            {!searchActive && orderedLibraries.length && onOpenLibrary && !isTvShell ? (
                <section className="flex flex-col gap-2" aria-label={t('mediaPlayerPage.jumpToLibrary')}>
                    <div className="flex items-center justify-between gap-3">
                        <p className="min-w-0 text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
                            {t('mediaPlayerPage.jumpToLibrary')}
                        </p>
                        <DiscoverGridSizeSelect className="shrink-0" value={gridSize} onChange={setGridSize} />
                    </div>
                    <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                        {orderedLibraries.map((library) => {
                            const Icon = libraryChipIcon(library.type);
                            return (
                                <button
                                    key={library.key}
                                    type="button"
                                    data-tv-item="1"
                                    onClick={() => onOpenLibrary(library)}
                                    className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border bg-white/[0.04] px-3.5 py-2 text-sm font-bold text-text transition hover:border-plex/40 hover:bg-plex/10 hover:text-plex"
                                >
                                    <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" />
                                    <span className="max-w-[10rem] truncate sm:max-w-[14rem]">{library.title}</span>
                                </button>
                            );
                        })}
                    </div>
                </section>
            ) : null}

            {searchActive ? (
            <div className="relative" data-tv-rail={isTvShell ? '1' : undefined}>
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                    id={PLAYER_SEARCH_INPUT_ID}
                    ref={searchRef}
                    value={query}
                    readOnly={searchReadOnly}
                    inputMode={searchReadOnly ? 'none' : 'search'}
                    enterKeyHint="search"
                    data-tv-item={isTvShell ? '1' : undefined}
                    aria-label={t('mediaPlayerPage.searchPlaceholder')}
                    onChange={(event) => setQuery(event.target.value)}
                    onBlur={() => {
                        if (isTvShell) setSearchArmed(false);
                    }}
                    onKeyDown={(event) => {
                        if (!isTvShell) return;
                        if (searchArmed) return;
                        if (event.key !== 'Enter' && event.key !== ' ') return;
                        event.preventDefault();
                        event.stopPropagation();
                        setSearchArmed(true);
                    }}
                    onClick={() => {
                        // Touch / mouse: open IME. TV D-pad focus alone must not.
                        if (isTvShell && !searchArmed) setSearchArmed(true);
                    }}
                    placeholder={t('mediaPlayerPage.searchPlaceholder')}
                    className={discoveryTheme.searchInput}
                />
            </div>
            ) : null}

            {query.trim().length >= 2 ? (
                <div className="flex flex-col gap-6">
                    {searching && !results.length ? (
                        <DiscoverSectionHeader title={t('common.searching')} />
                    ) : null}
                    {searchGroups.map((group) => (
                        <section key={group.id} className="flex flex-col gap-3">
                            <DiscoverSectionHeader title={group.title} />
                            <div
                                data-tv-rail={isTvShell ? '1' : undefined}
                                className={upgraderPosterGridClass(gridSize)}
                                style={group.aspect === '16/9' ? upgraderLandscapeGridStyle(gridSize) : upgraderPosterGridStyle(gridSize)}
                            >
                                {group.items.map((item) => (
                                    <PlayerPosterCard
                                        key={item.ratingKey}
                                        item={item}
                                        aspect={group.aspect}
                                        onOpenItem={onOpenItem}
                                        onPlay={onPlay}
                                        onToggleWatched={toggleWatched}
                                        onPlayNext={onPlayNext}
                                        onWatchedChange={(row, watched) => patchWatched(row.ratingKey, watched)}
                                        onRemovedFromContinueWatching={removeFromContinueWatching}
                                        onDeleted={removeItemEverywhere}
                                        onToast={onToast}
                                        isAdmin={isAdmin}
                                        playlistsEnabled={playlistsEnabled}
                                    />
                                ))}
                            </div>
                        </section>
                    ))}
                    {!searching && !results.length ? (
                        <div className={discoveryTheme.emptyState}>
                            <p className={discoveryTheme.emptyTitle}>{t('mediaPlayerPage.emptySearch')}</p>
                        </div>
                    ) : null}
                </div>
            ) : null}

            {!isTvShell && error ? (
                <div className={discoveryTheme.emptyState}>
                    <p className={discoveryTheme.emptyTitle}>{error}</p>
                </div>
            ) : null}

            {isTvShell && (homeStale || !networkOnline) && home && !query.trim() ? (
                <div
                    data-tv-row="1"
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-3"
                    aria-live="polite"
                >
                    <p className="text-sm text-amber-100/90">{t('mediaPlayerPage.showingSavedHome')}</p>
                    <button
                        type="button"
                        data-tv-item="1"
                        data-tv-action="1"
                        onClick={() => void refreshHome({ force: true })}
                        className="shrink-0 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold text-white outline-none ring-plex/40 focus-visible:ring-2"
                    >
                        {t('common.retry')}
                    </button>
                </div>
            ) : null}

            {!query.trim() && home ? (
                <>
                    {homeSections}
                </>
            ) : null}

            {!query.trim() && !error && !hasRails ? (
                isTvShell ? (
                    <PlayerTvStatusPanel
                        title={t('mediaPlayerPage.emptyHome')}
                        onRetry={() => void refreshHome({ force: true })}
                    />
                ) : (
                    <div className={discoveryTheme.emptyState}>
                        <p className={discoveryTheme.emptyTitle}>{t('mediaPlayerPage.emptyHome')}</p>
                    </div>
                )
            ) : null}
        </div>
    );
};
