import React from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { SettingsToggleRow } from '../shared/ui';
import { useDiscoverI18n } from '../discovery/i18n';
import { PLAYER_QUALITY_CHOICES, type PlayerSettings } from './playerSettings';

type Props = {
    settings: PlayerSettings;
    onChange: (patch: Partial<PlayerSettings>) => void;
    onClose: () => void;
};

export const MediaPlayerSettings: React.FC<Props> = ({ settings, onChange, onClose }) => {
    const { t } = useDiscoverI18n();
    const qualityOptions = [
        { id: 'auto', label: t('mediaPlayerPage.qualityAuto') },
        ...PLAYER_QUALITY_CHOICES.map((row) => ({ id: row.id, label: row.label })),
    ];

    const overlay = (
        <div className="fixed inset-0 z-[3500] flex items-start justify-center bg-black/60 p-4 sm:items-center" role="dialog" aria-modal="true" aria-label={t('mediaPlayerPage.settings')}>
            <button type="button" className="absolute inset-0" aria-label={t('common.close')} onClick={onClose} />
            <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
                <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-plex">{t('navigation.mediaPlayer')}</p>
                        <h2 className="text-lg font-black text-text">{t('mediaPlayerPage.settings')}</h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full bg-white/5 p-2 text-muted hover:bg-white/10 hover:text-text"
                        aria-label={t('common.close')}
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <div className="px-5 py-2">
                    <SettingsToggleRow
                        title={t('mediaPlayerPage.mixLibraries')}
                        description={t('mediaPlayerPage.mixLibrariesHint')}
                        checked={settings.mixLibraries}
                        onChange={(checked) => onChange({ mixLibraries: checked })}
                    />
                    <SettingsToggleRow
                        title={t('mediaPlayerPage.autoplayNext')}
                        description={t('mediaPlayerPage.autoplayNextHint')}
                        checked={settings.autoplayNext}
                        onChange={(checked) => onChange({ autoplayNext: checked })}
                    />
                    <SettingsToggleRow
                        title={t('mediaPlayerPage.showContinueWatching')}
                        description={t('mediaPlayerPage.showContinueWatchingHint')}
                        checked={settings.showContinueWatching}
                        onChange={(checked) => onChange({ showContinueWatching: checked })}
                    />
                    <div className="py-4">
                        <label className="mb-2 block text-sm font-bold text-text" htmlFor="media-player-default-quality">
                            {t('mediaPlayerPage.defaultQuality')}
                        </label>
                        <p className="mb-3 text-xs text-muted">{t('mediaPlayerPage.defaultQualityHint')}</p>
                        <select
                            id="media-player-default-quality"
                            value={settings.defaultQualityId}
                            onChange={(event) => onChange({ defaultQualityId: event.target.value })}
                            className="w-full rounded-xl border border-border bg-white/5 px-3 py-2 text-sm font-bold text-text"
                        >
                            {qualityOptions.map((row) => (
                                <option key={row.id} value={row.id}>{row.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );

    if (typeof document === 'undefined') return null;
    return createPortal(overlay, document.body);
};
