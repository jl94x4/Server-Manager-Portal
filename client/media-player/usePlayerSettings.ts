import { useCallback, useEffect, useState } from 'react';
import {
    PLAYER_SETTINGS_EVENT,
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

    const updateSettings = useCallback((patch: Partial<PlayerSettings>) => {
        const next = { ...readPlayerSettings(), ...patch };
        writePlayerSettings(next);
        setSettings(next);
    }, []);

    return [settings, updateSettings] as const;
};
