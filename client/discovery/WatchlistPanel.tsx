import React, { useCallback, useMemo, useState } from 'react';
import { Loader2, PlusCircle, Sparkles } from 'lucide-react';
import { apiFetch } from '../shared/api';
import { DiscoverPosterCard } from '../screens';
import { Carousel } from './Carousel';
import { RequestModal } from './RequestModal';
import {
    countRequestableWatchlistItems,
    isWatchlistItemRequestable,
    resolveWatchlistMediaRef,
    watchlistItemStatusLabel,
} from './watchlistUtils';
import { useDiscoveryMe } from './useDiscoveryMe';
import { formatQuotaHint } from './requestSeasonUtils';

type Props = {
    items: any[];
    formatItem: (item: any) => any;
    onSelect: (item: any) => void;
    navigate?: (path: string) => void;
    pushToast?: (msg: string, type: 'success' | 'error') => void;
    onRefresh?: () => void;
    variant?: 'row' | 'page';
    showHeader?: boolean;
};

export const WatchlistPanel: React.FC<Props> = ({
    items,
    formatItem,
    onSelect,
    navigate,
    pushToast,
    onRefresh,
    variant = 'row',
    showHeader = true,
}) => {
    const [requestTarget, setRequestTarget] = useState<{ mediaType: 'movie' | 'tv'; mediaId: number; title: string } | null>(null);
    const [bulkLoading, setBulkLoading] = useState(false);
    const { profile: discoveryMe } = useDiscoveryMe(true);

    const requestableCount = useMemo(() => countRequestableWatchlistItems(items), [items]);
    const canBulkRequest = discoveryMe.permissions?.request !== false && discoveryMe.userMapped !== false;

    const movieQuotaHint = formatQuotaHint(discoveryMe.quota?.movie?.standard, 'movie');
    const tvQuotaHint = formatQuotaHint(discoveryMe.quota?.tv?.standard, 'TV');
    const quotaSummary = [movieQuotaHint, tvQuotaHint].filter(Boolean).join(' · ');

    const openRequest = useCallback((rawItem: any) => {
        const ref = resolveWatchlistMediaRef(rawItem);
        if (!ref) {
            pushToast?.('Unable to request this item.', 'error');
            return;
        }
        setRequestTarget(ref);
    }, [pushToast]);

    const handleRequestSuccess = useCallback((message: string) => {
        pushToast?.(message, 'success');
        setRequestTarget(null);
        onRefresh?.();
    }, [pushToast, onRefresh]);

    const handleRequestAll = async () => {
        if (requestableCount === 0) return;
        setBulkLoading(true);
        try {
            const res = await apiFetch('/api/discovery/watchlist/request', {
                method: 'POST',
                body: JSON.stringify({ all: true }),
            });
            if (res?.error) throw new Error(res.error);
            const submitted = Number(res?.submitted) || 0;
            const skipped = Number(res?.skipped) || 0;
            const failed = Number(res?.failed) || 0;
            if (submitted > 0) {
                pushToast?.(
                    `Submitted ${submitted} request${submitted === 1 ? '' : 's'}${skipped ? ` · ${skipped} skipped` : ''}${failed ? ` · ${failed} failed` : ''}.`,
                    failed > 0 && submitted === 0 ? 'error' : 'success',
                );
            } else {
                pushToast?.(skipped ? 'No watchlist items were requestable.' : 'No requests submitted.', 'error');
            }
            onRefresh?.();
        } catch (e: any) {
            pushToast?.(e?.message || 'Failed to request watchlist items', 'error');
        } finally {
            setBulkLoading(false);
        }
    };

    const renderCard = (rawItem: any, idx: number) => {
        if (!rawItem) return null;
        const formatted = formatItem(rawItem);
        const ref = resolveWatchlistMediaRef(rawItem);
        const requestable = isWatchlistItemRequestable(rawItem);
        const statusLabel = watchlistItemStatusLabel(rawItem);

        const cardWidth = variant === 'page' ? 'w-full' : 'w-[140px] sm:w-[160px] flex-shrink-0';
        const footer = (
            <div className="flex flex-col gap-1.5 mt-1.5 px-0.5">
                <div className={`text-xs font-medium line-clamp-2 leading-tight text-text ${variant === 'page' ? 'text-left' : 'text-center'}`}>
                    {formatted.title}
                </div>
                {statusLabel && !requestable && (
                    <span className={`text-[10px] font-bold uppercase tracking-wide text-center ${variant === 'page' ? 'text-left' : ''} text-muted`}>
                        {statusLabel}
                    </span>
                )}
                {requestable && ref && canBulkRequest && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            openRequest(rawItem);
                        }}
                        className="w-full py-1.5 px-2 rounded-lg bg-plex/90 hover:bg-plex text-black text-[11px] font-black transition-colors inline-flex items-center justify-center gap-1"
                    >
                        <PlusCircle className="w-3.5 h-3.5" />
                        Request
                    </button>
                )}
            </div>
        );

        return (
            <div key={`watchlist-${ref?.mediaId || formatted.id || idx}`} className={`${cardWidth} relative group`}>
                <DiscoverPosterCard
                    item={formatted}
                    overlay={formatted.overlay}
                    showQualityBadges={false}
                    footer={footer}
                    onPosterClick={() => onSelect(formatted)}
                />
            </div>
        );
    };

    if (!items?.length) return null;

    const header = showHeader ? (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-2">
            <div>
                <h2 className="text-xl font-bold text-text">Your Plex Watchlist</h2>
                <p className="text-xs text-muted mt-1">
                    Auto-sync from Plex is managed in Seerr settings.
                    {quotaSummary ? ` ${quotaSummary}.` : ''}
                </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
                {variant === 'row' && navigate && (
                    <button
                        type="button"
                        onClick={() => navigate('/discovery/watchlist')}
                        className="text-xs font-bold text-plex hover:underline px-2 py-1"
                    >
                        View All
                    </button>
                )}
                {requestableCount > 0 && canBulkRequest && (
                    <button
                        type="button"
                        disabled={bulkLoading}
                        onClick={handleRequestAll}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.06] border border-border text-text text-xs font-bold hover:bg-white/10 hover:border-plex/30 transition-colors disabled:opacity-50"
                    >
                        {bulkLoading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <Sparkles className="w-3.5 h-3.5 text-plex" />
                        )}
                        Request All ({requestableCount})
                    </button>
                )}
                {requestableCount > 0 && !canBulkRequest && (
                    <span className="text-[11px] font-semibold text-muted px-2 py-1">
                        {!discoveryMe.userMapped ? 'Seerr account not linked' : 'No request permission'}
                    </span>
                )}
            </div>
        </div>
    ) : null;

    return (
        <>
            <div className={`flex flex-col gap-2 relative ${variant === 'page' ? 'pb-6' : ''}`}>
                {header}
                {variant === 'row' ? (
                    <Carousel>{items.map(renderCard)}</Carousel>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 px-2">
                        {items.map(renderCard)}
                    </div>
                )}
            </div>

            {requestTarget && (
                <RequestModal
                    open
                    mediaType={requestTarget.mediaType}
                    mediaId={requestTarget.mediaId}
                    title={requestTarget.title}
                    onClose={() => setRequestTarget(null)}
                    onSuccess={handleRequestSuccess}
                    onError={(msg) => pushToast?.(msg, 'error')}
                />
            )}
        </>
    );
};
