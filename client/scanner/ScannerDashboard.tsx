import React, { useCallback, useEffect, useState } from 'react';
import { Copy, Loader2, Radar, RefreshCw, Send } from 'lucide-react';
import { apiFetch } from '../shared/api';
import { portalUrl } from '../shared/basePath';

type ScannerStatus = {
    enabled: boolean;
    minimumAge: string;
    verifyPathExists: boolean;
    remaining: number;
    processed: number;
    targetCount: number;
    webhookPaths: {
        manual: string;
        sonarr: string[];
        radarr: string[];
        lidarr: string[];
    };
};

type LogEntry = {
    at?: string;
    ok?: boolean;
    folder?: string;
    source?: string;
    error?: string;
    results?: any[];
};

export const ScannerDashboard: React.FC = () => {
    const [path, setPath] = useState('');
    const [status, setStatus] = useState<ScannerStatus | null>(null);
    const [queue, setQueue] = useState<any[]>([]);
    const [log, setLog] = useState<LogEntry[]>([]);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        try {
            const [st, q, lg] = await Promise.all([
                apiFetch('/api/scanner/status'),
                apiFetch('/api/scanner/queue'),
                apiFetch('/api/scanner/log?limit=40'),
            ]);
            setStatus(st);
            setQueue(Array.isArray(q?.scans) ? q.scans : []);
            setLog(Array.isArray(lg?.entries) ? lg.entries : []);
            setError(null);
        } catch (e: any) {
            setError(e?.message || 'Failed to load scanner');
        }
    }, []);

    useEffect(() => {
        void refresh();
        const id = window.setInterval(() => { void refresh(); }, 8000);
        return () => window.clearInterval(id);
    }, [refresh]);

    const submitPath = async (e: React.FormEvent) => {
        e.preventDefault();
        const value = path.trim();
        if (!value) return;
        setBusy(true);
        setMessage(null);
        setError(null);
        try {
            const res = await apiFetch('/api/scanner/manual', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: value }),
            });
            setMessage(`Queued: ${res.folder || value}`);
            setPath('');
            await refresh();
        } catch (err: any) {
            setError(err?.message || 'Failed to queue path');
        } finally {
            setBusy(false);
        }
    };

    const copyText = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setMessage('Copied to clipboard');
        } catch {
            setMessage(text);
        }
    };

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const webhookUrl = (p: string) => `${origin}${portalUrl(p)}`;

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-muted text-xs font-bold uppercase tracking-wider mb-2">
                        <Radar className="w-4 h-4" /> Scanner
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Path to scan</h1>
                    <p className="text-muted mt-2 text-sm max-w-xl">
                        Queue a folder for partial library refresh on your configured Plex, Jellyfin, or Emby targets.
                        ARR apps should post to the webhook URLs below.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => void refresh()}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 text-sm text-muted hover:text-white hover:bg-white/5"
                >
                    <RefreshCw className="w-4 h-4" /> Refresh
                </button>
            </div>

            <form onSubmit={submitPath} className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                    <input
                        type="text"
                        value={path}
                        onChange={(e) => setPath(e.target.value)}
                        placeholder="Path to scan e.g. /mnt/unionfs/Media/Movies/Movie Name (year)"
                        className="flex-1 rounded-lg bg-black/30 border border-white/10 px-4 py-3 text-white placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-accent/40"
                    />
                    <button
                        type="submit"
                        disabled={busy || !path.trim()}
                        className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-accent text-black font-semibold disabled:opacity-50"
                    >
                        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Submit
                    </button>
                </div>
                <div className="rounded-lg bg-sky-500/10 border border-sky-400/20 text-sky-100 text-sm px-4 py-3">
                    Clicking <strong>Submit</strong> will add the path to the scan queue
                    {status?.minimumAge ? <> (processed after minimum age: <code>{status.minimumAge}</code>)</> : null}.
                </div>
            </form>

            {(message || error) && (
                <div className={`rounded-lg px-4 py-3 text-sm ${error ? 'bg-red-500/10 text-red-200 border border-red-400/20' : 'bg-emerald-500/10 text-emerald-100 border border-emerald-400/20'}`}>
                    {error || message}
                </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: 'Queued', value: status?.remaining ?? '—' },
                    { label: 'Processed', value: status?.processed ?? '—' },
                    { label: 'Targets', value: status?.targetCount ?? '—' },
                    { label: 'Min age', value: status?.minimumAge ?? '—' },
                ].map((card) => (
                    <div key={card.label} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                        <div className="text-[10px] uppercase tracking-wider text-muted font-bold">{card.label}</div>
                        <div className="text-xl font-semibold text-white mt-1">{card.value}</div>
                    </div>
                ))}
            </div>

            <section className="space-y-3">
                <h2 className="text-lg font-semibold text-white">ARR webhooks</h2>
                <p className="text-sm text-muted">
                    In Sonarr / Radarr / Lidarr: Settings → Connect → Webhook → On Import + On Upgrade.
                    Use Basic Auth with the username/password from Settings → Scanner.
                </p>
                <div className="space-y-2">
                    {[
                        ...(status?.webhookPaths?.sonarr || ['/triggers/sonarr']).map((p) => ({ label: 'Sonarr', path: p })),
                        ...(status?.webhookPaths?.radarr || ['/triggers/radarr']).map((p) => ({ label: 'Radarr', path: p })),
                        ...(status?.webhookPaths?.lidarr || ['/triggers/lidarr']).map((p) => ({ label: 'Lidarr', path: p })),
                        { label: 'Manual', path: status?.webhookPaths?.manual || '/triggers/manual' },
                    ].map((row) => {
                        const full = webhookUrl(row.path);
                        return (
                            <div key={`${row.label}-${row.path}`} className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                                <span className="text-xs font-bold uppercase text-muted w-16 shrink-0">{row.label}</span>
                                <code className="flex-1 text-xs text-white/90 truncate">{full}</code>
                                <button type="button" onClick={() => void copyText(full)} className="p-1.5 rounded hover:bg-white/10 text-muted hover:text-white" title="Copy">
                                    <Copy className="w-4 h-4" />
                                </button>
                            </div>
                        );
                    })}
                </div>
            </section>

            <section className="space-y-3">
                <h2 className="text-lg font-semibold text-white">Queue</h2>
                {queue.length === 0 ? (
                    <p className="text-sm text-muted">Queue is empty.</p>
                ) : (
                    <ul className="space-y-2">
                        {queue.map((item) => (
                            <li key={`${item.folder}-${item.time}`} className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm">
                                <div className="text-white font-medium break-all">{item.folder}</div>
                                <div className="text-xs text-muted mt-1">
                                    priority {item.priority ?? 0} · {item.source || '—'} · {item.time || '—'}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <section className="space-y-3">
                <h2 className="text-lg font-semibold text-white">Recent activity</h2>
                {log.length === 0 ? (
                    <p className="text-sm text-muted">No scans processed yet.</p>
                ) : (
                    <ul className="space-y-2">
                        {log.map((entry, i) => (
                            <li key={`${entry.at}-${i}`} className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-bold uppercase ${entry.ok ? 'text-emerald-300' : 'text-red-300'}`}>
                                        {entry.ok ? 'ok' : 'error'}
                                    </span>
                                    <span className="text-xs text-muted">{entry.at}</span>
                                </div>
                                <div className="text-white break-all mt-1">{entry.folder}</div>
                                {entry.error && <div className="text-xs text-red-200 mt-1">{entry.error}</div>}
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
};

export default ScannerDashboard;
