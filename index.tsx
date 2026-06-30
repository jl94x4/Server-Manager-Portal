
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Home, Film, Activity, Sparkles, LogOut, Settings, FileText, BarChart3, Users, PlaySquare, TrendingUp, X, Star, Layers, HardDrive, Calendar, Tv, Clock, DownloadCloud, MonitorSmartphone, Copy, ChevronUp, ChevronDown, List, Palette, Music, Play, Shield, CheckCircle, AlertCircle, RefreshCw, ChevronLeft, ChevronRight, Trophy, PlayCircle, Coffee, Compass, PieChart, Clapperboard, AlertTriangle, Check, Cpu, Monitor, LineChart as LucideLineChart } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend } from 'recharts';

declare global {
    interface Window {
        __USE_24_HOUR_CLOCK__?: boolean;
    }
}

interface CustomSelectProps {
    id?: string;
    value: string | number;
    onChange: (value: string) => void;
    options: { label: string; value: string | number }[];
    className?: string;
    compact?: boolean;
}

import ReactDOM from 'react-dom';

const CustomSelect: React.FC<CustomSelectProps> = ({ id, value, onChange, options, className, compact = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [dropPos, setDropPos] = useState<{ top: number; left: number; width: number } | null>(null);
    const triggerRef = useRef<HTMLDivElement>(null);
    const dropRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const t = triggerRef.current;
            const d = dropRef.current;
            if (t && !t.contains(event.target as Node) && d && !d.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const openDropdown = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setDropPos({ top: rect.bottom + window.scrollY + 6, left: rect.left + window.scrollX, width: rect.width });
        }
        setIsOpen(v => !v);
    };

    const selectedOption = options.find(opt => String(opt.value) === String(value)) || options[0];

    const dropdown = isOpen && dropPos ? ReactDOM.createPortal(
        <div
            ref={dropRef}
            style={{ position: 'absolute', top: dropPos.top, left: dropPos.left, minWidth: dropPos.width, zIndex: 99999 }}
            className="bg-[#1e2329] border border-border rounded-lg shadow-2xl py-1 max-h-64 overflow-y-auto custom-scrollbar"
        >
            {options.map(opt => (
                <div
                    key={String(opt.value)}
                    className={`px-4 py-2.5 cursor-pointer hover:bg-white/10 transition-colors whitespace-nowrap text-sm ${String(value) === String(opt.value) ? 'bg-plex/10 text-plex font-bold' : 'text-text'}`}
                    onMouseDown={e => { e.preventDefault(); onChange(String(opt.value)); setIsOpen(false); }}
                >
                    {opt.label}
                </div>
            ))}
        </div>,
        document.body
    ) : null;

    return (
        <div className={`relative ${className || ''}`} ref={triggerRef} id={id}>
            <div
                className={`flex justify-between items-center w-full cursor-pointer h-full rounded-lg border bg-background text-text transition-all ${compact ? 'px-3 py-2' : 'px-4 py-3'} ${isOpen ? 'border-plex ring-1 ring-plex' : 'border-border hover:border-plex/50'}`}
                onClick={openDropdown}
            >
                <span className={`truncate mr-4 font-medium ${compact ? 'text-xs' : 'text-sm'}`}>{selectedOption?.label || 'Select...'}</span>
                <span className={`text-[10px] transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
            </div>
            {dropdown}
        </div>
    );
};

const StyledCheckbox: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; label: string }> = ({ checked, onChange, label }) => (
    <label className="flex items-center gap-2 text-xs text-muted">
        <span className="relative inline-flex h-4 w-4 items-center justify-center">
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="peer sr-only"
            />
            <span className="h-4 w-4 rounded border border-border bg-background transition-colors peer-checked:border-plex peer-checked:bg-plex/20" />
            <Check className="pointer-events-none absolute h-3 w-3 text-plex opacity-0 transition-opacity peer-checked:opacity-100" />
        </span>
        {label}
    </label>
);


const hexToRgb = (hex: string) => {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) hex = hex.split('').map(x => x + x).join('');
    const r = parseInt(hex.slice(0, 2), 16) || 0;
    const g = parseInt(hex.slice(2, 4), 16) || 0;
    const b = parseInt(hex.slice(4, 6), 16) || 0;
    return `${r} ${g} ${b}`;
};

export let appConfirm: (message: string, onConfirm: () => void) => void = () => { console.warn('appConfirm not initialized'); };

const ConfirmModal: React.FC<{ isOpen: boolean; message: string; onConfirm: () => void; onCancel: () => void; }> = ({ isOpen, message, onConfirm, onCancel }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-background border border-border rounded-xl shadow-2xl p-6 max-w-sm w-full animate-slide-up">
                <h3 className="text-xl font-bold mb-4 text-text">Are you sure?</h3>
                <p className="text-muted mb-8 text-sm">{message}</p>
                <div className="flex gap-4 justify-end">
                    <button className="px-4 py-2 rounded-lg font-medium bg-black/20 hover:bg-black/40 transition-colors text-text border border-border" onClick={onCancel}>Cancel</button>
                    <button className="px-4 py-2 rounded-lg font-medium bg-plex hover:bg-plex-hover transition-colors text-background" onClick={onConfirm}>Confirm</button>
                </div>
            </div>
        </div>
    );
};

// --- Interfaces ---
interface User {
    id: string; // Plex Account ID
    username: string;
    email?: string;
    thumb?: string;
    joiningDate: string;
    expiryDate: string | null;
    plexAccessStatus: 'active' | 'pending' | 'revoked' | 'unknown';
    exemptFromCleanup?: boolean;
    isTrial?: boolean;
    optOutNewsletter?: boolean;
    lastLogin?: string;
}

interface PlexConfig {
    token: string;
    serverIdentifier: string;
    checkIntervalMinutes: number;
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPass: string;
    smtpFrom: string;
    smtpSecure: boolean;
    emailDaysBefore: number;
    newsletterFrequency: string;
    newsletterDay: number;
    publicDomain: string;
    requestUrl?: string;
    contactUrl?: string;
}

interface AppSettings {
    token?: string;
    serverIdentifier?: string;
    checkIntervalMinutes: number;
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpPass?: string;
    smtpFrom?: string;
    smtpSecure?: boolean;
    emailDaysBefore?: number;
    newsletterFrequency?: string;
    newsletterDay?: number;
    publicDomain?: string;
    requestUrl?: string;
    contactUrl?: string;
    inactiveCleanupEnabled?: boolean;
    inactiveCleanupDays?: number;
    sonarrUrl?: string;
    sonarrApiKey?: string;
    radarrUrl?: string;
    radarrApiKey?: string;
    tautulliUrl?: string;
    tautulliApiKey?: string;
    primaryColor?: string;
    navOrder?: string[];
}

interface PlexServer {
    name: string;
    identifier: string;
}

interface ToastMessage {
    id: number;
    message: string;
    type: 'success' | 'error';
}

interface DeletedUser {
    blockId: string;
    id?: string;
    plexId?: string;
    username?: string;
    email?: string;
    deletedAt?: string;
    deletedBy?: string;
}

interface AuditEntry {
    id: string;
    timestamp: string;
    event: string;
    actor?: { username?: string; email?: string; isAdmin?: boolean } | null;
    target?: { username?: string; email?: string } | null;
    details?: Record<string, any>;
}

type UserStatus = 'active' | 'expiring' | 'expired';

// --- Helper Functions ---
const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Never';
    return dateString.split('T')[0];
};

const getDaysUntilExpiry = (expiryDate: string | null): number | null => {
    if (!expiryDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const datePart = expiryDate.split('T')[0];
    const [year, month, day] = datePart.split('-').map(Number);
    const expiry = new Date(year, month - 1, day);
    expiry.setHours(0, 0, 0, 0);

    const diffTime = expiry.getTime() - today.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
};

const addMonths = (date: Date, months: number): Date => {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
};

const addYears = (date: Date, years: number): Date => {
    const d = new Date(date);
    d.setFullYear(d.getFullYear() + years);
    return d;
};

// --- API Helper ---

const formatTime = (date) => {
    try {
        const is24 = typeof window !== 'undefined' && (window as any).__USE_24_HOUR_CLOCK__ === true;
        const str = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: !is24 });
        return is24 ? str : str.replace(/^0:/, '12:');
    } catch (e) {
        return '--:--';
    }
};

const apiFetch = async (url: string, options: RequestInit = {}) => {
    const response = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...options.headers,
        },
        ...options,
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'An unknown API error occurred.' }));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }
    if (response.status === 204) return; // Handle No Content response
    return response.json();
};

const formatEventName = (event: string): string => {
    return event.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const formatDateTime = (dateString?: string): string => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const updateFavicon = (thumbUrl: string | null | undefined) => {
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        link.type = 'image/png';
        document.head.appendChild(link);
    }
    if (thumbUrl) {
        link.href = thumbUrl.startsWith('http') ? thumbUrl : `/api/plex/image?path=${encodeURIComponent(thumbUrl)}&width=32&height=32`;
    } else {
        link.href = '/static/logo.png';
    }
};

// --- Components ---

const Loader: React.FC<{ isLoading: boolean }> = ({ isLoading }) => {
    if (!isLoading) return null;
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-[3000]">
            <div className="border-4 border-border border-t-plex rounded-full w-12 h-12 animate-spin shadow-[0_0_15px_rgba(229,160,13,0.5)]"></div>
        </div>
    );
};

const Toast: React.FC<{ message: string; type: 'success' | 'error'; onDismiss: () => void }> = ({ message, type, onDismiss }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const animTimer = setTimeout(() => setIsVisible(true), 50);
        const timer = setTimeout(onDismiss, 5000);
        return () => {
            clearTimeout(animTimer);
            clearTimeout(timer);
        };
    }, [onDismiss]);

    return (
        <div
            className={`px-8 py-4 rounded-xl text-white font-medium shadow-2xl transition-all duration-300 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'
                } ${type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
        >
            {message}
        </div>
    );
};

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
}> = ({ user, onEdit, onDelete, onRevoke, isConfigured, isSelected, onSelect }) => {
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
                        <img src={user.thumb} alt={user.username} className="w-10 h-10 rounded-full object-cover border border-border flex-shrink-0" />
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
                    <span className="text-muted text-xs uppercase tracking-wider font-bold">Plex</span>
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


const InvitesSettings: React.FC<{ addToast: (msg: string, type: 'success' | 'error') => void }> = ({ addToast }) => {
    const [invites, setInvites] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [durationDays, setDurationDays] = useState(30);
    const [maxUses, setMaxUses] = useState<string | number>(1);
    const [emailInvite, setEmailInvite] = useState('');
    const [emailing, setEmailing] = useState(false);
    const [libraries, setLibraries] = useState<any[]>([]);
    const [selectedLibraries, setSelectedLibraries] = useState<string[]>([]);

    const fetchInvites = useCallback(async () => {
        try {
            const data = await apiFetch('/api/invites');
            setInvites(data);
            const libData = await apiFetch('/api/plex/libraries').catch(() => []);
            setLibraries(libData || []);
        } catch (e) {
            addToast('Failed to load invites', 'error');
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => { fetchInvites(); }, [fetchInvites]);

    const handleCreate = async () => {
        try {
            await apiFetch('/api/invites', {
                method: 'POST',
                body: JSON.stringify({ durationDays, maxUses, libraryIds: selectedLibraries })
            });
            addToast('Invite link created', 'success');
            fetchInvites();
        } catch (e: any) {
            addToast(e.message || 'Error creating invite', 'error');
        }
    };

    const handleEmailInvite = async () => {
        if (!emailInvite) return addToast('Please enter an email address', 'error');
        setEmailing(true);
        try {
            await apiFetch('/api/invites/email', {
                method: 'POST',
                body: JSON.stringify({ email: emailInvite, durationDays, libraryIds: selectedLibraries })
            });
            addToast('Email invite sent!', 'success');
            setEmailInvite('');
            fetchInvites();
        } catch (e: any) {
            addToast(e.message || 'Error sending email invite', 'error');
        } finally {
            setEmailing(false);
        }
    };

    const handleDelete = async (code: string) => {
        appConfirm('Are you sure you want to delete this invite link?', async () => {
            try {
                await apiFetch(`/api/invites/${code}`, { method: 'DELETE' });
                addToast('Invite link deleted', 'success');
                fetchInvites();
            } catch (e: any) {
                addToast(e.message || 'Error deleting invite', 'error');
            }
        });
    };

    const handleCopy = (code: string) => {
        navigator.clipboard.writeText(`${window.location.origin}/invite/${code}`);
        addToast('Invite link copied to clipboard!', 'success');
    };

    if (loading) return <div className="text-muted">Loading invites...</div>;

    return (
        <div className="animate-fade-in mb-8">
            <h3 className="text-xl font-bold text-plex mb-4 border-b border-border pb-2">Automated Invite Links</h3>
            <p className="text-sm text-muted mb-6">Generate unique links to automatically invite users to your Plex server.</p>

            <div className="bg-black/20 p-4 md:p-6 rounded-xl border border-border mb-8 shadow-sm">
                <h4 className="font-bold mb-4">Create New Invite Link</h4>
                <div className="flex flex-col md:flex-row gap-4 items-end mb-6">
                    <div className="flex-1 w-full">
                        <label className="block text-sm mb-1 font-medium">Duration (Days)</label>
                        <input type="number" min="1" className="w-full p-2.5 rounded-lg bg-background border border-border text-text outline-none focus:border-plex" value={durationDays} onChange={e => setDurationDays(Number(e.target.value))} />
                    </div>
                    <div className="flex-1 w-full">
                        <label className="block text-sm mb-1 font-medium">Max Uses (Number or 'unlimited')</label>
                        <input type="text" className="w-full p-2.5 rounded-lg bg-background border border-border text-text outline-none focus:border-plex" value={maxUses} onChange={e => setMaxUses(e.target.value)} />
                    </div>
                    <button className="w-full md:w-auto px-6 py-2.5 bg-plex text-background font-bold rounded-lg hover:bg-plex-hover transition-colors shadow-lg" onClick={handleCreate}>Generate Link</button>
                </div>

                {libraries.length > 0 && (
                    <div className="mb-6">
                        <label className="block text-sm mb-2 font-medium">Libraries to Share (Leave unselected to share ALL libraries)</label>
                        <div className="flex flex-wrap gap-2">
                            {libraries.map(lib => (
                                <label key={lib.id} className="flex items-center gap-2 bg-background border border-border px-3 py-2 rounded-lg cursor-pointer hover:border-plex transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={selectedLibraries.includes(lib.id)}
                                        onChange={(e) => {
                                            if (e.target.checked) setSelectedLibraries([...selectedLibraries, lib.id]);
                                            else setSelectedLibraries(selectedLibraries.filter(id => id !== lib.id));
                                        }}
                                        className="accent-plex"
                                    />
                                    <span className="text-sm font-medium">{lib.title}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                <div className="border-t border-border/50 pt-6">
                    <h4 className="font-bold mb-4">Direct Email Invite</h4>
                    <p className="text-sm text-muted mb-4">Send a 1-time use invite directly to a user's email address (uses the Duration defined above).</p>
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 w-full">
                            <label className="block text-sm mb-1 font-medium">Email Address</label>
                            <input type="email" placeholder="user@example.com" className="w-full p-2.5 rounded-lg bg-background border border-border text-text outline-none focus:border-plex" value={emailInvite} onChange={e => setEmailInvite(e.target.value)} />
                        </div>
                        <button disabled={emailing} className="w-full md:w-auto px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-lg disabled:opacity-50" onClick={handleEmailInvite}>
                            {emailing ? 'Sending...' : 'Send Email Invite'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                        <tr className="border-b border-border text-muted text-sm uppercase tracking-wider">
                            <th className="p-3">Invite Link</th>
                            <th className="p-3">Duration</th>
                            <th className="p-3">Uses</th>
                            <th className="p-3">Libraries</th>
                            <th className="p-3">Created</th>
                            <th className="p-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invites.length === 0 ? (
                            <tr><td colSpan={6} className="p-8 text-center text-muted">No active invites. Create one above!</td></tr>
                        ) : invites.map(inv => (
                            <tr key={inv.code} className="border-b border-border/50 hover:bg-white/5 transition-colors">
                                <td className="p-3">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-sm text-plex select-all">{window.location.origin}/invite/{inv.code}</span>
                                        <button onClick={() => handleCopy(inv.code)} className="text-muted hover:text-plex transition-colors p-1" title="Copy Link">
                                            <Copy size={16} />
                                        </button>
                                    </div>
                                </td>
                                <td className="p-3 font-medium">{inv.durationDays} days</td>
                                <td className="p-3">
                                    <div className="font-medium">{inv.maxUses === 'unlimited' ? 'Unlimited' : `${inv.currentUses} / ${inv.maxUses}`}</div>
                                    {inv.usedBy && inv.usedBy.length > 0 && (
                                        <div className="mt-1.5 flex flex-wrap gap-1 max-w-[200px]">
                                            {inv.usedBy.map((u: any, idx: number) => (
                                                <span key={idx} className="text-[10px] text-plex bg-plex/10 border border-plex/20 px-1.5 py-0.5 rounded shadow-sm" title={`Claimed on ${new Date(u.date).toLocaleString()} by ${u.email}`}>
                                                    {u.username}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </td>
                                <td className="p-3 text-sm">
                                    {inv.libraryIds && inv.libraryIds.length > 0
                                        ? libraries.filter(l => inv.libraryIds.includes(l.id)).map(l => l.title).join(', ') || `${inv.libraryIds.length} selected`
                                        : <span className="text-plex opacity-80">All Libraries</span>}
                                </td>
                                <td className="p-3 text-muted text-sm">
                                    {new Date(inv.createdAt).toLocaleDateString()}
                                    {inv.sentTo && <div className="text-xs text-blue-400 mt-1">Sent to: {inv.sentTo}</div>}
                                </td>
                                <td className="p-3 text-right">
                                    <button onClick={() => handleDelete(inv.code)} className="text-red-500 hover:text-red-400 font-bold border border-red-500/30 px-3 py-1 rounded hover:bg-red-500/10 transition-colors text-xs">Revoke</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


// ─────────────────────────────────────────────────────────────────────────────
// Stream Kill Rules Panel
// ─────────────────────────────────────────────────────────────────────────────
const RULE_FIELDS = [
    { value: 'isTranscoding', label: 'Is Transcoding', type: 'bool' as const },
    { value: 'videoResolution', label: 'Video Resolution', type: 'select' as const, options: ['4k', '1080', '720', '480', 'sd'] },
    { value: 'transcodeVideoDecision', label: 'Transcode Decision', type: 'select' as const, options: ['transcode', 'copy', 'directplay'] },
    { value: 'mediaType', label: 'Media Type', type: 'select' as const, options: ['movie', 'episode', 'track'] },
    { value: 'state', label: 'Playback State', type: 'select' as const, options: ['playing', 'paused', 'buffering'] },
    { value: 'sessionLocation', label: 'Connection Location', type: 'select' as const, options: ['lan', 'wan', 'cellular'] },
    { value: 'videoCodec', label: 'Video Codec', type: 'text' as const },
    { value: 'audioCodec', label: 'Audio Codec', type: 'text' as const },
    { value: 'bandwidth', label: 'Bandwidth (Mbps)', type: 'number' as const },
    { value: 'user', label: 'Username', type: 'text' as const },
    { value: 'playerProduct', label: 'Player App', type: 'text' as const },
    { value: 'playerTitle', label: 'Player/Device Name', type: 'text' as const },
];
const KR_OP_TEXT = [{ value: 'equals', label: 'equals' }, { value: 'not_equals', label: 'not equals' }, { value: 'contains', label: 'contains' }, { value: 'not_contains', label: "doesn't contain" }];
const KR_OP_NUMBER = [{ value: 'equals', label: 'equals' }, { value: 'not_equals', label: 'not equals' }, { value: 'greater_than', label: 'greater than' }, { value: 'less_than', label: 'less than' }];
const KR_OP_BOOL = [{ value: 'equals', label: 'is' }];
const KR_OP_SELECT = [{ value: 'equals', label: 'equals' }, { value: 'not_equals', label: 'not equals' }];
function krGetOps(field: any) {
    if (!field) return KR_OP_TEXT;
    if (field.type === 'bool') return KR_OP_BOOL;
    if (field.type === 'number') return KR_OP_NUMBER;
    if (field.type === 'select') return KR_OP_SELECT;
    return KR_OP_TEXT;
}
function krMkCond() { return { id: (typeof crypto !== 'undefined' && (crypto as any).randomUUID ? (crypto as any).randomUUID() : Math.random().toString(36).slice(2)), field: 'isTranscoding', operator: 'equals', value: 'true' }; }
function krMkRule(): any { return { id: Date.now().toString(), name: 'New Rule', enabled: true, conditionLogic: 'AND', conditions: [krMkCond()], killMessage: 'Your stream has been stopped by the server administrator.' }; }

const KRConditionRow: React.FC<{ cond: any; onCh: (c: any) => void; onDel: () => void }> = ({ cond, onCh, onDel }) => {
    const fd = RULE_FIELDS.find(f => f.value === cond.field);
    const ops = krGetOps(fd);
    const onField = (v: string) => {
        const def = RULE_FIELDS.find(f => f.value === v);
        const dv = def?.type === 'bool' ? 'true' : (def && 'options' in def && def.options ? def.options[0] : '');
        onCh({ ...cond, field: v, value: dv, operator: krGetOps(def)[0].value });
    };
    const fieldOptions = RULE_FIELDS.map(f => ({ label: f.label, value: f.value }));
    const opOptions = ops.map(o => ({ label: o.label, value: o.value }));
    const boolOptions = [{ label: 'Yes / True', value: 'true' }, { label: 'No / False', value: 'false' }];
    const selectOptions = ('options' in (fd ?? {}) && (fd as any).options)
        ? (fd as any).options.map((o: string) => ({ label: o, value: o }))
        : [];

    return (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-black/30 rounded-lg border border-white/10">
            <CustomSelect
                value={cond.field}
                onChange={v => onField(v)}
                options={fieldOptions}
                className="flex-shrink-0 min-w-[160px]"
            />
            <CustomSelect
                value={cond.operator}
                onChange={v => onCh({ ...cond, operator: v })}
                options={opOptions}
                className="flex-shrink-0 min-w-[130px]"
            />
            {fd?.type === 'bool' ? (
                <CustomSelect
                    value={cond.value}
                    onChange={v => onCh({ ...cond, value: v })}
                    options={boolOptions}
                    className="flex-1 min-w-[110px]"
                />
            ) : fd?.type === 'select' ? (
                <CustomSelect
                    value={cond.value}
                    onChange={v => onCh({ ...cond, value: v })}
                    options={selectOptions}
                    className="flex-1 min-w-[110px]"
                />
            ) : (
                <input type={fd?.type === 'number' ? 'number' : 'text'} value={cond.value}
                    onChange={e => onCh({ ...cond, value: e.target.value })}
                    placeholder={fd?.type === 'number' ? 'e.g. 20' : 'e.g. Plex Web'}
                    className="flex-1 min-w-[100px] bg-background border border-border text-text rounded-lg px-3 py-2 text-sm focus:border-plex focus:ring-1 focus:ring-plex outline-none transition-all" />
            )}
            <button onClick={onDel} title="Remove" className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
        </div>
    );
};


const StreamKillRulesPanel: React.FC<{ addToast: (m: string, t?: 'success' | 'error') => void; registerSaveHandler?: (handler: (() => Promise<boolean>) | null) => void }> = ({ addToast, registerSaveHandler }) => {
    const [rules, setRules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [expanded, setExpanded] = useState<string | null>(null);

    useEffect(() => {
        apiFetch('/api/kill-rules').then(d => setRules(Array.isArray(d) ? d : []))
            .catch(() => addToast('Failed to load rules', 'error'))
            .finally(() => setLoading(false));
    }, []);

    const saveRules = async (r: any[]) => {
        setSaving(true);
        try {
            await apiFetch('/api/kill-rules', { method: 'POST', body: JSON.stringify(r) });
            addToast('Stream rules saved!');
            return true;
        } catch {
            addToast('Failed to save rules', 'error');
            return false;
        } finally { setSaving(false); }
    };
    const addRule = () => { const r = krMkRule(); const u = [...rules, r]; setRules(u); setExpanded(r.id); };
    const upd = (id: string, p: any) => setRules(prev => prev.map(r => r.id === id ? { ...r, ...p } : r));
    const del = (id: string) => setRules(prev => prev.filter(r => r.id !== id));
    const addCond = (id: string) => setRules(prev => prev.map(r => r.id === id ? { ...r, conditions: [...(r.conditions ?? []), krMkCond()] } : r));
    const updCond = (rId: string, i: number, c: any) => setRules(prev => prev.map(r => { if (r.id !== rId) return r; const cs = [...(r.conditions ?? [])]; cs[i] = c; return { ...r, conditions: cs }; }));
    const delCond = (rId: string, i: number) => setRules(prev => prev.map(r => r.id === rId ? { ...r, conditions: (r.conditions ?? []).filter((_: any, j: number) => j !== i) } : r));

    useEffect(() => {
        if (!registerSaveHandler) return;
        registerSaveHandler(() => saveRules(rules));
        return () => registerSaveHandler(null);
    }, [registerSaveHandler, rules]);

    if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-plex border-t-transparent rounded-full animate-spin" /></div>;

    return (
        <div className="mb-8 animate-fade-in">
            <h3 className="text-xl font-bold text-plex mb-1 border-b border-border pb-2 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                Stream Kill Rules
            </h3>
            <p className="text-sm text-muted mb-6 leading-relaxed">
                Define rules that automatically terminate Plex streams. Rules are evaluated every <strong className="text-text">15 seconds</strong>. Combine conditions using <strong className="text-plex">AND</strong> (all must match) or <strong className="text-plex">OR</strong> (any must match). The kill message appears on the user's Plex client screen.
            </p>
            {rules.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-border rounded-xl text-center gap-3 mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted opacity-40"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                    <p className="text-muted font-medium">No rules configured</p>
                    <p className="text-muted text-sm">Add a rule below to start protecting your server automatically.</p>
                </div>
            )}
            <div className="flex flex-col gap-4">
                {rules.map(rule => {
                    const isOpen = expanded === rule.id;
                    return (
                        <div key={rule.id} className={`rounded-xl border transition-all duration-200 overflow-hidden ${rule.enabled ? 'border-plex/40 bg-plex/5 shadow-[0_0_20px_rgba(229,160,13,0.06)]' : 'border-border bg-card/30 opacity-70'}`}>
                            <div className="flex items-center gap-3 p-4 cursor-pointer select-none" onClick={() => setExpanded(isOpen ? null : rule.id)}>
                                <button onClick={e => { e.stopPropagation(); upd(rule.id, { enabled: !rule.enabled }); }}
                                    className={`relative w-11 h-6 rounded-full flex-shrink-0 transition-colors ${rule.enabled ? 'bg-plex' : 'bg-border'}`}>
                                    <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${rule.enabled ? 'translate-x-5' : ''}`} />
                                </button>
                                <div className="flex-1 min-w-0">
                                    <input value={rule.name} onChange={e => { e.stopPropagation(); upd(rule.id, { name: e.target.value }); }} onClick={e => e.stopPropagation()}
                                        className="bg-transparent border-none outline-none text-text font-bold text-sm w-full placeholder-muted/50" placeholder="Rule name..." />
                                    <p className="text-muted text-xs mt-0.5">
                                        {rule.conditions?.length || 0} condition{rule.conditions?.length !== 1 ? 's' : ''} · Logic: <span className="text-plex font-bold">{rule.conditionLogic}</span> · <span className={rule.enabled ? 'text-green-400 font-bold' : 'text-muted'}>{rule.enabled ? 'Active' : 'Disabled'}</span>
                                    </p>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    <button onClick={e => { e.stopPropagation(); del(rule.id); }} title="Delete" className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                                    </button>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`text-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}><path d="m6 9 6 6 6-6" /></svg>
                                </div>
                            </div>
                            {isOpen && (
                                <div className="px-4 pb-5 border-t border-white/5 pt-4 flex flex-col gap-5">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <span className="text-muted text-xs font-bold uppercase tracking-wider">Match</span>
                                        <div className="flex bg-black/40 rounded-lg p-0.5 border border-white/5">
                                            {(['AND', 'OR'] as const).map(l => (
                                                <button key={l} onClick={() => upd(rule.id, { conditionLogic: l })}
                                                    className={`px-4 py-1.5 rounded-md text-xs font-black uppercase tracking-wider transition-all ${rule.conditionLogic === l ? 'bg-plex text-black shadow' : 'text-muted hover:text-text'}`}>{l}</button>
                                            ))}
                                        </div>
                                        <span className="text-muted text-xs font-bold uppercase tracking-wider">of the following conditions</span>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        {(rule.conditions || []).map((c: any, i: number) => (
                                            <KRConditionRow key={c.id ?? i} cond={c} onCh={nc => updCond(rule.id, i, nc)} onDel={() => delCond(rule.id, i)} />
                                        ))}
                                        <button onClick={() => addCond(rule.id)} className="flex items-center gap-2 text-plex text-sm font-bold hover:text-plex/80 transition-colors mt-1 w-fit py-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                                            Add Condition
                                        </button>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-wider text-muted mb-2 block">Kill Message <span className="normal-case font-normal text-white/30">(shown on user's Plex client)</span></label>
                                        <textarea value={rule.killMessage} onChange={e => upd(rule.id, { killMessage: e.target.value })} rows={2}
                                            className="w-full bg-background border border-border text-text rounded-lg px-3 py-2 text-sm focus:border-plex focus:ring-1 focus:ring-plex outline-none transition-all resize-none"
                                            placeholder="Your stream has been stopped by the server administrator." />
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-border">
                <button onClick={addRule} className="flex items-center gap-2 px-3 py-2 bg-border text-text rounded-lg font-bold text-xs hover:bg-opacity-80 transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                    Add New Rule
                </button>
                <button onClick={() => saveRules(rules)} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-plex text-background rounded-lg font-bold text-xs hover:opacity-90 transition-all disabled:opacity-50">
                    {saving ? <span className="w-4 h-4 border-2 border-background/50 border-t-transparent rounded-full animate-spin" /> : <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>}
                    Save Rules
                </button>
            </div>
        </div>
    );
};

const mkMaintenanceCondition = () => ({ field: 'daysSinceLastWatch', operator: 'greater_than', value: 30 });
const mkMaintenanceRule = () => ({
    id: `maintenance-${Date.now()}`,
    name: 'New Maintenance Rule',
    enabled: true,
    graceDays: 7,
    createdAt: new Date().toISOString(),
    settings: { dryRunByDefault: true, maxActionsPerRun: 25, requireConfirmForDestructive: true },
    collection: { enabled: false, nameTemplate: 'Leaving Soon - {{ruleName}}' },
    actions: { deleteFromArr: true, deleteFiles: true, unmonitor: false, qualityProfileId: 0 },
    filterTree: { logic: 'AND', conditions: [mkMaintenanceCondition()] }
});

const snapshotMaintenanceRules = (items: any[]) => JSON.stringify(
    (Array.isArray(items) ? items : []).map(({ overlay, _resetGrace, ...rule }) => rule)
);

const formatMaintenanceRunSummary = (run: any) => {
    const totals = run?.totals || {};
    const parts = [
        `${totals.matched ?? 0} matched`,
        `${totals.deleted ?? 0} deleted`,
        `${totals.skipped ?? 0} skipped`,
        `${totals.failed ?? 0} failed`
    ];
    return parts.join(', ');
};

const MaintenanceConditionRow: React.FC<{
    condition: any;
    fields: any[];
    onChange: (next: any) => void;
    onDelete: () => void;
}> = ({ condition, fields, onChange, onDelete }) => {
    const fieldDef = fields.find((f: any) => f.field === condition.field) || fields[0];
    const operatorOptions = (fieldDef?.operators || ['equals']).map((op: string) => ({ label: op.replace(/_/g, ' '), value: op }));
    const selectedOperator = operatorOptions.find((o: any) => o.value === condition.operator)?.value || operatorOptions[0]?.value || 'equals';
    const updateField = (field: string) => {
        const nextField = fields.find((f: any) => f.field === field) || fields[0];
        const nextOperator = (nextField?.operators || ['equals'])[0];
        const defaultValue = nextField?.type === 'boolean' ? false : (nextField?.type === 'number' ? 0 : (nextField?.options?.[0] ?? ''));
        onChange({ ...condition, field, operator: nextOperator, value: defaultValue });
    };
    return (
        <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_2fr_auto] gap-2 p-1">
            <CustomSelect
                value={condition.field}
                onChange={updateField}
                options={fields.map((f: any) => ({ label: f.label, value: f.field }))}
                compact
            />
            <CustomSelect
                value={selectedOperator}
                onChange={(value) => onChange({ ...condition, operator: value })}
                options={operatorOptions}
                compact
            />
            {fieldDef?.type === 'boolean' ? (
                <CustomSelect
                    value={String(condition.value)}
                    onChange={(value) => onChange({ ...condition, value: value === 'true' })}
                    options={[{ label: 'True', value: 'true' }, { label: 'False', value: 'false' }]}
                    compact
                />
            ) : fieldDef?.type === 'select' ? (
                <CustomSelect
                    value={String(condition.value ?? '')}
                    onChange={(value) => onChange({ ...condition, value })}
                    options={(fieldDef.options || []).map((opt: string) => ({ label: opt, value: opt }))}
                    compact
                />
            ) : (
                <input
                    type={fieldDef?.type === 'number' ? 'number' : 'text'}
                    value={Array.isArray(condition.value) ? condition.value.join(',') : String(condition.value ?? '')}
                    onChange={(e) => {
                        const raw = e.target.value;
                        if (selectedOperator === 'between' || selectedOperator === 'in' || selectedOperator === 'not_in') {
                            const parsed = raw.split(',').map(v => v.trim()).filter(Boolean);
                            onChange({ ...condition, value: fieldDef?.type === 'number' ? parsed.map(Number) : parsed });
                        } else {
                            onChange({ ...condition, value: fieldDef?.type === 'number' ? Number(raw) : raw });
                        }
                    }}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-text outline-none focus:border-plex"
                    placeholder={selectedOperator === 'between' ? 'min,max' : (selectedOperator === 'in' || selectedOperator === 'not_in') ? 'v1,v2' : 'value'}
                />
            )}
            <button type="button" onClick={onDelete} className="px-2 py-1 text-[11px] rounded-lg border border-red-500/40 text-red-300 hover:bg-red-500/10">Remove</button>
        </div>
    );
};

const LibraryMaintenancePanel: React.FC<{ addToast: (m: string, t?: 'success' | 'error') => void; onRulesUpdated?: () => void }> = ({ addToast, onRulesUpdated }) => {
    const [fields, setFields] = useState<any[]>([]);
    const [rules, setRules] = useState<any[]>([]);
    const [savedRulesSnapshot, setSavedRulesSnapshot] = useState('');
    const [runs, setRuns] = useState<any[]>([]);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [indexInfo, setIndexInfo] = useState<any>(null);
    const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [runningRuleId, setRunningRuleId] = useState<string | null>(null);
    const [previewRuleId, setPreviewRuleId] = useState<string | null>(null);
    const [resettingRuleId, setResettingRuleId] = useState<string | null>(null);
    const [togglingRuleId, setTogglingRuleId] = useState<string | null>(null);
    const [pinCollectionOnDestructiveRun, setPinCollectionOnDestructiveRun] = useState(false);

    const selectedRule = useMemo(() => rules.find((rule: any) => rule.id === selectedRuleId) || null, [rules, selectedRuleId]);
    const selectedPreview = useMemo(() => previewData.find((preview: any) => preview.ruleId === selectedRuleId) || null, [previewData, selectedRuleId]);

    const refreshIndexInfo = useCallback(async () => {
        const data = await apiFetch('/api/maintenance/index');
        setIndexInfo(data);
    }, []);

    const refreshRuns = useCallback(async () => {
        const data = await apiFetch('/api/maintenance/runs');
        setRuns(Array.isArray(data) ? data : []);
    }, []);

    const refreshRules = useCallback(async () => {
        const data = await apiFetch('/api/maintenance/rules');
        const normalized = Array.isArray(data) ? data : [];
        setRules(normalized);
        setSavedRulesSnapshot(snapshotMaintenanceRules(normalized));
        setSelectedRuleId(prev => {
            if (!prev) return null;
            return normalized.some((rule: any) => rule.id === prev) ? prev : null;
        });
    }, []);

    const isRuleDirty = useCallback((ruleId: string) => {
        if (!savedRulesSnapshot) return false;
        try {
            const saved = JSON.parse(savedRulesSnapshot) as any[];
            const savedRule = saved.find((rule: any) => rule.id === ruleId);
            const currentRule = rules.find((rule: any) => rule.id === ruleId);
            if (!savedRule || !currentRule) return !!currentRule;
            const stripTransient = ({ overlay, _resetGrace, ...rest }: any) => rest;
            return JSON.stringify(stripTransient(savedRule)) !== JSON.stringify(stripTransient(currentRule));
        } catch {
            return false;
        }
    }, [rules, savedRulesSnapshot]);

    const loadAll = useCallback(async () => {
        setLoading(true);
        try {
            const [catalog, preview, index] = await Promise.all([
                apiFetch('/api/maintenance/filter-options'),
                apiFetch('/api/maintenance/preview', {
                    method: 'POST',
                    body: JSON.stringify({ includeAll: false, limit: 40, includeArrDiagnostics: false })
                }),
                apiFetch('/api/maintenance/index')
            ]);
            setFields(Array.isArray(catalog?.fields) ? catalog.fields : []);
            setPreviewData(Array.isArray(preview?.previews) ? preview.previews : []);
            setIndexInfo(index);
            await Promise.all([refreshRules(), refreshRuns()]);
        } catch (e: any) {
            addToast(e.message || 'Failed to load maintenance module', 'error');
        } finally {
            setLoading(false);
        }
    }, [addToast, refreshRules, refreshRuns]);

    useEffect(() => { loadAll(); }, [loadAll]);

    const updateRule = (ruleId: string, patch: any) => setRules(prev => prev.map(rule => (rule.id === ruleId ? { ...rule, ...patch } : rule)));
    const addRule = (event?: React.MouseEvent) => {
        event?.preventDefault();
        event?.stopPropagation();
        const next = mkMaintenanceRule();
        setRules(prev => [...prev, next]);
        setSelectedRuleId(next.id);
    };
    const removeRule = (ruleId: string) => {
        setRules(prev => {
            const filtered = prev.filter(rule => rule.id !== ruleId);
            if (selectedRuleId === ruleId) {
                setSelectedRuleId(filtered[0]?.id || null);
            }
            return filtered;
        });
        setPreviewData(prev => prev.filter((p: any) => p.ruleId !== ruleId));
    };
    const deleteRule = async (ruleId: string, event?: React.MouseEvent) => {
        event?.preventDefault();
        event?.stopPropagation();
        const target = rules.find((rule: any) => rule.id === ruleId);
        if (!target) return;
        appConfirm(`Delete filter "${target.name || 'Unnamed Rule'}"?`, async () => {
            const previousRules = rules;
            const nextRules = rules.filter((rule: any) => rule.id !== ruleId);
            removeRule(ruleId);
            setSaving(true);
            try {
                await apiFetch('/api/maintenance/rules', { method: 'POST', body: JSON.stringify(nextRules) });
                addToast(`Deleted filter: ${target.name || 'Unnamed Rule'}.`);
                await Promise.all([refreshRules(), refreshRuns()]);
                onRulesUpdated?.();
            } catch (e: any) {
                setRules(previousRules);
                addToast(e.message || 'Failed to delete filter', 'error');
            } finally {
                setSaving(false);
            }
        });
    };
    const addCondition = (ruleId: string) => {
        setRules(prev => prev.map(rule => {
            if (rule.id !== ruleId) return rule;
            const existing = Array.isArray(rule?.filterTree?.conditions) ? rule.filterTree.conditions : [];
            return { ...rule, filterTree: { logic: rule?.filterTree?.logic || 'AND', conditions: [...existing, mkMaintenanceCondition()] } };
        }));
    };
    const updateCondition = (ruleId: string, index: number, condition: any) => {
        setRules(prev => prev.map(rule => {
            if (rule.id !== ruleId) return rule;
            const conditions = [...(rule?.filterTree?.conditions || [])];
            conditions[index] = condition;
            return { ...rule, filterTree: { logic: rule?.filterTree?.logic || 'AND', conditions } };
        }));
    };
    const removeCondition = (ruleId: string, index: number) => {
        setRules(prev => prev.map(rule => {
            if (rule.id !== ruleId) return rule;
            const conditions = (rule?.filterTree?.conditions || []).filter((_: any, i: number) => i !== index);
            return { ...rule, filterTree: { logic: rule?.filterTree?.logic || 'AND', conditions } };
        }));
    };

    const saveRules = async (event?: React.MouseEvent) => {
        event?.preventDefault();
        event?.stopPropagation();
        setSaving(true);
        try {
            await apiFetch('/api/maintenance/rules', { method: 'POST', body: JSON.stringify(rules) });
            addToast('Maintenance rules saved.');
            await refreshRules();
            onRulesUpdated?.();
        } catch (e: any) {
            addToast(e.message || 'Failed to save maintenance rules', 'error');
        } finally {
            setSaving(false);
        }
    };

    const rebuildIndex = async (event?: React.MouseEvent) => {
        event?.preventDefault();
        event?.stopPropagation();
        try {
            await apiFetch('/api/maintenance/index/rebuild', { method: 'POST' });
            addToast('Maintenance index rebuilt.');
            await Promise.all([refreshIndexInfo(), loadAll()]);
        } catch (e: any) {
            addToast(e.message || 'Failed to rebuild maintenance index', 'error');
        }
    };

    const runPreview = async (ruleId: string, event?: React.MouseEvent) => {
        event?.preventDefault();
        event?.stopPropagation();
        setPreviewRuleId(ruleId);
        try {
            const ruleDraft = rules.find((r: any) => r.id === ruleId);
            const payload = await apiFetch('/api/maintenance/preview', {
                method: 'POST',
                body: JSON.stringify({
                    ruleId,
                    rule: ruleDraft || undefined,
                    includeAll: true,
                    includeArrDiagnostics: true
                })
            });
            const previews = Array.isArray(payload?.previews) ? payload.previews : [];
            setPreviewData((prev) => {
                const map = new Map(prev.map((entry: any) => [entry.ruleId, entry]));
                previews.forEach((entry: any) => map.set(entry.ruleId, entry));
                return Array.from(map.values());
            });
            const current = previews.find((p: any) => p.ruleId === ruleId) || previews[0];
            const eligible = current?.eligibleCount ?? current?.totalMatches ?? 0;
            const actionable = current?.actionableCount ?? '—';
            const inGrace = current?.inGraceCount ?? 0;
            const graceDays = current?.graceRemainingDays ?? 0;
            addToast(
                graceDays > 0
                    ? `Preview: ${current?.totalMatches ?? 0} match(es), all in grace (${graceDays} day(s) remaining).`
                    : `Preview: ${current?.totalMatches ?? 0} match(es), ${eligible} eligible, ${actionable} mapped in Sonarr/Radarr${inGrace ? `, ${inGrace} in grace` : ''}.`
            );
        } catch (e: any) {
            addToast(e.message || 'Failed to generate preview', 'error');
        } finally {
            setPreviewRuleId(null);
        }
    };

    const runRule = async (ruleId: string, dryRun: boolean, event?: React.MouseEvent) => {
        event?.preventDefault();
        event?.stopPropagation();
        if (isRuleDirty(ruleId)) {
            addToast('Save your filter changes before running.', 'error');
            return;
        }
        const useCollectionPin = !dryRun && pinCollectionOnDestructiveRun;

        const executeRun = async () => {
            setRunningRuleId(ruleId);
            try {
                const response = await apiFetch('/api/maintenance/run', {
                    method: 'POST',
                    body: JSON.stringify({
                        ruleId,
                        dryRun,
                        confirmToken: dryRun ? null : 'CONFIRM_MAINTENANCE_DELETE',
                        runOptions: dryRun ? {} : { createAndPinCollection: useCollectionPin }
                    })
                });
                const latestRun = Array.isArray(response?.runs) ? response.runs[0] : null;
                const summary = latestRun ? formatMaintenanceRunSummary(latestRun) : '';
                addToast(dryRun
                    ? (summary ? `Dry-run completed (${summary}).` : 'Dry-run completed.')
                    : (summary
                        ? (useCollectionPin ? `Destructive run completed with collection pinning (${summary}).` : `Destructive run completed (${summary}).`)
                        : (useCollectionPin ? 'Rule execution completed with collection pinning.' : 'Rule execution completed.')));
                await Promise.all([refreshRuns(), runPreview(ruleId)]);
                onRulesUpdated?.();
            } catch (e: any) {
                addToast(e.message || 'Rule execution failed', 'error');
            } finally {
                setRunningRuleId(null);
            }
        };

        if (!dryRun) {
            try {
                const preflight = await apiFetch('/api/maintenance/preflight', {
                    method: 'POST',
                    body: JSON.stringify({ ruleId })
                });
                if (!preflight.ok) {
                    addToast((preflight.errors || ['Preflight check failed.']).join(' '), 'error');
                    return;
                }
                let confirmMessage = useCollectionPin
                    ? 'Run destructive maintenance action now? This will delete via Sonarr/Radarr and also create/pin a Plex collection to home for all users.'
                    : 'Run destructive maintenance action now? This will delete matching items via Sonarr/Radarr using the saved filter.';
                if (Array.isArray(preflight.warnings) && preflight.warnings.length) {
                    confirmMessage += `\n\nWarnings:\n- ${preflight.warnings.join('\n- ')}`;
                }
                const preview = preflight.preview;
                if (preview) {
                    confirmMessage += `\n\nWould process up to ${preview.wouldProcessCount} item(s): ${preview.actionableCount} mapped in Sonarr/Radarr, ${preview.unactionableCount} unmapped.`;
                    if (preview.graceRemainingDays > 0) {
                        confirmMessage += ` ${preview.inGraceCount} still in grace (${preview.graceRemainingDays} day(s) remaining).`;
                    }
                }
                appConfirm(confirmMessage, executeRun);
            } catch (e: any) {
                addToast(e.message || 'Preflight check failed', 'error');
            }
            return;
        }

        await executeRun();
    };

    const resetRuleGraceTimer = async (ruleId: string, event?: React.MouseEvent) => {
        event?.preventDefault();
        event?.stopPropagation();
        const target = rules.find((rule: any) => rule.id === ruleId);
        if (!target) return;
        setResettingRuleId(ruleId);
        try {
            await apiFetch('/api/maintenance/rules/reset-grace', { method: 'POST', body: JSON.stringify({ ruleId }) });
            addToast(`Grace timer reset for "${target.name || 'Unnamed Rule'}".`);
            await Promise.all([refreshRules(), runPreview(ruleId)]);
            onRulesUpdated?.();
        } catch (e: any) {
            addToast(e.message || 'Failed to reset grace timer', 'error');
        } finally {
            setResettingRuleId(null);
        }
    };

    const toggleRuleEnabled = async (ruleId: string, event?: React.MouseEvent) => {
        event?.preventDefault();
        event?.stopPropagation();
        const target = rules.find((rule: any) => rule.id === ruleId);
        if (!target) return;
        const previousRules = rules;
        const nextEnabled = target.enabled === false;
        const nextRules = rules.map((rule: any) => rule.id === ruleId ? { ...rule, enabled: nextEnabled } : rule);
        setRules(nextRules);
        setTogglingRuleId(ruleId);
        try {
            await apiFetch('/api/maintenance/rules', { method: 'POST', body: JSON.stringify(nextRules) });
            addToast(`Filter ${nextEnabled ? 'enabled' : 'disabled'}: "${target.name || 'Unnamed Rule'}".`);
            await Promise.all([refreshRules(), runPreview(ruleId)]);
            onRulesUpdated?.();
        } catch (e: any) {
            setRules(previousRules);
            addToast(e.message || 'Failed to update filter status', 'error');
        } finally {
            setTogglingRuleId(null);
        }
    };

    if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-plex border-t-transparent rounded-full animate-spin" /></div>;

    return (
        <div className="mb-8 animate-fade-in space-y-6" onSubmitCapture={(e) => e.preventDefault()}>
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-3">
                <div>
                    <h3 className="text-xl font-bold text-plex">Library Maintenance Rules</h3>
                    <p className="text-xs text-muted mt-1">Saved filters are listed below. Click one to edit, preview, and run.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button type="button" className="px-2.5 py-1.5 text-xs bg-border text-text rounded-md font-semibold hover:bg-opacity-80" onClick={(e) => rebuildIndex(e)}>Rebuild Index</button>
                    <button type="button" className="px-2.5 py-1.5 text-xs bg-border text-text rounded-md font-semibold hover:bg-opacity-80" onClick={(e) => addRule(e)}>Add Filter</button>
                </div>
            </div>

            <div className="bg-background/30 border border-white/5 rounded-xl p-3 text-xs text-muted">
                Index: <span className="text-text font-semibold">{indexInfo?.itemCount || 0}</span> media items
                {indexInfo?.generatedAt ? <> · Last build: <span className="text-text">{new Date(indexInfo.generatedAt).toLocaleString()}</span></> : null}
                {' '}· Request records: <span className="text-text font-semibold">{indexInfo?.requestItemCount || 0}</span>
            </div>

            <div className="bg-card/50 backdrop-blur-md border border-white/5 rounded-xl p-4">
                <p className="text-xs text-muted uppercase tracking-wider font-bold mb-3">Saved Filters</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {rules.map((rule: any) => {
                        const preview = previewData.find((p: any) => p.ruleId === rule.id);
                        return (
                            <div key={rule.id} className={`border rounded-lg p-3 transition-colors ${selectedRuleId === rule.id ? 'border-plex bg-plex/5' : 'border-white/5 bg-background/30'}`}>
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <p className="text-sm font-semibold text-text">{rule.name || 'Unnamed Rule'}</p>
                                        <p className="text-xs text-muted mt-1">{(rule?.filterTree?.conditions || []).length} condition(s)</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={(e) => toggleRuleEnabled(rule.id, e)}
                                        disabled={togglingRuleId === rule.id}
                                        className={`inline-flex items-center gap-2 px-2 py-1 rounded border text-[11px] font-semibold transition-colors disabled:opacity-60 ${rule.enabled !== false ? 'border-green-500/40 bg-green-500/10 text-green-300' : 'border-white/5 bg-background/30 text-muted'}`}
                                        title="Toggle filter enabled/disabled"
                                    >
                                        <span className={`relative inline-flex h-3.5 w-7 rounded-full transition-colors ${rule.enabled !== false ? 'bg-green-500/40' : 'bg-border'}`}>
                                            <span className={`absolute top-0.5 h-2.5 w-2.5 rounded-full bg-white transition-transform ${rule.enabled !== false ? 'translate-x-4' : 'translate-x-0.5'}`} />
                                        </span>
                                        {togglingRuleId === rule.id ? 'Saving...' : (rule.enabled !== false ? 'Enabled' : 'Disabled')}
                                    </button>
                                </div>
                                <p className="text-[11px] text-muted mt-2">Matches: {preview?.totalMatches ?? '—'}</p>
                                {(preview?.graceRemainingDays ?? 0) > 0 ? (
                                    <p className="text-[11px] text-amber-300 mt-1">In grace: {preview.graceRemainingDays} day(s) left</p>
                                ) : (
                                    <p className="text-[11px] text-muted mt-1">
                                        Eligible: {preview?.eligibleCount ?? '—'} · Sonarr/Radarr: {preview?.actionableCount ?? '—'} mapped
                                        {(preview?.unactionableCount ?? 0) > 0 ? `, ${preview.unactionableCount} unmapped` : ''}
                                    </p>
                                )}
                                <p className="text-[11px] text-muted mt-1" title="Grace countdown starts when the rule is created.">
                                    Grace: {Math.max(0, Number(rule?.graceDays || 0))} day(s) {rule?.createdAt ? `from ${new Date(rule.createdAt).toLocaleDateString()}` : 'from creation'}
                                </p>
                                <div className="flex gap-2 mt-3">
                                    <button
                                        type="button"
                                        className="px-2.5 py-1.5 text-xs rounded border border-border text-text hover:border-plex/50"
                                        onClick={() => setSelectedRuleId(rule.id)}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        type="button"
                                        className="px-2.5 py-1.5 text-xs rounded border border-border text-text hover:border-plex/50"
                                        onClick={(e) => runPreview(rule.id, e)}
                                    >
                                        Refresh
                                    </button>
                                    <button
                                        type="button"
                                        className="px-2.5 py-1.5 text-xs rounded border border-amber-500/40 text-amber-300 hover:bg-amber-500/10 disabled:opacity-50"
                                        title="Reset this rule's grace countdown to now."
                                        onClick={(e) => resetRuleGraceTimer(rule.id, e)}
                                        disabled={saving || resettingRuleId === rule.id}
                                    >
                                        {resettingRuleId === rule.id ? 'Resetting...' : 'Reset'}
                                    </button>
                                    <button
                                        type="button"
                                        className="px-2.5 py-1.5 text-xs rounded border border-red-500/40 text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                                        onClick={(e) => deleteRule(rule.id, e)}
                                        disabled={saving}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                    {rules.length === 0 && <span className="text-sm text-muted">No filters yet. Click Add Filter.</span>}
                </div>
            </div>

            {selectedRule && (
                <div className="bg-card/50 backdrop-blur-md border border-white/5 rounded-xl p-4 space-y-4 w-full">
                    {isRuleDirty(selectedRule.id) && (
                        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs rounded-lg px-3 py-2">
                            You have unsaved changes. Save the filter before previewing or running against production rules.
                        </div>
                    )}
                    <div className="flex items-end justify-between gap-3">
                        <div className="flex-1">
                            <label className="text-xs text-muted font-bold uppercase mb-1 block">Filter Name</label>
                            <input
                                value={selectedRule.name || ''}
                                onChange={(e) => updateRule(selectedRule.id, { name: e.target.value })}
                                className="w-full px-2.5 py-1.5 text-xs rounded border border-border bg-card text-text outline-none focus:border-plex"
                                placeholder="Filter name"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button type="button" className="px-2.5 py-1.5 text-xs border border-border text-text rounded hover:bg-white/5" onClick={() => setSelectedRuleId(null)}>Close Editor</button>
                            <button
                                type="button"
                                className="px-2.5 py-1.5 text-xs border border-red-500/40 text-red-300 rounded hover:bg-red-500/10 disabled:opacity-50"
                                onClick={(e) => deleteRule(selectedRule.id, e)}
                                disabled={saving}
                            >
                                Delete Filter
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div>
                            <label className="text-xs text-muted font-bold uppercase" title="How rule conditions are combined.">Match Logic</label>
                            <CustomSelect
                                value={selectedRule?.filterTree?.logic || 'AND'}
                                onChange={(value) => updateRule(selectedRule.id, { filterTree: { ...(selectedRule.filterTree || {}), logic: value } })}
                                options={[{ label: 'AND', value: 'AND' }, { label: 'OR', value: 'OR' }, { label: 'NOT', value: 'NOT' }]}
                                compact
                            />
                        </div>
                        <div>
                            <label className="text-xs text-muted font-bold uppercase" title="Global grace period for this ruleset. Matching items become eligible this many days after the rule was created.">Grace Days</label>
                            <input type="number" min={0} className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-card text-text" value={selectedRule?.graceDays || 0} onChange={(e) => updateRule(selectedRule.id, { graceDays: Number(e.target.value) })} />
                        </div>
                        <div>
                            <label className="text-xs text-muted font-bold uppercase">Max Actions</label>
                            <input type="number" min={1} className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-card text-text" value={selectedRule?.settings?.maxActionsPerRun || 25} onChange={(e) => updateRule(selectedRule.id, { settings: { ...(selectedRule.settings || {}), maxActionsPerRun: Number(e.target.value) } })} />
                        </div>
                        <div>
                            <label className="text-xs text-muted font-bold uppercase">Collection Name</label>
                            <input type="text" className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-card text-text" value={selectedRule?.collection?.nameTemplate || 'Leaving Soon - {{ruleName}}'} onChange={(e) => updateRule(selectedRule.id, { collection: { ...(selectedRule.collection || {}), nameTemplate: e.target.value } })} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <StyledCheckbox checked={selectedRule?.collection?.enabled !== false} onChange={(checked) => updateRule(selectedRule.id, { collection: { ...(selectedRule.collection || {}), enabled: checked } })} label="Create / Sync Plex Collection" />
                        <StyledCheckbox checked={selectedRule?.actions?.deleteFromArr !== false} onChange={(checked) => updateRule(selectedRule.id, { actions: { ...(selectedRule.actions || {}), deleteFromArr: checked } })} label="Delete via Sonarr/Radarr" />
                        <StyledCheckbox checked={!!selectedRule?.actions?.deleteFiles} onChange={(checked) => updateRule(selectedRule.id, { actions: { ...(selectedRule.actions || {}), deleteFiles: checked } })} label="Delete files on disk" />
                    </div>

                    <div className="space-y-2">
                        {(selectedRule?.filterTree?.conditions || []).map((cond: any, idx: number) => (
                            <MaintenanceConditionRow key={`${selectedRule.id}-${idx}`} condition={cond} fields={fields} onChange={(next) => updateCondition(selectedRule.id, idx, next)} onDelete={() => removeCondition(selectedRule.id, idx)} />
                        ))}
                        <button type="button" onClick={() => addCondition(selectedRule.id)} className="px-2 py-1 text-[11px] border border-border rounded-lg text-plex font-semibold">Add Filter Condition</button>
                    </div>

                    <div className="bg-background/30 border border-white/5 rounded-lg p-3">
                        <StyledCheckbox checked={pinCollectionOnDestructiveRun} onChange={setPinCollectionOnDestructiveRun} label="On destructive run, create collection and pin to home for all users" />
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                        <button type="button" className="px-2 py-1 text-[11px] bg-plex text-background rounded-md font-semibold hover:opacity-90 disabled:opacity-50" onClick={(e) => saveRules(e)} disabled={saving}>
                            {saving ? 'Saving...' : 'Save Filter'}
                        </button>
                        <button type="button" className="px-2 py-1 text-[11px] bg-border text-text rounded-md font-semibold hover:bg-opacity-80 disabled:opacity-50" onClick={(e) => runPreview(selectedRule.id, e)} disabled={previewRuleId === selectedRule.id}>{previewRuleId === selectedRule.id ? 'Refreshing Preview...' : 'Preview Matches'}</button>
                        <button type="button" className="px-2 py-1 text-[11px] bg-blue-500/20 text-blue-300 rounded-md font-semibold border border-blue-500/30 disabled:opacity-50" onClick={(e) => runRule(selectedRule.id, true, e)} disabled={runningRuleId === selectedRule.id}>{runningRuleId === selectedRule.id ? 'Running...' : 'Run Dry-Run'}</button>
                        <button type="button" className="px-2 py-1 text-[11px] bg-red-500/20 text-red-300 rounded-md font-semibold border border-red-500/30 disabled:opacity-50" onClick={(e) => runRule(selectedRule.id, false, e)} disabled={runningRuleId === selectedRule.id}>{runningRuleId === selectedRule.id ? 'Executing...' : 'Run Destructive'}</button>
                    </div>
                </div>
            )}

            <div className="bg-card/50 backdrop-blur-md border border-white/5 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-text">Matched Titles</h4>
                    <div className="text-right">
                        <span className="text-xs px-2 py-1 rounded bg-plex/20 text-plex font-semibold">{selectedPreview?.totalMatches || 0} matches</span>
                        {selectedPreview && (
                            <p className="text-[11px] text-muted mt-1">
                                {(selectedPreview.graceRemainingDays ?? 0) > 0
                                    ? `All in grace (${selectedPreview.graceRemainingDays} day(s) remaining)`
                                    : `${selectedPreview.eligibleCount ?? 0} eligible · ${selectedPreview.actionableCount ?? 0} in Sonarr/Radarr · up to ${selectedPreview.wouldProcessCount ?? 0} per run`}
                            </p>
                        )}
                    </div>
                </div>
                {!selectedRuleId ? (
                    <p className="text-sm text-muted">Select a saved filter to preview matches.</p>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 gap-3 max-h-[640px] overflow-y-auto custom-scrollbar pr-1">
                        {(selectedPreview?.sample || []).map((item: any) => (
                            <div key={`${selectedRuleId}-${item.ratingKey}`} className="bg-background/30 border border-white/5 rounded-lg overflow-hidden">
                                <div className="aspect-[2/3] bg-black/40">
                                    {item.thumb ? (
                                        <img
                                            src={`/api/plex/image?path=${encodeURIComponent(item.thumb)}&width=240&height=360`}
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
                                    <p className="text-[11px] text-muted mt-1">{item.libraryTitle || item.mediaType}</p>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {item.eligible === false && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300">Grace</span>
                                        )}
                                        {item.arrResolvable ? (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/15 text-green-300">{item.arrType || 'ARR'}</span>
                                        ) : item.eligible !== false ? (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-300">Unmapped</span>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </div>
    );
};

const SettingHint: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const detailsRef = useRef<HTMLDetailsElement>(null);

    useEffect(() => {
        const handleOutsideClick = (event: MouseEvent) => {
            if (!detailsRef.current?.open) return;
            if (detailsRef.current.contains(event.target as Node)) return;
            detailsRef.current.open = false;
        };
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key !== 'Escape') return;
            if (detailsRef.current?.open) {
                detailsRef.current.open = false;
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
            document.removeEventListener('keydown', handleEscape);
        };
    }, []);

    return (
        <details ref={detailsRef} className="relative inline-block group">
            <summary className="list-none inline-flex items-center gap-1 cursor-pointer text-xs text-plex hover:text-plex-hover font-semibold select-none">
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-plex/60 text-[10px] leading-none">?</span>
                Hint
            </summary>
            <div className="absolute z-20 mt-2 left-0 w-[min(420px,80vw)] bg-card border border-border rounded-lg px-3 py-2 text-xs text-muted shadow-xl">
                {children}
            </div>
        </details>
    );
};

const SettingsDashboard: React.FC = () => {
    const [statusDraft, setStatusDraft] = useState<any>(null);
    const [isLoading, setLoading] = useState(true);
    const [initialSettings, setInitialSettings] = useState<any>({});
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const streamRulesSaveHandlerRef = useRef<(() => Promise<boolean>) | null>(null);

    // Admin features moved here
    const [statusConfig, setStatusConfig] = useState<any>({});
    const [users, setUsers] = useState<User[]>([]);

    const addToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        setToasts(t => [...t, { id: Date.now(), message, type }]);
    }, []);

    const fetchStatusConfig = useCallback(async () => {
        try {
            const sConf = await apiFetch('/api/status/config');
            setStatusConfig(sConf);
        } catch (e) { }
    }, []);

    useEffect(() => {
        const fetchConfig = async () => {
            setLoading(true);
            try {
                const configRes = await fetch('/api/config');
                const configData = await configRes.json();
                if (configData.settings) {
                    setInitialSettings(configData.settings);
                }
                const usersData = await apiFetch('/api/users');
                setUsers(usersData);
                const libData = await apiFetch('/api/plex/libraries').catch(() => []);
                setLibraries(libData || []);
                await fetchStatusConfig();
            } catch (error) {
                addToast("Failed to load config", "error");
            } finally {
                setLoading(false);
            }
        };
        fetchConfig();
    }, [addToast]);

    const handleSaveConfig = async (newConfig: any) => {
        setLoading(true);
        try {
            await apiFetch('/api/config', { method: 'POST', body: JSON.stringify(newConfig) });
            setInitialSettings(newConfig);
            addToast('Settings Saved!');
        } catch (e: any) {
            addToast(e.message || 'Failed to save config', 'error');
        } finally {
            setLoading(false);
        }
    };
    const [token, setToken] = useState('');
    const [servers, setServers] = useState<PlexServer[]>([]);
    const [selectedServer, setSelectedServer] = useState('');
    const [checkInterval, setCheckInterval] = useState(60);
    const [hideStreamUsers, setHideStreamUsers] = useState<string>('false');
    const [defaultLibraryIds, setDefaultLibraryIds] = useState<string[]>([]);
    const [libraries, setLibraries] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState(() => {
        const hash = window.location.hash.replace('#', '');
        return ['plex', 'smtp', 'newsletter', 'cleanup', 'mediastack', 'branding', 'navigation', 'status', 'invites', 'tasks', 'system', 'contact', 'broadcast', 'stream-rules', 'logs'].includes(hash) ? hash : 'plex';
    });
    const [highlightMaintenanceToggle, setHighlightMaintenanceToggle] = useState(false);
    const [settingsSearch, setSettingsSearch] = useState('');

    const settingsTabGroups = [
        {
            title: 'Portal',
            tabs: [
                { id: 'branding', label: 'Portal UI', keywords: ['theme', 'logo', 'color', 'announcement', 'referral'] },
                { id: 'contact', label: 'Contact Details', keywords: ['email', 'whatsapp', 'support'] },
                { id: 'navigation', label: 'Navigation', keywords: ['menu', 'order', 'sidebar'] }
            ]
        },
        {
            title: 'Integrations',
            tabs: [
                { id: 'plex', label: 'Plex Integration', keywords: ['token', 'server', 'libraries'] },
                { id: 'mediastack', label: 'Media Stack', keywords: ['sonarr', 'radarr', 'tautulli'] },
                { id: 'status', label: 'Status Monitor', keywords: ['uptime', 'health', 'services'] }
            ]
        },
        {
            title: 'Comms',
            tabs: [
                { id: 'smtp', label: 'SMTP Alerts', keywords: ['mail', 'smtp', 'test'] },
                { id: 'newsletter', label: 'Newsletter', keywords: ['digest', 'send', 'frequency'] },
                { id: 'broadcast', label: 'Broadcast Email', keywords: ['announcement', 'bulk', 'users'] },
                { id: 'invites', label: 'Invites', keywords: ['invite', 'link', 'code'] }
            ]
        },
        {
            title: 'Automation',
            tabs: [
                { id: 'cleanup', label: 'Cleanup', keywords: ['inactive', 'revoke', 'expiry'] },
                { id: 'stream-rules', label: 'Stream Rules', keywords: ['kill', 'transcode', 'rule'] },
                { id: 'tasks', label: 'Background Tasks', keywords: ['jobs', 'scheduler', 'run now'] },
                { id: 'system', label: 'System', keywords: ['backup', 'restore', 'diagnostics'] },
                { id: 'logs', label: 'Logs & Audit', keywords: ['audit', 'emails', 'deleted users', 'history'] }
            ]
        }
    ];
    const settingsTabsFlat = settingsTabGroups.flatMap(group => group.tabs);
    const searchTerm = settingsSearch.trim().toLowerCase();
    const visibleTabGroups = settingsTabGroups
        .map(group => ({
            ...group,
            tabs: group.tabs.filter(tab => {
                if (!searchTerm) return true;
                const haystack = `${group.title} ${tab.label} ${(tab.keywords || []).join(' ')}`.toLowerCase();
                return haystack.includes(searchTerm);
            })
        }))
        .filter(group => group.tabs.length > 0);

    useEffect(() => {
        window.location.hash = activeTab;
    }, [activeTab]);

    useEffect(() => {
        if (activeTab !== 'system') return;
        const url = new URL(window.location.href);
        if (url.searchParams.get('focus') !== 'maintenance-toggle') return;
        setHighlightMaintenanceToggle(true);
        const timer = window.setTimeout(() => setHighlightMaintenanceToggle(false), 4200);
        url.searchParams.delete('focus');
        const nextUrl = `${url.pathname}${url.search}${url.hash || ''}`;
        window.history.replaceState({}, '', nextUrl);
        return () => window.clearTimeout(timer);
    }, [activeTab]);

    // SMTP States
    const [smtpHost, setSmtpHost] = useState('');
    const [smtpPort, setSmtpPort] = useState(587);
    const [smtpUser, setSmtpUser] = useState('');
    const [smtpPass, setSmtpPass] = useState('');
    const [smtpFrom, setSmtpFrom] = useState('');
    const [smtpSecure, setSmtpSecure] = useState(false);
    const [emailDaysBefore, setEmailDaysBefore] = useState(7);
    const [testRecipient, setTestRecipient] = useState('');
    const [isTestingSmtp, setIsTestingSmtp] = useState(false);
    const [isTestingNewsletter, setIsTestingNewsletter] = useState(false);
    const [isSendingNewsletter, setIsSendingNewsletter] = useState(false);

    // Newsletter States
    const [newsletterFrequency, setNewsletterFrequency] = useState('disabled');
    const [newsletterDay, setNewsletterDay] = useState(0);
    const [publicDomain, setPublicDomain] = useState('https://yourdomain.com');
    const [requestUrl, setRequestUrl] = useState('https://yourdomain.com');
    const [contactUrl, setContactUrl] = useState('');
    const [contactWhatsApp, setContactWhatsApp] = useState('');
    const [contactEmail, setContactEmail] = useState('');

    // Cleanup States
    const [inactiveCleanupEnabled, setInactiveCleanupEnabled] = useState(false);
    const [inactiveCleanupDays, setInactiveCleanupDays] = useState(90);

    // Media Stack States
    const [sonarrUrl, setSonarrUrl] = useState('');
    const [sonarrApiKey, setSonarrApiKey] = useState('');
    const [radarrUrl, setRadarrUrl] = useState('');
    const [radarrApiKey, setRadarrApiKey] = useState('');
    const [tautulliUrl, setTautulliUrl] = useState('');
    const [tautulliApiKey, setTautulliApiKey] = useState('');
    const [requestAppType, setRequestAppType] = useState('none');
    const [requestAppUrl, setRequestAppUrl] = useState('');
    const [requestAppApiKey, setRequestAppApiKey] = useState('');
    const [maintenanceExperimentalEnabled, setMaintenanceExperimentalEnabled] = useState(false);

    // Branding & UI States
    const [primaryColor, setPrimaryColor] = useState('#E5A00D');
    const [customLogoUrl, setCustomLogoUrl] = useState('');
    const [referralEnabled, setReferralEnabled] = useState(false);
    const [referralTrialDays, setReferralTrialDays] = useState(3);
    const [referralRewardDays, setReferralRewardDays] = useState(7);
    const [announcement, setAnnouncement] = useState('');
    const [isPushingAnnouncement, setIsPushingAnnouncement] = useState(false);
    const [use24HourClock, setUse24HourClock] = useState(initialSettings.use24HourClock || false);
    const [allowTemporaryAccess, setAllowTemporaryAccess] = useState(initialSettings.allowTemporaryAccess || false);
    const ensureMaintenanceNavOrder = useCallback((order: string[]) => {
        const base = Array.isArray(order) ? order.filter(Boolean) : ['home', 'discover', 'status', 'analytics', 'mediastack', 'request', 'settings', 'logout'];
        if (!base.includes('maintenance')) {
            const requestIndex = base.indexOf('request');
            if (requestIndex >= 0) base.splice(requestIndex, 0, 'maintenance');
            else base.push('maintenance');
        }
        return base;
    }, []);
    const [navOrder, setNavOrder] = useState<string[]>(() => ensureMaintenanceNavOrder(['home', 'discover', 'status', 'analytics', 'mediastack', 'request', 'settings', 'logout']));
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [tasks, setTasks] = useState<any[]>([]);
    const [diagnostics, setDiagnostics] = useState<any>(null);
    const [isLoadingDiagnostics, setIsLoadingDiagnostics] = useState(false);
    const [backupRestoreText, setBackupRestoreText] = useState('');
    const [isRestoringBackup, setIsRestoringBackup] = useState(false);
    const [autoBackupEnabled, setAutoBackupEnabled] = useState(false);
    const [autoBackupIntervalDays, setAutoBackupIntervalDays] = useState(2);
    const [autoBackupRetentionCount, setAutoBackupRetentionCount] = useState(10);
    const [backupFiles, setBackupFiles] = useState<any[]>([]);
    const [auditLogEntries, setAuditLogEntries] = useState<any[]>([]);
    const [isLoadingAuditLog, setIsLoadingAuditLog] = useState(false);
    const [auditLogPage, setAuditLogPage] = useState(1);
    const [deletedUsersLog, setDeletedUsersLog] = useState<any[]>([]);
    const [emailLogPage, setEmailLogPage] = useState(1);

    const handlePushAnnouncement = async () => {
        setIsPushingAnnouncement(true);
        try {
            const res = await apiFetch('/api/announcements/push', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: announcement, sendEmail: true })
            });
            if (res.error) throw new Error(res.error);
            addToast('Announcement saved and email push started (staggered over 30 mins).');
        } catch (e: any) {
            addToast(e.message || 'Failed to push announcement', 'error');
        } finally {
            setIsPushingAnnouncement(false);
        }
    };

    const fetchTasks = async () => {
        try {
            const data = await apiFetch('/api/tasks');
            setTasks(data);
        } catch (e) {
            addToast('Failed to load tasks', 'error');
        }
    };

    const fetchDiagnostics = async () => {
        setIsLoadingDiagnostics(true);
        try {
            const data = await apiFetch('/api/admin/diagnostics');
            setDiagnostics(data);
        } catch (e) {
            addToast('Failed to load diagnostics', 'error');
        } finally {
            setIsLoadingDiagnostics(false);
        }
    };

    const fetchBackupFiles = async () => {
        try {
            const data = await apiFetch('/api/admin/backups');
            setBackupFiles(Array.isArray(data) ? data : []);
        } catch (e) {
            addToast('Failed to load backup files', 'error');
        }
    };

    const fetchAuditLog = async () => {
        setIsLoadingAuditLog(true);
        try {
            const data = await apiFetch('/api/audit-log');
            setAuditLogEntries(Array.isArray(data) ? data : []);
            setAuditLogPage(1);
            setEmailLogPage(1);
        } catch (e) {
            addToast('Failed to load audit log', 'error');
        } finally {
            setIsLoadingAuditLog(false);
        }
    };

    const fetchDeletedUsersLog = async () => {
        try {
            const data = await apiFetch('/api/deleted-users');
            setDeletedUsersLog(Array.isArray(data) ? data : []);
        } catch (e) {
            addToast('Failed to load deleted users log', 'error');
        }
    };

    const handleDownloadBackup = async () => {
        try {
            const response = await fetch('/api/admin/backup');
            if (!response.ok) throw new Error('Backup download failed');
            const text = await response.text();
            const blob = new Blob([text], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `portal-backup-${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            addToast('Backup downloaded successfully.');
        } catch (e: any) {
            addToast(e.message || 'Backup download failed', 'error');
        }
    };

    const handleCreateBackupFile = async () => {
        try {
            const res = await apiFetch('/api/admin/backups/create', { method: 'POST' });
            addToast(res?.filename ? `Backup created: ${res.filename}` : 'Backup created successfully.');
            await fetchBackupFiles();
            await fetchDiagnostics();
        } catch (e: any) {
            addToast(e.message || 'Failed to create backup file', 'error');
        }
    };

    const handleRestoreBackup = async () => {
        if (!backupRestoreText.trim()) {
            addToast('Paste a backup JSON payload before restoring.', 'error');
            return;
        }
        appConfirm('Restore backup now? This overwrites current data files.', async () => {
            setIsRestoringBackup(true);
            try {
                const response = await fetch('/api/admin/backup/restore?confirm=true', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'text/plain',
                        'x-confirm-restore': 'true'
                    },
                    body: backupRestoreText
                });
                const data = await response.json().catch(() => ({}));
                if (!response.ok) throw new Error(data.error || 'Backup restore failed');
                addToast(data.message || 'Backup restored successfully.');
                await Promise.all([fetchDiagnostics(), fetchTasks()]);
            } catch (e: any) {
                addToast(e.message || 'Backup restore failed', 'error');
            } finally {
                setIsRestoringBackup(false);
            }
        });
    };

    const handleRestoreFromFile = async (filename: string) => {
        appConfirm(`Restore from backup file "${filename}"? This will overwrite current data.`, async () => {
            try {
                const res = await apiFetch('/api/admin/backups/restore-file', {
                    method: 'POST',
                    body: JSON.stringify({ filename, confirm: true })
                });
                addToast(res?.message || 'Backup restored from file successfully.');
                await Promise.all([fetchDiagnostics(), fetchTasks(), fetchBackupFiles()]);
            } catch (e: any) {
                addToast(e.message || 'Failed to restore backup file', 'error');
            }
        });
    };

    const renderConfigPill = (configured: boolean) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${configured ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}>
            {configured ? 'Configured' : 'Missing'}
        </span>
    );

    useEffect(() => {
        if (activeTab === 'tasks' || activeTab === 'system') {
            fetchTasks();
        }
        if (activeTab === 'system') {
            fetchDiagnostics();
            fetchBackupFiles();
            fetchAuditLog();
        }
        if (activeTab === 'logs') {
            fetchDeletedUsersLog();
            fetchAuditLog();
        }
    }, [activeTab]);

    const handleUnblockDeletedUser = async (deletedUser: any) => {
        const label = deletedUser.username || deletedUser.email || 'this user';
        appConfirm(`Allow ${label} to use the portal again? This does not invite them automatically.`, async () => {
            setLoading(true);
            try {
                await apiFetch(`/api/deleted-users/${encodeURIComponent(deletedUser.blockId)}`, { method: 'DELETE' });
                addToast('Deleted user unblocked.');
                await Promise.all([fetchDeletedUsersLog(), fetchAuditLog()]);
            } catch (error: any) {
                addToast(error instanceof Error ? error.message : 'Failed to unblock user.', 'error');
            } finally {
                setLoading(false);
            }
        });
    };

    const formatEventName = (event: string) => event
        .split('_')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');

    const formatDateTime = (value?: string | null) => {
        if (!value) return 'N/A';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return 'N/A';
        return date.toLocaleString();
    };

    const stringifyAuditValue = (value: any) => {
        if (value === null || value === undefined) return '—';
        if (typeof value === 'string') return value;
        if (typeof value === 'number' || typeof value === 'boolean') return String(value);
        try {
            return JSON.stringify(value);
        } catch {
            return String(value);
        }
    };

    const getAuditDiffRows = (details: any) => {
        if (!details || typeof details !== 'object') return [];
        const rows: { field: string; before: string; after: string }[] = [];
        const keys = Object.keys(details);
        const used = new Set<string>();
        const pairCandidate = (primaryKey: string, label: string, candidates: string[]) => {
            if (used.has(primaryKey)) return;
            for (const key of candidates) {
                if (key in details) {
                    rows.push({
                        field: label,
                        before: stringifyAuditValue(details[primaryKey]),
                        after: stringifyAuditValue(details[key])
                    });
                    used.add(primaryKey);
                    used.add(key);
                    return;
                }
            }
        };

        if ('before' in details && 'after' in details) {
            rows.push({ field: 'Value', before: stringifyAuditValue(details.before), after: stringifyAuditValue(details.after) });
            used.add('before');
            used.add('after');
        }
        if ('oldValue' in details && 'newValue' in details) {
            rows.push({ field: 'Value', before: stringifyAuditValue(details.oldValue), after: stringifyAuditValue(details.newValue) });
            used.add('oldValue');
            used.add('newValue');
        }

        keys.forEach((key) => {
            if (used.has(key)) return;
            if (!key.startsWith('previous')) return;
            const suffix = key.replace(/^previous/, '');
            if (!suffix) return;
            const lowerSuffix = suffix.charAt(0).toLowerCase() + suffix.slice(1);
            pairCandidate(key, suffix, [lowerSuffix, `new${suffix}`, `current${suffix}`]);
        });
        return rows;
    };

    const systemHealth = useMemo(() => {
        if (!diagnostics) {
            return {
                score: 0,
                status: 'Unknown',
                alerts: ['Diagnostics have not been loaded yet.'],
                integrationsConfigured: 0,
                integrationsTotal: 0,
                cacheHealthy: 0,
                cacheTotal: 0,
                runningJobs: 0,
                failingJobs: 0
            };
        }

        const integrationValues = Object.values(diagnostics.integrations || {});
        const cacheValues = Object.values(diagnostics.caches || {}).map((entry: any) => !!entry?.exists);
        const jobs = Array.isArray(diagnostics.jobs) ? diagnostics.jobs : [];
        const integrationsConfigured = integrationValues.filter(Boolean).length;
        const integrationsTotal = integrationValues.length;
        const cacheHealthy = cacheValues.filter(Boolean).length;
        const cacheTotal = cacheValues.length;
        const runningJobs = jobs.filter((job: any) => !!job.running).length;
        const failingJobs = jobs.filter((job: any) => !!job.lastError).length;
        const alerts: string[] = [];

        if (integrationsConfigured < integrationsTotal) {
            alerts.push(`${integrationsTotal - integrationsConfigured} integration(s) are not configured.`);
        }
        if (cacheHealthy < cacheTotal) {
            alerts.push(`${cacheTotal - cacheHealthy} cache file(s) are missing.`);
        }
        if (failingJobs > 0) {
            alerts.push(`${failingJobs} background job(s) reported recent errors.`);
        }
        if (diagnostics?.backup?.enabled && !diagnostics?.backup?.lastRunAt) {
            alerts.push('Auto backup is enabled but has not completed a run yet.');
        }

        const maxPenalty = 55;
        const integrationPenalty = integrationsTotal > 0 ? Math.round(((integrationsTotal - integrationsConfigured) / integrationsTotal) * 25) : 0;
        const cachePenalty = cacheTotal > 0 ? Math.round(((cacheTotal - cacheHealthy) / cacheTotal) * 20) : 0;
        const jobPenalty = Math.min(10, failingJobs * 5);
        const penalty = Math.min(maxPenalty, integrationPenalty + cachePenalty + jobPenalty);
        const score = Math.max(0, 100 - penalty);
        const status = score >= 85 ? 'Healthy' : score >= 65 ? 'Watch' : 'Needs Attention';

        return {
            score,
            status,
            alerts,
            integrationsConfigured,
            integrationsTotal,
            cacheHealthy,
            cacheTotal,
            runningJobs,
            failingJobs
        };
    }, [diagnostics]);

    const auditEventsPerPage = 12;
    const totalAuditLogPages = Math.max(1, Math.ceil(auditLogEntries.length / auditEventsPerPage));
    const pagedAuditEntries = auditLogEntries.slice((auditLogPage - 1) * auditEventsPerPage, auditLogPage * auditEventsPerPage);
    const emailAuditEntries = auditLogEntries.filter(entry => entry.event === 'system_email_sent');
    const emailsPerPage = 12;
    const totalEmailLogPages = Math.max(1, Math.ceil(emailAuditEntries.length / emailsPerPage));
    const pagedEmailEntries = emailAuditEntries.slice((emailLogPage - 1) * emailsPerPage, emailLogPage * emailsPerPage);

    const handleRunTask = async (taskId: string) => {
        setLoading(true);
        try {
            const res = await apiFetch(`/api/tasks/run/${taskId}`, { method: 'POST' });
            addToast(res.message || 'Task executed successfully', 'success');
            await fetchTasks();
        } catch (e) {
            addToast(e instanceof Error ? e.message : 'Task failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (initialSettings) {
            setToken(initialSettings.token || '');
            setSelectedServer(initialSettings.serverIdentifier || '');
            setCheckInterval(initialSettings.checkIntervalMinutes || 60);
            setSmtpHost(initialSettings.smtpHost || '');
            setSmtpPort(initialSettings.smtpPort || 587);
            setSmtpUser(initialSettings.smtpUser || '');
            setSmtpPass(initialSettings.smtpPass || '');
            setSmtpFrom(initialSettings.smtpFrom || '');
            setSmtpSecure(!!initialSettings.smtpSecure);
            setEmailDaysBefore(initialSettings.emailDaysBefore || 7);
            setNewsletterFrequency(initialSettings.newsletterFrequency || 'disabled');
            setNewsletterDay(initialSettings.newsletterDay || 0);
            setInactiveCleanupEnabled(!!initialSettings.inactiveCleanupEnabled);
            setInactiveCleanupDays(initialSettings.inactiveCleanupDays || 90);
            setPublicDomain(initialSettings.publicDomain || 'https://portal.yourdomain.com');
            setRequestUrl(initialSettings.requestUrl || 'https://yourdomain.com');
            setContactUrl(initialSettings.contactUrl || '');
            setContactWhatsApp(initialSettings.contactWhatsApp || '');
            setContactEmail(initialSettings.contactEmail || '');
            setSonarrUrl(initialSettings.sonarrUrl || '');
            setSonarrApiKey(initialSettings.sonarrApiKey || '');
            setRadarrUrl(initialSettings.radarrUrl || '');
            setRadarrApiKey(initialSettings.radarrApiKey || '');
            setTautulliUrl(initialSettings.tautulliUrl || '');
            setTautulliApiKey(initialSettings.tautulliApiKey || '');
            setRequestAppType(initialSettings.requestAppType || 'none');
            setRequestAppUrl(initialSettings.requestAppUrl || '');
            setRequestAppApiKey(initialSettings.requestAppApiKey || '');
            setPrimaryColor(initialSettings.primaryColor || '#E5A00D');
            setCustomLogoUrl(initialSettings.customLogoUrl || '');
            setReferralEnabled(!!initialSettings.referralEnabled);
            setReferralTrialDays(initialSettings.referralTrialDays || 3);
            setReferralRewardDays(initialSettings.referralRewardDays || 7);
            setAnnouncement(initialSettings.announcement || '');
            if (initialSettings.navOrder) setNavOrder(ensureMaintenanceNavOrder(initialSettings.navOrder));
            setHideStreamUsers(initialSettings.hideStreamUsers === true ? 'anonymous' : (initialSettings.hideStreamUsers || 'false'));
            if (initialSettings.defaultLibraryIds) setDefaultLibraryIds(initialSettings.defaultLibraryIds);
            if (initialSettings.use24HourClock !== undefined) setUse24HourClock(!!initialSettings.use24HourClock);
            if (initialSettings.allowTemporaryAccess !== undefined) setAllowTemporaryAccess(!!initialSettings.allowTemporaryAccess);
            if (initialSettings.autoBackupEnabled !== undefined) setAutoBackupEnabled(!!initialSettings.autoBackupEnabled);
            if (initialSettings.autoBackupIntervalDays !== undefined) setAutoBackupIntervalDays(Number(initialSettings.autoBackupIntervalDays) || 2);
            if (initialSettings.autoBackupRetentionCount !== undefined) setAutoBackupRetentionCount(Number(initialSettings.autoBackupRetentionCount) || 10);
            if (initialSettings.maintenanceExperimentalEnabled !== undefined) setMaintenanceExperimentalEnabled(!!initialSettings.maintenanceExperimentalEnabled);
            setTestRecipient('');
            setServers([]);
        }
    }, [initialSettings]);

    const handleFetchServers = async () => {
        if (!token) {
            addToast('Please enter a Plex token.', 'error');
            return;
        }
        setLoading(true);
        try {
            const foundServers = await apiFetch('/api/plex/servers', {
                method: 'POST',
                body: JSON.stringify({ token })
            });

            setServers(foundServers);

            if (foundServers.length > 0) {
                addToast('Successfully fetched servers!', 'success');
                const currentServerStillExists = foundServers.some(s => s.identifier === selectedServer);
                if (!currentServerStillExists) {
                    setSelectedServer(foundServers[0].identifier);
                }
            } else {
                addToast('No owned servers found for this token. Make sure you are the owner of the server.', 'error');
                setSelectedServer('');
            }
        } catch (error) {
            addToast(error instanceof Error ? error.message : 'An unknown error occurred.', 'error');
            setServers([]);
            setSelectedServer('');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (activeTab === 'stream-rules' && streamRulesSaveHandlerRef.current) {
            await streamRulesSaveHandlerRef.current();
            return;
        }
        if (!token || !selectedServer) {
            addToast('Token and server must be selected.', 'error');
            return;
        }

        if (logoFile) {
            try {
                await fetch('/api/config/logo', { method: 'POST', body: logoFile });
            } catch (e) {
                addToast('Failed to upload logo', 'error');
            }
        }

        if (statusDraft) {
            try {
                await apiFetch('/api/status/config', { method: 'POST', body: JSON.stringify(statusDraft) });
                setStatusConfig(statusDraft);
            } catch (e: any) {
                addToast('Failed to save status monitor configuration', 'error');
            }
        }

        await handleSaveConfig({
            token,
            serverIdentifier: selectedServer,
            checkIntervalMinutes: checkInterval,
            smtpHost,
            smtpPort,
            smtpUser,
            smtpPass,
            smtpFrom,
            smtpSecure,
            emailDaysBefore,
            newsletterFrequency,
            newsletterDay,
            inactiveCleanupEnabled,
            inactiveCleanupDays,
            publicDomain,
            requestUrl,
            contactUrl,
            contactWhatsApp,
            contactEmail,
            sonarrUrl,
            sonarrApiKey,
            radarrUrl,
            radarrApiKey,
            tautulliUrl,
            tautulliApiKey,
            requestAppType,
            requestAppUrl,
            requestAppApiKey,
            primaryColor,
            customLogoUrl,
            referralEnabled,
            referralTrialDays,
            referralRewardDays,
            announcement,
            navOrder: ensureMaintenanceNavOrder(navOrder),
            hideStreamUsers,
            defaultLibraryIds,
            use24HourClock,
            allowTemporaryAccess,
            autoBackupEnabled,
            autoBackupIntervalDays,
            autoBackupRetentionCount,
            maintenanceExperimentalEnabled
        });
        document.documentElement.style.setProperty('--color-plex', hexToRgb(primaryColor));
    };

    const handleTestEmail = async () => {
        if (!smtpHost || !smtpUser || !smtpPass || !testRecipient) {
            addToast('Please fill out SMTP Host, User, Password, and Test Recipient.', 'error');
            return;
        }
        setIsTestingSmtp(true);
        try {
            const result = await apiFetch('/api/config/test-email', {
                method: 'POST',
                body: JSON.stringify({
                    smtpHost,
                    smtpPort,
                    smtpUser,
                    smtpPass,
                    smtpFrom,
                    smtpSecure,
                    testRecipient
                })
            });
            addToast(result.message || 'Test email sent successfully!', 'success');
        } catch (error) {
            addToast(error instanceof Error ? error.message : 'SMTP test failed.', 'error');
        } finally {
            setIsTestingSmtp(false);
        }
    };

    const handleTestNewsletter = async () => {
        setIsTestingNewsletter(true);
        try {
            const result = await apiFetch('/api/newsletter/test', {
                method: 'POST'
            });
            addToast(result.message || 'Newsletter sent successfully!', 'success');
        } catch (error) {
            addToast(error instanceof Error ? error.message : 'Newsletter test failed.', 'error');
        } finally {
            setIsTestingNewsletter(false);
        }
    };

    const handleSendNewsletterNow = async () => {
        appConfirm('Are you sure you want to send the newsletter to ALL configured users immediately? This cannot be undone.', async () => {
            setIsSendingNewsletter(true);
            try {
                const result = await apiFetch('/api/newsletter/send-now', {
                    method: 'POST'
                });
                addToast(result.message || 'Newsletter dispatch initiated!', 'success');
            } catch (error) {
                addToast(error instanceof Error ? error.message : 'Newsletter dispatch failed.', 'error');
            } finally {
                setIsSendingNewsletter(false);
            }
        });
    };

    return (
        <div className="w-full flex flex-col">
            <Loader isLoading={isLoading} />
            <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[2000] flex flex-col-reverse gap-2 items-center">
                {toasts.map(toast => <Toast key={toast.id} {...toast} onDismiss={() => setToasts(t => t.filter(item => item.id !== toast.id))} />)}
            </div>


            <header className="hidden md:flex items-center justify-between w-full mb-6 mt-2 md:mt-0">
                <h1 className="text-xl md:text-3xl font-bold text-plex">Settings</h1>
            </header>

            <div className="bg-card p-4 md:p-8 rounded-2xl w-full flex flex-col shadow-2xl border border-border">
                <div className="md:grid md:grid-cols-[280px_minmax(0,1fr)] md:gap-6">
                    {/* Mobile Dropdown Category Select */}
                    <div className="block md:hidden mb-6">
                        <label htmlFor="settings-tab-select" className="text-muted text-xs uppercase tracking-wider font-bold mb-2 block">Settings Category</label>
                        <CustomSelect
                            id="settings-tab-select"
                            value={activeTab}
                            onChange={val => setActiveTab(val)}
                            options={settingsTabsFlat.map(tab => ({ label: tab.label, value: tab.id }))}
                        />
                    </div>

                    {/* Desktop Sidebar Navigation */}
                    <aside className="hidden md:block bg-black/20 border border-border rounded-xl p-3 h-fit sticky top-20">
                        <label className="text-muted text-xs uppercase tracking-wider font-bold mb-2 block">Find Setting</label>
                        <input
                            type="text"
                            placeholder="Search settings..."
                            value={settingsSearch}
                            onChange={(e) => setSettingsSearch(e.target.value)}
                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-plex transition-colors mb-3"
                        />
                        {visibleTabGroups.length === 0 ? (
                            <p className="text-xs text-muted px-2 py-3">No settings sections found.</p>
                        ) : (
                            <div className="space-y-3 pr-1">
                                {visibleTabGroups.map(group => (
                                    <div key={group.title}>
                                        <p className="text-[10px] uppercase tracking-wider font-bold text-plex px-2 mb-1">{group.title}</p>
                                        <div className="space-y-1">
                                            {group.tabs.map(tab => (
                                                <button
                                                    key={tab.id}
                                                    onClick={() => setActiveTab(tab.id)}
                                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === tab.id
                                                        ? 'bg-plex text-background'
                                                        : 'text-muted hover:text-text hover:bg-white/5'
                                                        }`}
                                                >
                                                    {tab.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </aside>

                    <div className="overflow-y-auto pr-2 flex-grow mb-4 custom-scrollbar">
                        {activeTab === 'stream-rules' && <StreamKillRulesPanel addToast={addToast} registerSaveHandler={(handler) => { streamRulesSaveHandlerRef.current = handler; }} />}
    
                        {activeTab === 'plex' && (
                            <div className="mb-8">
                                <h3 className="text-xl font-bold text-plex mb-4 border-b border-border pb-2">Plex Integration</h3>
                                <div className="mb-4">
                                    <label htmlFor="plexToken">Plex Token</label>
                                    <input className="w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all" id="plexToken" type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="Enter your X-Plex-Token" />
                                    <div className="mt-2">
                                        <SettingHint>
                                            Needed to fetch users and manage access. <a href="https://support.plex.tv/articles/204059436-finding-an-authentication-token-x-plex-token/" target="_blank" rel="noopener noreferrer">How to find your token.</a>
                                        </SettingHint>
                                    </div>
                                </div>
                                <button className="px-4 py-2 bg-border text-text rounded-md font-medium hover:bg-opacity-80 transition-colors flex items-center justify-center gap-2" onClick={handleFetchServers} disabled={!token}>Fetch Servers</button>
                                {servers.length > 0 && (
                                    <div className="mb-4" style={{ marginTop: '1rem' }}>
                                        <label htmlFor="serverSelect">Select Server</label>
                                        <CustomSelect
                                            id="serverSelect"
                                            value={selectedServer}
                                            onChange={val => setSelectedServer(val)}
                                            options={servers.map(s => ({ label: `${s.name} (${s.identifier})`, value: s.identifier }))}
                                        />
                                        {initialSettings.serverIdentifier && (
                                            <div className="mt-2">
                                                <SettingHint>
                                                    Currently saved server ID: <strong>{initialSettings.serverIdentifier}</strong>
                                                </SettingHint>
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div className="mb-4" style={{ marginTop: '1rem' }}>
                                    <label htmlFor="checkInterval">Check Interval (minutes)</label>
                                    <input className="w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all" id="checkInterval" type="number" value={checkInterval} onChange={e => setCheckInterval(Number(e.target.value))} min="1" />
                                    <div className="mt-2">
                                        <SettingHint>How often to check for expired users in the background.</SettingHint>
                                    </div>
                                </div>

                                {libraries.length > 0 && (
                                    <div className="mb-4 mt-4">
                                        <label className="block mb-2 font-medium">Default Temporary Access/Automated Libraries</label>
                                        <div className="mb-2">
                                            <SettingHint>Libraries to share automatically when users request temporary access or link their account. Leave empty to share ALL libraries.</SettingHint>
                                        </div>
                                        <div className="flex flex-wrap gap-3 p-4 bg-black/10 rounded-lg border border-border">
                                            {libraries.map(lib => {
                                                const isSelected = defaultLibraryIds.includes(lib.id);
                                                return (
                                                    <label key={lib.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all border shadow-sm select-none ${isSelected ? 'bg-plex/10 border-plex text-plex font-bold' : 'bg-background border-border/50 text-muted hover:border-white/20 hover:text-text font-medium'}`}>
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={(e) => {
                                                                if (e.target.checked) setDefaultLibraryIds([...defaultLibraryIds, lib.id]);
                                                                else setDefaultLibraryIds(defaultLibraryIds.filter(id => id !== lib.id));
                                                            }}
                                                            className="hidden"
                                                        />
                                                        {isSelected && <Check className="w-3.5 h-3.5" />}
                                                        <span className="text-sm">{lib.title}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                <div className="mb-4" style={{ marginTop: '1rem' }}>
                                    <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-background">
                                        <div>
                                            <h4 className="font-bold text-text">Stream User Privacy</h4>
                                            <p className="text-sm text-muted">Control how stream users are displayed to non-admins (e.g. on the public status page).</p>
                                        </div>
                                        <div className="w-56 ml-4 flex-shrink-0">
                                            <CustomSelect
                                                value={String(hideStreamUsers)}
                                                onChange={(val) => setHideStreamUsers(val)}
                                                options={[
                                                    { label: 'Show Names', value: 'false' },
                                                    { label: 'Show as Anonymous', value: 'anonymous' },
                                                    { label: 'Hide Completely', value: 'hidden' }
                                                ]}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="mb-4" style={{ marginTop: '1rem' }}>
                                    <label htmlFor="requestUrl">Request URL</label>
                                    <input className="w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all" id="requestUrl" type="text" value={requestUrl} onChange={e => setRequestUrl(e.target.value)} placeholder="https://yourdomain.com" />
                                    <div className="mt-2">
                                        <SettingHint>The URL users are redirected to when they click the Request Content button.</SettingHint>
                                    </div>
                                </div>
                                <div className="mb-4" style={{ marginTop: '1rem' }}>
                                    <label htmlFor="contactUrl">Contact URL / Email</label>
                                    <input className="w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all" id="contactUrl" type="text" value={contactUrl} onChange={e => setContactUrl(e.target.value)} placeholder="mailto:youremail@example.com OR https://wa.me/123456" />
                                    <div className="mt-2">
                                        <SettingHint>Used for the "Request Extension" button in expiry emails. Defaults to sending an email to the SMTP User.</SettingHint>
                                    </div>
                                </div>
                            </div>
                        )}

                    {activeTab === 'smtp' && (
                        <div className="mb-8">
                            <h3 className="text-xl font-bold text-plex mb-4 border-b border-border pb-2">SMTP Email Notifications</h3>
                            <div className="flex flex-col md:flex-row gap-4 mb-4">
                                <div className="flex-2">
                                    <label htmlFor="smtpHost">SMTP Host</label>
                                    <input className="w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all" id="smtpHost" type="text" value={smtpHost} onChange={e => setSmtpHost(e.target.value)} placeholder="smtp.mailgun.org" />
                                </div>
                                <div className="flex-1">
                                    <label htmlFor="smtpPort">Port</label>
                                    <input className="w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all" id="smtpPort" type="number" value={smtpPort} onChange={e => setSmtpPort(Number(e.target.value))} placeholder="587" />
                                </div>
                            </div>
                            <div className="flex flex-col md:flex-row gap-4 mb-4">
                                <div className="flex-1">
                                    <label htmlFor="smtpUser">SMTP Username</label>
                                    <input className="w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all" id="smtpUser" type="text" value={smtpUser} onChange={e => setSmtpUser(e.target.value)} placeholder="postmaster@yourdomain.com" />
                                </div>
                                <div className="flex-1">
                                    <label htmlFor="smtpPass">SMTP Password</label>
                                    <input className="w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all" id="smtpPass" type="password" value={smtpPass} onChange={e => setSmtpPass(e.target.value)} placeholder="••••••••••••" />
                                </div>
                            </div>
                            <div className="flex flex-col md:flex-row gap-4 mb-4">
                                <div className="flex-2">
                                    <label htmlFor="smtpFrom">Sender Address (From)</label>
                                    <input className="w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all" id="smtpFrom" type="text" value={smtpFrom} onChange={e => setSmtpFrom(e.target.value)} placeholder="Server Manager Portal <noreply@yourdomain.com>" />
                                </div>
                                <div className="form-group flex-1 checkbox-group">
                                    <label htmlFor="smtpSecure" className="flex items-center gap-2 cursor-pointer select-none text-muted hover:text-text transition-colors">
                                        <input className="w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all" id="smtpSecure" type="checkbox" checked={smtpSecure} onChange={e => setSmtpSecure(e.target.checked)} />
                                        <span>SSL / Secure</span>
                                    </label>
                                </div>
                            </div>
                            <div className="mb-4">
                                <label htmlFor="emailDaysBefore">Warning Alert Threshold (Days Before Expiry)</label>
                                <input className="w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all" id="emailDaysBefore" type="number" value={emailDaysBefore} onChange={e => setEmailDaysBefore(Number(e.target.value))} min="0" />
                                <div className="mt-2">
                                    <SettingHint>Automated notification email will be sent when user has this many days left.</SettingHint>
                                </div>
                            </div>

                            <div className="bg-background border border-border rounded-xl p-4 mt-6 shadow-inner">
                                <h4>Test SMTP Settings</h4>
                                <div className="flex flex-col md:flex-row gap-4 mb-4">
                                    <input
                                        type="email"
                                        value={testRecipient}
                                        onChange={e => setTestRecipient(e.target.value)}
                                        placeholder="test-recipient@gmail.com"
                                        className="flex-grow p-3 rounded-lg border border-border bg-card text-text text-sm outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all"
                                    />
                                    <button className="px-4 py-2 bg-border text-text rounded-md font-medium hover:bg-opacity-80 transition-colors flex items-center justify-center gap-2" onClick={handleTestEmail} disabled={isTestingSmtp || !testRecipient}>
                                        {isTestingSmtp ? 'Sending...' : 'Send Test'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'newsletter' && (
                        <div className="mb-8">
                            <h3 className="text-xl font-bold text-plex mb-4 border-b border-border pb-2">Automated Newsletter</h3>
                            <div className="mb-4">
                                <label htmlFor="newsletterFrequency">Frequency</label>
                                <CustomSelect
                                    id="newsletterFrequency"
                                    value={newsletterFrequency}
                                    onChange={val => setNewsletterFrequency(val)}
                                    options={[
                                        { label: 'Disabled', value: 'disabled' },
                                        { label: 'Weekly', value: 'weekly' },
                                        { label: 'Monthly', value: 'monthly' }
                                    ]}
                                />
                                <div className="mt-2">
                                    <SettingHint>How often should users receive the newsletter.</SettingHint>
                                </div>
                            </div>
                            {newsletterFrequency !== 'disabled' && (
                                <>
                                    <div className="mb-4" style={{ marginTop: '1rem' }}>
                                        <label htmlFor="newsletterDay">Send Day</label>
                                        {newsletterFrequency === 'weekly' ? (
                                            <CustomSelect
                                                id="newsletterDay"
                                                value={newsletterDay}
                                                onChange={val => setNewsletterDay(Number(val))}
                                                options={[
                                                    { label: 'Sunday', value: 0 },
                                                    { label: 'Monday', value: 1 },
                                                    { label: 'Tuesday', value: 2 },
                                                    { label: 'Wednesday', value: 3 },
                                                    { label: 'Thursday', value: 4 },
                                                    { label: 'Friday', value: 5 },
                                                    { label: 'Saturday', value: 6 }
                                                ]}
                                            />
                                        ) : (
                                            <input className="w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all" id="newsletterDay" type="number" min="1" max="28" value={newsletterDay} onChange={e => setNewsletterDay(Number(e.target.value))} placeholder="Day of the month (1-28)" />
                                        )}
                                    </div>
                                    <div className="mb-4" style={{ marginTop: '1rem' }}>
                                        <label htmlFor="publicDomain">Public Domain</label>
                                        <input className="w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all" id="publicDomain" type="text" value={publicDomain} onChange={e => setPublicDomain(e.target.value)} placeholder="https://portal.yourdomain.com" />
                                        <div className="mt-2">
                                            <SettingHint>Your public URL. This is required to host the posters inside the email.</SettingHint>
                                        </div>
                                    </div>
                                </>
                            )}
                            <div className="bg-background border border-border rounded-xl p-4 mt-6 shadow-inner" style={{ marginTop: '1rem' }}>
                                <h4>Test Newsletter</h4>
                                <div className="flex flex-col md:flex-row gap-4 mb-4">
                                    <button className="px-4 py-2 bg-border text-text rounded-md font-medium hover:bg-opacity-80 transition-colors flex items-center justify-center gap-2" onClick={handleTestNewsletter} disabled={isTestingNewsletter || isSendingNewsletter}>
                                        {isTestingNewsletter ? 'Generating & Sending...' : 'Send Test Newsletter To Admin'}
                                    </button>
                                    <button className="px-4 py-2 bg-plex text-background rounded-md font-medium hover:bg-plex-hover transition-colors flex items-center justify-center gap-2" onClick={handleSendNewsletterNow} disabled={isTestingNewsletter || isSendingNewsletter}>
                                        {isSendingNewsletter ? 'Sending To All...' : 'Send Newsletter To ALL NOW'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === 'cleanup' && (
                        <div className="mb-8 animate-fade-in">
                            <h3 className="text-xl font-bold text-plex mb-4 border-b border-border pb-2">Automated User Cleanup</h3>
                            <div className="mb-6 bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg">
                                <p className="text-sm text-yellow-500 font-bold mb-1">Warning</p>
                                <p className="text-xs text-muted">When enabled, the server will automatically revoke Plex access for users who have not watched anything for the specified number of days. You can exempt specific users from this rule by editing them in the Users table.</p>
                            </div>

                            <div className="mb-6 flex items-center justify-between bg-black/10 p-4 rounded-lg border border-border">
                                <div>
                                    <label className="font-bold block mb-1">Enable Automated Cleanup</label>
                                    <span className="text-xs text-muted block">Run cleanup job automatically in the background</span>
                                </div>
                                <button
                                    onClick={() => setInactiveCleanupEnabled(!inactiveCleanupEnabled)}
                                    className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${inactiveCleanupEnabled ? 'bg-plex' : 'bg-border'}`}
                                >
                                    <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${inactiveCleanupEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>

                            <div className={`transition-all ${!inactiveCleanupEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
                                <div className="mb-4">
                                    <label htmlFor="inactiveCleanupDays">Inactivity Threshold (Days)</label>
                                    <input
                                        className="w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all"
                                        id="inactiveCleanupDays"
                                        type="number"
                                        min="1"
                                        value={inactiveCleanupDays}
                                        onChange={e => setInactiveCleanupDays(Number(e.target.value))}
                                    />
                                    <div className="mt-2">
                                        <SettingHint>Revoke access if a user has not watched anything in this many days.</SettingHint>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === 'mediastack' && (
                        <div className="mb-8 animate-fade-in">
                            <h3 className="text-xl font-bold text-plex mb-4 border-b border-border pb-2">Sonarr Integration</h3>
                            <div className="mb-4">
                                <label htmlFor="sonarrUrl">Sonarr URL</label>
                                <input className="w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all" id="sonarrUrl" type="text" value={sonarrUrl} onChange={(e) => setSonarrUrl(e.target.value)} placeholder="http://localhost:8989" />
                                <div className="mt-2">
                                    <SettingHint>The URL to your Sonarr instance.</SettingHint>
                                </div>
                            </div>
                            <div className="mb-4">
                                <label htmlFor="sonarrApiKey">Sonarr API Key</label>
                                <input className="w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all" id="sonarrApiKey" type="password" value={sonarrApiKey} onChange={(e) => setSonarrApiKey(e.target.value)} placeholder="API Key from Sonarr Settings -> General" />
                            </div>

                            <h3 className="text-xl font-bold text-plex mb-4 border-b border-border pb-2 mt-8">Radarr Integration</h3>
                            <div className="mb-4">
                                <label htmlFor="radarrUrl">Radarr URL</label>
                                <input className="w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all" id="radarrUrl" type="text" value={radarrUrl} onChange={(e) => setRadarrUrl(e.target.value)} placeholder="http://localhost:7878" />
                                <div className="mt-2">
                                    <SettingHint>The URL to your Radarr instance.</SettingHint>
                                </div>
                            </div>
                            <div className="mb-4">
                                <label htmlFor="radarrApiKey">Radarr API Key</label>
                                <input className="w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all" id="radarrApiKey" type="password" value={radarrApiKey} onChange={(e) => setRadarrApiKey(e.target.value)} placeholder="Enter Radarr API Key" />
                            </div>
                            <h3 className="text-xl font-bold text-plex mb-4 border-b border-border pb-2 mt-8">Tautulli Integration (Optional)</h3>
                            <div className="mb-4">
                                <label htmlFor="tautulliUrl">Tautulli URL</label>
                                <input className="w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all" id="tautulliUrl" type="text" value={tautulliUrl} onChange={(e) => setTautulliUrl(e.target.value)} placeholder="http://localhost:8181" />
                            </div>
                            <div className="mb-8">
                                <label htmlFor="tautulliApiKey">Tautulli API Key</label>
                                <input className="w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all" id="tautulliApiKey" type="password" value={tautulliApiKey} onChange={(e) => setTautulliApiKey(e.target.value)} placeholder="Enter Tautulli API Key" />
                            </div>

                            <h3 className="text-xl font-bold text-plex mb-4 border-b border-border pb-2 mt-8">Request App Integration</h3>
                            <div className="mb-4">
                                <label htmlFor="requestAppType">Request App Type</label>
                                <CustomSelect
                                    id="requestAppType"
                                    value={requestAppType}
                                    onChange={(val) => setRequestAppType(val)}
                                    options={[
                                        { label: 'Disabled', value: 'none' },
                                        { label: 'Overseerr', value: 'overseerr' },
                                        { label: 'Jellyseerr', value: 'jellyseerr' },
                                        { label: 'Ombi', value: 'ombi' }
                                    ]}
                                />
                                <div className="mt-2">
                                    <SettingHint>Used by Library Maintenance rules for request-age/status filtering and cleanup workflows.</SettingHint>
                                </div>
                            </div>
                            <div className="mb-4">
                                <label htmlFor="requestAppUrl">Request App URL</label>
                                <input className="w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all" id="requestAppUrl" type="text" value={requestAppUrl} onChange={(e) => setRequestAppUrl(e.target.value)} placeholder="http://localhost:5055" />
                            </div>
                            <div className="mb-8">
                                <label htmlFor="requestAppApiKey">Request App API Key</label>
                                <input className="w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all" id="requestAppApiKey" type="password" value={requestAppApiKey} onChange={(e) => setRequestAppApiKey(e.target.value)} placeholder="API key from request app settings" />
                            </div>
                        </div>
                    )}

                    {activeTab === 'navigation' && (
                        <div className="mb-8 animate-fade-in">
                            <h3 className="text-xl font-bold text-plex mb-4 border-b border-border pb-2">Navigation Order</h3>
                            <p className="text-muted text-sm mb-4">Drag and drop or use the arrows to reorder the navigation items on the sidebar.</p>
                            <div className="flex flex-col gap-2 max-w-md">
                                {navOrder.map((key, index) => {
                                    const labels: Record<string, string> = {
                                        'home': 'Home', 'discover': 'Discover', 'status': 'Status', 'logs': 'Logs (Admin Only)', 'analytics': 'Analytics', 'mediastack': 'Media Stack', 'maintenance': 'Maintenance (Admin Only)', 'request': 'Request Content', 'settings': 'Settings (Admin Only)', 'logout': 'Logout'
                                    };
                                    return (
                                        <div key={key} className="flex items-center justify-between p-3 bg-card border border-border rounded-lg shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="text-text font-medium">{labels[key] || key}</div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    disabled={index === 0}
                                                    onClick={() => {
                                                        const newOrder = [...navOrder];
                                                        [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
                                                        setNavOrder(newOrder);
                                                    }}
                                                    className={`p-1 rounded transition-colors ${index === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/10 text-muted hover:text-text'}`}
                                                >
                                                    <ChevronUp className="w-5 h-5" />
                                                </button>
                                                <button
                                                    disabled={index === navOrder.length - 1}
                                                    onClick={() => {
                                                        const newOrder = [...navOrder];
                                                        [newOrder[index + 1], newOrder[index]] = [newOrder[index], newOrder[index + 1]];
                                                        setNavOrder(newOrder);
                                                    }}
                                                    className={`p-1 rounded transition-colors ${index === navOrder.length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/10 text-muted hover:text-text'}`}
                                                >
                                                    <ChevronDown className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {activeTab === 'broadcast' && (
                        <div className="mb-8 animate-fade-in">
                            <h3 className="text-xl font-bold text-plex mb-4 border-b border-border pb-2">Broadcast Email</h3>
                            <BroadcastSettingsTab users={users} selectedUserIds={[]} />
                        </div>
                    )}

                    {activeTab === 'status' && (
                        <div className="mb-8 animate-fade-in">
                            <h3 className="text-xl font-bold text-plex mb-4 border-b border-border pb-2">Status Monitor</h3>
                            <StatusMonitorSettings
                                config={statusConfig}
                                onChange={setStatusDraft}
                                appConfirm={appConfirm}
                                fetchConfig={fetchStatusConfig}
                                addToast={addToast}
                            />
                        </div>
                    )}


                    {activeTab === 'contact' && (
                        <div className="mb-8">
                            <h3 className="text-xl font-bold text-plex mb-4 border-b border-border pb-2">Contact Details</h3>
                            <p className="text-sm text-muted mb-6">
                                These details are displayed in the "Need Help?" box on the User Dashboard. Users can click these buttons to contact you directly if they need to extend their access, report an issue, or request support.
                            </p>
                            <div className="mb-4">
                                <label htmlFor="contactWhatsApp">WhatsApp Number (Optional)</label>
                                <input className="w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all" id="contactWhatsApp" type="text" value={contactWhatsApp} onChange={(e) => setContactWhatsApp(e.target.value)} placeholder="e.g. 447303647923" />
                                <div className="mt-2">
                                    <SettingHint>Enter your phone number including country code, without any '+', spaces, or dashes. If left blank, the WhatsApp button will be hidden.</SettingHint>
                                </div>
                            </div>
                            <div className="mb-4">
                                <label htmlFor="contactEmail">Email Address (Optional)</label>
                                <input className="w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all" id="contactEmail" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="e.g. admin@example.com" />
                                <div className="mt-2">
                                    <SettingHint>The email address users should contact. If left blank, the Email button will be hidden.</SettingHint>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'branding' && (
                        <div className="mb-8 animate-fade-in">
                            <h3 className="text-xl font-bold text-plex mb-4 border-b border-border pb-2">Branding & UI</h3>
                            <div className="mb-4">
                                <label>Primary Accent Color</label>
                                <div className="flex gap-4">
                                    <input type="color" className="w-16 h-12 p-1 rounded-lg border border-border cursor-pointer bg-background" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} />
                                    <input type="text" className="flex-1 p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex transition-all uppercase font-mono" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} />
                                </div>
                            </div>
                            <div className="mb-4">
                                <label>Custom Logo</label>
                                <div className="flex flex-col gap-2">
                                    <input type="url" className="w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex transition-all" value={customLogoUrl} onChange={e => setCustomLogoUrl(e.target.value)} placeholder="https://example.com/logo.png" />
                                    <span className="text-center text-muted font-bold text-sm">OR</span>
                                    <input type="file" accept="image/*" className="w-full p-2 rounded-lg border border-border bg-background text-muted text-sm outline-none focus:border-plex transition-all file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-white/10 file:text-text hover:file:bg-white/20 file:cursor-pointer cursor-pointer" onChange={e => setLogoFile(e.target.files?.[0] || null)} />
                                </div>
                                <div className="mt-2">
                                    <SettingHint>Provide a URL or upload a file. (Max 5MB)</SettingHint>
                                </div>
                            </div>


                            <div className="mb-4">
                                <label>Time Format</label>
                                <div className="flex items-center gap-2 mt-2">
                                    <button type="button" onClick={() => setUse24HourClock(!use24HourClock)} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors flex-shrink-0 cursor-pointer ${use24HourClock ? 'bg-plex' : 'bg-border'}`}>
                                        <span className={`inline-block w-4 h-4 transform bg-white rounded-full shadow-sm transition-transform ${use24HourClock ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                    <span className="text-sm font-medium cursor-pointer select-none hover:text-plex transition-colors" onClick={() => setUse24HourClock(!use24HourClock)}>Use 24-Hour Clock across the Portal</span>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label>Public Access</label>
                                <div className="flex items-center gap-2 mt-2">
                                    <button type="button" onClick={() => setAllowTemporaryAccess(!allowTemporaryAccess)} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors flex-shrink-0 cursor-pointer ${allowTemporaryAccess ? 'bg-plex' : 'bg-border'}`}>
                                        <span className={`inline-block w-4 h-4 transform bg-white rounded-full shadow-sm transition-transform ${allowTemporaryAccess ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                    <span className="text-sm font-medium cursor-pointer select-none hover:text-plex transition-colors" onClick={() => setAllowTemporaryAccess(!allowTemporaryAccess)}>Allow Temporary Access (Public Sign-ups)</span>
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-plex mb-4 border-b border-border pb-2 mt-8">Announcements</h3>
                            <div className="mb-4">
                                <label>Portal Announcement Banner</label>
                                <textarea className="w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex transition-all" value={announcement} onChange={e => setAnnouncement(e.target.value)} placeholder="E.g. Server maintenance scheduled for Friday..." rows={3}></textarea>
                                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mt-2">
                                    <SettingHint>If provided, this announcement will be prominently displayed to all users.</SettingHint>
                                    <button
                                        onClick={handlePushAnnouncement}
                                        disabled={isPushingAnnouncement || !announcement}
                                        className="bg-plex hover:bg-plex-hover disabled:opacity-50 text-background font-bold py-1.5 px-4 rounded-lg transition-colors text-sm whitespace-nowrap"
                                    >
                                        {isPushingAnnouncement ? 'Pushing...' : 'Save & Send Email Blast'}
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-plex mb-4 border-b border-border pb-2 mt-8">Referral System</h3>
                            <div className="mb-6 flex items-center justify-between bg-black/10 p-4 rounded-lg border border-border">
                                <div>
                                    <label className="font-bold block mb-1">Enable Referrals</label>
                                    <span className="text-xs text-muted block">Allow users to generate a referral link</span>
                                </div>
                                <button onClick={() => setReferralEnabled(!referralEnabled)} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${referralEnabled ? 'bg-plex' : 'bg-border'}`}>
                                    <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${referralEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                            <div className={`transition-all ${!referralEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label>Referred User Temporary Access Days</label>
                                        <input type="number" min="0" className="w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex transition-all" value={referralTrialDays} onChange={e => setReferralTrialDays(Number(e.target.value))} />
                                    </div>
                                    <div className="flex-1">
                                        <label>Referrer Reward Days</label>
                                        <input type="number" min="0" className="w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex transition-all" value={referralRewardDays} onChange={e => setReferralRewardDays(Number(e.target.value))} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'invites' && <InvitesSettings addToast={addToast} />}

                    {activeTab === 'tasks' && (
                        <div className="mb-8 animate-fade-in">
                            <h3 className="text-xl font-bold text-plex mb-4 border-b border-border pb-2">Background Tasks</h3>
                            <div className="flex flex-col gap-4">
                                {tasks.map(task => (
                                    <div key={task.id} className="bg-background border border-border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                                        <div>
                                            <h4 className="font-bold text-lg mb-1">{task.name}</h4>
                                            <p className="text-sm text-muted mb-2">{task.description}</p>
                                            <div className="flex gap-4 text-xs">
                                                <span className="bg-black/20 px-2 py-1 rounded"><strong>Last Run:</strong> {task.lastRun ? new Date(task.lastRun).toLocaleString() : 'Never'}</span>
                                                <span className="bg-black/20 px-2 py-1 rounded"><strong>Next Run:</strong> {task.nextRun ? new Date(task.nextRun).toLocaleString() : 'Not Scheduled'}</span>
                                                <span className="bg-black/20 px-2 py-1 rounded"><strong>Status:</strong> {task.running ? 'Running' : 'Idle'}</span>
                                                {task.lastDurationMs !== null && <span className="bg-black/20 px-2 py-1 rounded"><strong>Duration:</strong> {Math.round(task.lastDurationMs / 1000)}s</span>}
                                                {task.lastError && <span className="bg-red-500/20 text-red-300 px-2 py-1 rounded"><strong>Error:</strong> {task.lastError}</span>}
                                            </div>
                                        </div>
                                        <button
                                            className="px-4 py-2 bg-plex text-background rounded-md font-bold hover:bg-plex-hover transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                                            onClick={() => handleRunTask(task.id)}
                                        >
                                            Run Now
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {activeTab === 'system' && (
                        <div className="mb-8 animate-fade-in space-y-6">
                            <h3 className="text-xl font-bold text-plex mb-4 border-b border-border pb-2">System</h3>
                            <div className="bg-background border border-border rounded-xl p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-bold text-text">Health Dashboard</h4>
                                    <span className={`text-xs px-2 py-1 rounded font-bold ${systemHealth.score >= 85 ? 'bg-green-500/20 text-green-300' : systemHealth.score >= 65 ? 'bg-yellow-500/20 text-yellow-300' : 'bg-red-500/20 text-red-300'}`}>
                                        {systemHealth.status}
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 text-sm mb-3">
                                    <div className="bg-black/20 rounded-lg p-3">
                                        <p className="text-muted text-xs mb-1">Health Score</p>
                                        <p className="text-xl font-bold text-text">{systemHealth.score}%</p>
                                    </div>
                                    <div className="bg-black/20 rounded-lg p-3">
                                        <p className="text-muted text-xs mb-1">Integrations</p>
                                        <p className="text-xl font-bold text-text">{systemHealth.integrationsConfigured}/{systemHealth.integrationsTotal}</p>
                                    </div>
                                    <div className="bg-black/20 rounded-lg p-3">
                                        <p className="text-muted text-xs mb-1">Caches</p>
                                        <p className="text-xl font-bold text-text">{systemHealth.cacheHealthy}/{systemHealth.cacheTotal}</p>
                                    </div>
                                    <div className="bg-black/20 rounded-lg p-3">
                                        <p className="text-muted text-xs mb-1">Running Jobs</p>
                                        <p className="text-xl font-bold text-text">{systemHealth.runningJobs}</p>
                                    </div>
                                    <div className="bg-black/20 rounded-lg p-3">
                                        <p className="text-muted text-xs mb-1">Failing Jobs</p>
                                        <p className={`text-xl font-bold ${systemHealth.failingJobs > 0 ? 'text-red-300' : 'text-text'}`}>{systemHealth.failingJobs}</p>
                                    </div>
                                </div>
                                <div className="bg-black/20 rounded-lg p-3">
                                    <p className="text-xs font-semibold text-muted mb-2">Attention Needed</p>
                                    {systemHealth.alerts.length === 0 ? (
                                        <p className="text-sm text-green-300">No active health alerts.</p>
                                    ) : (
                                        <ul className="text-sm text-yellow-200 space-y-1">
                                            {systemHealth.alerts.map((alert, index) => (
                                                <li key={`health-alert-${index}`}>- {alert}</li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                            <div className={`bg-background border rounded-xl p-4 transition-all duration-300 ${highlightMaintenanceToggle ? 'border-plex ring-2 ring-plex/50 shadow-[0_0_24px_rgba(229,160,13,0.25)]' : 'border-border'}`}>
                                <h4 className="font-bold text-text mb-3">Maintenance Experimental Mode</h4>
                                <div className="bg-black/20 rounded-lg p-3 flex items-center justify-between gap-3">
                                    <div>
                                        <p className="font-semibold text-text">Enable Maintenance Module</p>
                                        <p className="text-xs text-muted mt-1">Single global toggle for the main `Maintenance` navigation section. OFF by default.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setMaintenanceExperimentalEnabled(!maintenanceExperimentalEnabled)}
                                        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${maintenanceExperimentalEnabled ? 'bg-plex' : 'bg-border'}`}
                                    >
                                        <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${maintenanceExperimentalEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                                <p className={`text-xs mt-2 font-semibold ${maintenanceExperimentalEnabled ? 'text-green-300' : 'text-yellow-300'}`}>
                                    Current status: {maintenanceExperimentalEnabled ? 'ON' : 'OFF'}
                                </p>
                                <p className="text-[11px] text-muted mt-1">After changing this toggle, click the main Save Settings button.</p>
                            </div>
                            <div className="bg-background border border-border rounded-xl p-4">
                                <h4 className="font-bold text-text mb-3">Backup & Restore</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                                    <div className="bg-black/20 rounded-lg p-3">
                                        <label className="font-semibold text-sm block mb-2">Auto Backup Enabled</label>
                                        <button
                                            type="button"
                                            onClick={() => setAutoBackupEnabled(!autoBackupEnabled)}
                                            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${autoBackupEnabled ? 'bg-plex' : 'bg-border'}`}
                                        >
                                            <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${autoBackupEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>
                                    <div className="bg-black/20 rounded-lg p-3">
                                        <label className="font-semibold text-sm block mb-2">Interval (Days)</label>
                                        <input
                                            type="number"
                                            min={1}
                                            className="w-full p-2 rounded border border-border bg-card text-text"
                                            value={autoBackupIntervalDays}
                                            onChange={(e) => setAutoBackupIntervalDays(Math.max(1, Number(e.target.value) || 1))}
                                        />
                                    </div>
                                    <div className="bg-black/20 rounded-lg p-3">
                                        <label className="font-semibold text-sm block mb-2">Rolling Backups Kept</label>
                                        <input
                                            type="number"
                                            min={1}
                                            className="w-full p-2 rounded border border-border bg-card text-text"
                                            value={autoBackupRetentionCount}
                                            onChange={(e) => setAutoBackupRetentionCount(Math.max(1, Number(e.target.value) || 1))}
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-3 mb-4">
                                    <button className="px-4 py-2 bg-plex text-background rounded-md font-bold hover:bg-plex-hover transition-colors" onClick={handleDownloadBackup}>Download Backup</button>
                                    <button className="px-4 py-2 bg-indigo-600 text-white rounded-md font-bold hover:bg-indigo-500 transition-colors" onClick={handleCreateBackupFile}>Create Backup File</button>
                                    <button className="px-4 py-2 bg-red-600 text-white rounded-md font-bold hover:bg-red-500 transition-colors disabled:opacity-50" onClick={handleRestoreBackup} disabled={isRestoringBackup}>
                                        {isRestoringBackup ? 'Restoring...' : 'Restore Backup'}
                                    </button>
                                </div>
                                <textarea
                                    className="w-full min-h-[140px] p-3 rounded-lg border border-border bg-card text-text outline-none focus:border-plex"
                                    placeholder="Paste backup JSON here before clicking Restore Backup..."
                                    value={backupRestoreText}
                                    onChange={(e) => setBackupRestoreText(e.target.value)}
                                />
                                <div className="mt-4">
                                    <h5 className="font-semibold text-sm text-text mb-2">Auto Backup Files</h5>
                                    <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
                                        {backupFiles.length === 0 ? (
                                            <p className="text-xs text-muted">No backup files found in backup folder.</p>
                                        ) : backupFiles.map(file => (
                                            <div key={file.filename} className="bg-black/20 rounded-lg p-2 flex items-center justify-between gap-2">
                                                <div className="text-xs">
                                                    <p className="font-semibold text-text">{file.filename}</p>
                                                    <p className="text-muted">{file.createdAt ? new Date(file.createdAt).toLocaleString() : 'Unknown date'} · {(file.size / 1024).toFixed(1)} KB</p>
                                                </div>
                                                <button className="px-3 py-1.5 bg-red-600/80 text-white rounded text-xs font-bold hover:bg-red-500" onClick={() => handleRestoreFromFile(file.filename)}>
                                                    Restore
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-background border border-border rounded-xl p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-bold text-text">System Diagnostics</h4>
                                    <button className="px-3 py-1.5 bg-border text-text rounded-md font-semibold hover:bg-opacity-80" onClick={fetchDiagnostics}>
                                        {isLoadingDiagnostics ? 'Refreshing...' : 'Refresh'}
                                    </button>
                                </div>
                                {diagnostics ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 text-sm">
                                        <div className="bg-black/20 rounded-lg p-3"><strong>App Version:</strong> {diagnostics?.app?.version || 'unknown'}</div>
                                        <div className="bg-black/20 rounded-lg p-3"><strong>Uptime:</strong> {diagnostics?.app?.uptimeSeconds || 0}s</div>
                                        <div className="bg-black/20 rounded-lg p-3"><strong>Node:</strong> {diagnostics?.app?.nodeVersion || 'n/a'}</div>
                                        <div className="bg-black/20 rounded-lg p-3"><strong>Memory:</strong> {diagnostics?.app?.memoryRssMB || 0} MB</div>
                                        <div className="bg-black/20 rounded-lg p-3 flex items-center justify-between gap-2"><strong>Plex</strong>{renderConfigPill(!!diagnostics?.integrations?.plexConfigured)}</div>
                                        <div className="bg-black/20 rounded-lg p-3 flex items-center justify-between gap-2"><strong>SMTP</strong>{renderConfigPill(!!diagnostics?.integrations?.smtpConfigured)}</div>
                                        <div className="bg-black/20 rounded-lg p-3 flex items-center justify-between gap-2"><strong>Sonarr</strong>{renderConfigPill(!!diagnostics?.integrations?.sonarrConfigured)}</div>
                                        <div className="bg-black/20 rounded-lg p-3 flex items-center justify-between gap-2"><strong>Radarr</strong>{renderConfigPill(!!diagnostics?.integrations?.radarrConfigured)}</div>
                                        <div className="bg-black/20 rounded-lg p-3 flex items-center justify-between gap-2"><strong>Tautulli</strong>{renderConfigPill(!!diagnostics?.integrations?.tautulliConfigured)}</div>
                                        <div className="bg-black/20 rounded-lg p-3 flex items-center justify-between gap-2"><strong>Analytics Cache</strong>{renderConfigPill(!!diagnostics?.caches?.analytics?.exists)}</div>
                                        <div className="bg-black/20 rounded-lg p-3 flex items-center justify-between gap-2"><strong>Trending Cache</strong>{renderConfigPill(!!diagnostics?.caches?.trending?.exists)}</div>
                                        <div className="bg-black/20 rounded-lg p-3 flex items-center justify-between gap-2"><strong>Plex Stats Cache</strong>{renderConfigPill(!!diagnostics?.caches?.plexStats?.exists)}</div>
                                        <div className="bg-black/20 rounded-lg p-3 flex items-center justify-between gap-2"><strong>Users File</strong>{renderConfigPill(!!diagnostics?.files?.users?.exists)}</div>
                                        <div className="bg-black/20 rounded-lg p-3 flex items-center justify-between gap-2"><strong>Config File</strong>{renderConfigPill(!!diagnostics?.files?.config?.exists)}</div>
                                        <div className="bg-black/20 rounded-lg p-3 flex items-center justify-between gap-2"><strong>Auto Backup</strong>{renderConfigPill(!!diagnostics?.backup?.enabled)}</div>
                                        <div className="bg-black/20 rounded-lg p-3"><strong>Backup Files:</strong> {diagnostics?.backup?.availableBackups ?? 0}</div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted">No diagnostics loaded yet.</p>
                                )}
                            </div>

                            <div className="bg-background border border-border rounded-xl p-4">
                                <h4 className="font-bold text-text mb-3">Job Queue</h4>
                                <div className="flex flex-col gap-3">
                                    {tasks.map(task => (
                                        <div key={`system-${task.id}`} className="bg-black/20 rounded-lg p-3">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="font-semibold text-text">{task.name}</p>
                                                <span className={`text-xs px-2 py-1 rounded ${task.running ? 'bg-yellow-500/20 text-yellow-300' : 'bg-green-500/20 text-green-300'}`}>
                                                    {task.running ? 'Running' : 'Idle'}
                                                </span>
                                            </div>
                                            <div className="text-xs text-muted mt-1">
                                                Last: {task.lastRun ? new Date(task.lastRun).toLocaleString() : 'Never'} · Next: {task.nextRun ? new Date(task.nextRun).toLocaleString() : 'Not Scheduled'}
                                                {task.lastDurationMs !== null ? ` · Duration: ${Math.round(task.lastDurationMs / 1000)}s` : ''}
                                            </div>
                                            {task.lastError && <div className="text-xs text-red-300 mt-1">Last error: {task.lastError}</div>}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-background border border-border rounded-xl p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-bold text-text">Audit Log Viewer</h4>
                                    <button className="px-3 py-1.5 bg-border text-text rounded-md font-semibold hover:bg-opacity-80" onClick={fetchAuditLog}>
                                        {isLoadingAuditLog ? 'Refreshing...' : 'Refresh'}
                                    </button>
                                </div>
                                {pagedAuditEntries.length === 0 ? (
                                    <p className="text-sm text-muted">No audit events found.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {pagedAuditEntries.map((entry) => {
                                            const diffRows = getAuditDiffRows(entry.details);
                                            const detailKeys = entry.details && typeof entry.details === 'object'
                                                ? Object.entries(entry.details).filter(([key]) => !diffRows.some(row => key.toLowerCase().includes(row.field.toLowerCase())))
                                                : [];
                                            return (
                                                <details key={entry.id} className="bg-black/20 rounded-lg p-3 border border-border/60">
                                                    <summary className="cursor-pointer list-none">
                                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                                            <p className="font-semibold text-text text-sm">{formatEventName(entry.event || 'event')}</p>
                                                            <span className="text-[11px] text-muted">{formatDateTime(entry.timestamp)}</span>
                                                        </div>
                                                        <p className="text-xs text-muted mt-1">
                                                            Target: {entry.target?.username || entry.target?.email || 'System'}
                                                            {entry.actor?.username || entry.actor?.email ? ` · Actor: ${entry.actor.username || entry.actor.email}` : ''}
                                                        </p>
                                                    </summary>
                                                    <div className="mt-3 space-y-2">
                                                        {diffRows.length > 0 && (
                                                            <div className="overflow-x-auto">
                                                                <table className="w-full text-xs border border-border/60 rounded-lg overflow-hidden">
                                                                    <thead className="bg-black/30 text-muted">
                                                                        <tr>
                                                                            <th className="text-left px-2 py-1">Field</th>
                                                                            <th className="text-left px-2 py-1">Before</th>
                                                                            <th className="text-left px-2 py-1">After</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {diffRows.map((row, rowIdx) => (
                                                                            <tr key={`${entry.id}-diff-${rowIdx}`} className="border-t border-border/50">
                                                                                <td className="px-2 py-1 text-text">{row.field}</td>
                                                                                <td className="px-2 py-1 text-red-300">{row.before}</td>
                                                                                <td className="px-2 py-1 text-green-300">{row.after}</td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        )}
                                                        {detailKeys.length > 0 && (
                                                            <div className="text-xs text-muted bg-black/30 rounded p-2 space-y-1">
                                                                {detailKeys.map(([key, value]) => (
                                                                    <p key={`${entry.id}-${key}`}>
                                                                        <span className="text-text">{key}:</span> {stringifyAuditValue(value)}
                                                                    </p>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </details>
                                            );
                                        })}
                                        {totalAuditLogPages > 1 && (
                                            <div className="flex items-center justify-between pt-1">
                                                <button
                                                    className="px-3 py-1.5 bg-border text-text rounded-md font-semibold hover:bg-opacity-80 disabled:opacity-50"
                                                    disabled={auditLogPage === 1}
                                                    onClick={() => setAuditLogPage(p => Math.max(1, p - 1))}
                                                >
                                                    Previous
                                                </button>
                                                <span className="text-xs text-muted">Page {auditLogPage} of {totalAuditLogPages}</span>
                                                <button
                                                    className="px-3 py-1.5 bg-border text-text rounded-md font-semibold hover:bg-opacity-80 disabled:opacity-50"
                                                    disabled={auditLogPage === totalAuditLogPages}
                                                    onClick={() => setAuditLogPage(p => Math.min(totalAuditLogPages, p + 1))}
                                                >
                                                    Next
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    {activeTab === 'logs' && (
                        <div className="mb-8 animate-fade-in space-y-6">
                            <h3 className="text-xl font-bold text-plex mb-4 border-b border-border pb-2">Logs & Audit</h3>

                            <div className="bg-background border border-border rounded-xl p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-bold text-text">Deleted User Blocklist</h4>
                                    <span className="px-2 py-1 rounded text-xs font-semibold bg-red-500/20 text-red-300">{deletedUsersLog.length}</span>
                                </div>
                                <div className="space-y-2">
                                    {deletedUsersLog.length === 0 ? (
                                        <p className="text-sm text-muted">No deleted users are currently blocked.</p>
                                    ) : (
                                        deletedUsersLog.map((deletedUser) => (
                                            <div key={deletedUser.blockId} className="bg-black/20 rounded-lg p-3 flex items-center justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-text truncate">{deletedUser.username || 'Unknown user'}</p>
                                                    <p className="text-xs text-muted truncate">{deletedUser.email || deletedUser.plexId || deletedUser.id || 'No identifier'}</p>
                                                    <p className="text-[11px] text-muted/80">Deleted {formatDateTime(deletedUser.deletedAt)} by {deletedUser.deletedBy || 'admin'}</p>
                                                </div>
                                                <button
                                                    className="px-3 py-1.5 bg-border text-text rounded text-xs font-semibold hover:bg-opacity-80"
                                                    onClick={() => handleUnblockDeletedUser(deletedUser)}
                                                >
                                                    Unblock
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="bg-background border border-border rounded-xl p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-bold text-text">Email Log</h4>
                                    <button className="px-3 py-1.5 bg-border text-text rounded-md font-semibold hover:bg-opacity-80" onClick={fetchAuditLog}>
                                        {isLoadingAuditLog ? 'Refreshing...' : 'Refresh'}
                                    </button>
                                </div>
                                {pagedEmailEntries.length === 0 ? (
                                    <p className="text-sm text-muted">No system emails have been logged yet.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {pagedEmailEntries.map((entry) => (
                                            <div key={entry.id} className="bg-black/20 rounded-lg p-3">
                                                <div className="flex items-start justify-between gap-3">
                                                    <p className="text-sm font-semibold text-text line-clamp-1">{entry.details?.subject || 'System Email'}</p>
                                                    <span className="text-[11px] text-muted whitespace-nowrap">{formatDateTime(entry.timestamp)}</span>
                                                </div>
                                                <p className="text-xs text-muted mt-1">To: {entry.target?.username || entry.target?.email || 'Unknown user'}</p>
                                            </div>
                                        ))}
                                        {totalEmailLogPages > 1 && (
                                            <div className="flex items-center justify-between pt-1">
                                                <button
                                                    className="px-3 py-1.5 bg-border text-text rounded-md font-semibold hover:bg-opacity-80 disabled:opacity-50"
                                                    disabled={emailLogPage === 1}
                                                    onClick={() => setEmailLogPage(p => Math.max(1, p - 1))}
                                                >
                                                    Previous
                                                </button>
                                                <span className="text-xs text-muted">Page {emailLogPage} of {totalEmailLogPages}</span>
                                                <button
                                                    className="px-3 py-1.5 bg-border text-text rounded-md font-semibold hover:bg-opacity-80 disabled:opacity-50"
                                                    disabled={emailLogPage === totalEmailLogPages}
                                                    onClick={() => setEmailLogPage(p => Math.min(totalEmailLogPages, p + 1))}
                                                >
                                                    Next
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                </div>
                <div className="flex justify-end gap-4 mt-8" style={{ marginTop: '2rem' }}>
                    <button className="px-6 py-3 bg-plex text-background rounded-md font-bold hover:bg-plex-hover transition-colors flex items-center justify-center gap-2" onClick={handleSave}>{activeTab === 'stream-rules' ? 'Save Stream Rules' : 'Save Settings'}</button>
                </div>
            </div>
        </div>
    );
};

const StatusMonitorSettings: React.FC<{ config: any; onChange: (cfg: any) => void; appConfirm: (msg: string, cb: () => void) => void; fetchConfig: () => void; addToast: (msg: string, type?: 'success' | 'error') => void }> = ({ config, onChange, appConfirm, fetchConfig, addToast }) => {
    const [localConfig, setLocalConfig] = useState<any>({ groups: [], services: [] });

    useEffect(() => {
        if (config) {
            setLocalConfig({
                groups: config.groups || [],
                services: config.services || []
            });
        }
    }, [config]);

    const addGroup = () => {
        const id = `group-${Date.now()}`;
        const newConfig = { ...localConfig, groups: [...localConfig.groups, { id, name: 'New Group', order: localConfig.groups.length }] };
        setLocalConfig(newConfig);
        onChange(newConfig);
    };

    const addService = () => {
        const id = `service-${Date.now()}`;
        const newService = {
            id,
            name: 'New Service',
            url: '',
            category: 'web',
            type: 'http',
            groupId: null,
            isCritical: true,
            description: ''
        };
        const newConfig = { ...localConfig, services: [...localConfig.services, newService] };
        setLocalConfig(newConfig);
        onChange(newConfig);
    };

    const updateGroup = (id: string, field: string, value: any) => {
        const newConfig = {
            ...localConfig,
            groups: localConfig.groups.map((g: any) => g.id === id ? { ...g, [field]: value } : g)
        };
        setLocalConfig(newConfig);
        onChange(newConfig);
    };

    const updateService = (id: string, field: string, value: any) => {
        const newConfig = {
            ...localConfig,
            services: localConfig.services.map((s: any) => s.id === id ? { ...s, [field]: value } : s)
        };
        setLocalConfig(newConfig);
        onChange(newConfig);
    };

    const removeGroup = async (id: string) => {
        appConfirm(`Remove group ${id}? Services inside it won't be deleted but will lose their group.`, () => {
            const newConfig = {
                ...localConfig,
                groups: localConfig.groups.filter((g: any) => g.id !== id),
                services: localConfig.services.map((s: any) => s.groupId === id ? { ...s, groupId: null } : s)
            };
            setLocalConfig(newConfig);
            onChange(newConfig);
        });
    };

    const removeService = async (id: string) => {
        appConfirm(`Remove service ${id}?`, () => {
            const newConfig = {
                ...localConfig,
                services: localConfig.services.filter((s: any) => s.id !== id)
            };
            setLocalConfig(newConfig);
            onChange(newConfig);
        });
    };

    return (
        <div className="flex flex-col gap-6 w-full">
            <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
                <div className="flex justify-between items-center mb-6 border-b border-border pb-4">
                    <h4 className="font-bold text-xl text-text">Service Groups</h4>
                    <button onClick={addGroup} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-text rounded-md text-sm font-bold transition-colors">Add Group</button>
                </div>
                {localConfig.groups.map((group: any) => (
                    <div key={group.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 mb-3 bg-black/20 rounded-lg border border-border hover:border-plex/50 transition-colors gap-4">
                        <div className="flex-1 flex flex-col md:flex-row gap-3 w-full">
                            <input
                                type="text"
                                value={group.name}
                                onChange={(e) => updateGroup(group.id, 'name', e.target.value)}
                                className="flex-1 p-2 rounded bg-background border border-border focus:border-plex outline-none text-sm"
                                placeholder="Group Name"
                            />
                            <div className="flex-1 flex items-center px-3 py-2 rounded bg-black/40 border border-border/50 text-sm font-mono text-muted cursor-not-allowed overflow-hidden text-ellipsis whitespace-nowrap">
                                {group.id}
                            </div>
                        </div>
                        <button onClick={() => removeGroup(group.id)} className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors bg-red-400/10 px-3 py-2 rounded flex-shrink-0">Remove</button>
                    </div>
                ))}
                {localConfig.groups.length === 0 && <p className="text-muted text-sm italic p-4 text-center border border-dashed border-border rounded-lg">No groups defined. Create one to organize your services.</p>}
            </div>

            <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
                <div className="flex justify-between items-center mb-6 border-b border-border pb-4">
                    <h4 className="font-bold text-xl text-text">Monitored Services</h4>
                    <button onClick={addService} className="px-4 py-2 bg-plex text-background hover:bg-plex-hover rounded-md text-sm font-bold transition-colors shadow-lg">Add Service</button>
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {localConfig.services.map((service: any) => (
                        <div key={service.id} className="flex flex-col p-4 bg-black/20 rounded-xl border border-border hover:border-plex/50 transition-colors gap-3">
                            <div className="flex justify-between items-start gap-3">
                                <div className="flex-1 flex flex-col gap-2">
                                    <input
                                        type="text"
                                        value={service.name}
                                        onChange={(e) => updateService(service.id, 'name', e.target.value)}
                                        className="w-full p-2 rounded bg-background border border-border focus:border-plex outline-none text-sm font-bold"
                                        placeholder="Service Name"
                                    />
                                    <input
                                        type="text"
                                        value={service.url}
                                        onChange={(e) => updateService(service.id, 'url', e.target.value)}
                                        className="w-full p-2 rounded bg-background border border-border focus:border-plex outline-none text-sm font-mono"
                                        placeholder="Service URL (e.g. https://...)"
                                    />
                                </div>
                                <button onClick={() => removeService(service.id)} className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors bg-red-400/10 px-3 py-2 rounded flex-shrink-0">Remove</button>
                            </div>
                            <div className="flex flex-wrap items-center justify-between gap-3 mt-1 text-sm border-t border-border/50 pt-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-muted">Group:</span>
                                    <div className="w-48">
                                        <CustomSelect
                                            value={service.groupId || ''}
                                            onChange={(val) => updateService(service.id, 'groupId', val || null)}
                                            options={[
                                                { label: 'None', value: '' },
                                                ...localConfig.groups.map((g: any) => ({ label: g.name, value: g.id }))
                                            ]}
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={() => updateService(service.id, 'isCritical', !service.isCritical)}
                                    className={`px-3 py-1.5 rounded text-xs font-bold transition-colors flex items-center gap-2 ${service.isCritical ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-white/10 text-muted hover:bg-white/20'}`}
                                >
                                    Critical: {service.isCritical ? 'Yes' : 'No'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                {localConfig.services.length === 0 && <p className="text-muted text-sm italic p-4 text-center border border-dashed border-border rounded-lg">No services defined. Add some services to monitor.</p>}
            </div>
        </div>
    );
};

const BroadcastSettingsTab: React.FC<{ selectedUserIds: string[]; users: User[]; }> = ({ selectedUserIds, users }) => {
    const [subject, setSubject] = useState('Big updates to the Plex Server! 🚀');
    const [body, setBody] = useState(`🎬 <b>Hey everyone! Big updates to the Plex Server!</b> 🚀<br><br>If you have any friends or family who want to check out the server, I’m currently offering a <b>3-Day Temporary Access</b> pass with instant access to the entire library! 🍿<br>✅ No bank details needed<br>✅ No purchase required<br>✅ Instant, automated setup<br><br>We also just launched a brand new <b>User Portal</b> (https://yourdomain.com) packed with awesome features for everyone:<br>🕒 <b>Account Status:</b> Easily check exactly how many days you have left until your account expires.<br>🟢 <b>Server Health:</b> View live 24/7 uptime stats for all server services.<br>📊 <b>Live Library Stats:</b> See exact, live counts of our massive library.<br><br>Feel free to share the link (https://yourdomain.com) with anyone who might be interested! 👇`);
    const [recipientFilter, setRecipientFilter] = useState<'all' | 'active' | 'trial' | 'expiring' | 'expired' | 'selected' | 'custom'>('all');
    const [customSelectedUserIds, setCustomSelectedUserIds] = useState<string[]>([]);
    const [isSending, setIsSending] = useState(false);
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const [isSendingTest, setIsSendingTest] = useState(false);

    const handleSend = async () => {
        setIsSending(true);
        try {
            const finalFilter = recipientFilter === 'custom' ? 'selected' : recipientFilter;
            const finalSelectedIds = recipientFilter === 'custom' ? customSelectedUserIds : selectedUserIds;

            const res = await apiFetch('/api/users/broadcast', {
                method: 'POST',
                body: JSON.stringify({ subject, body, recipientFilter: finalFilter, selectedUserIds: finalSelectedIds })
            });
            alert(res.message);
        } catch (e: any) {
            alert(e.message || 'Failed to send broadcast');
        } finally {
            setIsSending(false);
        }
    };

    const handleTestSend = async () => {
        setIsSendingTest(true);
        try {
            const res = await apiFetch('/api/users/broadcast/test', {
                method: 'POST',
                body: JSON.stringify({ subject, body })
            });
            alert(res.message);
        } catch (e: any) {
            alert(e.message || 'Failed to send test broadcast');
        } finally {
            setIsSendingTest(false);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div>
                <label className="block mb-2 font-bold text-text">Recipients</label>
                <CustomSelect
                    value={recipientFilter}
                    onChange={val => setRecipientFilter(val as any)}
                    options={[
                        { label: 'All Users', value: 'all' },
                        { label: 'Active Users Only', value: 'active' },
                        { label: 'Temporary Access Users Only', value: 'trial' },
                        { label: 'Expiring Soon (Next 7 Days)', value: 'expiring' },
                        { label: 'Expired Users', value: 'expired' },
                        ...(selectedUserIds.length > 0 ? [{ label: `Selected Users (${selectedUserIds.length})`, value: 'selected' }] : []),
                        { label: 'Custom User Selection...', value: 'custom' }
                    ]}
                />
            </div>

            {recipientFilter === 'custom' && (
                <div className="p-4 bg-black/20 border border-border rounded-lg max-h-48 overflow-y-auto">
                    <div className="mb-2 font-bold text-text">Select Users ({customSelectedUserIds.length} selected):</div>
                    {users.map(u => (
                        <label key={u.id} className="flex items-center gap-2 cursor-pointer py-1 text-sm text-text hover:text-plex transition-colors">
                            <input className="accent-plex w-4 h-4"
                                type="checkbox"
                                checked={customSelectedUserIds.includes(u.id)}
                                onChange={(e) => {
                                    if (e.target.checked) setCustomSelectedUserIds(prev => [...prev, u.id]);
                                    else setCustomSelectedUserIds(prev => prev.filter(id => id !== u.id));
                                }}
                            />
                            {u.username} <span className="text-muted">({u.email || 'No email'})</span>
                        </label>
                    ))}
                </div>
            )}

            <div>
                <label className="block mb-2 font-bold text-text">Subject</label>
                <input className="w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all"
                    type="text"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                />
            </div>

            <div>
                <div className="flex justify-between items-center mb-2">
                    <label className="font-bold text-text m-0">Email Body (HTML supported)</label>
                    <button className="px-3 py-1 bg-border text-text rounded text-xs font-medium hover:bg-opacity-80 transition-colors" onClick={() => setIsPreviewMode(!isPreviewMode)}>
                        {isPreviewMode ? 'Edit HTML' : 'Preview Output'}
                    </button>
                </div>
                {isPreviewMode ? (
                    <iframe
                        title="Email body preview"
                        sandbox=""
                        srcDoc={body}
                        className="w-full h-[300px] rounded-lg bg-white border border-border"
                    />
                ) : (
                    <textarea
                        value={body}
                        onChange={e => setBody(e.target.value)}
                        className="w-full h-[300px] p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all font-mono text-sm"
                    />
                )}
            </div>

            <div className="flex justify-end gap-3 mt-2">
                <button className="px-6 py-2.5 bg-border text-text rounded-lg font-bold hover:bg-opacity-80 transition-colors flex items-center justify-center gap-2" onClick={handleTestSend} disabled={isSending || isSendingTest}>
                    {isSendingTest ? 'Sending Test...' : 'Send Test To Admin'}
                </button>
                <button className="px-6 py-2.5 bg-plex text-background rounded-lg font-bold hover:bg-plex-hover transition-colors flex items-center justify-center gap-2" onClick={handleSend} disabled={isSending || isSendingTest}>
                    {isSending ? 'Sending...' : 'Send Broadcast'}
                </button>
            </div>
        </div>
    );
};
const UserAnalyticsModal: React.FC<{ userId: string, username: string, thumb: string | null, days: string, onClose: () => void }> = ({ userId, username, thumb, days, onClose }) => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

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

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-card/90 border border-border w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-6 border-b border-border flex items-center justify-between bg-black/20 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-r from-plex to-[#e5a00d]">
                            <img src={thumb ? (thumb.startsWith('http') ? thumb : `/api/plex/image?path=${encodeURIComponent(thumb)}&width=128&height=128`) : '/static/logo.png'} alt={username} className="w-full h-full rounded-full object-cover bg-card" onError={(e) => { (e.target as HTMLImageElement).src = '/static/logo.png'; }} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-text">{username}</h2>
                            <p className="text-muted text-sm">{loading ? 'Loading stats...' : `${data?.totalPlays || 0} total plays (${days === 'all' ? 'All Time' : `Last ${days} Days`})`}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-muted hover:text-white transition-colors bg-white/5 p-2 rounded-full"><X className="w-6 h-6" /></button>
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
                    ) : (
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
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                                        {data.topMovies.map((c: any, i: number) => (
                                            <a key={c.key} href={c.plexUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-black/20 p-2 rounded border border-white/5 hover:bg-white/10 transition-colors">
                                                <div className="w-8 h-12 bg-black/40 rounded overflow-hidden flex-shrink-0 relative">
                                                    {c.thumbUrl && <img src={c.thumbUrl} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />}
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
                                                    {c.thumbUrl && <img src={c.thumbUrl} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />}
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
                                                    {c.thumbUrl && <img src={c.thumbUrl} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />}
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

                            {/* Recent History */}
                            <div>
                                <h3 className="text-lg font-bold text-text mb-4 uppercase tracking-wider flex items-center gap-2"><Activity className="text-plex w-4 h-4" /> Recent Watch History</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {data.recentHistory.length === 0 ? <p className="text-muted text-sm col-span-full">No recent history.</p> : data.recentHistory.map((h: any, i: number) => (
                                        <a key={i} href={h.plexUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-white/5 border border-white/5 p-2 rounded-lg hover:bg-white/10 transition-colors">
                                            <div className={`${h.type === 'track' ? 'w-12 h-12' : 'w-10 h-14'} bg-black/40 rounded overflow-hidden flex-shrink-0`}>
                                                {h.thumbUrl && <img src={h.thumbUrl} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />}
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
            <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
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
                                    <img src={item.thumbUrl} className="w-10 h-10 rounded-lg object-cover" />
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
                            <img src={thumb ? (thumb.startsWith('http') ? thumb : `/api/plex/image?path=${encodeURIComponent(thumb)}&width=128&height=128`) : '/static/logo.png'} alt={username} className="w-full h-full rounded-full object-cover bg-card" onError={(e) => { (e.target as HTMLImageElement).src = '/static/logo.png'; }} />
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
                                                    {c.thumbUrl && <img src={c.thumbUrl} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />}
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
                                                    {c.thumbUrl && <img src={c.thumbUrl} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />}
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
                                                    {c.thumbUrl && <img src={c.thumbUrl} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />}
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
                                                {h.thumbUrl && <img src={h.thumbUrl} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />}
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

const MediaStackDashboard: React.FC<{ isAdmin: boolean }> = ({ isAdmin }) => {
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
                                    {Object.entries(groupedCalendar).map(([dateStr, items]) => (
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
            <div className="flex justify-center items-center h-64 bg-card/50 backdrop-blur-md rounded-xl border border-border mt-6">
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
            <div className="bg-card/50 backdrop-blur-md rounded-xl p-4 md:p-6 shadow-xl border border-border relative overflow-hidden">
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
                <div className="bg-card/50 backdrop-blur-md rounded-xl p-4 md:p-6 shadow-xl border border-border relative overflow-hidden">
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
                <div className="bg-card/50 backdrop-blur-md rounded-xl p-4 md:p-6 shadow-xl border border-border relative overflow-hidden">
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
                <div className="bg-card/50 backdrop-blur-md rounded-xl p-4 md:p-6 shadow-xl border border-border relative overflow-hidden">
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
                <div className="bg-card/50 backdrop-blur-md rounded-xl p-4 md:p-6 shadow-xl border border-border relative overflow-hidden">
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
                <div className="bg-card/50 backdrop-blur-md rounded-xl p-4 md:p-6 shadow-xl border border-border relative overflow-hidden">
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
                <div className="bg-card/50 backdrop-blur-md rounded-xl p-4 md:p-6 shadow-xl border border-border relative overflow-hidden flex flex-col justify-between">
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
                <div className="bg-card/50 backdrop-blur-md rounded-xl p-4 md:p-6 shadow-xl border border-border relative overflow-hidden">
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
                <div className="bg-card/50 backdrop-blur-md rounded-xl p-4 md:p-6 shadow-xl border border-border relative overflow-hidden flex flex-col justify-between">
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

const AnalyticsDashboard: React.FC<{ isAdmin: boolean, sessionInfo: any }> = ({ isAdmin, sessionInfo }) => {
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
            sourceDays: string,
            totalPlaybacks: { absolute: number, percent: number | null },
            uniqueViewers: { absolute: number, percent: number | null },
            libraryPlays: { absolute: number, percent: number | null }
        } | null,
        libraryHealth?: {
            activeLibraries: number,
            concentrationPct: number,
            totalCatalogItems: number,
            sizeGB: number,
            fourKPercent: number,
            healthLabel: string
        }
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
            try {
                const data = await apiFetch(`/api/plex/analytics?days=${days}`);
                if (cancelled) return;
                setAnalyticsData(data);

                if (isAdmin) {
                    try {
                        const tData = await apiFetch('/api/tautulli/stats');
                        if (cancelled) return;
                        setTautulliData(tData);
                    } catch (e) {
                        // Tautulli might not be configured, ignore error
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
    }, [days, isAdmin]);

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

    const renderDelta = (delta?: { absolute: number, percent: number | null } | null) => {
        if (!delta) return null;
        const isUp = delta.absolute >= 0;
        const sign = isUp ? '+' : '';
        const pctText = delta.percent === null ? `${sign}${delta.absolute}` : `${sign}${delta.percent}%`;
        return (
            <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold mt-1 ${isUp ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
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
                        <button onClick={() => setViewTab('graphs')} className={`px-4 py-2 rounded-md text-sm font-bold uppercase tracking-wider transition-colors flex items-center gap-2 ${viewTab === 'graphs' ? 'bg-plex text-white shadow-lg' : 'text-muted hover:text-white'}`}>
                            <LucideLineChart className="w-4 h-4" /> Graphs
                        </button>
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
                    {/* High Level Stats Overview */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-card/50 backdrop-blur-md rounded-xl p-6 shadow-xl border border-border flex items-center gap-4">
                            <div className="bg-plex/10 p-4 rounded-full">
                                <PlaySquare className="text-plex w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-muted text-sm uppercase tracking-wider font-bold mb-1">Total Playbacks</p>
                                <p className="text-2xl font-black text-text"><CountUp end={totalPlaybacks} /></p>
                                {renderDelta(compare?.totalPlaybacks)}
                            </div>
                        </div>
                        <div className="bg-card/50 backdrop-blur-md rounded-xl p-6 shadow-xl border border-border flex items-center gap-4">
                            <div className="bg-plex/10 p-4 rounded-full">
                                <Users className="text-plex w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-muted text-sm uppercase tracking-wider font-bold mb-1">Unique Viewers</p>
                                <p className="text-lg font-bold text-text truncate max-w-[150px]" title={String(uniqueActiveViewers)}>{uniqueActiveViewers}</p>
                                {renderDelta(compare?.uniqueViewers)}
                            </div>
                        </div>
                        <div className="bg-card/50 backdrop-blur-md rounded-xl p-6 shadow-xl border border-border flex items-center gap-4 col-span-1 sm:col-span-2">
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
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-card/50 backdrop-blur-md rounded-xl p-4 border border-border">
                                <p className="text-muted text-xs uppercase tracking-wider font-bold mb-1">Library Health</p>
                                <p className="text-xl font-black text-plex">{libraryHealth.healthLabel}</p>
                            </div>
                            <div className="bg-card/50 backdrop-blur-md rounded-xl p-4 border border-border">
                                <p className="text-muted text-xs uppercase tracking-wider font-bold mb-1">Active Libraries</p>
                                <p className="text-xl font-black text-text">{libraryHealth.activeLibraries}</p>
                            </div>
                            <div className="bg-card/50 backdrop-blur-md rounded-xl p-4 border border-border">
                                <p className="text-muted text-xs uppercase tracking-wider font-bold mb-1">Catalog Size</p>
                                <p className="text-xl font-black text-text">{libraryHealth.totalCatalogItems.toLocaleString()}</p>
                                <p className="text-[11px] text-muted">{libraryHealth.sizeGB} GB</p>
                            </div>
                            <div className="bg-card/50 backdrop-blur-md rounded-xl p-4 border border-border">
                                <p className="text-muted text-xs uppercase tracking-wider font-bold mb-1">Usage Concentration</p>
                                <p className="text-xl font-black text-text">{libraryHealth.concentrationPct}%</p>
                                <p className="text-[11px] text-muted">4K Coverage: {libraryHealth.fourKPercent}%</p>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Top Users Card */}
                        <div className="bg-card/50 backdrop-blur-md rounded-xl p-4 md:p-6 shadow-xl border border-border lg:col-span-2">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
                                <h2 className="text-xl font-bold text-text uppercase tracking-wider flex items-center gap-2 whitespace-nowrap"><Users className="text-plex w-5 h-5" /> Top Viewers</h2>
                                {isAdmin && (
                                <div className="relative w-full sm:w-auto flex-grow max-w-[250px] z-50">
                                    <input
                                        type="text"
                                        placeholder="Search all users..."
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            setIsSearching(e.target.value.length > 0);
                                        }}
                                        onFocus={() => {
                                            if (searchQuery.length > 0) setIsSearching(true);
                                        }}
                                        onBlur={() => setTimeout(() => setIsSearching(false), 200)}
                                        className="w-full bg-black/40 border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all placeholder-muted/50"
                                    />
                                    {isSearching && searchQuery.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-[#1e2329] border border-border rounded-lg shadow-2xl z-[100] max-h-60 overflow-y-auto custom-scrollbar">
                                            {allUsers.filter(u => u.username.toLowerCase().includes(searchQuery.toLowerCase())).length > 0 ? (
                                                allUsers.filter(u => u.username.toLowerCase().includes(searchQuery.toLowerCase())).map(u => (
                                                    <div
                                                        key={u.id}
                                                        className="px-3 py-2.5 hover:bg-white/10 cursor-pointer flex items-center gap-3 border-b border-white/5 last:border-0 transition-colors"
                                                        onClick={() => {
                                                            setSelectedUser({ id: u.id, username: u.username, thumb: u.thumb || null });
                                                            setSearchQuery('');
                                                            setIsSearching(false);
                                                        }}
                                                    >
                                                        {u.thumb ? (
                                                            <img src={u.thumb.startsWith('http') ? u.thumb : `/api/plex/image?path=${encodeURIComponent(u.thumb)}&width=32&height=32`} className="w-8 h-8 rounded-full object-cover border border-border flex-shrink-0" />
                                                        ) : (
                                                            <div className="w-8 h-8 rounded-full bg-border flex items-center justify-center text-[10px] font-bold border border-border/50 flex-shrink-0">{u.username.substring(0, 2).toUpperCase()}</div>
                                                        )}
                                                        <span className="text-sm font-medium text-text truncate">{u.username}</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="px-4 py-4 text-sm text-muted text-center italic">No users found</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                )}
                            </div>
                            <div className="flex flex-col gap-4">
                                {topUsers.length === 0 ? <p className="text-muted text-sm">No data available.</p> : pagedTopUsers.map((user, idx) => (
                                    <div key={user.id} onClick={() => { if (isAdmin) setSelectedUser({ id: user.id, username: user.username, thumb: user.thumb }); }} className={`flex items-center justify-between p-3 bg-black/20 rounded-lg transition-colors group ${isAdmin ? 'hover:bg-black/40 cursor-pointer hover:ring-1 hover:ring-plex' : ''}`}>
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <div className="w-10 h-10 rounded-full p-[2px] bg-gradient-to-r from-plex to-[#e5a00d]">
                                                    <img src={user.thumb ? (user.thumb.startsWith('http') ? user.thumb : `/api/plex/image?path=${encodeURIComponent(user.thumb)}&width=80&height=80`) : '/static/logo.png'} alt={user.username} className="w-full h-full rounded-full object-cover bg-card" onError={(e) => { (e.target as HTMLImageElement).src = '/static/logo.png'; }} />
                                                </div>
                                                <div className="absolute -top-2 -right-2 bg-plex text-black font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center">#{((viewerPageSafe - 1) * viewersPerPage) + idx + 1}</div>
                                            </div>
                                            <span className="font-bold text-text group-hover:text-plex transition-colors">{user.username}</span>
                                        </div>
                                        <span className="font-mono text-plex font-bold">{user.plays} plays</span>
                                    </div>
                                ))}
                                {topUsers.length > viewersPerPage && (
                                    <div className="flex items-center justify-between pt-2">
                                        <button
                                            onClick={() => setViewerPage(Math.max(1, viewerPageSafe - 1))}
                                            disabled={viewerPageSafe === 1}
                                            className="px-3 py-1.5 text-xs font-bold rounded-md border border-border bg-black/20 text-text disabled:opacity-40 disabled:cursor-not-allowed hover:bg-black/40 transition-colors"
                                        >
                                            Previous
                                        </button>
                                        <span className="text-xs text-muted font-semibold">
                                            Page {viewerPageSafe} of {totalViewerPages}
                                        </span>
                                        <button
                                            onClick={() => setViewerPage(Math.min(totalViewerPages, viewerPageSafe + 1))}
                                            disabled={viewerPageSafe >= totalViewerPages}
                                            className="px-3 py-1.5 text-xs font-bold rounded-md border border-border bg-black/20 text-text disabled:opacity-40 disabled:cursor-not-allowed hover:bg-black/40 transition-colors"
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Top Devices & Libraries Container */}
                        <div className="flex flex-col gap-6 lg:col-span-1">
                            {/* Popular Libraries Card */}
                            <div className="bg-card/50 backdrop-blur-md rounded-xl p-4 md:p-6 shadow-xl border border-border">
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
                                <div className="bg-card/50 backdrop-blur-md rounded-xl p-4 md:p-6 shadow-xl border border-border mt-6">
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

                        {/* Tautulli Insights Card */}
                        {tautulliData && (
                            <div className="bg-card/50 backdrop-blur-md rounded-xl p-4 md:p-6 shadow-xl border border-border col-span-full relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none">
                                    <Activity className="w-32 h-32 text-[#3b82f6]" />
                                </div>
                                <h2 className="text-xl font-bold text-text mb-6 uppercase tracking-wider flex items-center gap-2 relative z-10"><Activity className="text-[#3b82f6] w-5 h-5" /> Tautulli All-Time Insights</h2>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
                                    <div className="flex flex-col p-4 bg-black/20 rounded-lg border border-white/5 shadow-inner">
                                        <span className="font-bold text-muted text-xs uppercase tracking-wider mb-2 flex items-center gap-2"><Users className="w-4 h-4 text-[#3b82f6]" /> Peak Streams</span>
                                        <span className="font-mono font-black text-[#3b82f6] text-3xl">{tautulliData.streamsRecord || 0}</span>
                                    </div>
                                    <div className="flex flex-col p-4 bg-black/20 rounded-lg border border-white/5 shadow-inner">
                                        <span className="font-bold text-muted text-xs uppercase tracking-wider mb-2 flex items-center gap-2"><Clock className="w-4 h-4 text-green-400" /> Watch Time</span>
                                        <span className="font-mono font-black text-green-400 text-sm xl:text-lg leading-tight mt-auto">{tautulliData.totalTimeStr || '0 hrs'}</span>
                                    </div>
                                    <div className="flex flex-col p-4 bg-black/20 rounded-lg border border-white/5 shadow-inner">
                                        <span className="font-bold text-muted text-xs uppercase tracking-wider mb-2 flex items-center gap-2"><PlaySquare className="w-4 h-4 text-purple-400" /> TV Shows Played</span>
                                        <span className="font-mono font-black text-purple-400 text-3xl">{tautulliData.tvPlays ? tautulliData.tvPlays.toLocaleString() : 0}</span>
                                    </div>
                                    <div className="flex flex-col p-4 bg-black/20 rounded-lg border border-white/5 shadow-inner">
                                        <span className="font-bold text-muted text-xs uppercase tracking-wider mb-2 flex items-center gap-2"><Film className="w-4 h-4 text-red-400" /> Movies Played</span>
                                        <span className="font-mono font-black text-red-400 text-3xl">{tautulliData.moviePlays ? tautulliData.moviePlays.toLocaleString() : 0}</span>
                                    </div>
                                    <div className="flex flex-col p-4 bg-black/20 rounded-lg border border-white/5 shadow-inner">
                                        <span className="font-bold text-muted text-xs uppercase tracking-wider mb-2 flex items-center gap-2"><Monitor className="w-4 h-4 text-cyan-400" /> Peak Direct Plays</span>
                                        <span className="font-mono font-black text-cyan-400 text-3xl">{tautulliData.directPlayRecord || 0}</span>
                                    </div>
                                    <div className="flex flex-col p-4 bg-black/20 rounded-lg border border-white/5 shadow-inner">
                                        <span className="font-bold text-muted text-xs uppercase tracking-wider mb-2 flex items-center gap-2"><Activity className="w-4 h-4 text-orange-400" /> Peak Direct Streams</span>
                                        <span className="font-mono font-black text-orange-400 text-3xl">{tautulliData.directStreamRecord || 0}</span>
                                    </div>
                                    <div className="flex flex-col p-4 bg-black/20 rounded-lg border border-white/5 shadow-inner">
                                        <span className="font-bold text-muted text-xs uppercase tracking-wider mb-2 flex items-center gap-2"><Settings className="w-4 h-4 text-rose-400" /> Peak Transcodes</span>
                                        <span className="font-mono font-black text-rose-400 text-3xl">{tautulliData.transcodeRecord || 0}</span>
                                    </div>
                                    <div className="flex flex-col p-4 bg-black/20 rounded-lg border border-white/5 shadow-inner">
                                        <span className="font-bold text-muted text-xs uppercase tracking-wider mb-2 flex items-center gap-2"><Music className="w-4 h-4 text-yellow-400" /> Music Played</span>
                                        <span className="font-mono font-black text-yellow-400 text-3xl">{tautulliData.musicPlays ? tautulliData.musicPlays.toLocaleString() : 0}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Trending Content Card */}
                        <div className="bg-card/50 backdrop-blur-md rounded-xl p-4 md:p-6 shadow-xl border border-border col-span-full">
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
                                                <img src={item.thumbUrl} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
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
const LogsDashboard: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
    const [deletedUsers, setDeletedUsers] = useState<any[]>([]);
    const [auditEntries, setAuditEntries] = useState<any[]>([]);
    const [isLoading, setLoading] = useState(true);
    const [toasts, setToasts] = useState<any[]>([]);
    const [auditPage, setAuditPage] = useState(1);
    const [emailPage, setEmailPage] = useState(1);
    const itemsPerPage = 20;

    const addToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        setToasts(t => [...t, { id: Date.now(), message, type }]);
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
            <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[2000] flex flex-col-reverse gap-2 items-center">
                {toasts.map(toast => <Toast key={toast.id} {...toast} onDismiss={() => setToasts(t => t.filter(item => item.id !== toast.id))} />)}
            </div>
            <header className="hidden md:flex items-center justify-between w-full mb-6 mt-2 md:mt-0">
                <h1 className="text-xl md:text-3xl font-bold text-plex">System Logs</h1>
            </header>
            <main>
                <div className="flex flex-col gap-6 mb-8">
                    <section className="bg-card border border-border rounded-xl p-4 md:p-5 shadow-md">
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

                    <section className="bg-card border border-border rounded-xl p-4 md:p-5 shadow-md">
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

                    <section className="bg-card border border-border rounded-xl p-4 md:p-5 shadow-md">
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

const AdminDashboard: React.FC<{ onLogout: () => void, onViewUserPortal: () => void, onViewStatus: () => void, onViewDashboard: () => void }> = ({ onLogout, onViewUserPortal, onViewStatus, onViewDashboard }) => {
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

    const addToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        setToasts(t => [...t, { id: Date.now(), message, type }]);
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
                    addToast('Welcome! Please configure your Plex settings to begin.', 'success');
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
            addToast('Please configure Plex settings first.', 'error');
            return;
        }
        setLoading(true);
        try {
            const result = await apiFetch('/api/sync', { method: 'POST' });
            addToast(result.message || `Synced ${result.count} users from Plex.`);
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
        appConfirm('Are you sure you want to delete this user? This will revoke Plex access first.', async () => {
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
            <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[2000] flex flex-col-reverse gap-2 items-center">
                {toasts.map(toast => <Toast key={toast.id} {...toast} onDismiss={() => setToasts(t => t.filter(item => item.id !== toast.id))} />)}
            </div>

            <header className="hidden md:flex items-center justify-between w-full mb-6 mt-2 md:mt-0">
                <h1 className="text-xl md:text-3xl font-bold text-plex">Users Management</h1>
            </header>
            <main>
                {isConfigured && (
                    <div className="flex flex-col md:flex-row gap-4 md:items-center mb-8 bg-card border border-border p-4 rounded-xl shadow-md">
                        <span className="font-bold text-muted uppercase tracking-wider text-sm hidden md:inline-block mr-2">Quick Actions:</span>
                        <div className="grid grid-cols-2 md:flex md:flex-row gap-3 w-full md:w-auto flex-1">
                            <button className="col-span-2 md:col-span-1 px-3 py-2 bg-plex text-background rounded-md font-bold hover:bg-plex-hover transition-colors flex items-center justify-center gap-2 text-sm md:text-base" onClick={handleImportUsers} disabled={isLoading}>
                                Sync Plex Users
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
                    <div className="bg-card border border-border p-4 rounded-xl flex justify-between items-center mb-8 flex-wrap gap-4 w-full">
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

    if (!config.services || config.services.length === 0) return null;

    return (
        <div className="w-full flex flex-col items-center mt-2 mb-4">
            <div className="flex flex-col items-center text-center mb-4">
                <a href="/status" className="text-plex hover:text-plex-hover font-bold text-[10px] tracking-wider uppercase mb-1 transition-colors">
                    View Full Status Page &rarr;
                </a>
                <h3 className="text-text font-bold uppercase tracking-widest text-sm">Live System Status</h3>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
                {config.services.map((service: any) => {
                    const health = healthData[service.id];
                    if (!health) return null;
                    const isUp = health.currentStatus === 'online';
                    const colorClass = isUp ? 'border-green-500/30 bg-green-500/10' : 'border-red-500/30 bg-red-500/10';
                    const dotClass = isUp ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]';

                    return (
                        <div key={service.id} className={`flex items-center gap-2 px-4 py-2 rounded-full border ${colorClass} backdrop-blur-sm`}>
                            <span className={`w-2 h-2 rounded-full ${dotClass}`}></span>
                            <span className="text-sm font-bold text-text">{service.name}</span>
                            <span className="text-xs font-bold text-muted">{health.uptimePercentage}%</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const LivePlexStats: React.FC = () => {
    const [stats, setStats] = useState<{ movies: number, shows: number, music: number, fourKPercent?: number } | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            const endpoints = ['/api/public/plex/stats', '/api/plex/stats'];

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
        <ul className="server-features">
            <li>🎬 10,000+ Movies & TV Shows</li>
            <li>🎵 Thousands of Music Albums</li>
            <li>🔄 Automated Request System</li>
        </ul>
    );

    return (
        <div className="w-full flex flex-col items-center mt-6 mb-8">
            <div className="bg-plex/10 text-plex text-xs font-bold px-4 py-1.5 rounded-full border border-plex/20 uppercase tracking-wider mb-4">
                Live Library Stats
            </div>
            <div className="grid grid-cols-3 gap-3 w-full">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center gap-1 shadow-lg backdrop-blur-sm">
                    <span className="text-xl">🎬</span>
                    <span className="text-plex font-bold text-xl">{stats.movies.toLocaleString()}</span>
                    <span className="text-muted text-[10px] uppercase tracking-wider font-bold">Movies</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center gap-1 shadow-lg backdrop-blur-sm">
                    <span className="text-xl">📺</span>
                    <span className="text-plex font-bold text-xl">{stats.shows.toLocaleString()}</span>
                    <span className="text-muted text-[10px] uppercase tracking-wider font-bold">TV Shows</span>
                </div>
                {stats.music > 0 && (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center gap-1 shadow-lg backdrop-blur-sm">
                        <span className="text-xl">🎵</span>
                        <span className="text-plex font-bold text-xl">{stats.music.toLocaleString()}</span>
                        <span className="text-muted text-[10px] uppercase tracking-wider font-bold">Artists</span>
                    </div>
                )}
            </div>
            <div className="w-full mt-3">
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col items-center justify-center gap-1 shadow-lg backdrop-blur-sm">
                    <span className="text-plex font-bold text-lg flex items-center gap-2"><span className="text-orange-500">⚡</span> {stats.fourKPercent !== undefined ? stats.fourKPercent : 30}%</span>
                    <span className="text-muted text-[10px] uppercase tracking-wider font-bold">Available in 4K</span>
                </div>
            </div>
        </div>
    );
};

const SetupWizard: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    const [token, setToken] = useState('');
    const [serverIdentifier, setServerIdentifier] = useState('');
    const [servers, setServers] = useState<PlexServer[]>([]);
    const [sonarrUrl, setSonarrUrl] = useState('');
    const [sonarrApiKey, setSonarrApiKey] = useState('');
    const [radarrUrl, setRadarrUrl] = useState('');
    const [radarrApiKey, setRadarrApiKey] = useState('');
    const [tautulliUrl, setTautulliUrl] = useState('');
    const [tautulliApiKey, setTautulliApiKey] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleFetchServers = async () => {
        if (!token) {
            setError('Please enter a Plex token first.');
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            const foundServers = await apiFetch('/api/plex/servers', {
                method: 'POST',
                body: JSON.stringify({ token })
            });

            setServers(foundServers);

            if (foundServers.length > 0) {
                setServerIdentifier(foundServers[0].identifier);
            } else {
                setError('No owned servers found for this token. Make sure you are the owner.');
                setServerIdentifier('');
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : 'An unknown error occurred.');
            setServers([]);
            setServerIdentifier('');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const res = await apiFetch('/api/config', {
                method: 'POST',
                body: JSON.stringify({ token, serverIdentifier, sonarrUrl, sonarrApiKey, radarrUrl, radarrApiKey, tautulliUrl, tautulliApiKey })
            });
            if (res.error) throw new Error(res.error);
            onComplete();
        } catch (err: any) {
            setError(err.message || 'Failed to save configuration');
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto px-4 py-12 md:py-20">
            <div className="bg-card rounded-2xl shadow-2xl border border-white/10 p-5 md:p-8 lg:p-12 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-plex to-[#e5a00d]"></div>
                <div className="flex flex-col items-center text-center mb-8">
                    <div className="w-16 h-16 bg-plex/10 rounded-full flex items-center justify-center mb-4 border border-plex/20">
                        <Settings className="w-8 h-8 text-plex" />
                    </div>
                    <h1 className="text-3xl font-bold text-text mb-2">Initial Setup</h1>
                    <p className="text-muted">Configure your Plex server details to get started.</p>
                </div>

                {error && <div className="p-4 bg-status-expiring/20 border border-status-expiring/50 rounded-lg text-status-expiring mb-6">{error}</div>}

                <div className="mb-8 p-4 bg-plex/5 border border-plex/20 rounded-xl text-sm text-muted">
                    <h3 className="text-plex font-bold mb-2 flex items-center gap-2"><Sparkles className="w-4 h-4" /> Need help finding these?</h3>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Plex Token:</strong> Log into Plex Web, view the XML of any library item, and look for <code className="bg-background px-1 rounded">X-Plex-Token=...</code> in the URL.</li>
                        <li><strong>Server Identifier:</strong> You can automatically fetch this by entering your token and clicking <strong>Fetch Servers</strong>.</li>
                    </ul>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-muted uppercase tracking-wider">Plex Token</label>
                        <div className="flex gap-2">
                            <input type="text" className="w-full p-4 rounded-lg bg-background border border-border text-text focus:border-plex outline-none transition-colors" placeholder="Enter your Plex Token" value={token} onChange={e => setToken(e.target.value)} required />
                            <button type="button" onClick={handleFetchServers} disabled={isLoading || !token} className="px-6 bg-plex/20 text-plex rounded-lg font-bold hover:bg-plex/30 transition-colors whitespace-nowrap">
                                Fetch Servers
                            </button>
                        </div>
                    </div>
                    {servers.length > 0 ? (
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-muted uppercase tracking-wider">Select Server</label>
                            <select className="w-full p-4 rounded-lg bg-background border border-border text-text focus:border-plex outline-none transition-colors appearance-none" value={serverIdentifier} onChange={e => setServerIdentifier(e.target.value)} required>
                                {servers.map(s => (
                                    <option key={s.identifier} value={s.identifier}>{s.name} ({s.identifier})</option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-muted uppercase tracking-wider">Server Identifier</label>
                            <input type="text" className="w-full p-4 rounded-lg bg-background border border-border text-text focus:border-plex outline-none transition-colors" placeholder="Enter your Server Identifier (or Fetch above)" value={serverIdentifier} onChange={e => setServerIdentifier(e.target.value)} required />
                        </div>
                    )}

                    <div className="border-t border-border pt-6 mt-2">
                        <h3 className="text-lg font-bold text-plex mb-4">Optional: Media Stack Integration</h3>
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-muted uppercase tracking-wider">Sonarr URL & API Key</label>
                                <div className="flex gap-2">
                                    <input type="text" className="w-1/2 p-3 rounded-lg bg-background border border-border text-text focus:border-plex outline-none transition-colors" placeholder="http://localhost:8989" value={sonarrUrl} onChange={e => setSonarrUrl(e.target.value)} />
                                    <input type="password" className="w-1/2 p-3 rounded-lg bg-background border border-border text-text focus:border-plex outline-none transition-colors" placeholder="Sonarr API Key" value={sonarrApiKey} onChange={e => setSonarrApiKey(e.target.value)} />
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-muted uppercase tracking-wider">Radarr URL & API Key</label>
                                <div className="flex gap-2">
                                    <input type="text" className="w-1/2 p-3 rounded-lg bg-background border border-border text-text focus:border-plex outline-none transition-colors" placeholder="http://localhost:7878" value={radarrUrl} onChange={e => setRadarrUrl(e.target.value)} />
                                    <input type="password" className="w-1/2 p-3 rounded-lg bg-background border border-border text-text focus:border-plex outline-none transition-colors" placeholder="Radarr API Key" value={radarrApiKey} onChange={e => setRadarrApiKey(e.target.value)} />
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-muted uppercase tracking-wider">Tautulli URL & API Key</label>
                                <div className="flex gap-2">
                                    <input type="text" className="w-1/2 p-3 rounded-lg bg-background border border-border text-text focus:border-plex outline-none transition-colors" placeholder="http://localhost:8181" value={tautulliUrl} onChange={e => setTautulliUrl(e.target.value)} />
                                    <input type="password" className="w-1/2 p-3 rounded-lg bg-background border border-border text-text focus:border-plex outline-none transition-colors" placeholder="Tautulli API Key" value={tautulliApiKey} onChange={e => setTautulliApiKey(e.target.value)} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <button type="submit" disabled={isLoading || !token || !serverIdentifier} className="w-full py-4 mt-2 bg-plex text-background rounded-lg font-bold text-lg hover:bg-plex-hover transition-colors disabled:opacity-50">
                        {isLoading ? 'Saving...' : 'Complete Setup'}
                    </button>
                </form>
            </div>
        </div>
    );
};

const Login: React.FC<{ onLoginSuccess: () => void, publicConfig?: any }> = ({ onLoginSuccess, publicConfig }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [publicInfo, setPublicInfo] = useState<{ thumb: string | null, serverName: string, isConfigured: boolean | null }>({ thumb: null, serverName: 'Server Portal', isConfigured: null });

    const fetchPublicInfo = () => {
        apiFetch('/api/public/info').then(data => {
            if (data) {
                setPublicInfo({
                    thumb: data.thumb || null,
                    serverName: data.serverName || 'Server Portal',
                    isConfigured: data.isConfigured !== false
                });
                if (data.thumb) updateFavicon(data.thumb);
                if (data.serverName) document.title = `${data.serverName} Portal`;
            }
        }).catch(() => {
            setPublicInfo(prev => ({ ...prev, isConfigured: false }));
        });
    };

    useEffect(() => {
        fetchPublicInfo();

        const path = window.location.pathname;
        if (path.startsWith('/auth/')) {
            const pinId = path.split('/')[2];
            setIsLoading(true);
            window.history.replaceState({}, '', '/'); // clear path
            apiFetch('/api/auth/plex/callback', {
                method: 'POST',
                body: JSON.stringify({ pinId })
            }).then(() => {
                onLoginSuccess();
            }).catch(e => {
                setError(e.message || 'Login failed');
                setIsLoading(false);
            });
        }
    }, [onLoginSuccess]);

    const handlePlexLogin = async () => {
        setIsLoading(true);
        setError('');
        try {
            const data = await apiFetch('/api/auth/plex/login', { method: 'POST' });
            const forwardUrl = window.location.origin + '/auth/' + data.id;
            const authUrl = `https://app.plex.tv/auth#?clientID=${data.clientIdentifier}&code=${data.code}&context[device][product]=Server%20Manager%20Portal&forwardUrl=${encodeURIComponent(forwardUrl)}`;
            window.location.href = authUrl;
        } catch (e) {
            setError('Failed to initiate Plex login');
            setIsLoading(false);
        }
    };

    if (publicInfo.isConfigured === false) {
        return <SetupWizard onComplete={fetchPublicInfo} />;
    }

    if (publicInfo.isConfigured === null) {
        return <Loader isLoading={true} />;
    }

    return (
        <div className="w-full mx-auto flex flex-col items-center justify-center min-h-[80vh] px-4 pt-12 md:pt-20">
            <Loader isLoading={isLoading} />
            <div className={`w-full mx-auto bg-card rounded-2xl shadow-2xl border-t-[6px] border-plex flex flex-col-reverse md:flex-row relative z-10 overflow-hidden ${publicConfig?.allowTemporaryAccess !== false ? 'max-w-6xl' : 'max-w-2xl'}`}>
                {publicConfig?.allowTemporaryAccess !== false && (
                    <>
                        <div className="flex-1 p-4 md:p-8 lg:p-12 flex flex-col justify-center">
                            <h1 className="text-3xl md:text-4xl font-bold text-plex mb-4">Welcome to {publicInfo.serverName}</h1>
                            <p className="text-muted text-sm md:text-base leading-relaxed mb-6">The ultimate Plex experience. Get instant access to our entire library with a <strong>3-Day Temporary Access</strong>.</p>

                            <LivePlexStats />

                            <p className="text-xs text-muted mt-2 mb-4 text-center">You'll need a free Plex account to continue. You can create one securely on the next screen.</p>
                            <button className="w-full py-4 bg-plex text-background rounded-lg font-bold text-lg hover:bg-plex-hover transition-colors shadow-lg" onClick={handlePlexLogin} disabled={isLoading}>
                                Request Temporary Access
                            </button>
                        </div>

                        <div className="hidden md:block w-px bg-white/5 my-12"></div>
                    </>
                )}

                <div className={`flex-1 p-4 md:p-8 lg:p-12 flex flex-col justify-center bg-white/[0.02] ${publicConfig?.allowTemporaryAccess === false ? 'w-full' : ''}`}>
                    <div className="text-center">
                        <div className="w-full flex justify-center mb-8">
                            <div className="relative">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-plex rounded-full blur-[50px] opacity-20 pointer-events-none"></div>
                                {publicConfig?.customLogoUrl || publicInfo.thumb ? (
                                    <img src={publicConfig?.customLogoUrl || publicInfo.thumb} alt="Server Logo" className="w-32 h-32 object-cover rounded-full border-2 border-plex drop-shadow-[0_0_15px_rgba(229,160,13,0.25)] relative z-10" onError={(e) => { e.currentTarget.src = '/static/logo.png'; e.currentTarget.className = 'w-40 object-contain drop-shadow-[0_0_15px_rgba(229,160,13,0.25)] relative z-10'; }} />
                                ) : (
                                    <img src="/static/logo.png" alt="Server Logo" className="w-40 object-contain drop-shadow-[0_0_15px_rgba(229,160,13,0.25)] relative z-10" onError={(e) => e.currentTarget.style.display = 'none'} />
                                )}
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-text mb-4">Already on our server?</h2>
                        <p className="text-muted text-sm mb-8">Manage your existing access or re-link your account.</p>
                        <button className="w-full py-4 bg-border text-text rounded-lg font-bold hover:bg-white/10 transition-colors border border-white/10" onClick={handlePlexLogin} disabled={isLoading}>
                            Login with Plex
                        </button>

                        {publicConfig?.allowTemporaryAccess === false && (
                            <div className="mt-8 border-t border-white/5 pt-8">
                                <LivePlexStats />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-4 w-full max-w-5xl mx-auto">
                <PublicUptimeBanner />
            </div>
            {error && <div className="error-message" style={{ marginTop: '1rem' }}>{error}</div>}
        </div>
    );
};

const RebuildLibraryCacheButton: React.FC = () => {
    const [status, setStatus] = React.useState<'idle' | 'starting' | 'building' | 'done' | 'error'>('idle');
    const [lastBuilt, setLastBuilt] = React.useState<number | null>(null);
    const pollRef = React.useRef<any>(null);

    React.useEffect(() => {
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
                                                ? <img src={item.thumbUrl} className="w-8 h-8 rounded object-cover flex-shrink-0" />
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
                            <div className="w-full h-40 bg-cover bg-center rounded-xl shadow-lg mb-6 border border-white/10 relative overflow-hidden" style={{ backgroundImage: `url('${analytics.topBinge.artUrl || 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&q=80&w=600'}')` }}>
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
                                                {show.thumbUrl ? <img src={show.thumbUrl} className="w-8 h-12 object-cover rounded shadow-sm" /> : <div className="w-8 h-12 bg-white/10 rounded"></div>}
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
                            <div className="w-full h-40 bg-cover bg-center rounded-xl shadow-lg mb-6 border border-white/10 relative overflow-hidden" style={{ backgroundImage: `url('${analytics.topMovie.artUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=600'}')` }}>
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
                                                {movie.thumbUrl ? <img src={movie.thumbUrl} className="w-8 h-12 object-cover rounded shadow-sm" /> : <div className="w-8 h-12 bg-white/10 rounded"></div>}
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
                        <p className="text-muted mb-6">You typically stream around {analytics.avgHour ? Math.round(analytics.avgHour) + ':00' : 'Unknown'}.</p>

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
                                                {count} plays at {hour}:00
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
                                                        ? <img src={m.thumbUrl} className="w-8 h-12 object-cover rounded shadow-sm flex-shrink-0" />
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
                                                        ? <img src={s.thumbUrl} className="w-8 h-12 object-cover rounded shadow-sm flex-shrink-0" />
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
                                                {item.thumbUrl ? <img src={item.thumbUrl} className="w-8 h-12 object-cover rounded shadow-sm" /> : <div className="w-8 h-12 bg-white/10 rounded"></div>}
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

const UserDashboard: React.FC<{ sessionInfo: any; publicConfig?: any; onLogout: () => void; refreshSession: () => void; onViewAdmin: () => void; onViewStatus: () => void; onViewDashboard: () => void }> = ({ sessionInfo, publicConfig, onLogout, refreshSession, onViewAdmin, onViewStatus, onViewDashboard }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [toast, setToast] = useState<ToastMessage | null>(null);
    const [analytics, setAnalytics] = useState<any>(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(true);
    const [serverStats, setServerStats] = useState<any>(null);
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [serverDataLoading, setServerDataLoading] = useState(true);
    const [topContentPage, setTopContentPage] = useState(0);
    const TOP_CONTENT_PAGE_SIZE = 18;
    const [recentHistoryPage, setRecentHistoryPage] = useState(0);
    const RECENT_HISTORY_PAGE_SIZE = 18;
    const [analyticsDays, setAnalyticsDays] = useState<number | 'all'>(30);
    const [analyticsDaysOpen, setAnalyticsDaysOpen] = useState(false);
    const [wrapUpDaysOpen, setWrapUpDaysOpen] = useState(false);
    const [reportItem, setReportItem] = useState<any>(null);
    const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

    const user = sessionInfo.account;
    const [optOutNewsletter, setOptOutNewsletter] = useState(user?.optOutNewsletter || false);

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

    const handleRequestInvite = async () => {
        setIsLoading(true);
        try {
            await apiFetch('/api/users/request-invite', { method: 'POST' });
            setToast({ id: 1, message: 'Invite requested successfully! Check your email.', type: 'success' });
            refreshSession();
        } catch (e: any) {
            setToast({ id: 1, message: e.message || 'Failed to request invite', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    // Auto-request invite if user is totally new — but only once per browser
    // session, so remounts/navigation don't repeatedly POST invite requests.
    useEffect(() => {
        if (!user && !isLoading && !sessionInfo.session.isAdmin) {
            const alreadyRequested = sessionStorage.getItem('autoInviteRequested') === 'true';
            if (!alreadyRequested) {
                sessionStorage.setItem('autoInviteRequested', 'true');
                handleRequestInvite();
            }
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
                const res = await apiFetch(`/api/plex/analytics/me?days=${analyticsDays}`);
                if (cancelled) return;
                setAnalytics(res);
                setTopContentPage(0);
                setRecentHistoryPage(0);
            } catch (e) {
                if (!cancelled) console.error("Failed to fetch analytics", e);
            } finally {
                if (!cancelled) setAnalyticsLoading(false);
            }
        };
        fetchAnalytics();
        return () => { cancelled = true; };
    }, [user, sessionInfo.session.isAdmin, analyticsDays]);

    useEffect(() => {
        let pollTimer: any = null;
        let isMounted = true;

        const fetchServerData = async () => {
            if (!isMounted) return;
            try {
                const p1 = apiFetch('/api/plex/stats').then(res => {
                    if (isMounted) {
                        setServerStats(res);
                        if (res?.isBuilding) {
                            pollTimer = setTimeout(fetchServerData, 5000);
                        }
                    }
                }).catch(e => console.error("Failed to fetch server stats", e));

                const p2 = dashboardData ? Promise.resolve() : apiFetch('/api/plex/dashboard?limit=15').then(res => {
                    if (isMounted) setDashboardData(res);
                }).catch(e => console.error("Failed to fetch dashboard data", e));

                await Promise.all([p1, p2]);
            } finally {
                if (isMounted) setServerDataLoading(false);
            }
        };
        fetchServerData();
        return () => {
            isMounted = false;
            if (pollTimer) clearTimeout(pollTimer);
        };
    }, [dashboardData]);

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
    const progressPct = daysLeft !== null ? Math.min(100, Math.max(0, (daysLeft / 365) * 100)) : 100;
    const isExpiringSoon = daysLeft !== null && daysLeft <= 7;
    const isRevoked = user?.plexAccessStatus === 'revoked';
    const isPending = user?.plexAccessStatus?.toLowerCase() === 'pending';

    const heroBg = analytics?.recentHistory?.[0]?.thumbUrl || publicConfig?.customLogoUrl || '';

    return (
        <div className="w-full flex flex-col gap-6">
            <Loader isLoading={isLoading} />
            {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

            {/* Massive Hero Banner */}
            <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl bg-card border border-border mt-4">
                {/* Blurred Background */}
                <div className="absolute inset-0 bg-background overflow-hidden">
                    {dashboardData?.recentMovies?.length > 0 ? (
                        <div className="absolute -inset-[50%] opacity-40 transform -rotate-12 scale-110 flex gap-4 overflow-hidden pointer-events-none justify-center">
                            {[...Array(6)].map((_, colIdx) => (
                                <div key={colIdx} className={`flex flex-col gap-4 ${colIdx % 2 === 0 ? 'animate-[scrollVertical_40s_linear_infinite]' : 'animate-[scrollVertical_50s_linear_infinite_reverse]'}`}>
                                    {[...dashboardData.recentMovies, ...dashboardData.recentMovies].sort(() => 0.5 - Math.random()).map((m: any, i: number) => m.thumb && (
                                        <img key={`c${colIdx}-${i}`} src={`/api/plex/image?path=${encodeURIComponent(m.thumb)}&width=200&height=300`} className="w-32 md:w-48 rounded-xl object-cover" alt="" />
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

                <div className="relative pt-24 pb-8 px-6 md:px-10 flex flex-col items-center md:items-start text-center md:text-left z-10">
                    <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
                        {/* Avatar */}
                        {(() => {
                            const thumbUrl = user?.thumb || sessionInfo.session.thumb || (sessionInfo.session.isAdmin ? sessionInfo.adminThumb : null);
                            if (thumbUrl) {
                                return (
                                    <div className="relative">
                                        <img
                                            src={thumbUrl.startsWith('http') ? thumbUrl : `/api/plex/image?path=${encodeURIComponent(thumbUrl)}&width=256&height=256`}
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
                            <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 leading-tight drop-shadow-lg truncate max-w-[280px] md:max-w-md">
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

            {/* Personal Wrap-Up */}
            {(sessionInfo.session.isAdmin || user) && !analyticsLoading && analytics && (
                <div className="bg-card border border-border rounded-2xl p-6 shadow-xl mb-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <h3 className="text-xl font-bold text-text">Your Personal Wrap-Up</h3>
                        <div className="relative">
                            <button
                                onClick={() => setWrapUpDaysOpen(!wrapUpDaysOpen)}
                                className="flex items-center gap-2 bg-background border border-border/50 rounded-lg px-3 py-1.5 text-sm font-medium text-text focus:outline-none hover:border-plex/50 transition-colors cursor-pointer shadow-sm"
                            >
                                <span>
                                    {analyticsDays === 7 ? 'Last 7 Days' :
                                        analyticsDays === 30 ? 'Last 30 Days' :
                                            analyticsDays === 60 ? 'Last 60 Days' :
                                                analyticsDays === 90 ? 'Last 90 Days' :
                                                    analyticsDays === 180 ? 'Last 180 Days' :
                                                        'All Time'}
                                </span>
                                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${wrapUpDaysOpen ? 'rotate-180 text-plex' : 'text-muted'}`} />
                            </button>

                            {wrapUpDaysOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setWrapUpDaysOpen(false)} />
                                    <div className="absolute right-0 mt-2 w-40 bg-card border border-border rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] z-50 overflow-hidden flex flex-col py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                                        {[
                                            { value: 7, label: 'Last 7 Days' },
                                            { value: 30, label: 'Last 30 Days' },
                                            { value: 60, label: 'Last 60 Days' },
                                            { value: 90, label: 'Last 90 Days' },
                                            { value: 180, label: 'Last 180 Days' },
                                            { value: 'all', label: 'All Time' }
                                        ].map(opt => (
                                            <button
                                                key={opt.value}
                                                onClick={() => {
                                                    setAnalyticsDays(opt.value as any);
                                                    setWrapUpDaysOpen(false);
                                                }}
                                                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${analyticsDays === opt.value ? 'bg-plex/10 text-plex font-bold border-l-2 border-plex' : 'text-text hover:bg-white/5 border-l-2 border-transparent'}`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        <div onClick={() => setSelectedMetric('Server Rank')} className="rounded-xl overflow-hidden relative border border-border/50 group flex flex-col cursor-pointer hover:ring-2 hover:ring-plex/50 transition-all" style={{ minHeight: '130px' }}>
                            <div className="absolute inset-0 bg-cover bg-center z-0 transition-transform duration-700 group-hover:scale-110 opacity-60" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&q=80&w=600')` }} />
                            <div className="absolute inset-0 bg-black/60 z-10" />
                            <div className="relative z-20 p-4 flex-1 flex flex-col items-center justify-center text-center">
                                <Trophy className="w-6 h-6 text-plex mb-2 drop-shadow-md" />
                                <p className="text-gray-300 text-[10px] uppercase tracking-widest font-bold mb-1 drop-shadow-md">Server Rank</p>
                                <p className="text-2xl font-black text-white drop-shadow-lg leading-none mb-1">{analytics.leaderboardRank ? <><span className="text-plex text-xl mr-0.5">#</span><CountUp end={analytics.leaderboardRank} /></> : 'Unranked'}</p>
                                {analytics.totalActiveUsers > 0 && <p className="text-[10px] text-gray-400 font-bold tracking-wider">Top {Math.max(1, Math.round((analytics.leaderboardRank / analytics.totalActiveUsers) * 100))}% of users</p>}
                            </div>
                        </div>

                        <div onClick={() => setSelectedMetric('Total Streams')} className="rounded-xl overflow-hidden relative border border-border/50 group flex flex-col cursor-pointer hover:ring-2 hover:ring-plex/50 transition-all" style={{ minHeight: '130px' }}>
                            <div className="absolute inset-0 bg-cover bg-center z-0 transition-transform duration-700 group-hover:scale-110 opacity-60" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=600')` }} />
                            <div className="absolute inset-0 bg-black/60 z-10" />
                            <div className="relative z-20 p-4 flex-1 flex flex-col items-center justify-center text-center">
                                <PlayCircle className="w-6 h-6 text-plex mb-2 drop-shadow-md" />
                                <p className="text-gray-300 text-[10px] uppercase tracking-widest font-bold mb-1 drop-shadow-md">Total Streams</p>
                                <p className="text-2xl font-black text-white drop-shadow-lg leading-none mb-1"><CountUp end={analytics.totalPlays || 0} /></p>
                                <p className="text-[10px] text-gray-400 font-bold tracking-wider flex gap-2">
                                    <span>🎬 {analytics.moviesCount || 0}</span>
                                    <span>📺 {analytics.showsCount || 0}</span>
                                    {analytics.musicCount > 0 && <span>🎵 {analytics.musicCount}</span>}
                                </p>
                            </div>
                        </div>

                        <div onClick={() => setSelectedMetric('Top Binge')} className="rounded-xl overflow-hidden relative border border-border/50 group flex flex-col cursor-pointer hover:ring-2 hover:ring-plex/50 transition-all" style={{ minHeight: '130px' }}>
                            <div className="absolute inset-0 bg-cover bg-center z-0 transition-transform duration-700 group-hover:scale-110 opacity-60" style={{ backgroundImage: `url('${analytics.topBinge?.artUrl || 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&q=80&w=600'}')` }} />
                            <div className="absolute inset-0 bg-black/60 z-10" />
                            <div className="relative z-20 p-4 flex-1 flex flex-col items-center justify-center text-center">
                                <Tv className="w-6 h-6 text-plex mb-2 drop-shadow-md" />
                                <p className="text-gray-300 text-[10px] uppercase tracking-widest font-bold mb-1 drop-shadow-md">Top Binge</p>
                                <p className="text-sm font-bold text-white drop-shadow-lg line-clamp-2 leading-tight mb-1">{analytics.topBinge?.title || 'Nothing yet'}</p>
                                <p className="text-[10px] text-plex font-bold tracking-wider">{analytics.topBinge?.plays || 0} episodes</p>
                            </div>
                        </div>

                        <div onClick={() => setSelectedMetric('Top Movie')} className="rounded-xl overflow-hidden relative border border-border/50 group flex flex-col cursor-pointer hover:ring-2 hover:ring-plex/50 transition-all" style={{ minHeight: '130px' }}>
                            <div className="absolute inset-0 bg-cover bg-center z-0 transition-transform duration-700 group-hover:scale-110 opacity-60" style={{ backgroundImage: `url('${analytics.topMovie?.artUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=600'}')` }} />
                            <div className="absolute inset-0 bg-black/60 z-10" />
                            <div className="relative z-20 p-4 flex-1 flex flex-col items-center justify-center text-center">
                                <Clapperboard className="w-6 h-6 text-plex mb-2 drop-shadow-md" />
                                <p className="text-gray-300 text-[10px] uppercase tracking-widest font-bold mb-1 drop-shadow-md">Top Movie</p>
                                <p className="text-sm font-bold text-white drop-shadow-lg line-clamp-2 leading-tight mb-1">{analytics.topMovie?.title || 'Nothing yet'}</p>
                                <p className="text-[10px] text-plex font-bold tracking-wider">{analytics.topMovie?.plays || 0} plays</p>
                            </div>
                        </div>

                        <div onClick={() => setSelectedMetric('Time of Day')} className="rounded-xl overflow-hidden relative border border-border/50 group flex flex-col cursor-pointer hover:ring-2 hover:ring-plex/50 transition-all" style={{ minHeight: '130px' }}>
                            <div className="absolute inset-0 bg-cover bg-center z-0 transition-transform duration-700 group-hover:scale-110 opacity-60" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=600')` }} />
                            <div className="absolute inset-0 bg-black/60 z-10" />
                            <div className="relative z-20 p-4 flex-1 flex flex-col items-center justify-center text-center">
                                <Clock className="w-6 h-6 text-plex mb-2 drop-shadow-md" />
                                <p className="text-gray-300 text-[10px] uppercase tracking-widest font-bold mb-1 drop-shadow-md">Time of Day</p>
                                <p className="text-sm font-bold text-white drop-shadow-lg leading-tight mb-1">{analytics.timeOfDay || 'Unknown'}</p>
                                <p className="text-[10px] text-gray-400 font-bold tracking-wider">Avg Time: {analytics.avgHour ? Math.round(analytics.avgHour) + ':00' : 'Unknown'}</p>
                            </div>
                        </div>

                        <div onClick={() => setSelectedMetric('Top Day')} className="rounded-xl overflow-hidden relative border border-border/50 group flex flex-col cursor-pointer hover:ring-2 hover:ring-plex/50 transition-all" style={{ minHeight: '130px' }}>
                            <div className="absolute inset-0 bg-cover bg-center z-0 transition-transform duration-700 group-hover:scale-110 opacity-60" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&q=80&w=600')` }} />
                            <div className="absolute inset-0 bg-black/60 z-10" />
                            <div className="relative z-20 p-4 flex-1 flex flex-col items-center justify-center text-center">
                                <Calendar className="w-6 h-6 text-plex mb-2 drop-shadow-md" />
                                <p className="text-gray-300 text-[10px] uppercase tracking-widest font-bold mb-1 drop-shadow-md">Top Day</p>
                                <p className="text-sm font-bold text-white drop-shadow-lg leading-tight mb-1">{analytics.popularDay || 'Unknown'}</p>
                                <p className="text-[10px] text-gray-400 font-bold tracking-wider">{analytics.dayOfWeekCounts ? Math.max(...Object.values(analytics.dayOfWeekCounts) as number[]) : 0} streams</p>
                            </div>
                        </div>

                        <div onClick={() => setSelectedMetric('Media Profile')} className="rounded-xl overflow-hidden relative border border-border/50 group flex flex-col cursor-pointer hover:ring-2 hover:ring-plex/50 transition-all" style={{ minHeight: '130px' }}>
                            <div className="absolute inset-0 bg-cover bg-center z-0 transition-transform duration-700 group-hover:scale-110 opacity-60" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=600')` }} />
                            <div className="absolute inset-0 bg-black/60 z-10" />
                            <div className="relative z-20 p-4 flex-1 flex flex-col items-center justify-center text-center">
                                <Layers className="w-6 h-6 text-plex mb-2 drop-shadow-md" />
                                <p className="text-gray-300 text-[10px] uppercase tracking-widest font-bold mb-1 drop-shadow-md">Top Library</p>
                                <p className="text-sm font-bold text-white drop-shadow-lg line-clamp-2 leading-tight mb-1">{analytics.favoriteLibrary || 'None'}</p>
                                <p className="text-[10px] text-gray-400 font-bold tracking-wider">{analytics.topLibraries?.[0]?.plays || 0} plays</p>
                            </div>
                        </div>

                        <div onClick={() => setSelectedMetric('Top Library')} className="rounded-xl overflow-hidden relative border border-border/50 group flex flex-col cursor-pointer hover:ring-2 hover:ring-plex/50 transition-all" style={{ minHeight: '130px' }}>
                            <div className="absolute inset-0 bg-cover bg-center z-0 transition-transform duration-700 group-hover:scale-110 opacity-60" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=600')` }} />
                            <div className="absolute inset-0 bg-black/60 z-10" />
                            <div className="relative z-20 p-4 flex-1 flex flex-col items-center justify-center text-center">
                                <PieChart className="w-6 h-6 text-plex mb-2 drop-shadow-md" />
                                <p className="text-gray-300 text-[10px] uppercase tracking-widest font-bold mb-1 drop-shadow-md">Media Profile</p>
                                <p className="text-sm font-bold text-white drop-shadow-lg leading-tight mb-1">{analytics.mediaPreference || 'Mixed Bag'}</p>
                                <p className="text-[10px] text-gray-400 font-bold tracking-wider">Prefers {analytics.moviesCount > analytics.showsCount ? 'Movies' : 'TV Shows'}</p>
                            </div>
                        </div>

                        <div onClick={() => setSelectedMetric('Watch Style')} className="rounded-xl overflow-hidden relative border border-border/50 group flex flex-col cursor-pointer hover:ring-2 hover:ring-plex/50 transition-all" style={{ minHeight: '130px' }}>
                            <div className="absolute inset-0 bg-cover bg-center z-0 transition-transform duration-700 group-hover:scale-110 opacity-60" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=600')` }} />
                            <div className="absolute inset-0 bg-black/60 z-10" />
                            <div className="relative z-20 p-4 flex-1 flex flex-col items-center justify-center text-center">
                                <Compass className="w-6 h-6 text-plex mb-2 drop-shadow-md" />
                                <p className="text-gray-300 text-[10px] uppercase tracking-widest font-bold mb-1 drop-shadow-md">Watch Style</p>
                                <p className="text-sm font-bold text-white drop-shadow-lg leading-tight mb-1">{analytics.watchStyle || 'Unknown'}</p>
                                <p className="text-[10px] text-gray-400 font-bold tracking-wider">{analytics.uniqueTitles || 0} unique titles</p>
                            </div>
                        </div>

                        <div onClick={() => setSelectedMetric('Streaming Habit')} className="rounded-xl overflow-hidden relative border border-border/50 group flex flex-col cursor-pointer hover:ring-2 hover:ring-plex/50 transition-all" style={{ minHeight: '130px' }}>
                            <div className="absolute inset-0 bg-cover bg-center z-0 transition-transform duration-700 group-hover:scale-110 opacity-60" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?auto=format&fit=crop&q=80&w=600')` }} />
                            <div className="absolute inset-0 bg-black/60 z-10" />
                            <div className="relative z-20 p-4 flex-1 flex flex-col items-center justify-center text-center">
                                <Coffee className="w-6 h-6 text-plex mb-2 drop-shadow-md" />
                                <p className="text-gray-300 text-[10px] uppercase tracking-widest font-bold mb-1 drop-shadow-md">Streaming Habit</p>
                                <p className="text-sm font-bold text-white drop-shadow-lg leading-tight mb-1">{analytics.streamingHabit || 'Unknown'}</p>
                                <p className="text-[10px] text-gray-400 font-bold tracking-wider">{analytics.weekdayPlays || 0} WD • {analytics.weekendPlays || 0} WE</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                {/* Left Column */}
                <div className="lg:col-span-1 flex flex-col gap-6">


                    {/* Subscription Status */}
                    {sessionInfo.session.isAdmin ? (
                        <div className="flex flex-col gap-6">
                            <div className="bg-card border border-border rounded-2xl p-6 shadow-xl flex flex-col items-center justify-center text-center md:h-[240px]">
                                <div className="w-16 h-16 bg-plex/10 rounded-full flex items-center justify-center mb-4 border border-plex/30 shadow-[0_0_15px_rgba(229,160,13,0.15)]">
                                    <Shield className="w-8 h-8 text-plex drop-shadow-md" />
                                </div>
                                <h3 className="text-xl md:text-2xl font-black text-text uppercase tracking-widest mb-1">Server Admin</h3>
                                <div className="mt-2 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/40 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)] tracking-widest uppercase"><Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]" /> VIP UNLIMITED</div>
                            </div>

                            <div className="bg-card border border-border rounded-2xl p-6 shadow-xl flex flex-col">
                                <p className="text-muted text-xs uppercase tracking-widest font-semibold mb-4">Quick Actions</p>
                                <div className="flex flex-col gap-3 mt-auto">
                                    <a href="/users" className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all border bg-plex/10 border-plex/30 text-plex hover:bg-plex/20">
                                        <Users size={16} /> Manage Users
                                    </a>
                                    <a href="/settings" className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all border bg-white/5 border-white/10 text-text hover:bg-white/10">
                                        <Settings size={16} /> Server Settings
                                    </a>
                                    <a href="/logs" className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all border bg-white/5 border-white/10 text-text hover:bg-white/10">
                                        <Activity size={16} /> System Logs
                                    </a>
                                </div>
                            </div>
                        </div>
                    ) : (
                        user ? (
                            <div className="bg-card border border-border rounded-2xl p-6 shadow-xl flex flex-col justify-center md:h-[240px]">
                                <div className="flex flex-col gap-4">
                                    <div>
                                        <p className="text-muted text-xs uppercase tracking-widest font-semibold mb-3">Access Status</p>
                                        <div className="flex flex-wrap items-center gap-3">
                                            <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black border uppercase tracking-wider shadow-sm ${isRevoked ? 'bg-red-500/10 border-red-500/30 text-red-400' : isExpiringSoon ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' : 'bg-green-500/10 border-green-500/30 text-green-400'}`}>
                                                <span className={`w-2 h-2 rounded-full animate-pulse ${isRevoked ? 'bg-red-400' : isExpiringSoon ? 'bg-yellow-400' : 'bg-green-400'}`} />
                                                {user.plexAccessStatus}{user.isTrial && ' · Temp Access'}
                                            </span>
                                            {user.expiryDate ? (
                                                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold bg-white/5 border border-white/10 text-text shadow-sm">
                                                    <Calendar size={14} className="text-muted" />
                                                    {new Date(user.expiryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-[11px] font-black bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/40 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)] tracking-widest uppercase"><Star className="w-4 h-4 text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]" /> VIP UNLIMITED</span>
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
                        ) : (
                            <div className="flex items-center gap-3 text-muted text-sm bg-card p-6 rounded-2xl border border-border shadow-lg">
                                <div className="w-5 h-5 rounded-full border-2 border-plex border-t-transparent animate-spin flex-shrink-0" />
                                Setting up your 3-Day Temporary Access...
                            </div>
                        )
                    )}

                    {/* Announcement Banner */}
                    {publicConfig?.announcement && (
                        <div className="bg-plex/10 border border-plex/30 rounded-2xl p-4 md:p-6 shadow-lg">
                            <div className="flex items-start gap-3">
                                <span className="text-xl mt-0.5">📢</span>
                                <div>
                                    <h3 className="text-plex font-bold text-sm uppercase tracking-wider mb-1">Announcement</h3>
                                    <p className="text-text whitespace-pre-wrap text-sm leading-relaxed">{publicConfig.announcement}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Referral Link */}
                    {publicConfig?.referralEnabled && user && !sessionInfo.session.isAdmin && (
                        <div className="bg-card border border-border rounded-2xl p-4 md:p-6 shadow-lg">
                            <p className="text-plex font-bold text-base mb-1">🎁 Invite Friends</p>
                            <p className="text-muted text-sm leading-relaxed mb-4">Share this link. They get temporary access, and you get reward days!</p>
                            <div className="flex flex-col gap-2">
                                <input type="text" readOnly value={`${window.location.origin}/?ref=${user.id}`} className="w-full p-3 rounded-lg border border-border bg-background text-text text-sm outline-none" />
                                <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/?ref=${user.id}`); setToast({ id: 99, message: 'Copied to clipboard!', type: 'success' }); }} className="w-full py-2.5 bg-plex text-background rounded-lg font-bold hover:bg-plex-hover transition-colors shadow-md">Copy Link</button>
                            </div>
                        </div>
                    )}

                    {/* Footer sections: Preferences & Support (Moved to Left Column) */}
                    <div className="flex flex-col gap-6 flex-1">
                        {/* Newsletter preferences */}
                        {user && !sessionInfo.session.isAdmin && (
                            <div className="bg-card border border-border rounded-2xl p-6 shadow-lg flex flex-col">
                                <p className="text-muted text-xs uppercase tracking-widest font-semibold mb-4 flex-shrink-0">Preferences</p>
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
                        )}

                        {/* Support card */}
                        {!sessionInfo?.session?.isAdmin && (
                            <div className="bg-card border border-border rounded-2xl p-6 shadow-lg flex flex-col">
                                {user?.isTrial ? (
                                    <div className="mb-5 flex-shrink-0">
                                        <p className="text-plex font-bold text-base mb-1">🍿 Enjoying your Temporary Access?</p>
                                        <p className="text-muted text-sm leading-relaxed">Once your 3-day access ends, you'll lose access. Get in touch with the admin to extend your access!</p>
                                    </div>
                                ) : (
                                    <div className="mb-5 flex-shrink-0">
                                        <p className="text-text font-bold text-base mb-1">💬 Need Help?</p>
                                        <p className="text-muted text-sm leading-relaxed">Contact the admin to extend your access, report an issue, or get support.</p>
                                    </div>
                                )}
                                <div className="flex flex-col gap-3 mt-auto">
                                    {publicConfig.contactWhatsApp && (
                                        <a href={`https://wa.me/${publicConfig.contactWhatsApp}`} target="_blank" rel="noreferrer"
                                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all border bg-[#25D366]/10 border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/20">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12.031 21.972c-1.63 0-3.21-.42-4.606-1.21l-5.111 1.34 1.36-4.972a9.92 9.92 0 0 1-1.34-4.978C2.334 6.64 6.685 2.28 12.031 2.28c5.344 0 9.697 4.36 9.697 9.872 0 5.512-4.353 9.82-9.697 9.82zm0-18.062c-4.47 0-8.115 3.65-8.115 8.13 0 1.48.39 2.92 1.12 4.19l-1.02 3.73 3.82-1a8.13 8.13 0 0 0 4.195 1.15c4.475 0 8.115-3.65 8.115-8.13s-3.64-8.07-8.115-8.07zm4.332 11.23c-.237-.12-1.405-.69-1.62-.77-.216-.08-.372-.12-.53.12-.158.24-.616.77-.754.93-.138.16-.276.18-.513.06-1.124-.55-2.062-1.28-2.812-2.19-.214-.26-.14-.4.08-.56.12-.08.27-.3.41-.45.14-.15.19-.25.28-.42.1-.17.05-.32 0-.44-.05-.12-.53-1.28-.73-1.75-.19-.46-.38-.4-.53-.41h-.45c-.16 0-.41.06-.63.3-.22.24-.85.83-.85 2.02 0 1.19.87 2.34.99 2.5.12.16 1.7 2.6 4.12 3.64 1.38.59 2.05.65 2.8.55.75-.1 1.4-.57 1.6-1.12.2-.55.2-.102.14-1.12-.06-.1-.22-.16-.46-.28z" /></svg>
                                            WhatsApp
                                        </a>
                                    )}
                                    {publicConfig.contactEmail && (
                                        <a href={`mailto:${publicConfig.contactEmail}`}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all border bg-white/5 border-white/10 text-text hover:bg-white/10">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                                            Email
                                        </a>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Recent History (Moved to Left Column) */}
                        {(sessionInfo.session.isAdmin || user) && !analyticsLoading && analytics?.recentHistory && analytics.recentHistory.length > 0 && (
                            <div className="bg-card border border-border rounded-2xl p-6 shadow-xl flex-1 flex flex-col">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold text-text">Recently Watched</h3>
                                    {analytics.recentHistory.length > RECENT_HISTORY_PAGE_SIZE && (
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setRecentHistoryPage(p => Math.max(0, p - 1))}
                                                disabled={recentHistoryPage === 0}
                                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-text"
                                            >
                                                <ChevronUp className="w-4 h-4 -rotate-90" />
                                            </button>
                                            <span className="text-xs text-muted font-medium w-8 text-center">
                                                {recentHistoryPage + 1} / {Math.ceil(analytics.recentHistory.length / RECENT_HISTORY_PAGE_SIZE)}
                                            </span>
                                            <button
                                                onClick={() => setRecentHistoryPage(p => Math.min(Math.ceil(analytics.recentHistory.length / RECENT_HISTORY_PAGE_SIZE) - 1, p + 1))}
                                                disabled={recentHistoryPage >= Math.ceil(analytics.recentHistory.length / RECENT_HISTORY_PAGE_SIZE) - 1}
                                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-text"
                                            >
                                                <ChevronDown className="w-4 h-4 -rotate-90" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-stretch">
                                    {analytics.recentHistory.slice(recentHistoryPage * RECENT_HISTORY_PAGE_SIZE, (recentHistoryPage + 1) * RECENT_HISTORY_PAGE_SIZE).map((item: any, idx: number) => (
                                        <div key={idx} className="flex items-center self-stretch gap-3 p-2 bg-black/20 rounded-xl border border-white/5 hover:border-plex/50 hover:bg-black/40 hover:shadow-[0_0_15px_rgba(229,160,13,0.15)] transition-all group relative">
                                            <a href={item.plexUrl} target="_blank" rel="noreferrer" className="flex items-center flex-1 min-w-0 gap-3">
                                                <div className="w-10 h-10 rounded-lg overflow-hidden bg-background flex-shrink-0 shadow-md">
                                                    {item.thumbUrl ? (
                                                        <img src={item.thumbUrl} alt={item.title} className="w-full h-full object-cover" />
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
                                                className="opacity-0 group-hover:opacity-100 p-2 text-muted hover:text-red-400 hover:bg-red-400/10 rounded-full transition-all focus:outline-none"
                                                title="Report a playback issue"
                                            >
                                                <AlertTriangle className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    {/* Server Stats Card */}
                    <div className="bg-card border border-border rounded-2xl p-6 shadow-xl flex flex-col justify-center relative overflow-hidden flex-shrink-0 md:h-[240px]">
                        <div className="absolute -top-10 -right-10 p-8 opacity-5">
                            <Activity className="w-64 h-64 text-plex" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-6">
                                <p className="text-muted text-sm uppercase tracking-widest font-semibold">Server Library Size</p>
                                {sessionInfo.session.isAdmin && <RebuildLibraryCacheButton />}
                            </div>
                            {serverDataLoading ? (
                                <div className="flex gap-3 items-center text-muted"><div className="w-5 h-5 rounded-full border-2 border-plex border-t-transparent animate-spin" /> Fetching latest library sizes...</div>
                            ) : serverStats?.isBuilding ? (
                                <div className="flex flex-col gap-2">
                                    <div className="flex gap-3 items-center text-muted"><div className="w-5 h-5 rounded-full border-2 border-plex border-t-transparent animate-spin" /> Building library size cache in background...</div>
                                    <p className="text-xs text-muted/60">This runs once and may take a few minutes for large libraries. The page will auto-update when ready.</p>
                                </div>
                            ) : serverStats ? (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="bg-background/60 p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center shadow-inner hover:bg-background/80 transition-colors">
                                        <Film className="w-7 h-7 text-plex mb-2 opacity-80" />
                                        <span className="text-3xl font-black text-text drop-shadow-md mb-1">
                                            {serverStats.moviesBytes ? (() => {
                                                const bytes = serverStats.moviesBytes;
                                                if (bytes === 0) return '0 B';
                                                const k = 1024;
                                                const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
                                                const i = Math.floor(Math.log(bytes) / Math.log(k));
                                                return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
                                            })() : '0 B'}
                                        </span>
                                        <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider mt-1">
                                            <span className="text-plex">{serverStats.movies?.toLocaleString() || 0}</span>
                                            <span className="text-muted">Movies</span>
                                        </div>
                                    </div>
                                    <div className="bg-background/60 p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center shadow-inner hover:bg-background/80 transition-colors">
                                        <Tv className="w-7 h-7 text-plex mb-2 opacity-80" />
                                        <span className="text-3xl font-black text-text drop-shadow-md mb-1">
                                            {serverStats.showsBytes ? (() => {
                                                const bytes = serverStats.showsBytes;
                                                if (bytes === 0) return '0 B';
                                                const k = 1024;
                                                const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
                                                const i = Math.floor(Math.log(bytes) / Math.log(k));
                                                return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
                                            })() : '0 B'}
                                        </span>
                                        <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider mt-1">
                                            <span className="text-plex">{serverStats.shows?.toLocaleString() || 0}</span>
                                            <span className="text-muted">Shows</span>
                                        </div>
                                    </div>
                                    <div className="bg-background/60 p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center shadow-inner hover:bg-background/80 transition-colors">
                                        <Music className="w-7 h-7 text-plex mb-2 opacity-80" />
                                        <span className="text-3xl font-black text-text drop-shadow-md mb-1">
                                            {serverStats.musicBytes ? (() => {
                                                const bytes = serverStats.musicBytes;
                                                if (bytes === 0) return '0 B';
                                                const k = 1024;
                                                const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
                                                const i = Math.floor(Math.log(bytes) / Math.log(k));
                                                return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
                                            })() : '0 B'}
                                        </span>
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
                    </div>

                    {/* User Analytics Section */}
                    {(sessionInfo.session.isAdmin || user) && (
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between bg-card border border-border rounded-2xl p-4 shadow-sm">
                                <h2 className="text-lg md:text-xl font-bold text-text flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-plex" /> Your Analytics
                                </h2>
                                <div className="relative">
                                    <button
                                        onClick={() => setAnalyticsDaysOpen(!analyticsDaysOpen)}
                                        className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-1.5 text-sm font-medium text-text focus:outline-none focus:border-plex hover:border-plex/50 transition-colors cursor-pointer"
                                    >
                                        <span>
                                            {analyticsDays === 7 ? 'Last 7 Days' :
                                                analyticsDays === 30 ? 'Last 30 Days' :
                                                    analyticsDays === 60 ? 'Last 60 Days' :
                                                        analyticsDays === 90 ? 'Last 90 Days' :
                                                            analyticsDays === 180 ? 'Last 180 Days' :
                                                                'All Time'}
                                        </span>
                                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${analyticsDaysOpen ? 'rotate-180 text-plex' : 'text-muted'}`} />
                                    </button>

                                    {analyticsDaysOpen && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setAnalyticsDaysOpen(false)} />
                                            <div className="absolute right-0 mt-2 w-40 bg-card border border-border rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] z-50 overflow-hidden flex flex-col py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                                                {[
                                                    { value: 7, label: 'Last 7 Days' },
                                                    { value: 30, label: 'Last 30 Days' },
                                                    { value: 60, label: 'Last 60 Days' },
                                                    { value: 90, label: 'Last 90 Days' },
                                                    { value: 180, label: 'Last 180 Days' },
                                                    { value: 'all', label: 'All Time' }
                                                ].map(opt => (
                                                    <button
                                                        key={opt.value}
                                                        onClick={() => {
                                                            setAnalyticsDays(opt.value as any);
                                                            setAnalyticsDaysOpen(false);
                                                        }}
                                                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${analyticsDays === opt.value ? 'bg-plex/10 text-plex font-bold border-l-2 border-plex' : 'text-text hover:bg-white/5 border-l-2 border-transparent'}`}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {analyticsLoading ? (
                                <div className="flex items-center justify-center p-8 bg-card border border-border rounded-2xl shadow-lg">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-6 h-6 rounded-full border-2 border-plex border-t-transparent animate-spin" />
                                        <span className="text-muted text-sm font-medium">Loading your stats...</span>
                                    </div>
                                </div>
                            ) : analytics && analytics.totalPlays > 0 ? (
                                <div className="flex flex-col gap-6 flex-1">

                                    {/* Top Content Grid */}
                                    {analytics.topWatched && analytics.topWatched.length > 0 && (
                                        <div className="bg-card border border-border rounded-2xl p-6 shadow-xl flex-1 flex flex-col">
                                            <div className="flex items-center justify-between mb-6">
                                                <div>
                                                    <h3 className="text-xl font-bold text-text mb-1">Your Most Watched</h3>
                                                    <p className="text-muted text-sm">Based on your {analytics.totalPlays} total plays</p>
                                                </div>
                                                {analytics.topWatched.length > TOP_CONTENT_PAGE_SIZE && (
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => setTopContentPage(p => Math.max(0, p - 1))}
                                                            disabled={topContentPage === 0}
                                                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-text"
                                                        >
                                                            <ChevronUp className="w-4 h-4 -rotate-90" />
                                                        </button>
                                                        <span className="text-xs text-muted font-medium w-8 text-center">
                                                            {topContentPage + 1} / {Math.ceil(analytics.topWatched.length / TOP_CONTENT_PAGE_SIZE)}
                                                        </span>
                                                        <button
                                                            onClick={() => setTopContentPage(p => Math.min(Math.ceil(analytics.topWatched.length / TOP_CONTENT_PAGE_SIZE) - 1, p + 1))}
                                                            disabled={topContentPage >= Math.ceil(analytics.topWatched.length / TOP_CONTENT_PAGE_SIZE) - 1}
                                                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-text"
                                                        >
                                                            <ChevronDown className="w-4 h-4 -rotate-90" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-4">
                                                {analytics.topWatched.slice(topContentPage * TOP_CONTENT_PAGE_SIZE, (topContentPage + 1) * TOP_CONTENT_PAGE_SIZE).map((item: any) => (
                                                    <a key={item.key} href={item.plexUrl} target="_blank" rel="noreferrer" className="group flex flex-col gap-2">
                                                        <div className="relative rounded-xl overflow-hidden aspect-[2/3] bg-background border border-white/5 transition-transform group-hover:scale-105 group-hover:shadow-xl group-hover:border-plex/50">
                                                            {item.thumbUrl ? (
                                                                <img src={item.thumbUrl} alt={item.title} className="w-full h-full object-cover transition-opacity group-hover:opacity-80" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center p-4 text-center bg-white/5">
                                                                    <span className="text-xs font-bold text-muted line-clamp-3">{item.title}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col px-1">
                                                            <p className="text-xs font-bold text-text truncate group-hover:text-plex transition-colors">{item.title}</p>
                                                            <p className="text-[10px] text-plex font-black mt-0.5 uppercase tracking-wider">{item.plays} plays</p>
                                                        </div>
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center p-10 bg-card border border-border rounded-2xl shadow-lg text-center flex-1 min-h-[300px]">
                                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 text-2xl shadow-inner">🍿</div>
                                    <h3 className="font-bold text-text mb-2">No watch history yet</h3>
                                    <p className="text-muted text-sm max-w-sm">Once you start watching content on the server, your personal watch stats and history will appear right here!</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Recently Added Section (Full Width below Grid) */}
            {dashboardData && (
                <div className="flex flex-col gap-6 w-full">
                    {dashboardData.recentMovies?.length > 0 && (
                        <div className="bg-card border border-border rounded-2xl p-6 shadow-xl overflow-hidden w-full">
                            <h3 className="text-xl font-bold text-text mb-4">Recently Added Movies</h3>
                            <div className="flex overflow-x-auto gap-4 pb-4 snap-x hide-scrollbar scroll-smooth">
                                {dashboardData.recentMovies.map((item: any, idx: number) => (
                                    <a key={idx} href={item.plexUrl} target="_blank" rel="noreferrer" className="snap-start shrink-0 w-32 md:w-40 group flex flex-col gap-2">
                                        <div className="relative rounded-xl overflow-hidden aspect-[2/3] bg-background border border-white/5 transition-transform group-hover:scale-105 group-hover:shadow-xl group-hover:border-plex/50">
                                            {item.thumb ? (
                                                <img src={`/api/plex/image?path=${encodeURIComponent(item.thumb)}&width=300&height=450`} alt={item.title} className="w-full h-full object-cover transition-opacity group-hover:opacity-80" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center p-4 text-center bg-white/5">
                                                    <span className="text-xs font-bold text-muted line-clamp-3">{item.title}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col px-1">
                                            <p className="text-xs font-bold text-text truncate group-hover:text-plex transition-colors">{item.title}</p>
                                            {item.year && <p className="text-[10px] text-muted font-semibold mt-0.5">{item.year}</p>}
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {dashboardData.recentShows?.length > 0 && (
                        <div className="bg-card border border-border rounded-2xl p-6 shadow-xl overflow-hidden w-full">
                            <h3 className="text-xl font-bold text-text mb-4">Recently Added TV Shows</h3>
                            <div className="flex overflow-x-auto gap-4 pb-4 snap-x hide-scrollbar scroll-smooth">
                                {dashboardData.recentShows.map((item: any, idx: number) => (
                                    <a key={idx} href={item.plexUrl} target="_blank" rel="noreferrer" className="snap-start shrink-0 w-32 md:w-40 group flex flex-col gap-2">
                                        <div className="relative rounded-xl overflow-hidden aspect-[2/3] bg-background border border-white/5 transition-transform group-hover:scale-105 group-hover:shadow-xl group-hover:border-plex/50">
                                            {item.thumb ? (
                                                <img src={`/api/plex/image?path=${encodeURIComponent(item.thumb)}&width=300&height=450`} alt={item.title} className="w-full h-full object-cover transition-opacity group-hover:opacity-80" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center p-4 text-center bg-white/5">
                                                    <span className="text-xs font-bold text-muted line-clamp-3">{item.title}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col px-1">
                                            <p className="text-xs font-bold text-text truncate group-hover:text-plex transition-colors">{item.title}</p>
                                            {item.year && <p className="text-[10px] text-muted font-semibold mt-0.5">{item.year}</p>}
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {dashboardData.recentMusic?.length > 0 && (
                        <div className="bg-card border border-border rounded-2xl p-6 shadow-xl overflow-hidden w-full">
                            <h3 className="text-xl font-bold text-text mb-4">Recently Added Music</h3>
                            <div className="flex overflow-x-auto gap-4 pb-4 snap-x hide-scrollbar scroll-smooth">
                                {dashboardData.recentMusic.map((item: any, idx: number) => (
                                    <a key={idx} href={item.plexUrl} target="_blank" rel="noreferrer" className="snap-start shrink-0 w-32 md:w-40 group flex flex-col gap-2">
                                        <div className="relative rounded-xl overflow-hidden aspect-square bg-background border border-white/5 transition-transform group-hover:scale-105 group-hover:shadow-xl group-hover:border-plex/50">
                                            {item.thumb ? (
                                                <img src={`/api/plex/image?path=${encodeURIComponent(item.thumb)}&width=300&height=300`} alt={item.title} className="w-full h-full object-cover transition-opacity group-hover:opacity-80" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center p-4 text-center bg-white/5">
                                                    <span className="text-xs font-bold text-muted line-clamp-3">{item.title}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col px-1">
                                            <p className="text-xs font-bold text-text truncate group-hover:text-plex transition-colors">{item.title}</p>
                                            {item.parentTitle && <p className="text-[10px] text-muted font-semibold mt-0.5 truncate">{item.parentTitle}</p>}
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
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

const StatusDashboard: React.FC<{ onBack: () => void, isAdmin: boolean, isPublic?: boolean }> = ({ onBack, isAdmin, isPublic }) => {
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

                        {groups.length === 0 && <p style={{ textAlign: 'center', marginTop: '2rem' }}>No status monitors configured.</p>}

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
const StreamDetailsModal: React.FC<{ session: any, onClose: () => void, isAdmin?: boolean, onKilled?: () => void }> = ({ session, onClose, isAdmin, onKilled }) => {
    const [killReason, setKillReason] = useState('');
    const [isKilling, setIsKilling] = useState(false);
    const [showKillConfirm, setShowKillConfirm] = useState(false);

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
                        <img src={`/api/plex/image?path=${encodeURIComponent(session.thumb)}&width=400&height=600`} alt={session.title} className="absolute inset-0 w-full h-full object-cover opacity-80" />
                        <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent md:bg-gradient-to-r"></div>
                    </div>
                    {/* User Avatar Badge */}
                    {session.user && (
                        <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-md rounded-full pr-4 p-1.5 shadow-lg border border-white/10 z-10">
                            <img src={session.userThumb ? session.userThumb : 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'} className="w-8 h-8 rounded-full object-cover" onError={(e) => { e.currentTarget.src = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'; }} />
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
                            Open in Plex
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

const LibraryDashboard: React.FC<{ onBack: () => void, isAdmin?: boolean, publicConfig?: any }> = ({ onBack, isAdmin, publicConfig }) => {
    const [dashboardData, setDashboardData] = useState<{ activeSessions: any[], recentMovies: any[], recentShows: any[], recentMusic: any[] } | null>(null);
    const [trendingStats, setTrendingStats] = useState<{ trending7Days: any[], movies30Days: any[], shows30Days: any[], top365Days: any[], allTime: any[], weekendWarriors: any[], nightOwls: any[], retroHits: any[], cultClassics: any[] } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [recentLimit, setRecentLimit] = useState(() => {
        const saved = localStorage.getItem('discoverRecentLimit');
        return saved ? Number(saved) : 12;
    });
    const [selectedSession, setSelectedSession] = useState<any | null>(null);

    useEffect(() => {
        localStorage.setItem('discoverRecentLimit', String(recentLimit));
    }, [recentLimit]);

    const fetchDashboardOnly = useCallback(async () => {
        try {
            const res = await apiFetch(`/api/plex/dashboard?limit=${recentLimit}`);
            if (!res.error) {
                setDashboardData(res);
            }
        } catch (err) {
            // Ignore background polling errors
        }
    }, [recentLimit]);

    const fetchData = useCallback(async () => {
        try {
            const res = await apiFetch(`/api/plex/dashboard?limit=${recentLimit}`);
            if (res.error) throw new Error(res.error);
            setDashboardData(res);

            const statsRes = await apiFetch('/api/plex/stats/trending');
            if (!statsRes.error) {
                setTrendingStats(statsRes);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    }, [recentLimit]);

    useEffect(() => {
        fetchData();
        const liveInterval = setInterval(fetchDashboardOnly, 1000);
        return () => clearInterval(liveInterval);
    }, [fetchDashboardOnly, fetchData]);

    if (loading && !dashboardData) return <Loader isLoading={true} />;

    const totalStreams = dashboardData?.activeSessions?.length || 0;
    const transcodingStreams = dashboardData?.activeSessions?.filter(s => s.isTranscoding).length || 0;
    const directStreams = totalStreams - transcodingStreams;
    const totalBandwidthKbps = dashboardData?.activeSessions?.reduce((acc, s) => acc + (s.bandwidth || 0), 0) || 0;
    const totalBandwidthMbps = (totalBandwidthKbps / 1000).toFixed(2);

    return (
        <div className="w-full flex flex-col min-h-screen">
            <main className="w-full pb-8 mt-4 md:mt-0">
                {error && <div className="toast error show">{error}</div>}

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
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-6">
                            {dashboardData.activeSessions.map((session, i) => (
                                <div key={session.sessionId ?? i} onClick={() => setSelectedSession(session)} className="bg-card rounded-xl border border-border flex flex-col overflow-hidden shadow-lg hover:border-plex/50 hover:shadow-plex/20 transition-all cursor-pointer select-none">
                                    <div className="flex flex-row flex-grow relative">
                                        <div className="w-36 md:w-44 flex-shrink-0 relative overflow-hidden bg-card">
                                            <div className="w-full pb-[150%]"></div>
                                            <img src={`/api/plex/image?path=${encodeURIComponent(session.thumb)}&width=300&height=500`} alt={session.title} loading="lazy" className="absolute inset-0 w-full h-full object-cover drop-shadow-2xl" />
                                        </div>
                                        <div className="p-3 md:p-4 flex flex-col flex-grow min-w-0 justify-center relative">
                                            {session.user && (
                                                <div className="absolute top-3 right-3 flex items-center gap-2 bg-black/50 backdrop-blur-md rounded-full pr-3 p-1 shadow-md border border-white/5">
                                                    <img src={session.userThumb ? session.userThumb : 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'} alt={session.user} className="w-5 h-5 rounded-full object-cover" onError={(e) => { e.currentTarget.src = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'; }} />
                                                    <span className="text-[10px] font-bold text-white/90 truncate max-w-[80px] md:max-w-[100px]">{session.user}</span>
                                                </div>
                                            )}

                                            <div className="activity-header mb-1 pr-24 md:pr-32">
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

                                            <div className="flex flex-wrap gap-1.5 mb-3 mt-1">
                                                {session.resolution && (
                                                    <span className="bg-white/10 text-white/90 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide border border-white/10">{session.resolution.includes('p') || session.resolution.includes('k') ? session.resolution : `${session.resolution}p`}</span>
                                                )}
                                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide border ${session.sessionLocation === 'lan' ? 'bg-status-active/20 text-status-active border-status-active/30' : 'bg-plex/20 text-plex border-plex/30'}`}>
                                                    {session.sessionLocation === 'lan' ? 'Local' : 'Remote'}
                                                </span>
                                            </div>

                                            <div className="activity-details flex flex-col gap-1 mt-auto">
                                                <div className="flex justify-between items-start text-[10px] md:text-xs border-b border-white/5 pb-1">
                                                    <span className="text-muted uppercase tracking-wider font-bold mt-0.5">PLAYER</span>
                                                    <span className="detail-value text-right break-words max-w-[130px] md:max-w-[180px]">{session.playerTitle}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-[10px] md:text-xs border-b border-white/5 pb-1">
                                                    <span className="text-muted uppercase tracking-wider font-bold">STREAM</span>
                                                    <span className={`font-bold ${session.isTranscoding ? 'text-status-expiring' : 'text-status-active'}`}>
                                                        {session.isTranscoding ? 'Transcode' : 'Direct Play'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center text-[10px] md:text-xs border-b border-white/5 pb-1">
                                                    <span className="text-muted uppercase tracking-wider font-bold">STATE</span>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="detail-value font-bold">{session.state.charAt(0).toUpperCase() + session.state.slice(1)}</span>
                                                        {session.timeRemaining > 0 && session.state === 'playing' && (
                                                            <span className="text-[9px] text-muted/80">
                                                                ({Math.floor(session.timeRemaining / 3600000) > 0 ? `${Math.floor(session.timeRemaining / 3600000)}h ` : ''}
                                                                {Math.floor((session.timeRemaining % 3600000) / 60000)}m left)
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center text-[10px] md:text-xs pb-1">
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
                                            <div className="w-full h-5 bg-background/80 relative mt-auto z-10 overflow-hidden rounded-b-lg">
                                                {/* Progress fill */}
                                                <div className="h-full bg-plex absolute top-0 left-0 transition-all duration-1000 z-10" style={{ width: `${session.progress}%` }}></div>

                                                {/* Text visible on black background (white text) */}
                                                <div
                                                    className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-white z-20 pointer-events-none whitespace-nowrap"
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
                            ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-muted p-8 border border-dashed border-border rounded-xl mt-4 w-full">No active streams</div>
                    )}
                </section>

                <div className="flex justify-end gap-4 items-center mb-8">
                    <span style={{ fontSize: '0.85rem', color: '#999' }}>RECENTLY ADDED LIMIT</span>
                    <select className="w-full md:w-32 p-2 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all cursor-pointer text-sm" value={recentLimit} onChange={(e) => setRecentLimit(Number(e.target.value))}>
                        <option value={12}>12 Items</option>
                        <option value={25}>25 Items</option>
                        <option value={50}>50 Items</option>
                        <option value={100}>100 Items</option>
                        <option value={150}>150 Items</option>
                        <option value={200}>200 Items</option>
                        <option value={250}>250 Items</option>
                    </select>
                </div>

                <div className="flex flex-col gap-12 w-full">
                    {/* RECENT MOVIES */}
                    <div className="flex flex-col">
                        <h2 className="text-plex text-sm uppercase tracking-[2px] mb-6 font-bold border-b border-white/10 pb-2">RECENTLY ADDED MOVIES</h2>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:[grid-template-columns:repeat(auto-fill,minmax(150px,150px))] md:justify-start gap-3 w-full pb-4">
                            {dashboardData && dashboardData.recentMovies.slice(0, recentLimit).map((item, i) => (
                                <a key={i} href={item.plexUrl} target="_blank" rel="noreferrer" className="flex flex-col w-full gap-2 group" style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <div className="relative aspect-[2/3] w-full rounded-lg overflow-hidden border border-border group-hover:border-plex transition-colors shadow-md">
                                        <img src={`/api/plex/image?path=${encodeURIComponent(item.thumb)}&width=300&height=450`} alt={item.title} loading="lazy" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="text-white text-xs font-medium text-center mt-1 line-clamp-2 leading-tight">{item.title}</div>
                                </a>
                            ))}
                            {(!dashboardData || dashboardData.recentMovies.length === 0) && <div className="text-center text-muted p-8 border border-dashed border-border rounded-xl mt-4 w-full col-span-full">No recent movies</div>}
                        </div>
                    </div>

                    {/* RECENT TV SHOWS */}
                    <div className="flex flex-col">
                        <h2 className="text-plex text-sm uppercase tracking-[2px] mb-6 font-bold border-b border-white/10 pb-2">RECENTLY ADDED TV SHOWS</h2>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:[grid-template-columns:repeat(auto-fill,minmax(150px,150px))] md:justify-start gap-3 w-full pb-4">
                            {dashboardData && dashboardData.recentShows.slice(0, recentLimit).map((item, i) => (
                                <a key={i} href={item.plexUrl} target="_blank" rel="noreferrer" className="flex flex-col w-full gap-2 group" style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <div className="relative aspect-[2/3] w-full rounded-lg overflow-hidden border border-border group-hover:border-plex transition-colors shadow-md">
                                        <img src={`/api/plex/image?path=${encodeURIComponent(item.thumb)}&width=300&height=450`} alt={item.title} loading="lazy" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="text-white text-xs font-medium text-center mt-1 line-clamp-2 leading-tight">{item.title}</div>
                                </a>
                            ))}
                            {(!dashboardData || dashboardData.recentShows.length === 0) && <div className="text-center text-muted p-8 border border-dashed border-border rounded-xl mt-4 w-full col-span-full">No recent TV shows</div>}
                        </div>
                    </div>

                    {/* RECENT MUSIC */}
                    <div className="flex flex-col">
                        <h2 className="text-plex text-sm uppercase tracking-[2px] mb-6 font-bold border-b border-white/10 pb-2">RECENTLY ADDED MUSIC</h2>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:[grid-template-columns:repeat(auto-fill,minmax(150px,150px))] md:justify-start gap-3 w-full pb-4">
                            {dashboardData && dashboardData.recentMusic.slice(0, recentLimit).map((item, i) => (
                                <a key={i} href={item.plexUrl} target="_blank" rel="noreferrer" className="flex flex-col w-full gap-2 group" style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <div className="relative aspect-square w-full rounded-lg overflow-hidden border border-border group-hover:border-plex transition-colors shadow-md">
                                        <img src={`/api/plex/image?path=${encodeURIComponent(item.thumb)}&width=300&height=300`} alt={item.title} loading="lazy" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="text-white text-xs font-medium text-center mt-1 line-clamp-2 leading-tight">{item.title}</div>
                                </a>
                            ))}
                            {(!dashboardData || dashboardData.recentMusic.length === 0) && <div className="text-center text-muted p-8 border border-dashed border-border rounded-xl mt-4 w-full col-span-full">No recent music</div>}
                        </div>
                    </div>
                </div>

                {/* SERVER WIDE STATS SECTION */}
                {trendingStats && (
                    <div className="mt-16 w-full flex flex-col gap-12">
                        <div className="flex flex-col gap-2 items-center text-center mb-4">
                            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">Other things happening on {publicConfig?.serverIdentifier || 'this server'}</h2>
                            <p className="text-muted text-sm max-w-xl">A look at what the community is currently watching across the entire server.</p>
                        </div>

                        {/* Trending 7 Days */}
                        {trendingStats.trending7Days?.length > 0 && (
                            <div className="flex flex-col">
                                <h3 className="text-plex text-sm uppercase tracking-[2px] mb-6 font-bold border-b border-white/10 pb-2">🔥 Trending This Week</h3>
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:[grid-template-columns:repeat(auto-fill,minmax(150px,150px))] md:justify-start gap-3 w-full pb-4">
                                    {trendingStats.trending7Days.slice(0, recentLimit).map((item, i) => (
                                        <a key={i} href={item.plexUrl || '#'} target="_blank" rel="noreferrer" className="flex flex-col w-full gap-2 group" style={{ textDecoration: 'none', color: 'inherit' }}>
                                            <div className="relative aspect-[2/3] w-full rounded-lg overflow-hidden border border-border group-hover:border-plex transition-colors shadow-md">
                                                <img src={`/api/plex/image?path=${encodeURIComponent(item.thumb)}&width=300&height=450`} alt={item.title} loading="lazy" className="w-full h-full object-cover" />
                                                <div className="absolute top-2 right-2 bg-black/80 text-plex text-xs font-bold px-2 py-1 rounded backdrop-blur-md border border-plex/30">
                                                    {item.views} Views
                                                </div>
                                            </div>
                                            <div className="text-white text-xs font-medium text-center mt-1 line-clamp-2 leading-tight">{item.title}</div>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Most Watched Movies 30 Days */}
                        {trendingStats.movies30Days?.length > 0 && (
                            <div className="flex flex-col">
                                <h3 className="text-plex text-sm uppercase tracking-[2px] mb-6 font-bold border-b border-white/10 pb-2">🍿 Most Watched Movies (This Month)</h3>
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:[grid-template-columns:repeat(auto-fill,minmax(150px,150px))] md:justify-start gap-3 w-full pb-4">
                                    {trendingStats.movies30Days.slice(0, recentLimit).map((item, i) => (
                                        <a key={i} href={item.plexUrl || '#'} target="_blank" rel="noreferrer" className="flex flex-col w-full gap-2 group" style={{ textDecoration: 'none', color: 'inherit' }}>
                                            <div className="relative aspect-[2/3] w-full rounded-lg overflow-hidden border border-border group-hover:border-plex transition-colors shadow-md">
                                                <img src={`/api/plex/image?path=${encodeURIComponent(item.thumb)}&width=300&height=450`} alt={item.title} loading="lazy" className="w-full h-full object-cover" />
                                                <div className="absolute top-2 right-2 bg-black/80 text-plex text-xs font-bold px-2 py-1 rounded backdrop-blur-md border border-plex/30">
                                                    {item.views} Views
                                                </div>
                                            </div>
                                            <div className="text-white text-xs font-medium text-center mt-1 line-clamp-2 leading-tight">{item.title}</div>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Most Watched Shows 30 Days */}
                        {trendingStats.shows30Days?.length > 0 && (
                            <div className="flex flex-col">
                                <h3 className="text-plex text-sm uppercase tracking-[2px] mb-6 font-bold border-b border-white/10 pb-2">📺 Most Watched Shows (This Month)</h3>
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:[grid-template-columns:repeat(auto-fill,minmax(150px,150px))] md:justify-start gap-3 w-full pb-4">
                                    {trendingStats.shows30Days.slice(0, recentLimit).map((item, i) => (
                                        <a key={i} href={item.plexUrl || '#'} target="_blank" rel="noreferrer" className="flex flex-col w-full gap-2 group" style={{ textDecoration: 'none', color: 'inherit' }}>
                                            <div className="relative aspect-[2/3] w-full rounded-lg overflow-hidden border border-border group-hover:border-plex transition-colors shadow-md">
                                                <img src={`/api/plex/image?path=${encodeURIComponent(item.thumb)}&width=300&height=450`} alt={item.title} loading="lazy" className="w-full h-full object-cover" />
                                                <div className="absolute top-2 right-2 bg-black/80 text-plex text-xs font-bold px-2 py-1 rounded backdrop-blur-md border border-plex/30">
                                                    {item.views} Views
                                                </div>
                                            </div>
                                            <div className="text-white text-xs font-medium text-center mt-1 line-clamp-2 leading-tight">{item.title}</div>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Top of the Year */}
                        {trendingStats.top365Days?.length > 0 && (
                            <div className="flex flex-col">
                                <h3 className="text-plex text-sm uppercase tracking-[2px] mb-6 font-bold border-b border-white/10 pb-2">🏆 Top of the Year</h3>
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:[grid-template-columns:repeat(auto-fill,minmax(150px,150px))] md:justify-start gap-3 w-full pb-4">
                                    {trendingStats.top365Days.slice(0, recentLimit).map((item, i) => (
                                        <a key={i} href={item.plexUrl || '#'} target="_blank" rel="noreferrer" className="flex flex-col w-full gap-2 group" style={{ textDecoration: 'none', color: 'inherit' }}>
                                            <div className="relative aspect-[2/3] w-full rounded-lg overflow-hidden border border-border group-hover:border-plex transition-colors shadow-md">
                                                <img src={`/api/plex/image?path=${encodeURIComponent(item.thumb)}&width=300&height=450`} alt={item.title} loading="lazy" className="w-full h-full object-cover" />
                                                <div className="absolute top-2 right-2 bg-black/80 text-plex text-xs font-bold px-2 py-1 rounded backdrop-blur-md border border-plex/30">
                                                    {item.views} Views
                                                </div>
                                            </div>
                                            <div className="text-white text-xs font-medium text-center mt-1 line-clamp-2 leading-tight">{item.title}</div>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* All Time Favorites */}
                        {trendingStats.allTime?.length > 0 && (
                            <div className="flex flex-col">
                                <h3 className="text-plex text-sm uppercase tracking-[2px] mb-6 font-bold border-b border-white/10 pb-2">🌟 All Time Favorites</h3>
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:[grid-template-columns:repeat(auto-fill,minmax(150px,150px))] md:justify-start gap-3 w-full pb-4">
                                    {trendingStats.allTime.slice(0, recentLimit).map((item, i) => (
                                        <a key={i} href={item.plexUrl || '#'} target="_blank" rel="noreferrer" className="flex flex-col w-full gap-2 group" style={{ textDecoration: 'none', color: 'inherit' }}>
                                            <div className="relative aspect-[2/3] w-full rounded-lg overflow-hidden border border-border group-hover:border-plex transition-colors shadow-md">
                                                <img src={`/api/plex/image?path=${encodeURIComponent(item.thumb)}&width=300&height=450`} alt={item.title} loading="lazy" className="w-full h-full object-cover" />
                                                <div className="absolute top-2 right-2 bg-black/80 text-plex text-xs font-bold px-2 py-1 rounded backdrop-blur-md border border-plex/30">
                                                    {item.views} Views
                                                </div>
                                            </div>
                                            <div className="text-white text-xs font-medium text-center mt-1 line-clamp-2 leading-tight">{item.title}</div>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Weekend Warriors */}
                        {trendingStats.weekendWarriors?.length > 0 && (
                            <div className="flex flex-col">
                                <h3 className="text-plex text-sm uppercase tracking-[2px] mb-6 font-bold border-b border-white/10 pb-2">🍿 Weekend Warriors</h3>
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:[grid-template-columns:repeat(auto-fill,minmax(150px,150px))] md:justify-start gap-3 w-full pb-4">
                                    {trendingStats.weekendWarriors.slice(0, recentLimit).map((item, i) => (
                                        <a key={i} href={item.plexUrl || '#'} target="_blank" rel="noreferrer" className="flex flex-col w-full gap-2 group" style={{ textDecoration: 'none', color: 'inherit' }}>
                                            <div className="relative aspect-[2/3] w-full rounded-lg overflow-hidden border border-border group-hover:border-plex transition-colors shadow-md">
                                                <img src={`/api/plex/image?path=${encodeURIComponent(item.thumb)}&width=300&height=450`} alt={item.title} loading="lazy" className="w-full h-full object-cover" />
                                                <div className="absolute top-2 right-2 bg-black/80 text-plex text-xs font-bold px-2 py-1 rounded backdrop-blur-md border border-plex/30">
                                                    {item.views} Views
                                                </div>
                                            </div>
                                            <div className="text-white text-xs font-medium text-center mt-1 line-clamp-2 leading-tight">{item.title}</div>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Night Owl Club */}
                        {trendingStats.nightOwls?.length > 0 && (
                            <div className="flex flex-col">
                                <h3 className="text-plex text-sm uppercase tracking-[2px] mb-6 font-bold border-b border-white/10 pb-2">🦇 Night Owl Club</h3>
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:[grid-template-columns:repeat(auto-fill,minmax(150px,150px))] md:justify-start gap-3 w-full pb-4">
                                    {trendingStats.nightOwls.slice(0, recentLimit).map((item, i) => (
                                        <a key={i} href={item.plexUrl || '#'} target="_blank" rel="noreferrer" className="flex flex-col w-full gap-2 group" style={{ textDecoration: 'none', color: 'inherit' }}>
                                            <div className="relative aspect-[2/3] w-full rounded-lg overflow-hidden border border-border group-hover:border-plex transition-colors shadow-md">
                                                <img src={`/api/plex/image?path=${encodeURIComponent(item.thumb)}&width=300&height=450`} alt={item.title} loading="lazy" className="w-full h-full object-cover" />
                                                <div className="absolute top-2 right-2 bg-black/80 text-plex text-xs font-bold px-2 py-1 rounded backdrop-blur-md border border-plex/30">
                                                    {item.views} Views
                                                </div>
                                            </div>
                                            <div className="text-white text-xs font-medium text-center mt-1 line-clamp-2 leading-tight">{item.title}</div>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Blast from the Past */}
                        {trendingStats.retroHits?.length > 0 && (
                            <div className="flex flex-col">
                                <h3 className="text-plex text-sm uppercase tracking-[2px] mb-6 font-bold border-b border-white/10 pb-2">📼 Blast from the Past</h3>
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:[grid-template-columns:repeat(auto-fill,minmax(150px,150px))] md:justify-start gap-3 w-full pb-4">
                                    {trendingStats.retroHits.slice(0, recentLimit).map((item, i) => (
                                        <a key={i} href={item.plexUrl || '#'} target="_blank" rel="noreferrer" className="flex flex-col w-full gap-2 group" style={{ textDecoration: 'none', color: 'inherit' }}>
                                            <div className="relative aspect-[2/3] w-full rounded-lg overflow-hidden border border-border group-hover:border-plex transition-colors shadow-md">
                                                <img src={`/api/plex/image?path=${encodeURIComponent(item.thumb)}&width=300&height=450`} alt={item.title} loading="lazy" className="w-full h-full object-cover" />
                                                <div className="absolute top-2 right-2 bg-black/80 text-plex text-xs font-bold px-2 py-1 rounded backdrop-blur-md border border-plex/30">
                                                    {item.views} Views
                                                </div>
                                            </div>
                                            <div className="text-white text-xs font-medium text-center mt-1 line-clamp-2 leading-tight">{item.title}</div>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Cult Classics */}
                        {trendingStats.cultClassics?.length > 0 && (
                            <div className="flex flex-col">
                                <h3 className="text-plex text-sm uppercase tracking-[2px] mb-6 font-bold border-b border-white/10 pb-2">💎 Cult Classics</h3>
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:[grid-template-columns:repeat(auto-fill,minmax(150px,150px))] md:justify-start gap-3 w-full pb-4">
                                    {trendingStats.cultClassics.slice(0, recentLimit).map((item, i) => (
                                        <a key={i} href={item.plexUrl || '#'} target="_blank" rel="noreferrer" className="flex flex-col w-full gap-2 group" style={{ textDecoration: 'none', color: 'inherit' }}>
                                            <div className="relative aspect-[2/3] w-full rounded-lg overflow-hidden border border-border group-hover:border-plex transition-colors shadow-md">
                                                <img src={`/api/plex/image?path=${encodeURIComponent(item.thumb)}&width=300&height=450`} alt={item.title} loading="lazy" className="w-full h-full object-cover" />
                                                <div className="absolute top-2 right-2 bg-black/80 text-plex text-xs font-bold px-2 py-1 rounded backdrop-blur-md border border-plex/30">
                                                    {item.views} Views
                                                </div>
                                            </div>
                                            <div className="text-white text-xs font-medium text-center mt-1 line-clamp-2 leading-tight">{item.title}</div>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Stream Details Modal */}
            {selectedSession && <StreamDetailsModal session={selectedSession} onClose={() => setSelectedSession(null)} isAdmin={isAdmin} onKilled={fetchData} />}
        </div>
    );
};

const MaintenanceDashboard: React.FC = () => {
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
        setToasts(t => [...t, { id: Date.now() + Math.random(), message, type }]);
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
        <div className="bg-card/50 backdrop-blur-md border border-white/5 rounded-xl p-5">
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
            <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[2000] flex flex-col-reverse gap-2 items-center">
                {toasts.map(toast => <Toast key={toast.id} {...toast} onDismiss={() => setToasts(t => t.filter(item => item.id !== toast.id))} />)}
            </div>
            <header className="hidden md:flex items-center justify-between w-full mb-6 mt-2 md:mt-0">
                <h1 className="text-xl md:text-3xl font-bold text-plex">Maintenance</h1>
            </header>
            <div className="w-full flex flex-col p-0 md:p-8 bg-transparent md:bg-card/50 md:backdrop-blur-md rounded-none md:rounded-2xl border-0 md:border border-white/5 shadow-none md:shadow-2xl">
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
                    <aside className="hidden md:block bg-card/50 border border-white/5 rounded-xl p-3 h-fit sticky top-20 backdrop-blur-md">
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
                            <div className="bg-card/50 backdrop-blur-md border border-yellow-500/30 rounded-xl p-5">
                                <h3 className="text-xl font-bold text-plex mb-2">Maintenance Disabled</h3>
                                <p className="text-sm text-muted mb-3">Experimental Maintenance Mode is currently OFF.</p>
                                <p className="text-xs text-muted">Enable it in `Settings` → `System` under `Maintenance Experimental Mode`, then click Save Settings.</p>
                                <button
                                    type="button"
                                    onClick={() => { window.location.href = '/settings?focus=maintenance-toggle#system'; }}
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
                                <div className="bg-card/50 backdrop-blur-md border border-white/5 rounded-xl p-5">
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
                                <div className="bg-card/50 backdrop-blur-md border border-white/5 rounded-xl p-5 space-y-4">
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
                            <div className="bg-card/50 backdrop-blur-md border border-white/5 rounded-xl p-5 space-y-3">
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
                            <div className="bg-card/50 backdrop-blur-md border border-white/5 rounded-xl p-3 md:p-5 space-y-3">
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
                                                        <img src={`/api/plex/image?path=${encodeURIComponent(item.thumb)}&width=220&height=330`} alt={item.title} loading="lazy" className="w-full h-full object-cover" />
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
                            <div className="bg-card/50 backdrop-blur-md border border-white/5 rounded-xl p-5 space-y-3">
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
                            <div className="bg-card/50 backdrop-blur-md border border-white/5 rounded-xl p-5 space-y-3">
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
                                                                    src={`/api/plex/image?path=${encodeURIComponent(item.thumb)}&width=64&height=64`}
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
                                                            src={`/api/plex/image?path=${encodeURIComponent(item.thumb)}&width=240&height=360`}
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
                            <div className="bg-card/50 backdrop-blur-md border border-white/5 rounded-xl p-5 space-y-4">
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
                            <div className="bg-card/50 backdrop-blur-md border border-white/5 rounded-xl p-5 space-y-3">
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
                            <div className="bg-card/50 backdrop-blur-md border border-white/5 rounded-xl p-4 md:p-5 space-y-3">
                                <h3 className="text-xl font-bold text-plex">Exclusions</h3>
                                <p className="text-sm text-muted">Browse posters by library, search titles, click posters to select, then bulk exclude/unexclude. Excluded items are removed from preview and execution.</p>
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
                                            className="h-9 px-3 bg-plex text-background rounded-md text-xs md:text-sm font-semibold whitespace-nowrap"
                                            onClick={async () => {
                                                if (!selectedExcludeKeys.length) {
                                                    addToast('Select posters to exclude first.', 'error');
                                                    return;
                                                }
                                                const merged = Array.from(new Set([...(preferences?.exclusions?.ratingKeys || []).map((v: string) => String(v)), ...selectedExcludeKeys]));
                                                const next = { ...preferences, exclusions: { ...(preferences.exclusions || {}), ratingKeys: merged } };
                                                await savePreferences(next);
                                                await loadExclusionsSummary();
                                                setSelectedExcludeKeys([]);
                                                await loadLibraryBrowse();
                                                addToast(`Excluded ${merged.length} total titles by rating key.`);
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
                                                const remaining = (preferences?.exclusions?.ratingKeys || []).map((v: string) => String(v)).filter((key: string) => !selectedExcludeKeys.includes(key));
                                                const next = { ...preferences, exclusions: { ...(preferences.exclusions || {}), ratingKeys: remaining } };
                                                await savePreferences(next);
                                                await loadExclusionsSummary();
                                                setSelectedExcludeKeys([]);
                                                await loadLibraryBrowse();
                                                addToast('Removed selected exclusions.');
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
                                                return (
                                                    <div key={`exclude-item-${key}`} className={`relative w-full border rounded-lg overflow-hidden transition-colors ${selected ? 'border-plex' : 'border-white/5'} ${excluded ? 'ring-1 ring-red-500/70' : ''}`}>
                                                        <button
                                                            type="button"
                                                            className="w-full text-left"
                                                            onClick={() => {
                                                                setSelectedExcludeKeys((prev) => prev.includes(key) ? prev.filter((v) => v !== key) : [...prev, key]);
                                                            }}
                                                        >
                                                            <div className="aspect-[2/3] bg-black/40">
                                                                {item.thumb ? (
                                                                    <img src={`/api/plex/image?path=${encodeURIComponent(item.thumb)}&width=220&height=330`} alt={item.title} loading="lazy" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-xs text-muted">No Poster</div>
                                                                )}
                                                            </div>
                                                            <div className="p-2">
                                                                <p className="text-xs text-text line-clamp-2">{item.title}</p>
                                                                <p className="text-[11px] text-muted mt-1">{item.libraryTitle}</p>
                                                            </div>
                                                        </button>
                                                        <div className="absolute top-2 left-2 flex gap-1">
                                                            {selected && <span className="text-[10px] px-1.5 py-0.5 rounded bg-plex text-background font-bold">Selected</span>}
                                                            {excluded && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-600 text-white font-bold">Excluded</span>}
                                                        </div>
                                                        <button
                                                            type="button"
                                                            className={`absolute top-2 right-2 px-2 py-1 rounded text-[11px] font-semibold z-10 ${excluded ? 'bg-border text-text' : 'bg-plex text-background'}`}
                                                            onClick={async (event) => {
                                                                event.preventDefault();
                                                                event.stopPropagation();
                                                                const currentKeys = (preferences?.exclusions?.ratingKeys || []).map((v: string) => String(v));
                                                                const nextKeys = excluded ? currentKeys.filter((v: string) => v !== key) : Array.from(new Set([...currentKeys, key]));
                                                                const next = { ...preferences, exclusions: { ...(preferences.exclusions || {}), ratingKeys: nextKeys } };
                                                                await savePreferences(next);
                                                                await loadExclusionsSummary();
                                                                await loadLibraryBrowse();
                                                                addToast(excluded ? `Removed exclusion for ${item.title}.` : `Excluded ${item.title}.`);
                                                            }}
                                                        >
                                                            {excluded ? 'Unexclude' : 'Exclude'}
                                                        </button>
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
                                                                <img src={`/api/plex/image?path=${encodeURIComponent(entry.thumb)}&width=80&height=120`} alt={entry.title} className="w-full h-full object-cover" />
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
                            <div className="bg-card/50 backdrop-blur-md border border-white/5 rounded-xl p-5 space-y-4">
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
    requestUrl: string;
    navOrder: string[];
    appVersion?: string;
}

const Navigation: React.FC<NavigationProps> = ({ currentRoute, onNavigate, onLogout, isAdmin, serverName, adminThumb, requestUrl, navOrder, appVersion }) => {
    useEffect(() => {
        updateFavicon(adminThumb);
    }, [adminThumb]);

    const navItemsConfig: Record<string, { label: string; icon: React.FC<any>; route: string; adminOnly: boolean; href?: string; onClick?: (e: any) => void }> = {
        'home': { label: 'Home', icon: Home, route: 'user', adminOnly: false },
        'users': { label: 'Users', icon: Users, route: 'users', adminOnly: true },
        'discover': { label: 'Discover', icon: Film, route: 'dashboard', adminOnly: false },
        'status': { label: 'Status', icon: Activity, route: 'status', adminOnly: false },
        'logs': { label: 'Logs', icon: FileText, route: 'logs', adminOnly: true },
        'analytics': { label: 'Analytics', icon: BarChart3, route: 'analytics', adminOnly: false },
        'mediastack': { label: 'Media Stack', icon: Layers, route: 'mediastack', adminOnly: false },
        'maintenance': { label: 'Maintenance', icon: Shield, route: 'maintenance', adminOnly: true },
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
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#161b22] border-b border-[#30363d] z-50 flex items-center justify-between px-4 shadow-md">
                <div className="flex items-center gap-3">
                    <img
                        src={adminThumb ? (adminThumb.startsWith('http') ? adminThumb : `/api/plex/image?path=${encodeURIComponent(adminThumb)}&width=64&height=64`) : '/static/logo.png'}
                        alt="Logo"
                        className="w-8 h-8 rounded-full object-cover"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = '/static/logo.png';
                        }}
                    />
                    <span className="font-bold text-text uppercase tracking-widest text-sm">{serverName}</span>
                </div>
                <div className="flex items-center gap-4">
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
            <div className="hidden md:flex flex-col w-72 bg-card border-r border-border p-6 sticky top-0 h-screen overflow-y-auto custom-scrollbar shadow-2xl">
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
                            <a key={key} href="#" className={`flex items-center gap-4 p-3 no-underline rounded-lg transition-all font-medium ${isCurrent ? 'bg-plex/15 text-plex shadow-[0_0_15px_rgba(229,160,13,0.1)]' : 'text-muted hover:bg-white/5 hover:text-text'}`} onClick={(e) => { e.preventDefault(); if (item.onClick) item.onClick(e); else onNavigate(item.route as any); }}>
                                <item.icon className="w-5 h-5 flex-shrink-0" /> {item.label}
                            </a>
                        );
                    })}
                </div>

                <div className="flex flex-col items-center mt-auto pt-10 pb-4 group cursor-default">
                    <div className="relative mb-6">
                        {/* Soft ambient background glow */}
                        <div className="absolute inset-0 bg-plex blur-[25px] opacity-20 group-hover:opacity-40 transition-opacity duration-700 rounded-full"></div>
                        {/* Spinning gradient border */}
                        <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-plex via-amber-300 to-orange-600 opacity-60 group-hover:opacity-100 group-hover:rotate-180 transition-all duration-1000 ease-out"></div>
                        {/* Inner cutout for the image */}
                        <div className="relative w-28 h-28 rounded-full p-[4px] shadow-2xl bg-card">
                            <div className="w-full h-full rounded-full overflow-hidden bg-background">
                                <img
                                    src={adminThumb ? (adminThumb.startsWith('http') ? adminThumb : `/api/plex/image?path=${encodeURIComponent(adminThumb)}&width=256&height=256`) : '/static/logo.png'}
                                    alt="Server Logo"
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = '/static/logo.png';
                                    }}
                                />
                            </div>
                        </div>
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
                        {appVersion && (
                            <div className="mt-2 text-[10px] text-white/50 font-mono tracking-wider opacity-80 hover:opacity-100 transition-opacity">
                                {appVersion}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Bottom Nav */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 w-full bg-[#161b22] border-t border-[#30363d] z-50 pb-[env(safe-area-inset-bottom)]">
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

const PublicInviteClaim: React.FC<{ code: string }> = ({ code }) => {
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
            const forwardUrl = window.location.origin + '/invite/' + code + '#auth/' + data.id;
            const authUrl = `https://app.plex.tv/auth#?clientID=${data.clientIdentifier}&code=${data.code}&context[device][product]=Server%20Manager%20Portal&forwardUrl=${encodeURIComponent(forwardUrl)}`;
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
                <a href="/" className="mt-6 inline-block text-plex hover:underline font-bold">Return to Home</a>
            </div>
        </div>
    );

    if (claimed) return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center max-w-md w-full animate-fade-in mx-auto px-4 mt-20">
            <div className="bg-green-500/10 border border-green-500/30 p-8 rounded-2xl w-full">
                <h2 className="text-3xl font-bold text-green-500 mb-4">Success!</h2>
                <p className="text-text mb-6">You have successfully claimed your invite to <strong className="text-plex">{info?.serverName}</strong>. Check your email or open Plex to accept the shared server invite!</p>
                <a href="/" className="inline-block px-6 py-3 bg-plex text-background font-bold rounded-lg hover:bg-plex-hover transition-colors shadow-lg">Go to Dashboard</a>
            </div>
        </div>
    );

    if (!info) return <Loader isLoading={true} />;

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-lg w-full animate-fade-in mx-auto px-4 mt-20">
            <div className="relative mb-8">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-plex rounded-full blur-[50px] opacity-20 pointer-events-none"></div>
                {info.customLogoUrl || info.thumb ? (
                    <img src={info.customLogoUrl || info.thumb} alt="Server Logo" className="w-32 h-32 object-cover rounded-full border-2 border-plex drop-shadow-[0_0_15px_rgba(229,160,13,0.25)] relative z-10" onError={(e) => { e.currentTarget.src = '/static/logo.png'; e.currentTarget.className = 'w-40 object-contain drop-shadow-[0_0_15px_rgba(229,160,13,0.25)] relative z-10'; }} />
                ) : (
                    <img src="/static/logo.png" alt="Server Logo" className="w-40 object-contain drop-shadow-[0_0_15px_rgba(229,160,13,0.25)] relative z-10" onError={(e) => e.currentTarget.style.display = 'none'} />
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

const MainApp: React.FC = () => {
    const [confirmState, setConfirmState] = useState<{ isOpen: boolean, message: string, onConfirm: () => void }>({ isOpen: false, message: '', onConfirm: () => { } });
    const [contentMaxWidth, setContentMaxWidth] = useState<string>('100%');

    useEffect(() => {
        appConfirm = (message, onConfirm) => {
            setConfirmState({ isOpen: true, message, onConfirm });
        };
    }, []);

    useEffect(() => {
        const updateResponsiveContentWidth = () => {
            const screenWidth = window.screen?.width || window.innerWidth;
            const screenHeight = window.screen?.height || window.innerHeight;
            const screenRatio = screenWidth / Math.max(1, screenHeight);
            const wideThreshold = (16 / 9) + 0.03;

            if (screenRatio > wideThreshold) {
                setContentMaxWidth(`${Math.round(screenHeight * (16 / 9))}px`);
            } else {
                setContentMaxWidth('100%');
            }
        };

        updateResponsiveContentWidth();
        window.addEventListener('resize', updateResponsiveContentWidth);
        return () => window.removeEventListener('resize', updateResponsiveContentWidth);
    }, []);

    const closeConfirm = () => setConfirmState(s => ({ ...s, isOpen: false }));
    const handleConfirm = () => {
        confirmState.onConfirm();
        closeConfirm();
    };

    const [currentRoute, setCurrentRoute] = useState<'login' | 'admin' | 'user' | 'users' | 'status' | 'dashboard' | 'settings' | 'logs' | 'analytics' | 'mediastack' | 'maintenance' | 'invite' | 'loading'>('loading');
    const [sessionInfo, setSessionInfo] = useState<any>(null);
    const [publicConfig, setPublicConfig] = useState<any>({});

    const fetchPublicConfig = useCallback(async () => {
        try {
            const data = await apiFetch('/api/config/public');
            window.__USE_24_HOUR_CLOCK__ = data.use24HourClock === true;
            setPublicConfig(data);
            if (data.primaryColor) {
                document.documentElement.style.setProperty('--color-plex', hexToRgb(data.primaryColor));
            }
            if (data.customLogoUrl) {
                updateFavicon(data.customLogoUrl);
            }
        } catch (e) { }
    }, []);

    useEffect(() => {
        fetchPublicConfig();
    }, [fetchPublicConfig]);

    const setRoute = useCallback((route: 'login' | 'admin' | 'user' | 'users' | 'status' | 'dashboard' | 'settings' | 'logs' | 'analytics' | 'mediastack' | 'maintenance' | 'invite' | 'loading') => {
        if (route === 'logs') {
            setCurrentRoute('settings');
            window.history.pushState({}, '', '/settings#logs');
            return;
        }
        setCurrentRoute(route);
        if (route !== 'loading' && route !== 'invite') {
            let path = '/';
            if (route === 'admin') path = '/admin';
            if (route === 'users') path = '/users';
            if (route === 'user') path = '/portal';
            if (route === 'status') path = '/status';
            if (route === 'dashboard') path = '/dashboard';
            if (route === 'settings') path = '/settings';
            if (route === 'analytics') path = '/analytics';
            if (route === 'mediastack') path = '/mediastack';
            if (route === 'maintenance') path = '/maintenance';
            window.history.pushState({}, '', path);
        }
    }, []);

    const checkSession = useCallback(async () => {
        const path = window.location.pathname;
        if (path.startsWith('/invite/')) {
            setCurrentRoute('invite');
            return;
        }

        try {
            const data = await apiFetch('/api/users/me');
            setSessionInfo(data);
            if (data.serverName) document.title = `${data.serverName} Portal`;
            if (path === '/status') setCurrentRoute('status');
            else if (path === '/dashboard') setCurrentRoute('dashboard');
            else if (path === '/settings' && data.session.isAdmin) setCurrentRoute('settings');
            else if (path === '/logs' && data.session.isAdmin) {
                window.history.replaceState({}, '', '/settings#logs');
                setCurrentRoute('settings');
            }
            else if (path === '/mediastack') setCurrentRoute('mediastack');
            else if (path === '/maintenance' && data.session.isAdmin) setCurrentRoute('maintenance');
            else if (path === '/analytics') setCurrentRoute('analytics');
            else if (path === '/settings' && !data.session.isAdmin) setCurrentRoute('user');
            else if (path === '/portal') setCurrentRoute('user');
            else if (path === '/admin') setCurrentRoute('users');
            else if (path === '/users') setCurrentRoute('users');
            else {
                // If at root or unknown, push to default route
                window.history.replaceState({}, '', '/portal');
                setCurrentRoute('user');
            }
        } catch {
            if (path === '/status') setCurrentRoute('status');
            else if (path === '/dashboard') setCurrentRoute('dashboard');
            else setCurrentRoute('login');
        }
    }, []);

    useEffect(() => {
        // Initial session check
        checkSession();
    }, [checkSession]);

    const handleLogout = async () => {
        await apiFetch('/api/auth/logout', { method: 'POST' });
        setSessionInfo(null);
        setRoute('login');
    };

    if (currentRoute === 'loading') return <Loader isLoading={true} />;
    if (currentRoute === 'login') return <Login onLoginSuccess={checkSession} publicConfig={publicConfig} />;

    const isAdmin = !!sessionInfo?.session?.isAdmin;

    const isPublicStatus = currentRoute === 'status' && !sessionInfo;
    const isPublicInvite = currentRoute === 'invite';
    const isPublicView = isPublicStatus || isPublicInvite;

    const renderView = () => {
        if (currentRoute === 'invite') {
            const code = window.location.pathname.split('/')[2];
            return <PublicInviteClaim code={code} />;
        }
        if (currentRoute === 'status') return <StatusDashboard onBack={() => isPublicStatus ? setRoute('login') : setRoute('user')} isAdmin={isAdmin} isPublic={isPublicStatus} />;
        if (currentRoute === 'dashboard') return <LibraryDashboard onBack={() => setRoute('user')} isAdmin={isAdmin} />;
        if (currentRoute === 'settings' && isAdmin) return <SettingsDashboard />;
        if (currentRoute === 'maintenance' && isAdmin) return <MaintenanceDashboard />;
        if (currentRoute === 'logs' && isAdmin) return <LogsDashboard onLogout={handleLogout} />;
        if (currentRoute === 'mediastack') return <MediaStackDashboard isAdmin={isAdmin} />;
        if (currentRoute === 'analytics') return <AnalyticsDashboard isAdmin={isAdmin} sessionInfo={sessionInfo} />;
        if (currentRoute === 'admin' || currentRoute === 'users') return <AdminDashboard onLogout={handleLogout} onViewUserPortal={() => setRoute('user')} onViewStatus={() => setRoute('status')} onViewDashboard={() => setRoute('dashboard')} />;
        return <UserDashboard sessionInfo={sessionInfo} publicConfig={publicConfig} onLogout={handleLogout} refreshSession={checkSession} onViewAdmin={() => setRoute('users')} onViewStatus={() => setRoute('status')} onViewDashboard={() => setRoute('dashboard')} />;
    };

    return (
        <div className="flex w-full min-h-screen bg-background overflow-x-clip">
            <ConfirmModal isOpen={confirmState.isOpen} message={confirmState.message} onConfirm={handleConfirm} onCancel={closeConfirm} />
            {!isPublicView && <Navigation currentRoute={currentRoute} onNavigate={setRoute as any} onLogout={handleLogout} isAdmin={isAdmin} serverName={sessionInfo?.serverName || 'Server Portal'} adminThumb={sessionInfo?.adminThumb} requestUrl={sessionInfo?.requestUrl || 'https://yourdomain.com'} navOrder={sessionInfo?.navOrder || ['home', 'discover', 'status', 'analytics', 'mediastack', 'maintenance', 'request', 'settings', 'logout']} appVersion={publicConfig.appVersion} />}
            <div className={`flex-1 min-w-0 flex flex-col items-center px-[2px] pt-20 pb-[80px] md:p-8 md:pt-8 md:pb-8 overflow-x-visible ${isPublicView ? '!pt-8 !pb-8' : ''}`}>
                <div className="w-full min-w-0" style={{ maxWidth: contentMaxWidth }}>
                    {renderView()}
                </div>

                {/* Mobile Bottom Version */}
                {!isPublicView && publicConfig?.appVersion && (
                    <div className="md:hidden mt-auto pt-12 pb-4 w-full text-center text-[10px] text-white/30 font-mono tracking-widest pointer-events-none">
                        {publicConfig.appVersion}
                    </div>
                )}
            </div>
        </div>
    );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<MainApp />);
