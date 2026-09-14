import React, { useEffect, useMemo, useState } from 'react';
import {
    ArrowLeft,
    Calendar,
    Clock,
    Monitor,
    Play,
    Users,
    BarChart3,
    History,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip } from 'recharts';
import { apiFetch } from '../shared/api';
import { portalUrl } from '../shared/basePath';
import { formatPortalDateTimeCompact } from '../shared/format';
import {
    DashboardHero,
    DashboardPageShell,
    DashboardPanel,
    DashboardStatCard,
    dashboardGlowClass,
} from '../shared/dashboard/DashboardChrome';

type TitleHistoryRow = {
    user?: string;
    userThumb?: string | null;
    date?: number;
    duration?: number;
    player?: string | null;
    platform?: string | null;
    title?: string | null;
};

type TitleUserRow = {
    user: string;
    userThumb?: string | null;
    plays: number;
    totalSeconds: number;
    lastWatchedAt?: number | null;
};

type TitleAnalyticsPayload = {
    item?: {
        ratingKey?: string;
        title?: string;
        type?: string;
        year?: number | string | null;
        thumb?: string | null;
        plexUrl?: string | null;
        summary?: string | null;
    };
    source?: 'tautulli' | 'plex';
    stats?: {
        plays?: number;
        uniqueUsers?: number;
        totalSeconds?: number;
        lastWatchedAt?: number | null;
    };
    users?: TitleUserRow[];
    history?: TitleHistoryRow[];
    byMonth?: Array<{ month: string; plays: number }>;
    byPlatform?: Array<{ platform: string; plays: number }>;
    error?: string;
};

const formatHours = (seconds = 0) => {
    const hrs = Math.max(0, Number(seconds) || 0) / 3600;
    if (hrs >= 10) return hrs.toFixed(0);
    if (hrs >= 1) return hrs.toFixed(1);
    const mins = Math.round((Number(seconds) || 0) / 60);
    return mins ? `${mins}m` : '0';
};

const formatMonthLabel = (month: string) => {
    const [year, mm] = String(month || '').split('-');
    if (!year || !mm) return month;
    const date = new Date(Number(year), Number(mm) - 1, 1);
    return date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
};

const userThumbSrc = (thumb?: string | null) => {
    if (!thumb) return '';
    if (thumb.startsWith('http') || thumb.startsWith('/api/')) return thumb;
    return portalUrl(`/api/plex/image?path=${encodeURIComponent(thumb)}&width=64&height=64`);
};

export const TitleAnalyticsPage: React.FC<{
    ratingKey: string;
    onBack: () => void;
    onViewUser?: (username: string) => void;
}> = ({ ratingKey, onBack, onViewUser }) => {
    const [data, setData] = useState<TitleAnalyticsPayload | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [historyPage, setHistoryPage] = useState(1);
    const pageSize = 25;

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);
        setHistoryPage(1);
        apiFetch(`/api/plex/analytics/title/${encodeURIComponent(ratingKey)}`)
            .then((res) => {
                if (cancelled) return;
                if (res?.error) {
                    setError(String(res.error));
                    setData(null);
                    return;
                }
                setData(res);
            })
            .catch((err: any) => {
                if (!cancelled) setError(err?.message || 'Failed to load title analytics');
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => { cancelled = true; };
    }, [ratingKey]);

    const history = data?.history || [];
    const users = data?.users || [];
    const stats = data?.stats || {};
    const item = data?.item || {};
    const pageCount = Math.max(1, Math.ceil(history.length / pageSize));
    const pageRows = useMemo(() => {
        const start = (historyPage - 1) * pageSize;
        return history.slice(start, start + pageSize);
    }, [history, historyPage]);

    const chartData = (data?.byMonth || []).map((row) => ({
        ...row,
        label: formatMonthLabel(row.month),
    }));
    const platformChartData = data?.byPlatform || [];

    const posterSrc = item.thumb
        ? portalUrl(`/api/plex/image?path=${encodeURIComponent(item.thumb)}&width=300&height=450`)
        : '';

    return (
        <DashboardPageShell>
            <DashboardHero
                accent="plex"
                eyebrow="Library title"
                title={item.title || (loading ? 'Loading…' : 'Title')}
                description={
                    [item.type ? String(item.type).toUpperCase() : null, item.year, data?.source === 'tautulli' ? 'Tautulli history' : data?.source === 'plex' ? 'Plex history' : null]
                        .filter(Boolean)
                        .join(' · ')
                    || 'Everyone who watched this title on the server.'
                }
                icon={<BarChart3 className="h-3.5 w-3.5" />}
                actions={(
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={onBack}
                            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm font-bold text-text transition-colors hover:bg-white/5"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to search
                        </button>
                        {item.plexUrl ? (
                            <a
                                href={item.plexUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 rounded-xl bg-plex px-4 py-2.5 text-sm font-bold text-background transition-colors hover:bg-plex-hover"
                            >
                                <Play className="h-4 w-4" />
                                View in Plex
                            </a>
                        ) : null}
                    </div>
                )}
            />

            {error ? (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div>
            ) : null}

            <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                <div className="w-36 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-black/30 shadow-xl sm:w-44">
                    {posterSrc ? (
                        <img src={posterSrc} alt={item.title || 'Poster'} className="aspect-[2/3] w-full object-cover" />
                    ) : (
                        <div className="flex aspect-[2/3] items-center justify-center text-xs font-bold uppercase tracking-widest text-muted">No art</div>
                    )}
                </div>
                {item.summary ? (
                    <p className="min-w-0 flex-1 text-sm leading-relaxed text-muted">{item.summary}</p>
                ) : (
                    <p className="min-w-0 flex-1 text-sm text-muted">
                        {loading ? 'Loading watch history…' : 'Server-wide plays, who watched it, and the full history for this title.'}
                    </p>
                )}
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <DashboardStatCard
                    label="Plays"
                    value={loading ? '…' : Number(stats.plays || 0).toLocaleString()}
                    icon={<Play className="h-4 w-4 text-plex" />}
                    glow={dashboardGlowClass('plex')}
                />
                <DashboardStatCard
                    label="Watchers"
                    value={loading ? '…' : Number(stats.uniqueUsers || 0).toLocaleString()}
                    icon={<Users className="h-4 w-4 text-emerald-300" />}
                    glow={dashboardGlowClass('emerald')}
                />
                <DashboardStatCard
                    label="Watch time"
                    value={loading ? '…' : formatHours(stats.totalSeconds)}
                    hint={Number(stats.totalSeconds || 0) >= 3600 ? 'hours' : 'minutes'}
                    icon={<Clock className="h-4 w-4 text-amber-300" />}
                    glow={dashboardGlowClass('amber')}
                />
                <DashboardStatCard
                    label="Last watched"
                    value={loading ? '…' : (stats.lastWatchedAt ? formatPortalDateTimeCompact(stats.lastWatchedAt) : '—')}
                    icon={<Calendar className="h-4 w-4 text-sky-300" />}
                    glow={dashboardGlowClass('sky')}
                />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <DashboardPanel title="Who watched" subtitle={`${users.length} ${users.length === 1 ? 'person' : 'people'} on this server`}>
                    {loading ? (
                        <p className="py-6 text-center text-sm text-muted">Loading watchers…</p>
                    ) : users.length === 0 ? (
                        <p className="py-6 text-center text-sm text-muted">No watch history for this title yet.</p>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {users.map((row) => (
                                <button
                                    key={row.user}
                                    type="button"
                                    onClick={() => onViewUser?.(row.user)}
                                    className="flex w-full min-w-0 items-center gap-3 px-1 py-2.5 text-left transition-colors hover:bg-white/5"
                                >
                                    {row.userThumb ? (
                                        <img src={userThumbSrc(row.userThumb)} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
                                    ) : (
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-plex/20 text-[10px] font-bold uppercase text-plex">
                                            {row.user.slice(0, 2)}
                                        </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-sm font-bold text-text">{row.user}</div>
                                        <div className="text-[11px] text-muted">
                                            {row.lastWatchedAt ? formatPortalDateTimeCompact(row.lastWatchedAt) : '—'}
                                        </div>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <div className="text-sm font-black tabular-nums text-text">{row.plays}</div>
                                        <div className="text-[10px] uppercase tracking-wider text-muted">plays</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </DashboardPanel>

                <DashboardPanel title="Plays over time" subtitle="Monthly plays and platform views from server history">
                    {loading ? (
                        <p className="py-6 text-center text-sm text-muted">Loading chart…</p>
                    ) : chartData.length === 0 && platformChartData.length === 0 ? (
                        <p className="py-6 text-center text-sm text-muted">Not enough history to chart yet.</p>
                    ) : (
                        <div className="space-y-6">
                            {chartData.length ? (
                                <div>
                                    <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Monthly plays</p>
                                    <div className="h-56 pt-1">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                                <XAxis dataKey="label" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                                                <YAxis allowDecimals={false} tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                                                <RechartsTooltip
                                                    contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}
                                                    labelStyle={{ color: '#fff' }}
                                                />
                                                <Bar dataKey="plays" fill="rgb(var(--color-plex))" radius={[6, 6, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            ) : null}
                            {platformChartData.length ? (
                                <div>
                                    <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Platform views</p>
                                    <div className="h-56 pt-1">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={platformChartData} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                                <XAxis
                                                    dataKey="platform"
                                                    interval={0}
                                                    tick={{ fill: '#9ca3af', fontSize: 10 }}
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tickFormatter={(value: string) => (String(value).length > 10 ? `${String(value).slice(0, 9)}…` : String(value))}
                                                />
                                                <YAxis allowDecimals={false} tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                                                <RechartsTooltip
                                                    contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}
                                                    labelStyle={{ color: '#fff' }}
                                                />
                                                <Bar dataKey="plays" fill="rgb(56 189 248)" radius={[6, 6, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    )}
                </DashboardPanel>
            </div>

            <DashboardPanel
                title="Watch history"
                subtitle={`${history.length} ${history.length === 1 ? 'play' : 'plays'} across the server`}
                badge={(
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-200">
                        <History className="h-3 w-3" />
                        {history.length}
                    </span>
                )}
            >
                {loading ? (
                    <p className="py-6 text-center text-sm text-muted">Loading history…</p>
                ) : history.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted">Nobody has watched this title on the server yet.</p>
                ) : (
                    <div className="space-y-3">
                        <div className="divide-y divide-white/5 overflow-hidden rounded-xl border border-white/10">
                            {pageRows.map((row, index) => (
                                <div key={`${row.user}-${row.date}-${index}`} className="flex min-w-0 flex-col gap-2 p-3 sm:flex-row sm:items-center sm:gap-4">
                                    <button
                                        type="button"
                                        onClick={() => row.user && onViewUser?.(row.user)}
                                        className="flex min-w-0 items-center gap-3 text-left sm:w-1/3"
                                    >
                                        {row.userThumb ? (
                                            <img src={userThumbSrc(row.userThumb)} alt="" className="h-7 w-7 shrink-0 rounded-full object-cover" />
                                        ) : (
                                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold uppercase text-muted">
                                                {(row.user || '?').slice(0, 2)}
                                            </div>
                                        )}
                                        <span className="truncate text-sm font-bold text-text hover:text-plex">{row.user || 'Unknown'}</span>
                                    </button>
                                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted sm:justify-end sm:text-xs">
                                        {row.title ? <span className="min-w-0 truncate font-medium text-text/80">{row.title}</span> : null}
                                        <span className="inline-flex items-center gap-1.5">
                                            <Calendar size={12} className="shrink-0 opacity-50" />
                                            {row.date ? formatPortalDateTimeCompact(row.date) : '—'}
                                        </span>
                                        <span className="inline-flex items-center gap-1.5">
                                            <Clock size={12} className="shrink-0 opacity-50" />
                                            {Math.round((Number(row.duration) || 0) / 60)}m
                                        </span>
                                        {row.player ? (
                                            <span className="inline-flex min-w-0 items-center gap-1.5">
                                                <Monitor size={12} className="shrink-0 opacity-50" />
                                                <span className="truncate">{row.player}</span>
                                            </span>
                                        ) : null}
                                    </div>
                                </div>
                            ))}
                        </div>
                        {pageCount > 1 ? (
                            <div className="flex items-center justify-between text-xs text-muted">
                                <button
                                    type="button"
                                    disabled={historyPage <= 1}
                                    onClick={() => setHistoryPage((page) => Math.max(1, page - 1))}
                                    className="rounded-lg border border-white/10 px-3 py-1.5 font-bold disabled:opacity-40"
                                >
                                    Previous
                                </button>
                                <span>Page {historyPage} of {pageCount}</span>
                                <button
                                    type="button"
                                    disabled={historyPage >= pageCount}
                                    onClick={() => setHistoryPage((page) => Math.min(pageCount, page + 1))}
                                    className="rounded-lg border border-white/10 px-3 py-1.5 font-bold disabled:opacity-40"
                                >
                                    Next
                                </button>
                            </div>
                        ) : null}
                    </div>
                )}
            </DashboardPanel>
        </DashboardPageShell>
    );
};
