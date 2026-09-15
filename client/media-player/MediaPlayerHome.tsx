import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import {
    DiscoverGridSizeSelect,
    DiscoverHomeSkeleton,
    DiscoverSectionHeader,
    discoveryTheme,
    MediaPlayerAlphaBanner,
    useDiscoverGridSize,
    useDiscoverI18n,
} from './host';
import { fetchMediaPlayerHome, searchMediaPlayer, setMediaPlayerWatched } from './api';
import { PlayerPosterCard } from './PlayerPosterCard';
import { PlayerRail } from './PlayerRail';
import { applyHomeRowOrder, applyLibraryNavOrder } from './playerSettings';
import { consumePlayerSearchFocus, PLAYER_SEARCH_INPUT_ID } from './playerMemory';
import { usePlayerSettings } from './usePlayerSettings';
import type { PlayerHome, PlayerItem, PlayerPlayOptions } from './types';

type Props = {
    onOpenItem: (item: PlayerItem) => void;
    onPlay: (item: PlayerItem, opts?: PlayerPlayOptions) => void;
};

const dedupeItems = (list: PlayerItem[]) => {
    const seen = new Set<string>();
    return list.filter((row) => {
        const key = row.ratingKey || row.title;
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
    }).slice(0, 24);
};

export const MediaPlayerHome: React.FC<Props> = ({ onOpenItem, onPlay }) => {
    const { t } = useDiscoverI18n();
    const [settings] = usePlayerSettings();
    const [gridSize, setGridSize] = useDiscoverGridSize();
    const [home, setHome] = useState<PlayerHome | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
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
        let cancelled = false;
        setLoading(true);
        fetchMediaPlayerHome()
            .then((data) => {
                if (cancelled) return;
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
    }, [t]);

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
        () => applyLibraryNavOrder(home?.libraries || [], settings.libraryNavOrder),
        [home?.libraries, settings.libraryNavOrder],
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

    const hasRails = useMemo(() => (
        !!home && (
            (settings.showContinueWatching && home.continueWatching.length)
            || recentRails.some((row) => row.items.length)
            || (settings.showPlaylists && (home.playlists || []).length)
        )
    ), [home, recentRails, settings.showContinueWatching, settings.showPlaylists]);

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

    const homeSections = !home ? [] : applyHomeRowOrder(
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

    if (loading) return <DiscoverHomeSkeleton />;

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
                <section className="flex flex-col gap-3">
                    <DiscoverSectionHeader title={searching ? t('common.searching') : t('mediaPlayerPage.searchResults')} />
                    {results.length ? (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                            {results.map((item) => (
                                <PlayerPosterCard
                                    key={item.ratingKey}
                                    item={item}
                                    onOpenItem={onOpenItem}
                                    onPlay={onPlay}
                                    onToggleWatched={toggleWatched}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className={discoveryTheme.emptyState}>
                            <p className={discoveryTheme.emptyTitle}>{t('mediaPlayerPage.emptySearch')}</p>
                        </div>
                    )}
                </section>
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
