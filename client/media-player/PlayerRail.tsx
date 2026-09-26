import React, { useEffect } from 'react';
import { Carousel, DiscoverSectionHeader, discoverRowCardWidthClass, posterGridCardWidthStyle, posterGridScaleRem, useDiscoverI18n } from './host';
import { PlayerPosterCard } from './PlayerPosterCard';
import { PlayerViewMoreCard } from './PlayerViewMoreCard';
import { playerCardImageUrl, prefetchPlayerImages } from './playerUtils';
import type { PlayerItem, PlayerPlayOptions } from './types';

const isTvShell = () => {
    try {
        return document.documentElement?.dataset?.tv === '1'
            || window.__PLEX_CLIENT__?.isTv === true;
    } catch {
        return false;
    }
};

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
    const { t } = useDiscoverI18n();
    const tvShell = isTvShell();
    const moreLabel = t('common.viewMore');
    const eagerCount = tvShell ? 16 : (staggerIndex === 0 ? 8 : 4);
    useEffect(() => {
        if (tvShell) return;
        const urls = items.slice(eagerCount, eagerCount + 8).map((item) => {
            const cardAspect = aspect
                || item.cardAspect
                || (item.type === 'artist' || item.type === 'album' ? 'square' : null)
                || (item.type === 'episode' ? '16/9' : '2/3');
            return playerCardImageUrl(item.thumb, cardAspect || '2/3');
        });
        prefetchPlayerImages(urls, 8);
    }, [aspect, eagerCount, items, staggerIndex, tvShell]);

    if (!items.length) return null;
    return (
        <div
            data-tv-row="1"
            className="player-rail-enter flex min-w-0 max-w-full flex-col gap-2"
            style={{ animationDelay: `${Math.min(Math.max(staggerIndex, 0), 12) * 55}ms` }}
        >
            <DiscoverSectionHeader
                title={title}
                onViewAll={tvShell ? undefined : onViewAll}
                viewAllLabel={tvShell ? undefined : viewAllLabel}
            />
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
                                imagePriority={idx < eagerCount}
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
                {tvShell && onViewAll ? (
                    <div
                        className={`${aspect === '16/9' ? '' : discoverRowCardWidthClass(density)} relative z-0 flex-shrink-0 snap-start`}
                        style={aspect === '16/9'
                            ? { width: `${posterGridScaleRem(density) * 1.85}rem` }
                            : posterGridCardWidthStyle(density)}
                    >
                        <PlayerViewMoreCard
                            label={moreLabel.startsWith('common.') ? 'View More' : moreLabel}
                            title={title}
                            aspect={aspect === 'square' || aspect === '16/9' ? aspect : '2/3'}
                            onClick={onViewAll}
                        />
                    </div>
                ) : null}
            </Carousel>
        </div>
    );
};
