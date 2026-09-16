export type PlayerSubtitleMode = 'off' | 'forced' | 'always';

export type PlayerSettings = {
    mixLibraries: boolean;
    autoplayNext: boolean;
    showContinueWatching: boolean;
    showPlaylists: boolean;
    defaultQualityId: string;
    audioLanguage: string;
    subtitleMode: PlayerSubtitleMode;
    autoSkipIntro: boolean;
    autoSkipCredits: boolean;
    playThemeTunes: boolean;
    homeRowOrder: string[];
    libraryNavOrder: string[];
};

export const PLAYER_QUALITY_CHOICES = [
    { id: 'original', label: 'Original' },
    { id: '1080-20', label: '1080p · 20 Mbps' },
    { id: '1080-12', label: '1080p · 12 Mbps' },
    { id: '1080-8', label: '1080p · 8 Mbps' },
    { id: '720-4', label: '720p · 4 Mbps' },
    { id: '720-2', label: '720p · 2 Mbps' },
    { id: '480-1.5', label: '480p · 1.5 Mbps' },
    { id: '360-0.7', label: '360p · 0.7 Mbps' },
];

export const PLAYER_AUDIO_LANGUAGES = [
    { id: 'en', label: 'English' },
    { id: 'es', label: 'Spanish' },
    { id: 'fr', label: 'French' },
    { id: 'de', label: 'German' },
    { id: 'it', label: 'Italian' },
    { id: 'pt', label: 'Portuguese' },
    { id: 'ja', label: 'Japanese' },
    { id: 'ko', label: 'Korean' },
    { id: 'zh', label: 'Chinese' },
    { id: 'ru', label: 'Russian' },
    { id: 'nl', label: 'Dutch' },
    { id: 'pl', label: 'Polish' },
    { id: 'sv', label: 'Swedish' },
    { id: 'no', label: 'Norwegian' },
    { id: 'da', label: 'Danish' },
    { id: 'fi', label: 'Finnish' },
    { id: 'ar', label: 'Arabic' },
    { id: 'hi', label: 'Hindi' },
    { id: 'tr', label: 'Turkish' },
];

export const PLAYER_HOME_ROW_IDS = ['continueWatching', 'recents', 'playlists'] as const;
export const MIXED_RECENT_HOME_ROW_IDS = ['recent:movie', 'recent:show', 'recent:artist'] as const;

export const isPlayerHomeRowId = (value: unknown): value is string => {
    const id = String(value || '').trim();
    if (id === 'continueWatching' || id === 'recents' || id === 'playlists' || id === 'libraries') return true;
    return /^recent:[A-Za-z0-9._-]{1,64}$/.test(id);
};

export const isPlayerLibraryKey = (value: unknown): value is string => (
    /^[A-Za-z0-9._-]{1,64}$/.test(String(value || '').trim())
);

export const normalizeLibraryNavOrder = (raw: unknown): string[] => {
    if (!Array.isArray(raw)) return [];
    const seen = new Set<string>();
    const out: string[] = [];
    for (const value of raw) {
        const id = String(value || '').trim();
        if (!isPlayerLibraryKey(id) || seen.has(id)) continue;
        seen.add(id);
        out.push(id);
    }
    return out.slice(0, 40);
};

export const libraryNavOrderFromHomeRows = (homeRowOrder: unknown): string[] => {
    const keys: string[] = [];
    const mixed = new Set<string>(MIXED_RECENT_HOME_ROW_IDS);
    for (const id of normalizeHomeRowOrder(homeRowOrder)) {
        if (!id.startsWith('recent:') || mixed.has(id)) continue;
        keys.push(id.slice('recent:'.length));
    }
    return normalizeLibraryNavOrder(keys);
};

export const collapseHomeRowOrder = (order: unknown): string[] => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const raw of normalizeHomeRowOrder(order)) {
        const id = raw.startsWith('recent:') ? 'recents' : raw === 'libraries' ? '' : raw;
        if (!id || seen.has(id)) continue;
        seen.add(id);
        out.push(id);
    }
    return out;
};

export const applyLibraryNavOrder = <T extends { key?: string | null }>(
    libraries: T[] = [],
    order: string[] = [],
): T[] => {
    const list = Array.isArray(libraries) ? libraries.filter((row) => row && String(row.key || '').trim()) : [];
    const byKey = new Map(list.map((row) => [String(row.key), row]));
    const seen = new Set<string>();
    const out: T[] = [];
    for (const key of normalizeLibraryNavOrder(order)) {
        const row = byKey.get(key);
        if (!row || seen.has(key)) continue;
        seen.add(key);
        out.push(row);
    }
    for (const row of list) {
        const key = String(row.key);
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(row);
    }
    return out;
};

export const normalizeHomeRowOrder = (raw: unknown): string[] => {
    if (!Array.isArray(raw)) return [];
    const seen = new Set<string>();
    const out: string[] = [];
    for (const value of raw) {
        const id = String(value || '').trim();
        if (!isPlayerHomeRowId(id) || seen.has(id)) continue;
        seen.add(id);
        out.push(id);
    }
    return out.slice(0, 40);
};

export const applyHomeRowOrder = (ids: string[] = [], order: string[] = []): string[] => {
    const wanted: string[] = [];
    const seenWanted = new Set<string>();
    for (const value of ids) {
        const id = String(value || '').trim();
        if (!id || seenWanted.has(id)) continue;
        seenWanted.add(id);
        wanted.push(id);
    }
    const seen = new Set<string>();
    const out: string[] = [];
    for (const id of collapseHomeRowOrder(order)) {
        if (!seenWanted.has(id) || seen.has(id)) continue;
        seen.add(id);
        out.push(id);
    }
    for (const id of wanted) {
        if (seen.has(id)) continue;
        out.push(id);
    }
    return out;
};

export const defaultHomeRowIds = (): string[] => [...PLAYER_HOME_ROW_IDS];

export const moveHomeRow = (ids: string[], index: number, direction: -1 | 1): string[] => {
    const next = [...ids];
    const target = index + direction;
    if (index < 0 || target < 0 || target >= next.length) return next;
    const current = next[index];
    next[index] = next[target];
    next[target] = current;
    return next;
};

const QUALITY_IDS = new Set(['auto', ...PLAYER_QUALITY_CHOICES.map((row) => row.id)]);
const SUBTITLE_MODES = new Set<PlayerSubtitleMode>(['off', 'forced', 'always']);

export const PLAYER_SETTINGS_KEY = 'portal-media-player-settings';
export const PLAYER_SETTINGS_EVENT = 'portal-media-player-settings';

export const DEFAULT_PLAYER_SETTINGS: PlayerSettings = {
    mixLibraries: false,
    autoplayNext: true,
    showContinueWatching: true,
    showPlaylists: true,
    defaultQualityId: 'auto',
    audioLanguage: '',
    subtitleMode: 'forced',
    autoSkipIntro: false,
    autoSkipCredits: false,
    playThemeTunes: true,
    homeRowOrder: [],
    libraryNavOrder: [],
};

const normalizeLang = (value: unknown) => String(value || '').trim().toLowerCase().replace(/_/g, '-');

export const normalizePlayerSettings = (raw: Partial<PlayerSettings> | Record<string, unknown> | null | undefined): PlayerSettings => {
    const quality = String(raw?.defaultQualityId || 'auto');
    const audioLanguage = normalizeLang(raw?.audioLanguage);
    const subtitleMode = String(raw?.subtitleMode || DEFAULT_PLAYER_SETTINGS.subtitleMode) as PlayerSubtitleMode;
    return {
        mixLibraries: raw?.mixLibraries === true,
        autoplayNext: raw?.autoplayNext !== false,
        showContinueWatching: raw?.showContinueWatching !== false,
        showPlaylists: raw?.showPlaylists !== false,
        defaultQualityId: QUALITY_IDS.has(quality) ? quality : 'auto',
        audioLanguage: /^[a-z]{2}(?:-[a-z]{2})?$/.test(audioLanguage) ? audioLanguage : '',
        subtitleMode: SUBTITLE_MODES.has(subtitleMode) ? subtitleMode : 'forced',
        autoSkipIntro: raw?.autoSkipIntro === true,
        autoSkipCredits: raw?.autoSkipCredits === true,
        playThemeTunes: raw?.playThemeTunes !== false,
        homeRowOrder: collapseHomeRowOrder(raw?.homeRowOrder),
        libraryNavOrder: normalizeLibraryNavOrder(
            Array.isArray(raw?.libraryNavOrder) && raw.libraryNavOrder.length
                ? raw.libraryNavOrder
                : libraryNavOrderFromHomeRows(raw?.homeRowOrder),
        ),
    };
};

export const playerSettingsEqual = (a: PlayerSettings, b: PlayerSettings) => (
    a.mixLibraries === b.mixLibraries
    && a.autoplayNext === b.autoplayNext
    && a.showContinueWatching === b.showContinueWatching
    && a.showPlaylists === b.showPlaylists
    && a.defaultQualityId === b.defaultQualityId
    && a.audioLanguage === b.audioLanguage
    && a.subtitleMode === b.subtitleMode
    && a.autoSkipIntro === b.autoSkipIntro
    && a.autoSkipCredits === b.autoSkipCredits
    && a.playThemeTunes === b.playThemeTunes
    && a.homeRowOrder.join('\0') === b.homeRowOrder.join('\0')
    && a.libraryNavOrder.join('\0') === b.libraryNavOrder.join('\0')
);

export const readPlayerSettings = (): PlayerSettings => {
    if (typeof window === 'undefined') return { ...DEFAULT_PLAYER_SETTINGS };
    try {
        const raw = window.localStorage.getItem(PLAYER_SETTINGS_KEY);
        if (!raw) return { ...DEFAULT_PLAYER_SETTINGS };
        return normalizePlayerSettings(JSON.parse(raw) || {});
    } catch {
        return { ...DEFAULT_PLAYER_SETTINGS };
    }
};

export const writePlayerSettings = (settings: PlayerSettings) => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(PLAYER_SETTINGS_KEY, JSON.stringify(normalizePlayerSettings(settings)));
    window.dispatchEvent(new Event(PLAYER_SETTINGS_EVENT));
};
