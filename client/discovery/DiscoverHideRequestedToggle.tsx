import React from 'react';
import { SettingsSwitch } from '../shared/ui';
import { useDiscoverI18n } from './i18n';

export const DiscoverHideRequestedToggle: React.FC<{
    checked: boolean;
    onChange: (checked: boolean) => void;
}> = ({ checked, onChange }) => {
    const { t } = useDiscoverI18n();
    return (
        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-border hover:bg-white/10 rounded-lg transition-colors">
            <span className="text-sm font-bold text-text/80 whitespace-nowrap">{t('browse.hideRequested')}</span>
            <SettingsSwitch checked={checked} onChange={onChange} className="ml-0" />
        </div>
    );
};
