import { useEffect, useState } from 'react';
import { apiFetch } from './api';
import { resolvePortalAssetUrl } from './basePath';
import { DYNAMIC_THEME_IMAGE_EVENT, useDynamicTheme } from './useDynamicTheme';

type PublicThemeConfig = {
    customLogoUrl?: string;
    mediaServerType?: string;
    trendingBackgrounds?: string[];
} | null | undefined;

const resolveImageUrl = (raw: string | null | undefined): string | null => {
    if (!raw) return null;
    const trimmed = String(raw).trim();
    if (!trimmed) return null;
    return trimmed.startsWith('http') ? trimmed : resolvePortalAssetUrl(trimmed);
};

const firstThumb = (...candidates: Array<string | null | undefined>): string | null => {
    for (const candidate of candidates) {
        const resolved = resolveImageUrl(candidate);
        if (resolved) return resolved;
    }
    return null;
};

const pickFromList = (items: any[] | undefined | null): string | null => {
    if (!Array.isArray(items)) return null;
    for (const item of items) {
        const url = firstThumb(
            item?.artUrl,
            item?.thumbUrl,
            item?.posterUrl,
            item?.backdropUrl,
            item?.thumb,
            item?.art,
        );
        if (url) return url;
    }
    return null;
};

/** Dashboard returns recentMovies / recentShows / recentMusic — not recentlyAdded. */
const pickThumbFromDashboard = (data: any): string | null => (
    pickFromList(data?.recentMovies)
    || pickFromList(data?.recentShows)
    || pickFromList(data?.recentMusic)
    || pickFromList(data?.recentlyAdded)
    || pickFromList(data?.recentItems)
);

const pickPosterFromTrending = (data: any): string | null => {
    const item = Array.isArray(data?.results) ? data.results[0] : null;
    if (!item) return null;
    const path = item.posterPath || item.poster_path || item.backdropPath || item.backdrop_path;
    if (!path) return null;
    if (String(path).startsWith('http')) return path;
    const normalized = String(path).startsWith('/') ? path : `/${path}`;
    return `https://image.tmdb.org/t/p/w500${normalized}`;
};

const pickPosterFromRequests = (data: any): string | null => {
    const item = Array.isArray(data?.results) ? data.results[0] : null;
    return firstThumb(item?.posterUrl, item?.backdropUrl, item?.artUrl, item?.thumbUrl);
};

/** Keeps Dynamic (Chameleon) accent colors in sync across all portal routes. */
export const useAppDynamicTheme = (
    activeTheme: string,
    currentRoute: string,
    publicConfig: PublicThemeConfig,
) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const isDynamic = activeTheme === 'dynamic';
    const isJellyfin = String(publicConfig?.mediaServerType || 'plex').toLowerCase() === 'jellyfin';

    useEffect(() => {
        if (!isDynamic) {
            setImageUrl(null);
            return undefined;
        }

        let cancelled = false;
        const trendingFallback = resolveImageUrl(
            Array.isArray(publicConfig?.trendingBackgrounds) ? publicConfig.trendingBackgrounds[0] : null,
        );
        const logoFallback = resolveImageUrl(publicConfig?.customLogoUrl);

        const finish = (url: string | null) => {
            if (!cancelled) setImageUrl(url || trendingFallback || logoFallback);
        };

        /** Prefer a quick local seed so colors apply immediately when switching theme. */
        if (trendingFallback || logoFallback) {
            setImageUrl(trendingFallback || logoFallback);
        }

        const loadHomeImage = async (): Promise<string | null> => {
            try {
                const res = isJellyfin
                    ? await apiFetch('/api/jellystat/analytics?days=30')
                    : await apiFetch('/api/plex/analytics/me?days=30');
                return firstThumb(
                    res?.recentHistory?.[0]?.thumbUrl,
                    res?.recentHistory?.[0]?.artUrl,
                    res?.topMovie?.artUrl,
                    res?.topMovie?.thumbUrl,
                    res?.topBinge?.artUrl,
                    res?.topBinge?.thumbUrl,
                );
            } catch {
                return null;
            }
        };

        const loadDashboardImage = async (): Promise<string | null> => {
            try {
                const dash = await apiFetch(
                    isJellyfin ? '/api/jellyfin/dashboard?limit=5' : '/api/plex/dashboard?limit=5',
                );
                return pickThumbFromDashboard(dash);
            } catch {
                return null;
            }
        };

        const loadDiscoveryImage = async (): Promise<string | null> => {
            try {
                const res = await apiFetch('/api/discovery/hero-backdrops');
                const bg = Array.isArray(res?.backgrounds) ? res.backgrounds[0] : null;
                if (bg) return resolveImageUrl(bg);
            } catch {
                /* try next */
            }

            try {
                const requests = await apiFetch('/api/discovery/my-requests?filter=all&take=1');
                const fromRequests = pickPosterFromRequests(requests);
                if (fromRequests) return fromRequests;
            } catch {
                /* try trending */
            }

            try {
                const trending = await apiFetch('/api/discovery/trending');
                return pickPosterFromTrending(trending);
            } catch {
                return null;
            }
        };

        const loadForRoute = async () => {
            // Route-aware preference first, then shared fallbacks so any page can theme.
            const preferred: Array<() => Promise<string | null>> = [];
            if (currentRoute === 'user') preferred.push(loadHomeImage);
            if (currentRoute === 'discovery') preferred.push(loadDiscoveryImage);
            preferred.push(loadDashboardImage, loadHomeImage, loadDiscoveryImage);

            for (const loader of preferred) {
                const url = await loader();
                if (cancelled) return;
                if (url) {
                    finish(url);
                    return;
                }
            }
            finish(null);
        };

        loadForRoute();
        return () => { cancelled = true; };
    }, [
        isDynamic,
        currentRoute,
        publicConfig?.customLogoUrl,
        publicConfig?.trendingBackgrounds,
        isJellyfin,
    ]);

    useEffect(() => {
        if (!isDynamic) return undefined;

        const onImageOverride = (event: Event) => {
            const detail = (event as CustomEvent<{ url?: string }>).detail;
            const next = resolveImageUrl(detail?.url);
            if (next) setImageUrl(next);
        };

        window.addEventListener(DYNAMIC_THEME_IMAGE_EVENT, onImageOverride);
        return () => window.removeEventListener(DYNAMIC_THEME_IMAGE_EVENT, onImageOverride);
    }, [isDynamic]);

    useDynamicTheme(imageUrl, isDynamic);
};
