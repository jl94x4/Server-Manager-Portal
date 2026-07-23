import React, { useMemo } from 'react';
import { DiscoverPosterCard } from '../screens';
import { PosterCardSkeleton } from '../shared/skeletons';
import { upgraderPosterGridClass, upgraderPosterGridStyle, type UpgraderGridSize } from '../shared/portalLayout';
import { dedupeDiscoverResults, getDiscoverItemKey } from './discoverItemUtils';
import { discoveryTheme } from './discoveryThemeClasses';

type Props = {
    items: any[];
    gridSize: UpgraderGridSize;
    formatItem: (item: any) => any;
    onSelect: (item: any) => void;
    loading?: boolean;
    skeletonCount?: number;
    emptyMessage?: string;
};

export const DiscoverPosterGrid: React.FC<Props> = ({
    items,
    gridSize,
    formatItem,
    onSelect,
    loading = false,
    skeletonCount = 15,
    emptyMessage = 'No results found.',
}) => {
    const visibleItems = useMemo(() => dedupeDiscoverResults(items), [items]);

    if (loading) {
        return (
            <div
                className={upgraderPosterGridClass(gridSize)}
                style={upgraderPosterGridStyle(gridSize)}
                aria-busy="true"
                aria-label="Loading results"
            >
                {[...Array(skeletonCount)].map((_, i) => (
                    <PosterCardSkeleton
                        key={i}
                        variant="discover"
                        delayMs={Math.min(i, 14) * 28}
                    />
                ))}
            </div>
        );
    }

    if (visibleItems.length === 0) {
        return (
            <div className={`${discoveryTheme.posterEmpty} discover-content-enter`}>
                <p className={discoveryTheme.emptyTitle}>{emptyMessage}</p>
                <p className={discoveryTheme.emptyBody}>Try adjusting your filters or turn off Hide Available Media in settings.</p>
            </div>
        );
    }

    return (
        <div
            key={`grid-${visibleItems.length}-${getDiscoverItemKey(visibleItems[0]) || 'x'}`}
            className={`${upgraderPosterGridClass(gridSize)} discover-content-enter`}
            style={upgraderPosterGridStyle(gridSize)}
        >
            {visibleItems.map((rawItem, index) => {
                const formatted = formatItem(rawItem);
                const itemKey = getDiscoverItemKey(rawItem) || `${formatted.mediaType || formatted.type}-${formatted.id}`;
                return (
                    <div
                        key={itemKey}
                        className="discover-poster-enter min-w-0"
                        style={{ animationDelay: `${Math.min(index, 18) * 22}ms` }}
                    >
                        <DiscoverPosterCard
                            item={formatted}
                            overlay={formatted.overlay}
                            showQualityBadges={false}
                            onPosterClick={() => onSelect(formatted)}
                        />
                    </div>
                );
            })}
        </div>
    );
};
