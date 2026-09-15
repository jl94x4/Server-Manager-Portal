import React from 'react';
import { Play } from 'lucide-react';
import { DiscoverPosterCard } from '../screens';
import { progressPercent, toPosterCardItem } from './playerUtils';
import type { PlayerItem } from './types';

type Props = {
    item: PlayerItem;
    onOpenItem: (item: PlayerItem) => void;
    onPlay?: (item: PlayerItem) => void;
    showProgress?: boolean;
    aspect?: '2/3' | 'square';
    className?: string;
};

export const PlayerPosterCard: React.FC<Props> = ({
    item,
    onOpenItem,
    onPlay,
    showProgress = false,
    aspect,
    className,
}) => {
    const progress = showProgress ? progressPercent(item) : 0;
    const canHoverPlay = !!onPlay && item.canPlay !== false && item.type !== 'collection' && item.type !== 'artist' && item.type !== 'album';
    return (
        <DiscoverPosterCard
            className={className}
            item={toPosterCardItem(item)}
            aspect={aspect || (item.type === 'artist' || item.type === 'album' ? 'square' : '2/3')}
            showQualityBadges={false}
            onPosterClick={() => onOpenItem(item)}
            overlay={(
                <>
                    {progress > 0 ? (
                        <div className="absolute inset-x-0 bottom-0 z-10 h-1 bg-black/50">
                            <div className="h-full bg-plex" style={{ width: `${progress}%` }} />
                        </div>
                    ) : null}
                    {canHoverPlay ? (
                        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                            <span
                                role="button"
                                tabIndex={-1}
                                aria-label="Play"
                                className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-plex text-black shadow-lg"
                                onClick={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    onPlay?.(item);
                                }}
                            >
                                <Play className="h-5 w-5 fill-current" />
                            </span>
                        </div>
                    ) : null}
                </>
            )}
        />
    );
};
