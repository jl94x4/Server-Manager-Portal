import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle, Film, Loader2, MessageSquare, RotateCcw, Trash2, Tv } from 'lucide-react';
import { apiFetch } from '../shared/api';
import { NoPosterPlaceholder } from '../shared/NoPosterPlaceholder';
import { RequestCardActions, RequestCardShell, requestCardActionBtnClass } from '../requests/RequestCardShell';
import type { PortalIssueItem } from '../requests/types';
import {
    formatIssueLocation,
    formatIssueRelativeTime,
    issueStatusBadgeClass,
} from './issueUtils';

type IssueFilter = 'open' | 'resolved' | 'all';

type Props = {
    navigate: (path: string) => void;
    pushToast?: (msg: string, type: 'success' | 'error') => void;
    onCountsChange?: () => void;
};

const IssueTypeBadge: React.FC<{ type: string }> = ({ type }) => (
    <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/60">
        {type === 'tv' ? 'TV' : 'Movie'}
    </span>
);

export const MyIssuesPage: React.FC<Props> = ({ navigate, pushToast, onCountsChange }) => {
    const [filter, setFilter] = useState<IssueFilter>('open');
    const [issues, setIssues] = useState<PortalIssueItem[]>([]);
    const [counts, setCounts] = useState({
        open: 0,
        resolved: 0,
        total: 0,
        userMapped: true,
    });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [actionId, setActionId] = useState<number | null>(null);
    const [commentTarget, setCommentTarget] = useState<PortalIssueItem | null>(null);
    const [commentText, setCommentText] = useState('');
    const [deleteTarget, setDeleteTarget] = useState<PortalIssueItem | null>(null);

    const loadData = useCallback(async (opts?: { silent?: boolean }) => {
        if (!opts?.silent) setLoading(true);
        else setRefreshing(true);
        setError(null);
        try {
            const [countData, listData] = await Promise.all([
                apiFetch('/api/discovery/my-issues/count'),
                apiFetch(`/api/discovery/my-issues?filter=${encodeURIComponent(filter)}&take=40`),
            ]);

            setCounts({
                open: Number(countData?.open) || 0,
                resolved: Number(countData?.resolved) || 0,
                total: Number(countData?.total) || 0,
                userMapped: countData?.userMapped !== false,
            });

            if (countData?.userMapped === false) {
                setIssues([]);
                setError('Your portal account is not linked to a Seerr user. Contact your admin.');
                return;
            }

            if (listData?.userMapped === false) {
                setIssues([]);
                setError(listData?.error || 'Your portal account is not linked to a Seerr user.');
                return;
            }

            setIssues(Array.isArray(listData?.results) ? listData.results : []);
        } catch (e: any) {
            setError(e?.message || 'Failed to load your issues');
            setIssues([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [filter]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const filterTabs = useMemo(() => ([
        { id: 'open' as const, label: 'Open', count: counts.open },
        { id: 'resolved' as const, label: 'Resolved', count: counts.resolved },
        { id: 'all' as const, label: 'All', count: counts.total },
    ]), [counts]);

    const openMedia = (item: PortalIssueItem) => {
        if (!item.tmdbId) return;
        navigate(`/discovery/${item.type}/${item.tmdbId}`);
    };

    const handleResolve = async (item: PortalIssueItem) => {
        setActionId(item.id);
        try {
            const endpoint = item.statusLabel === 'open'
                ? `/api/discovery/my-issues/${item.id}/resolved`
                : `/api/discovery/my-issues/${item.id}/open`;
            const res = await apiFetch(endpoint, { method: 'POST' });
            if (res?.error) throw new Error(res.error);
            pushToast?.(res?.message || 'Issue updated.', 'success');
            await loadData({ silent: true });
            onCountsChange?.();
        } catch (e: any) {
            pushToast?.(e?.message || 'Failed to update issue', 'error');
        } finally {
            setActionId(null);
        }
    };

    const handleComment = async () => {
        if (!commentTarget) return;
        setActionId(commentTarget.id);
        try {
            const res = await apiFetch(`/api/discovery/my-issues/${commentTarget.id}/comment`, {
                method: 'POST',
                body: JSON.stringify({ message: commentText.trim() }),
            });
            if (res?.error) throw new Error(res.error);
            pushToast?.(res?.message || 'Comment added.', 'success');
            setCommentTarget(null);
            setCommentText('');
            await loadData({ silent: true });
        } catch (e: any) {
            pushToast?.(e?.message || 'Failed to add comment', 'error');
        } finally {
            setActionId(null);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setActionId(deleteTarget.id);
        try {
            const res = await apiFetch(`/api/discovery/my-issues/${deleteTarget.id}`, { method: 'DELETE' });
            if (res?.error) throw new Error(res.error);
            pushToast?.(res?.message || 'Issue deleted.', 'success');
            setDeleteTarget(null);
            await loadData({ silent: true });
            onCountsChange?.();
        } catch (e: any) {
            pushToast?.(e?.message || 'Failed to delete issue', 'error');
        } finally {
            setActionId(null);
        }
    };

    return (
        <div className="flex flex-col gap-6 w-full pb-12">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 px-2">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tight">My Issues</h2>
                    <p className="text-sm text-white/50 mt-1">
                        Playback problems you have reported on available media.
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
            ) : issues.length === 0 ? (
                <div className="mx-2 rounded-xl border border-white/10 bg-white/[0.03] px-6 py-12 text-center">
                    <p className="text-white/70 font-semibold">No {filter === 'all' ? '' : filter} issues</p>
                    <p className="text-sm text-white/45 mt-2">
                        Report a playback problem from any available title in Discover.
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
                    {issues.map((item) => {
                        const busy = actionId === item.id;
                        const location = formatIssueLocation(item);
                        const firstComment = item.comments?.[0]?.message;
                        const isOpen = item.statusLabel === 'open';

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
                                                <IssueTypeBadge type={item.type} />
                                                <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border bg-white/5 border-white/10 text-white/60">
                                                    {item.issueTypeLabel}
                                                </span>
                                                <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${issueStatusBadgeClass(item.statusLabel)}`}>
                                                    {item.statusLabel}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-black text-white leading-tight group-hover:text-plex transition-colors">
                                                {item.title}
                                                {item.year ? <span className="text-white/45 font-bold ml-2">{item.year}</span> : null}
                                            </h3>
                                            <p className="text-xs text-white/45 mt-1">
                                                Reported {formatIssueRelativeTime(item.createdAt || item.updatedAt)}
                                                {location ? ` · ${location}` : ''}
                                            </p>
                                            {firstComment && (
                                                <p className="text-sm text-white/65 mt-2 line-clamp-2">{firstComment}</p>
                                            )}
                                        </div>
                                    </button>

                                    <RequestCardActions>
                                        <button
                                            type="button"
                                            disabled={busy}
                                            onClick={() => {
                                                setCommentTarget(item);
                                                setCommentText('');
                                            }}
                                            className={`${requestCardActionBtnClass} border border-white/10 text-white/70 hover:bg-white/5`}
                                        >
                                            <MessageSquare className="w-3.5 h-3.5" />
                                            Comment
                                        </button>
                                        <button
                                            type="button"
                                            disabled={busy}
                                            onClick={() => handleResolve(item)}
                                            className={`${requestCardActionBtnClass} border border-plex/30 text-plex hover:bg-plex/10`}
                                        >
                                            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isOpen ? <CheckCircle className="w-3.5 h-3.5" /> : <RotateCcw className="w-3.5 h-3.5" />}
                                            {isOpen ? 'Resolve' : 'Reopen'}
                                        </button>
                                        {item.commentCount <= 1 && (
                                            <button
                                                type="button"
                                                disabled={busy}
                                                onClick={() => setDeleteTarget(item)}
                                                className={`${requestCardActionBtnClass} border border-red-500/30 text-red-300 hover:bg-red-500/10`}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                Delete
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

            {commentTarget && (
                <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
                    <button
                        type="button"
                        aria-label="Close"
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        onClick={() => { if (actionId == null) setCommentTarget(null); }}
                    />
                    <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-card p-6 shadow-2xl">
                        <h3 className="text-lg font-black text-white mb-2">Add comment</h3>
                        <p className="text-sm text-white/60 mb-4">
                            Update on <span className="text-white font-semibold">{commentTarget.title}</span>
                        </p>
                        <textarea
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            rows={4}
                            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-plex focus:ring-1 focus:ring-plex resize-y min-h-[6rem] mb-4"
                            placeholder="Add details for the admin…"
                        />
                        <div className="flex gap-3">
                            <button
                                type="button"
                                disabled={actionId != null}
                                onClick={() => setCommentTarget(null)}
                                className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/70 font-bold hover:bg-white/5 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={actionId != null || commentText.trim().length < 1}
                                onClick={handleComment}
                                className="flex-1 py-2.5 rounded-xl bg-plex text-black font-black hover:bg-plex-hover transition-colors disabled:opacity-50"
                            >
                                {actionId != null ? 'Sending…' : 'Send Comment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {deleteTarget && (
                <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
                    <button
                        type="button"
                        aria-label="Close"
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        onClick={() => { if (actionId == null) setDeleteTarget(null); }}
                    />
                    <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-card p-6 shadow-2xl">
                        <h3 className="text-lg font-black text-white mb-2">Delete issue?</h3>
                        <p className="text-sm text-white/60 mb-5">
                            Remove your report for <span className="text-white font-semibold">{deleteTarget.title}</span>?
                        </p>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                disabled={actionId != null}
                                onClick={() => setDeleteTarget(null)}
                                className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/70 font-bold hover:bg-white/5 transition-colors disabled:opacity-50"
                            >
                                Keep Issue
                            </button>
                            <button
                                type="button"
                                disabled={actionId != null}
                                onClick={handleDelete}
                                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-black hover:bg-red-600 transition-colors disabled:opacity-50"
                            >
                                {actionId != null ? 'Deleting…' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
