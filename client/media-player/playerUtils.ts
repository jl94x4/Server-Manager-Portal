import { portalUrl } from '../shared/basePath';
import type { PlayerItem } from './types';

export const plexImageUrl = (path?: string | null, width = 300, height = 450) => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('/api/')) return path;
    return portalUrl(`/api/plex/image?path=${encodeURIComponent(path)}&width=${width}&height=${height}`);
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
