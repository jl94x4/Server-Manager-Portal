import { portalUrl } from './basePath';

export const apiFetch = async (url: string, options: RequestInit = {}) => {
    const response = await fetch(portalUrl(url), {
        credentials: 'same-origin',
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
    if (response.status === 204) return;
    return response.json();
};
