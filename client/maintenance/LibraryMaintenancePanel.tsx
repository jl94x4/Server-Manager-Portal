import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiFetch } from '../shared/api';
import { appConfirm } from '../shared/confirm';
import { CustomSelect, StyledCheckbox } from '../shared/ui';

const mkMaintenanceCondition = () => ({ field: 'daysSinceLastWatch', operator: 'greater_than', value: 30 });
const mkMaintenanceRule = () => ({
    id: `maintenance-${Date.now()}`,
    name: 'New Maintenance Rule',
    enabled: true,
    graceDays: 7,
    createdAt: new Date().toISOString(),
    settings: { dryRunByDefault: true, maxActionsPerRun: 25, requireConfirmForDestructive: true },
    collection: { enabled: false, nameTemplate: 'Leaving Soon - {{ruleName}}' },
    actions: { deleteFromArr: true, deleteFiles: true, unmonitor: false, qualityProfileId: 0 },
    filterTree: { logic: 'AND', conditions: [mkMaintenanceCondition()] }
});

const snapshotMaintenanceRules = (items: any[]) => JSON.stringify(
    (Array.isArray(items) ? items : []).map(({ overlay, _resetGrace, ...rule }) => rule)
);

const formatMaintenanceRunSummary = (run: any) => {
    const totals = run?.totals || {};
    const parts = [
        `${totals.matched ?? 0} matched`,
        `${totals.deleted ?? 0} deleted`,
        `${totals.skipped ?? 0} skipped`,
        `${totals.failed ?? 0} failed`
    ];
    return parts.join(', ');
};

const MaintenanceConditionRow: React.FC<{
    condition: any;
    fields: any[];
    onChange: (next: any) => void;
    onDelete: () => void;
}> = ({ condition, fields, onChange, onDelete }) => {
    const fieldDef = fields.find((f: any) => f.field === condition.field) || fields[0];
    const operatorOptions = (fieldDef?.operators || ['equals']).map((op: string) => ({ label: op.replace(/_/g, ' '), value: op }));
    const selectedOperator = operatorOptions.find((o: any) => o.value === condition.operator)?.value || operatorOptions[0]?.value || 'equals';
    const updateField = (field: string) => {
        const nextField = fields.find((f: any) => f.field === field) || fields[0];
        const nextOperator = (nextField?.operators || ['equals'])[0];
        const defaultValue = nextField?.type === 'boolean' ? false : (nextField?.type === 'number' ? 0 : (nextField?.options?.[0] ?? ''));
        onChange({ ...condition, field, operator: nextOperator, value: defaultValue });
    };
    return (
        <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_2fr_auto] gap-2 p-1">
            <CustomSelect
                value={condition.field}
                onChange={updateField}
                options={fields.map((f: any) => ({ label: f.label, value: f.field }))}
                compact
            />
            <CustomSelect
                value={selectedOperator}
                onChange={(value) => onChange({ ...condition, operator: value })}
                options={operatorOptions}
                compact
            />
            {fieldDef?.type === 'boolean' ? (
                <CustomSelect
                    value={String(condition.value)}
                    onChange={(value) => onChange({ ...condition, value: value === 'true' })}
                    options={[{ label: 'True', value: 'true' }, { label: 'False', value: 'false' }]}
                    compact
                />
            ) : fieldDef?.type === 'select' ? (
                <CustomSelect
                    value={String(condition.value ?? '')}
                    onChange={(value) => onChange({ ...condition, value })}
                    options={(fieldDef.options || []).map((opt: string) => ({ label: opt, value: opt }))}
                    compact
                />
            ) : (
                <input
                    type={fieldDef?.type === 'number' ? 'number' : 'text'}
                    value={Array.isArray(condition.value) ? condition.value.join(',') : String(condition.value ?? '')}
                    onChange={(e) => {
                        const raw = e.target.value;
                        if (selectedOperator === 'between' || selectedOperator === 'in' || selectedOperator === 'not_in') {
                            const parsed = raw.split(',').map(v => v.trim()).filter(Boolean);
                            onChange({ ...condition, value: fieldDef?.type === 'number' ? parsed.map(Number) : parsed });
                        } else {
                            onChange({ ...condition, value: fieldDef?.type === 'number' ? Number(raw) : raw });
                        }
                    }}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-text outline-none focus:border-plex"
                    placeholder={selectedOperator === 'between' ? 'min,max' : (selectedOperator === 'in' || selectedOperator === 'not_in') ? 'v1,v2' : 'value'}
                />
            )}
            <button type="button" onClick={onDelete} className="px-2 py-1 text-[11px] rounded-lg border border-red-500/40 text-red-300 hover:bg-red-500/10">Remove</button>
        </div>
    );
};

export const LibraryMaintenancePanel: React.FC<{ addToast: (m: string, t?: 'success' | 'error') => void; onRulesUpdated?: () => void }> = ({ addToast, onRulesUpdated }) => {
    const [fields, setFields] = useState<any[]>([]);
    const [rules, setRules] = useState<any[]>([]);
    const [savedRulesSnapshot, setSavedRulesSnapshot] = useState('');
    const [runs, setRuns] = useState<any[]>([]);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [indexInfo, setIndexInfo] = useState<any>(null);
    const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [runningRuleId, setRunningRuleId] = useState<string | null>(null);
    const [previewRuleId, setPreviewRuleId] = useState<string | null>(null);
    const [resettingRuleId, setResettingRuleId] = useState<string | null>(null);
    const [togglingRuleId, setTogglingRuleId] = useState<string | null>(null);
    const [pinCollectionOnDestructiveRun, setPinCollectionOnDestructiveRun] = useState(false);

    const selectedRule = useMemo(() => rules.find((rule: any) => rule.id === selectedRuleId) || null, [rules, selectedRuleId]);
    const selectedPreview = useMemo(() => previewData.find((preview: any) => preview.ruleId === selectedRuleId) || null, [previewData, selectedRuleId]);

    const refreshIndexInfo = useCallback(async () => {
        const data = await apiFetch('/api/maintenance/index');
        setIndexInfo(data);
    }, []);

    const refreshRuns = useCallback(async () => {
        const data = await apiFetch('/api/maintenance/runs');
        setRuns(Array.isArray(data) ? data : []);
    }, []);

    const refreshRules = useCallback(async () => {
        const data = await apiFetch('/api/maintenance/rules');
        const normalized = Array.isArray(data) ? data : [];
        setRules(normalized);
        setSavedRulesSnapshot(snapshotMaintenanceRules(normalized));
        setSelectedRuleId(prev => {
            if (!prev) return null;
            return normalized.some((rule: any) => rule.id === prev) ? prev : null;
        });
    }, []);

    const isRuleDirty = useCallback((ruleId: string) => {
        if (!savedRulesSnapshot) return false;
        try {
            const saved = JSON.parse(savedRulesSnapshot) as any[];
            const savedRule = saved.find((rule: any) => rule.id === ruleId);
            const currentRule = rules.find((rule: any) => rule.id === ruleId);
            if (!savedRule || !currentRule) return !!currentRule;
            const stripTransient = ({ overlay, _resetGrace, ...rest }: any) => rest;
            return JSON.stringify(stripTransient(savedRule)) !== JSON.stringify(stripTransient(currentRule));
        } catch {
            return false;
        }
    }, [rules, savedRulesSnapshot]);

    const loadAll = useCallback(async () => {
        setLoading(true);
        try {
            const [catalog, preview, index] = await Promise.all([
                apiFetch('/api/maintenance/filter-options'),
                apiFetch('/api/maintenance/preview', {
                    method: 'POST',
                    body: JSON.stringify({ includeAll: false, limit: 40, includeArrDiagnostics: false })
                }),
                apiFetch('/api/maintenance/index')
            ]);
            setFields(Array.isArray(catalog?.fields) ? catalog.fields : []);
            setPreviewData(Array.isArray(preview?.previews) ? preview.previews : []);
            setIndexInfo(index);
            await Promise.all([refreshRules(), refreshRuns()]);
        } catch (e: any) {
            addToast(e.message || 'Failed to load maintenance module', 'error');
        } finally {
            setLoading(false);
        }
    }, [addToast, refreshRules, refreshRuns]);

    useEffect(() => { loadAll(); }, [loadAll]);

    const updateRule = (ruleId: string, patch: any) => setRules(prev => prev.map(rule => (rule.id === ruleId ? { ...rule, ...patch } : rule)));
    const addRule = (event?: React.MouseEvent) => {
        event?.preventDefault();
        event?.stopPropagation();
        const next = mkMaintenanceRule();
        setRules(prev => [...prev, next]);
        setSelectedRuleId(next.id);
    };
    const removeRule = (ruleId: string) => {
        setRules(prev => {
            const filtered = prev.filter(rule => rule.id !== ruleId);
            if (selectedRuleId === ruleId) {
                setSelectedRuleId(filtered[0]?.id || null);
            }
            return filtered;
        });
        setPreviewData(prev => prev.filter((p: any) => p.ruleId !== ruleId));
    };
    const deleteRule = async (ruleId: string, event?: React.MouseEvent) => {
        event?.preventDefault();
        event?.stopPropagation();
        const target = rules.find((rule: any) => rule.id === ruleId);
        if (!target) return;
        appConfirm(`Delete filter "${target.name || 'Unnamed Rule'}"?`, async () => {
            const previousRules = rules;
            const nextRules = rules.filter((rule: any) => rule.id !== ruleId);
            removeRule(ruleId);
            setSaving(true);
            try {
                await apiFetch('/api/maintenance/rules', { method: 'POST', body: JSON.stringify(nextRules) });
                addToast(`Deleted filter: ${target.name || 'Unnamed Rule'}.`);
                await Promise.all([refreshRules(), refreshRuns()]);
                onRulesUpdated?.();
            } catch (e: any) {
                setRules(previousRules);
                addToast(e.message || 'Failed to delete filter', 'error');
            } finally {
                setSaving(false);
            }
        });
    };
    const addCondition = (ruleId: string) => {
        setRules(prev => prev.map(rule => {
            if (rule.id !== ruleId) return rule;
            const existing = Array.isArray(rule?.filterTree?.conditions) ? rule.filterTree.conditions : [];
            return { ...rule, filterTree: { logic: rule?.filterTree?.logic || 'AND', conditions: [...existing, mkMaintenanceCondition()] } };
        }));
    };
    const updateCondition = (ruleId: string, index: number, condition: any) => {
        setRules(prev => prev.map(rule => {
            if (rule.id !== ruleId) return rule;
            const conditions = [...(rule?.filterTree?.conditions || [])];
            conditions[index] = condition;
            return { ...rule, filterTree: { logic: rule?.filterTree?.logic || 'AND', conditions } };
        }));
    };
    const removeCondition = (ruleId: string, index: number) => {
        setRules(prev => prev.map(rule => {
            if (rule.id !== ruleId) return rule;
            const conditions = (rule?.filterTree?.conditions || []).filter((_: any, i: number) => i !== index);
            return { ...rule, filterTree: { logic: rule?.filterTree?.logic || 'AND', conditions } };
        }));
    };

    const saveRules = async (event?: React.MouseEvent) => {
        event?.preventDefault();
        event?.stopPropagation();
        setSaving(true);
        try {
            await apiFetch('/api/maintenance/rules', { method: 'POST', body: JSON.stringify(rules) });
            addToast('Maintenance rules saved.');
            await refreshRules();
            onRulesUpdated?.();
        } catch (e: any) {
            addToast(e.message || 'Failed to save maintenance rules', 'error');
        } finally {
            setSaving(false);
        }
    };

    const rebuildIndex = async (event?: React.MouseEvent) => {
        event?.preventDefault();
        event?.stopPropagation();
        try {
            await apiFetch('/api/maintenance/index/rebuild', { method: 'POST' });
            addToast('Maintenance index rebuilt.');
            await Promise.all([refreshIndexInfo(), loadAll()]);
        } catch (e: any) {
            addToast(e.message || 'Failed to rebuild maintenance index', 'error');
        }
    };

    const runPreview = async (ruleId: string, event?: React.MouseEvent) => {
        event?.preventDefault();
        event?.stopPropagation();
        setPreviewRuleId(ruleId);
        try {
            const ruleDraft = rules.find((r: any) => r.id === ruleId);
            const payload = await apiFetch('/api/maintenance/preview', {
                method: 'POST',
                body: JSON.stringify({
                    ruleId,
                    rule: ruleDraft || undefined,
                    includeAll: true,
                    includeArrDiagnostics: true
                })
            });
            const previews = Array.isArray(payload?.previews) ? payload.previews : [];
            setPreviewData((prev) => {
                const map = new Map(prev.map((entry: any) => [entry.ruleId, entry]));
                previews.forEach((entry: any) => map.set(entry.ruleId, entry));
                return Array.from(map.values());
            });
            const current = previews.find((p: any) => p.ruleId === ruleId) || previews[0];
            const eligible = current?.eligibleCount ?? current?.totalMatches ?? 0;
            const actionable = current?.actionableCount ?? '—';
            const inGrace = current?.inGraceCount ?? 0;
            const graceDays = current?.graceRemainingDays ?? 0;
            addToast(
                graceDays > 0
                    ? `Preview: ${current?.totalMatches ?? 0} match(es), all in grace (${graceDays} day(s) remaining).`
                    : `Preview: ${current?.totalMatches ?? 0} match(es), ${eligible} eligible, ${actionable} mapped in Sonarr/Radarr${inGrace ? `, ${inGrace} in grace` : ''}.`
            );
        } catch (e: any) {
            addToast(e.message || 'Failed to generate preview', 'error');
        } finally {
            setPreviewRuleId(null);
        }
    };

    const runRule = async (ruleId: string, dryRun: boolean, event?: React.MouseEvent) => {
        event?.preventDefault();
        event?.stopPropagation();
        if (isRuleDirty(ruleId)) {
            addToast('Save your filter changes before running.', 'error');
            return;
        }
        const useCollectionPin = !dryRun && pinCollectionOnDestructiveRun;

        const executeRun = async () => {
            setRunningRuleId(ruleId);
            try {
                const response = await apiFetch('/api/maintenance/run', {
                    method: 'POST',
                    body: JSON.stringify({
                        ruleId,
                        dryRun,
                        confirmToken: dryRun ? null : 'CONFIRM_MAINTENANCE_DELETE',
                        runOptions: dryRun ? {} : { createAndPinCollection: useCollectionPin }
                    })
                });
                const latestRun = Array.isArray(response?.runs) ? response.runs[0] : null;
                const summary = latestRun ? formatMaintenanceRunSummary(latestRun) : '';
                addToast(dryRun
                    ? (summary ? `Dry-run completed (${summary}).` : 'Dry-run completed.')
                    : (summary
                        ? (useCollectionPin ? `Destructive run completed with collection pinning (${summary}).` : `Destructive run completed (${summary}).`)
                        : (useCollectionPin ? 'Rule execution completed with collection pinning.' : 'Rule execution completed.')));
                await Promise.all([refreshRuns(), runPreview(ruleId)]);
                onRulesUpdated?.();
            } catch (e: any) {
                addToast(e.message || 'Rule execution failed', 'error');
            } finally {
                setRunningRuleId(null);
            }
        };

        if (!dryRun) {
            try {
                const preflight = await apiFetch('/api/maintenance/preflight', {
                    method: 'POST',
                    body: JSON.stringify({ ruleId })
                });
                if (!preflight.ok) {
                    addToast((preflight.errors || ['Preflight check failed.']).join(' '), 'error');
                    return;
                }
                let confirmMessage = useCollectionPin
                    ? 'Run destructive maintenance action now? This will delete via Sonarr/Radarr and also create/pin a Plex collection to home for all users.'
                    : 'Run destructive maintenance action now? This will delete matching items via Sonarr/Radarr using the saved filter.';
                if (Array.isArray(preflight.warnings) && preflight.warnings.length) {
                    confirmMessage += `\n\nWarnings:\n- ${preflight.warnings.join('\n- ')}`;
                }
                const preview = preflight.preview;
                if (preview) {
                    confirmMessage += `\n\nWould process up to ${preview.wouldProcessCount} item(s): ${preview.actionableCount} mapped in Sonarr/Radarr, ${preview.unactionableCount} unmapped.`;
                    if (preview.graceRemainingDays > 0) {
                        confirmMessage += ` ${preview.inGraceCount} still in grace (${preview.graceRemainingDays} day(s) remaining).`;
                    }
                }
                appConfirm(confirmMessage, executeRun);
            } catch (e: any) {
                addToast(e.message || 'Preflight check failed', 'error');
            }
            return;
        }

        await executeRun();
    };

    const resetRuleGraceTimer = async (ruleId: string, event?: React.MouseEvent) => {
        event?.preventDefault();
        event?.stopPropagation();
        const target = rules.find((rule: any) => rule.id === ruleId);
        if (!target) return;
        setResettingRuleId(ruleId);
        try {
            await apiFetch('/api/maintenance/rules/reset-grace', { method: 'POST', body: JSON.stringify({ ruleId }) });
            addToast(`Grace timer reset for "${target.name || 'Unnamed Rule'}".`);
            await Promise.all([refreshRules(), runPreview(ruleId)]);
            onRulesUpdated?.();
        } catch (e: any) {
            addToast(e.message || 'Failed to reset grace timer', 'error');
        } finally {
            setResettingRuleId(null);
        }
    };

    const toggleRuleEnabled = async (ruleId: string, event?: React.MouseEvent) => {
        event?.preventDefault();
        event?.stopPropagation();
        const target = rules.find((rule: any) => rule.id === ruleId);
        if (!target) return;
        const previousRules = rules;
        const nextEnabled = target.enabled === false;
        const nextRules = rules.map((rule: any) => rule.id === ruleId ? { ...rule, enabled: nextEnabled } : rule);
        setRules(nextRules);
        setTogglingRuleId(ruleId);
        try {
            await apiFetch('/api/maintenance/rules', { method: 'POST', body: JSON.stringify(nextRules) });
            addToast(`Filter ${nextEnabled ? 'enabled' : 'disabled'}: "${target.name || 'Unnamed Rule'}".`);
            await Promise.all([refreshRules(), runPreview(ruleId)]);
            onRulesUpdated?.();
        } catch (e: any) {
            setRules(previousRules);
            addToast(e.message || 'Failed to update filter status', 'error');
        } finally {
            setTogglingRuleId(null);
        }
    };

    if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-plex border-t-transparent rounded-full animate-spin" /></div>;

    return (
        <div className="mb-8 animate-fade-in space-y-6" onSubmitCapture={(e) => e.preventDefault()}>
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-3">
                <div>
                    <h3 className="text-xl font-bold text-plex">Library Maintenance Rules</h3>
                    <p className="text-xs text-muted mt-1">Saved filters are listed below. Click one to edit, preview, and run.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button type="button" className="px-2.5 py-1.5 text-xs bg-border text-text rounded-md font-semibold hover:bg-opacity-80" onClick={(e) => rebuildIndex(e)}>Rebuild Index</button>
                    <button type="button" className="px-2.5 py-1.5 text-xs bg-border text-text rounded-md font-semibold hover:bg-opacity-80" onClick={(e) => addRule(e)}>Add Filter</button>
                </div>
            </div>

            <div className="bg-background/30 border border-white/5 rounded-xl p-3 text-xs text-muted">
                Index: <span className="text-text font-semibold">{indexInfo?.itemCount || 0}</span> media items
                {indexInfo?.generatedAt ? <> · Last build: <span className="text-text">{new Date(indexInfo.generatedAt).toLocaleString()}</span></> : null}
                {' '}· Request records: <span className="text-text font-semibold">{indexInfo?.requestItemCount || 0}</span>
            </div>

            <div className="bg-card/50 backdrop-blur-md border border-white/5 rounded-xl p-4">
                <p className="text-xs text-muted uppercase tracking-wider font-bold mb-3">Saved Filters</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {rules.map((rule: any) => {
                        const preview = previewData.find((p: any) => p.ruleId === rule.id);
                        return (
                            <div key={rule.id} className={`border rounded-lg p-3 transition-colors ${selectedRuleId === rule.id ? 'border-plex bg-plex/5' : 'border-white/5 bg-background/30'}`}>
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <p className="text-sm font-semibold text-text">{rule.name || 'Unnamed Rule'}</p>
                                        <p className="text-xs text-muted mt-1">{(rule?.filterTree?.conditions || []).length} condition(s)</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={(e) => toggleRuleEnabled(rule.id, e)}
                                        disabled={togglingRuleId === rule.id}
                                        className={`inline-flex items-center gap-2 px-2 py-1 rounded border text-[11px] font-semibold transition-colors disabled:opacity-60 ${rule.enabled !== false ? 'border-green-500/40 bg-green-500/10 text-green-300' : 'border-white/5 bg-background/30 text-muted'}`}
                                        title="Toggle filter enabled/disabled"
                                    >
                                        <span className={`relative inline-flex h-3.5 w-7 rounded-full transition-colors ${rule.enabled !== false ? 'bg-green-500/40' : 'bg-border'}`}>
                                            <span className={`absolute top-0.5 h-2.5 w-2.5 rounded-full bg-white transition-transform ${rule.enabled !== false ? 'translate-x-4' : 'translate-x-0.5'}`} />
                                        </span>
                                        {togglingRuleId === rule.id ? 'Saving...' : (rule.enabled !== false ? 'Enabled' : 'Disabled')}
                                    </button>
                                </div>
                                <p className="text-[11px] text-muted mt-2">Matches: {preview?.totalMatches ?? '—'}</p>
                                {(preview?.graceRemainingDays ?? 0) > 0 ? (
                                    <p className="text-[11px] text-amber-300 mt-1">In grace: {preview.graceRemainingDays} day(s) left</p>
                                ) : (
                                    <p className="text-[11px] text-muted mt-1">
                                        Eligible: {preview?.eligibleCount ?? '—'} · Sonarr/Radarr: {preview?.actionableCount ?? '—'} mapped
                                        {(preview?.unactionableCount ?? 0) > 0 ? `, ${preview.unactionableCount} unmapped` : ''}
                                    </p>
                                )}
                                <p className="text-[11px] text-muted mt-1" title="Grace countdown starts when the rule is created.">
                                    Grace: {Math.max(0, Number(rule?.graceDays || 0))} day(s) {rule?.createdAt ? `from ${new Date(rule.createdAt).toLocaleDateString()}` : 'from creation'}
                                </p>
                                <div className="flex gap-2 mt-3">
                                    <button
                                        type="button"
                                        className="px-2.5 py-1.5 text-xs rounded border border-border text-text hover:border-plex/50"
                                        onClick={() => setSelectedRuleId(rule.id)}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        type="button"
                                        className="px-2.5 py-1.5 text-xs rounded border border-border text-text hover:border-plex/50"
                                        onClick={(e) => runPreview(rule.id, e)}
                                    >
                                        Refresh
                                    </button>
                                    <button
                                        type="button"
                                        className="px-2.5 py-1.5 text-xs rounded border border-amber-500/40 text-amber-300 hover:bg-amber-500/10 disabled:opacity-50"
                                        title="Reset this rule's grace countdown to now."
                                        onClick={(e) => resetRuleGraceTimer(rule.id, e)}
                                        disabled={saving || resettingRuleId === rule.id}
                                    >
                                        {resettingRuleId === rule.id ? 'Resetting...' : 'Reset'}
                                    </button>
                                    <button
                                        type="button"
                                        className="px-2.5 py-1.5 text-xs rounded border border-red-500/40 text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                                        onClick={(e) => deleteRule(rule.id, e)}
                                        disabled={saving}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                    {rules.length === 0 && <span className="text-sm text-muted">No filters yet. Click Add Filter.</span>}
                </div>
            </div>

            {selectedRule && (
                <div className="bg-card/50 backdrop-blur-md border border-white/5 rounded-xl p-4 space-y-4 w-full">
                    {isRuleDirty(selectedRule.id) && (
                        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs rounded-lg px-3 py-2">
                            You have unsaved changes. Save the filter before previewing or running against production rules.
                        </div>
                    )}
                    <div className="flex items-end justify-between gap-3">
                        <div className="flex-1">
                            <label className="text-xs text-muted font-bold uppercase mb-1 block">Filter Name</label>
                            <input
                                value={selectedRule.name || ''}
                                onChange={(e) => updateRule(selectedRule.id, { name: e.target.value })}
                                className="w-full px-2.5 py-1.5 text-xs rounded border border-border bg-card text-text outline-none focus:border-plex"
                                placeholder="Filter name"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button type="button" className="px-2.5 py-1.5 text-xs border border-border text-text rounded hover:bg-white/5" onClick={() => setSelectedRuleId(null)}>Close Editor</button>
                            <button
                                type="button"
                                className="px-2.5 py-1.5 text-xs border border-red-500/40 text-red-300 rounded hover:bg-red-500/10 disabled:opacity-50"
                                onClick={(e) => deleteRule(selectedRule.id, e)}
                                disabled={saving}
                            >
                                Delete Filter
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div>
                            <label className="text-xs text-muted font-bold uppercase" title="How rule conditions are combined.">Match Logic</label>
                            <CustomSelect
                                value={selectedRule?.filterTree?.logic || 'AND'}
                                onChange={(value) => updateRule(selectedRule.id, { filterTree: { ...(selectedRule.filterTree || {}), logic: value } })}
                                options={[{ label: 'AND', value: 'AND' }, { label: 'OR', value: 'OR' }, { label: 'NOT', value: 'NOT' }]}
                                compact
                            />
                        </div>
                        <div>
                            <label className="text-xs text-muted font-bold uppercase" title="Global grace period for this ruleset. Matching items become eligible this many days after the rule was created.">Grace Days</label>
                            <input type="number" min={0} className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-card text-text" value={selectedRule?.graceDays || 0} onChange={(e) => updateRule(selectedRule.id, { graceDays: Number(e.target.value) })} />
                        </div>
                        <div>
                            <label className="text-xs text-muted font-bold uppercase">Max Actions</label>
                            <input type="number" min={1} className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-card text-text" value={selectedRule?.settings?.maxActionsPerRun || 25} onChange={(e) => updateRule(selectedRule.id, { settings: { ...(selectedRule.settings || {}), maxActionsPerRun: Number(e.target.value) } })} />
                        </div>
                        <div>
                            <label className="text-xs text-muted font-bold uppercase">Collection Name</label>
                            <input type="text" className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-card text-text" value={selectedRule?.collection?.nameTemplate || 'Leaving Soon - {{ruleName}}'} onChange={(e) => updateRule(selectedRule.id, { collection: { ...(selectedRule.collection || {}), nameTemplate: e.target.value } })} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <StyledCheckbox checked={selectedRule?.collection?.enabled !== false} onChange={(checked) => updateRule(selectedRule.id, { collection: { ...(selectedRule.collection || {}), enabled: checked } })} label="Create / Sync Plex Collection" />
                        <StyledCheckbox checked={selectedRule?.actions?.deleteFromArr !== false} onChange={(checked) => updateRule(selectedRule.id, { actions: { ...(selectedRule.actions || {}), deleteFromArr: checked } })} label="Delete via Sonarr/Radarr" />
                        <StyledCheckbox checked={!!selectedRule?.actions?.deleteFiles} onChange={(checked) => updateRule(selectedRule.id, { actions: { ...(selectedRule.actions || {}), deleteFiles: checked } })} label="Delete files on disk" />
                    </div>

                    <div className="space-y-2">
                        {(selectedRule?.filterTree?.conditions || []).map((cond: any, idx: number) => (
                            <MaintenanceConditionRow key={`${selectedRule.id}-${idx}`} condition={cond} fields={fields} onChange={(next) => updateCondition(selectedRule.id, idx, next)} onDelete={() => removeCondition(selectedRule.id, idx)} />
                        ))}
                        <button type="button" onClick={() => addCondition(selectedRule.id)} className="px-2 py-1 text-[11px] border border-border rounded-lg text-plex font-semibold">Add Filter Condition</button>
                    </div>

                    <div className="bg-background/30 border border-white/5 rounded-lg p-3">
                        <StyledCheckbox checked={pinCollectionOnDestructiveRun} onChange={setPinCollectionOnDestructiveRun} label="On destructive run, create collection and pin to home for all users" />
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                        <button type="button" className="px-2 py-1 text-[11px] bg-plex text-background rounded-md font-semibold hover:opacity-90 disabled:opacity-50" onClick={(e) => saveRules(e)} disabled={saving}>
                            {saving ? 'Saving...' : 'Save Filter'}
                        </button>
                        <button type="button" className="px-2 py-1 text-[11px] bg-border text-text rounded-md font-semibold hover:bg-opacity-80 disabled:opacity-50" onClick={(e) => runPreview(selectedRule.id, e)} disabled={previewRuleId === selectedRule.id}>{previewRuleId === selectedRule.id ? 'Refreshing Preview...' : 'Preview Matches'}</button>
                        <button type="button" className="px-2 py-1 text-[11px] bg-blue-500/20 text-blue-300 rounded-md font-semibold border border-blue-500/30 disabled:opacity-50" onClick={(e) => runRule(selectedRule.id, true, e)} disabled={runningRuleId === selectedRule.id}>{runningRuleId === selectedRule.id ? 'Running...' : 'Run Dry-Run'}</button>
                        <button type="button" className="px-2 py-1 text-[11px] bg-red-500/20 text-red-300 rounded-md font-semibold border border-red-500/30 disabled:opacity-50" onClick={(e) => runRule(selectedRule.id, false, e)} disabled={runningRuleId === selectedRule.id}>{runningRuleId === selectedRule.id ? 'Executing...' : 'Run Destructive'}</button>
                    </div>
                </div>
            )}

            <div className="bg-card/50 backdrop-blur-md border border-white/5 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-text">Matched Titles</h4>
                    <div className="text-right">
                        <span className="text-xs px-2 py-1 rounded bg-plex/20 text-plex font-semibold">{selectedPreview?.totalMatches || 0} matches</span>
                        {selectedPreview && (
                            <p className="text-[11px] text-muted mt-1">
                                {(selectedPreview.graceRemainingDays ?? 0) > 0
                                    ? `All in grace (${selectedPreview.graceRemainingDays} day(s) remaining)`
                                    : `${selectedPreview.eligibleCount ?? 0} eligible · ${selectedPreview.actionableCount ?? 0} in Sonarr/Radarr · up to ${selectedPreview.wouldProcessCount ?? 0} per run`}
                            </p>
                        )}
                    </div>
                </div>
                {!selectedRuleId ? (
                    <p className="text-sm text-muted">Select a saved filter to preview matches.</p>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 gap-3 max-h-[640px] overflow-y-auto custom-scrollbar pr-1">
                        {(selectedPreview?.sample || []).map((item: any) => (
                            <div key={`${selectedRuleId}-${item.ratingKey}`} className="bg-background/30 border border-white/5 rounded-lg overflow-hidden">
                                <div className="aspect-[2/3] bg-black/40">
                                    {item.thumb ? (
                                        <img
                                            src={`/api/plex/image?path=${encodeURIComponent(item.thumb)}&width=240&height=360`}
                                            alt={item.title}
                                            loading="lazy"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xs text-muted">No Poster</div>
                                    )}
                                </div>
                                <div className="p-2">
                                    <p className="text-xs text-text line-clamp-2">{item.title}</p>
                                    <p className="text-[11px] text-muted mt-1">{item.libraryTitle || item.mediaType}</p>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {item.eligible === false && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300">Grace</span>
                                        )}
                                        {item.arrResolvable ? (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/15 text-green-300">{item.arrType || 'ARR'}</span>
                                        ) : item.eligible !== false ? (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-300">Unmapped</span>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </div>
    );
};