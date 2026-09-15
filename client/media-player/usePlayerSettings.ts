import { useCallback, useEffect, useState } from 'react';
import { fetchMediaPlayerSettings, saveMediaPlayerSettings } from './api';
import {
    DEFAULT_PLAYER_SETTINGS,
    PLAYER_SETTINGS_EVENT,
    normalizePlayerSettings,
    playerSettingsEqual,
    readPlayerSettings,
    writePlayerSettings,
    type PlayerSettings,
} from './playerSettings';

export const usePlayerSettings = () => {
    const [settings, setSettings] = useState<PlayerSettings>(() => readPlayerSettings());

    useEffect(() => {
        const sync = () => setSettings(readPlayerSettings());
        window.addEventListener(PLAYER_SETTINGS_EVENT, sync);
        window.addEventListener('storage', sync);
        return () => {
            window.removeEventListener(PLAYER_SETTINGS_EVENT, sync);
            window.removeEventListener('storage', sync);
        };
    }, []);

    useEffect(() => {
        let cancelled = false;
        fetchMediaPlayerSettings()
            .then((data) => {
                if (cancelled || !data) return;
                const remote = normalizePlayerSettings(data);
                if (data.saved === true) {
                    writePlayerSettings(remote);
                    setSettings(remote);
                    return;
                }
                const local = readPlayerSettings();
                if (!playerSettingsEqual(local, DEFAULT_PLAYER_SETTINGS)) {
                    void saveMediaPlayerSettings(local).catch(() => undefined);
                }
            })
            .catch(() => undefined);
        return () => { cancelled = true; };
    }, []);

    const updateSettings = useCallback((patch: Partial<PlayerSettings>) => {
        const next = normalizePlayerSettings({ ...readPlayerSettings(), ...patch });
        writePlayerSettings(next);
        setSettings(next);
        void saveMediaPlayerSettings(next).catch(() => undefined);
    }, []);

    return [settings, updateSettings] as const;
};
