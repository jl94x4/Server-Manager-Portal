import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, RefreshCw, Save, ClipboardPaste, Plus, Code2, BookOpen } from 'lucide-react';
import { apiFetch } from '../shared/api';
import {
    addReleaseGroup,
    addReleaseTitleKeyword,
    addSourceRule,
    buildSpecificationsFromSimple,
    emptySimpleFormatState,
    FALLBACK_SPEC_SCHEMA,
    mergeSchemaLists,
    normalizeTrashGuidesCustomFormat,
    parseSpecificationsToSimple,
    SONARR_RESOLUTION_OPTIONS,
    SONARR_SOURCE_OPTIONS,
    upsertResolution,
    findSchemaForSpec,
    type SchemaTemplate,
    type SimpleFormatState,
} from './customFormatSpec';
import { cloneSchemaToSpec, CustomFormatSpecRow } from './CustomFormatSpecRow';
import { TrashCatalogBrowser } from './TrashCatalogBrowser';

interface CustomFormat {
    id?: number;
    name: string;
    includeCustomFormatWhenRenaming: boolean;
    specifications: any[];
}

interface Props {
    format?: CustomFormat | null;
    instanceId: string;
    onClose: () => void;
    onSave: (format: CustomFormat) => Promise<void>;
}

type EditorMode = 'simple' | 'catalog' | 'paste' | 'advanced';

export const UpgraderCustomFormatModal: React.FC<Props> = ({ format, instanceId, onClose, onSave }) => {
    const [name, setName] = useState(format?.name || '');
    const [editorMode, setEditorMode] = useState<EditorMode>('simple');
    const [simple, setSimple] = useState<SimpleFormatState>(emptySimpleFormatState());
    const [keywordInput, setKeywordInput] = useState('');
    const [negateInput, setNegateInput] = useState('');
    const [groupInput, setGroupInput] = useState('');
    const [saving, setSaving] = useState(false);
    const [rawJson, setRawJson] = useState('');
    const [error, setError] = useState('');
    const [importJson, setImportJson] = useState('');
    const [trashScoreHint, setTrashScoreHint] = useState<number | null>(null);
    const [schema, setSchema] = useState<SchemaTemplate[]>(FALLBACK_SPEC_SCHEMA);
    const [schemaLoading, setSchemaLoading] = useState(false);
    const [schemaError, setSchemaError] = useState('');
    const [addSpecType, setAddSpecType] = useState('');
    const [manualSpecJson, setManualSpecJson] = useState('');
    const [showManualSpec, setShowManualSpec] = useState(false);
    const [expandedSpecs, setExpandedSpecs] = useState<Record<number, boolean>>({});

    const mergedSchema = useMemo(() => mergeSchemaLists(schema), [schema]);

    const loadSchema = useCallback(async () => {
        if (!instanceId) return;
        setSchemaLoading(true);
        setSchemaError('');
        try {
            const res = await apiFetch(`/api/upgrader/arr/${instanceId}/customformats/schema`);
            const live = Array.isArray(res?.schema) ? res.schema : [];
            if (live.length) setSchema(live);
        } catch (e: any) {
            setSchemaError(e.message || 'Using built-in schema fallback');
            setSchema(FALLBACK_SPEC_SCHEMA);
        } finally {
            setSchemaLoading(false);
        }
    }, [instanceId]);

    useEffect(() => {
        loadSchema();
    }, [loadSchema]);

    const applySpecifications = useCallback((specifications: any[], formatName?: string, scoreHint?: number | null) => {
        const parsed = parseSpecificationsToSimple(specifications, mergedSchema);
        setSimple(parsed);
        if (formatName?.trim()) setName(formatName.trim());
        setTrashScoreHint(scoreHint ?? null);
        setRawJson(JSON.stringify(buildSpecificationsFromSimple(parsed), null, 2));
        setExpandedSpecs({});
    }, [mergedSchema]);

    useEffect(() => {
        if (format) {
            applySpecifications(format.specifications || [], format.name);
            setEditorMode('simple');
        } else {
            setSimple(emptySimpleFormatState());
            setRawJson('[]');
        }
    }, [format, applySpecifications]);

    const handleSwitchMode = (mode: EditorMode) => {
        setError('');
        if (mode === 'advanced') {
            const generated = buildSpecificationsFromSimple(simple);
            setRawJson(JSON.stringify(generated, null, 2));
            setEditorMode('advanced');
            return;
        }
        if (editorMode === 'advanced') {
            try {
                const specs = JSON.parse(rawJson);
                if (!Array.isArray(specs)) throw new Error('Must be a JSON array');
                applySpecifications(specs);
            } catch {
                setError('Cannot leave Advanced mode: JSON must be a valid specifications array.');
                return;
            }
        }
        setEditorMode(mode);
    };

    const resolutionSpec = simple.specifications.find((s) => s.implementation === 'ResolutionSpecification');
    const resolutionEnabled = !!resolutionSpec;
    const resolutionValue = Number(resolutionSpec ? resolutionSpec.fields?.find((f: any) => f.name === 'value')?.value : 1080) || 1080;

    const setSpecifications = (specifications: any[]) => {
        setSimple({ specifications });
    };

    const handleImportTrash = () => {
        setError('');
        try {
            const raw = JSON.parse(importJson);
            const normalized = normalizeTrashGuidesCustomFormat(raw, mergedSchema);
            if (!normalized.name && !name.trim()) {
                return setError('Imported JSON is missing a format name.');
            }
            applySpecifications(normalized.specifications, normalized.name || name);
            setEditorMode('simple');
            setImportJson('');
        } catch (e: any) {
            setError(`Invalid TRaSH JSON: ${e.message || 'parse failed'}`);
        }
    };

    const handleAddFromSchema = () => {
        const template = mergedSchema.find((s) => s.implementation === addSpecType);
        if (!template) return;
        const next = [...simple.specifications, cloneSchemaToSpec(template)];
        setSpecifications(next);
        setAddSpecType('');
        setExpandedSpecs((prev) => ({ ...prev, [next.length - 1]: true }));
    };

    const handlePasteSpecJson = () => {
        setError('');
        try {
            const parsed = JSON.parse(manualSpecJson);
            if (!parsed?.implementation) throw new Error('Specification must include an implementation field');
            const normalized = parseSpecificationsToSimple([parsed], mergedSchema).specifications[0];
            const next = [...simple.specifications, normalized || parsed];
            setSpecifications(next);
            setManualSpecJson('');
            setShowManualSpec(false);
            setExpandedSpecs((prev) => ({ ...prev, [next.length - 1]: true }));
        } catch (e: any) {
            setError(`Invalid specification JSON: ${e.message || 'parse failed'}`);
        }
    };

    const handleSave = async () => {
        setError('');
        if (!name.trim()) return setError('Name is required');

        let specifications: any[] = [];
        if (editorMode === 'advanced') {
            try {
                specifications = JSON.parse(rawJson);
                if (!Array.isArray(specifications)) throw new Error('Must be a JSON array');
            } catch (e: any) {
                return setError(`Invalid JSON: ${e.message}`);
            }
        } else {
            const built = buildSpecificationsFromSimple(simple);
            if (!built.length) return setError('Add at least one condition.');
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
            <div className="bg-card border border-border shadow-xl rounded-2xl w-full max-w-4xl flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <div>
                        <h3 className="text-xl font-bold text-text">
                            {format ? 'Edit Custom Format' : 'Create Custom Format'}
                        </h3>
                        <p className="text-xs text-muted mt-1">
                            TRaSH Guides–compatible builder with all Sonarr specification types.
                            {schemaLoading && ' Loading schema…'}
                            {schemaError && !schemaLoading && ` (${schemaError})`}
                        </p>
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

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 bg-background border border-border rounded-lg p-1">
                        <button
                            type="button"
                            onClick={() => handleSwitchMode('catalog')}
                            className={`text-xs sm:text-sm font-medium py-2 px-2 rounded-md transition-colors inline-flex items-center justify-center gap-1.5 ${
                                editorMode === 'catalog' ? 'bg-plex text-background' : 'text-muted hover:text-text'
                            }`}
                        >
                            <BookOpen className="w-3.5 h-3.5 shrink-0" />
                            TRaSH Catalog
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSwitchMode('simple')}
                            className={`text-xs sm:text-sm font-medium py-2 px-2 rounded-md transition-colors ${
                                editorMode === 'simple' ? 'bg-plex text-background' : 'text-muted hover:text-text'
                            }`}
                        >
                            Simple Builder
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSwitchMode('paste')}
                            className={`text-xs sm:text-sm font-medium py-2 px-2 rounded-md transition-colors inline-flex items-center justify-center gap-1.5 ${
                                editorMode === 'paste' ? 'bg-plex text-background' : 'text-muted hover:text-text'
                            }`}
                        >
                            <ClipboardPaste className="w-3.5 h-3.5 shrink-0" />
                            Paste JSON
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSwitchMode('advanced')}
                            className={`text-xs sm:text-sm font-medium py-2 px-2 rounded-md transition-colors ${
                                editorMode === 'advanced' ? 'bg-plex text-background' : 'text-muted hover:text-text'
                            }`}
                        >
                            Advanced JSON
                        </button>
                    </div>

                    {editorMode === 'catalog' && (
                        <TrashCatalogBrowser
                            onImport={({ name: fmtName, specifications, defaultScore }) => {
                                applySpecifications(specifications, fmtName, defaultScore);
                                setEditorMode('simple');
                            }}
                        />
                    )}

                    {editorMode === 'paste' && (
                        <div className="space-y-2 p-4 rounded-xl border border-plex/30 bg-plex/5">
                            <label className="block text-xs font-semibold text-text">Paste TRaSH Guides custom format JSON</label>
                            <textarea
                                value={importJson}
                                onChange={(e) => setImportJson(e.target.value)}
                                className="w-full h-32 bg-background border border-border rounded-lg p-3 text-xs font-mono text-text focus:outline-none focus:border-plex resize-none"
                                spellCheck={false}
                                placeholder='{"name":"1080p","specifications":[...]}'
                            />
                            <button type="button" onClick={handleImportTrash} className="text-xs font-bold text-plex hover:underline">
                                Parse into editor
                            </button>
                        </div>
                    )}

                    {trashScoreHint != null && editorMode === 'simple' && (
                        <div className="text-xs text-muted px-3 py-2 rounded-lg border border-dashed border-border">
                            TRaSH default quality profile score for this format: <span className="text-plex font-semibold">{trashScoreHint}</span>
                            {' '}— set this in your Quality Profile after saving.
                        </div>
                    )}

                    {editorMode === 'simple' && (
                        <div className="space-y-5">
                            {/* Quick-add shortcuts */}
                            <div className="p-4 rounded-xl border border-border bg-background/40 space-y-4">
                                <label className="text-sm font-semibold text-text">Quick Add</label>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-muted">Resolution</span>
                                        <label className="inline-flex items-center gap-2 text-xs text-muted cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={resolutionEnabled}
                                                onChange={(e) => setSpecifications(
                                                    upsertResolution(
                                                        simple.specifications,
                                                        e.target.checked ? resolutionValue : null,
                                                        { required: true, negate: false },
                                                    ),
                                                )}
                                            />
                                            Enable
                                        </label>
                                    </div>
                                    {resolutionEnabled && (
                                        <select
                                            value={resolutionValue}
                                            onChange={(e) => setSpecifications(
                                                upsertResolution(simple.specifications, Number(e.target.value), {
                                                    required: resolutionSpec?.required !== false,
                                                    negate: !!resolutionSpec?.negate,
                                                }),
                                            )}
                                            className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-text"
                                        >
                                            {SONARR_RESOLUTION_OPTIONS.filter((o) => o.value > 0).map((o) => (
                                                <option key={o.value} value={o.value}>{o.name}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <span className="text-xs text-muted">Source</span>
                                    <div className="flex flex-wrap gap-2">
                                        {SONARR_SOURCE_OPTIONS.filter((o) => o.value > 0).map((o) => (
                                            <button
                                                key={`inc-${o.value}`}
                                                type="button"
                                                onClick={() => setSpecifications(addSourceRule(simple.specifications, o.value, false))}
                                                className="text-xs px-2.5 py-1 rounded-full border border-border hover:border-plex/50 text-muted hover:text-text"
                                            >
                                                + {o.name}
                                            </button>
                                        ))}
                                        {SONARR_SOURCE_OPTIONS.filter((o) => o.value > 0).map((o) => (
                                            <button
                                                key={`not-${o.value}`}
                                                type="button"
                                                onClick={() => setSpecifications(addSourceRule(simple.specifications, o.value, true))}
                                                className="text-xs px-2.5 py-1 rounded-full border border-red-500/30 hover:border-red-500/60 text-red-400"
                                            >
                                                + Not {o.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <span className="text-xs text-muted">Release groups</span>
                                    <input
                                        type="text"
                                        value={groupInput}
                                        onChange={(e) => setGroupInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && groupInput.trim()) {
                                                setSpecifications(addReleaseGroup(simple.specifications, groupInput.trim()));
                                                setGroupInput('');
                                            }
                                        }}
                                        placeholder="CRiSC, FoRM, iFT… press Enter"
                                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-plex"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <span className="text-xs text-muted">Release title keywords</span>
                                    <input
                                        type="text"
                                        value={keywordInput}
                                        onChange={(e) => setKeywordInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && keywordInput.trim()) {
                                                setSpecifications(addReleaseTitleKeyword(simple.specifications, keywordInput.trim()));
                                                setKeywordInput('');
                                            }
                                        }}
                                        placeholder="HEVC, x265, DV… press Enter"
                                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-plex"
                                    />
                                    <input
                                        type="text"
                                        value={negateInput}
                                        onChange={(e) => setNegateInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && negateInput.trim()) {
                                                setSpecifications(addReleaseTitleKeyword(simple.specifications, negateInput.trim(), { negate: true }));
                                                setNegateInput('');
                                            }
                                        }}
                                        placeholder="Exclude keyword… press Enter"
                                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-plex"
                                    />
                                </div>
                            </div>

                            {/* All conditions — full spec editor */}
                            <div className="p-4 rounded-xl border border-border bg-background/40 space-y-3">
                                <div className="flex items-center justify-between gap-3 flex-wrap">
                                    <div>
                                        <label className="text-sm font-semibold text-text">All Conditions</label>
                                        <p className="text-xs text-muted mt-0.5">
                                            {simple.specifications.length} specification(s) — language, HDR, size, indexer, and every other TRaSH type.
                                            {schemaLoading && ' Loading schema…'}
                                            {schemaError && !schemaLoading && ` (${schemaError})`}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={loadSchema}
                                        disabled={schemaLoading}
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border text-xs font-semibold text-muted hover:text-text disabled:opacity-50"
                                    >
                                        <RefreshCw className={`w-3.5 h-3.5 ${schemaLoading ? 'animate-spin' : ''}`} />
                                        Refresh schema
                                    </button>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                        <select
                                            value={addSpecType}
                                            onChange={(e) => setAddSpecType(e.target.value)}
                                            className="bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-text max-w-[12rem]"
                                        >
                                            <option value="">Add condition type…</option>
                                            {mergedSchema.map((s) => (
                                                <option key={s.implementation} value={s.implementation}>
                                                    {s.implementationName || s.implementation}
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            type="button"
                                            disabled={!addSpecType}
                                            onClick={handleAddFromSchema}
                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-plex/15 text-plex text-xs font-semibold hover:bg-plex/25 disabled:opacity-40"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                            Add
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowManualSpec((v) => !v)}
                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border text-xs font-semibold text-muted hover:text-text"
                                        >
                                            <Code2 className="w-3.5 h-3.5" />
                                            Paste spec JSON
                                        </button>
                                </div>

                                {showManualSpec && (
                                    <div className="space-y-2 p-3 rounded-lg border border-dashed border-border">
                                        <textarea
                                            value={manualSpecJson}
                                            onChange={(e) => setManualSpecJson(e.target.value)}
                                            className="w-full h-24 bg-background border border-border rounded-lg p-3 text-xs font-mono text-text resize-none"
                                            spellCheck={false}
                                            placeholder='{"name":"Language: Not English","implementation":"LanguageSpecification",...}'
                                        />
                                        <button type="button" onClick={handlePasteSpecJson} className="text-xs font-bold text-plex hover:underline">
                                            Add specification from JSON
                                        </button>
                                    </div>
                                )}

                                {simple.specifications.length === 0 ? (
                                    <div className="text-xs text-muted p-4 rounded-lg border border-dashed border-border text-center">
                                        No conditions yet. Use quick-add shortcuts above or add any Sonarr specification type from the dropdown.
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {simple.specifications.map((spec, idx) => (
                                            <CustomFormatSpecRow
                                                key={`${spec.implementation}-${idx}-${spec.name}`}
                                                spec={spec}
                                                schema={findSchemaForSpec(mergedSchema, spec)}
                                                expanded={!!expandedSpecs[idx]}
                                                onToggleExpand={() => setExpandedSpecs((prev) => ({ ...prev, [idx]: !prev[idx] }))}
                                                onChange={(next) => {
                                                    const copy = [...simple.specifications];
                                                    copy[idx] = next;
                                                    setSpecifications(copy);
                                                }}
                                                onDelete={() => setSpecifications(simple.specifications.filter((_, i) => i !== idx))}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {editorMode === 'advanced' && (
                        <div className="flex flex-col h-96">
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
