/** TMDB logo without duotone — color preserved for auto dark detection. */
export const tmdbLogoUrl = (logoPath: string, width: 154 | 300 | 780 = 154) => {
    const path = logoPath.startsWith('/') ? logoPath : `/${logoPath}`;
    return `https://image.tmdb.org/t/p/w${width}${path}`;
};

const normalizeLogoPath = (logoPath: string) => {
    const path = String(logoPath || '').trim();
    if (!path) return '';
    return path.startsWith('/') ? path : `/${path}`;
};

/** Fallback when canvas sampling is blocked (CORS) — black-only wordmarks. */
const FALLBACK_DARK_LOGO_PATHS = new Set([
    '/tuomPhY2UtuPTqqFnKMVHvSb724.png', // HBO
    '/Allse9kbjiP6ExaQrnSpIhkurEi.png', // Showtime
    '/6mSHSquNpfLgDdv6VnOOvC5Uz2h.png', // Cinemax
    '/pmvRmATOCaDykE6JrVoeYxlFHw3.png', // AMC
    '/8GJjw3HHsAJYwIWKIPBPfqMxlEa.png', // Starz
]);

export const isKnownDarkLogoPath = (logoPath: string) => (
    FALLBACK_DARK_LOGO_PATHS.has(normalizeLogoPath(logoPath))
);

/**
 * Sample logo pixels — true when the mark is mostly very dark (e.g. HBO wordmark).
 * Colored logos (Netflix red, NBC peacock) stay below the invert threshold.
 */
export const isPredominantlyDarkLogo = (img: HTMLImageElement): boolean => {
    const sampleSize = 48;
    const canvas = document.createElement('canvas');
    canvas.width = sampleSize;
    canvas.height = sampleSize;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return false;

    ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
    const { data } = ctx.getImageData(0, 0, sampleSize, sampleSize);

    let totalLuminance = 0;
    let opaquePixels = 0;
    let darkPixels = 0;

    for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3];
        if (alpha < 48) continue;

        const luminance = (0.2126 * data[i]) + (0.7152 * data[i + 1]) + (0.0722 * data[i + 2]);
        totalLuminance += luminance;
        opaquePixels += 1;
        if (luminance < 40) darkPixels += 1;
    }

    if (opaquePixels < 12) return false;

    const averageLuminance = totalLuminance / opaquePixels;
    const darkRatio = darkPixels / opaquePixels;

    return averageLuminance < 55 && darkRatio > 0.5;
};

export const shouldInvertDiscoveryLogo = (logoPath: string, img?: HTMLImageElement | null) => {
    if (img) {
        try {
            return isPredominantlyDarkLogo(img);
        } catch {
            return isKnownDarkLogoPath(logoPath);
        }
    }
    return false;
};
