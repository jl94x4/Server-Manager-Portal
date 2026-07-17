import { portalUrl } from './basePath';

/** Sent on every API call so mutating routes can reject cross-site CSRF. */
export const PORTAL_CSRF_HEADER = 'X-Requested-With';
export const PORTAL_CSRF_VALUE = 'ServerManagerPortal';

export const portalRequestHeaders = (extra: HeadersInit = {}): HeadersInit => ({
    'Content-Type': 'application/json',
    Accept: 'application/json',
    [PORTAL_CSRF_HEADER]: PORTAL_CSRF_VALUE,
    ...extra,
});

export const apiFetch = async (url: string, options: RequestInit = {}) => {
    const response = await fetch(portalUrl(url), {
        credentials: 'same-origin',
        ...options,
        headers: portalRequestHeaders(options.headers),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'An unknown API error occurred.' }));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }
    if (response.status === 204) return;
    return response.json();
};
