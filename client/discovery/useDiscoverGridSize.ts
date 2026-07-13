import { useEffect, useState } from 'react';
import {
    normalizeUpgraderGridSize,
    type UpgraderGridSize,
} from '../shared/portalLayout';

export const DISCOVERY_GRID_SIZE_STORAGE_KEY = 'discoveryGridSize';

export const useDiscoverGridSize = () => {
    const [gridSize, setGridSize] = useState<UpgraderGridSize>(() => {
        if (typeof window === 'undefined') return 'medium';
        return normalizeUpgraderGridSize(window.localStorage.getItem(DISCOVERY_GRID_SIZE_STORAGE_KEY) || 'medium');
    });

    useEffect(() => {
        window.localStorage.setItem(DISCOVERY_GRID_SIZE_STORAGE_KEY, gridSize);
    }, [gridSize]);

    return [gridSize, setGridSize] as const;
};
