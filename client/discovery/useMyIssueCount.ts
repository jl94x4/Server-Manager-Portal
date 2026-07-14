import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../shared/api';

export type MemberIssueCounts = {
    configured?: boolean;
    userMapped?: boolean;
    open: number;
    resolved: number;
    total: number;
    error?: string | null;
};

const POLL_MS = 90_000;

export const useMyIssueCount = (enabled: boolean) => {
    const [counts, setCounts] = useState<MemberIssueCounts>({
        open: 0,
        resolved: 0,
        total: 0,
    });

    const refresh = useCallback(async () => {
        if (!enabled) {
            setCounts({ open: 0, resolved: 0, total: 0 });
            return;
        }
        try {
            const data = await apiFetch('/api/discovery/my-issues/count');
            setCounts({
                configured: !!data?.configured,
                userMapped: data?.userMapped !== false,
                open: Number(data?.open) || 0,
                resolved: Number(data?.resolved) || 0,
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
