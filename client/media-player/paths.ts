export const PLAYER_APP_BASE = '/media-player';
export const PLAYER_API_ROOT = '/api/media-player';
export const PLAYER_IMAGE_PATH = '/api/plex/image';
export const PLAYER_NAVIGATE_EVENT = 'portal-media-player-navigate';
export const PLAYER_EXIT_EVENT = 'portal-media-player-exit';
export const PLAYER_SCROLL_ID = 'media-player-scroll';

export const exitToPortal = () => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new Event(PLAYER_EXIT_EVENT));
};
