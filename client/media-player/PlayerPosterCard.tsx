import React from 'react';
import { Eye, EyeOff, Play } from 'lucide-react';
import { DiscoverPosterCard, useDiscoverI18n } from './host';
import { formatEpisodeCode, progressPercent, toPosterCardItem } from './playerUtils';
import type { PlayerItem, PlayerPlayOptions } from './types';

type Props = {
    item: PlayerItem;
    onOpenItem: (item: PlayerItem) => void;
    onPlay?: (item: PlayerItem, opts?: PlayerPlayOptions) => void;
    onToggleWatched?: (item: PlayerItem) => void;
    showProgress?: boolean;
    aspect?: '2/3' | 'square' | '16/9';
    className?: string;
};

export const PlayerPosterCard: React.FC<Props> = ({
    item,
    onOpenItem,
    onPlay,
    onToggleWatched,
    showProgress = false,
    aspect,
    className,
}) => {
    const { t } = useDiscoverI18n();
    const progress = progressPercent(item);
    const canHoverPlay = !!onPlay && item.canPlay !== false && item.type !== 'collection' && item.type !== 'artist' && item.type !== 'album' && item.type !== 'playlist';
    const canToggleWatched = !!onToggleWatched && (item.type === 'movie' || item.type === 'episode' || item.type === 'show' || item.type === 'season');
    const resolvedAspect = aspect
        || (item.type === 'artist' || item.type === 'album' ? 'square' : null)
        || (item.type === 'episode' ? '16/9' : '2/3');
    const episodeCode = formatEpisodeCode(item);
    return (
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
                    {progress > 0 ? (
                        <div className="absolute inset-x-0 bottom-0 z-10 h-1.5 bg-black/70">
                            <div className="h-full bg-plex" style={{ width: `${progress}%` }} />
                        </div>
                    ) : null}
                    {canHoverPlay || canToggleWatched ? (
                        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                            {canHoverPlay ? (
                                <span
                                    role="button"
                                    tabIndex={-1}
                                    aria-label={t('mediaPlayerPage.play')}
                                    className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-plex text-black shadow-lg transition duration-200 group-hover:scale-105"
                                    onClick={(event) => {
                                        event.preventDefault();
                                        event.stopPropagation();
                                        onPlay?.(item);
                                    }}
                                >
                                    <Play className="h-5 w-5 fill-current" />
                                </span>
                            ) : null}
                            {canToggleWatched ? (
                                <button
                                    type="button"
                                    aria-label={item.watched ? t('mediaPlayerPage.markUnwatched') : t('mediaPlayerPage.markWatched')}
                                    className="pointer-events-auto absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black"
                                    onClick={(event) => {
                                        event.preventDefault();
                                        event.stopPropagation();
                                        onToggleWatched?.(item);
                                    }}
                                >
                                    {item.watched ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            ) : null}
                        </div>
                    ) : null}
                </>
            )}
        />
    );
};
