import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Copy, ChevronUp, ChevronDown, Check } from 'lucide-react';
import { apiFetch } from '../shared/api';
import { portalUrl, resolvePortalAssetUrl } from '../shared/basePath';
import { appConfirm } from '../shared/confirm';
import { CustomSelect } from '../shared/ui';
import { Loader, ToastContainer, pushToast, type ToastMessage } from '../shared/toast';
import { SettingHint } from './SettingHint';
import type { User, AuditEntry, DeletedUser, PlexServer } from '../shared/types';
import { formatDateTime, formatEventName, hexToRgb, accentHoverRgb, getDaysUntilExpiry, addMonths, addYears, formatDate } from '../shared/format';

import { StreamKillRulesPanel } from './StreamKillRulesPanel';
import { InvitesSettings } from './InvitesSettings';
import { StatusMonitorSettings } from './StatusMonitorSettings';
import { BroadcastSettingsTab } from './BroadcastSettingsTab';
import { IntegrationTestButton } from '../shared/IntegrationTestButton';
import { HomeLayoutSettings } from './HomeLayoutSettings';
import { DEFAULT_DASHBOARD_LAYOUT, normalizeSectionLayout, type DashboardLayoutConfig } from '../shared/dashboardLayout';

const hasIntegrationCredentials = (
    url: string | undefined,
    apiKey: string | undefined,
    savedUrl?: string,
    savedApiKey?: string,
) => {
    const effectiveUrl = String(url || savedUrl || '').trim();
    const effectiveKey = String(apiKey || savedApiKey || '').trim();
    return Boolean(effectiveUrl && effectiveKey);
};

const SELFHST_ICON_BASE = 'https://cdn.jsdelivr.net/gh/selfhst/icons/svg';
const APP_ICONS: Record<string, string> = {
    sonarr: `${SELFHST_ICON_BASE}/sonarr.svg`,
    radarr: `${SELFHST_ICON_BASE}/radarr.svg`,
    tautulli: `${SELFHST_ICON_BASE}/tautulli.svg`,
    seerr: `${SELFHST_ICON_BASE}/seerr.svg`,
    overseerr: `${SELFHST_ICON_BASE}/seerr.svg`,
    jellyseerr: `${SELFHST_ICON_BASE}/jellyseerr.svg`,
    ombi: `${SELFHST_ICON_BASE}/ombi.svg`,
    jellystat: 'https://cdn.jsdelivr.net/gh/selfhst/icons@main/png/jellystat.png',
};

const ProgramIcon: React.FC<{ app: string; label: string }> = ({ app, label }) => (
    <span className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
        {APP_ICONS[app] ? (
            <img
                src={APP_ICONS[app]}
                alt=""
                className="w-6 h-6 object-contain"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
        ) : (
            <span className="text-[10px] font-black text-plex">{label.slice(0, 2).toUpperCase()}</span>
        )}
        <span className="sr-only">{label}</span>
    </span>
);

const IntegrationHeading: React.FC<{ app: string; title: string; subtitle?: string; className?: string }> = ({ app, title, subtitle, className = '' }) => (
    <div className={`flex items-center gap-3 border-b border-border pb-3 mb-4 ${className}`}>
        <ProgramIcon app={app} label={title} />
        <div>
            <h3 className="text-xl font-bold text-text leading-tight">{title}</h3>
            {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
        </div>
    </div>
);

const BRAND_THEME_OPTIONS = [
    { label: 'Plex', value: 'plex' },
    { label: 'Jellyfin', value: 'jellyfin' },
    { label: 'Custom', value: 'custom' },
];

const BRAND_THEME_COLORS: Record<string, string> = {
    plex: '#F7C600',
    jellyfin: '#00A4DC',
};
const JELLYFIN_BRAND_LOGO_URL = '/api/jellyfin/branding/icon';
const JELLYFIN_BRAND_BACKGROUND_URL = '/api/jellyfin/branding/splash';

const inferBrandTheme = (color = '') => {
    const normalized = color.trim().toUpperCase();
    if (normalized === BRAND_THEME_COLORS.plex) return 'plex';
    if (normalized === BRAND_THEME_COLORS.jellyfin) return 'jellyfin';
    return 'custom';
};

export const SettingsDashboard: React.FC = () => {
    const SETTINGS_TABS = ['plex', 'smtp', 'newsletter', 'cleanup', 'mediastack', 'branding', 'navigation', 'home-layout', 'status', 'invites', 'tasks', 'system', 'contact', 'broadcast', 'stream-rules', 'logs'] as const;
    const [statusDraft, setStatusDraft] = useState<any>(null);
    const [isLoading, setLoading] = useState(true);
    const [configLoadError, setConfigLoadError] = useState<string | null>(null);
    const [initialSettings, setInitialSettings] = useState<any>({});
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const streamRulesSaveHandlerRef = useRef<(() => Promise<boolean>) | null>(null);

    // Admin features moved here
    const [statusConfig, setStatusConfig] = useState<any>({});
    const [users, setUsers] = useState<User[]>([]);

    const addToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        setToasts(t => pushToast(t, message, type));
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
            setConfigLoadError(null);
            try {
                const configData = await apiFetch('/api/config');
                if (configData.settings) {
                    setInitialSettings(configData.settings);
                }
                const usersData = await apiFetch('/api/users');
                setUsers(usersData);
                await fetchStatusConfig();
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Failed to load config';
                setConfigLoadError(message);
                addToast(message, 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchConfig();
        // Libraries call Plex on the server — can hang in Docker if a loopback URI is used.
        apiFetch('/api/plex/libraries').then((libData) => setLibraries(libData || [])).catch(() => setLibraries([]));
    }, [addToast, fetchStatusConfig]);

    const handleSaveConfig = async (newConfig: any) => {
        setLoading(true);
        try {
            await apiFetch('/api/config', { method: 'POST', body: JSON.stringify(newConfig) });
            const configData = await apiFetch('/api/config');
            if (configData.settings) {
                setInitialSettings(configData.settings);
            }
            window.dispatchEvent(new CustomEvent('portal-public-config-updated'));
            addToast('Settings Saved!');
        } catch (e: any) {
            addToast(e.message || 'Failed to save config', 'error');
        } finally {
            setLoading(false);
        }
    };
    const [token, setToken] = useState('');
    const [mediaServerType, setMediaServerType] = useState<'plex' | 'jellyfin'>('plex');
    const [plexServerUrl, setPlexServerUrl] = useState('');
    const [jellyfinUrl, setJellyfinUrl] = useState('');
    const [jellyfinApiKey, setJellyfinApiKey] = useState('');
    const [servers, setServers] = useState<PlexServer[]>([]);
    const [selectedServer, setSelectedServer] = useState('');
    const [checkInterval, setCheckInterval] = useState(60);
    const [hideStreamUsers, setHideStreamUsers] = useState<string>('false');
    const [defaultLibraryIds, setDefaultLibraryIds] = useState<string[]>([]);
    const [libraries, setLibraries] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState(() => {
        const hash = window.location.hash.replace('#', '');
        return (SETTINGS_TABS as readonly string[]).includes(hash) ? hash : 'branding';
    });
    const [highlightMaintenanceToggle, setHighlightMaintenanceToggle] = useState(false);
    const [settingsSearch, setSettingsSearch] = useState('');

    const settingsTabGroups = [
        {
            title: 'Portal',
            tabs: [
                { id: 'branding', label: 'Portal UI', keywords: ['theme', 'logo', 'color', 'announcement', 'referral', 'quality', 'badges', 'poster', 'hdr', 'codec'] },
                { id: 'contact', label: 'Contact Details', keywords: ['email', 'whatsapp', 'support'] },
                { id: 'navigation', label: 'Navigation', keywords: ['menu', 'order', 'sidebar'] },
                { id: 'home-layout', label: 'Home Layout', keywords: ['dashboard', 'widgets', 'sections', 'home', 'layout', 'reorder', 'hide'] }
            ]
        },
        {
            title: 'Integrations',
            tabs: [
                { id: 'plex', label: 'Media Player', keywords: ['plex', 'jellyfin', 'media', 'player', 'token', 'server', 'libraries', 'docker', 'local', 'url', 'direct'] },
                { id: 'mediastack', label: 'Media Stack', keywords: ['sonarr', 'radarr', 'tautulli', 'jellystat', 'seerr', 'jellyseerr'] },
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
        const hash = `#${activeTab}`;
        if (window.location.hash !== hash) {
            window.history.replaceState({}, '', `${window.location.pathname}${window.location.search}${hash}`);
        }
    }, [activeTab]);

    useEffect(() => {
        const syncTabFromHash = () => {
            const hash = window.location.hash.replace('#', '');
            if ((SETTINGS_TABS as readonly string[]).includes(hash)) {
                setActiveTab(hash);
            } else if (!hash) {
                setActiveTab('branding');
            }
        };
        window.addEventListener('hashchange', syncTabFromHash);
        return () => window.removeEventListener('hashchange', syncTabFromHash);
    }, []);

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
    const [jellystatUrl, setJellystatUrl] = useState('');
    const [jellystatApiKey, setJellystatApiKey] = useState('');
    const [requestAppType, setRequestAppType] = useState('none');
    const [requestAppUrl, setRequestAppUrl] = useState('');
    const [requestAppApiKey, setRequestAppApiKey] = useState('');
    const [maintenanceExperimentalEnabled, setMaintenanceExperimentalEnabled] = useState(false);
    const [dashboardLayout, setDashboardLayout] = useState<DashboardLayoutConfig>(DEFAULT_DASHBOARD_LAYOUT);
    const dashboardLayoutRef = useRef<DashboardLayoutConfig>(DEFAULT_DASHBOARD_LAYOUT);

    const updateDashboardLayout = useCallback((next: DashboardLayoutConfig) => {
        dashboardLayoutRef.current = next;
        setDashboardLayout(next);
    }, []);

    // Branding & UI States
    const [brandTheme, setBrandTheme] = useState('plex');
    const [primaryColor, setPrimaryColor] = useState(BRAND_THEME_COLORS.plex);
    const [customLogoUrl, setCustomLogoUrl] = useState('');
    const [backgroundImageUrl, setBackgroundImageUrl] = useState('');
    const [useScrollRevealAnimations, setUseScrollRevealAnimations] = useState(false);
    const [useCinematicLoading, setUseCinematicLoading] = useState(false);
    const [useBrandedSkeleton, setUseBrandedSkeleton] = useState(true);
    const [useTrendingSlideshow, setUseTrendingSlideshow] = useState(false);
    const [trendingSlideshowInterval, setTrendingSlideshowInterval] = useState(30);
    const [tmdbApiKey, setTmdbApiKey] = useState('');
    const [brandingTheme, setBrandingTheme] = useState('plex');
    const [referralEnabled, setReferralEnabled] = useState(false);
    const [referralTrialDays, setReferralTrialDays] = useState(3);
    const [referralRewardDays, setReferralRewardDays] = useState(7);
    const [announcement, setAnnouncement] = useState('');
    const [isPushingAnnouncement, setIsPushingAnnouncement] = useState(false);
    const [use24HourClock, setUse24HourClock] = useState(initialSettings.use24HourClock || false);
    const [showPosterQualityBadges, setShowPosterQualityBadges] = useState(initialSettings.showPosterQualityBadges !== false);
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
            const response = await fetch(portalUrl('/api/admin/backup'));
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
                const response = await fetch(portalUrl('/api/admin/backup/restore?confirm=true'), {
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

    const renderOptionalPill = (enabled: boolean, configured: boolean) => {
        if (!enabled) {
            return (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-white/10 text-muted border border-border">
                    Disabled
                </span>
            );
        }
        return renderConfigPill(configured);
    };

    const renderOptionalIntegrationPill = (configured: boolean) => {
        if (configured) {
            return renderConfigPill(true);
        }
        return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-white/10 text-muted border border-border">
                Optional
            </span>
        );
    };

    const trackedIntegrationKeys = useMemo(() => {
        const mediaKey = mediaServerType === 'jellyfin' ? 'jellyfinConfigured' : 'plexConfigured';
        const analyticsKey = mediaServerType === 'jellyfin' ? 'jellystatConfigured' : 'tautulliConfigured';
        return [mediaKey, 'sonarrConfigured', 'radarrConfigured', analyticsKey, 'requestAppConfigured'];
    }, [mediaServerType]);
    const integrationLabels: Record<string, string> = {
        jellyfinConfigured: 'Jellyfin',
        plexConfigured: 'Plex',
        sonarrConfigured: 'Sonarr',
        radarrConfigured: 'Radarr',
        tautulliConfigured: 'Tautulli',
        jellystatConfigured: 'Jellystat',
        requestAppConfigured: 'Request App',
    };

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

        const integrations = diagnostics.integrations || {};
        const trackedIntegrations = trackedIntegrationKeys
            .filter((key) => key !== 'requestAppConfigured' || integrations.requestAppEnabled)
            .map((key) => [key, !!integrations[key]] as const);
        const cacheEntries = Object.entries(diagnostics.caches || {}).filter(([key]) => {
            if (!maintenanceExperimentalEnabled) {
                if (key.startsWith('maintenance')) return false;
            }
            if (mediaServerType === 'jellyfin' && key === 'plexStats') return false;
            return true;
        });
        const cacheValues = cacheEntries.map(([, entry]: any) => !!entry?.exists);
        const jobs = Array.isArray(diagnostics.jobs) ? diagnostics.jobs : [];
        const integrationsConfigured = trackedIntegrations.filter(([, configured]) => configured).length;
        const integrationsTotal = trackedIntegrations.length;
        const cacheHealthy = cacheValues.filter(Boolean).length;
        const cacheTotal = cacheValues.length;
        const runningJobs = jobs.filter((job: any) => !!job.running).length;
        const failingJobs = jobs.filter((job: any) => !!job.lastError).length;
        const alerts: string[] = [];

        if (integrationsConfigured < integrationsTotal) {
            const missingNames = trackedIntegrations
                .filter(([, configured]) => !configured)
                .map(([key]) => integrationLabels[key]);
            alerts.push(`${missingNames.join(', ')} not configured.`);
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
    }, [diagnostics, maintenanceExperimentalEnabled, mediaServerType, trackedIntegrationKeys]);

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
            setMediaServerType(initialSettings.mediaServerType === 'jellyfin' ? 'jellyfin' : 'plex');
            setPlexServerUrl(initialSettings.plexServerUrl || '');
            setJellyfinUrl(initialSettings.jellyfinUrl || '');
            setJellyfinApiKey(initialSettings.jellyfinApiKey || '');
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
            setJellystatUrl(initialSettings.jellystatUrl || '');
            setJellystatApiKey(initialSettings.jellystatApiKey || '');
            setRequestAppType(initialSettings.requestAppType === 'overseerr' ? 'seerr' : (initialSettings.requestAppType || 'none'));
            setRequestAppUrl(initialSettings.requestAppUrl || '');
            setRequestAppApiKey(initialSettings.requestAppApiKey || '');
            setBrandTheme(inferBrandTheme(initialSettings.primaryColor || BRAND_THEME_COLORS.plex));
            setPrimaryColor(initialSettings.primaryColor || BRAND_THEME_COLORS.plex);
            setCustomLogoUrl(initialSettings.customLogoUrl || '');
            setBackgroundImageUrl(initialSettings.backgroundImageUrl || '');
            setUseScrollRevealAnimations(!!initialSettings.useScrollRevealAnimations);
            setUseCinematicLoading(!!initialSettings.useCinematicLoading);
            setUseBrandedSkeleton(initialSettings.useBrandedSkeleton !== false);
            setUseTrendingSlideshow(!!initialSettings.useTrendingSlideshow);
            setTrendingSlideshowInterval(initialSettings.trendingSlideshowInterval || 30);
            setTmdbApiKey(initialSettings.tmdbApiKey || '');
            setBrandingTheme(initialSettings.brandingTheme || 'plex');
            setReferralEnabled(!!initialSettings.referralEnabled);
            setReferralTrialDays(initialSettings.referralTrialDays || 3);
            setReferralRewardDays(initialSettings.referralRewardDays || 7);
            setAnnouncement(initialSettings.announcement || '');
            if (initialSettings.navOrder) setNavOrder(ensureMaintenanceNavOrder(initialSettings.navOrder));
            setHideStreamUsers(initialSettings.hideStreamUsers === true ? 'anonymous' : (initialSettings.hideStreamUsers || 'false'));
            if (initialSettings.defaultLibraryIds) setDefaultLibraryIds(initialSettings.defaultLibraryIds);
            if (initialSettings.use24HourClock !== undefined) setUse24HourClock(!!initialSettings.use24HourClock);
            if (initialSettings.showPosterQualityBadges !== undefined) setShowPosterQualityBadges(initialSettings.showPosterQualityBadges !== false);
            if (initialSettings.allowTemporaryAccess !== undefined) setAllowTemporaryAccess(!!initialSettings.allowTemporaryAccess);
            if (initialSettings.autoBackupEnabled !== undefined) setAutoBackupEnabled(!!initialSettings.autoBackupEnabled);
            if (initialSettings.autoBackupIntervalDays !== undefined) setAutoBackupIntervalDays(Number(initialSettings.autoBackupIntervalDays) || 2);
            if (initialSettings.autoBackupRetentionCount !== undefined) setAutoBackupRetentionCount(Number(initialSettings.autoBackupRetentionCount) || 10);
            if (initialSettings.maintenanceExperimentalEnabled !== undefined) setMaintenanceExperimentalEnabled(!!initialSettings.maintenanceExperimentalEnabled);
            const layout = normalizeSectionLayout(initialSettings.dashboardLayout);
            dashboardLayoutRef.current = layout;
            setDashboardLayout(layout);
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
                body: JSON.stringify({ token, plexServerUrl: plexServerUrl || undefined }),
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
        if (mediaServerType === 'plex' && (!token || !selectedServer)) {
            addToast('Token and server must be selected.', 'error');
            return;
        }
        if (mediaServerType === 'jellyfin' && (!jellyfinUrl || !hasIntegrationCredentials(jellyfinUrl, jellyfinApiKey, initialSettings.jellyfinUrl, initialSettings.jellyfinApiKey))) {
            addToast('Jellyfin URL and API key must be set.', 'error');
            return;
        }

        if (logoFile) {
            try {
                await fetch(portalUrl('/api/config/logo'), { method: 'POST', body: logoFile });
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
            mediaServerType,
            serverIdentifier: selectedServer,
            plexServerUrl: plexServerUrl || '',
            jellyfinUrl,
            jellyfinApiKey,
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
            jellystatUrl,
            jellystatApiKey,
            requestAppType,
            requestAppUrl,
            requestAppApiKey,
            primaryColor,
            customLogoUrl,
            brandingTheme,
            backgroundImageUrl,
            useScrollRevealAnimations,
            useCinematicLoading,
            useBrandedSkeleton,
            useTrendingSlideshow,
            trendingSlideshowInterval,
            tmdbApiKey,
            referralEnabled,
            referralTrialDays,
            referralRewardDays,
            announcement,
            navOrder: ensureMaintenanceNavOrder(navOrder),
            hideStreamUsers,
            defaultLibraryIds,
            use24HourClock,
            allowTemporaryAccess,
            showPosterQualityBadges,
            autoBackupEnabled,
            autoBackupIntervalDays,
            autoBackupRetentionCount,
            maintenanceExperimentalEnabled,
            dashboardLayout: normalizeSectionLayout(dashboardLayoutRef.current)
        });
        document.documentElement.style.setProperty('--color-plex', hexToRgb(primaryColor));
    };

    const applyBrandTheme = (theme: string) => {
        setBrandTheme(theme);
        if (theme === 'plex' || theme === 'jellyfin') {
            setPrimaryColor(BRAND_THEME_COLORS[theme]);
        }
    };

    const applyJellyfinBranding = () => {
        setBrandTheme('jellyfin');
        setPrimaryColor(BRAND_THEME_COLORS.jellyfin);
        setCustomLogoUrl(JELLYFIN_BRAND_LOGO_URL);
        setBackgroundImageUrl(JELLYFIN_BRAND_BACKGROUND_URL);
        setLogoFile(null);
        addToast('Jellyfin server icon and splash background applied. Save settings to publish.');
    };

    useEffect(() => {
        document.documentElement.style.setProperty('--color-plex', hexToRgb(primaryColor));
        document.documentElement.style.setProperty('--color-plex-hover', accentHoverRgb(primaryColor));
    }, [primaryColor]);

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
        <div className="w-full flex flex-col box-border">
            <Loader isLoading={isLoading} />
            <ToastContainer toasts={toasts} setToasts={setToasts} />


            <header className="flex items-center justify-between w-full mb-6 mt-2 md:mt-0">
                <h1 className="text-xl md:text-3xl font-bold text-plex">Settings</h1>
            </header>

            {configLoadError && (
                <div className="mb-6 p-4 rounded-xl border border-red-500/40 bg-red-500/10 text-red-200 text-sm">
                    Could not load settings: {configLoadError}. Try refreshing the page. If this persists on Docker, confirm your session cookie is valid and the container can reach the API.
                </div>
            )}

            <div className="w-full flex flex-col min-w-0">
                <div className="w-full md:grid md:grid-cols-[18rem_minmax(0,1fr)] md:gap-8 xl:gap-10">
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

                    {/* Desktop Sidebar Navigation — matches main app nav width (w-72) */}
                    <aside className="hidden md:flex md:flex-col w-72 shrink-0 h-fit sticky top-20 glass-card nav-shell p-6 shadow-2xl">
                        <label className="text-muted text-xs uppercase tracking-wider font-bold mb-2 block">Find Setting</label>
                        <input
                            type="text"
                            placeholder="Search settings..."
                            value={settingsSearch}
                            onChange={(e) => setSettingsSearch(e.target.value)}
                            className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-text focus:outline-none focus:border-plex transition-colors mb-4"
                        />
                        {visibleTabGroups.length === 0 ? (
                            <p className="text-xs text-muted px-2 py-3">No settings sections found.</p>
                        ) : (
                            <div className="space-y-4">
                                {visibleTabGroups.map(group => (
                                    <div key={group.title}>
                                        <p className="text-[10px] uppercase tracking-wider font-bold text-plex px-3 mb-1.5">{group.title}</p>
                                        <div className="space-y-1">
                                            {group.tabs.map(tab => (
                                                <button
                                                    key={tab.id}
                                                    onClick={() => setActiveTab(tab.id)}
                                                    className={`w-full text-left px-3 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                                                        ? 'nav-item-active'
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

                    <div className="overflow-y-auto flex-grow mb-4 custom-scrollbar md:pr-1 min-w-0 w-full">
                        <div className="settings-panel">
                        {activeTab === 'stream-rules' && <StreamKillRulesPanel addToast={addToast} registerSaveHandler={(handler) => { streamRulesSaveHandlerRef.current = handler; }} />}
    
                        {activeTab === 'plex' && (
                            <div className="mb-8">
                                <h3 className="text-xl font-bold text-plex mb-4 border-b border-border pb-2">Media Server Integration</h3>
                                <div className="mb-4">
                                    <label htmlFor="mediaServerType">Media Server Type</label>
                                    <CustomSelect
                                        id="mediaServerType"
                                        value={mediaServerType}
                                        onChange={(val) => setMediaServerType(val === 'jellyfin' ? 'jellyfin' : 'plex')}
                                        options={[
                                            { label: 'Plex', value: 'plex' },
                                            { label: 'Jellyfin', value: 'jellyfin' }
                                        ]}
                                    />
                                    <div className="mt-2">
                                        <SettingHint>
                                            Choose the media server used for portal authentication and server-specific integrations.
                                        </SettingHint>
                                    </div>
                                </div>
                                {mediaServerType === 'jellyfin' && (
                                    <div className="mb-6 p-4 rounded-lg border border-border bg-background/40">
                                        <h4 className="font-bold text-text mb-3">Jellyfin Connection</h4>
                                        <div className="mb-4">
                                            <label htmlFor="jellyfinUrl">Jellyfin URL</label>
                                            <input className="w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all" id="jellyfinUrl" type="url" value={jellyfinUrl} onChange={(e) => setJellyfinUrl(e.target.value)} placeholder="http://192.168.1.6:8096" />
                                        </div>
                                        <div className="mb-4">
                                            <label htmlFor="jellyfinApiKey">Jellyfin API Key</label>
                                            <input className="w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all" id="jellyfinApiKey" type="password" value={jellyfinApiKey} onChange={(e) => setJellyfinApiKey(e.target.value)} placeholder="API key from Jellyfin dashboard" />
                                        </div>
                                        <IntegrationTestButton
                                            type="jellyfin"
                                            payload={{ jellyfinUrl, jellyfinApiKey }}
                                            disabled={!hasIntegrationCredentials(jellyfinUrl, jellyfinApiKey, initialSettings.jellyfinUrl, initialSettings.jellyfinApiKey)}
                                            onMessage={(msg, ok) => addToast(msg, ok ? 'success' : 'error')}
                                        />
                                    </div>
                                )}
                                {mediaServerType === 'plex' && (
                                    <>
                                <h4 className="text-lg font-bold text-text mb-4">Plex Connection</h4>
                                <div className="mb-4">
                                    <label htmlFor="plexToken">Plex Token</label>
                                    <input className="w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all" id="plexToken" type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="Enter your X-Plex-Token" />
                                    <div className="mt-2">
                                        <SettingHint>
                                            Needed to fetch users and manage access. <a href="https://support.plex.tv/articles/204059436-finding-an-authentication-token-x-plex-token/" target="_blank" rel="noopener noreferrer">How to find your token.</a>
                                        </SettingHint>
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-start gap-3">
                                    <button className="px-4 py-2 bg-border text-text rounded-md font-medium hover:bg-opacity-80 transition-colors flex items-center justify-center gap-2" onClick={handleFetchServers} disabled={!token}>Fetch Servers</button>
                                    <IntegrationTestButton
                                        type="plex"
                                        payload={{
                                            token,
                                            serverIdentifier: selectedServer || initialSettings.serverIdentifier,
                                            plexServerUrl: plexServerUrl || undefined,
                                        }}
                                        disabled={!token || !(selectedServer || initialSettings.serverIdentifier)}
                                        onMessage={(msg, ok) => addToast(msg, ok ? 'success' : 'error')}
                                    />
                                </div>
                                {(selectedServer || initialSettings.serverIdentifier) && servers.length === 0 && (
                                    <div className="mt-3">
                                        <SettingHint>
                                            Saved server: <strong>{selectedServer || initialSettings.serverIdentifier}</strong>
                                        </SettingHint>
                                    </div>
                                )}
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
                                    <label htmlFor="plexServerUrl">
                                        Direct Plex URL{' '}
                                        <span className="text-muted font-normal normal-case">(required in Docker)</span>
                                    </label>
                                    <input
                                        className="w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all"
                                        id="plexServerUrl"
                                        type="url"
                                        value={plexServerUrl}
                                        onChange={(e) => setPlexServerUrl(e.target.value)}
                                        placeholder="http://192.168.1.6:32400"
                                    />
                                    <div className="mt-2">
                                        <SettingHint>
                                            Your Plex server&apos;s LAN address. Use this when Plex.tv discovery fails from inside the container (e.g. <code className="text-xs">getaddrinfo EAI_AGAIN …plex.direct</code> errors).
                                        </SettingHint>
                                    </div>
                                </div>
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
                                        <div className="flex flex-wrap gap-3">
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
                                    </>
                                )}

                                <div className="mb-4 mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 border-b border-border/40">
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

                            <div className="mt-6 space-y-3">
                                <h4 className="font-bold text-text">Test SMTP Settings</h4>
                                <div className="flex flex-col md:flex-row gap-4 mb-4">
                                    <input
                                        type="email"
                                        value={testRecipient}
                                        onChange={e => setTestRecipient(e.target.value)}
                                        placeholder="test-recipient@gmail.com"
                                        className="flex-grow p-3 rounded-lg border border-border bg-background text-text text-sm outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all"
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
                            <div className="mt-6 space-y-3">
                                <h4 className="font-bold text-text">Test Newsletter</h4>
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
                                <p className="text-xs text-muted">When enabled, the server will automatically revoke portal access for users who have not watched anything for the specified number of days. You can exempt specific users from this rule by editing them in the Users table.</p>
                            </div>

                            <div className="mb-6 flex items-center justify-between py-4 border-b border-border/40">
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
                            <IntegrationHeading app="sonarr" title="Sonarr Integration" subtitle="TV series automation" />
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
                            <IntegrationTestButton
                                type="sonarr"
                                payload={{ sonarrUrl, sonarrApiKey }}
                                disabled={!hasIntegrationCredentials(sonarrUrl, sonarrApiKey, initialSettings.sonarrUrl, initialSettings.sonarrApiKey)}
                                className="mb-6"
                                onMessage={(msg, ok) => addToast(msg, ok ? 'success' : 'error')}
                            />

                            <IntegrationHeading app="radarr" title="Radarr Integration" subtitle="Movie automation" className="mt-8" />
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
                            <IntegrationTestButton
                                type="radarr"
                                payload={{ radarrUrl, radarrApiKey }}
                                disabled={!hasIntegrationCredentials(radarrUrl, radarrApiKey, initialSettings.radarrUrl, initialSettings.radarrApiKey)}
                                className="mb-6"
                                onMessage={(msg, ok) => addToast(msg, ok ? 'success' : 'error')}
                            />

                            <IntegrationHeading app="tmdb" title="TMDB Integration" subtitle="Worldwide trending backgrounds" className="mt-8" />
                            <div className="mb-4">
                                <label htmlFor="tmdbApiKey">TMDB API Key</label>
                                <input className="w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all" id="tmdbApiKey" type="password" value={tmdbApiKey} onChange={(e) => setTmdbApiKey(e.target.value)} placeholder="Enter TMDB API Key" />
                                <div className="mt-2">
                                    <SettingHint>Used to fetch worldwide trending media backgrounds for the portal slideshow. Get one for free at themoviedb.org.</SettingHint>
                                </div>
                            </div>
                            <IntegrationHeading app="tautulli" title="Tautulli Integration" subtitle="Plex activity and analytics" className="mt-8" />
                            <div className="mb-4">
                                <label htmlFor="tautulliUrl">Tautulli URL</label>
                                <input className="w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all" id="tautulliUrl" type="text" value={tautulliUrl} onChange={(e) => setTautulliUrl(e.target.value)} placeholder="http://localhost:8181" />
                            </div>
                            <div className="mb-8">
                                <label htmlFor="tautulliApiKey">Tautulli API Key</label>
                                <input className="w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all" id="tautulliApiKey" type="password" value={tautulliApiKey} onChange={(e) => setTautulliApiKey(e.target.value)} placeholder="Enter Tautulli API Key" />
                            </div>
                            <IntegrationTestButton
                                type="tautulli"
                                payload={{ tautulliUrl, tautulliApiKey }}
                                disabled={!hasIntegrationCredentials(tautulliUrl, tautulliApiKey, initialSettings.tautulliUrl, initialSettings.tautulliApiKey)}
                                className="mb-6"
                                onMessage={(msg, ok) => addToast(msg, ok ? 'success' : 'error')}
                            />

                            <IntegrationHeading app="jellystat" title="Jellystat Integration" subtitle="Jellyfin activity and analytics" className="mt-8" />
                            <div className="mb-4">
                                <label htmlFor="jellystatUrl">Jellystat URL</label>
                                <input className="w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all" id="jellystatUrl" type="text" value={jellystatUrl} onChange={(e) => setJellystatUrl(e.target.value)} placeholder="http://localhost:3000" />
                                <div className="mt-2">
                                    <SettingHint>The URL to your Jellystat instance. Jellystat is the Jellyfin analytics companion, similar to Tautulli for Plex.</SettingHint>
                                </div>
                            </div>
                            <div className="mb-8">
                                <label htmlFor="jellystatApiKey">Jellystat API Key</label>
                                <input className="w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all" id="jellystatApiKey" type="password" value={jellystatApiKey} onChange={(e) => setJellystatApiKey(e.target.value)} placeholder="API key from Jellystat Settings" />
                            </div>
                            <IntegrationTestButton
                                type="jellystat"
                                payload={{ jellystatUrl, jellystatApiKey }}
                                disabled={!hasIntegrationCredentials(jellystatUrl, jellystatApiKey, initialSettings.jellystatUrl, initialSettings.jellystatApiKey)}
                                className="mb-6"
                                onMessage={(msg, ok) => addToast(msg, ok ? 'success' : 'error')}
                            />

                            <IntegrationHeading
                                app={requestAppType === 'none' ? 'seerr' : requestAppType}
                                title="Request App Integration"
                                subtitle="Seerr, Jellyseerr, or Ombi for media requests"
                                className="mt-8"
                            />
                            <div className="mb-4">
                                <label htmlFor="requestAppType">Request App Type</label>
                                <CustomSelect
                                    id="requestAppType"
                                    value={requestAppType}
                                    onChange={(val) => setRequestAppType(val)}
                                    options={[
                                        { label: 'Disabled', value: 'none' },
                                        { label: 'Seerr', value: 'seerr' },
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
                            <IntegrationTestButton
                                type="requestApp"
                                payload={{ requestAppType, requestAppUrl, requestAppApiKey }}
                                disabled={requestAppType === 'none' || !hasIntegrationCredentials(requestAppUrl, requestAppApiKey, initialSettings.requestAppUrl, initialSettings.requestAppApiKey)}
                                onMessage={(msg, ok) => addToast(msg, ok ? 'success' : 'error')}
                            />
                        </div>
                    )}

                    {activeTab === 'home-layout' && (
                        <HomeLayoutSettings layout={dashboardLayout} onChange={updateDashboardLayout} />
                    )}

                    {activeTab === 'navigation' && (
                        <div className="mb-8 animate-fade-in">
                            <h3 className="text-xl font-bold text-plex mb-4 border-b border-border pb-2">Navigation Order</h3>
                            <p className="text-muted text-sm mb-4">Drag and drop or use the arrows to reorder the navigation items on the sidebar.</p>
                            <div className="flex flex-col gap-2 max-w-md">
                                {navOrder.map((key, index) => {
                                    const labels: Record<string, string> = {
                                        'home': 'Home', 'discover': 'Discover', 'status': 'Status', 'logs': 'Logs (Admin Only)', 'analytics': 'Analytics', 'mediastack': 'Media Stack', 'maintenance': 'Cleaner (Admin Only)', 'request': 'Request Content', 'settings': 'Settings (Admin Only)', 'logout': 'Logout'
                                    };
                                    return (
                                        <div key={key} className="flex items-center justify-between py-3 border-b border-border/40">
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
                                <label>Theme</label>
                                <CustomSelect
                                    value={brandTheme}
                                    onChange={applyBrandTheme}
                                    options={BRAND_THEME_OPTIONS}
                                />
                            </div>
                            {mediaServerType === 'jellyfin' && (
                                <div className="mb-4 rounded-lg border border-plex/30 bg-plex/10 p-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <span className="w-11 h-11 rounded-lg bg-background border border-plex/30 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                <img src={JELLYFIN_BRAND_LOGO_URL} alt="" className="w-8 h-8 object-contain" />
                                            </span>
                                            <div className="min-w-0">
                                                <h4 className="font-bold text-text">Jellyfin branding</h4>
                                                <p className="text-xs text-muted mt-1">Use the Jellyfin server icon and splash background across the portal.</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={applyJellyfinBranding}
                                            className="px-4 py-2 bg-plex hover:bg-plex-hover text-background rounded-md font-bold transition-colors whitespace-nowrap"
                                        >
                                            Use Jellyfin icon & splash
                                        </button>
                                    </div>
                                </div>
                            )}
                            <div className="mb-4">
                                <label>Primary Accent Color</label>
                                <div className="flex gap-4">
                                    <input
                                        type="color"
                                        className="w-16 h-12 p-1 rounded-lg border border-border cursor-pointer bg-background"
                                        value={primaryColor}
                                        onChange={e => {
                                            setBrandTheme('custom');
                                            setPrimaryColor(e.target.value);
                                        }}
                                    />
                                    <input
                                        type="text"
                                        className="flex-1 p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex transition-all uppercase font-mono"
                                        value={primaryColor}
                                        onChange={e => {
                                            setBrandTheme('custom');
                                            setPrimaryColor(e.target.value);
                                        }}
                                    />
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
                                <label htmlFor="defaultThemeSelect">Default Portal Theme</label>
                                <CustomSelect
                                    id="defaultThemeSelect"
                                    value={brandingTheme}
                                    onChange={setBrandingTheme}
                                    options={[
                                        { label: 'Plex Dark', value: 'plex' },
                                        { label: 'Sleek Slate', value: 'slate' },
                                        { label: 'Nordic Frost', value: 'nordic' },
                                    ]}
                                />
                                <div className="mt-2">
                                    <SettingHint>The default theme applied to new visitors and users. Users can still customize their local theme preference in the navigation menu.</SettingHint>
                                </div>
                            </div>

                            <div className="mb-4 p-4 rounded-lg border border-border bg-card">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <label className="mb-0">Enable Scroll Reveal Animations</label>
                                        <SettingHint>Smoothly slide elements into place as you scroll down the dashboard.</SettingHint>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={useScrollRevealAnimations}
                                            onChange={e => setUseScrollRevealAnimations(e.target.checked)}
                                        />
                                        <div className="w-11 h-6 bg-background peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-text after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-plex"></div>
                                    </label>
                                </div>
                            </div>

                            <div className="mb-4 p-4 rounded-lg border border-border bg-card">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <label className="mb-0">Enable Cinematic Loading Sequences</label>
                                        <SettingHint>Replaces the standard loading spinner with a beautiful SVG line-drawing animation.</SettingHint>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={useCinematicLoading}
                                            onChange={e => setUseCinematicLoading(e.target.checked)}
                                        />
                                        <div className="w-11 h-6 bg-background peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-text after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-plex"></div>
                                    </label>
                                </div>
                            </div>

                            <div className="mb-4 p-4 rounded-lg border border-border bg-card">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <label className="mb-0">Enable Branded Skeleton Loading</label>
                                        <SettingHint>Use a branded, animated shimmer effect for skeleton loaders instead of the default pulse.</SettingHint>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={useBrandedSkeleton}
                                            onChange={e => setUseBrandedSkeleton(e.target.checked)}
                                        />
                                        <div className="w-11 h-6 bg-background peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-text after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-plex"></div>
                                    </label>
                                </div>
                            </div>

                            <div className="mb-4 p-4 rounded-lg border border-border bg-card">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <label className="mb-0">Enable TMDB Trending Slideshow</label>
                                        <SettingHint>Replaces the static splash background with a fading slideshow of currently trending movies and shows from TMDB. Requires a TMDB API key in Integrations.</SettingHint>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={useTrendingSlideshow}
                                            onChange={e => setUseTrendingSlideshow(e.target.checked)}
                                        />
                                        <div className="w-11 h-6 bg-background peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-text after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-plex"></div>
                                    </label>
                                </div>
                                <div className={`transition-all overflow-hidden ${useTrendingSlideshow ? 'max-h-[100px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <label>Slideshow Interval (Seconds)</label>
                                    <select
                                        className="w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex transition-all mt-1"
                                        value={trendingSlideshowInterval}
                                        onChange={e => setTrendingSlideshowInterval(parseInt(e.target.value, 10))}
                                    >
                                        <option value={10}>10 Seconds</option>
                                        <option value={20}>20 Seconds</option>
                                        <option value={30}>30 Seconds</option>
                                        <option value={40}>40 Seconds</option>
                                        <option value={50}>50 Seconds</option>
                                        <option value={60}>60 Seconds</option>
                                    </select>
                                </div>
                            </div>

                            <div className={`mb-4 transition-opacity ${useTrendingSlideshow ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                                <label>Static Splash Background Image</label>
                                <input
                                    type="url"
                                    className="w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex transition-all"
                                    value={backgroundImageUrl}
                                    onChange={e => setBackgroundImageUrl(e.target.value)}
                                    placeholder="https://example.com/background.png"
                                />
                                <div className="mt-2">
                                    <SettingHint>Shown as a subtle splash image on the login screen and portal background.</SettingHint>
                                </div>
                            </div>

                            <div className="mb-6 rounded-lg border border-border overflow-hidden bg-background/70">
                                <div
                                    className="relative min-h-[220px] flex items-center justify-center p-6 bg-card"
                                    style={backgroundImageUrl ? {
                                        backgroundImage: `linear-gradient(rgba(10,15,20,0.42), rgba(10,15,20,0.56)), url("${resolvePortalAssetUrl(backgroundImageUrl).replace(/"/g, '%22')}")`,
                                        backgroundRepeat: 'no-repeat',
                                        backgroundPosition: 'center',
                                        backgroundSize: 'cover',
                                    } : undefined}
                                >
                                    <div className="text-center">
                                        {customLogoUrl ? (
                                            <img
                                                src={resolvePortalAssetUrl(customLogoUrl)}
                                                alt="Server icon preview"
                                                className="max-w-28 max-h-24 object-contain mx-auto mb-4 drop-shadow-[0_0_24px_rgba(0,0,0,0.75)]"
                                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                            />
                                        ) : (
                                            <div className="w-24 h-24 rounded-full border-2 border-plex/50 bg-background/80 mx-auto mb-4 p-3 shadow-[0_0_36px_rgba(0,164,220,0.28)]">
                                                <span className="w-full h-full flex items-center justify-center text-3xl font-black text-plex">S</span>
                                            </div>
                                        )}
                                        <p className="text-sm font-bold text-text">Portal splash preview</p>
                                        <p className="text-xs text-muted mt-1">This is the server icon and background users will see.</p>
                                    </div>
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
                                <label>Poster Quality Badges</label>
                                <div className="flex items-center gap-2 mt-2">
                                    <button type="button" onClick={() => setShowPosterQualityBadges(!showPosterQualityBadges)} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors flex-shrink-0 cursor-pointer ${showPosterQualityBadges ? 'bg-plex' : 'bg-border'}`}>
                                        <span className={`inline-block w-4 h-4 transform bg-white rounded-full shadow-sm transition-transform ${showPosterQualityBadges ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                    <span className="text-sm font-medium cursor-pointer select-none hover:text-plex transition-colors" onClick={() => setShowPosterQualityBadges(!showPosterQualityBadges)}>Show quality badges on recently added and discover posters (4K, HDR, codec, Atmos)</span>
                                </div>
                                <SettingHint>Applies to Home and Discover poster cards for all users.</SettingHint>
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
                            <div className="mb-6 flex items-center justify-between py-4 border-b border-border/40">
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
                                    <div key={task.id} className="py-4 border-b border-border/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div>
                                            <h4 className="font-bold text-lg mb-1">{task.name}</h4>
                                            <p className="text-sm text-muted mb-2">{task.description}</p>
                                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                                                <span><strong className="text-text">Last Run:</strong> {task.lastRun ? new Date(task.lastRun).toLocaleString() : 'Never'}</span>
                                                <span><strong className="text-text">Next Run:</strong> {task.nextRun ? new Date(task.nextRun).toLocaleString() : 'Not Scheduled'}</span>
                                                <span><strong className="text-text">Status:</strong> {task.running ? 'Running' : 'Idle'}</span>
                                                {task.lastDurationMs !== null && <span><strong className="text-text">Duration:</strong> {Math.round(task.lastDurationMs / 1000)}s</span>}
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
                            <section className="space-y-4 mb-8">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-bold text-text">Health Dashboard</h4>
                                    <span className={`text-xs px-2 py-1 rounded font-bold ${systemHealth.score >= 85 ? 'bg-green-500/20 text-green-300' : systemHealth.score >= 65 ? 'bg-yellow-500/20 text-yellow-300' : 'bg-red-500/20 text-red-300'}`}>
                                        {systemHealth.status}
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 text-sm">
                                    <div>
                                        <p className="text-muted text-xs mb-1">Health Score</p>
                                        <p className="text-xl font-bold text-text">{systemHealth.score}%</p>
                                    </div>
                                    <div>
                                        <p className="text-muted text-xs mb-1">Integrations</p>
                                        <p className="text-xl font-bold text-text">{systemHealth.integrationsConfigured}/{systemHealth.integrationsTotal}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted text-xs mb-1">Caches</p>
                                        <p className="text-xl font-bold text-text">{systemHealth.cacheHealthy}/{systemHealth.cacheTotal}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted text-xs mb-1">Running Jobs</p>
                                        <p className="text-xl font-bold text-text">{systemHealth.runningJobs}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted text-xs mb-1">Failing Jobs</p>
                                        <p className={`text-xl font-bold ${systemHealth.failingJobs > 0 ? 'text-red-300' : 'text-text'}`}>{systemHealth.failingJobs}</p>
                                    </div>
                                </div>
                                <div>
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
                            </section>
                            <section className={`space-y-3 mb-8 transition-all duration-300 ${highlightMaintenanceToggle ? 'ring-2 ring-plex/50 rounded-lg p-3 -m-3' : ''}`}>
                                <h4 className="font-bold text-text">Cleaner Experimental Mode</h4>
                                <div className="flex items-center justify-between gap-3 py-2">
                                    <div>
                                        <p className="font-semibold text-text">Enable Cleaner Module</p>
                                        <p className="text-xs text-muted mt-1">Single global toggle for the main `Cleaner` navigation section. OFF by default.</p>
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
                            </section>
                            <section className="space-y-4 mb-8">
                                <h4 className="font-bold text-text">Backup & Restore</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                    <div>
                                        <label className="font-semibold text-sm block mb-2">Auto Backup Enabled</label>
                                        <button
                                            type="button"
                                            onClick={() => setAutoBackupEnabled(!autoBackupEnabled)}
                                            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${autoBackupEnabled ? 'bg-plex' : 'bg-border'}`}
                                        >
                                            <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${autoBackupEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>
                                    <div>
                                        <label className="font-semibold text-sm block mb-2">Interval (Days)</label>
                                        <input
                                            type="number"
                                            min={1}
                                            className="w-full p-2 rounded border border-border bg-background text-text"
                                            value={autoBackupIntervalDays}
                                            onChange={(e) => setAutoBackupIntervalDays(Math.max(1, Number(e.target.value) || 1))}
                                        />
                                    </div>
                                    <div>
                                        <label className="font-semibold text-sm block mb-2">Rolling Backups Kept</label>
                                        <input
                                            type="number"
                                            min={1}
                                            className="w-full p-2 rounded border border-border bg-background text-text"
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
                                    className="w-full min-h-[140px] p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex"
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
                                            <div key={file.filename} className="py-2 border-b border-border/40 flex items-center justify-between gap-2 last:border-b-0">
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
                            </section>

                            <section className="space-y-4 mb-8">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-bold text-text">System Diagnostics</h4>
                                    <button className="px-3 py-1.5 bg-border text-text rounded-md font-semibold hover:bg-opacity-80" onClick={fetchDiagnostics}>
                                        {isLoadingDiagnostics ? 'Refreshing...' : 'Refresh'}
                                    </button>
                                </div>
                                {diagnostics ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-x-4 gap-y-2 text-sm">
                                        <div><strong>App Version:</strong> {diagnostics?.app?.version || 'unknown'}</div>
                                        <div><strong>Uptime:</strong> {diagnostics?.app?.uptimeSeconds || 0}s</div>
                                        <div><strong>Node:</strong> {diagnostics?.app?.nodeVersion || 'n/a'}</div>
                                        <div><strong>Memory:</strong> {diagnostics?.app?.memoryRssMB || 0} MB</div>
                                        <div className="flex items-center justify-between gap-2">
                                            <strong>Media Player ({mediaServerType === 'jellyfin' ? 'Jellyfin' : 'Plex'})</strong>
                                            {renderConfigPill(mediaServerType === 'jellyfin' ? !!diagnostics?.integrations?.jellyfinConfigured : !!diagnostics?.integrations?.plexConfigured)}
                                        </div>
                                        <div className="flex items-center justify-between gap-2"><strong>SMTP</strong>{renderOptionalIntegrationPill(!!diagnostics?.integrations?.smtpConfigured)}</div>
                                        <div className="flex items-center justify-between gap-2"><strong>Sonarr</strong>{renderConfigPill(!!diagnostics?.integrations?.sonarrConfigured)}</div>
                                        <div className="flex items-center justify-between gap-2"><strong>Radarr</strong>{renderConfigPill(!!diagnostics?.integrations?.radarrConfigured)}</div>
                                        {mediaServerType === 'jellyfin' ? (
                                            <div className="flex items-center justify-between gap-2"><strong>Jellystat</strong>{renderConfigPill(!!diagnostics?.integrations?.jellystatConfigured)}</div>
                                        ) : (
                                            <div className="flex items-center justify-between gap-2"><strong>Tautulli</strong>{renderConfigPill(!!diagnostics?.integrations?.tautulliConfigured)}</div>
                                        )}
                                        <div className="flex items-center justify-between gap-2"><strong>Request App</strong>{renderOptionalPill(!!diagnostics?.integrations?.requestAppEnabled, !!diagnostics?.integrations?.requestAppConfigured)}</div>
                                        <div className="flex items-center justify-between gap-2"><strong>Analytics Cache</strong>{renderConfigPill(!!diagnostics?.caches?.analytics?.exists)}</div>
                                        <div className="flex items-center justify-between gap-2"><strong>Trending Cache</strong>{renderConfigPill(!!diagnostics?.caches?.trending?.exists)}</div>
                                        {mediaServerType !== 'jellyfin' && (
                                            <div className="flex items-center justify-between gap-2"><strong>Plex Stats Cache</strong>{renderConfigPill(!!diagnostics?.caches?.plexStats?.exists)}</div>
                                        )}
                                        <div className="flex items-center justify-between gap-2"><strong>Users File</strong>{renderConfigPill(!!diagnostics?.files?.users?.exists)}</div>
                                        <div className="flex items-center justify-between gap-2"><strong>Config File</strong>{renderConfigPill(!!diagnostics?.files?.config?.exists)}</div>
                                        <div className="flex items-center justify-between gap-2"><strong>Auto Backup</strong>{renderConfigPill(!!diagnostics?.backup?.enabled)}</div>
                                        <div><strong>Backup Files:</strong> {diagnostics?.backup?.availableBackups ?? 0}</div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted">No diagnostics loaded yet.</p>
                                )}
                            </section>

                            <section className="space-y-4 mb-8">
                                <h4 className="font-bold text-text">Job Queue</h4>
                                <div className="flex flex-col gap-3">
                                    {tasks.map(task => (
                                        <div key={`system-${task.id}`} className="py-3 border-b border-border/40 last:border-b-0">
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
                            </section>

                            <section className="space-y-4 mb-8">
                                <div className="flex items-center justify-between">
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
                                                <details key={entry.id} className="py-3 border-b border-border/40 last:border-b-0">
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
                            </section>
                        </div>
                    )}
                    {activeTab === 'logs' && (
                        <div className="mb-8 animate-fade-in space-y-8">
                            <h3 className="text-xl font-bold text-plex mb-4 border-b border-border pb-2">Logs & Audit</h3>

                            <section className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-bold text-text">Deleted User Blocklist</h4>
                                    <span className="px-2 py-1 rounded text-xs font-semibold bg-red-500/20 text-red-300">{deletedUsersLog.length}</span>
                                </div>
                                <div className="space-y-2">
                                    {deletedUsersLog.length === 0 ? (
                                        <p className="text-sm text-muted">No deleted users are currently blocked.</p>
                                    ) : (
                                        deletedUsersLog.map((deletedUser) => (
                                            <div key={deletedUser.blockId} className="py-3 border-b border-border/40 flex items-center justify-between gap-3 last:border-b-0">
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
                            </section>

                            <section className="space-y-3">
                                <div className="flex items-center justify-between">
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
                                            <div key={entry.id} className="py-3 border-b border-border/40 last:border-b-0">
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
                            </section>
                        </div>
                    )}
                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-4 mt-8 pb-1">
                    <button className="w-full sm:w-auto px-6 py-3 bg-plex text-background rounded-lg font-bold hover:bg-plex-hover transition-colors flex items-center justify-center gap-2 shadow-lg shadow-plex/10" onClick={handleSave}>{activeTab === 'stream-rules' ? 'Save Stream Rules' : 'Save Settings'}</button>
                </div>
            </div>
        </div>
    );
};
