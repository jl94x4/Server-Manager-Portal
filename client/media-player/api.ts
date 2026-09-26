import { apiErrorMessage, apiFetch, PORTAL_CSRF_HEADER, PORTAL_CSRF_VALUE } from '../shared/api';
import { portalUrl } from '../shared/basePath';
import { pickTmdbPersonMatch } from '../discovery/personCredits';
import { PLAYER_API_ROOT } from './paths';
import { readPlayerItemCache, writePlayerItemCache, writePlayerHomeCache, isPlayerHomeCacheFresh, readPlayerHomeCache, writeHeroSlidesCache, writePlayerLibrariesCache } from './playerMemory';
import { browserPlaybackCaps, plexBackdropPreviewUrl, plexBackdropUrl, prefetchPlayerImages } from './playerUtils';
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
    PlayerProfile,
    PlayerSection,
} from './types';

const prefetchItemBackdrop = (item?: { art?: string | null } | null) => {
    const art = item?.art;
    if (!art) return;
    prefetchPlayerImages([plexBackdropPreviewUrl(art), plexBackdropUrl(art)], 2);
};

const prefetchHeroBackdrops = (items?: Array<{ art?: string | null } | null>) => {
    const list = (items || []).filter((item) => item?.art).slice(0, 3);
    const urls: string[] = [];
    list.forEach((item, index) => {
        urls.push(plexBackdropPreviewUrl(item.art));
        if (index === 0) urls.push(plexBackdropUrl(item.art));
    });
    prefetchPlayerImages(urls, 4);
};

let meInflight: Promise<PlayerProfile> | null = null;
let meCache: PlayerProfile | null = null;

export const fetchMediaPlayerMe = () => {
    if (meCache) return Promise.resolve(meCache);
    if (meInflight) return meInflight;
    meInflight = (apiFetch(`${PLAYER_API_ROOT}/me`) as Promise<PlayerProfile>)
        .then((data) => {
            meCache = data;
            return data;
        })
        .finally(() => {
            meInflight = null;
        });
    return meInflight;
};

let homeInflight: Promise<PlayerHome> | null = null;

export const fetchMediaPlayerHome = () => {
    if (homeInflight) return homeInflight;
    homeInflight = (apiFetch(`${PLAYER_API_ROOT}/home`) as Promise<PlayerHome>)
        .then((data) => {
            writePlayerHomeCache(data);
            return data;
        })
        .finally(() => {
            homeInflight = null;
        });
    return homeInflight;
};

/** Kick off nav + home during auth/boot so the first paint rarely waits on cold fetches. */
export const prefetchMediaPlayerHome = () => {
    void fetchMediaPlayerLibraries().catch(() => undefined);
    void fetchMediaPlayerMe().catch(() => undefined);
    if (!(readPlayerHomeCache() && isPlayerHomeCacheFresh())) {
        void fetchMediaPlayerHome().catch(() => undefined);
    }
    void fetchMediaPlayerHomeHero()
        .then((data) => {
            const items = data?.enabled && Array.isArray(data.items) ? data.items : [];
            if (items.length) {
                writeHeroSlidesCache(items);
                prefetchHeroBackdrops(items);
            }
        })
        .catch(() => undefined);
};

export type MediaPlayerHomeHeroPayload = {
    enabled: boolean;
    mode?: string;
    effectiveMode?: string;
    refreshedAt?: number | null;
    expiresAt?: number | null;
    items: Array<{
        ratingKey: string;
        title: string;
        type: string;
        year?: number | null;
        summary?: string;
        thumb?: string | null;
        art?: string | null;
        logo?: string | null;
        backdropUrl?: string | null;
        posterUrl?: string | null;
        tmdbId?: number | null;
        canPlay?: boolean;
    }>;
    reason?: string;
};

export const fetchMediaPlayerHomeHero = () => (
    (apiFetch(`${PLAYER_API_ROOT}/home-hero`) as Promise<MediaPlayerHomeHeroPayload>)
        .then((data) => {
            if (data?.enabled && Array.isArray(data.items)) prefetchHeroBackdrops(data.items);
            return data;
        })
);

export const fetchMediaPlayerHomeHeroRefresh = () => (
    apiFetch(`${PLAYER_API_ROOT}/home-hero?refresh=1`) as Promise<MediaPlayerHomeHeroPayload>
);

export const fetchMediaPlayerHomeHeroConfig = () => (
    apiFetch(`${PLAYER_API_ROOT}/home-hero-config`) as Promise<{
        mode: string;
        seasonalInWindowOnly: boolean;
        continueWatchingSeasonPoster?: boolean;
    }>
);

export const saveMediaPlayerHomeHeroConfig = (payload: {
    mode: string;
    seasonalInWindowOnly: boolean;
    continueWatchingSeasonPoster?: boolean;
}) => (
    apiFetch(`${PLAYER_API_ROOT}/home-hero-config`, {
        method: 'PUT',
        body: JSON.stringify(payload),
    }) as Promise<{
        mode: string;
        seasonalInWindowOnly: boolean;
        continueWatchingSeasonPoster?: boolean;
        saved?: boolean;
    }>
);

let librariesInflight: Promise<{ libraries: PlayerSection[] }> | null = null;

export const fetchMediaPlayerLibraries = () => {
    if (librariesInflight) return librariesInflight;
    librariesInflight = (apiFetch(`${PLAYER_API_ROOT}/libraries`) as Promise<{ libraries: PlayerSection[] }>)
        .then((data) => {
            writePlayerLibrariesCache(data?.libraries || []);
            return data;
        })
        .finally(() => {
            librariesInflight = null;
        });
    return librariesInflight;
};

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

export const fetchMediaPlayerCollection = (ratingKey: string, sectionKey?: string) => {
    const qs = sectionKey ? `?section=${encodeURIComponent(sectionKey)}` : '';
    return apiFetch(`${PLAYER_API_ROOT}/collection/${encodeURIComponent(ratingKey)}${qs}`) as Promise<PlayerItemPage>;
};

export const fetchMediaPlayerHub = (path: string, opts: { title?: string; identifier?: string } = {}) => {
    const qs = new URLSearchParams({ path });
    if (opts.title) qs.set('title', opts.title);
    if (opts.identifier) qs.set('identifier', opts.identifier);
    return apiFetch(`${PLAYER_API_ROOT}/hub?${qs.toString()}`) as Promise<{ title: string; items: PlayerItem[] }>;
};

let playlistsInflight: Promise<{ items: PlayerItem[] }> | null = null;
let playlistsCache: { at: number; items: PlayerItem[] } | null = null;
const PLAYLISTS_CACHE_TTL_MS = 60_000;

export const fetchMediaPlayerPlaylists = (opts: { force?: boolean } = {}) => {
    if (!opts.force && playlistsCache && Date.now() - playlistsCache.at < PLAYLISTS_CACHE_TTL_MS) {
        return Promise.resolve({ items: playlistsCache.items });
    }
    if (!opts.force && playlistsInflight) return playlistsInflight;
    playlistsInflight = apiFetch(`${PLAYER_API_ROOT}/playlists`)
        .then((data: { items?: PlayerItem[] }) => {
            const items = Array.isArray(data?.items) ? data.items : [];
            playlistsCache = { at: Date.now(), items };
            return { items };
        })
        .finally(() => {
            playlistsInflight = null;
        });
    return playlistsInflight;
};

export const fetchMediaPlayerPlaylist = (ratingKey: string) => (
    apiFetch(`${PLAYER_API_ROOT}/playlists/${encodeURIComponent(ratingKey)}`) as Promise<PlayerItemPage>
);

export const createMediaPlayerPlaylist = async (title: string, ratingKey?: string) => {
    const created = await apiFetch(`${PLAYER_API_ROOT}/playlists`, {
        method: 'POST',
        body: JSON.stringify({ title, ratingKey }),
    }) as { item: PlayerItem };
    playlistsCache = null;
    return created;
};

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

export const removeMediaPlayerProgress = (ratingKey: string) => (
    apiFetch(`${PLAYER_API_ROOT}/progress/${encodeURIComponent(ratingKey)}`, {
        method: 'DELETE',
    })
);

export const deleteMediaPlayerItem = (ratingKey: string) => (
    apiFetch(`${PLAYER_API_ROOT}/item/${encodeURIComponent(ratingKey)}`, {
        method: 'DELETE',
    })
);

export const mediaPlayerDownloadUrl = (ratingKey: string, mediaIndex = 0) => {
    const qs = new URLSearchParams({ download: '1' });
    if (mediaIndex) qs.set('mediaIndex', String(mediaIndex));
    return `${PLAYER_API_ROOT}/file/${encodeURIComponent(ratingKey)}?${qs}`;
};

/** Trigger a browser file download without navigating away (large media-safe). */
export const startMediaPlayerDownload = async (ratingKey: string, mediaIndex = 0) => {
    const href = portalUrl(mediaPlayerDownloadUrl(ratingKey, mediaIndex));
    const probe = await fetch(href, {
        method: 'GET',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: {
            Accept: '*/*',
            Range: 'bytes=0-0',
            [PORTAL_CSRF_HEADER]: PORTAL_CSRF_VALUE,
        },
    });
    if (!probe.ok && probe.status !== 206) {
        const text = await probe.text().catch(() => '');
        throw new Error(apiErrorMessage(probe.status, text));
    }
    try {
        if (probe.body && typeof probe.body.cancel === 'function') await probe.body.cancel();
    } catch {
        /* ignore */
    }

    // Prefer a real navigation download. Keep the element briefly — removing it
    // immediately can cancel the browser's download in some engines.
    const anchor = document.createElement('a');
    anchor.href = href;
    anchor.target = '_blank';
    anchor.rel = 'noopener';
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    window.setTimeout(() => {
        try { anchor.remove(); } catch { /* ignore */ }
    }, 2000);
};

export const fetchMediaPlayerNext = (ratingKey: string) => (
    apiFetch(`${PLAYER_API_ROOT}/next/${encodeURIComponent(ratingKey)}`) as Promise<{ item: PlayerItem | null }>
);

export const fetchMediaPlayerNeighbors = (ratingKey: string) => (
    apiFetch(`${PLAYER_API_ROOT}/neighbors/${encodeURIComponent(ratingKey)}`) as Promise<{
        previous: PlayerItem | null;
        next: PlayerItem | null;
    }>
);

const itemInflight = new Map<string, Promise<PlayerItemPage>>();

export const fetchMediaPlayerItem = (ratingKey: string, opts: { core?: boolean } = {}) => {
    const key = `${ratingKey}|${opts.core ? '1' : '0'}`;
    const existing = itemInflight.get(key);
    if (existing) return existing;
    const qs = opts.core ? '?core=1' : '';
    const promise = (apiFetch(`${PLAYER_API_ROOT}/item/${encodeURIComponent(ratingKey)}${qs}`) as Promise<PlayerItemPage>)
        .then((data) => {
            const prev = readPlayerItemCache(ratingKey);
            writePlayerItemCache(ratingKey, {
                item: data.item,
                children: data.children || [],
                extras: data.extras?.length ? data.extras : (prev?.extras || []),
                related: data.related?.length ? data.related : (prev?.related || []),
                onDeck: data.onDeck !== undefined ? data.onDeck : (prev?.onDeck ?? null),
            });
            prefetchItemBackdrop(data.item);
            return data;
        })
        .finally(() => {
            itemInflight.delete(key);
        });
    itemInflight.set(key, promise);
    return promise;
};

/** Warm overview cache while a poster is focused (TV leanback). */
export const prefetchMediaPlayerItem = (ratingKey: string) => {
    const key = String(ratingKey || '').trim();
    if (!key || !/^\d+$/.test(key)) return;
    const cached = readPlayerItemCache(key);
    if (cached?.item) {
        prefetchItemBackdrop(cached.item);
        return;
    }
    if (itemInflight.has(`${key}|1`) || itemInflight.has(`${key}|0`)) return;
    void fetchMediaPlayerItem(key, { core: true }).catch(() => undefined);
};

export const fetchMediaPlayerItemMore = (ratingKey: string) => (
    apiFetch(`${PLAYER_API_ROOT}/item/${encodeURIComponent(ratingKey)}/more`) as Promise<{
        extras: PlayerItemPage['extras'];
        related: PlayerItemPage['related'];
        onDeck?: PlayerItemPage['onDeck'];
    }>
);

export const fetchMediaPlayerPerson = (actorId: string, name = '') => {
    const qs = new URLSearchParams();
    if (name) qs.set('name', name);
    const suffix = qs.toString() ? `?${qs}` : '';
    return apiFetch(`${PLAYER_API_ROOT}/person/${encodeURIComponent(actorId)}${suffix}`) as Promise<PlayerPersonPage>;
};

export const fetchMediaPlayerStudio = (
    studioKey: string,
    opts: { name?: string; sectionKey?: string; mediaType?: 'movie' | 'show' } = {},
) => {
    const qs = new URLSearchParams();
    if (opts.name) qs.set('name', opts.name);
    if (opts.sectionKey) qs.set('section', opts.sectionKey);
    if (opts.mediaType) qs.set('type', opts.mediaType);
    const suffix = qs.toString() ? `?${qs}` : '';
    return apiFetch(`${PLAYER_API_ROOT}/studio/${encodeURIComponent(studioKey)}${suffix}`) as Promise<{
        studio: { key: string; name: string };
        items: PlayerItem[];
    }>;
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
    if (data.profile?.name || data.profile?.biography || data.profile?.birthday || data.profile?.placeOfBirth) {
        return {
            person: { name: resolvedName, thumb: thumb || data.person?.thumb || null },
            items,
            profile: data.profile,
        };
    }
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
    audioStreamId?: string | null;
    subtitleStreamId?: string | null;
} = {}) => {
    const caps = browserPlaybackCaps();
    const isNativeApp = typeof window !== 'undefined' && !!window.__PLEX_CLIENT__;
    const qs = new URLSearchParams({ client: isNativeApp ? 'android' : 'web' });
    if (isNativeApp) {
        qs.set('textSubs', '1');
        qs.set('hevc', '1');
        qs.set('ac3', '1');
    }
    if (opts.offsetMs != null) qs.set('offsetMs', String(opts.offsetMs));
    if (opts.qualityId && opts.qualityId !== 'auto') qs.set('qualityId', opts.qualityId);
    if (opts.mediaIndex != null) qs.set('mediaIndex', String(opts.mediaIndex));
    if (opts.audioLanguage) qs.set('audioLanguage', opts.audioLanguage);
    if (opts.subtitleMode) qs.set('subtitleMode', opts.subtitleMode);
    if (opts.audioStreamId != null && String(opts.audioStreamId).replace(/\D/g, '')) {
        qs.set('audioStreamId', String(opts.audioStreamId).replace(/\D/g, ''));
    }
    if (opts.subtitleStreamId !== undefined) {
        qs.set('subtitleStreamId', String(opts.subtitleStreamId || '').replace(/\D/g, '') || '0');
    }
    if (caps.hevc) qs.set('canPlayHevc', '1');
    if (caps.ac3) qs.set('canPlayAc3', '1');
    if (caps.hls) qs.set('canPlayNativeHls', '1');
    return apiFetch(`${PLAYER_API_ROOT}/play/${encodeURIComponent(ratingKey)}?${qs}`) as Promise<PlayerPlaySession>;
};

export const reportMediaPlayerTimeline = (payload: {
    ratingKey: string;
    sessionId: string;
    state: 'playing' | 'paused' | 'buffering' | 'stopped';
    timeMs: number;
    durationMs: number;
    audioStreamId?: string | null;
    subtitleStreamId?: string | null;
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
