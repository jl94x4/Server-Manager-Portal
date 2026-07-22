/**
 * Client helper: attach library / request availability onto Discover items
 * without blocking the first paint.
 */

import { apiFetch } from '../shared/api';
import { normalizeRawDiscoveryItem } from './discoverItemUtils';

const itemKey = (item: any) => {
    const normalized = normalizeRawDiscoveryItem(item) || item;
    const mediaType = normalized?.mediaType === 'tv' || normalized?.mediaType === 2 || normalized?.mediaType === '2'
        ? 'tv'
        : (normalized?.mediaType === 'movie' || normalized?.mediaType === 1 || normalized?.mediaType === '1'
            ? 'movie'
            : null);
    const tmdbId = Number(normalized?.tmdbId ?? normalized?.id);
    if (!mediaType || !Number.isFinite(tmdbId) || tmdbId <= 0) return null;
    return `${mediaType}:${tmdbId}`;
};

export const mergeAvailabilityOntoItems = <T,>(items: T[], availabilityByKey: Record<string, any>): T[] => {
    if (!Array.isArray(items) || !items.length) return items;
    return items.map((item) => {
        const key = itemKey(item);
        if (!key || !availabilityByKey[key]) return item;
        const patch = availabilityByKey[key];
        return {
            ...item,
            mediaInfo: {
                ...((item as any)?.mediaInfo || {}),
                ...(patch.mediaInfo || {}),
            },
            ...(patch.sonarrLibraryStatus ? { sonarrLibraryStatus: patch.sonarrLibraryStatus } : {}),
            ...(patch.radarrLibraryStatus ? { radarrLibraryStatus: patch.radarrLibraryStatus } : {}),
        };
    });
};

/** Fetch availability for a list of discover items and merge mediaInfo back on. */
export async function enrichDiscoverItemsWithAvailability<T>(items: T[]): Promise<T[]> {
    if (!Array.isArray(items) || items.length === 0) return items;

    // Skip titles that already have library/request status (e.g. from the disk cache on browse).
    const payloadItems = items
        .map((item) => {
            const key = itemKey(item);
            if (!key) return null;
            const status = Number((item as any)?.mediaInfo?.status);
            const hasRequests = Array.isArray((item as any)?.mediaInfo?.requests)
                && (item as any).mediaInfo.requests.length > 0;
            if (Number.isFinite(status) || hasRequests) return null;
            const [mediaType, tmdbId] = key.split(':');
            return { mediaType, tmdbId: Number(tmdbId) };
        })
        .filter(Boolean);

    if (!payloadItems.length) return items;

    // Dedupe keys for a smaller request.
    const seen = new Set<string>();
    const unique = payloadItems.filter((entry: any) => {
        const key = `${entry.mediaType}:${entry.tmdbId}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    try {
        const data = await apiFetch('/api/discovery/availability-batch', {
            method: 'POST',
            body: JSON.stringify({ items: unique }),
        });
        const availabilityByKey: Record<string, any> = {};
        for (const entry of Array.isArray(data?.results) ? data.results : []) {
            const mediaType = entry?.mediaType === 'tv' ? 'tv' : 'movie';
            const tmdbId = Number(entry?.tmdbId);
            if (!Number.isFinite(tmdbId) || tmdbId <= 0) continue;
            availabilityByKey[`${mediaType}:${tmdbId}`] = entry;
        }
        return mergeAvailabilityOntoItems(items, availabilityByKey);
    } catch {
        return items;
    }
}
