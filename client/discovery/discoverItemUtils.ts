import { apiFetch } from '../shared/api';

/** Normalize Seerr media, request, or watchlist shapes into a TMDB-friendly item. */
export const normalizeRawDiscoveryItem = (item: any) => {
    if (!item || typeof item !== 'object') return item;

    if (item.media && (item.type != null || item.status != null || item.requestedBy)) {
        const media = item.media;
        return {
            ...media,
            mediaType: item.type || media.mediaType,
            tmdbId: media.tmdbId,
            posterPath: media.posterPath,
            title: media.title || media.name,
            name: media.name || media.title,
        };
    }

    if (item.title && typeof item.title === 'object' && !item.posterPath) {
        return {
            ...item.title,
            ...item,
            mediaType: item.title.mediaType || item.mediaType,
            tmdbId: item.title.tmdbId ?? item.tmdbId,
            posterPath: item.title.posterPath ?? item.posterPath,
        };
    }

    return item;
};

const needsEnrichment = (item: any) => {
    const normalized = normalizeRawDiscoveryItem(item);
    if (normalized.posterPath || normalized.profilePath) return false;
    const mediaType = normalized.mediaType;
    const tmdbId = Number(normalized.tmdbId);
    return (mediaType === 'movie' || mediaType === 'tv') && Number.isFinite(tmdbId) && tmdbId > 0;
};

/** Fetch TMDB poster/title for library media, requests, and watchlist rows. */
const ENRICH_CONCURRENCY = 4;

const mapWithConcurrency = async <T, R>(
    items: T[],
    limit: number,
    mapper: (item: T) => Promise<R>,
): Promise<R[]> => {
    if (!items.length) return [];
    const results = new Array<R>(items.length);
    let cursor = 0;

    const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
        while (cursor < items.length) {
            const index = cursor;
            cursor += 1;
            results[index] = await mapper(items[index]);
        }
    });

    await Promise.all(workers);
    return results;
};

export const enrichDiscoveryItems = async (items: any[]): Promise<any[]> => {
    if (!items?.length) return [];

    return mapWithConcurrency(items, ENRICH_CONCURRENCY, async (raw) => {
        const item = normalizeRawDiscoveryItem(raw);
        if (!needsEnrichment(item)) return item;

        const mediaType = item.mediaType as 'movie' | 'tv';
        const tmdbId = Number(item.tmdbId);
        try {
            const details = await apiFetch(`/api/discovery/proxy/${mediaType}/${tmdbId}`);
            return {
                ...item,
                ...details,
                mediaInfo: details?.mediaInfo ?? item.mediaInfo,
                mediaType,
                tmdbId,
            };
        } catch {
            return item;
        }
    });
};
