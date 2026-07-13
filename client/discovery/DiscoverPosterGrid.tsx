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
    if (loading) {
        return (
            <div className={`${upgraderPosterGridClass(gridSize)} animate-pulse`} style={upgraderPosterGridStyle(gridSize)}>
                {[...Array(skeletonCount)].map((_, i) => (
                    <div key={i} className="w-full aspect-[2/3] rounded-xl bg-white/5 border border-white/10" />
                ))}
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 px-6 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] text-center">
                <p className="text-white/70 font-semibold">{emptyMessage}</p>
                <p className="text-sm text-muted mt-2">Try adjusting your filters or turn off Hide Available Media in settings.</p>
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
