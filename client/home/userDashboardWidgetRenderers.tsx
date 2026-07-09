import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Activity,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Film,
    Layers,
    Music,
    Settings,
    Shield,
    Star,
    Tv,
    Users,
} from 'lucide-react';
import { getPublicOrigin } from '../shared/basePath';
import type { MainGridWidgetId, RecentlyAddedWidgetId } from '../shared/dashboardLayout';
import { LibraryStatsSkeleton } from '../shared/skeletons';
import { PeriodDropdown } from '../shared/PeriodDropdown';
import { ScrollReveal } from '../shared/ui';
import { PendingRequestsHomeWidget } from '../requests/PendingRequestsHomeWidget';

type PosterCardProps = {
    item: { title: string; thumb?: string; plexUrl: string; tags?: string[]; year?: number | string; parentTitle?: string };
    aspect?: '2/3' | 'square';
    variant?: 'discover' | 'home';
    className?: string;
    footer?: React.ReactNode;
    showQualityBadges?: boolean;
};

export type UserDashboardWidgetDeps = {
    sessionInfo: any;
    publicConfig?: any;
    user: any;
    isRevoked: boolean;
    isExpiringSoon: boolean;
    daysLeft: number | null;
    progressPct: number;
    optOutNewsletter: boolean;
    serverStats: any;
    serverDataLoading: boolean;
    analytics: any;
    analyticsLoading: boolean;
    analyticsDays: number | 'all';
    analyticsDaysOpen: boolean;
    setAnalyticsDays: (days: number | 'all') => void;
    setAnalyticsDaysOpen: (open: boolean) => void;
    showQualityBadges: boolean;
    dashboardData: any;
    handleRelink: () => void;
    handleToggleNewsletter: () => void;
    onViewAdmin: () => void;
    onViewSettings?: () => void;
    onViewLogs?: () => void;
    onViewRequests?: () => void;
    onPendingRequestsChange?: () => void;
    setToast: (toast: { id: number; message: string; type: 'success' | 'error' }) => void;
    DiscoverPosterCard: React.ComponentType<PosterCardProps>;
    RebuildLibraryCacheButton: React.ComponentType;
};

const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/** Trial flag can linger after admin extends access — only treat as temp access while ≤3 days remain. */
const isActiveShortTermTrial = (user: any, daysLeft: number | null) => (
    !!user?.isTrial && daysLeft !== null && daysLeft <= 3
);

export const createMainGridWidgetRenderer = (deps: UserDashboardWidgetDeps) => {
    const {
        sessionInfo,
        publicConfig,
        user,
        isRevoked,
        isExpiringSoon,
        daysLeft,
        progressPct,
        optOutNewsletter,
        serverStats,
        serverDataLoading,
        analytics,
        analyticsLoading,
        analyticsDays,
        analyticsDaysOpen,
        setAnalyticsDays,
        setAnalyticsDaysOpen,
        handleRelink,
        handleToggleNewsletter,
        onViewAdmin,
        onViewSettings,
        onViewLogs,
        onViewRequests,
        onPendingRequestsChange,
        setToast,
        RebuildLibraryCacheButton,
    } = deps;

    const analyticsDaysOptions = [
        { value: 7, label: 'Last 7 Days' },
        { value: 30, label: 'Last 30 Days' },
        { value: 60, label: 'Last 60 Days' },
        { value: 90, label: 'Last 90 Days' },
        { value: 180, label: 'Last 180 Days' },
        { value: 'all' as const, label: 'All Time' },
    ];
    const isJellyfinPortal = String(publicConfig?.mediaServerType || 'plex').toLowerCase() === 'jellyfin';

    return (id: MainGridWidgetId): React.ReactNode => {
        switch (id) {
            case 'adminBadge':
                return (
                    <div className="glass-card p-4 md:p-5 shadow-xl flex flex-col items-center justify-center text-center flex-shrink-0">
                        <div className="w-14 h-14 md:w-16 md:h-16 bg-plex/10 rounded-full flex items-center justify-center mb-2 md:mb-3 border border-plex/30 shadow-[0_0_15px_rgba(229,160,13,0.15)]">
                            <Shield className="w-7 h-7 md:w-8 md:h-8 text-plex drop-shadow-md" />
                        </div>
                        <h3 className="text-xl md:text-2xl font-black text-text uppercase tracking-widest mb-1">Server Admin</h3>
                        <div className="mt-2 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/40 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)] tracking-widest uppercase">
                            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]" /> VIP UNLIMITED
                        </div>
                    </div>
                );
            case 'accessStatus':
                if (!user) return null;
                return (
                    <div className="glass-card p-4 md:p-5 shadow-xl flex flex-col justify-center flex-shrink-0">
                        <div className="flex flex-col gap-3 md:gap-4">
                            <div>
                                <p className="text-muted text-xs uppercase tracking-widest font-semibold mb-3">Access Status</p>
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black border uppercase tracking-wider shadow-sm ${isRevoked ? 'bg-red-500/10 border-red-500/30 text-red-400' : isExpiringSoon ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' : 'bg-green-500/10 border-green-500/30 text-green-400'}`}>
                                        <span className={`w-2 h-2 rounded-full animate-pulse ${isRevoked ? 'bg-red-400' : isExpiringSoon ? 'bg-yellow-400' : 'bg-green-400'}`} />
                                        {user.plexAccessStatus}{isActiveShortTermTrial(user, daysLeft) && ' · Temp Access'}
                                    </span>
                                    {user.expiryDate ? (
                                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold bg-white/5 border border-white/10 text-text shadow-sm">
                                            <Calendar size={14} className="text-muted" />
                                            {new Date(user.expiryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-[11px] font-black bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/40 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)] tracking-widest uppercase">
                                            <Star className="w-4 h-4 text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]" /> VIP UNLIMITED
                                        </span>
                                    )}
                                </div>
                            </div>
                            {isRevoked && daysLeft !== null && daysLeft >= 0 && (
                                <button className="w-full mt-2 px-6 py-2.5 bg-plex text-background rounded-xl font-bold hover:bg-plex-hover transition-colors shadow-lg" onClick={handleRelink}>
                                    Re-link Plex Account
                                </button>
                            )}
                            {daysLeft !== null && (
                                <div className="bg-background/40 rounded-xl p-5 border border-white/5 mt-2">
                                    <div className="flex justify-between items-baseline mb-3">
                                        <span className="text-muted text-xs uppercase tracking-widest font-semibold">Time Remaining</span>
                                        <span className={`font-black text-3xl md:text-4xl leading-none ${isExpiringSoon ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.3)]' : 'text-plex drop-shadow-[0_0_8px_rgba(229,160,13,0.3)]'}`}>
                                            {daysLeft}<span className="text-base font-semibold text-muted ml-1.5">{daysLeft === 1 ? 'day' : 'days'}</span>
                                        </span>
                                    </div>
                                    <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden shadow-inner border border-white/5">
                                        <div className={`h-full rounded-full transition-all duration-1000 relative ${isExpiringSoon ? 'bg-yellow-400' : 'bg-gradient-to-r from-plex via-amber-400 to-orange-500'}`} style={{ width: `${progressPct}%` }}>
                                            <div className="absolute top-0 bottom-0 left-0 right-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-[shimmer_1s_linear_infinite]" />
                                        </div>
                                    </div>
                                    {isExpiringSoon && <p className="text-yellow-400/90 text-sm font-medium mt-3 flex items-center gap-2">⚠️ Expiring soon — contact admin</p>}
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 'tempAccessSetup':
                return (
                    <div className="flex items-center gap-3 text-muted text-sm bg-card p-6 rounded-2xl border border-border shadow-lg flex-shrink-0">
                        <div className="w-5 h-5 rounded-full border-2 border-plex border-t-transparent animate-spin flex-shrink-0" />
                        Setting up your 3-Day Temporary Access...
                    </div>
                );
            case 'quickActions':
                return (
                    <div className="glass-card p-3 md:p-4 shadow-xl flex flex-col flex-shrink-0 justify-center gap-2.5">
                        <p className="text-muted text-xs uppercase tracking-widest font-semibold flex-shrink-0">Quick Actions</p>
                        <div className="grid grid-cols-3 gap-2">
                            <button type="button" onClick={() => onViewAdmin()} className="flex flex-col items-center justify-center gap-1.5 px-2 py-3 rounded-xl font-bold text-[10px] leading-tight text-center transition-all border bg-plex/10 border-plex/30 text-plex hover:bg-plex/20">
                                <Users size={18} />
                                <span>Manage Users</span>
                            </button>
                            <button type="button" onClick={() => onViewSettings?.()} className="flex flex-col items-center justify-center gap-1.5 px-2 py-3 rounded-xl font-bold text-[10px] leading-tight text-center transition-all border bg-white/5 border-white/10 text-text hover:bg-white/10">
                                <Settings size={18} />
                                <span>Settings</span>
                            </button>
                            <button type="button" onClick={() => onViewLogs?.()} className="flex flex-col items-center justify-center gap-1.5 px-2 py-3 rounded-xl font-bold text-[10px] leading-tight text-center transition-all border bg-white/5 border-white/10 text-text hover:bg-white/10">
                                <Activity size={18} />
                                <span>System Logs</span>
                            </button>
                        </div>
                    </div>
                );
            case 'pendingRequests':
                if (!sessionInfo?.navFeatures?.requestsQueue) return null;
                return (
                    <PendingRequestsHomeWidget
                        onViewAll={onViewRequests}
                        onActionComplete={onPendingRequestsChange}
                        onToast={(message, type) => setToast({ id: Date.now(), message, type })}
                    />
                );
            case 'announcement':
                if (!publicConfig?.announcement) return null;
                return (
                    <div className="bg-plex/10 border border-plex/30 rounded-2xl p-3 md:p-4 shadow-lg">
                        <div className="flex items-start gap-3">
                            <span className="text-xl mt-0.5">📢</span>
                            <div>
                                <h3 className="text-plex font-bold text-sm uppercase tracking-wider mb-1">Announcement</h3>
                                <p className="text-text whitespace-pre-wrap text-sm leading-relaxed">{publicConfig.announcement}</p>
                            </div>
                        </div>
                    </div>
                );
            case 'referral':
                if (!user) return null;
                return (
                    <div className="glass-card p-4 md:p-5 shadow-lg">
                        <p className="text-plex font-bold text-base mb-1">🎁 Invite Friends</p>
                        <p className="text-muted text-sm leading-relaxed mb-4">Share this link. They get temporary access, and you get reward days!</p>
                        <div className="flex flex-col gap-2">
                            <input type="text" readOnly value={`${getPublicOrigin()}/?ref=${user.id}`} className="w-full p-3 rounded-lg border border-border bg-background text-text text-sm outline-none" />
                            <button onClick={() => { navigator.clipboard.writeText(`${getPublicOrigin()}/?ref=${user.id}`); setToast({ id: 99, message: 'Copied to clipboard!', type: 'success' }); }} className="w-full py-2.5 bg-plex text-background rounded-lg font-bold hover:bg-plex-hover transition-colors shadow-md">Copy Link</button>
                        </div>
                    </div>
                );
            case 'newsletterPrefs':
                if (!user) return null;
                return (
                    <div className="glass-card p-4 md:p-5 shadow-lg flex flex-col">
                        <p className="text-muted text-xs uppercase tracking-widest font-semibold mb-3 flex-shrink-0">Preferences</p>
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-text font-bold text-sm">Weekly Newsletter</p>
                                <p className="text-muted text-xs mt-1 leading-relaxed">Automated library updates delivered to your inbox</p>
                            </div>
                            <button onClick={handleToggleNewsletter} aria-label="Toggle newsletter"
                                className={`relative inline-flex items-center w-14 h-7 rounded-full transition-all flex-shrink-0 border-2 ${!optOutNewsletter ? 'bg-plex border-plex' : 'bg-background border-border'}`}>
                                <span className={`inline-block w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${!optOutNewsletter ? 'translate-x-8' : 'translate-x-1'}`} />
                            </button>
                        </div>
                    </div>
                );
            case 'support': {
                const showTempAccessMessage = isActiveShortTermTrial(user, daysLeft);
                const hasContactOptions = !!(publicConfig?.contactWhatsApp || publicConfig?.contactEmail);
                return (
                    <div className="glass-card p-4 md:p-5 shadow-lg flex flex-col">
                        {showTempAccessMessage ? (
                            <div className="mb-3 md:mb-4 flex-shrink-0">
                                <p className="text-plex font-bold text-base mb-1">🍿 Enjoying your Temporary Access?</p>
                                <p className="text-muted text-sm leading-relaxed">
                                    Once your {daysLeft === 1 ? '1-day' : `${daysLeft}-day`} access ends, you'll lose access. Get in touch with the admin to extend your access!
                                </p>
                            </div>
                        ) : (
                            <div className="mb-3 md:mb-4 flex-shrink-0">
                                <p className="text-text font-bold text-base mb-1">💬 Need Help?</p>
                                <p className="text-muted text-sm leading-relaxed">
                                    Contact the owner to extend your access, report an issue, or get support.
                                </p>
                            </div>
                        )}
                        {hasContactOptions ? (
                            <div className="flex flex-col gap-3 mt-auto">
                                {publicConfig?.contactWhatsApp && (
                                    <a href={`https://wa.me/${String(publicConfig.contactWhatsApp).replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all border bg-[#25D366]/10 border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/20">
                                        WhatsApp
                                    </a>
                                )}
                                {publicConfig?.contactEmail && (
                                    <a href={`mailto:${publicConfig.contactEmail}`}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all border bg-white/5 border-white/10 text-text hover:bg-white/10">
                                        Email
                                    </a>
                                )}
                            </div>
                        ) : (
                            <p className="text-muted text-xs mt-auto">Contact details have not been configured by the server owner yet.</p>
                        )}
                    </div>
                );
            }
            case 'libraryStats':
                if (isJellyfinPortal) {
                    return (
                        <div className="glass-card p-4 md:p-5 shadow-xl flex flex-col justify-center flex-shrink-0">
                            <div className="flex items-center justify-between mb-3 md:mb-4">
                                <p className="text-muted text-sm uppercase tracking-widest font-semibold">Jellyfin Library</p>
                            </div>
                            {serverDataLoading && !serverStats ? (
                                <LibraryStatsSkeleton />
                            ) : serverStats ? (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 md:gap-3">
                                    <div className="bg-background/60 p-3 md:p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center shadow-inner hover:bg-background/80 transition-colors">
                                        <Film className="w-7 h-7 text-plex mb-2 opacity-80" />
                                        <span className="text-3xl font-black text-text drop-shadow-md mb-1">{serverStats.movies?.toLocaleString?.() || 0}</span>
                                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted">Movies</span>
                                    </div>
                                    <div className="bg-background/60 p-3 md:p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center shadow-inner hover:bg-background/80 transition-colors">
                                        <Tv className="w-7 h-7 text-plex mb-2 opacity-80" />
                                        <span className="text-3xl font-black text-text drop-shadow-md mb-1">{serverStats.shows?.toLocaleString?.() || 0}</span>
                                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted">{serverStats.episodes?.toLocaleString?.() || 0} Episodes</span>
                                    </div>
                                    <div className="bg-background/60 p-3 md:p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center shadow-inner hover:bg-background/80 transition-colors">
                                        <Layers className="w-7 h-7 text-plex mb-2 opacity-80" />
                                        <span className="text-3xl font-black text-text drop-shadow-md mb-1">{formatBytes(serverStats.totalCatalogBytes || 0)}</span>
                                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted">Catalog Size</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-muted text-sm bg-background/50 p-4 rounded-xl border border-white/5">Could not load Jellyfin library statistics at this time.</div>
                            )}
                        </div>
                    );
                }
                return (
                    <div className="glass-card p-4 md:p-5 shadow-xl flex flex-col justify-center flex-shrink-0">
                        <div className="flex items-center justify-between mb-3 md:mb-4">
                            <p className="text-muted text-sm uppercase tracking-widest font-semibold">Server Library Size</p>
                            {sessionInfo.session.isAdmin && <RebuildLibraryCacheButton />}
                        </div>
                        {serverDataLoading && !serverStats ? (
                            <LibraryStatsSkeleton />
                        ) : serverStats?.isBuilding ? (
                            <div className="flex flex-col gap-2">
                                <div className="flex gap-3 items-center text-muted"><div className="w-5 h-5 rounded-full border-2 border-plex border-t-transparent animate-spin" /> Building library size cache in background...</div>
                                <p className="text-xs text-muted/60">This runs once and may take a few minutes for large libraries. The page will auto-update when ready.</p>
                            </div>
                        ) : serverStats ? (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 md:gap-3">
                                <div className="bg-background/60 p-3 md:p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center shadow-inner hover:bg-background/80 transition-colors">
                                    <Film className="w-7 h-7 text-plex mb-2 opacity-80" />
                                    <span className="text-3xl font-black text-text drop-shadow-md mb-1">{formatBytes(serverStats.moviesBytes)}</span>
                                    <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider mt-1">
                                        <span className="text-plex">{serverStats.movies?.toLocaleString() || 0}</span>
                                        <span className="text-muted">Movies</span>
                                    </div>
                                </div>
                                <div className="bg-background/60 p-3 md:p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center shadow-inner hover:bg-background/80 transition-colors">
                                    <Tv className="w-7 h-7 text-plex mb-2 opacity-80" />
                                    <span className="text-3xl font-black text-text drop-shadow-md mb-1">{formatBytes(serverStats.showsBytes)}</span>
                                    <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider mt-1">
                                        <span className="text-plex">{serverStats.shows?.toLocaleString() || 0}</span>
                                        <span className="text-muted">Shows</span>
                                    </div>
                                </div>
                                <div className="bg-background/60 p-3 md:p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center shadow-inner hover:bg-background/80 transition-colors">
                                    <Music className="w-7 h-7 text-plex mb-2 opacity-80" />
                                    <span className="text-3xl font-black text-text drop-shadow-md mb-1">{formatBytes(serverStats.musicBytes)}</span>
                                    <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider mt-1">
                                        <span className="text-plex">{serverStats.music?.toLocaleString() || 0}</span>
                                        <span className="text-muted">Albums</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-muted text-sm bg-background/50 p-4 rounded-xl border border-white/5">Could not load server statistics at this time.</div>
                        )}
                    </div>
                );
            case 'analytics':
                if (!sessionInfo.session.isAdmin && !user) return null;
                if (isJellyfinPortal) {
                    return (
                        <div className="glass-card p-3 md:p-4 shadow-xl flex flex-col flex-1 min-h-0">
                            <div className="flex items-center justify-between flex-shrink-0">
                                <h2 className="text-lg md:text-xl font-bold text-text flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-plex" /> Jellystat Activity
                                </h2>
                                <PeriodDropdown
                                    value={analyticsDays}
                                    open={analyticsDaysOpen}
                                    onToggle={() => setAnalyticsDaysOpen(!analyticsDaysOpen)}
                                    onClose={() => setAnalyticsDaysOpen(false)}
                                    onChange={(value) => setAnalyticsDays(value as number | 'all')}
                                    options={analyticsDaysOptions}
                                />
                            </div>
                            {analyticsLoading ? (
                                <div className="flex items-center gap-3 text-muted mt-4">
                                    <div className="w-5 h-5 rounded-full border-2 border-plex border-t-transparent animate-spin" />
                                    Loading Jellystat activity...
                                </div>
                            ) : analytics && analytics.totalPlays > 0 ? (
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mt-4">
                                    <div className="bg-background/60 rounded-xl border border-white/5 p-3">
                                        <p className="text-[10px] text-muted uppercase tracking-widest font-bold">Total Plays</p>
                                        <p className="text-2xl font-black text-text mt-1">{analytics.totalPlays?.toLocaleString?.() || 0}</p>
                                    </div>
                                    <div className="bg-background/60 rounded-xl border border-white/5 p-3">
                                        <p className="text-[10px] text-muted uppercase tracking-widest font-bold">Top Library</p>
                                        <p className="text-sm font-bold text-text mt-1 truncate">{analytics.favoriteLibrary || 'None'}</p>
                                    </div>
                                    <div className="bg-background/60 rounded-xl border border-white/5 p-3">
                                        <p className="text-[10px] text-muted uppercase tracking-widest font-bold">Top Movie</p>
                                        <p className="text-sm font-bold text-text mt-1 truncate">{analytics.topMovie?.title || 'None'}</p>
                                    </div>
                                    <div className="bg-background/60 rounded-xl border border-white/5 p-3">
                                        <p className="text-[10px] text-muted uppercase tracking-widest font-bold">Top Show</p>
                                        <p className="text-sm font-bold text-text mt-1 truncate">{analytics.topBinge?.title || 'None'}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center p-4 md:p-5 text-center flex-1 min-h-0 mt-2 md:mt-3">
                                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3 text-xl shadow-inner">🍿</div>
                                    <h3 className="font-bold text-text mb-1">No Jellystat activity yet</h3>
                                    <p className="text-muted text-sm max-w-sm">Once Jellystat records playback activity, your server activity summary will appear right here.</p>
                                </div>
                            )}
                        </div>
                    );
                }
                return (
                    <div className="glass-card p-3 md:p-4 shadow-xl flex flex-col flex-1 min-h-0">
                        <div className="flex items-center justify-between flex-shrink-0">
                            <h2 className="text-lg md:text-xl font-bold text-text flex items-center gap-2">
                                <Activity className="w-5 h-5 text-plex" /> Your Analytics
                            </h2>
                            <PeriodDropdown
                                value={analyticsDays}
                                open={analyticsDaysOpen}
                                onToggle={() => setAnalyticsDaysOpen(!analyticsDaysOpen)}
                                onClose={() => setAnalyticsDaysOpen(false)}
                                onChange={(value) => setAnalyticsDays(value as number | 'all')}
                                options={analyticsDaysOptions}
                            />
                        </div>
                        {!analyticsLoading && analytics && analytics.totalPlays === 0 && (
                            <div className="flex flex-col items-center justify-center p-4 md:p-5 text-center flex-1 min-h-0 mt-2 md:mt-3">
                                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3 text-xl shadow-inner">🍿</div>
                                <h3 className="font-bold text-text mb-1">No watch history yet</h3>
                                <p className="text-muted text-sm max-w-sm">Once you start watching content on the server, your personal watch stats and history will appear right here!</p>
                            </div>
                        )}
                    </div>
                );
            default:
                return null;
        }
    };
};

const RecentlyAddedScrollRow: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const updateScrollState = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        const maxScroll = el.scrollWidth - el.clientWidth;
        setCanScrollLeft(el.scrollLeft > 4);
        setCanScrollRight(el.scrollLeft < maxScroll - 4);
    }, []);

    useEffect(() => {
        updateScrollState();
        const el = scrollRef.current;
        if (!el) return;
        el.addEventListener('scroll', updateScrollState, { passive: true });
        const ro = new ResizeObserver(updateScrollState);
        ro.observe(el);
        return () => {
            el.removeEventListener('scroll', updateScrollState);
            ro.disconnect();
        };
    }, [updateScrollState, children]);

    const scroll = (direction: -1 | 1) => {
        const el = scrollRef.current;
        if (!el) return;
        el.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: 'smooth' });
    };

    return (
        <div className="glass-card p-4 md:p-5 shadow-xl overflow-hidden w-full">
            <h3 className="text-lg md:text-xl font-bold text-text mb-3">{title}</h3>
            <div className="relative">
                <button
                    type="button"
                    onClick={() => scroll(-1)}
                    disabled={!canScrollLeft}
                    aria-label={`Scroll ${title} left`}
                    className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 items-center justify-center rounded-full bg-black/70 border border-white/10 text-text hover:bg-black/90 hover:border-plex/50 disabled:opacity-0 disabled:pointer-events-none transition-all shadow-lg -ml-1"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <div
                    ref={scrollRef}
                    className="flex overflow-x-auto gap-4 pb-4 snap-x hide-scrollbar scroll-smooth lg:px-1"
                >
                    {children}
                </div>
                <button
                    type="button"
                    onClick={() => scroll(1)}
                    disabled={!canScrollRight}
                    aria-label={`Scroll ${title} right`}
                    className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 items-center justify-center rounded-full bg-black/70 border border-white/10 text-text hover:bg-black/90 hover:border-plex/50 disabled:opacity-0 disabled:pointer-events-none transition-all shadow-lg -mr-1"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export const createRecentlyAddedWidgetRenderer = (deps: UserDashboardWidgetDeps) => {
    const { dashboardData, showQualityBadges, DiscoverPosterCard, publicConfig } = deps;

    return (id: RecentlyAddedWidgetId): React.ReactNode => {
        if (!dashboardData) return null;
        switch (id) {
            case 'recentMovies':
                if (!dashboardData.recentMovies?.length) return null;
                return (
                    <ScrollReveal enabled={!!publicConfig?.useScrollRevealAnimations}>
                        <RecentlyAddedScrollRow title="Recently Added Movies">
                        {dashboardData.recentMovies.map((item: any, idx: number) => (
                            <DiscoverPosterCard
                                key={idx}
                                variant="home"
                                className="snap-start shrink-0 w-32 md:w-40"
                                item={item}
                                showQualityBadges={showQualityBadges}
                                footer={(
                                    <div className="flex flex-col px-1">
                                        <p className="text-xs font-bold text-text truncate group-hover:text-plex transition-colors">{item.title}</p>
                                        {item.year && <p className="text-[10px] text-muted font-semibold mt-0.5">{item.year}</p>}
                                    </div>
                                )}
                            />
                        ))}
                    </RecentlyAddedScrollRow>
                    </ScrollReveal>
                );
            case 'recentShows':
                if (!dashboardData.recentShows?.length) return null;
                return (
                    <ScrollReveal enabled={!!publicConfig?.useScrollRevealAnimations}>
                        <RecentlyAddedScrollRow title="Recently Added TV Shows">
                        {dashboardData.recentShows.map((item: any, idx: number) => (
                            <DiscoverPosterCard
                                key={idx}
                                variant="home"
                                className="snap-start shrink-0 w-32 md:w-40"
                                item={item}
                                showQualityBadges={showQualityBadges}
                                footer={(
                                    <div className="flex flex-col px-1">
                                        <p className="text-xs font-bold text-text truncate group-hover:text-plex transition-colors">{item.title}</p>
                                        {item.year && <p className="text-[10px] text-muted font-semibold mt-0.5">{item.year}</p>}
                                    </div>
                                )}
                            />
                        ))}
                    </RecentlyAddedScrollRow>
                    </ScrollReveal>
                );
            case 'recentMusic':
                if (!dashboardData.recentMusic?.length) return null;
                return (
                    <ScrollReveal enabled={!!publicConfig?.useScrollRevealAnimations}>
                        <RecentlyAddedScrollRow title="Recently Added Music">
                        {dashboardData.recentMusic.map((item: any, idx: number) => (
                            <DiscoverPosterCard
                                key={idx}
                                variant="home"
                                aspect="square"
                                className="snap-start shrink-0 w-32 md:w-40"
                                item={item}
                                showQualityBadges={showQualityBadges}
                                footer={(
                                    <div className="flex flex-col px-1">
                                        <p className="text-xs font-bold text-text truncate group-hover:text-plex transition-colors">{item.title}</p>
                                        {item.parentTitle && <p className="text-[10px] text-muted font-semibold mt-0.5 truncate">{item.parentTitle}</p>}
                                    </div>
                                )}
                            />
                        ))}
                    </RecentlyAddedScrollRow>
                    </ScrollReveal>
                );
            default:
                return null;
        }
    };
};
