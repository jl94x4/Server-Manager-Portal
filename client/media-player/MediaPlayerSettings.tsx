import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronUp, Loader2, Save } from 'lucide-react';
import { CustomSelect, discoveryTheme, MediaPlayerAlphaBanner, SettingsToggleRow, StickySaveBar, useDiscoverI18n } from './host';
import { fetchMediaPlayerHomeHeroConfig, fetchMediaPlayerLibraries, saveMediaPlayerHomeHeroConfig } from './api';
import {
    PLAYER_AUDIO_LANGUAGES,
    PLAYER_QUALITY_CHOICES,
    applyHomeRowOrder,
    applyLibraryNavOrder,
    defaultHomeRowIds,
    moveHomeRow,
    type PlayerSubtitleMode,
} from './playerSettings';
import { usePlayerSettings } from './usePlayerSettings';
import type { PlayerSection } from './types';

type Props = {
    onBack: () => void;
    isAdmin?: boolean;
};

const sectionClass = 'w-full overflow-hidden rounded-2xl border border-border bg-card';

const HERO_MODE_VALUES = [
    'off',
    'trending_week',
    'continue_watching',
    'seasonal_halloween',
    'seasonal_christmas',
    'seasonal_nye',
    'seasonal_easter',
    'seasonal_thanksgiving',
    'recently_added',
    'most_watched',
    'unwatched_picks',
    'new_releases',
    'random_spotlight',
] as const;

type HeroMode = typeof HERO_MODE_VALUES[number];

export const MediaPlayerSettings: React.FC<Props> = ({ onBack, isAdmin = false }) => {
    const { t } = useDiscoverI18n();
    const [settings, updateSettings, { dirty: playerDirty, saving: playerSaving, saveSettings, discardSettings }] = usePlayerSettings();
    const [libraries, setLibraries] = useState<PlayerSection[]>([]);
    const [saveState, setSaveState] = useState<'idle' | 'saved' | 'error'>('idle');
    const [heroMode, setHeroMode] = useState<HeroMode>('trending_week');
    const [heroSeasonalOnly, setHeroSeasonalOnly] = useState(false);
    const [cwSeasonPoster, setCwSeasonPoster] = useState(false);
    const [heroBaseline, setHeroBaseline] = useState<{
        mode: HeroMode;
        seasonalInWindowOnly: boolean;
        continueWatchingSeasonPoster: boolean;
    } | null>(null);
    const [heroSaving, setHeroSaving] = useState(false);
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
    const heroModeOptions = useMemo(() => ([
        { value: 'off', label: t('mediaPlayerPage.homeHeroModeOff') },
        { value: 'trending_week', label: t('mediaPlayerPage.homeHeroModeTrending') },
        { value: 'continue_watching', label: t('mediaPlayerPage.homeHeroModeContinueWatching') },
        { value: 'seasonal_halloween', label: t('mediaPlayerPage.homeHeroModeHalloween') },
        { value: 'seasonal_christmas', label: t('mediaPlayerPage.homeHeroModeChristmas') },
        { value: 'seasonal_nye', label: t('mediaPlayerPage.homeHeroModeNye') },
        { value: 'seasonal_easter', label: t('mediaPlayerPage.homeHeroModeEaster') },
        { value: 'seasonal_thanksgiving', label: t('mediaPlayerPage.homeHeroModeThanksgiving') },
        { value: 'recently_added', label: t('mediaPlayerPage.homeHeroModeRecentlyAdded') },
        { value: 'most_watched', label: t('mediaPlayerPage.homeHeroModeMostWatched') },
        { value: 'unwatched_picks', label: t('mediaPlayerPage.homeHeroModeUnwatchedPicks') },
        { value: 'new_releases', label: t('mediaPlayerPage.homeHeroModeNewReleases') },
        { value: 'random_spotlight', label: t('mediaPlayerPage.homeHeroModeRandomSpotlight') },
    ]), [t]);

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

    useEffect(() => {
        if (!isAdmin) return undefined;
        let cancelled = false;
        fetchMediaPlayerHomeHeroConfig()
            .then((data) => {
                if (cancelled) return;
                const mode = HERO_MODE_VALUES.includes(data?.mode as HeroMode)
                    ? (data.mode as HeroMode)
                    : 'trending_week';
                const seasonalInWindowOnly = data?.seasonalInWindowOnly === true;
                const continueWatchingSeasonPoster = data?.continueWatchingSeasonPoster === true;
                setHeroMode(mode);
                setHeroSeasonalOnly(seasonalInWindowOnly);
                setCwSeasonPoster(continueWatchingSeasonPoster);
                setHeroBaseline({ mode, seasonalInWindowOnly, continueWatchingSeasonPoster });
            })
            .catch(() => {
                if (!cancelled) setHeroBaseline(null);
            });
        return () => { cancelled = true; };
    }, [isAdmin]);

    const rowLabels = useMemo(() => ({
        continueWatching: t('mediaPlayerPage.continueWatching'),
        recents: t('mediaPlayerPage.recents'),
        playlists: t('mediaPlayerPage.playlists'),
    }), [t]);

    const orderedRowIds = applyHomeRowOrder(defaultHomeRowIds(), settings.homeRowOrder);
    const orderedLibraries = applyLibraryNavOrder(libraries, settings.libraryNavOrder);

    const hiddenRows = new Set<string>();
    if (!settings.showContinueWatching) hiddenRows.add('continueWatching');
    if (!settings.showPlaylists) hiddenRows.add('playlists');

    const heroDirty = !!heroBaseline && (
        heroMode !== heroBaseline.mode
        || heroSeasonalOnly !== heroBaseline.seasonalInWindowOnly
        || cwSeasonPoster !== heroBaseline.continueWatchingSeasonPoster
    );
    const dirty = playerDirty || heroDirty;
    const saving = playerSaving || heroSaving;

    useEffect(() => {
        if (dirty) setSaveState('idle');
    }, [dirty]);

    const discardAll = () => {
        discardSettings();
        if (heroBaseline) {
            setHeroMode(heroBaseline.mode);
            setHeroSeasonalOnly(heroBaseline.seasonalInWindowOnly);
            setCwSeasonPoster(heroBaseline.continueWatchingSeasonPoster);
        }
    };

    const handleSave = async () => {
        try {
            if (playerDirty) await saveSettings();
            if (heroDirty && isAdmin) {
                setHeroSaving(true);
                const saved = await saveMediaPlayerHomeHeroConfig({
                    mode: heroMode,
                    seasonalInWindowOnly: heroSeasonalOnly,
                    continueWatchingSeasonPoster: cwSeasonPoster,
                });
                const mode = HERO_MODE_VALUES.includes(saved?.mode as HeroMode)
                    ? (saved.mode as HeroMode)
                    : heroMode;
                const seasonalInWindowOnly = saved?.seasonalInWindowOnly === true;
                const continueWatchingSeasonPoster = saved?.continueWatchingSeasonPoster === true;
                setHeroMode(mode);
                setHeroSeasonalOnly(seasonalInWindowOnly);
                setCwSeasonPoster(continueWatchingSeasonPoster);
                setHeroBaseline({ mode, seasonalInWindowOnly, continueWatchingSeasonPoster });
            }
            setSaveState('saved');
        } catch {
            setSaveState('error');
        } finally {
            setHeroSaving(false);
        }
    };

    return (
        <div className="flex w-full flex-col gap-6 pb-24">
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
                <p className="mt-1 text-sm text-muted">{t('mediaPlayerPage.settingsHint')}</p>
            </div>

            {isAdmin ? (
                <section className={sectionClass}>
                    <div className="border-b border-border px-5 py-4 sm:px-6">
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm font-black uppercase tracking-widest text-muted">{t('mediaPlayerPage.homeHeroMode')}</h2>
                            <span className="rounded-md bg-plex/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-plex">
                                {t('mediaPlayerPage.homeHeroAdminOnly')}
                            </span>
                        </div>
                        <p className="mt-1 text-xs text-muted">{t('mediaPlayerPage.homeHeroModeHint')}</p>
                    </div>
                    <div className="px-5 py-2 sm:px-6">
                        <div className="border-b border-border/40 py-4">
                            <label className="mb-2 block text-sm font-bold text-text" htmlFor="media-player-home-hero-mode">
                                {t('mediaPlayerPage.homeHeroMode')}
                            </label>
                            <CustomSelect
                                id="media-player-home-hero-mode"
                                value={heroMode}
                                onChange={(value) => setHeroMode(value as HeroMode)}
                                className="max-w-xl"
                                options={heroModeOptions}
                            />
                        </div>
                        <SettingsToggleRow
                            title={t('mediaPlayerPage.homeHeroSeasonalWindow')}
                            description={t('mediaPlayerPage.homeHeroSeasonalWindowHint')}
                            checked={heroSeasonalOnly}
                            onChange={setHeroSeasonalOnly}
                        />
                        <SettingsToggleRow
                            title={t('mediaPlayerPage.continueWatchingSeasonPoster')}
                            description={t('mediaPlayerPage.continueWatchingSeasonPosterHint')}
                            checked={cwSeasonPoster}
                            onChange={setCwSeasonPoster}
                            border={false}
                        />
                    </div>
                </section>
            ) : null}

            <section className={sectionClass}>
                <div className="border-b border-border px-5 py-4 sm:px-6">
                    <h2 className="text-sm font-black uppercase tracking-widest text-muted">{t('mediaPlayerPage.settingsHome')}</h2>
                    <p className="mt-1 text-xs text-muted">{t('mediaPlayerPage.homeFollowsPlexHint')}</p>
                </div>
                <div className="px-5 py-2 sm:px-6">
                    <div className="border-b border-border/40 py-4">
                        <div className="mb-3 flex items-start justify-between gap-3">
                            <div>
                                <p className="text-sm font-bold text-text">{t('mediaPlayerPage.libraryNavOrder')}</p>
                                <p className="mt-1 text-xs text-muted">{t('mediaPlayerPage.libraryNavOrderHint')}</p>
                            </div>
                            {settings.libraryNavOrder.length ? (
                                <button
                                    type="button"
                                    onClick={() => updateSettings({ libraryNavOrder: [] })}
                                    className="shrink-0 text-xs font-bold text-muted hover:text-text"
                                >
                                    {t('mediaPlayerPage.homeRowReset')}
                                </button>
                            ) : null}
                        </div>
                        {orderedLibraries.length ? (
                            <div className="flex max-w-xl flex-col gap-2">
                                {orderedLibraries.map((library, index) => (
                                    <div
                                        key={library.key}
                                        className="flex items-center gap-2 rounded-xl border border-border bg-white/[0.03] px-3 py-2"
                                    >
                                        <span className="w-5 shrink-0 text-center text-xs font-bold tabular-nums text-muted">
                                            {index + 1}
                                        </span>
                                        <p className="min-w-0 flex-1 truncate text-sm font-bold text-text">
                                            {library.title}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => updateSettings({
                                                libraryNavOrder: moveHomeRow(orderedLibraries.map((row) => row.key), index, -1),
                                            })}
                                            disabled={index === 0}
                                            className="rounded-lg border border-border bg-white/5 p-1.5 text-muted hover:text-text disabled:opacity-30"
                                            aria-label={t('mediaPlayerPage.homeRowMoveUp')}
                                        >
                                            <ChevronUp className="h-4 w-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => updateSettings({
                                                libraryNavOrder: moveHomeRow(orderedLibraries.map((row) => row.key), index, 1),
                                            })}
                                            disabled={index === orderedLibraries.length - 1}
                                            className="rounded-lg border border-border bg-white/5 p-1.5 text-muted hover:text-text disabled:opacity-30"
                                            aria-label={t('mediaPlayerPage.homeRowMoveDown')}
                                        >
                                            <ChevronDown className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-muted">{t('mediaPlayerPage.emptyLibrariesNav')}</p>
                        )}
                    </div>
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
                    <SettingsToggleRow
                        title={t('mediaPlayerPage.playThemeTunes')}
                        description={t('mediaPlayerPage.playThemeTunesHint')}
                        checked={settings.playThemeTunes}
                        onChange={(checked) => updateSettings({ playThemeTunes: checked })}
                    />
                    <SettingsToggleRow
                        title={t('mediaPlayerPage.serviceLogoPlates')}
                        description={t('mediaPlayerPage.serviceLogoPlatesHint')}
                        checked={settings.serviceLogoPlates}
                        onChange={(checked) => updateSettings({ serviceLogoPlates: checked })}
                    />
                    <div className="border-b border-border/40 py-4">
                        <label className="mb-2 block text-sm font-bold text-text" htmlFor="media-player-watched-tick">
                            {t('mediaPlayerPage.watchedTickPosition')}
                        </label>
                        <p className="mb-3 text-xs text-muted">{t('mediaPlayerPage.watchedTickPositionHint')}</p>
                        <CustomSelect
                            id="media-player-watched-tick"
                            value={settings.watchedTickPosition}
                            onChange={(value) => updateSettings({
                                watchedTickPosition: value as typeof settings.watchedTickPosition,
                            })}
                            className="max-w-xl"
                            options={[
                                { value: 'top-right', label: t('mediaPlayerPage.watchedTickTopRight') },
                                { value: 'top-left', label: t('mediaPlayerPage.watchedTickTopLeft') },
                                { value: 'bottom-right', label: t('mediaPlayerPage.watchedTickBottomRight') },
                                { value: 'bottom-left', label: t('mediaPlayerPage.watchedTickBottomLeft') },
                            ]}
                        />
                    </div>
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
                        <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
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
                        <CustomSelect
                            id="media-player-default-quality"
                            value={settings.defaultQualityId}
                            onChange={(value) => updateSettings({ defaultQualityId: value })}
                            className="max-w-xl"
                            options={qualityOptions.map((row) => ({ value: row.id, label: row.label }))}
                        />
                    </div>
                </div>
            </section>

            <div className="grid w-full grid-cols-1 gap-6 xl:grid-cols-2">
                <section className={sectionClass}>
                    <div className="border-b border-border px-5 py-4 sm:px-6">
                        <h2 className="text-sm font-black uppercase tracking-widest text-muted">{t('mediaPlayerPage.settingsAudio')}</h2>
                    </div>
                    <div className="px-5 py-2 sm:px-6">
                        <div className="border-b border-border/40 py-4">
                            <label className="mb-2 block text-sm font-bold text-text" htmlFor="media-player-audio-language">
                                {t('mediaPlayerPage.audioLanguage')}
                            </label>
                            <p className="mb-3 text-xs text-muted">{t('mediaPlayerPage.audioLanguageHint')}</p>
                            <CustomSelect
                                id="media-player-audio-language"
                                value={settings.audioLanguage}
                                onChange={(value) => updateSettings({ audioLanguage: value })}
                                className="max-w-xl"
                                options={[
                                    { value: '', label: t('mediaPlayerPage.audioLanguageDefault') },
                                    ...PLAYER_AUDIO_LANGUAGES.map((row) => ({ value: row.id, label: row.label })),
                                ]}
                            />
                        </div>
                        <div className="py-4">
                            <label className="mb-2 block text-sm font-bold text-text" htmlFor="media-player-subtitle-mode">
                                {t('mediaPlayerPage.subtitleMode')}
                            </label>
                            <p className="mb-3 text-xs text-muted">{t('mediaPlayerPage.subtitleModeHint')}</p>
                            <CustomSelect
                                id="media-player-subtitle-mode"
                                value={settings.subtitleMode}
                                onChange={(value) => updateSettings({ subtitleMode: value as PlayerSubtitleMode })}
                                className="max-w-xl"
                                options={subtitleOptions.map((row) => ({ value: row.id, label: row.label }))}
                            />
                        </div>
                    </div>
                </section>

                <section className={sectionClass}>
                    <div className="border-b border-border px-5 py-4 sm:px-6">
                        <h2 className="text-sm font-black uppercase tracking-widest text-muted">{t('mediaPlayerPage.settingsSkipping')}</h2>
                    </div>
                    <div className="px-5 py-2 sm:px-6">
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

            <StickySaveBar className="!bottom-5">
                {dirty ? (
                    <p className="px-2 text-xs font-bold text-muted">{t('mediaPlayerPage.unsavedSettings')}</p>
                ) : saveState === 'saved' ? (
                    <p className="px-2 text-xs font-bold text-muted">{t('mediaPlayerPage.settingsSaved')}</p>
                ) : saveState === 'error' ? (
                    <p className="px-2 text-xs font-bold text-red-400">{t('mediaPlayerPage.settingsSaveError')}</p>
                ) : null}
                <button
                    type="button"
                    onClick={discardAll}
                    disabled={!dirty || saving}
                    className="inline-flex items-center justify-center rounded-xl bg-white/[0.06] px-3.5 py-2.5 text-sm font-bold text-text transition-colors hover:bg-white/10 disabled:opacity-40"
                >
                    {t('mediaPlayerPage.discardChanges')}
                </button>
                <button
                    type="button"
                    onClick={() => { void handleSave(); }}
                    disabled={!dirty || saving}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-plex px-4 py-2.5 text-sm font-bold text-background shadow-lg shadow-plex/15 transition-colors hover:bg-plex-hover disabled:opacity-50"
                >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {t('mediaPlayerPage.saveSettings')}
                </button>
            </StickySaveBar>
        </div>
    );
};

