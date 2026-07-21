import { apiFetch, portalRequestHeaders } from '../shared/api';
import { portalUrl } from '../shared/basePath';
import { DEFAULT_CONFIG } from './constants';
import type { AppConfig, AppStatus, HistoryResponse, PinEvent, PlexCollection } from './types';

const base = (path: string) => {
    const clean = path.startsWith('/') ? path : `/${path}`;
    return `/api/collexions${clean}`;
};

export const collexionsImageUrl = (
    rawUrl: string,
    size: { width?: number; height?: number } = {},
) => {
    if (!rawUrl) return '';
    if (rawUrl.startsWith('data:') || rawUrl.startsWith('blob:')) return rawUrl;

    let path = rawUrl;
    if (path.startsWith('http://') || path.startsWith('https://')) {
        try {
            path = new URL(path).pathname;
        } catch {
            /* keep original */
        }
    }
    const q = path.indexOf('?');
    if (q >= 0) path = path.slice(0, q);
    if (!path.startsWith('/')) path = `/${path}`;

    // Use the portal Plex image proxy (transcoded + 24h browser cache) — one hop,
    // much faster than full-res through the Collexions Flask proxy.
    const width = size.width ?? 320;
    const height = size.height ?? 480;
    return portalUrl(
        `/api/plex/image?path=${encodeURIComponent(path)}&width=${width}&height=${height}`,
    );
};

class CollexionsApiService {
    async getAuthStatus(): Promise<{ is_setup: boolean; needs_onboarding?: boolean; portal_mode?: boolean }> {
        return apiFetch(base('/auth/status'));
    }

    /** Real portal Plex/TMDB values for seeding Collexions (admin-only; not masked). */
    async getPortalDefaults(): Promise<{
        plex_url: string;
        plex_token: string;
        tmdb_api_key: string;
        mediaServerType?: string;
        sources: { plex: boolean; tmdb: boolean; trakt: boolean; mdblist: boolean };
    }> {
        return apiFetch(base('/portal-defaults'));
    }

    async getConfig(): Promise<AppConfig> {
        const data = await apiFetch(base('/config'));
        return { ...DEFAULT_CONFIG, ...(data || {}) };
    }

    async saveConfig(config: AppConfig): Promise<void> {
        await apiFetch(base('/config'), { method: 'POST', body: JSON.stringify(config) });
    }

    async getStatus(): Promise<AppStatus> {
        try {
            return await apiFetch(base('/status'));
        } catch {
            return { status: 'Offline', last_update: '', next_run_timestamp: 0 };
        }
    }

    async getLogs(): Promise<string> {
        try {
            const response = await fetch(portalUrl(base('/logs')), {
                credentials: 'same-origin',
                headers: portalRequestHeaders(),
            });
            if (!response.ok) throw new Error('Failed to load logs');
            return await response.text();
        } catch {
            return 'Backend is offline. Logs unavailable.';
        }
    }

    async clearLogs(): Promise<void> {
        await apiFetch(base('/logs/clear'), { method: 'POST', body: '{}' });
    }

    async getHistory(limit?: number): Promise<HistoryResponse> {
        const params = new URLSearchParams();
        if (limit) params.append('limit', String(limit));
        const qs = params.toString();
        const data = await apiFetch(base(`/history${qs ? `?${qs}` : ''}`));
        if (Array.isArray(data)) {
            return {
                events: data,
                total_count: data.length,
                unique_count: new Set(data.map((e: any) => e.collectionName)).size,
            };
        }
        return data;
    }

    async saveHistory(events: PinEvent[]): Promise<void> {
        await apiFetch(base('/history'), { method: 'POST', body: JSON.stringify(events) });
    }

    async runNow(): Promise<void> {
        await apiFetch(base('/run'), { method: 'POST', body: '{}' });
    }

    async stopScript(): Promise<void> {
        await apiFetch(base('/stop'), { method: 'POST', body: '{}' });
    }

    async getCollections(forceRefresh = false): Promise<PlexCollection[]> {
        if (forceRefresh) {
            try { await apiFetch(base('/cache/clear'), { method: 'POST', body: '{}' }); } catch { /* ignore */ }
        }
        const params = new URLSearchParams();
        if (forceRefresh) params.append('refresh', 'true');
        const qs = params.toString();
        const data = await apiFetch(base(`/collections${qs ? `?${qs}` : ''}`));
        if (data && typeof data === 'object' && !Array.isArray(data)) return data.collections || [];
        return data || [];
    }

    async getTrending(): Promise<any[]> {
        try {
            return await apiFetch(base('/trending'));
        } catch {
            return [];
        }
    }

    async searchLibrary(library: string, query: string, genre?: string, year?: string): Promise<any[]> {
        const params = new URLSearchParams({ library, query });
        if (genre) params.append('genre', genre);
        if (year) params.append('year', year);
        return apiFetch(base(`/search/local?${params.toString()}`));
    }

    async searchExternal(query: string, type: 'movie' | 'tv'): Promise<any[]> {
        return apiFetch(base(`/search/external?query=${encodeURIComponent(query)}&type=${type}`));
    }

    async getTmdbGenres(type: 'movie' | 'tv'): Promise<any[]> {
        return apiFetch(base(`/tmdb/genres?type=${type}`));
    }

    async discoverTmdb(params: Record<string, any>): Promise<any[]> {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                searchParams.append(key, String(value));
            }
        });
        return apiFetch(base(`/search/discover?${searchParams.toString()}`));
    }

    async createCollection(library: string, title: string, items: string[], sort_order = 'custom'): Promise<any> {
        return apiFetch(base('/collections/create'), {
            method: 'POST',
            body: JSON.stringify({ library, title, items, sort_order }),
        });
    }

    async createFromExternal(
        library: string,
        title: string,
        items: any[],
        sort_order = 'custom',
        auto_sync = false,
        source_type?: string,
        source_id?: string,
    ): Promise<any> {
        return apiFetch(base('/collections/create-from-external'), {
            method: 'POST',
            body: JSON.stringify({ library, title, items, sort_order, auto_sync, source_type, source_id }),
        });
    }

    async getJobs(): Promise<any> {
        return apiFetch(base('/jobs'));
    }

    async runJobNow(id: string): Promise<any> {
        return apiFetch(base('/jobs/run'), { method: 'POST', body: JSON.stringify({ id }) });
    }

    async deleteJob(id: string): Promise<any> {
        return apiFetch(base('/jobs/delete'), { method: 'POST', body: JSON.stringify({ id }) });
    }

    async getTraktList(url: string): Promise<any[]> {
        return apiFetch(base(`/trakt/list?url=${encodeURIComponent(url)}`));
    }

    async getMdbList(url: string): Promise<any[]> {
        return apiFetch(base(`/mdblist/list?url=${encodeURIComponent(url)}`));
    }

    async pinCollection(title: string, library: string): Promise<void> {
        await apiFetch(base('/collections/pin'), { method: 'POST', body: JSON.stringify({ title, library }) });
    }

    async unpinCollection(title: string, library: string): Promise<void> {
        await apiFetch(base('/collections/unpin'), { method: 'POST', body: JSON.stringify({ title, library }) });
    }

    async getPlexLibraries(): Promise<any[]> {
        return apiFetch(base('/plex/libraries'));
    }
}

export const api = new CollexionsApiService();
