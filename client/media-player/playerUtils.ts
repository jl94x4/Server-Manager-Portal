import { portalUrl } from '../shared/basePath';
import type { PlayerItem } from './types';

export const plexImageUrl = (path?: string | null, width = 300, height = 450) => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('/api/')) return path;
    return portalUrl(`/api/plex/image?path=${encodeURIComponent(path)}&width=${width}&height=${height}`);
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

export const isHlsPlaybackSrc = (src?: string | null) => /\.m3u8(\?|$)/i.test(String(src || ''));

export const offsetMsFromSrc = (src?: string | null) => (
    Math.max(0, Math.floor(Number(new URLSearchParams(String(src || '').split('?')[1] || '').get('offset') || 0)))
);

export const buildPlaybackSrc = (ratingKey: string, {
    sessionId = '',
    offsetMs = 0,
    qualityId = '',
    audioStreamId = '',
    subtitleStreamId = '',
}: {
    sessionId?: string;
    offsetMs?: number;
    qualityId?: string;
    audioStreamId?: string | null;
    subtitleStreamId?: string | null;
} = {}) => {
    const qs = new URLSearchParams();
    if (PLAY_SESSION_ID.test(String(sessionId || ''))) qs.set('session', String(sessionId));
    if (Number(offsetMs) > 0) qs.set('offset', String(Math.floor(Number(offsetMs))));
    if (qualityId) qs.set('quality', String(qualityId));
    if (String(audioStreamId || '').replace(/\D/g, '')) qs.set('audioStreamID', String(audioStreamId).replace(/\D/g, ''));
    if (String(subtitleStreamId || '').replace(/\D/g, '')) qs.set('subtitleStreamID', String(subtitleStreamId).replace(/\D/g, ''));
    return `/api/media-player/hls/${encodeURIComponent(ratingKey)}/master.m3u8?${qs}`;
};
