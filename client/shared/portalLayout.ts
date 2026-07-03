import { useEffect, useState } from 'react';

/** Matches MainApp ultra-wide content cap (16:9 of screen height). */
export const PORTAL_WIDE_LAYOUT_THRESHOLD = (16 / 9) + 0.03;

export const isPortalWideContentLayout = () => {
    const screenWidth = window.screen?.width || window.innerWidth;
    const screenHeight = window.screen?.height || window.innerHeight;
    return screenWidth / Math.max(1, screenHeight) > PORTAL_WIDE_LAYOUT_THRESHOLD;
};

export const usePortalWideContentLayout = () => {
    const [isWide, setIsWide] = useState(() =>
        typeof window !== 'undefined' ? isPortalWideContentLayout() : false
    );

    useEffect(() => {
        const update = () => setIsWide(isPortalWideContentLayout());
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);

    return isWide;
};

export const activityStreamGridClass = (wideLayout: boolean) =>
    `grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6 ${wideLayout ? 'xl:grid-cols-4' : 'xl:grid-cols-3'}`;
