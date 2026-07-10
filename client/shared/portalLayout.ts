export const activityStreamColumnCount = () => 3;

export const activityStreamGridClass = () => 'discover-activity-grid';

/** Auto-wrapping poster grid sized to the content area, not the viewport. */
export const discoverPosterGridClass = 'discover-poster-grid';

export type UpgraderGridSize = 'small' | 'medium' | 'large' | 'xlarge';

export const UPGRADER_GRID_SIZE_OPTIONS: Array<{ value: UpgraderGridSize; label: string }> = [
    { value: 'small', label: 'Grid: Small' },
    { value: 'medium', label: 'Grid: Medium' },
    { value: 'large', label: 'Grid: Large' },
    { value: 'xlarge', label: 'Grid: Extra large' },
];

export const upgraderPosterGridClass = (size: UpgraderGridSize) => `upgrader-poster-grid upgrader-poster-grid--${size}`;

export const UPGRADER_GRID_SIZE_STORAGE_KEY = 'upgraderGridSize';

export const normalizeUpgraderGridSize = (value: unknown): UpgraderGridSize => {
    if (value === 'small' || value === 'medium' || value === 'large' || value === 'xlarge') return value;
    return 'medium';
};
