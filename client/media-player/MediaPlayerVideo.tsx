import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, Maximize, Minimize, Pause, Play, X } from 'lucide-react';
import Hls from 'hls.js';
import { portalUrl } from '../shared/basePath';
import { lockBackgroundScroll } from '../shared/lockBackgroundScroll';
import { PORTAL_CSRF_HEADER, PORTAL_CSRF_VALUE } from '../shared/api';
import { useDiscoverI18n } from '../discovery/i18n';
import { formatClock, newPlaySessionId, playSessionIdFromSrc, buildPlaybackSrc, isHlsPlaybackSrc, offsetMsFromSrc } from './playerUtils';
import { reportMediaPlayerTimeline, stopMediaPlayerTranscode } from './api';
import type { PlayerPlaySession } from './types';

type Props = {
    session: PlayerPlaySession;
    onClose: () => void;
    autoplayNext?: boolean;
    onPlayNext?: (item: PlayerPlaySession['item']) => void;
};

type PickerOption = { id: string; label: string };

type FullscreenDocument = Document & {
    webkitFullscreenElement?: Element | null;
    webkitExitFullscreen?: () => Promise<void> | void;
};

type FullscreenElement = HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void> | void;
};

type IosVideo = HTMLVideoElement & {
    webkitEnterFullscreen?: () => void;
    webkitDisplayingFullscreen?: boolean;
};

const fullscreenElement = () => {
    const doc = document as FullscreenDocument;
    return doc.fullscreenElement || doc.webkitFullscreenElement || null;
};

const requestPlayerFullscreen = async (shell: HTMLElement | null, video: HTMLVideoElement | null) => {
    if (shell) {
        const el = shell as FullscreenElement;
        const request = el.requestFullscreen || el.webkitRequestFullscreen;
        if (request) {
            await request.call(el);
            return;
        }
    }
    const ios = video as IosVideo | null;
    if (ios?.webkitEnterFullscreen) ios.webkitEnterFullscreen();
};

const exitPlayerFullscreen = async () => {
    if (!fullscreenElement()) return;
    const doc = document as FullscreenDocument;
    const exit = doc.exitFullscreen || doc.webkitExitFullscreen;
    if (exit) await exit.call(doc);
};

const hlsErrorMessage = (data: { response?: { code?: number; text?: string; data?: unknown } }, fallback: string) => {
    const raw = String(data?.response?.text || (typeof data?.response?.data === 'string' ? data.response.data : '') || '').trim();
    if (raw) {
        try {
            const parsed = JSON.parse(raw);
            if (parsed?.error) {
                return parsed.detail ? `${parsed.error} ${String(parsed.detail).slice(0, 160)}` : String(parsed.error);
            }
        } catch {
            if (!raw.includes('#EXTM3U') && raw.length < 180) return raw;
        }
    }
    const code = Number(data?.response?.code);
    if (Number.isFinite(code) && code > 0) return `${fallback} (${code})`;
    return fallback;
};

const TrackPicker: React.FC<{
    label: string;
    value: string;
    options: PickerOption[];
    open: boolean;
    onToggle: () => void;
    onChange: (id: string) => void;
}> = ({ label, value, options, open, onToggle, onChange }) => {
    if (!options.length) return null;
    const selected = options.find((row) => row.id === value)?.label || label;
    return (
        <div className="relative" onClick={(event) => event.stopPropagation()}>
            <button
                type="button"
                onClick={(event) => {
                    event.stopPropagation();
                    onToggle();
                }}
                className="inline-flex max-w-[9.5rem] items-center truncate rounded-full bg-white/10 px-3 py-1.5 text-white hover:bg-white/20"
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-label={label}
            >
                <span className="truncate">{selected}</span>
            </button>
            {open ? (
                <div
                    className="absolute bottom-full left-0 z-20 mb-2 max-h-56 min-w-[13rem] overflow-y-auto rounded-xl border border-white/15 bg-black/95 py-1 shadow-2xl"
                    role="listbox"
                    aria-label={label}
                >
                    <p className="px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white/45">{label}</p>
                    {options.map((row) => (
                        <button
                            key={row.id || 'off'}
                            type="button"
                            role="option"
                            aria-selected={row.id === value}
                            onClick={() => onChange(row.id)}
                            className={`block w-full px-3 py-2 text-left text-xs font-bold hover:bg-white/10 ${row.id === value ? 'text-plex' : 'text-white'}`}
                        >
                            {row.label}
                        </button>
                    ))}
                </div>
            ) : null}
        </div>
    );
};

export const MediaPlayerVideo: React.FC<Props> = ({ session, onClose, autoplayNext = false, onPlayNext }) => {
    const { t } = useDiscoverI18n();
    const videoRef = useRef<HTMLVideoElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const hlsRef = useRef<Hls | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [paused, setPaused] = useState(true);
    const [ready, setReady] = useState(false);
    const [fullscreen, setFullscreen] = useState(false);
    const [currentMs, setCurrentMs] = useState(0);
    const [durationMs, setDurationMs] = useState(session.item.durationMs || 0);
    const [playbackSrc, setPlaybackSrc] = useState(session.src);
    const [qualityId, setQualityId] = useState(session.qualityId || '');
    const [audioStreamId, setAudioStreamId] = useState(session.audioStreamId || '');
    const [subtitleStreamId, setSubtitleStreamId] = useState(session.subtitleStreamId || '');
    const [openMenu, setOpenMenu] = useState<'quality' | 'audio' | 'subtitles' | null>(null);
    const currentMsRef = useRef(0);
    const durationMsRef = useRef(session.item.durationMs || 0);
    const sendTimelineRef = useRef<(state: 'playing' | 'paused' | 'buffering' | 'stopped') => void>(() => {});

    const qualities = session.qualities || [];
    const audioTracks = session.audioTracks || [];
    const subtitles = session.subtitles || [];

    useEffect(() => {
        currentMsRef.current = currentMs;
    }, [currentMs]);
    useEffect(() => {
        durationMsRef.current = durationMs;
    }, [durationMs]);

    useEffect(() => {
        setPlaybackSrc(session.src);
        setQualityId(session.qualityId || '');
        setAudioStreamId(session.audioStreamId || '');
        setSubtitleStreamId(session.subtitleStreamId || '');
        setOpenMenu(null);
        setCurrentMs(session.offsetMs || 0);
        setDurationMs(session.item.durationMs || 0);
    }, [session.sessionId]);

    useEffect(() => lockBackgroundScroll(), []);

    useEffect(() => {
        const sync = () => {
            const ios = videoRef.current as IosVideo | null;
            setFullscreen(!!fullscreenElement() || !!ios?.webkitDisplayingFullscreen);
        };
        document.addEventListener('fullscreenchange', sync);
        document.addEventListener('webkitfullscreenchange', sync);
        videoRef.current?.addEventListener('webkitbeginfullscreen', sync);
        videoRef.current?.addEventListener('webkitendfullscreen', sync);
        sync();
        return () => {
            document.removeEventListener('fullscreenchange', sync);
            document.removeEventListener('webkitfullscreenchange', sync);
            videoRef.current?.removeEventListener('webkitbeginfullscreen', sync);
            videoRef.current?.removeEventListener('webkitendfullscreen', sync);
            void exitPlayerFullscreen();
        };
    }, []);

    useEffect(() => {
        if (!openMenu) return undefined;
        const close = () => setOpenMenu(null);
        const timer = window.setTimeout(() => window.addEventListener('click', close), 0);
        return () => {
            window.clearTimeout(timer);
            window.removeEventListener('click', close);
        };
    }, [openMenu]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return undefined;
        const src = portalUrl(playbackSrc);
        let cancelled = false;
        setError(null);
        setReady(false);
        setPaused(true);

        const startAt = isHlsPlaybackSrc(playbackSrc) ? 0 : offsetMsFromSrc(playbackSrc) / 1000;
        const onReady = () => {
            if (cancelled) return;
            if (startAt > 1 && Math.abs(video.currentTime - startAt) > 1) {
                video.currentTime = startAt;
            }
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

        const nativeHls = !!video.canPlayType('application/vnd.apple.mpegurl');
        if (isHlsPlaybackSrc(playbackSrc) && nativeHls) {
            video.src = src;
            video.addEventListener('loadedmetadata', onReady, { once: true });
            video.addEventListener('error', () => fail(), { once: true });
        } else if (Hls.isSupported() && isHlsPlaybackSrc(playbackSrc)) {
            const hls = new Hls({
                enableWorker: false,
                lowLatencyMode: false,
                manifestLoadingTimeOut: 60_000,
                levelLoadingTimeOut: 60_000,
                fragLoadingTimeOut: 60_000,
                manifestLoadingMaxRetry: 2,
                levelLoadingMaxRetry: 2,
                fragLoadingMaxRetry: 3,
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
                fail(hlsErrorMessage(data, t('mediaPlayerPage.playError')));
            });
        } else {
            video.src = src;
            video.addEventListener('loadedmetadata', onReady, { once: true });
            video.addEventListener('error', () => fail(), { once: true });
        }

        return () => {
            cancelled = true;
            video.removeEventListener('loadedmetadata', onReady);
            hlsRef.current?.destroy();
            hlsRef.current = null;
            video.removeAttribute('src');
            video.load();
            void stopMediaPlayerTranscode(playSessionIdFromSrc(playbackSrc));
        };
    }, [playbackSrc, t]);

    useEffect(() => {
        const ratingKey = session.item.ratingKey;
        const sessionId = session.sessionId;
        if (!ratingKey || !sessionId) return undefined;
        const send = (state: 'playing' | 'paused' | 'buffering' | 'stopped') => {
            const video = videoRef.current;
            const timeMs = Math.max(0, Math.floor((video ? video.currentTime * 1000 : currentMsRef.current) || 0));
            const nextDuration = Math.max(
                0,
                Math.floor((video && Number.isFinite(video.duration) && video.duration > 0
                    ? video.duration * 1000
                    : durationMsRef.current) || 0),
            );
            void reportMediaPlayerTimeline({
                ratingKey,
                sessionId,
                state,
                timeMs,
                durationMs: nextDuration,
            });
        };
        sendTimelineRef.current = send;
        send('playing');
        const timer = window.setInterval(() => {
            const video = videoRef.current;
            send(video && !video.paused ? 'playing' : 'paused');
        }, 5000);
        return () => {
            window.clearInterval(timer);
            sendTimelineRef.current = () => {};
            send('stopped');
        };
    }, [session.item.ratingKey, session.sessionId]);

    const toggleFullscreen = () => {
        if (fullscreenElement()) return exitPlayerFullscreen();
        return requestPlayerFullscreen(overlayRef.current, videoRef.current);
    };

    const closePlayer = () => {
        void exitPlayerFullscreen();
        onClose();
    };

    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                if (openMenu) {
                    setOpenMenu(null);
                    return;
                }
                if (fullscreenElement()) return;
                closePlayer();
            }
            if (event.key === ' ') {
                event.preventDefault();
                const video = videoRef.current;
                if (!video) return;
                if (video.paused) void video.play();
                else video.pause();
            }
            if ((event.key === 'f' || event.key === 'F') && !event.metaKey && !event.ctrlKey && !event.altKey) {
                event.preventDefault();
                void toggleFullscreen();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose, openMenu]);

    const applyStreamChange = (patch: {
        qualityId?: string;
        audioStreamId?: string;
        subtitleStreamId?: string | null;
    }) => {
        const nextQuality = patch.qualityId ?? qualityId;
        const nextAudio = patch.audioStreamId ?? audioStreamId;
        const nextSub = patch.subtitleStreamId !== undefined ? (patch.subtitleStreamId || '') : subtitleStreamId;
        if (nextQuality === qualityId && nextAudio === audioStreamId && nextSub === subtitleStreamId) {
            setOpenMenu(null);
            return;
        }
        if (patch.qualityId != null) setQualityId(patch.qualityId);
        if (patch.audioStreamId != null) setAudioStreamId(patch.audioStreamId);
        if (patch.subtitleStreamId !== undefined) setSubtitleStreamId(nextSub);
        setOpenMenu(null);
        const offset = Math.max(
            0,
            Math.floor(((videoRef.current?.currentTime || 0) * 1000) || currentMsRef.current || 0),
        );
        setPlaybackSrc(buildPlaybackSrc(session.item.ratingKey, {
            sessionId: newPlaySessionId(),
            offsetMs: offset,
            qualityId: nextQuality,
            audioStreamId: nextAudio,
            subtitleStreamId: nextSub,
            directFile: !!session.canDirectPlay,
            copy: nextQuality !== 'original' || session.canCopyOriginal !== false,
        }));
    };

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
        <div ref={overlayRef} className="fixed inset-0 z-[4000] flex h-full w-full flex-col bg-black" role="dialog" aria-modal="true" aria-label={session.item.title}>
            <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-3 p-4 bg-gradient-to-b from-black/80 to-transparent">
                <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-white">{session.item.title}</p>
                    {session.item.showTitle ? (
                        <p className="truncate text-xs text-white/70">{session.item.showTitle}</p>
                    ) : null}
                </div>
                <button
                    type="button"
                    onClick={closePlayer}
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
                onPlay={() => {
                    setPaused(false);
                    sendTimelineRef.current('playing');
                }}
                onPause={() => {
                    setPaused(true);
                    sendTimelineRef.current('paused');
                }}
                onTimeUpdate={(event) => setCurrentMs(event.currentTarget.currentTime * 1000)}
                onDurationChange={(event) => {
                    const next = event.currentTarget.duration;
                    if (Number.isFinite(next) && next > 0) setDurationMs(next * 1000);
                }}
                onEnded={() => {
                    sendTimelineRef.current('stopped');
                    if (autoplayNext) void onPlayNext?.(session.item);
                }}
            />

            {error ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-6 text-center">
                    <div>
                        <p className="font-bold text-white">{error}</p>
                        <button type="button" onClick={closePlayer} className="mt-4 rounded-lg bg-plex px-4 py-2 text-sm font-black text-black">
                            {t('common.close')}
                        </button>
                    </div>
                </div>
            ) : null}

            {!error && !ready ? (
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
                        sendTimelineRef.current('playing');
                    }}
                    className="w-full accent-plex"
                    aria-label={session.item.title}
                />
                <div className="mt-2 flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-white/80">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={togglePlayback}
                            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-white hover:bg-white/20"
                        >
                            {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                            {paused ? t('mediaPlayerPage.play') : t('mediaPlayerPage.pause')}
                        </button>
                        <TrackPicker
                            label={t('mediaPlayerPage.quality')}
                            value={qualityId}
                            options={qualities}
                            open={openMenu === 'quality'}
                            onToggle={() => setOpenMenu((current) => current === 'quality' ? null : 'quality')}
                            onChange={(id) => applyStreamChange({ qualityId: id })}
                        />
                        <TrackPicker
                            label={t('mediaPlayerPage.audio')}
                            value={audioStreamId}
                            options={audioTracks}
                            open={openMenu === 'audio'}
                            onToggle={() => setOpenMenu((current) => current === 'audio' ? null : 'audio')}
                            onChange={(id) => applyStreamChange({ audioStreamId: id })}
                        />
                        {subtitles.length ? (
                            <TrackPicker
                                label={t('mediaPlayerPage.subtitles')}
                                value={subtitleStreamId}
                                options={[
                                    { id: '', label: t('mediaPlayerPage.subtitlesOff') },
                                    ...subtitles,
                                ]}
                                open={openMenu === 'subtitles'}
                                onToggle={() => setOpenMenu((current) => current === 'subtitles' ? null : 'subtitles')}
                                onChange={(id) => applyStreamChange({ subtitleStreamId: id })}
                            />
                        ) : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        <span>{formatClock(currentMs)} / {formatClock(durationMs)}</span>
                        <button
                            type="button"
                            onClick={() => { void toggleFullscreen(); }}
                            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-white hover:bg-white/20"
                            aria-label={fullscreen ? t('mediaPlayerPage.exitFullscreen') : t('mediaPlayerPage.fullscreen')}
                        >
                            {fullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                            <span className="hidden sm:inline">{fullscreen ? t('mediaPlayerPage.exitFullscreen') : t('mediaPlayerPage.fullscreen')}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    if (typeof document === 'undefined') return null;
    return createPortal(overlay, document.body);
};
