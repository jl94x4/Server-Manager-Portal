import { apiFetch } from '../shared/api';
import { pickTmdbPersonMatch } from '../discovery/personCredits';
import { PLAYER_API_ROOT } from './paths';
import { browserPlaybackCaps } from './playerUtils';
import type {
    PlayerHome,
    PlayerItem,
    PlayerItemPage,
    PlayerLibraryFilters,
    PlayerLibraryHome,
    PlayerLibraryPage,
    PlayerPlaySession,
    PlayerPersonBundle,
    PlayerPersonPage,
    PlayerPersonProfile,
    PlayerSection,
} from './types';

export const fetchMediaPlayerHome = () => apiFetch(`${PLAYER_API_ROOT}/home`) as Promise<PlayerHome>;

export const fetchMediaPlayerLibraries = () => (
    apiFetch(`${PLAYER_API_ROOT}/libraries`) as Promise<{ libraries: PlayerSection[] }>
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
    return apiFetch(`${PLAYER_API_ROOT}/libraries/${encodeURIComponent(sectionKey)}?${qs}`) as Promise<PlayerLibraryPage>;
};

export const fetchMediaPlayerLibraryHome = (sectionKey: string) => (
    apiFetch(`${PLAYER_API_ROOT}/libraries/${encodeURIComponent(sectionKey)}/home`) as Promise<PlayerLibraryHome>
);

export const fetchMediaPlayerLibraryFilters = (sectionKey: string) => (
    apiFetch(`${PLAYER_API_ROOT}/libraries/${encodeURIComponent(sectionKey)}/filters`) as Promise<PlayerLibraryFilters>
);

export const fetchMediaPlayerCollections = (sectionKey: string) => (
    apiFetch(`${PLAYER_API_ROOT}/libraries/${encodeURIComponent(sectionKey)}/collections`) as Promise<{ title: string; items: PlayerItem[] }>
);

export const fetchMediaPlayerCollection = (ratingKey: string) => (
    apiFetch(`${PLAYER_API_ROOT}/collection/${encodeURIComponent(ratingKey)}`) as Promise<PlayerItemPage>
);

export const fetchMediaPlayerPlaylists = () => (
    apiFetch(`${PLAYER_API_ROOT}/playlists`) as Promise<{ items: PlayerItem[] }>
);

export const fetchMediaPlayerPlaylist = (ratingKey: string) => (
    apiFetch(`${PLAYER_API_ROOT}/playlists/${encodeURIComponent(ratingKey)}`) as Promise<PlayerItemPage>
);

export const createMediaPlayerPlaylist = (title: string, ratingKey?: string) => (
    apiFetch(`${PLAYER_API_ROOT}/playlists`, {
        method: 'POST',
        body: JSON.stringify({ title, ratingKey }),
    }) as Promise<{ item: PlayerItem }>
);

export const addMediaPlayerPlaylistItem = (playlistKey: string, ratingKey: string) => (
    apiFetch(`${PLAYER_API_ROOT}/playlists/${encodeURIComponent(playlistKey)}/items`, {
        method: 'POST',
        body: JSON.stringify({ ratingKey }),
    })
);

export const setMediaPlayerWatched = (ratingKey: string, watched: boolean) => (
    apiFetch(`${PLAYER_API_ROOT}/${watched ? 'scrobble' : 'unscrobble'}/${encodeURIComponent(ratingKey)}`, {
        method: 'POST',
    })
);

export const fetchMediaPlayerNext = (ratingKey: string) => (
    apiFetch(`${PLAYER_API_ROOT}/next/${encodeURIComponent(ratingKey)}`) as Promise<{ item: PlayerItem | null }>
);

export const fetchMediaPlayerItem = (ratingKey: string) => (
    apiFetch(`${PLAYER_API_ROOT}/item/${encodeURIComponent(ratingKey)}`) as Promise<PlayerItemPage>
);

export const fetchMediaPlayerPerson = (actorId: string, name = '') => {
    const qs = new URLSearchParams();
    if (name) qs.set('name', name);
    const suffix = qs.toString() ? `?${qs}` : '';
    return apiFetch(`${PLAYER_API_ROOT}/person/${encodeURIComponent(actorId)}${suffix}`) as Promise<PlayerPersonPage>;
};

const searchDiscoveryPeople = async (query: string) => {
    const q = String(query || '').trim();
    if (q.length < 2) return [];
    const fromSearch = await apiFetch(`/api/discovery/search?query=${encodeURIComponent(q)}`).catch(() => null);
    const searchRows = Array.isArray(fromSearch?.results) ? fromSearch.results : [];
    if (pickTmdbPersonMatch(searchRows, { name: q })) return searchRows;
    const proxy = await apiFetch(`/api/discovery/proxy/search?query=${encodeURIComponent(q)}`).catch(() => null);
    const proxyRows = Array.isArray(proxy?.results) ? proxy.results : [];
    return proxyRows.length ? proxyRows : searchRows;
};

export const fetchPlayerPersonBundle = async (
    actorId: string,
    name = '',
    thumb?: string | null,
): Promise<PlayerPersonBundle> => {
    const queryName = String(name || '').trim();
    const data = await fetchMediaPlayerPerson(actorId, queryName);
    const items = data.items || [];
    const resolvedName = String(data.person?.name || queryName).trim();
    let rows = await searchDiscoveryPeople(queryName);
    if (resolvedName && resolvedName.toLowerCase() !== queryName.toLowerCase()) {
        const extra = await searchDiscoveryPeople(resolvedName);
        if (extra.length) rows = extra;
    }
    const match = pickTmdbPersonMatch(rows, {
        name: resolvedName,
        knownTitles: items.map((row) => row.title),
    });
    const tmdbId = Number(match?.id);
    const profile = Number.isFinite(tmdbId) && tmdbId > 0
        ? await apiFetch(`/api/discovery/proxy/person/${tmdbId}`).catch(() => null) as PlayerPersonProfile | null
        : null;
    return {
        person: { name: resolvedName, thumb: thumb || data.person?.thumb || null },
        items,
        profile,
    };
};

export const searchMediaPlayer = (query: string) => (
    apiFetch(`${PLAYER_API_ROOT}/search?q=${encodeURIComponent(query)}`) as Promise<{ results: PlayerItemPage['item'][] }>
);

export const fetchMediaPlayerSettings = () => (
    apiFetch(`${PLAYER_API_ROOT}/settings`) as Promise<Record<string, unknown>>
);

export const saveMediaPlayerSettings = (settings: Record<string, unknown>) => (
    apiFetch(`${PLAYER_API_ROOT}/settings`, {
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
    return apiFetch(`${PLAYER_API_ROOT}/play/${encodeURIComponent(ratingKey)}`, {
        method: 'POST',
        body: JSON.stringify({
            ...(opts.offsetMs == null ? {} : { offsetMs: opts.offsetMs }),
            qualityId: opts.qualityId && opts.qualityId !== 'auto' ? opts.qualityId : undefined,
            mediaIndex: opts.mediaIndex,
            audioLanguage: opts.audioLanguage || undefined,
            subtitleMode: opts.subtitleMode || undefined,
            client: 'web',
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
    apiFetch(`${PLAYER_API_ROOT}/timeline`, {
        method: 'POST',
        body: JSON.stringify(payload),
        keepalive: true,
    }).catch(() => undefined)
);

export const stopMediaPlayerTranscode = (sessionId?: string | null) => {
    const id = String(sessionId || '').trim();
    if (!id) return Promise.resolve();
    return apiFetch(`${PLAYER_API_ROOT}/stop`, {
        method: 'POST',
        body: JSON.stringify({ sessionId: id }),
        keepalive: true,
    }).catch(() => undefined);
};
