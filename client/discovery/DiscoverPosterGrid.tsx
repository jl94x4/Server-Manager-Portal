import React, { useMemo } from 'react';
import { DiscoverPosterCard } from '../screens';
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
            <div className={`${upgraderPosterGridClass(gridSize)} animate-pulse`} style={upgraderPosterGridStyle(gridSize)}>
                {[...Array(skeletonCount)].map((_, i) => (
                    <div key={i} className="w-full aspect-[2/3] rounded-xl bg-white/5 border border-border" />
                ))}
            </div>
        );
    }

    if (visibleItems.length === 0) {
        return (
            <div className={discoveryTheme.posterEmpty}>
                <p className={discoveryTheme.emptyTitle}>{emptyMessage}</p>
                <p className={discoveryTheme.emptyBody}>Try adjusting your filters or turn off Hide Available Media in settings.</p>
            </div>
        );
    }

    return (
        <div className={upgraderPosterGridClass(gridSize)} style={upgraderPosterGridStyle(gridSize)}>
            {visibleItems.map((rawItem) => {
                const formatted = formatItem(rawItem);
                const itemKey = getDiscoverItemKey(rawItem) || `${formatted.mediaType || formatted.type}-${formatted.id}`;
                return (
                    <DiscoverPosterCard
                        key={itemKey}
                        item={formatted}
                        overlay={formatted.overlay}
                        showQualityBadges={false}
                        onPosterClick={() => onSelect(formatted)}
                    />
                );
            })}
        </div>
    );
};
