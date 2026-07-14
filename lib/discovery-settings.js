import { isRequestAppConfigured, isSeerrFamilyRequestApp } from './request-app-service.js';

export const DISCOVER_REGIONS = [
    { code: '', name: 'All Regions' },
    { code: 'US', name: 'United States' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'CA', name: 'Canada' },
    { code: 'AU', name: 'Australia' },
    { code: 'NZ', name: 'New Zealand' },
    { code: 'IE', name: 'Ireland' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'ES', name: 'Spain' },
    { code: 'IT', name: 'Italy' },
    { code: 'NL', name: 'Netherlands' },
    { code: 'BE', name: 'Belgium' },
    { code: 'SE', name: 'Sweden' },
    { code: 'NO', name: 'Norway' },
    { code: 'DK', name: 'Denmark' },
    { code: 'FI', name: 'Finland' },
    { code: 'PL', name: 'Poland' },
    { code: 'PT', name: 'Portugal' },
    { code: 'AT', name: 'Austria' },
    { code: 'CH', name: 'Switzerland' },
    { code: 'JP', name: 'Japan' },
    { code: 'KR', name: 'South Korea' },
    { code: 'IN', name: 'India' },
    { code: 'BR', name: 'Brazil' },
    { code: 'MX', name: 'Mexico' },
    { code: 'ZA', name: 'South Africa' },
];

export const DISCOVER_LANGUAGES = [
    { code: '', name: 'All Languages' },
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'zh', name: 'Chinese' },
    { code: 'hi', name: 'Hindi' },
    { code: 'ar', name: 'Arabic' },
    { code: 'ru', name: 'Russian' },
    { code: 'nl', name: 'Dutch' },
    { code: 'sv', name: 'Swedish' },
    { code: 'no', name: 'Norwegian' },
    { code: 'da', name: 'Danish' },
    { code: 'fi', name: 'Finnish' },
    { code: 'pl', name: 'Polish' },
    { code: 'tr', name: 'Turkish' },
];

const VALID_REGION_CODES = new Set(DISCOVER_REGIONS.map((entry) => entry.code));
const VALID_LANGUAGE_CODES = new Set(DISCOVER_LANGUAGES.map((entry) => entry.code));

export const normalizeDiscoverRegion = (value) => {
    const code = String(value || '').trim().toUpperCase();
    if (!code) return '';
    return VALID_REGION_CODES.has(code) ? code : '';
};

export const normalizeDiscoverLanguage = (value) => {
    const code = String(value || '').trim().toLowerCase();
    if (!code) return '';
    return VALID_LANGUAGE_CODES.has(code) ? code : '';
};

export const getDiscoveryPreferences = (config = {}) => ({
    discoverRegion: normalizeDiscoverRegion(config.requestDiscoverRegion),
    discoverLanguage: normalizeDiscoverLanguage(config.requestDiscoverLanguage),
    hideAvailableMedia: config.requestHideAvailableMedia === true,
    tmdbLanguage: 'en',
});

export const isMediaAvailableInLibrary = (item = {}) => {
    const raw = item?.mediaInfo?.status ?? item?.media?.status;
    const status = Number(raw);
    if (status === 5) return true;
    if (status === 4) {
        const mediaType = item?.mediaType ?? item?.media?.mediaType ?? item?.type;
        const isTv = mediaType === 'tv' || mediaType === 2 || mediaType === '2';
        if (isTv) return false;
        return true;
    }

    const mediaInfo = item?.mediaInfo;
    if (mediaInfo && Number(mediaInfo.id) > 0 && !Number.isFinite(status)) {
        const downloadStatus = Array.isArray(mediaInfo.downloadStatus) ? mediaInfo.downloadStatus : [];
        if (downloadStatus.some((entry) => Number(entry?.status) === 5)) return true;
    }
    return false;
};

export const shouldHideAvailableMediaItem = (item = {}) => {
    const status = Number(item?.mediaInfo?.status ?? item?.media?.status);
    const mediaType = item?.mediaType ?? item?.media?.mediaType ?? item?.type;
    const isMovie = mediaType === 'movie' || mediaType === 1 || mediaType === '1';
    const isTv = mediaType === 'tv' || mediaType === 2 || mediaType === '2';

    if (isMovie) return status === 5 || status === 4;

    if (isTv) {
        if (status === 4 || status === 5) return true;
        const librarySeasons = Array.isArray(item?.mediaInfo?.seasons) ? item.mediaInfo.seasons : [];
        if (librarySeasons.length > 0) {
            const regular = librarySeasons.filter((s) => Number(s?.seasonNumber) >= 0);
            if (regular.some((s) => {
                const seasonStatus = Number(s?.status);
                return seasonStatus === 5 || seasonStatus === 4;
            })) {
                return true;
            }
        }
        return false;
    }

    return status === 5 || status === 4;
};

export const filterAvailableMedia = (items) => {
    if (!Array.isArray(items)) return items;
    return items.filter((item) => !shouldHideAvailableMediaItem(item));
};

export const isDiscoverySearchPath = (path = '') => (
    /^\/search(\/|\?|$)/i.test(String(path))
);

export const isDiscoverBrowsePath = (path = '') => {
    const normalized = String(path || '').split('?')[0];
    if (isDiscoverySearchPath(normalized)) return false;
    if (/^\/discover\/genreslider\//i.test(normalized)) return false;
    if (/^\/discover\//i.test(normalized)) return true;
    if (/^\/media(\/|$)/i.test(normalized)) return true;
    if (/^\/(movie|tv)\/\d+\/recommendations$/i.test(normalized)) return true;
    return false;
};

export const filterDiscoveryPayload = (data, path, hideAvailable) => {
    if (!hideAvailable || !isDiscoverBrowsePath(path) || !data || typeof data !== 'object') {
        return data;
    }
    if (Array.isArray(data.results)) {
        return { ...data, results: filterAvailableMedia(data.results) };
    }
    if (Array.isArray(data)) {
        return filterAvailableMedia(data);
    }
    return data;
};

export const applyDiscoveryQueryParams = (searchParams, path, prefs = {}) => {
    const params = searchParams instanceof URLSearchParams ? searchParams : new URLSearchParams(searchParams);
    const browsePath = isDiscoverBrowsePath(path);

    // Seerr maps query.language to both TMDB locale and originalLanguage filter.
    // Only apply a language filter when an admin discover language is configured.
    if (browsePath && prefs.discoverLanguage && !params.has('language')) {
        params.set('language', prefs.discoverLanguage);
    } else if (!browsePath && !params.has('language') && prefs.tmdbLanguage) {
        params.set('language', prefs.tmdbLanguage);
    }
    // Discover region is applied via Seerr main settings (discoverRegion / streamingRegion),
    // not as a request query param — "region" is not a valid Seerr discover filter.
    return params;
};

let lastSeerrDiscoverySyncKey = '';

export const ensureSeerrDiscoverySettings = async (config, rawFetch) => {
    const prefs = getDiscoveryPreferences(config);
    const syncKey = `${prefs.discoverRegion}|${prefs.discoverLanguage}|${prefs.hideAvailableMedia}`;
    if (syncKey === lastSeerrDiscoverySyncKey) {
        return { ok: true, skipped: true, reason: 'unchanged' };
    }
    const result = await syncSeerrDiscoverySettings(config, rawFetch);
    if (result.ok) {
        lastSeerrDiscoverySyncKey = syncKey;
    }
    return result;
};

export const syncSeerrDiscoverySettings = async (config, rawFetch) => {
    if (!isRequestAppConfigured(config) || !isSeerrFamilyRequestApp(config.requestAppType)) {
        return { ok: false, skipped: true, reason: 'not_configured' };
    }
    const prefs = getDiscoveryPreferences(config);
    try {
        await rawFetch(config, '/api/v1/settings/main', {
            method: 'POST',
            body: {
                discoverRegion: prefs.discoverRegion || '',
                streamingRegion: prefs.discoverRegion || '',
                originalLanguage: prefs.discoverLanguage || '',
                hideAvailable: prefs.hideAvailableMedia,
            },
        });
        lastSeerrDiscoverySyncKey = `${prefs.discoverRegion}|${prefs.discoverLanguage}|${prefs.hideAvailableMedia}`;
        return { ok: true };
    } catch (error) {
        return { ok: false, error: error?.message || 'Failed to sync discovery settings to request app' };
    }
};
