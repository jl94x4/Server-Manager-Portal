import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    ChevronsLeft,
    ChevronsRight,
    Loader2,
    Maximize,
    Minimize,
    Minimize2,
    Pause,
    PictureInPicture2,
    Play,
    SkipBack,
    SkipForward,
    Volume2,
    VolumeX,
    X,
} from 'lucide-react';
import Hls from 'hls.js';
import {
    lockBackgroundScroll,
    PORTAL_CSRF_HEADER,
    PORTAL_CSRF_VALUE,
    portalUrl,
    useDiscoverI18n,
} from './host';
import {
    formatClock,
    formatPlayerResolution,
    newPlaySessionId,
    playSessionIdFromSrc,
    buildPlaybackSrc,
    canUseNativeHls,
    isHlsPlaybackSrc,
    offsetMsFromSrc,
    playbackModeFromSrc,
    plexImageUrl,
    PLAYBACK_SPEEDS,
} from './playerUtils';
import { fetchMediaPlayerNeighbors, reportMediaPlayerTimeline, stopMediaPlayerTranscode } from './api';
import { PlayerSeekBar } from './PlayerSeekBar';
import { readLocalPlaybackPrefs, writeLocalPlaybackPrefs } from './playerMemory';
import type { PlayerItem, PlayerPlayOptions, PlayerPlaySession } from './types';

type Props = {
    session: PlayerPlaySession;
    onClose: () => void;
    autoplayNext?: boolean;
    autoSkipIntro?: boolean;
    autoSkipCredits?: boolean;
    onPlayItem?: (item: PlayerItem, opts?: PlayerPlayOptions) => void;
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

type PipVideo = HTMLVideoElement & {
    webkitSupportsPresentationMode?: (mode: string) => boolean;
    webkitSetPresentationMode?: (mode: string) => void;
    webkitPresentationMode?: string;
};

const canUsePictureInPicture = (video: HTMLVideoElement | null) => {
    if (typeof document === 'undefined') return false;
    if (document.pictureInPictureEnabled) return true;
    const pip = video as PipVideo | null;
    return !!(pip?.webkitSetPresentationMode || pip?.webkitSupportsPresentationMode?.('picture-in-picture'));
};

const isInPictureInPicture = (video: HTMLVideoElement | null) => {
    if (typeof document !== 'undefined' && document.pictureInPictureElement === video) return true;
    return (video as PipVideo | null)?.webkitPresentationMode === 'picture-in-picture';
};

const requestPictureInPicture = async (video: HTMLVideoElement | null) => {
    if (!video) return;
    const pip = video as PipVideo;
    if (pip.webkitSetPresentationMode && pip.webkitPresentationMode !== 'picture-in-picture') {
        pip.webkitSetPresentationMode('picture-in-picture');
        return;
    }
    if (video.requestPictureInPicture) await video.requestPictureInPicture();
};

const exitPictureInPicture = async (video: HTMLVideoElement | null) => {
    const pip = video as PipVideo | null;
    if (pip?.webkitSetPresentationMode && pip.webkitPresentationMode === 'picture-in-picture') {
        pip.webkitSetPresentationMode('inline');
        return;
    }
    if (typeof document !== 'undefined' && document.pictureInPictureElement) {
        await document.exitPictureInPicture();
    }
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

const seekBy = (video: HTMLVideoElement | null, deltaSeconds: number) => {
    if (!video) return;
    const next = Math.max(0, video.currentTime + deltaSeconds);
    const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : next;
    video.currentTime = Math.min(duration, next);
};

const bufferedRanges = (video: HTMLVideoElement | null) => {
    const ranges: Array<{ startMs: number; endMs: number }> = [];
    if (!video) return ranges;
    try {
        for (let i = 0; i < video.buffered.length; i += 1) {
            ranges.push({ startMs: video.buffered.start(i) * 1000, endMs: video.buffered.end(i) * 1000 });
        }
    } catch {
        /* ignore */
    }
    return ranges;
};

export const MediaPlayerVideo: React.FC<Props> = ({
    session,
    onClose,
    autoplayNext = false,
    autoSkipIntro = false,
    autoSkipCredits = false,
    onPlayItem,
}) => {
    const { t } = useDiscoverI18n();
    const videoRef = useRef<HTMLVideoElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const hlsRef = useRef<Hls | null>(null);
    const localPrefs = useRef(readLocalPlaybackPrefs());
    const [error, setError] = useState<string | null>(null);
    const [paused, setPaused] = useState(true);
    const [ready, setReady] = useState(false);
    const [fullscreen, setFullscreen] = useState(false);
    const [chrome, setChrome] = useState<'theater' | 'mini'>('theater');
    const [pip, setPip] = useState(false);
    const [pipSupported, setPipSupported] = useState(false);
    const [currentMs, setCurrentMs] = useState(0);
    const [durationMs, setDurationMs] = useState(session.item.durationMs || 0);
    const [buffered, setBuffered] = useState<Array<{ startMs: number; endMs: number }>>([]);
    const [playbackSrc, setPlaybackSrc] = useState(session.src);
    const [qualityId, setQualityId] = useState(session.qualityId || '');
    const [audioStreamId, setAudioStreamId] = useState(session.audioStreamId || '');
    const [subtitleStreamId, setSubtitleStreamId] = useState(session.subtitleStreamId || '');
    const [openMenu, setOpenMenu] = useState<'quality' | 'audio' | 'subtitles' | 'speed' | 'version' | null>(null);
    const [muted, setMuted] = useState(localPrefs.current.muted);
    const [volume, setVolume] = useState(localPrefs.current.volume);
    const [speed, setSpeed] = useState(localPrefs.current.speed);
    const [playbackMode, setPlaybackMode] = useState(session.playbackMode || playbackModeFromSrc(session.src, session.qualityId, session.canCopyOriginal));
    const [nextItem, setNextItem] = useState<PlayerItem | null>(null);
    const [previousItem, setPreviousItem] = useState<PlayerItem | null>(null);
    const [skippedIntro, setSkippedIntro] = useState(false);
    const [skippedCredits, setSkippedCredits] = useState(false);
    const [dismissedUpNext, setDismissedUpNext] = useState(false);
    const [upNextIn, setUpNextIn] = useState(10);
    const [controlsVisible, setControlsVisible] = useState(true);
    const currentMsRef = useRef(0);
    const durationMsRef = useRef(session.item.durationMs || 0);
    const volumeRef = useRef(localPrefs.current.volume);
    const mutedRef = useRef(localPrefs.current.muted);
    const speedRef = useRef(localPrefs.current.speed);
    const sendTimelineRef = useRef<(state: 'playing' | 'paused' | 'buffering' | 'stopped') => void>(() => {});
    const onPlayItemRef = useRef(onPlayItem);
    const nextItemRef = useRef<PlayerItem | null>(null);
    const previousItemRef = useRef<PlayerItem | null>(null);
    const fallbackUsedRef = useRef(false);
    const clickTimerRef = useRef<number>(0);
    const lastTapRef = useRef<{ at: number; x: number } | null>(null);
    const hideTimerRef = useRef<number>(0);

    const qualities = session.qualities || [];
    const audioTracks = session.audioTracks || [];
    const subtitles = session.subtitles || [];
    const versions = session.versions || [];
    const markers = session.markers || { intro: null, credits: null };
    const mediaIndex = String(session.mediaIndex || 0);

    useEffect(() => {
        onPlayItemRef.current = onPlayItem;
    }, [onPlayItem]);
    useEffect(() => {
        nextItemRef.current = nextItem;
    }, [nextItem]);
    useEffect(() => {
        previousItemRef.current = previousItem;
    }, [previousItem]);
    useEffect(() => {
        currentMsRef.current = currentMs;
    }, [currentMs]);
    useEffect(() => {
        durationMsRef.current = durationMs;
    }, [durationMs]);
    useEffect(() => {
        volumeRef.current = volume;
    }, [volume]);
    useEffect(() => {
        mutedRef.current = muted;
    }, [muted]);
    useEffect(() => {
        speedRef.current = speed;
    }, [speed]);
    useEffect(() => {
        writeLocalPlaybackPrefs({ volume, muted, speed });
    }, [muted, speed, volume]);

    useEffect(() => {
        setPlaybackSrc(session.src);
        setQualityId(session.qualityId || '');
        setAudioStreamId(session.audioStreamId || '');
        setSubtitleStreamId(session.subtitleStreamId || '');
        setOpenMenu(null);
        setCurrentMs(session.offsetMs || 0);
        setDurationMs(session.item.durationMs || 0);
        setPlaybackMode(session.playbackMode || playbackModeFromSrc(session.src, session.qualityId, session.canCopyOriginal));
        setSkippedIntro(false);
        setSkippedCredits(false);
        setDismissedUpNext(false);
        setUpNextIn(10);
        setError(null);
        setBuffered([]);
        setControlsVisible(true);
        fallbackUsedRef.current = false;
    }, [session.sessionId]);

    useEffect(() => {
        if (session.item.type !== 'episode') {
            setNextItem(null);
            setPreviousItem(null);
            return undefined;
        }
        let cancelled = false;
        fetchMediaPlayerNeighbors(session.item.ratingKey)
            .then((data) => {
                if (cancelled) return;
                setPreviousItem(data.previous || null);
                setNextItem(data.next || null);
            })
            .catch(() => {
                if (!cancelled) {
                    setPreviousItem(null);
                    setNextItem(null);
                }
            });
        return () => { cancelled = true; };
    }, [session.item.ratingKey, session.item.type]);

    useEffect(() => {
        if (chrome !== 'theater') return undefined;
        return lockBackgroundScroll();
    }, [chrome]);

    useEffect(() => {
        const video = videoRef.current;
        setPipSupported(canUsePictureInPicture(video));
        if (!video) return undefined;
        const syncPip = () => setPip(isInPictureInPicture(video));
        syncPip();
        video.addEventListener('enterpictureinpicture', syncPip);
        video.addEventListener('leavepictureinpicture', syncPip);
        video.addEventListener('webkitpresentationmodechanged', syncPip);
        return () => {
            video.removeEventListener('enterpictureinpicture', syncPip);
            video.removeEventListener('leavepictureinpicture', syncPip);
            video.removeEventListener('webkitpresentationmodechanged', syncPip);
        };
    }, [playbackSrc]);

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
        const applyLocalPlayback = () => {
            video.volume = volumeRef.current;
            video.muted = mutedRef.current;
            video.playbackRate = speedRef.current;
        };
        const onReady = () => {
            if (cancelled) return;
            if (startAt > 1 && Math.abs(video.currentTime - startAt) > 1) {
                video.currentTime = startAt;
            }
            applyLocalPlayback();
            setReady(true);
            void video.play().then(() => {
                if (!cancelled) setPaused(false);
            }).catch(() => {
                if (!cancelled) setPaused(true);
            });
        };

        const fail = (message?: string) => {
            if (cancelled) return;
            if (!fallbackUsedRef.current) {
                fallbackUsedRef.current = true;
                const offset = Math.max(
                    0,
                    Math.floor(((video.currentTime || 0) * 1000) || currentMsRef.current || session.offsetMs || 0),
                );
                const nextSrc = buildPlaybackSrc(session.item.ratingKey, {
                    sessionId: newPlaySessionId(),
                    offsetMs: offset,
                    qualityId: qualityId || session.qualityId || 'original',
                    audioStreamId,
                    subtitleStreamId,
                    directFile: false,
                    copy: false,
                    mediaIndex: session.mediaIndex || 0,
                });
                if (nextSrc !== playbackSrc) {
                    setPlaybackMode('transcode');
                    setPlaybackSrc(nextSrc);
                    return;
                }
            }
            setError(message || t('mediaPlayerPage.playError'));
        };

        const startHlsJs = () => {
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
                hlsRef.current = null;
                fail(hlsErrorMessage(data, t('mediaPlayerPage.playError')));
            });
        };

        const nativeHls = canUseNativeHls();
        if (isHlsPlaybackSrc(playbackSrc) && nativeHls) {
            video.src = src;
            video.addEventListener('loadedmetadata', onReady, { once: true });
            video.addEventListener('error', () => {
                if (cancelled) return;
                video.removeAttribute('src');
                if (Hls.isSupported()) startHlsJs();
                else fail();
            }, { once: true });
        } else if (Hls.isSupported() && isHlsPlaybackSrc(playbackSrc)) {
            startHlsJs();
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

    useEffect(() => {
        if (!('mediaSession' in navigator)) return undefined;
        const thumb = session.item.thumb ? plexImageUrl(session.item.thumb, 512, 512) : '';
        navigator.mediaSession.metadata = new MediaMetadata({
            title: session.item.title,
            artist: session.item.showTitle || 'Media Player',
            album: session.item.seasonTitle || '',
            artwork: thumb ? [{ src: thumb, sizes: '512x512', type: 'image/jpeg' }] : [],
        });
        const playCurrent = (item: PlayerItem | null) => {
            if (!item) return;
            onPlayItemRef.current?.(item, { offsetMs: 0, skipResume: true });
        };
        try {
            navigator.mediaSession.setActionHandler('play', () => { void videoRef.current?.play(); });
            navigator.mediaSession.setActionHandler('pause', () => { videoRef.current?.pause(); });
            navigator.mediaSession.setActionHandler('seekbackward', () => seekBy(videoRef.current, -10));
            navigator.mediaSession.setActionHandler('seekforward', () => seekBy(videoRef.current, 10));
            navigator.mediaSession.setActionHandler('previoustrack', () => {
                if (previousItemRef.current) playCurrent(previousItemRef.current);
                else seekBy(videoRef.current, -10);
            });
            navigator.mediaSession.setActionHandler('nexttrack', () => playCurrent(nextItemRef.current));
        } catch {
            /* older browsers reject some handlers */
        }
        return () => {
            navigator.mediaSession.metadata = null;
            for (const action of ['play', 'pause', 'seekbackward', 'seekforward', 'previoustrack', 'nexttrack']) {
                try { navigator.mediaSession.setActionHandler(action as MediaSessionAction, null); } catch { /* ignore */ }
            }
        };
    }, [session.item.ratingKey, session.item.title, session.item.showTitle, session.item.seasonTitle, session.item.thumb]);

    const toggleFullscreen = () => {
        if (fullscreenElement()) return exitPlayerFullscreen();
        return requestPlayerFullscreen(overlayRef.current, videoRef.current);
    };

    const closePlayer = () => {
        void exitPlayerFullscreen();
        void exitPictureInPicture(videoRef.current);
        onClose();
    };

    const enterMini = () => {
        void exitPlayerFullscreen();
        setOpenMenu(null);
        setChrome('mini');
    };

    const enterTheater = () => {
        void exitPictureInPicture(videoRef.current);
        setChrome('theater');
    };

    const togglePip = async () => {
        const video = videoRef.current;
        if (!video) return;
        try {
            if (isInPictureInPicture(video)) {
                await exitPictureInPicture(video);
                return;
            }
            await requestPictureInPicture(video);
            setChrome('mini');
        } catch {
            /* unsupported or gesture blocked */
        }
    };

    const remaining = Math.max(0, durationMs - currentMs);
    const inIntro = !!(markers.intro && !skippedIntro && currentMs >= markers.intro.startMs && currentMs < markers.intro.endMs);
    const inCredits = !!(markers.credits && !skippedCredits && currentMs >= markers.credits.startMs);
    const showUpNext = !!nextItem && !dismissedUpNext && session.item.type === 'episode' && durationMs > 30000 && (
        inCredits || (remaining > 0 && remaining <= 15000)
    );

    useEffect(() => {
        if (!showUpNext || !autoplayNext || !nextItem) {
            setUpNextIn(10);
            return undefined;
        }
        setUpNextIn(10);
        const timer = window.setInterval(() => {
            setUpNextIn((n) => {
                if (n <= 1) {
                    window.clearInterval(timer);
                    onPlayItemRef.current?.(nextItem, { offsetMs: 0, skipResume: true });
                    return 0;
                }
                return n - 1;
            });
        }, 1000);
        return () => window.clearInterval(timer);
    }, [showUpNext, autoplayNext, nextItem]);

    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            const tag = String((event.target as HTMLElement | null)?.tagName || '').toLowerCase();
            if (tag === 'input' || tag === 'select' || tag === 'textarea') return;
            if (chrome === 'mini' && !overlayRef.current?.contains(event.target as Node)) return;
            if (event.key === 'Escape') {
                if (openMenu) {
                    setOpenMenu(null);
                    return;
                }
                if (fullscreenElement()) return;
                if (chrome === 'mini') return;
                closePlayer();
            }
            if (event.key === ' ') {
                event.preventDefault();
                const video = videoRef.current;
                if (!video) return;
                if (video.paused) void video.play();
                else video.pause();
            }
            if (event.key === 'ArrowLeft') {
                event.preventDefault();
                seekBy(videoRef.current, -10);
            }
            if (event.key === 'ArrowRight') {
                event.preventDefault();
                seekBy(videoRef.current, 10);
            }
            if ((event.key === 'm' || event.key === 'M') && !event.metaKey && !event.ctrlKey) {
                event.preventDefault();
                const video = videoRef.current;
                if (!video) return;
                video.muted = !video.muted;
                setMuted(video.muted);
            }
            if ((event.key === 'f' || event.key === 'F') && !event.metaKey && !event.ctrlKey && !event.altKey) {
                event.preventDefault();
                if (chrome === 'mini') enterTheater();
                else void toggleFullscreen();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [chrome, onClose, openMenu]);

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
        const nextSrc = buildPlaybackSrc(session.item.ratingKey, {
            sessionId: newPlaySessionId(),
            offsetMs: offset,
            qualityId: nextQuality,
            audioStreamId: nextAudio,
            subtitleStreamId: nextSub,
            directFile: !!session.canDirectPlay,
            copy: nextQuality !== 'original' || session.canCopyOriginal !== false,
            mediaIndex: session.mediaIndex || 0,
        });
        setPlaybackMode(playbackModeFromSrc(nextSrc, nextQuality, session.canCopyOriginal));
        setPlaybackSrc(nextSrc);
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

    const skipIntro = () => {
        const video = videoRef.current;
        if (!video || !markers.intro) return;
        video.currentTime = markers.intro.endMs / 1000;
        setSkippedIntro(true);
        sendTimelineRef.current('playing');
    };

    const skipCredits = () => {
        setSkippedCredits(true);
        if (nextItem) {
            onPlayItem?.(nextItem, { offsetMs: 0, skipResume: true });
            return;
        }
        const video = videoRef.current;
        if (!video) return;
        video.currentTime = Math.max(0, (durationMs - 1000) / 1000);
    };

    useEffect(() => {
        if (!autoSkipIntro || !inIntro || !ready) return;
        skipIntro();
    }, [autoSkipIntro, inIntro, ready]);

    useEffect(() => {
        if (!autoSkipCredits || !inCredits || !ready) return;
        skipCredits();
    }, [autoSkipCredits, inCredits, nextItem, ready]);

    const theater = chrome === 'theater';
    const showBars = !theater || controlsVisible || paused || !!error || !!openMenu;
    const bumpControls = useCallback(() => {
        setControlsVisible(true);
        window.clearTimeout(hideTimerRef.current);
        if (chrome !== 'theater' || paused || error || openMenu) return;
        hideTimerRef.current = window.setTimeout(() => setControlsVisible(false), 2800);
    }, [chrome, error, openMenu, paused]);

    useEffect(() => {
        bumpControls();
        return () => window.clearTimeout(hideTimerRef.current);
    }, [bumpControls]);

    const modeLabel = playbackMode === 'directPlay'
        ? t('mediaPlayerPage.playbackDirectPlay')
        : playbackMode === 'directStream'
            ? t('mediaPlayerPage.playbackDirectStream')
            : t('mediaPlayerPage.playbackTranscode');
    const sourceRes = formatPlayerResolution(session.source?.height, session.source?.videoResolution);
    const sourceCodec = String(session.source?.videoCodec || '').toUpperCase();
    const seekTo = (ms: number) => {
        const video = videoRef.current;
        if (!video || !durationMs) return;
        const next = Math.max(0, Math.min(durationMs, ms));
        video.currentTime = next / 1000;
        setCurrentMs(next);
        sendTimelineRef.current('playing');
        bumpControls();
    };
    const retryPlayback = () => {
        setError(null);
        fallbackUsedRef.current = false;
        const offset = Math.max(0, Math.floor(currentMsRef.current || session.offsetMs || 0));
        setPlaybackSrc(buildPlaybackSrc(session.item.ratingKey, {
            sessionId: newPlaySessionId(),
            offsetMs: offset,
            qualityId: qualityId || session.qualityId || 'original',
            audioStreamId,
            subtitleStreamId,
            directFile: !!session.canDirectPlay,
            copy: (qualityId || session.qualityId) !== 'original' || session.canCopyOriginal !== false,
            mediaIndex: session.mediaIndex || 0,
        }));
    };
    const handleVideoClick = (event: React.MouseEvent<HTMLVideoElement>) => {
        bumpControls();
        if ((event.nativeEvent as PointerEvent).pointerType === 'touch') return;
        if (event.detail >= 2) {
            window.clearTimeout(clickTimerRef.current);
            return;
        }
        window.clearTimeout(clickTimerRef.current);
        clickTimerRef.current = window.setTimeout(() => togglePlayback(), 220);
    };
    const handleVideoDoubleClick = (event: React.MouseEvent<HTMLVideoElement>) => {
        event.preventDefault();
        window.clearTimeout(clickTimerRef.current);
        if (chrome === 'mini') enterTheater();
        else void toggleFullscreen();
    };
    const handleVideoPointerUp = (event: React.PointerEvent<HTMLVideoElement>) => {
        if (event.pointerType !== 'touch') return;
        const rect = event.currentTarget.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const now = Date.now();
        const last = lastTapRef.current;
        bumpControls();
        if (last && now - last.at < 280 && Math.abs(x - last.x) < 90) {
            lastTapRef.current = null;
            window.clearTimeout(clickTimerRef.current);
            const third = rect.width / 3;
            if (x < third) seekBy(videoRef.current, -10);
            else if (x > third * 2) seekBy(videoRef.current, 10);
            else togglePlayback();
            return;
        }
        lastTapRef.current = { at: now, x };
    };
    const playNeighbor = (item: PlayerItem | null) => {
        if (!item) return;
        onPlayItem?.(item, { offsetMs: 0, skipResume: true });
    };
    const overlay = (
        <div
            ref={overlayRef}
            className={`${theater
                ? `fixed inset-0 z-[4000] flex h-full w-full flex-col bg-black ${showBars ? '' : 'cursor-none'}`
                : 'fixed bottom-4 right-4 z-[3200] flex w-[min(22rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border border-white/15 bg-black shadow-2xl'}`}
            role={theater ? 'dialog' : 'region'}
            aria-modal={theater}
            aria-label={session.item.title}
            onMouseMove={bumpControls}
            onPointerDown={bumpControls}
        >
            <div className={`absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-3 transition-opacity ${theater ? 'bg-gradient-to-b from-black/80 to-transparent p-4' : 'bg-black/80 p-2'} ${showBars ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
                <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-white">{session.item.title}</p>
                    {session.item.showTitle ? (
                        <p className="truncate text-xs text-white/70">{session.item.showTitle}</p>
                    ) : null}
                    {theater ? (
                        <p className="mt-1 inline-flex max-w-full items-center truncate rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-white/80">
                            {[modeLabel, sourceRes, sourceCodec].filter(Boolean).join(' · ')}
                        </p>
                    ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                    {theater ? (
                        <button
                            type="button"
                            onClick={enterMini}
                            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-sm font-bold text-white hover:bg-white/20"
                            aria-label={t('mediaPlayerPage.miniplayer')}
                        >
                            <Minimize2 className="h-4 w-4" />
                            <span className="hidden sm:inline">{t('mediaPlayerPage.miniplayer')}</span>
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={enterTheater}
                            className="inline-flex items-center rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                            aria-label={t('mediaPlayerPage.expandPlayer')}
                        >
                            <Maximize className="h-4 w-4" />
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={closePlayer}
                        className={`inline-flex items-center gap-2 rounded-full bg-white/10 text-sm font-bold text-white hover:bg-white/20 ${theater ? 'px-3 py-2' : 'p-2'}`}
                        aria-label={t('mediaPlayerPage.closePlayer')}
                    >
                        <X className="h-4 w-4" />
                        {theater ? t('common.close') : null}
                    </button>
                </div>
            </div>

            <div className={`relative ${theater ? 'h-full w-full' : 'aspect-video w-full'}`}>
                <video
                    ref={videoRef}
                    className="h-full w-full bg-black object-contain"
                    controls={false}
                    playsInline
                    autoPlay
                    disablePictureInPicture={false}
                    onClick={handleVideoClick}
                    onDoubleClick={handleVideoDoubleClick}
                    onPointerUp={handleVideoPointerUp}
                    onPlay={() => {
                        setPaused(false);
                        sendTimelineRef.current('playing');
                    }}
                    onPause={() => {
                        setPaused(true);
                        sendTimelineRef.current('paused');
                    }}
                    onTimeUpdate={(event) => {
                        setCurrentMs(event.currentTarget.currentTime * 1000);
                        setBuffered(bufferedRanges(event.currentTarget));
                    }}
                    onProgress={(event) => setBuffered(bufferedRanges(event.currentTarget))}
                    onRateChange={(event) => setSpeed(event.currentTarget.playbackRate || 1)}
                    onVolumeChange={(event) => {
                        setVolume(event.currentTarget.volume);
                        setMuted(event.currentTarget.muted);
                    }}
                    onDurationChange={(event) => {
                        const next = event.currentTarget.duration;
                        if (Number.isFinite(next) && next > 0) setDurationMs(next * 1000);
                    }}
                    onEnded={() => {
                        sendTimelineRef.current('stopped');
                        if (autoplayNext && nextItem) onPlayItem?.(nextItem, { offsetMs: 0, skipResume: true });
                    }}
                />

                {pip ? (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/80 p-4 text-center">
                        <p className="text-xs font-bold uppercase tracking-widest text-white/80">{t('mediaPlayerPage.playingInPip')}</p>
                    </div>
                ) : null}

                {error ? (
                    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 p-6 text-center">
                        <div>
                            <p className="font-bold text-white">{error}</p>
                            <p className="mt-2 text-sm text-white/70">
                                {t('mediaPlayerPage.retryPlaybackHint', { time: formatClock(currentMsRef.current || session.offsetMs || 0) })}
                            </p>
                            <div className="mt-4 flex flex-wrap justify-center gap-2">
                                <button type="button" onClick={retryPlayback} className="rounded-lg bg-plex px-4 py-2 text-sm font-black text-black">
                                    {t('mediaPlayerPage.retryPlayback')}
                                </button>
                                <button type="button" onClick={closePlayer} className="rounded-lg bg-white/10 px-4 py-2 text-sm font-bold text-white">
                                    {t('common.close')}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : null}

                {!error && !ready ? (
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3">
                        <Loader2 className="h-10 w-10 animate-spin text-white/80" />
                        <p className="text-xs font-bold uppercase tracking-widest text-white/70">{t('mediaPlayerPage.buffering')}</p>
                    </div>
                ) : null}

                {inIntro ? (
                    <button
                        type="button"
                        onClick={skipIntro}
                        className={`absolute z-20 rounded-full bg-white font-black text-black shadow-lg ${theater ? 'right-4 bottom-28 px-4 py-2 text-sm' : 'right-2 bottom-2 px-2.5 py-1 text-xs'}`}
                    >
                        {t('mediaPlayerPage.skipIntro')}
                    </button>
                ) : null}

                {inCredits && !showUpNext ? (
                    <button
                        type="button"
                        onClick={skipCredits}
                        className={`absolute z-20 rounded-full bg-white font-black text-black shadow-lg ${theater ? 'right-4 bottom-28 px-4 py-2 text-sm' : 'right-2 bottom-2 px-2.5 py-1 text-xs'}`}
                    >
                        {t('mediaPlayerPage.skipCredits')}
                    </button>
                ) : null}

                {showUpNext && nextItem && theater ? (
                    <div className="absolute right-4 bottom-28 z-20 w-72 overflow-hidden rounded-2xl border border-white/15 bg-black/90 shadow-2xl">
                        {nextItem.thumb ? (
                            <img src={plexImageUrl(nextItem.thumb, 640, 360)} alt="" className="aspect-video w-full object-cover" />
                        ) : null}
                        <div className="p-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/50">{t('mediaPlayerPage.upNext')}</p>
                            <p className="mt-1 truncate text-sm font-bold text-white">{nextItem.title}</p>
                            {autoplayNext ? (
                                <p className="text-xs text-white/70">{t('mediaPlayerPage.nextEpisodeIn', { seconds: upNextIn })}</p>
                            ) : null}
                            <div className="mt-3 flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => onPlayItem?.(nextItem, { offsetMs: 0, skipResume: true })}
                                    className="rounded-lg bg-plex px-3 py-1.5 text-xs font-black text-black"
                                >
                                    {t('mediaPlayerPage.playNow')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDismissedUpNext(true)}
                                    className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold text-white"
                                >
                                    {t('common.close')}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>

            <div className={`z-10 transition-opacity ${theater ? 'absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-4 pb-5 pt-10' : 'bg-black px-3 pb-3 pt-1'} ${showBars ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
                <PlayerSeekBar
                    currentMs={currentMs}
                    durationMs={durationMs}
                    buffered={buffered}
                    markers={markers}
                    label={session.item.title}
                    onSeek={seekTo}
                />
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-white/80">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={togglePlayback}
                            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-white hover:bg-white/20"
                        >
                            {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                            {theater ? (paused ? t('mediaPlayerPage.play') : t('mediaPlayerPage.pause')) : null}
                        </button>
                        {theater && previousItem ? (
                            <button
                                type="button"
                                onClick={() => playNeighbor(previousItem)}
                                className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1.5 text-white hover:bg-white/20"
                                aria-label={t('mediaPlayerPage.previousEpisode')}
                            >
                                <SkipBack className="h-4 w-4" />
                                <span className="hidden sm:inline">{t('mediaPlayerPage.previousEpisode')}</span>
                            </button>
                        ) : null}
                        {theater ? (
                            <>
                                <button
                                    type="button"
                                    onClick={() => seekBy(videoRef.current, -10)}
                                    className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1.5 text-white hover:bg-white/20"
                                    aria-label={t('mediaPlayerPage.skipBack')}
                                >
                                    <ChevronsLeft className="h-4 w-4" />
                                    10
                                </button>
                                <button
                                    type="button"
                                    onClick={() => seekBy(videoRef.current, 10)}
                                    className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1.5 text-white hover:bg-white/20"
                                    aria-label={t('mediaPlayerPage.skipForward')}
                                >
                                    10
                                    <ChevronsRight className="h-4 w-4" />
                                </button>
                                {nextItem ? (
                                    <button
                                        type="button"
                                        onClick={() => playNeighbor(nextItem)}
                                        className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1.5 text-white hover:bg-white/20"
                                        aria-label={t('mediaPlayerPage.nextEpisode')}
                                    >
                                        <SkipForward className="h-4 w-4" />
                                        <span className="hidden sm:inline">{t('mediaPlayerPage.nextEpisode')}</span>
                                    </button>
                                ) : null}
                                <button
                                    type="button"
                                    onClick={() => {
                                        const video = videoRef.current;
                                        if (!video) return;
                                        video.muted = !video.muted;
                                        setMuted(video.muted);
                                    }}
                                    className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-1.5 text-white hover:bg-white/20"
                                    aria-label={muted ? t('mediaPlayerPage.unmute') : t('mediaPlayerPage.mute')}
                                >
                                    {muted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                                </button>
                                <input
                                    type="range"
                                    min={0}
                                    max={1}
                                    step={0.05}
                                    value={muted ? 0 : volume}
                                    onChange={(event) => {
                                        const video = videoRef.current;
                                        const next = Number(event.target.value);
                                        if (video) {
                                            video.volume = next;
                                            video.muted = next === 0;
                                        }
                                        setVolume(next);
                                        setMuted(next === 0);
                                    }}
                                    className="w-20 accent-plex"
                                    aria-label={t('mediaPlayerPage.volume')}
                                />
                                <TrackPicker
                                    label={t('mediaPlayerPage.speed')}
                                    value={String(speed)}
                                    options={PLAYBACK_SPEEDS.map((rate) => ({ id: String(rate), label: `${rate}×` }))}
                                    open={openMenu === 'speed'}
                                    onToggle={() => setOpenMenu((current) => current === 'speed' ? null : 'speed')}
                                    onChange={(id) => {
                                        const next = Number(id) || 1;
                                        const video = videoRef.current;
                                        if (video) video.playbackRate = next;
                                        setSpeed(next);
                                        setOpenMenu(null);
                                    }}
                                />
                                {versions.length > 1 ? (
                                    <TrackPicker
                                        label={t('mediaPlayerPage.version')}
                                        value={mediaIndex}
                                        options={versions.map((row) => ({ id: String(row.mediaIndex), label: row.label }))}
                                        open={openMenu === 'version'}
                                        onToggle={() => setOpenMenu((current) => current === 'version' ? null : 'version')}
                                        onChange={(id) => {
                                            setOpenMenu(null);
                                            onPlayItem?.(session.item, {
                                                offsetMs: Math.floor(currentMsRef.current || 0),
                                                mediaIndex: Number(id) || 0,
                                                skipResume: true,
                                            });
                                        }}
                                    />
                                ) : null}
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
                            </>
                        ) : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        <span>{formatClock(currentMs)}{theater ? ` / ${formatClock(durationMs)}` : ''}</span>
                        {pipSupported ? (
                            <button
                                type="button"
                                onClick={() => { void togglePip(); }}
                                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-2.5 py-1.5 text-white hover:bg-white/20"
                                aria-label={pip ? t('mediaPlayerPage.exitPictureInPicture') : t('mediaPlayerPage.pictureInPicture')}
                            >
                                <PictureInPicture2 className="h-4 w-4" />
                                {theater ? (
                                    <span className="hidden sm:inline">{pip ? t('mediaPlayerPage.exitPictureInPicture') : t('mediaPlayerPage.pictureInPicture')}</span>
                                ) : null}
                            </button>
                        ) : null}
                        {theater ? (
                            <button
                                type="button"
                                onClick={() => { void toggleFullscreen(); }}
                                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-white hover:bg-white/20"
                                aria-label={fullscreen ? t('mediaPlayerPage.exitFullscreen') : t('mediaPlayerPage.fullscreen')}
                            >
                                {fullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                                <span className="hidden sm:inline">{fullscreen ? t('mediaPlayerPage.exitFullscreen') : t('mediaPlayerPage.fullscreen')}</span>
                            </button>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );

    if (typeof document === 'undefined') return null;
    return createPortal(overlay, document.body);
};
