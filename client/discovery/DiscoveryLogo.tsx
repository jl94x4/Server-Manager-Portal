import React, { useState } from 'react';
import { shouldInvertDiscoveryLogo, tmdbLogoUrl, isKnownDarkLogoPath } from './discoveryLogoUtils';

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
    const [invert, setInvert] = useState(false);

    const handleLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
        const img = event.currentTarget;
        if (shouldInvertDiscoveryLogo(logoPath, img) || isKnownDarkLogoPath(logoPath)) {
            setInvert(true);
        }
    };

    return (
        <img
            src={tmdbLogoUrl(logoPath, width)}
            alt={alt}
            crossOrigin="anonymous"
            loading="lazy"
            onLoad={handleLoad}
            onError={onError}
            className={`${className}${invert ? ' brightness-0 invert' : ''}`}
        />
    );
};
