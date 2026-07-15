import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Copy, ChevronUp, ChevronDown, Check, BookOpen } from 'lucide-react';
import { apiFetch } from '../shared/api';
import { portalUrl, resolvePortalAssetUrl } from '../shared/basePath';
import { appConfirm } from '../shared/confirm';
import { CustomSelect, SettingsSwitch, SettingsToggleRow } from '../shared/ui';
import { Loader, ToastContainer, pushToast, type ToastMessage } from '../shared/toast';
import { SettingHint, SettingFieldLabel } from './SettingHint';
import type { User, AuditEntry, DeletedUser, PlexServer, ArrInstance } from '../shared/types';
import { formatDateTime, formatEventName, hexToRgb, accentHoverRgb, getDaysUntilExpiry, addMonths, addYears, formatDate } from '../shared/format';

import { StreamKillRulesPanel } from './StreamKillRulesPanel';
import { InvitesSettings } from './InvitesSettings';
import { StatusMonitorSettings } from './StatusMonitorSettings';
import { BroadcastSettingsTab } from './BroadcastSettingsTab';
import { IntegrationTestButton } from '../shared/IntegrationTestButton';
import { HomeLayoutSettings } from './HomeLayoutSettings';
import { ArrInstancesPanel } from './ArrInstancesPanel';
import { DISCOVER_LANGUAGE_OPTIONS, DISCOVER_REGION_OPTIONS } from './discoverySettingsOptions';
import { DEFAULT_DASHBOARD_LAYOUT, normalizeSectionLayout, type DashboardLayoutConfig } from '../shared/dashboardLayout';
import {
    SETTINGS_TAB_GROUPS,
    buildSettingsHash,
    getSettingsSectionElementId,
    parseSettingsHash,
    recordRecentSetting,
    resolveSettingsEntry,
    type SettingsIndexEntry,
    type SettingsTabId,
} from './settingsIndex';
import { SettingsSearchPanel } from './SettingsSearchPanel';
import { UPGRADER_PRESET_SELECT_OPTIONS } from '../upgrader/presets';

const normalizeArrInstancesFromSettings = (settings: Record<string, any> = {}): ArrInstance[] => {
    if (Array.isArray(settings.arrInstances) && settings.arrInstances.length > 0) {
        return settings.arrInstances.map((entry: ArrInstance) => ({ ...entry }));
    }
    const instances: ArrInstance[] = [];
    if (settings.sonarrUrl || settings.sonarrApiKey) {
        instances.push({
            id: 'sonarr-default',
            type: 'sonarr',
            name: 'Sonarr',
            url: settings.sonarrUrl || '',
            apiKey: settings.sonarrApiKey || '',
            enabled: true,
            isDefault: true,
        });
    }
    if (settings.radarrUrl || settings.radarrApiKey) {
        instances.push({
            id: 'radarr-default',
            type: 'radarr',
            name: 'Radarr',
            url: settings.radarrUrl || '',
            apiKey: settings.radarrApiKey || '',
            enabled: true,
            isDefault: true,
        });
    }
    return instances;
};

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
    tmdb: `${SELFHST_ICON_BASE}/tmdb.svg`,
};

const ProgramIcon: React.FC<{ app: string; label: string }> = ({ app, label }) => (
    <span className="inline-flex w-8 h-8 rounded-lg bg-white/5 border border-white/10 items-center justify-center overflow-hidden flex-shrink-0">
        {APP_ICONS[app] ? (
            <img
                src={APP_ICONS[app]}
                alt=""
                className="w-5 h-5 object-contain"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
        ) : (
            <span className="text-[10px] font-black text-plex">{label.slice(0, 2).toUpperCase()}</span>
        )}
        <span className="sr-only">{label}</span>
    </span>
);

const IntegrationHeading: React.FC<{ app: string; title: string; subtitle?: string; className?: string }> = ({ app, title, subtitle, className = '' }) => (
    <div className={`integration-heading border-b border-border pb-3 mb-4 ${className}`}>
        <div className="grid grid-cols-[2rem_1fr] gap-x-3 gap-y-0.5">
            <div className="row-start-1 self-center">
                <ProgramIcon app={app} label={title} />
            </div>
            <h3 className="integration-heading-title text-xl font-bold text-text leading-tight min-w-0 col-start-2 row-start-1">{title}</h3>
            {subtitle && <p className="text-xs text-muted col-start-2 row-start-2">{subtitle}</p>}
        </div>
    </div>
);

const JELLYFIN_BRAND_LOGO_URL = '/api/jellyfin/branding/icon';
const JELLYFIN_BRAND_BACKGROUND_URL = '/api/jellyfin/branding/splash';

export const SettingsDashboard: React.FC = () => {
    const [statusDraft, setStatusDraft] = useState<any>(null);
    const [isLoading, setLoading] = useState(true);
    const [configLoadError, setConfigLoadError] = useState<string | null>(null);
    const [initialSettings, setInitialSettings] = useState<any>({});
    const [isConfigLoaded, setIsConfigLoaded] = useState(false);
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
                setIsConfigLoaded(true);
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
            const result = await apiFetch('/api/config', { method: 'POST', body: JSON.stringify(newConfig) });
            const configData = await apiFetch('/api/config');
            if (configData.settings) {
                setInitialSettings(configData.settings);
            }
            window.dispatchEvent(new CustomEvent('portal-public-config-updated'));
            if (result?.seerrDiscoverySync && !result.seerrDiscoverySync.ok && !result.seerrDiscoverySync.skipped) {
                addToast(`Settings saved, but request app sync failed: ${result.seerrDiscoverySync.error}`, 'error');
            } else {
                addToast('Settings Saved!');
            }
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
    const [showUsernamesInAnalytics, setShowUsernamesInAnalytics] = useState(false);
    const [useTrendingSlideshowOnLogin, setUseTrendingSlideshowOnLogin] = useState(false);
    const [defaultLibraryIds, setDefaultLibraryIds] = useState<string[]>([]);
    const [libraries, setLibraries] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<SettingsTabId>(() => {
        const { tabId } = parseSettingsHash(window.location.hash);
        return tabId || 'branding';
    });
    const initialHash = parseSettingsHash(window.location.hash);
    const [activeSectionId, setActiveSectionId] = useState<string | null>(initialHash.sectionId);
    const [scrollToSection, setScrollToSection] = useState<string | null>(initialHash.sectionId);
    const [activeSettingId, setActiveSettingId] = useState<string | null>(() => {
        if (initialHash.tabId && initialHash.sectionId) return `${initialHash.tabId}/${initialHash.sectionId}`;
        return initialHash.tabId || 'branding';
    });
    const [highlightMaintenanceToggle, setHighlightMaintenanceToggle] = useState(false);

    const settingsTabGroups = SETTINGS_TAB_GROUPS;
    const settingsTabsFlat = settingsTabGroups.flatMap((group) => group.tabs);
    const visibleTabGroups = settingsTabGroups;

    const navigateToSetting = useCallback((entry: SettingsIndexEntry) => {
        setActiveTab(entry.tabId);
        setActiveSectionId(entry.sectionId || null);
        setScrollToSection(entry.sectionId || null);
        setActiveSettingId(entry.id);
        recordRecentSetting(entry.id);
    }, []);

    useEffect(() => {
        const hash = buildSettingsHash(activeTab, activeSectionId);
        if (window.location.hash !== hash) {
            window.history.replaceState({}, '', `${window.location.pathname}${window.location.search}${hash}`);
        }
    }, [activeTab, activeSectionId]);

    useEffect(() => {
        const syncTabFromHash = () => {
            const { tabId, sectionId } = parseSettingsHash(window.location.hash);
            if (tabId) {
                setActiveTab(tabId);
                setActiveSectionId(sectionId);
                setScrollToSection(sectionId);
                setActiveSettingId(sectionId ? `${tabId}/${sectionId}` : tabId);
            } else if (!window.location.hash) {
                setActiveTab('branding');
                setActiveSectionId(null);
                setScrollToSection(null);
                setActiveSettingId('branding');
            }
        };
        window.addEventListener('hashchange', syncTabFromHash);
        return () => window.removeEventListener('hashchange', syncTabFromHash);
    }, []);

    useEffect(() => {
        if (!scrollToSection) return;
        const timer = window.setTimeout(() => {
            const el = document.getElementById(getSettingsSectionElementId(scrollToSection));
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                el.classList.add('settings-section-highlight');
                window.setTimeout(() => el.classList.remove('settings-section-highlight'), 2200);
            }
            setScrollToSection(null);
        }, 120);
        return () => window.clearTimeout(timer);
    }, [activeTab, scrollToSection]);

    useEffect(() => {
        if (activeTab !== 'system') return;
        const url = new URL(window.location.href);
        if (url.searchParams.get('focus') !== 'maintenance-toggle') return;
        setHighlightMaintenanceToggle(true);
        setActiveSectionId('maintenance');
        setScrollToSection('maintenance');
        setActiveSettingId('system/maintenance');
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
    const [arrInstances, setArrInstances] = useState<ArrInstance[]>([]);
    const [savedArrInstances, setSavedArrInstances] = useState<ArrInstance[]>([]);
    const [tautulliUrl, setTautulliUrl] = useState('');
    const [tautulliApiKey, setTautulliApiKey] = useState('');
    const [jellystatUrl, setJellystatUrl] = useState('');
    const [jellystatApiKey, setJellystatApiKey] = useState('');
    const [requestAppType, setRequestAppType] = useState('none');
    const [requestAppUrl, setRequestAppUrl] = useState('');
    const [requestAppFetchUrl, setRequestAppFetchUrl] = useState('');
    const [requestAppApiKey, setRequestAppApiKey] = useState('');
    const [requestDiscoverRegion, setRequestDiscoverRegion] = useState('');
    const [requestDiscoverLanguage, setRequestDiscoverLanguage] = useState('');
    const [requestHideAvailableMedia, setRequestHideAvailableMedia] = useState(false);
    const [maintenanceExperimentalEnabled, setMaintenanceExperimentalEnabled] = useState(false);
    const [upgraderEnabled, setUpgraderEnabled] = useState(false);
    const [upgraderDefaultPreset, setUpgraderDefaultPreset] = useState('non_hevc');
    const [upgraderMinSizeGB, setUpgraderMinSizeGB] = useState(5);
    const [upgraderAutomationEnabled, setUpgraderAutomationEnabled] = useState(false);
    const [upgraderMaxActionsPerHour, setUpgraderMaxActionsPerHour] = useState(25);
    const [upgraderDefaultSort, setUpgraderDefaultSort] = useState('sizeGB');
    const [upgraderDrawerPosition, setUpgraderDrawerPosition] = useState('sidebar');
    const [upgraderProfileMap, setUpgraderProfileMap] = useState<Record<string, { hevcProfileId: number; fallbackProfileId?: number }>>({});
    const [upgraderProfileInstances, setUpgraderProfileInstances] = useState<any[]>([]);
    const [loadingUpgraderProfiles, setLoadingUpgraderProfiles] = useState(false);
    const [dashboardLayout, setDashboardLayout] = useState<DashboardLayoutConfig>(DEFAULT_DASHBOARD_LAYOUT);
    const dashboardLayoutRef = useRef<DashboardLayoutConfig>(DEFAULT_DASHBOARD_LAYOUT);

    const updateDashboardLayout = useCallback((next: DashboardLayoutConfig) => {
        dashboardLayoutRef.current = next;
        setDashboardLayout(next);
    }, []);

    // Branding & UI States
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
    const [use24HourClock, setUse24HourClock] = useState(initialSettings?.use24HourClock || false);
    const [showPosterQualityBadges, setShowPosterQualityBadges] = useState(initialSettings?.showPosterQualityBadges !== false);
    const [showDashboardWatchingBadge, setShowDashboardWatchingBadge] = useState(!!initialSettings?.showDashboardWatchingBadge);
    const [dashboardWatchingBadgePollSeconds, setDashboardWatchingBadgePollSeconds] = useState(
        Math.min(15, Math.max(1, Number(initialSettings?.dashboardWatchingBadgePollSeconds) || 15)),
    );
    const [showPublicStatusMonitor, setShowPublicStatusMonitor] = useState(initialSettings?.showPublicStatusMonitor !== false);
    const [showPublicLibraryStats, setShowPublicLibraryStats] = useState(initialSettings?.showPublicLibraryStats !== false);
    const [allowTemporaryAccess, setAllowTemporaryAccess] = useState(initialSettings?.allowTemporaryAccess || false);
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
        if (isConfigLoaded) {
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
            const loadedArrInstances = normalizeArrInstancesFromSettings(initialSettings);
            setArrInstances(loadedArrInstances);
            setSavedArrInstances(loadedArrInstances.map((entry) => ({ ...entry })));
            setTautulliUrl(initialSettings.tautulliUrl || '');
            setTautulliApiKey(initialSettings.tautulliApiKey || '');
            setJellystatUrl(initialSettings.jellystatUrl || '');
            setJellystatApiKey(initialSettings.jellystatApiKey || '');
            setRequestAppType(initialSettings.requestAppType === 'overseerr' ? 'seerr' : (initialSettings.requestAppType || 'none'));
            setRequestAppUrl(initialSettings.requestAppUrl || '');
            setRequestAppFetchUrl(initialSettings.requestAppFetchUrl || '');
            setRequestAppApiKey(initialSettings.requestAppApiKey || '');
            setRequestDiscoverRegion(initialSettings.requestDiscoverRegion || '');
            setRequestDiscoverLanguage(initialSettings.requestDiscoverLanguage || '');
            setRequestHideAvailableMedia(!!initialSettings.requestHideAvailableMedia);
            const savedBrandingTheme = localStorage.getItem('portal-theme') || initialSettings.brandingTheme || 'plex';
            setBrandingTheme(savedBrandingTheme);
            setCustomLogoUrl(initialSettings.customLogoUrl || '');
            setBackgroundImageUrl(initialSettings.backgroundImageUrl || '');
            setUseScrollRevealAnimations(!!initialSettings.useScrollRevealAnimations);
            setUseCinematicLoading(!!initialSettings.useCinematicLoading);
            setUseBrandedSkeleton(initialSettings.useBrandedSkeleton !== false);
            setUseTrendingSlideshow(!!initialSettings.useTrendingSlideshow);
            setTrendingSlideshowInterval(initialSettings.trendingSlideshowInterval || 30);
            setTmdbApiKey(initialSettings.tmdbApiKey || '');
            setReferralEnabled(!!initialSettings.referralEnabled);
            setReferralTrialDays(initialSettings.referralTrialDays || 3);
            setReferralRewardDays(initialSettings.referralRewardDays || 7);
            setAnnouncement(initialSettings.announcement || '');
            if (initialSettings.navOrder) setNavOrder(ensureMaintenanceNavOrder(initialSettings.navOrder));
            setHideStreamUsers(initialSettings.hideStreamUsers === true ? 'anonymous' : (initialSettings.hideStreamUsers || 'false'));
            setShowUsernamesInAnalytics(!!initialSettings.showUsernamesInAnalytics);
            setUseTrendingSlideshowOnLogin(initialSettings.useTrendingSlideshowOnLogin !== false);
            if (initialSettings.defaultLibraryIds) setDefaultLibraryIds(initialSettings.defaultLibraryIds);
            if (initialSettings.use24HourClock !== undefined) setUse24HourClock(!!initialSettings.use24HourClock);
            if (initialSettings.showPosterQualityBadges !== undefined) setShowPosterQualityBadges(initialSettings.showPosterQualityBadges !== false);
            if (initialSettings.showDashboardWatchingBadge !== undefined) setShowDashboardWatchingBadge(!!initialSettings.showDashboardWatchingBadge);
            if (initialSettings.dashboardWatchingBadgePollSeconds !== undefined) {
                setDashboardWatchingBadgePollSeconds(Math.min(15, Math.max(1, Number(initialSettings.dashboardWatchingBadgePollSeconds) || 15)));
            }
            if (initialSettings.showPublicStatusMonitor !== undefined) setShowPublicStatusMonitor(initialSettings.showPublicStatusMonitor !== false);
            if (initialSettings.showPublicLibraryStats !== undefined) setShowPublicLibraryStats(initialSettings.showPublicLibraryStats !== false);
            if (initialSettings.allowTemporaryAccess !== undefined) setAllowTemporaryAccess(!!initialSettings.allowTemporaryAccess);
            if (initialSettings.autoBackupEnabled !== undefined) setAutoBackupEnabled(!!initialSettings.autoBackupEnabled);
            if (initialSettings.autoBackupIntervalDays !== undefined) setAutoBackupIntervalDays(Number(initialSettings.autoBackupIntervalDays) || 2);
            if (initialSettings.autoBackupRetentionCount !== undefined) setAutoBackupRetentionCount(Number(initialSettings.autoBackupRetentionCount) || 10);
            if (initialSettings.maintenanceExperimentalEnabled !== undefined) setMaintenanceExperimentalEnabled(!!initialSettings.maintenanceExperimentalEnabled);
            if (initialSettings.upgraderEnabled !== undefined) setUpgraderEnabled(!!initialSettings.upgraderEnabled);
            if (initialSettings.upgraderDefaultPreset) setUpgraderDefaultPreset(initialSettings.upgraderDefaultPreset);
            if (initialSettings.upgraderMinSizeGB !== undefined) setUpgraderMinSizeGB(Math.max(0, Number(initialSettings.upgraderMinSizeGB) || 5));
            if (initialSettings.upgraderAutomationEnabled !== undefined) setUpgraderAutomationEnabled(!!initialSettings.upgraderAutomationEnabled);
            if (initialSettings.upgraderMaxActionsPerHour !== undefined) setUpgraderMaxActionsPerHour(Math.max(1, Number(initialSettings.upgraderMaxActionsPerHour) || 25));
            if (initialSettings.upgraderDefaultSort) setUpgraderDefaultSort(initialSettings.upgraderDefaultSort);
            if (initialSettings.upgraderDrawerPosition) setUpgraderDrawerPosition(initialSettings.upgraderDrawerPosition);
            if (initialSettings.upgraderProfileMap && typeof initialSettings.upgraderProfileMap === 'object') {
                setUpgraderProfileMap(initialSettings.upgraderProfileMap);
            }
            const layout = normalizeSectionLayout(initialSettings.dashboardLayout);
            dashboardLayoutRef.current = layout;
            setDashboardLayout(layout);
            setTestRecipient('');
            setServers([]);
        }
    }, [initialSettings, isConfigLoaded]);

    useEffect(() => {
        if (!upgraderEnabled) {
            setUpgraderProfileInstances([]);
            return;
        }
        let cancelled = false;
        setLoadingUpgraderProfiles(true);
        apiFetch('/api/upgrader/profiles')
            .then((data) => {
                if (cancelled) return;
                setUpgraderProfileInstances(Array.isArray(data?.instances) ? data.instances : []);
            })
            .catch(() => {
                if (!cancelled) setUpgraderProfileInstances([]);
            })
            .finally(() => {
                if (!cancelled) setLoadingUpgraderProfiles(false);
            });
        return () => { cancelled = true; };
    }, [upgraderEnabled]);

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
            arrInstances,
            tautulliUrl,
            tautulliApiKey,
            jellystatUrl,
            jellystatApiKey,
            requestAppType,
            requestAppUrl,
            requestAppFetchUrl,
            requestAppApiKey,
            requestDiscoverRegion,
            requestDiscoverLanguage,
            requestHideAvailableMedia,
            primaryColor: '',
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
            showUsernamesInAnalytics,
            useTrendingSlideshowOnLogin,
            defaultLibraryIds,
            use24HourClock,
            allowTemporaryAccess,
            showPosterQualityBadges,
            showDashboardWatchingBadge,
            dashboardWatchingBadgePollSeconds,
            showPublicStatusMonitor,
            showPublicLibraryStats,
            autoBackupEnabled,
            autoBackupIntervalDays,
            autoBackupRetentionCount,
            maintenanceExperimentalEnabled,
            upgraderEnabled,
            upgraderDefaultPreset,
            upgraderMinSizeGB,
            upgraderAutomationEnabled,
            upgraderMaxActionsPerHour,
            upgraderDefaultSort,
            upgraderDrawerPosition,
            upgraderProfileMap,
            dashboardLayout: normalizeSectionLayout(dashboardLayoutRef.current)
        });
    };
    const applyJellyfinBranding = () => {
        setCustomLogoUrl(JELLYFIN_BRAND_LOGO_URL);
        setBackgroundImageUrl(JELLYFIN_BRAND_BACKGROUND_URL);
        setLogoFile(null);
        addToast('Jellyfin server icon and splash background applied. Save settings to publish.');
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
        <div className="w-full flex flex-col box-border">
            <Loader isLoading={isLoading} />
            <ToastContainer toasts={toasts} setToasts={setToasts} />

            {configLoadError && (
                <div className="mb-6 p-4 rounded-xl border border-red-500/40 bg-red-500/10 text-red-200 text-sm">
                    Could not load settings: {configLoadError}. Try refreshing the page. If this persists on Docker, confirm your session cookie is valid and the container can reach the API.
                </div>
            )}

            <div className="w-full flex flex-col min-w-0">
                <div className="w-full md:grid md:grid-cols-[18rem_minmax(0,1fr)] md:gap-8 xl:gap-10 md:items-start">
                    {/* Mobile Dropdown Category Select */}
                    <div className="block md:hidden mb-6 space-y-4">
                        <h1 className="text-xl font-bold text-plex">Settings</h1>
                        <SettingsSearchPanel onSelect={navigateToSetting} activeEntryId={activeSettingId} />
                        <div>
                        <label htmlFor="settings-tab-select" className="text-muted text-xs uppercase tracking-wider font-bold mb-2 block">Settings Category</label>
                        <CustomSelect
                            id="settings-tab-select"
                            value={activeTab}
                            onChange={(val) => {
                                const entry = resolveSettingsEntry(val);
                                if (entry) navigateToSetting(entry);
                            }}
                            options={settingsTabsFlat.map(tab => ({ label: tab.label, value: tab.id }))}
                        />
                        </div>
                    </div>

                    {/* Desktop Sidebar Navigation — sticky within the main scroll area */}
                    <aside className="hidden md:flex md:flex-col w-72 shrink-0 sticky top-0 self-start glass-card nav-shell p-4 shadow-2xl z-10">
                        <h1 className="text-2xl font-bold text-plex px-2 mb-3 shrink-0">Settings</h1>
                        <SettingsSearchPanel onSelect={navigateToSetting} activeEntryId={activeSettingId} />
                        <div className="mt-2.5">
                        {visibleTabGroups.length === 0 ? (
                            <p className="text-xs text-muted px-2 py-2">No settings sections found.</p>
                        ) : (
                            <div className="space-y-2">
                                {visibleTabGroups.map(group => (
                                    <div key={group.title}>
                                        <p className="text-[10px] uppercase tracking-wider font-bold text-plex px-2 mb-0.5">{group.title}</p>
                                        <div className="space-y-0.5">
                                            {group.tabs.map(tab => (
                                                <button
                                                    key={tab.id}
                                                    onClick={() => navigateToSetting({ id: tab.id, tabId: tab.id as SettingsTabId, label: tab.label, group: group.title, keywords: tab.keywords || [] })}
                                                    className={`w-full text-left px-2 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === tab.id
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
                        </div>
                    </aside>

                    <div className="min-w-0 w-full">
                        <div className="settings-panel">
                        {activeTab === 'stream-rules' && <StreamKillRulesPanel addToast={addToast} registerSaveHandler={(handler) => { streamRulesSaveHandlerRef.current = handler; }} />}
    
                        {activeTab === 'plex' && (
                            <div className="mb-8">
                                <h3 className="text-xl font-bold text-plex mb-4 border-b border-border pb-2">Media Server Integration</h3>
                                <div id={getSettingsSectionElementId('connection')} className="scroll-mt-24 mb-4">
                                    <SettingFieldLabel
                                        htmlFor="mediaServerType"
                                        hint={(
                                            <SettingHint>
                                                Choose the media server used for portal authentication and server-specific integrations.
                                            </SettingHint>
                                        )}
                                    >
                                        Media Server Type
                                    </SettingFieldLabel>
                                    <CustomSelect
                                        id="mediaServerType"
                                        value={mediaServerType}
                                        onChange={(val) => setMediaServerType(val === 'jellyfin' ? 'jellyfin' : 'plex')}
                                        options={[
                                            { label: 'Plex', value: 'plex' },
                                            { label: 'Jellyfin', value: 'jellyfin' }
                                        ]}
                                    />
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
                                    <SettingFieldLabel
                                        htmlFor="plexToken"
                                        hint={(
                                            <SettingHint>
                                                Needed to fetch users and manage access. <a href="https://support.plex.tv/articles/204059436-finding-an-authentication-token-x-plex-token/" target="_blank" rel="noopener noreferrer">How to find your token.</a>
                                            </SettingHint>
                                        )}
                                    >
                                        Plex Token
                                    </SettingFieldLabel>
                                    <input className="w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all" id="plexToken" type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="Enter your X-Plex-Token" />
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
                                    <p className="mt-3 text-sm text-muted inline-flex items-center gap-1.5 flex-wrap">
                                        <span>Saved server: <strong>{selectedServer || initialSettings.serverIdentifier}</strong></span>
                                    </p>
                                )}
                                {servers.length > 0 && (
                                    <div className="mb-4" style={{ marginTop: '1rem' }}>
                                        <SettingFieldLabel htmlFor="serverSelect">Select Server</SettingFieldLabel>
                                        <CustomSelect
                                            id="serverSelect"
                                            value={selectedServer}
                                            onChange={val => setSelectedServer(val)}
                                            options={servers.map(s => ({ label: `${s.name} (${s.identifier})`, value: s.identifier }))}
                                        />
                                        {initialSettings.serverIdentifier && (
                                            <p className="mt-2 text-xs text-muted">
                                                Currently saved server ID: <strong>{initialSettings.serverIdentifier}</strong>
                                            </p>
                                        )}
                                    </div>
                                )}
                                <div className="mb-4" style={{ marginTop: '1rem' }}>
                                    <SettingFieldLabel
                                        htmlFor="plexServerUrl"
                                        hint={(
                                            <SettingHint>
                                                Your Plex server&apos;s LAN address. Use this when Plex.tv discovery fails from inside the container (e.g. <code className="text-xs">getaddrinfo EAI_AGAIN …plex.direct</code> errors).
                                            </SettingHint>
                                        )}
                                    >
                                        Direct Plex URL{' '}
                                        <span className="text-muted font-normal normal-case">(required in Docker)</span>
                                    </SettingFieldLabel>
                                    <input
                                        className="w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all"
                                        id="plexServerUrl"
                                        type="url"
                                        value={plexServerUrl}
                                        onChange={(e) => setPlexServerUrl(e.target.value)}
                                        placeholder="http://192.168.1.6:32400"
                                    />
                                </div>
                                <div className="mb-4" style={{ marginTop: '1rem' }}>
                                    <SettingFieldLabel
                                        htmlFor="checkInterval"
                                        hint={<SettingHint>How often to check for expired users in the background.</SettingHint>}
                                    >
                                        Check Interval (minutes)
                                    </SettingFieldLabel>
                                    <input className="w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all" id="checkInterval" type="number" value={checkInterval} onChange={e => setCheckInterval(Number(e.target.value))} min="1" />
                                </div>

                                {libraries.length > 0 && (
                                    <div id={getSettingsSectionElementId('libraries')} className="mb-4 mt-4 scroll-mt-24">
                                        <SettingFieldLabel
                                            hint={(
                                                <SettingHint>
                                                    Libraries to share automatically when users request temporary access or link their account. Leave empty to share ALL libraries.
                                                </SettingHint>
                                            )}
                                        >
                                            Default Temporary Access/Automated Libraries
                                        </SettingFieldLabel>
                                        <div className="flex flex-wrap gap-3 mt-2">
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
                                </div>

                                <div id={getSettingsSectionElementId('privacy')} className="mb-4 mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 border-b border-border/40 scroll-mt-24">
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

                                <div id={getSettingsSectionElementId('analytics-usernames')} className="scroll-mt-24">
                                <SettingsToggleRow
                                    title="Show Usernames in Analytics"
                                    description="Allow non-admin users to see real usernames on the Analytics dashboard. If disabled, usernames are shown as Viewer 1, Viewer 2, etc."
                                    checked={showUsernamesInAnalytics}
                                    onChange={setShowUsernamesInAnalytics}
                                />
                                </div>

                                <div className="mb-4" style={{ marginTop: '1rem' }}>
                                    <SettingFieldLabel
                                        htmlFor="requestUrl"
                                        hint={<SettingHint>The URL users are redirected to when they click the Request Content button.</SettingHint>}
                                    >
                                        Request URL
                                    </SettingFieldLabel>
                                    <input className="w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all" id="requestUrl" type="text" value={requestUrl} onChange={e => setRequestUrl(e.target.value)} placeholder="https://yourdomain.com" />
                                </div>
                                <div className="mb-4" style={{ marginTop: '1rem' }}>
                                    <SettingFieldLabel
                                        htmlFor="contactUrl"
                                        hint={<SettingHint>Used for the "Request Extension" button in expiry emails. Defaults to sending an email to the SMTP User.</SettingHint>}
                                    >
                                        Contact URL / Email
                                    </SettingFieldLabel>
                                    <input className="w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all" id="contactUrl" type="text" value={contactUrl} onChange={e => setContactUrl(e.target.value)} placeholder="mailto:youremail@example.com OR https://wa.me/123456" />
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
                            <div className="flex flex-col md:flex-row gap-4 mb-4 md:items-center">
                                <div className="flex-[2]">
                                    <label htmlFor="smtpFrom">Sender Address (From)</label>
                                    <input className="w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all" id="smtpFrom" type="text" value={smtpFrom} onChange={e => setSmtpFrom(e.target.value)} placeholder="Server Manager Portal <noreply@yourdomain.com>" />
                                </div>
                                <div className="flex-1">
                                    <SettingsToggleRow
                                        title="SSL / Secure"
                                        checked={smtpSecure}
                                        onChange={setSmtpSecure}
                                        border={false}
                                        className="!py-0"
                                    />
                                </div>
                            </div>
                            <div className="mb-4">
                                <SettingFieldLabel
                                    htmlFor="emailDaysBefore"
                                    hint={<SettingHint>Automated notification email will be sent when user has this many days left.</SettingHint>}
                                >
                                    Warning Alert Threshold (Days Before Expiry)
                                </SettingFieldLabel>
                                <input className="w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all" id="emailDaysBefore" type="number" value={emailDaysBefore} onChange={e => setEmailDaysBefore(Number(e.target.value))} min="0" />
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
                                <SettingFieldLabel
                                    htmlFor="newsletterFrequency"
                                    hint={<SettingHint>How often should users receive the newsletter.</SettingHint>}
                                >
                                    Frequency
                                </SettingFieldLabel>
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
                                        <SettingFieldLabel
                                            htmlFor="publicDomain"
                                            hint={<SettingHint>Your public URL. This is required to host the posters inside the email.</SettingHint>}
                                        >
                                            Public Domain
                                        </SettingFieldLabel>
                                        <input className="w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all" id="publicDomain" type="text" value={publicDomain} onChange={e => setPublicDomain(e.target.value)} placeholder="https://portal.yourdomain.com" />
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

                            <SettingsToggleRow
                                title="Enable Automated Cleanup"
                                description="Run cleanup job automatically in the background"
                                checked={inactiveCleanupEnabled}
                                onChange={setInactiveCleanupEnabled}
                                border={false}
                                className="mb-6"
                            />

                            <div className={`transition-all ${!inactiveCleanupEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
                                <div className="mb-4">
                                    <SettingFieldLabel
                                        htmlFor="inactiveCleanupDays"
                                        hint={<SettingHint>Revoke access if a user has not watched anything in this many days.</SettingHint>}
                                    >
                                        Inactivity Threshold (Days)
                                    </SettingFieldLabel>
                                    <input
                                        className="w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all"
                                        id="inactiveCleanupDays"
                                        type="number"
                                        min="1"
                                        value={inactiveCleanupDays}
                                        onChange={e => setInactiveCleanupDays(Number(e.target.value))}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === 'mediastack' && (
                        <div className="mb-8 animate-fade-in">
                            <div id={getSettingsSectionElementId('arr')} className="scroll-mt-24">
                            <ArrInstancesPanel
                                type="sonarr"
                                title="Sonarr Instances"
                                subtitle="TV series automation"
                                instances={arrInstances.filter((entry) => entry.type === 'sonarr')}
                                savedInstances={savedArrInstances.filter((entry) => entry.type === 'sonarr')}
                                libraries={libraries}
                                allInstances={arrInstances}
                                onChange={(nextSonarr) => {
                                    const other = arrInstances.filter((entry) => entry.type !== 'sonarr');
                                    setArrInstances([...other, ...nextSonarr]);
                                }}
                                onMessage={(msg, ok) => addToast(msg, ok ? 'success' : 'error')}
                            />

                            <ArrInstancesPanel
                                type="radarr"
                                title="Radarr Instances"
                                subtitle="Movie automation"
                                className="mt-10"
                                instances={arrInstances.filter((entry) => entry.type === 'radarr')}
                                savedInstances={savedArrInstances.filter((entry) => entry.type === 'radarr')}
                                libraries={libraries}
                                allInstances={arrInstances}
                                onChange={(nextRadarr) => {
                                    const other = arrInstances.filter((entry) => entry.type !== 'radarr');
                                    setArrInstances([...other, ...nextRadarr]);
                                }}
                                onMessage={(msg, ok) => addToast(msg, ok ? 'success' : 'error')}
                            />
                            </div>

                            <div id={getSettingsSectionElementId('tmdb')} className="scroll-mt-24">
                            <IntegrationHeading app="tmdb" title="TMDB Integration" subtitle="Worldwide trending backgrounds" className="mt-8" />
                            <div className="mb-4">
                                <SettingFieldLabel
                                    htmlFor="tmdbApiKey"
                                    hint={<SettingHint>Used to fetch worldwide trending media backgrounds for the portal slideshow. Get one for free at themoviedb.org.</SettingHint>}
                                >
                                    TMDB API Key
                                </SettingFieldLabel>
                                <input className="w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all" id="tmdbApiKey" type="password" value={tmdbApiKey} onChange={(e) => setTmdbApiKey(e.target.value)} placeholder="Enter TMDB API Key" />
                            </div>
                            </div>
                            <div id={getSettingsSectionElementId('tautulli')} className="scroll-mt-24">
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
                            </div>

                            <div id={getSettingsSectionElementId('jellystat')} className="scroll-mt-24">
                            <IntegrationHeading app="jellystat" title="Jellystat Integration" subtitle="Jellyfin activity and analytics" className="mt-8" />
                            <div className="mb-4">
                                <SettingFieldLabel
                                    htmlFor="jellystatUrl"
                                    hint={<SettingHint>The URL to your Jellystat instance. Jellystat is the Jellyfin analytics companion, similar to Tautulli for Plex.</SettingHint>}
                                >
                                    Jellystat URL
                                </SettingFieldLabel>
                                <input className="w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all" id="jellystatUrl" type="text" value={jellystatUrl} onChange={(e) => setJellystatUrl(e.target.value)} placeholder="http://localhost:3000" />
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
                            </div>

                            <div id={getSettingsSectionElementId('seerr')} className="scroll-mt-24">
                            <IntegrationHeading
                                app={requestAppType === 'none' ? 'seerr' : requestAppType}
                                title="Request App Integration"
                                subtitle="Seerr, Jellyseerr, or Ombi for media requests"
                                className="mt-8"
                            />
                            <div className="mb-4">
                                <SettingFieldLabel
                                    htmlFor="requestAppType"
                                    hint={<SettingHint>Used by Library Maintenance rules for request-age/status filtering and cleanup workflows.</SettingHint>}
                                >
                                    Request App Type
                                </SettingFieldLabel>
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
                            </div>
                            <div className="mb-4">
                                <SettingFieldLabel
                                    htmlFor="requestAppUrl"
                                    hint={(
                                        <SettingHint>
                                            Public URL users see (reverse proxy is fine). Server-side API calls use the internal fetch URL below when set.
                                        </SettingHint>
                                    )}
                                >
                                    Request App URL
                                </SettingFieldLabel>
                                <input className="w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all" id="requestAppUrl" type="text" value={requestAppUrl} onChange={(e) => setRequestAppUrl(e.target.value)} placeholder="https://requests.yourdomain.com" />
                            </div>
                            <div className="mb-4">
                                <SettingFieldLabel
                                    htmlFor="requestAppFetchUrl"
                                    hint={(
                                        <SettingHint>
                                            Optional. URL the portal uses to talk to Seerr from inside Docker (e.g. <code>http://jellyseerr:5055</code> or <code>http://192.168.1.10:5055</code>). Leave blank to use the public URL above.
                                        </SettingHint>
                                    )}
                                >
                                    Internal fetch URL (optional)
                                </SettingFieldLabel>
                                <input className="w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all" id="requestAppFetchUrl" type="text" value={requestAppFetchUrl} onChange={(e) => setRequestAppFetchUrl(e.target.value)} placeholder="http://jellyseerr:5055" />
                            </div>
                            <div className="mb-8">
                                <label htmlFor="requestAppApiKey">Request App API Key</label>
                                <input className="w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all" id="requestAppApiKey" type="password" value={requestAppApiKey} onChange={(e) => setRequestAppApiKey(e.target.value)} placeholder="API key from request app settings" />
                            </div>
                            <IntegrationTestButton
                                type="requestApp"
                                payload={{ requestAppType, requestAppUrl, requestAppFetchUrl, requestAppApiKey }}
                                disabled={requestAppType === 'none' || !hasIntegrationCredentials(requestAppUrl, requestAppApiKey, initialSettings.requestAppUrl, initialSettings.requestAppApiKey)}
                                onMessage={(msg, ok) => addToast(msg, ok ? 'success' : 'error')}
                            />
                            </div>
                        </div>
                    )}

                    {activeTab === 'request' && (
                        <div className="mb-8 animate-fade-in space-y-6">
                            <h3 className="text-xl font-bold text-plex mb-4 border-b border-border pb-2">Request Discovery</h3>
                            <p className="text-muted text-sm max-w-3xl">
                                Control how the in-portal Discover experience behaves. These settings are synced to your Seerr/Overseerr instance when connected, matching Overseerr&apos;s main settings.
                            </p>

                            <div id={getSettingsSectionElementId('region')} className="scroll-mt-24">
                                <SettingFieldLabel
                                    htmlFor="requestDiscoverRegion"
                                    hint={<SettingHint>Prioritizes content for your region on discover pages. Does not fully restrict results to that country.</SettingHint>}
                                >
                                    Discover Region
                                </SettingFieldLabel>
                                <CustomSelect
                                    id="requestDiscoverRegion"
                                    value={requestDiscoverRegion}
                                    onChange={setRequestDiscoverRegion}
                                    options={DISCOVER_REGION_OPTIONS}
                                />
                            </div>

                            <div id={getSettingsSectionElementId('language')} className="scroll-mt-24">
                                <SettingFieldLabel
                                    htmlFor="requestDiscoverLanguage"
                                    hint={<SettingHint>Only show titles whose original language matches your selection on discover browse pages.</SettingHint>}
                                >
                                    Discover Language
                                </SettingFieldLabel>
                                <CustomSelect
                                    id="requestDiscoverLanguage"
                                    value={requestDiscoverLanguage}
                                    onChange={setRequestDiscoverLanguage}
                                    options={DISCOVER_LANGUAGE_OPTIONS}
                                />
                            </div>

                            <div id={getSettingsSectionElementId('hide-available')} className="scroll-mt-24">
                                <SettingsToggleRow
                                    title="Hide Available Media"
                                    hint={(
                                        <SettingHint>
                                            Hides titles already in your library from discover browse pages (home rows, movies, series, studios, networks). Search results are never filtered. The portal applies this immediately; it also syncs to Seerr when connected.
                                        </SettingHint>
                                    )}
                                    checked={requestHideAvailableMedia}
                                    onChange={setRequestHideAvailableMedia}
                                    border={false}
                                />
                                <span className="inline-flex items-center rounded-md bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-300 border border-amber-500/20 mt-2">
                                    Experimental
                                </span>
                            </div>

                            {requestAppType === 'none' && (
                                <p className="text-sm text-yellow-300/90 border border-yellow-500/20 bg-yellow-500/10 rounded-lg px-4 py-3">
                                    Connect a request app under Integrations to sync these settings automatically.
                                </p>
                            )}
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
                                        'home': 'Home', 'discover': 'Discover', 'status': 'Status', 'logs': 'Logs (Admin Only)', 'analytics': 'Analytics', 'mediastack': 'Integrations', 'maintenance': 'Cleaner (Admin Only)', 'upgrader': 'Upgrader (Admin Only)', 'requests': 'Requests (Admin Only)', 'request': 'Request Content', 'settings': 'Settings (Admin Only)', 'logout': 'Logout'
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
                            <div id={getSettingsSectionElementId('whatsapp')} className="mb-4 scroll-mt-24">
                                <SettingFieldLabel
                                    htmlFor="contactWhatsApp"
                                    hint={<SettingHint>Enter your phone number including country code, without any '+', spaces, or dashes. If left blank, the WhatsApp button will be hidden.</SettingHint>}
                                >
                                    WhatsApp Number (Optional)
                                </SettingFieldLabel>
                                <input className="w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all" id="contactWhatsApp" type="text" value={contactWhatsApp} onChange={(e) => setContactWhatsApp(e.target.value)} placeholder="e.g. 447303647923" />
                            </div>
                            <div id={getSettingsSectionElementId('email')} className="mb-4 scroll-mt-24">
                                <SettingFieldLabel
                                    htmlFor="contactEmail"
                                    hint={<SettingHint>The email address users should contact. If left blank, the Email button will be hidden.</SettingHint>}
                                >
                                    Email Address (Optional)
                                </SettingFieldLabel>
                                <input className="w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all" id="contactEmail" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="e.g. admin@example.com" />
                            </div>
                        </div>
                    )}

                    {activeTab === 'branding' && (
                        <div className="mb-8 animate-fade-in">
                            <h3 className="text-xl font-bold text-plex mb-4 border-b border-border pb-2">Branding & UI</h3>

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

                            <div id={getSettingsSectionElementId('logo')} className="mb-4 scroll-mt-24">
                                <SettingFieldLabel hint={<SettingHint>Provide a URL or upload a file. (Max 5MB)</SettingHint>}>
                                    Custom Logo
                                </SettingFieldLabel>
                                <div className="flex flex-col gap-2">
                                    <input type="url" className="w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex transition-all" value={customLogoUrl} onChange={e => setCustomLogoUrl(e.target.value)} placeholder="https://example.com/logo.png" />
                                    <span className="text-center text-muted font-bold text-sm">OR</span>
                                    <input type="file" accept="image/*" className="w-full p-2 rounded-lg border border-border bg-background text-muted text-sm outline-none focus:border-plex transition-all file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-white/10 file:text-text hover:file:bg-white/20 file:cursor-pointer cursor-pointer" onChange={e => setLogoFile(e.target.files?.[0] || null)} />
                                </div>
                            </div>
                            <div id={getSettingsSectionElementId('theme')} className="mb-8 relative z-[50] scroll-mt-24">
                                <SettingFieldLabel
                                    hint={<SettingHint>The default theme applied to new visitors and users. Users can still customize their local theme preference in the navigation menu.</SettingHint>}
                                >
                                    Portal Theme
                                </SettingFieldLabel>
                                <CustomSelect
                                    value={brandingTheme}
                                    onChange={setBrandingTheme}
                                    options={[
                                        { label: 'Dynamic (Chameleon)', value: 'dynamic' },
                                        { label: 'Plex Dark', value: 'plex' },
                                        { label: 'Sleek Slate', value: 'slate' },
                                        { label: 'Nordic Frost', value: 'nordic' },
                                        { label: 'Jellyfin Purple', value: 'jellyfin' },
                                        { label: 'Emerald Green', value: 'emerald' },
                                        { label: 'Neon Midnight', value: 'midnight' },
                                        { label: 'Crimson Red', value: 'crimson' },
                                        { label: 'Deep Amethyst', value: 'amethyst' },
                                        { label: 'Sunset Orange', value: 'sunset' },
                                    ]}
                                />
                            </div>

                            <SettingsToggleRow
                                title="Enable Scroll Reveal Animations"
                                hint={<SettingHint>Smoothly slide elements into place as you scroll down the dashboard.</SettingHint>}
                                checked={useScrollRevealAnimations}
                                onChange={setUseScrollRevealAnimations}
                                className="mb-4 mt-4"
                            />

                            <SettingsToggleRow
                                title="Enable Cinematic Loading Sequences"
                                hint={<SettingHint>Replaces the standard loading spinner with a beautiful SVG line-drawing animation.</SettingHint>}
                                checked={useCinematicLoading}
                                onChange={setUseCinematicLoading}
                                className="mb-4"
                            />

                            <SettingsToggleRow
                                title="Enable Branded Skeleton Loading"
                                hint={<SettingHint>Use a branded, animated shimmer effect for skeleton loaders instead of the default pulse.</SettingHint>}
                                checked={useBrandedSkeleton}
                                onChange={setUseBrandedSkeleton}
                                className="mb-4"
                            />

                            <div id={getSettingsSectionElementId('slideshow')} className="scroll-mt-24">
                            <SettingsToggleRow
                                title="Enable TMDB Trending Slideshow"
                                hint={<SettingHint>Replaces the static splash background with a fading slideshow of currently trending movies and shows from TMDB. Requires a TMDB API key in Integrations.</SettingHint>}
                                checked={useTrendingSlideshow}
                                onChange={setUseTrendingSlideshow}
                                className="mb-4"
                            >
                                <div className={`transition-all overflow-hidden ${useTrendingSlideshow ? 'max-h-[100px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
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
                            </SettingsToggleRow>
                            </div>

                            <SettingsToggleRow
                                title="Enable Slideshow on Login Page"
                                hint={<SettingHint>Display the TMDB trending slideshow background on the login and landing pages.</SettingHint>}
                                checked={useTrendingSlideshowOnLogin}
                                onChange={setUseTrendingSlideshowOnLogin}
                                className="mb-4"
                            />

                            <div className={`mb-4 transition-opacity ${useTrendingSlideshow ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                                <SettingFieldLabel
                                    hint={<SettingHint>Shown as a subtle splash image on the login screen and portal background.</SettingHint>}
                                >
                                    Static Splash Background Image
                                </SettingFieldLabel>
                                <input
                                    type="url"
                                    className="w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex transition-all"
                                    value={backgroundImageUrl}
                                    onChange={e => setBackgroundImageUrl(e.target.value)}
                                    placeholder="https://example.com/background.png"
                                />
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


                            <SettingsToggleRow
                                title="Use 24-Hour Clock across the Portal"
                                checked={use24HourClock}
                                onChange={setUse24HourClock}
                                className="mb-4"
                            />

                            <div id={getSettingsSectionElementId('poster-badges')} className="scroll-mt-24">
                            <SettingsToggleRow
                                title="Poster Quality Badges"
                                hint={(
                                    <SettingHint>
                                        Show quality badges on recently added and discover posters (4K, HDR, codec, Atmos).
                                        Applies to Home and Discover poster cards for all users.
                                    </SettingHint>
                                )}
                                checked={showPosterQualityBadges}
                                onChange={setShowPosterQualityBadges}
                                className="mb-4"
                            />
                            </div>

                            <div id={getSettingsSectionElementId('dashboard-watching-badge')} className="scroll-mt-24">
                            <SettingsToggleRow
                                title="Dashboard Watching Badge"
                                hint={(
                                    <SettingHint>
                                        Show a live count of people currently watching next to Dashboard in the sidebar.
                                        Polls your Plex or Jellyfin server on the interval below and counts unique viewers with an active stream.
                                    </SettingHint>
                                )}
                                checked={showDashboardWatchingBadge}
                                onChange={setShowDashboardWatchingBadge}
                                className="mb-4"
                            >
                                <div className={`transition-all overflow-hidden ${showDashboardWatchingBadge ? 'max-h-[120px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                                    <label className="text-sm font-medium text-muted">Poll Interval</label>
                                    <CustomSelect
                                        className="w-full mt-1"
                                        value={String(dashboardWatchingBadgePollSeconds)}
                                        onChange={(value) => setDashboardWatchingBadgePollSeconds(Math.min(15, Math.max(1, parseInt(value, 10) || 15)))}
                                        options={Array.from({ length: 15 }, (_, i) => {
                                            const seconds = i + 1;
                                            return {
                                                value: String(seconds),
                                                label: `${seconds} ${seconds === 1 ? 'Second' : 'Seconds'}`,
                                            };
                                        })}
                                    />
                                </div>
                            </SettingsToggleRow>
                            </div>

                            <SettingsToggleRow
                                title="Allow Temporary Access (Public Sign-ups)"
                                checked={allowTemporaryAccess}
                                onChange={setAllowTemporaryAccess}
                                className="mb-4"
                            />

                            <div className="mb-4 mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 border-b border-border/40">
                                <div>
                                    <h4 className="font-bold text-text">Show Status Monitor Before Login</h4>
                                    <SettingHint>Allow visitors without a session to open the status page and see monitored service health.</SettingHint>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer ml-4 flex-shrink-0">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={showPublicStatusMonitor}
                                        onChange={e => setShowPublicStatusMonitor(e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-background peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-text after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-plex"></div>
                                </label>
                            </div>

                            <div className="mb-4 mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 border-b border-border/40">
                                <div>
                                    <h4 className="font-bold text-text">Show Library Stats Before Login</h4>
                                    <SettingHint>Display public library counts on login and invite pages before users sign in.</SettingHint>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer ml-4 flex-shrink-0">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={showPublicLibraryStats}
                                        onChange={e => setShowPublicLibraryStats(e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-background peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-text after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-plex"></div>
                                </label>
                            </div>

                            <h3 id={getSettingsSectionElementId('announcement')} className="text-xl font-bold text-plex mb-4 border-b border-border pb-2 mt-8 scroll-mt-24">Announcements</h3>
                            <div className="mb-4">
                                <SettingFieldLabel hint={<SettingHint>If provided, this announcement will be prominently displayed to all users.</SettingHint>}>
                                    Portal Announcement Banner
                                </SettingFieldLabel>
                                <textarea className="w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex transition-all" value={announcement} onChange={e => setAnnouncement(e.target.value)} placeholder="E.g. Server maintenance scheduled for Friday..." rows={3}></textarea>
                                <div className="flex justify-end mt-2">
                                    <button
                                        onClick={handlePushAnnouncement}
                                        disabled={isPushingAnnouncement || !announcement}
                                        className="bg-plex hover:bg-plex-hover disabled:opacity-50 text-background font-bold py-1.5 px-4 rounded-lg transition-colors text-sm whitespace-nowrap"
                                    >
                                        {isPushingAnnouncement ? 'Pushing...' : 'Save & Send Email Blast'}
                                    </button>
                                </div>
                            </div>

                        </div>
                    )}

                    {activeTab === 'invites' && (
                        <InvitesSettings
                            addToast={addToast}
                            referralEnabled={referralEnabled}
                            setReferralEnabled={setReferralEnabled}
                            referralTrialDays={referralTrialDays}
                            setReferralTrialDays={setReferralTrialDays}
                            referralRewardDays={referralRewardDays}
                            setReferralRewardDays={setReferralRewardDays}
                        />
                    )}

                    {activeTab === 'tasks' && (
                        <div className="mb-8 animate-fade-in">
                            <h3 className="text-xl font-bold text-plex mb-4 border-b border-border pb-2">Background Tasks</h3>
                            <div className="flex flex-col gap-4">
                                {tasks.map(task => (
                                    <div key={task.id} className="py-4 border-b border-border/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                                <h4 className="font-bold text-lg">{task.name}</h4>
                                                {task.running ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.15)] animate-pulse">
                                                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping" />
                                                        Running
                                                    </span>
                                                ) : task.lastError ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                                                        <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                                                        Failed
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-500/10 text-muted border border-border">
                                                        Idle
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted mb-2">{task.description}</p>
                                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                                                <span><strong className="text-text">Last Run:</strong> {task.lastRun ? new Date(task.lastRun).toLocaleString() : 'Never'}</span>
                                                <span><strong className="text-text">Next Run:</strong> {task.nextRun ? new Date(task.nextRun).toLocaleString() : 'Not Scheduled'}</span>
                                                {task.lastDurationMs !== null && <span><strong className="text-text">Duration:</strong> {Math.round(task.lastDurationMs / 1000)}s</span>}
                                                {task.lastError && <span className="bg-red-500/20 text-red-300 px-2 py-1 rounded"><strong>Error:</strong> {task.lastError}</span>}
                                            </div>
                                        </div>
                                        <button
                                            className={`px-4 py-2 rounded-md font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                                                task.running
                                                    ? 'bg-slate-800 text-muted border border-border cursor-not-allowed opacity-60'
                                                    : 'bg-plex text-background hover:bg-plex-hover'
                                            }`}
                                            disabled={task.running}
                                            onClick={() => handleRunTask(task.id)}
                                        >
                                            {task.running ? (
                                                <>
                                                    <svg className="animate-spin h-4 w-4 text-muted" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    <span>Running...</span>
                                                </>
                                            ) : (
                                                'Run Now'
                                            )}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {activeTab === 'upgrader' && (
                        <div className="mb-8 animate-fade-in space-y-6">
                            <h3 className="text-xl font-bold text-plex mb-4 border-b border-border pb-2">Library Upgrader</h3>
                            <section id={getSettingsSectionElementId('upgrader')} className="space-y-3 scroll-mt-24">
                                <SettingsToggleRow
                                    title="Enable Library Upgrader"
                                    hint={<SettingHint>Standalone admin view to find non-HEVC titles with Plex or Jellyfin and Sonarr/Radarr deep links. OFF by default.</SettingHint>}
                                    checked={upgraderEnabled}
                                    onChange={setUpgraderEnabled}
                                    border={false}
                                />
                                <p className={`text-xs mt-2 font-semibold ${upgraderEnabled ? 'text-green-300' : 'text-yellow-300'}`}>
                                    Current status: {upgraderEnabled ? 'ON' : 'OFF'}
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                                    <div>
                                        <label className="font-semibold text-sm block mb-2">Default filter preset</label>
                                        <CustomSelect
                                            value={upgraderDefaultPreset}
                                            onChange={setUpgraderDefaultPreset}
                                            options={UPGRADER_PRESET_SELECT_OPTIONS}
                                        />
                                    </div>
                                    <div>
                                        <label className="font-semibold text-sm block mb-2">Large non-HEVC minimum size (GB)</label>
                                        <input
                                            type="number"
                                            min={0}
                                            step={0.5}
                                            className="w-full p-2 rounded border border-border bg-background text-text"
                                            value={upgraderMinSizeGB}
                                            onChange={(e) => setUpgraderMinSizeGB(Math.max(0, Number(e.target.value) || 0))}
                                        />
                                    </div>
                                </div>
                                <SettingsToggleRow
                                    title="Enable ARR automation"
                                    hint={<SettingHint>Allow Upgrader to switch Sonarr/Radarr quality profiles and trigger searches. Opt-in per action with dry-run preview.</SettingHint>}
                                    checked={upgraderAutomationEnabled}
                                    onChange={setUpgraderAutomationEnabled}
                                    border={false}
                                />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                                    <div>
                                        <label className="font-semibold text-sm block mb-2">Default sort</label>
                                        <CustomSelect
                                            value={upgraderDefaultSort}
                                            onChange={setUpgraderDefaultSort}
                                            options={[
                                                { value: 'sizeGB', label: 'Largest first' },
                                                { value: 'watchCount', label: 'Most watched' },
                                                { value: 'addedAt', label: 'Recently added' },
                                                { value: 'daysSinceAdded', label: 'Oldest added' },
                                                { value: 'staleAdded', label: 'Stale (old + unwatched)' },
                                                { value: 'title', label: 'Title A–Z' },
                                            ]}
                                        />
                                    </div>
                                    <div>
                                        <label className="font-semibold text-sm block mb-2">Drawer display mode</label>
                                        <CustomSelect
                                            value={upgraderDrawerPosition}
                                            onChange={setUpgraderDrawerPosition}
                                            options={[
                                                { value: 'sidebar', label: 'Right sidebar (default)' },
                                                { value: 'modal', label: 'Center modal' },
                                            ]}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                                    <div>
                                        <label className="font-semibold text-sm block mb-2">Max upgrades per hour</label>
                                        <input
                                            type="number"
                                            min={1}
                                            className="w-full p-2 rounded border border-border bg-background text-text"
                                            value={upgraderMaxActionsPerHour}
                                            onChange={(e) => setUpgraderMaxActionsPerHour(Math.max(1, Number(e.target.value) || 25))}
                                        />
                                    </div>
                                </div>
                                {upgraderAutomationEnabled && (
                                    <div className="mt-4 space-y-3">
                                        <h5 className="font-semibold text-sm text-text">HEVC quality profile per ARR instance</h5>
                                        {loadingUpgraderProfiles ? (
                                            <p className="text-xs text-muted">Loading quality profiles…</p>
                                        ) : upgraderProfileInstances.length === 0 ? (
                                            <p className="text-xs text-yellow-200">Configure ready Sonarr/Radarr instances first.</p>
                                        ) : upgraderProfileInstances.map((instance) => (
                                            <div key={instance.id} className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-3 items-end border border-border/40 rounded-lg p-3">
                                                <div>
                                                    <p className="text-sm font-semibold text-text">{instance.name}</p>
                                                    <p className="text-[11px] text-muted capitalize">{instance.type}</p>
                                                </div>
                                                <CustomSelect
                                                    value={String(upgraderProfileMap[instance.id]?.hevcProfileId || '')}
                                                    onChange={(value) => {
                                                        const hevcProfileId = Number(value);
                                                        setUpgraderProfileMap((prev) => {
                                                            const next = { ...prev };
                                                            if (hevcProfileId > 0) next[instance.id] = { hevcProfileId };
                                                            else delete next[instance.id];
                                                            return next;
                                                        });
                                                    }}
                                                    options={[
                                                        { value: '', label: 'Select HEVC profile…' },
                                                        ...(instance.profiles || []).map((profile: any) => ({
                                                            value: String(profile.id),
                                                            label: profile.name,
                                                        })),
                                                    ]}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <p className="text-[11px] text-muted mt-1">Requires Plex or Jellyfin. Sonarr/Radarr recommended for deep links and automation.</p>
                                <p className="text-[11px] text-muted mt-1">After changing these options, click Save Settings.</p>
                            </section>
                        </div>
                    )}
                    {activeTab === 'system' && (
                        <div className="mb-8 animate-fade-in space-y-6">
                            <h3 className="text-xl font-bold text-plex mb-4 border-b border-border pb-2">System</h3>
                            <section id={getSettingsSectionElementId('health')} className="space-y-4 mb-8 scroll-mt-24">
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
                            <section id={getSettingsSectionElementId('maintenance')} className={`space-y-3 mb-8 transition-all duration-300 scroll-mt-24 ${highlightMaintenanceToggle ? 'ring-2 ring-plex/50 rounded-lg p-3 -m-3' : ''}`}>
                                <h4 className="font-bold text-text">Cleaner Experimental Mode</h4>
                                <SettingsToggleRow
                                    title="Enable Cleaner Module"
                                    description="Single global toggle for the main Cleaner navigation section. OFF by default."
                                    checked={maintenanceExperimentalEnabled}
                                    onChange={setMaintenanceExperimentalEnabled}
                                    border={false}
                                />
                                <p className={`text-xs mt-2 font-semibold ${maintenanceExperimentalEnabled ? 'text-green-300' : 'text-yellow-300'}`}>
                                    Current status: {maintenanceExperimentalEnabled ? 'ON' : 'OFF'}
                                </p>
                                <p className="text-[11px] text-muted mt-1">After changing this toggle, click the main Save Settings button.</p>
                            </section>
                            <section id={getSettingsSectionElementId('backup')} className="space-y-4 mb-8 scroll-mt-24">
                                <h4 className="font-bold text-text">Backup & Restore</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                    <SettingsToggleRow
                                        title="Auto Backup Enabled"
                                        checked={autoBackupEnabled}
                                        onChange={setAutoBackupEnabled}
                                        border={false}
                                        className="!py-0"
                                    />
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

                            <section id={getSettingsSectionElementId('diagnostics')} className="space-y-4 mb-8 scroll-mt-24">
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
                                        <div className="flex items-center justify-between gap-2">
                                            <strong>Sonarr</strong>
                                            {renderConfigPill(!!diagnostics?.integrations?.sonarrConfigured)}
                                            {diagnostics?.integrations?.arrInstanceCounts?.sonarr?.ready > 1 && (
                                                <span className="text-[10px] text-muted">{diagnostics.integrations.arrInstanceCounts.sonarr.ready} instances</span>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between gap-2">
                                            <strong>Radarr</strong>
                                            {renderConfigPill(!!diagnostics?.integrations?.radarrConfigured)}
                                            {diagnostics?.integrations?.arrInstanceCounts?.radarr?.ready > 1 && (
                                                <span className="text-[10px] text-muted">{diagnostics.integrations.arrInstanceCounts.radarr.ready} instances</span>
                                            )}
                                        </div>
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
                                        <div key={`system-${task.id}`} className="py-3 border-b border-border/40 last:border-b-0 flex items-center justify-between gap-4">
                                            <div>
                                                <p className="font-semibold text-text">{task.name}</p>
                                                <div className="text-xs text-muted mt-1">
                                                    Last: {task.lastRun ? new Date(task.lastRun).toLocaleString() : 'Never'} · Next: {task.nextRun ? new Date(task.nextRun).toLocaleString() : 'Not Scheduled'}
                                                    {task.lastDurationMs !== null ? ` · Duration: ${Math.round(task.lastDurationMs / 1000)}s` : ''}
                                                </div>
                                                {task.lastError && <div className="text-xs text-red-300 mt-1">Last error: {task.lastError}</div>}
                                            </div>
                                            {task.running ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.15)] animate-pulse whitespace-nowrap">
                                                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping" />
                                                    Running
                                                </span>
                                            ) : task.lastError ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20 whitespace-nowrap">
                                                    <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                                                    Failed
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-500/10 text-muted border border-border whitespace-nowrap">
                                                    Idle
                                                </span>
                                            )}
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
                        <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-border/50">
                            <a href="https://jl94x4.github.io/Server-Manager-Portal/" target="_blank" rel="noreferrer" className="w-full sm:w-auto px-6 py-3 bg-border text-text rounded-lg font-bold hover:bg-opacity-80 transition-colors flex items-center justify-center gap-2">
                                <BookOpen className="w-5 h-5" /> Docs
                            </a>
                            <button className="w-full sm:w-auto px-6 py-3 bg-plex text-background rounded-lg font-bold hover:bg-plex-hover transition-colors flex items-center justify-center gap-2 shadow-lg shadow-plex/10" onClick={handleSave}>{activeTab === 'stream-rules' ? 'Save Stream Rules' : 'Save Settings'}</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
