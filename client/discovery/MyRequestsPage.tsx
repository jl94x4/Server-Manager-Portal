import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Film, Loader2, RotateCcw, Trash2, Tv } from 'lucide-react';
import { apiFetch } from '../shared/api';
import { NoPosterPlaceholder } from '../shared/NoPosterPlaceholder';
import { RequestCardActions, RequestCardShell, requestCardActionBtnClass } from '../requests/RequestCardShell';
import type { PortalRequestItem } from '../requests/types';
import {
    formatRequestRelativeTime,
    memberRequestDisplayStatus,
    memberRequestStatusClass,
} from './myRequestUtils';
import { discoveryTheme } from './discoveryThemeClasses';

type RequestFilter = 'pending' | 'approved' | 'available' | 'declined' | 'failed';

type Props = {
    navigate: (path: string) => void;
    pushToast?: (msg: string, type: 'success' | 'error') => void;
    onCountsChange?: () => void;
};

const RequestTypeBadge: React.FC<{ type: string; is4k: boolean }> = ({ type, is4k }) => (
    <span className="inline-flex items-center gap-1.5">
        <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-white/5 border border-border text-muted">
            {type === 'tv' ? 'TV' : 'Movie'}
        </span>
        {is4k && (
            <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-200">
                4K
            </span>
        )}
    </span>
);

export const MyRequestsPage: React.FC<Props> = ({ navigate, pushToast, onCountsChange }) => {
    const [filter, setFilter] = useState<RequestFilter>('pending');
    const [requests, setRequests] = useState<PortalRequestItem[]>([]);
    const [counts, setCounts] = useState({
        pending: 0,
        approved: 0,
        available: 0,
        declined: 0,
        failed: 0,
        total: 0,
        userMapped: true,
    });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [actionId, setActionId] = useState<number | null>(null);
    const [cancelTarget, setCancelTarget] = useState<PortalRequestItem | null>(null);

    const loadData = useCallback(async (opts?: { silent?: boolean }) => {
        if (!opts?.silent) setLoading(true);
        else setRefreshing(true);
        setError(null);
        try {
            const [countData, listData] = await Promise.all([
                apiFetch('/api/discovery/my-requests/count'),
                apiFetch(`/api/discovery/my-requests?filter=${encodeURIComponent(filter)}&take=40`),
            ]);

            setCounts({
                pending: Number(countData?.pending) || 0,
                approved: Number(countData?.approved) || 0,
                available: Number(countData?.available) || 0,
                declined: Number(countData?.declined) || 0,
                failed: Number(countData?.failed) || 0,
                total: Number(countData?.total) || 0,
                userMapped: countData?.userMapped !== false,
            });

            if (countData?.userMapped === false) {
                setRequests([]);
                setError('Your portal account is not linked to a Seerr user. Contact your admin.');
                return;
            }

            if (listData?.userMapped === false) {
                setRequests([]);
                setError(listData?.error || 'Your portal account is not linked to a Seerr user.');
                return;
            }

            setRequests(Array.isArray(listData?.results) ? listData.results : []);
        } catch (e: any) {
            setError(e?.message || 'Failed to load your requests');
            setRequests([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [filter]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const filterTabs = useMemo(() => ([
        { id: 'pending' as const, label: 'Pending', count: counts.pending },
        { id: 'approved' as const, label: 'Approved', count: counts.approved },
        { id: 'available' as const, label: 'Available', count: counts.available },
        { id: 'declined' as const, label: 'Declined', count: counts.declined },
        { id: 'failed' as const, label: 'Failed', count: counts.failed },
    ]), [counts]);

    const handleCancel = async (item: PortalRequestItem) => {
        setActionId(item.id);
        try {
            const res = await apiFetch(`/api/discovery/my-requests/${item.id}`, { method: 'DELETE' });
            if (res?.error) throw new Error(res.error);
            pushToast?.(res?.message || 'Request cancelled.', 'success');
            setCancelTarget(null);
            await loadData({ silent: true });
            onCountsChange?.();
        } catch (e: any) {
            pushToast?.(e?.message || 'Failed to cancel request', 'error');
        } finally {
            setActionId(null);
        }
    };

    const handleRetry = async (item: PortalRequestItem) => {
        setActionId(item.id);
        try {
            const res = await apiFetch(`/api/discovery/my-requests/${item.id}/retry`, { method: 'POST' });
            if (res?.error) throw new Error(res.error);
            pushToast?.(res?.message || 'Request retry submitted.', 'success');
            await loadData({ silent: true });
            onCountsChange?.();
        } catch (e: any) {
            pushToast?.(e?.message || 'Failed to retry request', 'error');
        } finally {
            setActionId(null);
        }
    };

    const openMedia = (item: PortalRequestItem) => {
        if (!item.tmdbId) return;
        navigate(`/discovery/${item.type}/${item.tmdbId}`);
    };

    return (
        <div className="flex flex-col gap-6 w-full pb-12">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 px-2">
                <div>
                    <h2 className={discoveryTheme.heading}>My Requests</h2>
                    <p className={discoveryTheme.subheading}>
                        Track, cancel, and retry your media requests.
                    </p>
                </div>
                {refreshing && (
                    <div className="inline-flex items-center gap-2 text-xs text-muted/70">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Refreshing…
                    </div>
                )}
            </div>

            <div className="flex flex-wrap gap-2 px-2">
                {filterTabs.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setFilter(tab.id)}
                        className={`${discoveryTheme.filterChip} ${
                            filter === tab.id ? discoveryTheme.filterChipActive : ''
                        }`}
                    >
                        {tab.label}
                        <span className={`${discoveryTheme.filterChipCount} ${
                            filter === tab.id ? discoveryTheme.filterChipCountActive : ''
                        }`}
                        >
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-plex animate-spin" />
                </div>
            ) : error ? (
                <div className="mx-2 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-4 text-sm text-amber-200">
                    {error}
                </div>
            ) : requests.length === 0 ? (
                <div className={`mx-2 ${discoveryTheme.emptyState}`}>
                    <p className={discoveryTheme.emptyTitle}>No {filter} requests</p>
                    <p className={discoveryTheme.emptyBody}>
                        Browse discover and submit a request when you find something to watch.
                    </p>
                    <button
                        type="button"
                        onClick={() => navigate('/discovery')}
                        className="mt-4 inline-flex px-4 py-2.5 rounded-xl bg-plex text-black font-bold hover:bg-plex-hover transition-colors"
                    >
                        Browse Discover
                    </button>
                </div>
            ) : (
                <div className="flex flex-col gap-3 px-2">
                    {requests.map((item) => {
                        const statusLabel = memberRequestDisplayStatus(item);
                        const busy = actionId === item.id;
                        const canCancel = Number(item.status) === 1;
                        const canRetry = item.canRetry || Number(item.status) === 4;

                        return (
                            <RequestCardShell
                                key={item.id}
                                backdropUrl={item.backdropUrl}
                                posterUrl={item.posterUrl}
                            >
                                <div className="flex flex-col sm:flex-row gap-4 p-4 sm:p-5">
                                    <button
                                        type="button"
                                        onClick={() => openMedia(item)}
                                        className="flex gap-4 min-w-0 flex-1 text-left border-0 bg-transparent p-0 cursor-pointer group"
                                    >
                                        <div className="w-16 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-background/40 border border-border group-hover:border-plex/30 transition-colors">
                                            {item.posterUrl ? (
                                                <img src={item.posterUrl} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <NoPosterPlaceholder compact />
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                                <RequestTypeBadge type={item.type} is4k={item.is4k} />
                                                <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${memberRequestStatusClass(statusLabel)}`}>
                                                    {statusLabel}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-black text-text leading-tight group-hover:text-plex transition-colors">
                                                {item.title}
                                                {item.year ? <span className="text-muted font-bold ml-2">{item.year}</span> : null}
                                            </h3>
                                            <p className="text-xs text-muted mt-1">
                                                Requested {formatRequestRelativeTime(item.createdAt || item.updatedAt)}
                                            </p>
                                            {statusLabel === 'Declined' && item.declineReason && (
                                                <p className="text-xs text-red-200/90 mt-2 bg-red-500/10 border border-red-500/20 rounded-lg px-2.5 py-2">
                                                    {item.declineReason}
                                                </p>
                                            )}
                                            {item.type === 'tv' && item.seasons && item.seasons.length > 0 && (
                                                <p className="text-xs text-muted mt-2">
                                                    Seasons: {item.seasons.map((s) => s.seasonNumber).join(', ')}
                                                </p>
                                            )}
                                            {item.overview && (
                                                <p className="text-sm text-muted mt-2 line-clamp-2">{item.overview}</p>
                                            )}
                                        </div>
                                    </button>

                                    <RequestCardActions>
                                        {canCancel && (
                                            <button
                                                type="button"
                                                disabled={busy}
                                                onClick={() => setCancelTarget(item)}
                                                className={`${requestCardActionBtnClass} border border-red-500/30 text-red-300 hover:bg-red-500/10`}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                Cancel
                                            </button>
                                        )}
                                        {canRetry && (
                                            <button
                                                type="button"
                                                disabled={busy}
                                                onClick={() => handleRetry(item)}
                                                className={`${requestCardActionBtnClass} border border-plex/30 text-plex hover:bg-plex/10`}
                                            >
                                                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                                                Retry
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => openMedia(item)}
                                            className={`${requestCardActionBtnClass} border border-border text-text/70 hover:bg-white/5`}
                                        >
                                            {item.type === 'tv' ? <Tv className="w-3.5 h-3.5" /> : <Film className="w-3.5 h-3.5" />}
                                            View
                                        </button>
                                    </RequestCardActions>
                                </div>
                            </RequestCardShell>
                        );
                    })}
                </div>
            )}

            {cancelTarget && (
                <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
                    <button
                        type="button"
                        aria-label="Close"
                        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                        onClick={() => { if (actionId == null) setCancelTarget(null); }}
                    />
                    <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
                        <h3 className="text-lg font-black text-text mb-2">Cancel request?</h3>
                        <p className="text-sm text-muted mb-5">
                            Cancel your pending request for <span className="text-text font-semibold">{cancelTarget.title}</span>?
                        </p>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                disabled={actionId != null}
                                onClick={() => setCancelTarget(null)}
                                className="flex-1 py-2.5 rounded-xl border border-border text-text/70 font-bold hover:bg-white/5 transition-colors disabled:opacity-50"
                            >
                                Keep Request
                            </button>
                            <button
                                type="button"
                                disabled={actionId != null}
                                onClick={() => handleCancel(cancelTarget)}
                                className="flex-1 py-2.5 rounded-xl bg-red-500/90 text-white font-black hover:bg-red-500 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
                            >
                                {actionId === cancelTarget.id ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                Cancel Request
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
