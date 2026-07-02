import React, { useCallback, useRef, useState } from 'react';
import { X, Copy, Download, Share2 } from 'lucide-react';

const periodLabel = (days: number | string) => {
    if (days === 'all') return 'All Time';
    if (days === 7) return 'Last 7 Days';
    if (days === 30) return 'Last 30 Days';
    if (days === 60) return 'Last 60 Days';
    if (days === 90) return 'Last 90 Days';
    if (days === 180) return 'Last 180 Days';
    return `Last ${days} Days`;
};

export const buildWrapUpShareText = (analytics: any, days: number | string, serverName: string, username?: string) => {
    const period = periodLabel(days);
    const rank = analytics.leaderboardRank ? `#${analytics.leaderboardRank} of ${analytics.totalActiveUsers || '?'}` : 'Unranked';
    const lines = [
        `📊 ${serverName} — Personal Wrap-Up (${period})`,
        username ? `👤 ${username}` : '',
        '',
        `🏆 Server Rank: ${rank}`,
        `▶️ Total Streams: ${analytics.totalPlays || 0} (🎬 ${analytics.moviesCount || 0} · 📺 ${analytics.showsCount || 0})`,
        `📺 Top Binge: ${analytics.topBinge?.title || '—'} (${analytics.topBinge?.plays || 0} eps)`,
        `🎬 Top Movie: ${analytics.topMovie?.title || '—'} (${analytics.topMovie?.plays || 0} plays)`,
        `🕐 Time of Day: ${analytics.timeOfDay || '—'}`,
        `📅 Top Day: ${analytics.popularDay || '—'}`,
        `📚 Top Library: ${analytics.favoriteLibrary || '—'}`,
        '',
        `Shared from ${window.location.origin}`,
    ].filter(Boolean);
    return lines.join('\n');
};

const drawWrapUpCard = (
    canvas: HTMLCanvasElement,
    analytics: any,
    days: number | string,
    serverName: string,
    username?: string,
) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = 1080;
    const h = 1080;
    canvas.width = w;
    canvas.height = h;

    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, '#1a1c1e');
    bg.addColorStop(1, '#0d0e10');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#e5a00d';
    ctx.fillRect(0, 0, w, 8);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px system-ui, sans-serif';
    ctx.fillText('Personal Wrap-Up', 64, 100);

    ctx.fillStyle = '#e5a00d';
    ctx.font = '600 28px system-ui, sans-serif';
    ctx.fillText(serverName, 64, 148);

    ctx.fillStyle = '#9ca3af';
    ctx.font = '24px system-ui, sans-serif';
    ctx.fillText(`${periodLabel(days)}${username ? ` · ${username}` : ''}`, 64, 188);

    const stats: [string, string][] = [
        ['Server Rank', analytics.leaderboardRank ? `#${analytics.leaderboardRank}` : 'Unranked'],
        ['Total Streams', String(analytics.totalPlays || 0)],
        ['Top Binge', analytics.topBinge?.title || '—'],
        ['Top Movie', analytics.topMovie?.title || '—'],
        ['Time of Day', analytics.timeOfDay || '—'],
        ['Top Day', analytics.popularDay || '—'],
        ['Top Library', analytics.favoriteLibrary || '—'],
        ['Watch Style', analytics.watchStyle || '—'],
    ];

    stats.forEach(([label, value], i) => {
        const row = Math.floor(i / 2);
        const col = i % 2;
        const x = 64 + col * 480;
        const rowY = 260 + row * 180;

        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.fillRect(x, rowY, 440, 140);

        ctx.strokeStyle = 'rgba(229,160,13,0.25)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, rowY, 440, 140);

        ctx.fillStyle = '#9ca3af';
        ctx.font = '600 18px system-ui, sans-serif';
        ctx.fillText(label.toUpperCase(), x + 24, rowY + 40);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 32px system-ui, sans-serif';
        const display = value.length > 28 ? value.slice(0, 26) + '…' : value;
        ctx.fillText(display, x + 24, rowY + 90);
    });

    ctx.fillStyle = '#6b7280';
    ctx.font = '20px system-ui, sans-serif';
    ctx.fillText(window.location.origin, 64, h - 48);
};

type ShareWrapUpModalProps = {
    analytics: any;
    days: number | string;
    serverName: string;
    username?: string;
    onClose: () => void;
    onToast?: (message: string, type: 'success' | 'error') => void;
};

export const ShareWrapUpModal: React.FC<ShareWrapUpModalProps> = ({
    analytics,
    days,
    serverName,
    username,
    onClose,
    onToast,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [busy, setBusy] = useState<'copy' | 'download' | 'share' | null>(null);

    const getCanvas = useCallback(() => {
        const canvas = canvasRef.current || document.createElement('canvas');
        drawWrapUpCard(canvas, analytics, days, serverName, username);
        return canvas;
    }, [analytics, days, serverName, username]);

    const handleCopyText = async () => {
        setBusy('copy');
        try {
            await navigator.clipboard.writeText(buildWrapUpShareText(analytics, days, serverName, username));
            onToast?.('Wrap-Up stats copied to clipboard!', 'success');
        } catch {
            onToast?.('Could not copy to clipboard.', 'error');
        } finally {
            setBusy(null);
        }
    };

    const handleDownload = () => {
        setBusy('download');
        try {
            const canvas = getCanvas();
            canvas.toBlob((blob) => {
                if (!blob) {
                    onToast?.('Could not generate image.', 'error');
                    setBusy(null);
                    return;
                }
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `wrap-up-${serverName.replace(/\s+/g, '-').toLowerCase()}.png`;
                a.click();
                URL.revokeObjectURL(url);
                onToast?.('Wrap-Up image downloaded!', 'success');
                setBusy(null);
            }, 'image/png');
        } catch {
            onToast?.('Could not generate image.', 'error');
            setBusy(null);
        }
    };

    const handleShare = async () => {
        setBusy('share');
        try {
            const text = buildWrapUpShareText(analytics, days, serverName, username);
            const canvas = getCanvas();
            const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
            if (navigator.share) {
                const files = blob ? [new File([blob], 'wrap-up.png', { type: 'image/png' })] : [];
                await navigator.share({
                    title: `${serverName} Wrap-Up`,
                    text,
                    ...(files.length && navigator.canShare?.({ files }) ? { files } : {}),
                });
            } else {
                await navigator.clipboard.writeText(text);
                onToast?.('Share not supported — stats copied instead!', 'success');
            }
        } catch (e) {
            if ((e as Error)?.name !== 'AbortError') {
                onToast?.('Share cancelled or failed.', 'error');
            }
        } finally {
            setBusy(null);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
            <div className="glass-card shadow-2xl max-w-lg w-full p-6 relative" onClick={(e) => e.stopPropagation()}>
                <button type="button" onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-muted hover:text-text transition-colors">
                    <X className="w-5 h-5" />
                </button>
                <h3 className="text-xl font-bold text-text mb-1">Share Your Wrap-Up</h3>
                <p className="text-muted text-sm mb-6">Show off your streaming stats with friends.</p>

                <div className="rounded-xl border border-plex/30 bg-gradient-to-br from-plex/10 to-transparent p-5 mb-6 text-sm space-y-2">
                    <p className="font-bold text-plex">{serverName} · {periodLabel(days)}</p>
                    <p className="text-text">Rank #{analytics.leaderboardRank || '—'} · {analytics.totalPlays || 0} streams</p>
                    <p className="text-muted line-clamp-1">Binge: {analytics.topBinge?.title || '—'} · Movie: {analytics.topMovie?.title || '—'}</p>
                </div>

                <canvas ref={canvasRef} className="hidden" aria-hidden />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button type="button" onClick={handleCopyText} disabled={!!busy}
                        className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/5 border border-border hover:border-plex/50 font-bold text-sm transition-colors disabled:opacity-50">
                        <Copy className="w-4 h-4" /> {busy === 'copy' ? 'Copying…' : 'Copy Text'}
                    </button>
                    <button type="button" onClick={handleDownload} disabled={!!busy}
                        className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/5 border border-border hover:border-plex/50 font-bold text-sm transition-colors disabled:opacity-50">
                        <Download className="w-4 h-4" /> {busy === 'download' ? 'Saving…' : 'Save Image'}
                    </button>
                    <button type="button" onClick={handleShare} disabled={!!busy}
                        className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-plex text-background font-bold text-sm hover:bg-plex-hover transition-colors disabled:opacity-50">
                        <Share2 className="w-4 h-4" /> {busy === 'share' ? 'Sharing…' : 'Share'}
                    </button>
                </div>
            </div>
        </div>
    );
};
