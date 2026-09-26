import { portalUrl, resolvePortalAssetUrl } from '../shared/basePath';
import { PLAYER_API_ROOT, PLAYER_IMAGE_PATH } from './paths';
import type { PlayerContinueWatchingLayout } from './playerSettings';
import type { PlayerItem } from './types';

/** Shared rail size so home, library, and season grids hit the same cached JPEG. */
export const PLAYER_POSTER_WIDTH = 300;
export const PLAYER_POSTER_HEIGHT = 450;
export const PLAYER_POSTER_QUALITY = 60;

const prefetchedPlayerImages = new Set<string>();

export const prefetchPlayerImages = (urls: Array<string | null | undefined>, limit = 12) => {
    if (typeof window === 'undefined') return;
    let started = 0;
    for (const url of urls) {
        if (!url || prefetchedPlayerImages.has(url)) continue;
        prefetchedPlayerImages.add(url);
        const img = new Image();
        img.decoding = 'async';
        img.src = url;
        started += 1;
        if (started >= limit) return;
    }
};

export const plexImageUrl = (path?: string | null, width = PLAYER_POSTER_WIDTH, height = PLAYER_POSTER_HEIGHT, opts?: { fit?: 'contain' | 'cover'; quality?: number }) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/api/')) {
        return resolvePortalAssetUrl(path);
    }
    const params = new URLSearchParams({
        path,
        width: String(width),
        height: String(height),
    });
    if (opts?.fit === 'contain') params.set('fit', 'contain');
    if (opts?.quality) params.set('quality', String(opts.quality));
    return portalUrl(`${PLAYER_IMAGE_PATH}?${params.toString()}`);
};

export const playerCardImageUrl = (thumb?: string | null, aspect: '2/3' | 'square' | '16/9' = '2/3') => {
    if (!thumb) return '';
    if (aspect === '16/9') return plexImageUrl(thumb, 426, 240, { quality: PLAYER_POSTER_QUALITY });
    if (aspect === 'square') return plexImageUrl(thumb, 300, 300, { quality: PLAYER_POSTER_QUALITY });
    return plexImageUrl(thumb, PLAYER_POSTER_WIDTH, PLAYER_POSTER_HEIGHT, { quality: PLAYER_POSTER_QUALITY });
};

export const plexLogoUrl = (path?: string | null) => plexImageUrl(path, 640, 240, { fit: 'contain', quality: 70 });

/**
 * TV layout is 1920 CSS px (4K zooms down to that). Plex art is almost always
 * 1920×1080, and upscale=0 means a 4K request adds bytes/decode time with no extra detail.
 */
export const PLAYER_BACKDROP_WIDTH = 1920;
export const PLAYER_BACKDROP_HEIGHT = 1080;
export const PLAYER_BACKDROP_QUALITY = 85;
export const PLAYER_BACKDROP_PREVIEW_WIDTH = 640;
export const PLAYER_BACKDROP_PREVIEW_HEIGHT = 360;
export const PLAYER_BACKDROP_PREVIEW_QUALITY = 40;

const tmdbBackdropSize = (url: string, size: 'w300' | 'w1280') => (
    url.replace(/\/\/image\.tmdb\.org\/t\/p\/(?:original|w\d+)/, `//image.tmdb.org/t/p/${size}`)
);

const withPlexImageSize = (url: string, width: number, height: number, quality: number) => {
    const resolved = resolvePortalAssetUrl(url);
    if (!resolved.includes('/api/plex/image')) return tmdbBackdropSize(resolved, quality <= 50 ? 'w300' : 'w1280');
    const hashAt = resolved.indexOf('#');
    const withoutHash = hashAt >= 0 ? resolved.slice(0, hashAt) : resolved;
    const qAt = withoutHash.indexOf('?');
    const base = qAt >= 0 ? withoutHash.slice(0, qAt) : withoutHash;
    const params = new URLSearchParams(qAt >= 0 ? withoutHash.slice(qAt + 1) : '');
    params.set('width', String(width));
    params.set('height', String(height));
    params.set('quality', String(quality));
    return portalUrl(`${base}?${params.toString()}`);
};

export const plexBackdropUrl = (path?: string | null) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/api/')) {
        return withPlexImageSize(path, PLAYER_BACKDROP_WIDTH, PLAYER_BACKDROP_HEIGHT, PLAYER_BACKDROP_QUALITY);
    }
    return plexImageUrl(path, PLAYER_BACKDROP_WIDTH, PLAYER_BACKDROP_HEIGHT, { quality: PLAYER_BACKDROP_QUALITY });
};

export const plexBackdropPreviewUrl = (path?: string | null) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/api/')) {
        return withPlexImageSize(
            path,
            PLAYER_BACKDROP_PREVIEW_WIDTH,
            PLAYER_BACKDROP_PREVIEW_HEIGHT,
            PLAYER_BACKDROP_PREVIEW_QUALITY,
        );
    }
    return plexImageUrl(path, PLAYER_BACKDROP_PREVIEW_WIDTH, PLAYER_BACKDROP_PREVIEW_HEIGHT, {
        quality: PLAYER_BACKDROP_PREVIEW_QUALITY,
    });
};

export const plexThemeUrl = (ratingKey?: string | null) => {
    const key = String(ratingKey || '').replace(/\D/g, '');
    if (!key) return '';
    return portalUrl(`${PLAYER_API_ROOT}/theme/${encodeURIComponent(key)}`);
};

export const formatBitrateMbps = (bitrate?: number | null) => {
    const n = Number(bitrate);
    if (!Number.isFinite(n) || n <= 0) return '';
    const mbps = n >= 100000 ? n / 1e6 : n / 1000;
    return `${mbps.toFixed(1)} Mbps`;
};

export const formatBytes = (bytes?: number | null) => {
    const n = Number(bytes);
    if (!Number.isFinite(n) || n <= 0) return '';
    if (n >= 1e9) return `${(n / 1e9).toFixed(2)} GB`;
    if (n >= 1e6) return `${Math.round(n / 1e6)} MB`;
    if (n >= 1e3) return `${Math.round(n / 1e3)} KB`;
    return `${n} B`;
};

export const formatPlayerResolution = (height?: number | null, videoResolution?: string | null) => {
    const res = String(videoResolution || '').toLowerCase();
    const h = Number(height) || 0;
    if (res.includes('4k') || res.includes('2160') || h >= 2160) return '4K';
    if (res.includes('1080') || h >= 1080) return '1080p';
    if (res.includes('720') || h >= 720) return '720p';
    if (res.includes('480') || h >= 480) return '480p';
    if (res.includes('576') || h >= 576) return '576p';
    if (videoResolution) return String(videoResolution);
    if (h) return `${h}p`;
    return '';
};

export const formatFileInfoPill = (item?: {
    versions?: Array<{
        resolution?: string | null;
        videoCodec?: string | null;
        audioCodec?: string | null;
    }>;
    mediaInfo?: Array<{
        height?: number | null;
        videoResolution?: string | null;
        videoCodec?: string | null;
        audioCodec?: string | null;
    }>;
} | null) => {
    const version = item?.versions?.[0];
    const media = item?.mediaInfo?.[0];
    const resolution = version?.resolution
        || formatPlayerResolution(media?.height, media?.videoResolution);
    const video = String(version?.videoCodec || media?.videoCodec || '').toUpperCase();
    const audio = String(version?.audioCodec || media?.audioCodec || '').toUpperCase();
    return [resolution, video, audio].filter(Boolean).join(' ');
};

export const titleCaseProfile = (value?: string | null) => {
    const raw = String(value || '').trim();
    if (!raw) return '';
    return raw.replace(/\b\w/g, (char) => char.toUpperCase());
};

export const formatMediaVideoLine = (video?: {
    width?: number | null;
    height?: number | null;
    frameRate?: string | null;
    bitrate?: number | null;
    codec?: string | null;
    level?: string | null;
    profile?: string | null;
} | null) => {
    if (!video) return '';
    const dims = video.width && video.height ? `${video.width}x${video.height}` : '';
    const fps = String(video.frameRate || '').trim();
    const fpsLabel = fps ? (/fps|p$/i.test(fps) ? fps : `${fps} fps`) : '';
    const codec = [
        String(video.codec || '').toUpperCase(),
        video.level ? String(video.level) : '',
        titleCaseProfile(video.profile),
    ].filter(Boolean).join(' ');
    return [dims, fpsLabel, formatBitrateMbps(video.bitrate), codec].filter(Boolean).join(' · ');
};

export const formatMediaAudioLine = (audio?: {
    language?: string | null;
    displayTitle?: string | null;
    codec?: string | null;
    channelLayout?: string | null;
    channels?: number | null;
    bitrate?: number | null;
    samplingRate?: number | null;
} | null) => {
    if (!audio) return '';
    const lang = String(audio.language || '').trim();
    const language = lang && !/^[a-z]{2,3}$/i.test(lang)
        ? lang
        : (String(audio.displayTitle || '').split('(')[0].trim() || lang);
    const layout = String(audio.channelLayout || '').trim().replace(/\(/, ' (')
        || (audio.channels ? String(audio.channels) : '');
    const n = Number(audio.bitrate);
    const kbps = Number.isFinite(n) && n > 0
        ? `${n >= 100000 ? Math.round(n / 1000) : Math.round(n)} kbps`
        : '';
    return [
        language,
        String(audio.codec || '').toUpperCase(),
        layout,
        kbps,
        audio.samplingRate ? `${audio.samplingRate} kHz` : '',
    ].filter(Boolean).join(' · ');
};

export const isPlayerTrailer = (item?: PlayerItem | null) => {
    const extra = String(item?.extraType || '').toLowerCase();
    const subtype = String(item?.extraSubtype || '').toLowerCase();
    return extra === '1' || extra === 'trailer' || subtype.includes('trailer');
};

export const formatPlayerDuration = (ms?: number | null) => {
    const totalMin = Math.round(Number(ms || 0) / 60000);
    if (!Number.isFinite(totalMin) || totalMin <= 0) return '';
    if (totalMin < 60) return `${totalMin}m`;
    const hours = Math.floor(totalMin / 60);
    const minutes = totalMin % 60;
    return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
};

export const formatClock = (ms?: number | null) => {
    const total = Math.max(0, Math.floor(Number(ms || 0) / 1000));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    const pad = (value: number) => String(value).padStart(2, '0');
    return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
};

export const progressPercent = (item?: PlayerItem | null) => {
    const duration = Number(item?.durationMs || 0);
    const offset = Number(item?.viewOffsetMs || 0);
    if (duration <= 0 || offset <= 0) return 0;
    return Math.min(100, Math.max(2, (offset / duration) * 100));
};

export const shouldOfferResume = (item?: PlayerItem | null, offsetMs?: number | null) => {
    const offset = offsetMs == null ? Number(item?.viewOffsetMs || 0) : Number(offsetMs);
    const duration = Number(item?.durationMs || 0);
    if (offset < 5000) return false;
    if (duration && offset > Math.max(0, duration - 15000)) return false;
    return true;
};

export const formatEpisodeCode = (item?: PlayerItem | null) => {
    const season = Number(item?.parentIndex);
    const episode = Number(item?.index);
    if (!Number.isFinite(season) || season <= 0 || !Number.isFinite(episode) || episode <= 0) return '';
    return `S${season} · E${episode}`;
};

export const formatPlayerDate = (value?: string | number | null, locale = 'en') => {
    if (value == null || value === '') return '';
    const raw = String(value);
    let date: Date;
    if (typeof value === 'number' || /^\d+$/.test(raw)) {
        const stamp = Number(value);
        date = new Date(stamp * (stamp > 1e12 ? 1 : 1000));
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
        const [year, month, day] = raw.split('-').map(Number);
        date = new Date(year, month - 1, day);
    } else {
        date = new Date(raw);
    }
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString(locale || 'en', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const unwatchedCount = (item?: PlayerItem | null) => {
    if (!item || (item.type !== 'show' && item.type !== 'season')) return 0;
    const leaves = Number(item.leafCount || 0);
    const viewed = Number(item.viewedLeafCount || 0);
    if (leaves <= 0) return 0;
    return Math.max(0, leaves - Math.min(viewed, leaves));
};

export const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

/** Recently Added must use the show poster, never the episode title card. */
export const withShowPoster = (item: PlayerItem): PlayerItem => {
    if (item.type !== 'episode' && item.type !== 'season') return item;
    const showKey = String(
        (item.type === 'season' ? item.parentRatingKey : item.grandparentRatingKey) || '',
    ).replace(/\D/g, '');
    if (!showKey) return { ...item, cardAspect: item.cardAspect || '2/3' };
    return {
        ...item,
        thumb: `/library/metadata/${showKey}/thumb`,
        cardAspect: '2/3',
    };
};

/** Poster row vs widescreen episode still + episode title (Continue Watching layout). */
export const applyContinueWatchingLayout = (
    item: PlayerItem,
    layout: PlayerContinueWatchingLayout,
): PlayerItem => {
    if (layout !== 'title') {
        if (item.type === 'episode') return { ...item, cardAspect: '2/3' };
        return item;
    }
    if (item.type !== 'episode') {
        return { ...item, cardAspect: '16/9' };
    }
    const ratingKey = String(item.ratingKey || '').replace(/\D/g, '');
    const episodeThumb = item.episodeThumb
        || (ratingKey ? `/library/metadata/${ratingKey}/thumb` : item.thumb);
    const episodeTitle = String(item.episodeTitle || item.title || '').trim() || item.title;
    return {
        ...item,
        title: episodeTitle,
        thumb: episodeThumb,
        cardAspect: '16/9',
    };
};

export const mapContinueWatchingItemsForLayout = (
    items: PlayerItem[],
    layout: PlayerContinueWatchingLayout,
): PlayerItem[] => items.map((row) => applyContinueWatchingLayout(row, layout));

export const toPosterCardItem = (item: PlayerItem) => {
    const leafThumb = item.ratingKey ? `/library/metadata/${item.ratingKey}/thumb` : '';
    const showKey = String(
        (item.type === 'season' ? item.parentRatingKey : item.grandparentRatingKey) || '',
    ).replace(/\D/g, '');
    const showThumb = showKey ? `/library/metadata/${showKey}/thumb` : '';
    const preferShowPoster = (item.type === 'episode' || item.type === 'season')
        && item.cardAspect !== '16/9'
        && (item.cardAspect === '2/3' || !item.cardAspect)
        && !!showThumb;
    const thumb = (preferShowPoster ? showThumb : '') || item.thumb || leafThumb || undefined;
    const remoteThumb = /^https?:\/\//i.test(String(thumb || ''));
    // Episode stills are title cards. Never use them as a poster fallback.
    const movieLeafFallback = item.type !== 'episode' && item.type !== 'season'
        && leafThumb
        && (remoteThumb || (thumb && thumb !== leafThumb));
    const posterFallbackUrl = movieLeafFallback
        ? `/api/plex/image?path=${encodeURIComponent(leafThumb)}&width=${PLAYER_POSTER_WIDTH}&height=${PLAYER_POSTER_HEIGHT}&quality=${PLAYER_POSTER_QUALITY}`
        : undefined;
    return {
        title: item.title,
        thumb: remoteThumb ? undefined : (thumb || undefined),
        thumbUrl: remoteThumb ? thumb : undefined,
        posterFallbackUrl,
        plexUrl: item.plexUrl || '',
        year: item.year || undefined,
        parentTitle: item.showTitle || item.seasonTitle || undefined,
        ratingKey: item.ratingKey || undefined,
    };
};

export const withPlayerStreamQuery = (src: string, updates: Record<string, string | number | null | undefined>) => {
    const qIndex = src.indexOf('?');
    const path = qIndex >= 0 ? src.slice(0, qIndex) : src;
    const qs = new URLSearchParams(qIndex >= 0 ? src.slice(qIndex + 1) : '');
    qs.delete('resume');
    for (const [key, value] of Object.entries(updates)) {
        if (value == null || value === '') qs.delete(key);
        else qs.set(key, String(value));
    }
    const query = qs.toString();
    return query ? `${path}?${query}` : path;
};

const PLAY_SESSION_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const newPlaySessionId = () => (
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
            const n = Math.floor(Math.random() * 16);
            const value = char === 'x' ? n : ((n & 0x3) | 0x8);
            return value.toString(16);
        })
);

export const playSessionIdFromSrc = (src?: string | null) => {
    const id = new URLSearchParams(String(src || '').split('?')[1] || '').get('session') || '';
    return PLAY_SESSION_ID.test(id) ? id : '';
};

export const playbackQueryParam = (src: string | null | undefined, key: string) => (
    new URLSearchParams(String(src || '').split('?')[1] || '').get(key) || ''
);

export const audioStreamIdFromSrc = (src?: string | null) => playbackQueryParam(src, 'audioStreamID').replace(/\D/g, '');

export const subtitleStreamIdFromSrc = (src?: string | null) => playbackQueryParam(src, 'subtitleStreamID').replace(/\D/g, '');

export const isHlsPlaybackSrc = (src?: string | null) => /\.m3u8(\?|$)/i.test(String(src || ''));

export const isFilePlaybackSrc = (src?: string | null) => (
    String(src || '').includes(`${PLAYER_API_ROOT}/file/`)
);

export const playbackModeFromSrc = (
    src?: string | null,
    qualityId?: string | null,
    canCopyOriginal?: boolean,
) => {
    if (isFilePlaybackSrc(src)) return 'directPlay' as const;
    if ((!qualityId || qualityId === 'original') && canCopyOriginal !== false) return 'directStream' as const;
    return 'transcode' as const;
};

export const isApplePlayback = () => {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || '';
    if (/iPad|iPhone|iPod/.test(ua)) return true;
    if (navigator.platform === 'MacIntel' && Number(navigator.maxTouchPoints || 0) > 1) return true;
    return /Safari/i.test(ua) && !/Chrome|Chromium|Edg|OPR|Android|Firefox/i.test(ua);
};

export const canUseNativeHls = () => {
    if (typeof document === 'undefined' || !isApplePlayback()) return false;
    const video = document.createElement('video');
    const result = video.canPlayType('application/vnd.apple.mpegurl');
    return result === 'probably' || result === 'maybe';
};

/** Chosen-bitrate fallback. Original stays original so ExoPlayer can Direct Play. */
export const NATIVE_SAFE_QUALITY_ID = '1080-12';

export const isPlexNativePlayback = () => (
    typeof window !== 'undefined'
    && !!window.__PLEX_CLIENT__
    && window.__PLEX_CLIENT__.nativePlayer !== false
);

export const nativeSafeQualityId = (qualityId?: string | null) => {
    const q = String(qualityId || '').trim();
    if (!q || q === 'auto') return 'original';
    return q;
};

/** Native TV/Fire TV should default to Original (Direct Play), not a transcode preset from settings. */
export const resolveStartPlaybackQualityId = (
    explicit?: string | null,
    settingsDefault?: string | null,
): string | undefined => {
    const picked = String(explicit || '').trim();
    if (picked && picked !== 'auto') return picked;
    if (isPlexNativePlayback()) return 'original';
    const def = String(settingsDefault || 'auto').trim();
    if (!def || def === 'auto') return undefined;
    return def;
};

export const nativeDirectPlayEligible = (input: {
    canDirectPlay?: boolean;
    playbackMode?: string;
    qualityId?: string | null;
    audioStreamId?: string | null;
    subtitleStreamId?: string | null;
    audioTracks?: Array<{ id: string; codec?: string | null }>;
    source?: { audioCodec?: string | null };
}, opts?: {
    qualityId?: string | null;
    audioStreamId?: string | null;
    subtitleStreamId?: string | null;
}) => {
    if (input.playbackMode === 'directPlay') return true;
    const quality = nativeSafeQualityId(opts?.qualityId ?? input.qualityId);
    if (quality !== 'original' || !input.canDirectPlay) return false;
    const sub = String(opts?.subtitleStreamId ?? input.subtitleStreamId ?? '').replace(/\D/g, '');
    if (sub) return false;
    const audioId = opts?.audioStreamId ?? input.audioStreamId ?? '';
    const codec = (input.audioTracks || []).find((row) => row.id === audioId)?.codec
        || input.source?.audioCodec
        || '';
    return nativeAudioIsDirectPlayable(codec);
};

export const buildNativePlaybackSrc = (
    ratingKey: string,
    session: {
        src: string;
        sessionId: string;
        offsetMs?: number;
        qualityId?: string;
        audioStreamId?: string | null;
        subtitleStreamId?: string | null;
        mediaIndex?: number;
        canDirectPlay?: boolean;
        playbackMode?: string;
        audioTracks?: Array<{ id: string; codec?: string | null }>;
        source?: { audioCodec?: string | null };
    },
    opts?: {
        qualityId?: string | null;
        audioStreamId?: string | null;
        subtitleStreamId?: string | null;
        mediaIndex?: number;
        offsetMs?: number;
        sessionId?: string;
    },
) => {
    const qualityId = nativeSafeQualityId(opts?.qualityId ?? session.qualityId);
    const audioStreamId = opts?.audioStreamId ?? session.audioStreamId ?? '';
    const subtitleStreamId = opts?.subtitleStreamId ?? session.subtitleStreamId ?? '';
    const mediaIndex = opts?.mediaIndex ?? session.mediaIndex ?? 0;
    const offsetMs = opts?.offsetMs ?? session.offsetMs ?? 0;
    const sessionId = opts?.sessionId ?? session.sessionId;
    const eligible = nativeDirectPlayEligible(session, {
        qualityId,
        audioStreamId,
        subtitleStreamId,
    });
    const mode = String(session.playbackMode || '').trim();
    const src = String(session.src || '').trim();
    const streamUpdates: Record<string, string | number | null | undefined> = {
        session: sessionId,
        offset: offsetMs > 0 ? Math.floor(offsetMs) : undefined,
        mediaIndex: mediaIndex > 0 ? mediaIndex : undefined,
        quality: qualityId && qualityId !== 'original' ? qualityId : undefined,
        audioStreamID: String(audioStreamId || '').replace(/\D/g, '') || undefined,
        subtitleStreamID: String(subtitleStreamId || '').replace(/\D/g, '') || undefined,
    };

    // Never rewrite an HLS playlist as /file/ — Plex answers 409 JSON and
    // ExoPlayer reports ERROR_CODE_IO_BAD_HTTP_STATUS.
    if (isHlsPlaybackSrc(src)) {
        return withPlayerStreamQuery(src, streamUpdates);
    }
    if (isFilePlaybackSrc(src) && eligible && mode !== 'transcode') {
        return withPlayerStreamQuery(src, {
            ...streamUpdates,
            client: 'android',
            hevc: '1',
            ac3: '1',
            textSubs: '1',
            subtitleStreamID: undefined,
        });
    }

    return buildPlaybackSrc(ratingKey, {
        sessionId,
        offsetMs,
        qualityId,
        audioStreamId,
        subtitleStreamId,
        directFile: false,
        copy: true,
        mediaIndex,
    });
};

/** Stock ExoPlayer has no TrueHD/DTS decoder. Those tracks remux to AAC instead of Direct Play. */
const UNSUPPORTED_NATIVE_AUDIO = /^(truehd|dca|dts|dtsc|dtshd)$/i;

export const nativeAudioIsDirectPlayable = (codec?: string | null) => {
    const value = String(codec || '').trim().toLowerCase();
    if (!value) return true;
    return !UNSUPPORTED_NATIVE_AUDIO.test(value);
};

export const browserPlaybackCaps = () => {
    if (typeof document === 'undefined') return { hevc: false, ac3: false, hls: false };
    // ExoPlayer on Android TV decodes HEVC and AC3 in hardware. TrueHD/DTS stay
    // off the Direct Play list in the server profile so those titles remux audio.
    if (isPlexNativePlayback()) {
        return { hevc: true, ac3: true, hls: true };
    }
    const video = document.createElement('video');
    const can = (type: string) => {
        const result = video.canPlayType(type);
        return result === 'probably' || result === 'maybe';
    };
    const apple = isApplePlayback();
    return {
        hevc: apple && (can('video/mp4; codecs="hvc1.1.6.L93.B0"') || can('video/mp4; codecs="hev1.1.6.L93.B0"')),
        ac3: apple && (can('audio/mp4; codecs="ac-3"') || can('audio/mp4; codecs="ec-3"')),
        hls: canUseNativeHls(),
    };
};

export const offsetMsFromSrc = (src?: string | null) => (
    Math.max(0, Math.floor(Number(new URLSearchParams(String(src || '').split('?')[1] || '').get('offset') || 0)))
);

export const buildFilePlaybackSrc = (ratingKey: string, {
    sessionId = '',
    offsetMs = 0,
    allowHevc = false,
    allowAc3 = false,
    mediaIndex = 0,
    client = '',
} = {}) => {
    const qs = new URLSearchParams();
    if (PLAY_SESSION_ID.test(String(sessionId || ''))) qs.set('session', String(sessionId));
    if (Number(offsetMs) > 0) qs.set('offset', String(Math.floor(Number(offsetMs))));
    if (allowHevc) qs.set('hevc', '1');
    if (allowAc3) qs.set('ac3', '1');
    if (client && client !== 'web') {
        qs.set('client', client);
        qs.set('textSubs', '1');
    }
    if (Number(mediaIndex) > 0) qs.set('mediaIndex', String(Math.floor(Number(mediaIndex))));
    return `${PLAYER_API_ROOT}/file/${encodeURIComponent(ratingKey)}?${qs}`;
};

export const buildPlaybackSrc = (ratingKey: string, {
    sessionId = '',
    offsetMs = 0,
    qualityId = '',
    audioStreamId = '',
    subtitleStreamId = '',
    directFile = false,
    copy = true,
    mediaIndex = 0,
}: {
    sessionId?: string;
    offsetMs?: number;
    qualityId?: string;
    audioStreamId?: string | null;
    subtitleStreamId?: string | null;
    directFile?: boolean;
    copy?: boolean;
    mediaIndex?: number;
} = {}) => {
    const original = !qualityId || qualityId === 'original';
    const noSubs = !String(subtitleStreamId || '').replace(/\D/g, '');
    if (directFile && original && noSubs) {
        const caps = browserPlaybackCaps();
        const native = isPlexNativePlayback();
        return buildFilePlaybackSrc(ratingKey, {
            sessionId,
            offsetMs,
            allowHevc: caps.hevc || native,
            allowAc3: caps.ac3 || native,
            mediaIndex,
            client: native ? 'android' : '',
        });
    }
    const qs = new URLSearchParams();
    if (PLAY_SESSION_ID.test(String(sessionId || ''))) qs.set('session', String(sessionId));
    if (Number(offsetMs) > 0) qs.set('offset', String(Math.floor(Number(offsetMs))));
    if (qualityId) qs.set('quality', String(qualityId));
    if (copy === false) qs.set('copy', '0');
    if (Number(mediaIndex) > 0) qs.set('mediaIndex', String(Math.floor(Number(mediaIndex))));
    if (String(audioStreamId || '').replace(/\D/g, '')) qs.set('audioStreamID', String(audioStreamId).replace(/\D/g, ''));
    if (String(subtitleStreamId || '').replace(/\D/g, '')) qs.set('subtitleStreamID', String(subtitleStreamId).replace(/\D/g, ''));
    return `${PLAYER_API_ROOT}/hls/${encodeURIComponent(ratingKey)}/master.m3u8?${qs}`;
};
