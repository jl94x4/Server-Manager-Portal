import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Home, Film, Activity, Sparkles, LogOut, Settings, FileText, BarChart3, Users, PlaySquare, TrendingUp, X, Star, Layers, HardDrive, Calendar, Tv, Clock, DownloadCloud, MonitorSmartphone, Copy, ChevronUp, ChevronDown, List, Palette, Music, Play, Shield, CheckCircle, AlertCircle, RefreshCw, ChevronLeft, ChevronRight, Trophy, PlayCircle, Coffee, Compass, PieChart, Clapperboard, AlertTriangle, Check, Cpu, Monitor, LineChart as LucideLineChart, Share2, Search } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';

import { SettingsDashboard } from './settings/SettingsDashboard';
import { LibraryMaintenancePanel } from './maintenance/LibraryMaintenancePanel';
import { appConfirm } from './shared/confirm';
import { apiFetch } from './shared/api';
import { getPublicOrigin, logoUrl, portalUrl, resolvePortalAssetUrl, stripBasePath } from './shared/basePath';
import { formatDate, getDaysUntilExpiry, getAccessProgressPct, addMonths, addYears, formatTime, formatEventName, formatDateTime, hexToRgb, formatSizeCeil, formatStreamingHour } from './shared/format';
import { CustomSelect, ConfirmModal, StyledCheckbox } from './shared/ui';
import { PeriodDropdown } from './shared/PeriodDropdown';
import { Loader, Toast, ToastContainer, pushToast } from './shared/toast';
import {
    ActivityGridSkeleton,
    DiscoverPageSkeleton,
    HomeRecentlyAddedSkeleton,
    LibraryStatsSkeleton,
    TopWatchedGridSkeleton,
    TrendingSectionsSkeleton,
    WrapUpCardsSkeleton,
} from './shared/skeletons';
import type { User, PlexConfig, AppSettings, PlexServer, ToastMessage, DeletedUser, AuditEntry, UserStatus } from './shared/types';
import { ShareWrapUpModal } from './shared/ShareWrapUp';
import { WrapUpCardGrid } from './shared/WrapUpCards';
import { SetupWizard } from './setup/SetupWizard';
import { AuthPageBackground, themeClasses } from './shared/theme';
import { activityStreamColumnCount, activityStreamGridClass, discoverPosterGridClass, usePortalWideContentLayout } from './shared/portalLayout';
import { UserDashboardLayout } from './home/UserDashboardLayout';
import { createMainGridWidgetRenderer, createRecentlyAddedWidgetRenderer } from './home/userDashboardWidgetRenderers';

const JELLYFIN_ICON_URL = 'https://cdn.jsdelivr.net/gh/selfhst/icons/svg/jellyfin.svg';

const jellyfinQuickConnectUrl = (baseUrl: string) => {
    const base = String(baseUrl || '').replace(/\/+$/, '');
    return base ? `${base}/web/#/quickconnect` : '';
};

const copyTextToClipboard = async (value: string) => {
    if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        return;
    }
    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', 'true');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
};

declare global {
    interface Window {
        __USE_24_HOUR_CLOCK__?: boolean;
    }
}


export const updateFavicon = (thumbUrl: string | null | undefined) => {
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        link.type = 'image/png';
        document.head.appendChild(link);
    }
    if (thumbUrl) {
        if (thumbUrl.startsWith('http://') || thumbUrl.startsWith('https://')) {
            link.href = thumbUrl;
        } else if (thumbUrl.startsWith('/api/')) {
            link.href = resolvePortalAssetUrl(thumbUrl);
        } else {
            link.href = portalUrl(`/api/plex/image?path=${encodeURIComponent(thumbUrl)}&width=32&height=32`);
        }
    } else {
        link.href = logoUrl();
    }
};

// --- Components ---

const SettingsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.44,0.17-0.48,0.41L9.22,5.72C8.63,5.96,8.1,6.29,7.6,6.67L5.21,5.71C4.99,5.62,4.74,5.7,4.62,5.92L2.7,9.24 c-0.11,0.2-0.06,0.47,0.12,0.61L4.85,11c-0.04,0.3-0.06,0.61-0.06,0.94c0,0.32,0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.38,2.91 c0.04,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44,0.17,0.48,0.41l0.38-2.91c0.59-0.24,1.12-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z" />
    </svg>
);

const UserCard: React.FC<{
    user: User;
    onEdit: () => void;
    onDelete: () => void;
    onRevoke: () => void;
    isConfigured: boolean;
    isSelected: boolean;
    onSelect: (id: string) => void;
    providerLabel?: string;
}> = ({ user, onEdit, onDelete, onRevoke, isConfigured, isSelected, onSelect, providerLabel = 'Plex' }) => {
    const { status, statusText, daysRemainingText, pillClass, borderClass } = useMemo(() => {
        const days = getDaysUntilExpiry(user.expiryDate);
        let status: UserStatus = 'active';
        let statusText = 'Active';
        let daysRemainingText = '';
        let pillClass = 'bg-green-500/10 text-green-400 border border-green-500/20';
        let borderClass = 'border-green-500/50';

        if (days === null) {
            status = 'active';
            statusText = 'Active';
            daysRemainingText = 'Access never expires.';
        } else if (days < 0) {
            status = 'expired';
            statusText = 'Expired';
            daysRemainingText = `Expired ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} ago.`;
            pillClass = 'bg-red-500/10 text-red-400 border border-red-500/20';
            borderClass = 'border-red-500/50';
        } else if (days <= 30) {
            status = 'expiring';
            statusText = 'Expiring Soon';
            daysRemainingText = days === 0 ? 'Expires today.' : `Expires in ${days} day${days === 1 ? '' : 's'}.`;
            pillClass = 'bg-orange-500/10 text-orange-400 border border-orange-500/20';
            borderClass = 'border-orange-500/50';
        } else {
            daysRemainingText = `Expires in ${days} day${days === 1 ? '' : 's'}.`;
        }

        return { status, statusText, daysRemainingText, pillClass, borderClass };
    }, [user.expiryDate]);

    const handleCardClick = () => {
        onSelect(user.id);
    }

    return (
        <div className={`bg-card rounded-xl p-6 shadow-lg border-l-4 ${borderClass} hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 flex flex-col relative cursor-pointer ${isSelected ? 'selected' : ''}`} onClick={handleCardClick}>
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3 min-w-0">
                    <input className="w-5 h-5 flex-shrink-0 appearance-none rounded-full border-2 border-muted checked:bg-plex checked:border-plex transition-colors cursor-pointer relative checked:after:content-[''] checked:after:block checked:after:w-2.5 checked:after:h-2.5 checked:after:bg-background checked:after:rounded-full checked:after:absolute checked:after:top-1/2 checked:after:left-1/2 checked:after:-translate-x-1/2 checked:after:-translate-y-1/2"
                        type="checkbox"
                        checked={isSelected}
                        readOnly
                        style={{ borderRadius: '50%' }}
                    />
                    {user.thumb ? (
                        <img src={resolvePortalAssetUrl(user.thumb)} alt={user.username} className="w-10 h-10 rounded-full object-cover border border-border flex-shrink-0" />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-border flex items-center justify-center text-text font-bold text-sm uppercase flex-shrink-0">
                            {user.username.substring(0, 2)}
                        </div>
                    )}
                    <div className="flex flex-col min-w-0 pr-2">
                        <h3 className="text-lg font-bold truncate leading-tight" title={user.username}>{user.username}</h3>
                        {user.email && <span className="text-xs text-muted truncate mt-0.5" title={user.email}>{user.email}</span>}
                    </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${pillClass}`}>{statusText}</span>
            </div>
            <div className="flex flex-col gap-3 mt-4 flex-grow">
                <div className="flex justify-between items-center text-sm pb-2 border-b border-white/5 last:border-0 last:pb-0">
                    <span className="text-muted text-xs uppercase tracking-wider font-bold">Joined</span>
                    <span className="text-text font-medium flex items-center gap-2">{formatDate(user.joiningDate)}</span>
                </div>
                <div className="flex justify-between md:items-center items-start text-sm pb-2 border-b border-white/5 last:border-0 last:pb-0 gap-2">
                    <span className="text-muted text-xs uppercase tracking-wider font-bold flex-shrink-0 pt-1 md:pt-0">Expires</span>
                    <span className="text-text font-medium flex flex-wrap justify-end md:items-center gap-1"><span className="whitespace-nowrap">{formatDate(user.expiryDate)}</span> <span className="text-[0.7rem] text-muted whitespace-nowrap">({daysRemainingText})</span></span>
                </div>
                <div className="flex justify-between items-center text-sm pb-2 border-b border-white/5 last:border-0 last:pb-0">
                    <span className="text-muted text-xs uppercase tracking-wider font-bold">{providerLabel}</span>
                    <span className="info-value plex-status">
                        <span className={`plex-status-dot ${user.plexAccessStatus || 'unknown'}`}></span>
                        {(user.plexAccessStatus || 'unknown').charAt(0).toUpperCase() + (user.plexAccessStatus || 'unknown').slice(1)}
                    </span>
                </div>
                <div className="flex justify-between items-center text-sm pb-2 border-b border-white/5 last:border-0 last:pb-0">
                    <span className="text-muted text-xs uppercase tracking-wider font-bold">Last Login</span>
                    <span className="text-text font-medium">{user.lastLogin ? formatDate(user.lastLogin) : 'Never'}</span>
                </div>
            </div>
            <div className="flex gap-2 mt-auto pt-6" onClick={e => e.stopPropagation()}>
                <button className="px-4 py-2 bg-border text-text rounded-md font-medium hover:bg-opacity-80 transition-colors flex items-center justify-center gap-2" onClick={onEdit}>Edit</button>
                <button className="px-4 py-2 bg-border text-text rounded-md font-medium hover:bg-opacity-80 transition-colors flex items-center justify-center gap-2" onClick={onDelete}>Delete</button>
                {status === 'expired' && user.plexAccessStatus !== 'revoked' && (
                    <button className="px-4 py-2 bg-border text-text rounded-md font-medium hover:bg-opacity-80 transition-colors flex items-center justify-center gap-2" onClick={onRevoke} disabled={!isConfigured}>Revoke Now</button>
                )}
            </div>
        </div>
    );
};

const UserModal: React.FC<{ isOpen: boolean; onClose: () => void; onSave: (user: User) => void; user: User | null }> = ({ isOpen, onClose, onSave, user }) => {
    const [username, setUsername] = useState('');
    const [joiningDate, setJoiningDate] = useState(formatDate(new Date().toISOString()));
    const [expiryDate, setExpiryDate] = useState<string | null>(formatDate(addMonths(new Date(), 1).toISOString()));
    const [exemptFromCleanup, setExemptFromCleanup] = useState(false);
    const [optOutNewsletter, setOptOutNewsletter] = useState(false);

    useEffect(() => {
        if (user) {
            setUsername(user.username);
            setJoiningDate(formatDate(user.joiningDate));
            setExpiryDate(user.expiryDate ? formatDate(user.expiryDate) : null);
            setExemptFromCleanup(!!user.exemptFromCleanup);
            setOptOutNewsletter(!!user.optOutNewsletter);
        } else {
            // Reset state for new user (if ever implemented)
            setUsername('');
            setJoiningDate(formatDate(new Date().toISOString()));
            setExpiryDate(formatDate(addMonths(new Date(), 1).toISOString()));
            setExemptFromCleanup(false);
            setOptOutNewsletter(false);
        }
    }, [user, isOpen]);

    if (!isOpen) return null;

    const handleSave = () => {
        if (!user) return;
        const updatedUser: User = { ...user, expiryDate, exemptFromCleanup, optOutNewsletter };
        onSave(updatedUser);
    };

    const handleQuickAction = (action: 'addMonth' | 'addYear' | 'unlimited') => {
        const baseDate = expiryDate ? new Date(expiryDate) : new Date();
        // Adjust for timezone when creating date from YYYY-MM-DD input
        if (expiryDate) baseDate.setMinutes(baseDate.getMinutes() + baseDate.getTimezoneOffset());

        switch (action) {
            case 'addMonth': setExpiryDate(formatDate(addMonths(baseDate, 1).toISOString())); break;
            case 'addYear': setExpiryDate(formatDate(addYears(baseDate, 1).toISOString())); break;
            case 'unlimited': setExpiryDate(null); break;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-[1000]" onClick={onClose}>
            <div className="bg-card p-4 md:p-8 rounded-2xl w-[90%] max-w-lg shadow-2xl border border-border" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-text">Edit User</h2>
                <div className="mb-4">
                    <label>Plex Username</label>
                    <input className="w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all" type="text" value={username} disabled />
                </div>
                <div className="mb-4">
                    <label>Joining Date</label>
                    <input className="w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all" type="date" value={joiningDate} disabled />
                </div>
                <div className="mb-4">
                    <label htmlFor="expiryDate">Expiry Date</label>
                    <input className="w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all" id="expiryDate" type="date" value={expiryDate ?? ''} onChange={(e) => setExpiryDate(e.target.value)} />
                    <div className="mt-3 grid grid-cols-3 gap-2">
                        <button className="w-full h-10 px-3 bg-border text-text rounded-md font-medium hover:bg-opacity-80 transition-colors flex items-center justify-center text-sm whitespace-nowrap" onClick={() => handleQuickAction('addMonth')}>+1M</button>
                        <button className="w-full h-10 px-3 bg-border text-text rounded-md font-medium hover:bg-opacity-80 transition-colors flex items-center justify-center text-sm whitespace-nowrap" onClick={() => handleQuickAction('addYear')}>+1Y</button>
                        <button className="w-full h-10 px-3 bg-border text-text rounded-md font-medium hover:bg-opacity-80 transition-colors flex items-center justify-center text-sm whitespace-nowrap" onClick={() => handleQuickAction('unlimited')}>Unlimited</button>
                    </div>
                </div>
                <div className="mb-4 flex items-center justify-between bg-black/10 p-4 rounded-lg border border-border">
                    <div>
                        <label className="font-bold block mb-1">Exempt from Cleanup</label>
                        <span className="text-xs text-muted block">Prevent automated inactive user removal</span>
                    </div>
                    <button
                        onClick={() => setExemptFromCleanup(!exemptFromCleanup)}
                        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${exemptFromCleanup ? 'bg-plex' : 'bg-border'}`}
                    >
                        <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${exemptFromCleanup ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>
                <div className="mb-4 flex items-center justify-between bg-black/10 p-4 rounded-lg border border-border">
                    <div>
                        <label className="font-bold block mb-1">Disable Newsletter</label>
                        <span className="text-xs text-muted block">Stop automated emails for this user</span>
                    </div>
                    <button
                        onClick={() => setOptOutNewsletter(!optOutNewsletter)}
                        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${optOutNewsletter ? 'bg-plex' : 'bg-border'}`}
                    >
                        <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${optOutNewsletter ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>
                <div className="flex justify-end gap-4 mt-8 pt-4 border-t border-border">
                    <button className="px-6 py-3 bg-plex text-background rounded-md font-bold hover:bg-plex-hover transition-colors flex items-center justify-center gap-2" onClick={handleSave}>Save</button>
                </div>
            </div>
        </div>
    );
};






const UserAnalyticsModal: React.FC<{ userId: string, username: string, thumb: string | null, days: string, onClose: () => void }> = ({ userId, username, thumb, days, onClose }) => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'graphs'>('overview');

    const [historyPage, setHistoryPage] = useState(1);
    const [historySearch, setHistorySearch] = useState('');
    const [historyData, setHistoryData] = useState<any[]>([]);
    const [historyTotal, setHistoryTotal] = useState(0);
    const [historyLoading, setHistoryLoading] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(false);
        apiFetch(`/api/plex/analytics/user/${userId}?days=${days}`)
            .then(res => { if (!cancelled) setData(res); })
            .catch(() => { if (!cancelled) setError(true); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [userId, days]);

    useEffect(() => {
        if (activeTab !== 'history') return;
        let cancelled = false;
        setHistoryLoading(true);
        apiFetch(`/api/plex/analytics/user/${userId}/history?page=${historyPage}&limit=15&search=${encodeURIComponent(historySearch)}`)
            .then(res => {
                if (!cancelled && res.data) {
                    setHistoryData(res.data);
                    setHistoryTotal(res.total);
                }
            })
            .catch(() => { })
            .finally(() => { if (!cancelled) setHistoryLoading(false); });
        return () => { cancelled = true; };
    }, [userId, activeTab, historyPage, historySearch]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setHistorySearch(e.target.value);
        setHistoryPage(1);
    };

    const formatHour = (h: number) => {
        if (h === 0) return '12 AM';
        if (h === 12) return '12 PM';
        return h > 12 ? `${h - 12} PM` : `${h} AM`;
    };

    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-card/90 border border-border w-full max-w-6xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-6 border-b border-border flex items-center justify-between bg-black/20 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-r from-plex to-[#e5a00d]">
                            <img src={thumb ? (thumb.startsWith('http') ? thumb : portalUrl(`/api/plex/image?path=${encodeURIComponent(thumb)}&width=128&height=128`)) : logoUrl()} alt={username} className="w-full h-full rounded-full object-cover bg-card" onError={(e) => { (e.target as HTMLImageElement).src = logoUrl(); }} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-text">{username}</h2>
                            <p className="text-muted text-sm">{loading ? 'Loading stats...' : `${data?.totalPlays || 0} total plays (${days === 'all' ? 'All Time' : `Last ${days} Days`})`}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-muted hover:text-white transition-colors bg-white/5 p-2 rounded-full"><X className="w-6 h-6" /></button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-border bg-black/40 px-6 gap-6">
                    {['overview', 'history', 'graphs'].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab as any)} className={`py-3 px-2 font-bold text-sm uppercase tracking-wider transition-colors border-b-2 ${activeTab === tab ? 'border-plex text-text' : 'border-transparent text-muted hover:text-white'}`}>
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1 min-h-0 flex flex-col gap-8 custom-scrollbar">
                    {loading ? (
                        <div className="flex justify-center items-center h-40"><Loader isLoading={true} /></div>
                    ) : (error || !data) ? (
                        <div className="flex flex-col items-center justify-center h-40 text-center gap-2">
                            <AlertCircle className="w-8 h-8 text-red-500" />
                            <p className="text-muted text-sm">Failed to load analytics for this user.</p>
                        </div>
                    ) : activeTab === 'overview' ? (
                        <>
                            {/* Top row */}
                            <div>
                                <h3 className="text-lg font-bold text-text mb-4 uppercase tracking-wider flex items-center gap-2"><PlaySquare className="text-plex w-4 h-4" /> Favorite Libraries</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                                    {(data.topLibraries ?? []).length === 0 ? <p className="text-muted text-sm col-span-full">No library data.</p> : data.topLibraries.map((lib: any, i: number) => (
                                        <div key={lib.id} className="flex justify-between items-center bg-black/20 p-2 rounded border border-white/5">
                                            <span className="font-bold text-sm text-text"><span className="text-muted mr-2">#{i + 1}</span>{lib.title}</span>
                                            <span className="text-plex text-xs font-mono">{lib.plays} plays</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {data.topMovies && data.topMovies.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-bold text-text mb-4 uppercase tracking-wider flex items-center gap-2"><Film className="text-plex w-4 h-4" /> Top Watched Movies</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                                        {data.topMovies.slice(0, 15).map((c: any, i: number) => (
                                            <a key={c.key} href={c.plexUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-black/20 p-2 rounded border border-white/5 hover:bg-white/10 transition-colors">
                                                <div className="w-8 h-12 bg-black/40 rounded overflow-hidden flex-shrink-0 relative">
                                                    {c.thumbUrl && <img src={resolvePortalAssetUrl(c.thumbUrl)} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />}
                                                    <div className={`absolute inset-0 w-full h-full p-2 opacity-50 flex items-center justify-center ${c.thumbUrl ? 'hidden' : ''}`}>
                                                        <Film className="w-full h-full" />
                                                    </div>
                                                </div>
                                                <div className="flex flex-col flex-grow overflow-hidden">
                                                    <span className="font-bold text-sm text-text truncate">{c.title}</span>
                                                    <span className="text-muted text-[10px] uppercase tracking-wider">{c.type}</span>
                                                </div>
                                                <span className="text-plex text-xs font-mono whitespace-nowrap">{c.plays} plays</span>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {data.topShows && data.topShows.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-bold text-text mb-4 uppercase tracking-wider flex items-center gap-2"><TrendingUp className="text-plex w-4 h-4" /> Top Watched TV Shows</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                                        {data.topShows.slice(0, 15).map((c: any, i: number) => (
                                            <a key={c.key} href={c.plexUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-black/20 p-2 rounded border border-white/5 hover:bg-white/10 transition-colors">
                                                <div className="w-8 h-12 bg-black/40 rounded overflow-hidden flex-shrink-0 relative">
                                                    {c.thumbUrl && <img src={resolvePortalAssetUrl(c.thumbUrl)} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />}
                                                    <div className={`absolute inset-0 w-full h-full p-2 opacity-50 flex items-center justify-center ${c.thumbUrl ? 'hidden' : ''}`}>
                                                        <Film className="w-full h-full" />
                                                    </div>
                                                </div>
                                                <div className="flex flex-col flex-grow overflow-hidden">
                                                    <span className="font-bold text-sm text-text truncate">{c.title}</span>
                                                    <span className="text-muted text-[10px] uppercase tracking-wider">{c.type}</span>
                                                </div>
                                                <span className="text-plex text-xs font-mono whitespace-nowrap">{c.plays} plays</span>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : activeTab === 'history' ? (
                        <div className="flex flex-col gap-4 h-full min-h-[400px]">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <h3 className="text-lg font-bold text-text uppercase tracking-wider flex items-center gap-2"><Activity className="text-plex w-4 h-4" /> Full Watch History</h3>
                                <div className="relative w-full sm:w-64">
                                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted" />
                                    <input
                                        type="text"
                                        placeholder="Search history..."
                                        value={historySearch}
                                        onChange={handleSearch}
                                        className="w-full bg-black/40 border border-border text-white text-sm rounded-lg focus:ring-plex focus:border-plex block pl-10 p-2 transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto bg-black/20 rounded-xl border border-white/5 p-2 custom-scrollbar">
                                {historyLoading ? (
                                    <div className="flex justify-center items-center h-40"><Loader isLoading={true} /></div>
                                ) : historyData.length === 0 ? (
                                    <div className="flex justify-center items-center h-40 text-muted">No history found.</div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                        {historyData.map((h: any, i: number) => (
                                            <div key={i} className="flex items-center gap-3 bg-white/5 border border-white/5 p-2 rounded-lg hover:bg-white/10 transition-colors">
                                                <div className={`${h.type === 'track' ? 'w-12 h-12' : 'w-10 h-14'} bg-black/40 rounded overflow-hidden flex-shrink-0`}>
                                                    {h.thumbUrl && <img src={resolvePortalAssetUrl(h.thumbUrl)} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />}
                                                    <div className={`w-full h-full p-2 opacity-50 flex items-center justify-center ${h.thumbUrl ? 'hidden' : ''}`}>
                                                        {h.type === 'track' ? <Music className="w-full h-full" /> : <Film className="w-full h-full" />}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col overflow-hidden w-full">
                                                    <span className="font-bold text-sm text-text truncate w-[95%]">{h.title}</span>
                                                    {h.parentTitle && h.type !== 'movie' && <span className="text-muted text-xs truncate w-[95%]">{h.parentTitle}</span>}
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-plex font-mono text-[10px]">
                                                            {h.viewedAt ? (h.viewedAt > 9999999999 ? new Date(h.viewedAt).toLocaleString() : new Date(h.viewedAt * 1000).toLocaleString()) : 'Unknown Date'}
                                                        </span>
                                                        {h.percentComplete != null && h.percentComplete < 100 && (
                                                            <span className="text-yellow-500 font-mono text-[10px]">{h.percentComplete}%</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Pagination */}
                            {historyTotal > 15 && (
                                <div className="flex justify-between items-center pt-2 border-t border-border mt-2 flex-shrink-0">
                                    <span className="text-sm text-muted">Showing {Math.min((historyPage - 1) * 15 + 1, historyTotal)} to {Math.min(historyPage * 15, historyTotal)} of {historyTotal} plays</span>
                                    <div className="flex gap-2">
                                        <button type="button" disabled={historyPage === 1} onClick={() => setHistoryPage(p => p - 1)} className="bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 px-3 py-1.5 rounded-lg text-sm text-white font-bold transition-colors">Prev</button>
                                        <button type="button" disabled={historyPage * 15 >= historyTotal} onClick={() => setHistoryPage(p => p + 1)} className="bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 px-3 py-1.5 rounded-lg text-sm text-white font-bold transition-colors">Next</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : activeTab === 'graphs' ? (
                        <div className="flex flex-col gap-6 h-full min-h-[400px]">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="glass-card-sm p-4 bg-black/20">
                                    <h3 className="text-sm font-bold text-text mb-4 uppercase tracking-wider">Plays by Hour of Day</h3>
                                    <div className="h-64">
                                        {data.hourDistribution ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={data.hourDistribution.map((plays: number, i: number) => ({ hour: formatHour(i), plays }))}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                                                    <XAxis dataKey="hour" stroke="rgba(255,255,255,0.3)" fontSize={11} tickMargin={10} minTickGap={20} />
                                                    <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} allowDecimals={false} />
                                                    <RechartsTooltip
                                                        contentStyle={{ backgroundColor: 'rgba(20,20,20,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                                        itemStyle={{ color: '#E5A00D' }}
                                                    />
                                                    <Line type="monotone" dataKey="plays" name="Plays" stroke="#E5A00D" strokeWidth={3} dot={{ fill: '#E5A00D', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        ) : <p className="text-muted text-sm">No data.</p>}
                                    </div>
                                </div>

                                <div className="glass-card-sm p-4 bg-black/20">
                                    <h3 className="text-sm font-bold text-text mb-4 uppercase tracking-wider">Plays by Day of Week</h3>
                                    <div className="h-64">
                                        {data.dayOfWeekCounts ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={Object.values(data.dayOfWeekCounts).map((plays: any, i: number) => ({ day: daysOfWeek[i].substring(0, 3), plays }))}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                                                    <XAxis dataKey="day" stroke="rgba(255,255,255,0.3)" fontSize={11} tickMargin={10} />
                                                    <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} allowDecimals={false} />
                                                    <RechartsTooltip
                                                        contentStyle={{ backgroundColor: 'rgba(20,20,20,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                                        itemStyle={{ color: '#E5A00D' }}
                                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                                    />
                                                    <Bar dataKey="plays" name="Plays" fill="#E5A00D" radius={[4, 4, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        ) : <p className="text-muted text-sm">No data.</p>}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                                <div className="glass-card-sm p-4 bg-black/20">
                                    <h3 className="text-sm font-bold text-text mb-4 uppercase tracking-wider">Plays by Library</h3>
                                    <div className="h-64">
                                        {data.topLibraries && data.topLibraries.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <RechartsPieChart>
                                                    <Pie
                                                        data={data.topLibraries}
                                                        dataKey="plays"
                                                        nameKey="title"
                                                        cx="50%"
                                                        cy="50%"
                                                        outerRadius={80}
                                                        innerRadius={40}
                                                        fill="#E5A00D"
                                                        label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                        labelLine={false}
                                                    >
                                                        {data.topLibraries.map((entry: any, index: number) => (
                                                            <Cell key={`cell-${index}`} fill={['#E5A00D', '#3B82F6', '#10B981', '#EF4444', '#8B5CF6', '#EC4899'][index % 6]} />
                                                        ))}
                                                    </Pie>
                                                    <RechartsTooltip
                                                        contentStyle={{ backgroundColor: 'rgba(20,20,20,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                                        itemStyle={{ color: '#E5A00D' }}
                                                    />
                                                </RechartsPieChart>
                                            </ResponsiveContainer>
                                        ) : <p className="text-muted text-sm">No data.</p>}
                                    </div>
                                </div>

                                <div className="glass-card-sm p-4 bg-black/20">
                                    <h3 className="text-sm font-bold text-text mb-4 uppercase tracking-wider">Top Watched Shows</h3>
                                    <div className="h-64">
                                        {data.topShows && data.topShows.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={data.topShows.slice(0, 5)} layout="vertical" margin={{ left: 0, right: 20 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" horizontal={true} vertical={false} />
                                                    <XAxis type="number" stroke="rgba(255,255,255,0.3)" fontSize={11} allowDecimals={false} />
                                                    <YAxis dataKey="title" type="category" stroke="rgba(255,255,255,0.3)" fontSize={10} width={90} tickFormatter={(val) => val.length > 13 ? val.substring(0, 13) + '...' : val} />
                                                    <RechartsTooltip
                                                        contentStyle={{ backgroundColor: 'rgba(20,20,20,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                                        itemStyle={{ color: '#E5A00D' }}
                                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                                    />
                                                    <Bar dataKey="plays" name="Plays" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        ) : <p className="text-muted text-sm">No data.</p>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

const CountUp: React.FC<{ end: number, duration?: number }> = ({ end, duration = 1500 }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime: number | null = null;
        let animationFrame: number;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const percentage = Math.min(progress / duration, 1);

            // easeOutQuart easing
            const easeOut = 1 - Math.pow(1 - percentage, 4);

            setCount(Math.floor(end * easeOut));

            if (percentage < 1) {
                animationFrame = requestAnimationFrame(animate);
            } else {
                setCount(end);
            }
        };

        animationFrame = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(animationFrame);
    }, [end, duration]);

    return <span>{count.toLocaleString()}</span>;
};

const ReportIssueModal: React.FC<{ item: any, onClose: () => void }> = ({ item, onClose }) => {
    const [issue, setIssue] = useState('');
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('submitting');
        try {
            const res = await apiFetch('/api/plex/report-issue', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: item.title, key: item.key || item.ratingKey, issue })
            });
            if (res.success) {
                setStatus('success');
                setTimeout(() => onClose(), 2000);
            } else {
                setStatus('error');
            }
        } catch (e) {
            setStatus('error');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="glass-card p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-plex" />
                        Report Issue
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-muted hover:text-text">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                {status === 'success' ? (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Check className="w-8 h-8 text-green-500" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Report Sent!</h3>
                        <p className="text-muted">The server admin has been notified.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <p className="text-sm text-muted mb-2">Reporting issue for:</p>
                            <div className="bg-black/20 border border-white/5 p-3 rounded-xl flex items-center gap-3">
                                {item.thumbUrl ? (
                                    <img src={resolvePortalAssetUrl(item.thumbUrl)} className="w-10 h-10 rounded-lg object-cover" />
                                ) : (
                                    <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center"><Film className="w-5 h-5 text-muted/50" /></div>
                                )}
                                <div>
                                    <p className="font-bold text-sm truncate">{item.title}</p>
                                    {item.episodeTitle && <p className="text-xs text-muted truncate">{item.episodeTitle}</p>}
                                </div>
                            </div>
                        </div>
                        <div className="mb-6">
                            <label className="block text-sm font-bold text-muted mb-2 uppercase tracking-wider">What's wrong?</label>
                            <textarea
                                value={issue}
                                onChange={e => setIssue(e.target.value)}
                                placeholder="E.g., Audio is out of sync, subtitles are missing, buffering constantly..."
                                className="w-full bg-background border border-border/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-plex/50 text-text resize-none h-32"
                                required
                            />
                        </div>
                        <div className="flex gap-3">
                            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-border/50 text-text font-bold hover:bg-white/5 transition-colors">Cancel</button>
                            <button type="submit" disabled={status === 'submitting' || !issue.trim()} className="flex-1 px-4 py-2.5 rounded-xl bg-plex text-black font-black hover:bg-plex/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {status === 'submitting' ? <><RefreshCw className="w-4 h-4 animate-spin" /> Sending...</> : 'Send Report'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

// --- Analytics Dashboard Component ---
const PersonalAnalyticsDashboard: React.FC<{ username: string, thumb: string | null }> = ({ username, thumb }) => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [days, setDays] = useState<string>('30');

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(false);
        apiFetch(`/api/plex/analytics/me?days=${days}`)
            .then(res => { if (!cancelled) setData(res); })
            .catch(() => { if (!cancelled) setError(true); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [days]);

    return (
        <div className="w-full animate-fade-in flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                <div>
                    <h1 className="text-3xl font-bold text-text uppercase tracking-widest flex items-center gap-3">
                        <BarChart3 className="w-8 h-8 text-plex" />
                        Personal Analytics
                    </h1>
                    <p className="text-muted text-sm mt-1">Deep dive into your playback history</p>
                </div>
                <select
                    value={days}
                    onChange={(e) => setDays(e.target.value)}
                    className="bg-card text-text border border-border rounded px-4 py-2 text-sm focus:outline-none focus:border-plex"
                >
                    <option value="30">Last 30 Days</option>
                    <option value="60">Last 60 Days</option>
                    <option value="365">Last 1 Year</option>
                    <option value="1825">Last 5 Years</option>
                    <option value="all">All Time</option>
                </select>
            </div>

            <div className="bg-card/90 border border-border w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                <div className="p-6 border-b border-border flex items-center justify-between bg-black/20 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-r from-plex to-[#e5a00d]">
                            <img src={thumb ? (thumb.startsWith('http') ? thumb : portalUrl(`/api/plex/image?path=${encodeURIComponent(thumb)}&width=128&height=128`)) : logoUrl()} alt={username} className="w-full h-full rounded-full object-cover bg-card" onError={(e) => { (e.target as HTMLImageElement).src = logoUrl(); }} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-text">{username}</h2>
                            <p className="text-muted text-sm">{loading ? 'Loading stats...' : `${data?.totalPlays || 0} total plays (${days === 'all' ? 'All Time' : `Last ${days} Days`})`}</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto flex-1 min-h-0 flex flex-col gap-8 custom-scrollbar">
                    {loading ? (
                        <div className="flex justify-center items-center h-40"><Loader isLoading={true} /></div>
                    ) : (error || !data) ? (
                        <div className="flex flex-col items-center justify-center h-40 text-center gap-2">
                            <AlertCircle className="w-8 h-8 text-red-500" />
                            <p className="text-muted text-sm">Failed to load your analytics. Please try again later.</p>
                        </div>
                    ) : (
                        <>
                            <div>
                                <h3 className="text-lg font-bold text-text mb-4 uppercase tracking-wider flex items-center gap-2"><PlaySquare className="text-plex w-4 h-4" /> Favorite Libraries</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                                    {(data.topLibraries ?? []).length === 0 ? <p className="text-muted text-sm col-span-full">No library data.</p> : data.topLibraries.map((lib: any, i: number) => (
                                        <div key={lib.id} className="flex justify-between items-center bg-black/20 p-2 rounded border border-white/5">
                                            <span className="font-bold text-sm text-text"><span className="text-muted mr-2">#{i + 1}</span>{lib.title}</span>
                                            <span className="text-plex text-xs font-mono">{lib.plays} plays</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {data.topMovies && data.topMovies.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-bold text-text mb-4 uppercase tracking-wider flex items-center gap-2"><Film className="text-plex w-4 h-4" /> Top Watched Movies</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                                        {data.topMovies.map((c: any, i: number) => (
                                            <a key={c.key} href={c.plexUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-black/20 p-2 rounded border border-white/5 hover:bg-white/10 transition-colors">
                                                <div className="w-8 h-12 bg-black/40 rounded overflow-hidden flex-shrink-0 relative">
                                                    {c.thumbUrl && <img src={resolvePortalAssetUrl(c.thumbUrl)} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />}
                                                    <div className={`absolute inset-0 w-full h-full p-2 opacity-50 flex items-center justify-center ${c.thumbUrl ? 'hidden' : ''}`}>
                                                        <Film className="w-full h-full" />
                                                    </div>
                                                </div>
                                                <div className="flex flex-col flex-grow overflow-hidden">
                                                    <span className="font-bold text-sm text-text truncate">{c.title}</span>
                                                    <span className="text-muted text-[10px] uppercase tracking-wider">{c.type}</span>
                                                </div>
                                                <span className="text-plex text-xs font-mono whitespace-nowrap">{c.plays} plays</span>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {data.topShows && data.topShows.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-bold text-text mb-4 uppercase tracking-wider flex items-center gap-2"><TrendingUp className="text-plex w-4 h-4" /> Top Watched TV Shows</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                                        {data.topShows.map((c: any, i: number) => (
                                            <a key={c.key} href={c.plexUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-black/20 p-2 rounded border border-white/5 hover:bg-white/10 transition-colors">
                                                <div className="w-8 h-12 bg-black/40 rounded overflow-hidden flex-shrink-0 relative">
                                                    {c.thumbUrl && <img src={resolvePortalAssetUrl(c.thumbUrl)} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />}
                                                    <div className={`absolute inset-0 w-full h-full p-2 opacity-50 flex items-center justify-center ${c.thumbUrl ? 'hidden' : ''}`}>
                                                        <Film className="w-full h-full" />
                                                    </div>
                                                </div>
                                                <div className="flex flex-col flex-grow overflow-hidden">
                                                    <span className="font-bold text-sm text-text truncate">{c.title}</span>
                                                    <span className="text-muted text-[10px] uppercase tracking-wider">{c.type}</span>
                                                </div>
                                                <span className="text-plex text-xs font-mono whitespace-nowrap">{c.plays} plays</span>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {data.topMusic && data.topMusic.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-bold text-text mb-4 uppercase tracking-wider flex items-center gap-2"><Music className="text-plex w-4 h-4" /> Top Listened</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                                        {data.topMusic.map((c: any, i: number) => (
                                            <a key={c.key} href={c.plexUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-black/20 p-2 rounded border border-white/5 hover:bg-white/10 transition-colors">
                                                <div className="w-12 h-12 bg-black/40 rounded overflow-hidden flex-shrink-0 relative">
                                                    {c.thumbUrl && <img src={resolvePortalAssetUrl(c.thumbUrl)} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />}
                                                    <div className={`absolute inset-0 w-full h-full p-2 opacity-50 flex items-center justify-center ${c.thumbUrl ? 'hidden' : ''}`}>
                                                        <Music className="w-full h-full" />
                                                    </div>
                                                </div>
                                                <div className="flex flex-col flex-grow overflow-hidden">
                                                    <span className="font-bold text-sm text-text truncate">{c.title}</span>
                                                    <span className="text-muted text-[10px] uppercase tracking-wider">{c.type}</span>
                                                </div>
                                                <span className="text-plex text-xs font-mono whitespace-nowrap">{c.plays} plays</span>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div>

                                <h3 className="text-lg font-bold text-text mb-4 uppercase tracking-wider flex items-center gap-2"><Activity className="text-plex w-4 h-4" /> Recent Watch History</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {data.recentHistory.length === 0 ? <p className="text-muted text-sm col-span-full">No recent history.</p> : data.recentHistory.map((h: any, i: number) => (
                                        <a key={i} href={h.plexUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-white/5 border border-white/5 p-2 rounded-lg hover:bg-white/10 transition-colors">
                                            <div className={`${h.type === 'track' ? 'w-12 h-12' : 'w-10 h-14'} bg-black/40 rounded overflow-hidden flex-shrink-0`}>
                                                {h.thumbUrl && <img src={resolvePortalAssetUrl(h.thumbUrl)} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />}
                                                <div className={`w-full h-full p-2 opacity-50 flex items-center justify-center ${h.thumbUrl ? 'hidden' : ''}`}>
                                                    {h.type === 'track' ? <Music className="w-full h-full" /> : <Film className="w-full h-full" />}
                                                </div>
                                            </div>
                                            <div className="flex flex-col overflow-hidden">
                                                <span className="font-bold text-sm text-text truncate">{h.title}</span>
                                                {h.episodeTitle && <span className="text-muted text-xs truncate">{h.episodeTitle}</span>}
                                                <span className="text-plex font-mono text-[10px] mt-1">{new Date(h.viewedAt * 1000).toLocaleString()}</span>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export const MediaStackDashboard: React.FC<{ isAdmin: boolean }> = ({ isAdmin }) => {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [monthOffset, setMonthOffset] = useState(0);
    const [activeCalendarItem, setActiveCalendarItem] = useState<any>(null);
    const [autoMonthNotice, setAutoMonthNotice] = useState('');

    const fetchData = useCallback(async () => {
        try {
            const res = await apiFetch('/api/media-stack/summary?monthOffset=' + monthOffset);
            if (res.error) throw new Error(res.error);
            setData(res);
        } catch (err: any) {
            setError(err.message || 'Failed to load Media Stack data.');
        } finally {
            setIsLoading(false);
        }
    }, [monthOffset]);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [fetchData]);

    const formatRelativeAirDate = (date: Date) => {
        const now = new Date();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const isMidnight = date.getHours() === 0 && date.getMinutes() === 0;
        const timeStr = isMidnight ? '' : ` at ${formatTime(date)}`;

        const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (date >= today && date < tomorrow) {
            return `Today${timeStr}`;
        }
        const dayAfterTomorrow = new Date(tomorrow);
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
        if (date >= tomorrow && date < dayAfterTomorrow) {
            return `Tomorrow${timeStr}`;
        }
        if (diffDays > 1 && diffDays < 7) {
            const dayName = date.toLocaleDateString([], { weekday: 'long' });
            return `${dayName}${timeStr}`;
        }
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + timeStr;
    };

    const formatBytes = (bytes: number) => {
        if (!bytes) return '0.0 GB';
        const gb = bytes / (1024 * 1024 * 1024);
        if (gb >= 1) return `${gb.toFixed(1)} GB`;
        const mb = bytes / (1024 * 1024);
        return `${mb.toFixed(1)} MB`;
    };

    const calendarItems = useMemo(() => {
        if (!data) return [];
        const items: any[] = [];

        if (data.sonarr?.calendar) {
            data.sonarr.calendar.forEach((ep: any) => {
                const poster = ep.series?.images?.find((img: any) => img.coverType === 'poster');
                items.push({
                    id: `sonarr-${ep.id || ep.airDateUtc || ep.airDate}-${ep.title}`,
                    type: 'tv',
                    service: 'Sonarr',
                    title: ep.series?.title || 'Unknown Series',
                    subtitle: `S${String(ep.seasonNumber).padStart(2, '0')}E${String(ep.episodeNumber).padStart(2, '0')} - ${ep.title}`,
                    date: new Date(ep.airDateUtc || ep.airDate),
                    hasFile: ep.hasFile,
                    monitored: ep.monitored,
                    imageUrl: poster ? (poster.remoteUrl || poster.url) : null,
                    network: ep.series?.network || ''
                });
            });
        }

        if (data.radarr?.calendar) {
            data.radarr.calendar.forEach((movie: any) => {
                const releaseDateStr = movie.digitalRelease || movie.physicalRelease || movie.inCinemas || movie.added;
                if (releaseDateStr) {
                    const poster = movie.images?.find((img: any) => img.coverType === 'poster');
                    items.push({
                        id: `radarr-${movie.id || releaseDateStr}-${movie.title}`,
                        type: 'movie',
                        service: 'Radarr',
                        title: movie.title,
                        subtitle: movie.studio || 'Movie Release',
                        date: new Date(releaseDateStr),
                        hasFile: movie.hasFile,
                        monitored: movie.monitored,
                        imageUrl: poster ? (poster.remoteUrl || poster.url) : null,
                        network: movie.studio || ''
                    });
                }
            });
        }

        return items.sort((a, b) => a.date.getTime() - b.date.getTime());
    }, [data]);

    const filteredCalendar = useMemo(() => {
        return calendarItems;
    }, [calendarItems]);

    useEffect(() => {
        let cancelled = false;
        const maybeAutoSelectMonthWithReleases = async () => {
            if (!data || monthOffset !== 0 || calendarItems.length > 0) {
                if (!cancelled && monthOffset === 0) {
                    setAutoMonthNotice('');
                }
                return;
            }
            for (let offset = 1; offset <= 6; offset += 1) {
                try {
                    const res = await apiFetch(`/api/media-stack/summary?monthOffset=${offset}`);
                    const sonarrCount = Array.isArray(res?.sonarr?.calendar) ? res.sonarr.calendar.length : 0;
                    const radarrCount = Array.isArray(res?.radarr?.calendar) ? res.radarr.calendar.length : 0;
                    if ((sonarrCount + radarrCount) > 0) {
                        if (cancelled) return;
                        setData(res);
                        setMonthOffset(offset);
                        setAutoMonthNotice(`Showing the next month with releases (${new Date(new Date().setFullYear(new Date().getFullYear(), new Date().getMonth() + offset, 1)).toLocaleDateString('default', { month: 'long', year: 'numeric' })}).`);
                        return;
                    }
                } catch {
                    // Keep trying next month; this is a best-effort UX fallback.
                }
            }
            if (!cancelled) {
                setAutoMonthNotice('No releases found in the next 6 months.');
            }
        };
        maybeAutoSelectMonthWithReleases();
        return () => {
            cancelled = true;
        };
    }, [calendarItems.length, data, monthOffset]);

    const groupedCalendar = useMemo(() => {
        const groups: { [dateStr: string]: typeof filteredCalendar } = {};
        filteredCalendar.forEach(item => {
            const dateStr = item.date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
            if (!groups[dateStr]) groups[dateStr] = [];
            groups[dateStr].push(item);
        });
        return groups;
    }, [filteredCalendar]);

    useEffect(() => {
        if (filteredCalendar.length > 0) {
            setActiveCalendarItem((prev: any) => {
                if (prev && filteredCalendar.find(i => i.id === prev.id)) return prev;
                return filteredCalendar[0];
            });
        } else {
            setActiveCalendarItem(null);
        }
    }, [filteredCalendar]);

    const activeQueue = useMemo(() => {
        if (!data) return [];
        const queueItems: any[] = [];
        if (data.sonarr?.queue?.records) {
            data.sonarr.queue.records.forEach((item: any) => {
                queueItems.push({ ...item, service: 'Sonarr' });
            });
        }
        if (data.radarr?.queue?.records) {
            data.radarr.queue.records.forEach((item: any) => {
                queueItems.push({ ...item, service: 'Radarr' });
            });
        }
        return queueItems;
    }, [data]);

    const combinedHistory = useMemo(() => {
        if (!data) return [];
        const historyItems: any[] = [];
        if (data.sonarr?.history?.records) {
            data.sonarr.history.records.forEach((item: any) => {
                let cleanTitle = '';
                if (item.series?.title) {
                    cleanTitle = item.series.title;
                    if (item.episode?.seasonNumber !== undefined && item.episode?.episodeNumber !== undefined) {
                        cleanTitle += ` - S${String(item.episode.seasonNumber).padStart(2, '0')}E${String(item.episode.episodeNumber).padStart(2, '0')}`;
                        if (item.episode.title) {
                            cleanTitle += ` - ${item.episode.title}`;
                        }
                    }
                } else {
                    cleanTitle = item.sourceTitle || 'Unknown TV Show';
                }
                historyItems.push({
                    id: `sonarr-hist-${item.id}`,
                    service: 'Sonarr',
                    title: cleanTitle,
                    date: new Date(item.date),
                    eventType: item.eventType
                });
            });
        }
        if (data.radarr?.history?.records) {
            data.radarr.history.records.forEach((item: any) => {
                historyItems.push({
                    id: `radarr-hist-${item.id}`,
                    service: 'Radarr',
                    title: item.movie?.title || item.sourceTitle || 'Unknown Movie',
                    date: new Date(item.date),
                    eventType: item.eventType
                });
            });
        }
        return historyItems.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 8);
    }, [data]);

    if (isLoading) return <Loader isLoading={true} />;
    if (error) return <div className="text-center p-8 text-status-expiring">{error}</div>;
    if (!data) return null;

    const getHistoryColor = (type: string) => {
        if (!type) return 'bg-muted';
        switch (type.toLowerCase()) {
            case 'grabbed':
                return 'bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.5)]';
            case 'downloadfolderimported':
            case 'moviefileimported':
            case 'imported':
                return 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]';
            case 'downloadfailed':
            case 'failed':
                return 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]';
            case 'episodefiledeleted':
            case 'moviefiledeleted':
            case 'deleted':
                return 'bg-zinc-600 shadow-[0_0_6px_rgba(113,113,122,0.5)]';
            default:
                return 'bg-plex shadow-[0_0_6px_rgba(229,160,13,0.5)]';
        }
    };

    const formatEventType = (type: string) => {
        if (!type) return '';
        switch (type.toLowerCase()) {
            case 'grabbed':
                return 'Grabbed';
            case 'downloadfolderimported':
            case 'moviefileimported':
            case 'imported':
                return 'Imported';
            case 'downloadfailed':
            case 'failed':
                return 'Failed';
            case 'episodefiledeleted':
            case 'moviefiledeleted':
            case 'deleted':
                return 'Deleted';
            default:
                return type
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/^./, str => str.toUpperCase())
                    .trim();
        }
    };

    const renderStatusCard = (name: string, info: any) => {
        if (!info || !info.configured) {
            return (
                <div className="bg-card border border-border/40 rounded-2xl p-4 md:p-6 shadow-xl flex flex-col justify-between h-44 relative overflow-hidden">
                    <div className="flex justify-between items-start">
                        <h3 className="text-lg font-bold text-text/80">{name}</h3>
                        <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-white/5 text-muted border border-white/5">Unconfigured</span>
                    </div>
                    <p className="text-xs text-muted leading-relaxed">Please set the URL and API key in Settings under the Media Stack tab to activate monitoring.</p>
                    <div className="text-right">
                        <span className="text-xs font-bold text-plex hover:underline cursor-pointer">Configure in Settings →</span>
                    </div>
                </div>
            );
        }

        const status = info.status;
        const disk = info.disk ? info.disk[0] : null;
        const freeGB = disk ? (disk.freeSpace / 1024 / 1024 / 1024) : 0;
        const totalGB = disk ? (disk.totalSpace / 1024 / 1024 / 1024) : 1;
        const freePercent = disk ? (freeGB / totalGB) * 100 : 0;
        const usedPercent = 100 - freePercent;
        const isReachable = !!status;

        return (
            <div className="bg-card border border-white/5 shadow-2xl rounded-2xl p-4 md:p-6 relative overflow-hidden backdrop-blur-sm group hover:border-white/10 transition-all duration-300">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-all duration-500">
                    <HardDrive className="w-24 h-24" />
                </div>

                <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-plex/10 flex items-center justify-center border border-plex/20">
                        {name === 'Sonarr' ? <Tv className="w-5 h-5 text-plex" /> : <Film className="w-5 h-5 text-plex" />}
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-text tracking-wide">{name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className={`w-2 h-2 rounded-full ${isReachable ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'}`}></span>
                            <span className={`text-[10px] font-bold tracking-wider uppercase ${isReachable ? 'text-green-500' : 'text-red-400'}`}>{isReachable ? 'Online' : 'Unavailable'}</span>
                            {status?.version && <span className="text-[10px] text-muted font-bold">v{status.version}</span>}
                        </div>
                    </div>
                </div>
                {!isReachable && (
                    <p className="text-[11px] text-red-300 mb-2">Unable to fetch data from {name}. Check URL/API key and local network reachability.</p>
                )}

                {disk && (
                    <div className="bg-background/40 rounded-xl p-3 border border-white/5 mt-2">
                        <div className="flex justify-between items-end mb-1">
                            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Free Storage</span>
                            <span className="text-xs font-bold text-text">{freeGB.toFixed(1)} GB free</span>
                        </div>
                        <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                            <div className="bg-plex h-full rounded-full transition-all duration-500" style={{ width: `${usedPercent}%` }}></div>
                        </div>
                        <div className="flex justify-between text-[9px] text-muted/60 mt-1 font-medium">
                            <span>{usedPercent.toFixed(0)}% Used</span>
                            <span>{totalGB.toFixed(0)} GB Total</span>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="w-full animate-fade-in flex flex-col gap-6">
            <div className="flex items-center justify-between gap-4 mb-2">
                <div>
                    <h1 className="text-3xl font-bold text-text uppercase tracking-widest flex items-center gap-3">
                        <Layers className="w-8 h-8 text-plex" />
                        Media Stack
                    </h1>
                    <p className="text-muted text-sm mt-1">Unified monitoring dashboard for TV & movies</p>
                </div>
            </div>

            <div className="flex flex-col gap-8 w-full">

                <div className="w-full">

                    <div className="bg-card border border-white/5 shadow-2xl rounded-2xl p-4 md:p-6 relative">
                        <div className="flex flex-row justify-between items-center mb-4 md:mb-6 border-b border-border/30 pb-3 md:pb-4 gap-2">
                            <h2 className="text-base sm:text-xl font-bold text-text flex items-center gap-1.5 md:gap-2 truncate">
                                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-plex flex-shrink-0" />
                                <span className="truncate">Upcoming Releases</span>
                            </h2>

                            <div className="flex bg-white/5 p-0.5 md:p-1 rounded-lg md:rounded-xl border border-white/10 w-fit flex-shrink-0 items-center gap-1 md:gap-2">
                                <button onClick={() => { setAutoMonthNotice(''); setMonthOffset(m => m - 1); }} className="p-1 md:p-1.5 hover:bg-white/10 rounded-md md:rounded-lg text-muted hover:text-text transition-colors">
                                    <ChevronLeft className="w-3 h-3 md:w-4 md:h-4" />
                                </button>
                                <span className="text-[10px] md:text-xs font-bold px-1 w-16 md:w-28 text-center text-text uppercase tracking-wider">
                                    {new Date(new Date().setFullYear(new Date().getFullYear(), new Date().getMonth() + monthOffset, 1)).toLocaleDateString('default', { month: 'short', year: 'numeric' })}
                                </span>
                                <button onClick={() => { setAutoMonthNotice(''); setMonthOffset(m => m + 1); }} className="p-1 md:p-1.5 hover:bg-white/10 rounded-md md:rounded-lg text-muted hover:text-text transition-colors">
                                    <ChevronRight className="w-3 h-3 md:w-4 md:h-4" />
                                </button>
                            </div>
                        </div>
                        {autoMonthNotice && (
                            <p className="text-xs text-plex/90 mb-3">{autoMonthNotice}</p>
                        )}

                        {filteredCalendar.length === 0 ? (
                            <div className="text-center py-12 bg-background/30 rounded-xl border border-white/5 text-muted text-sm">
                                <Calendar className="w-12 h-12 text-muted/30 mx-auto mb-3" />
                                No upcoming releases for this month
                            </div>
                        ) : (
                            <div className="flex items-start gap-3 md:gap-8 w-full">
                                {/* Left Sticky Poster */}
                                <div className="sticky top-[64px] md:top-[88px] w-[120px] sm:w-[160px] md:w-[320px] flex-shrink-0">
                                    <div className="flex flex-col gap-4 mt-8 md:mt-0">
                                        <div className="relative aspect-[2/3] rounded-lg md:rounded-2xl overflow-hidden shadow-2xl border border-white/10 group bg-card">
                                            {activeCalendarItem?.imageUrl ? (
                                                <img src={activeCalendarItem.imageUrl} alt={activeCalendarItem.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center opacity-30">
                                                    {activeCalendarItem?.type === 'tv' ? <Tv className="w-10 h-10 md:w-20 md:h-20 mb-2 md:mb-4" /> : <Film className="w-10 h-10 md:w-20 md:h-20 mb-2 md:mb-4" />}
                                                    <span className="font-bold uppercase tracking-widest text-[8px] md:text-sm">No Poster</span>
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-transparent flex flex-col justify-start p-2 md:p-4">
                                                {activeCalendarItem?.network && (
                                                    <span className="hidden md:block text-sm text-white/90 uppercase tracking-widest font-bold text-left drop-shadow-lg">{activeCalendarItem.network}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Vertical List */}
                                <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 md:gap-8 pb-4">
                                    {Object.entries(groupedCalendar).map(([dateStr, items]: [string, typeof filteredCalendar]) => (
                                        <div key={dateStr} className="flex flex-col gap-2 md:gap-3">
                                            <div className="sticky top-[64px] md:top-0 bg-card z-20 py-1 md:py-3 border-b border-white/10 md:mb-2 -mx-4 px-4 md:mx-0 md:px-0 shadow-[0_10px_20px_-10px_rgba(0,0,0,0.5)]">
                                                <h3 className="text-sm md:text-xl font-black text-plex md:text-text tracking-tight uppercase">{dateStr}</h3>
                                            </div>
                                            {items.map(item => (
                                                <div
                                                    key={item.id}
                                                    onMouseEnter={() => setActiveCalendarItem(item)}
                                                    onClick={() => setActiveCalendarItem(item)}
                                                    className={`bg-background/40 hover:bg-background/80 transition-all duration-300 rounded-lg md:rounded-xl p-2.5 md:p-4 flex flex-col gap-2 md:gap-3 shadow-md border-l-4 cursor-pointer group ${item.hasFile ? 'border-l-green-500/80' : item.monitored ? 'border-l-red-500/80' : 'border-l-blue-500/80'} ${activeCalendarItem?.id === item.id ? 'bg-white/10 border border-white/30 scale-[1.01] md:scale-[1.02]' : 'border border-white/5 hover:border-white/20'}`}
                                                >
                                                    <div className="flex justify-between items-start gap-2 md:gap-3">
                                                        <div className="min-w-0 flex-grow">
                                                            <div className="flex items-center gap-1.5 md:gap-2 mb-1 md:mb-2">
                                                                <span className="text-[9px] md:text-[11px] text-plex flex items-center gap-1 md:gap-1.5 font-bold tracking-wide">
                                                                    <Clock className="w-3 h-3 md:w-3.5 md:h-3.5" />
                                                                    {formatTime(item.date).replace(/^0:/, '12:')}
                                                                </span>
                                                                <span className={`md:hidden text-[8px] font-black tracking-widest uppercase px-1 rounded ${item.service === 'Sonarr' ? 'text-blue-400' : 'text-red-400'}`}>
                                                                    {item.service}
                                                                </span>
                                                            </div>
                                                            <h4 className="font-bold text-xs sm:text-sm text-text line-clamp-2 md:line-clamp-3 leading-tight group-hover:text-plex transition-colors">
                                                                {item.title}
                                                            </h4>
                                                            <p className="text-[10px] md:text-[12px] text-muted/80 line-clamp-2 mt-0.5 md:mt-1 font-medium">
                                                                {item.subtitle}
                                                            </p>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-1.5 md:gap-2 flex-shrink-0">
                                                            {item.hasFile ? (
                                                                <span className="text-[8px] md:text-[10px] font-bold text-green-500 bg-green-500/10 border border-green-500/20 rounded md:rounded-md px-1.5 py-0.5 md:px-2 md:py-1 whitespace-nowrap">
                                                                    ✓ Ready
                                                                </span>
                                                            ) : (
                                                                item.monitored && (
                                                                    <span className="text-[8px] md:text-[10px] font-bold text-plex bg-plex/10 border border-plex/20 rounded md:rounded-md px-1.5 py-0.5 md:px-2 md:py-1 flex items-center gap-1 md:gap-1.5 whitespace-nowrap">
                                                                        <span className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-plex animate-pulse"></span>
                                                                        Monitored
                                                                    </span>
                                                                )
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="flex flex-col gap-8">
                        <div className="bg-card border border-white/5 shadow-2xl rounded-2xl p-4 md:p-6 relative flex-grow flex flex-col">
                            <h2 className="text-xl font-bold text-text mb-4 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-plex" />
                                Active Downloads ({activeQueue.length})
                            </h2>

                            <div className="flex flex-col gap-3 flex-grow justify-start">
                                {activeQueue.length === 0 ? (
                                    <div className="text-center py-8 bg-background/30 rounded-xl border border-white/5 text-muted text-sm flex-grow flex flex-col justify-center items-center">
                                        <DownloadCloud className="w-10 h-10 text-muted/30 mx-auto mb-2" />
                                        No active downloads
                                    </div>
                                ) : (
                                    activeQueue.map((item: any) => {
                                        const downloaded = item.size - item.sizeleft;
                                        const progress = item.size > 0 ? (downloaded / item.size) * 100 : 0;

                                        return (
                                            <div key={item.id} className="bg-background/40 hover:bg-background/60 transition-all rounded-xl p-4 border border-white/5 flex flex-col gap-2">
                                                <div className="flex justify-between items-start gap-4">
                                                    <div className="flex flex-col gap-1 min-w-0">
                                                        <span className="font-bold text-sm text-text line-clamp-1 leading-snug">{item.title}</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-[8px] uppercase font-black tracking-widest px-1.5 py-0.5 rounded ${item.service === 'Sonarr' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                                                }`}>
                                                                {item.service}
                                                            </span>
                                                            <span className="text-[10px] text-muted/60 font-semibold">{item.timeleft || 'Unknown time'} left</span>
                                                        </div>
                                                    </div>
                                                    <span className="text-[10px] font-bold px-2 py-0.5 bg-plex/10 text-plex rounded-md border border-plex/20 uppercase tracking-wider">{item.status}</span>
                                                </div>
                                                <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden mt-1 relative">
                                                    <div className="bg-plex h-full rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                                                </div>
                                                <div className="flex justify-between text-[10px] text-muted/60 mt-0.5 font-medium">
                                                    <span>{progress.toFixed(1)}%</span>
                                                    <span>{formatBytes(downloaded)} / {formatBytes(item.size)}</span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <h2 className="text-xl font-bold text-text flex items-center gap-2 mb-1">
                            <Layers className="w-5 h-5 text-plex" />
                            Stack Status
                        </h2>
                        {renderStatusCard('Sonarr', data.sonarr)}
                        {renderStatusCard('Radarr', data.radarr)}
                    </div>

                    <div className="bg-card border border-white/5 shadow-2xl rounded-2xl p-4 md:p-6 relative flex-grow flex flex-col">
                        <h2 className="text-xl font-bold text-text mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-plex" />
                            Recent History
                        </h2>

                        <div className="flex flex-col gap-3 flex-grow justify-start">
                            {combinedHistory.length === 0 ? (
                                <div className="text-center py-12 bg-background/30 rounded-xl border border-white/5 text-muted text-sm flex-grow flex flex-col justify-center items-center">
                                    No recent history records
                                </div>
                            ) : (
                                combinedHistory.map((item: any) => (
                                    <div key={item.id} className="flex items-center gap-3 bg-background/30 rounded-xl p-3 border border-white/5 hover:bg-background/50 transition-colors">
                                        <div className={`w-1 h-8 rounded-full flex-shrink-0 ${getHistoryColor(item.eventType)}`}></div>
                                        <div className="flex-grow min-w-0">
                                            <div className="font-bold text-xs text-text line-clamp-1 leading-snug">{item.title}</div>
                                            <div className="text-[10px] text-muted flex justify-between items-center mt-0.5">
                                                <span>{item.service} • <span>{formatEventType(item.eventType)}</span></span>
                                                <span>{formatRelativeAirDate(item.date)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const GRAPH_COLORS = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#14b8a6', // teal
    '#f97316', // orange
    '#a855f7'  // violet
];

const TautulliGraphsTab: React.FC = () => {
    const [graphs, setGraphs] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [days, setDays] = useState('30');
    const [yAxis, setYAxis] = useState<'plays' | 'duration'>('plays');

    useEffect(() => {
        let cancelled = false;
        setIsLoading(true);
        setError('');
        apiFetch(`/api/tautulli/graphs?days=${days}&y_axis=${yAxis}`)
            .then(data => {
                if (cancelled) return;
                setGraphs(data);
                setIsLoading(false);
            })
            .catch(err => {
                if (cancelled) return;
                setError(err.message || 'Failed to load graphs');
                setIsLoading(false);
            });
        return () => { cancelled = true; };
    }, [days, yAxis]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64 glass-card-sm mt-6">
                <RefreshCw className="w-8 h-8 text-plex animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-xl mt-6 flex items-center gap-3">
                <AlertCircle className="w-6 h-6" />
                <span>{error}</span>
            </div>
        );
    }

    if (!graphs || Object.keys(graphs).length === 0) {
        return null;
    }

    const {
        get_plays_by_date,
        get_plays_by_dayofweek,
        get_plays_by_hourofday,
        get_plays_by_stream_type,
        get_plays_by_stream_resolution,
        get_plays_by_top_10_platforms,
        get_concurrent_streams_by_stream_type,
        get_plays_by_source_resolution,
        get_plays_by_top_10_users
    } = graphs;

    const parseDateData = (data: any) => {
        if (!data || !data.categories || !data.series) return [];
        return data.categories.map((date: string, i: number) => {
            const obj: any = { date };
            data.series.forEach((s: any) => {
                let val = s.data[i] || 0;
                if (yAxis === 'duration') {
                    // Convert seconds to hours, rounded to 1 decimal place
                    val = parseFloat((val / 3600).toFixed(1));
                }
                obj[s.name] = val;
            });
            return obj;
        });
    };

    const parseConcurrentData = (data: any) => {
        if (!data || !data.categories || !data.series) return [];
        return data.categories.map((date: string, i: number) => {
            const obj: any = { date };
            data.series.forEach((s: any) => {
                obj[s.name] = s.data[i] || 0;
            });
            return obj;
        });
    };

    const getSeriesKeys = (data: any) => {
        if (!data || !data.series) return [];
        return data.series.map((s: any) => s.name);
    };

    const STREAM_COLORS: Record<string, string> = {
        'Direct Play': '#eab308',
        'Direct Stream': '#e2e8f0',
        'Transcode': '#ef4444'
    };

    const dailyData = parseDateData(get_plays_by_date);
    const dayOfWeekData = parseDateData(get_plays_by_dayofweek);
    const hourOfDayData = parseDateData(get_plays_by_hourofday);

    const streamTypeData = parseDateData(get_plays_by_stream_type);
    const streamTypeKeys = getSeriesKeys(get_plays_by_stream_type);

    const concurrentData = parseConcurrentData(get_concurrent_streams_by_stream_type);
    const concurrentKeys = getSeriesKeys(get_concurrent_streams_by_stream_type);

    const resolutionData = parseDateData(get_plays_by_stream_resolution);
    const resolutionKeys = getSeriesKeys(get_plays_by_stream_resolution);

    const platformData = parseDateData(get_plays_by_top_10_platforms);
    const platformKeys = getSeriesKeys(get_plays_by_top_10_platforms);

    const sourceResolutionData = parseDateData(get_plays_by_source_resolution);
    const sourceResolutionKeys = getSeriesKeys(get_plays_by_source_resolution);

    const topUsersData = parseDateData(get_plays_by_top_10_users);
    const topUsersKeys = getSeriesKeys(get_plays_by_top_10_users);

    return (
        <div className="space-y-6 mt-6 min-w-0">
            <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center gap-4">
                {/* Y-Axis Toggle */}
                <div className="flex bg-black/40 rounded-lg p-1 border border-white/5 w-fit">
                    <button onClick={() => setYAxis('plays')} className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-colors ${yAxis === 'plays' ? 'bg-plex text-white shadow-lg' : 'text-muted hover:text-white'}`}>
                        Play Count
                    </button>
                    <button onClick={() => setYAxis('duration')} className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-colors ${yAxis === 'duration' ? 'bg-plex text-white shadow-lg' : 'text-muted hover:text-white'}`}>
                        Watch Duration
                    </button>
                </div>
                {/* Timeframe selector */}
                <div className="w-48">
                    <CustomSelect
                        value={days}
                        onChange={setDays}
                        options={[
                            { label: 'Last 7 Days', value: '7' },
                            { label: 'Last 30 Days', value: '30' },
                            { label: 'Last 90 Days', value: '90' },
                            { label: 'Last 365 Days', value: '365' },
                            { label: 'All Time', value: '0' }
                        ]}
                    />
                </div>
            </div>

            {/* Daily Play Count by Media Type */}
            <div className="glass-card-sm p-4 md:p-6 relative overflow-hidden">
                <h3 className="text-lg font-bold text-text mb-4 uppercase tracking-wider flex items-center gap-2">
                    <LucideLineChart className="w-5 h-5 text-[#3b82f6]" /> {yAxis === 'plays' ? 'Daily Play Count by Media Type' : 'Daily Watch Duration by Media Type (Hours)'}
                </h3>
                <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                            <XAxis dataKey="date" stroke="#666" tick={{ fill: '#888', fontSize: 12 }} tickMargin={10} minTickGap={20} />
                            <YAxis stroke="#666" tick={{ fill: '#888', fontSize: 12 }} />
                            <RechartsTooltip contentStyle={{ backgroundColor: '#1e2329', borderColor: '#333', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                            <Line type="monotone" dataKey="TV" stroke="#eab308" strokeWidth={2} dot={false} />
                            <Line type="monotone" dataKey="Movies" stroke="#3b82f6" strokeWidth={2} dot={false} />
                            <Line type="monotone" dataKey="Music" stroke="#ef4444" strokeWidth={2} dot={false} />
                            <Line type="monotone" dataKey="Total" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Play count by day of week */}
                <div className="glass-card-sm p-4 md:p-6 relative overflow-hidden">
                    <h3 className="text-lg font-bold text-text mb-4 uppercase tracking-wider flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-green-400" /> {yAxis === 'plays' ? 'Play Count by Day of Week' : 'Watch Duration by Day of Week (Hours)'}
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dayOfWeekData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                <XAxis dataKey="date" stroke="#666" tick={{ fill: '#888', fontSize: 12 }} />
                                <YAxis stroke="#666" tick={{ fill: '#888', fontSize: 12 }} />
                                <RechartsTooltip cursor={{ fill: '#ffffff10' }} contentStyle={{ backgroundColor: '#1e2329', borderColor: '#333', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                                <Legend />
                                <Bar dataKey="TV" stackId="a" fill="#eab308" />
                                <Bar dataKey="Movies" stackId="a" fill="#3b82f6" />
                                <Bar dataKey="Music" stackId="a" fill="#ef4444" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Play count by hour of day */}
                <div className="glass-card-sm p-4 md:p-6 relative overflow-hidden">
                    <h3 className="text-lg font-bold text-text mb-4 uppercase tracking-wider flex items-center gap-2">
                        <Clock className="w-5 h-5 text-orange-400" /> {yAxis === 'plays' ? 'Play Count by Hour of Day' : 'Watch Duration by Hour of Day (Hours)'}
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={hourOfDayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                <XAxis dataKey="date" stroke="#666" tick={{ fill: '#888', fontSize: 12 }} />
                                <YAxis stroke="#666" tick={{ fill: '#888', fontSize: 12 }} />
                                <RechartsTooltip cursor={{ fill: '#ffffff10' }} contentStyle={{ backgroundColor: '#1e2329', borderColor: '#333', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                                <Legend />
                                <Bar dataKey="TV" stackId="a" fill="#eab308" />
                                <Bar dataKey="Movies" stackId="a" fill="#3b82f6" />
                                <Bar dataKey="Music" stackId="a" fill="#ef4444" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Play count by stream type */}
                <div className="glass-card-sm p-4 md:p-6 relative overflow-hidden">
                    <h3 className="text-lg font-bold text-text mb-4 uppercase tracking-wider flex items-center gap-2">
                        <Activity className="w-5 h-5 text-sky-400" /> {yAxis === 'plays' ? 'Daily Stream Type Breakdown' : 'Daily Stream Type Duration Breakdown (Hours)'}
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={streamTypeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                <XAxis dataKey="date" stroke="#666" tick={{ fill: '#888', fontSize: 12 }} />
                                <YAxis stroke="#666" tick={{ fill: '#888', fontSize: 12 }} />
                                <RechartsTooltip contentStyle={{ backgroundColor: '#1e2329', borderColor: '#333', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                                <Legend />
                                {streamTypeKeys.map((key: string) => (
                                    <Line key={key} type="monotone" dataKey={key} stroke={STREAM_COLORS[key] || '#3b82f6'} strokeWidth={2} dot={false} />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Concurrent streams by stream type */}
                <div className="glass-card-sm p-4 md:p-6 relative overflow-hidden">
                    <h3 className="text-lg font-bold text-text mb-4 uppercase tracking-wider flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-plex" /> Daily Concurrent Stream Count by Stream Type
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={concurrentData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                <XAxis dataKey="date" stroke="#666" tick={{ fill: '#888', fontSize: 12 }} />
                                <YAxis stroke="#666" tick={{ fill: '#888', fontSize: 12 }} />
                                <RechartsTooltip contentStyle={{ backgroundColor: '#1e2329', borderColor: '#333', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                                <Legend />
                                {concurrentKeys.map((key: string) => (
                                    <Line key={key} type="monotone" dataKey={key} stroke={STREAM_COLORS[key] || '#3b82f6'} strokeWidth={2} dot={false} />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Play count by stream resolution */}
                <div className="glass-card-sm p-4 md:p-6 relative overflow-hidden">
                    <h3 className="text-lg font-bold text-text mb-4 uppercase tracking-wider flex items-center gap-2">
                        <MonitorSmartphone className="w-5 h-5 text-purple-400" /> {yAxis === 'plays' ? 'Stream Resolution Breakdown' : 'Stream Resolution Duration Breakdown (Hours)'}
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={resolutionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                <XAxis dataKey="date" stroke="#666" tick={{ fill: '#888', fontSize: 12 }} />
                                <YAxis stroke="#666" tick={{ fill: '#888', fontSize: 12 }} />
                                <RechartsTooltip cursor={{ fill: '#ffffff10' }} contentStyle={{ backgroundColor: '#1e2329', borderColor: '#333', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                                <Legend />
                                {resolutionKeys.map((key: string, idx: number) => (
                                    <Bar key={key} dataKey={key} stackId="a" fill={GRAPH_COLORS[idx % GRAPH_COLORS.length]} />
                                ))}
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Play count by platform */}
                <div className="glass-card-sm p-4 md:p-6 relative overflow-hidden flex flex-col justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-text mb-4 uppercase tracking-wider flex items-center gap-2">
                            <Users className="w-5 h-5 text-teal-400" /> {yAxis === 'plays' ? 'Top 10 Streaming Platforms' : 'Top 10 Platforms by Watch Duration (Hours)'}
                        </h3>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={platformData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                    <XAxis dataKey="date" stroke="#666" tick={{ fill: '#888', fontSize: 12 }} />
                                    <YAxis stroke="#666" tick={{ fill: '#888', fontSize: 12 }} />
                                    <RechartsTooltip cursor={{ fill: '#ffffff10' }} contentStyle={{ backgroundColor: '#1e2329', borderColor: '#333', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                                    <Legend />
                                    {platformKeys.map((key: string, idx: number) => (
                                        <Bar key={key} dataKey={key} stackId="a" fill={GRAPH_COLORS[idx % GRAPH_COLORS.length]} />
                                    ))}
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Play count by source resolution */}
                <div className="glass-card-sm p-4 md:p-6 relative overflow-hidden">
                    <h3 className="text-lg font-bold text-text mb-4 uppercase tracking-wider flex items-center gap-2">
                        <Layers className="w-5 h-5 text-indigo-400" /> {yAxis === 'plays' ? 'Source File Resolution Breakdown' : 'Source File Resolution Duration Breakdown (Hours)'}
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={sourceResolutionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                <XAxis dataKey="date" stroke="#666" tick={{ fill: '#888', fontSize: 12 }} />
                                <YAxis stroke="#666" tick={{ fill: '#888', fontSize: 12 }} />
                                <RechartsTooltip cursor={{ fill: '#ffffff10' }} contentStyle={{ backgroundColor: '#1e2329', borderColor: '#333', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                                <Legend />
                                {sourceResolutionKeys.map((key: string, idx: number) => (
                                    <Bar key={key} dataKey={key} stackId="a" fill={GRAPH_COLORS[idx % GRAPH_COLORS.length]} />
                                ))}
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Play count by top 10 users */}
                <div className="glass-card-sm p-4 md:p-6 relative overflow-hidden flex flex-col justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-text mb-4 uppercase tracking-wider flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-amber-400" /> {yAxis === 'plays' ? 'Top 10 Active Users Breakdown' : 'Top 10 Users by Watch Duration (Hours)'}
                        </h3>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topUsersData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                    <XAxis dataKey="date" stroke="#666" tick={{ fill: '#888', fontSize: 12 }} />
                                    <YAxis stroke="#666" tick={{ fill: '#888', fontSize: 12 }} />
                                    <RechartsTooltip cursor={{ fill: '#ffffff10' }} contentStyle={{ backgroundColor: '#1e2329', borderColor: '#333', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                                    <Legend />
                                    {topUsersKeys.map((key: string, idx: number) => (
                                        <Bar key={key} dataKey={key} stackId="a" fill={GRAPH_COLORS[idx % GRAPH_COLORS.length]} />
                                    ))}
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ServerInsightsWidget: React.FC<{
    peakHours: number[],
    tautulliData: any,
    compare: any,
    analyticsSourceLabel: string
}> = ({ peakHours, tautulliData, compare, analyticsSourceLabel }) => {
    
    // Format chart data
    const chartData = peakHours ? peakHours.map((count, hour) => {
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const h = hour % 12 || 12;
        return {
            time: `${h}${ampm}`,
            plays: count
        };
    }) : [];

    const formatChange = (data: any) => {
        if (!data || data.percent === null) return null;
        const isPos = data.percent > 0;
        const color = isPos ? 'text-green-500' : (data.percent < 0 ? 'text-red-500' : 'text-muted');
        const icon = isPos ? '↑' : (data.percent < 0 ? '↓' : '');
        return <span className={`text-xs font-bold ${color} ml-2`}>{icon}{Math.abs(data.percent)}%</span>;
    };

    return (
        <div className="w-full flex flex-col gap-6 lg:col-span-2">
            <h2 className="text-xl font-bold text-text uppercase tracking-wider flex items-center gap-2">
                <Activity className="text-plex w-5 h-5" /> Server Insights & Load
            </h2>

            {/* Peak Hours Chart */}
            <div className="glass-card-sm p-4 md:p-6 w-full flex flex-col flex-1">
                <h3 className="text-sm font-bold text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Peak Playback Hours
                </h3>
                <div className="w-full h-[250px] sm:h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorPlays" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#e5a00d" stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor="#e5a00d" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                            <XAxis dataKey="time" stroke="#ffffff40" fontSize={10} tickMargin={10} minTickGap={15} />
                            <YAxis stroke="#ffffff40" fontSize={10} tickFormatter={(val) => val} />
                            <RechartsTooltip 
                                contentStyle={{ backgroundColor: '#111315', borderColor: '#ffffff20', borderRadius: '8px', color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                                itemStyle={{ color: '#e5a00d' }}
                                formatter={(value: any) => [`${value} plays`, 'Activity']}
                            />
                            <Area type="monotone" dataKey="plays" stroke="#e5a00d" strokeWidth={3} fillOpacity={1} fill="url(#colorPlays)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Server Records Grid */}
            {tautulliData && (
                <div className="glass-card-sm p-4 md:p-6 w-full flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-5 pointer-events-none">
                        <Activity className="w-48 h-48 text-[#3b82f6]" />
                    </div>
                    <h3 className="text-sm font-bold text-muted uppercase tracking-wider mb-4 flex items-center gap-2 relative z-10">
                        <Activity className="w-4 h-4 text-[#3b82f6]" /> {analyticsSourceLabel} Records & Period Stats
                    </h3>
                    <div className="grid grid-cols-2 gap-3 relative z-10">
                        <div className="flex flex-col p-3 bg-black/20 rounded-lg border border-white/5 shadow-inner">
                            <span className="font-bold text-muted text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1.5"><Users className="w-3 h-3 text-[#3b82f6]"/> Peak Streams</span>
                            <p className="text-xl font-black text-[#3b82f6]">{tautulliData?.streamsRecord || 0} <span className="text-[9px] font-normal text-muted">concurrent</span></p>
                        </div>
                        <div className="flex flex-col p-3 bg-black/20 rounded-lg border border-white/5 shadow-inner">
                            <span className="font-bold text-muted text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1.5"><Clock className="w-3 h-3 text-green-400"/> Watch Time</span>
                            <p className="text-base font-black text-green-400 leading-tight">{tautulliData?.totalTimeStr || '0 mins'}</p>
                        </div>
                        <div className="flex flex-col p-3 bg-black/20 rounded-lg border border-white/5 shadow-inner">
                            <span className="font-bold text-muted text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1.5"><TrendingUp className="w-3 h-3 text-yellow-400"/> Period Plays</span>
                            <p className="text-xl font-black text-yellow-400 flex items-center">{compare?.totalPlaybacks?.current || 0} {formatChange(compare?.totalPlaybacks)}</p>
                        </div>
                        <div className="flex flex-col p-3 bg-black/20 rounded-lg border border-white/5 shadow-inner">
                            <span className="font-bold text-muted text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1.5"><Users className="w-3 h-3 text-pink-400"/> Unique Viewers</span>
                            <p className="text-xl font-black text-pink-400 flex items-center">{compare?.uniqueViewers?.current || 0} {formatChange(compare?.uniqueViewers)}</p>
                        </div>
                        <div className="flex flex-col p-3 bg-black/20 rounded-lg border border-white/5 shadow-inner">
                            <span className="font-bold text-muted text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1.5"><Monitor className="w-3 h-3 text-cyan-400" /> Peak Direct Plays</span>
                            <p className="font-mono font-black text-cyan-400 text-xl">{tautulliData?.directPlayRecord || 0}</p>
                        </div>
                        <div className="flex flex-col p-3 bg-black/20 rounded-lg border border-white/5 shadow-inner">
                            <span className="font-bold text-muted text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1.5"><Activity className="w-3 h-3 text-orange-400" /> Peak Direct Streams</span>
                            <p className="font-mono font-black text-orange-400 text-xl">{tautulliData?.directStreamRecord || 0}</p>
                        </div>
                        <div className="flex flex-col p-3 bg-black/20 rounded-lg border border-white/5 shadow-inner">
                            <span className="font-bold text-muted text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1.5"><Settings className="w-3 h-3 text-rose-400" /> Peak Transcodes</span>
                            <p className="font-mono font-black text-rose-400 text-xl">{tautulliData?.transcodeRecord || 0}</p>
                        </div>
                        <div className="flex flex-col p-3 bg-black/20 rounded-lg border border-white/5 shadow-inner">
                            <span className="font-bold text-muted text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1.5"><PlaySquare className="w-3 h-3 text-purple-400" /> TV Shows Played</span>
                            <p className="font-mono font-black text-purple-400 text-xl">{tautulliData?.tvPlays ? tautulliData.tvPlays.toLocaleString() : 0}</p>
                        </div>
                        <div className="flex flex-col p-3 bg-black/20 rounded-lg border border-white/5 shadow-inner">
                            <span className="font-bold text-muted text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1.5"><Film className="w-3 h-3 text-red-400" /> Movies Played</span>
                            <p className="font-mono font-black text-red-400 text-xl">{tautulliData?.moviePlays ? tautulliData.moviePlays.toLocaleString() : 0}</p>
                        </div>
                        <div className="flex flex-col p-3 bg-black/20 rounded-lg border border-white/5 shadow-inner">
                            <span className="font-bold text-muted text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1.5"><Music className="w-3 h-3 text-emerald-400" /> Music Played</span>
                            <p className="font-mono font-black text-emerald-400 text-xl">{tautulliData?.musicPlays ? tautulliData.musicPlays.toLocaleString() : 0}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const LibraryDeltaBadge: React.FC<{ value?: number }> = ({ value }) => {
    if (!value) return null;
    const isPos = value > 0;
    return (
        <span className={`text-sm font-bold ml-2 ${isPos ? 'text-green-500' : 'text-red-500'} animate-[fade-in_0.5s_ease-out]`}>
            {isPos ? '+' : ''}{value.toLocaleString()}
        </span>
    );
};
const AnimatedLeaderboard: React.FC<{ users: any[], resolveAvatar: (thumb: string | null | undefined, w?: number, h?: number) => string, isAdmin: boolean, onUserClick: (u: any) => void }> = ({ users, resolveAvatar, isAdmin, onUserClick }) => {
    const prevUsersRef = useRef<any[]>([]);
    
    useEffect(() => {
        prevUsersRef.current = users;
    }, [users]);

    const prevUsers = prevUsersRef.current;
    
    if (!users || users.length === 0) return null;

    const maxPlays = Math.max(...users.map(u => u.plays || 0), 1);

    const top3 = users.slice(0, 3);
    const rest = users.slice(3, 10);

    const getRankDelta = (userId: string, currentRank: number) => {
        if (!prevUsers || prevUsers.length === 0) return null;
        const prevIdx = prevUsers.findIndex(u => u.id === userId);
        if (prevIdx === -1) return { type: 'new' };
        const diff = prevIdx - (currentRank - 1);
        if (diff > 0) return { type: 'up', val: diff };
        if (diff < 0) return { type: 'down', val: Math.abs(diff) };
        return null;
    };

    const renderPodiumCard = (user: any, rank: number) => {
        const delta = getRankDelta(user.id, rank);
        const isFirst = rank === 1;
        const heightClass = isFirst ? 'h-48' : 'h-40';
        const ringClass = isFirst ? 'ring-2 ring-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)]' : rank === 2 ? 'ring-1 ring-slate-300' : 'ring-1 ring-amber-700';
        
        return (
            <div onClick={() => isAdmin && onUserClick(user)} className={`flex flex-col items-center justify-end bg-card/80 border border-border rounded-xl p-4 relative cursor-pointer hover:bg-white/5 transition-all group w-full ${heightClass} ${ringClass}`}>
                {isFirst && <div className="absolute -top-6 text-4xl animate-[crown-pulse_2s_ease-in-out_infinite]">👑</div>}
                {!isFirst && <div className="absolute -top-4 text-3xl">{rank === 2 ? '🥈' : '🥉'}</div>}
                
                <img src={resolveAvatar(user.thumb, 80, 80)} alt={user.username} onError={(e) => { (e.target as HTMLImageElement).src = logoUrl(); }} className={`rounded-full object-cover mb-2 border-2 ${isFirst ? 'w-20 h-20 border-yellow-500' : 'w-16 h-16 border-border'} bg-card`} />
                <span className="font-bold text-text group-hover:text-plex transition-colors truncate w-full text-center">{user.username}</span>
                <span className="text-xs text-muted font-mono mt-1">{user.plays} plays</span>
                
                {delta && (
                    <div className="absolute -right-2 -top-2">
                        {delta.type === 'new' && <span className="bg-plex text-black text-[9px] font-bold px-1.5 py-0.5 rounded-full animate-[rank-up_0.3s_ease-out]">NEW</span>}
                        {delta.type === 'up' && <span className="bg-green-500/20 text-green-400 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center animate-[rank-up_0.3s_ease-out]">↑{delta.val}</span>}
                        {delta.type === 'down' && <span className="bg-red-500/20 text-red-400 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center animate-[rank-down_0.3s_ease-out]">↓{delta.val}</span>}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="w-full flex flex-col gap-4">
            <h2 className="text-xl font-bold text-text uppercase tracking-wider flex items-center gap-2">
                <Trophy className="text-plex w-5 h-5" /> Hall of Fame
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Podium */}
                {top3.length > 0 && (
                    <div className="lg:col-span-1 flex flex-col justify-center h-full pt-8 lg:pt-0">
                        <div className="flex items-end justify-center gap-2 sm:gap-4">
                            {top3[1] && <div className="flex-1 max-w-[120px]">{renderPodiumCard(top3[1], 2)}</div>}
                            <div className="flex-1 max-w-[140px] z-10">{renderPodiumCard(top3[0], 1)}</div>
                            {top3[2] && <div className="flex-1 max-w-[120px]">{renderPodiumCard(top3[2], 3)}</div>}
                        </div>
                    </div>
                )}

                {/* List */}
                <div className="lg:col-span-2 flex flex-col gap-2 justify-center">
                    {rest.map((user, idx) => {
                        const rank = idx + 4;
                        const delta = getRankDelta(user.id, rank);
                        const pct = Math.max(2, (user.plays / maxPlays) * 100);
                        const hasFire = user.plays >= (maxPlays * 0.4) && user.plays > 0;

                        return (
                            <div key={user.id} onClick={() => isAdmin && onUserClick(user)} className="flex items-center gap-3 sm:gap-4 bg-black/20 p-2 sm:p-3 rounded-lg border border-border/50 cursor-pointer hover:bg-black/40 hover:border-plex/50 transition-colors group relative overflow-hidden">
                                <div className="absolute left-0 top-0 bottom-0 bg-plex/10 animate-[bar-grow_1s_ease-out]" style={{ width: `${pct}%` }}></div>
                                
                                <div className="w-6 text-center font-bold text-muted group-hover:text-text z-10">#{rank}</div>
                                <img src={resolveAvatar(user.thumb, 40, 40)} onError={(e) => { (e.target as HTMLImageElement).src = logoUrl(); }} className="w-8 h-8 rounded-full border border-border z-10 bg-card flex-shrink-0" />
                                
                                <div className="flex-1 flex items-center gap-2 z-10 min-w-0">
                                    <span className="font-bold text-text truncate group-hover:text-plex transition-colors">{user.username}</span>
                                    {hasFire && <span className="text-sm" title="Hot Streak!">🔥</span>}
                                </div>

                                <div className="flex items-center gap-3 z-10 flex-shrink-0">
                                    {delta && (
                                        <div className="w-8 sm:w-10 text-right">
                                            {delta.type === 'new' && <span className="bg-plex/20 text-plex text-[9px] font-bold px-1.5 py-0.5 rounded animate-[rank-up_0.3s_ease-out]">NEW</span>}
                                            {delta.type === 'up' && <span className="text-green-400 text-xs font-bold animate-[rank-up_0.3s_ease-out]">↑{delta.val}</span>}
                                            {delta.type === 'down' && <span className="text-red-400 text-xs font-bold animate-[rank-down_0.3s_ease-out]">↓{delta.val}</span>}
                                        </div>
                                    )}
                                    <div className="w-16 sm:w-20 text-right font-mono text-xs sm:text-sm whitespace-nowrap">
                                        <CountUp end={user.plays} /> <span className="text-muted hidden sm:inline">plays</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export const AnalyticsDashboard: React.FC<{ isAdmin: boolean, sessionInfo: any }> = ({ isAdmin, sessionInfo }) => {
    const [analyticsData, setAnalyticsData] = useState<{
        topUsers: any[],
        topLibraries: any[],
        topMovies: any[],
        topShows: any[],
        topMusic: any[],
        topDevices: any[],
        peakHours: number[],
        totalPlaybacks: number,
        maxConcurrentStreams: number,
        maxDirectPlays: number,
        maxTranscodes: number,
        compare?: {
            previousPeriodDays: string,
            totalPlaybacks: { absolute: number, percent: number | null, previous?: number, current?: number },
            uniqueViewers: { absolute: number, percent: number | null, previous?: number, current?: number },
            libraryPlays: { absolute: number, percent: number | null, previous?: number, current?: number }
        } | null,
        libraryHealth?: {
            activeLibraries: number,
            concentrationPct: number,
            totalCatalogItems: number,
            totalCatalogBytes?: number,
            sizeGB: number,
            fourKPercent: number,
            catalogWatchedPct?: number,
            healthLabel: string,
            movies?: number,
            shows?: number,
            episodes?: number,
            artists?: number,
            albums?: number,
            tracks?: number
        },
        requestedPeriodDays?: string | number,
        cachePeriodDays?: string | number | null,
        cacheFallback?: boolean,
    } | null>(null);
    const [tautulliData, setTautulliData] = useState<{ streamsRecord: number, transcodeRecord: number, directPlayRecord: number, directStreamRecord: number, totalPlays: number, tvPlays: number, moviePlays: number, musicPlays: number, totalTimeStr: string } | null>(null);
    const [isLoading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [days, setDays] = useState<string>('30');
    const [selectedUser, setSelectedUser] = useState<{ id: string, username: string, thumb: string | null } | null>(null);
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [contentTab, setContentTab] = useState<'movies' | 'shows' | 'music'>('movies');
    const [viewerPage, setViewerPage] = useState(1);
    const viewersPerPage = 10;
    const [viewTab, setViewTab] = useState<'overview' | 'graphs'>('overview');
    const mediaServerType = String(sessionInfo?.mediaServerType || 'plex').toLowerCase();
    const isJellyfinPortal = mediaServerType === 'jellyfin';
    const analyticsSourceLabel = isJellyfinPortal ? 'Jellystat' : 'Tautulli';
    const libraryDeltas = (analyticsData?.libraryHealth as any)?.deltas || {};

    const resolveUserAvatar = (thumb: string | null | undefined, width = 80, height = 80) => {
        if (!thumb) return logoUrl();
        if (thumb.startsWith('http://') || thumb.startsWith('https://') || thumb.startsWith('/api/')) {
            return resolvePortalAssetUrl(thumb);
        }
        return portalUrl(`/api/plex/image?path=${encodeURIComponent(thumb)}&width=${width}&height=${height}`);
    };

    useEffect(() => {
        if (!isAdmin) return;
        const fetchUsers = async () => {
            try {
                const usersData = await apiFetch('/api/users');
                setAllUsers(usersData);
            } catch (err) {
                console.error("Failed to fetch users", err);
            }
        };
        fetchUsers();
    }, []);

    useEffect(() => {
        let cancelled = false;
        const fetchAnalytics = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await apiFetch(`${isJellyfinPortal ? '/api/jellystat/analytics' : '/api/plex/analytics'}?days=${days}`);
                if (cancelled) return;
                setAnalyticsData(data);

                if (isAdmin) {
                    try {
                        const tData = isJellyfinPortal ? data.jellystatInsights : await apiFetch('/api/tautulli/stats');
                        if (cancelled) return;
                        setTautulliData(tData);
                    } catch (e) {
                        // Tautulli/Jellystat might not be configured, ignore the extra panel.
                        if (!cancelled) setTautulliData(null);
                    }
                } else {
                    setTautulliData(null);
                }
            } catch (err: any) {
                if (!cancelled) setError(err.message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        fetchAnalytics();
        return () => { cancelled = true; };
    }, [days, isAdmin, isJellyfinPortal]);

    useEffect(() => {
        if (isJellyfinPortal && viewTab === 'graphs') setViewTab('overview');
    }, [isJellyfinPortal, viewTab]);

    const topUsersLength = analyticsData?.topUsers?.length || 0;
    const totalViewerPages = Math.max(1, Math.ceil(topUsersLength / viewersPerPage));

    useEffect(() => {
        setViewerPage(1);
    }, [days]);

    useEffect(() => {
        if (viewerPage > totalViewerPages) {
            setViewerPage(totalViewerPages);
        }
    }, [viewerPage, totalViewerPages]);

    if (isLoading) return <Loader isLoading={true} />;
    if (error) return <div className="text-red-500 font-bold p-8 text-center">{error}</div>;
    if (!analyticsData) return null;

    const { topUsers, topLibraries, topMovies, topShows, topMusic, topDevices, peakHours, totalPlaybacks, maxConcurrentStreams, maxDirectPlays, maxTranscodes } = analyticsData;
    const uniqueActiveViewers = topUsers.filter((u: any) => (u.plays || 0) > 0).length;
    const maxLibraryPlays = Math.max(...topLibraries.map(l => l.plays), 1);
    const maxDevicePlays = Math.max(...topDevices.map(d => d.plays), 1);
    const maxPeakHour = Math.max(...peakHours, 1);
    const viewerPageSafe = Math.min(viewerPage, totalViewerPages);
    const pagedTopUsers = topUsers.slice((viewerPageSafe - 1) * viewersPerPage, viewerPageSafe * viewersPerPage);

    let activeContent = topMovies;
    if (contentTab === 'shows') activeContent = topShows;
    else if (contentTab === 'music') activeContent = topMusic;
    const compare = analyticsData.compare || null;
    const libraryHealth = analyticsData.libraryHealth || null;

    const formatPriorPeriodLabel = (days: string) => {
        if (days === '1') return '24 hours';
        if (days === '7') return '7 days';
        if (days === '365') return 'year';
        if (days === '1825') return '5 years';
        return `${days} days`;
    };

    const renderDelta = (delta?: { absolute: number, percent: number | null, previous?: number, current?: number } | null) => {
        if (!delta) return null;
        if (delta.absolute === 0 && delta.previous === 0) return null;
        const isUp = delta.absolute >= 0;
        const sign = isUp ? '+' : '';
        let pctText: string;
        if (delta.percent !== null) {
            pctText = `${sign}${delta.percent}%`;
        } else if ((delta.previous ?? 0) === 0 && delta.absolute > 0) {
            pctText = 'New';
        } else {
            pctText = `${sign}${delta.absolute}`;
        }
        const priorLabel = compare?.previousPeriodDays ? formatPriorPeriodLabel(compare.previousPeriodDays) : null;
        const tooltip = priorLabel
            ? `Compared to the previous ${priorLabel}${delta.previous != null ? ` (${delta.previous})` : ''}`
            : undefined;
        return (
            <span
                title={tooltip}
                className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold mt-1 ${isUp ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}
            >
                {pctText}
            </span>
        );
    };

    return (
        <div className="w-full min-w-0 animate-fade-in flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                <div>
                    <h1 className="text-3xl font-bold text-text uppercase tracking-widest flex items-center gap-3">
                        <BarChart3 className="w-8 h-8 text-plex" />
                        Advanced Analytics
                    </h1>
                    <div className="flex bg-black/40 rounded-lg p-1 border border-white/5 w-fit mt-4">
                        <button onClick={() => setViewTab('overview')} className={`px-4 py-2 rounded-md text-sm font-bold uppercase tracking-wider transition-colors flex items-center gap-2 ${viewTab === 'overview' ? 'bg-plex text-white shadow-lg' : 'text-muted hover:text-white'}`}>
                            <Activity className="w-4 h-4" /> Overview
                        </button>
                        {!isJellyfinPortal && (
                            <button onClick={() => setViewTab('graphs')} className={`px-4 py-2 rounded-md text-sm font-bold uppercase tracking-wider transition-colors flex items-center gap-2 ${viewTab === 'graphs' ? 'bg-plex text-white shadow-lg' : 'text-muted hover:text-white'}`}>
                                <LucideLineChart className="w-4 h-4" /> Graphs
                            </button>
                        )}
                    </div>
                </div>
                {viewTab === 'overview' && (
                    <div className="w-48">
                        <CustomSelect
                            value={days}
                            onChange={(val) => setDays(val as string)}
                            options={[
                                { label: 'Last 24 Hours', value: '1' },
                                { label: 'Last 7 Days', value: '7' },
                                { label: 'Last 30 Days', value: '30' },
                                { label: 'Last 60 Days', value: '60' },
                                { label: 'Last 1 Year', value: '365' },
                                { label: 'Last 5 Years', value: '1825' },
                                { label: 'All Time', value: 'all' }
                            ]}
                        />
                    </div>
                )}
            </div>

            {viewTab === 'graphs' && <TautulliGraphsTab />}

            {viewTab === 'overview' && (
                <>
                    {analyticsData.cacheFallback && (
                        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
                            Analytics cache for this period is still building. Showing cached data from the last {analyticsData.cachePeriodDays} day period instead.
                        </div>
                    )}
                    {/* High Level Stats Overview */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="glass-card-sm p-6 flex items-center gap-4">
                            <div className="bg-plex/10 p-4 rounded-full">
                                <PlaySquare className="text-plex w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-muted text-sm uppercase tracking-wider font-bold mb-1">Total Playbacks</p>
                                <p className="text-2xl font-black text-text"><CountUp end={totalPlaybacks} /></p>
                                {renderDelta(compare?.totalPlaybacks)}
                            </div>
                        </div>
                        <div className="glass-card-sm p-6 flex items-center gap-4">
                            <div className="bg-plex/10 p-4 rounded-full">
                                <Users className="text-plex w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-muted text-sm uppercase tracking-wider font-bold mb-1">Unique Viewers</p>
                                <p className="text-lg font-bold text-text truncate max-w-[150px]" title={String(uniqueActiveViewers)}>{uniqueActiveViewers}</p>
                                {renderDelta(compare?.uniqueViewers)}
                            </div>
                        </div>
                        <div className="glass-card-sm p-6 flex items-center gap-4 col-span-1 sm:col-span-2">
                            <div className="w-full h-full flex flex-col justify-center">
                                <p className="text-muted text-sm uppercase tracking-wider font-bold mb-2 flex items-center gap-2"><Clock className="w-4 h-4 text-plex" /> Peak Viewing Hours</p>
                                <div className="flex items-end gap-1 h-12 w-full mt-auto">
                                    {peakHours.map((val, idx) => (
                                        <div key={idx} className="flex-1 bg-plex opacity-20 hover:opacity-80 transition-opacity rounded-t-sm relative group" style={{ height: `${Math.max((val / maxPeakHour) * 100, 5)}%` }}>
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-black/80 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10">
                                                {idx === 0 ? '12 AM' : idx < 12 ? `${idx} AM` : idx === 12 ? '12 PM' : `${idx - 12} PM`}: {val} plays
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-between text-[10px] text-muted mt-1 font-mono">
                                    <span>12am</span><span>6am</span><span>12pm</span><span>6pm</span><span>11pm</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    {libraryHealth && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="glass-card-sm p-4">
                                    <p className="text-muted text-xs uppercase tracking-wider font-bold mb-1">Library Balance</p>
                                    <p className="text-xl font-black text-plex">{libraryHealth.healthLabel}</p>
                                    <p className="text-[10px] text-muted mt-1 leading-snug">How evenly viewing is spread across libraries — not server health.</p>
                                </div>
                                <div className="glass-card-sm p-4">
                                    <p className="text-muted text-xs uppercase tracking-wider font-bold mb-1">Active Libraries</p>
                                    <p className="text-xl font-black text-text">{libraryHealth.activeLibraries}</p>
                                </div>
                                <div className="glass-card-sm p-4">
                                    <p className="text-muted text-xs uppercase tracking-wider font-bold mb-1">Catalog Size</p>
                                    <p className="text-xl font-black text-text">{libraryHealth.totalCatalogItems.toLocaleString()}</p>
                                    <p className="text-[11px] text-muted">{formatSizeCeil(libraryHealth.totalCatalogBytes ?? libraryHealth.sizeGB * 1024 ** 3)}</p>
                                </div>
                                <div className="glass-card-sm p-4">
                                    <p className="text-muted text-xs uppercase tracking-wider font-bold mb-1">Usage Concentration</p>
                                    <p className="text-xl font-black text-text">{libraryHealth.concentrationPct}%</p>
                                    <p className="text-[11px] text-muted truncate">Watched: {libraryHealth.catalogWatchedPct || 0}% • 4K: {libraryHealth.fourKPercent}%</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="glass-card-sm p-4 flex flex-col justify-center">
                                    <p className="text-muted text-xs uppercase tracking-wider font-bold mb-1">Movies Catalog</p>
                                    <div className="flex items-center">
                                        <p className="text-xl font-black text-text"><CountUp end={libraryHealth.movies || 0} /></p>
                                        <LibraryDeltaBadge value={libraryDeltas.movies} />
                                    </div>
                                    <p className="text-[11px] text-muted">Total movies in library</p>
                                </div>
                                <div className="glass-card-sm p-4 flex flex-col justify-center">
                                    <p className="text-muted text-xs uppercase tracking-wider font-bold mb-1">TV Shows Catalog</p>
                                    <div className="flex items-center gap-1">
                                        <p className="text-xl font-black text-text"><CountUp end={libraryHealth.shows || 0} /></p>
                                        <span className="text-xs font-semibold text-muted ml-1">Shows</span>
                                        <LibraryDeltaBadge value={libraryDeltas.shows} />
                                    </div>
                                    <div className="flex items-center text-[11px] text-muted mt-0.5">
                                        <CountUp end={libraryHealth.episodes || 0} /> <span className="ml-1">episodes</span>
                                        <LibraryDeltaBadge value={libraryDeltas.episodes} />
                                    </div>
                                </div>
                                <div className="glass-card-sm p-4 flex flex-col justify-center">
                                    <p className="text-muted text-xs uppercase tracking-wider font-bold mb-1">Music Catalog</p>
                                    <div className="flex items-center gap-1">
                                        <p className="text-xl font-black text-text"><CountUp end={libraryHealth.artists || 0} /></p>
                                        <span className="text-xs font-semibold text-muted ml-1">Artists</span>
                                        <LibraryDeltaBadge value={libraryDeltas.artists} />
                                    </div>
                                    <div className="flex items-center text-[11px] text-muted mt-0.5">
                                        <CountUp end={libraryHealth.albums || 0} /> <span className="mx-1">albums</span> <LibraryDeltaBadge value={libraryDeltas.albums} />
                                        <span className="mx-1">•</span> 
                                        <CountUp end={libraryHealth.tracks || 0} /> <span className="mx-1">tracks</span> <LibraryDeltaBadge value={libraryDeltas.tracks} />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    <div className="w-full">
                        <AnimatedLeaderboard users={topUsers} resolveAvatar={resolveUserAvatar} isAdmin={isAdmin} onUserClick={setSelectedUser as any} />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        <ServerInsightsWidget 
                            peakHours={analyticsData?.peakHours || []} 
                            tautulliData={tautulliData} 
                            compare={analyticsData?.compare} 
                            analyticsSourceLabel={analyticsSourceLabel}
                        />

                        {/* Top Devices & Libraries Container */}
                        <div className="flex flex-col gap-6 lg:col-span-1">
                            {/* Popular Libraries Card */}
                            <div className="glass-card-sm p-4 md:p-6">
                                <h2 className="text-xl font-bold text-text mb-4 uppercase tracking-wider flex items-center gap-2"><PlaySquare className="text-plex w-5 h-5" /> Popular Libraries</h2>
                                <div className="flex flex-col gap-5 mt-2">
                                    {topLibraries.length === 0 ? <p className="text-muted text-sm">No data available.</p> : topLibraries.map((lib, idx) => (
                                        <div key={lib.id} className="flex flex-col gap-2">
                                            <div className="flex justify-between items-end">
                                                <span className="font-bold text-text flex items-center gap-2"><span className="text-muted text-xs">#{idx + 1}</span> {lib.title}</span>
                                                <span className="text-xs text-muted font-mono">{lib.plays} plays</span>
                                            </div>
                                            <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
                                                <div className="h-full bg-gradient-to-r from-plex to-[#e5a00d] rounded-full" style={{ width: `${(lib.plays / maxLibraryPlays) * 100}%` }}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Top Devices Card */}
                            {topDevices && topDevices.length > 0 && (
                                <div className="glass-card-sm p-4 md:p-6">
                                    <h2 className="text-xl font-bold text-text mb-4 uppercase tracking-wider flex items-center gap-2"><MonitorSmartphone className="text-plex w-5 h-5" /> Top Devices</h2>
                                    <div className="flex flex-col gap-4">
                                        {topDevices.slice(0, 5).map((device: any, idx: number) => (
                                            <div key={idx} className="flex flex-col gap-1.5">
                                                <div className="flex justify-between items-end">
                                                    <span className="font-bold text-sm text-text truncate pr-2 flex items-center gap-2">
                                                        <span className="text-muted text-xs">#{idx + 1}</span> {device.name || 'Unknown Device'}
                                                    </span>
                                                    <span className="text-xs text-muted font-mono flex-shrink-0">{device.plays} plays</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                                                    <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)] transition-all duration-1000" style={{ width: `${(device.plays / Math.max(maxDevicePlays, 1)) * 100}%` }}></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>



                        {/* Trending Content Card */}
                        <div className="glass-card-sm p-4 md:p-6 col-span-full">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                                <h2 className="text-xl font-bold text-text uppercase tracking-wider flex items-center gap-2"><TrendingUp className="text-plex w-5 h-5" /> Trending Content</h2>
                                <div className="flex items-center gap-2 bg-black/30 p-1 rounded-lg border border-border">
                                    <button onClick={() => setContentTab('movies')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${contentTab === 'movies' ? 'bg-plex text-black shadow-md' : 'text-muted hover:text-text hover:bg-white/5'}`}>Movies</button>
                                    <button onClick={() => setContentTab('shows')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${contentTab === 'shows' ? 'bg-plex text-black shadow-md' : 'text-muted hover:text-text hover:bg-white/5'}`}>TV Shows</button>
                                    <button onClick={() => setContentTab('music')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${contentTab === 'music' ? 'bg-plex text-black shadow-md' : 'text-muted hover:text-text hover:bg-white/5'}`}>Music</button>
                                </div>
                            </div>
                            <div className="flex flex-col gap-4">
                                {activeContent.length === 0 ? <p className="text-muted text-sm col-span-full">No data available.</p> : activeContent.slice(0, 10).map((item, idx) => (
                                    <a key={item.key} href={item.plexUrl} target="_blank" rel="noreferrer" className="flex flex-col sm:flex-row bg-black/20 rounded-xl overflow-hidden hover:bg-black/40 transition-all cursor-pointer group hover:ring-1 hover:ring-plex shadow-md">
                                        <div className="sm:w-32 lg:w-40 flex-shrink-0 aspect-[2/3] relative">
                                            {item.thumbUrl ? (
                                                <img src={resolvePortalAssetUrl(item.thumbUrl)} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-black/40"><Film className="w-8 h-8 opacity-50 text-muted" /></div>
                                            )}
                                            <div className="absolute top-2 left-2 bg-plex text-black font-bold text-xs px-2 py-1 rounded-md shadow-lg drop-shadow-md">#{idx + 1}</div>
                                        </div>
                                        <div className="p-4 sm:p-5 flex flex-col justify-between flex-grow">
                                            <div>
                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                    <h3 className="text-lg sm:text-xl font-bold text-text group-hover:text-plex transition-colors line-clamp-1">{item.title}</h3>
                                                    <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-md text-xs font-mono text-plex flex-shrink-0 whitespace-nowrap shadow-sm">
                                                        <PlaySquare className="w-3 h-3" /> {item.plays} plays
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted mb-3 font-medium">
                                                    {item.year && <span>{item.year}</span>}
                                                    {item.year && (item.contentRating || item.rating || item.duration > 0 || (item.genres && item.genres.length > 0)) && <span className="opacity-50">&bull;</span>}
                                                    {item.contentRating && <span>{item.contentRating}</span>}
                                                    {item.contentRating && (item.rating || item.duration > 0 || (item.genres && item.genres.length > 0)) && <span className="opacity-50">&bull;</span>}
                                                    {item.duration > 0 && <span>{Math.round(item.duration / 60000)} min</span>}
                                                    {item.duration > 0 && item.rating && <span className="opacity-50">&bull;</span>}
                                                    {item.rating && (
                                                        <span className="flex items-center gap-1 text-yellow-500">
                                                            <Star className="w-3 h-3 fill-current" /> {item.rating}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-text/80 line-clamp-2 sm:line-clamp-3 mb-3 leading-relaxed">
                                                    {item.summary || "No summary available."}
                                                </p>
                                            </div>
                                            {item.genres && item.genres.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mt-auto">
                                                    {item.genres.slice(0, 4).map((g: string, i: number) => (
                                                        <span key={i} className="text-[10px] uppercase tracking-wider bg-white/5 border border-white/10 text-muted px-2 py-1 rounded-full shadow-sm">{g}</span>
                                                    ))}
                                                    {item.genres.length > 4 && (
                                                        <span className="text-[10px] uppercase tracking-wider bg-white/5 border border-white/10 text-muted px-2 py-1 rounded-full shadow-sm">+{item.genres.length - 4}</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}
            {isAdmin && selectedUser && (
                <UserAnalyticsModal
                    userId={selectedUser.id}
                    username={selectedUser.username}
                    thumb={selectedUser.thumb}
                    days={days}
                    onClose={() => setSelectedUser(null)}
                />
            )}
        </div>
    );
};


// --- Logs Dashboard Component ---
export const LogsDashboard: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
    const [deletedUsers, setDeletedUsers] = useState<any[]>([]);
    const [auditEntries, setAuditEntries] = useState<any[]>([]);
    const [isLoading, setLoading] = useState(true);
    const [toasts, setToasts] = useState<any[]>([]);
    const [auditPage, setAuditPage] = useState(1);
    const [emailPage, setEmailPage] = useState(1);
    const itemsPerPage = 20;

    const addToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        setToasts(t => pushToast(t, message, type));
    }, []);

    const fetchSecurityData = useCallback(async () => {
        setLoading(true);
        try {
            const [deletedUsersData, auditLogData] = await Promise.all([
                apiFetch('/api/deleted-users'),
                apiFetch('/api/audit-log')
            ]);
            setDeletedUsers(deletedUsersData);
            setAuditEntries(auditLogData);
        } catch (error: any) {
            addToast(error instanceof Error ? error.message : 'Failed to fetch logs.', 'error');
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        fetchSecurityData();
    }, [fetchSecurityData]);

    const handleUnblockDeletedUser = async (deletedUser: any) => {
        const label = deletedUser.username || deletedUser.email || 'this user';
        appConfirm(`Allow ${label} to use the portal again? This does not invite them automatically.`, async () => {
            setLoading(true);
            try {
                await apiFetch(`/api/deleted-users/${encodeURIComponent(deletedUser.blockId)}`, { method: 'DELETE' });
                addToast('Deleted user unblocked.');
                await fetchSecurityData();
            } catch (error: any) {
                addToast(error instanceof Error ? error.message : 'Failed to unblock user.', 'error');
            } finally {
                setLoading(false);
            }
        });
    };

    // Helper functions
    const formatDateTime = (dateString: string) => {
        if (!dateString) return '';
        const d = new Date(dateString);
        return `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}, ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    };

    const formatEventName = (event: string) => {
        return event.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    };

    const isConfigured = true;

    const filteredAuditLog = auditEntries.filter(e => e.event !== 'system_email_sent');
    const emailLogs = auditEntries.filter(e => e.event === 'system_email_sent');
    const totalAuditPages = Math.max(1, Math.ceil(filteredAuditLog.length / itemsPerPage));
    const totalEmailPages = Math.max(1, Math.ceil(emailLogs.length / itemsPerPage));

    return (
        <div className="w-full flex flex-col">
            <Loader isLoading={isLoading} />
            <ToastContainer toasts={toasts} setToasts={setToasts} />
            <header className="page-header">
                <h1 className="page-title">System Logs</h1>
            </header>
            <main>
                <div className="flex flex-col gap-6 mb-8">
                    <section className="glass-card-sm p-4 md:p-5 shadow-md">
                        <div className="flex items-center justify-between gap-4 mb-4">
                            <div>
                                <h2 className="text-lg font-bold text-text">Deleted User Blocklist</h2>
                                <p className="text-muted text-xs mt-1">Deleted users are logged out and blocked from requesting temporary access again.</p>
                            </div>
                            <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-bold">{deletedUsers.length}</span>
                        </div>
                        <div className="flex flex-col gap-3">
                            {deletedUsers.length === 0 ? (
                                <p className="text-muted text-sm border border-dashed border-border rounded-lg p-4 text-center">No deleted users are currently blocked.</p>
                            ) : (
                                deletedUsers.map(deletedUser => (
                                    <div key={deletedUser.blockId} className="flex items-center justify-between gap-3 bg-background/60 border border-border rounded-lg p-3">
                                        <div className="min-w-0">
                                            <p className="text-text font-semibold text-sm truncate">{deletedUser.username || 'Unknown user'}</p>
                                            <p className="text-muted text-xs truncate">{deletedUser.email || deletedUser.plexId || deletedUser.id || 'No identifier'}</p>
                                            <p className="text-muted/70 text-[11px] mt-1">Deleted {formatDateTime(deletedUser.deletedAt)} by {deletedUser.deletedBy || 'admin'}</p>
                                        </div>
                                        <button className="px-3 py-2 bg-border text-text rounded-md font-medium hover:bg-opacity-80 transition-colors text-xs flex-shrink-0" onClick={() => handleUnblockDeletedUser(deletedUser)}>
                                            Unblock
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>

                    <section className="glass-card-sm p-4 md:p-5 shadow-md">
                        <div className="flex items-center justify-between gap-4 mb-4">
                            <div>
                                <h2 className="text-lg font-bold text-text">Audit Log</h2>
                                <p className="text-muted text-xs mt-1">Recent invite, deletion, sync, and access events.</p>
                            </div>
                            <button className="px-3 py-2 bg-border text-text rounded-md font-medium hover:bg-opacity-80 transition-colors text-xs" onClick={fetchSecurityData}>
                                Refresh
                            </button>
                        </div>
                        <div className="flex flex-col gap-3">
                            {filteredAuditLog.length === 0 ? (
                                <p className="text-muted text-sm border border-dashed border-border rounded-lg p-4 text-center">No audit events recorded yet.</p>
                            ) : (
                                <>
                                    {filteredAuditLog.slice((auditPage - 1) * itemsPerPage, auditPage * itemsPerPage).map(entry => (
                                        <div key={entry.id} className="bg-background/60 border border-border rounded-lg p-3">
                                            <div className="flex items-start justify-between gap-3">
                                                <p className="text-text font-semibold text-sm">{formatEventName(entry.event)}</p>
                                                <span className="text-muted text-[11px] whitespace-nowrap">{formatDateTime(entry.timestamp)}</span>
                                            </div>
                                            <p className="text-muted text-xs mt-1">
                                                Target: {entry.target?.username || entry.target?.email || 'System'}
                                                {entry.actor?.username || entry.actor?.email ? ` · Actor: ${entry.actor.username || entry.actor.email}` : ''}
                                            </p>
                                        </div>
                                    ))}
                                    {totalAuditPages > 1 && (
                                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                                            <button
                                                className="px-3 py-2 bg-border text-text rounded-md font-medium hover:bg-opacity-80 transition-colors text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                                                onClick={() => setAuditPage(p => Math.max(1, p - 1))}
                                                disabled={auditPage === 1}
                                            >
                                                Previous
                                            </button>
                                            <span className="text-xs text-muted font-semibold">Page {auditPage} of {totalAuditPages}</span>
                                            <button
                                                className="px-3 py-2 bg-border text-text rounded-md font-medium hover:bg-opacity-80 transition-colors text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                                                onClick={() => setAuditPage(p => Math.min(totalAuditPages, p + 1))}
                                                disabled={auditPage === totalAuditPages}
                                            >
                                                Next
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </section>

                    <section className="glass-card-sm p-4 md:p-5 shadow-md">
                        <div className="flex items-center justify-between gap-4 mb-4">
                            <div>
                                <h2 className="text-lg font-bold text-text">Email Log</h2>
                                <p className="text-muted text-xs mt-1">Recent system emails sent.</p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3">
                            {emailLogs.length === 0 ? (
                                <p className="text-muted text-sm border border-dashed border-border rounded-lg p-4 text-center">No emails sent yet.</p>
                            ) : (
                                <>
                                    {emailLogs.slice((emailPage - 1) * itemsPerPage, emailPage * itemsPerPage).map(entry => (
                                        <div key={entry.id} className="bg-background/60 border border-border rounded-lg p-3">
                                            <div className="flex items-start justify-between gap-3">
                                                <p className="text-text font-semibold text-sm line-clamp-1">{entry.details?.subject || 'System Email'}</p>
                                                <span className="text-muted text-[11px] whitespace-nowrap">{formatDateTime(entry.timestamp)}</span>
                                            </div>
                                            <p className="text-muted text-xs mt-1">
                                                To: {entry.target?.username || entry.target?.email || 'Unknown'}
                                            </p>
                                        </div>
                                    ))}
                                    {totalEmailPages > 1 && (
                                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                                            <button
                                                className="px-3 py-2 bg-border text-text rounded-md font-medium hover:bg-opacity-80 transition-colors text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                                                onClick={() => setEmailPage(p => Math.max(1, p - 1))}
                                                disabled={emailPage === 1}
                                            >
                                                Previous
                                            </button>
                                            <span className="text-xs text-muted font-semibold">Page {emailPage} of {totalEmailPages}</span>
                                            <button
                                                className="px-3 py-2 bg-border text-text rounded-md font-medium hover:bg-opacity-80 transition-colors text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                                                onClick={() => setEmailPage(p => Math.min(totalEmailPages, p + 1))}
                                                disabled={emailPage === totalEmailPages}
                                            >
                                                Next
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
};

// --- Admin Dashboard Component ---

export const AdminDashboard: React.FC<{ onLogout: () => void, onViewUserPortal: () => void, onViewStatus: () => void, onViewDashboard: () => void }> = ({ onLogout, onViewUserPortal, onViewStatus, onViewDashboard }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [isConfigured, setConfigured] = useState(false);
    const [configSettings, setConfigSettings] = useState<AppSettings>({ checkIntervalMinutes: 60 });
    const [isUserModalOpen, setUserModalOpen] = useState(false);
    const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isLoading, setLoading] = useState(true);
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [bulkCustomDate, setBulkCustomDate] = useState('');
    const [deletedUsers, setDeletedUsers] = useState<DeletedUser[]>([]);
    const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);

    // Filters and Sorting States
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'trial' | 'expiring' | 'expired' | 'revoked'>('all');
    const [sortBy, setSortBy] = useState<'username-asc' | 'username-desc' | 'expiry-asc' | 'expiry-desc' | 'joined-desc'>('username-asc');
    const mediaServerType = String(configSettings.mediaServerType || 'plex').toLowerCase();
    const mediaServerLabel = mediaServerType === 'jellyfin' ? 'Jellyfin' : 'Plex';

    const addToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        setToasts(t => pushToast(t, message, type));
    }, []);

    const fetchUsers = useCallback(async () => {
        try {
            const usersData = await apiFetch('/api/users');
            setUsers(usersData);
        } catch (error) {
            addToast(error instanceof Error ? error.message : 'Failed to fetch users.', 'error');
        }
    }, [addToast]);

    const fetchSecurityData = useCallback(async () => {
        try {
            const [deletedUsersData, auditLogData] = await Promise.all([
                apiFetch('/api/deleted-users'),
                apiFetch('/api/audit-log')
            ]);
            setDeletedUsers(deletedUsersData);
            setAuditEntries(auditLogData);
        } catch (error) {
            addToast(error instanceof Error ? error.message : 'Failed to fetch security data.', 'error');
        }
    }, [addToast]);

    useEffect(() => {
        const checkConfigAndFetchData = async () => {
            setLoading(true);
            try {
                const configStatus = await apiFetch('/api/config');
                setConfigured(configStatus.configured);
                setConfigSettings(configStatus.settings); // Always update settings from backend

                if (configStatus.configured) {
                    await fetchUsers();
                    await fetchSecurityData();
                } else {
                    addToast('Welcome! Please configure your media server settings to begin.', 'success');
                    setSettingsModalOpen(true);
                }
            } catch (error) {
                addToast(error instanceof Error ? error.message : 'Could not connect to backend.', 'error');
            } finally {
                setLoading(false);
            }
        };
        checkConfigAndFetchData();
    }, [fetchUsers, fetchSecurityData, addToast]);


    const handleSaveConfig = async (config: PlexConfig) => {
        setLoading(true);
        try {
            await apiFetch('/api/config', {
                method: 'POST',
                body: JSON.stringify(config)
            });
            setConfigured(true);
            setConfigSettings({
                token: config.token,
                serverIdentifier: config.serverIdentifier,
                checkIntervalMinutes: config.checkIntervalMinutes || 60,
                smtpHost: config.smtpHost,
                smtpPort: config.smtpPort,
                smtpUser: config.smtpUser,
                smtpPass: config.smtpPass,
                smtpFrom: config.smtpFrom,
                smtpSecure: config.smtpSecure,
                emailDaysBefore: config.emailDaysBefore,
                newsletterFrequency: config.newsletterFrequency,
                newsletterDay: config.newsletterDay,
                publicDomain: config.publicDomain
            });
            setSettingsModalOpen(false);
            addToast('Settings saved successfully!');
            await fetchUsers();
        } catch (error) {
            addToast(error instanceof Error ? error.message : 'Failed to save config.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleImportUsers = async () => {
        if (!isConfigured) {
            addToast(`Please configure ${mediaServerLabel} settings first.`, 'error');
            return;
        }
        setLoading(true);
        try {
            const result = await apiFetch('/api/sync', { method: 'POST' });
            addToast(result.message || `Synced ${result.count} users from ${mediaServerLabel}.`);
            await fetchUsers(); // Refresh user list
            await fetchSecurityData();
        } catch (error) {
            addToast(error instanceof Error ? error.message : 'An unknown error occurred during sync.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const revokePlexAccess = async (userId: string) => {
        setLoading(true);
        try {
            const updatedUser = await apiFetch(`/api/users/${userId}/revoke`, { method: 'POST' });
            setUsers(currentUsers => currentUsers.map(u => u.id === userId ? updatedUser : u));
            addToast('Plex access revoked successfully.');
            await fetchSecurityData();
        } catch (error) {
            addToast(error instanceof Error ? error.message : 'Failed to revoke access.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenUserModal = (user: User) => {
        setEditingUser(user);
        setUserModalOpen(true);
    };

    const handleCloseModal = () => {
        setUserModalOpen(false);
        setEditingUser(null);
    };

    const handleSaveUser = async (userToSave: User) => {
        setLoading(true);
        try {
            const updatedUser = await apiFetch(`/api/users/${userToSave.id}`, {
                method: 'PUT',
                body: JSON.stringify({ expiryDate: userToSave.expiryDate, exemptFromCleanup: userToSave.exemptFromCleanup, optOutNewsletter: userToSave.optOutNewsletter })
            });
            setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
            handleCloseModal();
            addToast('User updated successfully!');
            await fetchSecurityData();
        } catch (error) {
            addToast(error instanceof Error ? error.message : 'Failed to save user.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        appConfirm(`Are you sure you want to delete this user? This will revoke ${mediaServerLabel} access first where supported.`, async () => {
            setLoading(true);
            try {
                await apiFetch(`/api/users/${userId}`, { method: 'DELETE' });
                setUsers(users.filter(u => u.id !== userId));
                addToast('User removed from manager.');
                await fetchSecurityData();
            } catch (error) {
                addToast(error instanceof Error ? error.message : 'Failed to delete user.', 'error');
            } finally {
                setLoading(false);
            }
        });
    };

    const handleToggleSelection = (userId: string) => {
        setSelectedUserIds(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleBulkUpdate = async (action: 'addMonth' | 'addYear' | 'unlimited' | 'custom', customDate?: string) => {
        setLoading(true);
        try {
            await apiFetch('/api/users/bulk-update', {
                method: 'POST',
                body: JSON.stringify({ userIds: selectedUserIds, action, customDate })
            });
            addToast(`Successfully updated ${selectedUserIds.length} users.`);
            setSelectedUserIds([]);
            setBulkCustomDate('');
            await fetchUsers();
            await fetchSecurityData();
        } catch (error) {
            addToast(error instanceof Error ? error.message : 'Bulk update failed.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleUnblockDeletedUser = async (deletedUser: DeletedUser) => {
        const label = deletedUser.username || deletedUser.email || 'this user';
        appConfirm(`Allow ${label} to use the portal again? This does not invite them automatically.`, async () => {
            setLoading(true);
            try {
                await apiFetch(`/api/deleted-users/${encodeURIComponent(deletedUser.blockId)}`, { method: 'DELETE' });
                addToast('Deleted user unblocked.');
                await fetchSecurityData();
            } catch (error) {
                addToast(error instanceof Error ? error.message : 'Failed to unblock user.', 'error');
            } finally {
                setLoading(false);
            }
        });
    };

    // Derived State for Filtering and Sorting
    const filteredAndSortedUsers = useMemo(() => {
        return users
            .filter(user => {
                const query = searchQuery.toLowerCase().trim();
                if (query) {
                    const matchesName = user.username.toLowerCase().includes(query);
                    const matchesEmail = user.email?.toLowerCase().includes(query) || false;
                    if (!matchesName && !matchesEmail) return false;
                }

                if (statusFilter === 'all') return true;

                const days = getDaysUntilExpiry(user.expiryDate);
                const isRevoked = user.plexAccessStatus === 'revoked';
                const isTrial = user.isTrial === true;

                if (statusFilter === 'trial') return isTrial;
                if (statusFilter === 'revoked') return isRevoked;
                if (isRevoked) return false; // Hide revoked from active/expiring/expired lists

                if (statusFilter === 'active') {
                    return days === null || days > 30;
                }
                if (statusFilter === 'expiring') {
                    return days !== null && days >= 0 && days <= 30;
                }
                if (statusFilter === 'expired') {
                    return days !== null && days < 0;
                }
                return true;
            })
            .sort((a, b) => {
                if (sortBy === 'username-asc') {
                    return a.username.localeCompare(b.username);
                }
                if (sortBy === 'username-desc') {
                    return b.username.localeCompare(a.username);
                }
                if (sortBy === 'joined-desc') {
                    return new Date(b.joiningDate).getTime() - new Date(a.joiningDate).getTime();
                }
                if (sortBy === 'expiry-asc') {
                    if (a.expiryDate === null) return 1;
                    if (b.expiryDate === null) return -1;
                    return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
                }
                if (sortBy === 'expiry-desc') {
                    if (a.expiryDate === null) return 1;
                    if (b.expiryDate === null) return -1;
                    return new Date(b.expiryDate).getTime() - new Date(a.expiryDate).getTime();
                }
                return 0;
            });
    }, [users, searchQuery, statusFilter, sortBy]);

    const filteredUserIds = useMemo(() => filteredAndSortedUsers.map(u => u.id), [filteredAndSortedUsers]);
    const allFilteredSelected = filteredUserIds.length > 0 && filteredUserIds.every(id => selectedUserIds.includes(id));

    return (
        <div className="w-full flex flex-col">
            <Loader isLoading={isLoading} />
            <ToastContainer toasts={toasts} setToasts={setToasts} />

            <header className="page-header">
                <h1 className="page-title">Users Management</h1>
            </header>
            <main>
                {isConfigured && (
                    <div className="flex flex-col md:flex-row gap-4 md:items-center mb-8 glass-card-sm p-4 shadow-md">
                        <span className="font-bold text-muted uppercase tracking-wider text-sm hidden md:inline-block mr-2">Quick Actions:</span>
                        <div className="grid grid-cols-2 md:flex md:flex-row gap-3 w-full md:w-auto flex-1">
                            <button className="col-span-2 md:col-span-1 px-3 py-2 bg-plex text-background rounded-md font-bold hover:bg-plex-hover transition-colors flex items-center justify-center gap-2 text-sm md:text-base" onClick={handleImportUsers} disabled={isLoading}>
                                Sync {mediaServerLabel} Users
                            </button>
                        </div>
                    </div>
                )}

                {/* Search & Filter Controls */}
                {isConfigured && (
                    <div className="flex flex-col xl:flex-row justify-between xl:items-center bg-card border border-border p-4 rounded-xl mb-8 gap-4 xl:gap-6 w-full">
                        <div className="relative w-full xl:w-auto xl:flex-1 min-w-[250px]">
                            <input
                                type="text"
                                placeholder="Search by username or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full py-3 pr-10 pl-4 rounded-lg border border-border bg-background text-text text-sm outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all"
                            />
                            {searchQuery && (
                                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text text-xl" onClick={() => setSearchQuery('')}>×</button>
                            )}
                        </div>

                        <div className="grid grid-cols-3 sm:flex sm:flex-row bg-background p-1 rounded-lg border border-border overflow-x-auto custom-scrollbar w-full xl:w-auto">
                            {(['all', 'active', 'trial', 'expiring', 'expired', 'revoked'] as const).map((status) => (
                                <button
                                    key={status}
                                    className={`col-span-1 px-2 sm:px-4 py-2 rounded-md font-medium transition-all text-xs sm:text-sm text-center ${statusFilter === status ? 'bg-plex text-background shadow-md font-bold' : 'text-muted hover:bg-white/5 hover:text-text'}`}
                                    onClick={() => setStatusFilter(status)}
                                >
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </button>
                            ))}
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 whitespace-nowrap w-full xl:w-auto xl:ml-auto">
                            <label htmlFor="sortSelect" className="text-muted font-bold text-sm hidden sm:block">Sort By</label>
                            <CustomSelect
                                id="sortSelect"
                                value={sortBy}
                                onChange={(val) => setSortBy(val as any)}
                                className="w-full sm:w-[200px]"
                                options={[
                                    { label: 'Username (A-Z)', value: 'username-asc' },
                                    { label: 'Username (Z-A)', value: 'username-desc' },
                                    { label: 'Expiry (Soonest)', value: 'expiry-asc' },
                                    { label: 'Expiry (Furthest)', value: 'expiry-desc' },
                                    { label: 'Joined Date (Newest)', value: 'joined-desc' }
                                ]}
                            />
                        </div>
                    </div>
                )}

                {selectedUserIds.length > 0 && (
                    <div className="glass-card-sm p-4 flex justify-between items-center mb-8 flex-wrap gap-4 w-full">
                        <div className="flex items-center flex-wrap gap-4 text-sm font-medium">
                            <span className="text-plex">{selectedUserIds.length} selected</span>
                            {allFilteredSelected ? (
                                <button className="text-muted hover:text-text transition-colors underline" onClick={() => setSelectedUserIds(prev => prev.filter(id => !filteredUserIds.includes(id)))}>Unselect Filtered</button>
                            ) : (
                                <button className="text-muted hover:text-text transition-colors underline" onClick={() => setSelectedUserIds(prev => Array.from(new Set([...prev, ...filteredUserIds])))}>Select Filtered ({filteredAndSortedUsers.length})</button>
                            )}
                            <button className="text-muted hover:text-text transition-colors underline" onClick={() => setSelectedUserIds([])}>Unselect All</button>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <button className="px-4 py-2 bg-border text-text rounded-md font-medium hover:bg-opacity-80 transition-colors flex items-center justify-center gap-2" onClick={() => handleBulkUpdate('addMonth')}>+1 Month</button>
                            <button className="px-4 py-2 bg-border text-text rounded-md font-medium hover:bg-opacity-80 transition-colors flex items-center justify-center gap-2" onClick={() => handleBulkUpdate('addYear')}>+1 Year</button>
                            <button className="px-4 py-2 bg-border text-text rounded-md font-medium hover:bg-opacity-80 transition-colors flex items-center justify-center gap-2" onClick={() => handleBulkUpdate('unlimited')}>Unlimited</button>
                            <div className="flex items-center gap-2">
                                <input
                                    type="date"
                                    value={bulkCustomDate}
                                    onChange={(e) => setBulkCustomDate(e.target.value)}
                                    className="p-2 rounded-md border border-border bg-background text-text text-sm outline-none focus:border-plex cursor-pointer"
                                />
                                <button
                                    className="px-4 py-2 bg-plex text-background rounded-md font-medium hover:bg-plex-hover transition-colors flex items-center justify-center gap-2"
                                    onClick={() => {
                                        if (!bulkCustomDate) {
                                            addToast('Please select a custom expiry date.', 'error');
                                            return;
                                        }
                                        handleBulkUpdate('custom', bulkCustomDate);
                                    }}
                                >
                                    Set Custom Date
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {isConfigured && filteredAndSortedUsers.length === 0 && !isLoading && (
                    <p className="text-center text-muted p-8 border border-dashed border-border rounded-xl mt-4 w-full">No users found matching your filters. Try syncing or widening filters.</p>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 w-full">
                    {filteredAndSortedUsers.map((user) => (
                        <UserCard
                            key={user.id}
                            user={user}
                            onEdit={() => handleOpenUserModal(user)}
                            onDelete={() => handleDeleteUser(user.id)}
                            onRevoke={() => revokePlexAccess(user.id)}
                            isConfigured={isConfigured}
                            isSelected={selectedUserIds.includes(user.id)}
                            onSelect={handleToggleSelection}
                            providerLabel={mediaServerLabel}
                        />
                    ))}
                </div>
            </main>
            <UserModal
                isOpen={isUserModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveUser}
                user={editingUser}
            />
        </div>
    );
};

// --- User Portal Components ---

const loginPrimaryBtnClass = themeClasses.btnPrimaryLg;
const loginSecondaryBtnClass = `${themeClasses.btnSecondary} w-full px-8 py-4 text-base`;

const PublicUptimeBanner: React.FC = () => {
    const [healthData, setHealthData] = useState<Record<string, any>>({});
    const [config, setConfig] = useState<any>({});

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await apiFetch('/api/status');
                setConfig(res.config);
                setHealthData(res.healthData);
            } catch (e) { }
        };
        fetchStatus();
        const interval = setInterval(fetchStatus, 15000);
        return () => clearInterval(interval);
    }, []);

    if (!config.services?.length) return null;

    const visibleServices = config.services.filter((service: any) => healthData[service.id]);
    if (visibleServices.length === 0) return null;

    return (
        <div className="rounded-2xl border border-white/10 bg-card/40 backdrop-blur-xl px-4 py-5 sm:px-6 w-full">
            <div className="w-full flex flex-col">
                <div className="flex flex-col items-center text-center mb-4">
                    <a href={portalUrl('/status')} className="text-plex hover:text-plex-hover font-bold text-[10px] tracking-[0.16em] uppercase mb-1.5 transition-colors">
                        View Full Status Page &rarr;
                    </a>
                    <h3 className="text-text font-bold uppercase tracking-[0.14em] text-xs">Live System Status</h3>
                </div>
                <div className="flex flex-wrap justify-center gap-2 sm:gap-3 w-full">
                    {visibleServices.map((service: any) => {
                        const health = healthData[service.id];
                        const isUp = health.currentStatus === 'online';
                        const colorClass = isUp ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-red-500/30 bg-red-500/10';
                        const dotClass = isUp ? 'bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]';

                        return (
                            <div key={service.id} className={`inline-flex items-center gap-1.5 sm:gap-2.5 px-2.5 py-1.5 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl border ${colorClass} backdrop-blur-sm`}>
                                <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0 ${dotClass}`} />
                                <span className="text-[11px] sm:text-sm font-bold text-text leading-tight">{service.name}</span>
                                <span className="text-[10px] sm:text-xs font-bold text-muted tabular-nums">{health.uptimePercentage}%</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

const LivePlexStats: React.FC = () => {
    const [stats, setStats] = useState<{ movies: number, shows: number, music: number, fourKPercent?: number } | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            const endpoints = [portalUrl('/api/public/plex/stats'), portalUrl('/api/plex/stats')];

            for (const endpoint of endpoints) {
                try {
                    const response = await fetch(endpoint, { headers: { 'Accept': 'application/json' } });
                    if (!response.ok) continue;
                    const res = await response.json();
                    if (res && typeof res.movies === 'number' && typeof res.shows === 'number' && typeof res.music === 'number') {
                        setStats(res);
                        return;
                    }
                } catch (e) {
                    // Try next endpoint
                }
            }
        };

        fetchStats();
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
    }, []);

    if (!stats) return (
        <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
                { icon: Film, label: 'Movies & TV', desc: 'Massive library' },
                { icon: Music, label: 'Music', desc: 'Thousands of albums' },
                { icon: Sparkles, label: 'Requests', desc: 'Automated system' },
            ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-transparent p-4 flex flex-col items-center text-center gap-2 animate-pulse">
                    <Icon className="w-5 h-5 text-plex/60" />
                    <span className="text-xs font-bold text-muted uppercase tracking-wider">{label}</span>
                    <span className="text-[11px] text-muted/70">{desc}</span>
                </div>
            ))}
        </div>
    );

    const statCardClass = 'section-card p-4 flex flex-col items-center justify-center gap-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]';

    return (
        <div className="w-full flex flex-col">
            <div className="inline-flex self-center items-center gap-2 px-3 py-1 rounded-full bg-plex/10 border border-plex/25 text-plex text-[10px] font-bold uppercase tracking-[0.14em] mb-4">
                <Activity className="w-3 h-3" /> Live Library Stats
            </div>
            <div className={`grid gap-3 w-full ${stats.music > 0 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                <div className={statCardClass}>
                    <Film className="w-5 h-5 text-plex mb-0.5" />
                    <span className="text-plex font-black text-xl tabular-nums">{stats.movies.toLocaleString()}</span>
                    <span className="text-muted text-[10px] uppercase tracking-[0.12em] font-bold">Movies</span>
                </div>
                <div className={statCardClass}>
                    <Tv className="w-5 h-5 text-plex mb-0.5" />
                    <span className="text-plex font-black text-xl tabular-nums">{stats.shows.toLocaleString()}</span>
                    <span className="text-muted text-[10px] uppercase tracking-[0.12em] font-bold">TV Shows</span>
                </div>
                {stats.music > 0 && (
                    <div className={statCardClass}>
                        <Music className="w-5 h-5 text-plex mb-0.5" />
                        <span className="text-plex font-black text-xl tabular-nums">{stats.music.toLocaleString()}</span>
                        <span className="text-muted text-[10px] uppercase tracking-[0.12em] font-bold">Artists</span>
                    </div>
                )}
            </div>
            <div className="w-full mt-3">
                <div className={statCardClass + ' py-3.5'}>
                    <span className="text-plex font-black text-lg flex items-center gap-2 tabular-nums">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        {stats.fourKPercent !== undefined ? stats.fourKPercent : 30}%
                    </span>
                    <span className="text-muted text-[10px] uppercase tracking-[0.12em] font-bold">Available in 4K</span>
                </div>
            </div>
        </div>
    );
};

export const Login: React.FC<{ onLoginSuccess: () => void, publicConfig?: any, initialError?: string }> = ({ onLoginSuccess, publicConfig, initialError }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(initialError || '');
    const [jellyfinUsername, setJellyfinUsername] = useState('');
    const [jellyfinPassword, setJellyfinPassword] = useState('');
    const [showJellyfinPassword, setShowJellyfinPassword] = useState(false);
    const [quickConnect, setQuickConnect] = useState<{ sessionId: string, code: string, jellyfinUrl: string } | null>(null);
    const quickConnectPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [publicInfo, setPublicInfo] = useState<{ thumb: string | null, serverName: string, isConfigured: boolean | null, mediaServerType?: string }>({ thumb: null, serverName: 'Server Portal', isConfigured: null, mediaServerType: 'plex' });

    const fetchPublicInfo = () => {
        apiFetch('/api/public/info').then(data => {
            if (data) {
                setPublicInfo({
                    thumb: data.thumb || null,
                    serverName: data.serverName || 'Server Portal',
                    isConfigured: data.isConfigured !== false,
                    mediaServerType: data.mediaServerType || 'plex'
                });
                if (data.thumb) updateFavicon(data.thumb);
                if (data.serverName) document.title = `${data.serverName} Portal`;
            }
        }).catch(() => {
            setPublicInfo(prev => ({ ...prev, isConfigured: false }));
        });
    };

    useEffect(() => {
        if (initialError) {
            window.history.replaceState({}, '', portalUrl('/'));
        }
    }, [initialError]);

    useEffect(() => () => {
        if (quickConnectPollRef.current) clearInterval(quickConnectPollRef.current);
    }, []);

    useEffect(() => {
        fetchPublicInfo();

        const path = stripBasePath(window.location.pathname);
        const params = new URLSearchParams(window.location.search);
        const loginError = params.get('loginError');
        if (loginError) {
            setError(loginError);
            window.history.replaceState({}, '', portalUrl('/'));
            return;
        }

        // Setup wizard OAuth return — SetupWizard handles this, not login
        if (path.startsWith('/auth/setup/')) {
            return;
        }

        if (path.startsWith('/auth/')) {
            const pinId = path.split('/')[2];
            setIsLoading(true);
            window.history.replaceState({}, '', portalUrl('/'));
            apiFetch('/api/auth/plex/callback', {
                method: 'POST',
                body: JSON.stringify({ pinId }),
            }).then(() => onLoginSuccess()).catch(e => {
                setError(e.message || 'Login failed');
            }).finally(() => {
                setIsLoading(false);
            });
        }
    }, [onLoginSuccess]);

    const handlePlexLogin = async () => {
        setIsLoading(true);
        setError('');
        try {
            const data = await apiFetch('/api/auth/plex/login', { method: 'POST' });
            const clientId = data.clientIdentifier || data.clientId || '';
            const forwardUrl = window.location.origin + portalUrl('/api/auth/plex/callback?pinId=' + data.id);
            const authUrl = `https://app.plex.tv/auth#?clientID=${encodeURIComponent(clientId)}&code=${data.code}&context[device][product]=Server%20Manager%20Portal&forwardUrl=${encodeURIComponent(forwardUrl)}`;
            window.location.href = authUrl;
        } catch (e) {
            setError('Failed to initiate Plex login');
            setIsLoading(false);
        }
    };

    const handleJellyfinLogin = async (event?: React.FormEvent) => {
        event?.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            await apiFetch('/api/auth/jellyfin/login', {
                method: 'POST',
                body: JSON.stringify({ username: jellyfinUsername.trim(), password: jellyfinPassword }),
            });
            onLoginSuccess();
        } catch (e: any) {
            setError(e.message || 'Failed to authenticate with Jellyfin');
        } finally {
            setIsLoading(false);
        }
    };

    const stopQuickConnectPolling = () => {
        if (quickConnectPollRef.current) {
            clearInterval(quickConnectPollRef.current);
            quickConnectPollRef.current = null;
        }
    };

    const pollJellyfinQuickConnect = (sessionId: string) => {
        stopQuickConnectPolling();
        quickConnectPollRef.current = setInterval(async () => {
            try {
                const data = await apiFetch('/api/auth/jellyfin/quick-connect/poll', {
                    method: 'POST',
                    body: JSON.stringify({ sessionId }),
                });
                if (data?.success) {
                    stopQuickConnectPolling();
                    onLoginSuccess();
                }
            } catch (e: any) {
                stopQuickConnectPolling();
                setIsLoading(false);
                setError(e.message || 'Jellyfin Quick Connect failed');
            }
        }, 5000);
    };

    const handleJellyfinQuickConnect = async () => {
        setIsLoading(true);
        setError('');
        try {
            const data = await apiFetch('/api/auth/jellyfin/quick-connect/initiate', { method: 'POST' });
            setQuickConnect({
                sessionId: data.sessionId,
                code: data.code,
                jellyfinUrl: data.jellyfinUrl || '',
            });
            setIsLoading(false);
            pollJellyfinQuickConnect(data.sessionId);
        } catch (e: any) {
            setIsLoading(false);
            setError(e.message || 'Failed to start Jellyfin Quick Connect');
        }
    };

    const handleOpenJellyfinQuickConnect = async () => {
        if (!quickConnect?.jellyfinUrl) return;
        try {
            await copyTextToClipboard(quickConnect.code);
        } catch {
            // Clipboard access can be blocked by browser settings; opening Jellyfin is still useful.
        }
        window.open(jellyfinQuickConnectUrl(quickConnect.jellyfinUrl), '_blank', 'noopener,noreferrer');
    };

    if (publicInfo.isConfigured === false || (typeof window !== 'undefined' && stripBasePath(window.location.pathname).startsWith('/auth/setup/'))) {
        return <SetupWizard onComplete={fetchPublicInfo} />;
    }

    if (publicInfo.isConfigured === null) {
        return <Loader isLoading={true} />;
    }

    const mediaServerType = String(publicConfig?.mediaServerType || publicInfo.mediaServerType || 'plex').toLowerCase();
    const isJellyfinAuth = mediaServerType === 'jellyfin';
    const showTrialAccess = !isJellyfinAuth && publicConfig?.allowTemporaryAccess !== false;
    const logoSrc = publicConfig?.customLogoUrl
        ? resolvePortalAssetUrl(publicConfig.customLogoUrl)
        : (publicInfo.thumb ? resolvePortalAssetUrl(publicInfo.thumb) : '');
    const splashBackgroundUrl = publicConfig?.backgroundImageUrl ? resolvePortalAssetUrl(publicConfig.backgroundImageUrl) : undefined;

    return (
        <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 lg:p-10 overflow-hidden">
            <AuthPageBackground backgroundImageUrl={splashBackgroundUrl} />
            <Loader isLoading={isLoading} />

            <div className="relative z-10 w-full max-w-6xl flex flex-col gap-6">
                <div className={`glass-card-lg overflow-hidden flex flex-col ${showTrialAccess ? 'lg:flex-row min-h-[min(680px,calc(100vh-3rem))]' : 'max-w-xl mx-auto w-full'}`}>
                    {showTrialAccess && (
                        <div className="flex-1 flex flex-col justify-center p-6 sm:p-8 lg:p-10 xl:p-12 border-t lg:border-t-0 lg:border-r border-white/10 bg-gradient-to-br from-plex/[0.08] via-plex/[0.03] to-transparent min-w-0 order-last lg:order-none">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-plex/10 border border-plex/25 text-plex text-[11px] font-bold uppercase tracking-widest mb-5 w-fit">
                                <Sparkles className="w-3.5 h-3.5" /> New here?
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-black text-text tracking-tight leading-tight mb-3">
                                Welcome to{' '}
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-plex to-amber-400">{publicInfo.serverName}</span>
                            </h1>
                            <p className="text-muted text-sm sm:text-base leading-relaxed mb-6 max-w-lg">
                                The ultimate Plex experience. Get instant access to our entire library with a{' '}
                                <strong className="text-text font-semibold">3-Day Temporary Access</strong> pass.
                            </p>

                            <div className="mb-6">
                                <LivePlexStats />
                            </div>

                            <p className="text-xs text-muted/80 leading-relaxed mb-5">
                                You&apos;ll need a free Plex account to continue. You can create one securely on the next screen.
                            </p>
                            <button type="button" className={loginPrimaryBtnClass} onClick={handlePlexLogin} disabled={isLoading}>
                                <img src={logoUrl()} alt="" className="w-5 h-5 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                Request Temporary Access
                            </button>
                        </div>
                    )}

                    <div className={`flex flex-col justify-center items-center text-center p-6 sm:p-8 lg:p-10 xl:p-12 min-w-0 ${showTrialAccess ? 'flex-1 order-first lg:order-none' : 'w-full py-10 sm:py-12'}`}>
                        <div className="relative mb-8">
                            {!logoSrc && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 bg-plex/20 rounded-full blur-[60px] pointer-events-none" />}
                            {logoSrc ? (
                                <img
                                    src={logoSrc}
                                    alt="Server Logo"
                                    className="w-28 h-28 sm:w-32 sm:h-32 object-cover rounded-full border-2 border-plex/40 shadow-[0_0_40px_rgba(229,160,13,0.25)] relative z-10"
                                    onError={(e) => {
                                        e.currentTarget.src = logoUrl();
                                        e.currentTarget.className = 'w-28 h-28 sm:w-32 sm:h-32 object-cover rounded-full border-2 border-plex/40 shadow-[0_0_40px_rgba(229,160,13,0.25)] relative z-10';
                                    }}
                                />
                            ) : (
                                <img src={logoUrl()} alt="Server Logo" className="w-28 h-28 sm:w-32 sm:h-32 object-cover rounded-full border-2 border-plex/40 shadow-[0_0_40px_rgba(229,160,13,0.25)] relative z-10" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                            )}
                        </div>

                        {!showTrialAccess && (
                            <>
                                <h1 className="text-3xl sm:text-4xl font-black text-text tracking-tight mb-3">
                                    {publicInfo.serverName}
                                </h1>
                                <p className="text-muted text-sm sm:text-base leading-relaxed mb-8 max-w-sm">
                                    {isJellyfinAuth
                                        ? 'Sign in with your Jellyfin account to access your portal and manage your subscription.'
                                        : 'Sign in with Plex to access your portal and manage your subscription.'}
                                </p>
                            </>
                        )}

                        {showTrialAccess && (
                            <>
                                <p className="text-[11px] font-bold text-muted uppercase tracking-[0.16em] mb-2">Returning member</p>
                                <h2 className="text-2xl sm:text-3xl font-black text-text tracking-tight mb-3">Already on our server?</h2>
                                <p className="text-muted text-sm sm:text-base leading-relaxed mb-8 max-w-sm">
                                    Manage your existing access or re-link your Plex account.
                                </p>
                            </>
                        )}

                        {isJellyfinAuth ? (
                            <div className="w-full max-w-sm flex flex-col gap-4 text-left">
                                <button type="button" className={loginSecondaryBtnClass} onClick={handleJellyfinQuickConnect} disabled={isLoading}>
                                    <img src={JELLYFIN_ICON_URL} alt="" className="w-5 h-5 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                    Login with Jellyfin
                                </button>

                                {quickConnect && (
                                    <div className="w-full rounded-xl border border-plex/30 bg-plex/10 p-4 text-center">
                                        <p className="text-[10px] font-bold text-muted uppercase tracking-[0.14em] mb-2">Quick Connect code</p>
                                        <div className="font-black text-3xl tracking-[0.18em] text-text tabular-nums mb-3">{quickConnect.code}</div>
                                        <p className="text-xs text-muted leading-relaxed">
                                            Approve this code in Jellyfin Quick Connect. This page will finish login automatically.
                                        </p>
                                        {quickConnect.jellyfinUrl && (
                                            <button
                                                type="button"
                                                onClick={handleOpenJellyfinQuickConnect}
                                                className="mt-3 inline-flex items-center justify-center text-xs font-bold text-plex hover:text-text transition"
                                            >
                                                Copy code & open Quick Connect
                                            </button>
                                        )}
                                    </div>
                                )}

                                <button
                                    type="button"
                                    className="self-center text-xs font-bold text-muted hover:text-text transition"
                                    onClick={() => setShowJellyfinPassword((value) => !value)}
                                >
                                    {showJellyfinPassword ? 'Hide password login' : 'Use password instead'}
                                </button>

                                {showJellyfinPassword && (
                                    <form onSubmit={handleJellyfinLogin} className="w-full flex flex-col gap-3 text-left">
                                        <label className="flex flex-col gap-1.5">
                                            <span className="text-[10px] font-bold text-muted uppercase tracking-[0.14em]">Jellyfin username</span>
                                            <input
                                                value={jellyfinUsername}
                                                onChange={(e) => setJellyfinUsername(e.target.value)}
                                                autoComplete="username"
                                                className="w-full bg-black/25 border border-white/15 rounded-xl px-4 py-3 text-sm text-text outline-none focus:border-plex/70 focus:ring-2 focus:ring-plex/20 transition"
                                                placeholder="Username"
                                                disabled={isLoading}
                                                required
                                            />
                                        </label>
                                        <label className="flex flex-col gap-1.5">
                                            <span className="text-[10px] font-bold text-muted uppercase tracking-[0.14em]">Password</span>
                                            <input
                                                value={jellyfinPassword}
                                                onChange={(e) => setJellyfinPassword(e.target.value)}
                                                type="password"
                                                autoComplete="current-password"
                                                className="w-full bg-black/25 border border-white/15 rounded-xl px-4 py-3 text-sm text-text outline-none focus:border-plex/70 focus:ring-2 focus:ring-plex/20 transition"
                                                placeholder="Password"
                                                disabled={isLoading}
                                                required
                                            />
                                        </label>
                                        <button type="submit" className={loginSecondaryBtnClass} disabled={isLoading || !jellyfinUsername.trim() || !jellyfinPassword}>
                                            <img src={JELLYFIN_ICON_URL} alt="" className="w-5 h-5 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                            Login with password
                                        </button>
                                    </form>
                                )}
                            </div>
                        ) : (
                            <button type="button" className={loginSecondaryBtnClass} onClick={handlePlexLogin} disabled={isLoading}>
                                <img src={logoUrl()} alt="" className="w-5 h-5 object-contain opacity-80" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                Login with Plex
                            </button>
                        )}

                        {!showTrialAccess && !isJellyfinAuth && (
                            <div className="w-full mt-10 pt-8 border-t border-white/10">
                                <LivePlexStats />
                            </div>
                        )}
                    </div>
                </div>

                <PublicUptimeBanner />

                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm flex items-start gap-3">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
                        <span>{error}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

const RebuildLibraryCacheButton: React.FC = () => {
    const [status, setStatus] = useState<'idle' | 'starting' | 'building' | 'done' | 'error'>('idle');
    const [lastBuilt, setLastBuilt] = useState<number | null>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        apiFetch('/api/plex/stats/status').then((s: any) => {
            if (s.lastGeneratedAt) setLastBuilt(s.lastGeneratedAt);
            if (s.isBuilding) startPolling();
        }).catch(() => { });
        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, []);

    const startPolling = () => {
        setStatus('building');
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = setInterval(async () => {
            try {
                const s: any = await apiFetch('/api/plex/stats/status');
                if (s.lastGeneratedAt) setLastBuilt(s.lastGeneratedAt);
                if (!s.isBuilding) {
                    clearInterval(pollRef.current);
                    setStatus('done');
                    setTimeout(() => setStatus('idle'), 4000);
                }
            } catch { clearInterval(pollRef.current); setStatus('error'); }
        }, 3000);
    };

    const handleRebuild = async () => {
        setStatus('starting');
        try {
            await apiFetch('/api/plex/stats/rebuild', { method: 'POST' });
            startPolling();
        } catch {
            setStatus('error');
            setTimeout(() => setStatus('idle'), 3000);
        }
    };

    const isRunning = status === 'building' || status === 'starting';
    return (
        <div className="flex flex-col gap-1.5">
            <button
                onClick={handleRebuild}
                disabled={isRunning}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all border
                    ${status === 'done' ? 'bg-green-500/10 border-green-500/30 text-green-400' :
                        status === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                            isRunning ? 'bg-white/5 border-white/10 text-muted cursor-not-allowed' :
                                'bg-white/5 border-white/10 text-text hover:bg-white/10'}`}
            >
                {isRunning ? (
                    <><div className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" /> Building Cache...</>
                ) : status === 'done' ? (
                    <><CheckCircle size={14} /> Cache Updated!</>
                ) : status === 'error' ? (
                    <><AlertCircle size={14} /> Build Failed</>
                ) : (
                    <><RefreshCw size={14} /> Rebuild Library Cache</>
                )}
            </button>
            {lastBuilt && (
                <p className="text-[10px] text-muted text-center">
                    Last built: {new Date(lastBuilt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
            )}
        </div>
    );
};

const WrapUpModal: React.FC<{ metric: string; analytics: any; days: number | string; onClose: () => void }> = ({ metric, analytics, days, onClose }) => {
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const renderContent = () => {
        switch (metric) {
            case 'Server Rank': {
                const percentile = analytics.totalActiveUsers > 0 ? Math.max(1, Math.round((analytics.leaderboardRank / analytics.totalActiveUsers) * 100)) : 100;
                const progressPct = analytics.totalActiveUsers > 0 ? Math.max(2, 100 - Math.round(((analytics.leaderboardRank - 1) / analytics.totalActiveUsers) * 100)) : 100;
                const neighbourhood: any[] = analytics.leaderboardNeighbourhood || [];
                const myPlays = analytics.myPlaysOnLeaderboard || analytics.totalPlays || 0;
                const userAbove = neighbourhood.find((u: any) => !u.isMe && u.rank < (analytics.leaderboardRank || 999));
                const playsToClimb = userAbove ? (userAbove.plays - myPlays + 1) : null;

                const rankEmoji = (analytics.leaderboardRank === 1) ? '🥇' : (analytics.leaderboardRank === 2) ? '🥈' : (analytics.leaderboardRank === 3) ? '🥉' : '🏆';

                return (
                    <div className="flex flex-col items-center justify-center text-center p-6">
                        <span className="text-5xl mb-3">{rankEmoji}</span>
                        <h2 className="text-3xl font-black text-white mb-1">Rank #{analytics.leaderboardRank || 'Unranked'}</h2>
                        <p className="text-muted mb-5 text-sm">Out of {analytics.totalActiveUsers || 0} active users</p>

                        {/* Progress bar */}
                        <div className="w-full mb-1">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1.5">
                                <span className="text-gray-500">#1 Top</span>
                                <span className="text-plex">Top {percentile}%</span>
                                <span className="text-gray-500">#{analytics.totalActiveUsers} Last</span>
                            </div>
                            <div className="w-full h-3 bg-black/50 rounded-full overflow-hidden border border-white/10">
                                <div
                                    className="h-full bg-gradient-to-r from-plex via-amber-400 to-orange-400 rounded-full shadow-[0_0_10px_rgba(229,160,13,0.6)] transition-all duration-1000"
                                    style={{ width: `${progressPct}%` }}
                                />
                            </div>
                        </div>

                        {/* Stats row */}
                        <div className="grid grid-cols-2 gap-3 w-full mt-4 mb-4">
                            <div className="bg-gradient-to-b from-white/10 to-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center shadow-lg">
                                <span className="text-2xl font-black text-white mb-1">{myPlays}</span>
                                <span className="text-[9px] text-muted uppercase tracking-widest font-black">My Streams</span>
                            </div>
                            <div className="bg-gradient-to-b from-plex/20 to-plex/5 border border-plex/30 rounded-xl p-4 flex flex-col items-center shadow-lg relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-16 h-16 bg-plex/20 blur-xl -mr-5 -mt-5 rounded-full" />
                                <span className="text-2xl font-black text-plex mb-1">{percentile}%</span>
                                <span className="text-[9px] text-plex/80 uppercase tracking-widest font-black">Top Percentile</span>
                            </div>
                        </div>

                        {/* Plays to climb */}
                        {playsToClimb !== null && playsToClimb > 0 && (
                            <div className="w-full bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 mb-4 text-sm text-blue-300 font-medium">
                                🎯 <strong>{playsToClimb} more stream{playsToClimb !== 1 ? 's' : ''}</strong> to overtake <strong>{userAbove?.username}</strong> (Rank #{userAbove?.rank})
                            </div>
                        )}
                        {playsToClimb === null && analytics.leaderboardRank === 1 && (
                            <div className="w-full bg-plex/10 border border-plex/30 rounded-xl px-4 py-3 mb-4 text-sm text-plex font-medium">
                                👑 You're at the top of the leaderboard!
                            </div>
                        )}

                        {/* Mini leaderboard neighbourhood */}
                        {neighbourhood.length > 0 && (
                            <div className="w-full">
                                <p className="text-left text-xs uppercase tracking-widest font-bold text-muted mb-3 border-b border-white/10 pb-2">Your Leaderboard Position</p>
                                <div className="flex flex-col gap-1.5">
                                    {neighbourhood.map((u: any, i: number) => (
                                        <div key={i} className={`flex items-center justify-between rounded-lg px-3 py-2.5 border transition-all ${u.isMe
                                            ? 'bg-plex/15 border-plex/50 shadow-[0_0_12px_rgba(229,160,13,0.2)]'
                                            : 'bg-white/5 border-white/5'
                                            }`}>
                                            <div className="flex items-center gap-3">
                                                <span className={`font-black text-sm w-8 text-right ${u.isMe ? 'text-plex' : 'text-gray-500'}`}>#{u.rank}</span>
                                                <span className={`font-bold text-sm ${u.isMe ? 'text-white' : 'text-gray-300'}`}>
                                                    {u.isMe ? <span className="inline-flex items-center gap-1.5">{u.username} <span className="text-[9px] text-plex font-black uppercase tracking-widest bg-plex/20 px-1.5 py-0.5 rounded">You</span></span> : u.username}
                                                </span>
                                            </div>
                                            <span className={`text-xs font-black whitespace-nowrap ${u.isMe ? 'text-plex' : 'text-gray-400'}`}>{u.plays} plays</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                );
            }
            case 'Total Streams': {
                const total = analytics.totalPlays || 0;
                const movies = analytics.moviesCount || 0;
                const episodes = analytics.showsCount || 0;
                const tracks = analytics.musicCount || 0;
                const moviePct = total > 0 ? Math.round((movies / total) * 100) : 0;
                const episodePct = total > 0 ? Math.round((episodes / total) * 100) : 0;
                const trackPct = total > 0 ? Math.round((tracks / total) * 100) : 0;
                // Approximate daily average based on current filter
                const filterDays = (days === 'all' || !days) ? 365 : (parseInt(String(days)) || 30);
                const dailyAvg = filterDays > 0 ? (total / filterDays).toFixed(1) : '—';
                const recentItems = (analytics.recentHistory || []).slice(0, 5);

                return (
                    <div className="flex flex-col items-center justify-center text-center p-6">
                        <PlayCircle className="w-14 h-14 text-plex mb-3 drop-shadow-lg" />
                        <h2 className="text-5xl font-black text-white mb-1">{total}</h2>
                        <p className="text-muted uppercase tracking-widest text-xs font-bold mb-5">Total Streams</p>

                        {/* Type breakdown bars */}
                        <div className="w-full flex flex-col gap-3 mb-5">
                            <div>
                                <div className="flex justify-between text-xs font-bold mb-1">
                                    <span className="text-blue-400">🎬 Movies</span>
                                    <span className="text-gray-300">{movies} <span className="text-gray-500">({moviePct}%)</span></span>
                                </div>
                                <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden border border-white/5">
                                    <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-1000" style={{ width: `${moviePct}%` }} />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs font-bold mb-1">
                                    <span className="text-green-400">📺 Episodes</span>
                                    <span className="text-gray-300">{episodes} <span className="text-gray-500">({episodePct}%)</span></span>
                                </div>
                                <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden border border-white/5">
                                    <div className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full transition-all duration-1000" style={{ width: `${episodePct}%` }} />
                                </div>
                            </div>
                            {tracks > 0 && (
                                <div>
                                    <div className="flex justify-between text-xs font-bold mb-1">
                                        <span className="text-purple-400">🎵 Tracks</span>
                                        <span className="text-gray-300">{tracks} <span className="text-gray-500">({trackPct}%)</span></span>
                                    </div>
                                    <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden border border-white/5">
                                        <div className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full transition-all duration-1000" style={{ width: `${trackPct}%` }} />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Extra stats */}
                        <div className="grid grid-cols-2 gap-3 w-full mb-5">
                            <div className="bg-gradient-to-b from-white/10 to-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center shadow-lg">
                                <span className="text-2xl font-black text-white mb-1">{dailyAvg}</span>
                                <span className="text-[9px] text-muted uppercase tracking-widest font-black">Per Day</span>
                            </div>
                            <div className="bg-gradient-to-b from-plex/20 to-plex/5 border border-plex/30 rounded-xl p-4 flex flex-col items-center shadow-lg relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-12 h-12 bg-plex/20 blur-xl -mr-4 -mt-4 rounded-full" />
                                <span className="text-2xl font-black text-plex mb-1">{analytics.uniqueTitles || 0}</span>
                                <span className="text-[9px] text-plex/80 uppercase tracking-widest font-black">Unique Titles</span>
                            </div>
                        </div>

                        {/* Recent activity */}
                        {recentItems.length > 0 && (
                            <div className="w-full">
                                <p className="text-left text-xs uppercase tracking-widest font-bold text-muted mb-3 border-b border-white/10 pb-2">Recently Watched</p>
                                <div className="flex flex-col gap-1.5">
                                    {recentItems.map((item: any, i: number) => (
                                        <div key={i} className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-lg px-3 py-2 hover:bg-white/10 transition-colors">
                                            {item.thumbUrl
                                                ? <img src={resolvePortalAssetUrl(item.thumbUrl)} className="w-8 h-8 rounded object-cover flex-shrink-0" />
                                                : <div className="w-8 h-8 rounded bg-white/10 flex-shrink-0" />}
                                            <div className="flex flex-col text-left overflow-hidden">
                                                <span className="font-bold text-sm text-gray-200 truncate">{item.title}</span>
                                                {item.episodeTitle && <span className="text-[10px] text-gray-400 truncate">{item.episodeTitle}</span>}
                                            </div>
                                            <span className="ml-auto text-[10px] text-gray-500 whitespace-nowrap flex-shrink-0">
                                                {new Date(item.viewedAt * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                );
            }
            case 'Top Binge':
                return (
                    <div className="flex flex-col items-center justify-center text-center p-6 relative">
                        {analytics.topBinge?.artUrl || analytics.topBinge?.thumbUrl ? (
                            <div className="w-full h-40 bg-cover bg-center rounded-xl shadow-lg mb-6 border border-white/10 relative overflow-hidden" style={{ backgroundImage: `url('${resolvePortalAssetUrl(analytics.topBinge.artUrl) || 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&q=80&w=600'}')` }}>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                                <div className="absolute bottom-4 left-0 right-0 px-4 flex flex-col items-center">
                                    <h2 className="text-2xl font-black text-white mb-1 line-clamp-1 drop-shadow-md">{analytics.topBinge?.title || 'Nothing yet'}</h2>
                                    <p className="text-plex font-bold drop-shadow-md">{analytics.topBinge?.plays || 0} episodes</p>
                                </div>
                            </div>
                        ) : (
                            <Tv className="w-16 h-16 text-plex mb-6 drop-shadow-lg" />
                        )}

                        {analytics.topBinge?.summary && (
                            <div className="w-full mt-2 mb-4 bg-white/5 border border-white/5 rounded-lg p-4 text-left">
                                <p className="text-gray-300 text-sm leading-relaxed">{analytics.topBinge.summary}</p>
                                {analytics.topBinge.year && <span className="inline-block mt-3 text-xs font-black px-2 py-1 bg-black/40 rounded text-gray-400">{analytics.topBinge.year}</span>}
                            </div>
                        )}

                        {analytics.topShows && analytics.topShows.length > 1 ? (
                            <div className="w-full mt-2">
                                <p className="text-left text-xs uppercase tracking-widest font-bold text-muted mb-3 border-b border-white/10 pb-2">Runner Ups</p>
                                <div className="flex flex-col gap-2">
                                    {analytics.topShows.slice(1).map((show: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between bg-white/5 border border-white/5 rounded-lg p-2 hover:bg-white/10 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <span className="text-gray-500 font-bold w-4 text-right">{i + 2}</span>
                                                {show.thumbUrl ? <img src={resolvePortalAssetUrl(show.thumbUrl)} className="w-8 h-12 object-cover rounded shadow-sm" /> : <div className="w-8 h-12 bg-white/10 rounded"></div>}
                                                <span className="font-bold text-sm text-gray-200 line-clamp-1 text-left">{show.title}</span>
                                            </div>
                                            <span className="text-xs font-black text-plex whitespace-nowrap">{show.plays} eps</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="w-full mt-2 py-6 border border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center opacity-50">
                                <Tv className="w-8 h-8 text-gray-500 mb-2" />
                                <p className="text-sm font-bold text-gray-400">No other shows watched</p>
                            </div>
                        )}
                    </div>
                );
            case 'Top Movie':
                return (
                    <div className="flex flex-col items-center justify-center text-center p-6 relative">
                        {analytics.topMovie?.artUrl || analytics.topMovie?.thumbUrl ? (
                            <div className="w-full h-40 bg-cover bg-center rounded-xl shadow-lg mb-6 border border-white/10 relative overflow-hidden" style={{ backgroundImage: `url('${resolvePortalAssetUrl(analytics.topMovie.artUrl) || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=600'}')` }}>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                                <div className="absolute bottom-4 left-0 right-0 px-4 flex flex-col items-center">
                                    <h2 className="text-2xl font-black text-white mb-1 line-clamp-1 drop-shadow-md">{analytics.topMovie?.title || 'Nothing yet'}</h2>
                                    <p className="text-plex font-bold drop-shadow-md">{analytics.topMovie?.plays || 0} plays</p>
                                </div>
                            </div>
                        ) : (
                            <Clapperboard className="w-16 h-16 text-plex mb-6 drop-shadow-lg" />
                        )}

                        {analytics.topMovie?.summary && (
                            <div className="w-full mt-2 mb-4 bg-white/5 border border-white/5 rounded-lg p-4 text-left">
                                {analytics.topMovie.tagline && <p className="italic text-plex text-xs mb-2 font-bold">"{analytics.topMovie.tagline}"</p>}
                                <p className="text-gray-300 text-sm leading-relaxed">{analytics.topMovie.summary}</p>
                                {analytics.topMovie.year && <span className="inline-block mt-3 text-xs font-black px-2 py-1 bg-black/40 rounded text-gray-400">{analytics.topMovie.year}</span>}
                            </div>
                        )}

                        {analytics.topMovies && analytics.topMovies.length > 1 ? (
                            <div className="w-full mt-2">
                                <p className="text-left text-xs uppercase tracking-widest font-bold text-muted mb-3 border-b border-white/10 pb-2">Runner Ups</p>
                                <div className="flex flex-col gap-2">
                                    {analytics.topMovies.slice(1).map((movie: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between bg-white/5 border border-white/5 rounded-lg p-2 hover:bg-white/10 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <span className="text-gray-500 font-bold w-4 text-right">{i + 2}</span>
                                                {movie.thumbUrl ? <img src={resolvePortalAssetUrl(movie.thumbUrl)} className="w-8 h-12 object-cover rounded shadow-sm" /> : <div className="w-8 h-12 bg-white/10 rounded"></div>}
                                                <span className="font-bold text-sm text-gray-200 line-clamp-1 text-left">{movie.title}</span>
                                            </div>
                                            <span className="text-xs font-black text-plex whitespace-nowrap">{movie.plays} plays</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="w-full mt-2 py-6 border border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center opacity-50">
                                <Film className="w-8 h-8 text-gray-500 mb-2" />
                                <p className="text-sm font-bold text-gray-400">No other movies watched</p>
                            </div>
                        )}
                    </div>
                );
            case 'Time of Day':
                const maxHour = Math.max(...(analytics.hourDistribution || [0]));
                return (
                    <div className="flex flex-col items-center justify-center text-center p-6">
                        <Clock className="w-16 h-16 text-plex mb-4 drop-shadow-lg" />
                        <h2 className="text-3xl font-black text-white mb-2">{analytics.timeOfDay || 'Unknown'}</h2>
                        <p className="text-muted mb-6">You typically stream around {formatStreamingHour(analytics.peakHour ?? analytics.avgHour)}.</p>

                        <div className="w-full mt-2 mb-6">
                            <p className="text-left text-xs uppercase tracking-widest font-bold text-muted mb-3 border-b border-white/10 pb-2">24-Hour Heat Map</p>
                            <div className="w-full flex items-end justify-between h-24 gap-[2px] mt-4 px-1">
                                {analytics.hourDistribution?.map((count: number, hour: number) => {
                                    const height = maxHour > 0 ? (count / maxHour) * 100 : 0;
                                    const isTop = count === maxHour && count > 0;
                                    return (
                                        <div key={hour} className="flex flex-col items-center justify-end w-full h-full group relative">
                                            <div className={`w-full rounded-t-sm transition-all duration-500 relative flex items-end justify-center overflow-hidden
                                                ${isTop ? 'bg-plex shadow-[0_0_10px_rgba(229,160,13,0.5)]' : 'bg-white/10 group-hover:bg-white/30'}`}
                                                style={{ height: `${Math.max(height, 2)}%` }}>
                                            </div>
                                            {hour % 6 === 0 && <span className="text-[8px] mt-1 font-bold text-muted absolute top-full pointer-events-none">{hour}h</span>}

                                            <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded pointer-events-none whitespace-nowrap z-10 transition-opacity">
                                                {count} plays at {formatStreamingHour(hour)}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        <div className="w-full bg-gradient-to-r from-plex/5 via-plex/10 to-plex/5 border border-plex/20 rounded-xl p-4 shadow-inner mt-4">
                            <p className="text-sm text-plex font-medium">
                                {analytics.timeOfDay === 'Early Bird' ? 'Catching the worm with those morning streams!' :
                                    analytics.timeOfDay === 'Afternoon Watcher' ? 'Perfect way to spend the afternoon.' :
                                        analytics.timeOfDay === 'Evening Streamer' ? 'Unwinding after a long day.' :
                                            'Burning the midnight oil with some late night streaming!'}
                            </p>
                        </div>
                    </div>
                );
            case 'Top Day':
                const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                const maxCount = Math.max(...(analytics.dayOfWeekCounts ? Object.values(analytics.dayOfWeekCounts) as number[] : [0]));
                return (
                    <div className="flex flex-col items-center justify-center text-center p-6">
                        <Calendar className="w-16 h-16 text-plex mb-4 drop-shadow-lg" />
                        <h2 className="text-3xl font-black text-white mb-2">{analytics.popularDay || 'Unknown'}</h2>
                        <p className="text-muted mb-6 uppercase tracking-widest text-xs font-bold">Most Active Day</p>
                        <div className="w-full flex items-end justify-between h-32 gap-1.5 mt-4 px-2">
                            {daysOfWeek.map((day, i) => {
                                const count = analytics.dayOfWeekCounts ? analytics.dayOfWeekCounts[i] : 0;
                                const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
                                const isTop = count === maxCount && count > 0;
                                return (
                                    <div key={day} className="flex flex-col items-center justify-end w-full h-full group relative">
                                        <div className={`w-full rounded-t-md transition-all duration-500 relative flex items-end justify-center pb-1 overflow-hidden
                                            ${isTop ? 'bg-gradient-to-t from-plex/80 to-plex shadow-[0_0_15px_rgba(229,160,13,0.3)]' : 'bg-gradient-to-t from-white/10 to-white/20 group-hover:from-white/20 group-hover:to-white/30'}`}
                                            style={{ height: `${Math.max(height, 8)}%` }}>
                                        </div>
                                        <span className={`text-[9px] mt-2 font-black uppercase tracking-wider ${isTop ? 'text-plex' : 'text-muted'}`}>{day}</span>
                                        <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded pointer-events-none whitespace-nowrap z-10 transition-opacity">
                                            {count} plays
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                );
            case 'Top Library':
                const maxLibPlays = analytics.allLibraries?.[0]?.plays || 1;
                return (
                    <div className="flex flex-col items-center justify-center text-center p-6 max-h-[80vh] overflow-hidden flex-1">
                        <Layers className="w-16 h-16 text-plex mb-4 drop-shadow-lg shrink-0" />
                        <h2 className="text-3xl font-black text-white mb-2 line-clamp-1 shrink-0">{analytics.favoriteLibrary || 'None'}</h2>
                        <p className="text-muted mb-6 uppercase tracking-widest text-xs font-bold shrink-0">Library Breakdown</p>

                        <div className="w-full flex flex-col gap-3 overflow-y-auto pr-2 pb-2 custom-scrollbar">
                            {analytics.allLibraries?.map((lib: any, i: number) => {
                                const percent = (lib.plays / maxLibPlays) * 100;
                                return (
                                    <div key={i} className="flex flex-col gap-1 w-full text-left">
                                        <div className="flex justify-between items-end">
                                            <span className={`font-bold text-sm truncate pr-2 ${i === 0 ? 'text-plex' : 'text-gray-300'}`}>{i + 1}. {lib.title}</span>
                                            <span className={`font-black text-xs whitespace-nowrap ${i === 0 ? 'text-plex' : 'text-gray-400'}`}>{lib.plays} plays</span>
                                        </div>
                                        <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden border border-white/5">
                                            <div className={`h-full rounded-full transition-all duration-1000 ${i === 0 ? 'bg-plex shadow-[0_0_8px_rgba(229,160,13,0.8)]' : 'bg-gray-400'}`} style={{ width: `${percent}%` }}></div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                );
            case 'Media Profile': {
                const total = analytics.totalPlays || 1;
                const movies = analytics.moviesCount || 0;
                const shows = analytics.showsCount || 0;
                const music = analytics.musicCount || 0;
                const moviePct = Math.round((movies / total) * 100);
                const showPct = Math.round((shows / total) * 100);
                const musicPct = Math.round((music / total) * 100);

                const topMoviesList: any[] = (analytics.topMovies || []).slice(0, 3);
                const topShowsList: any[] = (analytics.topShows || []).slice(0, 3);

                const profileDesc = analytics.mediaPreference === 'Movie Buff'
                    ? 'You love the big screen experience. Movies are your go-to comfort.'
                    : analytics.mediaPreference === 'TV Show Binger'
                        ? 'You\'re a serial binger — once you start a show, you see it through.'
                        : analytics.mediaPreference === 'Music Lover'
                            ? 'Music is your thing — you\'re always on the listening grind.'
                            : 'You keep things varied. A bit of everything keeps it interesting.';

                return (
                    <div className="flex flex-col items-center justify-center text-center p-6">
                        <PieChart className="w-14 h-14 text-plex mb-3 drop-shadow-lg" />
                        <h2 className="text-3xl font-black text-white mb-1">{analytics.mediaPreference || 'Mixed Bag'}</h2>
                        <p className="text-muted mb-2 uppercase tracking-widest text-xs font-bold">Content Breakdown</p>
                        <p className="text-gray-400 text-sm mb-5 italic">{profileDesc}</p>

                        {/* Breakdown bars with percentages */}
                        <div className="w-full flex flex-col gap-4 mb-5">
                            <div>
                                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider mb-1.5">
                                    <span className="text-blue-400 flex items-center gap-1.5">🎬 Movies</span>
                                    <span className="text-gray-300">{movies} <span className="text-gray-500 font-normal">({moviePct}%)</span></span>
                                </div>
                                <div className="w-full bg-black/60 rounded-full h-3 overflow-hidden shadow-inner border border-white/5">
                                    <div className="bg-gradient-to-r from-blue-600 to-blue-400 h-full rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-1000" style={{ width: `${moviePct}%` }} />
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider mb-1.5">
                                    <span className="text-green-400 flex items-center gap-1.5">📺 Shows</span>
                                    <span className="text-gray-300">{shows} <span className="text-gray-500 font-normal">({showPct}%)</span></span>
                                </div>
                                <div className="w-full bg-black/60 rounded-full h-3 overflow-hidden shadow-inner border border-white/5">
                                    <div className="bg-gradient-to-r from-green-600 to-green-400 h-full rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)] transition-all duration-1000" style={{ width: `${showPct}%` }} />
                                </div>
                            </div>
                            {music > 0 && (
                                <div>
                                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider mb-1.5">
                                        <span className="text-purple-400 flex items-center gap-1.5">🎵 Music</span>
                                        <span className="text-gray-300">{music} <span className="text-gray-500 font-normal">({musicPct}%)</span></span>
                                    </div>
                                    <div className="w-full bg-black/60 rounded-full h-3 overflow-hidden shadow-inner border border-white/5">
                                        <div className="bg-gradient-to-r from-purple-600 to-purple-400 h-full rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)] transition-all duration-1000" style={{ width: `${musicPct}%` }} />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Top picks per category */}
                        {(topMoviesList.length > 0 || topShowsList.length > 0) && (
                            <div className="w-full">
                                <p className="text-left text-xs uppercase tracking-widest font-bold text-muted mb-3 border-b border-white/10 pb-2">Top Picks This Period</p>
                                <div className="flex flex-col gap-2">
                                    {topMoviesList.length > 0 && (
                                        <>
                                            <p className="text-left text-[9px] text-blue-400 font-black uppercase tracking-widest mt-1">🎬 Movies</p>
                                            {topMoviesList.map((m: any, i: number) => (
                                                <div key={i} className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-lg p-2 hover:bg-white/10 transition-colors">
                                                    <span className="text-gray-500 font-black text-xs w-4 text-right flex-shrink-0">{i + 1}</span>
                                                    {m.thumbUrl
                                                        ? <img src={resolvePortalAssetUrl(m.thumbUrl)} className="w-8 h-12 object-cover rounded shadow-sm flex-shrink-0" />
                                                        : <div className="w-8 h-12 bg-white/10 rounded flex-shrink-0" />}
                                                    <div className="flex flex-col text-left overflow-hidden">
                                                        <span className="font-bold text-sm text-gray-200 truncate">{m.title}</span>
                                                        <span className="text-[10px] text-gray-400">{m.plays} play{m.plays !== 1 ? 's' : ''}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </>
                                    )}
                                    {topShowsList.length > 0 && (
                                        <>
                                            <p className="text-left text-[9px] text-green-400 font-black uppercase tracking-widest mt-2">📺 Shows</p>
                                            {topShowsList.map((s: any, i: number) => (
                                                <div key={i} className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-lg p-2 hover:bg-white/10 transition-colors">
                                                    <span className="text-gray-500 font-black text-xs w-4 text-right flex-shrink-0">{i + 1}</span>
                                                    {s.thumbUrl
                                                        ? <img src={resolvePortalAssetUrl(s.thumbUrl)} className="w-8 h-12 object-cover rounded shadow-sm flex-shrink-0" />
                                                        : <div className="w-8 h-12 bg-white/10 rounded flex-shrink-0" />}
                                                    <div className="flex flex-col text-left overflow-hidden">
                                                        <span className="font-bold text-sm text-gray-200 truncate">{s.title}</span>
                                                        <span className="text-[10px] text-gray-400">{s.plays} episode{s.plays !== 1 ? 's' : ''}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                );
            }
            case 'Watch Style':
                const discoveryPlays = analytics.uniqueTitles || 0;
                const rewatchPlays = Math.max(0, (analytics.totalPlays || 0) - discoveryPlays);
                return (
                    <div className="flex flex-col items-center justify-center text-center p-6">
                        <Compass className="w-16 h-16 text-plex mb-4 drop-shadow-lg" />
                        <h2 className="text-3xl font-black text-white mb-2">{analytics.watchStyle || 'Unknown'}</h2>
                        <p className="text-muted mb-6 uppercase tracking-widest text-xs font-bold">Discovery vs Rewatch</p>

                        <div className="w-full relative h-4 rounded-full overflow-hidden flex shadow-inner bg-black/50 border border-white/10 mb-2 mt-2">
                            <div className="h-full bg-gradient-to-r from-plex to-orange-400 flex items-center justify-center transition-all duration-1000 shadow-[inset_0_0_20px_rgba(0,0,0,0.3)] relative overflow-hidden" style={{ width: `${((discoveryPlays) / Math.max(analytics.totalPlays || 1, 1)) * 100}%` }}>
                            </div>
                            <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 flex items-center justify-center transition-all duration-1000 shadow-[inset_0_0_20px_rgba(0,0,0,0.3)] relative overflow-hidden" style={{ width: `${((rewatchPlays) / Math.max(analytics.totalPlays || 1, 1)) * 100}%` }}>
                            </div>
                        </div>
                        <div className="flex justify-between w-full px-2 mb-6 text-[10px] font-black uppercase tracking-wider">
                            <span className="text-plex">{discoveryPlays} New</span>
                            <span className="text-blue-400">{rewatchPlays} Rewatches</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 w-full mb-6">
                            <div className="bg-gradient-to-b from-white/10 to-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center shadow-lg">
                                <span className="text-3xl font-black text-white mb-1 drop-shadow">{analytics.totalPlays || 0}</span>
                                <span className="text-[9px] text-muted uppercase tracking-widest font-black">Total Plays</span>
                            </div>
                            <div className="bg-gradient-to-b from-plex/20 to-plex/5 border border-plex/30 rounded-xl p-4 flex flex-col items-center justify-center shadow-lg relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-16 h-16 bg-plex/20 blur-xl -mr-5 -mt-5 rounded-full"></div>
                                <span className="text-3xl font-black text-plex mb-1 drop-shadow-md">{analytics.uniqueTitles || 0}</span>
                                <span className="text-[9px] text-plex/80 uppercase tracking-widest font-black">Unique Titles</span>
                            </div>
                        </div>

                        <p className="text-sm text-gray-300 italic bg-white/5 border border-white/10 rounded-lg px-4 py-3 w-full shadow-inner mb-4">
                            {analytics.watchStyle === 'Comfort Binger' ? 'You love returning to your favorite comfort shows.' :
                                analytics.watchStyle === 'Loyal Fan' ? 'You stick around to finish what you start.' :
                                    'You love exploring a wide variety of different content!'}
                        </p>

                        {analytics.topWatched && analytics.topWatched.filter((c: any) => c.plays > 1).length > 0 && (
                            <div className="w-full mt-2">
                                <p className="text-left text-xs uppercase tracking-widest font-bold text-muted mb-3 border-b border-white/10 pb-2">Top Obsessions</p>
                                <div className="flex flex-col gap-2">
                                    {analytics.topWatched.filter((c: any) => c.plays > 1).slice(0, 5).map((item: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between bg-white/5 border border-white/5 rounded-lg p-2 hover:bg-white/10 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <span className="text-gray-500 font-bold w-4 text-right">{i + 1}</span>
                                                {item.thumbUrl ? <img src={resolvePortalAssetUrl(item.thumbUrl)} className="w-8 h-12 object-cover rounded shadow-sm" /> : <div className="w-8 h-12 bg-white/10 rounded"></div>}
                                                <div className="flex flex-col text-left">
                                                    <span className="font-bold text-sm text-gray-200 line-clamp-1">{item.title}</span>
                                                    <span className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">{item.type}</span>
                                                </div>
                                            </div>
                                            <span className="text-xs font-black text-plex whitespace-nowrap">{item.plays} plays</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                );
            case 'Streaming Habit':
                const avgWd = (analytics.weekdayPlays || 0) / 5;
                const avgWe = (analytics.weekendPlays || 0) / 2;
                return (
                    <div className="flex flex-col items-center justify-center text-center p-6">
                        <Coffee className="w-16 h-16 text-plex mb-4 drop-shadow-lg" />
                        <h2 className="text-3xl font-black text-white mb-2">{analytics.streamingHabit || 'Unknown'}</h2>
                        <p className="text-muted mb-8 uppercase tracking-widest text-xs font-bold">Weekday vs Weekend</p>

                        <div className="w-full relative h-16 rounded-2xl overflow-hidden flex shadow-inner bg-black/50 border border-white/10">
                            <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 flex items-center justify-center transition-all duration-1000 shadow-[inset_0_0_20px_rgba(0,0,0,0.3)] relative overflow-hidden group" style={{ width: `${((analytics.weekdayPlays || 0) / Math.max(analytics.totalPlays || 1, 1)) * 100}%` }}>
                                {analytics.weekdayPlays > 0 && <span className="text-white font-black drop-shadow-md z-10 text-sm">WD</span>}
                            </div>
                            <div className="h-full bg-gradient-to-r from-plex to-orange-400 flex items-center justify-center transition-all duration-1000 shadow-[inset_0_0_20px_rgba(0,0,0,0.3)] relative overflow-hidden group" style={{ width: `${((analytics.weekendPlays || 0) / Math.max(analytics.totalPlays || 1, 1)) * 100}%` }}>
                                {analytics.weekendPlays > 0 && <span className="text-white font-black drop-shadow-md z-10 text-sm">WE</span>}
                            </div>
                        </div>
                        <div className="flex justify-between w-full mt-3 px-2">
                            <div className="flex flex-col items-start">
                                <span className="text-[10px] uppercase tracking-widest font-bold text-blue-400">Weekdays (5 days)</span>
                                <span className="text-lg font-black text-white">{analytics.weekdayPlays || 0} <span className="text-[10px] text-gray-500 font-normal">({avgWd.toFixed(1)}/day)</span></span>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] uppercase tracking-widest font-bold text-plex">Weekends (2 days)</span>
                                <span className="text-lg font-black text-white">{analytics.weekendPlays || 0} <span className="text-[10px] text-gray-500 font-normal">({avgWe.toFixed(1)}/day)</span></span>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className="relative bg-gradient-to-b from-card to-background border border-border/80 shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-plex/0 via-plex to-plex/0 opacity-50"></div>
                <button onClick={onClose} className="absolute top-4 right-4 text-muted hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-full p-2 transition-all z-20 group">
                    <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                </button>
                {renderContent()}
            </div>
        </div>
    );
};

const DiscoverPosterCard: React.FC<{
    item: { title: string; thumb?: string; thumbUrl?: string; plexUrl: string; tags?: string[]; year?: number | string; parentTitle?: string };
    aspect?: '2/3' | 'square';
    overlay?: React.ReactNode;
    variant?: 'discover' | 'home';
    className?: string;
    footer?: React.ReactNode;
    showQualityBadges?: boolean;
}> = ({ item, aspect = '2/3', overlay, variant = 'discover', className = 'w-full', footer, showQualityBadges = true }) => {
    const posterShell = variant === 'home'
        ? 'relative rounded-xl overflow-hidden bg-background border border-white/5 transition-[box-shadow,border-color] duration-300 group-hover:shadow-xl group-hover:border-plex/50'
        : 'relative rounded-lg overflow-hidden border border-border group-hover:border-plex transition-colors shadow-md';

    return (
        <a
            href={item.plexUrl}
            target="_blank"
            rel="noreferrer"
            className={`flex flex-col gap-2 group ${className}`}
            style={{ textDecoration: 'none', color: 'inherit' }}
        >
            <div className={`${posterShell} ${aspect === 'square' ? 'aspect-square' : 'aspect-[2/3]'} w-full`}>
                {item.thumb ? (
                    <img
                        src={item.thumbUrl ? resolvePortalAssetUrl(item.thumbUrl) : portalUrl(`/api/plex/image?path=${encodeURIComponent(item.thumb)}&width=300&height=${aspect === 'square' ? 300 : 450}`)}
                        alt={item.title}
                        loading="lazy"
                        className={`w-full h-full object-cover ${variant === 'home' ? 'transition-[transform,opacity] duration-300 group-hover:scale-105 group-hover:opacity-80' : ''}`}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center p-4 text-center bg-white/5">
                        <span className="text-xs font-bold text-muted line-clamp-3">{item.title}</span>
                    </div>
                )}
                {overlay}
                {showQualityBadges && item.tags && item.tags.length > 0 && (
                    <div className="absolute bottom-1 left-1 right-1 flex flex-wrap gap-0.5 pointer-events-none z-10">
                        {item.tags.map((tag) => (
                            <span key={tag} className="text-[8px] font-bold px-1 py-px rounded bg-black/85 text-white/95 border border-white/15 uppercase tracking-wide">
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>
            {footer ?? (
                <div className={`text-xs font-medium line-clamp-2 leading-tight ${variant === 'home' ? 'text-text text-left px-1' : 'text-white text-center mt-1'}`}>
                    {item.title}
                </div>
            )}
        </a>
    );
};

const discoverViewsOverlay = (views: number) => (
    <div className="absolute top-2 right-2 bg-black/80 text-plex text-xs font-bold px-2 py-1 rounded backdrop-blur-md border border-plex/30 z-10 pointer-events-none">
        {views} Views
    </div>
);

const DISCOVER_DESKTOP_ITEM_LIMIT = 20;
const DISCOVER_MOBILE_ITEM_LIMIT = 12;
const RECENTLY_ADDED_ITEM_LIMIT = 100;
const DISCOVER_LIMIT_OPTIONS = [
    { value: '12', label: '12 Items' },
    { value: '20', label: '20 Items' },
    { value: '25', label: '25 Items' },
    { value: '50', label: '50 Items' },
    { value: '100', label: '100 Items' },
    { value: '150', label: '150 Items' },
    { value: '200', label: '200 Items' },
    { value: '250', label: '250 Items' },
];

const TrendingDiscoverSection: React.FC<{ title: string; items: any[]; limit: number; showQualityBadges?: boolean }> = ({ title, items, limit, showQualityBadges = true }) => {
    if (!items?.length) return null;
    return (
        <div className="flex flex-col">
            <h3 className="text-plex text-sm uppercase tracking-[2px] mb-6 font-bold border-b border-white/10 pb-2">{title}</h3>
            <div className={discoverPosterGridClass}>
                {items.slice(0, limit).map((item, i) => (
                    <DiscoverPosterCard
                        key={i}
                        item={{ ...item, plexUrl: item.plexUrl || '#' }}
                        overlay={discoverViewsOverlay(item.views)}
                        showQualityBadges={showQualityBadges}
                    />
                ))}
            </div>
        </div>
    );
};

export const UserDashboard: React.FC<{ sessionInfo: any; publicConfig?: any; onLogout: () => void; refreshSession: () => void; onViewAdmin: () => void; onViewStatus: () => void; onViewDashboard: () => void; onViewSettings?: () => void; onViewLogs?: () => void }> = ({ sessionInfo, publicConfig, onLogout, refreshSession, onViewAdmin, onViewStatus, onViewDashboard, onViewSettings, onViewLogs }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [toast, setToast] = useState<ToastMessage | null>(null);
    const [analytics, setAnalytics] = useState<any>(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(true);
    const [serverStats, setServerStats] = useState<any>(null);
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [serverDataLoading, setServerDataLoading] = useState(true);
    const [topContentPage, setTopContentPage] = useState(0);
    const [isDesktopMostWatched, setIsDesktopMostWatched] = useState(
        () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches
    );
    const topWatchedPageSize = 12;
    const [recentHistoryPage, setRecentHistoryPage] = useState(0);
    const recentHistoryPageSize = 14;
    const [analyticsDays, setAnalyticsDays] = useState<number | 'all'>(30);
    const [analyticsDaysOpen, setAnalyticsDaysOpen] = useState(false);
    const [wrapUpDaysOpen, setWrapUpDaysOpen] = useState(false);
    const [analyticsError, setAnalyticsError] = useState<string | null>(null);
    const [reportItem, setReportItem] = useState<any>(null);
    const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
    const [shareWrapUpOpen, setShareWrapUpOpen] = useState(false);

    const user = sessionInfo.account;
    const showQualityBadges = publicConfig?.showPosterQualityBadges !== false;
    const isJellyfinPortal = String(publicConfig?.mediaServerType || 'plex').toLowerCase() === 'jellyfin';
    const [optOutNewsletter, setOptOutNewsletter] = useState(user?.optOutNewsletter || false);

    const resolveHomeImage = (thumbUrl: string | null | undefined, fallback = logoUrl()) => {
        if (!thumbUrl) return fallback;
        if (thumbUrl.startsWith('http://') || thumbUrl.startsWith('https://') || thumbUrl.startsWith('/api/')) {
            return resolvePortalAssetUrl(thumbUrl);
        }
        return portalUrl(`/api/plex/image?path=${encodeURIComponent(thumbUrl)}&width=256&height=256`);
    };

    const buildJellyfinHomeAnalytics = (data: any) => {
        const topMovies = Array.isArray(data?.topMovies) ? data.topMovies : [];
        const topShows = Array.isArray(data?.topShows) ? data.topShows : [];
        const topMusic = Array.isArray(data?.topMusic) ? data.topMusic : [];
        const topWatched = [...topShows, ...topMovies, ...topMusic].sort((a: any, b: any) => (b.plays || 0) - (a.plays || 0));
        const peakHours = Array.isArray(data?.peakHours) ? data.peakHours : [];
        const peakHour = peakHours.reduce((best: number, value: number, hour: number) => value > (peakHours[best] || 0) ? hour : best, 0);
        const moviesCount = data?.jellystatInsights?.moviePlays || topMovies.reduce((sum: number, item: any) => sum + (item.plays || 0), 0);
        const showsCount = data?.jellystatInsights?.tvPlays || topShows.reduce((sum: number, item: any) => sum + (item.plays || 0), 0);
        const musicCount = data?.jellystatInsights?.musicPlays || topMusic.reduce((sum: number, item: any) => sum + (item.plays || 0), 0);
        const topMovie = topMovies[0] || null;
        const topBinge = topShows[0] || null;
        const topLibraries = Array.isArray(data?.topLibraries) ? data.topLibraries : [];

        return {
            totalPlays: data?.totalPlaybacks || data?.jellystatInsights?.totalPlays || 0,
            moviesCount,
            showsCount,
            musicCount,
            topWatched,
            recentHistory: [],
            topMovie: topMovie ? { ...topMovie, artUrl: topMovie.thumbUrl } : null,
            topBinge: topBinge ? { ...topBinge, artUrl: topBinge.thumbUrl } : null,
            peakHour,
            avgHour: peakHour,
            timeOfDay: peakHour >= 5 && peakHour < 12 ? 'Early Bird' : peakHour >= 12 && peakHour < 18 ? 'Afternoon Watcher' : peakHour >= 18 ? 'Evening Streamer' : 'Night Owl',
            popularDay: 'Recent Activity',
            dayOfWeekCounts: {},
            favoriteLibrary: topLibraries[0]?.title || 'None',
            topLibraries,
            mediaPreference: moviesCount > showsCount ? 'Movie Fan' : 'TV Binger',
            watchStyle: topWatched.length >= 10 ? 'Explorer' : 'Focused',
            uniqueTitles: topWatched.length,
            streamingHabit: 'Jellyfin Viewer',
            weekdayPlays: data?.totalPlaybacks || 0,
            weekendPlays: 0,
            libraryHealth: data?.libraryHealth || null,
        };
    };

    const handleToggleNewsletter = async () => {
        setIsLoading(true);
        try {
            const newValue = !optOutNewsletter;
            await apiFetch('/api/users/preferences', {
                method: 'POST',
                body: JSON.stringify({ optOutNewsletter: newValue })
            });
            setOptOutNewsletter(newValue);
            setToast({ id: 3, message: 'Newsletter preferences updated!', type: 'success' });
            refreshSession();
        } catch (e: any) {
            setToast({ id: 3, message: e.message || 'Failed to update preferences', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleRequestInvite = async (): Promise<boolean> => {
        setIsLoading(true);
        try {
            await apiFetch('/api/users/request-invite', { method: 'POST' });
            setToast({ id: 1, message: 'Invite requested successfully! Check your email.', type: 'success' });
            refreshSession();
            return true;
        } catch (e: any) {
            setToast({ id: 1, message: e.message || 'Failed to request invite', type: 'error' });
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    // Auto-request invite if user is totally new — retry if the first attempt fails.
    useEffect(() => {
        if (!user && !isLoading && !sessionInfo.session.isAdmin) {
            if (sessionStorage.getItem('autoInviteSucceeded') === 'true') return;
            if (sessionStorage.getItem('autoInviteRequested') === 'true') return;
            sessionStorage.setItem('autoInviteRequested', 'true');
            handleRequestInvite().then((ok) => {
                if (ok) sessionStorage.setItem('autoInviteSucceeded', 'true');
                else sessionStorage.removeItem('autoInviteRequested');
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        let cancelled = false;
        const fetchAnalytics = async () => {
            if (!sessionInfo?.session?.isAdmin && !user) {
                setAnalyticsLoading(false);
                return;
            }
            try {
                setAnalyticsLoading(true);
                setAnalyticsError(null);
                const res = isJellyfinPortal
                    ? buildJellyfinHomeAnalytics(await apiFetch(`/api/jellystat/analytics?days=${analyticsDays}`))
                    : await apiFetch(`/api/plex/analytics/me?days=${analyticsDays}`);
                if (cancelled) return;
                setAnalytics(res);
                setTopContentPage(0);
                setRecentHistoryPage(0);
            } catch (e: any) {
                if (!cancelled) {
                    const message = e?.message || 'Failed to load your analytics';
                    setAnalyticsError(message);
                    setAnalytics(null);
                    setToast({ id: Date.now(), message, type: 'error' });
                }
            } finally {
                if (!cancelled) setAnalyticsLoading(false);
            }
        };
        fetchAnalytics();
        return () => { cancelled = true; };
    }, [user, sessionInfo.session.isAdmin, analyticsDays, isJellyfinPortal]);

    useEffect(() => {
        const mq = window.matchMedia('(min-width: 1024px)');
        const onChange = (e: MediaQueryListEvent) => setIsDesktopMostWatched(e.matches);
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);

    useEffect(() => {
        if (!analytics?.topWatched?.length) return;
        const maxPage = Math.max(0, Math.ceil(analytics.topWatched.length / topWatchedPageSize) - 1);
        setTopContentPage((p) => Math.min(p, maxPage));
    }, [topWatchedPageSize, analytics?.topWatched?.length]);

    useEffect(() => {
        if (!analytics?.recentHistory?.length) return;
        const maxPage = Math.max(0, Math.ceil(analytics.recentHistory.length / recentHistoryPageSize) - 1);
        setRecentHistoryPage((p) => Math.min(p, maxPage));
    }, [recentHistoryPageSize, analytics?.recentHistory?.length]);

    useEffect(() => {
        let pollTimer: ReturnType<typeof setTimeout> | null = null;
        let dashboardTimer: ReturnType<typeof setInterval> | null = null;
        let isMounted = true;
        const DASHBOARD_REFRESH_MS = 5 * 60 * 1000;

        const fetchDashboard = async () => {
            if (!isMounted) return;
            try {
                const res = await apiFetch(`${isJellyfinPortal ? '/api/jellyfin/dashboard' : '/api/plex/dashboard'}?limit=${RECENTLY_ADDED_ITEM_LIMIT}`);
                if (isMounted) setDashboardData(res);
            } catch (e) {
                console.error('Failed to refresh dashboard data', e);
            }
        };

        const fetchServerData = async () => {
            if (!isMounted) return;
            try {
                const p1 = isJellyfinPortal
                    ? Promise.resolve({ provider: 'jellyfin' }).then(res => { if (isMounted) setServerStats(res); })
                    : apiFetch('/api/plex/stats').then(res => {
                        if (isMounted) {
                            setServerStats(res);
                            if (res?.isBuilding) {
                                pollTimer = setTimeout(fetchServerData, 5000);
                            }
                        }
                    }).catch(e => console.error("Failed to fetch server stats", e));

                const p2 = fetchDashboard();
                await Promise.all([p1, p2]);
            } finally {
                if (isMounted) setServerDataLoading(false);
            }
        };
        fetchServerData();
        dashboardTimer = setInterval(fetchDashboard, DASHBOARD_REFRESH_MS);
        return () => {
            isMounted = false;
            if (pollTimer) clearTimeout(pollTimer);
            if (dashboardTimer) clearInterval(dashboardTimer);
        };
    }, [isJellyfinPortal]);

    useEffect(() => {
        if (!isJellyfinPortal || !analytics?.libraryHealth) return;
        setServerStats((current: any) => ({
            ...(current || {}),
            provider: 'jellyfin',
            ...analytics.libraryHealth,
        }));
    }, [isJellyfinPortal, analytics?.libraryHealth]);

    const handleRelink = async () => {
        setIsLoading(true);
        try {
            await apiFetch('/api/users/relink', { method: 'POST' });
            setToast({ id: 2, message: 'Account re-linked! Check your email for the invite.', type: 'success' });
            refreshSession();
        } catch (e: any) {
            setToast({ id: 2, message: e.message || 'Failed to re-link account', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const daysLeft = user?.expiryDate ? getDaysUntilExpiry(user.expiryDate) : null;
    const progressPct = getAccessProgressPct(user?.expiryDate || null, user?.joiningDate || null);
    const isExpiringSoon = daysLeft !== null && daysLeft <= 7;
    const isRevoked = user?.plexAccessStatus === 'revoked';
    const isPending = user?.plexAccessStatus?.toLowerCase() === 'pending';

    const heroBgRaw = analytics?.recentHistory?.[0]?.thumbUrl || publicConfig?.customLogoUrl || '';
    const heroBg = heroBgRaw
        ? (heroBgRaw.startsWith('http') ? heroBgRaw : resolvePortalAssetUrl(heroBgRaw))
        : '';

    const wrapUpDaysOptions = [
        { value: 7, label: 'Last 7 Days' },
        { value: 30, label: 'Last 30 Days' },
        { value: 60, label: 'Last 60 Days' },
        { value: 90, label: 'Last 90 Days' },
        { value: 180, label: 'Last 180 Days' },
        { value: 'all', label: 'All Time' },
    ];

    const layoutCtx = useMemo(() => ({
        isAdmin: !!sessionInfo.session.isAdmin,
        hasUser: !!user,
        referralEnabled: !!publicConfig?.referralEnabled,
    }), [sessionInfo.session.isAdmin, user, publicConfig?.referralEnabled]);

    const widgetDeps = useMemo(() => ({
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
        showQualityBadges,
        dashboardData,
        handleRelink,
        handleToggleNewsletter,
        onViewAdmin,
        onViewSettings,
        onViewLogs,
        setToast,
        DiscoverPosterCard,
        RebuildLibraryCacheButton,
    }), [
        sessionInfo, publicConfig, user, isRevoked, isExpiringSoon, daysLeft, progressPct, optOutNewsletter,
        serverStats, serverDataLoading, analytics, analyticsLoading, analyticsDays, analyticsDaysOpen,
        showQualityBadges, dashboardData, onViewAdmin, onViewSettings, onViewLogs,
    ]);

    const renderMainGridWidget = useMemo(() => createMainGridWidgetRenderer(widgetDeps), [widgetDeps]);
    const renderRecentlyAddedWidget = useMemo(() => createRecentlyAddedWidgetRenderer(widgetDeps), [widgetDeps]);

    return (
        <div className="w-full flex flex-col gap-3 md:gap-4">
            <Loader isLoading={isLoading} />
            {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

            {/* Massive Hero Banner */}
            <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl bg-card border border-border">
                {/* Blurred Background */}
                <div className="absolute inset-0 bg-background overflow-hidden">
                    {dashboardData?.recentMovies?.length > 0 ? (
                        <div className="absolute -inset-[50%] opacity-40 transform -rotate-12 scale-110 flex gap-4 overflow-hidden pointer-events-none justify-center">
                            {[...Array(6)].map((_, colIdx) => (
                                <div key={colIdx} className={`flex flex-col gap-4 ${colIdx % 2 === 0 ? 'animate-[scrollVertical_40s_linear_infinite]' : 'animate-[scrollVertical_50s_linear_infinite_reverse]'}`}>
                                    {[...dashboardData.recentMovies, ...dashboardData.recentMovies].sort(() => 0.5 - Math.random()).map((m: any, i: number) => (m.thumb || m.thumbUrl) && (
                                        <img key={`c${colIdx}-${i}`} src={m.thumbUrl ? resolvePortalAssetUrl(m.thumbUrl) : portalUrl(`/api/plex/image?path=${encodeURIComponent(m.thumb)}&width=200&height=300`)} className="w-32 md:w-48 rounded-xl object-cover" alt="" />
                                    ))}
                                </div>
                            ))}
                        </div>
                    ) : heroBg && (
                        <div
                            className="absolute inset-0 bg-cover bg-center opacity-30 blur-2xl scale-110"
                            style={{ backgroundImage: `url(${heroBg})` }}
                        />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-card/80 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-card via-card/40 to-transparent" />
                </div>

                <div className="relative pt-14 pb-5 px-4 md:pt-20 md:pb-6 md:px-10 flex flex-col items-center md:items-start text-center md:text-left z-10">
                    <div className="flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-6">
                        {/* Avatar */}
                        {(() => {
                            const thumbUrl = user?.thumb || sessionInfo.session.thumb || (sessionInfo.session.isAdmin ? sessionInfo.adminThumb : null);
                            if (thumbUrl) {
                                return (
                                    <div className="relative">
                                        <img
                                            src={resolveHomeImage(thumbUrl)}
                                            alt={sessionInfo.session.username}
                                            className="relative w-28 h-28 md:w-32 md:h-32 rounded-full object-cover border-4 border-plex shadow-2xl bg-card"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                                (e.target as HTMLImageElement).nextElementSibling?.classList.add('flex');
                                            }}
                                        />
                                        <div className={`hidden relative w-28 h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-plex/40 to-plex/10 border-4 border-plex items-center justify-center text-plex font-black text-5xl shadow-2xl overflow-hidden`}>
                                            {sessionInfo.session.username?.[0]?.toUpperCase() || '?'}
                                        </div>
                                    </div>
                                );
                            }
                            return (
                                <div className="relative">
                                    <div className={`relative w-28 h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-plex/40 to-plex/10 border-4 border-plex items-center justify-center text-plex font-black text-5xl flex shadow-2xl overflow-hidden`}>
                                        {sessionInfo.session.username?.[0]?.toUpperCase() || '?'}
                                    </div>
                                </div>
                            );
                        })()}

                        <div className="pb-2">
                            <p className="text-plex text-sm uppercase tracking-[4px] font-bold mb-1 drop-shadow-md">Welcome Back</p>
                            <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 leading-tight drop-shadow-lg" style={{ fontSize: 'clamp(1.6rem, 8vw, 3rem)', wordBreak: 'break-word' }}>
                                {sessionInfo.session.username}
                            </h1>
                            {sessionInfo.session.isAdmin && (
                                <span className="inline-block mt-3 px-3 py-1 rounded-full text-[10px] font-black bg-plex/20 text-plex border border-plex/40 uppercase tracking-widest">Server Admin</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {selectedMetric && analytics && (
                <WrapUpModal metric={selectedMetric} analytics={analytics} days={analyticsDays} onClose={() => setSelectedMetric(null)} />
            )}
            {shareWrapUpOpen && analytics && (
                <ShareWrapUpModal
                    analytics={analytics}
                    days={analyticsDays}
                    serverName={sessionInfo?.serverName || 'Server Portal'}
                    username={sessionInfo?.session?.username || user?.username}
                    onClose={() => setShareWrapUpOpen(false)}
                    onToast={(message, type) => setToast({ id: Date.now(), message, type })}
                />
            )}

            <UserDashboardLayout
                layoutConfig={publicConfig?.dashboardLayout}
                layoutCtx={layoutCtx}
                renderMainGridWidget={renderMainGridWidget}
                renderRecentlyAddedWidget={renderRecentlyAddedWidget}
                recentlyAddedLoading={serverDataLoading}
                hasDashboardData={!!dashboardData}
                renderRecentlyAddedSkeleton={() => <HomeRecentlyAddedSkeleton />}
                renderWrapUp={() => (
                    <>
                        {/* Personal Wrap-Up */}
                        {(sessionInfo.session.isAdmin || user) && analyticsLoading && (
                            <WrapUpCardsSkeleton />
                        )}
                        {(sessionInfo.session.isAdmin || user) && !analyticsLoading && analyticsError && (
                            <div className="glass-card p-4 md:p-5 shadow-xl border border-red-500/30 bg-red-500/5">
                                <p className="text-red-300 text-sm font-medium">{analyticsError}</p>
                            </div>
                        )}
                        {(sessionInfo.session.isAdmin || user) && !analyticsLoading && analytics && (
                            <div className="glass-card p-4 md:p-5 shadow-xl">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 md:mb-4">
                                    <h3 className="text-xl font-bold text-text">Your Personal Wrap-Up</h3>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setShareWrapUpOpen(true)}
                                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-plex/10 border border-plex/30 text-plex hover:bg-plex/20 transition-colors shadow-sm"
                                        >
                                            <Share2 className="w-4 h-4 flex-shrink-0" />
                                            Share
                                        </button>
                                        <PeriodDropdown
                                            value={analyticsDays}
                                            open={wrapUpDaysOpen}
                                            onToggle={() => setWrapUpDaysOpen(!wrapUpDaysOpen)}
                                            onClose={() => setWrapUpDaysOpen(false)}
                                            onChange={(value) => setAnalyticsDays(value as number | 'all')}
                                            options={wrapUpDaysOptions}
                                            buttonClassName="flex items-center gap-2 bg-background border border-border/50 rounded-lg px-3 py-1.5 text-sm font-medium text-text focus:outline-none hover:border-plex/50 transition-colors cursor-pointer shadow-sm"
                                        />
                                    </div>
                                </div>
                                <WrapUpCardGrid analytics={analytics} interactive onCardClick={setSelectedMetric} minCardHeight={112} />
                            </div>
                        )}
                    </>
                )}
                renderWatchRow={() => (
                    <>
                        {/* Recently Watched + Most Watched */}
                        {(sessionInfo.session.isAdmin || user) && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4 items-stretch">
                                {!analyticsLoading && analytics?.recentHistory && analytics.recentHistory.length > 0 && (
                                    <div className="lg:col-span-1 flex min-h-0">
                                        <div className="glass-card p-4 md:p-5 shadow-xl flex flex-col h-full w-full min-h-0">
                                            <div className="flex items-center justify-between mb-3 md:mb-4 flex-shrink-0">
                                                <h3 className="text-lg md:text-xl font-bold text-text">Recently Watched</h3>
                                                {analytics.recentHistory.length > recentHistoryPageSize && (
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => setRecentHistoryPage(p => Math.max(0, p - 1))}
                                                            disabled={recentHistoryPage === 0}
                                                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-text"
                                                        >
                                                            <ChevronUp className="w-4 h-4 -rotate-90" />
                                                        </button>
                                                        <span className="text-xs text-muted font-medium w-8 text-center">
                                                            {recentHistoryPage + 1} / {Math.ceil(analytics.recentHistory.length / recentHistoryPageSize)}
                                                        </span>
                                                        <button
                                                            onClick={() => setRecentHistoryPage(p => Math.min(Math.ceil(analytics.recentHistory.length / recentHistoryPageSize) - 1, p + 1))}
                                                            disabled={recentHistoryPage >= Math.ceil(analytics.recentHistory.length / recentHistoryPageSize) - 1}
                                                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-text"
                                                        >
                                                            <ChevronDown className="w-4 h-4 -rotate-90" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-stretch flex-1 min-h-0 content-start">
                                                {analytics.recentHistory.slice(recentHistoryPage * recentHistoryPageSize, (recentHistoryPage + 1) * recentHistoryPageSize).map((item: any, idx: number) => (
                                                    <div key={idx} className="flex items-center self-stretch gap-3 p-2 bg-black/20 rounded-xl border border-white/5 hover:border-plex/50 hover:bg-black/40 hover:shadow-[0_0_15px_rgba(229,160,13,0.15)] transition-all group relative">
                                                        <a href={item.plexUrl} target="_blank" rel="noreferrer" className="flex items-center flex-1 min-w-0 gap-3">
                                                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-background flex-shrink-0 shadow-md">
                                                                {item.thumbUrl ? (
                                                                    <img src={resolvePortalAssetUrl(item.thumbUrl)} alt={item.title} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center">
                                                                        <PlaySquare className="w-5 h-5 text-muted/50" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className="font-bold text-text text-sm truncate group-hover:text-plex transition-colors">{item.title}</h4>
                                                                {item.episodeTitle && <p className="text-xs text-muted truncate mt-0.5">{item.episodeTitle}</p>}
                                                                <div className="flex items-center gap-1 mt-1">
                                                                    <Clock className="w-3 h-3 text-muted" />
                                                                    <p className="text-[10px] text-muted">{new Date(item.viewedAt * 1000).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</p>
                                                                </div>
                                                            </div>
                                                        </a>
                                                        <button
                                                            onClick={(e) => { e.preventDefault(); setReportItem(item); }}
                                                            className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-2 text-muted hover:text-red-400 hover:bg-red-400/10 rounded-full transition-all focus:outline-none"
                                                            title="Report a playback issue"
                                                        >
                                                            <AlertTriangle className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {analyticsLoading ? (
                                    <div className="lg:col-span-2 lg:col-start-2 flex min-h-0">
                                        <TopWatchedGridSkeleton />
                                    </div>
                                ) : analytics && analytics.totalPlays > 0 && analytics.topWatched && analytics.topWatched.length > 0 ? (
                                    <div className={`flex min-h-0 ${analytics.recentHistory?.length ? 'lg:col-span-2' : 'lg:col-span-2 lg:col-start-2'}`}>
                                        <div className="glass-card p-4 md:p-5 shadow-xl flex flex-col h-full w-full min-h-0">
                                            <div className="flex items-center justify-between mb-3 md:mb-4 flex-shrink-0">
                                                <div>
                                                    <h3 className="text-lg md:text-xl font-bold text-text mb-0.5">Your Most Watched</h3>
                                                    <p className="text-muted text-sm">Based on your {analytics.totalPlays} total plays</p>
                                                </div>
                                                {analytics.topWatched.length > topWatchedPageSize && (
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => setTopContentPage(p => Math.max(0, p - 1))}
                                                            disabled={topContentPage === 0}
                                                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-text"
                                                        >
                                                            <ChevronUp className="w-4 h-4 -rotate-90" />
                                                        </button>
                                                        <span className="text-xs text-muted font-medium w-8 text-center">
                                                            {topContentPage + 1} / {Math.ceil(analytics.topWatched.length / topWatchedPageSize)}
                                                        </span>
                                                        <button
                                                            onClick={() => setTopContentPage(p => Math.min(Math.ceil(analytics.topWatched.length / topWatchedPageSize) - 1, p + 1))}
                                                            disabled={topContentPage >= Math.ceil(analytics.topWatched.length / topWatchedPageSize) - 1}
                                                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-text"
                                                        >
                                                            <ChevronDown className="w-4 h-4 -rotate-90" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 md:gap-3.5 flex-1 min-h-0 content-start">
                                                {analytics.topWatched.slice(topContentPage * topWatchedPageSize, (topContentPage + 1) * topWatchedPageSize).map((item: any) => (
                                                    <a key={item.key} href={item.plexUrl} target="_blank" rel="noreferrer" className="group flex flex-col gap-1.5">
                                                        <div className="relative rounded-lg overflow-hidden aspect-[2/3] bg-background border border-white/5 transition-[box-shadow,border-color] duration-300 group-hover:shadow-xl group-hover:border-plex/50">
                                                            {item.thumbUrl ? (
                                                                <img src={resolvePortalAssetUrl(item.thumbUrl)} alt={item.title} className="w-full h-full object-cover transition-[transform,opacity] duration-300 group-hover:scale-105 group-hover:opacity-80" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center p-4 text-center bg-white/5">
                                                                    <span className="text-xs font-bold text-muted line-clamp-3">{item.title}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col px-0.5">
                                                            <p className="text-xs sm:text-sm font-bold text-text truncate group-hover:text-plex transition-colors">{item.title}</p>
                                                            <p className="text-[10px] sm:text-xs text-plex font-black mt-0.5 uppercase tracking-wider">{item.plays} plays</p>
                                                        </div>
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        )}
                    </>
                )}
            />

            {reportItem && (
                <ReportIssueModal item={reportItem} onClose={() => setReportItem(null)} />
            )}
        </div>
    );
};

const ServiceCustomSelect = ({ value, onChange, options }: { value: string, onChange: (val: string) => void, options: { id: string, name: string }[] }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selected = options.find(o => o.id === value);

    return (
        <div className="relative flex-1 md:flex-none md:w-64">
            <button
                type="button"
                className="w-full bg-black/20 border border-border hover:border-white/20 rounded-lg px-4 py-2.5 text-text outline-none flex items-center justify-between transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="truncate">{selected ? selected.name : '-- Choose a service --'}</span>
                <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1f2e] border border-border rounded-lg shadow-2xl z-50 overflow-hidden max-h-60 overflow-y-auto">
                        {options.map(option => (
                            <button
                                key={option.id}
                                className={`w-full text-left px-4 py-3 text-sm hover:bg-white/10 transition-colors ${value === option.id ? 'bg-plex/10 text-plex font-bold' : 'text-text'}`}
                                onClick={() => {
                                    onChange(option.id);
                                    setIsOpen(false);
                                }}
                            >
                                {option.name}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export const StatusDashboard: React.FC<{ onBack: () => void, isAdmin: boolean, isPublic?: boolean }> = ({ onBack, isAdmin, isPublic }) => {
    const [statusData, setStatusData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'analytics'>('overview');
    const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

    const fetchStatus = useCallback(async () => {
        try {
            const data = await apiFetch('/api/status');
            setStatusData(data);
            setHasError(false);
        } catch (e) {
            console.error(e);
            setHasError(true);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 15000);
        return () => clearInterval(interval);
    }, [fetchStatus]);

    useEffect(() => {
        if (statusData && !selectedServiceId) {
            const services = statusData.config?.services || [];
            if (services.length > 0) {
                setSelectedServiceId(services[0].id);
            }
        }
    }, [statusData, selectedServiceId]);

    if (isLoading || !statusData) {
        return (
            <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center">
                <header className="flex items-center gap-4 w-full mb-8 pb-4 border-b border-border">
                    {isPublic && (
                        <button onClick={onBack} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors flex items-center justify-center text-muted hover:text-text">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        </button>
                    )}
                    <h2 className="text-2xl font-bold text-text">Server Status</h2>
                </header>
                {!isLoading && hasError ? (
                    <div className="w-full bg-red-500/10 border border-red-500 text-red-400 p-6 rounded-xl flex flex-col items-center gap-3 mt-4">
                        <AlertCircle className="w-8 h-8" />
                        <p className="font-semibold">Failed to load server status.</p>
                        <button onClick={() => { setIsLoading(true); fetchStatus(); }} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-text text-sm font-medium transition-colors">Retry</button>
                    </div>
                ) : (
                    <Loader isLoading={true} />
                )}
            </div>
        );
    }

    const { config, healthData } = statusData;
    const services = config?.services || [];
    const groups = config?.groups || [];

    return (
        <div className="w-full flex flex-col">
            <header className="flex items-center gap-4 w-full mb-8 pb-4 border-b border-border">
                {isPublic && (
                    <button onClick={onBack} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors flex items-center justify-center text-muted hover:text-text">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </button>
                )}
                <h2 className="text-2xl font-bold text-text">Server Status</h2>
            </header>

            <div className="flex flex-wrap gap-2 mb-8 p-1.5 bg-black/20 rounded-xl border border-border w-fit mx-auto md:mx-0">
                {[
                    { id: 'overview', label: 'Overview' },
                    { id: 'history', label: 'Detailed History' },
                    { id: 'analytics', label: 'Analytics' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-5 py-2.5 rounded-lg font-bold text-sm transition-all duration-200 cursor-pointer border-none outline-none ${activeTab === tab.id
                            ? 'bg-plex text-background shadow-md'
                            : 'bg-transparent text-muted hover:text-text hover:bg-white/5'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <main className="user-content">
                {activeTab === 'overview' && (
                    <>
                        {config.announcement && config.announcement.enabled && (
                            <div className="status-announcement">
                                {config.announcement.message}
                            </div>
                        )}

                        {groups.length === 0 && (
                            <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-border rounded-xl bg-card my-8">
                                <Activity className="w-12 h-12 text-muted mb-4 opacity-50" />
                                <h3 className="text-xl font-bold text-text mb-2">No Services Monitored</h3>
                                <p className="text-muted max-w-md">
                                    The status page is currently blank because no services have been configured yet.
                                    {isAdmin ? (
                                        <>
                                            <br /><br />
                                            You can add status monitors by going to <strong className="text-text">Settings &gt; Status Page</strong> and adding your services and groups.
                                        </>
                                    ) : (
                                        <>
                                            <br /><br />
                                            The server administrator hasn't added any services to monitor yet. Check back later!
                                        </>
                                    )}
                                </p>
                            </div>
                        )}

                        {groups.map((group: any) => {
                            const groupServices = services.filter((s: any) => s.groupId === group.id);
                            if (groupServices.length === 0) return null;
                            return (
                                <div key={group.id} className="mb-8">
                                    <h3 className="text-lg font-bold text-muted uppercase tracking-[2px] mb-6 border-b border-white/10 pb-2">{group.name}</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {groupServices.map((service: any) => {
                                            const health = healthData[service.id] || { currentStatus: 'unknown', uptimePercentage: 100, dailyHistory: {} };
                                            return (
                                                <div key={service.id} className="bg-card rounded-xl p-4 md:p-6 border border-white/5 shadow-lg flex flex-col gap-4">
                                                    <div className="flex justify-between items-start mb-2 gap-4">
                                                        <h4 className="font-bold text-text text-lg">{service.name}</h4>
                                                        <span className={`px-3 py-1 rounded-full text-[0.65rem] uppercase tracking-wider font-bold border flex items-center gap-1.5 shadow-lg ${health.currentStatus === 'online' ? 'bg-status-active/10 text-status-active border-status-active/30 shadow-[0_0_10px_rgba(35,134,54,0.3)]' : health.currentStatus === 'offline' ? 'bg-status-expired/10 text-[#D32F2F] border-[#D32F2F]/30 shadow-[0_0_10px_rgba(211,47,47,0.3)] animate-pulse' : 'bg-status-expiring/10 text-status-expiring border-status-expiring/30 shadow-[0_0_10px_rgba(210,153,34,0.3)]'}`}>
                                                            {health.currentStatus.toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div className="text-sm text-muted font-medium">
                                                        <span>Uptime: {health.uptimePercentage}%</span>
                                                    </div>
                                                    <div className="flex gap-[2px] h-12 mt-auto items-end pt-4 group/bars relative">
                                                        {Array.from({ length: 90 }).map((_, i) => {
                                                            const d = new Date();
                                                            d.setDate(d.getDate() - (89 - i));
                                                            const dateStr = d.toISOString().split('T')[0];
                                                            const stat = health.dailyHistory?.[dateStr];

                                                            let barClass = 'unknown';
                                                            let title = `${dateStr}: No data`;
                                                            let hClass = 'h-1/5';

                                                            if (stat && stat.total > 0) {
                                                                const pct = (stat.up / stat.total) * 100;
                                                                title = `${dateStr}: ${pct.toFixed(1)}% uptime`;
                                                                if (pct >= 99) { barClass = 'online'; hClass = 'h-full'; }
                                                                else if (pct >= 90) { barClass = 'degraded'; hClass = 'h-2/3'; }
                                                                else { barClass = 'offline'; hClass = 'h-1/3'; }
                                                            }

                                                            return (
                                                                <div
                                                                    key={i}
                                                                    className={`flex-1 rounded-sm transition-all duration-300 hover:opacity-100 opacity-60 hover:opacity-100 cursor-pointer ${barClass === 'online' ? 'bg-status-active hover:shadow-[0_0_8px_rgba(35,134,54,0.6)]' : barClass === 'offline' ? 'bg-status-expired hover:shadow-[0_0_8px_rgba(218,54,51,0.6)]' : barClass === 'degraded' ? 'bg-status-expiring hover:shadow-[0_0_8px_rgba(210,153,34,0.6)]' : 'bg-border'} ${hClass}`}
                                                                    title={title}
                                                                />
                                                            );
                                                        })}
                                                    </div>
                                                    <div className="flex justify-between text-[10px] text-muted font-bold tracking-wider mt-1 opacity-50">
                                                        <span>90 DAYS AGO</span>
                                                        <span className="text-center flex-1">{health.uptimePercentage}%</span>
                                                        <span>TODAY</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </>
                )}

                {activeTab === 'history' && (
                    <div className="flex flex-col gap-6 animate-fade-in">
                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                            <label className="font-bold text-muted uppercase tracking-widest text-sm">Select Service</label>
                            <ServiceCustomSelect
                                value={selectedServiceId || ''}
                                onChange={setSelectedServiceId}
                                options={services.map((s: any) => ({ id: s.id, name: s.name }))}
                            />
                        </div>
                        {selectedServiceId && (
                            <div className="bg-card border border-white/5 shadow-2xl rounded-2xl overflow-hidden mt-4">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-black/40 border-b border-border text-muted text-xs uppercase tracking-wider">
                                            <tr>
                                                <th className="px-6 py-4 font-bold whitespace-nowrap">Date</th>
                                                <th className="px-6 py-4 font-bold whitespace-nowrap">Uptime %</th>
                                                <th className="px-6 py-4 font-bold whitespace-nowrap">Checks (Up / Total)</th>
                                                <th className="px-6 py-4 font-bold text-right whitespace-nowrap">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/50">
                                            {Object.entries(healthData[selectedServiceId]?.dailyHistory || {})
                                                .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
                                                .map(([dateStr, stat]: [string, any]) => {
                                                    const pct = stat.total > 0 ? (stat.up / stat.total) * 100 : 0;
                                                    return (
                                                        <tr key={dateStr} className="hover:bg-white/5 transition-colors">
                                                            <td className="px-6 py-4 font-medium whitespace-nowrap text-text">{dateStr}</td>
                                                            <td className="px-6 py-4 font-mono whitespace-nowrap text-muted">{pct.toFixed(2)}%</td>
                                                            <td className="px-6 py-4 text-muted text-sm whitespace-nowrap">{stat.up} / {stat.total} checks</td>
                                                            <td className="px-6 py-4 text-right whitespace-nowrap">
                                                                <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest border ${pct >= 99 ? 'bg-status-active/10 text-status-active border-status-active/30' : pct >= 90 ? 'bg-status-expiring/10 text-status-expiring border-status-expiring/30' : 'bg-status-expired/10 text-status-expired border-status-expired/30'}`}>
                                                                    {pct >= 99 ? 'Healthy' : pct >= 90 ? 'Degraded' : 'Outage'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'analytics' && (
                    <div className="flex flex-col gap-6 animate-fade-in">
                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                            <label className="font-bold text-muted uppercase tracking-widest text-sm">Select Service</label>
                            <ServiceCustomSelect
                                value={selectedServiceId || ''}
                                onChange={setSelectedServiceId}
                                options={services.map((s: any) => ({ id: s.id, name: s.name }))}
                            />
                        </div>
                        {selectedServiceId && (
                            <div className="bg-card border border-white/5 shadow-2xl rounded-2xl p-6 md:p-10 mt-4">
                                <h3 className="text-xl font-bold mb-10 text-center text-muted tracking-widest uppercase">90-Day Uptime Trend</h3>
                                <div className="relative h-64 md:h-80 flex items-end gap-1 w-full pl-12 pr-4 md:pr-8">
                                    {/* Grid lines */}
                                    <div className="absolute inset-0 pl-12 pr-4 md:pr-8 flex flex-col justify-between pointer-events-none pb-8">
                                        <div className="w-full border-t border-white/5 h-0 relative">
                                            <span className="absolute -left-12 -top-2.5 text-xs font-mono text-muted/50 w-10 text-right">100%</span>
                                        </div>
                                        <div className="w-full border-t border-white/5 h-0 relative">
                                            <span className="absolute -left-12 -top-2.5 text-xs font-mono text-muted/50 w-10 text-right">75%</span>
                                        </div>
                                        <div className="w-full border-t border-white/5 h-0 relative">
                                            <span className="absolute -left-12 -top-2.5 text-xs font-mono text-muted/50 w-10 text-right">50%</span>
                                        </div>
                                        <div className="w-full border-t border-white/5 h-0 relative">
                                            <span className="absolute -left-12 -top-2.5 text-xs font-mono text-muted/50 w-10 text-right">25%</span>
                                        </div>
                                        <div className="w-full border-t border-white/20 h-0 relative">
                                            <span className="absolute -left-12 -top-2.5 text-xs font-mono text-muted/50 w-10 text-right">0%</span>
                                        </div>
                                    </div>

                                    {/* Bars */}
                                    <div className="w-full h-full flex items-end gap-[2px] pb-8 z-10">
                                        {Array.from({ length: 90 }).map((_, i) => {
                                            const d = new Date();
                                            d.setDate(d.getDate() - (89 - i));
                                            const dateStr = d.toISOString().split('T')[0];
                                            const stat = healthData[selectedServiceId]?.dailyHistory?.[dateStr];
                                            const pct = stat && stat.total > 0 ? (stat.up / stat.total) * 100 : 0;

                                            return (
                                                <div
                                                    key={i}
                                                    className="flex-1 flex flex-col justify-end h-full relative group/chart cursor-crosshair"
                                                >
                                                    <div
                                                        className={`w-full rounded-t-sm transition-all duration-300 opacity-80 group-hover/chart:opacity-100 ${pct >= 99 ? 'bg-status-active' : pct >= 90 ? 'bg-status-expiring' : stat && stat.total > 0 ? 'bg-status-expired' : 'bg-white/10'}`}
                                                        style={{ height: `${Math.max(1, pct)}%` }}
                                                    />
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-3 bg-card border border-border shadow-2xl text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover/chart:opacity-100 pointer-events-none transition-opacity z-50 flex flex-col items-center">
                                                        <strong className="text-plex mb-1 tracking-wider uppercase text-[10px]">{dateStr}</strong>
                                                        <span className="text-lg font-mono font-bold">{stat && stat.total > 0 ? `${pct.toFixed(2)}%` : 'No data'}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="flex justify-between text-[10px] text-muted font-bold tracking-widest mt-2 px-12 uppercase">
                                    <span>90 days ago</span>
                                    <span>Today</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};
const StreamDetailsModal: React.FC<{ session: any, onClose: () => void, isAdmin?: boolean, onKilled?: () => void, providerLabel?: string }> = ({ session, onClose, isAdmin, onKilled, providerLabel = 'Plex' }) => {
    const [killReason, setKillReason] = useState('');
    const [isKilling, setIsKilling] = useState(false);
    const [showKillConfirm, setShowKillConfirm] = useState(false);
    const sessionPosterSrc = session.thumbUrl
        ? resolvePortalAssetUrl(session.thumbUrl)
        : portalUrl(`/api/plex/image?path=${encodeURIComponent(session.thumb)}&width=400&height=600`);
    const sessionUserThumbSrc = session.userThumb ? resolvePortalAssetUrl(session.userThumb) : 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';

    const handleKill = async () => {
        setIsKilling(true);
        try {
            const res = await apiFetch('/api/streams/kill', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: session.sessionId, reason: killReason })
            });
            if (res.error) {
                alert(res.error);
            } else {
                onClose();
                if (onKilled) onKilled();
            }
        } catch (e: any) {
            alert('Failed to kill stream');
        } finally {
            setIsKilling(false);
        }
    };
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-card w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl relative flex flex-col md:flex-row" onClick={e => e.stopPropagation()}>
                {/* Poster Side */}
                <div className="w-full md:w-1/3 relative bg-black flex-shrink-0">
                    <div className="w-full pb-[150%] md:pb-0 md:h-full relative">
                        <img src={sessionPosterSrc} alt={session.title} className="absolute inset-0 w-full h-full object-cover opacity-80" />
                        <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent md:bg-gradient-to-r"></div>
                    </div>
                    {/* User Avatar Badge */}
                    {session.user && (
                        <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-md rounded-full pr-4 p-1.5 shadow-lg border border-white/10 z-10">
                            <img src={sessionUserThumbSrc} className="w-8 h-8 rounded-full object-cover" onError={(e) => { e.currentTarget.src = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'; }} />
                            <span className="text-xs font-bold text-white truncate max-w-[120px]">{session.user}</span>
                        </div>
                    )}
                </div>

                {/* Details Side */}
                <div className="p-6 md:p-8 flex flex-col flex-grow relative">
                    <button onClick={onClose} className="absolute top-4 right-4 text-muted hover:text-white transition-colors bg-white/5 rounded-full p-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>

                    <h2 className="text-2xl font-bold text-text leading-tight mb-1 pr-10">{session.grandparentTitle || session.title}</h2>
                    <p className="text-base text-muted mb-4">{session.grandparentTitle ? session.title : ''} {session.type === 'episode' && session.season !== undefined ? `| S${String(session.season).padStart(2, '0')}E${String(session.episode).padStart(2, '0')}` : ''}</p>

                    <div className="flex flex-wrap gap-2 mb-6">
                        {session.resolution && <span className="bg-white/10 text-white/90 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide border border-white/10">{session.resolution.includes('p') || session.resolution.includes('k') ? session.resolution : `${session.resolution}p`}</span>}
                        <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide border ${session.sessionLocation === 'lan' ? 'bg-status-active/20 text-status-active border-status-active/30' : 'bg-plex/20 text-plex border-plex/30'}`}>{session.sessionLocation === 'lan' ? 'Local' : 'Remote'}</span>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide border ${session.isTranscoding ? 'bg-status-expiring/20 text-status-expiring border-status-expiring/30' : 'bg-status-active/20 text-status-active border-status-active/30'}`}>{session.isTranscoding ? 'Transcode' : 'Direct Play'}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-8">
                        <div>
                            <p className="text-[10px] text-muted uppercase tracking-widest font-bold mb-1">Player</p>
                            <p className="text-sm font-medium truncate" title={session.playerTitle}>{session.playerTitle}</p>
                            <p className="text-xs text-muted/80 truncate" title={session.playerProduct}>{session.playerProduct}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-muted uppercase tracking-widest font-bold mb-1">Network</p>
                            <p className="text-sm font-medium">{session.playerAddress}</p>
                            <p className="text-xs text-muted/80">{(session.bandwidth / 1000).toFixed(1)} Mbps</p>
                        </div>

                        <div>
                            <p className="text-[10px] text-muted uppercase tracking-widest font-bold mb-1">Video</p>
                            <p className="text-sm font-medium uppercase">{session.videoCodec || 'Unknown'} {session.videoProfile ? `(${session.videoProfile})` : ''}</p>
                            {session.transcodeVideoDecision === 'transcode' && <p className="text-[10px] text-status-expiring font-bold">Transcoding</p>}
                        </div>
                        <div>
                            <p className="text-[10px] text-muted uppercase tracking-widest font-bold mb-1">Audio</p>
                            <p className="text-sm font-medium uppercase">{session.audioCodec || 'Unknown'} {session.audioChannels ? `(${session.audioChannels}ch)` : ''}</p>
                            {session.transcodeAudioDecision === 'transcode' && <p className="text-[10px] text-status-expiring font-bold">Transcoding</p>}
                        </div>
                    </div>

                    <div className="mt-auto flex flex-col gap-3 pt-4 border-t border-white/5">
                        {isAdmin && session.sessionId && (
                            showKillConfirm ? (
                                <div className="flex flex-col gap-2 bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
                                    <input type="text" placeholder="Reason (Optional)" value={killReason} onChange={e => setKillReason(e.target.value)} className="w-full bg-black/30 border border-red-500/30 rounded px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-red-500" />
                                    <div className="flex gap-2">
                                        <button onClick={handleKill} disabled={isKilling} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 rounded transition-colors text-sm">
                                            {isKilling ? 'Killing...' : 'Confirm Kill'}
                                        </button>
                                        <button onClick={() => setShowKillConfirm(false)} className="px-4 bg-white/10 hover:bg-white/20 text-white font-bold py-2 rounded transition-colors text-sm">
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button onClick={() => setShowKillConfirm(true)} className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 font-bold py-2.5 rounded-lg transition-colors text-sm flex items-center justify-center gap-2">
                                    <X className="w-4 h-4" /> Terminate Stream
                                </button>
                            )
                        )}
                        <a href={session.plexUrl} target="_blank" rel="noreferrer" className="flex-1 bg-plex text-background font-bold text-center py-3 rounded-lg hover:bg-plex-hover transition-colors shadow-lg">
                            Open in {providerLabel}
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const LibraryDashboard: React.FC<{ onBack: () => void, isAdmin?: boolean, publicConfig?: any, mediaServerType?: string }> = ({ onBack, isAdmin, publicConfig, mediaServerType }) => {
    const [dashboardData, setDashboardData] = useState<{ activeSessions: any[], recentMovies: any[], recentShows: any[], recentMusic: any[] } | null>(null);
    const [trendingStats, setTrendingStats] = useState<{ trending7Days: any[], movies30Days: any[], shows30Days: any[], top365Days: any[], allTime: any[], weekendWarriors: any[], nightOwls: any[], retroHits: any[], cultClassics: any[] } | null>(null);
    const [dashboardLoading, setDashboardLoading] = useState(true);
    const [trendingLoading, setTrendingLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pollError, setPollError] = useState<string | null>(null);
    const isWidePortalLayout = usePortalWideContentLayout();
    const [isDiscoverDesktop, setIsDiscoverDesktop] = useState(
        () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches
    );
    const [recentLimitOverride, setRecentLimitOverride] = useState<number | null>(() => {
        const saved = localStorage.getItem('discoverRecentLimitOverride');
        return saved ? Number(saved) : null;
    });
    const responsiveRecentLimit = isDiscoverDesktop ? DISCOVER_DESKTOP_ITEM_LIMIT : DISCOVER_MOBILE_ITEM_LIMIT;
    const recentLimit = recentLimitOverride ?? responsiveRecentLimit;
    const [selectedSession, setSelectedSession] = useState<any | null>(null);
    const showQualityBadges = publicConfig?.showPosterQualityBadges !== false;
    const isJellyfinPortal = String(publicConfig?.mediaServerType || mediaServerType || 'plex').toLowerCase() === 'jellyfin';
    const hasLoadedDashboard = useRef(false);
    const hasLoadedTrending = useRef(false);

    useEffect(() => {
        const mq = window.matchMedia('(min-width: 1024px)');
        const onChange = (e: MediaQueryListEvent) => setIsDiscoverDesktop(e.matches);
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);

    useEffect(() => {
        if (!isJellyfinPortal) return;
        setDashboardData({ activeSessions: [], recentMovies: [], recentShows: [], recentMusic: [] });
        setTrendingStats(null);
        setError(null);
        setPollError(null);
        setDashboardLoading(false);
        setTrendingLoading(false);
    }, [isJellyfinPortal]);

    const handleRecentLimitChange = useCallback((value: string) => {
        const next = Number(value);
        setRecentLimitOverride(next);
        localStorage.setItem('discoverRecentLimitOverride', String(next));
        localStorage.removeItem('discoverRecentLimit');
    }, []);

    const fetchDashboardOnly = useCallback(async () => {
        try {
            const res = await apiFetch(`${isJellyfinPortal ? '/api/jellyfin/dashboard' : '/api/plex/dashboard'}?limit=${recentLimit}`);
            if (res.error) {
                setPollError(res.error);
                return;
            }
            setDashboardData(res);
            setPollError(null);
        } catch (err: any) {
            setPollError(err?.message || 'Live dashboard update failed');
        }
    }, [recentLimit, isJellyfinPortal]);

    const fetchData = useCallback(async () => {
        setError(null);
        if (!hasLoadedDashboard.current) setDashboardLoading(true);
        if (!isJellyfinPortal && !hasLoadedTrending.current) setTrendingLoading(true);
        try {
            const res = await apiFetch(`${isJellyfinPortal ? '/api/jellyfin/dashboard' : '/api/plex/dashboard'}?limit=${recentLimit}`);
            if (res.error) throw new Error(res.error);
            setDashboardData(res);
        } catch (err: any) {
            setError(err.message || 'Failed to load dashboard data');
        } finally {
            hasLoadedDashboard.current = true;
            setDashboardLoading(false);
        }

        if (isJellyfinPortal) {
            setTrendingStats(null);
            hasLoadedTrending.current = true;
            setTrendingLoading(false);
            return;
        }

        try {
            const statsRes = await apiFetch('/api/plex/stats/trending');
            if (!statsRes.error) {
                setTrendingStats(statsRes);
            }
        } catch {
            // Trending cache may still be building
        } finally {
            hasLoadedTrending.current = true;
            setTrendingLoading(false);
        }
    }, [recentLimit, isJellyfinPortal]);

    useEffect(() => {
        fetchData();
        const liveInterval = setInterval(fetchDashboardOnly, 10000);
        return () => clearInterval(liveInterval);
    }, [fetchDashboardOnly, fetchData]);

    if (dashboardLoading && !dashboardData) {
        return <DiscoverPageSkeleton recentLimit={recentLimit} wideLayout={isWidePortalLayout} />;
    }

    const totalStreams = dashboardData?.activeSessions?.length || 0;
    const trendingCount = recentLimit;
    const transcodingStreams = dashboardData?.activeSessions?.filter(s => s.isTranscoding).length || 0;
    const directStreams = totalStreams - transcodingStreams;
    const totalBandwidthKbps = dashboardData?.activeSessions?.reduce((acc, s) => acc + (s.bandwidth || 0), 0) || 0;
    const totalBandwidthMbps = (totalBandwidthKbps / 1000).toFixed(2);

    return (
        <div className="w-full flex flex-col min-h-screen">
            <main className="discover-layout-container w-full pb-8 mt-4 md:mt-0">
                {error && <div className="toast error show">{error}</div>}
                {pollError && !error && <div className="toast error show">{pollError}</div>}

                {/* SUMMARY CARDS */}
                {dashboardData && totalStreams > 0 && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white/5 border border-white/10 rounded-xl py-2 px-3 flex flex-col items-center justify-center gap-0.5 shadow-lg backdrop-blur-sm">
                            <span className="text-plex font-bold text-2xl">{totalStreams}</span>
                            <span className="text-muted text-[10px] uppercase tracking-wider font-bold">Total Streams</span>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-xl py-2 px-3 flex flex-col items-center justify-center gap-0.5 shadow-lg backdrop-blur-sm">
                            <span className="text-status-active font-bold text-2xl">{directStreams}</span>
                            <span className="text-muted text-[10px] uppercase tracking-wider font-bold">Direct Play</span>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-xl py-2 px-3 flex flex-col items-center justify-center gap-0.5 shadow-lg backdrop-blur-sm">
                            <span className="text-status-expiring font-bold text-2xl">{transcodingStreams}</span>
                            <span className="text-muted text-[10px] uppercase tracking-wider font-bold">Transcoding</span>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-xl py-2 px-3 flex flex-col items-center justify-center gap-0.5 shadow-lg backdrop-blur-sm">
                            <span className="text-plex font-bold text-2xl">{totalBandwidthMbps} <span className="text-sm">Mbps</span></span>
                            <span className="text-muted text-[10px] uppercase tracking-wider font-bold">Total Bandwidth</span>
                        </div>
                    </div>
                )}

                {/* ACTIVITY CARDS */}
                <section className="mb-12 w-full">
                    <h2 className="text-plex text-sm uppercase tracking-[2px] mb-6 font-bold border-b border-white/10 pb-2">ACTIVITY</h2>
                    {dashboardData && dashboardData.activeSessions && dashboardData.activeSessions.length > 0 ? (
                        <div className="w-full">
                            <div className={activityStreamGridClass(isWidePortalLayout, dashboardData.activeSessions.length)}>
                                {dashboardData.activeSessions.map((session, i) => {
                                    const activityCols = activityStreamColumnCount(isWidePortalLayout, dashboardData.activeSessions.length);
                                    const sessionPosterSrc = session.thumbUrl
                                        ? resolvePortalAssetUrl(session.thumbUrl)
                                        : portalUrl(`/api/plex/image?path=${encodeURIComponent(session.thumb)}&width=300&height=500`);
                                    const sessionUserThumbSrc = session.userThumb ? resolvePortalAssetUrl(session.userThumb) : 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';
                                    return (
                                        <div key={session.sessionId ?? i} onClick={() => setSelectedSession(session)} className="bg-card rounded-xl border border-border flex flex-col overflow-hidden shadow-lg hover:border-plex/50 hover:shadow-plex/20 transition-all cursor-pointer select-none h-full min-h-[11.5rem] md:min-h-[14.5rem]">
                                            <div className="flex flex-row flex-1 items-stretch min-h-0">
                                                <div className={`${activityCols === 4 ? 'w-28 md:w-32' : 'w-32 md:w-40'} flex-shrink-0 relative overflow-hidden bg-card self-stretch`}>
                                                    <img src={sessionPosterSrc} alt={session.title} loading="lazy" className="absolute inset-0 w-full h-full object-cover object-top drop-shadow-2xl" />
                                                </div>
                                                <div className="p-2 md:p-3 flex flex-col flex-1 min-w-0 relative">
                                                    {session.user && (
                                                        <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-black/50 backdrop-blur-md rounded-full pr-2.5 p-0.5 shadow-md border border-white/5">
                                                            <img src={sessionUserThumbSrc} alt={session.user} className="w-5 h-5 rounded-full object-cover" onError={(e) => { e.currentTarget.src = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'; }} />
                                                            <span className="text-[10px] font-bold text-white/90 truncate max-w-[80px] md:max-w-[100px]">{session.user}</span>
                                                        </div>
                                                    )}

                                                    <div className="activity-header mb-0.5 pr-20 md:pr-28">
                                                        <div className="activity-title-group">
                                                            <div className="text-sm md:text-base font-bold text-text line-clamp-2 leading-tight">{session.grandparentTitle ? session.grandparentTitle : session.title}</div>
                                                            {session.type === 'episode' && session.season !== undefined && session.episode !== undefined ? (
                                                                <div className="text-[10px] md:text-xs text-muted line-clamp-2 leading-snug mt-0.5">
                                                                    {session.title} | S{String(session.season).padStart(2, '0')}E{String(session.episode).padStart(2, '0')}
                                                                </div>
                                                            ) : (
                                                                session.grandparentTitle && <div className="text-[10px] md:text-xs text-muted line-clamp-2 leading-snug mt-0.5">{session.title}</div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap gap-1 mb-2 mt-0.5">
                                                        {session.resolution && (
                                                            <span className="bg-white/10 text-white/90 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide border border-white/10">{session.resolution.includes('p') || session.resolution.includes('k') ? session.resolution : `${session.resolution}p`}</span>
                                                        )}
                                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide border ${session.sessionLocation === 'lan' ? 'bg-status-active/20 text-status-active border-status-active/30' : 'bg-plex/20 text-plex border-plex/30'}`}>
                                                            {session.sessionLocation === 'lan' ? 'Local' : 'Remote'}
                                                        </span>
                                                    </div>

                                                    <div className="activity-details flex flex-col gap-0.5 mt-auto">
                                                        <div className="flex justify-between items-start text-[10px] md:text-xs border-b border-white/5 pb-0.5">
                                                            <span className="text-muted uppercase tracking-wider font-bold mt-0.5">PLAYER</span>
                                                            <span className="detail-value text-right break-words max-w-[130px] md:max-w-[180px]">{session.playerTitle}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center text-[10px] md:text-xs border-b border-white/5 pb-0.5">
                                                            <span className="text-muted uppercase tracking-wider font-bold">STREAM</span>
                                                            <span className={`font-bold ${session.isTranscoding ? 'text-status-expiring' : 'text-status-active'}`}>
                                                                {session.isTranscoding ? 'Transcode' : 'Direct Play'}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between items-center text-[10px] md:text-xs border-b border-white/5 pb-0.5">
                                                            <span className="text-muted uppercase tracking-wider font-bold">STATE</span>
                                                            <div className="flex items-center gap-1.5 min-w-0">
                                                                <span className="detail-value font-bold truncate">{session.state.charAt(0).toUpperCase() + session.state.slice(1)}</span>
                                                                {session.timeRemaining > 0 && session.state === 'playing' && (
                                                                    <span className="text-[9px] text-muted/80 whitespace-nowrap">
                                                                        ({Math.floor(session.timeRemaining / 3600000) > 0 ? `${Math.floor(session.timeRemaining / 3600000)}h ` : ''}
                                                                        {Math.floor((session.timeRemaining % 3600000) / 60000)}m left)
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-between items-center text-[10px] md:text-xs pb-0.5">
                                                            <span className="text-muted uppercase tracking-wider font-bold">BANDWIDTH</span>
                                                            <span className="detail-value">{(session.bandwidth / 1000).toFixed(1)} Mbps</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Progress Bar with embedded text */}
                                            {(() => {
                                                const progressBarText = `${Math.round(session.progress)}%${session.timeRemaining > 0 && session.state === 'playing' ? ` • ETA ${formatTime(new Date(Date.now() + session.timeRemaining))}` : ''}`;
                                                return (
                                                    <div className="w-full h-4 bg-background/80 relative mt-auto z-10 overflow-hidden rounded-b-lg">
                                                        {/* Progress fill */}
                                                        <div className="h-full bg-plex absolute top-0 left-0 transition-all duration-1000 z-10" style={{ width: `${session.progress}%` }}></div>

                                                        {/* Text visible on black background (white text) */}
                                                        <div
                                                            className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white z-20 pointer-events-none whitespace-nowrap"
                                                            style={{ clipPath: `inset(0 0 0 ${session.progress}%)` }}
                                                        >
                                                            {progressBarText}
                                                        </div>

                                                        {/* Text visible on yellow progress bar (black text) */}
                                                        <div
                                                            className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-black z-30 pointer-events-none whitespace-nowrap"
                                                            style={{ clipPath: `inset(0 ${100 - session.progress}% 0 0)` }}
                                                        >
                                                            {progressBarText}
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-muted p-8 border border-dashed border-border rounded-xl mt-4 w-full">No active streams</div>
                    )}
                </section>

                <div className="flex justify-end gap-4 items-center mb-8">
                    <span className="text-xs uppercase tracking-wider text-muted font-semibold">Items Per Section</span>
                    <CustomSelect
                        compact
                        className="w-32"
                        value={String(recentLimit)}
                        onChange={handleRecentLimitChange}
                        options={DISCOVER_LIMIT_OPTIONS}
                    />
                </div>

                <div className="flex flex-col gap-12 w-full">
                    {/* RECENT MOVIES */}
                    <div className="flex flex-col">
                        <h2 className="text-plex text-sm uppercase tracking-[2px] mb-6 font-bold border-b border-white/10 pb-2">RECENTLY ADDED MOVIES</h2>
                        <div className={discoverPosterGridClass}>
                            {dashboardData && dashboardData.recentMovies.slice(0, recentLimit).map((item, i) => (
                                <DiscoverPosterCard key={i} item={item} showQualityBadges={showQualityBadges} />
                            ))}
                            {(!dashboardData || dashboardData.recentMovies.length === 0) && <div className="text-center text-muted p-8 border border-dashed border-border rounded-xl mt-4 w-full col-span-full">No recent movies</div>}
                        </div>
                    </div>

                    {/* RECENT TV SHOWS */}
                    <div className="flex flex-col">
                        <h2 className="text-plex text-sm uppercase tracking-[2px] mb-6 font-bold border-b border-white/10 pb-2">{isJellyfinPortal ? 'RECENTLY ADDED EPISODES' : 'RECENTLY ADDED TV SHOWS'}</h2>
                        <div className={discoverPosterGridClass}>
                            {dashboardData && dashboardData.recentShows.slice(0, recentLimit).map((item, i) => (
                                <DiscoverPosterCard key={i} item={item} showQualityBadges={showQualityBadges} />
                            ))}
                            {(!dashboardData || dashboardData.recentShows.length === 0) && <div className="text-center text-muted p-8 border border-dashed border-border rounded-xl mt-4 w-full col-span-full">{isJellyfinPortal ? 'No recent episodes' : 'No recent TV shows'}</div>}
                        </div>
                    </div>

                    {/* RECENT MUSIC */}
                    <div className="flex flex-col">
                        <h2 className="text-plex text-sm uppercase tracking-[2px] mb-6 font-bold border-b border-white/10 pb-2">RECENTLY ADDED MUSIC</h2>
                        <div className={discoverPosterGridClass}>
                            {dashboardData && dashboardData.recentMusic.slice(0, recentLimit).map((item, i) => (
                                <DiscoverPosterCard key={i} item={item} aspect="square" showQualityBadges={showQualityBadges} />
                            ))}
                            {(!dashboardData || dashboardData.recentMusic.length === 0) && <div className="text-center text-muted p-8 border border-dashed border-border rounded-xl mt-4 w-full col-span-full">No recent music</div>}
                        </div>
                    </div>
                </div>

                {/* SERVER WIDE STATS SECTION */}
                {!isJellyfinPortal && trendingLoading && !trendingStats ? (
                    <TrendingSectionsSkeleton count={trendingCount} sections={3} />
                ) : !isJellyfinPortal && trendingStats && (
                    <div className="mt-16 w-full flex flex-col gap-12">
                        <div className="flex flex-col gap-2 items-center text-center mb-4">
                            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">Other things happening on {publicConfig?.serverIdentifier || 'this server'}</h2>
                            <p className="text-muted text-sm max-w-xl">A look at what the community is currently watching across the entire server.</p>
                        </div>

                        <TrendingDiscoverSection title="🔥 Trending This Week" items={trendingStats.trending7Days} limit={recentLimit} showQualityBadges={showQualityBadges} />
                        <TrendingDiscoverSection title="🍿 Most Watched Movies (This Month)" items={trendingStats.movies30Days} limit={recentLimit} showQualityBadges={showQualityBadges} />
                        <TrendingDiscoverSection title="📺 Most Watched Shows (This Month)" items={trendingStats.shows30Days} limit={recentLimit} showQualityBadges={showQualityBadges} />
                        <TrendingDiscoverSection title="🏆 Top of the Year" items={trendingStats.top365Days} limit={recentLimit} showQualityBadges={showQualityBadges} />
                        <TrendingDiscoverSection title="🌟 All Time Favorites" items={trendingStats.allTime} limit={recentLimit} showQualityBadges={showQualityBadges} />
                        <TrendingDiscoverSection title="🍿 Weekend Warriors" items={trendingStats.weekendWarriors} limit={recentLimit} showQualityBadges={showQualityBadges} />
                        <TrendingDiscoverSection title="🦇 Night Owl Club" items={trendingStats.nightOwls} limit={recentLimit} showQualityBadges={showQualityBadges} />
                        <TrendingDiscoverSection title="📼 Blast from the Past" items={trendingStats.retroHits} limit={recentLimit} showQualityBadges={showQualityBadges} />
                        <TrendingDiscoverSection title="💎 Cult Classics" items={trendingStats.cultClassics} limit={recentLimit} showQualityBadges={showQualityBadges} />
                    </div>
                )}
            </main>

            {/* Stream Details Modal */}
            {selectedSession && <StreamDetailsModal session={selectedSession} onClose={() => setSelectedSession(null)} isAdmin={isAdmin} onKilled={fetchData} providerLabel={isJellyfinPortal ? 'Jellyfin' : 'Plex'} />}
        </div>
    );
};

export const MaintenanceDashboard: React.FC = () => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const [maintenanceFeatureEnabled, setMaintenanceFeatureEnabled] = useState(false);
    const [overview, setOverview] = useState<any>(null);
    const [runs, setRuns] = useState<any[]>([]);
    const [previewGroups, setPreviewGroups] = useState<any[]>([]);
    const [rules, setRules] = useState<any[]>([]);
    const [overviewInsights, setOverviewInsights] = useState<{
        totalMatches: number;
        uniqueMatches: number;
        estimatedReclaimGB: number;
        libraries: Array<{ libraryTitle: string; count: number; reclaimGB: number }>;
        rules: Array<{ ruleId: string; ruleName: string; totalMatches: number; reclaimGB: number }>;
    }>({
        totalMatches: 0,
        uniqueMatches: 0,
        estimatedReclaimGB: 0,
        libraries: [],
        rules: []
    });
    const [preferences, setPreferences] = useState<any>({
        global: { dryRunByDefault: true, maxActionsPerRun: 25, requireConfirmForDestructive: true },
        exclusions: { ratingKeys: [], titles: [], libraries: [] }
    });
    const [candidateRuleId, setCandidateRuleId] = useState<string>('');
    const [candidateItems, setCandidateItems] = useState<any[]>([]);
    const [candidateSearch, setCandidateSearch] = useState('');
    const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);
    const [libraryJsonInput, setLibraryJsonInput] = useState('');
    const [libraryItems, setLibraryItems] = useState<any[]>([]);
    const [libraryOptions, setLibraryOptions] = useState<Array<{ id: string; title: string; count: number }>>([]);
    const [libraryBrowseId, setLibraryBrowseId] = useState('all');
    const [libraryBrowseSearch, setLibraryBrowseSearch] = useState('');
    const [libraryBrowsePage, setLibraryBrowsePage] = useState(1);
    const [libraryBrowseLimit] = useState(48);
    const [libraryBrowseTotal, setLibraryBrowseTotal] = useState(0);
    const [libraryBrowseLoading, setLibraryBrowseLoading] = useState(false);
    const [selectedExcludeKeys, setSelectedExcludeKeys] = useState<string[]>([]);
    const [exclusionsSummary, setExclusionsSummary] = useState<{ ratingKeys: any[]; titles: any[]; libraries: any[] }>({ ratingKeys: [], titles: [], libraries: [] });
    const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);
    const [storageSummary, setStorageSummary] = useState<any>(null);
    const [storageSummaryLoading, setStorageSummaryLoading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState(() => {
        const hash = window.location.hash.replace('#', '');
        if (hash.startsWith('maintenance-')) {
            const section = hash.replace('maintenance-', '');
            if (section === 'overlays') return 'overview';
            return section;
        }
        return 'overview';
    });

    const addToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        setToasts(t => pushToast(t, message, type));
    }, []);
    const isMaintenanceDisabledError = useCallback((error: any) => {
        const msg = String(error?.message || '');
        return msg.includes('Maintenance Experimental Mode is disabled');
    }, []);

    const sections = [
        { id: 'overview', label: 'Overview' },
        { id: 'exclusions', label: 'Exclusions' },
        { id: 'rules', label: 'Rules' },
        { id: 'collections', label: 'Collections' },
        { id: 'candidates', label: 'Candidates' },
        { id: 'calendar', label: 'Calendar' },
        { id: 'storage', label: 'Storage Metrics' },
        { id: 'library', label: 'Rule Library' },
        { id: 'settings', label: 'Maintenance Settings' },
        { id: 'runs', label: 'Logs' }
    ];

    useEffect(() => {
        window.location.hash = `maintenance-${activeSection}`;
    }, [activeSection]);

    useEffect(() => {
        if (activeSection !== 'calendar') {
            setSelectedCalendarDate(null);
        }
    }, [activeSection]);

    const loadOverview = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const configData = await apiFetch('/api/config');
            const isEnabled = !!configData?.settings?.maintenanceExperimentalEnabled;
            setMaintenanceFeatureEnabled(isEnabled);
            if (!isEnabled) {
                return;
            }
            const [indexData, runsData, previewData, rulesData, prefData] = await Promise.all([
                apiFetch('/api/maintenance/index'),
                apiFetch('/api/maintenance/runs'),
                apiFetch('/api/maintenance/preview', {
                    method: 'POST',
                    body: JSON.stringify({ limit: 30, includeArrDiagnostics: false })
                }),
                apiFetch('/api/maintenance/rules'),
                apiFetch('/api/maintenance/preferences')
            ]);
            setOverview(indexData || null);
            setRuns(Array.isArray(runsData) ? runsData : []);
            setPreviewGroups(Array.isArray(previewData?.previews) ? previewData.previews : []);
            setRules(Array.isArray(rulesData) ? rulesData : []);
            setPreferences(prefData || {
                global: { dryRunByDefault: true, maxActionsPerRun: 25, requireConfirmForDestructive: true },
                exclusions: { ratingKeys: [], titles: [], libraries: [] }
            });
            const previewAll = Array.isArray(previewData?.previews) ? previewData.previews : [];
            const uniqueItems = new Map<string, any>();
            const libraryMap: Record<string, { libraryTitle: string; count: number; reclaimGB: number }> = {};
            const ruleInsights = previewAll.map((preview: any) => {
                const sample = Array.isArray(preview?.sample) ? preview.sample : [];
                let ruleReclaim = 0;
                sample.forEach((item: any) => {
                    const ratingKey = String(item?.ratingKey || '');
                    if (ratingKey && !uniqueItems.has(ratingKey)) uniqueItems.set(ratingKey, item);
                    const size = Number(item?.sizeGB || 0);
                    ruleReclaim += size;
                    const libraryTitle = item?.libraryTitle || 'Unknown Library';
                    if (!libraryMap[libraryTitle]) libraryMap[libraryTitle] = { libraryTitle, count: 0, reclaimGB: 0 };
                    libraryMap[libraryTitle].count += 1;
                    libraryMap[libraryTitle].reclaimGB += size;
                });
                return {
                    ruleId: String(preview?.ruleId || ''),
                    ruleName: preview?.ruleName || 'Unnamed Rule',
                    totalMatches: Number(preview?.totalMatches || sample.length || 0),
                    reclaimGB: ruleReclaim
                };
            });
            const uniqueValues = Array.from(uniqueItems.values());
            const estimatedReclaimGB = uniqueValues.reduce((sum: number, item: any) => sum + Number(item?.sizeGB || 0), 0);
            const totalMatches = ruleInsights.reduce((sum: number, rule: any) => sum + Number(rule.totalMatches || 0), 0);
            setOverviewInsights({
                totalMatches,
                uniqueMatches: uniqueValues.length,
                estimatedReclaimGB,
                libraries: Object.values(libraryMap).sort((a, b) => b.reclaimGB - a.reclaimGB),
                rules: ruleInsights.sort((a: any, b: any) => b.reclaimGB - a.reclaimGB)
            });
        } catch (e: any) {
            if (isMaintenanceDisabledError(e)) {
                setMaintenanceFeatureEnabled(false);
                return;
            }
            addToast(e.message || 'Failed to load maintenance overview', 'error');
        } finally {
            if (!silent) setLoading(false);
        }
    }, [addToast, isMaintenanceDisabledError]);

    useEffect(() => {
        loadOverview();
    }, [loadOverview]);

    useEffect(() => {
        if (!rules.length) {
            setCandidateRuleId('');
            setCandidateItems([]);
            return;
        }
        if (!candidateRuleId || !rules.some((rule: any) => rule.id === candidateRuleId)) {
            setCandidateRuleId(rules[0].id);
        }
    }, [rules, candidateRuleId]);

    const fetchCandidatesForRule = useCallback(async (ruleId: string) => {
        if (!maintenanceFeatureEnabled) {
            setCandidateItems([]);
            return;
        }
        if (!ruleId) {
            setCandidateItems([]);
            return;
        }
        setIsLoadingCandidates(true);
        try {
            const payload = await apiFetch('/api/maintenance/preview', {
                method: 'POST',
                body: JSON.stringify({
                    ruleId,
                    includeAll: true,
                    includeArrDiagnostics: false
                })
            });
            const previews = Array.isArray(payload?.previews) ? payload.previews : [];
            const selected = previews.find((preview: any) => preview.ruleId === ruleId);
            setCandidateItems((selected?.sample || []).map((item: any) => ({ ...item, _ruleId: selected?.ruleId, _ruleName: selected?.ruleName })));
        } catch (e: any) {
            if (isMaintenanceDisabledError(e)) {
                setMaintenanceFeatureEnabled(false);
                return;
            }
            addToast(e.message || 'Failed to load candidates', 'error');
        } finally {
            setIsLoadingCandidates(false);
        }
    }, [addToast, isMaintenanceDisabledError, maintenanceFeatureEnabled]);

    useEffect(() => {
        if (maintenanceFeatureEnabled && (activeSection === 'candidates' || activeSection === 'storage' || activeSection === 'calendar')) {
            fetchCandidatesForRule(candidateRuleId);
        }
    }, [activeSection, candidateRuleId, fetchCandidatesForRule, maintenanceFeatureEnabled]);

    const saveAllRules = async (nextRules: any[]) => {
        await apiFetch('/api/maintenance/rules', { method: 'POST', body: JSON.stringify(nextRules) });
        setRules(nextRules);
    };

    const savePreferences = async (nextPrefs: any) => {
        const response = await apiFetch('/api/maintenance/preferences', { method: 'POST', body: JSON.stringify(nextPrefs) });
        setPreferences(response?.preferences || nextPrefs);
    };

    const loadExclusionsSummary = useCallback(async () => {
        if (!maintenanceFeatureEnabled) return;
        try {
            const payload = await apiFetch('/api/maintenance/exclusions/summary');
            setExclusionsSummary({
                ratingKeys: Array.isArray(payload?.ratingKeys) ? payload.ratingKeys : [],
                titles: Array.isArray(payload?.titles) ? payload.titles : [],
                libraries: Array.isArray(payload?.libraries) ? payload.libraries : []
            });
        } catch (e: any) {
            if (isMaintenanceDisabledError(e)) {
                setMaintenanceFeatureEnabled(false);
                return;
            }
            addToast(e.message || 'Failed to load exclusions summary.', 'error');
        }
    }, [addToast, isMaintenanceDisabledError, maintenanceFeatureEnabled]);

    const refreshExclusionsSummaryQuietly = useCallback(() => {
        loadExclusionsSummary().catch(() => { });
    }, [loadExclusionsSummary]);

    const updateRatingKeyExclusions = async (nextKeys: string[]) => {
        const next = {
            ...preferences,
            exclusions: { ...(preferences.exclusions || {}), ratingKeys: nextKeys }
        };
        await savePreferences(next);
        refreshExclusionsSummaryQuietly();
    };

    const loadLibraryBrowse = useCallback(async () => {
        if (!maintenanceFeatureEnabled) return;
        setLibraryBrowseLoading(true);
        try {
            const params = new URLSearchParams({
                libraryId: libraryBrowseId,
                search: libraryBrowseSearch,
                page: String(libraryBrowsePage),
                limit: String(libraryBrowseLimit),
                includeExcluded: 'true'
            });
            const payload = await apiFetch(`/api/maintenance/library-items?${params.toString()}`);
            setLibraryItems(Array.isArray(payload?.items) ? payload.items : []);
            setLibraryOptions(Array.isArray(payload?.libraries) ? payload.libraries : []);
            setLibraryBrowseTotal(Number(payload?.total || 0));
        } catch (e: any) {
            if (isMaintenanceDisabledError(e)) {
                setMaintenanceFeatureEnabled(false);
                return;
            }
            addToast(e.message || 'Failed to load library posters.', 'error');
        } finally {
            setLibraryBrowseLoading(false);
        }
    }, [addToast, isMaintenanceDisabledError, libraryBrowseId, libraryBrowseLimit, libraryBrowsePage, libraryBrowseSearch, maintenanceFeatureEnabled]);

    const loadStorageSummary = useCallback(async (ruleId?: string) => {
        if (!maintenanceFeatureEnabled) return;
        setStorageSummaryLoading(true);
        try {
            const query = ruleId ? `?ruleId=${encodeURIComponent(ruleId)}` : '';
            const payload = await apiFetch(`/api/maintenance/storage-summary${query}`);
            setStorageSummary(payload || null);
        } catch (e: any) {
            if (isMaintenanceDisabledError(e)) {
                setMaintenanceFeatureEnabled(false);
                return;
            }
            addToast(e.message || 'Failed to load storage summary.', 'error');
        } finally {
            setStorageSummaryLoading(false);
        }
    }, [addToast, isMaintenanceDisabledError, maintenanceFeatureEnabled]);

    useEffect(() => {
        if (maintenanceFeatureEnabled && activeSection === 'exclusions') {
            loadExclusionsSummary();
        }
    }, [activeSection, loadExclusionsSummary, maintenanceFeatureEnabled]);

    useEffect(() => {
        if (maintenanceFeatureEnabled && activeSection === 'exclusions') {
            loadLibraryBrowse();
        }
    }, [activeSection, libraryBrowseId, libraryBrowsePage, libraryBrowseSearch, loadLibraryBrowse, maintenanceFeatureEnabled]);

    useEffect(() => {
        if (maintenanceFeatureEnabled && activeSection === 'storage') {
            loadStorageSummary(candidateRuleId || undefined);
        }
    }, [activeSection, candidateRuleId, maintenanceFeatureEnabled, loadStorageSummary]);

    const filteredCandidates = candidateItems.filter((item: any) => {
        if (!candidateSearch.trim()) return true;
        const q = candidateSearch.trim().toLowerCase();
        return `${item.title || ''} ${item.libraryTitle || ''}`.toLowerCase().includes(q);
    });
    const selectedCandidateRule = useMemo(
        () => rules.find((rule: any) => rule.id === candidateRuleId) || null,
        [rules, candidateRuleId]
    );

    const excludedRatingKeySet = useMemo(
        () => new Set((preferences?.exclusions?.ratingKeys || []).map((v: string) => String(v))),
        [preferences?.exclusions?.ratingKeys]
    );

    const formatReclaimSizeFromGB = (sizeGB: number) => {
        const safeGB = Math.max(0, Number(sizeGB || 0));
        if (safeGB >= 1024) {
            return `${Math.ceil(safeGB / 1024)} TB`;
        }
        if (safeGB >= 1) {
            return `${Math.ceil(safeGB)} GB`;
        }
        return `${Math.ceil(safeGB * 1024)} MB`;
    };

    const getEligibilityTooltip = (item: any) => {
        const daysUntilEligible = Math.max(0, Number(item?.daysUntilEligible || 0));
        const watchDays = Number(item?.daysSinceLastWatch);
        const addedDays = Number(item?.daysSinceAdded);
        const base = daysUntilEligible > 0
            ? `Not eligible yet. Rule grace has ${daysUntilEligible} day(s) remaining.`
            : 'Eligible now for this rule.';
        if (Number.isFinite(watchDays) && watchDays >= 0) {
            return `${base} Last watched ${watchDays} day(s) ago.`;
        }
        if (Number.isFinite(addedDays) && addedDays >= 0) {
            return `${base} Added ${addedDays} day(s) ago.`;
        }
        return base;
    };

    const ELIGIBLE_NOW_KEY = 'eligible-now';
    const calendarEligibility = useMemo(() => {
        const graceDays = Math.max(0, Number(selectedCandidateRule?.graceDays || 0));
        const createdAtMs = Date.parse(String(selectedCandidateRule?.createdAt || ''));
        const hasRuleCreatedAt = Number.isFinite(createdAtMs);
        const daysSinceRuleCreated = hasRuleCreatedAt
            ? Math.max(0, Math.floor((Date.now() - createdAtMs) / (24 * 60 * 60 * 1000)))
            : graceDays;
        const daysUntilEligible = Math.max(0, graceDays - daysSinceRuleCreated);
        const nowItems: any[] = [];
        const byDay = new Map<string, any[]>();
        filteredCandidates.forEach((item: any) => {
            if (daysUntilEligible <= 0) {
                nowItems.push({ ...item, daysUntilEligible: 0, eligibleDate: null });
                return;
            }
            const etaDate = new Date(Date.now() + (daysUntilEligible * 24 * 60 * 60 * 1000));
            const dateKey = etaDate.toISOString().split('T')[0];
            const enriched = { ...item, daysUntilEligible, eligibleDate: dateKey };
            if (!byDay.has(dateKey)) byDay.set(dateKey, []);
            byDay.get(dateKey)?.push(enriched);
        });
        const laterByDay = Array.from(byDay.entries())
            .sort((a, b) => (a[0] < b[0] ? -1 : 1))
            .map(([date, items]) => ({
                date,
                items,
                count: items.length,
                reclaimGB: items.reduce((sum: number, item: any) => sum + Number(item.sizeGB || 0), 0),
                preview: items.slice(0, 4),
                minDaysUntil: Math.min(...items.map((item: any) => Number(item.daysUntilEligible || 0)))
            }));
        return {
            graceDays,
            daysSinceRuleCreated,
            daysUntilEligible,
            eligibleNow: nowItems.sort((a, b) => String(a.title || '').localeCompare(String(b.title || ''))),
            eligibleLaterByDay: laterByDay
        };
    }, [filteredCandidates, selectedCandidateRule?.createdAt, selectedCandidateRule?.graceDays]);

    const selectedCalendarGroup = useMemo(() => {
        if (!selectedCalendarDate) return null;
        if (selectedCalendarDate === ELIGIBLE_NOW_KEY) {
            const items = calendarEligibility.eligibleNow;
            return {
                date: ELIGIBLE_NOW_KEY,
                title: 'Eligible Now',
                items,
                count: items.length,
                reclaimGB: items.reduce((sum: number, item: any) => sum + Number(item.sizeGB || 0), 0)
            };
        }
        const day = calendarEligibility.eligibleLaterByDay.find((group) => group.date === selectedCalendarDate);
        if (!day) return null;
        return {
            ...day,
            title: new Date(`${day.date}T00:00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
        };
    }, [calendarEligibility, selectedCalendarDate]);

    const renderScaffoldPage = (title: string, description: string, bullets: string[]) => (
        <div className="glass-card-sm p-5">
            <h3 className="text-xl font-bold text-plex mb-2">{title}</h3>
            <p className="text-sm text-muted mb-4">{description}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {bullets.map((item) => (
                    <div key={item} className="bg-black/20 border border-border rounded-lg px-3 py-2 text-sm text-text">
                        {item}
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="w-full flex flex-col">
            <Loader isLoading={loading} />
            <ToastContainer toasts={toasts} setToasts={setToasts} />
            <header className="page-header">
                <h1 className="page-title">Maintenance</h1>
            </header>
            <div className="w-full flex flex-col p-0 md:p-8 bg-transparent md:glass-card rounded-none md:rounded-2xl border-0 md:border shadow-none">
                <div className="md:hidden mb-3">
                    <label className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1 block">Module Page</label>
                    <CustomSelect
                        value={activeSection}
                        onChange={(value) => setActiveSection(value)}
                        compact
                        className="w-full"
                        options={sections.map((section) => ({ label: section.label, value: section.id }))}
                    />
                </div>
                <div className="md:grid md:grid-cols-[280px_minmax(0,1fr)] md:gap-6">
                    <aside className="hidden md:block glass-card-sm p-3 h-fit sticky top-20">
                        <p className="text-muted text-xs uppercase tracking-wider font-bold mb-2 px-2">Module Pages</p>
                        <div className="space-y-1">
                            {sections.map((section) => (
                                <button
                                    key={section.id}
                                    type="button"
                                    onClick={() => setActiveSection(section.id)}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${activeSection === section.id ? 'bg-plex text-background' : 'text-muted hover:text-text hover:bg-white/5'}`}
                                >
                                    {section.label}
                                </button>
                            ))}
                        </div>
                    </aside>
                    <div className="overflow-y-auto flex-grow mb-4 custom-scrollbar space-y-4 md:pr-2">
                        {!maintenanceFeatureEnabled && (
                            <div className="glass-card-sm border-yellow-500/30 p-5">
                                <h3 className="text-xl font-bold text-plex mb-2">Maintenance Disabled</h3>
                                <p className="text-sm text-muted mb-3">Experimental Maintenance Mode is currently OFF.</p>
                                <p className="text-xs text-muted">Enable it in `Settings` → `System` under `Maintenance Experimental Mode`, then click Save Settings.</p>
                                <button
                                    type="button"
                                    onClick={() => { window.location.href = portalUrl('/settings?focus=maintenance-toggle#system'); }}
                                    className="mt-3 px-3 py-1.5 bg-plex text-background rounded-md text-xs font-semibold hover:bg-plex-hover transition-colors"
                                >
                                    Open Settings
                                </button>
                            </div>
                        )}
                        {maintenanceFeatureEnabled && (
                            <>
                                {activeSection === 'overview' && (
                                    <div className="space-y-4">
                                        <div className="glass-card-sm p-5">
                                            <h3 className="text-xl font-bold text-plex mb-2">Maintenance Control Center</h3>
                                            <p className="text-sm text-muted mb-4">Dedicated module for library maintenance automation: rules, collections, candidates, execution timeline, calendar, storage, and governance.</p>
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                                <div className="bg-background/30 rounded-lg p-3 border border-white/5">
                                                    <p className="text-xs text-muted">Indexed Media</p>
                                                    <p className="text-2xl font-bold text-text">{overview?.itemCount || 0}</p>
                                                </div>
                                                <div className="bg-background/30 rounded-lg p-3 border border-white/5">
                                                    <p className="text-xs text-muted">Request Records</p>
                                                    <p className="text-2xl font-bold text-text">{overview?.requestItemCount || 0}</p>
                                                </div>
                                                <div className="bg-background/30 rounded-lg p-3 border border-white/5">
                                                    <p className="text-xs text-muted">Rules with Matches</p>
                                                    <p className="text-2xl font-bold text-text">{previewGroups.filter((p: any) => (p.totalMatches || 0) > 0).length}</p>
                                                </div>
                                                <div className="bg-background/30 rounded-lg p-3 border border-white/5">
                                                    <p className="text-xs text-muted">Total Runs</p>
                                                    <p className="text-2xl font-bold text-text">{runs.length}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="glass-card-sm p-5 space-y-4">
                                            <h4 className="font-bold text-text">Reclaim & Impact Overview</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                                <div className="bg-background/30 rounded-lg p-3 border border-white/5">
                                                    <p className="text-xs text-muted">Total Matched (Rules Combined)</p>
                                                    <p className="text-2xl font-bold text-text">{overviewInsights.totalMatches}</p>
                                                </div>
                                                <div className="bg-background/30 rounded-lg p-3 border border-white/5">
                                                    <p className="text-xs text-muted">Unique Candidate Titles</p>
                                                    <p className="text-2xl font-bold text-text">{overviewInsights.uniqueMatches}</p>
                                                </div>
                                                <div className="bg-background/30 rounded-lg p-3 border border-white/5">
                                                    <p className="text-xs text-muted">Estimated Reclaim</p>
                                                    <p className="text-2xl font-bold text-text">{formatReclaimSizeFromGB(overviewInsights.estimatedReclaimGB)}</p>
                                                </div>
                                                <div className="bg-background/30 rounded-lg p-3 border border-white/5">
                                                    <p className="text-xs text-muted">Top Impact Library</p>
                                                    <p className="text-sm font-bold text-text line-clamp-2">{overviewInsights.libraries[0]?.libraryTitle || '—'}</p>
                                                    <p className="text-xs text-muted mt-1">{overviewInsights.libraries[0] ? formatReclaimSizeFromGB(overviewInsights.libraries[0].reclaimGB) : 'No data'}</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                                <div className="bg-background/30 rounded-lg p-3 border border-white/5">
                                                    <p className="text-xs text-muted font-bold uppercase tracking-wider mb-2">Top Libraries by Reclaim</p>
                                                    <div className="space-y-1.5 max-h-52 overflow-y-auto custom-scrollbar pr-1">
                                                        {overviewInsights.libraries.slice(0, 8).map((lib) => (
                                                            <div key={`overview-lib-${lib.libraryTitle}`} className="flex items-center justify-between text-xs bg-background/30 border border-white/5 rounded px-2 py-1.5">
                                                                <span className="text-text line-clamp-1">{lib.libraryTitle}</span>
                                                                <span className="text-muted ml-2 whitespace-nowrap">{formatReclaimSizeFromGB(lib.reclaimGB)} · {lib.count}</span>
                                                            </div>
                                                        ))}
                                                        {!overviewInsights.libraries.length && <p className="text-xs text-muted">No matching candidates yet.</p>}
                                                    </div>
                                                </div>
                                                <div className="bg-background/30 rounded-lg p-3 border border-white/5">
                                                    <p className="text-xs text-muted font-bold uppercase tracking-wider mb-2">Top Rules by Reclaim</p>
                                                    <div className="space-y-1.5 max-h-52 overflow-y-auto custom-scrollbar pr-1">
                                                        {overviewInsights.rules.slice(0, 8).map((rule) => (
                                                            <div key={`overview-rule-${rule.ruleId}`} className="flex items-center justify-between text-xs bg-background/30 border border-white/5 rounded px-2 py-1.5">
                                                                <span className="text-text line-clamp-1">{rule.ruleName}</span>
                                                                <span className="text-muted ml-2 whitespace-nowrap">{formatReclaimSizeFromGB(rule.reclaimGB)} · {rule.totalMatches}</span>
                                                            </div>
                                                        ))}
                                                        {!overviewInsights.rules.length && <p className="text-xs text-muted">No rules with match data yet.</p>}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {activeSection === 'rules' && <LibraryMaintenancePanel addToast={addToast} onRulesUpdated={() => loadOverview(true)} />}
                                {activeSection === 'collections' && (
                                    <div className="glass-card-sm p-5 space-y-3">
                                        <h3 className="text-xl font-bold text-plex">Collections</h3>
                                        <p className="text-sm text-muted">Manage collection behavior per rule. Changes save directly to each ruleset.</p>
                                        <div className="space-y-2">
                                            {rules.map((rule: any) => (
                                                <div key={`collection-${rule.id}`} className="bg-background/30 border border-white/5 rounded-lg p-3">
                                                    <div className="flex items-center justify-between gap-3">
                                                        <p className="font-semibold text-text text-sm">{rule.name || 'Unnamed Rule'}</p>
                                                        <label className="text-xs text-muted flex items-center gap-2">
                                                            <input
                                                                type="checkbox"
                                                                checked={rule?.collection?.enabled !== false}
                                                                onChange={async (e) => {
                                                                    const next = rules.map((r: any) => r.id === rule.id ? { ...r, collection: { ...(r.collection || {}), enabled: e.target.checked } } : r);
                                                                    setRules(next);
                                                                    await saveAllRules(next);
                                                                    addToast('Collection settings updated.');
                                                                }}
                                                            />
                                                            Enabled
                                                        </label>
                                                    </div>
                                                    <input
                                                        className="mt-2 w-full p-2 rounded border border-border bg-card text-text text-sm"
                                                        value={rule?.collection?.nameTemplate || 'Leaving Soon - {{ruleName}}'}
                                                        onChange={(e) => {
                                                            const next = rules.map((r: any) => r.id === rule.id ? { ...r, collection: { ...(r.collection || {}), nameTemplate: e.target.value } } : r);
                                                            setRules(next);
                                                        }}
                                                        onBlur={async (e) => {
                                                            const next = rules.map((r: any) => r.id === rule.id
                                                                ? { ...r, collection: { ...(r.collection || {}), nameTemplate: e.target.value } }
                                                                : r);
                                                            setRules(next);
                                                            await saveAllRules(next);
                                                            addToast('Collection template saved.');
                                                        }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {activeSection === 'candidates' && (
                                    <div className="glass-card-sm p-3 md:p-5 space-y-3">
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <h3 className="text-xl font-bold text-plex">Candidates</h3>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    className="p-2 rounded border border-border bg-card text-text text-sm"
                                                    placeholder="Search titles..."
                                                    value={candidateSearch}
                                                    onChange={(e) => setCandidateSearch(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {rules.map((rule: any) => (
                                                <button
                                                    key={`candidate-rule-tab-${rule.id}`}
                                                    type="button"
                                                    onClick={() => setCandidateRuleId(rule.id)}
                                                    className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors ${candidateRuleId === rule.id ? 'bg-plex text-background border-plex' : 'bg-background/30 text-text border-white/5 hover:border-plex/40'}`}
                                                >
                                                    {rule.name || 'Unnamed Rule'}
                                                </button>
                                            ))}
                                            {!rules.length && <p className="text-sm text-muted">No saved rules found. Create a rule in `Rules` first.</p>}
                                        </div>
                                        {selectedCandidateRule && (
                                            <p className="text-xs text-muted">
                                                Showing candidates for <span className="text-text font-semibold">{selectedCandidateRule.name || 'Unnamed Rule'}</span> only.
                                            </p>
                                        )}
                                        {isLoadingCandidates ? <p className="text-sm text-muted">Loading candidates...</p> : (
                                            <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-2 md:gap-3 max-h-[620px] overflow-y-auto custom-scrollbar pr-1">
                                                {filteredCandidates.map((item: any) => (
                                                    <div key={`candidate-${item._ruleId || candidateRuleId}-${item.ratingKey}`} className="bg-background/30 border border-white/5 rounded-lg overflow-hidden">
                                                        <div className="aspect-[2/3] bg-black/40">
                                                            {item.thumb ? (
                                                                <img src={portalUrl(`/api/plex/image?path=${encodeURIComponent(item.thumb)}&width=220&height=330`)} alt={item.title} loading="lazy" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-xs text-muted">No Poster</div>
                                                            )}
                                                        </div>
                                                        <div className="p-2">
                                                            <p className="text-xs text-text line-clamp-2">{item.title}</p>
                                                            <p className="text-[11px] text-muted mt-1">{item.libraryTitle || 'Unknown Library'}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                                {!filteredCandidates.length && <p className="text-sm text-muted col-span-full">No matching candidates found for this ruleset.</p>}
                                            </div>
                                        )}
                                    </div>
                                )}
                                {activeSection === 'runs' && (
                                    <div className="glass-card-sm p-5 space-y-3">
                                        <h3 className="text-xl font-bold text-plex">Logs</h3>
                                        <div className="space-y-2 max-h-[620px] overflow-y-auto custom-scrollbar pr-1">
                                            {runs.map((run: any) => (
                                                <details key={`run-${run.id}`} className="bg-background/30 border border-white/5 rounded-lg p-3">
                                                    <summary className="cursor-pointer list-none">
                                                        <div className="flex items-center justify-between gap-3">
                                                            <div>
                                                                <p className="text-sm font-semibold text-text">{run.ruleName}</p>
                                                                <p className="text-xs text-muted">{new Date(run.startedAt).toLocaleString()} · {run.dryRun ? 'Dry-run' : 'Destructive'}</p>
                                                            </div>
                                                            <span className="text-[11px] px-2 py-1 rounded bg-border text-muted">{run.status}</span>
                                                        </div>
                                                    </summary>
                                                    <div className="mt-3 text-xs text-muted">
                                                        Matched {run.totals?.matched || 0} · Processed {run.totals?.processed || 0} · Deleted {run.totals?.deleted || 0} · Skipped {run.totals?.skipped || 0} · Failed {run.totals?.failed || 0}
                                                    </div>
                                                    {Array.isArray(run.preflight?.warnings) && run.preflight.warnings.length > 0 && (
                                                        <div className="mt-2 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded px-2 py-1">
                                                            {run.preflight.warnings.join(' ')}
                                                        </div>
                                                    )}
                                                    <div className="mt-2 max-h-52 overflow-y-auto custom-scrollbar pr-1 space-y-1">
                                                        {(run.outcomes || []).slice(0, 120).map((outcome: any, idx: number) => (
                                                            <div key={`outcome-${run.id}-${idx}`} className="text-xs bg-background/30 border border-white/5 rounded px-2 py-1">
                                                                {(outcome.title || outcome.type || 'Item')} · {outcome.status || (outcome.success ? 'success' : 'info')}
                                                                {outcome.reason ? ` · ${outcome.reason}` : ''}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </details>
                                            ))}
                                            {!runs.length && <p className="text-sm text-muted">No runs recorded yet.</p>}
                                        </div>
                                    </div>
                                )}
                                {activeSection === 'calendar' && (
                                    <div className="glass-card-sm p-5 space-y-3">
                                        <h3 className="text-xl font-bold text-plex">Calendar</h3>
                                        <p className="text-sm text-muted">Rule-based eligibility schedule. Grace days are applied from this rule's creation date.</p>
                                        <div className="flex flex-wrap gap-2">
                                            {rules.map((rule: any) => (
                                                <button
                                                    key={`calendar-rule-tab-${rule.id}`}
                                                    type="button"
                                                    onClick={() => setCandidateRuleId(rule.id)}
                                                    className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors ${candidateRuleId === rule.id ? 'bg-plex text-background border-plex' : 'bg-background/30 text-text border-white/5 hover:border-plex/40'}`}
                                                >
                                                    {rule.name || 'Unnamed Rule'}
                                                </button>
                                            ))}
                                        </div>
                                        {selectedCandidateRule && (
                                            <p className="text-xs text-muted">
                                                Current rule: <span className="text-text font-semibold">{selectedCandidateRule.name || 'Unnamed Rule'}</span> · Grace Days: <span className="text-text font-semibold">{calendarEligibility.graceDays}</span> · Rule Age: <span className="text-text font-semibold">{calendarEligibility.daysSinceRuleCreated}</span> day(s)
                                            </p>
                                        )}
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedCalendarDate(ELIGIBLE_NOW_KEY)}
                                                className="text-left bg-background/30 border border-white/5 rounded-lg p-3 hover:border-plex/50 transition-colors"
                                                title="Titles that match this rule and whose grace window has elapsed."
                                            >
                                                <p className="text-xs text-muted">Eligible Now</p>
                                                <p className="text-2xl font-bold text-text mt-1">{calendarEligibility.eligibleNow.length}</p>
                                                <p className="text-[11px] text-muted mt-1">{formatReclaimSizeFromGB(calendarEligibility.eligibleNow.reduce((sum: number, item: any) => sum + Number(item.sizeGB || 0), 0))} reclaim now</p>
                                            </button>
                                            <div className="bg-background/30 border border-white/5 rounded-lg p-3" title="Number of future dates with delayed eligibility while this rule's grace period is active.">
                                                <p className="text-xs text-muted">Eligible Later Days</p>
                                                <p className="text-2xl font-bold text-text mt-1">{calendarEligibility.eligibleLaterByDay.length}</p>
                                            </div>
                                            <div className="bg-background/30 border border-white/5 rounded-lg p-3" title="Titles currently matching this rule but still waiting for grace to expire.">
                                                <p className="text-xs text-muted">Later Titles</p>
                                                <p className="text-2xl font-bold text-text mt-1">{calendarEligibility.eligibleLaterByDay.reduce((sum: number, day: any) => sum + Number(day.count || 0), 0)}</p>
                                            </div>
                                            <div className="bg-background/30 border border-white/5 rounded-lg p-3" title="Reclaim estimate from matches that are delayed by active grace days.">
                                                <p className="text-xs text-muted">Later Reclaim</p>
                                                <p className="text-2xl font-bold text-text mt-1">{formatReclaimSizeFromGB(calendarEligibility.eligibleLaterByDay.reduce((sum: number, day: any) => sum + Number(day.reclaimGB || 0), 0))}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-xs uppercase tracking-wider text-muted font-bold" title="Dates when currently matched titles become eligible once this rule's grace period expires.">Eligible Later by Date</p>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[700px] overflow-y-auto custom-scrollbar pr-1">
                                            {calendarEligibility.eligibleLaterByDay.slice(0, 120).map((day) => {
                                                const dateLabel = new Date(`${day.date}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
                                                return (
                                                    <button
                                                        key={`calendar-day-${day.date}`}
                                                        type="button"
                                                        onClick={() => setSelectedCalendarDate(day.date)}
                                                        className="text-left bg-background/30 border border-white/5 rounded-lg p-3 hover:border-plex/50 hover:bg-black/30 transition-colors"
                                                    >
                                                        <div className="flex items-center justify-between gap-2">
                                                            <p className="text-sm font-semibold text-text">{dateLabel}</p>
                                                            <span className="text-[11px] px-2 py-0.5 rounded bg-plex/20 text-plex font-semibold" title="Number of titles becoming eligible on this date.">{day.count}</span>
                                                        </div>
                                                        <p className="text-[11px] text-muted mt-1">{day.minDaysUntil} day(s) until eligible · {formatReclaimSizeFromGB(day.reclaimGB)} reclaim</p>
                                                        <div className="mt-2 flex -space-x-2">
                                                            {day.preview.map((item: any, idx: number) => (
                                                                <div key={`calendar-preview-${day.date}-${item.ratingKey}-${idx}`} className="w-8 h-8 rounded-full overflow-hidden border border-white/5 bg-black/50" title={`${item.title || 'Unknown Title'} • ${getEligibilityTooltip(item)}`}>
                                                                    {item.thumb ? (
                                                                        <img
                                                                            src={portalUrl(`/api/plex/image?path=${encodeURIComponent(item.thumb)}&width=64&height=64`)}
                                                                            alt={item.title}
                                                                            className="w-full h-full object-cover"
                                                                            loading="lazy"
                                                                        />
                                                                    ) : (
                                                                        <div className="w-full h-full" />
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                            {!calendarEligibility.eligibleLaterByDay.length && <p className="text-sm text-muted col-span-full">No delayed dates. Current matches are eligible now.</p>}
                                        </div>
                                    </div>
                                )}
                                {activeSection === 'calendar' && selectedCalendarGroup && (
                                    <div className="fixed inset-0 z-[1500] bg-black/70 backdrop-blur-[1px] flex items-center justify-center p-3 md:p-6" onClick={() => setSelectedCalendarDate(null)}>
                                        <div className="w-full max-w-6xl max-h-[86vh] bg-card/80 backdrop-blur-md border border-white/5 rounded-xl shadow-2xl p-4 md:p-5 overflow-y-auto custom-scrollbar" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-start justify-between gap-3 mb-3">
                                                <div>
                                                    <h4 className="text-xl font-bold text-plex">
                                                        {selectedCalendarGroup.title || new Date(`${selectedCalendarGroup.date}T00:00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                                                    </h4>
                                                    <p className="text-sm text-muted mt-1" title={selectedCalendarGroup.date === ELIGIBLE_NOW_KEY ? 'These titles currently match this rule and are eligible now.' : 'These titles match this rule but are waiting for the grace period to elapse.'}>
                                                        {selectedCalendarGroup.count} title(s) · {formatReclaimSizeFromGB(selectedCalendarGroup.reclaimGB)} reclaim
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    className="px-3 py-1.5 bg-border text-text rounded-md text-sm font-semibold hover:bg-opacity-80"
                                                    onClick={() => setSelectedCalendarDate(null)}
                                                >
                                                    Close
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-3">
                                                {selectedCalendarGroup.items.map((item: any, idx: number) => (
                                                    <div key={`calendar-modal-item-${selectedCalendarGroup.date}-${item.ratingKey}-${idx}`} className="bg-background/30 border border-white/5 rounded-lg overflow-hidden" title={getEligibilityTooltip(item)}>
                                                        <div className="aspect-[2/3] bg-black/40">
                                                            {item.thumb ? (
                                                                <img
                                                                    src={portalUrl(`/api/plex/image?path=${encodeURIComponent(item.thumb)}&width=240&height=360`)}
                                                                    alt={item.title}
                                                                    loading="lazy"
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-xs text-muted">No Poster</div>
                                                            )}
                                                        </div>
                                                        <div className="p-2">
                                                            <p className="text-xs text-text line-clamp-2">{item.title}</p>
                                                            <p className="text-[11px] text-muted mt-1">{item.libraryTitle || 'Unknown Library'}</p>
                                                            <p className="text-[11px] text-muted mt-1" title="Eligibility detail used by the backend.">
                                                                Last watch: {Number.isFinite(Number(item.daysSinceLastWatch)) ? `${Number(item.daysSinceLastWatch)}d ago` : 'n/a'} · Added: {Number.isFinite(Number(item.daysSinceAdded)) ? `${Number(item.daysSinceAdded)}d ago` : 'n/a'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {activeSection === 'storage' && (
                                    <div className="glass-card-sm p-5 space-y-4">
                                        <h3 className="text-xl font-bold text-plex">Storage Metrics</h3>
                                        <p className="text-sm text-muted">Deep storage projection per library based on indexed size and current rule matches.</p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                className="px-3 py-1.5 bg-border text-text rounded-md text-xs font-semibold hover:bg-opacity-80"
                                                onClick={() => loadStorageSummary(candidateRuleId || undefined)}
                                            >
                                                {storageSummaryLoading ? 'Refreshing...' : 'Refresh Summary'}
                                            </button>
                                            {selectedCandidateRule && (
                                                <p className="text-xs text-muted">Rule scope: <span className="text-text font-semibold">{selectedCandidateRule.name || 'Unnamed Rule'}</span></p>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                            <div className="bg-background/30 border border-white/5 rounded-lg p-3">
                                                <p className="text-xs text-muted">Library Size Before</p>
                                                <p className="text-2xl font-bold text-text">{formatReclaimSizeFromGB(Number(storageSummary?.totals?.beforeGB || 0))}</p>
                                            </div>
                                            <div className="bg-background/30 border border-white/5 rounded-lg p-3">
                                                <p className="text-xs text-muted">Projected Reclaim</p>
                                                <p className="text-2xl font-bold text-text">{formatReclaimSizeFromGB(Number(storageSummary?.totals?.reclaimGB || 0))}</p>
                                            </div>
                                            <div className="bg-background/30 border border-white/5 rounded-lg p-3">
                                                <p className="text-xs text-muted">Projected Size After</p>
                                                <p className="text-2xl font-bold text-text">{formatReclaimSizeFromGB(Number(storageSummary?.totals?.afterGB || 0))}</p>
                                            </div>
                                            <div className="bg-background/30 border border-white/5 rounded-lg p-3">
                                                <p className="text-xs text-muted">Reclaim Percent</p>
                                                <p className="text-2xl font-bold text-text">{Number(storageSummary?.totals?.reclaimPercent || 0).toFixed(1)}%</p>
                                            </div>
                                        </div>
                                        <div className="bg-background/30 border border-white/5 rounded-lg p-3">
                                            <div className="grid grid-cols-[minmax(0,2fr)_1fr_1fr_1fr_1fr] gap-2 px-2 py-1 text-[11px] uppercase tracking-wider text-muted font-bold border-b border-border">
                                                <span>Library</span>
                                                <span className="text-right">Before</span>
                                                <span className="text-right">Reclaim</span>
                                                <span className="text-right">After</span>
                                                <span className="text-right">Matched</span>
                                            </div>
                                            <div className="max-h-[420px] overflow-y-auto custom-scrollbar pr-1 space-y-1 mt-2">
                                                {(storageSummary?.libraries || []).map((row: any) => (
                                                    <div key={`storage-row-${row.libraryTitle}`} className="grid grid-cols-[minmax(0,2fr)_1fr_1fr_1fr_1fr] gap-2 px-2 py-2 text-sm bg-background/30 border border-white/5 rounded-lg items-center">
                                                        <span className="text-text line-clamp-1">{row.libraryTitle}</span>
                                                        <span className="text-muted text-right">{formatReclaimSizeFromGB(Number(row.totalSizeGB || 0))}</span>
                                                        <span className="text-right text-plex font-semibold">{formatReclaimSizeFromGB(Number(row.reclaimGB || 0))}</span>
                                                        <span className="text-muted text-right">{formatReclaimSizeFromGB(Number(row.afterSizeGB || 0))}</span>
                                                        <span className="text-muted text-right">{row.matchedItems || 0}</span>
                                                    </div>
                                                ))}
                                                {!storageSummaryLoading && !(storageSummary?.libraries || []).length && (
                                                    <p className="text-sm text-muted px-2 py-2">No storage summary yet. Refresh or load candidates/rules first.</p>
                                                )}
                                                {storageSummaryLoading && <p className="text-sm text-muted px-2 py-2">Loading storage summary...</p>}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            <div className="bg-background/30 border border-white/5 rounded-lg p-3">
                                                <p className="text-xs text-muted">Total Indexed Items</p>
                                                <p className="text-xl font-bold text-text">{Number(storageSummary?.totals?.items || 0)}</p>
                                            </div>
                                            <div className="bg-background/30 border border-white/5 rounded-lg p-3">
                                                <p className="text-xs text-muted">Matched Candidate Items</p>
                                                <p className="text-xl font-bold text-text">{Number(storageSummary?.totals?.matchedItems || 0)}</p>
                                            </div>
                                            <div className="bg-background/30 border border-white/5 rounded-lg p-3">
                                                <p className="text-xs text-muted">Libraries Covered</p>
                                                <p className="text-xl font-bold text-text">{Number(storageSummary?.totals?.libraries || 0)}</p>
                                            </div>
                                        </div>
                                        {storageSummary?.rulesConsidered?.length > 0 && (
                                            <div className="bg-background/30 border border-white/5 rounded-lg p-3">
                                                <p className="text-xs text-muted font-bold uppercase tracking-wider mb-2">Rules Included</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {storageSummary.rulesConsidered.map((rule: any) => (
                                                        <span key={`storage-rule-${rule.id}`} className="px-2 py-1 rounded bg-border text-xs text-text">{rule.name || 'Unnamed Rule'}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                                {activeSection === 'library' && (
                                    <div className="glass-card-sm p-5 space-y-3">
                                        <h3 className="text-xl font-bold text-plex">Rule Library</h3>
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                className="px-3 py-2 bg-border text-text rounded-md text-sm font-semibold"
                                                onClick={() => {
                                                    const blob = new Blob([JSON.stringify(rules, null, 2)], { type: 'application/json' });
                                                    const url = URL.createObjectURL(blob);
                                                    const a = document.createElement('a');
                                                    a.href = url;
                                                    a.download = `maintenance-rules-${Date.now()}.json`;
                                                    a.click();
                                                    URL.revokeObjectURL(url);
                                                    addToast('Rule export downloaded.');
                                                }}
                                            >
                                                Export Rules JSON
                                            </button>
                                            <button
                                                type="button"
                                                className="px-3 py-2 bg-plex text-background rounded-md text-sm font-semibold"
                                                onClick={async () => {
                                                    try {
                                                        const parsed = JSON.parse(libraryJsonInput || '[]');
                                                        if (!Array.isArray(parsed)) throw new Error('JSON must be an array of rules.');
                                                        await saveAllRules(parsed);
                                                        addToast('Imported rules saved.');
                                                    } catch (e: any) {
                                                        addToast(e.message || 'Invalid JSON import.', 'error');
                                                    }
                                                }}
                                            >
                                                Import Rules JSON
                                            </button>
                                        </div>
                                        <textarea
                                            className="w-full min-h-[240px] p-3 rounded-lg border border-border bg-card text-text text-xs font-mono"
                                            placeholder="Paste exported rules JSON here to import."
                                            value={libraryJsonInput}
                                            onChange={(e) => setLibraryJsonInput(e.target.value)}
                                        />
                                    </div>
                                )}
                                {activeSection === 'exclusions' && (
                                    <div className="glass-card-sm p-4 md:p-5 space-y-3">
                                        <h3 className="text-xl font-bold text-plex">Exclusions</h3>
                                        <p className="text-sm text-muted">Click posters to select them for bulk actions. Selected items show a checkmark overlay. Use the Exclude link under each title for one-off changes.</p>
                                        <div className="bg-background/30 border border-white/5 rounded-lg p-3 md:p-4 space-y-2.5">
                                            <div className="min-w-0 md:w-[220px] h-9">
                                                <CustomSelect
                                                    value={libraryBrowseId}
                                                    onChange={(value) => {
                                                        setLibraryBrowseId(value);
                                                        setLibraryBrowsePage(1);
                                                    }}
                                                    options={[
                                                        { label: 'All Libraries', value: 'all' },
                                                        ...libraryOptions.map((library) => ({
                                                            label: `${library.title} (${library.count})`,
                                                            value: library.id
                                                        }))
                                                    ]}
                                                />
                                            </div>
                                            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 items-center mt-1">
                                                <input
                                                    className="h-9 px-2.5 rounded border border-border bg-card text-text text-xs md:text-sm min-w-0"
                                                    placeholder="Search title..."
                                                    value={libraryBrowseSearch}
                                                    onChange={(e) => {
                                                        setLibraryBrowseSearch(e.target.value);
                                                        setLibraryBrowsePage(1);
                                                    }}
                                                />
                                                <button type="button" className="h-9 px-3 bg-border text-text rounded-md text-xs md:text-sm font-semibold whitespace-nowrap" onClick={loadLibraryBrowse}>Refresh</button>
                                            </div>
                                            <div className="grid grid-cols-[minmax(0,1fr)_auto] md:flex md:flex-wrap items-center gap-2">
                                                <button
                                                    type="button"
                                                    className="h-9 px-3 bg-border text-text rounded-md text-xs md:text-sm font-semibold whitespace-nowrap"
                                                    onClick={() => setSelectedExcludeKeys(libraryItems.map((item: any) => String(item.ratingKey || '')).filter(Boolean))}
                                                    disabled={!libraryItems.length}
                                                >
                                                    Select Page
                                                </button>
                                                <button
                                                    type="button"
                                                    className="h-9 px-3 bg-plex text-background rounded-md text-xs md:text-sm font-semibold whitespace-nowrap"
                                                    onClick={async () => {
                                                        if (!selectedExcludeKeys.length) {
                                                            addToast('Select posters to exclude first.', 'error');
                                                            return;
                                                        }
                                                        const merged = Array.from(new Set([...(preferences?.exclusions?.ratingKeys || []).map((v: string) => String(v)), ...selectedExcludeKeys]));
                                                        await updateRatingKeyExclusions(merged);
                                                        setSelectedExcludeKeys([]);
                                                        addToast(`Excluded ${selectedExcludeKeys.length} selected title(s).`);
                                                    }}
                                                >
                                                    Exclude Selected ({selectedExcludeKeys.length})
                                                </button>
                                                <button
                                                    type="button"
                                                    className="h-9 w-9 flex items-center justify-center bg-red-500/15 border border-red-500/40 text-red-300 rounded-md hover:bg-red-500/25 transition-colors"
                                                    onClick={() => setSelectedExcludeKeys([])}
                                                    title="Clear Selection"
                                                    aria-label="Clear Selection"
                                                >
                                                    <X className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="col-span-2 md:col-auto h-9 px-3 bg-border text-text rounded-md text-xs md:text-sm font-semibold whitespace-nowrap"
                                                    onClick={async () => {
                                                        if (!selectedExcludeKeys.length) {
                                                            addToast('Select posters to unexclude first.', 'error');
                                                            return;
                                                        }
                                                        const removedCount = selectedExcludeKeys.length;
                                                        const remaining = (preferences?.exclusions?.ratingKeys || []).map((v: string) => String(v)).filter((key: string) => !selectedExcludeKeys.includes(key));
                                                        await updateRatingKeyExclusions(remaining);
                                                        setSelectedExcludeKeys([]);
                                                        addToast(`Removed ${removedCount} selected exclusion(s).`);
                                                    }}
                                                >
                                                    Remove Selected Exclusions
                                                </button>
                                                <p className="col-span-2 text-[11px] md:text-xs text-muted w-full md:w-auto md:ml-auto md:text-right">Showing {libraryItems.length} of {libraryBrowseTotal} titles · page {libraryBrowsePage}</p>
                                            </div>
                                            {libraryBrowseLoading ? (
                                                <p className="text-sm text-muted">Loading posters...</p>
                                            ) : (
                                                <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-8 gap-2 md:gap-3 max-h-[1240px] overflow-y-auto custom-scrollbar pr-1">
                                                    {libraryItems.map((item: any) => {
                                                        const key = String(item.ratingKey || '');
                                                        const selected = selectedExcludeKeys.includes(key);
                                                        const excluded = item.excluded || excludedRatingKeySet.has(key);
                                                        const toggleQuickExclude = async (event: React.MouseEvent) => {
                                                            event.preventDefault();
                                                            event.stopPropagation();
                                                            const currentKeys = (preferences?.exclusions?.ratingKeys || []).map((v: string) => String(v));
                                                            const nextKeys = excluded ? currentKeys.filter((v: string) => v !== key) : Array.from(new Set([...currentKeys, key]));
                                                            await updateRatingKeyExclusions(nextKeys);
                                                            addToast(excluded ? `Removed exclusion for ${item.title}.` : `Excluded ${item.title}.`);
                                                        };
                                                        return (
                                                            <div
                                                                key={`exclude-item-${key}`}
                                                                className={`relative w-full border rounded-lg overflow-hidden transition-all ${selected ? 'border-plex bg-plex/5 shadow-[0_0_0_1px_rgba(229,160,13,0.35)]' : 'border-white/5'} ${excluded ? 'ring-1 ring-red-500/60' : ''}`}
                                                            >
                                                                <button
                                                                    type="button"
                                                                    className="w-full text-left"
                                                                    aria-pressed={selected}
                                                                    onClick={() => {
                                                                        setSelectedExcludeKeys((prev) => prev.includes(key) ? prev.filter((v) => v !== key) : [...prev, key]);
                                                                    }}
                                                                >
                                                                    <div className="aspect-[2/3] bg-black/40 relative">
                                                                        {item.thumb ? (
                                                                            <img src={portalUrl(`/api/plex/image?path=${encodeURIComponent(item.thumb)}&width=220&height=330`)} alt={item.title} loading="lazy" className="w-full h-full object-cover" />
                                                                        ) : (
                                                                            <div className="w-full h-full flex items-center justify-center text-xs text-muted">No Poster</div>
                                                                        )}
                                                                        {selected && (
                                                                            <>
                                                                                <div className="absolute inset-0 bg-plex/20 pointer-events-none" />
                                                                                <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-plex text-background flex items-center justify-center shadow-md pointer-events-none">
                                                                                    <Check className="w-3.5 h-3.5" strokeWidth={3} />
                                                                                </div>
                                                                            </>
                                                                        )}
                                                                        {excluded && (
                                                                            <span className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded bg-red-600/95 text-white font-bold pointer-events-none">
                                                                                Excluded
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <p className="px-2 pt-2 text-xs text-text line-clamp-2">{item.title}</p>
                                                                </button>
                                                                <div className="px-2 pb-2 pt-1 flex items-center justify-between gap-2 min-h-[2rem]">
                                                                    <p className="text-[11px] text-muted truncate">{item.libraryTitle}</p>
                                                                    <button
                                                                        type="button"
                                                                        className={`text-[10px] font-semibold shrink-0 whitespace-nowrap transition-colors ${excluded ? 'text-muted hover:text-text' : 'text-plex hover:text-plex-hover'}`}
                                                                        onClick={toggleQuickExclude}
                                                                    >
                                                                        {excluded ? 'Unexclude' : 'Exclude'}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                    {!libraryItems.length && <p className="text-sm text-muted col-span-full">No titles found for the current library/search.</p>}
                                                </div>
                                            )}
                                            <div className="flex items-center justify-between">
                                                <button
                                                    type="button"
                                                    className="px-3 py-1.5 bg-border text-text rounded-md text-sm font-semibold disabled:opacity-50"
                                                    disabled={libraryBrowsePage <= 1}
                                                    onClick={() => setLibraryBrowsePage((p) => Math.max(1, p - 1))}
                                                >
                                                    Previous
                                                </button>
                                                <button
                                                    type="button"
                                                    className="px-3 py-1.5 bg-border text-text rounded-md text-sm font-semibold disabled:opacity-50"
                                                    disabled={(libraryBrowsePage * libraryBrowseLimit) >= libraryBrowseTotal}
                                                    onClick={() => setLibraryBrowsePage((p) => p + 1)}
                                                >
                                                    Next
                                                </button>
                                            </div>
                                        </div>
                                        <div className="bg-background/30 border border-white/5 rounded-lg p-3 space-y-3">
                                            <h4 className="text-sm font-bold text-text">Current Exclusions (Resolved)</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                <div className="bg-background/30 border border-white/5 rounded-lg p-3 space-y-2">
                                                    <p className="text-xs font-bold text-muted uppercase tracking-wider">Excluded Titles by RatingKey</p>
                                                    <div className="space-y-2 max-h-52 overflow-y-auto custom-scrollbar pr-1">
                                                        {exclusionsSummary.ratingKeys.map((entry: any) => (
                                                            <div key={`resolved-key-${entry.ratingKey}`} className="flex items-center gap-2 bg-background/30 border border-white/5 rounded-md p-2">
                                                                <div className="w-10 h-14 rounded overflow-hidden bg-black/40 flex-shrink-0">
                                                                    {entry.thumb ? (
                                                                        <img src={portalUrl(`/api/plex/image?path=${encodeURIComponent(entry.thumb)}&width=80&height=120`)} alt={entry.title} className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center text-[9px] text-muted">No Poster</div>
                                                                    )}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-xs text-text line-clamp-2">{entry.title}</p>
                                                                    <p className="text-[10px] text-muted line-clamp-1">{entry.libraryTitle || entry.ratingKey}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {!exclusionsSummary.ratingKeys.length && <p className="text-xs text-muted">No ratingKey exclusions set.</p>}
                                                    </div>
                                                </div>
                                                <div className="bg-background/30 border border-white/5 rounded-lg p-3 space-y-2">
                                                    <p className="text-xs font-bold text-muted uppercase tracking-wider">Excluded Title Terms</p>
                                                    <div className="space-y-1.5 max-h-52 overflow-y-auto custom-scrollbar pr-1">
                                                        {exclusionsSummary.titles.map((entry: any) => (
                                                            <div key={`resolved-title-${entry.title}`} className="bg-background/30 border border-white/5 rounded-md px-2 py-1.5">
                                                                <p className="text-xs text-text line-clamp-1">{entry.title}</p>
                                                                <p className="text-[10px] text-muted">{entry.matchCount} indexed match(es)</p>
                                                            </div>
                                                        ))}
                                                        {!exclusionsSummary.titles.length && <p className="text-xs text-muted">No title exclusions set.</p>}
                                                    </div>
                                                </div>
                                                <div className="bg-background/30 border border-white/5 rounded-lg p-3 space-y-2">
                                                    <p className="text-xs font-bold text-muted uppercase tracking-wider">Excluded Libraries</p>
                                                    <div className="space-y-1.5 max-h-52 overflow-y-auto custom-scrollbar pr-1">
                                                        {exclusionsSummary.libraries.map((entry: any) => (
                                                            <div key={`resolved-library-${entry.libraryTitle}`} className="bg-background/30 border border-white/5 rounded-md px-2 py-1.5">
                                                                <p className="text-xs text-text line-clamp-1">{entry.libraryTitle}</p>
                                                                <p className="text-[10px] text-muted">{entry.matchCount} indexed item(s)</p>
                                                            </div>
                                                        ))}
                                                        {!exclusionsSummary.libraries.length && <p className="text-xs text-muted">No library exclusions set.</p>}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            <div>
                                                <label className="text-xs text-muted font-bold uppercase">Title Exclusions (advanced, one per line)</label>
                                                <textarea
                                                    className="w-full min-h-[180px] p-3 rounded-lg border border-border bg-card text-text text-xs"
                                                    value={(preferences?.exclusions?.titles || []).join('\n')}
                                                    onChange={(e) => setPreferences((prev: any) => ({ ...prev, exclusions: { ...(prev.exclusions || {}), titles: e.target.value.split('\n').map(v => v.trim()).filter(Boolean) } }))}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-muted font-bold uppercase">Library Exclusions (advanced, one per line)</label>
                                                <textarea
                                                    className="w-full min-h-[180px] p-3 rounded-lg border border-border bg-card text-text text-xs"
                                                    value={(preferences?.exclusions?.libraries || []).join('\n')}
                                                    onChange={(e) => setPreferences((prev: any) => ({ ...prev, exclusions: { ...(prev.exclusions || {}), libraries: e.target.value.split('\n').map(v => v.trim()).filter(Boolean) } }))}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-muted font-bold uppercase">RatingKey Exclusions (advanced, one per line)</label>
                                                <textarea
                                                    className="w-full min-h-[180px] p-3 rounded-lg border border-border bg-card text-text text-xs"
                                                    value={(preferences?.exclusions?.ratingKeys || []).join('\n')}
                                                    onChange={(e) => setPreferences((prev: any) => ({ ...prev, exclusions: { ...(prev.exclusions || {}), ratingKeys: e.target.value.split('\n').map(v => v.trim()).filter(Boolean) } }))}
                                                />
                                            </div>
                                        </div>
                                        <button type="button" className="px-3 py-2 bg-plex text-background rounded-md text-sm font-semibold" onClick={async () => { await savePreferences(preferences); await loadExclusionsSummary(); addToast('Exclusions saved.'); }}>
                                            Save Exclusions
                                        </button>
                                    </div>
                                )}
                                {activeSection === 'settings' && (
                                    <div className="glass-card-sm p-5 space-y-4">
                                        <h3 className="text-xl font-bold text-plex">Maintenance Settings</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            <div className="bg-background/30 border border-white/5 rounded-lg p-3">
                                                <label className="text-xs text-muted font-bold uppercase block mb-2">Default Dry-run</label>
                                                <label className="text-sm text-muted flex items-center gap-2">
                                                    <input type="checkbox" checked={!!preferences?.global?.dryRunByDefault} onChange={(e) => setPreferences((prev: any) => ({ ...prev, global: { ...(prev.global || {}), dryRunByDefault: e.target.checked } }))} />
                                                    Enable by default
                                                </label>
                                            </div>
                                            <div className="bg-background/30 border border-white/5 rounded-lg p-3">
                                                <label className="text-xs text-muted font-bold uppercase block mb-2">Max Actions Per Run</label>
                                                <input type="number" min={1} className="w-full p-2 rounded border border-border bg-card text-text text-sm" value={preferences?.global?.maxActionsPerRun || 25} onChange={(e) => setPreferences((prev: any) => ({ ...prev, global: { ...(prev.global || {}), maxActionsPerRun: Math.max(1, Number(e.target.value) || 1) } }))} />
                                            </div>
                                            <div className="bg-background/30 border border-white/5 rounded-lg p-3">
                                                <label className="text-xs text-muted font-bold uppercase block mb-2">Require Confirm Token</label>
                                                <label className="text-sm text-muted flex items-center gap-2">
                                                    <input type="checkbox" checked={!!preferences?.global?.requireConfirmForDestructive} onChange={(e) => setPreferences((prev: any) => ({ ...prev, global: { ...(prev.global || {}), requireConfirmForDestructive: e.target.checked } }))} />
                                                    Required for destructive runs
                                                </label>
                                            </div>
                                        </div>
                                        <button type="button" className="px-3 py-2 bg-plex text-background rounded-md text-sm font-semibold" onClick={async () => { await savePreferences(preferences); addToast('Maintenance settings saved.'); }}>
                                            Save Maintenance Settings
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};


interface NavigationProps {
    currentRoute: string;
    onNavigate: (route: 'admin' | 'user' | 'status' | 'dashboard' | 'settings' | 'logs' | 'analytics' | 'mediastack' | 'maintenance') => void;
    onLogout: () => void;
    isAdmin: boolean;
    serverName: string;
    adminThumb?: string | null;
    customLogoUrl?: string | null;
    requestUrl: string;
    navOrder: string[];
    appVersion?: string;
    activeTheme: string;
    setActiveTheme: (theme: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentRoute, onNavigate, onLogout, isAdmin, serverName, adminThumb, customLogoUrl, requestUrl, navOrder, appVersion, activeTheme, setActiveTheme }) => {
    const serverIcon = customLogoUrl ? resolvePortalAssetUrl(customLogoUrl) : (adminThumb ? (adminThumb.startsWith('http') ? adminThumb : portalUrl(`/api/plex/image?path=${encodeURIComponent(adminThumb)}&width=256&height=256`)) : logoUrl());
    useEffect(() => {
        updateFavicon(serverIcon);
    }, [serverIcon]);

    const [mobileThemeOpen, setMobileThemeOpen] = useState(false);
    const mobileThemeRef = useRef<HTMLDivElement>(null);
    const [mobileThemePos, setMobileThemePos] = useState<{ top: number; right: number } | null>(null);

    useEffect(() => {
        if (!mobileThemeOpen) { setMobileThemePos(null); return; }
        if (mobileThemeRef.current) {
            const rect = mobileThemeRef.current.getBoundingClientRect();
            setMobileThemePos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
        }
    }, [mobileThemeOpen]);

    useEffect(() => {
        if (!mobileThemeOpen) return;
        const handler = (e: MouseEvent) => {
            if (mobileThemeRef.current && !mobileThemeRef.current.contains(e.target as Node)) {
                setMobileThemeOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [mobileThemeOpen]);

    const navItemsConfig: Record<string, { label: string; icon: React.FC<any>; route: string; adminOnly: boolean; href?: string; onClick?: (e: any) => void }> = {
        'home': { label: 'Home', icon: Home, route: 'user', adminOnly: false },
        'users': { label: 'Users', icon: Users, route: 'users', adminOnly: true },
        'discover': { label: 'Discover', icon: Film, route: 'dashboard', adminOnly: false },
        'status': { label: 'Status', icon: Activity, route: 'status', adminOnly: false },
        'logs': { label: 'Logs', icon: FileText, route: 'logs', adminOnly: true },
        'analytics': { label: 'Analytics', icon: BarChart3, route: 'analytics', adminOnly: false },
        'mediastack': { label: 'Calendar', icon: Layers, route: 'mediastack', adminOnly: false },
        'maintenance': { label: 'Cleaner', icon: Shield, route: 'maintenance', adminOnly: true },
        'request': { label: 'Request Content', icon: Sparkles, route: '', adminOnly: false, href: requestUrl },
        'settings': { label: 'Settings', icon: Settings, route: 'settings', adminOnly: true },
        'logout': { label: 'Logout', icon: LogOut, route: '', adminOnly: false, onClick: onLogout }
    };
    const normalizedNavOrder = (() => {
        const order = Array.isArray(navOrder) ? [...navOrder] : [];
        if (isAdmin && !order.includes('maintenance')) {
            const requestIndex = order.indexOf('request');
            if (requestIndex >= 0) order.splice(requestIndex, 0, 'maintenance');
            else order.push('maintenance');
        }
        return order;
    })();

    return (
        <>

            {/* Mobile Top Nav */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 nav-shell border-b z-50 flex items-center justify-between px-4 shadow-lg">
                <div className="flex items-center gap-3">
                    <img
                        src={serverIcon}
                        alt="Logo"
                        className={`w-8 h-8 ${customLogoUrl ? 'object-contain' : 'rounded-full object-cover'}`}
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = logoUrl();
                        }}
                    />
                    <span className="font-bold text-text uppercase tracking-widest text-sm">{serverName}</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative" ref={mobileThemeRef}>
                        <button
                            onClick={() => setMobileThemeOpen(v => !v)}
                            className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all ${mobileThemeOpen ? 'border-plex text-plex ring-1 ring-plex' : 'border-border text-muted hover:border-plex/50 hover:text-text'}`}
                            title="Change theme"
                        >
                            <Palette className="w-4 h-4" />
                        </button>
                        {mobileThemeOpen && mobileThemePos && ReactDOM.createPortal(
                            <div
                                style={{ position: 'fixed', top: mobileThemePos.top, right: mobileThemePos.right, zIndex: 99999 }}
                                className="bg-card border border-border rounded-lg shadow-2xl py-1 min-w-[140px]"
                            >
                                {[
                                    { label: 'Plex Dark', value: 'plex' },
                                    { label: 'Sleek Slate', value: 'slate' },
                                    { label: 'Nordic Frost', value: 'nordic' },
                                    { label: 'Jellyfin Purple', value: 'jellyfin' },
                                    { label: 'Emerald Green', value: 'emerald' },
                                    { label: 'Neon Midnight', value: 'midnight' },
                                ].map(opt => (
                                    <div
                                        key={opt.value}
                                        className={`px-4 py-2.5 cursor-pointer text-sm whitespace-nowrap transition-colors ${activeTheme === opt.value ? 'bg-plex/10 text-plex font-bold' : 'text-text hover:bg-border/40'}`}
                                        onMouseDown={e => { e.preventDefault(); setActiveTheme(opt.value); setMobileThemeOpen(false); }}
                                    >
                                        {opt.label}
                                    </div>
                                ))}
                            </div>,
                            document.body
                        )}
                    </div>
                    {isAdmin && (
                        <button onClick={(e) => { e.preventDefault(); onNavigate('logs'); }} className={`text-muted hover:text-text transition-colors ${currentRoute === 'logs' ? 'text-plex' : ''}`}>
                            <FileText className="w-5 h-5" />
                        </button>
                    )}
                    <button onClick={(e) => { e.preventDefault(); onLogout(); }} className="text-muted hover:text-red-500 transition-colors ml-1">
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </div>


            {/* Desktop Sidebar */}
            <div className="hidden md:flex flex-col w-72 nav-shell border-r p-6 sticky top-0 h-screen overflow-y-auto custom-scrollbar shadow-2xl">
                <div className="flex flex-col gap-2 mt-4">
                    {normalizedNavOrder.map((key) => {
                        const item = navItemsConfig[key];
                        if (!item) return null;
                        if (item.adminOnly && !isAdmin) return null;
                        if (key === 'logs') return null;

                        const isCurrent = item.route ? ['admin', 'user'].includes(currentRoute) && key === 'home' ? true : currentRoute === item.route : false;

                        if (item.href) {
                            return (
                                <a key={key} href={item.href} target="_blank" rel="noreferrer" className="flex items-center gap-4 p-3 text-muted no-underline rounded-lg transition-all font-medium hover:bg-white/5 hover:text-text">
                                    <item.icon className="w-5 h-5 flex-shrink-0" /> {item.label}
                                </a>
                            );
                        }

                        return (
                            <a key={key} href="#" className={`flex items-center gap-4 p-3 no-underline rounded-xl transition-all font-medium ${isCurrent ? 'nav-item-active' : 'text-muted hover:bg-white/5 hover:text-text'}`} onClick={(e) => { e.preventDefault(); if (item.onClick) item.onClick(e); else onNavigate(item.route as any); }}>
                                <item.icon className="w-5 h-5 flex-shrink-0" /> {item.label}
                            </a>
                        );
                    })}
                </div>

                <div className="flex flex-col items-center w-full mt-auto pt-10 pb-4 group cursor-default">
                    <div className={`relative mb-6 ${customLogoUrl ? 'w-32 flex items-center justify-center' : ''}`}>
                        {customLogoUrl ? (
                            <img
                                src={serverIcon}
                                alt="Server Logo"
                                className="max-w-32 max-h-32 object-contain drop-shadow-[0_0_24px_rgba(0,0,0,0.75)] group-hover:scale-105 transition-transform duration-700 ease-out"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = logoUrl();
                                }}
                            />
                        ) : (
                            <>
                        {/* Soft ambient background glow */}
                        <div className="absolute inset-0 bg-plex blur-[25px] opacity-20 group-hover:opacity-40 transition-opacity duration-700 rounded-full"></div>
                        {/* Spinning gradient border */}
                        <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-plex via-amber-300 to-orange-600 opacity-60 group-hover:opacity-100 group-hover:rotate-180 transition-all duration-1000 ease-out"></div>
                        {/* Inner cutout for the image */}
                        <div className="relative w-28 h-28 rounded-full p-[4px] shadow-2xl bg-card">
                            <div className="w-full h-full rounded-full overflow-hidden bg-background">
                                <img
                                    src={serverIcon}
                                    alt="Server Logo"
                                    className={`w-full h-full group-hover:scale-110 transition-transform duration-700 ease-out ${customLogoUrl ? 'object-contain p-3' : 'object-cover'}`}
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = logoUrl();
                                    }}
                                />
                            </div>
                        </div>
                            </>
                        )}
                    </div>

                    <div className="flex flex-col items-center text-center px-2">
                        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-gray-100 to-gray-400 drop-shadow-md tracking-tight leading-tight line-clamp-2">
                            {serverName}
                        </h2>
                        <div className="mt-2 flex items-center gap-2">
                            <div className="h-px w-6 bg-gradient-to-r from-transparent to-plex/50"></div>
                            <span className="text-[10px] uppercase tracking-[0.3em] text-plex font-bold drop-shadow-[0_0_8px_rgba(229,160,13,0.5)]">
                                Portal
                            </span>
                            <div className="h-px w-6 bg-gradient-to-l from-transparent to-plex/50"></div>
                        </div>
                        <div className="mt-4 mb-2 relative w-full px-2">
                            <Palette className="w-4 h-4 text-muted absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                            <CustomSelect
                                value={activeTheme}
                                onChange={setActiveTheme}
                                compact={true}
                                className="w-full [&_div]:pl-9"
                                options={[
                                    { label: 'Plex Dark', value: 'plex' },
                                    { label: 'Sleek Slate', value: 'slate' },
                                    { label: 'Nordic Frost', value: 'nordic' },
                                    { label: 'Jellyfin Purple', value: 'jellyfin' },
                                    { label: 'Emerald Green', value: 'emerald' },
                                    { label: 'Neon Midnight', value: 'midnight' },
                                ]}
                            />
                        </div>
                        {appVersion && (
                            <div className="mt-2 text-[10px] text-white/50 font-mono tracking-wider opacity-80 hover:opacity-100 transition-opacity">
                                {appVersion}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Bottom Nav */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 w-full nav-shell border-t z-50 pb-[env(safe-area-inset-bottom)]">
                <div className="flex justify-around items-center h-16">
                    {normalizedNavOrder.map((key) => {
                        const item = navItemsConfig[key];
                        if (!item) return null;
                        if (item.adminOnly && !isAdmin) return null;
                        if (key === 'logs' || key === 'logout') return null;

                        const isCurrent = item.route ? ['admin', 'user'].includes(currentRoute) && key === 'home' ? true : currentRoute === item.route : false;
                        const labelOverride = key === 'mediastack' ? 'Media' : key === 'request' ? 'Request' : item.label;

                        if (item.href) {
                            return (
                                <a key={key} href={item.href} target="_blank" rel="noreferrer" className="relative flex flex-col items-center justify-center gap-1 h-full text-muted flex-1 text-center text-[0.65rem] transition-colors hover:text-text">
                                    <item.icon className="w-5 h-5 flex-shrink-0" /> {labelOverride}
                                </a>
                            );
                        }

                        return (
                            <a key={key} href="#" className={`relative flex flex-col items-center justify-center gap-1 h-full flex-1 text-center text-[0.65rem] transition-colors ${isCurrent ? 'text-plex font-bold' : 'text-muted hover:text-text'}`} onClick={(e) => { e.preventDefault(); if (item.onClick) item.onClick(e); else onNavigate(item.route as any); }}>
                                <item.icon className="w-5 h-5 flex-shrink-0" /> {labelOverride}
                                {isCurrent && <div className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-plex shadow-[0_0_5px_rgba(229,160,13,0.8)]" />}
                            </a>
                        );
                    })}
                </div>
            </div>
        </>
    );
};

export const PublicInviteClaim: React.FC<{ code: string }> = ({ code }) => {
    const [info, setInfo] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [claimed, setClaimed] = useState(false);
    const [isClaiming, setIsClaiming] = useState(false);

    useEffect(() => {
        apiFetch(`/api/invites/${code}/info`).then(setInfo).catch(e => setError(e.message || 'Invalid invite link'));
    }, [code]);

    const handleClaim = useCallback(async (token: string) => {
        setIsClaiming(true);
        try {
            await apiFetch(`/api/invites/${code}/claim`, {
                method: 'POST',
                body: JSON.stringify({ pinId: token })
            });
            setClaimed(true);
        } catch (e: any) {
            setError(e.message || 'Failed to claim invite');
        } finally {
            setIsClaiming(false);
        }
    }, [code]);

    useEffect(() => {
        const hash = window.location.hash;
        if (hash.startsWith('#auth/')) {
            const token = hash.split('/')[1];
            if (token) {
                window.location.hash = ''; // clear hash
                handleClaim(token);
            }
        }
    }, [handleClaim]);

    const handlePlexLogin = async () => {
        setIsClaiming(true);
        setError(null);
        try {
            const data = await apiFetch('/api/auth/plex/login', { method: 'POST' });
            const clientId = data.clientIdentifier || data.clientId || '';
            const forwardUrl = window.location.origin + portalUrl('/invite/' + code) + '#auth/' + data.id;
            const authUrl = `https://app.plex.tv/auth#?clientID=${encodeURIComponent(clientId)}&code=${data.code}&context[device][product]=Server%20Manager%20Portal&forwardUrl=${encodeURIComponent(forwardUrl)}`;
            window.location.href = authUrl;
        } catch (error) {
            setError('Failed to initiate Plex login');
            setIsClaiming(false);
        }
    };

    if (error) return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center max-w-md w-full animate-fade-in mx-auto px-4 mt-20">
            <div className="bg-red-500/10 border border-red-500/30 p-8 rounded-2xl w-full">
                <h2 className="text-2xl font-bold text-red-500 mb-4">Invite Error</h2>
                <p className="text-text">{error}</p>
                <a href={portalUrl('/')} className="mt-6 inline-block text-plex hover:underline font-bold">Return to Home</a>
            </div>
        </div>
    );

    if (claimed) return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center max-w-md w-full animate-fade-in mx-auto px-4 mt-20">
            <div className="bg-green-500/10 border border-green-500/30 p-8 rounded-2xl w-full">
                <h2 className="text-3xl font-bold text-green-500 mb-4">Success!</h2>
                <p className="text-text mb-6">You have successfully claimed your invite to <strong className="text-plex">{info?.serverName}</strong>. Check your email or open Plex to accept the shared server invite!</p>
                <a href={portalUrl('/')} className="inline-block px-6 py-3 bg-plex text-background font-bold rounded-lg hover:bg-plex-hover transition-colors shadow-lg">Go to Dashboard</a>
            </div>
        </div>
    );

    if (!info) return <Loader isLoading={true} />;

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-lg w-full animate-fade-in mx-auto px-4 mt-20">
            <div className="relative mb-8">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-plex rounded-full blur-[50px] opacity-20 pointer-events-none"></div>
                {info.customLogoUrl || info.thumb ? (
                    <img src={resolvePortalAssetUrl(info.customLogoUrl || info.thumb)} alt="Server Logo" className="w-32 h-32 object-cover rounded-full border-2 border-plex drop-shadow-[0_0_15px_rgba(229,160,13,0.25)] relative z-10" onError={(e) => { e.currentTarget.src = logoUrl(); e.currentTarget.className = 'w-40 object-contain drop-shadow-[0_0_15px_rgba(229,160,13,0.25)] relative z-10'; }} />
                ) : (
                    <img src={logoUrl()} alt="Server Logo" className="w-40 object-contain drop-shadow-[0_0_15px_rgba(229,160,13,0.25)] relative z-10" onError={(e) => e.currentTarget.style.display = 'none'} />
                )}
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-text mb-4">You've been invited!</h1>
            <p className="text-xl text-muted mb-8 leading-relaxed">
                You have been invited to join <strong className="text-plex">{info.serverName}</strong> for a period of <strong className="text-plex">{info.durationDays} days</strong>.
            </p>

            <div className="w-full mb-8">
                <LivePlexStats />
            </div>

            <button
                onClick={handlePlexLogin}
                disabled={isClaiming}
                className="w-full max-w-sm px-6 py-4 bg-plex text-background text-lg font-bold rounded-xl hover:bg-plex-hover transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-plex/20 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isClaiming ? 'Claiming...' : 'Sign in with Plex to Claim'}
            </button>
            <p className="mt-6 text-sm text-muted">You will be redirected to Plex.tv to securely authenticate your account.</p>
        </div>
    );
};
