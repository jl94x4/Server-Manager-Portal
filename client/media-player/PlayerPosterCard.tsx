import React, { useRef } from 'react';
import { Check, Eye, Play } from 'lucide-react';
import { DiscoverPosterCard, useDiscoverI18n } from './host';
import { PlayerItemMenu, type PlayerItemMenuHandle } from './PlayerItemMenu';
import { formatEpisodeCode, progressPercent, toPosterCardItem } from './playerUtils';
import type { PlayerItem, PlayerPlayOptions } from './types';

type Props = {
    item: PlayerItem;
    onOpenItem: (item: PlayerItem) => void;
    onPlay?: (item: PlayerItem, opts?: PlayerPlayOptions) => void;
    onToggleWatched?: (item: PlayerItem) => void;
    onPlayNext?: (item: PlayerItem) => void;
    onWatchedChange?: (item: PlayerItem, watched: boolean) => void;
    onRemovedFromContinueWatching?: (item: PlayerItem) => void;
    onDeleted?: (item: PlayerItem) => void;
    onToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
    showProgress?: boolean;
    showMenu?: boolean;
    showRemoveFromContinueWatching?: boolean;
    isAdmin?: boolean;
    playlistsEnabled?: boolean;
    aspect?: '2/3' | 'square' | '16/9';
    className?: string;
};

export const PlayerPosterCard: React.FC<Props> = ({
    item,
    onOpenItem,
    onPlay,
    onToggleWatched,
    onPlayNext,
    onWatchedChange,
    onRemovedFromContinueWatching,
    onDeleted,
    onToast,
    showProgress = false,
    showMenu = true,
    showRemoveFromContinueWatching = false,
    isAdmin = false,
    playlistsEnabled = true,
    aspect,
    className,
}) => {
    const { t } = useDiscoverI18n();
    const menuRef = useRef<PlayerItemMenuHandle | null>(null);
    const longPressRef = useRef<number | null>(null);
    const progress = progressPercent(item);
    const canHoverPlay = !!onPlay && item.canPlay !== false && item.type !== 'collection' && item.type !== 'artist' && item.type !== 'album' && item.type !== 'playlist';
    const canToggleWatched = !!onToggleWatched && (item.type === 'movie' || item.type === 'episode' || item.type === 'show' || item.type === 'season');
    const resolvedAspect = aspect
        || (item.type === 'artist' || item.type === 'album' ? 'square' : null)
        || (item.type === 'episode' ? '16/9' : '2/3');
    const episodeCode = formatEpisodeCode(item);
    const menuEnabled = showMenu && item.type !== 'collection' && item.type !== 'artist' && item.type !== 'album' && item.type !== 'playlist';

    return (
        <div
            className="relative"
            onContextMenu={(event) => {
                if (!menuEnabled) return;
                event.preventDefault();
                event.stopPropagation();
                menuRef.current?.openAt(event.clientX, event.clientY);
            }}
            onTouchStart={(event) => {
                if (!menuEnabled) return;
                const touch = event.touches[0];
                if (!touch) return;
                if (longPressRef.current) window.clearTimeout(longPressRef.current);
                longPressRef.current = window.setTimeout(() => {
                    menuRef.current?.openAt(touch.clientX, touch.clientY);
                }, 480);
            }}
            onTouchEnd={() => {
                if (longPressRef.current) window.clearTimeout(longPressRef.current);
                longPressRef.current = null;
            }}
            onTouchMove={() => {
                if (longPressRef.current) window.clearTimeout(longPressRef.current);
                longPressRef.current = null;
            }}
        >
            <DiscoverPosterCard
                className={className}
                item={toPosterCardItem(item)}
                aspect={resolvedAspect}
                posterWidth={resolvedAspect === '16/9' ? 640 : 300}
                posterHeight={resolvedAspect === '16/9' ? 360 : undefined}
                footer={item.type === 'episode' ? (
                    <div className="px-1 text-left">
                        <div className="text-xs font-medium line-clamp-2 leading-tight text-text">{item.title}</div>
                        <div className="mt-0.5 truncate text-[11px] text-muted">
                            {[item.showTitle, episodeCode].filter(Boolean).join(' · ')}
                        </div>
                    </div>
                ) : undefined}
                showQualityBadges={false}
                onPosterClick={() => onOpenItem(item)}
                overlay={(
                    <>
                        {progress > 0 || showProgress ? (
                            progress > 0 ? (
                                <div className="absolute inset-x-0 bottom-0 z-10 h-1.5 bg-black/70">
                                    <div className="h-full bg-plex" style={{ width: `${progress}%` }} />
                                </div>
                            ) : null
                        ) : null}
                        {item.watched ? (
                            canToggleWatched ? (
                                <button
                                    type="button"
                                    aria-label={t('mediaPlayerPage.markUnwatched')}
                                    title={t('mediaPlayerPage.watched')}
                                    className="absolute right-1.5 top-1.5 z-30 flex h-8 w-8 items-center justify-center rounded-full bg-plex text-zinc-950 shadow-md"
                                    onClick={(event) => {
                                        event.preventDefault();
                                        event.stopPropagation();
                                        onToggleWatched?.(item);
                                    }}
                                >
                                    <Check className="h-4 w-4 stroke-[2.5]" />
                                </button>
                            ) : (
                                <span
                                    title={t('mediaPlayerPage.watched')}
                                    className="absolute right-1.5 top-1.5 z-30 flex h-8 w-8 items-center justify-center rounded-full bg-plex text-zinc-950 shadow-md"
                                >
                                    <Check className="h-4 w-4 stroke-[2.5]" />
                                </span>
                            )
                        ) : null}
                        {canHoverPlay || canToggleWatched || menuEnabled ? (
                            <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100 max-md:opacity-100 max-md:bg-transparent max-md:group-hover:bg-black/40">
                                {canHoverPlay ? (
                                    <span
                                        role="button"
                                        tabIndex={-1}
                                        aria-label={t('mediaPlayerPage.play')}
                                        className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-plex text-black shadow-lg transition duration-200 group-hover:scale-105 max-md:opacity-0 max-md:group-hover:opacity-100"
                                        onClick={(event) => {
                                            event.preventDefault();
                                            event.stopPropagation();
                                            onPlay?.(item);
                                        }}
                                    >
                                        <Play className="h-5 w-5 fill-current" />
                                    </span>
                                ) : null}
                                {!item.watched && canToggleWatched ? (
                                    <button
                                        type="button"
                                        aria-label={t('mediaPlayerPage.markWatched')}
                                        className="pointer-events-auto absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black"
                                        onClick={(event) => {
                                            event.preventDefault();
                                            event.stopPropagation();
                                            onToggleWatched?.(item);
                                        }}
                                    >
                                        <Eye className="h-4 w-4" />
                                    </button>
                                ) : null}
                                {menuEnabled ? (
                                    <PlayerItemMenu
                                        ref={menuRef}
                                        item={item}
                                        isAdmin={isAdmin}
                                        playlistsEnabled={playlistsEnabled}
                                        showRemoveFromContinueWatching={showRemoveFromContinueWatching || progress > 0}
                                        onPlayNext={onPlayNext}
                                        onWatchedChange={onWatchedChange}
                                        onRemovedFromContinueWatching={onRemovedFromContinueWatching}
                                        onDeleted={onDeleted}
                                        onToast={onToast}
                                    />
                                ) : null}
                            </div>
                        ) : null}
                    </>
                )}
            />
        </div>
    );
};
