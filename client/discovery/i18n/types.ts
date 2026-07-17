export const DISCOVER_LOCALES = [
    { code: 'en', label: 'English', nativeLabel: 'English' },
    { code: 'fr', label: 'French', nativeLabel: 'Français' },
    { code: 'de', label: 'German', nativeLabel: 'Deutsch' },
    { code: 'es', label: 'Spanish', nativeLabel: 'Español' },
] as const;

export type DiscoverLocale = (typeof DISCOVER_LOCALES)[number]['code'];

export const DISCOVER_UI_LOCALE_KEY = 'discoverUiLocale';

export const isDiscoverLocale = (value: unknown): value is DiscoverLocale => (
    DISCOVER_LOCALES.some((locale) => locale.code === value)
);

export const normalizeDiscoverLocale = (value: unknown): DiscoverLocale => (
    isDiscoverLocale(value) ? value : 'en'
);

export type DiscoverTranslateVars = Record<string, string | number>;

export type DiscoverTranslate = (
    key: string,
    vars?: DiscoverTranslateVars,
) => string;
