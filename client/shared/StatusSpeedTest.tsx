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

/** Per-stream download size — 4 parallel × 25MB ≈ 100MB total per wave. */
const DOWNLOAD_BYTES_PER_STREAM = 25 * 1024 * 1024;
const DOWNLOAD_PARALLEL = 4;
const DOWNLOAD_WAVES = 2;
const UPLOAD_BYTES = 16 * 1024 * 1024;
const UPLOAD_PARALLEL = 2;
const PING_SAMPLES = 5;

const speedHeaders = (extra: HeadersInit = {}): HeadersInit => ({
    [PORTAL_CSRF_HEADER]: PORTAL_CSRF_VALUE,
    'Cache-Control': 'no-store',
    Pragma: 'no-cache',
    ...extra,
});

const formatMbps = (mbps: number) => {
    if (!Number.isFinite(mbps)) return '—';
    if (mbps >= 1000) return `${(mbps / 1000).toFixed(2)} Gbps`;
    if (mbps >= 100) return `${mbps.toFixed(0)} Mbps`;
    if (mbps >= 10) return `${mbps.toFixed(1)} Mbps`;
    return `${mbps.toFixed(2)} Mbps`;
};

const median = (values: number[]) => {
    if (!values.length) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

const buildUploadPayload = (bytes: number) => {
    const buffer = new Uint8Array(bytes);
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

async function downloadOne(bytes: number, tag: string): Promise<number> {
    const res = await fetch(portalUrl(`/api/speedtest/download?bytes=${bytes}&t=${tag}`), {
        credentials: 'same-origin',
        headers: speedHeaders(),
        cache: 'no-store',
    });
    if (!res.ok) throw new Error('Download test failed');
    const buf = await res.arrayBuffer();
    return buf.byteLength;
}

/** Parallel streams timed together — closer to how multi-gig clients saturate a link. */
async function measureDownloadWave(parallel: number, bytesPerStream: number, waveTag: string): Promise<number> {
    const start = performance.now();
    const sizes = await Promise.all(
        Array.from({ length: parallel }, (_, i) => downloadOne(bytesPerStream, `${waveTag}-${i}`)),
    );
    const seconds = Math.max(0.001, (performance.now() - start) / 1000);
    const totalBytes = sizes.reduce((a, b) => a + b, 0);
    return (totalBytes * 8) / (seconds * 1_000_000);
}

async function measureDownload(): Promise<number> {
    // Small warm-up so TCP / TLS is primed before the timed waves.
    await downloadOne(2 * 1024 * 1024, `warmup-${Date.now()}`);
    const waves: number[] = [];
    for (let w = 0; w < DOWNLOAD_WAVES; w += 1) {
        waves.push(await measureDownloadWave(DOWNLOAD_PARALLEL, DOWNLOAD_BYTES_PER_STREAM, `dl-${Date.now()}-w${w}`));
    }
    // Prefer the better wave (first often still warming the pipe).
    return Math.max(...waves);
}

async function uploadOne(payload: Uint8Array, tag: string): Promise<number> {
    const start = performance.now();
    const res = await fetch(portalUrl(`/api/speedtest/upload?t=${tag}`), {
        method: 'POST',
        credentials: 'same-origin',
        headers: speedHeaders({ 'Content-Type': 'application/octet-stream' }),
        body: payload,
        cache: 'no-store',
    });
    if (!res.ok) throw new Error('Upload test failed');
    const seconds = Math.max(0.001, (performance.now() - start) / 1000);
    return (payload.byteLength * 8) / (seconds * 1_000_000);
}

async function measureUpload(): Promise<number> {
    const payload = buildUploadPayload(UPLOAD_BYTES);
    // Warm-up single stream
    await uploadOne(payload, `ul-warmup-${Date.now()}`);
    const start = performance.now();
    await Promise.all(
        Array.from({ length: UPLOAD_PARALLEL }, (_, i) => uploadOne(payload, `ul-${Date.now()}-${i}`)),
    );
    const seconds = Math.max(0.001, (performance.now() - start) / 1000);
    const totalBytes = UPLOAD_BYTES * UPLOAD_PARALLEL;
    return (totalBytes * 8) / (seconds * 1_000_000);
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
                        Multi-stream test (~100 MB download, ~32 MB upload) from your device to this portal — not a general internet speed test, and not a direct Plex/Jellyfin path if media is on another host. May take 10–20 seconds.
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
                            value: results ? formatMbps(results.downloadMbps) : (phase === 'download' ? '…' : '—'),
                            hint: '4 parallel streams → your device',
                        },
                        {
                            label: 'Upload',
                            value: results ? formatMbps(results.uploadMbps) : (phase === 'upload' ? '…' : '—'),
                            hint: '2 parallel streams → server',
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
                <p className="mt-3 text-xs text-muted">{phaseLabel(phase)} Larger transfers — hang tight.</p>
            )}
        </div>
    );
};
