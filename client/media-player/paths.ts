export const PLAYER_APP_BASE = '/media-player';
export const PLAYER_API_ROOT = '/api/media-player';
export const PLAYER_IMAGE_PATH = '/api/plex/image';
export const PLAYER_NAVIGATE_EVENT = 'portal-media-player-navigate';
export const PLAYER_EXIT_EVENT = 'portal-media-player-exit';
export const PLAYER_SCROLL_ID = 'media-player-scroll';

export const exitToPortal = () => {
    if (typeof window === 'undefined') return;
    // Capacitor app has no portal chrome to return to.
    if (window.__PLEX_CLIENT__) {
        try {
            window.history.replaceState({}, '', PLAYER_APP_BASE);
            window.dispatchEvent(new Event(PLAYER_NAVIGATE_EVENT));
        } catch {
            /* ignore */
        }
        return;
    }
    window.dispatchEvent(new Event(PLAYER_EXIT_EVENT));
};
