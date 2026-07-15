import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from './api';

const POLL_MS = 15_000;

export const useWatchingCount = (enabled: boolean) => {
    const [watchingCount, setWatchingCount] = useState(0);

    const refresh = useCallback(async () => {
        if (!enabled) {
            setWatchingCount(0);
            return;
        }
        try {
            const data = await apiFetch('/api/streams/watching-count');
            setWatchingCount(Math.max(0, Number(data?.count) || 0));
        } catch {
            // Keep last known count on transient errors.
        }
    }, [enabled]);

    useEffect(() => {
        refresh();
        if (!enabled) return undefined;
        const timer = window.setInterval(refresh, POLL_MS);
        return () => window.clearInterval(timer);
    }, [enabled, refresh]);

    return { watchingCount, refresh };
};
