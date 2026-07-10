import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, XCircle, Search, ArrowUpFromLine } from 'lucide-react';
import { apiFetch } from '../shared/api';
import type { UpgraderAuditEntry } from './types';

const actionLabel = (entry: UpgraderAuditEntry) => {
    switch (entry.action) {
        case 'upgrade': return 'Profile upgrade';
        case 'series_search': return 'Series search';
        case 'episode_search': return 'Episode search';
        case 'movie_search': return 'Movie search';
        default:
            if (entry.targetProfileId) return 'Profile upgrade';
            if (entry.triggerSearch) return 'Search';
            return 'Action';
    }
};

const ActionIcon: React.FC<{ entry: UpgraderAuditEntry }> = ({ entry }) => {
    const failed = entry.success === false;
    if (failed) return <XCircle className="w-4 h-4 text-red-400 shrink-0" />;
    if (entry.action?.includes('search') || entry.triggerSearch) return <Search className="w-4 h-4 text-plex shrink-0" />;
    if (entry.action === 'upgrade' || entry.targetProfileId) return <ArrowUpFromLine className="w-4 h-4 text-green-400 shrink-0" />;
    return <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />;
};

export const UpgraderHistoryPanel: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [entries, setEntries] = useState<UpgraderAuditEntry[]>([]);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        apiFetch('/api/upgrader/audit?limit=100')
            .then((data) => {
                if (!cancelled) setEntries(Array.isArray(data?.entries) ? data.entries : []);
            })
            .catch(() => {
                if (!cancelled) setEntries([]);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => { cancelled = true; };
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center gap-2 py-16 text-muted">
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading upgrade history…
            </div>
        );
    }

    const visible = entries.filter((entry) => !entry.dryRun);

    if (!visible.length) {
        return (
            <div className="rounded-2xl border border-border/60 bg-card/40 p-8 text-center">
                <p className="text-sm text-muted">No upgrade or search actions recorded yet.</p>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-border/60 bg-card/40 overflow-hidden">
            <div className="divide-y divide-border/50">
                {visible.map((entry) => (
                    <div key={entry.id} className="px-4 py-3">
                        <div className="flex items-start gap-3">
                            <ActionIcon entry={entry} />
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="text-sm font-semibold text-text">{entry.title || entry.ratingKey}</div>
                                    <div className="text-[11px] text-muted">
                                        {entry.timestamp ? new Date(entry.timestamp).toLocaleString() : ''}
                                    </div>
                                </div>
                                <div className="text-xs text-muted mt-1 flex flex-wrap gap-x-2 gap-y-0.5">
                                    <span className="font-semibold text-text/80">{actionLabel(entry)}</span>
                                    {entry.arrInstanceName && <span>{entry.arrInstanceName}</span>}
                                    {entry.currentProfileName && entry.targetProfileName && (
                                        <span>
                                            {entry.currentProfileName} → {entry.targetProfileName}
                                        </span>
                                    )}
                                    {!entry.currentProfileName && entry.targetProfileName && (
                                        <span>→ {entry.targetProfileName}</span>
                                    )}
                                    {!entry.currentProfileName && !entry.targetProfileName && entry.targetProfileId && (
                                        <span>profile {entry.targetProfileId}</span>
                                    )}
                                    {entry.episodeIds?.length ? (
                                        <span>{entry.episodeIds.length} episode{entry.episodeIds.length === 1 ? '' : 's'}</span>
                                    ) : null}
                                    {entry.commandId ? <span>cmd {entry.commandId}</span> : null}
                                    {entry.actor?.username ? <span>by {entry.actor.username}</span> : null}
                                </div>
                                {entry.success === false && entry.reason && (
                                    <p className="text-[11px] text-red-300 mt-1">{entry.reason}</p>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
