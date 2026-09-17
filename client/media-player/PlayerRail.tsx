import React from 'react';
import { Carousel, DiscoverSectionHeader, discoverRowCardWidthClass, posterGridCardWidthStyle, posterGridScaleRem } from './host';
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
                {items.map((item, idx) => {
                    const landscape = item.type === 'episode';
                    return (
                        <div
                            key={item.ratingKey || `${title}-${idx}`}
                            className={`${landscape ? '' : discoverRowCardWidthClass(density)} relative z-0 flex-shrink-0 snap-start group hover:z-20 focus-within:z-20`}
                            style={landscape
                                ? { width: `${posterGridScaleRem(density) * 1.85}rem` }
                                : posterGridCardWidthStyle(density)}
                        >
                            <PlayerPosterCard
                                item={item}
                                showProgress={showProgress}
                                onOpenItem={onOpenItem}
                                onPlay={onPlay}
                                onToggleWatched={onToggleWatched}
                            />
                        </div>
                    );
                })}
            </Carousel>
        </div>
    );
};
