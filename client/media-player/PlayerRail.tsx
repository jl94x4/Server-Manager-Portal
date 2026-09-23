import React, { useEffect } from 'react';
import { Carousel, DiscoverSectionHeader, discoverRowCardWidthClass, posterGridCardWidthStyle, posterGridScaleRem } from './host';
import { PlayerPosterCard } from './PlayerPosterCard';
import { playerCardImageUrl, prefetchPlayerImages } from './playerUtils';
import type { PlayerItem, PlayerPlayOptions } from './types';

export const PlayerRail: React.FC<{
    title: string;
    items: PlayerItem[];
    density: number;
    onOpenItem: (item: PlayerItem) => void;
    onPlay: (item: PlayerItem, opts?: PlayerPlayOptions) => void;
    onToggleWatched?: (item: PlayerItem) => void;
    onPlayNext?: (item: PlayerItem) => void;
    onWatchedChange?: (item: PlayerItem, watched: boolean) => void;
    onRemovedFromContinueWatching?: (item: PlayerItem) => void;
    onDeleted?: (item: PlayerItem) => void;
    onToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
    showProgress?: boolean;
    showRemoveFromContinueWatching?: boolean;
    isAdmin?: boolean;
    playlistsEnabled?: boolean;
    /** Force card shape. Continue Watching should stay poster (`2/3`). */
    aspect?: '2/3' | 'square' | '16/9';
    onViewAll?: () => void;
    viewAllLabel?: string;
    staggerIndex?: number;
}> = ({
    title,
    items,
    density,
    onOpenItem,
    onPlay,
    onToggleWatched,
    onPlayNext,
    onWatchedChange,
    onRemovedFromContinueWatching,
    onDeleted,
    onToast,
    showProgress = false,
    showRemoveFromContinueWatching = false,
    isAdmin = false,
    playlistsEnabled = true,
    aspect,
    onViewAll,
    viewAllLabel,
    staggerIndex = 0,
}) => {
    useEffect(() => {
        const urls = items.slice(0, 8).map((item) => {
            const cardAspect = aspect
                || item.cardAspect
                || (item.type === 'artist' || item.type === 'album' ? 'square' : null)
                || (item.type === 'episode' ? '16/9' : '2/3');
            return playerCardImageUrl(item.thumb, cardAspect || '2/3');
        });
        prefetchPlayerImages(urls, staggerIndex === 0 ? 8 : 4);
    }, [aspect, items, staggerIndex]);

    if (!items.length) return null;
    return (
        <div
            data-tv-row="1"
            className="player-rail-enter flex flex-col gap-2"
            style={{ animationDelay: `${Math.min(Math.max(staggerIndex, 0), 12) * 55}ms` }}
        >
            <DiscoverSectionHeader title={title} onViewAll={onViewAll} viewAllLabel={viewAllLabel} />
            <Carousel posterRow>
                {items.map((item, idx) => {
                    const cardAspect = aspect
                        || item.cardAspect
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
                                imagePriority={idx < (staggerIndex === 0 ? 8 : 4)}
                                showProgress={showProgress}
                                showRemoveFromContinueWatching={showRemoveFromContinueWatching}
                                isAdmin={isAdmin}
                                playlistsEnabled={playlistsEnabled}
                                onOpenItem={onOpenItem}
                                onPlay={onPlay}
                                onToggleWatched={onToggleWatched}
                                onPlayNext={onPlayNext}
                                onWatchedChange={onWatchedChange}
                                onRemovedFromContinueWatching={onRemovedFromContinueWatching}
                                onDeleted={onDeleted}
                                onToast={onToast}
                            />
                        </div>
                    );
                })}
            </Carousel>
        </div>
    );
};
