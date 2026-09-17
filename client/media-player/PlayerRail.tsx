import React from 'react';
import { Carousel, DiscoverSectionHeader, discoverRowCardWidthClass, posterGridCardWidthStyle } from './host';
import { PlayerPosterCard } from './PlayerPosterCard';
import type { PlayerItem, PlayerPlayOptions } from './types';

export const PlayerRail: React.FC<{
    title: string;
    items: PlayerItem[];
    density: number;
    onOpenItem: (item: PlayerItem) => void;
    onPlay: (item: PlayerItem, opts?: PlayerPlayOptions) => void;
    onToggleWatched?: (item: PlayerItem) => void;
    showProgress?: boolean;
    onViewAll?: () => void;
    viewAllLabel?: string;
    staggerIndex?: number;
}> = ({ title, items, density, onOpenItem, onPlay, onToggleWatched, showProgress = false, onViewAll, viewAllLabel, staggerIndex = 0 }) => {
    if (!items.length) return null;
    return (
        <div
            className="player-rail-enter flex flex-col gap-2"
            style={{ animationDelay: `${Math.min(Math.max(staggerIndex, 0), 12) * 55}ms` }}
        >
            <DiscoverSectionHeader title={title} onViewAll={onViewAll} viewAllLabel={viewAllLabel} />
            <Carousel>
                {items.map((item, idx) => (
                    <div
                        key={item.ratingKey || `${title}-${idx}`}
                        className={`${discoverRowCardWidthClass(density)} flex-shrink-0 relative group snap-start`}
                        style={posterGridCardWidthStyle(density)}
                    >
                        <PlayerPosterCard
                            item={item}
                            showProgress={showProgress}
                            onOpenItem={onOpenItem}
                            onPlay={onPlay}
                            onToggleWatched={onToggleWatched}
                        />
                    </div>
                ))}
            </Carousel>
        </div>
    );
};
