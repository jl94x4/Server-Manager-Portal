import { apiFetch } from '../shared/api';
import { browserPlaybackCaps } from './playerUtils';
import type {
    PlayerHome,
    PlayerItem,
    PlayerItemPage,
    PlayerLibraryFilters,
    PlayerLibraryHome,
    PlayerLibraryPage,
    PlayerPlaySession,
    PlayerPersonPage,
    PlayerSection,
} from './types';

export const fetchMediaPlayerHome = () => apiFetch('/api/media-player/home') as Promise<PlayerHome>;

export const fetchMediaPlayerLibraries = () => (
    apiFetch('/api/media-player/libraries') as Promise<{ libraries: PlayerSection[] }>
);

export const fetchMediaPlayerLibrary = (
    sectionKey: string,
    start = 0,
    size = 50,
    opts: {
        sort?: string;
        genre?: string;
        decade?: string;
        resolution?: string;
        studio?: string;
        unwatched?: boolean;
        inProgress?: boolean;
    } = {},
) => {
    const qs = new URLSearchParams({
        start: String(start),
        size: String(size),
    });
    if (opts.sort) qs.set('sort', opts.sort);
    if (opts.genre) qs.set('genre', opts.genre);
    if (opts.decade) qs.set('decade', opts.decade);
    if (opts.resolution) qs.set('resolution', opts.resolution);
    if (opts.studio) qs.set('studio', opts.studio);
    if (opts.inProgress) qs.set('inProgress', '1');
    else if (opts.unwatched) qs.set('unwatched', '1');
    return apiFetch(`/api/media-player/libraries/${encodeURIComponent(sectionKey)}?${qs}`) as Promise<PlayerLibraryPage>;
};

export const fetchMediaPlayerLibraryHome = (sectionKey: string) => (
    apiFetch(`/api/media-player/libraries/${encodeURIComponent(sectionKey)}/home`) as Promise<PlayerLibraryHome>
);

export const fetchMediaPlayerLibraryFilters = (sectionKey: string) => (
    apiFetch(`/api/media-player/libraries/${encodeURIComponent(sectionKey)}/filters`) as Promise<PlayerLibraryFilters>
);

export const fetchMediaPlayerCollections = (sectionKey: string) => (
    apiFetch(`/api/media-player/libraries/${encodeURIComponent(sectionKey)}/collections`) as Promise<{ title: string; items: PlayerItem[] }>
);

export const fetchMediaPlayerCollection = (ratingKey: string) => (
    apiFetch(`/api/media-player/collection/${encodeURIComponent(ratingKey)}`) as Promise<PlayerItemPage>
);

export const fetchMediaPlayerPlaylists = () => (
    apiFetch('/api/media-player/playlists') as Promise<{ items: PlayerItem[] }>
);

export const fetchMediaPlayerPlaylist = (ratingKey: string) => (
    apiFetch(`/api/media-player/playlists/${encodeURIComponent(ratingKey)}`) as Promise<PlayerItemPage>
);

export const createMediaPlayerPlaylist = (title: string, ratingKey?: string) => (
    apiFetch('/api/media-player/playlists', {
        method: 'POST',
        body: JSON.stringify({ title, ratingKey }),
    }) as Promise<{ item: PlayerItem }>
);

export const addMediaPlayerPlaylistItem = (playlistKey: string, ratingKey: string) => (
    apiFetch(`/api/media-player/playlists/${encodeURIComponent(playlistKey)}/items`, {
        method: 'POST',
        body: JSON.stringify({ ratingKey }),
    })
);

export const setMediaPlayerWatched = (ratingKey: string, watched: boolean) => (
    apiFetch(`/api/media-player/${watched ? 'scrobble' : 'unscrobble'}/${encodeURIComponent(ratingKey)}`, {
        method: 'POST',
    })
);

export const fetchMediaPlayerNext = (ratingKey: string) => (
    apiFetch(`/api/media-player/next/${encodeURIComponent(ratingKey)}`) as Promise<{ item: PlayerItem | null }>
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

export const fetchMediaPlayerSettings = () => (
    apiFetch('/api/media-player/settings') as Promise<Record<string, unknown>>
);

export const saveMediaPlayerSettings = (settings: Record<string, unknown>) => (
    apiFetch('/api/media-player/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
    }) as Promise<Record<string, unknown>>
);

export const startMediaPlayerPlayback = (ratingKey: string, opts: {
    offsetMs?: number | null;
    qualityId?: string;
    mediaIndex?: number;
    audioLanguage?: string;
    subtitleMode?: string;
} = {}) => {
    const caps = browserPlaybackCaps();
    return apiFetch(`/api/media-player/play/${encodeURIComponent(ratingKey)}`, {
        method: 'POST',
        body: JSON.stringify({
            ...(opts.offsetMs == null ? {} : { offsetMs: opts.offsetMs }),
            qualityId: opts.qualityId && opts.qualityId !== 'auto' ? opts.qualityId : undefined,
            mediaIndex: opts.mediaIndex,
            audioLanguage: opts.audioLanguage || undefined,
            subtitleMode: opts.subtitleMode || undefined,
            canPlayHevc: caps.hevc,
            canPlayAc3: caps.ac3,
            canPlayNativeHls: caps.hls,
        }),
    }) as Promise<PlayerPlaySession>;
};

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

export const stopMediaPlayerTranscode = (sessionId?: string | null) => {
    const id = String(sessionId || '').trim();
    if (!id) return Promise.resolve();
    return apiFetch('/api/media-player/stop', {
        method: 'POST',
        body: JSON.stringify({ sessionId: id }),
        keepalive: true,
    }).catch(() => undefined);
};
