import React from 'react';
import {
    Trophy, PlayCircle, Tv, Clapperboard, Clock, Calendar, Layers, PieChart, Compass, Coffee,
    type LucideIcon,
} from 'lucide-react';

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

export const buildWrapUpCards = (analytics: any): WrapUpCardDef[] => {
    const topDayStreams = analytics.dayOfWeekCounts
        ? Math.max(...Object.values(analytics.dayOfWeekCounts) as number[])
        : 0;
    const rankPct = analytics.leaderboardRank && analytics.totalActiveUsers > 0
        ? Math.max(1, Math.round((analytics.leaderboardRank / analytics.totalActiveUsers) * 100))
        : null;

    return [
        {
            metric: 'Server Rank',
            label: 'Server Rank',
            bgImage: FALLBACK_IMAGES.rank,
            icon: Trophy,
            valueClassName: 'text-2xl font-black leading-none',
            value: analytics.leaderboardRank ? (
                <><span className="text-plex text-xl mr-0.5">#</span>{analytics.leaderboardRank}</>
            ) : 'Unranked',
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
            bgImage: analytics.topBinge?.artUrl || FALLBACK_IMAGES.binge,
            icon: Tv,
            valueClassName: 'text-sm font-bold line-clamp-2 leading-tight',
            value: analytics.topBinge?.title || 'Nothing yet',
            subValue: `${analytics.topBinge?.plays || 0} episodes`,
        },
        {
            metric: 'Top Movie',
            label: 'Top Movie',
            bgImage: analytics.topMovie?.artUrl || FALLBACK_IMAGES.movie,
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
            subValue: `Avg Time: ${analytics.avgHour ? `${Math.round(analytics.avgHour)}:00` : 'Unknown'}`,
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
            metric: 'Media Profile',
            label: 'Top Library',
            bgImage: FALLBACK_IMAGES.library,
            icon: Layers,
            valueClassName: 'text-sm font-bold line-clamp-2 leading-tight',
            value: analytics.favoriteLibrary || 'None',
            subValue: `${analytics.topLibraries?.[0]?.plays || 0} plays`,
        },
        {
            metric: 'Top Library',
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
};

export const WrapUpCardGrid: React.FC<WrapUpCardGridProps> = ({
    analytics,
    interactive = false,
    onCardClick,
    minCardHeight = 112,
    className = '',
    valueClassName: defaultValueClassName = 'text-sm font-bold leading-tight',
}) => {
    const cards = buildWrapUpCards(analytics);

    return (
        <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 md:gap-3 ${className}`}>
            {cards.map((card) => {
                const Icon = card.icon;
                const valueClass = card.valueClassName || defaultValueClassName;
                return (
                    <div
                        key={card.metric}
                        onClick={interactive && onCardClick ? () => onCardClick(card.metric) : undefined}
                        className={`rounded-xl overflow-hidden relative border border-border/50 flex flex-col ${interactive ? 'cursor-pointer hover:ring-2 hover:ring-plex/50 transition-all group' : ''}`}
                        style={{ minHeight: `${minCardHeight}px` }}
                    >
                        <img
                            src={card.bgImage}
                            alt=""
                            crossOrigin="anonymous"
                            className={`absolute inset-0 w-full h-full object-cover z-0 opacity-60 ${interactive ? 'transition-transform duration-700 group-hover:scale-110' : ''}`}
                        />
                        <div className="absolute inset-0 bg-black/60 z-10" />
                        <div className="relative z-20 p-3 md:p-4 flex-1 flex flex-col items-center justify-center text-center">
                            <Icon className="w-6 h-6 text-plex mb-2 drop-shadow-md flex-shrink-0" />
                            <p className="text-gray-300 text-[10px] uppercase tracking-widest font-bold mb-1 drop-shadow-md">{card.label}</p>
                            <p className={`text-white drop-shadow-lg mb-1 ${valueClass}`}>
                                {card.value}
                            </p>
                            {card.subValue && (
                                <p className={`text-[10px] font-bold tracking-wider ${card.metric === 'Top Binge' || card.metric === 'Top Movie' ? 'text-plex' : 'text-gray-400'}`}>{card.subValue}</p>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
