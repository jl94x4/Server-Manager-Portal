import { useEffect, useState } from 'react';
import { apiFetch } from '../shared/api';

export type DiscoveryPreferences = {
    discoverRegion: string;
    discoverLanguage: string;
    hideAvailableMedia: boolean;
    tmdbLanguage: string;
};

const DEFAULT_PREFERENCES: DiscoveryPreferences = {
    discoverRegion: '',
    discoverLanguage: '',
    hideAvailableMedia: false,
    tmdbLanguage: 'en',
};

export const filterHiddenAvailableItems = <T extends { mediaInfo?: { status?: number }; media?: { status?: number } }>(
    items: T[],
    hideAvailable: boolean,
): T[] => {
    if (!hideAvailable || !Array.isArray(items)) return items;
    return items.filter((item) => {
        const status = item?.mediaInfo?.status ?? item?.media?.status;
        return status !== 4 && status !== 5;
    });
};

export function useDiscoveryPreferences() {
    const [preferences, setPreferences] = useState<DiscoveryPreferences>(DEFAULT_PREFERENCES);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        let cancelled = false;
        apiFetch('/api/discovery/preferences')
            .then((data) => {
                if (cancelled || !data) return;
                setPreferences({
                    discoverRegion: String(data.discoverRegion || ''),
                    discoverLanguage: String(data.discoverLanguage || ''),
                    hideAvailableMedia: !!data.hideAvailableMedia,
                    tmdbLanguage: String(data.tmdbLanguage || 'en'),
                });
            })
            .catch(() => {
                if (!cancelled) setPreferences(DEFAULT_PREFERENCES);
            })
            .finally(() => {
                if (!cancelled) setLoaded(true);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    return { preferences, loaded };
}
