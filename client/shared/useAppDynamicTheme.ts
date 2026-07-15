import { useEffect, useState } from 'react';
import { apiFetch } from './api';
import { resolvePortalAssetUrl } from './basePath';
import { DYNAMIC_THEME_IMAGE_EVENT, useDynamicTheme } from './useDynamicTheme';

const resolveImageUrl = (raw: string | null | undefined): string | null => {
    if (!raw) return null;
    const trimmed = String(raw).trim();
    if (!trimmed) return null;
    return trimmed.startsWith('http') ? trimmed : resolvePortalAssetUrl(trimmed);
};

const pickThumbFromDashboard = (data: any): string | null => {
    const items = data?.recentlyAdded || data?.recentItems || [];
    const first = Array.isArray(items) ? items[0] : null;
    return first?.thumbUrl || first?.thumb || null;
};

/** Keeps Dynamic (Chameleon) accent colors in sync across all portal routes. */
export const useAppDynamicTheme = (
    activeTheme: string,
    currentRoute: string,
    publicConfig: { customLogoUrl?: string; mediaServerType?: string } | null | undefined,
) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const isDynamic = activeTheme === 'dynamic';
    const isJellyfin = publicConfig?.mediaServerType === 'jellyfin';

    useEffect(() => {
        if (!isDynamic) {
            setImageUrl(null);
            return undefined;
        }

        let cancelled = false;
        const fallback = resolveImageUrl(publicConfig?.customLogoUrl);

        const finish = (url: string | null) => {
            if (!cancelled) setImageUrl(url || fallback);
        };

        const loadForRoute = async () => {
            try {
                if (currentRoute === 'discovery') {
                    const res = await apiFetch('/api/discovery/hero-backdrops');
                    const bg = Array.isArray(res?.backgrounds) ? res.backgrounds[0] : null;
                    finish(resolveImageUrl(bg));
                    return;
                }

                if (currentRoute === 'user') {
                    try {
                        const res = isJellyfin
                            ? await apiFetch('/api/jellystat/analytics?days=30')
                            : await apiFetch('/api/plex/analytics/me?days=30');
                        const thumb = res?.recentHistory?.[0]?.thumbUrl;
                        if (thumb) {
                            finish(resolveImageUrl(thumb));
                            return;
                        }
                    } catch {
                        /* fall through to dashboard */
                    }
                }

                const dash = await apiFetch(
                    isJellyfin ? '/api/jellyfin/dashboard?limit=5' : '/api/plex/dashboard?limit=5',
                );
                finish(resolveImageUrl(pickThumbFromDashboard(dash)));
            } catch {
                finish(fallback);
            }
        };

        loadForRoute();
        return () => { cancelled = true; };
    }, [isDynamic, currentRoute, publicConfig?.customLogoUrl, isJellyfin]);

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
