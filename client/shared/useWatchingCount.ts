import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from './api';

const clampPollSeconds = (seconds: number | undefined) => {
    const n = Math.round(Number(seconds));
    if (!Number.isFinite(n)) return 15;
    return Math.min(15, Math.max(1, n));
};

export const useWatchingCount = (enabled: boolean, pollSeconds = 15) => {
    const [watchingCount, setWatchingCount] = useState(0);
    const intervalMs = clampPollSeconds(pollSeconds) * 1000;

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
        const timer = window.setInterval(refresh, intervalMs);
        return () => window.clearInterval(timer);
    }, [enabled, intervalMs, refresh]);

    return { watchingCount, refresh };
};
