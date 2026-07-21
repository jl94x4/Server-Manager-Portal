import React, { useCallback, useState } from 'react';
import { Gauge, Loader2, Play } from 'lucide-react';
import { PORTAL_CSRF_HEADER, PORTAL_CSRF_VALUE } from './api';
import { portalUrl } from './basePath';

type SpeedPhase = 'idle' | 'ping' | 'download' | 'upload' | 'done' | 'error';

type SpeedResults = {
    latencyMs: number;
    downloadMbps: number;
    uploadMbps: number;
};

const DOWNLOAD_BYTES = 4 * 1024 * 1024;
const UPLOAD_BYTES = 2 * 1024 * 1024;
const PING_SAMPLES = 4;

const speedHeaders = (extra: HeadersInit = {}): HeadersInit => ({
    [PORTAL_CSRF_HEADER]: PORTAL_CSRF_VALUE,
    'Cache-Control': 'no-store',
    Pragma: 'no-cache',
    ...extra,
});

const formatMbps = (mbps: number) => {
    if (!Number.isFinite(mbps)) return '—';
    if (mbps >= 100) return mbps.toFixed(0);
    if (mbps >= 10) return mbps.toFixed(1);
    return mbps.toFixed(2);
};

const median = (values: number[]) => {
    if (!values.length) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

const average = (values: number[]) => {
    if (!values.length) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
};

const buildUploadPayload = (bytes: number) => {
    const buffer = new Uint8Array(bytes);
    // Randomish payload so proxies/CDNs are less likely to compress the body.
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
        const chunk = new Uint8Array(65536);
        for (let offset = 0; offset < bytes; offset += chunk.length) {
            crypto.getRandomValues(chunk);
            buffer.set(chunk.subarray(0, Math.min(chunk.length, bytes - offset)), offset);
        }
    } else {
        for (let i = 0; i < bytes; i += 1) buffer[i] = (i * 31) & 0xff;
    }
    return buffer;
};

async function measurePing(): Promise<number> {
    const samples: number[] = [];
    // Warm-up (discard)
    await fetch(portalUrl(`/api/speedtest/ping?t=${Date.now()}`), {
        credentials: 'same-origin',
        headers: speedHeaders(),
        cache: 'no-store',
    });
    for (let i = 0; i < PING_SAMPLES; i += 1) {
        const start = performance.now();
        const res = await fetch(portalUrl(`/api/speedtest/ping?t=${Date.now()}-${i}`), {
            credentials: 'same-origin',
            headers: speedHeaders(),
            cache: 'no-store',
        });
        if (!res.ok) throw new Error('Latency check failed');
        await res.text();
        samples.push(performance.now() - start);
    }
    return median(samples);
}

async function measureDownload(): Promise<number> {
    const runs: number[] = [];
    for (let i = 0; i < 2; i += 1) {
        const start = performance.now();
        const res = await fetch(portalUrl(`/api/speedtest/download?bytes=${DOWNLOAD_BYTES}&t=${Date.now()}-${i}`), {
            credentials: 'same-origin',
            headers: speedHeaders(),
            cache: 'no-store',
        });
        if (!res.ok) throw new Error('Download test failed');
        const buf = await res.arrayBuffer();
        const seconds = Math.max(0.001, (performance.now() - start) / 1000);
        runs.push((buf.byteLength * 8) / (seconds * 1_000_000));
    }
    return average(runs);
}

async function measureUpload(): Promise<number> {
    const payload = buildUploadPayload(UPLOAD_BYTES);
    const runs: number[] = [];
    for (let i = 0; i < 2; i += 1) {
        const start = performance.now();
        const res = await fetch(portalUrl(`/api/speedtest/upload?t=${Date.now()}-${i}`), {
            method: 'POST',
            credentials: 'same-origin',
            headers: speedHeaders({ 'Content-Type': 'application/octet-stream' }),
            body: payload,
            cache: 'no-store',
        });
        if (!res.ok) throw new Error('Upload test failed');
        const seconds = Math.max(0.001, (performance.now() - start) / 1000);
        runs.push((UPLOAD_BYTES * 8) / (seconds * 1_000_000));
    }
    return average(runs);
}

const phaseLabel = (phase: SpeedPhase) => {
    switch (phase) {
        case 'ping': return 'Measuring latency…';
        case 'download': return 'Testing download…';
        case 'upload': return 'Testing upload…';
        case 'done': return 'Complete';
        case 'error': return 'Test failed';
        default: return 'Ready';
    }
};

export const StatusSpeedTest: React.FC = () => {
    const [phase, setPhase] = useState<SpeedPhase>('idle');
    const [results, setResults] = useState<SpeedResults | null>(null);
    const [error, setError] = useState<string | null>(null);

    const running = phase === 'ping' || phase === 'download' || phase === 'upload';

    const runTest = useCallback(async () => {
        if (running) return;
        setError(null);
        setResults(null);
        try {
            setPhase('ping');
            const latencyMs = await measurePing();
            setPhase('download');
            const downloadMbps = await measureDownload();
            setPhase('upload');
            const uploadMbps = await measureUpload();
            setResults({ latencyMs, downloadMbps, uploadMbps });
            setPhase('done');
        } catch (e: any) {
            setError(e?.message || 'Speed test failed');
            setPhase('error');
        }
    }, [running]);

    return (
        <div className="mb-8 rounded-2xl border border-white/5 bg-card p-5 md:p-6 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <Gauge className="w-5 h-5 text-plex shrink-0" />
                        <h3 className="text-lg font-bold text-text">Connection to this server</h3>
                    </div>
                    <p className="text-sm text-muted max-w-xl">
                        Tests your device’s link to this portal (latency, download, upload) — not a general internet speed test, and not a direct Plex/Jellyfin stream path if media is on another host.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={runTest}
                    disabled={running}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-plex text-background font-bold text-sm hover:bg-plex-hover disabled:opacity-50 disabled:pointer-events-none transition-colors shrink-0"
                >
                    {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    {running ? phaseLabel(phase) : (results ? 'Run again' : 'Run speed test')}
                </button>
            </div>

            {(results || running || error) && (
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                        {
                            label: 'Latency',
                            value: results ? `${Math.round(results.latencyMs)} ms` : (phase === 'ping' ? '…' : '—'),
                            hint: 'Round-trip to portal',
                        },
                        {
                            label: 'Download',
                            value: results ? `${formatMbps(results.downloadMbps)} Mbps` : (phase === 'download' ? '…' : '—'),
                            hint: 'Server → your device',
                        },
                        {
                            label: 'Upload',
                            value: results ? `${formatMbps(results.uploadMbps)} Mbps` : (phase === 'upload' ? '…' : '—'),
                            hint: 'Your device → server',
                        },
                    ].map((card) => (
                        <div key={card.label} className="rounded-xl border border-white/5 bg-black/20 px-4 py-3">
                            <p className="text-[10px] uppercase tracking-widest font-bold text-muted">{card.label}</p>
                            <p className="text-2xl font-black text-text tabular-nums mt-1">{card.value}</p>
                            <p className="text-[11px] text-muted mt-1">{card.hint}</p>
                        </div>
                    ))}
                </div>
            )}

            {error && (
                <p className="mt-3 text-sm text-status-expired">{error}</p>
            )}
            {running && (
                <p className="mt-3 text-xs text-muted">{phaseLabel(phase)} This may take a few seconds.</p>
            )}
        </div>
    );
};
