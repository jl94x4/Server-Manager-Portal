import React, { useEffect, useMemo, useState } from 'react';
import { Film, Music, Search, Tv } from 'lucide-react';
import { DiscoverPosterCard } from '../screens';
import { Carousel } from '../discovery/Carousel';
import { DiscoverSectionHeader } from '../discovery/DiscoverSectionHeader';
import { discoveryTheme } from '../discovery/discoveryThemeClasses';
import { useDiscoverI18n } from '../discovery/i18n';
import { DiscoverGridSizeSelect } from '../discovery/DiscoverGridSizeSelect';
import { useDiscoverGridSize } from '../discovery/useDiscoverGridSize';
import { DiscoverHomeSkeleton } from '../shared/skeletons';
import { MediaPlayerAlphaBanner } from '../shared/BetaBadge';
import { discoverRowCardWidthClass, posterGridCardWidthStyle } from '../shared/portalLayout';
import { fetchMediaPlayerHome, searchMediaPlayer } from './api';
import { progressPercent, toPosterCardItem } from './playerUtils';
import type { PlayerHome, PlayerItem, PlayerSection } from './types';

type Props = {
    onOpenItem: (item: PlayerItem) => void;
    onOpenLibrary: (section: PlayerSection) => void;
};

const libraryIcon = (type: string) => {
    if (type === 'show') return Tv;
    if (type === 'artist') return Music;
    return Film;
};

const PlayerRail: React.FC<{
    title: string;
    items: PlayerItem[];
    density: number;
    onSelect: (item: PlayerItem) => void;
    showProgress?: boolean;
}> = ({ title, items, density, onSelect, showProgress = false }) => {
    const { t } = useDiscoverI18n();
    if (!items.length) return null;
    return (
        <div className="flex flex-col gap-2">
            <DiscoverSectionHeader title={title} />
            <Carousel>
                {items.map((item, idx) => (
                    <div
                        key={item.ratingKey || `${title}-${idx}`}
                        className={`${discoverRowCardWidthClass(density)} flex-shrink-0 relative group snap-start`}
                        style={posterGridCardWidthStyle(density)}
                    >
                        <DiscoverPosterCard
                            item={toPosterCardItem(item)}
                            aspect={item.type === 'artist' || item.type === 'album' ? 'square' : '2/3'}
                            showQualityBadges={false}
                            onPosterClick={() => onSelect(item)}
                            overlay={showProgress && progressPercent(item) > 0 ? (
                                <div className="absolute inset-x-0 bottom-0 h-1 bg-black/50">
                                    <div className="h-full bg-plex" style={{ width: `${progressPercent(item)}%` }} />
                                </div>
                            ) : null}
                        />
                    </div>
                ))}
            </Carousel>
        </div>
    );
};

export const MediaPlayerHome: React.FC<Props> = ({ onOpenItem, onOpenLibrary }) => {
    const { t } = useDiscoverI18n();
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

    const hasRails = useMemo(() => (
        !!home && (
            home.continueWatching.length
            || home.recentMovies.length
            || home.recentShows.length
            || home.recentMusic.length
            || home.libraries.length
        )
    ), [home]);

    if (loading) return <DiscoverHomeSkeleton />;

    return (
        <div className="flex flex-col gap-6 pb-8">
            <MediaPlayerAlphaBanner />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className={discoveryTheme.personalEyebrow}>{t('navigation.mediaPlayer')}</p>
                    <h1 className={discoveryTheme.heading}>{t('navigation.mediaPlayer')}</h1>
                </div>
                <DiscoverGridSizeSelect value={gridSize} onChange={setGridSize} />
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
                                <DiscoverPosterCard
                                    key={item.ratingKey}
                                    item={toPosterCardItem(item)}
                                    showQualityBadges={false}
                                    onPosterClick={() => onOpenItem(item)}
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

            {!query.trim() && home?.libraries?.length ? (
                <section className="flex flex-col gap-3">
                    <DiscoverSectionHeader title={t('mediaPlayerPage.libraries')} />
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                        {home.libraries.map((section) => {
                            const Icon = libraryIcon(section.type);
                            return (
                                <button
                                    key={section.key}
                                    type="button"
                                    onClick={() => onOpenLibrary(section)}
                                    className="flex items-center gap-3 rounded-xl border border-border bg-white/[0.03] px-4 py-3 text-left hover:border-plex/50 hover:bg-white/[0.06]"
                                >
                                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-plex/15 text-plex">
                                        <Icon className="h-5 w-5" />
                                    </span>
                                    <span className="min-w-0">
                                        <span className="block truncate font-bold text-text">{section.title}</span>
                                        <span className="block text-[11px] uppercase tracking-wider text-muted">{section.type}</span>
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </section>
            ) : null}

            {!query.trim() && home ? (
                <>
                    <PlayerRail
                        title={t('mediaPlayerPage.continueWatching')}
                        items={home.continueWatching}
                        density={gridSize}
                        onSelect={onOpenItem}
                        showProgress
                    />
                    <PlayerRail
                        title={t('mediaPlayerPage.recentlyAddedMovies')}
                        items={home.recentMovies}
                        density={gridSize}
                        onSelect={onOpenItem}
                    />
                    <PlayerRail
                        title={t('mediaPlayerPage.recentlyAddedShows')}
                        items={home.recentShows}
                        density={gridSize}
                        onSelect={onOpenItem}
                    />
                    <PlayerRail
                        title={t('mediaPlayerPage.recentlyAddedMusic')}
                        items={home.recentMusic}
                        density={gridSize}
                        onSelect={onOpenItem}
                    />
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
