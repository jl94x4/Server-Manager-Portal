export const SETTINGS_TABS = [
    'plex', 'smtp', 'newsletter', 'cleanup', 'mediastack', 'branding', 'navigation', 'home-layout',
    'status', 'invites', 'tasks', 'system', 'contact', 'broadcast', 'stream-rules', 'logs',
] as const;

export type SettingsTabId = typeof SETTINGS_TABS[number];

export type SettingsIndexEntry = {
    id: string;
    tabId: SettingsTabId;
    sectionId?: string;
    label: string;
    group: string;
    keywords: string[];
};

export const SETTINGS_INDEX: SettingsIndexEntry[] = [
    { id: 'branding', tabId: 'branding', label: 'Portal UI', group: 'Portal', keywords: ['theme', 'logo', 'color', 'branding', 'ui'] },
    { id: 'branding/logo', tabId: 'branding', sectionId: 'logo', label: 'Custom Logo', group: 'Portal', keywords: ['logo', 'icon', 'favicon', 'upload'] },
    { id: 'branding/theme', tabId: 'branding', sectionId: 'theme', label: 'Portal Theme', group: 'Portal', keywords: ['theme', 'plex dark', 'slate', 'jellyfin purple'] },
    { id: 'branding/announcement', tabId: 'branding', sectionId: 'announcement', label: 'Portal Announcement', group: 'Portal', keywords: ['announcement', 'banner', 'notice'] },
    { id: 'branding/poster-badges', tabId: 'branding', sectionId: 'poster-badges', label: 'Poster Quality Badges', group: 'Portal', keywords: ['poster', 'quality', 'badges', 'hdr', '4k', 'codec'] },
    { id: 'branding/slideshow', tabId: 'branding', sectionId: 'slideshow', label: 'TMDB Trending Slideshow', group: 'Portal', keywords: ['slideshow', 'tmdb', 'trending', 'background', 'splash'] },

    { id: 'contact', tabId: 'contact', label: 'Contact Details', group: 'Portal', keywords: ['contact', 'support', 'help'] },
    { id: 'contact/whatsapp', tabId: 'contact', sectionId: 'whatsapp', label: 'WhatsApp Number', group: 'Portal', keywords: ['whatsapp', 'phone', 'number'] },
    { id: 'contact/email', tabId: 'contact', sectionId: 'email', label: 'Contact Email', group: 'Portal', keywords: ['email', 'mail', 'support'] },

    { id: 'navigation', tabId: 'navigation', label: 'Navigation', group: 'Portal', keywords: ['menu', 'order', 'sidebar', 'nav'] },
    { id: 'home-layout', tabId: 'home-layout', label: 'Home Layout', group: 'Portal', keywords: ['dashboard', 'widgets', 'sections', 'home', 'layout', 'reorder', 'hide'] },

    { id: 'plex', tabId: 'plex', label: 'Media Player', group: 'Media Stack', keywords: ['plex', 'jellyfin', 'media', 'player', 'server'] },
    { id: 'plex/connection', tabId: 'plex', sectionId: 'connection', label: 'Media Server Connection', group: 'Media Stack', keywords: ['token', 'server', 'docker', 'url', 'jellyfin', 'plex'] },
    { id: 'plex/privacy', tabId: 'plex', sectionId: 'privacy', label: 'Stream User Privacy', group: 'Media Stack', keywords: ['privacy', 'anonymous', 'hide', 'stream', 'users'] },
    { id: 'plex/analytics-usernames', tabId: 'plex', sectionId: 'analytics-usernames', label: 'Show Usernames in Analytics', group: 'Media Stack', keywords: ['analytics', 'usernames', 'viewer', 'privacy'] },
    { id: 'plex/libraries', tabId: 'plex', sectionId: 'libraries', label: 'Default Libraries', group: 'Media Stack', keywords: ['libraries', 'share', 'temporary', 'access'] },

    { id: 'mediastack', tabId: 'mediastack', label: 'Integrations', group: 'Media Stack', keywords: ['integrations', 'arr', 'sonarr', 'radarr'] },
    { id: 'mediastack/arr', tabId: 'mediastack', sectionId: 'arr', label: 'Sonarr & Radarr Instances', group: 'Media Stack', keywords: ['sonarr', 'radarr', 'arr', 'instances'] },
    { id: 'mediastack/tautulli', tabId: 'mediastack', sectionId: 'tautulli', label: 'Tautulli Integration', group: 'Media Stack', keywords: ['tautulli', 'analytics', 'plex'] },
    { id: 'mediastack/jellystat', tabId: 'mediastack', sectionId: 'jellystat', label: 'Jellystat Integration', group: 'Media Stack', keywords: ['jellystat', 'jellyfin', 'analytics'] },
    { id: 'mediastack/seerr', tabId: 'mediastack', sectionId: 'seerr', label: 'Request App (Seerr/Ombi)', group: 'Media Stack', keywords: ['seerr', 'overseerr', 'jellyseerr', 'ombi', 'request'] },
    { id: 'mediastack/tmdb', tabId: 'mediastack', sectionId: 'tmdb', label: 'TMDB API Key', group: 'Media Stack', keywords: ['tmdb', 'api', 'trending', 'metadata'] },

    { id: 'status', tabId: 'status', label: 'Status Monitor', group: 'Media Stack', keywords: ['uptime', 'health', 'services', 'monitor'] },

    { id: 'smtp', tabId: 'smtp', label: 'SMTP Alerts', group: 'Comms', keywords: ['mail', 'smtp', 'email', 'alerts', 'test'] },
    { id: 'newsletter', tabId: 'newsletter', label: 'Newsletter', group: 'Comms', keywords: ['digest', 'send', 'frequency', 'weekly', 'monthly'] },
    { id: 'broadcast', tabId: 'broadcast', label: 'Broadcast Email', group: 'Comms', keywords: ['announcement', 'bulk', 'users', 'broadcast'] },
    { id: 'invites', tabId: 'invites', label: 'Invites', group: 'Comms', keywords: ['invite', 'link', 'code'] },
    { id: 'invites/referral', tabId: 'invites', sectionId: 'referral', label: 'Referral System', group: 'Comms', keywords: ['referral', 'reward', 'trial', 'invite friends'] },
    { id: 'invites/links', tabId: 'invites', sectionId: 'invite-links', label: 'Automated Invite Links', group: 'Comms', keywords: ['invite link', 'generate', 'email invite'] },

    { id: 'cleanup', tabId: 'cleanup', label: 'Cleanup', group: 'Automation', keywords: ['inactive', 'revoke', 'expiry', 'cleanup'] },
    { id: 'stream-rules', tabId: 'stream-rules', label: 'Stream Rules', group: 'Automation', keywords: ['kill', 'transcode', 'rule', 'stream'] },
    { id: 'tasks', tabId: 'tasks', label: 'Background Tasks', group: 'Automation', keywords: ['jobs', 'scheduler', 'run now', 'tasks'] },
    { id: 'system', tabId: 'system', label: 'System', group: 'Automation', keywords: ['system', 'diagnostics', 'backup'] },
    { id: 'system/health', tabId: 'system', sectionId: 'health', label: 'Health Dashboard', group: 'Automation', keywords: ['health', 'score', 'alerts', 'integrations'] },
    { id: 'system/maintenance', tabId: 'system', sectionId: 'maintenance', label: 'Cleaner Experimental Mode', group: 'Automation', keywords: ['cleaner', 'maintenance', 'experimental'] },
    { id: 'system/backup', tabId: 'system', sectionId: 'backup', label: 'Backup & Restore', group: 'Automation', keywords: ['backup', 'restore', 'export', 'import'] },
    { id: 'system/diagnostics', tabId: 'system', sectionId: 'diagnostics', label: 'Diagnostics', group: 'Automation', keywords: ['diagnostics', 'version', 'node', 'debug'] },
    { id: 'logs', tabId: 'logs', label: 'Logs & Audit', group: 'Automation', keywords: ['audit', 'emails', 'deleted users', 'history', 'logs'] },
];

export const SETTINGS_TAB_GROUPS = [
    { title: 'Portal', tabs: SETTINGS_INDEX.filter((entry) => entry.group === 'Portal' && !entry.sectionId) },
    { title: 'Media Stack', tabs: SETTINGS_INDEX.filter((entry) => entry.group === 'Media Stack' && !entry.sectionId) },
    { title: 'Comms', tabs: SETTINGS_INDEX.filter((entry) => entry.group === 'Comms' && !entry.sectionId) },
    { title: 'Automation', tabs: SETTINGS_INDEX.filter((entry) => entry.group === 'Automation' && !entry.sectionId) },
].map((group) => ({
    title: group.title,
    tabs: group.tabs.map((entry) => ({
        id: entry.tabId,
        label: entry.label,
        keywords: entry.keywords,
    })),
}));

const RECENT_KEY = 'portal-settings-recent';
const RECENT_LIMIT = 6;

export const parseSettingsHash = (hash: string): { tabId: SettingsTabId | null; sectionId: string | null } => {
    const raw = hash.replace(/^#/, '').trim();
    if (!raw) return { tabId: null, sectionId: null };
    const [tabPart, ...sectionParts] = raw.split('/');
    const tabId = SETTINGS_TABS.includes(tabPart as SettingsTabId) ? tabPart as SettingsTabId : null;
    const sectionId = sectionParts.length > 0 ? sectionParts.join('/') : null;
    return { tabId, sectionId };
};

export const buildSettingsHash = (tabId: SettingsTabId, sectionId?: string | null) => (
    sectionId ? `#${tabId}/${sectionId}` : `#${tabId}`
);

export const getSettingsSectionElementId = (sectionId: string) => `settings-section-${sectionId}`;

export const searchSettingsIndex = (term: string): SettingsIndexEntry[] => {
    const query = term.trim().toLowerCase();
    if (!query) return [];
    return SETTINGS_INDEX.filter((entry) => {
        const haystack = `${entry.group} ${entry.label} ${entry.keywords.join(' ')}`.toLowerCase();
        return haystack.includes(query);
    }).slice(0, 12);
};

export const getRecentSettingsIds = (): string[] => {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(RECENT_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
    } catch {
        return [];
    }
};

export const recordRecentSetting = (entryId: string) => {
    if (typeof window === 'undefined') return;
    const existing = getRecentSettingsIds().filter((id) => id !== entryId);
    const next = [entryId, ...existing].slice(0, RECENT_LIMIT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
};

export const resolveSettingsEntry = (entryId: string): SettingsIndexEntry | undefined => (
    SETTINGS_INDEX.find((entry) => entry.id === entryId)
);

export const getRecentSettingsEntries = (): SettingsIndexEntry[] => (
    getRecentSettingsIds()
        .map((id) => resolveSettingsEntry(id))
        .filter((entry): entry is SettingsIndexEntry => !!entry)
);
