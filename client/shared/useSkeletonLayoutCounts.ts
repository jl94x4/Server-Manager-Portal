import { useEffect, useState } from 'react';
import { carouselRowSkeletonCount, estimatePortalContentWidth, posterGridSkeletonCount } from './portalLayout';

type Options = {
    gridRows?: number;
};

export function useSkeletonLayoutCounts(options: Options = {}) {
    const gridRows = options.gridRows ?? 2;

    const [counts, setCounts] = useState(() => ({
        carousel: carouselRowSkeletonCount(),
        grid: posterGridSkeletonCount(gridRows),
    }));

    useEffect(() => {
        const update = () => {
            setCounts({
                carousel: carouselRowSkeletonCount(),
                grid: posterGridSkeletonCount(gridRows),
            });
        };

        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, [gridRows]);

    return counts;
}
