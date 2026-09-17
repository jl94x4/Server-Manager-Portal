import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, Play } from 'lucide-react';
import { DiscoveryLogo, useDiscoverI18n } from './host';
import { apiFetch } from '../shared/api';
import { DISCOVER_NETWORKS, DISCOVER_STUDIOS } from '../discovery/discoverConstants';
import { shouldPreserveColorLogo } from '../discovery/discoveryLogoUtils';
import { plexImageUrl, formatEpisodeCode, formatPlayerDate, formatPlayerDuration, progressPercent } from './playerUtils';
import {
    splitOverviewServiceLogos,
    pickWatchProvidersForRegion,
} from './studioLogo.js';
import type { PlayerCollectionRef, PlayerItem, PlayerPersonCredit } from './types';
import { useDiscoveryPreferences } from '../discovery/useDiscoveryPreferences';
import { usePlayerSettings } from './usePlayerSettings';

type PersonHandler = (person: { id: string; name: string; thumb?: string | null }) => void;
type StudioHandler = (studio: { key: string; name: string; sectionKey?: string; mediaType?: 'movie' | 'show' }) => void;
type NetworkLogo = { name: string; logoPath: string; key: string };

const SectionHeading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="flex items-center gap-3 mb-3">
        <h3 className="text-xs font-black text-muted uppercase tracking-[0.2em]">{children}</h3>
        <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
    </div>
);

const CreditPills: React.FC<{
    people: PlayerPersonCredit[];
    onOpenPerson: PersonHandler;
}> = ({ people, onOpenPerson }) => (
    <div className="flex flex-wrap gap-2">
        {people.map((person) => (
            <button
                key={`${person.id}-${person.name}`}
                type="button"
                onClick={() => onOpenPerson({ id: person.id || person.name, name: person.name, thumb: person.thumb })}
                className="px-2.5 py-1 rounded-lg bg-white/5 border border-border text-sm text-text hover:bg-plex/15 hover:border-plex/40 hover:text-plex transition-colors"
            >
                {person.name}
            </button>
        ))}
    </div>
);

const StudioPill: React.FC<{
    name: string;
    logoPath?: string | null;
    size?: 'md' | 'sm';
    showPlate?: boolean;
    onClick?: () => void;
}> = ({ name, logoPath, size = 'md', showPlate = true, onClick }) => {
    const [failed, setFailed] = useState(false);
    const showLogo = Boolean(logoPath) && !failed;
    if (!showLogo) return null;

    const preserveColor = shouldPreserveColorLogo(String(logoPath), name);
    // Fixed plate height so wordmarks and square marks sit on one baseline.
    const plateClass = size === 'sm'
        ? 'inline-flex h-8 items-center justify-center rounded-lg px-2.5'
        : 'inline-flex h-9 items-center justify-center rounded-lg px-3';
    const logoClass = size === 'sm'
        ? 'h-5 max-w-[110px] sm:max-w-[130px] w-auto object-contain opacity-95'
        : 'h-5 sm:h-6 max-w-[130px] sm:max-w-[150px] w-auto object-contain opacity-95';
    const className = !showPlate
        ? `${plateClass} border border-transparent hover:bg-white/5 transition-colors`
        : preserveColor
            ? `${plateClass} border border-transparent hover:border-border/50 hover:bg-white/5 transition-colors`
            : `${plateClass} border border-border/60 bg-white/5 hover:bg-white/10 hover:border-plex/40 transition-colors`;
    const body = (
        <DiscoveryLogo
            logoPath={String(logoPath)}
            alt={name}
            width={300}
            duotone={!preserveColor}
            onError={() => setFailed(true)}
            className={logoClass}
        />
    );

    if (onClick) {
        return (
            <button
                type="button"
                onClick={onClick}
                title={name}
                aria-label={name}
                className={className}
            >
                {body}
            </button>
        );
    }
    return (
        <span title={name} className={className}>{body}</span>
    );
};

const NetworkLogoRow: React.FC<{
    networks: NetworkLogo[];
    onOpenStudio?: StudioHandler;
    sectionKey?: string;
    mediaType?: 'movie' | 'show';
    /** When true, search movie + show libraries (streaming brands). */
    searchAllTypes?: boolean;
    size?: 'md' | 'sm';
    showPlate?: boolean;
}> = ({ networks, onOpenStudio, sectionKey, mediaType, searchAllTypes = false, size = 'md', showPlate = true }) => (
    <div className="flex flex-wrap gap-2 items-stretch">
        {networks.filter((row) => row.logoPath).map((row) => (
            <StudioPill
                key={`${row.key}-${row.name}`}
                name={row.name}
                logoPath={row.logoPath}
                size={size}
                showPlate={showPlate}
                onClick={onOpenStudio ? () => onOpenStudio({
                    // Prefer the display name — TMDB catalog ids do not match Plex tag ids.
                    key: row.name || row.key,
                    name: row.name,
                    sectionKey: sectionKey || '',
                    mediaType: searchAllTypes ? undefined : (mediaType || 'show'),
                }) : undefined}
            />
        ))}
    </div>
);

const CollectionPills: React.FC<{
    collections: PlayerCollectionRef[];
    sectionKey?: string;
    onOpenItem: (item: PlayerItem) => void;
}> = ({ collections, sectionKey, onOpenItem }) => (
    <div className="flex flex-wrap gap-2">
        {collections.map((collection) => (
            collection.ratingKey ? (
                <button
                    key={collection.ratingKey}
                    type="button"
                    onClick={() => onOpenItem({
                        ratingKey: collection.ratingKey,
                        title: collection.title,
                        type: 'collection',
                        librarySectionID: sectionKey || null,
                    })}
                    className="px-2.5 py-1 rounded-lg bg-white/5 border border-border text-sm text-text hover:bg-plex/15 hover:border-plex/40 hover:text-plex transition-colors"
                >
                    {collection.title}
                </button>
            ) : (
                <span
                    key={collection.title}
                    className="px-2.5 py-1 rounded-lg bg-white/5 border border-border text-sm text-text"
                >
                    {collection.title}
                </span>
            )
        ))}
    </div>
);

/** Studio, broadcast network, and streaming providers — separate stacked rows. */
const useOverviewServiceLogos = (item: PlayerItem, region: string) => {
    const plexName = String(item.studio || '').trim();
    const watchRegion = String(region || 'US').trim().toUpperCase() || 'US';
    const [tmdbNetworks, setTmdbNetworks] = useState<Array<{ id?: string | number; name?: string; logoPath?: string }>>([]);
    const [streamingProviders, setStreamingProviders] = useState<Array<{ name: string; logoPath: string; key: string }>>([]);

    useEffect(() => {
        setTmdbNetworks([]);
        setStreamingProviders([]);
    }, [item.type, item.tmdbId, item.externalIds?.tmdb, plexName]);

    useEffect(() => {
        const tmdbId = Number(item.externalIds?.tmdb || item.tmdbId || 0);
        if (!Number.isFinite(tmdbId) || tmdbId <= 0) return undefined;
        // Episodes/seasons must resolve against the series id (server prefers show TMDB).
        const mediaType = item.type === 'movie' ? 'movie' : 'tv';
        let cancelled = false;
        apiFetch(`/api/discovery/proxy/${mediaType}/${tmdbId}`)
            .then((details: any) => {
                if (cancelled) return;
                if (mediaType === 'tv') {
                    setTmdbNetworks([].concat(details?.networks || []));
                } else {
                    setTmdbNetworks([]);
                }
                setStreamingProviders(pickWatchProvidersForRegion(details?.watchProviders || [], watchRegion));
            })
            .catch(() => {
                if (!cancelled) {
                    setTmdbNetworks([]);
                    setStreamingProviders([]);
                }
            });
        return () => { cancelled = true; };
    }, [item.externalIds?.tmdb, item.tmdbId, item.type, plexName, watchRegion]);

    return splitOverviewServiceLogos({
        plexName,
        // Treat episodes/seasons as TV so Plex network labels land in Network, not Studio.
        mediaType: item.type === 'movie' ? 'movie' : 'show',
        networks: DISCOVER_NETWORKS,
        studios: DISCOVER_STUDIOS,
        tmdbNetworks,
        streamingProviders,
    });
};

export const OverviewSummary: React.FC<{ text: string }> = ({ text }) => {
    const { t } = useDiscoverI18n();
    const [open, setOpen] = useState(false);
    const long = text.length > 420;
    return (
        <div className="flex flex-col gap-2">
            <p className={`text-sm sm:text-base lg:text-[17px] text-text leading-relaxed ${long && !open ? 'line-clamp-5' : ''}`}>
                {text}
            </p>
            {long ? (
                <button
                    type="button"
                    onClick={() => setOpen((prev) => !prev)}
                    className="self-start text-xs font-bold text-plex hover:text-plex-hover"
                >
                    {open ? t('common.showLess') : t('common.readMore')}
                </button>
            ) : null}
        </div>
    );
};

export const OverviewGenres: React.FC<{ genres: string[] }> = ({ genres }) => {
    if (!genres.length) return null;
    return (
        <div className="flex flex-wrap gap-2">
            {genres.map((genre) => (
                <span
                    key={genre}
                    className="px-2.5 py-1 rounded-lg bg-white/5 border border-border text-xs font-semibold text-muted"
                >
                    {genre}
                </span>
            ))}
        </div>
    );
};

export const OverviewFacts: React.FC<{
    item: PlayerItem;
    onOpenPerson: PersonHandler;
    onOpenItem: (item: PlayerItem) => void;
    onOpenStudio?: StudioHandler;
}> = ({ item, onOpenPerson, onOpenItem, onOpenStudio }) => {
    const { t, locale } = useDiscoverI18n();
    const { preferences } = useDiscoveryPreferences();
    const [settings] = usePlayerSettings();
    const { studio, network, streaming } = useOverviewServiceLogos(
        item,
        preferences.discoverRegion || 'US',
    );
    const aired = formatPlayerDate(item.originallyAvailableAt, locale);
    const added = formatPlayerDate(item.addedAt, locale);
    const lastPlayed = formatPlayerDate(item.lastViewedAt, locale);
    const watched = Number(item.viewedLeafCount || 0);
    const total = Number(item.leafCount || 0);
    const collectionItems = (item.collectionItems?.length
        ? item.collectionItems
        : (item.collections || []).map((title) => ({ ratingKey: '', title }))
    ).filter((row) => row.title);
    const serviceSections = [
        studio.length ? { label: t('media.studio'), networks: studio, size: 'sm' as const, searchAllTypes: false } : null,
        network.length ? { label: t('mediaPlayerPage.network'), networks: network, size: 'sm' as const, searchAllTypes: false } : null,
        streaming.length ? { label: t('mediaPlayerPage.streaming'), networks: streaming, size: 'sm' as const, searchAllTypes: true } : null,
    ].filter(Boolean) as Array<{ label: string; networks: NetworkLogo[]; size: 'sm' | 'md'; searchAllTypes: boolean }>;
    const crewRows: Array<{
        label: string;
        people?: PlayerPersonCredit[];
    }> = [
        item.directorPeople?.length ? { label: t('mediaPlayerPage.directedBy'), people: item.directorPeople } : null,
        item.writerPeople?.length ? { label: t('mediaPlayerPage.writtenBy'), people: item.writerPeople } : null,
        item.producers?.length ? { label: t('mediaPlayerPage.producedBy'), people: item.producers } : null,
    ].filter(Boolean) as Array<{ label: string; people?: PlayerPersonCredit[] }>;
    const metaRows: Array<{
        label: string;
        value?: string;
        collections?: PlayerCollectionRef[];
    }> = [
        aired ? { label: item.type === 'episode' ? t('mediaPlayerPage.aired') : t('mediaPlayerPage.released'), value: aired } : null,
        item.countries?.length ? { label: t('mediaPlayerPage.countries'), value: item.countries.join(', ') } : null,
        collectionItems.length ? {
            label: collectionItems.length > 1 ? t('mediaPlayerPage.collections') : t('mediaPlayerPage.collection'),
            collections: collectionItems,
        } : null,
        (item.type === 'show' || item.type === 'season') && total > 0
            ? { label: t('mediaPlayerPage.episodeProgress'), value: t('mediaPlayerPage.episodeProgressValue', { watched, total }) }
            : null,
        item.type === 'show' && item.childCount ? { label: t('mediaPlayerPage.seasons'), value: String(item.childCount) } : null,
        added ? { label: t('mediaPlayerPage.addedToLibrary'), value: added } : null,
        lastPlayed ? { label: t('mediaPlayerPage.lastPlayed'), value: lastPlayed } : null,
        item.viewCount ? { label: t('mediaPlayerPage.plays'), value: String(item.viewCount) } : null,
    ].filter(Boolean) as Array<{
        label: string;
        value?: string;
        collections?: PlayerCollectionRef[];
    }>;

    if (!crewRows.length && !serviceSections.length && !metaRows.length) return null;

    const renderMetaRow = (row: { label: string; value?: string; people?: PlayerPersonCredit[]; collections?: PlayerCollectionRef[] }) => (
        <div key={row.label} className="flex flex-col gap-1 min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted">{row.label}</span>
            {row.people?.length ? (
                <CreditPills people={row.people} onOpenPerson={onOpenPerson} />
            ) : row.collections?.length ? (
                <CollectionPills
                    collections={row.collections}
                    sectionKey={item.librarySectionID || ''}
                    onOpenItem={onOpenItem}
                />
            ) : (
                <span className="text-sm text-text leading-snug">{row.value}</span>
            )}
        </div>
    );

    const detailBlocks: React.ReactNode[] = [
        ...crewRows.map((row) => renderMetaRow(row)),
        ...serviceSections.map((section) => (
            <div key={section.label} className="flex flex-col gap-1 min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted">{section.label}</span>
                <NetworkLogoRow
                    networks={section.networks}
                    onOpenStudio={onOpenStudio}
                    sectionKey={item.librarySectionID || ''}
                    mediaType={item.type === 'movie' ? 'movie' : 'show'}
                    searchAllTypes={section.searchAllTypes}
                    size={section.size}
                    showPlate={settings.serviceLogoPlates}
                />
            </div>
        )),
        ...metaRows.map((row) => renderMetaRow(row)),
    ];

    const packColumns = (count: number) => {
        const cols: React.ReactNode[][] = Array.from({ length: count }, () => []);
        detailBlocks.forEach((block, index) => {
            cols[index % count].push(block);
        });
        return cols;
    };

    return (
        <div className="flex flex-col gap-3">
            <SectionHeading>{t('media.details')}</SectionHeading>
            {/* Round-robin columns so short fields (Streaming, Released) sit under
                Directed / Written instead of waiting below a tall Produced By row. */}
            <div className="flex flex-col gap-3 sm:hidden">
                {detailBlocks}
            </div>
            <div className="hidden gap-x-10 sm:flex xl:hidden">
                {packColumns(2).map((column, index) => (
                    <div key={`sm-${index}`} className="flex min-w-0 flex-1 flex-col gap-3">
                        {column}
                    </div>
                ))}
            </div>
            <div className="hidden gap-x-10 xl:flex">
                {packColumns(3).map((column, index) => (
                    <div key={`xl-${index}`} className="flex min-w-0 flex-1 flex-col gap-3">
                        {column}
                    </div>
                ))}
            </div>
        </div>
    );
};

export const OverviewLinks: React.FC<{ item: PlayerItem }> = ({ item }) => {
    const { t } = useDiscoverI18n();
    const ids = item.externalIds || { imdb: null, tmdb: item.tmdbId || null, tvdb: null };
    const tmdbType = item.type === 'movie' ? 'movie' : 'tv';
    const season = Number(item.parentIndex);
    const episode = Number(item.index);
    const tmdbHref = ids.tmdb
        ? (item.type === 'episode' && Number.isFinite(season) && season >= 0 && Number.isFinite(episode) && episode > 0
            ? `https://www.themoviedb.org/tv/${ids.tmdb}/season/${season}/episode/${episode}`
            : `https://www.themoviedb.org/${tmdbType}/${ids.tmdb}`)
        : null;
    const links = [
        ids.imdb ? { id: 'imdb', label: 'IMDb', href: `https://www.imdb.com/title/${ids.imdb}/` } : null,
        tmdbHref ? { id: 'tmdb', label: 'TMDB', href: tmdbHref } : null,
        ids.tvdb ? { id: 'tvdb', label: 'TVDB', href: `https://www.thetvdb.com/?tab=series&id=${ids.tvdb}` } : null,
    ].filter(Boolean) as Array<{ id: string; label: string; href: string }>;
    if (!links.length) return null;
    return (
        <div className="flex flex-wrap gap-2">
            {links.map((link) => (
                <a
                    key={link.id}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white/5 px-2.5 py-1.5 text-xs font-bold text-text hover:bg-white/10 hover:border-plex/40"
                >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {t('mediaPlayerPage.openSite', { name: link.label })}
                </a>
            ))}
        </div>
    );
};

export const EpisodeNeighbors: React.FC<{
    previous: PlayerItem | null;
    next: PlayerItem | null;
    onOpenItem: (item: PlayerItem) => void;
    onPlay: (item: PlayerItem) => void;
}> = ({ previous, next, onOpenItem, onPlay }) => {
    const { t } = useDiscoverI18n();
    if (!previous && !next) return null;
    const Card = ({ item, label, icon }: { item: PlayerItem; label: string; icon: React.ReactNode }) => (
        <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-border bg-white/5 p-2">
            <button
                type="button"
                onClick={() => onOpenItem(item)}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
            >
                <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-lg bg-black/40">
                    {item.thumb ? (
                        <img src={plexImageUrl(item.thumb, 320, 180)} alt="" className="h-full w-full object-cover" />
                    ) : (
                        <div className="flex h-full items-center justify-center text-muted">{icon}</div>
                    )}
                    {progressPercent(item) > 0 ? (
                        <div className="absolute inset-x-0 bottom-0 h-1 bg-black/60">
                            <div className="h-full bg-plex" style={{ width: `${progressPercent(item)}%` }} />
                        </div>
                    ) : null}
                </div>
                <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted">{label}</p>
                    <p className="truncate text-sm font-bold text-text">
                        {[formatEpisodeCode(item), item.title].filter(Boolean).join(' · ')}
                    </p>
                    {item.durationMs ? (
                        <p className="text-[11px] text-muted">{formatPlayerDuration(item.durationMs)}</p>
                    ) : null}
                </div>
            </button>
            {item.canPlay ? (
                <button
                    type="button"
                    onClick={() => onPlay(item)}
                    className="shrink-0 rounded-full bg-plex p-2 text-black hover:bg-plex-hover"
                    aria-label={t('mediaPlayerPage.play')}
                >
                    <Play className="h-4 w-4 fill-current" />
                </button>
            ) : null}
        </div>
    );

    return (
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
            {previous ? (
                <Card item={previous} label={t('mediaPlayerPage.previousEpisode')} icon={<ChevronLeft className="h-5 w-5" />} />
            ) : <div className="hidden lg:block" />}
            {next ? (
                <Card item={next} label={t('mediaPlayerPage.nextEpisode')} icon={<ChevronRight className="h-5 w-5" />} />
            ) : null}
        </div>
    );
};
