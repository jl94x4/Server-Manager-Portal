import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Save, ClipboardPaste } from 'lucide-react';
import {
    buildSpecificationsFromSimple,
    emptySimpleFormatState,
    normalizeTrashGuidesCustomFormat,
    parseSpecificationsToSimple,
    SONARR_RESOLUTION_OPTIONS,
    SONARR_SOURCE_OPTIONS,
    type SimpleFormatState,
    type SourceRule,
} from './customFormatSpec';

interface CustomFormat {
    id?: number;
    name: string;
    includeCustomFormatWhenRenaming: boolean;
    specifications: any[];
}

interface Props {
    format?: CustomFormat | null;
    onClose: () => void;
    onSave: (format: CustomFormat) => Promise<void>;
}

export const UpgraderCustomFormatModal: React.FC<Props> = ({ format, onClose, onSave }) => {
    const [name, setName] = useState(format?.name || '');
    const [advanced, setAdvanced] = useState(false);
    const [simple, setSimple] = useState<SimpleFormatState>(emptySimpleFormatState());
    const [keywordInput, setKeywordInput] = useState('');
    const [negateInput, setNegateInput] = useState('');
    const [groupInput, setGroupInput] = useState('');
    const [saving, setSaving] = useState(false);
    const [rawJson, setRawJson] = useState('');
    const [error, setError] = useState('');
    const [showImport, setShowImport] = useState(false);
    const [importJson, setImportJson] = useState('');

    const applySpecifications = (specifications: any[], formatName?: string) => {
        const parsed = parseSpecificationsToSimple(specifications);
        setSimple(parsed);
        if (formatName?.trim()) setName(formatName.trim());
        setRawJson(JSON.stringify(buildSpecificationsFromSimple(parsed), null, 2));
    };

    useEffect(() => {
        if (format) {
            const specs = format.specifications || [];
            applySpecifications(specs, format.name);
            setAdvanced(false);
        } else {
            setSimple(emptySimpleFormatState());
            setRawJson('[]');
        }
    }, [format]);

    const handleSwitchMode = (toAdvanced: boolean) => {
        setError('');
        if (toAdvanced) {
            const generated = buildSpecificationsFromSimple(simple);
            setRawJson(JSON.stringify(generated, null, 2));
            setAdvanced(true);
        } else {
            try {
                const specs = JSON.parse(rawJson);
                if (!Array.isArray(specs)) throw new Error('Must be a JSON array');
                applySpecifications(specs);
                setAdvanced(false);
            } catch {
                setError('Cannot switch to Simple mode: Advanced JSON must be a valid specifications array.');
            }
        }
    };

    const handleImportTrash = () => {
        setError('');
        try {
            const raw = JSON.parse(importJson);
            const normalized = normalizeTrashGuidesCustomFormat(raw);
            if (!normalized.name && !name.trim()) {
                return setError('Imported JSON is missing a format name.');
            }
            applySpecifications(normalized.specifications, normalized.name || name);
            setShowImport(false);
            setImportJson('');
            setAdvanced(false);
        } catch (e: any) {
            setError(`Invalid TRaSH JSON: ${e.message || 'parse failed'}`);
        }
    };

    const updateSimple = (patch: Partial<SimpleFormatState>) => {
        setSimple((prev) => ({ ...prev, ...patch }));
    };

    const addSourceRule = (value: number, negate: boolean) => {
        const label = SONARR_SOURCE_OPTIONS.find((o) => o.value === value)?.name || `Source ${value}`;
        const next: SourceRule = { value, label, negate, required: true };
        updateSimple({ sourceRules: [...simple.sourceRules, next] });
    };

    const handleSave = async () => {
        setError('');
        if (!name.trim()) return setError('Name is required');

        let specifications: any[] = [];
        if (advanced) {
            try {
                specifications = JSON.parse(rawJson);
                if (!Array.isArray(specifications)) throw new Error('Must be a JSON array');
            } catch (e: any) {
                return setError(`Invalid JSON: ${e.message}`);
            }
        } else {
            const built = buildSpecificationsFromSimple(simple);
            if (!built.length) return setError('Add at least one condition (resolution, source, release group, or keyword).');
            specifications = built;
        }

        const payload: CustomFormat = {
            id: format?.id,
            name: name.trim(),
            includeCustomFormatWhenRenaming: format?.includeCustomFormatWhenRenaming ?? false,
            specifications,
        };

        setSaving(true);
        try {
            await onSave(payload);
        } catch (e: any) {
            setError(e.message || 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-card border border-border shadow-xl rounded-2xl w-full max-w-3xl flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <div>
                        <h3 className="text-xl font-bold text-text">
                            {format ? 'Edit Custom Format' : 'Create Custom Format'}
                        </h3>
                        <p className="text-xs text-muted mt-1">Trash Guides–compatible simple builder with full Sonarr spec output.</p>
                    </div>
                    <button onClick={onClose} className="text-muted hover:text-text transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto space-y-5 custom-scrollbar">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-semibold text-text mb-2">Format Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. WEB-1080p Tier 01"
                            className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-text focus:outline-none focus:border-plex"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex flex-1 items-center bg-background border border-border rounded-lg p-1">
                            <button
                                type="button"
                                onClick={() => handleSwitchMode(false)}
                                className={`flex-1 text-sm font-medium py-1.5 rounded-md transition-colors ${!advanced ? 'bg-plex text-background' : 'text-muted hover:text-text'}`}
                            >
                                Simple (TRaSH-style)
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSwitchMode(true)}
                                className={`flex-1 text-sm font-medium py-1.5 rounded-md transition-colors ${advanced ? 'bg-plex text-background' : 'text-muted hover:text-text'}`}
                            >
                                Advanced JSON
                            </button>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowImport((v) => !v)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs font-semibold text-muted hover:text-text hover:border-plex/40 transition-colors"
                        >
                            <ClipboardPaste className="w-3.5 h-3.5" />
                            Import TRaSH JSON
                        </button>
                    </div>

                    {showImport && (
                        <div className="space-y-2 p-4 rounded-xl border border-plex/30 bg-plex/5">
                            <label className="block text-xs font-semibold text-text">Paste TRaSH Guides custom format JSON</label>
                            <textarea
                                value={importJson}
                                onChange={(e) => setImportJson(e.target.value)}
                                className="w-full h-32 bg-background border border-border rounded-lg p-3 text-xs font-mono text-text focus:outline-none focus:border-plex resize-none"
                                spellCheck={false}
                                placeholder='{"name":"1080p","specifications":[...]}'
                            />
                            <button
                                type="button"
                                onClick={handleImportTrash}
                                className="text-xs font-bold text-plex hover:underline"
                            >
                                Parse into simple fields
                            </button>
                        </div>
                    )}

                    {!advanced ? (
                        <div className="space-y-5">
                            {/* Resolution */}
                            <div className="p-4 rounded-xl border border-border bg-background/40 space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-semibold text-text">Resolution</label>
                                    <label className="inline-flex items-center gap-2 text-xs text-muted cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={!!simple.resolution}
                                            onChange={(e) => updateSimple({
                                                resolution: e.target.checked
                                                    ? { value: 1080, required: true, negate: false }
                                                    : null,
                                            })}
                                        />
                                        Enable
                                    </label>
                                </div>
                                {simple.resolution && (
                                    <div className="flex flex-wrap gap-3 items-center">
                                        <select
                                            value={simple.resolution.value}
                                            onChange={(e) => updateSimple({
                                                resolution: { ...simple.resolution!, value: Number(e.target.value) },
                                            })}
                                            className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-text"
                                        >
                                            {SONARR_RESOLUTION_OPTIONS.filter((o) => o.value > 0).map((o) => (
                                                <option key={o.value} value={o.value}>{o.name}</option>
                                            ))}
                                        </select>
                                        <label className="inline-flex items-center gap-1.5 text-xs text-muted">
                                            <input
                                                type="checkbox"
                                                checked={simple.resolution.required}
                                                onChange={(e) => updateSimple({
                                                    resolution: { ...simple.resolution!, required: e.target.checked },
                                                })}
                                            />
                                            Required
                                        </label>
                                        <label className="inline-flex items-center gap-1.5 text-xs text-muted">
                                            <input
                                                type="checkbox"
                                                checked={simple.resolution.negate}
                                                onChange={(e) => updateSimple({
                                                    resolution: { ...simple.resolution!, negate: e.target.checked },
                                                })}
                                            />
                                            Negate
                                        </label>
                                    </div>
                                )}
                            </div>

                            {/* Source rules */}
                            <div className="p-4 rounded-xl border border-border bg-background/40 space-y-3">
                                <label className="text-sm font-semibold text-text">Source Rules</label>
                                <p className="text-xs text-muted">e.g. &quot;Not WEB-DL&quot; = Source Web (3) with Negate enabled.</p>
                                <div className="flex flex-wrap gap-2">
                                    {SONARR_SOURCE_OPTIONS.filter((o) => o.value > 0).map((o) => (
                                        <button
                                            key={`inc-${o.value}`}
                                            type="button"
                                            onClick={() => addSourceRule(o.value, false)}
                                            className="text-xs px-2.5 py-1 rounded-full border border-border hover:border-plex/50 text-muted hover:text-text"
                                        >
                                            + {o.name}
                                        </button>
                                    ))}
                                    {SONARR_SOURCE_OPTIONS.filter((o) => o.value > 0).map((o) => (
                                        <button
                                            key={`not-${o.value}`}
                                            type="button"
                                            onClick={() => addSourceRule(o.value, true)}
                                            className="text-xs px-2.5 py-1 rounded-full border border-red-500/30 hover:border-red-500/60 text-red-400"
                                        >
                                            + Not {o.name}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {simple.sourceRules.map((rule, idx) => (
                                        <div key={`${rule.value}-${rule.negate}-${idx}`} className="inline-flex items-center gap-2 bg-card border border-border px-3 py-1 rounded-full text-xs">
                                            <span>{rule.negate ? `Not ${rule.label}` : rule.label}{rule.required ? ' (req)' : ''}</span>
                                            <button type="button" onClick={() => updateSimple({ sourceRules: simple.sourceRules.filter((_, i) => i !== idx) })}>
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Release groups */}
                            <div className="p-4 rounded-xl border border-border bg-background/40 space-y-3">
                                <label className="text-sm font-semibold text-text">Release Groups</label>
                                <p className="text-xs text-muted">Each group becomes a ReleaseGroupSpecification with TRaSH-style regex: <code className="text-plex">(?&lt;=^|[\s.-])GROUP\b</code>. Optional groups match any (OR).</p>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={groupInput}
                                        onChange={(e) => setGroupInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && groupInput.trim()) {
                                                updateSimple({
                                                    releaseGroups: [...simple.releaseGroups, { name: groupInput.trim(), required: false }],
                                                });
                                                setGroupInput('');
                                            }
                                        }}
                                        placeholder="CRiSC, FoRM, iFT… press Enter"
                                        className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-plex"
                                    />
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {simple.releaseGroups.map((g, idx) => (
                                        <div key={`${g.name}-${idx}`} className="inline-flex items-center gap-2 bg-plex/15 border border-plex/30 text-plex px-3 py-1 rounded-full text-xs">
                                            {g.name}
                                            <button type="button" onClick={() => updateSimple({ releaseGroups: simple.releaseGroups.filter((_, i) => i !== idx) })}>
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Title keywords */}
                            <div className="p-4 rounded-xl border border-border bg-background/40 space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-semibold text-text">Release Title Keywords</label>
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className={simple.matchAll ? 'text-plex font-bold' : 'text-muted'}>Match All</span>
                                        <button
                                            type="button"
                                            onClick={() => updateSimple({ matchAll: !simple.matchAll })}
                                            className={`w-8 h-4 rounded-full flex items-center p-0.5 transition-colors ${simple.matchAll ? 'bg-plex' : 'bg-border'}`}
                                        >
                                            <div className={`w-3 h-3 bg-white rounded-full shadow-sm transform transition-transform ${simple.matchAll ? 'translate-x-4' : 'translate-x-0'}`} />
                                        </button>
                                        <span className={!simple.matchAll ? 'text-plex font-bold' : 'text-muted'}>Match Any</span>
                                    </div>
                                </div>
                                <input
                                    type="text"
                                    value={keywordInput}
                                    onChange={(e) => setKeywordInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && keywordInput.trim()) {
                                            updateSimple({ keywords: [...simple.keywords, keywordInput.trim()] });
                                            setKeywordInput('');
                                        }
                                    }}
                                    placeholder="HEVC, x265, DV… press Enter"
                                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-plex"
                                />
                                <div className="flex flex-wrap gap-2">
                                    {simple.keywords.map((kw) => (
                                        <div key={kw} className="inline-flex items-center gap-2 bg-plex/20 border border-plex/30 text-plex px-3 py-1 rounded-full text-xs">
                                            {kw}
                                            <button type="button" onClick={() => updateSimple({ keywords: simple.keywords.filter((k) => k !== kw) })}>
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <input
                                    type="text"
                                    value={negateInput}
                                    onChange={(e) => setNegateInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && negateInput.trim()) {
                                            updateSimple({ negateKeywords: [...simple.negateKeywords, negateInput.trim()] });
                                            setNegateInput('');
                                        }
                                    }}
                                    placeholder="Exclude keyword… press Enter"
                                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-plex"
                                />
                                <div className="flex flex-wrap gap-2">
                                    {simple.negateKeywords.map((kw) => (
                                        <div key={kw} className="inline-flex items-center gap-2 bg-red-500/20 border border-red-500/30 text-red-400 px-3 py-1 rounded-full text-xs">
                                            {kw}
                                            <button type="button" onClick={() => updateSimple({ negateKeywords: simple.negateKeywords.filter((k) => k !== kw) })}>
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {simple.otherSpecifications.length > 0 && (
                                <div className="text-xs text-muted p-3 rounded-lg border border-dashed border-border">
                                    {simple.otherSpecifications.length} advanced specification(s) preserved (HDR, language, etc.) — edit in Advanced JSON mode.
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col h-72">
                            <label className="block text-sm font-semibold text-text mb-2">Specifications JSON</label>
                            <textarea
                                value={rawJson}
                                onChange={(e) => setRawJson(e.target.value)}
                                className="flex-1 w-full bg-[#1e1e1e] border border-border rounded-lg p-4 text-xs font-mono text-[#d4d4d4] focus:outline-none focus:border-plex resize-none whitespace-pre"
                                spellCheck={false}
                            />
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-border flex justify-end gap-3 bg-background/50 rounded-b-2xl">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-sm font-semibold text-text hover:bg-white/5 transition-colors"
                        disabled={saving}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-plex text-background px-4 py-2 rounded-lg text-sm font-semibold hover:bg-plex/90 transition-colors flex items-center gap-2"
                    >
                        {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {saving ? 'Saving to Server…' : 'Save & Sync'}
                    </button>
                </div>
            </div>
        </div>
    );
};
