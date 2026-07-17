import React from 'react';
import {
    Trophy, PlayCircle, Tv, Clapperboard, Clock, Calendar, Layers, PieChart, Compass, Coffee,
    type LucideIcon,
} from 'lucide-react';
import { formatStreamingHour } from './format';
import { portalUrl } from './basePath';

export const periodLabel = (days: number | string) => {
    if (days === 'all') return 'All Time';
    if (days === 7) return 'Last 7 Days';
    if (days === 30) return 'Last 30 Days';
    if (days === 60) return 'Last 60 Days';
    if (days === 90) return 'Last 90 Days';
    if (days === 180) return 'Last 180 Days';
    return `Last ${days} Days`;
};

const FALLBACK_IMAGES = {
    rank: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&q=80&w=600',
    streams: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=600',
    binge: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&q=80&w=600',
    movie: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=600',
    time: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=600',
    day: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&q=80&w=600',
    library: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=600',
    profile: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=600',
    style: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=600',
    habit: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?auto=format&fit=crop&q=80&w=600',
};

export type WrapUpCardDef = {
    metric: string;
    label: string;
    bgImage: string;
    icon: LucideIcon;
    value: React.ReactNode;
    subValue?: React.ReactNode;
    valueClassName?: string;
};

const resolveCardImage = (url: string) => portalUrl(url);

export const buildWrapUpCards = (analytics: any): WrapUpCardDef[] => {
    const dayCounts = Object.values(analytics?.dayOfWeekCounts || {})
        .map((value) => Number(value) || 0)
        .filter((value) => Number.isFinite(value));
    const topDayStreams = dayCounts.length > 0 ? Math.max(...dayCounts) : 0;
    const leaderboardRank = Number(analytics?.leaderboardRank);
    const totalActiveUsers = Number(analytics?.totalActiveUsers) || 0;
    const hasRank = Number.isFinite(leaderboardRank) && leaderboardRank > 0;
    const rankPct = hasRank && totalActiveUsers > 0
        ? Math.max(1, Math.round((leaderboardRank / totalActiveUsers) * 100))
        : null;

    return [
        {
            metric: 'Server Rank',
            label: 'Server Rank',
            bgImage: FALLBACK_IMAGES.rank,
            icon: Trophy,
            valueClassName: 'text-2xl font-black leading-none',
            value: hasRank ? (
                <><span className="text-plex text-xl mr-0.5">#</span>{leaderboardRank}</>
            ) : 'Not ranked yet',
            subValue: rankPct ? `Top ${rankPct}% of users` : undefined,
        },
        {
            metric: 'Total Streams',
            label: 'Total Streams',
            bgImage: FALLBACK_IMAGES.streams,
            icon: PlayCircle,
            valueClassName: 'text-2xl font-black leading-none',
            value: analytics.totalPlays || 0,
            subValue: (
                <span className="flex gap-2 justify-center flex-wrap">
                    <span>🎬 {analytics.moviesCount || 0}</span>
                    <span>📺 {analytics.showsCount || 0}</span>
                    {(analytics.musicCount || 0) > 0 && <span>🎵 {analytics.musicCount}</span>}
                </span>
            ),
        },
        {
            metric: 'Top Binge',
            label: 'Top Binge',
            bgImage: analytics.topBinge?.artUrl || analytics.topBinge?.thumbUrl || FALLBACK_IMAGES.binge,
            icon: Tv,
            valueClassName: 'text-sm font-bold line-clamp-2 leading-tight',
            value: analytics.topBinge?.title || 'Nothing yet',
            subValue: `${analytics.topBinge?.plays || 0} episodes`,
        },
        {
            metric: 'Top Movie',
            label: 'Top Movie',
            bgImage: analytics.topMovie?.artUrl || analytics.topMovie?.thumbUrl || FALLBACK_IMAGES.movie,
            icon: Clapperboard,
            valueClassName: 'text-sm font-bold line-clamp-2 leading-tight',
            value: analytics.topMovie?.title || 'Nothing yet',
            subValue: `${analytics.topMovie?.plays || 0} plays`,
        },
        {
            metric: 'Time of Day',
            label: 'Time of Day',
            bgImage: FALLBACK_IMAGES.time,
            icon: Clock,
            valueClassName: 'text-sm font-bold leading-tight',
            value: analytics.timeOfDay || 'Unknown',
            subValue: `Peak Time: ${formatStreamingHour(analytics.peakHour ?? analytics.avgHour)}`,
        },
        {
            metric: 'Top Day',
            label: 'Top Day',
            bgImage: FALLBACK_IMAGES.day,
            icon: Calendar,
            valueClassName: 'text-sm font-bold leading-tight',
            value: analytics.popularDay || 'Unknown',
            subValue: `${topDayStreams} streams`,
        },
        {
            metric: 'Top Library',
            label: 'Top Library',
            bgImage: FALLBACK_IMAGES.library,
            icon: Layers,
            valueClassName: 'text-sm font-bold line-clamp-2 leading-tight',
            value: analytics.favoriteLibrary || 'None',
            subValue: `${analytics.topLibraries?.[0]?.plays || 0} plays`,
        },
        {
            metric: 'Media Profile',
            label: 'Media Profile',
            bgImage: FALLBACK_IMAGES.profile,
            icon: PieChart,
            valueClassName: 'text-sm font-bold leading-tight',
            value: analytics.mediaPreference || 'Mixed Bag',
            subValue: `Prefers ${analytics.moviesCount > analytics.showsCount ? 'Movies' : 'TV Shows'}`,
        },
        {
            metric: 'Watch Style',
            label: 'Watch Style',
            bgImage: FALLBACK_IMAGES.style,
            icon: Compass,
            valueClassName: 'text-sm font-bold leading-tight',
            value: analytics.watchStyle || 'Unknown',
            subValue: `${analytics.uniqueTitles || 0} unique titles`,
        },
        {
            metric: 'Streaming Habit',
            label: 'Streaming Habit',
            bgImage: FALLBACK_IMAGES.habit,
            icon: Coffee,
            valueClassName: 'text-sm font-bold leading-tight',
            value: analytics.streamingHabit || 'Unknown',
            subValue: `${analytics.weekdayPlays || 0} WD • ${analytics.weekendPlays || 0} WE`,
        },
    ];
};

type WrapUpCardGridProps = {
    analytics: any;
    interactive?: boolean;
    onCardClick?: (metric: string) => void;
    minCardHeight?: number;
    className?: string;
    valueClassName?: string;
    /** Stable layout for html2canvas export — avoids line-clamp/SVG bleed on some browsers */
    variant?: 'default' | 'export';
};

const exportValueClassName = 'text-sm font-bold leading-normal';

const exportSubValue = (card: WrapUpCardDef, analytics: any): React.ReactNode => {
    if (card.metric === 'Total Streams') {
        const parts = [
            `Movies ${analytics.moviesCount || 0}`,
            `TV ${analytics.showsCount || 0}`,
        ];
        if ((analytics.musicCount || 0) > 0) parts.push(`Music ${analytics.musicCount}`);
        return parts.join(' · ');
    }
    return card.subValue;
};

export const WrapUpCardGrid: React.FC<WrapUpCardGridProps> = ({
    analytics,
    interactive = false,
    onCardClick,
    minCardHeight,
    className = '',
    valueClassName: defaultValueClassName = 'text-sm font-bold leading-tight',
    variant = 'default',
}) => {
    const cards = buildWrapUpCards(analytics);
    const isExport = variant === 'export';
    const resolvedMinHeight = minCardHeight ?? (isExport ? 128 : 112);
    const gridClass = isExport
        ? 'grid grid-cols-5 gap-3'
        : `grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 md:gap-3 ${className}`;

    return (
        <div className={gridClass}>
            {cards.map((card) => {
                const Icon = card.icon;
                const valueClass = isExport
                    ? (card.metric === 'Server Rank' || card.metric === 'Total Streams'
                        ? 'text-2xl font-black leading-normal'
                        : exportValueClassName)
                    : (card.valueClassName || defaultValueClassName);
                const subValue = isExport ? exportSubValue(card, analytics) : card.subValue;
                const bgImage = resolveCardImage(card.bgImage);
                return (
                    <div
                        key={card.metric}
                        data-wrap-up-card=""
                        onClick={interactive && onCardClick ? () => onCardClick(card.metric) : undefined}
                        className={`rounded-xl relative border border-border/50 flex flex-col ${isExport ? 'isolate' : 'overflow-hidden'} ${interactive ? 'cursor-pointer hover:ring-2 hover:ring-plex/50 transition-all group' : ''}`}
                        style={{ minHeight: `${resolvedMinHeight}px` }}
                    >
                        {isExport ? (
                            <>
                                <div className="absolute inset-0 z-0 overflow-hidden rounded-xl">
                                    <img
                                        src={bgImage}
                                        alt=""
                                        crossOrigin="anonymous"
                                        className={`absolute inset-0 w-full h-full object-cover opacity-60 ${interactive ? 'transition-transform duration-700 group-hover:scale-110' : ''}`}
                                    />
                                    <div className="absolute inset-0 bg-black/60" />
                                </div>
                                <div className="relative z-10 p-3 md:p-4 flex-1 flex flex-col items-center justify-center text-center">
                                    <div className="mb-2 flex h-6 w-6 flex-shrink-0 items-center justify-center">
                                        <Icon className="h-6 w-6 text-plex" />
                                    </div>
                                    <p className="text-gray-300 text-[10px] uppercase tracking-widest font-bold mb-1">{card.label}</p>
                                    <p
                                        className={`text-white mb-1 w-full px-0.5 overflow-visible ${valueClass}`}
                                        style={{ lineHeight: 1.35, WebkitLineClamp: 'unset' }}
                                    >
                                        {card.value}
                                    </p>
                                    {subValue && (
                                        <p className={`text-[10px] font-bold tracking-wider ${card.metric === 'Top Binge' || card.metric === 'Top Movie' ? 'text-plex' : 'text-gray-400'}`}>{subValue}</p>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <img
                                    key={bgImage}
                                    src={bgImage}
                                    alt=""
                                    className={`absolute inset-0 w-full h-full object-cover z-0 opacity-60 ${interactive ? 'transition-transform duration-700 group-hover:scale-110' : ''}`}
                                />
                                <div className="absolute inset-0 bg-black/60 z-10" />
                                <div className="relative z-20 p-3 md:p-4 flex-1 flex flex-col items-center justify-center text-center">
                                    <Icon className="w-6 h-6 text-plex mb-2 drop-shadow-md flex-shrink-0" />
                                    <p className="text-gray-300 text-[10px] uppercase tracking-widest font-bold mb-1 drop-shadow-md">{card.label}</p>
                                    <p className={`text-white drop-shadow-lg mb-1 ${valueClass}`}>
                                        {card.value}
                                    </p>
                                    {subValue && (
                                        <p className={`text-[10px] font-bold tracking-wider ${card.metric === 'Top Binge' || card.metric === 'Top Movie' ? 'text-plex' : 'text-gray-400'}`}>{subValue}</p>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
