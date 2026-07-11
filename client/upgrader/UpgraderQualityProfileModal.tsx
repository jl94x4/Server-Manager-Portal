import React, { useState, useEffect } from 'react';
import { X, Check, Server, Plus, Code, Trash2, RefreshCw, Save } from 'lucide-react';

interface CustomFormat {
    id?: number;
    name: string;
}

interface QualityProfile {
    id: number;
    name: string;
    upgradeAllowed: boolean;
    cutoff: number;
    items: any[];
    formatItems: { format: number; score: number }[];
}

interface Props {
    profile: QualityProfile;
    formats: CustomFormat[];
    onClose: () => void;
    onSave: (profile: QualityProfile) => Promise<void>;
}

export const UpgraderQualityProfileModal: React.FC<Props> = ({ profile, formats, onClose, onSave }) => {
    const [scores, setScores] = useState<Record<number, number>>({});
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const initialScores: Record<number, number> = {};
        profile.formatItems?.forEach(fi => {
            initialScores[fi.format] = fi.score;
        });
        setScores(initialScores);
    }, [profile]);

    const handleSave = async () => {
        setError('');
        setSaving(true);
        try {
            // Rebuild formatItems array
            const newFormatItems = formats.map(f => {
                if (!f.id) return null;
                return {
                    format: f.id,
                    score: scores[f.id] || 0
                };
            }).filter(Boolean) as { format: number; score: number }[];

            const payload: QualityProfile = {
                ...profile,
                formatItems: newFormatItems
            };

            await onSave(payload);
        } catch (e: any) {
            setError(e.message || 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-card border border-border shadow-xl rounded-2xl w-full max-w-5xl flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <div>
                        <h3 className="text-xl font-bold text-text">Edit Quality Profile</h3>
                        <p className="text-sm text-muted">{profile.name}</p>
                    </div>
                    <button onClick={onClose} className="text-muted hover:text-text transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto space-y-6 custom-scrollbar">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <h4 className="text-sm font-semibold text-text mb-4">Custom Format Scores</h4>
                        <p className="text-xs text-muted mb-4">Assign positive or negative scores to custom formats to prioritize or exclude them during upgrades. Formats with a score of 0 are effectively ignored.</p>
                        
                        <div className="columns-1 md:columns-2 gap-3">
                            {formats.length === 0 && (
                                <div className="text-sm text-muted text-center py-8 border border-dashed border-border rounded-lg md:col-span-2">
                                    No custom formats exist on this instance yet.
                                </div>
                            )}
                            {[...formats].sort((a, b) => (scores[b.id!] || 0) - (scores[a.id!] || 0)).map(f => {
                                if (!f.id) return null;
                                const score = scores[f.id] || 0;
                                return (
                                    <div key={f.id} className="flex items-center justify-between bg-background border border-border p-3 rounded-lg mb-3 break-inside-avoid">
                                        <div className="font-semibold text-sm text-text truncate pr-4">{f.name}</div>
                                        <div className="w-32">
                                            <input
                                                type="number"
                                                value={score === 0 ? '' : score}
                                                onChange={(e) => setScores({ ...scores, [f.id!]: parseInt(e.target.value) || 0 })}
                                                placeholder="0"
                                                className={`w-full bg-card border rounded-lg px-3 py-1.5 text-sm font-mono text-right focus:outline-none focus:border-plex ${score > 0 ? 'border-green-500/30 text-green-500' : score < 0 ? 'border-red-500/30 text-red-500' : 'border-border text-text'}`}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-border flex justify-end gap-3 bg-background/50 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-sm font-semibold text-text hover:bg-white/5 transition-colors"
                        disabled={saving}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-plex text-background px-4 py-2 rounded-lg text-sm font-semibold hover:bg-plex/90 transition-colors flex items-center gap-2"
                    >
                        {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {saving ? 'Saving to Server...' : 'Save Scores'}
                    </button>
                </div>
            </div>
        </div>
    );
};
