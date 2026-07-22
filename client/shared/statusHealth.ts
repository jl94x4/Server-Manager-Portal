export type StatusPeriod = '24h' | '7d' | '30d' | '90d';

export const STATUS_PERIODS: { id: StatusPeriod; label: string }[] = [
    { id: '24h', label: '24h' },
    { id: '7d', label: '7d' },
    { id: '30d', label: '30d' },
    { id: '90d', label: '90d' },
];

export type HealthBucket = {
    up?: number;
    down?: number;
    total?: number;
    latencySum?: number;
    latencyCount?: number;
};

export type HealthCheckSample = {
    t: number;
    status: string;
    latency?: number;
    /** Present when API downsamples recentChecks into time buckets */
    _n?: number;
    _up?: number;
};

export type HealthIncident = {
    id: string;
    from: string;
    to: string;
    startedAt: number;
    endedAt?: number | null;
    durationMs?: number | null;
};

export type ServiceHealth = {
    currentStatus?: string;
    lastCheck?: number;
    uptimePercentage?: number;
    lastLatency?: number | null;
    lastHttpCode?: number | null;
    dailyHistory?: Record<string, HealthBucket>;
    hourlyHistory?: Record<string, HealthBucket>;
    recentChecks?: HealthCheckSample[];
    incidents?: HealthIncident[];
};

export type StatusBarPoint = {
    key: string;
    label: string;
    up: number;
    total: number;
    pct: number | null;
    avgLatency: number | null;
};

export type LatencyStats = {
    avg: number | null;
    p95: number | null;
    samples: number;
};

export type PeriodStats = {
    up: number;
    total: number;
    pct: number;
    latency: LatencyStats;
    incidentCount: number;
    longestOutageMs: number;
    openIncident: HealthIncident | null;
    bestDay: { key: string; pct: number } | null;
    worstDay: { key: string; pct: number } | null;
    currentStreakHours: number;
};

const PERIOD_MS: Record<StatusPeriod, number> = {
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    '90d': 90 * 24 * 60 * 60 * 1000,
};

const PERIOD_DAY_COUNT: Record<'7d' | '30d' | '90d', number> = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
};

const dayKeyFromDate = (d: Date) => d.toISOString().split('T')[0];

const hourKeyFromTs = (ts: number) => {
    const d = new Date(ts);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    const h = String(d.getUTCHours()).padStart(2, '0');
    return `${y}-${m}-${day}T${h}`;
};

const bucketPct = (bucket?: HealthBucket | null): number | null => {
    if (!bucket || !bucket.total) return null;
    return (Number(bucket.up || 0) / Number(bucket.total)) * 100;
};

const bucketAvgLatency = (bucket?: HealthBucket | null): number | null => {
    if (!bucket || !bucket.latencyCount) return null;
    return Number(bucket.latencySum || 0) / Number(bucket.latencyCount);
};

const percentile = (sorted: number[], p: number): number | null => {
    if (!sorted.length) return null;
    const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
    return sorted[idx];
};

const periodCutoff = (period: StatusPeriod, now = Date.now()) => now - PERIOD_MS[period];

export const formatDurationShort = (ms: number): string => {
    if (!Number.isFinite(ms) || ms < 0) return '—';
    const sec = Math.floor(ms / 1000);
    if (sec < 60) return `${sec}s`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m`;
    const hr = Math.floor(min / 60);
    const remMin = min % 60;
    if (hr < 48) return remMin ? `${hr}h ${remMin}m` : `${hr}h`;
    const days = Math.floor(hr / 24);
    const remHr = hr % 24;
    return remHr ? `${days}d ${remHr}h` : `${days}d`;
};

export const formatLatencyMs = (ms: number | null | undefined): string => {
    if (ms == null || !Number.isFinite(ms)) return '—';
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
};

export const statusToneFromPct = (pct: number | null): 'online' | 'degraded' | 'offline' | 'unknown' => {
    if (pct == null) return 'unknown';
    if (pct >= 99) return 'online';
    if (pct >= 90) return 'degraded';
    return 'offline';
};

export const incidentsForPeriod = (health: ServiceHealth | null | undefined, period: StatusPeriod, now = Date.now()): HealthIncident[] => {
    const cutoff = periodCutoff(period, now);
    const list = Array.isArray(health?.incidents) ? health!.incidents! : [];
    return list
        .filter((incident) => {
            if (!incident?.startedAt) return false;
            const end = incident.endedAt != null ? incident.endedAt : now;
            return end >= cutoff;
        })
        .sort((a, b) => (b.startedAt || 0) - (a.startedAt || 0));
};

export const latencyStatsForPeriod = (health: ServiceHealth | null | undefined, period: StatusPeriod, now = Date.now()): LatencyStats => {
    const cutoff = periodCutoff(period, now);

    if (period === '24h') {
        const samples = (health?.recentChecks || [])
            .filter((s) => s && s.t >= cutoff && s.status === 'online' && Number(s.latency) > 0)
            .map((s) => Number(s.latency));
        if (!samples.length) {
            return { avg: health?.lastLatency != null ? Number(health.lastLatency) : null, p95: null, samples: 0 };
        }
        const sorted = [...samples].sort((a, b) => a - b);
        const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
        return { avg, p95: percentile(sorted, 95), samples: samples.length };
    }

    const hourly = health?.hourlyHistory || {};
    let sum = 0;
    let count = 0;
    const avgs: number[] = [];
    for (const [key, bucket] of Object.entries(hourly)) {
        const ts = new Date(`${key}:00:00.000Z`).getTime();
        if (!Number.isFinite(ts) || ts < cutoff) continue;
        if (!bucket?.latencyCount) continue;
        const avg = Number(bucket.latencySum || 0) / Number(bucket.latencyCount);
        sum += Number(bucket.latencySum || 0);
        count += Number(bucket.latencyCount || 0);
        avgs.push(avg);
    }
    if (!count) {
        return { avg: health?.lastLatency != null ? Number(health.lastLatency) : null, p95: null, samples: 0 };
    }
    const sorted = [...avgs].sort((a, b) => a - b);
    return { avg: sum / count, p95: percentile(sorted, 95), samples: count };
};

export const uptimeForPeriod = (health: ServiceHealth | null | undefined, period: StatusPeriod, now = Date.now()): { up: number; total: number; pct: number } => {
    const cutoff = periodCutoff(period, now);

    if (period === '24h') {
        const samples = (health?.recentChecks || []).filter((s) => s && s.t >= cutoff);
        if (samples.length) {
            let up = 0;
            let total = 0;
            for (const s of samples) {
                const n = Number(s._n);
                const u = Number(s._up);
                if (Number.isFinite(n) && n > 0 && Number.isFinite(u)) {
                    up += u;
                    total += n;
                } else {
                    total += 1;
                    if (s.status === 'online') up += 1;
                }
            }
            return { up, total, pct: total > 0 ? (up / total) * 100 : 100 };
        }
        // Fall back to today's daily bucket / last hour if recentChecks not yet populated
        const hourKeys = Object.keys(health?.hourlyHistory || {}).sort();
        let up = 0;
        let total = 0;
        for (const key of hourKeys) {
            const ts = new Date(`${key}:00:00.000Z`).getTime();
            if (!Number.isFinite(ts) || ts < cutoff) continue;
            const bucket = health!.hourlyHistory![key];
            up += Number(bucket?.up || 0);
            total += Number(bucket?.total || 0);
        }
        if (total > 0) return { up, total, pct: (up / total) * 100 };
        const today = dayKeyFromDate(new Date(now));
        const day = health?.dailyHistory?.[today];
        if (day?.total) {
            return { up: Number(day.up || 0), total: Number(day.total), pct: (Number(day.up || 0) / Number(day.total)) * 100 };
        }
        return { up: 0, total: 0, pct: health?.uptimePercentage ?? 100 };
    }

    if (period === '7d' && health?.hourlyHistory && Object.keys(health.hourlyHistory).length > 0) {
        let up = 0;
        let total = 0;
        for (const [key, bucket] of Object.entries(health.hourlyHistory)) {
            const ts = new Date(`${key}:00:00.000Z`).getTime();
            if (!Number.isFinite(ts) || ts < cutoff) continue;
            up += Number(bucket?.up || 0);
            total += Number(bucket?.total || 0);
        }
        if (total > 0) return { up, total, pct: (up / total) * 100 };
    }

    const days = PERIOD_DAY_COUNT[period === '7d' ? '7d' : period === '30d' ? '30d' : '90d'];
    let up = 0;
    let total = 0;
    for (let i = 0; i < days; i += 1) {
        const d = new Date(now);
        d.setUTCDate(d.getUTCDate() - i);
        const key = dayKeyFromDate(d);
        const bucket = health?.dailyHistory?.[key];
        if (!bucket) continue;
        up += Number(bucket.up || 0);
        total += Number(bucket.total || 0);
    }
    if (total > 0) return { up, total, pct: (up / total) * 100 };
    return { up: 0, total: 0, pct: health?.uptimePercentage ?? 100 };
};

export const barsForPeriod = (health: ServiceHealth | null | undefined, period: StatusPeriod, now = Date.now()): StatusBarPoint[] => {
    if (period === '24h') {
        const points: StatusBarPoint[] = [];
        for (let i = 23; i >= 0; i -= 1) {
            const ts = now - i * 60 * 60 * 1000;
            const key = hourKeyFromTs(ts);
            const bucket = health?.hourlyHistory?.[key];
            const fromRecent = (health?.recentChecks || []).filter((s) => {
                if (!s) return false;
                const sampleHour = hourKeyFromTs(s.t);
                return sampleHour === key;
            });
            let up = Number(bucket?.up || 0);
            let total = Number(bucket?.total || 0);
            let avgLatency = bucketAvgLatency(bucket);
            if ((!total || !bucket) && fromRecent.length) {
                up = fromRecent.filter((s) => s.status === 'online').length;
                total = fromRecent.length;
                const latencies = fromRecent.filter((s) => s.status === 'online' && Number(s.latency) > 0).map((s) => Number(s.latency));
                avgLatency = latencies.length ? latencies.reduce((a, b) => a + b, 0) / latencies.length : null;
            }
            const hourLabel = `${String(new Date(ts).getUTCHours()).padStart(2, '0')}:00`;
            points.push({
                key,
                label: hourLabel,
                up,
                total,
                pct: total > 0 ? (up / total) * 100 : null,
                avgLatency,
            });
        }
        return points;
    }

    const days = PERIOD_DAY_COUNT[period];
    const points: StatusBarPoint[] = [];
    for (let i = days - 1; i >= 0; i -= 1) {
        const d = new Date(now);
        d.setUTCDate(d.getUTCDate() - i);
        const key = dayKeyFromDate(d);
        const bucket = health?.dailyHistory?.[key];
        const pct = bucketPct(bucket);
        points.push({
            key,
            label: key,
            up: Number(bucket?.up || 0),
            total: Number(bucket?.total || 0),
            pct,
            avgLatency: null,
        });
    }
    return points;
};

export const latencySeriesForPeriod = (health: ServiceHealth | null | undefined, period: StatusPeriod, now = Date.now()): { key: string; label: string; avg: number | null }[] => {
    if (period === '24h') {
        const cutoff = periodCutoff(period, now);
        const buckets = new Map<number, number[]>();
        // 48 half-hour buckets for a readable sparkline
        for (const sample of health?.recentChecks || []) {
            if (!sample || sample.t < cutoff || sample.status !== 'online' || !(Number(sample.latency) > 0)) continue;
            const slot = Math.floor(sample.t / (30 * 60 * 1000)) * (30 * 60 * 1000);
            if (!buckets.has(slot)) buckets.set(slot, []);
            buckets.get(slot)!.push(Number(sample.latency));
        }
        const points: { key: string; label: string; avg: number | null }[] = [];
        for (let i = 47; i >= 0; i -= 1) {
            const slot = Math.floor(now / (30 * 60 * 1000)) * (30 * 60 * 1000) - i * 30 * 60 * 1000;
            const vals = buckets.get(slot) || [];
            const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
            const d = new Date(slot);
            points.push({
                key: String(slot),
                label: `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`,
                avg,
            });
        }
        // Fallback to hourly averages if no recent checks yet
        if (!points.some((p) => p.avg != null)) {
            return barsForPeriod(health, '24h', now).map((b) => ({
                key: b.key,
                label: b.label,
                avg: b.avgLatency,
            }));
        }
        return points;
    }

    if (period === '7d') {
        const cutoff = periodCutoff(period, now);
        const points: { key: string; label: string; avg: number | null }[] = [];
        for (let i = 167; i >= 0; i -= 1) {
            const ts = now - i * 60 * 60 * 1000;
            if (ts < cutoff) continue;
            const key = hourKeyFromTs(ts);
            const avg = bucketAvgLatency(health?.hourlyHistory?.[key]);
            points.push({ key, label: key, avg });
        }
        return points;
    }

    // 30d / 90d: daily — no latency in daily buckets; use hourly rollup when present
    const days = PERIOD_DAY_COUNT[period];
    const points: { key: string; label: string; avg: number | null }[] = [];
    for (let i = days - 1; i >= 0; i -= 1) {
        const d = new Date(now);
        d.setUTCDate(d.getUTCDate() - i);
        const day = dayKeyFromDate(d);
        let sum = 0;
        let count = 0;
        for (let h = 0; h < 24; h += 1) {
            const key = `${day}T${String(h).padStart(2, '0')}`;
            const bucket = health?.hourlyHistory?.[key];
            if (bucket?.latencyCount) {
                sum += Number(bucket.latencySum || 0);
                count += Number(bucket.latencyCount || 0);
            }
        }
        points.push({
            key: day,
            label: day,
            avg: count > 0 ? sum / count : null,
        });
    }
    return points;
};

export const historyRowsForPeriod = (
    health: ServiceHealth | null | undefined,
    period: StatusPeriod,
    now = Date.now(),
): { key: string; label: string; up: number; total: number; pct: number; avgLatency: number | null }[] => {
    if (period === '24h' || period === '7d') {
        const cutoff = periodCutoff(period, now);
        const hours = period === '24h' ? 24 : 168;
        const rows: { key: string; label: string; up: number; total: number; pct: number; avgLatency: number | null }[] = [];
        for (let i = 0; i < hours; i += 1) {
            const ts = now - i * 60 * 60 * 1000;
            if (ts < cutoff) continue;
            const key = hourKeyFromTs(ts);
            const bucket = health?.hourlyHistory?.[key];
            let up = Number(bucket?.up || 0);
            let total = Number(bucket?.total || 0);
            let avgLatency = bucketAvgLatency(bucket);
            if (!total && period === '24h') {
                const fromRecent = (health?.recentChecks || []).filter((s) => s && hourKeyFromTs(s.t) === key);
                if (fromRecent.length) {
                    up = fromRecent.filter((s) => s.status === 'online').length;
                    total = fromRecent.length;
                    const lats = fromRecent.filter((s) => s.status === 'online' && Number(s.latency) > 0).map((s) => Number(s.latency));
                    avgLatency = lats.length ? lats.reduce((a, b) => a + b, 0) / lats.length : null;
                }
            }
            if (!total) continue;
            rows.push({
                key,
                label: key.replace('T', ' ') + ':00 UTC',
                up,
                total,
                pct: (up / total) * 100,
                avgLatency,
            });
        }
        return rows;
    }

    const days = PERIOD_DAY_COUNT[period];
    const rows: { key: string; label: string; up: number; total: number; pct: number; avgLatency: number | null }[] = [];
    for (let i = 0; i < days; i += 1) {
        const d = new Date(now);
        d.setUTCDate(d.getUTCDate() - i);
        const key = dayKeyFromDate(d);
        const bucket = health?.dailyHistory?.[key];
        if (!bucket?.total) continue;
        rows.push({
            key,
            label: key,
            up: Number(bucket.up || 0),
            total: Number(bucket.total),
            pct: (Number(bucket.up || 0) / Number(bucket.total)) * 100,
            avgLatency: null,
        });
    }
    return rows;
};

export const periodStats = (health: ServiceHealth | null | undefined, period: StatusPeriod, now = Date.now()): PeriodStats => {
    const uptime = uptimeForPeriod(health, period, now);
    const latency = latencyStatsForPeriod(health, period, now);
    const incidents = incidentsForPeriod(health, period, now);
    const openIncident = (health?.incidents || []).find((i) => i && i.endedAt == null) || null;

    let longestOutageMs = 0;
    for (const incident of incidents) {
        const duration = incident.endedAt != null
            ? (incident.durationMs ?? Math.max(0, incident.endedAt - incident.startedAt))
            : Math.max(0, now - incident.startedAt);
        if (duration > longestOutageMs) longestOutageMs = duration;
    }

    const dayBars = barsForPeriod(health, period === '24h' ? '7d' : period, now).filter((b) => b.pct != null && b.total > 0);
    let bestDay: { key: string; pct: number } | null = null;
    let worstDay: { key: string; pct: number } | null = null;
    for (const bar of dayBars) {
        if (bar.pct == null) continue;
        if (!bestDay || bar.pct > bestDay.pct) bestDay = { key: bar.key, pct: bar.pct };
        if (!worstDay || bar.pct < worstDay.pct) worstDay = { key: bar.key, pct: bar.pct };
    }

    // Current healthy streak from recentChecks / hourly (hours continuously online ending now)
    let currentStreakHours = 0;
    if (health?.currentStatus === 'online') {
        const hoursBack = period === '24h' ? 24 : 168;
        for (let i = 0; i < hoursBack; i += 1) {
            const ts = now - i * 60 * 60 * 1000;
            const key = hourKeyFromTs(ts);
            const bucket = health?.hourlyHistory?.[key];
            const pct = bucketPct(bucket);
            if (pct == null) {
                if (i === 0) continue;
                break;
            }
            if (pct < 99) break;
            currentStreakHours += 1;
        }
    }

    return {
        up: uptime.up,
        total: uptime.total,
        pct: uptime.pct,
        latency,
        incidentCount: incidents.length,
        longestOutageMs,
        openIncident,
        bestDay,
        worstDay,
        currentStreakHours,
    };
};

export const fleetUptimeForPeriod = (
    healthData: Record<string, ServiceHealth> | null | undefined,
    serviceIds: string[],
    period: StatusPeriod,
    now = Date.now(),
): number => {
    let up = 0;
    let total = 0;
    for (const id of serviceIds) {
        const stats = uptimeForPeriod(healthData?.[id], period, now);
        up += stats.up;
        total += stats.total;
    }
    if (total === 0) return 100;
    return (up / total) * 100;
};
