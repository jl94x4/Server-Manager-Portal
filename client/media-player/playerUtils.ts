import { portalUrl } from '../shared/basePath';
import { PLAYER_API_ROOT, PLAYER_IMAGE_PATH } from './paths';
import type { PlayerItem } from './types';

export const plexImageUrl = (path?: string | null, width = 300, height = 450, opts?: { fit?: 'contain' | 'cover' }) => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('/api/')) return path;
    const params = new URLSearchParams({
        path,
        width: String(width),
        height: String(height),
    });
    if (opts?.fit === 'contain') params.set('fit', 'contain');
    return portalUrl(`${PLAYER_IMAGE_PATH}?${params.toString()}`);
};

export const plexLogoUrl = (path?: string | null) => plexImageUrl(path, 1000, 360, { fit: 'contain' });

export const plexBackdropUrl = (path?: string | null) => {
    if (!path) return '';
    const dpr = typeof window === 'undefined' ? 2 : Math.min(Math.max(window.devicePixelRatio || 1, 1), 2);
    return plexImageUrl(path, Math.round(1920 * dpr), Math.round(1080 * dpr));
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

export const titleCaseProfile = (value?: string | null) => {
    const raw = String(value || '').trim();
    if (!raw) return '';
    return raw.replace(/\b\w/g, (char) => char.toUpperCase());
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
    return Math.max(0, leaves - viewed);
};

export const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export const toPosterCardItem = (item: PlayerItem) => ({
    title: item.title,
    thumb: item.thumb || undefined,
    plexUrl: item.plexUrl || '',
    year: item.year || undefined,
    parentTitle: item.showTitle || item.seasonTitle || undefined,
});

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

export const browserPlaybackCaps = () => {
    if (typeof document === 'undefined') return { hevc: false, ac3: false, hls: false };
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
} = {}) => {
    const qs = new URLSearchParams();
    if (PLAY_SESSION_ID.test(String(sessionId || ''))) qs.set('session', String(sessionId));
    if (Number(offsetMs) > 0) qs.set('offset', String(Math.floor(Number(offsetMs))));
    if (allowHevc) qs.set('hevc', '1');
    if (allowAc3) qs.set('ac3', '1');
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
        return buildFilePlaybackSrc(ratingKey, {
            sessionId,
            offsetMs,
            allowHevc: caps.hevc,
            allowAc3: caps.ac3,
            mediaIndex,
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
