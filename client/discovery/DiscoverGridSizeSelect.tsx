import React from 'react';
import { CustomSelect } from '../shared/ui';
import {
    normalizeUpgraderGridSize,
    UPGRADER_GRID_SIZE_OPTIONS,
    type UpgraderGridSize,
} from '../shared/portalLayout';

export const DiscoverGridSizeSelect: React.FC<{
    value: UpgraderGridSize;
    onChange: (value: UpgraderGridSize) => void;
    className?: string;
}> = ({ value, onChange, className = 'min-w-[140px]' }) => (
    <CustomSelect
        value={value}
        onChange={(next) => onChange(normalizeUpgraderGridSize(next))}
        options={UPGRADER_GRID_SIZE_OPTIONS.filter((opt) => opt.value !== 'list')}
        className={className}
    />
);
