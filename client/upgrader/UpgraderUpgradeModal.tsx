import React, { useEffect, useState } from 'react';
import { X, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { apiFetch } from '../shared/api';
import type { UpgraderItem, UpgraderUpgradePreviewResult } from './types';

type UpgraderUpgradeModalProps = {
    isOpen: boolean;
    items: UpgraderItem[];
    onClose: () => void;
    onCompleted: () => void;
    addToast: (message: string, type?: 'info' | 'success' | 'error') => void;
};

export const UpgraderUpgradeModal: React.FC<UpgraderUpgradeModalProps> = ({
    isOpen,
    items,
    onClose,
    onCompleted,
    addToast,
}) => {
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [running, setRunning] = useState(false);
    const [preview, setPreview] = useState<UpgraderUpgradePreviewResult | null>(null);
    const [triggerSearch, setTriggerSearch] = useState(true);

    useEffect(() => {
        if (!isOpen || !items.length) {
            setPreview(null);
            return;
        }
        let cancelled = false;
        setLoadingPreview(true);
        apiFetch('/api/upgrader/preview', {
            method: 'POST',
            body: JSON.stringify({ ratingKeys: items.map((item) => item.ratingKey) }),
        })
            .then((data) => {
                if (!cancelled) setPreview(data);
            })
            .catch((e: Error) => {
                if (!cancelled) addToast(e.message || 'Failed to load preview', 'error');
            })
            .finally(() => {
                if (!cancelled) setLoadingPreview(false);
            });
        return () => { cancelled = true; };
    }, [isOpen, items, addToast]);

    if (!isOpen) return null;

    const handleConfirm = async () => {
        setRunning(true);
        try {
            const result = await apiFetch('/api/upgrader/upgrade', {
                method: 'POST',
                body: JSON.stringify({
                    ratingKeys: items.map((item) => item.ratingKey),
                    triggerSearch,
                }),
            });
            const succeeded = Number(result?.totals?.succeeded || 0);
            const failed = Number(result?.totals?.failed || 0);
            if (succeeded > 0) {
                addToast(`Upgrade started for ${succeeded} title${succeeded === 1 ? '' : 's'}.`, 'success');
            }
            if (failed > 0) {
                addToast(`${failed} title${failed === 1 ? '' : 's'} could not be upgraded.`, 'error');
            }
            onCompleted();
            onClose();
        } catch (e: any) {
            addToast(e.message || 'Upgrade failed', 'error');
        } finally {
            setRunning(false);
        }
    };

    const actionable = (preview?.results || []).filter((entry) => entry.success);
    const blocked = (preview?.results || []).filter((entry) => !entry.success);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl border border-border/80 bg-card shadow-2xl flex flex-col">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
                    <div>
                        <h3 className="text-lg font-bold text-text">Upgrade to HEVC</h3>
                        <p className="text-xs text-muted mt-1">
                            Changes ARR quality profiles and optionally triggers a search. You still pick releases in ARR.
                        </p>
                    </div>
                    <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-muted hover:text-text">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 custom-scrollbar">
                    {loadingPreview ? (
                        <div className="flex items-center justify-center gap-2 py-10 text-muted">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Building preview…
                        </div>
                    ) : (
                        <>
                            {actionable.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-xs font-bold uppercase tracking-wide text-green-300">Ready ({actionable.length})</p>
                                    {actionable.map((entry) => (
                                        <div key={entry.ratingKey} className="rounded-lg border border-green-500/20 bg-green-500/5 px-3 py-2 text-sm">
                                            <div className="font-semibold text-text">{entry.title}</div>
                                            <div className="text-xs text-muted mt-1">
                                                {entry.arrInstanceName} · {entry.currentProfileName || 'Unknown profile'} → {entry.targetProfileName || `Profile ${entry.targetProfileId}`}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {blocked.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-xs font-bold uppercase tracking-wide text-amber-300">Skipped ({blocked.length})</p>
                                    {blocked.map((entry) => (
                                        <div key={entry.ratingKey} className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-sm">
                                            <div className="font-semibold text-text">{entry.title || entry.ratingKey}</div>
                                            <div className="text-xs text-amber-100 mt-1">{entry.reason || 'Cannot upgrade'}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {!actionable.length && !blocked.length && (
                                <div className="text-sm text-muted text-center py-8">No preview results.</div>
                            )}
                        </>
                    )}

                    <label className="flex items-start gap-3 rounded-lg border border-border/60 bg-background/40 px-3 py-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={triggerSearch}
                            onChange={(e) => setTriggerSearch(e.target.checked)}
                            className="mt-1"
                        />
                        <span className="text-sm">
                            <span className="font-semibold text-text block">Trigger ARR search after profile change</span>
                            <span className="text-xs text-muted">Recommended. ARR will search for better releases using the new profile.</span>
                        </span>
                    </label>

                    <div className="flex items-start gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-100">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>This updates Sonarr/Radarr settings for selected titles. Review the preview carefully before confirming.</span>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-border/60">
                    <button type="button" className="px-4 py-2 rounded-lg border border-border text-sm font-semibold" onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        type="button"
                        disabled={running || loadingPreview || actionable.length === 0}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-plex text-background text-sm font-bold disabled:opacity-50"
                        onClick={handleConfirm}
                    >
                        {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        {running ? 'Upgrading…' : `Confirm ${actionable.length || items.length} upgrade${actionable.length === 1 ? '' : 's'}`}
                    </button>
                </div>
            </div>
        </div>
    );
};
