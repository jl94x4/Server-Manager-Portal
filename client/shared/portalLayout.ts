import type { CSSProperties } from 'react';

export const activityStreamColumnCount = () => 3;

export const activityStreamGridClass = () => 'discover-activity-grid';

/** Auto-wrapping poster grid sized to the content area, not the viewport. */
export const discoverPosterGridClass = 'discover-poster-grid';

export type UpgraderGridSize = 'small' | 'medium' | 'large' | 'xlarge' | 'list';

export const UPGRADER_GRID_SIZE_OPTIONS: Array<{ value: UpgraderGridSize; label: string }> = [
    { value: 'small', label: 'Grid: Small' },
    { value: 'medium', label: 'Grid: Medium' },
    { value: 'large', label: 'Grid: Large' },
    { value: 'xlarge', label: 'Grid: Extra large' },
    { value: 'list', label: 'List view' },
];

export const upgraderPosterGridClass = (size: UpgraderGridSize) => size === 'list' ? 'flex flex-col gap-3' : `upgrader-poster-grid upgrader-poster-grid--${size}`;

/** Minimum poster column width per density preset (used with auto-fill). */
export const UPGRADER_GRID_MIN_WIDTH: Record<UpgraderGridSize, string> = {
    small: '5rem',
    medium: '7rem',
    large: '9.5rem',
    xlarge: '13rem',
    list: '100%',
};

export const upgraderPosterGridStyle = (size: UpgraderGridSize): CSSProperties => size === 'list' ? {} : ({
    gridTemplateColumns: `repeat(auto-fill, minmax(${UPGRADER_GRID_MIN_WIDTH[size]}, 1fr))`,
});

export const UPGRADER_GRID_SIZE_STORAGE_KEY = 'upgraderGridSize';

export const normalizeUpgraderGridSize = (value: unknown): UpgraderGridSize => {
    if (value === 'small' || value === 'medium' || value === 'large' || value === 'xlarge' || value === 'list') return value;
    return 'medium';
};
