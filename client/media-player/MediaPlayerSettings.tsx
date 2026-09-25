import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
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

const isTvShell = () => {
    try {
        return document.documentElement?.dataset?.tv === '1'
            || window.__PLEX_CLIENT__?.isTv === true;
    } catch {
        return false;
    }
};

const tvRowClass = 'flex w-full items-center justify-between gap-6 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-left outline-none';

type TvToggleRowProps = {
    title: string;
    description?: string;
    checked: boolean;
    onChange: (next: boolean) => void;
};

const TvToggleRow: React.FC<TvToggleRowProps> = ({ title, description, checked, onChange }) => {
    const { t } = useDiscoverI18n();
    return (
        <button
            type="button"
            data-tv-item="1"
            data-tv-action="1"
            data-tv-row="1"
            onClick={() => onChange(!checked)}
            className={tvRowClass}
        >
            <span className="min-w-0">
                <span className="block text-base font-bold text-text">{title}</span>
                {description ? <span className="mt-1 block text-sm leading-snug text-muted">{description}</span> : null}
            </span>
            <span className={`shrink-0 text-base font-black ${checked ? 'text-plex' : 'text-muted'}`}>
                {checked ? t('mediaPlayerPage.settingsOn') : t('mediaPlayerPage.settingsOff')}
            </span>
        </button>
    );
};

type TvChoice = { value: string; label: string };

type TvChoiceRowProps = {
    title: string;
    description?: string;
    value: string;
    options: TvChoice[];
    onChange: (value: string) => void;
};

const TvChoiceRow: React.FC<TvChoiceRowProps> = ({ title, description, value, options, onChange }) => {
    const { t } = useDiscoverI18n();
    const [open, setOpen] = useState(false);
    const selected = options.find((row) => row.value === value) || options[0];

    useEffect(() => {
        if (!open) return undefined;
        const id = window.setTimeout(() => {
            const dialog = document.querySelector('[data-tv-settings-dialog="1"]');
            const target = dialog?.querySelector<HTMLElement>('[data-tv-settings-primary="1"]')
                || dialog?.querySelector<HTMLElement>('[data-tv-item="1"]');
            target?.focus();
        }, 30);
        return () => window.clearTimeout(id);
    }, [open]);

    return (
        <>
            <button
                type="button"
                data-tv-item="1"
                data-tv-action="1"
                data-tv-row="1"
                onClick={() => setOpen(true)}
                className={tvRowClass}
            >
                <span className="min-w-0">
                    <span className="block text-base font-bold text-text">{title}</span>
                    {description ? <span className="mt-1 block text-sm leading-snug text-muted">{description}</span> : null}
                </span>
                <span className="shrink-0 text-base font-bold text-white/85">{selected?.label || '—'}</span>
            </button>
            {open && typeof document !== 'undefined' ? createPortal(
                <div
                    className="fixed inset-0 z-[3500] flex items-center justify-center bg-black/70 p-6 sm:p-10"
                    role="dialog"
                    aria-modal="true"
                    data-tv-settings-dialog="1"
                >
                    <div className="flex max-h-[min(78vh,44rem)] w-full max-w-xl flex-col rounded-2xl border border-white/10 bg-[#5a5e66] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.55)]">
                        <p className="shrink-0 text-xs font-black uppercase tracking-widest text-white/55">{title}</p>
                        <div
                            className="mt-4 min-h-0 flex-1 overflow-y-auto overscroll-contain hide-scrollbar"
                            data-tv-rail="1"
                            data-tv-overlay-scroll="1"
                        >
                            <div className="flex flex-col gap-2 pr-1">
                                {options.map((row) => (
                                    <button
                                        key={row.value}
                                        type="button"
                                        data-tv-item="1"
                                        data-tv-action="1"
                                        data-tv-settings-primary={row.value === value ? '1' : undefined}
                                        onClick={() => {
                                            onChange(row.value);
                                            setOpen(false);
                                        }}
                                        className={`rounded-xl border px-4 py-3.5 text-left text-base font-bold outline-none ${
                                            row.value === value
                                                ? 'border-plex/50 bg-plex/15 text-text'
                                                : 'border-white/15 bg-[#484c54] text-text'
                                        }`}
                                    >
                                        {row.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button
                            type="button"
                            data-tv-item="1"
                            data-tv-action="1"
                            onClick={() => setOpen(false)}
                            className="mt-3 shrink-0 rounded-xl px-4 py-3 text-base font-bold text-white/70 outline-none hover:text-white"
                        >
                            {t('common.close')}
                        </button>
                    </div>
                </div>,
                document.body,
            ) : null}
        </>
    );
};

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
    const tvShell = isTvShell();
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

    const saveActions = (
        <div className="flex flex-col gap-3" data-tv-row="1">
            {dirty ? (
                <p className="text-sm font-bold text-muted">{t('mediaPlayerPage.unsavedSettings')}</p>
            ) : saveState === 'saved' ? (
                <p className="text-sm font-bold text-muted">{t('mediaPlayerPage.settingsSaved')}</p>
            ) : saveState === 'error' ? (
                <p className="text-sm font-bold text-red-400">{t('mediaPlayerPage.settingsSaveError')}</p>
            ) : null}
            <div className="flex flex-wrap items-center gap-3">
                <button
                    type="button"
                    data-tv-item="1"
                    data-tv-action="1"
                    data-tv-play="1"
                    onClick={() => { void handleSave(); }}
                    disabled={!dirty || saving}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-plex px-5 text-base font-bold text-white shadow-lg shadow-plex/20 outline-none hover:bg-plex-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                    {t('mediaPlayerPage.saveSettings')}
                </button>
                <button
                    type="button"
                    data-tv-item="1"
                    data-tv-action="1"
                    onClick={discardAll}
                    disabled={!dirty || saving}
                    className="inline-flex h-12 items-center justify-center rounded-xl border border-white/15 bg-white/5 px-5 text-base font-bold text-text outline-none hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    {t('mediaPlayerPage.discardChanges')}
                </button>
            </div>
        </div>
    );

    if (tvShell) {
        return (
            <div className="flex w-full flex-col gap-8 pb-16" data-tv-settings="1">
                <div data-tv-page-top="1" className="h-0 w-full" aria-hidden />
                <div>
                    <p className={discoveryTheme.personalEyebrow}>{t('navigation.mediaPlayer')}</p>
                    <h1 className={discoveryTheme.heading}>{t('mediaPlayerPage.settings')}</h1>
                    <p className="mt-2 text-base text-muted">{t('mediaPlayerPage.settingsHintTv')}</p>
                </div>

                {isAdmin ? (
                    <section className="flex flex-col gap-3">
                        <h2 className="text-xs font-black uppercase tracking-widest text-muted">
                            {t('mediaPlayerPage.homeHeroMode')}
                        </h2>
                        <TvChoiceRow
                            title={t('mediaPlayerPage.homeHeroMode')}
                            description={t('mediaPlayerPage.homeHeroModeHint')}
                            value={heroMode}
                            options={heroModeOptions}
                            onChange={(value) => setHeroMode(value as HeroMode)}
                        />
                        <TvToggleRow
                            title={t('mediaPlayerPage.homeHeroSeasonalWindow')}
                            description={t('mediaPlayerPage.homeHeroSeasonalWindowHint')}
                            checked={heroSeasonalOnly}
                            onChange={setHeroSeasonalOnly}
                        />
                        <TvToggleRow
                            title={t('mediaPlayerPage.continueWatchingSeasonPoster')}
                            description={t('mediaPlayerPage.continueWatchingSeasonPosterHint')}
                            checked={cwSeasonPoster}
                            onChange={setCwSeasonPoster}
                        />
                    </section>
                ) : null}

                <section className="flex flex-col gap-3">
                    <h2 className="text-xs font-black uppercase tracking-widest text-muted">
                        {t('mediaPlayerPage.settingsHome')}
                    </h2>
                    <TvToggleRow
                        title={t('mediaPlayerPage.showContinueWatching')}
                        description={t('mediaPlayerPage.showContinueWatchingHint')}
                        checked={settings.showContinueWatching}
                        onChange={(checked) => updateSettings({ showContinueWatching: checked })}
                    />
                    <TvChoiceRow
                        title={t('mediaPlayerPage.continueWatchingLayout')}
                        description={t('mediaPlayerPage.continueWatchingLayoutHint')}
                        value={settings.continueWatchingLayout}
                        options={[
                            { value: 'poster', label: t('mediaPlayerPage.continueWatchingLayoutPoster') },
                            { value: 'title', label: t('mediaPlayerPage.continueWatchingLayoutTitle') },
                        ]}
                        onChange={(value) => updateSettings({
                            continueWatchingLayout: value as typeof settings.continueWatchingLayout,
                        })}
                    />
                    <TvToggleRow
                        title={t('mediaPlayerPage.showPlaylists')}
                        description={t('mediaPlayerPage.showPlaylistsHint')}
                        checked={settings.showPlaylists}
                        onChange={(checked) => updateSettings({ showPlaylists: checked })}
                    />
                    <TvToggleRow
                        title={t('mediaPlayerPage.autoplayNext')}
                        description={t('mediaPlayerPage.autoplayNextHint')}
                        checked={settings.autoplayNext}
                        onChange={(checked) => updateSettings({ autoplayNext: checked })}
                    />
                    <TvToggleRow
                        title={t('mediaPlayerPage.playThemeTunes')}
                        description={t('mediaPlayerPage.playThemeTunesHint')}
                        checked={settings.playThemeTunes}
                        onChange={(checked) => updateSettings({ playThemeTunes: checked })}
                    />
                    <TvToggleRow
                        title={t('mediaPlayerPage.serviceLogoPlates')}
                        description={t('mediaPlayerPage.serviceLogoPlatesHint')}
                        checked={settings.serviceLogoPlates}
                        onChange={(checked) => updateSettings({ serviceLogoPlates: checked })}
                    />
                    <TvToggleRow
                        title={t('mediaPlayerPage.showEpisodeFilePills')}
                        description={t('mediaPlayerPage.showEpisodeFilePillsHint')}
                        checked={settings.showEpisodeFilePills}
                        onChange={(checked) => updateSettings({ showEpisodeFilePills: checked })}
                    />
                    <TvChoiceRow
                        title={t('mediaPlayerPage.watchedTickPosition')}
                        description={t('mediaPlayerPage.watchedTickPositionHint')}
                        value={settings.watchedTickPosition}
                        options={[
                            { value: 'top-right', label: t('mediaPlayerPage.watchedTickTopRight') },
                            { value: 'top-left', label: t('mediaPlayerPage.watchedTickTopLeft') },
                            { value: 'bottom-right', label: t('mediaPlayerPage.watchedTickBottomRight') },
                            { value: 'bottom-left', label: t('mediaPlayerPage.watchedTickBottomLeft') },
                        ]}
                        onChange={(value) => updateSettings({
                            watchedTickPosition: value as typeof settings.watchedTickPosition,
                        })}
                    />
                </section>

                <section className="flex flex-col gap-3">
                    <h2 className="text-xs font-black uppercase tracking-widest text-muted">
                        {t('mediaPlayerPage.settingsAudio')}
                    </h2>
                    <TvChoiceRow
                        title={t('mediaPlayerPage.audioLanguage')}
                        description={t('mediaPlayerPage.audioLanguageHint')}
                        value={settings.audioLanguage}
                        options={[
                            { value: '', label: t('mediaPlayerPage.audioLanguageDefault') },
                            ...PLAYER_AUDIO_LANGUAGES.map((row) => ({ value: row.id, label: row.label })),
                        ]}
                        onChange={(value) => updateSettings({ audioLanguage: value })}
                    />
                    <TvChoiceRow
                        title={t('mediaPlayerPage.subtitleMode')}
                        description={t('mediaPlayerPage.subtitleModeHint')}
                        value={settings.subtitleMode}
                        options={subtitleOptions.map((row) => ({ value: row.id, label: row.label }))}
                        onChange={(value) => updateSettings({ subtitleMode: value as PlayerSubtitleMode })}
                    />
                </section>

                <section className="flex flex-col gap-3">
                    <h2 className="text-xs font-black uppercase tracking-widest text-muted">
                        {t('mediaPlayerPage.settingsSkipping')}
                    </h2>
                    <TvToggleRow
                        title={t('mediaPlayerPage.autoSkipIntro')}
                        description={t('mediaPlayerPage.autoSkipIntroHint')}
                        checked={settings.autoSkipIntro}
                        onChange={(checked) => updateSettings({ autoSkipIntro: checked })}
                    />
                    <TvToggleRow
                        title={t('mediaPlayerPage.autoSkipCredits')}
                        description={t('mediaPlayerPage.autoSkipCreditsHint')}
                        checked={settings.autoSkipCredits}
                        onChange={(checked) => updateSettings({ autoSkipCredits: checked })}
                    />
                </section>
                {saveActions}
            </div>
        );
    }

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
                    <div className="border-b border-border/40 py-4">
                        <label className="mb-2 block text-sm font-bold text-text" htmlFor="media-player-cw-layout">
                            {t('mediaPlayerPage.continueWatchingLayout')}
                        </label>
                        <p className="mb-3 text-xs text-muted">{t('mediaPlayerPage.continueWatchingLayoutHint')}</p>
                        <CustomSelect
                            id="media-player-cw-layout"
                            value={settings.continueWatchingLayout}
                            onChange={(value) => updateSettings({
                                continueWatchingLayout: value as typeof settings.continueWatchingLayout,
                            })}
                            className="max-w-xl"
                            options={[
                                { value: 'poster', label: t('mediaPlayerPage.continueWatchingLayoutPoster') },
                                { value: 'title', label: t('mediaPlayerPage.continueWatchingLayoutTitle') },
                            ]}
                        />
                    </div>
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
                    <SettingsToggleRow
                        title={t('mediaPlayerPage.showEpisodeFilePills')}
                        description={t('mediaPlayerPage.showEpisodeFilePillsHint')}
                        checked={settings.showEpisodeFilePills}
                        onChange={(checked) => updateSettings({ showEpisodeFilePills: checked })}
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

