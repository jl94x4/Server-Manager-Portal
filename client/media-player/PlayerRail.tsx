import React from 'react';
import { Carousel } from '../discovery/Carousel';
import { DiscoverSectionHeader } from '../discovery/DiscoverSectionHeader';
import { discoverRowCardWidthClass, posterGridCardWidthStyle } from '../shared/portalLayout';
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
}> = ({ title, items, density, onOpenItem, onPlay, onToggleWatched, showProgress = false }) => {
    if (!items.length) return null;
    return (
        <div className="flex flex-col gap-2">
            <DiscoverSectionHeader title={title} />
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
