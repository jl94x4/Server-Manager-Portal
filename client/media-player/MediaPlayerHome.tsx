import React, { useEffect, useMemo, useState } from 'react';
import { Search, Settings } from 'lucide-react';
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
import { MediaPlayerLibrariesPanel } from './MediaPlayerLibrariesPanel';
import { PlayerPosterCard } from './PlayerPosterCard';
import { PlayerRail } from './PlayerRail';
import { applyHomeRowOrder } from './playerSettings';
import { usePlayerSettings } from './usePlayerSettings';
import type { PlayerHome, PlayerItem, PlayerPlayOptions, PlayerSection } from './types';

type Props = {
    onOpenItem: (item: PlayerItem) => void;
    onOpenLibrary: (section: PlayerSection) => void;
    onPlay: (item: PlayerItem, opts?: PlayerPlayOptions) => void;
    onOpenSettings: () => void;
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

export const MediaPlayerHome: React.FC<Props> = ({ onOpenItem, onOpenLibrary, onPlay, onOpenSettings }) => {
    const { t } = useDiscoverI18n();
    const [settings] = usePlayerSettings();
    const [gridSize, setGridSize] = useDiscoverGridSize();
    const [home, setHome] = useState<PlayerHome | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<PlayerItem[]>([]);
    const [searching, setSearching] = useState(false);

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

    const recentRails = useMemo(() => {
        const rows = home?.recentByLibrary || [];
        if (!settings.mixLibraries) {
            return rows.map((row) => ({
                id: `recent:${row.library.key}`,
                title: t('mediaPlayerPage.recentlyAddedIn', { name: row.library.title }),
                items: row.items,
            }));
        }
        const movies: PlayerItem[] = [];
        const shows: PlayerItem[] = [];
        const music: PlayerItem[] = [];
        for (const row of rows) {
            if (row.library.type === 'show') shows.push(...row.items);
            else if (row.library.type === 'artist') music.push(...row.items);
            else movies.push(...row.items);
        }
        return [
            { id: 'recent:movie', title: t('mediaPlayerPage.recentlyAddedMovies'), items: dedupeItems(movies) },
            { id: 'recent:show', title: t('mediaPlayerPage.recentlyAddedShows'), items: dedupeItems(shows) },
            { id: 'recent:artist', title: t('mediaPlayerPage.recentlyAddedMusic'), items: dedupeItems(music) },
        ];
    }, [home, settings.mixLibraries, t]);

    const hasRails = useMemo(() => (
        !!home && (
            (settings.showContinueWatching && home.continueWatching.length)
            || recentRails.some((row) => row.items.length)
            || home.libraries.length
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
        [
            'libraries',
            'continueWatching',
            'playlists',
            ...recentRails.map((row) => row.id),
        ],
        settings.homeRowOrder,
    ).map((id) => {
        if (id === 'libraries') {
            return home.libraries.length ? (
                <MediaPlayerLibrariesPanel
                    key="libraries"
                    libraries={home.libraries}
                    onOpenLibrary={onOpenLibrary}
                />
            ) : null;
        }
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
        const row = recentRails.find((rail) => rail.id === id);
        if (!row) return null;
        return (
            <PlayerRail
                key={row.id}
                title={row.title}
                items={row.items}
                density={gridSize}
                onOpenItem={onOpenItem}
                onPlay={onPlay}
                onToggleWatched={toggleWatched}
            />
        );
    });

    if (loading) return <DiscoverHomeSkeleton />;

    return (
        <div className="flex flex-col gap-6 pb-8">
            <MediaPlayerAlphaBanner />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className={discoveryTheme.personalEyebrow}>{t('navigation.mediaPlayer')}</p>
                    <h1 className={discoveryTheme.heading}>{t('navigation.mediaPlayer')}</h1>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={onOpenSettings}
                        className="inline-flex items-center gap-2 rounded-lg border border-border bg-white/5 px-3 py-2 text-xs font-bold text-muted hover:text-text"
                    >
                        <Settings className="h-4 w-4" />
                        {t('mediaPlayerPage.settings')}
                    </button>
                    <DiscoverGridSizeSelect value={gridSize} onChange={setGridSize} />
                </div>
            </div>

            <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
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
