import { apiFetch } from '../shared/api';
import type {
    PlayerHome,
    PlayerItemPage,
    PlayerLibraryPage,
    PlayerPlaySession,
    PlayerSection,
} from './types';

export const fetchMediaPlayerHome = () => apiFetch('/api/media-player/home') as Promise<PlayerHome>;

export const fetchMediaPlayerLibraries = () => (
    apiFetch('/api/media-player/libraries') as Promise<{ libraries: PlayerSection[] }>
);

export const fetchMediaPlayerLibrary = (sectionKey: string, start = 0, size = 50) => (
    apiFetch(`/api/media-player/libraries/${encodeURIComponent(sectionKey)}?start=${start}&size=${size}`) as Promise<PlayerLibraryPage>
);

export const fetchMediaPlayerItem = (ratingKey: string) => (
    apiFetch(`/api/media-player/item/${encodeURIComponent(ratingKey)}`) as Promise<PlayerItemPage>
);

export const searchMediaPlayer = (query: string) => (
    apiFetch(`/api/media-player/search?q=${encodeURIComponent(query)}`) as Promise<{ results: PlayerItemPage['item'][] }>
);

export const startMediaPlayerPlayback = (ratingKey: string, offsetMs?: number) => (
    apiFetch(`/api/media-player/play/${encodeURIComponent(ratingKey)}`, {
        method: 'POST',
        body: JSON.stringify({ offsetMs: offsetMs || 0 }),
    }) as Promise<PlayerPlaySession>
);
