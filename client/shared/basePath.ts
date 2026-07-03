declare global {
    interface Window {
        __BASE_PATH__?: string;
    }
}

export const LOGO_PATH = '/static/logo.png';

export const getBasePath = (): string => {
    if (typeof window === 'undefined') return '';
    const base = window.__BASE_PATH__ || '';
    if (!base || base === '/') return '';
    return base.endsWith('/') ? base.replace(/\/+$/, '') : base;
};

/** Prefix an app-root path with the configured base path. */
export const portalUrl = (path: string): string => {
    if (!path || path.startsWith('http://') || path.startsWith('https://')) return path;
    const base = getBasePath();
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return base ? `${base}${normalized}` : normalized;
};

/** Strip the configured base path from a pathname for client-side routing. */
export const stripBasePath = (pathname: string): string => {
    const base = getBasePath();
    if (!base) return pathname || '/';
    if (pathname === base || pathname === `${base}/`) return '/';
    if (pathname.startsWith(`${base}/`)) return pathname.slice(base.length) || '/';
    return pathname || '/';
};

/** Public origin including base path — use for shareable links and referrals. */
export const getPublicOrigin = (): string => `${window.location.origin}${getBasePath()}`;

export const logoUrl = (): string => portalUrl(LOGO_PATH);
