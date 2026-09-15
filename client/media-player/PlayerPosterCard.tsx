import React from 'react';
import { Check, Eye, EyeOff, Play } from 'lucide-react';
import { DiscoverPosterCard, useDiscoverI18n } from './host';
import { progressPercent, toPosterCardItem, unwatchedCount } from './playerUtils';
import type { PlayerItem, PlayerPlayOptions } from './types';

type Props = {
    item: PlayerItem;
    onOpenItem: (item: PlayerItem) => void;
    onPlay?: (item: PlayerItem, opts?: PlayerPlayOptions) => void;
    onToggleWatched?: (item: PlayerItem) => void;
    showProgress?: boolean;
    aspect?: '2/3' | 'square';
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
    const remaining = unwatchedCount(item);
    const showUnwatched = remaining > 0 || (
        !item.watched && progress <= 0 && (item.type === 'movie' || item.type === 'episode')
    );
    const canHoverPlay = !!onPlay && item.canPlay !== false && item.type !== 'collection' && item.type !== 'artist' && item.type !== 'album' && item.type !== 'playlist';
    const canToggleWatched = !!onToggleWatched && (item.type === 'movie' || item.type === 'episode' || item.type === 'show' || item.type === 'season');
    return (
        <DiscoverPosterCard
            className={className}
            item={toPosterCardItem(item)}
            aspect={aspect || (item.type === 'artist' || item.type === 'album' ? 'square' : '2/3')}
            showQualityBadges={false}
            onPosterClick={() => onOpenItem(item)}
            overlay={(
                <>
                    {showUnwatched ? (
                        <div className="absolute left-1.5 top-1.5 z-10 max-w-[calc(100%-0.75rem)] rounded-md bg-plex px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-black shadow-lg">
                            {remaining > 0
                                ? t('mediaPlayerPage.unwatchedCount', { count: remaining })
                                : t('mediaPlayerPage.unwatched')}
                        </div>
                    ) : null}
                    {item.watched && remaining <= 0 ? (
                        <div className="absolute right-1.5 top-1.5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-plex text-black shadow-lg ring-2 ring-black/40">
                            <Check className="h-3.5 w-3.5" />
                        </div>
                    ) : null}
                    {progress > 0 ? (
                        <div className="absolute inset-x-0 bottom-0 z-10 h-1.5 bg-black/70">
                            <div className="h-full bg-plex" style={{ width: `${progress}%` }} />
                        </div>
                    ) : null}
                    {canHoverPlay || canToggleWatched ? (
                        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                            {canHoverPlay ? (
                                <span
                                    role="button"
                                    tabIndex={-1}
                                    aria-label={t('mediaPlayerPage.play')}
                                    className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-plex text-black shadow-lg"
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
