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

type RequestFilter = 'pending' | 'approved' | 'available' | 'declined' | 'failed';

type Props = {
    navigate: (path: string) => void;
    pushToast?: (msg: string, type: 'success' | 'error') => void;
    onCountsChange?: () => void;
};

const RequestTypeBadge: React.FC<{ type: string; is4k: boolean }> = ({ type, is4k }) => (
    <span className="inline-flex items-center gap-1.5">
        <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/60">
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
                    <h2 className="text-2xl font-black text-white tracking-tight">My Requests</h2>
                    <p className="text-sm text-white/50 mt-1">
                        Track, cancel, and retry your media requests.
                    </p>
                </div>
                {refreshing && (
                    <div className="inline-flex items-center gap-2 text-xs text-white/40">
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
                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold border transition-colors ${
                            filter === tab.id
                                ? 'bg-plex/15 border-plex/40 text-white'
                                : 'bg-white/[0.03] border-white/10 text-white/55 hover:text-white hover:border-white/20'
                        }`}
                    >
                        {tab.label}
                        <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                            filter === tab.id ? 'bg-plex/20 text-plex' : 'bg-white/5 text-white/45'
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
                <div className="mx-2 rounded-xl border border-white/10 bg-white/[0.03] px-6 py-12 text-center">
                    <p className="text-white/70 font-semibold">No {filter} requests</p>
                    <p className="text-sm text-white/45 mt-2">
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
                                        <div className="w-16 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-black/40 border border-white/10 group-hover:border-plex/30 transition-colors">
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
                                            <h3 className="text-lg font-black text-white leading-tight group-hover:text-plex transition-colors">
                                                {item.title}
                                                {item.year ? <span className="text-white/45 font-bold ml-2">{item.year}</span> : null}
                                            </h3>
                                            <p className="text-xs text-white/45 mt-1">
                                                Requested {formatRequestRelativeTime(item.createdAt || item.updatedAt)}
                                            </p>
                                            {item.type === 'tv' && item.seasons && item.seasons.length > 0 && (
                                                <p className="text-xs text-white/55 mt-2">
                                                    Seasons: {item.seasons.map((s) => s.seasonNumber).join(', ')}
                                                </p>
                                            )}
                                            {item.overview && (
                                                <p className="text-sm text-white/60 mt-2 line-clamp-2">{item.overview}</p>
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
                                            className={`${requestCardActionBtnClass} border border-white/10 text-white/70 hover:bg-white/5`}
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
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        onClick={() => { if (actionId == null) setCancelTarget(null); }}
                    />
                    <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-card p-6 shadow-2xl">
                        <h3 className="text-lg font-black text-white mb-2">Cancel request?</h3>
                        <p className="text-sm text-white/60 mb-5">
                            Cancel your pending request for <span className="text-white font-semibold">{cancelTarget.title}</span>?
                        </p>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                disabled={actionId != null}
                                onClick={() => setCancelTarget(null)}
                                className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/70 font-bold hover:bg-white/5 transition-colors disabled:opacity-50"
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
