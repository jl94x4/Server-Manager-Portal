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
    }
}

const STORAGE_PORTAL = 'plexClient.portalBaseUrl';
const STORAGE_TOKEN = 'plexClient.sessionToken';

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
    // Drop path/query — app talks to portal origin (+ optional base path later if needed).
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

/** Sign out of the current portal session (keeps saved portal URL). */
export const clearPlexClientSession = () => {
    writeStoredSessionToken('');
};

/** Forget portal + session (switch to a different SMP install). */
export const clearPlexClientPortal = () => {
    writeStoredSessionToken('');
    writeStoredPortalBaseUrl('');
};

/** Absolute portal base used by Capacitor (no trailing slash). Never hardcode a store default. */
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

export const isAndroidTvUi = (): boolean => {
    if (typeof window === 'undefined') return false;
    if (window.__PLEX_CLIENT__?.isTv === true) return true;
    try {
        if (document.documentElement?.dataset?.tv === '1') return true;
        const ua = navigator.userAgent || '';
        return /Android/i.test(ua) && /TV|BRAVIA|AFT|GoogleTV|Android TV/i.test(ua);
    } catch {
        return false;
    }
};

/** Keep Media Player at a desktop-like density on Android TV WebViews. */
export const applyTvDisplayScale = () => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    if (!isAndroidTvUi()) return;
    try {
        document.documentElement.dataset.tv = '1';
        window.__PLEX_CLIENT__ = {
            ...(window.__PLEX_CLIENT__ || {}),
            isTv: true,
        };
        let meta = document.querySelector('meta[name="viewport"]');
        if (!meta) {
            meta = document.createElement('meta');
            meta.setAttribute('name', 'viewport');
            document.head.appendChild(meta);
        }
        meta.setAttribute('content', 'width=1920, initial-scale=1, maximum-scale=1, user-scalable=no');
        document.documentElement.style.fontSize = '16px';
    } catch {
        /* ignore */
    }
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
        if (window.__PLEX_CLIENT__.isTv) {
            document.documentElement.dataset.tv = '1';
            applyTvDisplayScale();
        }
    } catch {
        /* ignore */
    }
};
