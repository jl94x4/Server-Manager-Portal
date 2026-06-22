
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Home, Film, Activity, Sparkles, LogOut, Settings, FileText, BarChart3, Users, PlaySquare, TrendingUp, X, Star, Layers, HardDrive, Calendar, Tv, Clock, DownloadCloud, MonitorSmartphone, Copy, ChevronUp, ChevronDown, List, Palette } from 'lucide-react';

interface CustomSelectProps {
    id?: string;
    value: string | number;
    onChange: (value: string) => void;
    options: { label: string; value: string | number }[];
    className?: string;
}

const CustomSelect: React.FC<CustomSelectProps> = ({ id, value, onChange, options, className }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => String(opt.value) === String(value)) || options[0];

    return (
        <div className={`relative ${className || ''}`} ref={selectRef} id={id}>
            <div className={`flex justify-between items-center w-full cursor-pointer h-full px-4 py-3 rounded-lg border bg-background text-text transition-all ${isOpen ? 'border-plex ring-1 ring-plex' : 'border-border hover:border-plex/50'}`} onClick={() => setIsOpen(!isOpen)}>
                <span className="truncate mr-4 font-medium text-sm">{selectedOption?.label || 'Select...'}</span>
                <span className={`text-[10px] transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
            </div>
            {isOpen && (
                <div className="absolute top-[calc(100%+8px)] right-0 w-max min-w-full bg-[#1e2329] border border-border rounded-lg shadow-2xl z-50 overflow-hidden py-1">
                    {options.map(opt => (
                        <div
                            key={String(opt.value)}
                            className={`px-4 py-2.5 cursor-pointer hover:bg-white/10 transition-colors whitespace-nowrap text-sm ${String(value) === String(opt.value) ? 'bg-plex/10 text-plex font-bold' : 'text-text'}`}
                            onClick={() => {
                                onChange(String(opt.value));
                                setIsOpen(false);
                            }}
                        >
                            {opt.label}
                        </div>
                    ))}
                </div>
            )}
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
            className={`px-8 py-4 rounded-xl text-white font-medium shadow-2xl transition-all duration-300 transform ${
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'
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
                {user.lastLogin && (
                    <div className="flex justify-between items-center text-sm pb-2 border-b border-white/5 last:border-0 last:pb-0">
                        <span className="text-muted text-xs uppercase tracking-wider font-bold">Last Login</span>
                        <span className="text-text font-medium">{formatDate(user.lastLogin)}</span>
                    </div>
                )}
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
    const [maxUses, setMaxUses] = useState<string | number>('unlimited');

    const fetchInvites = useCallback(async () => {
        try {
            const data = await apiFetch('/api/invites');
            setInvites(data);
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
                body: JSON.stringify({ durationDays, maxUses })
            });
            addToast('Invite link created', 'success');
            fetchInvites();
        } catch (e: any) {
            addToast(e.message || 'Error creating invite', 'error');
        }
    };

    const handleDelete = async (code: string) => {
        if (!confirm('Are you sure you want to delete this invite link?')) return;
        try {
            await apiFetch(`/api/invites/${code}`, { method: 'DELETE' });
            addToast('Invite link deleted', 'success');
            fetchInvites();
        } catch (e: any) {
            addToast(e.message || 'Error deleting invite', 'error');
        }
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
                <div className="flex flex-col md:flex-row gap-4 items-end">
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
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                        <tr className="border-b border-border text-muted text-sm uppercase tracking-wider">
                            <th className="p-3">Invite Link</th>
                            <th className="p-3">Duration</th>
                            <th className="p-3">Uses</th>
                            <th className="p-3">Created</th>
                            <th className="p-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invites.length === 0 ? (
                            <tr><td colSpan={5} className="p-8 text-center text-muted">No active invites. Create one above!</td></tr>
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
                                <td className="p-3 font-medium">{inv.durationDays} Days</td>
                                <td className="p-3">{inv.currentUses} / {inv.maxUses}</td>
                                <td className="p-3 text-muted text-sm">{new Date(inv.createdAt).toLocaleDateString()}</td>
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

const SettingsDashboard: React.FC = () => {
    const [isLoading, setLoading] = useState(true);
    const [initialSettings, setInitialSettings] = useState<any>({});
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    // Admin features moved here
    const [statusConfig, setStatusConfig] = useState<any>({});
    const [users, setUsers] = useState<User[]>([]);
    const [isStatusModalOpen, setStatusModalOpen] = useState(false);
    const [isBroadcastModalOpen, setBroadcastModalOpen] = useState(false);

    const addToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        setToasts(t => [...t, { id: Date.now(), message, type }]);
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
                try {
                    const sConf = await apiFetch('/api/status/config');
                    setStatusConfig(sConf);
                } catch (e) { }
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
    const [activeTab, setActiveTab] = useState(() => {
        const hash = window.location.hash.replace('#', '');
        return ['plex', 'smtp', 'newsletter', 'cleanup', 'mediastack', 'branding', 'navigation', 'status', 'invites', 'tasks'].includes(hash) ? hash : 'plex';
    });

    useEffect(() => {
        window.location.hash = activeTab;
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
    const [publicDomain, setPublicDomain] = useState('https://plexified.co.uk');
    const [requestUrl, setRequestUrl] = useState('https://plexified.co.uk');
    const [contactUrl, setContactUrl] = useState('');

    // Cleanup States
    const [inactiveCleanupEnabled, setInactiveCleanupEnabled] = useState(false);
    const [inactiveCleanupDays, setInactiveCleanupDays] = useState(90);

    // Media Stack States
    const [sonarrUrl, setSonarrUrl] = useState('');
    const [sonarrApiKey, setSonarrApiKey] = useState('');
    const [radarrUrl, setRadarrUrl] = useState('');
    const [radarrApiKey, setRadarrApiKey] = useState('');

    // Branding & UI States
    const [primaryColor, setPrimaryColor] = useState('#E5A00D');
    const [customLogoUrl, setCustomLogoUrl] = useState('');
    const [referralEnabled, setReferralEnabled] = useState(false);
    const [referralTrialDays, setReferralTrialDays] = useState(3);
    const [referralRewardDays, setReferralRewardDays] = useState(7);
    const [announcement, setAnnouncement] = useState('');
    const [navOrder, setNavOrder] = useState<string[]>(['home', 'discover', 'status', 'logs', 'analytics', 'mediastack', 'request', 'settings', 'logout']);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [tasks, setTasks] = useState<any[]>([]);

    const fetchTasks = async () => {
        try {
            const data = await apiFetch('/api/tasks');
            setTasks(data);
        } catch (e) {
            addToast('Failed to load tasks', 'error');
        }
    };

    useEffect(() => {
        if (activeTab === 'tasks') {
            fetchTasks();
        }
    }, [activeTab]);

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
            setPublicDomain(initialSettings.publicDomain || 'https://portal.plexified.co.uk');
            setRequestUrl(initialSettings.requestUrl || 'https://plexified.co.uk');
            setContactUrl(initialSettings.contactUrl || '');
            setSonarrUrl(initialSettings.sonarrUrl || '');
            setSonarrApiKey(initialSettings.sonarrApiKey || '');
            setRadarrUrl(initialSettings.radarrUrl || '');
            setRadarrApiKey(initialSettings.radarrApiKey || '');
            setPrimaryColor(initialSettings.primaryColor || '#E5A00D');
            setCustomLogoUrl(initialSettings.customLogoUrl || '');
            setReferralEnabled(!!initialSettings.referralEnabled);
            setReferralTrialDays(initialSettings.referralTrialDays || 3);
            setReferralRewardDays(initialSettings.referralRewardDays || 7);
            setAnnouncement(initialSettings.announcement || '');
            if (initialSettings.navOrder) setNavOrder(initialSettings.navOrder);
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
            sonarrUrl,
            sonarrApiKey,
            radarrUrl,
            radarrApiKey,
            primaryColor,
            customLogoUrl,
            referralEnabled,
            referralTrialDays,
            referralRewardDays,
            announcement,
            navOrder
        });
        document.documentElement.style.setProperty('--color-plex', primaryColor);
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
        if (!confirm('Are you sure you want to send the newsletter to ALL configured users immediately? This cannot be undone.')) return;
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
    };

    return (
        <div className="w-full max-w-[1600px] mx-auto flex flex-col">
            <Loader isLoading={isLoading} />
            <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[2000] flex flex-col-reverse gap-2 items-center">
                {toasts.map(toast => <Toast key={toast.id} {...toast} onDismiss={() => setToasts(t => t.filter(item => item.id !== toast.id))} />)}
            </div>

            <header className="hidden md:flex items-center justify-between w-full mb-6 mt-2 md:mt-0">
                <h1 className="text-xl md:text-3xl font-bold text-plex">Settings</h1>
                <div className="flex gap-4">
                    <button className="px-4 py-2 bg-border text-text rounded-md font-medium hover:bg-opacity-80 transition-colors flex items-center justify-center gap-2 text-sm" onClick={() => setStatusModalOpen(true)}>Manage Status</button>
                    <button className="px-4 py-2 bg-plex text-background rounded-md font-bold hover:bg-plex-hover transition-colors flex items-center justify-center gap-2 text-sm" onClick={() => setBroadcastModalOpen(true)}>Broadcast Email</button>
                </div>
            </header>

            <div className="bg-card p-4 md:p-8 rounded-2xl w-full flex flex-col shadow-2xl border border-border">
                {/* Mobile-only action buttons */}
                <div className="flex md:hidden gap-3 mb-6">
                    <button className="flex-1 px-4 py-2.5 bg-border text-text rounded-lg font-medium text-sm flex items-center justify-center gap-2" onClick={() => setStatusModalOpen(true)}>Manage Status</button>
                    <button className="flex-1 px-4 py-2.5 bg-plex text-background rounded-lg font-bold text-sm flex items-center justify-center gap-2" onClick={() => setBroadcastModalOpen(true)}>Broadcast Email</button>
                </div>
                {/* Mobile Dropdown Category Select */}
                <div className="block md:hidden mb-6">
                    <label htmlFor="settings-tab-select" className="text-muted text-xs uppercase tracking-wider font-bold mb-2 block">Settings Category</label>
                    <CustomSelect
                        id="settings-tab-select"
                        value={activeTab}
                        onChange={val => setActiveTab(val)}
                        options={[
                            { label: 'Plex Integration', value: 'plex' },
                            { label: 'SMTP Alerts', value: 'smtp' },
                            { label: 'Newsletter', value: 'newsletter' },
                            { label: 'Automated Cleanup', value: 'cleanup' },
                            { label: 'Media Stack', value: 'mediastack' },
                            { label: 'Portal UI', value: 'branding' },
                            { label: 'Navigation', value: 'navigation' },
                            { label: 'Status Monitor', value: 'status' },
                            { label: 'Invites', value: 'invites' },
                            { label: 'Tasks', value: 'tasks' }
                        ]}
                    />
                </div>

                {/* Desktop Category Tabs */}
                <div className="hidden md:flex flex-wrap gap-2 mt-4 mb-8 p-1.5 bg-black/20 rounded-xl border border-border w-fit">
                    {[
                        { id: 'plex', label: 'Plex Integration' },
                        { id: 'smtp', label: 'SMTP Alerts' },
                        { id: 'newsletter', label: 'Newsletter' },
                        { id: 'cleanup', label: 'Cleanup' },
                        { id: 'mediastack', label: 'Media Stack' },
                        { id: 'branding', label: 'Portal UI' },
                        { id: 'navigation', label: 'Navigation' },
                        { id: 'status', label: 'Status Monitor' },
                        { id: 'invites', label: 'Invites' },
                        { id: 'tasks', label: 'Background Tasks' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-5 py-2.5 rounded-lg font-bold text-sm transition-all duration-200 cursor-pointer border-none outline-none ${
                                activeTab === tab.id
                                    ? 'bg-plex text-background shadow-md'
                                    : 'bg-transparent text-muted hover:text-text hover:bg-white/5'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                <div className="overflow-y-auto pr-2 flex-grow mb-4 custom-scrollbar">
                    {activeTab === 'plex' && (
                        <div className="mb-8">
                            <h3 className="text-xl font-bold text-plex mb-4 border-b border-border pb-2">Plex Integration</h3>
                            <div className="mb-4">
                                <label htmlFor="plexToken">Plex Token</label>
                                <input className="w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all" id="plexToken" type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="Enter your X-Plex-Token" />
                                <small>Needed to fetch users and manage access. <a href="https://support.plex.tv/articles/204059436-finding-an-authentication-token-x-plex-token/" target="_blank" rel="noopener noreferrer">How to find your token.</a></small>
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
                                        <small>
                                            Currently saved server ID: <strong>{initialSettings.serverIdentifier}</strong>
                                        </small>
                                    )}
                                </div>
                            )}
                            <div className="mb-4" style={{ marginTop: '1rem' }}>
                                <label htmlFor="checkInterval">Check Interval (minutes)</label>
                                <input className="w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all" id="checkInterval" type="number" value={checkInterval} onChange={e => setCheckInterval(Number(e.target.value))} min="1" />
                                <small>How often to check for expired users in the background.</small>
                            </div>
                            <div className="mb-4" style={{ marginTop: '1rem' }}>
                                <label htmlFor="requestUrl">Request URL</label>
                                <input className="w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all" id="requestUrl" type="text" value={requestUrl} onChange={e => setRequestUrl(e.target.value)} placeholder="https://plexified.co.uk" />
                                <small>The URL users are redirected to when they click the Request Content button.</small>
                            </div>
                            <div className="mb-4" style={{ marginTop: '1rem' }}>
                                <label htmlFor="contactUrl">Contact URL / Email</label>
                                <input className="w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all" id="contactUrl" type="text" value={contactUrl} onChange={e => setContactUrl(e.target.value)} placeholder="mailto:youremail@example.com OR https://wa.me/123456" />
                                <small>Used for the "Request Extension" button in expiry emails. Defaults to sending an email to the SMTP User.</small>
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
                                    <input className="w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all" id="smtpFrom" type="text" value={smtpFrom} onChange={e => setSmtpFrom(e.target.value)} placeholder="Plex Manager <noreply@yourdomain.com>" />
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
                                <small>Automated notification email will be sent when user has this many days left.</small>
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
                                <small>How often should users receive the newsletter.</small>
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
                                        <input className="w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all" id="publicDomain" type="text" value={publicDomain} onChange={e => setPublicDomain(e.target.value)} placeholder="https://portal.plexified.co.uk" />
                                        <small>Your public URL. This is required to host the posters inside the email.</small>
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
                                    <small>Revoke access if a user has not watched anything in this many days.</small>
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
                                <small>The URL to your Sonarr instance.</small>
                            </div>
                            <div className="mb-4">
                                <label htmlFor="sonarrApiKey">Sonarr API Key</label>
                                <input className="w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all" id="sonarrApiKey" type="password" value={sonarrApiKey} onChange={(e) => setSonarrApiKey(e.target.value)} placeholder="API Key from Sonarr Settings -> General" />
                            </div>

                            <h3 className="text-xl font-bold text-plex mb-4 border-b border-border pb-2 mt-8">Radarr Integration</h3>
                            <div className="mb-4">
                                <label htmlFor="radarrUrl">Radarr URL</label>
                                <input className="w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all" id="radarrUrl" type="text" value={radarrUrl} onChange={(e) => setRadarrUrl(e.target.value)} placeholder="http://localhost:7878" />
                                <small>The URL to your Radarr instance.</small>
                            </div>
                            <div className="mb-4">
                                <label htmlFor="radarrApiKey">Radarr API Key</label>
                                <input className="w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all" id="radarrApiKey" type="password" value={radarrApiKey} onChange={(e) => setRadarrApiKey(e.target.value)} placeholder="API Key from Radarr Settings -> General" />
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
                                        'home': 'Home', 'discover': 'Discover', 'status': 'Status', 'logs': 'Logs (Admin Only)', 'analytics': 'Analytics', 'mediastack': 'Media Stack', 'request': 'Request Content', 'settings': 'Settings (Admin Only)', 'logout': 'Logout'
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

                    {activeTab === 'status' && (
                        <div className="mb-8 animate-fade-in">
                            <h3 className="text-xl font-bold text-plex mb-4 border-b border-border pb-2">Status Monitor</h3>
                            <StatusMonitorSettings 
                                config={statusConfig} 
                                onSave={async (newConfig) => {
                                    try {
                                        await apiFetch('/api/status/config', { method: 'POST', body: JSON.stringify(newConfig) });
                                        setStatusConfig(newConfig);
                                        addToast('Status Config Saved!');
                                    } catch (e: any) {
                                        addToast('Failed to save status config', 'error');
                                    }
                                }} 
                            />
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
                                <small>Provide a URL or upload a file. (Max 5MB)</small>
                            </div>

                            <h3 className="text-xl font-bold text-plex mb-4 border-b border-border pb-2 mt-8">Announcements</h3>
                            <div className="mb-4">
                                <label>Portal Announcement Banner</label>
                                <textarea className="w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex transition-all" value={announcement} onChange={e => setAnnouncement(e.target.value)} placeholder="E.g. Server maintenance scheduled for Friday..." rows={3}></textarea>
                                <small>If provided, this announcement will be prominently displayed to all users.</small>
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
                                        <label>Referred User Trial Days</label>
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
                </div>
                <div className="flex justify-end gap-4 mt-8" style={{ marginTop: '2rem' }}>
                    <button className="px-6 py-3 bg-plex text-background rounded-md font-bold hover:bg-plex-hover transition-colors flex items-center justify-center gap-2" onClick={handleSave}>Save Settings</button>
                </div>
            </div>


            <BroadcastModal
                isOpen={isBroadcastModalOpen}
                onClose={() => setBroadcastModalOpen(false)}
                selectedUserIds={[]}
                users={users}
            />
        </div>
    );
};

const StatusMonitorSettings: React.FC<{ config: any; onSave: (cfg: any) => void }> = ({ config, onSave }) => {
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
        const id = prompt('Group ID (e.g. core-services):');
        if (!id) return;
        const name = prompt('Group Name:');
        if (!name) return;
        setLocalConfig({ ...localConfig, groups: [...localConfig.groups, { id, name, order: localConfig.groups.length }] });
    };

    const addService = () => {
        const name = prompt('Service Name:');
        if (!name) return;
        const url = prompt('Service URL:');
        if (!url) return;
        const groupId = prompt('Group ID (optional, leave blank for no group):');
        
        const newService = {
            id: name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            name,
            url,
            category: 'web',
            type: 'http',
            groupId: groupId || null,
            isCritical: true,
            description: ''
        };
        setLocalConfig({ ...localConfig, services: [...localConfig.services, newService] });
    };

    const removeGroup = (id: string) => {
        if (confirm(`Remove group ${id}? Services inside it won't be deleted but will lose their group.`)) {
            setLocalConfig({
                ...localConfig,
                groups: localConfig.groups.filter((g: any) => g.id !== id),
                services: localConfig.services.map((s: any) => s.groupId === id ? { ...s, groupId: null } : s)
            });
        }
    };

    const removeService = (id: string) => {
        if (confirm(`Remove service ${id}?`)) {
            setLocalConfig({ ...localConfig, services: localConfig.services.filter((s: any) => s.id !== id) });
        }
    };

    return (
        <div className="flex flex-col gap-6 w-full max-w-4xl">
            <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
                <div className="flex justify-between items-center mb-6 border-b border-border pb-4">
                    <h4 className="font-bold text-xl text-text">Service Groups</h4>
                    <button onClick={addGroup} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-text rounded-md text-sm font-bold transition-colors">Add Group</button>
                </div>
                {localConfig.groups.map((group: any) => (
                    <div key={group.id} className="flex justify-between items-center p-3 mb-2 bg-black/20 rounded-lg border border-border hover:border-plex/50 transition-colors">
                        <div>
                            <span className="font-bold text-text">{group.name}</span> <span className="text-xs text-muted ml-2 font-mono bg-black/40 px-2 py-0.5 rounded">{group.id}</span>
                        </div>
                        <button onClick={() => removeGroup(group.id)} className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors">Remove</button>
                    </div>
                ))}
                {localConfig.groups.length === 0 && <p className="text-muted text-sm italic p-4 text-center border border-dashed border-border rounded-lg">No groups defined. Create one to organize your services.</p>}
            </div>

            <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
                <div className="flex justify-between items-center mb-6 border-b border-border pb-4">
                    <h4 className="font-bold text-xl text-text">Monitored Services</h4>
                    <button onClick={addService} className="px-4 py-2 bg-plex text-background hover:bg-plex-hover rounded-md text-sm font-bold transition-colors shadow-lg">Add Service</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {localConfig.services.map((service: any) => (
                        <div key={service.id} className="flex flex-col p-4 bg-black/20 rounded-xl border border-border hover:border-plex/50 transition-colors gap-2">
                            <div className="flex justify-between items-start">
                                <span className="font-bold text-lg text-text flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-plex" /> {service.name}
                                </span>
                                <button onClick={() => removeService(service.id)} className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors bg-red-400/10 px-2 py-1 rounded">Remove</button>
                            </div>
                            <span className="text-sm text-muted break-all font-mono bg-black/40 p-2 rounded border border-border/50">{service.url}</span>
                            <div className="flex items-center gap-3 mt-2 text-xs">
                                <span className={`px-2 py-1 rounded font-medium ${service.groupId ? 'bg-plex/20 text-plex' : 'bg-white/10 text-muted'}`}>Group: {service.groupId || 'None'}</span>
                                <span className={`px-2 py-1 rounded font-medium ${service.isCritical ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-muted'}`}>Critical: {service.isCritical ? 'Yes' : 'No'}</span>
                            </div>
                        </div>
                    ))}
                </div>
                {localConfig.services.length === 0 && <p className="text-muted text-sm italic p-4 text-center border border-dashed border-border rounded-lg">No services defined. Add some services to monitor.</p>}
            </div>

            <div className="flex justify-end pt-4 border-t border-border mt-2">
                <button onClick={() => onSave(localConfig)} className="px-6 py-3 bg-plex text-background rounded-lg font-bold hover:bg-plex-hover transition-colors shadow-xl flex items-center gap-2">
                    <Activity className="w-5 h-5" /> Save Status Monitor Configuration
                </button>
            </div>
        </div>
    );
};

const BroadcastModal: React.FC<{ isOpen: boolean; onClose: () => void; selectedUserIds: string[]; users: User[]; }> = ({ isOpen, onClose, selectedUserIds, users }) => {
    const [subject, setSubject] = useState('Big updates to the Plex Server! 🚀');
    const [body, setBody] = useState(`🎬 <b>Hey everyone! Big updates to the Plex Server!</b> 🚀<br><br>If you have any friends or family who want to check out the server, I’m currently offering a <b>3-Day Free Trial</b> with instant access to the entire library! 🍿<br>✅ No bank details needed<br>✅ No purchase required<br>✅ Instant, automated setup<br><br>We also just launched a brand new <b>User Portal</b> (https://plexified.co.uk) packed with awesome features for everyone:<br>🕒 <b>Account Status:</b> Easily check exactly how many days you have left until your account expires.<br>🟢 <b>Server Health:</b> View live 24/7 uptime stats for all server services.<br>📊 <b>Live Library Stats:</b> See exact, live counts of our massive library.<br><br>Feel free to share the link (https://plexified.co.uk) with anyone who might be interested! 👇`);
    const [recipientFilter, setRecipientFilter] = useState<'all' | 'active' | 'trial' | 'expiring' | 'expired' | 'selected' | 'custom'>('all');
    const [customSelectedUserIds, setCustomSelectedUserIds] = useState<string[]>([]);
    const [isSending, setIsSending] = useState(false);
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const [isSendingTest, setIsSendingTest] = useState(false);

    if (!isOpen) return null;

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
            onClose();
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-[1000]">
            <div className="modal-content" style={{ maxWidth: '800px', width: '90%' }}>
                <h2 className="text-2xl font-bold text-text">Broadcast Email</h2>

                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Recipients</label>
                    <CustomSelect
                        value={recipientFilter}
                        onChange={val => setRecipientFilter(val as any)}
                        options={[
                            { label: 'All Users', value: 'all' },
                            { label: 'Active Users Only', value: 'active' },
                            { label: 'Trial Users Only', value: 'trial' },
                            { label: 'Expiring Soon (Next 7 Days)', value: 'expiring' },
                            { label: 'Expired Users', value: 'expired' },
                            ...(selectedUserIds.length > 0 ? [{ label: `Selected Users (${selectedUserIds.length})`, value: 'selected' }] : []),
                            { label: 'Custom User Selection...', value: 'custom' }
                        ]}
                        className="broadcast-select"
                    />
                </div>

                {recipientFilter === 'custom' && (
                    <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: 'var(--background-dark)', border: '1px solid var(--border-color)', borderRadius: '4px', maxHeight: '200px', overflowY: 'auto' }}>
                        <div style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>Select Users ({customSelectedUserIds.length} selected):</div>
                        {users.map(u => (
                            <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.25rem 0' }}>
                                <input className="w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all"
                                    type="checkbox"
                                    checked={customSelectedUserIds.includes(u.id)}
                                    onChange={(e) => {
                                        if (e.target.checked) setCustomSelectedUserIds(prev => [...prev, u.id]);
                                        else setCustomSelectedUserIds(prev => prev.filter(id => id !== u.id));
                                    }}
                                    style={{ accentColor: 'var(--plex-gold)' }}
                                />
                                {u.username} ({u.email || 'No email'})
                            </label>
                        ))}
                    </div>
                )}

                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Subject</label>
                    <input className="w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all"
                        type="text"
                        value={subject}
                        onChange={e => setSubject(e.target.value)}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', backgroundColor: '#333', color: '#fff', border: '1px solid #444' }}
                    />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <label style={{ fontWeight: 'bold', margin: 0 }}>Email Body (HTML supported)</label>
                        <button className="px-4 py-2 bg-border text-text rounded-md font-medium hover:bg-opacity-80 transition-colors flex items-center justify-center gap-2" onClick={() => setIsPreviewMode(!isPreviewMode)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}>
                            {isPreviewMode ? 'Edit HTML' : 'Preview Output'}
                        </button>
                    </div>
                    {isPreviewMode ? (
                        <div
                            style={{ width: '100%', height: '300px', padding: '1rem', borderRadius: '4px', backgroundColor: '#fff', color: '#000', border: '1px solid #444', overflowY: 'auto' }}
                            dangerouslySetInnerHTML={{ __html: body }}
                        />
                    ) : (
                        <textarea
                            value={body}
                            onChange={e => setBody(e.target.value)}
                            style={{ width: '100%', height: '300px', padding: '0.75rem', borderRadius: '4px', backgroundColor: '#333', color: '#fff', border: '1px solid #444', fontFamily: 'monospace' }}
                        />
                    )}
                </div>

                <div className="flex justify-end gap-4 mt-8" style={{ marginTop: '1.5rem', justifyContent: 'flex-end', gap: '1rem' }}>
                    <button className="px-4 py-2 bg-border text-text rounded-md font-medium hover:bg-opacity-80 transition-colors flex items-center justify-center gap-2" onClick={onClose} disabled={isSending || isSendingTest}>Cancel</button>
                    <button className="px-4 py-2 bg-border text-text rounded-md font-medium hover:bg-opacity-80 transition-colors flex items-center justify-center gap-2" onClick={handleTestSend} disabled={isSending || isSendingTest}>
                        {isSendingTest ? 'Sending Test...' : 'Send Test To Admin'}
                    </button>
                    <button className="px-4 py-2 bg-plex text-background rounded-md font-medium hover:bg-plex-hover transition-colors flex items-center justify-center gap-2" onClick={handleSend} disabled={isSending || isSendingTest} style={{ backgroundColor: 'var(--plex-gold)', color: '#000' }}>
                        {isSending ? 'Sending...' : 'Send Broadcast'}
                    </button>
                </div>
            </div>
        </div>
    );
};
const UserAnalyticsModal: React.FC<{ userId: string, username: string, thumb: string | null, days: string, onClose: () => void }> = ({ userId, username, thumb, days, onClose }) => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiFetch(`/api/plex/analytics/user/${userId}?days=${days}`)
            .then(res => setData(res))
            .catch(() => { })
            .finally(() => setLoading(false));
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
                    ) : (
                        <>
                            {/* Top row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-lg font-bold text-text mb-4 uppercase tracking-wider flex items-center gap-2"><PlaySquare className="text-plex w-4 h-4" /> Favorite Libraries</h3>
                                    <div className="flex flex-col gap-3">
                                        {data.topLibraries.length === 0 ? <p className="text-muted text-sm">No library data.</p> : data.topLibraries.map((lib: any, i: number) => (
                                            <div key={lib.id} className="flex justify-between items-center bg-black/20 p-2 rounded border border-white/5">
                                                <span className="font-bold text-sm text-text"><span className="text-muted mr-2">#{i + 1}</span>{lib.title}</span>
                                                <span className="text-plex text-xs font-mono">{lib.plays} plays</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-text mb-4 uppercase tracking-wider flex items-center gap-2"><TrendingUp className="text-plex w-4 h-4" /> Top Watched</h3>
                                    <div className="flex flex-col gap-3">
                                        {data.topContent.length === 0 ? <p className="text-muted text-sm">No content data.</p> : data.topContent.map((c: any, i: number) => (
                                            <a key={c.key} href={c.plexUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-black/20 p-2 rounded border border-white/5 hover:bg-white/10 transition-colors">
                                                <div className="w-8 h-12 bg-black/40 rounded overflow-hidden flex-shrink-0">
                                                    {c.thumbUrl ? <img src={c.thumbUrl} className="w-full h-full object-cover" /> : <Film className="w-full h-full p-2 opacity-50" />}
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
                            </div>

                            {/* Recent History */}
                            <div>
                                <h3 className="text-lg font-bold text-text mb-4 uppercase tracking-wider flex items-center gap-2"><Activity className="text-plex w-4 h-4" /> Recent Watch History</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {data.recentHistory.length === 0 ? <p className="text-muted text-sm col-span-full">No recent history.</p> : data.recentHistory.map((h: any, i: number) => (
                                        <a key={i} href={h.plexUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-white/5 border border-white/5 p-2 rounded-lg hover:bg-white/10 transition-colors">
                                            <div className="w-10 h-14 bg-black/40 rounded overflow-hidden flex-shrink-0">
                                                {h.thumbUrl ? <img src={h.thumbUrl} className="w-full h-full object-cover" /> : <Film className="w-full h-full p-2 opacity-50" />}
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

// --- Analytics Dashboard Component ---
const PersonalAnalyticsDashboard: React.FC<{ username: string, thumb: string | null }> = ({ username, thumb }) => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [days, setDays] = useState<string>('30');

    useEffect(() => {
        setLoading(true);
        apiFetch(`/api/plex/analytics/me?days=${days}`)
            .then(res => setData(res))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [days]);

    return (
        <div className="w-full max-w-[1600px] animate-fade-in flex flex-col gap-6">
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
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-lg font-bold text-text mb-4 uppercase tracking-wider flex items-center gap-2"><PlaySquare className="text-plex w-4 h-4" /> Favorite Libraries</h3>
                                    <div className="flex flex-col gap-3">
                                        {data.topLibraries.length === 0 ? <p className="text-muted text-sm">No library data.</p> : data.topLibraries.map((lib: any, i: number) => (
                                            <div key={lib.id} className="flex justify-between items-center bg-black/20 p-2 rounded border border-white/5">
                                                <span className="font-bold text-sm text-text"><span className="text-muted mr-2">#{i + 1}</span>{lib.title}</span>
                                                <span className="text-plex text-xs font-mono">{lib.plays} plays</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-text mb-4 uppercase tracking-wider flex items-center gap-2"><TrendingUp className="text-plex w-4 h-4" /> Top Watched</h3>
                                    <div className="flex flex-col gap-3">
                                        {data.topContent.length === 0 ? <p className="text-muted text-sm">No content data.</p> : data.topContent.map((c: any, i: number) => (
                                            <a key={c.key} href={c.plexUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-black/20 p-2 rounded border border-white/5 hover:bg-white/10 transition-colors">
                                                <div className="w-8 h-12 bg-black/40 rounded overflow-hidden flex-shrink-0">
                                                    {c.thumbUrl ? <img src={c.thumbUrl} className="w-full h-full object-cover" /> : <Film className="w-full h-full p-2 opacity-50" />}
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
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-text mb-4 uppercase tracking-wider flex items-center gap-2"><Activity className="text-plex w-4 h-4" /> Recent Watch History</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {data.recentHistory.length === 0 ? <p className="text-muted text-sm col-span-full">No recent history.</p> : data.recentHistory.map((h: any, i: number) => (
                                        <a key={i} href={h.plexUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-white/5 border border-white/5 p-2 rounded-lg hover:bg-white/10 transition-colors">
                                            <div className="w-10 h-14 bg-black/40 rounded overflow-hidden flex-shrink-0">
                                                {h.thumbUrl ? <img src={h.thumbUrl} className="w-full h-full object-cover" /> : <Film className="w-full h-full p-2 opacity-50" />}
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
    const [calendarDays, setCalendarDays] = useState<'7' | '14' | '30'>('7');

    const fetchData = useCallback(async () => {
        try {
            const res = await apiFetch('/api/media-stack/summary');
            if (res.error) throw new Error(res.error);
            setData(res);
        } catch (err: any) {
            setError(err.message || 'Failed to load Media Stack data.');
        } finally {
            setIsLoading(false);
        }
    }, []);

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
        const timeStr = isMidnight ? '' : ` at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        
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
                items.push({
                    id: `sonarr-${ep.id || ep.airDateUtc || ep.airDate}-${ep.title}`,
                    type: 'tv',
                    service: 'Sonarr',
                    title: ep.series?.title || 'Unknown Series',
                    subtitle: `S${String(ep.seasonNumber).padStart(2, '0')}E${String(ep.episodeNumber).padStart(2, '0')} - ${ep.title}`,
                    date: new Date(ep.airDateUtc || ep.airDate),
                    hasFile: ep.hasFile,
                    monitored: ep.monitored
                });
            });
        }
        
        if (data.radarr?.calendar) {
            data.radarr.calendar.forEach((movie: any) => {
                const releaseDateStr = movie.digitalRelease || movie.physicalRelease || movie.inCinemas || movie.added;
                if (releaseDateStr) {
                    items.push({
                        id: `radarr-${movie.id || releaseDateStr}-${movie.title}`,
                        type: 'movie',
                        service: 'Radarr',
                        title: movie.title,
                        subtitle: movie.studio || 'Movie Release',
                        date: new Date(releaseDateStr),
                        hasFile: movie.hasFile,
                        monitored: movie.monitored
                    });
                }
            });
        }
        
        return items.sort((a, b) => a.date.getTime() - b.date.getTime());
    }, [data]);

    const filteredCalendar = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const cutoff = new Date(today);
        cutoff.setDate(cutoff.getDate() + Number(calendarDays));
        
        return calendarItems.filter(item => {
            const itemDate = item.date;
            return itemDate >= today && itemDate <= cutoff;
        });
    }, [calendarItems, calendarDays]);

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
                            <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></span>
                            <span className="text-[10px] font-bold text-green-500 tracking-wider uppercase">Online</span>
                            {status?.version && <span className="text-[10px] text-muted font-bold">v{status.version}</span>}
                        </div>
                    </div>
                </div>

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
        <div className="w-full max-w-[1600px] animate-fade-in flex flex-col gap-6">
            <div className="flex items-center justify-between gap-4 mb-2">
                <div>
                    <h1 className="text-3xl font-bold text-text uppercase tracking-widest flex items-center gap-3">
                        <Layers className="w-8 h-8 text-plex" />
                        Media Stack
                    </h1>
                    <p className="text-muted text-sm mt-1">Unified monitoring dashboard for TV & movies</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                <div className="lg:col-span-2 flex flex-col gap-8">
                    
                    <div className="bg-card border border-white/5 shadow-2xl rounded-2xl p-4 md:p-6 relative">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 border-b border-border/30 pb-4">
                            <h2 className="text-xl font-bold text-text flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-plex" />
                                Upcoming Releases
                            </h2>
                            
                            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 w-fit self-end">
                                {['7', '14', '30'].map((d) => (
                                    <button
                                        key={d}
                                        onClick={() => setCalendarDays(d as any)}
                                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                            calendarDays === d
                                                ? 'bg-plex text-background shadow-lg'
                                                : 'text-muted hover:text-text'
                                        }`}
                                    >
                                        {d} Days
                                    </button>
                                ))}
                            </div>
                        </div>

                        {filteredCalendar.length === 0 ? (
                            <div className="text-center py-12 bg-background/30 rounded-xl border border-white/5 text-muted text-sm">
                                <Calendar className="w-12 h-12 text-muted/30 mx-auto mb-3" />
                                No upcoming releases in the next {calendarDays} days
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {filteredCalendar.map((item) => (
                                    <div 
                                        key={item.id} 
                                        className={`bg-background/40 hover:bg-background/60 border border-white/5 hover:border-white/10 transition-all duration-300 rounded-xl p-3.5 flex flex-col gap-2 shadow-lg border-l-4 ${
                                            item.type === 'tv' ? 'border-l-blue-500/80' : 'border-l-red-500/80'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start gap-3">
                                            <div className="min-w-0 flex-grow">
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <span className={`text-[8px] uppercase font-black tracking-wider px-1.5 py-0.5 rounded ${
                                                        item.service === 'Sonarr' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                                    }`}>
                                                        {item.service}
                                                    </span>
                                                    <span className="text-[10px] text-muted flex items-center gap-1 font-medium">
                                                        <Clock className="w-3.5 h-3.5 text-muted/60" />
                                                        {formatRelativeAirDate(item.date)}
                                                    </span>
                                                </div>
                                                <h4 className="font-bold text-sm text-text line-clamp-1 leading-tight group-hover:text-plex transition-colors">
                                                    {item.title}
                                                </h4>
                                                <p className="text-[11px] text-muted/75 line-clamp-1 mt-0.5">
                                                    {item.subtitle}
                                                </p>
                                            </div>
                                            
                                            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                                                {item.hasFile ? (
                                                    <span className="text-[9px] font-bold text-green-500 bg-green-500/10 border border-green-500/20 rounded-md px-1.5 py-0.5 whitespace-nowrap">
                                                        ✓ Downloaded
                                                    </span>
                                                ) : (
                                                    item.monitored && (
                                                        <span className="text-[9px] font-bold text-plex bg-plex/10 border border-plex/20 rounded-md px-1.5 py-0.5 flex items-center gap-1 whitespace-nowrap">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-plex animate-pulse"></span>
                                                            Monitored
                                                        </span>
                                                    )
                                                )}
                                                <span className="text-[9px] text-muted/50 font-bold uppercase tracking-wider flex items-center gap-1 mt-0.5">
                                                    {item.type === 'tv' ? <Tv className="w-3 h-3" /> : <Film className="w-3 h-3" />}
                                                    {item.type === 'tv' ? 'TV' : 'Movie'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-card border border-white/5 shadow-2xl rounded-2xl p-4 md:p-6 relative">
                        <h2 className="text-xl font-bold text-text mb-4 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-plex" />
                            Active Downloads ({activeQueue.length})
                        </h2>
                        
                        <div className="flex flex-col gap-3">
                            {activeQueue.length === 0 ? (
                                <div className="text-center py-8 bg-background/30 rounded-xl border border-white/5 text-muted text-sm">
                                    <DownloadCloud className="w-10 h-10 text-muted/30 mx-auto mb-2" />
                                    No active downloads in the queue
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
                                                        <span className={`text-[8px] uppercase font-black tracking-widest px-1.5 py-0.5 rounded ${
                                                            item.service === 'Sonarr' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
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
                                                <span>{progress.toFixed(1)}% Completed</span>
                                                <span>{formatBytes(downloaded)} / {formatBytes(item.size)}</span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-8">
                    
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

const AnalyticsDashboard: React.FC<{ isAdmin: boolean, sessionInfo: any }> = ({ isAdmin, sessionInfo }) => {
    if (!isAdmin) {
        return <PersonalAnalyticsDashboard username={sessionInfo?.session?.username || 'User'} thumb={null} />;
    }
    const [analyticsData, setAnalyticsData] = useState<{ topUsers: any[], topLibraries: any[], topMovies: any[], topShows: any[], topMusic: any[], topDevices: any[], peakHours: number[], totalPlaybacks: number } | null>(null);
    const [isLoading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [days, setDays] = useState<string>('30');
    const [selectedUser, setSelectedUser] = useState<{ id: string, username: string, thumb: string | null } | null>(null);
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [contentTab, setContentTab] = useState<'movies' | 'shows' | 'music'>('movies');

    useEffect(() => {
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
        const fetchAnalytics = async () => {
            setLoading(true);
            try {
                const data = await apiFetch(`/api/plex/analytics?days=${days}`);
                setAnalyticsData(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, [days]);

    if (isLoading) return <Loader isLoading={true} />;
    if (error) return <div className="text-red-500 font-bold p-8 text-center">{error}</div>;
    if (!analyticsData) return null;

    const { topUsers, topLibraries, topMovies, topShows, topMusic, topDevices, peakHours, totalPlaybacks } = analyticsData;
    const maxLibraryPlays = Math.max(...topLibraries.map(l => l.plays), 1);
    const maxDevicePlays = Math.max(...topDevices.map(d => d.plays), 1);
    const maxPeakHour = Math.max(...peakHours, 1);
    
    let activeContent = topMovies;
    if (contentTab === 'shows') activeContent = topShows;
    else if (contentTab === 'music') activeContent = topMusic;

    return (
        <div className="w-full max-w-[1600px] animate-fade-in flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                <div>
                    <h1 className="text-3xl font-bold text-text uppercase tracking-widest flex items-center gap-3">
                        <BarChart3 className="w-8 h-8 text-plex" />
                        Advanced Analytics
                    </h1>
                    <p className="text-muted text-sm mt-1">Deep dive into playback history</p>
                </div>
                <div className="w-48">
                    <CustomSelect
                        value={days}
                        onChange={(val) => setDays(val as string)}
                        options={[
                            { label: 'Last 1 Day', value: '1' },
                            { label: 'Last 7 Days', value: '7' },
                            { label: 'Last 30 Days', value: '30' },
                            { label: 'Last 60 Days', value: '60' },
                            { label: 'Last 1 Year', value: '365' },
                            { label: 'Last 5 Years', value: '1825' },
                            { label: 'All Time', value: 'all' }
                        ]}
                    />
                </div>
            </div>

            {/* High Level Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-card/50 backdrop-blur-md rounded-xl p-6 shadow-xl border border-border flex items-center gap-4">
                    <div className="bg-plex/10 p-4 rounded-full">
                        <PlaySquare className="text-plex w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-muted text-sm uppercase tracking-wider font-bold mb-1">Total Playbacks</p>
                        <p className="text-2xl font-black text-text">{totalPlaybacks.toLocaleString()}</p>
                    </div>
                </div>
                <div className="bg-card/50 backdrop-blur-md rounded-xl p-6 shadow-xl border border-border flex items-center gap-4">
                    <div className="bg-plex/10 p-4 rounded-full">
                        <Users className="text-plex w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-muted text-sm uppercase tracking-wider font-bold mb-1">Unique Viewers</p>
                        <p className="text-lg font-bold text-text truncate max-w-[150px]" title={String(topUsers.length)}>{topUsers.length}</p>
                    </div>
                </div>
                <div className="bg-card/50 backdrop-blur-md rounded-xl p-6 shadow-xl border border-border flex items-center gap-4 col-span-1 sm:col-span-2">
                    <div className="w-full h-full flex flex-col justify-center">
                         <p className="text-muted text-sm uppercase tracking-wider font-bold mb-2 flex items-center gap-2"><Clock className="w-4 h-4 text-plex"/> Peak Viewing Hours</p>
                         <div className="flex items-end gap-1 h-12 w-full mt-auto">
                            {peakHours.map((val, idx) => (
                                <div key={idx} className="flex-1 bg-plex/20 hover:bg-plex/80 transition-colors rounded-t-sm relative group" style={{ height: `${Math.max((val / maxPeakHour) * 100, 5)}%` }}>
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Top Users Card */}
                <div className="bg-card/50 backdrop-blur-md rounded-xl p-4 md:p-6 shadow-xl border border-border lg:col-span-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
                        <h2 className="text-xl font-bold text-text uppercase tracking-wider flex items-center gap-2 whitespace-nowrap"><Users className="text-plex w-5 h-5" /> Top Viewers</h2>
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
                    </div>
                    <div className="flex flex-col gap-4">
                        {topUsers.length === 0 ? <p className="text-muted text-sm">No data available.</p> : topUsers.map((user, idx) => (
                            <div key={user.id} onClick={() => setSelectedUser({ id: user.id, username: user.username, thumb: user.thumb })} className="flex items-center justify-between p-3 bg-black/20 rounded-lg hover:bg-black/40 transition-colors cursor-pointer group hover:ring-1 hover:ring-plex">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div className="w-10 h-10 rounded-full p-[2px] bg-gradient-to-r from-plex to-[#e5a00d]">
                                            <img src={user.thumb ? (user.thumb.startsWith('http') ? user.thumb : `/api/plex/image?path=${encodeURIComponent(user.thumb)}&width=80&height=80`) : '/static/logo.png'} alt={user.username} className="w-full h-full rounded-full object-cover bg-card" onError={(e) => { (e.target as HTMLImageElement).src = '/static/logo.png'; }} />
                                        </div>
                                        <div className="absolute -top-2 -right-2 bg-plex text-black font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center">#{idx + 1}</div>
                                    </div>
                                    <span className="font-bold text-text group-hover:text-plex transition-colors">{user.username}</span>
                                </div>
                                <span className="font-mono text-plex font-bold">{user.plays} plays</span>
                            </div>
                        ))}
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
                </div>

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
            {selectedUser && (
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
        if (!window.confirm(`Allow ${label} to use the portal again? This does not invite them automatically.`)) return;

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
        <div className="w-full max-w-[1600px] mx-auto flex flex-col">
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
                                <p className="text-muted text-xs mt-1">Deleted users are logged out and blocked from claiming another trial.</p>
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
        if (window.confirm('Are you sure you want to delete this user? This will revoke Plex access first.')) {
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
        }
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
        if (!window.confirm(`Allow ${label} to use the portal again? This does not invite them automatically.`)) return;

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
        <div className="w-full max-w-[1600px] mx-auto flex flex-col">
            <Loader isLoading={isLoading} />
            <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[2000] flex flex-col-reverse gap-2 items-center">
                {toasts.map(toast => <Toast key={toast.id} {...toast} onDismiss={() => setToasts(t => t.filter(item => item.id !== toast.id))} />)}
            </div>

            <header className="hidden md:flex items-center justify-between w-full mb-6 mt-2 md:mt-0">
                <h1 className="text-xl md:text-3xl font-bold text-plex">Admin Portal</h1>
            </header>
            <main>
                {isConfigured && (
                    <div className="flex flex-col md:flex-row gap-4 md:items-center mb-8 bg-card border border-border p-4 rounded-xl shadow-md">
                        <span className="font-bold text-muted uppercase tracking-wider text-sm hidden md:inline-block mr-2">Quick Actions:</span>
                        <div className="grid grid-cols-2 md:flex md:flex-row gap-3 w-full md:w-auto flex-1">
                            <button className="col-span-1 px-3 py-2 bg-plex text-background rounded-md font-bold hover:bg-plex-hover transition-colors flex items-center justify-center gap-2 text-sm md:text-base" onClick={handleImportUsers} disabled={isLoading}>
                                Sync Plex Users
                            </button>
                            <button className="col-span-1 px-3 py-2 bg-border text-text rounded-md font-medium hover:bg-opacity-80 transition-colors flex items-center justify-center gap-2 text-sm md:text-base md:ml-auto" onClick={() => { setEditingUser(null); setUserModalOpen(true); }}>
                                + Add Custom User
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
    const [stats, setStats] = useState<{ movies: number, shows: number, music: number } | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await apiFetch('/api/plex/stats');
                if (res && res.movies !== undefined) {
                    setStats(res);
                }
            } catch (e) {
                // Silently fail if stats are unavailable
            }
        };
        fetchStats();
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
                    <span className="text-plex font-bold text-lg flex items-center gap-2"><span className="text-orange-500">⚡</span> 30%</span>
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
                body: JSON.stringify({ token, serverIdentifier, sonarrUrl, sonarrApiKey, radarrUrl, radarrApiKey })
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
    const [publicInfo, setPublicInfo] = useState<{ thumb: string | null, serverName: string, isConfigured: boolean | null }>({ thumb: null, serverName: 'Plex Server', isConfigured: null });

    const fetchPublicInfo = () => {
        apiFetch('/api/public/info').then(data => {
            if (data) {
                setPublicInfo({
                    thumb: data.thumb || null,
                    serverName: data.serverName || 'Plex Server',
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
            const authUrl = `https://app.plex.tv/auth#?clientID=${data.clientIdentifier}&code=${data.code}&context[device][product]=Plex%20Expiry%20Manager&forwardUrl=${encodeURIComponent(forwardUrl)}`;
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
        <div className="w-full max-w-6xl mx-auto flex flex-col items-center justify-center min-h-[80vh] px-4 pt-12 md:pt-20">
            <Loader isLoading={isLoading} />
            <div className="w-full max-w-5xl mx-auto bg-card rounded-2xl shadow-2xl border-t-[6px] border-plex flex flex-col-reverse md:flex-row relative z-10 overflow-hidden">
                <div className="flex-1 p-4 md:p-8 lg:p-12 flex flex-col justify-center">
                    <h1 className="text-3xl md:text-4xl font-bold text-plex mb-4">Welcome to {publicInfo.serverName}</h1>
                    <p className="text-muted text-sm md:text-base leading-relaxed mb-6">The ultimate Plex experience. Get instant access to our entire library with a <strong>3-Day Free Trial</strong>.</p>

                    <LivePlexStats />

                    <p className="text-xs text-muted mt-2 mb-4 text-center">You'll need a free Plex account to continue. You can create one securely on the next screen.</p>
                    <button className="w-full py-4 bg-plex text-background rounded-lg font-bold text-lg hover:bg-plex-hover transition-colors shadow-lg" onClick={handlePlexLogin} disabled={isLoading}>
                        Claim Free Trial
                    </button>
                </div>

                <div className="hidden md:block w-px bg-white/5 my-12"></div>

                <div className="flex-1 p-4 md:p-8 lg:p-12 flex flex-col justify-center bg-white/[0.02]">
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
                        <p className="text-muted text-sm mb-8">Manage your existing subscription or re-link your account.</p>
                        <button className="w-full py-4 bg-border text-text rounded-lg font-bold hover:bg-white/10 transition-colors border border-white/10" onClick={handlePlexLogin} disabled={isLoading}>
                            Login with Plex
                        </button>
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

const UserDashboard: React.FC<{ sessionInfo: any; publicConfig?: any; onLogout: () => void; refreshSession: () => void; onViewAdmin: () => void; onViewStatus: () => void; onViewDashboard: () => void }> = ({ sessionInfo, publicConfig, onLogout, refreshSession, onViewAdmin, onViewStatus, onViewDashboard }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [toast, setToast] = useState<ToastMessage | null>(null);

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

    // Auto-request invite if user is totally new
    useEffect(() => {
        if (!user && !isLoading && !sessionInfo.session.isAdmin) {
            handleRequestInvite();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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

    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col gap-5">
            <Loader isLoading={isLoading} />
            {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

            {/* Hero card */}
            <div className="relative bg-card border border-border rounded-2xl overflow-hidden shadow-2xl">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-plex to-transparent opacity-80" />
                <div className="p-4 md:p-8">

                    {/* Avatar + greeting */}
                    <div className="flex items-center gap-4 mb-6">
                        {(() => {
                            const thumbUrl = user?.thumb || sessionInfo.session.thumb;
                            if (thumbUrl) {
                                return (
                                    <img 
                                        src={thumbUrl.startsWith('http') ? thumbUrl : `/api/plex/image?path=${encodeURIComponent(thumbUrl)}&width=128&height=128`} 
                                        alt={sessionInfo.session.username} 
                                        className="w-14 h-14 rounded-full object-cover border-2 border-plex/60 shadow-lg shadow-plex/20 flex-shrink-0 bg-card" 
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                            (e.target as HTMLImageElement).nextElementSibling?.classList.add('flex');
                                        }}
                                    />
                                );
                            }
                            return null;
                        })()}
                        <div className={`w-14 h-14 rounded-full bg-gradient-to-br from-plex/40 to-plex/10 border-2 border-plex/60 items-center justify-center text-plex font-black text-2xl flex-shrink-0 shadow-lg shadow-plex/20 overflow-hidden ${(user?.thumb || sessionInfo.session.thumb) ? 'hidden' : 'flex'}`}>
                            {sessionInfo.session.username?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0">
                            <p className="text-muted text-xs uppercase tracking-[3px] font-semibold">Welcome back</p>
                            <h1 className="text-2xl md:text-3xl font-black text-text leading-tight truncate">{sessionInfo.session.username}</h1>
                        </div>
                        {sessionInfo.session.isAdmin && (
                            <span className="ml-auto px-3 py-1 rounded-full text-[10px] font-black bg-plex/20 text-plex border border-plex/40 uppercase tracking-widest flex-shrink-0">Admin</span>
                        )}
                    </div>

                    {sessionInfo.session.isAdmin && (
                        <div className="bg-plex/5 border border-plex/20 rounded-xl p-4 text-sm text-muted leading-relaxed">
                            <span className="text-plex font-bold">Server Administrator</span> — You own this server. Use the Admin Panel to manage users and settings.
                        </div>
                    )}
                    {!sessionInfo.session.isAdmin && !user && (
                        <div className="flex items-center gap-3 text-muted text-sm">
                            <div className="w-4 h-4 rounded-full border-2 border-plex border-t-transparent animate-spin flex-shrink-0" />
                            Setting up your 3-Day Free Trial...
                        </div>
                    )}
                    {!sessionInfo.session.isAdmin && user && (
                        <>
                            <div className="flex flex-wrap gap-2 mb-5">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black border uppercase tracking-wider ${isRevoked ? 'bg-red-500/10 border-red-500/30 text-red-400' : isExpiringSoon ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' : 'bg-green-500/10 border-green-500/30 text-green-400'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isRevoked ? 'bg-red-400' : isExpiringSoon ? 'bg-yellow-400' : 'bg-green-400'}`} />
                                    {user.plexAccessStatus}{user.isTrial && ' · Trial'}
                                </span>
                                {user.expiryDate ? (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-white/5 border border-white/10 text-muted">
                                        📅 {new Date(user.expiryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-green-500/10 border border-green-500/30 text-green-400">♾️ Unlimited</span>
                                )}
                            </div>
                            {daysLeft !== null && (
                                <div className="mb-5 bg-background/50 rounded-xl p-4 border border-border">
                                    <div className="flex justify-between items-baseline mb-3">
                                        <span className="text-muted text-xs uppercase tracking-widest font-semibold">Time Remaining</span>
                                        <span className={`font-black text-3xl leading-none ${isExpiringSoon ? 'text-yellow-400' : 'text-plex'}`}>
                                            {daysLeft}<span className="text-sm font-semibold text-muted ml-1">{daysLeft === 1 ? 'day' : 'days'}</span>
                                        </span>
                                    </div>
                                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full transition-all duration-1000 ${isExpiringSoon ? 'bg-yellow-400' : 'bg-gradient-to-r from-plex via-yellow-300 to-plex'}`} style={{ width: `${progressPct}%` }} />
                                    </div>
                                    {isExpiringSoon && <p className="text-yellow-400/80 text-xs mt-2">⚠️ Expiring soon — contact the admin to renew</p>}
                                </div>
                            )}

                            {isRevoked && daysLeft !== null && daysLeft >= 0 && (
                                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-5 flex flex-col gap-3">
                                    <p className="text-yellow-400 font-semibold text-sm">⚠️ Access revoked — but you have {daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining.</p>
                                    <button className="self-start px-5 py-2.5 bg-plex text-background rounded-lg font-bold hover:bg-plex-hover transition-colors text-sm" onClick={handleRelink}>Re-link Plex Account</button>
                                </div>
                            )}
                        </>
                    )}
                </div>

            </div>

            {/* Announcement Banner */}
            {publicConfig?.announcement && (
                <div className="bg-plex/10 border border-plex/30 rounded-2xl p-4 md:p-6 shadow-lg">
                    <div className="flex items-start gap-3">
                        <span className="text-xl mt-0.5">📢</span>
                        <div>
                            <h3 className="text-plex font-bold text-sm uppercase tracking-wider mb-1">Server Announcement</h3>
                            <p className="text-text whitespace-pre-wrap text-sm leading-relaxed">{publicConfig.announcement}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Referral Link */}
            {publicConfig?.referralEnabled && user && !sessionInfo.session.isAdmin && (
                <div className="bg-card border border-border rounded-2xl p-4 md:p-6 shadow-lg">
                    <p className="text-plex font-bold text-base mb-1">🎁 Invite Friends, Get Free Time!</p>
                    <p className="text-muted text-sm leading-relaxed mb-4">Share this link with your friends. They get a free trial, and you get reward days added to your subscription automatically when they join!</p>
                    <div className="flex gap-2">
                        <input type="text" readOnly value={`${window.location.origin}/?ref=${user.id}`} className="flex-1 p-3 rounded-lg border border-border bg-background text-text text-sm outline-none" />
                        <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/?ref=${user.id}`); setToast({ id: 99, message: 'Copied to clipboard!', type: 'success' }); }} className="px-4 bg-plex text-background rounded-lg font-bold hover:bg-plex-hover transition-colors shadow-md">Copy</button>
                    </div>
                </div>
            )}

            {/* Newsletter preferences */}
            {user && !sessionInfo.session.isAdmin && (
                <div className="bg-card border border-border rounded-2xl p-4 md:p-6 shadow-lg">
                    <p className="text-muted text-xs uppercase tracking-widest font-semibold mb-4">Preferences</p>
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-text font-semibold text-sm">Weekly Newsletter</p>
                            <p className="text-muted text-xs mt-0.5">Automated library updates delivered to your inbox</p>
                        </div>
                        <button onClick={handleToggleNewsletter} aria-label="Toggle newsletter"
                            className={`relative inline-flex items-center w-12 h-6 rounded-full transition-all flex-shrink-0 border ${!optOutNewsletter ? 'bg-plex border-plex' : 'bg-border border-border'}`}>
                            <span className={`inline-block w-4 h-4 bg-white rounded-full shadow transition-transform duration-300 ${!optOutNewsletter ? 'translate-x-7' : 'translate-x-1'}`} />
                        </button>
                    </div>
                </div>
            )}

            {/* Support card */}
            {!sessionInfo?.session?.isAdmin && (
                <div className="bg-card border border-border rounded-2xl p-4 md:p-6 shadow-lg">
                    {user?.isTrial ? (
                        <div className="mb-4">
                            <p className="text-plex font-bold text-base mb-1">🍿 Enjoying your Free Trial?</p>
                            <p className="text-muted text-sm leading-relaxed">Once your 3-day trial ends, you'll lose access. A full subscription is just <span className="text-plex font-black">£60/year</span>. Get in touch to upgrade!</p>
                        </div>
                    ) : (
                        <div className="mb-4">
                            <p className="text-text font-bold text-base mb-1">💬 Need Help?</p>
                            <p className="text-muted text-sm leading-relaxed">Contact the admin to renew your subscription, report an issue, or get support.</p>
                        </div>
                    )}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <a href="https://wa.me/447305697245" target="_blank" rel="noreferrer"
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all border bg-[#25D366]/10 border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/20">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12.031 21.972c-1.63 0-3.21-.42-4.606-1.21l-5.111 1.34 1.36-4.972a9.92 9.92 0 0 1-1.34-4.978C2.334 6.64 6.685 2.28 12.031 2.28c5.344 0 9.697 4.36 9.697 9.872 0 5.512-4.353 9.82-9.697 9.82zm0-18.062c-4.47 0-8.115 3.65-8.115 8.13 0 1.48.39 2.92 1.12 4.19l-1.02 3.73 3.82-1a8.13 8.13 0 0 0 4.195 1.15c4.475 0 8.115-3.65 8.115-8.13s-3.64-8.07-8.115-8.07zm4.332 11.23c-.237-.12-1.405-.69-1.62-.77-.216-.08-.372-.12-.53.12-.158.24-.616.77-.754.93-.138.16-.276.18-.513.06-1.124-.55-2.062-1.28-2.812-2.19-.214-.26-.14-.4.08-.56.12-.08.27-.3.41-.45.14-.15.19-.25.28-.42.1-.17.05-.32 0-.44-.05-.12-.53-1.28-.73-1.75-.19-.46-.38-.4-.53-.41h-.45c-.16 0-.41.06-.63.3-.22.24-.85.83-.85 2.02 0 1.19.87 2.34.99 2.5.12.16 1.7 2.6 4.12 3.64 1.38.59 2.05.65 2.8.55.75-.1 1.4-.57 1.6-1.12.2-.55.2-.102.14-1.12-.06-.1-.22-.16-.46-.28z" /></svg>
                            WhatsApp
                        </a>
                        <a href="mailto:jasonlucas58@gmail.com"
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all border bg-white/5 border-white/10 text-text hover:bg-white/10">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                            Email
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
};

const ServiceCustomSelect = ({ value, onChange, options }: { value: string, onChange: (val: string) => void, options: {id: string, name: string}[] }) => {
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
    const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'analytics'>('overview');
    const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

    const fetchStatus = useCallback(async () => {
        try {
            const data = await apiFetch('/api/status');
            setStatusData(data);
        } catch (e) {
            console.error(e);
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
                <Loader isLoading={true} />
            </div>
        );
    }

    const { config, healthData } = statusData;
    const services = config?.services || [];
    const groups = config?.groups || [];

    return (
        <div className="w-full max-w-[1600px] mx-auto flex flex-col">
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
                        className={`px-5 py-2.5 rounded-lg font-bold text-sm transition-all duration-200 cursor-pointer border-none outline-none ${
                            activeTab === tab.id
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
const StreamDetailsModal: React.FC<{ session: any, onClose: () => void }> = ({ session, onClose }) => {
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
                    <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-md rounded-full pr-4 p-1.5 shadow-lg border border-white/10 z-10">
                        <img src={session.userThumb ? session.userThumb : 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'} className="w-8 h-8 rounded-full object-cover" onError={(e) => { e.currentTarget.src = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'; }} />
                        <span className="text-xs font-bold text-white truncate max-w-[120px]">{session.user}</span>
                    </div>
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

                    <div className="mt-auto flex gap-3 pt-4 border-t border-white/5">
                        <a href={session.plexUrl} target="_blank" rel="noreferrer" className="flex-1 bg-plex text-background font-bold text-center py-3 rounded-lg hover:bg-plex-hover transition-colors shadow-lg">
                            Open in Plex
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

const LibraryDashboard: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [dashboardData, setDashboardData] = useState<{ activeSessions: any[], recentMovies: any[], recentShows: any[], recentMusic: any[] } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [recentLimit, setRecentLimit] = useState(25);
    const [selectedSession, setSelectedSession] = useState<any | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await apiFetch(`/api/plex/dashboard?limit=${recentLimit}`);
                if (res.error) throw new Error(res.error);
                setDashboardData(res);
            } catch (err: any) {
                setError(err.message || 'Failed to load dashboard data');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [recentLimit]);

    if (loading && !dashboardData) return <Loader isLoading={true} />;

    const totalStreams = dashboardData?.activeSessions?.length || 0;
    const transcodingStreams = dashboardData?.activeSessions?.filter(s => s.isTranscoding).length || 0;
    const directStreams = totalStreams - transcodingStreams;
    const totalBandwidthKbps = dashboardData?.activeSessions?.reduce((acc, s) => acc + (s.bandwidth || 0), 0) || 0;
    const totalBandwidthMbps = (totalBandwidthKbps / 1000).toFixed(2);

    return (
        <div className="w-[calc(100%-8px)] md:w-[95%] max-w-[1600px] mx-auto flex flex-col min-h-screen">
            <main className="w-full pb-8 mt-4 md:mt-0">
                {error && <div className="toast error show">{error}</div>}

                {/* SUMMARY CARDS */}
                {dashboardData && totalStreams > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-6">
                            {dashboardData.activeSessions.map((session, i) => (
                                <div key={i} onClick={() => setSelectedSession(session)} className="bg-card rounded-xl border border-border flex flex-col overflow-hidden shadow-lg hover:border-plex/50 hover:shadow-plex/20 transition-all cursor-pointer select-none">
                                    <div className="flex flex-row flex-grow relative">
                                        <div className="w-36 md:w-44 flex-shrink-0 relative overflow-hidden bg-card">
                                            <div className="w-full pb-[150%]"></div>
                                            <img src={`/api/plex/image?path=${encodeURIComponent(session.thumb)}&width=300&height=500`} alt={session.title} loading="lazy" className="absolute inset-0 w-full h-full object-cover drop-shadow-2xl" />
                                        </div>
                                        <div className="p-3 md:p-4 flex flex-col flex-grow min-w-0 justify-center relative">
                                            <div className="absolute top-3 right-3 flex items-center gap-2 bg-black/50 backdrop-blur-md rounded-full pr-3 p-1 shadow-md border border-white/5">
                                                <img src={session.userThumb ? session.userThumb : 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'} alt={session.user} className="w-5 h-5 rounded-full object-cover" onError={(e) => { e.currentTarget.src = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'; }} />
                                                <span className="text-[10px] font-bold text-white/90 truncate max-w-[80px] md:max-w-[100px]">{session.user}</span>
                                            </div>

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
                                    {/* Progress Bar with Tooltip Arrow */}
                                    <div className="w-full h-1.5 bg-background/80 relative mt-auto z-10">
                                        <div className="h-full bg-plex absolute top-0 left-0 transition-all duration-1000" style={{ width: `${session.progress}%` }}>
                                            {/* Tooltip with arrow pointing down */}
                                            <div className="absolute right-0 bottom-full mb-0.5 translate-x-1/2 flex flex-col items-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                                                <div className="bg-plex text-black text-[9px] font-bold px-1 rounded-sm shadow-sm">{Math.round(session.progress)}%</div>
                                                <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[4px] border-t-plex"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-muted p-8 border border-dashed border-border rounded-xl mt-4 w-full">No active streams</div>
                    )}
                </section>

                <div className="flex justify-end gap-4 items-center mb-8">
                    <span style={{ fontSize: '0.85rem', color: '#999' }}>RECENTLY ADDED LIMIT</span>
                    <select className="w-full md:w-32 p-2 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all cursor-pointer text-sm" value={recentLimit} onChange={(e) => setRecentLimit(Number(e.target.value))}>
                        <option value={10}>10 Items</option>
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
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-4 w-full pb-4">
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
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-4 w-full pb-4">
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
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-4 w-full pb-4">
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
            </main>
            
            {/* Stream Details Modal */}
            {selectedSession && <StreamDetailsModal session={selectedSession} onClose={() => setSelectedSession(null)} />}
        </div>
    );
};


interface NavigationProps {
    currentRoute: string;
    onNavigate: (route: 'admin' | 'user' | 'status' | 'dashboard' | 'settings' | 'logs' | 'analytics' | 'mediastack') => void;
    onLogout: () => void;
    isAdmin: boolean;
    serverName: string;
    adminThumb?: string | null;
    requestUrl: string;
    navOrder: string[];
}

const Navigation: React.FC<NavigationProps> = ({ currentRoute, onNavigate, onLogout, isAdmin, serverName, adminThumb, requestUrl, navOrder }) => {
    useEffect(() => {
        updateFavicon(adminThumb);
    }, [adminThumb]);

    const navItemsConfig: Record<string, { label: string; icon: React.FC<any>; route: string; adminOnly: boolean; href?: string; onClick?: (e: any) => void }> = {
        'home': { label: 'Home', icon: Home, route: isAdmin ? 'admin' : 'user', adminOnly: false },
        'discover': { label: 'Discover', icon: Film, route: 'dashboard', adminOnly: false },
        'status': { label: 'Status', icon: Activity, route: 'status', adminOnly: false },
        'logs': { label: 'Logs', icon: FileText, route: 'logs', adminOnly: true },
        'analytics': { label: 'Analytics', icon: BarChart3, route: 'analytics', adminOnly: false },
        'mediastack': { label: 'Media Stack', icon: Layers, route: 'mediastack', adminOnly: false },
        'request': { label: 'Request Content', icon: Sparkles, route: '', adminOnly: false, href: requestUrl },
        'settings': { label: 'Settings', icon: Settings, route: 'settings', adminOnly: true },
        'logout': { label: 'Logout', icon: LogOut, route: '', adminOnly: false, onClick: onLogout }
    };

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
                    <button onClick={(e) => { e.preventDefault(); onNavigate('analytics'); }} className={`text-muted hover:text-text transition-colors ${currentRoute === 'analytics' ? 'text-plex' : ''}`}>
                        <BarChart3 className="w-5 h-5" />
                    </button>
                    {isAdmin && (
                        <>
                            <button onClick={(e) => { e.preventDefault(); onNavigate('mediastack'); }} className={`text-muted hover:text-text transition-colors ${currentRoute === 'mediastack' ? 'text-plex' : ''}`}>
                                <Layers className="w-5 h-5" />
                            </button>
                            <button onClick={(e) => { e.preventDefault(); onNavigate('logs'); }} className={`text-muted hover:text-text transition-colors ${currentRoute === 'logs' ? 'text-plex' : ''}`}>
                                <FileText className="w-5 h-5" />
                            </button>
                            <button onClick={(e) => { e.preventDefault(); onNavigate('settings'); }} className={`text-muted hover:text-text transition-colors ${currentRoute === 'settings' ? 'text-plex' : ''}`}>
                                <Settings className="w-5 h-5" />
                            </button>
                        </>
                    )}
                </div>
            </div>


            {/* Desktop Sidebar */}
            <div className="hidden md:flex flex-col w-72 bg-card border-r border-border p-6 sticky top-0 h-screen shadow-2xl">
                <div className="flex flex-col items-center mb-10">
                    <h2 className="text-2xl font-bold text-text text-center mb-4">{serverName}</h2>
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full p-[2px] bg-gradient-to-r from-plex to-[#e5a00d] shadow-lg shadow-plex/20">
                            <div className="w-full h-full rounded-full overflow-hidden bg-card">
                                <img
                                    src={adminThumb ? (adminThumb.startsWith('http') ? adminThumb : `/api/plex/image?path=${encodeURIComponent(adminThumb)}&width=192&height=192`) : '/static/logo.png'}
                                    alt="Admin Profile"
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = '/static/logo.png';
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col gap-2">
                    {navOrder.map((key) => {
                        const item = navItemsConfig[key];
                        if (!item) return null;
                        if (item.adminOnly && !isAdmin) return null;

                        const isCurrent = item.route ? ['admin', 'user'].includes(currentRoute) && key === 'home' ? true : currentRoute === item.route : false;

                        if (item.href) {
                            return (
                                <a key={key} href={item.href} target="_blank" rel="noreferrer" className="flex items-center gap-4 p-3 text-muted no-underline rounded-lg transition-all font-medium hover:bg-white/5 hover:text-text">
                                    <item.icon className="w-5 h-5 flex-shrink-0" /> {item.label}
                                </a>
                            );
                        }

                        return (
                            <a key={key} href="#" className={`flex items-center gap-4 p-3 text-muted no-underline rounded-lg transition-all font-medium hover:bg-white/5 hover:text-text ${isCurrent ? 'border-l-4 border-plex rounded-l-none bg-white/5 text-text' : ''}`} onClick={(e) => { e.preventDefault(); if (item.onClick) item.onClick(e); else onNavigate(item.route as any); }}>
                                <item.icon className="w-5 h-5 flex-shrink-0" /> {item.label}
                            </a>
                        );
                    })}
                </div>
            </div>

            {/* Mobile Bottom Nav */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 w-full bg-[#161b22] border-t border-[#30363d] z-50 pb-[env(safe-area-inset-bottom)]">
                <div className="flex justify-around items-center h-16">
                    {navOrder.map((key) => {
                        const item = navItemsConfig[key];
                        if (!item) return null;
                        if (item.adminOnly && !isAdmin) return null;

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
            const authUrl = `https://app.plex.tv/auth#?clientID=${data.clientIdentifier}&code=${data.code}&context[device][product]=Plex%20Expiry%20Manager&forwardUrl=${encodeURIComponent(forwardUrl)}`;
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
    const [currentRoute, setCurrentRoute] = useState<'login' | 'admin' | 'user' | 'status' | 'dashboard' | 'settings' | 'logs' | 'analytics' | 'mediastack' | 'invite' | 'loading'>('loading');
    const [sessionInfo, setSessionInfo] = useState<any>(null);
    const [publicConfig, setPublicConfig] = useState<any>({});

    const fetchPublicConfig = useCallback(async () => {
        try {
            const data = await apiFetch('/api/config/public');
            setPublicConfig(data);
            if (data.primaryColor) {
                document.documentElement.style.setProperty('--color-plex', data.primaryColor);
            }
            if (data.customLogoUrl) {
                updateFavicon(data.customLogoUrl);
            }
        } catch (e) { }
    }, []);

    useEffect(() => {
        fetchPublicConfig();
    }, [fetchPublicConfig]);

    const setRoute = useCallback((route: 'login' | 'admin' | 'user' | 'status' | 'dashboard' | 'settings' | 'logs' | 'analytics' | 'mediastack' | 'invite' | 'loading') => {
        setCurrentRoute(route);
        if (route !== 'loading' && route !== 'invite') {
            let path = '/';
            if (route === 'admin') path = '/admin';
            if (route === 'user') path = '/portal';
            if (route === 'status') path = '/status';
            if (route === 'dashboard') path = '/dashboard';
            if (route === 'settings') path = '/settings';
            if (route === 'logs') path = '/logs';
            if (route === 'analytics') path = '/analytics';
            if (route === 'mediastack') path = '/mediastack';
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
            else if (path === '/logs' && data.session.isAdmin) setCurrentRoute('logs');
            else if (path === '/mediastack') setCurrentRoute('mediastack');
            else if (path === '/analytics') setCurrentRoute('analytics');
            else if (path === '/settings' && !data.session.isAdmin) setCurrentRoute('user');
            else if (path === '/portal') setCurrentRoute('user');
            else if (path === '/admin') setCurrentRoute('admin');
            else {
                // If at root or unknown, push to default route
                const defaultRoute = data.session.isAdmin ? 'admin' : 'user';
                window.history.replaceState({}, '', defaultRoute === 'admin' ? '/admin' : '/portal');
                setCurrentRoute(defaultRoute);
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
        if (currentRoute === 'status') return <StatusDashboard onBack={() => isPublicStatus ? setRoute('login') : setRoute(isAdmin ? 'admin' : 'user')} isAdmin={isAdmin} isPublic={isPublicStatus} />;
        if (currentRoute === 'dashboard') return <LibraryDashboard onBack={() => setRoute(isAdmin ? 'admin' : 'user')} />;
        if (currentRoute === 'settings' && isAdmin) return <SettingsDashboard />;
        if (currentRoute === 'logs' && isAdmin) return <LogsDashboard onLogout={handleLogout} />;
        if (currentRoute === 'mediastack') return <MediaStackDashboard isAdmin={isAdmin} />;
        if (currentRoute === 'analytics') return <AnalyticsDashboard isAdmin={isAdmin} sessionInfo={sessionInfo} />;
        if (currentRoute === 'admin') return <AdminDashboard onLogout={handleLogout} onViewUserPortal={() => setRoute('user')} onViewStatus={() => setRoute('status')} onViewDashboard={() => setRoute('dashboard')} />;
        return <UserDashboard sessionInfo={sessionInfo} publicConfig={publicConfig} onLogout={handleLogout} refreshSession={checkSession} onViewAdmin={() => setRoute('admin')} onViewStatus={() => setRoute('status')} onViewDashboard={() => setRoute('dashboard')} />;
    };

    return (
        <div className="flex w-full min-h-screen bg-background">
            {!isPublicView && <Navigation currentRoute={currentRoute} onNavigate={setRoute as any} onLogout={handleLogout} isAdmin={isAdmin} serverName={sessionInfo?.serverName || 'Plex Server'} adminThumb={sessionInfo?.adminThumb} requestUrl={sessionInfo?.requestUrl || 'https://plexified.co.uk'} navOrder={sessionInfo?.navOrder || ['home', 'discover', 'status', 'logs', 'analytics', 'mediastack', 'request', 'settings', 'logout']} />}
            <div className={`flex-grow flex flex-col items-center p-4 md:p-8 pt-20 pb-[80px] md:pt-8 md:pb-8 w-full overflow-x-hidden ${isPublicView ? '!pt-8 !pb-8' : ''}`}>
                {renderView()}
            </div>
        </div>
    );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<MainApp />);
