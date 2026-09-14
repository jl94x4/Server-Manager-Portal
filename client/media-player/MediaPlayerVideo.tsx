import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, Pause, Play, X } from 'lucide-react';
import Hls from 'hls.js';
import { portalUrl } from '../shared/basePath';
import { lockBackgroundScroll } from '../shared/lockBackgroundScroll';
import { PORTAL_CSRF_HEADER, PORTAL_CSRF_VALUE } from '../shared/api';
import { useDiscoverI18n } from '../discovery/i18n';
import { formatClock } from './playerUtils';
import type { PlayerPlaySession } from './types';

type Props = {
    session: PlayerPlaySession;
    onClose: () => void;
};

export const MediaPlayerVideo: React.FC<Props> = ({ session, onClose }) => {
    const { t } = useDiscoverI18n();
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [paused, setPaused] = useState(true);
    const [ready, setReady] = useState(false);
    const [currentMs, setCurrentMs] = useState(0);
    const [durationMs, setDurationMs] = useState(session.item.durationMs || 0);

    useEffect(() => lockBackgroundScroll(), []);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return undefined;
        const src = portalUrl(session.src);
        let cancelled = false;
        setError(null);
        setReady(false);
        setPaused(true);

        const onReady = () => {
            if (cancelled) return;
            setReady(true);
            void video.play().then(() => {
                if (!cancelled) setPaused(false);
            }).catch(() => {
                if (!cancelled) setPaused(true);
            });
        };

        const fail = (message?: string) => {
            if (cancelled) return;
            setError(message || t('mediaPlayerPage.playError'));
        };

        if (Hls.isSupported()) {
            const hls = new Hls({
                enableWorker: true,
                lowLatencyMode: false,
                xhrSetup: (xhr) => {
                    xhr.withCredentials = true;
                    try {
                        xhr.setRequestHeader(PORTAL_CSRF_HEADER, PORTAL_CSRF_VALUE);
                    } catch {
                        /* ignore forbidden header environments */
                    }
                },
            });
            hlsRef.current = hls;
            hls.loadSource(src);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, onReady);
            hls.on(Hls.Events.ERROR, (_event, data) => {
                if (!data?.fatal) return;
                try { hls.destroy(); } catch { /* ignore */ }
                fail();
            });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = src;
            video.addEventListener('loadedmetadata', onReady, { once: true });
            video.addEventListener('error', () => fail(), { once: true });
        } else {
            fail();
        }

        return () => {
            cancelled = true;
            video.removeEventListener('loadedmetadata', onReady);
            hlsRef.current?.destroy();
            hlsRef.current = null;
            video.removeAttribute('src');
            video.load();
        };
    }, [session.src, t]);

    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
            if (event.key === ' ') {
                event.preventDefault();
                const video = videoRef.current;
                if (!video) return;
                if (video.paused) void video.play();
                else video.pause();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const togglePlayback = () => {
        const video = videoRef.current;
        if (!video) return;
        if (video.paused) {
            void video.play();
            setPaused(false);
        } else {
            video.pause();
            setPaused(true);
        }
    };

    const duration = durationMs || 1;
    const progress = Math.min(100, (currentMs / duration) * 100);
    const overlay = (
        <div className="fixed inset-0 z-[4000] bg-black flex flex-col" role="dialog" aria-modal="true" aria-label={session.item.title}>
            <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-3 p-4 bg-gradient-to-b from-black/80 to-transparent">
                <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-white">{session.item.title}</p>
                    {session.item.showTitle ? (
                        <p className="truncate text-xs text-white/70">{session.item.showTitle}</p>
                    ) : null}
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-sm font-bold text-white hover:bg-white/20"
                    aria-label={t('mediaPlayerPage.closePlayer')}
                >
                    <X className="h-4 w-4" />
                    {t('common.close')}
                </button>
            </div>

            <video
                ref={videoRef}
                className="h-full w-full bg-black object-contain"
                controls={false}
                playsInline
                autoPlay
                onClick={togglePlayback}
                onPlay={() => setPaused(false)}
                onPause={() => setPaused(true)}
                onTimeUpdate={(event) => setCurrentMs(event.currentTarget.currentTime * 1000)}
                onDurationChange={(event) => {
                    const next = event.currentTarget.duration;
                    if (Number.isFinite(next) && next > 0) setDurationMs(next * 1000);
                }}
            />

            {error ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-6 text-center">
                    <div>
                        <p className="font-bold text-white">{error}</p>
                        <button type="button" onClick={onClose} className="mt-4 rounded-lg bg-plex px-4 py-2 text-sm font-black text-black">
                            {t('common.close')}
                        </button>
                    </div>
                </div>
            ) : null}

            {!error && (!ready || paused) && currentMs < 800 ? (
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="h-10 w-10 animate-spin text-white/80" />
                    <p className="text-xs font-bold uppercase tracking-widest text-white/70">{t('mediaPlayerPage.buffering')}</p>
                </div>
            ) : null}

            <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/85 to-transparent px-4 pb-5 pt-10">
                <input
                    type="range"
                    min={0}
                    max={100}
                    value={progress}
                    onChange={(event) => {
                        const video = videoRef.current;
                        if (!video || !durationMs) return;
                        const next = (Number(event.target.value) / 100) * durationMs;
                        video.currentTime = next / 1000;
                        setCurrentMs(next);
                    }}
                    className="w-full accent-plex"
                    aria-label={session.item.title}
                />
                <div className="mt-2 flex items-center justify-between text-xs font-bold text-white/80">
                    <button
                        type="button"
                        onClick={togglePlayback}
                        className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-white hover:bg-white/20"
                    >
                        {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                        {paused ? t('mediaPlayerPage.play') : t('mediaPlayerPage.pause')}
                    </button>
                    <span>{formatClock(currentMs)} / {formatClock(durationMs)}</span>
                </div>
            </div>
        </div>
    );

    if (typeof document === 'undefined') return null;
    return createPortal(overlay, document.body);
};
