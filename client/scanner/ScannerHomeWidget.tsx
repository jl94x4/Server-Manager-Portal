import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, ListTodo, Radar, RefreshCw, Target } from 'lucide-react';
import { apiFetch } from '../shared/api';

type ScannerStatus = {
    enabled?: boolean;
    remaining?: number;
    processed?: number;
    targetCount?: number;
    minimumAge?: string;
    lastActivity?: {
        at?: string;
        ok?: boolean;
        folder?: string;
        source?: string;
        error?: string;
    } | null;
};

type Props = {
    onOpen?: () => void;
};

const formatWhen = (iso?: string) => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const shortenPath = (folder?: string) => {
    if (!folder) return 'No recent activity';
    const parts = folder.replace(/\\/g, '/').split('/').filter(Boolean);
    if (parts.length <= 3) return folder;
    return `…/${parts.slice(-3).join('/')}`;
};

export const ScannerHomeWidget: React.FC<Props> = ({ onOpen }) => {
    const [status, setStatus] = useState<ScannerStatus | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const data = await apiFetch('/api/scanner/status');
            setStatus(data || null);
        } catch (e: any) {
            setError(e?.message || 'Unavailable');
            setStatus(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
        const id = window.setInterval(() => { void load(); }, 15000);
        return () => window.clearInterval(id);
    }, [load]);

    const remaining = status?.remaining ?? 0;
    const processed = status?.processed ?? 0;
    const targets = status?.targetCount ?? 0;
    const last = status?.lastActivity;
    const active = !!status?.enabled;

    return (
        <div className="glass-card p-4 md:p-5 shadow-xl w-full self-start overflow-hidden relative">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-500/10 via-transparent to-plex/10" />
            <div className="relative">
                <div className="flex items-center justify-between gap-2 mb-3 md:mb-4">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-400/30 flex items-center justify-center shrink-0">
                            <Radar className="w-4 h-4 text-sky-300" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-muted text-[10px] uppercase tracking-widest font-bold">Scanner</p>
                            <p className="text-text font-bold text-sm truncate">Library refresh</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => { void load(); }}
                        className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-white/5 transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {error && !status ? (
                    <p className="text-xs text-red-300/90 mb-3">{error}</p>
                ) : (
                    <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="rounded-xl bg-background/50 border border-white/5 p-2.5 text-center">
                            <ListTodo className="w-3.5 h-3.5 text-sky-300 mx-auto mb-1 opacity-80" />
                            <p className="text-lg font-black text-text leading-none">{remaining}</p>
                            <p className="text-[9px] uppercase tracking-wider font-bold text-muted mt-1">Queued</p>
                        </div>
                        <div className="rounded-xl bg-background/50 border border-white/5 p-2.5 text-center">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 mx-auto mb-1 opacity-80" />
                            <p className="text-lg font-black text-text leading-none">{processed}</p>
                            <p className="text-[9px] uppercase tracking-wider font-bold text-muted mt-1">Processed</p>
                        </div>
                        <div className="rounded-xl bg-background/50 border border-white/5 p-2.5 text-center">
                            <Target className="w-3.5 h-3.5 text-plex mx-auto mb-1 opacity-80" />
                            <p className="text-lg font-black text-text leading-none">{targets}</p>
                            <p className="text-[9px] uppercase tracking-wider font-bold text-muted mt-1">Targets</p>
                        </div>
                    </div>
                )}

                <div className="rounded-xl bg-black/25 border border-white/5 px-3 py-2.5 mb-3">
                    <p className="text-[9px] uppercase tracking-wider font-bold text-muted mb-1">Latest activity</p>
                    {last ? (
                        <>
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[10px] font-bold uppercase ${last.ok ? 'text-emerald-300' : 'text-red-300'}`}>
                                    {last.ok ? 'ok' : 'error'}
                                </span>
                                <span className="text-[10px] text-muted">{formatWhen(last.at)}</span>
                                {last.source ? <span className="text-[10px] text-sky-300/90 truncate">{last.source}</span> : null}
                            </div>
                            <p className="text-xs text-text/90 font-medium break-all leading-snug">{shortenPath(last.folder)}</p>
                            {last.error ? <p className="text-[10px] text-red-200/90 mt-1">{last.error}</p> : null}
                        </>
                    ) : (
                        <p className="text-xs text-muted">Waiting for the next webhook or manual scan.</p>
                    )}
                </div>

                <div className="flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border ${
                        active
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : 'bg-white/5 border-white/10 text-muted'
                    }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-400 animate-pulse' : 'bg-muted'}`} />
                        {active ? 'Armed' : 'Idle'}
                        {status?.minimumAge ? ` · ${status.minimumAge}` : ''}
                    </span>
                    {onOpen ? (
                        <button
                            type="button"
                            onClick={onOpen}
                            className="text-xs font-bold text-sky-300 hover:underline"
                        >
                            Open
                        </button>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default ScannerHomeWidget;
