import { PLAYER_SCROLL_ID } from './paths';

export const PLAYER_SEARCH_INPUT_ID = 'media-player-search';
export const PLAYER_FOCUS_SEARCH_KEY = 'portal-media-player-focus-search';
export const PLAYER_HOME_SCROLL_KEY = 'portal-media-player-home-scroll';
export const PLAYER_LOCAL_PLAYBACK_KEY = 'portal-media-player-local-playback';
export const PLAYER_LIBRARY_STATE_KEY = 'portal-media-player-library-state';
export const PLAYER_NAV_COLLAPSED_KEY = 'portal-media-player-nav-collapsed';

export type LocalPlaybackPrefs = {
    volume: number;
    muted: boolean;
    speed: number;
};

export type LibraryBrowseState = {
    sort: string;
    genre: string;
    decade: string;
    resolution: string;
    studio: string;
    unwatched: boolean;
    inProgress: boolean;
};

const DEFAULT_PLAYBACK: LocalPlaybackPrefs = { volume: 1, muted: false, speed: 1 };
const DEFAULT_LIBRARY: LibraryBrowseState = {
    sort: 'addedAt:desc',
    genre: '',
    decade: '',
    resolution: '',
    studio: '',
    unwatched: false,
    inProgress: false,
};

const readJson = (key: string): unknown => {
    if (typeof window === 'undefined') return null;
    try {
        const raw = window.localStorage.getItem(key) ?? window.sessionStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

const writeJson = (storage: Storage, key: string, value: unknown) => {
    try {
        storage.setItem(key, JSON.stringify(value));
    } catch {
        /* quota / private mode */
    }
};

export const readLocalPlaybackPrefs = (): LocalPlaybackPrefs => {
    const raw = readJson(PLAYER_LOCAL_PLAYBACK_KEY) as Partial<LocalPlaybackPrefs> | null;
    const volume = Number(raw?.volume);
    const speed = Number(raw?.speed);
    return {
        volume: Number.isFinite(volume) ? Math.min(1, Math.max(0, volume)) : DEFAULT_PLAYBACK.volume,
        muted: raw?.muted === true,
        speed: Number.isFinite(speed) && speed > 0 ? Math.min(3, Math.max(0.25, speed)) : DEFAULT_PLAYBACK.speed,
    };
};

export const writeLocalPlaybackPrefs = (prefs: LocalPlaybackPrefs) => {
    if (typeof window === 'undefined') return;
    writeJson(window.localStorage, PLAYER_LOCAL_PLAYBACK_KEY, {
        volume: Math.min(1, Math.max(0, Number(prefs.volume) || 0)),
        muted: prefs.muted === true,
        speed: Math.min(3, Math.max(0.25, Number(prefs.speed) || 1)),
    });
};

export const readLibraryBrowseState = (sectionKey: string): LibraryBrowseState => {
    const all = (readJson(PLAYER_LIBRARY_STATE_KEY) || {}) as Record<string, Partial<LibraryBrowseState>>;
    const saved = all[String(sectionKey || '')] || {};
    return {
        sort: String(saved.sort || DEFAULT_LIBRARY.sort),
        genre: String(saved.genre || ''),
        decade: String(saved.decade || ''),
        resolution: String(saved.resolution || ''),
        studio: String(saved.studio || ''),
        unwatched: saved.unwatched === true,
        inProgress: saved.inProgress === true,
    };
};

export const writeLibraryBrowseState = (sectionKey: string, state: LibraryBrowseState) => {
    if (typeof window === 'undefined' || !sectionKey) return;
    const all = (readJson(PLAYER_LIBRARY_STATE_KEY) || {}) as Record<string, LibraryBrowseState>;
    all[sectionKey] = state;
    writeJson(window.sessionStorage, PLAYER_LIBRARY_STATE_KEY, all);
};

const playerScrollerIsContainer = () => {
    const container = document.getElementById(PLAYER_SCROLL_ID) || document.getElementById('main-scroll-container');
    if (!container) return false;
    const overflowY = window.getComputedStyle(container).overflowY;
    return overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay';
};

export const readPlayerScrollTop = () => {
    if (typeof window === 'undefined') return 0;
    const container = document.getElementById(PLAYER_SCROLL_ID) || document.getElementById('main-scroll-container');
    if (container && playerScrollerIsContainer()) return Math.max(0, Math.round(container.scrollTop || 0));
    return Math.max(0, Math.round(window.scrollY || document.documentElement.scrollTop || 0));
};

export const writePlayerScrollTop = (top: number) => {
    if (typeof window === 'undefined') return;
    const container = document.getElementById(PLAYER_SCROLL_ID) || document.getElementById('main-scroll-container');
    if (container) container.scrollTop = top;
    window.scrollTo(0, top);
};

export const stashPlayerHomeScroll = () => {
    if (typeof window === 'undefined') return;
    try {
        window.sessionStorage.setItem(PLAYER_HOME_SCROLL_KEY, String(readPlayerScrollTop()));
    } catch {
        /* ignore */
    }
};

export const restorePlayerHomeScroll = () => {
    if (typeof window === 'undefined') return;
    const top = Number(window.sessionStorage.getItem(PLAYER_HOME_SCROLL_KEY));
    if (!Number.isFinite(top) || top <= 0) return;
    writePlayerScrollTop(top);
};

export const restorePlayerHomeScrollWhenReady = () => {
    if (typeof window === 'undefined') return () => undefined;
    const top = Number(window.sessionStorage.getItem(PLAYER_HOME_SCROLL_KEY));
    if (!Number.isFinite(top) || top <= 0) return () => undefined;
    let cancelled = false;
    let raf = 0;
    const started = Date.now();
    const tick = () => {
        if (cancelled) return;
        writePlayerScrollTop(top);
        if (Math.abs(readPlayerScrollTop() - top) <= 48 || Date.now() - started > 2500) return;
        raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => {
        cancelled = true;
        window.cancelAnimationFrame(raf);
    };
};

export const requestPlayerSearchFocus = () => {
    if (typeof window === 'undefined') return;
    try {
        window.sessionStorage.setItem(PLAYER_FOCUS_SEARCH_KEY, '1');
    } catch {
        /* ignore */
    }
};

export const consumePlayerSearchFocus = () => {
    if (typeof window === 'undefined') return false;
    try {
        const wanted = window.sessionStorage.getItem(PLAYER_FOCUS_SEARCH_KEY) === '1';
        if (wanted) window.sessionStorage.removeItem(PLAYER_FOCUS_SEARCH_KEY);
        return wanted;
    } catch {
        return false;
    }
};

export const focusPlayerSearchInput = () => {
    const input = document.getElementById(PLAYER_SEARCH_INPUT_ID) as HTMLInputElement | null;
    if (!input) return false;
    input.focus();
    input.select();
    return true;
};

export const readPlayerNavCollapsed = () => {
    if (typeof window === 'undefined') return false;
    try {
        return window.localStorage.getItem(PLAYER_NAV_COLLAPSED_KEY) === '1';
    } catch {
        return false;
    }
};

export const writePlayerNavCollapsed = (collapsed: boolean) => {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(PLAYER_NAV_COLLAPSED_KEY, collapsed ? '1' : '0');
    } catch {
        /* ignore */
    }
};

