import { useEffect } from 'react';
import { portalUrl, resolvePortalAssetUrl } from './basePath';

const boostDynamicRgb = (r: number, g: number, b: number) => {
    let red = r;
    let green = g;
    let blue = b;

    const maxColor = Math.max(red, green, blue);
    const minColor = Math.min(red, green, blue);
    const saturation = maxColor === 0 ? 0 : (maxColor - minColor) / maxColor;

    if (saturation < 0.3) {
        red = Math.min(255, red + 40);
        green = Math.min(255, green + 20);
        blue = Math.max(0, blue - 20);
    }

    if (maxColor < 100) {
        const boost = 150 / Math.max(maxColor, 1);
        red = Math.min(255, Math.round(red * boost));
        green = Math.min(255, Math.round(green * boost));
        blue = Math.min(255, Math.round(blue * boost));
    }

    return { r: red, g: green, b: blue };
};

export const applyDynamicThemeColors = (r: number, g: number, b: number) => {
    const boosted = boostDynamicRgb(r, g, b);
    document.documentElement.style.setProperty('--color-plex', `${boosted.r} ${boosted.g} ${boosted.b}`);

    const rH = Math.min(255, boosted.r + 40);
    const gH = Math.min(255, boosted.g + 40);
    const bH = Math.min(255, boosted.b + 40);
    document.documentElement.style.setProperty('--color-plex-hover', `${rH} ${gH} ${bH}`);
};

/** Same-origin proxy for external images so canvas sampling works (TMDB blocks CORS). */
export const toDynamicThemeSampleUrl = (imageUrl: string): string => {
    if (!imageUrl || typeof window === 'undefined') return imageUrl;

    try {
        const absolute = imageUrl.startsWith('http') ? imageUrl : resolvePortalAssetUrl(imageUrl);
        const parsed = new URL(absolute, window.location.origin);
        if (parsed.origin === window.location.origin) return absolute;
        return `${portalUrl('/api/dynamic-theme/sample-image')}?url=${encodeURIComponent(absolute)}`;
    } catch {
        return imageUrl;
    }
};

const applyDynamicColorsFromImage = (imageUrl: string) => {
    const sampleUrl = toDynamicThemeSampleUrl(imageUrl);
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) return;

            canvas.width = 1;
            canvas.height = 1;
            ctx.drawImage(img, 0, 0, 1, 1);
            const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
            applyDynamicThemeColors(r, g, b);
        } catch {
            /* Keep existing dynamic colors on canvas/security errors */
        }
    };
    img.onerror = () => {
        /* Do not clear colors — keep last successful sample */
    };
    img.src = sampleUrl;
};

/** Samples a hero/backdrop image and sets --color-plex / --color-plex-hover for Dynamic (Chameleon) theme. */
export const useDynamicTheme = (imageUrl: string | null | undefined, enabled = true) => {
    useEffect(() => {
        if (!enabled) return undefined;

        const apply = () => {
            const isDynamic = document.documentElement.getAttribute('data-theme') === 'dynamic';
            if (!isDynamic || !imageUrl) return;
            applyDynamicColorsFromImage(imageUrl);
        };

        apply();

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((m) => {
                if (m.attributeName === 'data-theme') apply();
            });
        });

        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

        return () => observer.disconnect();
    }, [imageUrl, enabled]);
};

export const DYNAMIC_THEME_IMAGE_EVENT = 'portal-dynamic-theme-image';
