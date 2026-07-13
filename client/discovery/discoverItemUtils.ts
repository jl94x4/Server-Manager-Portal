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
export const enrichDiscoveryItems = async (items: any[]): Promise<any[]> => {
    if (!items?.length) return [];

    return Promise.all(items.map(async (raw) => {
        const item = normalizeRawDiscoveryItem(raw);
        if (!needsEnrichment(item)) return item;

        const mediaType = item.mediaType as 'movie' | 'tv';
        const tmdbId = Number(item.tmdbId);
        try {
            const details = await apiFetch(`/api/discovery/proxy/${mediaType}/${tmdbId}`);
            return {
                ...item,
                ...details,
                mediaType,
                tmdbId,
            };
        } catch {
            return item;
        }
    }));
};
