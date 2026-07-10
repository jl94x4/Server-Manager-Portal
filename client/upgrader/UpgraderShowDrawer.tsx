import React, { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { apiFetch } from '../shared/api';
import { portalUrl, resolvePortalAssetUrl } from '../shared/basePath';
import type { UpgraderEpisode, UpgraderItem } from './types';

type UpgraderShowDrawerProps = {
    show: UpgraderItem | null;
    preset: string;
    onClose: () => void;
};

export const UpgraderShowDrawer: React.FC<UpgraderShowDrawerProps> = ({ show, preset, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [episodes, setEpisodes] = useState<UpgraderEpisode[]>([]);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        if (!show) {
            setEpisodes([]);
            setTotal(0);
            return;
        }
        let cancelled = false;
        setLoading(true);
        apiFetch(`/api/upgrader/items/${encodeURIComponent(show.ratingKey)}/episodes?preset=${encodeURIComponent(preset)}`)
            .then((data) => {
                if (cancelled) return;
                setEpisodes(Array.isArray(data?.episodes) ? data.episodes : []);
                setTotal(Number(data?.total || 0));
            })
            .catch(() => {
                if (!cancelled) setEpisodes([]);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => { cancelled = true; };
    }, [show, preset]);

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-xl h-full bg-card border-l border-border/80 shadow-2xl flex flex-col">
                <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-border/60">
                    <div>
                        <h3 className="text-lg font-bold text-text">{show.title}</h3>
                        <p className="text-xs text-muted mt-1">
                            {show.nonHevcEpisodeCount || total} non-HEVC episode{(show.nonHevcEpisodeCount || total) === 1 ? '' : 's'}
                            {show.totalEpisodeCount ? ` · ${show.totalEpisodeCount} total` : ''}
                        </p>
                    </div>
                    <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-muted">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2 custom-scrollbar">
                    {loading ? (
                        <div className="flex items-center justify-center gap-2 py-12 text-muted">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Loading episodes…
                        </div>
                    ) : episodes.length === 0 ? (
                        <p className="text-sm text-muted text-center py-12">No matching episodes for this filter.</p>
                    ) : episodes.map((episode) => (
                        <a
                            key={episode.ratingKey}
                            href={episode.plexUrl || '#'}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/40 px-3 py-2 no-underline hover:border-plex/40 transition-colors"
                        >
                            <div className="w-16 h-10 rounded overflow-hidden bg-white/5 shrink-0">
                                {episode.thumb ? (
                                    <img
                                        src={episode.thumbUrl ? resolvePortalAssetUrl(episode.thumbUrl) : portalUrl(`/api/plex/image?path=${encodeURIComponent(episode.thumb)}&width=160&height=90`)}
                                        alt={episode.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : null}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="text-sm font-semibold text-text truncate">
                                    {episode.seasonNumber != null && episode.episodeNumber != null
                                        ? `S${episode.seasonNumber}E${episode.episodeNumber} · ${episode.title}`
                                        : episode.title}
                                </div>
                                <div className="text-[11px] text-muted">
                                    {(episode.displayTags || []).join(' · ') || episode.videoCodec}
                                    {episode.sizeGB > 0 ? ` · ${episode.sizeGB} GB` : ''}
                                </div>
                            </div>
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
};
