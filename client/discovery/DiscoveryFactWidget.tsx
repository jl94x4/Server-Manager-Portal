import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Lightbulb, RefreshCw } from 'lucide-react';
import { apiFetch } from '../shared/api';

type FactResponse = {
    facts?: string[];
    fact?: string | null;
    sources?: { wikipedia?: number; tmdb?: number };
};

export const DiscoveryFactWidget: React.FC<{
    mediaType: 'movie' | 'tv';
    mediaId: number;
}> = ({ mediaType, mediaId }) => {
    const [facts, setFacts] = useState<string[]>([]);
    const [index, setIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const cycleTimerRef = useRef<number | null>(null);

    const clearCycleTimer = useCallback(() => {
        if (cycleTimerRef.current != null) {
            window.clearInterval(cycleTimerRef.current);
            cycleTimerRef.current = null;
        }
    }, []);

    const advanceFact = useCallback(() => {
        if (facts.length <= 1) return;
        setIndex((prev) => (prev + 1) % facts.length);
    }, [facts.length]);

    const startCycleTimer = useCallback(() => {
        clearCycleTimer();
        if (facts.length <= 1) return;
        cycleTimerRef.current = window.setInterval(advanceFact, 10_000);
    }, [advanceFact, clearCycleTimer, facts.length]);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setLoading(true);
            try {
                const res: FactResponse = await apiFetch(
                    `/api/discovery/fact?mediaType=${encodeURIComponent(mediaType)}&mediaId=${mediaId}`,
                );
                if (cancelled) return;
                const pool = Array.isArray(res?.facts) && res.facts.length ? res.facts : (res?.fact ? [res.fact] : []);
                setFacts(pool);
                setIndex(pool.length ? Math.floor(Math.random() * pool.length) : 0);
            } catch {
                if (!cancelled) setFacts([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, [mediaType, mediaId]);

    useEffect(() => {
        startCycleTimer();
        return clearCycleTimer;
    }, [startCycleTimer, clearCycleTimer]);

    const showAnother = useCallback(() => {
        if (facts.length <= 1) return;
        setIndex((prev) => {
            if (facts.length === 2) return prev === 0 ? 1 : 0;
            let next = prev;
            while (next === prev) {
                next = Math.floor(Math.random() * facts.length);
            }
            return next;
        });
        startCycleTimer();
    }, [facts.length, startCycleTimer]);

    if (loading) {
        return (
            <div className="rounded-xl border border-plex/20 bg-plex/5 p-4 flex items-center gap-3 animate-pulse min-h-[7.25rem]">
                <div className="w-9 h-9 rounded-lg bg-plex/10 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                    <div className="h-3 w-24 bg-white/10 rounded" />
                    <div className="h-3 w-full bg-white/5 rounded" />
                </div>
            </div>
        );
    }

    if (!facts.length) return null;

    const current = facts[index] || facts[0];

    return (
        <div className="rounded-xl border border-plex/25 bg-gradient-to-br from-plex/10 via-plex/5 to-transparent p-4 flex gap-3 min-h-[7.25rem]">
            <div className="w-9 h-9 rounded-lg bg-plex/15 border border-plex/20 flex items-center justify-center flex-shrink-0">
                <Lightbulb className="w-4 h-4 text-plex" />
            </div>
            <div className="flex-1 min-w-0 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-plex">Did you know?</span>
                    {facts.length > 1 && (
                        <button
                            type="button"
                            onClick={showAnother}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-muted hover:text-plex transition-colors"
                        >
                            <RefreshCw className="w-3 h-3" />
                            Another
                        </button>
                    )}
                </div>
                <p className="text-sm text-text/80 leading-relaxed min-h-[4.75rem] sm:min-h-[3.75rem]">
                    {(() => {
                        const match = current.match(/^===\s*(.*?)\s*===\s*(.*)$/s);
                        if (match) {
                            return (
                                <>
                                    <strong className="text-text">{match[1]}:</strong> {match[2]}
                                </>
                            );
                        }
                        return current;
                    })()}
                </p>
            </div>
        </div>
    );
};
