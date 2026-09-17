import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import {
    DiscoverGridSizeSelect,
    DiscoverHomeRowSkeleton,
    DiscoverSectionHeader,
    discoveryTheme,
    MediaPlayerAlphaBanner,
    useDiscoverGridSize,
    useDiscoverI18n,
    upgraderLandscapeGridStyle,
    upgraderPosterGridClass,
    upgraderPosterGridStyle,
} from './host';
import { fetchMediaPlayerHome, searchMediaPlayer, setMediaPlayerWatched } from './api';
import { PlayerPosterCard } from './PlayerPosterCard';
import { PlayerRail } from './PlayerRail';
import {
    applyHomeRowOrder,
    applyLibraryNavOrder,
    applyLibraryNavOrderToHubs,
    PLAYER_SETTINGS_DRAFT_EVENT,
    PLAYER_SETTINGS_EVENT,
} from './playerSettings';
import { consumePlayerSearchFocus, PLAYER_SEARCH_INPUT_ID, readPlayerHomeCache, writePlayerHomeCache } from './playerMemory';
import { usePlayerSettings } from './usePlayerSettings';
import type { PlayerHome, PlayerItem, PlayerLibraryHub, PlayerPlayOptions } from './types';

type Props = {
    active?: boolean;
    onOpenItem: (item: PlayerItem) => void;
    onPlay: (item: PlayerItem, opts?: PlayerPlayOptions) => void;
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
        const key = row.ratingKey || row.title;
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
    }).slice(0, 24);
};

export const MediaPlayerHome: React.FC<Props> = ({ active = true, onOpenItem, onPlay }) => {
    const { t } = useDiscoverI18n();
    const [settings] = usePlayerSettings();
    const [draftLibraryOrder, setDraftLibraryOrder] = useState<string[] | null>(null);
    const libraryNavOrder = draftLibraryOrder || settings.libraryNavOrder;
    const [gridSize, setGridSize] = useDiscoverGridSize();
    const [home, setHome] = useState<PlayerHome | null>(() => readPlayerHomeCache());
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(() => !readPlayerHomeCache());
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<PlayerItem[]>([]);
    const [searching, setSearching] = useState(false);
    const searchRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!consumePlayerSearchFocus()) return;
        searchRef.current?.focus();
        searchRef.current?.select();
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

    useEffect(() => {
        if (!active) return undefined;
        let cancelled = false;
        if (!readPlayerHomeCache()) setLoading(true);
        fetchMediaPlayerHome()
            .then((data) => {
                if (cancelled) return;
                writePlayerHomeCache(data);
                setHome(data);
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
    }, [active, t]);

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
                    items: row?.items || [],
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
            items: dedupeItems(buckets[type]),
        })).filter((row) => row.items.length);
    }, [home, orderedLibraries, settings.mixLibraries, t]);

    const plexHubs = useMemo(() => {
        const filtered = (home?.hubs || []).filter((hub) => {
            if (!hub.items?.length) return false;
            if (!settings.showContinueWatching && isContinueWatchingHub(hub)) return false;
            if (!settings.showPlaylists && isPlaylistHub(hub)) return false;
            return true;
        });
        return applyLibraryNavOrderToHubs(filtered, orderedLibraries, libraryNavOrder);
    }, [home, libraryNavOrder, orderedLibraries, settings.showContinueWatching, settings.showPlaylists]);

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
            || (settings.showContinueWatching && home.continueWatching.length)
            || recentRails.some((row) => row.items.length)
            || (settings.showPlaylists && (home.playlists || []).length)
        )
    ), [home, plexHubs, recentRails, settings.showContinueWatching, settings.showPlaylists]);

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

    const toggleWatched = async (item: PlayerItem) => {
        const next = !item.watched;
        patchWatched(item.ratingKey, next);
        try {
            await setMediaPlayerWatched(item.ratingKey, next);
        } catch {
            patchWatched(item.ratingKey, !!item.watched);
        }
    };

    const homeSections = !home ? [] : plexHubs.length ? plexHubs.map((hub) => {
        const viewAllKey = hub.collectionRatingKey || hub.playlistRatingKey;
        return (
            <PlayerRail
                key={hub.identifier}
                title={hub.title}
                items={hub.items}
                density={gridSize}
                onOpenItem={onOpenItem}
                onPlay={onPlay}
                onToggleWatched={toggleWatched}
                showProgress={isContinueWatchingHub(hub)}
                onViewAll={viewAllKey ? () => onOpenItem({
                    ratingKey: viewAllKey,
                    title: hub.title,
                    type: hub.collectionRatingKey ? 'collection' : 'playlist',
                }) : undefined}
                viewAllLabel={viewAllKey ? t('common.viewAll') : undefined}
            />
        );
    }) : applyHomeRowOrder(
        ['continueWatching', 'recents', 'playlists'],
        settings.homeRowOrder,
    ).map((id) => {
        if (id === 'continueWatching') {
            return settings.showContinueWatching ? (
                <PlayerRail
                    key="continueWatching"
                    title={t('mediaPlayerPage.continueWatching')}
                    items={home.continueWatching}
                    density={gridSize}
                    onOpenItem={onOpenItem}
                    onPlay={onPlay}
                    onToggleWatched={toggleWatched}
                    showProgress
                />
            ) : null;
        }
        if (id === 'playlists') {
            return settings.showPlaylists ? (
                <PlayerRail
                    key="playlists"
                    title={t('mediaPlayerPage.playlists')}
                    items={home.playlists || []}
                    density={gridSize}
                    onOpenItem={onOpenItem}
                    onPlay={onPlay}
                />
            ) : null;
        }
        if (id !== 'recents') return null;
        return (
            <React.Fragment key="recents">
                {recentRails.map((row) => (
                    <PlayerRail
                        key={row.id}
                        title={row.title}
                        items={row.items}
                        density={gridSize}
                        onOpenItem={onOpenItem}
                        onPlay={onPlay}
                        onToggleWatched={toggleWatched}
                    />
                ))}
            </React.Fragment>
        );
    });

    if (loading && !home) {
        return (
            <div className="flex flex-col gap-6 pb-8" aria-busy="true" aria-label={t('mediaPlayerPage.navHome')}>
                <DiscoverHomeRowSkeleton />
                <DiscoverHomeRowSkeleton showViewAll />
                <DiscoverHomeRowSkeleton />
                <DiscoverHomeRowSkeleton showViewAll />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 pb-8">
            <MediaPlayerAlphaBanner />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className={discoveryTheme.personalEyebrow}>{t('navigation.mediaPlayer')}</p>
                    <h1 className={discoveryTheme.heading}>{t('mediaPlayerPage.navHome')}</h1>
                </div>
                <DiscoverGridSizeSelect value={gridSize} onChange={setGridSize} />
            </div>

            <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                    id={PLAYER_SEARCH_INPUT_ID}
                    ref={searchRef}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={t('mediaPlayerPage.searchPlaceholder')}
                    className={discoveryTheme.searchInput}
                />
            </div>

            {query.trim().length >= 2 ? (
                <div className="flex flex-col gap-6">
                    {searching && !results.length ? (
                        <DiscoverSectionHeader title={t('common.searching')} />
                    ) : null}
                    {searchGroups.map((group) => (
                        <section key={group.id} className="flex flex-col gap-3">
                            <DiscoverSectionHeader title={group.title} />
                            <div
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

            {error ? (
                <div className={discoveryTheme.emptyState}>
                    <p className={discoveryTheme.emptyTitle}>{error}</p>
                </div>
            ) : null}

            {!query.trim() && home ? (
                <>
                    {homeSections}
                </>
            ) : null}

            {!query.trim() && !error && !hasRails ? (
                <div className={discoveryTheme.emptyState}>
                    <p className={discoveryTheme.emptyTitle}>{t('mediaPlayerPage.emptyHome')}</p>
                </div>
            ) : null}
        </div>
    );
};
