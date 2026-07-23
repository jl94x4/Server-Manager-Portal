import React from 'react';
import { PosterCardSkeleton } from '../shared/skeletons';

export const DiscoverInfiniteScrollFooter: React.FC<{
    sentinelRef: React.RefObject<HTMLDivElement | null>;
    loadingMore: boolean;
    hasMore: boolean;
    loading: boolean;
}> = ({ sentinelRef, loadingMore, hasMore, loading }) => {
    if (loading) return null;

    return (
        <div ref={sentinelRef} className="flex flex-col items-center justify-center min-h-[72px] mt-4 mb-12 gap-3">
            {loadingMore && (
                <div className="w-full discover-content-enter" aria-busy="true" aria-label="Loading more">
                    <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-3 sm:gap-4 max-w-3xl mx-auto px-1">
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                            <PosterCardSkeleton
                                key={i}
                                variant="discover"
                                delayMs={i * 40}
                                className={i >= 3 ? 'hidden sm:flex' : undefined}
                            />
                        ))}
                    </div>
                    <p className="text-center text-xs font-semibold text-muted mt-3 tracking-wide">
                        Loading more…
                    </p>
                </div>
            )}
            {!hasMore && !loadingMore && (
                <p className="text-xs font-semibold uppercase tracking-wider text-muted/70 discover-content-enter">
                    End of results
                </p>
            )}
        </div>
    );
};
