import { apiFetch } from '../shared/api';
import type {
    PlayerHome,
    PlayerItemPage,
    PlayerLibraryPage,
    PlayerPlaySession,
    PlayerPersonPage,
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

export const fetchMediaPlayerPerson = (actorId: string, name = '') => {
    const qs = new URLSearchParams();
    if (name) qs.set('name', name);
    const suffix = qs.toString() ? `?${qs}` : '';
    return apiFetch(`/api/media-player/person/${encodeURIComponent(actorId)}${suffix}`) as Promise<PlayerPersonPage>;
};

export const searchMediaPlayer = (query: string) => (
    apiFetch(`/api/media-player/search?q=${encodeURIComponent(query)}`) as Promise<{ results: PlayerItemPage['item'][] }>
);

export const startMediaPlayerPlayback = (ratingKey: string, offsetMs?: number) => (
    apiFetch(`/api/media-player/play/${encodeURIComponent(ratingKey)}`, {
        method: 'POST',
        body: JSON.stringify({ offsetMs: offsetMs || 0 }),
    }) as Promise<PlayerPlaySession>
);

export const reportMediaPlayerTimeline = (payload: {
    ratingKey: string;
    sessionId: string;
    state: 'playing' | 'paused' | 'buffering' | 'stopped';
    timeMs: number;
    durationMs: number;
}) => (
    apiFetch('/api/media-player/timeline', {
        method: 'POST',
        body: JSON.stringify(payload),
        keepalive: true,
    }).catch(() => undefined)
);
