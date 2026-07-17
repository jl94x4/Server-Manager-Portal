import React from 'react';
import { CustomSelect } from '../shared/ui';
import {
    normalizeUpgraderGridSize,
    type UpgraderGridSize,
} from '../shared/portalLayout';
import { useDiscoverI18n } from './i18n';

export const DiscoverGridSizeSelect: React.FC<{
    value: UpgraderGridSize;
    onChange: (value: UpgraderGridSize) => void;
    className?: string;
}> = ({ value, onChange, className = 'w-44' }) => {
    const { t } = useDiscoverI18n();
    const options = [
        { value: 'small', label: t('browse.gridSmall') },
        { value: 'medium', label: t('browse.gridMedium') },
        { value: 'large', label: t('browse.gridLarge') },
        { value: 'xlarge', label: t('browse.gridXlarge') },
    ];

    return (
        <CustomSelect
            compact
            value={value}
            onChange={(next) => onChange(normalizeUpgraderGridSize(next))}
            options={options}
            className={className}
        />
    );
};
