export type PlayerSettings = {
    mixLibraries: boolean;
    autoplayNext: boolean;
    showContinueWatching: boolean;
    defaultQualityId: string;
};

export const PLAYER_QUALITY_CHOICES = [
    { id: '1080-20', label: '1080p · 20 Mbps' },
    { id: '1080-12', label: '1080p · 12 Mbps' },
    { id: '1080-8', label: '1080p · 8 Mbps' },
    { id: '720-4', label: '720p · 4 Mbps' },
    { id: '720-2', label: '720p · 2 Mbps' },
    { id: '480-1.5', label: '480p · 1.5 Mbps' },
    { id: '360-0.7', label: '360p · 0.7 Mbps' },
];

export const PLAYER_SETTINGS_KEY = 'portal-media-player-settings';
export const PLAYER_SETTINGS_EVENT = 'portal-media-player-settings';

export const DEFAULT_PLAYER_SETTINGS: PlayerSettings = {
    mixLibraries: true,
    autoplayNext: true,
    showContinueWatching: true,
    defaultQualityId: 'auto',
};

export const readPlayerSettings = (): PlayerSettings => {
    if (typeof window === 'undefined') return { ...DEFAULT_PLAYER_SETTINGS };
    try {
        const raw = window.localStorage.getItem(PLAYER_SETTINGS_KEY);
        if (!raw) return { ...DEFAULT_PLAYER_SETTINGS };
        const parsed = JSON.parse(raw) || {};
        return {
            mixLibraries: parsed.mixLibraries !== false,
            autoplayNext: parsed.autoplayNext !== false,
            showContinueWatching: parsed.showContinueWatching !== false,
            defaultQualityId: String(parsed.defaultQualityId || 'auto'),
        };
    } catch {
        return { ...DEFAULT_PLAYER_SETTINGS };
    }
};

export const writePlayerSettings = (settings: PlayerSettings) => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(PLAYER_SETTINGS_KEY, JSON.stringify(settings));
    window.dispatchEvent(new Event(PLAYER_SETTINGS_EVENT));
};
