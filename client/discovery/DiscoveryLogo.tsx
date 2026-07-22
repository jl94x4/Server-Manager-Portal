import React, { useEffect, useState } from 'react';
import { tmdbDuotoneLogo } from './discoverConstants';
import {
    discoveryLogoUrl,
    isKnownDarkLogoPath,
    isPredominantlyDarkLogo,
    shouldInvertByLabel,
    shouldNeverInvertLogo,
} from './discoveryLogoUtils';

type Props = {
    logoPath: string;
    alt: string;
    className?: string;
    width?: 154 | 300 | 780;
    /** Overseerr-style duotone — light marks on dark cards, dark marks in light theme. */
    duotone?: boolean;
    onError?: () => void;
};

const isBundledOrAbsoluteLogo = (logoPath: string) => {
    const path = String(logoPath || '').trim();
    return path.startsWith('http://')
        || path.startsWith('https://')
        || path.startsWith('/static/');
};

const readLightTheme = () => {
    if (typeof document === 'undefined') return false;
    return document.documentElement.getAttribute('data-theme') === 'light';
};

/** TMDB network/studio logo — duotone for company cards, or invert when predominantly black. */
export const DiscoveryLogo: React.FC<Props> = ({
    logoPath,
    alt,
    className = '',
    width = 154,
    duotone = false,
    onError,
}) => {
    const [isLightTheme, setIsLightTheme] = useState(readLightTheme);
    const useDuotone = duotone && !isBundledOrAbsoluteLogo(logoPath);
    const src = useDuotone
        ? tmdbDuotoneLogo(logoPath, width === 154 ? 300 : width, isLightTheme ? 'onLight' : 'onDark')
        : discoveryLogoUrl(logoPath, width);

    useEffect(() => {
        const apply = () => setIsLightTheme(readLightTheme());
        apply();
        const observer = new MutationObserver(apply);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
        return () => observer.disconnect();
    }, []);

    const [invert, setInvert] = useState(
        () => !useDuotone
            && !shouldNeverInvertLogo(logoPath, alt)
            && (isKnownDarkLogoPath(logoPath)
                || shouldInvertByLabel(alt)
                || String(logoPath || '').startsWith('/static/')),
    );

    useEffect(() => {
        if (useDuotone) {
            setInvert(false);
            return undefined;
        }

        // Bundled SVGs are typically dark marks for light UIs — force invert on dark cards.
        if (String(logoPath || '').startsWith('/static/')) {
            setInvert(!isLightTheme);
            return undefined;
        }

        if (shouldNeverInvertLogo(logoPath, alt)) {
            setInvert(false);
            return undefined;
        }

        if (isKnownDarkLogoPath(logoPath) || shouldInvertByLabel(alt)) {
            setInvert(!isLightTheme);
            return undefined;
        }

        let cancelled = false;
        const probe = new Image();
        probe.crossOrigin = 'anonymous';
        probe.onload = () => {
            if (cancelled) return;
            try {
                if (isPredominantlyDarkLogo(probe)) setInvert(!isLightTheme);
            } catch {
                // Canvas blocked — keep path/label fallbacks only.
            }
        };
        probe.src = discoveryLogoUrl(logoPath, width);

        return () => {
            cancelled = true;
            probe.onload = null;
            probe.onerror = null;
        };
    }, [logoPath, alt, width, useDuotone, isLightTheme]);

    return (
        <img
            src={src}
            alt={alt}
            loading="lazy"
            onError={onError}
            className={`${className}${invert ? ' brightness-0 invert' : ''}`}
        />
    );
};
