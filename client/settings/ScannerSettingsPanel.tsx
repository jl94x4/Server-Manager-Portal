import React, { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { SettingsToggleRow } from '../shared/ui';
import { SettingHint } from './SettingHint';
import { apiFetch } from '../shared/api';

export type RewriteRule = { from: string; to: string };
export type ScannerTrigger = { name: string; priority: number; rewrite: RewriteRule[] };
export type ScannerTarget = {
    enabled: boolean;
    usePortalCredentials: boolean;
    url: string;
    token?: string;
    apiKey?: string;
    rewrite: RewriteRule[];
};

export type ScannerSettings = {
    minimumAge: string;
    verifyPathExists: boolean;
    authUsername: string;
    authPassword: string;
    triggers: {
        sonarr: ScannerTrigger[];
        radarr: ScannerTrigger[];
        lidarr: ScannerTrigger[];
    };
    targets: {
        plex: ScannerTarget[];
        jellyfin: ScannerTarget[];
        emby: ScannerTarget[];
    };
};

export const defaultScannerSettings = (): ScannerSettings => ({
    minimumAge: '1m',
    verifyPathExists: false,
    authUsername: '',
    authPassword: '',
    triggers: {
        sonarr: [{ name: 'sonarr', priority: 1, rewrite: [] }],
        radarr: [{ name: 'radarr', priority: 1, rewrite: [] }],
        lidarr: [{ name: 'lidarr', priority: 1, rewrite: [] }],
    },
    targets: {
        plex: [{ enabled: true, usePortalCredentials: true, url: '', token: '', rewrite: [] }],
        jellyfin: [{ enabled: false, usePortalCredentials: true, url: '', apiKey: '', rewrite: [] }],
        emby: [{ enabled: false, usePortalCredentials: true, url: '', apiKey: '', rewrite: [] }],
    },
});

const RewriteEditor: React.FC<{
    rules: RewriteRule[];
    onChange: (rules: RewriteRule[]) => void;
    disabled?: boolean;
}> = ({ rules, onChange, disabled }) => (
    <div className="space-y-2 mt-2">
        {(rules || []).map((rule, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2">
                <input
                    className="bg-black/30 border border-border rounded px-3 py-2 text-sm"
                    placeholder="From (regexp)"
                    value={rule.from}
                    disabled={disabled}
                    onChange={(e) => {
                        const next = [...rules];
                        next[i] = { ...next[i], from: e.target.value };
                        onChange(next);
                    }}
                />
                <input
                    className="bg-black/30 border border-border rounded px-3 py-2 text-sm"
                    placeholder="To"
                    value={rule.to}
                    disabled={disabled}
                    onChange={(e) => {
                        const next = [...rules];
                        next[i] = { ...next[i], to: e.target.value };
                        onChange(next);
                    }}
                />
                <button
                    type="button"
                    className="text-xs text-red-300 px-2"
                    disabled={disabled}
                    onClick={() => onChange(rules.filter((_, idx) => idx !== i))}
                >
                    Remove
                </button>
            </div>
        ))}
        <button
            type="button"
            className="text-xs text-plex font-semibold"
            disabled={disabled}
            onClick={() => onChange([...(rules || []), { from: '', to: '' }])}
        >
            + Add rewrite
        </button>
    </div>
);

type Props = {
    enabled: boolean;
    onEnabledChange: (v: boolean) => void;
    scanner: ScannerSettings;
    onChange: (next: ScannerSettings) => void;
    sectionId: string;
    addToast?: (msg: string, type?: 'success' | 'error') => void;
};

export const ScannerSettingsPanel: React.FC<Props> = ({
    enabled,
    onEnabledChange,
    scanner,
    onChange,
    sectionId,
    addToast,
}) => {
    const [yamlText, setYamlText] = useState('');
    const [importing, setImporting] = useState(false);
    const [importSummary, setImportSummary] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const update = (patch: Partial<ScannerSettings>) => onChange({ ...scanner, ...patch });

    const updateTrigger = (kind: 'sonarr' | 'radarr' | 'lidarr', index: number, patch: Partial<ScannerTrigger>) => {
        const list = [...(scanner.triggers[kind] || [])];
        list[index] = { ...list[index], ...patch };
        update({ triggers: { ...scanner.triggers, [kind]: list } });
    };

    const updateTarget = (kind: 'plex' | 'jellyfin' | 'emby', index: number, patch: Partial<ScannerTarget>) => {
        const list = [...(scanner.targets[kind] || [])];
        list[index] = { ...list[index], ...patch };
        update({ targets: { ...scanner.targets, [kind]: list } });
    };

    const summarizeImport = (imported: ScannerSettings) => {
        const parts = [
            `min-age ${imported.minimumAge || '1m'}`,
            imported.authUsername ? `auth @${imported.authUsername}` : null,
            `sonarr ${(imported.triggers?.sonarr?.[0]?.rewrite || []).length} rewrites`,
            `radarr ${(imported.triggers?.radarr?.[0]?.rewrite || []).length} rewrites`,
            `lidarr ${(imported.triggers?.lidarr?.[0]?.rewrite || []).length} rewrites`,
            `plex ${(imported.targets?.plex?.[0]?.rewrite || []).length} rewrites`,
        ].filter(Boolean);
        return parts.join(' · ');
    };

    const applyImported = (imported: ScannerSettings) => {
        const next = {
            ...defaultScannerSettings(),
            ...imported,
            triggers: {
                ...defaultScannerSettings().triggers,
                ...(imported.triggers || {}),
            },
            targets: {
                ...defaultScannerSettings().targets,
                ...(imported.targets || {}),
            },
        };
        onChange(next);
        setImportSummary(summarizeImport(next));
        addToast?.('Autoscan config imported — review below, then Save Settings', 'success');
    };

    const importYaml = async (raw?: string) => {
        const yaml = String(raw ?? yamlText || '').trim();
        if (!yaml) {
            addToast?.('Paste or upload an Autoscan config.yml first', 'error');
            return;
        }
        setImporting(true);
        try {
            const res = await apiFetch('/api/scanner/import-yaml', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ yaml }),
            });
            if (res?.imported) {
                applyImported(res.imported);
                if (raw && raw !== yamlText) setYamlText(raw);
            }
        } catch (e: any) {
            addToast?.(e?.message || 'Import failed', 'error');
        } finally {
            setImporting(false);
        }
    };

    const onPickFile = async (file: File | null) => {
        if (!file) return;
        try {
            const text = await file.text();
            setYamlText(text);
            await importYaml(text);
        } catch {
            addToast?.('Could not read that file', 'error');
        }
    };

    return (
        <div className="mb-8 animate-fade-in space-y-6">
            <h3 className="text-xl font-bold text-plex mb-4 border-b border-border pb-2">Scanner</h3>
            <section id={sectionId} className="space-y-4 scroll-mt-24">
                <p className="text-xs text-muted -mt-2">
                    Native Autoscan-style library refresh for Sonarr / Radarr / Lidarr webhooks and manual paths.
                    Admin-only Scanner page appears in the nav when enabled.
                </p>

                <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 space-y-3">
                    <h4 className="font-bold text-sm text-white">Import from Autoscan</h4>
                    <p className="text-xs text-muted">
                        Upload or paste your Autoscan <code className="text-white/80">config.yml</code> to fill minimum age,
                        webhook auth, Sonarr/Radarr/Lidarr triggers + rewrites, and Plex target rewrites.
                        Plex URL/token still come from Settings → Plex. Review the fields below, then click <strong>Save Settings</strong>.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".yml,.yaml,text/yaml,text/plain"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0] || null;
                                e.target.value = '';
                                void onPickFile(file);
                            }}
                        />
                        <button
                            type="button"
                            disabled={importing}
                            onClick={() => fileInputRef.current?.click()}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-black text-sm font-semibold disabled:opacity-50"
                        >
                            <Upload className="w-4 h-4" />
                            {importing ? 'Importing…' : 'Upload config.yml'}
                        </button>
                        <button
                            type="button"
                            disabled={!yamlText.trim() || importing}
                            onClick={() => void importYaml()}
                            className="px-4 py-2 rounded-lg border border-white/15 text-sm font-semibold text-white hover:bg-white/5 disabled:opacity-50"
                        >
                            Import pasted YAML
                        </button>
                    </div>
                    <textarea
                        className="w-full min-h-[120px] bg-black/30 border border-border rounded px-3 py-2 text-xs font-mono"
                        value={yamlText}
                        onChange={(e) => setYamlText(e.target.value)}
                        placeholder={"# Paste Autoscan config.yml here\nminimum-age: 1m\nauthentication:\n  username: admin\n  ..."}
                    />
                    {importSummary && (
                        <p className="text-xs text-emerald-300 font-semibold">Imported: {importSummary}</p>
                    )}
                </div>

                <SettingsToggleRow
                    title="Enable Scanner"
                    hint={<SettingHint>Turns on webhook endpoints under /triggers/* and the admin Scanner page.</SettingHint>}
                    checked={enabled}
                    onChange={onEnabledChange}
                    border={false}
                />
                <p className={`text-xs font-semibold ${enabled ? 'text-green-300' : 'text-yellow-300'}`}>
                    Current status: {enabled ? 'ON' : 'OFF'}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="font-semibold text-sm block mb-2">Minimum age</label>
                        <input
                            className="w-full bg-black/30 border border-border rounded px-3 py-2 text-sm"
                            value={scanner.minimumAge}
                            disabled={!enabled}
                            onChange={(e) => update({ minimumAge: e.target.value })}
                            placeholder="1m"
                        />
                        <p className="text-[11px] text-muted mt-1">Examples: 30s, 1m, 5m. Scans wait this long before targets are called.</p>
                    </div>
                    <div className="pt-6">
                        <SettingsToggleRow
                            title="Verify path exists"
                            hint={<SettingHint>Only process queue items when the portal can fs.stat the folder. Leave OFF if media is not mounted in the portal container.</SettingHint>}
                            checked={!!scanner.verifyPathExists}
                            onChange={(v) => update({ verifyPathExists: v })}
                            disabled={!enabled}
                            border={false}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="font-semibold text-sm block mb-2">Webhook username</label>
                        <input
                            className="w-full bg-black/30 border border-border rounded px-3 py-2 text-sm"
                            value={scanner.authUsername}
                            disabled={!enabled}
                            onChange={(e) => update({ authUsername: e.target.value })}
                            autoComplete="off"
                        />
                    </div>
                    <div>
                        <label className="font-semibold text-sm block mb-2">Webhook password</label>
                        <input
                            type="password"
                            className="w-full bg-black/30 border border-border rounded px-3 py-2 text-sm"
                            value={scanner.authPassword}
                            disabled={!enabled}
                            onChange={(e) => update({ authPassword: e.target.value })}
                            autoComplete="new-password"
                        />
                    </div>
                </div>

                {(['sonarr', 'radarr', 'lidarr'] as const).map((kind) => (
                    <div key={kind} className="rounded-xl border border-border p-4 space-y-3">
                        <h4 className="font-bold text-sm uppercase tracking-wider text-muted">{kind} triggers</h4>
                        {(scanner.triggers[kind] || []).map((trig, i) => (
                            <div key={i} className="space-y-2 border-t border-border/60 pt-3 first:border-0 first:pt-0">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs text-muted block mb-1">Name (URL /triggers/name)</label>
                                        <input
                                            className="w-full bg-black/30 border border-border rounded px-3 py-2 text-sm"
                                            value={trig.name}
                                            disabled={!enabled}
                                            onChange={(e) => updateTrigger(kind, i, { name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted block mb-1">Priority</label>
                                        <input
                                            type="number"
                                            className="w-full bg-black/30 border border-border rounded px-3 py-2 text-sm"
                                            value={trig.priority}
                                            disabled={!enabled}
                                            onChange={(e) => updateTrigger(kind, i, { priority: Number(e.target.value) || 0 })}
                                        />
                                    </div>
                                </div>
                                <label className="text-xs text-muted block">Path rewrites</label>
                                <RewriteEditor
                                    rules={trig.rewrite || []}
                                    disabled={!enabled}
                                    onChange={(rewrite) => updateTrigger(kind, i, { rewrite })}
                                />
                            </div>
                        ))}
                    </div>
                ))}

                {([
                    { kind: 'plex' as const, secret: 'token' as const, portalOnly: true },
                    { kind: 'jellyfin' as const, secret: 'apiKey' as const, portalOnly: false },
                    { kind: 'emby' as const, secret: 'apiKey' as const, portalOnly: false },
                ]).map(({ kind, secret, portalOnly }) => (
                    <div key={kind} className="rounded-xl border border-border p-4 space-y-3">
                        <h4 className="font-bold text-sm uppercase tracking-wider text-muted">{kind} target</h4>
                        {(scanner.targets[kind] || []).map((tgt, i) => (
                            <div key={i} className="space-y-2">
                                <SettingsToggleRow
                                    title={`Enable ${kind}`}
                                    checked={!!tgt.enabled}
                                    onChange={(v) => updateTarget(kind, i, {
                                        enabled: v,
                                        ...(portalOnly ? { usePortalCredentials: true, token: '', url: '' } : {}),
                                    })}
                                    disabled={!enabled}
                                    border={false}
                                />
                                {portalOnly ? (
                                    <p className="text-xs text-muted">
                                        Uses the <strong>Plex token</strong> and <strong>server URL</strong> from Settings → Plex.
                                        Configure path rewrites below if Plex sees different mount paths than the ARR apps.
                                    </p>
                                ) : (
                                    <>
                                        <SettingsToggleRow
                                            title="Use portal credentials"
                                            hint={<SettingHint>When ON, uses the media server URL/API key from Settings. Override below when OFF.</SettingHint>}
                                            checked={tgt.usePortalCredentials !== false}
                                            onChange={(v) => updateTarget(kind, i, { usePortalCredentials: v })}
                                            disabled={!enabled || !tgt.enabled}
                                            border={false}
                                        />
                                        {!tgt.usePortalCredentials && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <input
                                                    className="bg-black/30 border border-border rounded px-3 py-2 text-sm"
                                                    placeholder="URL"
                                                    value={tgt.url}
                                                    disabled={!enabled}
                                                    onChange={(e) => updateTarget(kind, i, { url: e.target.value })}
                                                />
                                                <input
                                                    type="password"
                                                    className="bg-black/30 border border-border rounded px-3 py-2 text-sm"
                                                    placeholder="API key"
                                                    value={(tgt as any)[secret] || ''}
                                                    disabled={!enabled}
                                                    onChange={(e) => updateTarget(kind, i, { [secret]: e.target.value } as any)}
                                                    autoComplete="new-password"
                                                />
                                            </div>
                                        )}
                                    </>
                                )}
                                <label className="text-xs text-muted block">Target path rewrites</label>
                                <RewriteEditor
                                    rules={tgt.rewrite || []}
                                    disabled={!enabled || !tgt.enabled}
                                    onChange={(rewrite) => updateTarget(kind, i, { rewrite })}
                                />
                            </div>
                        ))}
                    </div>
                ))}
            </section>
        </div>
    );
};
