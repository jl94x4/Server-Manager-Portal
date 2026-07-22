import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../shared/api';
import type { PortalIssueCounts } from '../requests/types';

const POLL_MS = 90_000;

export const useOpenIssueCount = (enabled: boolean) => {
    const [counts, setCounts] = useState<PortalIssueCounts>({
        configured: false,
        connected: false,
        open: 0,
        total: 0,
    });

    const refresh = useCallback(async () => {
        if (!enabled) {
            setCounts({ configured: false, connected: false, open: 0, total: 0 });
            return;
        }
        try {
            const data = await apiFetch('/api/issues/count');
            setCounts({
                configured: !!data?.configured,
                connected: data?.connected !== false,
                supported: data?.supported !== false,
                open: Number(data?.open) || 0,
                closed: Number(data?.closed) || 0,
                total: Number(data?.total) || 0,
                error: data?.error || null,
            });
        } catch {
            // Keep last known counts on transient errors.
        }
    }, [enabled]);

    useEffect(() => {
        refresh();
        if (!enabled) return undefined;
        const timer = window.setInterval(refresh, POLL_MS);
        return () => window.clearInterval(timer);
    }, [enabled, refresh]);

    return { openCount: counts.open, counts, refresh };
};
