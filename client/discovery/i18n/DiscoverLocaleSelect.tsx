import React from 'react';
import { CustomSelect } from '../../shared/ui';
import { DISCOVER_LOCALES, useDiscoverI18n } from './index';

export const DiscoverLocaleSelect: React.FC<{
    className?: string;
    showLabel?: boolean;
}> = ({
    className = 'w-36',
    showLabel = true,
}) => {
    const { locale, setLocale, t } = useDiscoverI18n();

    return (
        <div className={`flex flex-col gap-1 ${className}`}>
            {showLabel && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted px-0.5">
                    {t('common.language')}
                </span>
            )}
            <CustomSelect
                compact
                value={locale}
                onChange={(next) => setLocale(next as typeof locale)}
                options={DISCOVER_LOCALES.map((item) => ({
                    value: item.code,
                    label: item.nativeLabel,
                }))}
                className="w-full"
            />
        </div>
    );
};
