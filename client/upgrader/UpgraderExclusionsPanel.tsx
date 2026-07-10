import React, { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { apiFetch } from '../shared/api';
import type { ToastMessage } from '../shared/types';
import type { UpgraderPreferences } from './types';

type UpgraderExclusionsPanelProps = {
    addToast: (message: string, type?: ToastMessage['type']) => void;
    onChanged?: () => void;
};

export const UpgraderExclusionsPanel: React.FC<UpgraderExclusionsPanelProps> = ({ addToast, onChanged }) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [prefs, setPrefs] = useState<UpgraderPreferences | null>(null);
    const [titleInput, setTitleInput] = useState('');

    const loadPrefs = useCallback(async () => {
        setLoading(true);
        try {
            const data = await apiFetch('/api/upgrader/preferences');
            setPrefs(data?.upgrader || { exclusions: { ratingKeys: [], episodeKeys: [], titles: [], libraries: [] }, snoozed: [] });
        } catch (e: any) {
            addToast(e.message || 'Failed to load exclusions', 'error');
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        loadPrefs();
    }, [loadPrefs]);

    const savePrefs = async (next: UpgraderPreferences) => {
        setSaving(true);
        try {
            await apiFetch('/api/upgrader/preferences', {
                method: 'POST',
                body: JSON.stringify({ upgrader: next }),
            });
            setPrefs(next);
            onChanged?.();
            addToast('Upgrader exclusions updated.', 'success');
        } catch (e: any) {
            addToast(e.message || 'Failed to save exclusions', 'error');
        } finally {
            setSaving(false);
        }
    };

    const unsnooze = async (ratingKey: string) => {
        try {
            await apiFetch('/api/upgrader/unsnooze', {
                method: 'POST',
                body: JSON.stringify({ ratingKey }),
            });
            await loadPrefs();
            onChanged?.();
        } catch (e: any) {
            addToast(e.message || 'Failed to unsnooze item', 'error');
        }
    };

    if (loading || !prefs) {
        return (
            <div className="flex items-center justify-center gap-2 py-16 text-muted">
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading exclusions…
            </div>
        );
    }

    const activeSnoozed = (prefs.snoozed || []).filter((entry) => entry.until && Date.parse(entry.until) > Date.now());

    return (
        <div className="space-y-6">
            <section className="rounded-2xl border border-border/60 bg-card/40 p-4 space-y-3">
                <h3 className="text-sm font-bold text-text">Snoozed titles</h3>
                {activeSnoozed.length === 0 ? (
                    <p className="text-xs text-muted">No snoozed titles. Snooze from the browse grid to hide items temporarily.</p>
                ) : activeSnoozed.map((entry) => (
                    <div key={entry.ratingKey} className="flex items-center justify-between gap-3 py-2 border-b border-border/40 last:border-b-0">
                        <div>
                            <div className="text-sm font-medium text-text">{entry.ratingKey}</div>
                            <div className="text-[11px] text-muted">Until {entry.until ? new Date(entry.until).toLocaleString() : 'unknown'}</div>
                        </div>
                        <button type="button" className="text-xs font-bold text-plex" onClick={() => unsnooze(entry.ratingKey)}>
                            Unsnooze
                        </button>
                    </div>
                ))}
            </section>

            <section className="rounded-2xl border border-border/60 bg-card/40 p-4 space-y-3">
                <h3 className="text-sm font-bold text-text">Excluded titles</h3>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={titleInput}
                        onChange={(e) => setTitleInput(e.target.value)}
                        placeholder="Exact title to exclude…"
                        className="flex-1 p-2 rounded border border-border bg-background text-text text-sm"
                    />
                    <button
                        type="button"
                        disabled={saving || !titleInput.trim()}
                        className="px-3 py-2 rounded bg-plex text-background text-xs font-bold disabled:opacity-50"
                        onClick={() => {
                            const title = titleInput.trim();
                            if (!title) return;
                            const next = {
                                ...prefs,
                                exclusions: {
                                    ...prefs.exclusions,
                                    titles: [...new Set([...(prefs.exclusions.titles || []), title])],
                                },
                            };
                            setTitleInput('');
                            savePrefs(next);
                        }}
                    >
                        Add
                    </button>
                </div>
                {(prefs.exclusions.titles || []).length === 0 ? (
                    <p className="text-xs text-muted">No title exclusions. Cleaner exclusions also apply.</p>
                ) : (prefs.exclusions.titles || []).map((title) => (
                    <div key={title} className="flex items-center justify-between gap-3 py-2 border-b border-border/40 last:border-b-0">
                        <span className="text-sm text-text">{title}</span>
                        <button
                            type="button"
                            className="text-xs font-bold text-red-300"
                            onClick={() => savePrefs({
                                ...prefs,
                                exclusions: {
                                    ...prefs.exclusions,
                                    titles: (prefs.exclusions.titles || []).filter((entry) => entry !== title),
                                },
                            })}
                        >
                            Remove
                        </button>
                    </div>
                ))}
            </section>
        </div>
    );
};
