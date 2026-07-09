import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, ExternalLink, Film, Loader2, Pencil, RefreshCw, RotateCcw, Trash2, Tv, X } from 'lucide-react';
import { apiFetch } from '../shared/api';
import { formatDateTime } from '../shared/format';
import { Loader, ToastContainer, pushToast, type ToastMessage } from '../shared/toast';
import { RequestApprovalModal } from './RequestApprovalModal';
import type { PortalRequestItem } from './types';

export type { PortalRequestItem } from './types';

type RequestFilter = 'pending' | 'failed' | 'approved' | 'declined';

const formatRelativeTime = (value?: string | null) => {
    if (!value) return 'Unknown time';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return formatDateTime(value);
    const diffMs = Date.now() - date.getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return formatDateTime(value);
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

export const RequestsAdminPanel: React.FC<{ onCountsChange?: () => void }> = ({ onCountsChange }) => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const [filter, setFilter] = useState<RequestFilter>('pending');
    const [requests, setRequests] = useState<PortalRequestItem[]>([]);
    const [counts, setCounts] = useState({
        pending: 0,
        approved: 0,
        declined: 0,
        failed: 0,
        total: 0,
        configured: false,
        connected: false,
        supported: true,
    });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [actionId, setActionId] = useState<number | null>(null);
    const [declineTarget, setDeclineTarget] = useState<PortalRequestItem | null>(null);
    const [declineReason, setDeclineReason] = useState('');
    const [reviewTarget, setReviewTarget] = useState<PortalRequestItem | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<PortalRequestItem | null>(null);

    const addToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        setToasts((prev) => pushToast(prev, message, type));
    }, []);

    const loadData = useCallback(async (opts?: { silent?: boolean }) => {
        if (!opts?.silent) setLoading(true);
        else setRefreshing(true);
        setError(null);
        try {
            const countData = await apiFetch('/api/requests/count');
            const nextCounts = {
                pending: Number(countData?.pending) || 0,
                approved: Number(countData?.approved) || 0,
                declined: Number(countData?.declined) || 0,
                failed: Number(countData?.failed) || 0,
                total: Number(countData?.total) || 0,
                configured: !!countData?.configured,
                connected: !!countData?.connected,
                supported: countData?.supported !== false,
            };
            setCounts(nextCounts);

            if (!nextCounts.configured) {
                setRequests([]);
                return;
            }
            if (!nextCounts.supported || !nextCounts.connected) {
                setRequests([]);
                setError(countData?.error || 'Cannot connect to your request app');
                return;
            }

            const listData = await apiFetch(`/api/requests?filter=${encodeURIComponent(filter)}&take=30`);
            if (listData?.connected === false) {
                setRequests([]);
                setError(listData?.error || 'Cannot connect to your request app');
                return;
            }
            setRequests(Array.isArray(listData?.results) ? listData.results : []);
        } catch (e: any) {
            setError(e?.message || 'Failed to load requests');
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
        { id: 'failed' as const, label: 'Failed', count: counts.failed },
        { id: 'approved' as const, label: 'Approved', count: counts.approved },
        { id: 'declined' as const, label: 'Declined', count: counts.declined },
    ]), [counts]);

    const handleQuickApprove = async (item: PortalRequestItem) => {
        setActionId(item.id);
        try {
            await apiFetch(`/api/requests/${item.id}/approve`, {
                method: 'POST',
                body: JSON.stringify({ title: item.title }),
            });
            addToast(`Approved "${item.title}"`);
            await loadData({ silent: true });
            onCountsChange?.();
        } catch (e: any) {
            addToast(e?.message || 'Failed to approve request', 'error');
        } finally {
            setActionId(null);
        }
    };

    const handleDecline = async () => {
        if (!declineTarget) return;
        setActionId(declineTarget.id);
        try {
            await apiFetch(`/api/requests/${declineTarget.id}/decline`, {
                method: 'POST',
                body: JSON.stringify({ title: declineTarget.title, reason: declineReason.trim() }),
            });
            addToast(`Declined "${declineTarget.title}"`);
            setDeclineTarget(null);
            setDeclineReason('');
            await loadData({ silent: true });
            onCountsChange?.();
        } catch (e: any) {
            addToast(e?.message || 'Failed to decline request', 'error');
        } finally {
            setActionId(null);
        }
    };

    const handleRetry = async (item: PortalRequestItem) => {
        setActionId(item.id);
        try {
            await apiFetch(`/api/requests/${item.id}/retry`, {
                method: 'POST',
                body: JSON.stringify({ title: item.title }),
            });
            addToast(`Retried "${item.title}"`);
            await loadData({ silent: true });
            onCountsChange?.();
        } catch (e: any) {
            addToast(e?.message || 'Failed to retry request', 'error');
        } finally {
            setActionId(null);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setActionId(deleteTarget.id);
        try {
            await apiFetch(`/api/requests/${deleteTarget.id}`, {
                method: 'DELETE',
                body: JSON.stringify({ title: deleteTarget.title }),
            });
            addToast(`Deleted "${deleteTarget.title}"`);
            setDeleteTarget(null);
            await loadData({ silent: true });
            onCountsChange?.();
        } catch (e: any) {
            addToast(e?.message || 'Failed to delete request', 'error');
        } finally {
            setActionId(null);
        }
    };

    const seerrLink = requests[0]?.seerrUrl || null;
    const showPendingActions = filter === 'pending';

    return (
        <div className="w-full max-w-[100%] animate-fade-in">
            <Loader isLoading={loading && requests.length === 0} />
            <ToastContainer toasts={toasts} setToasts={setToasts} />

            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-plex">Requests</h1>
                    <p className="text-sm text-muted mt-1">
                        {counts.configured && counts.connected
                            ? `${counts.pending} pending · full Seerr-style review with profiles, folders, tags & seasons`
                            : counts.configured
                                ? 'Request app is configured — connection failed (see below)'
                                : 'Connect Seerr, Overseerr, or Jellyseerr in Settings → Integrations to manage requests here.'}
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {seerrLink && (
                        <a
                            href={seerrLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm font-medium text-muted hover:text-text hover:bg-white/5 transition-colors"
                        >
                            Open Seerr <ExternalLink className="w-4 h-4" />
                        </a>
                    )}
                    <button
                        type="button"
                        onClick={() => loadData({ silent: true })}
                        disabled={refreshing}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-border text-text text-sm font-semibold hover:bg-opacity-80 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
            </div>

            <div className="glass-card p-4 md:p-6 shadow-2xl">
                <div className="flex flex-wrap gap-2 mb-5">
                    {filterTabs.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setFilter(tab.id)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                                filter === tab.id
                                    ? 'nav-item-active'
                                    : 'text-muted hover:text-text hover:bg-white/5'
                            }`}
                        >
                            {tab.label}
                            <span className="ml-1.5 text-xs opacity-70">({tab.count})</span>
                        </button>
                    ))}
                </div>

                {error && (
                    <div className="mb-4 p-4 rounded-xl border border-red-500/40 bg-red-500/10 text-red-200 text-sm space-y-2">
                        <p>{error}</p>
                        {counts.configured && (
                            <p className="text-xs text-red-200/80">
                                If you use a public reverse-proxy URL, the portal container may not reach it. Add an
                                {' '}<strong>Internal fetch URL</strong> under Settings → Integrations
                                (docker service name or LAN IP, e.g. <code className="text-red-100">http://jellyseerr:5055</code>).
                            </p>
                        )}
                    </div>
                )}

                {!counts.configured && !loading && !error && (
                    <div className="py-12 text-center text-muted">
                        <p className="font-medium text-text mb-2">Request app not configured</p>
                        <p className="text-sm max-w-md mx-auto">
                            Set Request App Type, URL, and API key under Settings → Integrations. Ombi is not supported for in-portal approval yet.
                        </p>
                    </div>
                )}

                {counts.configured && !counts.supported && !loading && (
                    <div className="py-12 text-center text-muted">
                        <p className="font-medium text-text mb-2">Request app type not supported</p>
                        <p className="text-sm max-w-md mx-auto">
                            In-portal approval works with Seerr, Overseerr, and Jellyseerr. Ombi requires the external request UI.
                        </p>
                    </div>
                )}

                {counts.configured && counts.supported && !loading && requests.length === 0 && !error && (
                    <div className="py-12 text-center text-muted">
                        <p className="font-medium text-text mb-1">No {filter} requests</p>
                        <p className="text-sm">You&apos;re all caught up.</p>
                    </div>
                )}

                <div className="space-y-3">
                    {requests.map((item) => {
                        const busy = actionId === item.id;
                        const TypeIcon = item.type === 'tv' ? Tv : Film;
                        return (
                            <div
                                key={item.id}
                                className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-border/60 bg-background/40 hover:border-border transition-colors"
                            >
                                <div className="flex gap-4 min-w-0 flex-1">
                                    <div className="w-[9rem] aspect-[2/3] rounded-lg overflow-hidden bg-card border border-border/50 shrink-0">
                                        {item.posterUrl ? (
                                            <img
                                                src={item.posterUrl}
                                                alt=""
                                                className="w-full h-full object-cover"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-muted">
                                                <TypeIcon className="w-8 h-8 opacity-40" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <h3 className="font-bold text-text truncate">
                                                {item.title}
                                                {item.year ? <span className="text-muted font-medium"> ({item.year})</span> : null}
                                            </h3>
                                            <RequestTypeBadge type={item.type} is4k={item.is4k} />
                                        </div>
                                        <p className="text-sm text-muted mb-1">
                                            Requested by <span className="text-text font-medium">{item.requestedBy.displayName}</span>
                                            {' · '}
                                            {formatRelativeTime(item.createdAt)}
                                        </p>
                                        {item.routingSummary && (
                                            <p className="text-xs text-plex/90 mb-2 font-medium">{item.routingSummary}</p>
                                        )}
                                        {item.type === 'tv' && item.seasons && item.seasons.length > 0 && (
                                            <p className="text-xs text-muted mb-2">
                                                Seasons: {item.seasons.map((s) => s.seasonNumber).join(', ')}
                                            </p>
                                        )}
                                        {item.overview && (
                                            <p className="text-xs text-muted line-clamp-2">{item.overview}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex sm:flex-col gap-2 sm:justify-center shrink-0">
                                    {showPendingActions && (
                                        <>
                                            <button
                                                type="button"
                                                disabled={busy}
                                                onClick={() => setReviewTarget(item)}
                                                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-plex/40 text-plex font-bold hover:bg-plex/10 transition-colors disabled:opacity-50 min-w-[7.5rem]"
                                            >
                                                <Pencil className="w-4 h-4" />
                                                Review
                                            </button>
                                            <button
                                                type="button"
                                                disabled={busy}
                                                onClick={() => handleQuickApprove(item)}
                                                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-plex text-background font-bold hover:bg-plex-hover transition-colors disabled:opacity-50 min-w-[7.5rem]"
                                            >
                                                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                                Quick Approve
                                            </button>
                                            <button
                                                type="button"
                                                disabled={busy}
                                                onClick={() => {
                                                    setDeclineTarget(item);
                                                    setDeclineReason('');
                                                }}
                                                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-red-500/40 text-red-200 font-semibold hover:bg-red-500/10 transition-colors disabled:opacity-50 min-w-[7.5rem]"
                                            >
                                                <X className="w-4 h-4" />
                                                Decline
                                            </button>
                                        </>
                                    )}
                                    {(filter === 'failed' || item.canRetry) && (
                                        <button
                                            type="button"
                                            disabled={busy}
                                            onClick={() => handleRetry(item)}
                                            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-amber-500/40 text-amber-200 font-semibold hover:bg-amber-500/10 transition-colors disabled:opacity-50 min-w-[7.5rem]"
                                        >
                                            <RotateCcw className="w-4 h-4" />
                                            Retry
                                        </button>
                                    )}
                                    {!showPendingActions && (
                                        <button
                                            type="button"
                                            disabled={busy}
                                            onClick={() => setReviewTarget(item)}
                                            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-text font-semibold hover:bg-white/5 transition-colors disabled:opacity-50 min-w-[7.5rem]"
                                        >
                                            <Pencil className="w-4 h-4" />
                                            Edit
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        disabled={busy}
                                        onClick={() => setDeleteTarget(item)}
                                        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-border text-muted font-semibold hover:text-red-200 hover:border-red-500/30 transition-colors disabled:opacity-50 min-w-[7.5rem]"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Delete
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {reviewTarget && (
                <RequestApprovalModal
                    requestId={reviewTarget.id}
                    initialTitle={reviewTarget.title}
                    mode={showPendingActions ? 'approve' : 'edit'}
                    onClose={() => setReviewTarget(null)}
                    onComplete={(message) => {
                        addToast(message);
                        setReviewTarget(null);
                        loadData({ silent: true });
                        onCountsChange?.();
                    }}
                    onError={(message) => addToast(message, 'error')}
                />
            )}

            {declineTarget && (
                <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-md glass-card p-5 shadow-2xl border border-border">
                        <h3 className="text-lg font-bold text-text mb-1">Decline request</h3>
                        <p className="text-sm text-muted mb-4">
                            Decline <span className="text-text font-medium">{declineTarget.title}</span>?
                        </p>
                        <label className="block text-sm font-medium text-text mb-2">Reason (optional)</label>
                        <textarea
                            className="w-full min-h-[100px] p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex transition-colors mb-4"
                            value={declineReason}
                            onChange={(e) => setDeclineReason(e.target.value)}
                            placeholder="Let the requester know why this was declined..."
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setDeclineTarget(null);
                                    setDeclineReason('');
                                }}
                                className="px-4 py-2 rounded-lg border border-border text-muted hover:text-text transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDecline}
                                disabled={actionId === declineTarget.id}
                                className="px-4 py-2 rounded-lg bg-red-600 text-white font-bold hover:bg-red-500 transition-colors disabled:opacity-50"
                            >
                                {actionId === declineTarget.id ? 'Declining...' : 'Decline request'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {deleteTarget && (
                <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-md glass-card p-5 shadow-2xl border border-border">
                        <h3 className="text-lg font-bold text-text mb-1">Delete request</h3>
                        <p className="text-sm text-muted mb-4">
                            Permanently delete <span className="text-text font-medium">{deleteTarget.title}</span> from your request app?
                        </p>
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setDeleteTarget(null)}
                                className="px-4 py-2 rounded-lg border border-border text-muted hover:text-text transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={actionId === deleteTarget.id}
                                className="px-4 py-2 rounded-lg bg-red-600 text-white font-bold hover:bg-red-500 transition-colors disabled:opacity-50"
                            >
                                {actionId === deleteTarget.id ? 'Deleting...' : 'Delete request'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
