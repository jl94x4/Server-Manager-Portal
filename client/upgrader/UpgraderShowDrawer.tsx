import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    X, Loader2, ChevronDown, ChevronRight, Search, ArrowUpFromLine, ExternalLink,
} from 'lucide-react';
import { apiFetch } from '../shared/api';
import { portalUrl, resolvePortalAssetUrl } from '../shared/basePath';
import type { UpgraderItem, UpgraderShowDetail } from './types';

type UpgraderShowDrawerProps = {
    show: UpgraderItem | null;
    preset: string;
    onClose: () => void;
    onUpgrade?: (item: UpgraderItem) => void;
    addToast?: (message: string, type?: 'success' | 'error') => void;
    automationReady?: boolean;
};

const formatSeasonLabel = (seasonNumber: number) => {
    if (seasonNumber < 0) return 'Specials';
    if (seasonNumber === 0) return 'Season 0';
    return `Season ${seasonNumber}`;
};

const EpisodeQualityBadges: React.FC<{ tags: string[]; isHevc?: boolean }> = ({ tags, isHevc }) => (
    <div className="flex flex-wrap gap-1">
        {(tags || []).slice(0, 4).map((tag) => (
            <span key={tag} className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-text">
                {tag}
            </span>
        ))}
        {isHevc && !(tags || []).includes('HEVC') && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-500/20 text-green-200">HEVC</span>
        )}
    </div>
);

export const UpgraderShowDrawer: React.FC<UpgraderShowDrawerProps> = ({
    show,
    preset,
    onClose,
    onUpgrade,
    addToast,
    automationReady = false,
}) => {
    const [loading, setLoading] = useState(false);
    const [detail, setDetail] = useState<UpgraderShowDetail | null>(null);
    const [expandedSeasons, setExpandedSeasons] = useState<Set<number>>(new Set());
    const [searchingKey, setSearchingKey] = useState<string | null>(null);
    const [showAllEpisodes, setShowAllEpisodes] = useState(false);

    const loadDetail = useCallback(async () => {
        if (!show) return;
        setLoading(true);
        try {
            const data = await apiFetch(
                `/api/upgrader/items/${encodeURIComponent(show.ratingKey)}/detail?preset=${encodeURIComponent(preset)}`,
            );
            setDetail(data as UpgraderShowDetail);
            const seasons = Array.isArray(data?.seasons) ? data.seasons : [];
            const defaultExpanded = new Set<number>(
                seasons
                    .filter((season: { matchedCount?: number }) => (season.matchedCount ?? 0) > 0)
                    .slice(0, 3)
                    .map((season: { seasonNumber: number }) => season.seasonNumber),
            );
            if (!defaultExpanded.size && seasons.length) {
                defaultExpanded.add(seasons[0].seasonNumber);
            }
            setExpandedSeasons(defaultExpanded);
        } catch (e: unknown) {
            setDetail(null);
            addToast?.((e as Error)?.message || 'Failed to load show detail', 'error');
        } finally {
            setLoading(false);
        }
    }, [addToast, preset, show]);

    useEffect(() => {
        if (!show) {
            setDetail(null);
            setExpandedSeasons(new Set());
            setShowAllEpisodes(false);
            return;
        }
        loadDetail();
    }, [loadDetail, show]);

    const triggerSearch = async (scope: 'series' | 'episode', episodeIds?: number[], label?: string) => {
        if (!show) return;
        const key = scope === 'episode' && episodeIds?.length ? `ep-${episodeIds.join(',')}` : 'series';
        setSearchingKey(key);
        try {
            await apiFetch('/api/upgrader/search', {
                method: 'POST',
                body: JSON.stringify({
                    ratingKey: show.ratingKey,
                    scope,
                    episodeIds,
                }),
            });
            addToast?.(label || (scope === 'series' ? 'Series search triggered.' : 'Episode search triggered.'), 'success');
        } catch (e: unknown) {
            addToast?.((e as Error)?.message || 'Search failed', 'error');
        } finally {
            setSearchingKey(null);
        }
    };

    const toggleSeason = (seasonNumber: number) => {
        setExpandedSeasons((prev) => {
            const next = new Set(prev);
            if (next.has(seasonNumber)) next.delete(seasonNumber);
            else next.add(seasonNumber);
            return next;
        });
    };

    const displaySeasons = useMemo(() => {
        if (!detail?.seasons) return [];
        if (showAllEpisodes) return detail.seasons;
        return detail.seasons.map((season) => ({
            ...season,
            episodes: season.episodes.filter((episode) => episode.matchesPreset !== false),
        })).filter((season) => season.episodes.length > 0);
    }, [detail?.seasons, showAllEpisodes]);

    if (!show) return null;

    const arr = detail?.arr;
    const showMeta = detail?.show || show;
    const canSearch = automationReady && arr?.mapped && arr?.seriesId;
    const canUpgrade = automationReady && showMeta.arrMapped && onUpgrade;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-3xl h-full bg-card border-l border-border/80 shadow-2xl flex flex-col">
                <div className="px-5 py-4 border-b border-border/60 space-y-4">
                    <div className="flex items-start gap-4">
                        <div className="w-16 h-24 rounded-lg overflow-hidden bg-white/5 shrink-0 border border-white/10">
                            {showMeta.thumb ? (
                                <img
                                    src={showMeta.thumbUrl
                                        ? resolvePortalAssetUrl(showMeta.thumbUrl)
                                        : portalUrl(`/api/plex/image?path=${encodeURIComponent(showMeta.thumb)}&width=128&height=192`)}
                                    alt={showMeta.title}
                                    className="w-full h-full object-cover"
                                />
                            ) : null}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h3 className="text-lg font-bold text-text">{showMeta.title}</h3>
                                    <p className="text-xs text-muted mt-1">
                                        {showMeta.libraryTitle}
                                        {showMeta.year ? ` · ${showMeta.year}` : ''}
                                        {detail?.stats ? ` · ${detail.stats.total} episodes` : ''}
                                    </p>
                                </div>
                                <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-muted shrink-0">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            {arr?.mapped && (
                                <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                                    <span className="px-2 py-1 rounded-full bg-plex/15 border border-plex/30 text-plex font-semibold">
                                        {arr.instanceName}
                                    </span>
                                    {arr.currentProfileName && (
                                        <span className="px-2 py-1 rounded-full bg-white/5 border border-white/10 text-muted">
                                            Profile: {arr.currentProfileName}
                                        </span>
                                    )}
                                    {arr.targetProfileName && arr.targetProfileName !== arr.currentProfileName && (
                                        <span className="px-2 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-green-200">
                                            Target: {arr.targetProfileName}
                                        </span>
                                    )}
                                </div>
                            )}
                            {!arr?.mapped && (
                                <p className="text-[11px] text-amber-200 mt-2">Not mapped to Sonarr — Plex data only.</p>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {showMeta.plexUrl && (
                            <a
                                href={showMeta.plexUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-bold text-text no-underline hover:border-plex/40"
                            >
                                <ExternalLink className="w-3.5 h-3.5" />
                                Open in Plex
                            </a>
                        )}
                        {arr?.deepUrl && (
                            <a
                                href={arr.deepUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-bold text-plex no-underline hover:border-plex/40"
                            >
                                <ExternalLink className="w-3.5 h-3.5" />
                                Open in Sonarr
                            </a>
                        )}
                        {canSearch && (
                            <button
                                type="button"
                                disabled={searchingKey === 'series'}
                                onClick={() => triggerSearch('series', undefined, `Series search started for “${showMeta.title}”.`)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-bold text-text hover:border-plex/40 disabled:opacity-50"
                            >
                                {searchingKey === 'series' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                                Series search
                            </button>
                        )}
                        {canUpgrade && (
                            <button
                                type="button"
                                onClick={() => onUpgrade?.(showMeta)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-plex text-background text-xs font-bold hover:bg-plex-hover"
                            >
                                <ArrowUpFromLine className="w-3.5 h-3.5" />
                                Upgrade profile
                            </button>
                        )}
                    </div>

                    {detail?.stats && (
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted">
                            <span>{detail.stats.matched} episode{detail.stats.matched === 1 ? '' : 's'} match current filter</span>
                            <label className="inline-flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={showAllEpisodes}
                                    onChange={(e) => setShowAllEpisodes(e.target.checked)}
                                    className="rounded border-border"
                                />
                                Show all episodes
                            </label>
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-4 custom-scrollbar">
                    {loading ? (
                        <div className="flex items-center justify-center gap-2 py-16 text-muted">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Loading show detail…
                        </div>
                    ) : !displaySeasons.length ? (
                        <p className="text-sm text-muted text-center py-16">No episodes match this filter.</p>
                    ) : (
                        <div className="space-y-3">
                            {displaySeasons.map((season) => {
                                const expanded = expandedSeasons.has(season.seasonNumber);
                                return (
                                    <div key={season.seasonNumber} className="rounded-xl border border-border/60 overflow-hidden">
                                        <button
                                            type="button"
                                            onClick={() => toggleSeason(season.seasonNumber)}
                                            className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-white/[0.03] hover:bg-white/[0.06] text-left"
                                        >
                                            <div className="flex items-center gap-2">
                                                {expanded ? <ChevronDown className="w-4 h-4 text-muted" /> : <ChevronRight className="w-4 h-4 text-muted" />}
                                                <span className="text-sm font-bold text-text">{formatSeasonLabel(season.seasonNumber)}</span>
                                                <span className="text-[11px] text-muted">
                                                    {season.episodes.length} ep{season.episodes.length === 1 ? '' : 's'}
                                                    {!showAllEpisodes && season.matchedCount !== season.episodeCount
                                                        ? ` · ${season.matchedCount} matched`
                                                        : ''}
                                                </span>
                                            </div>
                                        </button>
                                        {expanded && (
                                            <div className="divide-y divide-border/40">
                                                {season.episodes.map((episode) => {
                                                    const epLabel = episode.seasonNumber != null && episode.episodeNumber != null
                                                        ? `S${String(episode.seasonNumber).padStart(2, '0')}E${String(episode.episodeNumber).padStart(2, '0')}`
                                                        : null;
                                                    const searchKey = episode.arrEpisodeId ? `ep-${episode.arrEpisodeId}` : null;
                                                    const isSearching = searchKey != null && searchingKey === searchKey;
                                                    return (
                                                        <div
                                                            key={episode.ratingKey}
                                                            className={`flex items-start gap-3 px-4 py-3 ${episode.matchesPreset === false ? 'opacity-60' : ''}`}
                                                        >
                                                            <div className="w-20 h-11 rounded overflow-hidden bg-white/5 shrink-0">
                                                                {episode.thumb ? (
                                                                    <img
                                                                        src={episode.thumbUrl
                                                                            ? resolvePortalAssetUrl(episode.thumbUrl)
                                                                            : portalUrl(`/api/plex/image?path=${encodeURIComponent(episode.thumb)}&width=160&height=90`)}
                                                                        alt={episode.title}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                ) : null}
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    {epLabel && (
                                                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-muted">
                                                                            {epLabel}
                                                                        </span>
                                                                    )}
                                                                    <span className="text-sm font-semibold text-text truncate">{episode.title}</span>
                                                                </div>
                                                                <div className="mt-1">
                                                                    <EpisodeQualityBadges tags={episode.displayTags || []} isHevc={episode.isHevc} />
                                                                </div>
                                                                <div className="text-[11px] text-muted mt-1 flex flex-wrap gap-x-2 gap-y-0.5">
                                                                    {episode.videoCodec && <span>Plex: {episode.videoCodec}</span>}
                                                                    {episode.sizeGB > 0 && <span>{episode.sizeGB} GB</span>}
                                                                    {episode.arrQualityLabel && (
                                                                        <span className="text-plex">Sonarr: {episode.arrQualityLabel}</span>
                                                                    )}
                                                                    {episode.arrHasFile === false && (
                                                                        <span className="text-amber-200">Missing in Sonarr</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col gap-1 shrink-0">
                                                                {episode.plexUrl && (
                                                                    <a
                                                                        href={episode.plexUrl}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="text-[10px] font-bold text-muted hover:text-text no-underline"
                                                                    >
                                                                        Plex
                                                                    </a>
                                                                )}
                                                                {canSearch && episode.arrEpisodeId && (
                                                                    <button
                                                                        type="button"
                                                                        disabled={isSearching}
                                                                        onClick={() => triggerSearch(
                                                                            'episode',
                                                                            [episode.arrEpisodeId!],
                                                                            `Episode search started for ${epLabel || episode.title}.`,
                                                                        )}
                                                                        className="inline-flex items-center gap-1 text-[10px] font-bold text-plex hover:underline disabled:opacity-50"
                                                                    >
                                                                        {isSearching ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                                                                        Search
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
