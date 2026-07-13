import React from 'react';
import { DiscoverPosterCard } from '../screens';
import { upgraderPosterGridClass, upgraderPosterGridStyle, type UpgraderGridSize } from '../shared/portalLayout';

type Props = {
    items: any[];
    gridSize: UpgraderGridSize;
    formatItem: (item: any) => any;
    onSelect: (item: any) => void;
    loading?: boolean;
    skeletonCount?: number;
};

export const DiscoverPosterGrid: React.FC<Props> = ({
    items,
    gridSize,
    formatItem,
    onSelect,
    loading = false,
    skeletonCount = 15,
}) => {
    if (loading) {
        return (
            <div className={`${upgraderPosterGridClass(gridSize)} animate-pulse`} style={upgraderPosterGridStyle(gridSize)}>
                {[...Array(skeletonCount)].map((_, i) => (
                    <div key={i} className="w-full aspect-[2/3] rounded-xl bg-white/5 border border-white/10" />
                ))}
            </div>
        );
    }

    return (
        <div className={upgraderPosterGridClass(gridSize)} style={upgraderPosterGridStyle(gridSize)}>
            {items.map((rawItem, idx) => {
                const formatted = formatItem(rawItem);
                return (
                    <DiscoverPosterCard
                        key={`${formatted.id}-${idx}`}
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
