import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { en } from './en';
import { fr } from './fr';
import { de } from './de';
import { es } from './es';
import {
    DISCOVER_UI_LOCALE_KEY,
    normalizeDiscoverLocale,
    type DiscoverLocale,
    type DiscoverTranslate,
    type DiscoverTranslateVars,
} from './types';

const catalogs: Record<DiscoverLocale, unknown> = { en, fr, de, es };

const readStoredLocale = (): DiscoverLocale => {
    try {
        return normalizeDiscoverLocale(localStorage.getItem(DISCOVER_UI_LOCALE_KEY));
    } catch {
        return 'en';
    }
};

const getPath = (obj: unknown, path: string): unknown => {
    let current: unknown = obj;
    for (const part of path.split('.')) {
        if (current == null || typeof current !== 'object') return undefined;
        current = (current as Record<string, unknown>)[part];
    }
    return current;
};

const interpolate = (template: string, vars?: DiscoverTranslateVars) => {
    if (!vars) return template;
    return template.replace(/\{(\w+)\}/g, (_, key: string) => (
        vars[key] != null ? String(vars[key]) : `{${key}}`
    ));
};

export const createDiscoverTranslate = (locale: DiscoverLocale): DiscoverTranslate => (
    (key, vars) => {
        const plural = vars && typeof vars.count === 'number' && Math.abs(Number(vars.count)) !== 1;
        const candidates = plural ? [`${key}_plural`, key] : [key];
        for (const candidate of candidates) {
            const fromLocale = getPath(catalogs[locale], candidate);
            if (typeof fromLocale === 'string') return interpolate(fromLocale, vars);
        }
        for (const candidate of candidates) {
            const fromEn = getPath(en, candidate);
            if (typeof fromEn === 'string') return interpolate(fromEn, vars);
        }
        return key;
    }
);

/** Map internal English status tokens to translated UI labels. */
export const translateDiscoverStatus = (t: DiscoverTranslate, label?: string | null): string => {
    const raw = String(label || '').trim();
    if (!raw) return '';
    const map: Record<string, string> = {
        Available: 'status.available',
        'Available in library': 'status.availableInLibrary',
        Partial: 'status.partial',
        'Partially available': 'status.partiallyAvailable',
        Pending: 'status.pending',
        'Pending Approval': 'status.pendingApproval',
        'Request Pending': 'status.requestPending',
        Processing: 'status.processing',
        Requested: 'status.requested',
        Approved: 'status.approved',
        Declined: 'status.declined',
        Failed: 'status.failed',
        Blacklisted: 'status.blacklisted',
        'Not requested': 'status.notRequested',
        'Up to date': 'status.upToDate',
        'Request failed': 'status.requestFailed',
        'Request declined': 'status.requestDeclined',
        Unknown: 'status.unknown',
        Open: 'status.open',
        Resolved: 'status.resolved',
        All: 'status.all',
    };
    const key = map[raw];
    return key ? t(key) : raw;
};

type DiscoverI18nContextValue = {
    locale: DiscoverLocale;
    setLocale: (locale: DiscoverLocale) => void;
    t: DiscoverTranslate;
};

const DiscoverI18nContext = createContext<DiscoverI18nContextValue | null>(null);

export const DiscoverI18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [locale, setLocaleState] = useState<DiscoverLocale>(() => (
        typeof window !== 'undefined' ? readStoredLocale() : 'en'
    ));

    const setLocale = useCallback((next: DiscoverLocale) => {
        const normalized = normalizeDiscoverLocale(next);
        setLocaleState(normalized);
        try {
            localStorage.setItem(DISCOVER_UI_LOCALE_KEY, normalized);
        } catch {
            /* ignore */
        }
    }, []);

    const t = useMemo(() => createDiscoverTranslate(locale), [locale]);

    const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

    return (
        <DiscoverI18nContext.Provider value={value}>
            {children}
        </DiscoverI18nContext.Provider>
    );
};

export const useDiscoverI18n = () => {
    const ctx = useContext(DiscoverI18nContext);
    if (!ctx) {
        const t = createDiscoverTranslate('en');
        return {
            locale: 'en' as DiscoverLocale,
            setLocale: (_locale: DiscoverLocale) => undefined,
            t,
        };
    }
    return ctx;
};

export { DISCOVER_LOCALES, type DiscoverLocale } from './types';
