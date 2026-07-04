import React from 'react';
import { discoverPosterGridClass } from './portalLayout';

const pulse = 'animate-pulse bg-white/10';

export const SkeletonBlock: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`${pulse} rounded ${className}`} aria-hidden="true" />
);

export const PosterCardSkeleton: React.FC<{
    aspect?: '2/3' | 'square';
    variant?: 'home' | 'discover';
    className?: string;
}> = ({ aspect = '2/3', variant = 'discover', className = '' }) => (
    <div className={`flex flex-col gap-2 ${className}`} aria-hidden="true">
        <SkeletonBlock className={`w-full rounded-xl border border-white/5 ${aspect === 'square' ? 'aspect-square' : 'aspect-[2/3]'}`} />
        <SkeletonBlock className={`h-3 rounded ${variant === 'home' ? 'w-3/4' : 'w-full'}`} />
        {variant === 'home' && <SkeletonBlock className="h-2 w-1/3 rounded" />}
    </div>
);

export const PosterGridSkeleton: React.FC<{ count?: number; aspect?: '2/3' | 'square' }> = ({ count = 20, aspect = '2/3' }) => (
    <div className={discoverPosterGridClass} aria-hidden="true">
        {Array.from({ length: count }, (_, i) => (
            <PosterCardSkeleton key={i} aspect={aspect} variant="discover" />
        ))}
    </div>
);

export const PosterRowSkeleton: React.FC<{ count?: number; aspect?: '2/3' | 'square' }> = ({ count = 6, aspect = '2/3' }) => (
    <div className="flex overflow-x-auto gap-4 pb-4 snap-x hide-scrollbar" aria-hidden="true">
        {Array.from({ length: count }, (_, i) => (
            <PosterCardSkeleton key={i} aspect={aspect} variant="home" className="snap-start shrink-0 w-32 md:w-40" />
        ))}
    </div>
);

export const HomeRecentlyAddedSkeleton: React.FC = () => (
    <div className="flex flex-col gap-3 md:gap-4 w-full" aria-busy="true" aria-label="Loading recently added">
        <div className="glass-card p-4 md:p-5 shadow-xl overflow-hidden w-full">
            <h3 className="text-lg md:text-xl font-bold text-text mb-3">Recently Added Movies</h3>
            <PosterRowSkeleton count={6} />
        </div>
        <div className="glass-card p-4 md:p-5 shadow-xl overflow-hidden w-full">
            <h3 className="text-lg md:text-xl font-bold text-text mb-3">Recently Added TV Shows</h3>
            <PosterRowSkeleton count={6} />
        </div>
        <div className="glass-card p-4 md:p-5 shadow-xl overflow-hidden w-full">
            <h3 className="text-lg md:text-xl font-bold text-text mb-3">Recently Added Music</h3>
            <PosterRowSkeleton count={6} aspect="square" />
        </div>
    </div>
);

export const DiscoverSectionSkeleton: React.FC<{ title: string; count?: number; aspect?: '2/3' | 'square' }> = ({ title, count = 12, aspect = '2/3' }) => (
    <div className="flex flex-col" aria-hidden="true">
        <h2 className="text-plex text-sm uppercase tracking-[2px] mb-6 font-bold border-b border-white/10 pb-2">{title}</h2>
        <PosterGridSkeleton count={count} aspect={aspect} />
    </div>
);

export const DiscoverPageSkeleton: React.FC<{ recentLimit?: number; wideLayout?: boolean }> = ({ recentLimit = 20, wideLayout = false }) => {
    const count = recentLimit;
    return (
        <div className="w-full flex flex-col min-h-screen" aria-busy="true" aria-label="Loading discover">
            <main className="discover-layout-container w-full pb-8 mt-4 md:mt-0">
                <section className="mb-12 w-full">
                    <h2 className="text-plex text-sm uppercase tracking-[2px] mb-6 font-bold border-b border-white/10 pb-2">ACTIVITY</h2>
                    <ActivityGridSkeleton count={wideLayout ? 4 : 3} wideLayout={wideLayout} />
                </section>

                <div className="flex justify-end gap-4 items-center mb-8">
                    <SkeletonBlock className="h-4 w-36 rounded" />
                    <SkeletonBlock className="h-10 w-32 rounded-lg" />
                </div>

                <div className="flex flex-col gap-12 w-full">
                    <DiscoverSectionSkeleton title="RECENTLY ADDED MOVIES" count={count} />
                    <DiscoverSectionSkeleton title="RECENTLY ADDED TV SHOWS" count={count} />
                    <DiscoverSectionSkeleton title="RECENTLY ADDED MUSIC" count={count} aspect="square" />
                </div>

                <div className="mt-16 w-full flex flex-col gap-12">
                    <div className="flex flex-col gap-2 items-center text-center mb-4">
                        <SkeletonBlock className="h-10 w-72 max-w-full rounded" />
                        <SkeletonBlock className="h-4 w-96 max-w-full rounded" />
                    </div>
                    <DiscoverSectionSkeleton title="🔥 TRENDING THIS WEEK" count={count} />
                    <DiscoverSectionSkeleton title="🍿 MOST WATCHED MOVIES (THIS MONTH)" count={count} />
                    <DiscoverSectionSkeleton title="📺 MOST WATCHED SHOWS (THIS MONTH)" count={count} />
                </div>
            </main>
        </div>
    );
};

export const LibraryStatsSkeleton: React.FC = () => (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" aria-hidden="true">
        {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="bg-background/60 p-4 rounded-2xl border border-white/5 flex flex-col items-center gap-3">
                <SkeletonBlock className="w-7 h-7 rounded" />
                <SkeletonBlock className="h-8 w-20 rounded" />
                <SkeletonBlock className="h-3 w-24 rounded" />
            </div>
        ))}
    </div>
);

export const WrapUpCardsSkeleton: React.FC = () => (
    <div className="glass-card p-4 md:p-5 shadow-xl" aria-busy="true" aria-label="Loading personal wrap-up">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 md:mb-4">
            <SkeletonBlock className="h-6 w-48 rounded" />
            <SkeletonBlock className="h-9 w-32 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 md:gap-3" aria-hidden="true">
            {Array.from({ length: 10 }, (_, i) => (
                <SkeletonBlock key={i} className="rounded-xl min-h-[112px]" />
            ))}
        </div>
    </div>
);

export const ActivityCardSkeleton: React.FC = () => (
    <div className="bg-card rounded-xl border border-border flex flex-col overflow-hidden shadow-lg h-full min-h-[11.5rem] md:min-h-[14.5rem]" aria-hidden="true">
        <div className="flex flex-row flex-1 items-stretch min-h-0">
            <SkeletonBlock className="w-32 md:w-40 flex-shrink-0 self-stretch rounded-none min-h-[11.5rem] md:min-h-[14.5rem]" />
            <div className="p-4 flex flex-col flex-1 gap-3 min-w-0">
            <SkeletonBlock className="h-4 w-3/4 rounded" />
            <SkeletonBlock className="h-3 w-1/2 rounded" />
            <div className="flex gap-2 mt-1">
                <SkeletonBlock className="h-4 w-12 rounded" />
                <SkeletonBlock className="h-4 w-12 rounded" />
            </div>
            <div className="flex flex-col gap-2 mt-auto pt-2">
                <SkeletonBlock className="h-3 w-full rounded" />
                <SkeletonBlock className="h-3 w-4/5 rounded" />
                <SkeletonBlock className="h-3 w-3/5 rounded" />
            </div>
        </div>
        </div>
        <SkeletonBlock className="h-4 w-full rounded-none" />
    </div>
);

export const ActivityGridSkeleton: React.FC<{ count?: number; wideLayout?: boolean }> = ({ count = 3, wideLayout = false }) => (
    <div className={wideLayout && count >= 4 ? 'discover-activity-grid discover-activity-grid--quad' : 'discover-activity-grid'} aria-hidden="true">
        {Array.from({ length: count }, (_, i) => (
            <ActivityCardSkeleton key={i} />
        ))}
    </div>
);

export const TopWatchedGridSkeleton: React.FC = () => (
    <div className="glass-card flex-1 flex flex-col h-full w-full min-h-0 p-4 md:p-5 shadow-xl" aria-busy="true" aria-label="Loading analytics">
        <div className="mb-3 md:mb-4">
            <SkeletonBlock className="h-6 w-40 rounded mb-2" />
            <SkeletonBlock className="h-4 w-56 rounded" />
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 md:gap-3.5 flex-1 content-start" aria-hidden="true">
            {Array.from({ length: 18 }, (_, i) => (
                <div key={i} className="flex flex-col gap-1.5">
                    <SkeletonBlock className="aspect-[2/3] w-full rounded-lg" />
                    <SkeletonBlock className="h-2.5 w-full rounded" />
                </div>
            ))}
        </div>
    </div>
);

export const TrendingSectionsSkeleton: React.FC<{ count?: number; sections?: number }> = ({ count = 20, sections = 3 }) => (
    <div className="mt-16 w-full flex flex-col gap-12" aria-busy="true" aria-label="Loading trending">
        <div className="flex flex-col gap-2 items-center text-center mb-4">
            <SkeletonBlock className="h-10 w-72 max-w-full rounded" />
            <SkeletonBlock className="h-4 w-96 max-w-full rounded" />
        </div>
        {Array.from({ length: sections }, (_, i) => (
            <div key={i} className="flex flex-col" aria-hidden="true">
                <SkeletonBlock className="h-4 w-56 mb-6 rounded" />
                <PosterGridSkeleton count={count} />
            </div>
        ))}
    </div>
);
