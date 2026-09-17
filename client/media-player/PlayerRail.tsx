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
    /** Force card shape. Continue Watching should stay poster (`2/3`). */
    aspect?: '2/3' | 'square' | '16/9';
    onViewAll?: () => void;
    viewAllLabel?: string;
    staggerIndex?: number;
}> = ({ title, items, density, onOpenItem, onPlay, onToggleWatched, showProgress = false, aspect, onViewAll, viewAllLabel, staggerIndex = 0 }) => {
    if (!items.length) return null;
    return (
        <div
            className="player-rail-enter flex flex-col gap-2"
            style={{ animationDelay: `${Math.min(Math.max(staggerIndex, 0), 12) * 55}ms` }}
        >
            <DiscoverSectionHeader title={title} onViewAll={onViewAll} viewAllLabel={viewAllLabel} />
            <Carousel>
                {items.map((item, idx) => {
                    const cardAspect = aspect
                        || (item.type === 'artist' || item.type === 'album' ? 'square' : null)
                        || (item.type === 'episode' ? '16/9' : '2/3');
                    const landscape = cardAspect === '16/9';
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
                                aspect={cardAspect}
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
