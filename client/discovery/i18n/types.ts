export const DISCOVER_LOCALES = [
    { code: 'en', label: 'English', nativeLabel: 'English' },
    { code: 'fr', label: 'French', nativeLabel: 'Français' },
    { code: 'de', label: 'German', nativeLabel: 'Deutsch' },
    { code: 'es', label: 'Spanish', nativeLabel: 'Español' },
] as const;

export type DiscoverLocale = (typeof DISCOVER_LOCALES)[number]['code'];

export const DISCOVER_UI_LOCALE_KEY = 'discoverUiLocale';

/** Sent on discovery proxy/search calls so the server can localize TMDB metadata. */
export const DISCOVER_LOCALE_HEADER = 'X-Portal-Discover-Locale';

export const isDiscoverLocale = (value: unknown): value is DiscoverLocale => (
    DISCOVER_LOCALES.some((locale) => locale.code === value)
);

export const normalizeDiscoverLocale = (value: unknown): DiscoverLocale => (
    isDiscoverLocale(value) ? value : 'en'
);

/** TMDB / Seerr metadata language codes for our supported UI locales. */
export const discoverLocaleToTmdbLanguage = (locale: unknown): DiscoverLocale => (
    normalizeDiscoverLocale(locale)
);

export const readDiscoverUiLocale = (): DiscoverLocale => {
    try {
        if (typeof localStorage === 'undefined') return 'en';
        return normalizeDiscoverLocale(localStorage.getItem(DISCOVER_UI_LOCALE_KEY));
    } catch {
        return 'en';
    }
};

export type DiscoverTranslateVars = Record<string, string | number>;

export type DiscoverTranslate = (
    key: string,
    vars?: DiscoverTranslateVars,
) => string;
