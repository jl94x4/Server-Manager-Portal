import React, { useCallback, useEffect, useState } from 'react';
import { Check, ChevronRight, ClipboardList, Film, Loader2, Tv } from 'lucide-react';
import { apiFetch } from '../shared/api';
import type { PortalRequestItem } from './types';

const formatRelativeTime = (value?: string | null) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const diffMs = Date.now() - date.getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
};

export const PendingRequestsHomeWidget: React.FC<{
    onViewAll?: () => void;
    onActionComplete?: () => void;
    onToast?: (message: string, type: 'success' | 'error') => void;
}> = ({ onViewAll, onActionComplete, onToast }) => {
    const [requests, setRequests] = useState<PortalRequestItem[]>([]);
    const [pendingTotal, setPendingTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [actionId, setActionId] = useState<number | null>(null);

    const load = useCallback(async () => {
        try {
            const [countData, listData] = await Promise.all([
                apiFetch('/api/requests/count'),
                apiFetch('/api/requests?filter=pending&take=5'),
            ]);
            if (!countData?.configured) {
                setRequests([]);
                setPendingTotal(0);
                return;
            }
            setPendingTotal(Number(countData?.pending) || 0);
            setRequests(Array.isArray(listData?.results) ? listData.results : []);
        } catch {
            setRequests([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
        const timer = window.setInterval(load, 90_000);
        return () => window.clearInterval(timer);
    }, [load]);

    const handleApprove = async (item: PortalRequestItem) => {
        setActionId(item.id);
        try {
            await apiFetch(`/api/requests/${item.id}/approve`, {
                method: 'POST',
                body: JSON.stringify({ title: item.title }),
            });
            onToast?.(`Approved "${item.title}"`, 'success');
            await load();
            onActionComplete?.();
        } catch (e: any) {
            onToast?.(e?.message || 'Failed to approve', 'error');
        } finally {
            setActionId(null);
        }
    };

    if (loading) {
        return (
            <div className="glass-card p-4 md:p-5 shadow-xl flex-shrink-0">
                <div className="flex items-center gap-2 text-muted text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading pending requests...
                </div>
            </div>
        );
    }

    if (pendingTotal === 0) return null;

    return (
        <div className="glass-card p-4 md:p-5 shadow-xl flex flex-col flex-shrink-0 border border-plex/20">
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-plex/10 border border-plex/30 flex items-center justify-center shrink-0">
                        <ClipboardList className="w-4 h-4 text-plex" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-muted text-xs uppercase tracking-widest font-semibold">Pending Requests</p>
                        <p className="text-sm font-bold text-text">{pendingTotal} awaiting approval</p>
                    </div>
                </div>
                {onViewAll && (
                    <button
                        type="button"
                        onClick={onViewAll}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-plex hover:text-plex-hover shrink-0"
                    >
                        View all <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            <div className="space-y-2">
                {requests.map((item) => {
                    const TypeIcon = item.type === 'tv' ? Tv : Film;
                    const busy = actionId === item.id;
                    return (
                        <div
                            key={item.id}
                            className="flex items-center gap-3 p-2.5 rounded-xl bg-background/50 border border-border/50"
                        >
                            <div className="w-10 aspect-[2/3] rounded overflow-hidden bg-card border border-border/40 shrink-0">
                                {item.posterUrl ? (
                                    <img src={item.posterUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-muted">
                                        <TypeIcon className="w-4 h-4 opacity-40" />
                                    </div>
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-text truncate">
                                    {item.title}
                                    {item.year ? <span className="text-muted font-normal"> ({item.year})</span> : null}
                                </p>
                                <p className="text-[11px] text-muted truncate">
                                    {item.requestedBy.displayName} · {formatRelativeTime(item.createdAt)}
                                    {item.is4k ? ' · 4K' : ''}
                                </p>
                            </div>
                            <button
                                type="button"
                                disabled={busy}
                                onClick={() => handleApprove(item)}
                                className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-lg bg-plex text-background hover:bg-plex-hover transition-colors disabled:opacity-50"
                                title="Approve"
                            >
                                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
