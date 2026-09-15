import React, { useEffect, useState } from 'react';
import { ArrowLeft, Film } from 'lucide-react';
import { DiscoverGridSizeSelect } from '../discovery/DiscoverGridSizeSelect';
import { useDiscoverGridSize } from '../discovery/useDiscoverGridSize';
import { discoveryTheme } from '../discovery/discoveryThemeClasses';
import { useDiscoverI18n } from '../discovery/i18n';
import { PersonProfileHeader } from '../discovery/PersonProfileHeader';
import { pickTmdbPersonMatch } from '../discovery/personCredits';
import { PosterGridSkeleton } from '../shared/skeletons';
import { apiFetch } from '../shared/api';
import { upgraderPosterGridClass, upgraderPosterGridStyle } from '../shared/portalLayout';
import { fetchMediaPlayerPerson } from './api';
import { plexImageUrl } from './playerUtils';
import { PlayerPosterCard } from './PlayerPosterCard';
import type { PlayerItem } from './types';

type Props = {
    actorId: string;
    name?: string;
    thumb?: string | null;
    onBack: () => void;
    onOpenItem: (item: PlayerItem) => void;
    onPlay: (item: PlayerItem) => void;
};

type TmdbPerson = {
    name?: string | null;
    biography?: string | null;
    birthday?: string | null;
    knownForDepartment?: string | null;
    placeOfBirth?: string | null;
    profilePath?: string | null;
};

const searchDiscoveryPeople = async (query: string) => {
    const q = String(query || '').trim();
    if (q.length < 2) return [];
    const fromSearch = await apiFetch(`/api/discovery/search?query=${encodeURIComponent(q)}`).catch(() => null);
    const searchRows = Array.isArray(fromSearch?.results) ? fromSearch.results : [];
    if (pickTmdbPersonMatch(searchRows, { name: q })) return searchRows;
    const proxy = await apiFetch(`/api/discovery/proxy/search?query=${encodeURIComponent(q)}`).catch(() => null);
    const proxyRows = Array.isArray(proxy?.results) ? proxy.results : [];
    return proxyRows.length ? proxyRows : searchRows;
};

export const MediaPlayerPerson: React.FC<Props> = ({ actorId, name, thumb, onBack, onOpenItem, onPlay }) => {
    const { t } = useDiscoverI18n();
    const [gridSize, setGridSize] = useDiscoverGridSize();
    const [title, setTitle] = useState(name || t('navigation.person'));
    const [photo, setPhoto] = useState(thumb || null);
    const [profile, setProfile] = useState<TmdbPerson | null>(null);
    const [items, setItems] = useState<PlayerItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setProfile(null);

        const queryName = String(name || '').trim();
        const plexPromise = fetchMediaPlayerPerson(actorId, queryName);
        const searchPromise = searchDiscoveryPeople(queryName);

        Promise.all([plexPromise, searchPromise])
            .then(async ([data, searchResults]) => {
                if (cancelled) return;
                const resolvedName = String(data.person?.name || queryName || t('navigation.person')).trim();
                const nextItems = data.items || [];
                setTitle(resolvedName);
                setPhoto(thumb || data.person?.thumb || null);
                setItems(nextItems);
                setError(null);

                let rows = searchResults;
                if (resolvedName && resolvedName.toLowerCase() !== queryName.toLowerCase()) {
                    const extra = await searchDiscoveryPeople(resolvedName);
                    if (extra.length) rows = extra;
                }
                const match = pickTmdbPersonMatch(rows, {
                    name: resolvedName,
                    knownTitles: nextItems.map((row) => row.title),
                });
                const tmdbId = Number(match?.id);
                const details = Number.isFinite(tmdbId) && tmdbId > 0
                    ? await apiFetch(`/api/discovery/proxy/person/${tmdbId}`).catch(() => null)
                    : null;
                if (!cancelled) setProfile(details);
            })
            .catch((err) => {
                if (cancelled) return;
                setError(String(err?.message || t('mediaPlayerPage.loadError')));
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => { cancelled = true; };
    }, [actorId, name, t, thumb]);

    const photoUrl = photo ? plexImageUrl(photo, 400, 600) : '';
    const headerPerson = profile || { name: title };

    return (
        <div className="flex flex-col gap-8 pb-8">
            <div>
                <button
                    type="button"
                    onClick={onBack}
                    className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-muted hover:text-text"
                >
                    <ArrowLeft className="h-4 w-4" />
                    {t('mediaPlayerPage.back')}
                </button>
                {loading ? (
                    <div
                        className="grid grid-cols-[6.75rem_minmax(0,1fr)] sm:grid-cols-[9.5rem_minmax(0,1fr)] md:grid-cols-[minmax(14rem,22rem)_minmax(0,1fr)] gap-x-4 gap-y-4 md:gap-x-8"
                        aria-hidden="true"
                    >
                        <div className="aspect-[2/3] rounded-2xl bg-white/5 animate-pulse" />
                        <div className="flex flex-col gap-3">
                            <div className="h-10 w-2/3 max-w-md rounded-lg bg-white/5 animate-pulse" />
                            <div className="h-8 w-1/2 max-w-sm rounded-full bg-white/5 animate-pulse" />
                            <div className="h-28 rounded-xl bg-white/5 animate-pulse" />
                        </div>
                    </div>
                ) : (
                    <PersonProfileHeader
                        person={headerPerson}
                        fallbackPhotoUrl={photoUrl}
                        showBiography={!!profile}
                    />
                )}
            </div>

            <section className="flex flex-col gap-5 border-t border-border pt-8">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <h2 className="text-2xl font-black text-text flex items-center gap-3">
                        <Film className="w-6 h-6 text-plex" /> {t('mediaPlayerPage.onThisServer')}
                        {!loading && items.length ? (
                            <span className="text-sm font-bold text-muted tracking-normal">
                                {t('person.creditCount', { count: items.length })}
                            </span>
                        ) : null}
                    </h2>
                    <DiscoverGridSizeSelect value={gridSize} onChange={setGridSize} />
                </div>

                {loading ? (
                    <PosterGridSkeleton
                        className={upgraderPosterGridClass(gridSize)}
                        style={upgraderPosterGridStyle(gridSize)}
                    />
                ) : error ? (
                    <div className={discoveryTheme.emptyState}>
                        <p className={discoveryTheme.emptyTitle}>{error}</p>
                    </div>
                ) : !items.length ? (
                    <div className={discoveryTheme.emptyState}>
                        <p className={discoveryTheme.emptyTitle}>{t('mediaPlayerPage.emptyPerson', { name: title })}</p>
                    </div>
                ) : (
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
                )}
            </section>
        </div>
    );
};
