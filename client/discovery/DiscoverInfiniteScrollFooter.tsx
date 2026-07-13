import React from 'react';

export const DiscoverInfiniteScrollFooter: React.FC<{
    sentinelRef: React.RefObject<HTMLDivElement | null>;
    loadingMore: boolean;
    hasMore: boolean;
    loading: boolean;
}> = ({ sentinelRef, loadingMore, hasMore, loading }) => {
    if (loading) return null;

    return (
        <div ref={sentinelRef} className="flex justify-center items-center min-h-[72px] mt-4 mb-12">
            {loadingMore && (
                <div className="flex items-center gap-3 text-sm font-semibold text-muted">
                    <span className="inline-block w-5 h-5 rounded-full border-2 border-white/20 border-t-plex animate-spin" />
                    Loading more…
                </div>
            )}
            {!hasMore && !loadingMore && (
                <p className="text-xs font-semibold uppercase tracking-wider text-muted/70">End of results</p>
            )}
        </div>
    );
};
