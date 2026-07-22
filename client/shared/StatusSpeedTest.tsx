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

/** Duration-based steady-state test (Ookla-style): warm up, then measure a window. */
const DOWNLOAD_PARALLEL = 8;
const UPLOAD_PARALLEL = 4;
const WARMUP_MS = 2500;
const MEASURE_MS = 8000;
const PING_SAMPLES = 5;
const UPLOAD_CHUNK_BYTES = 1024 * 1024;
/** Web Crypto getRandomValues rejects views larger than 65536 bytes. */
const CRYPTO_RANDOM_MAX = 65536;

const fillIncompressible = (buffer: Uint8Array) => {
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
        for (let offset = 0; offset < buffer.length; offset += CRYPTO_RANDOM_MAX) {
            crypto.getRandomValues(buffer.subarray(offset, Math.min(offset + CRYPTO_RANDOM_MAX, buffer.length)));
        }
        return;
    }
    for (let i = 0; i < buffer.length; i += 1) buffer[i] = (i * 31) & 0xff;
};

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

const sleep = (ms: number) => new Promise<void>((resolve) => { setTimeout(resolve, ms); });

const isAbortError = (err: unknown) => {
    const name = (err as any)?.name;
    return name === 'AbortError' || name === 'TimeoutError';
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

/**
 * Open N endless download streams, warm the pipe, then count bytes for MEASURE_MS.
 * Aborts everything afterward. This is how you approach line-rate in a browser.
 */
async function measureDownload(): Promise<number> {
    const controllers = Array.from({ length: DOWNLOAD_PARALLEL }, () => new AbortController());
    const counters = { measureBytes: 0, measuring: false };

    const runStream = async (index: number, signal: AbortSignal) => {
        const res = await fetch(portalUrl(`/api/speedtest/download?stream=1&t=${Date.now()}-${index}`), {
            credentials: 'same-origin',
            headers: speedHeaders(),
            cache: 'no-store',
            signal,
        });
        if (!res.ok) throw new Error('Download test failed');
        if (!res.body) throw new Error('Download stream unavailable');
        const reader = res.body.getReader();
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                if (counters.measuring && value) counters.measureBytes += value.byteLength;
            }
        } catch (err) {
            if (!isAbortError(err)) throw err;
        } finally {
            try { reader.releaseLock(); } catch { /* ignore */ }
        }
    };

    const runners = Promise.all(controllers.map((c, i) => runStream(i, c.signal).catch((err) => {
        if (!isAbortError(err)) throw err;
    })));

    await sleep(WARMUP_MS);
    counters.measureBytes = 0;
    counters.measuring = true;
    const measureStart = performance.now();
    await sleep(MEASURE_MS);
    const measureEnd = performance.now();
    counters.measuring = false;
    controllers.forEach((c) => c.abort());
    await runners;

    const seconds = Math.max(0.001, (measureEnd - measureStart) / 1000);
    if (counters.measureBytes < 1024 * 1024) {
        throw new Error('Download transferred too little data — check portal connectivity');
    }
    return (counters.measureBytes * 8) / (seconds * 1_000_000);
}

/** Generate an upload body that keeps producing chunks until aborted. */
const createUploadBody = (signal: AbortSignal, onBytes: (n: number) => void) => {
    const chunk = new Uint8Array(UPLOAD_CHUNK_BYTES);
    fillIncompressible(chunk);

    return new ReadableStream<Uint8Array>({
        pull(controller) {
            if (signal.aborted) {
                controller.close();
                return;
            }
            // Reuse same incompressible chunk (content doesn't matter for throughput).
            controller.enqueue(chunk);
            onBytes(chunk.byteLength);
        },
        cancel() { /* aborted */ },
    });
};

async function measureUpload(): Promise<number> {
    const controllers = Array.from({ length: UPLOAD_PARALLEL }, () => new AbortController());
    const counters = { measureBytes: 0, measuring: false };

    const runStream = async (index: number, signal: AbortSignal) => {
        const body = createUploadBody(signal, (n) => {
            if (counters.measuring) counters.measureBytes += n;
        });
        try {
            const res = await fetch(portalUrl(`/api/speedtest/upload?t=${Date.now()}-${index}`), {
                method: 'POST',
                credentials: 'same-origin',
                headers: speedHeaders({ 'Content-Type': 'application/octet-stream' }),
                // @ts-expect-error duplex required for streaming request bodies in Chromium
                duplex: 'half',
                body,
                cache: 'no-store',
                signal,
            });
            if (!res.ok && res.status !== 499) throw new Error('Upload test failed');
        } catch (err) {
            if (!isAbortError(err)) throw err;
        }
    };

    const runners = Promise.all(controllers.map((c, i) => runStream(i, c.signal)));

    await sleep(WARMUP_MS);
    counters.measureBytes = 0;
    counters.measuring = true;
    const measureStart = performance.now();
    await sleep(MEASURE_MS);
    const measureEnd = performance.now();
    counters.measuring = false;
    controllers.forEach((c) => c.abort());
    await Promise.allSettled([runners]);

    const seconds = Math.max(0.001, (measureEnd - measureStart) / 1000);
    if (counters.measureBytes < 1024 * 1024) {
        throw new Error('Upload transferred too little data — browser may block streaming uploads');
    }
    return (counters.measureBytes * 8) / (seconds * 1_000_000);
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
            let uploadMbps = 0;
            try {
                uploadMbps = await measureUpload();
            } catch (uploadErr: any) {
                // Streaming upload isn't supported in every browser — fall back to chunked posts.
                const chunk = new Uint8Array(8 * 1024 * 1024);
                fillIncompressible(chunk);
                const start = performance.now();
                let bytes = 0;
                const endAt = start + MEASURE_MS;
                while (performance.now() < endAt) {
                    const batch = await Promise.all(Array.from({ length: UPLOAD_PARALLEL }, async (_, i) => {
                        const res = await fetch(portalUrl(`/api/speedtest/upload?t=${Date.now()}-fb-${i}`), {
                            method: 'POST',
                            credentials: 'same-origin',
                            headers: speedHeaders({ 'Content-Type': 'application/octet-stream' }),
                            body: chunk,
                            cache: 'no-store',
                        });
                        if (!res.ok) throw new Error(uploadErr?.message || 'Upload test failed');
                        return chunk.byteLength;
                    }));
                    bytes += batch.reduce((a, b) => a + b, 0);
                }
                uploadMbps = (bytes * 8) / (Math.max(0.001, (performance.now() - start) / 1000) * 1_000_000);
            }
            setResults({ latencyMs, downloadMbps, uploadMbps });
            setPhase('done');
        } catch (e: any) {
            setError(e?.message || 'Speed test failed');
            setPhase('error');
        }
    }, [running]);

    const pathHint = results && results.latencyMs >= 15
        ? 'Latency is high for a pure LAN hop — you may be reaching this portal via reverse proxy, hairpin NAT, Cloudflare, or a remote hostname. That path (not your 2.5 G switch) usually sets the ceiling.'
        : results
            ? 'Steady-state rate to this portal host. Docker bridge, proxy, or a 1 G NIC on the server can still cap you below LAN wire speed.'
            : null;

    return (
        <div className="mb-8 rounded-2xl border border-white/5 bg-card p-5 md:p-6 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <Gauge className="w-5 h-5 text-plex shrink-0" />
                        <h3 className="text-lg font-bold text-text">Connection to this server</h3>
                    </div>
                    <p className="text-sm text-muted max-w-xl">
                        ~10 s steady-state test (8 download / 4 upload streams). Measures your device → this portal only — not your ISP plan, and not Plex/Jellyfin if they live elsewhere.
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
                            hint: 'Steady-state (8 streams)',
                        },
                        {
                            label: 'Upload',
                            value: results ? formatMbps(results.uploadMbps) : (phase === 'upload' ? '…' : '—'),
                            hint: 'Steady-state (4 streams)',
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

            {pathHint && (
                <p className="mt-3 text-xs text-muted leading-relaxed">{pathHint}</p>
            )}
            {error && (
                <p className="mt-3 text-sm text-status-expired">{error}</p>
            )}
            {running && (
                <p className="mt-3 text-xs text-muted">{phaseLabel(phase)} Warm-up + 8 s measure — about 20–25 s total.</p>
            )}
        </div>
    );
};
