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
    const status = item?.mediaInfo?.status ?? item?.media?.status;
    return status === 4 || status === 5;
};

export const filterAvailableMedia = (items) => {
    if (!Array.isArray(items)) return items;
    return items.filter((item) => !isMediaAvailableInLibrary(item));
};

export const isDiscoverySearchPath = (path = '') => (
    /^\/search(\/|\?|$)/i.test(String(path))
);

export const isDiscoverBrowsePath = (path = '') => {
    const normalized = String(path || '').split('?')[0];
    if (isDiscoverySearchPath(normalized)) return false;
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

    if (!params.has('language') && prefs.tmdbLanguage) {
        params.set('language', prefs.tmdbLanguage);
    }
    if (browsePath && prefs.discoverRegion && !params.has('region')) {
        params.set('region', prefs.discoverRegion);
    }
    if (browsePath && prefs.discoverLanguage && !params.has('originalLanguage')) {
        params.set('originalLanguage', prefs.discoverLanguage);
    }
    return params;
};

export const syncSeerrDiscoverySettings = async (config, rawFetch) => {
    if (!isRequestAppConfigured(config) || !isSeerrFamilyRequestApp(config.requestAppType)) {
        return { ok: false, skipped: true, reason: 'not_configured' };
    }
    const prefs = getDiscoveryPreferences(config);
    try {
        const current = await rawFetch(config, '/api/v1/settings/main');
        const body = {
            ...(current && typeof current === 'object' ? current : {}),
            discoverRegion: prefs.discoverRegion || '',
            originalLanguage: prefs.discoverLanguage || '',
            hideAvailable: prefs.hideAvailableMedia,
        };
        await rawFetch(config, '/api/v1/settings/main', { method: 'POST', body });
        return { ok: true };
    } catch (error) {
        return { ok: false, error: error?.message || 'Failed to sync discovery settings to request app' };
    }
};
