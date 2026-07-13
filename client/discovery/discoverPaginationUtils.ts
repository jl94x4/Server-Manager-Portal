import type { UpgraderGridSize } from '../shared/portalLayout';

export const DISCOVER_INITIAL_ROW_COUNT = 5;
export const DISCOVER_API_PAGE_SIZE = 20;

const GRID_MIN_PX: Record<Exclude<UpgraderGridSize, 'list'>, number> = {
    small: 80,
    medium: 112,
    large: 152,
    xlarge: 208,
};

export const estimateDiscoverGridColumns = (gridSize: UpgraderGridSize, containerWidth: number): number => {
    if (gridSize === 'list') return 1;
    if (containerWidth <= 0) return 8;
    const minPx = GRID_MIN_PX[gridSize];
    const gap = 16;
    return Math.max(2, Math.floor((containerWidth + gap) / (minPx + gap)));
};

export const initialDiscoverPagesForGrid = (gridSize: UpgraderGridSize, containerWidth: number): number => {
    if (gridSize === 'list') {
        return DISCOVER_INITIAL_ROW_COUNT;
    }
    const targetItems = estimateDiscoverGridColumns(gridSize, containerWidth) * DISCOVER_INITIAL_ROW_COUNT;
    return Math.max(1, Math.ceil(targetItems / DISCOVER_API_PAGE_SIZE));
};

export const discoverSkeletonCountForGrid = (gridSize: UpgraderGridSize, containerWidth: number): number => {
    if (gridSize === 'list') return DISCOVER_INITIAL_ROW_COUNT * 3;
    return estimateDiscoverGridColumns(gridSize, containerWidth) * DISCOVER_INITIAL_ROW_COUNT;
};
