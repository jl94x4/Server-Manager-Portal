/**
 * Portal-backed Media Player app (Capacitor) runtime config.
 * Play Store build: every user enters their own SMP portal URL. Never assume a single host.
 */

declare global {
    interface Window {
        __PLEX_CLIENT__?: {
            portalBaseUrl?: string;
            sessionToken?: string;
            isTv?: boolean;
            nativePlayer?: boolean;
        };
        /** Defined in plex-client/index.html — CSS-zoom to ~1920 desktop density on leanback. */
        __SMP_APPLY_TV_SCALE__?: () => void;
        __SMP_MARK_TV__?: () => void;
    }
}

const STORAGE_PORTAL = 'plexClient.portalBaseUrl';
const STORAGE_TOKEN = 'plexClient.sessionToken';

/** Desktop-like CSS layout width used by native TV density (MainActivity). */
export const TV_LAYOUT_WIDTH = 1920;

const trimSlash = (value: string) => String(value || '').replace(/\/+$/, '');

/** Normalize user-entered portal URL (Play Store: any SMP host). */
export const normalizePortalBaseUrl = (raw: string): { ok: true; url: string } | { ok: false; error: string } => {
    let value = String(raw || '').trim();
    if (!value) return { ok: false, error: 'Enter your Server Manager Portal URL' };
    if (!/^https?:\/\//i.test(value)) value = `https://${value}`;
    let parsed: URL;
    try {
        parsed = new URL(value);
    } catch {
        return { ok: false, error: 'That does not look like a valid URL' };
    }
    if (!['http:', 'https:'].includes(parsed.protocol)) {
        return { ok: false, error: 'Use an http:// or https:// portal address' };
    }
    if (!parsed.hostname) return { ok: false, error: 'Missing hostname' };
    const path = parsed.pathname.replace(/\/+$/, '');
    const origin = `${parsed.protocol}//${parsed.host}`;
    const withBase = path && path !== '/' ? `${origin}${path}` : origin;
    return { ok: true, url: trimSlash(withBase) };
};

export const isPlexClientApp = (): boolean => {
    if (typeof window === 'undefined') return false;
    if (window.__PLEX_CLIENT__) return true;
    try {
        return document.documentElement?.dataset?.plexClient === '1';
    } catch {
        return false;
    }
};

export const readStoredPortalBaseUrl = (): string => {
    try {
        return trimSlash(localStorage.getItem(STORAGE_PORTAL) || '');
    } catch {
        return '';
    }
};

export const writeStoredPortalBaseUrl = (url: string) => {
    try {
        const next = trimSlash(url);
        if (next) localStorage.setItem(STORAGE_PORTAL, next);
        else localStorage.removeItem(STORAGE_PORTAL);
        if (typeof window !== 'undefined') {
            window.__PLEX_CLIENT__ = {
                ...(window.__PLEX_CLIENT__ || {}),
                portalBaseUrl: next || undefined,
            };
        }
    } catch {
        /* ignore */
    }
};

export const readStoredSessionToken = (): string => {
    try {
        return String(localStorage.getItem(STORAGE_TOKEN) || '').trim();
    } catch {
        return '';
    }
};

export const writeStoredSessionToken = (token: string) => {
    try {
        const next = String(token || '').trim();
        if (next) localStorage.setItem(STORAGE_TOKEN, next);
        else localStorage.removeItem(STORAGE_TOKEN);
        if (typeof window !== 'undefined') {
            window.__PLEX_CLIENT__ = {
                ...(window.__PLEX_CLIENT__ || {}),
                sessionToken: next || undefined,
            };
        }
    } catch {
        /* ignore */
    }
};

export const clearPlexClientSession = () => {
    writeStoredSessionToken('');
};

export const clearPlexClientPortal = () => {
    writeStoredSessionToken('');
    writeStoredPortalBaseUrl('');
};

export const getPortalBaseUrl = (): string => {
    if (typeof window === 'undefined') return '';
    const fromWindow = trimSlash(window.__PLEX_CLIENT__?.portalBaseUrl || '');
    if (fromWindow) return fromWindow;
    return readStoredPortalBaseUrl();
};

export const getSessionToken = (): string => {
    if (typeof window === 'undefined') return '';
    const fromWindow = String(window.__PLEX_CLIENT__?.sessionToken || '').trim();
    if (fromWindow) return fromWindow;
    return readStoredSessionToken();
};

/** Leanback / Android TV detection — input layer; density is applied natively in MainActivity. */
export const isAndroidTvUi = (): boolean => {
    if (typeof window === 'undefined') return false;
    if (window.__PLEX_CLIENT__?.isTv === true) return true;
    try {
        if (document.documentElement?.dataset?.tv === '1') return true;
        const ua = navigator.userAgent || '';
        if (/Android/i.test(ua) && /TV|BRAVIA|AFT|GoogleTV|Android TV|SHIELD/i.test(ua)) return true;
        if (
            /Android/i.test(ua)
            && typeof navigator.maxTouchPoints === 'number'
            && navigator.maxTouchPoints === 0
            && Math.max(window.screen?.width || 0, window.screen?.height || 0) >= 720
        ) {
            return true;
        }
    } catch {
        /* ignore */
    }
    return false;
};

const markTvUi = () => {
    try {
        document.documentElement.dataset.tv = '1';
        document.documentElement.dataset.plexClient = '1';
        window.__PLEX_CLIENT__ = {
            ...(window.__PLEX_CLIENT__ || {}),
            isTv: true,
        };
        document.documentElement.style.fontSize = '20px';
        if (typeof window.__SMP_MARK_TV__ === 'function') {
            window.__SMP_MARK_TV__();
        } else if (typeof window.__SMP_APPLY_TV_SCALE__ === 'function') {
            window.__SMP_APPLY_TV_SCALE__();
        }
    } catch {
        /* ignore */
    }
};

type DeviceUiPlugin = {
    getInfo: () => Promise<{ isTv?: boolean; widthPixels?: number; heightPixels?: number; density?: number }>;
};

/** Ask native leanback detection, then apply TV CSS density (zoom). */
export const detectAndApplyTvUi = async (): Promise<boolean> => {
    if (typeof window === 'undefined') return false;
    try {
        const { Capacitor, registerPlugin } = await import('@capacitor/core');
        if (Capacitor.isNativePlatform()) {
            const DeviceUi = registerPlugin<DeviceUiPlugin>('DeviceUi');
            const info = await DeviceUi.getInfo();
            if (info?.isTv) markTvUi();
        }
    } catch {
        /* web / plugin missing */
    }
    const tv = isAndroidTvUi();
    if (tv) markTvUi();
    return tv;
};

export const bootstrapPlexClientConfig = () => {
    if (typeof window === 'undefined') return;
    const portalBaseUrl = getPortalBaseUrl();
    const sessionToken = getSessionToken();
    window.__PLEX_CLIENT__ = {
        ...(window.__PLEX_CLIENT__ || {}),
        portalBaseUrl: portalBaseUrl || undefined,
        sessionToken: sessionToken || undefined,
        isTv: window.__PLEX_CLIENT__?.isTv ?? isAndroidTvUi(),
        nativePlayer: window.__PLEX_CLIENT__?.nativePlayer ?? true,
    };
    try {
        document.documentElement.dataset.plexClient = '1';
        if (window.__PLEX_CLIENT__.isTv) markTvUi();
    } catch {
        /* ignore */
    }
};
