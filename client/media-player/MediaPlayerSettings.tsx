import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { SettingsToggleRow } from '../shared/ui';
import { discoveryTheme } from '../discovery/discoveryThemeClasses';
import { useDiscoverI18n } from '../discovery/i18n';
import { MediaPlayerAlphaBanner } from '../shared/BetaBadge';
import { fetchMediaPlayerLibraries } from './api';
import {
    PLAYER_AUDIO_LANGUAGES,
    PLAYER_QUALITY_CHOICES,
    applyHomeRowOrder,
    defaultHomeRowIds,
    moveHomeRow,
    type PlayerSubtitleMode,
} from './playerSettings';
import { usePlayerSettings } from './usePlayerSettings';
import type { PlayerSection } from './types';

type Props = {
    onBack: () => void;
};

const selectClass = 'w-full rounded-xl border border-border bg-white/5 px-3 py-2 text-sm font-bold text-text';

export const MediaPlayerSettings: React.FC<Props> = ({ onBack }) => {
    const { t } = useDiscoverI18n();
    const [settings, updateSettings] = usePlayerSettings();
    const [libraries, setLibraries] = useState<PlayerSection[]>([]);
    const qualityOptions = [
        { id: 'auto', label: t('mediaPlayerPage.qualityAuto') },
        { id: 'original', label: t('mediaPlayerPage.qualityOriginal') },
        ...PLAYER_QUALITY_CHOICES.filter((row) => row.id !== 'original').map((row) => ({ id: row.id, label: row.label })),
    ];
    const subtitleOptions: Array<{ id: PlayerSubtitleMode; label: string }> = [
        { id: 'off', label: t('mediaPlayerPage.subtitleModeOff') },
        { id: 'forced', label: t('mediaPlayerPage.subtitleModeForced') },
        { id: 'always', label: t('mediaPlayerPage.subtitleModeAlways') },
    ];

    useEffect(() => {
        let cancelled = false;
        fetchMediaPlayerLibraries()
            .then((data) => {
                if (!cancelled) setLibraries(data.libraries || []);
            })
            .catch(() => {
                if (!cancelled) setLibraries([]);
            });
        return () => { cancelled = true; };
    }, []);

    const rowLabels = useMemo(() => {
        const labels: Record<string, string> = {
            libraries: t('mediaPlayerPage.libraries'),
            continueWatching: t('mediaPlayerPage.continueWatching'),
            playlists: t('mediaPlayerPage.playlists'),
            'recent:movie': t('mediaPlayerPage.recentlyAddedMovies'),
            'recent:show': t('mediaPlayerPage.recentlyAddedShows'),
            'recent:artist': t('mediaPlayerPage.recentlyAddedMusic'),
        };
        for (const library of libraries) {
            labels[`recent:${library.key}`] = t('mediaPlayerPage.recentlyAddedIn', { name: library.title });
        }
        return labels;
    }, [libraries, t]);

    const orderedRowIds = applyHomeRowOrder(
        defaultHomeRowIds({ mixLibraries: settings.mixLibraries, libraries }),
        settings.homeRowOrder,
    );

    const hiddenRows = new Set<string>();
    if (!settings.showContinueWatching) hiddenRows.add('continueWatching');
    if (!settings.showPlaylists) hiddenRows.add('playlists');

    return (
        <div className="flex flex-col gap-6 pb-8">
            <MediaPlayerAlphaBanner />
            <div>
                <button
                    type="button"
                    onClick={onBack}
                    className="mb-2 inline-flex items-center gap-2 text-sm font-bold text-muted hover:text-text"
                >
                    <ArrowLeft className="h-4 w-4" />
                    {t('mediaPlayerPage.back')}
                </button>
                <p className={discoveryTheme.personalEyebrow}>{t('navigation.mediaPlayer')}</p>
                <h1 className={discoveryTheme.heading}>{t('mediaPlayerPage.settings')}</h1>
                <p className="mt-1 max-w-2xl text-sm text-muted">{t('mediaPlayerPage.settingsHint')}</p>
            </div>

            <section className="max-w-2xl overflow-hidden rounded-2xl border border-border bg-card">
                <div className="border-b border-border px-5 py-4">
                    <h2 className="text-sm font-black uppercase tracking-widest text-muted">{t('mediaPlayerPage.settingsHome')}</h2>
                </div>
                <div className="px-5 py-2">
                    <SettingsToggleRow
                        title={t('mediaPlayerPage.mixLibraries')}
                        description={t('mediaPlayerPage.mixLibrariesHint')}
                        checked={settings.mixLibraries}
                        onChange={(checked) => updateSettings({ mixLibraries: checked })}
                    />
                    <SettingsToggleRow
                        title={t('mediaPlayerPage.showContinueWatching')}
                        description={t('mediaPlayerPage.showContinueWatchingHint')}
                        checked={settings.showContinueWatching}
                        onChange={(checked) => updateSettings({ showContinueWatching: checked })}
                    />
                    <SettingsToggleRow
                        title={t('mediaPlayerPage.showPlaylists')}
                        description={t('mediaPlayerPage.showPlaylistsHint')}
                        checked={settings.showPlaylists}
                        onChange={(checked) => updateSettings({ showPlaylists: checked })}
                    />
                    <SettingsToggleRow
                        title={t('mediaPlayerPage.autoplayNext')}
                        description={t('mediaPlayerPage.autoplayNextHint')}
                        checked={settings.autoplayNext}
                        onChange={(checked) => updateSettings({ autoplayNext: checked })}
                    />
                    <div className="border-b border-border/40 py-4">
                        <div className="mb-3 flex items-start justify-between gap-3">
                            <div>
                                <p className="text-sm font-bold text-text">{t('mediaPlayerPage.homeRowOrder')}</p>
                                <p className="mt-1 text-xs text-muted">{t('mediaPlayerPage.homeRowOrderHint')}</p>
                            </div>
                            {settings.homeRowOrder.length ? (
                                <button
                                    type="button"
                                    onClick={() => updateSettings({ homeRowOrder: [] })}
                                    className="shrink-0 text-xs font-bold text-muted hover:text-text"
                                >
                                    {t('mediaPlayerPage.homeRowReset')}
                                </button>
                            ) : null}
                        </div>
                        <div className="flex flex-col gap-2">
                            {orderedRowIds.map((id, index) => (
                                <div
                                    key={id}
                                    className={`flex items-center gap-2 rounded-xl border border-border bg-white/[0.03] px-3 py-2 ${hiddenRows.has(id) ? 'opacity-50' : ''}`}
                                >
                                    <p className="min-w-0 flex-1 truncate text-sm font-bold text-text">
                                        {rowLabels[id] || id}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => updateSettings({ homeRowOrder: moveHomeRow(orderedRowIds, index, -1) })}
                                        disabled={index === 0}
                                        className="rounded-lg border border-border bg-white/5 p-1.5 text-muted hover:text-text disabled:opacity-30"
                                        aria-label={t('mediaPlayerPage.homeRowMoveUp')}
                                    >
                                        <ChevronUp className="h-4 w-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => updateSettings({ homeRowOrder: moveHomeRow(orderedRowIds, index, 1) })}
                                        disabled={index === orderedRowIds.length - 1}
                                        className="rounded-lg border border-border bg-white/5 p-1.5 text-muted hover:text-text disabled:opacity-30"
                                        aria-label={t('mediaPlayerPage.homeRowMoveDown')}
                                    >
                                        <ChevronDown className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="py-4">
                        <label className="mb-2 block text-sm font-bold text-text" htmlFor="media-player-default-quality">
                            {t('mediaPlayerPage.defaultQuality')}
                        </label>
                        <p className="mb-3 text-xs text-muted">{t('mediaPlayerPage.defaultQualityHint')}</p>
                        <select
                            id="media-player-default-quality"
                            value={settings.defaultQualityId}
                            onChange={(event) => updateSettings({ defaultQualityId: event.target.value })}
                            className={selectClass}
                        >
                            {qualityOptions.map((row) => (
                                <option key={row.id} value={row.id}>{row.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </section>

            <section className="max-w-2xl overflow-hidden rounded-2xl border border-border bg-card">
                <div className="border-b border-border px-5 py-4">
                    <h2 className="text-sm font-black uppercase tracking-widest text-muted">{t('mediaPlayerPage.settingsAudio')}</h2>
                </div>
                <div className="px-5 py-2">
                    <div className="border-b border-border/40 py-4">
                        <label className="mb-2 block text-sm font-bold text-text" htmlFor="media-player-audio-language">
                            {t('mediaPlayerPage.audioLanguage')}
                        </label>
                        <p className="mb-3 text-xs text-muted">{t('mediaPlayerPage.audioLanguageHint')}</p>
                        <select
                            id="media-player-audio-language"
                            value={settings.audioLanguage}
                            onChange={(event) => updateSettings({ audioLanguage: event.target.value })}
                            className={selectClass}
                        >
                            <option value="">{t('mediaPlayerPage.audioLanguageDefault')}</option>
                            {PLAYER_AUDIO_LANGUAGES.map((row) => (
                                <option key={row.id} value={row.id}>{row.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="py-4">
                        <label className="mb-2 block text-sm font-bold text-text" htmlFor="media-player-subtitle-mode">
                            {t('mediaPlayerPage.subtitleMode')}
                        </label>
                        <p className="mb-3 text-xs text-muted">{t('mediaPlayerPage.subtitleModeHint')}</p>
                        <select
                            id="media-player-subtitle-mode"
                            value={settings.subtitleMode}
                            onChange={(event) => updateSettings({ subtitleMode: event.target.value as PlayerSubtitleMode })}
                            className={selectClass}
                        >
                            {subtitleOptions.map((row) => (
                                <option key={row.id} value={row.id}>{row.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </section>

            <section className="max-w-2xl overflow-hidden rounded-2xl border border-border bg-card">
                <div className="border-b border-border px-5 py-4">
                    <h2 className="text-sm font-black uppercase tracking-widest text-muted">{t('mediaPlayerPage.settingsSkipping')}</h2>
                </div>
                <div className="px-5 py-2">
                    <SettingsToggleRow
                        title={t('mediaPlayerPage.autoSkipIntro')}
                        description={t('mediaPlayerPage.autoSkipIntroHint')}
                        checked={settings.autoSkipIntro}
                        onChange={(checked) => updateSettings({ autoSkipIntro: checked })}
                    />
                    <SettingsToggleRow
                        title={t('mediaPlayerPage.autoSkipCredits')}
                        description={t('mediaPlayerPage.autoSkipCreditsHint')}
                        checked={settings.autoSkipCredits}
                        onChange={(checked) => updateSettings({ autoSkipCredits: checked })}
                        border={false}
                    />
                </div>
            </section>
        </div>
    );
};
