import { useCallback, useState } from 'react';

const STORAGE_KEY = 'discoveryHideRequested';

export function useHideRequestedToggle() {
    const [hideRequested, setHideRequestedState] = useState(() => {
        if (typeof window === 'undefined') return false;
        return localStorage.getItem(STORAGE_KEY) === 'true';
    });

    const setHideRequested = useCallback((value: boolean) => {
        setHideRequestedState(value);
        localStorage.setItem(STORAGE_KEY, value ? 'true' : 'false');
    }, []);

    return { hideRequested, setHideRequested };
}
