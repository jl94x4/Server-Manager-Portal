import React, { useEffect, useState } from 'react';
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
    onError?: () => void;
};

/** TMDB network/studio logo — inverts only when the mark is predominantly black. */
export const DiscoveryLogo: React.FC<Props> = ({
    logoPath,
    alt,
    className = '',
    width = 154,
    onError,
}) => {
    const [invert, setInvert] = useState(
        () => !shouldNeverInvertLogo(logoPath, alt)
            && (isKnownDarkLogoPath(logoPath) || shouldInvertByLabel(alt)),
    );

    useEffect(() => {
        if (shouldNeverInvertLogo(logoPath, alt)) {
            setInvert(false);
            return undefined;
        }

        if (isKnownDarkLogoPath(logoPath) || shouldInvertByLabel(alt)) {
            setInvert(true);
            return undefined;
        }

        let cancelled = false;
        const probe = new Image();
        probe.crossOrigin = 'anonymous';
        probe.onload = () => {
            if (cancelled) return;
            try {
                if (isPredominantlyDarkLogo(probe)) setInvert(true);
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
    }, [logoPath, alt, width]);

    return (
        <img
            src={discoveryLogoUrl(logoPath, width)}
            alt={alt}
            loading="lazy"
            onError={onError}
            className={`${className}${invert ? ' brightness-0 invert' : ''}`}
        />
    );
};
