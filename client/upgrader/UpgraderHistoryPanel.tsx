import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { apiFetch } from '../shared/api';
import type { UpgraderAuditEntry } from './types';

export const UpgraderHistoryPanel: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [entries, setEntries] = useState<UpgraderAuditEntry[]>([]);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        apiFetch('/api/upgrader/audit?limit=50')
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

    if (!entries.length) {
        return (
            <div className="rounded-2xl border border-border/60 bg-card/40 p-8 text-center">
                <p className="text-sm text-muted">No upgrade actions recorded yet.</p>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-border/60 bg-card/40 overflow-hidden">
            <div className="divide-y divide-border/50">
                {entries.filter((entry) => !entry.dryRun).map((entry) => (
                    <div key={entry.id} className="px-4 py-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="text-sm font-semibold text-text">{entry.title || entry.ratingKey}</div>
                            <div className="text-[11px] text-muted">{entry.timestamp ? new Date(entry.timestamp).toLocaleString() : ''}</div>
                        </div>
                        <div className="text-xs text-muted mt-1">
                            {entry.arrInstanceName || entry.arrType || 'ARR'}
                            {entry.targetProfileId ? ` · profile ${entry.targetProfileId}` : ''}
                            {entry.triggerSearch ? ' · search triggered' : ''}
                            {entry.actor?.username ? ` · ${entry.actor.username}` : ''}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
