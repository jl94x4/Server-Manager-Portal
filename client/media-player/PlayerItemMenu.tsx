import React, { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    Captions,
    ChevronRight,
    Download,
    Eye,
    EyeOff,
    Info,
    ListPlus,
    ListVideo,
    MoreVertical,
    Trash2,
    Volume2,
    XCircle,
} from 'lucide-react';
import { useDiscoverI18n } from './host';
import { rectToFixedPixels } from '../shared/ui';
import {
    addMediaPlayerPlaylistItem,
    createMediaPlayerPlaylist,
    deleteMediaPlayerItem,
    fetchMediaPlayerItem,
    fetchMediaPlayerPlaylists,
    removeMediaPlayerProgress,
    setMediaPlayerWatched,
    startMediaPlayerDownload,
} from './api';
import { PLAYER_SCROLL_ID } from './paths';
import type { PlayerItem } from './types';
import { PlayerFileInfo } from './PlayerFileInfo';

export type PlayerItemMenuHandle = {
    openAt: (clientX: number, clientY: number) => void;
};

const TV_MENU_CLOSE_EVENT = 'smp-tv-menu-close';

type Props = {
    item: PlayerItem;
    isAdmin?: boolean;
    playlistsEnabled?: boolean;
    showRemoveFromContinueWatching?: boolean;
    variant?: 'poster' | 'toolbar';
    /** TV opens this from a long-press. The trigger stays out of the D-pad path. */
    hideTrigger?: boolean;
    onPlayNext?: (item: PlayerItem) => void;
    onWatchedChange?: (item: PlayerItem, watched: boolean) => void;
    onRemovedFromContinueWatching?: (item: PlayerItem) => void;
    onDeleted?: (item: PlayerItem) => void;
    onToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
    /** Version and audio currently chosen on the title page, so File Info matches them. */
    mediaIndex?: number;
    audioStreamId?: string;
    subtitleStreamId?: string;
    audioTracks?: Array<{ id: string; label: string }>;
    subtitleTracks?: Array<{ id: string; label: string }>;
    onAudioChange?: (id: string) => void;
    onSubtitleChange?: (id: string) => void;
};

type MenuMode = 'main' | 'playlist';

const MENU_WIDTH = 220;

export const PlayerItemMenu = forwardRef<PlayerItemMenuHandle, Props>(({
    item,
    isAdmin = false,
    playlistsEnabled = true,
    showRemoveFromContinueWatching = false,
    variant = 'poster',
    hideTrigger = false,
    onPlayNext,
    onWatchedChange,
    onRemovedFromContinueWatching,
    onDeleted,
    onToast,
    mediaIndex = 0,
    audioStreamId = '',
    subtitleStreamId = '',
    audioTracks = [],
    subtitleTracks = [],
    onAudioChange,
    onSubtitleChange,
}, ref) => {
    const { t } = useDiscoverI18n();
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);
    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState<MenuMode>('main');
    const [pos, setPos] = useState({ top: 0, left: 0 });
    const [playlists, setPlaylists] = useState<PlayerItem[]>([]);
    const [newPlaylistName, setNewPlaylistName] = useState('');
    const [fileInfoItem, setFileInfoItem] = useState<PlayerItem | null>(null);
    const [fileInfoLoading, setFileInfoLoading] = useState(false);
    const [trackPicker, setTrackPicker] = useState<'audio' | 'subtitles' | null>(null);

    const canWatchToggle = item.type === 'movie' || item.type === 'episode' || item.type === 'show' || item.type === 'season';
    const canPlayNext = !!onPlayNext && item.canPlay !== false
        && (item.type === 'movie' || item.type === 'episode' || item.type === 'clip' || item.type === 'trailer');
    const canPlaylist = playlistsEnabled
        && (item.type === 'movie' || item.type === 'episode' || item.type === 'show' || item.type === 'season');
    const isTv = typeof document !== 'undefined' && (
        document.documentElement?.dataset?.tv === '1'
        || window.__PLEX_CLIENT__?.isTv === true
    );
    const canFileInfo = variant !== 'toolbar'
        && (item.type === 'movie' || item.type === 'episode' || item.type === 'clip' || item.type === 'trailer');
    const canPickAudio = variant === 'toolbar' && audioTracks.length > 0 && !!onAudioChange;
    const canPickSubtitles = variant === 'toolbar' && !!onSubtitleChange
        && (item.type === 'movie' || item.type === 'episode');
    const canDownload = !isTv
        && isAdmin
        && (item.type === 'movie' || item.type === 'episode' || item.type === 'clip' || item.type === 'trailer');

    const close = () => {
        setOpen(false);
        setMode('main');
        setNewPlaylistName('');
        try {
            delete document.documentElement.dataset.tvMenuOpen;
        } catch {
            /* ignore */
        }
        if (isTv) {
            const key = String(item.ratingKey || '');
            const poster = key
                ? document.querySelector<HTMLElement>(`[data-tv-poster-btn="1"][data-tv-key="${CSS.escape(key)}"]`)
                : null;
            poster?.focus({ preventScroll: true });
        }
    };

    const placeMenu = (clientX?: number, clientY?: number) => {
        const pad = 8;
        const height = mode === 'playlist' ? 280 : 340;
        const rect = triggerRef.current?.getBoundingClientRect();
        const box = rect ? rectToFixedPixels(rect) : null;
        const zoom = box?.zoom || 1;
        const hasPoint = clientX != null && clientY != null && Number.isFinite(clientX) && Number.isFinite(clientY);
        let left = hasPoint ? Number(clientX) / zoom : (box ? box.left : 0);
        let top = hasPoint ? Number(clientY) / zoom : (box ? box.bottom + 4 : 0);
        const viewportW = (typeof window !== 'undefined' ? window.innerWidth : MENU_WIDTH) / zoom;
        const viewportH = (typeof window !== 'undefined' ? window.innerHeight : height) / zoom;
        left = Math.min(Math.max(pad, left), viewportW - MENU_WIDTH - pad);
        top = Math.min(Math.max(pad, top), viewportH - height - pad);
        setPos({ top, left });
    };

    const openAt = (clientX?: number, clientY?: number) => {
        setMode('main');
        placeMenu(clientX, clientY);
        setOpen(true);
        try {
            document.documentElement.dataset.tvMenuOpen = '1';
        } catch {
            /* ignore */
        }
    };

    useImperativeHandle(ref, () => ({
        openAt: (x, y) => openAt(x, y),
    }), []);

    useLayoutEffect(() => {
        if (!open || variant === 'toolbar') return undefined;
        placeMenu();
        return undefined;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, open, variant]);

    useEffect(() => {
        if (!trackPicker) return undefined;
        const closePicker = () => setTrackPicker(null);
        window.addEventListener('smp-tv-overlay-close', closePicker);
        const id = window.setTimeout(() => {
            const el = document.querySelector<HTMLElement>('[data-tv-track-primary="1"]')
                || document.querySelector<HTMLElement>('[data-tv-track-dialog="1"] [data-tv-item="1"]');
            el?.focus({ preventScroll: true });
            el?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        }, 40);
        return () => {
            window.removeEventListener('smp-tv-overlay-close', closePicker);
            window.clearTimeout(id);
        };
    }, [trackPicker]);

    useEffect(() => {
        if (!open) return undefined;
        const openedAt = Date.now();
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') close();
        };
        const onPointer = (event: MouseEvent | TouchEvent) => {
            // Ignore the finger/mouse release that opened the menu (esp. long-press on mobile).
            if (Date.now() - openedAt < 400) return;
            const target = event.target as Node | null;
            if (menuRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
            close();
        };
        const onTvClose = () => close();
        window.addEventListener('keydown', onKey);
        window.addEventListener('mousedown', onPointer);
        window.addEventListener('touchstart', onPointer, { passive: true });
        window.addEventListener(TV_MENU_CLOSE_EVENT, onTvClose);
        window.addEventListener('smp-tv-overlay-close', onTvClose);
        return () => {
            window.removeEventListener('keydown', onKey);
            window.removeEventListener('mousedown', onPointer);
            window.removeEventListener('touchstart', onPointer);
            window.removeEventListener(TV_MENU_CLOSE_EVENT, onTvClose);
            window.removeEventListener('smp-tv-overlay-close', onTvClose);
        };
    }, [open]);

    useEffect(() => {
        if (!open) return undefined;
        const id = window.requestAnimationFrame(() => {
            const first = menuRef.current?.querySelector<HTMLElement>('[data-tv-item="1"]');
            first?.focus({ preventScroll: true });
        });
        return () => window.cancelAnimationFrame(id);
    }, [open, mode]);

    useEffect(() => {
        if (!open) return undefined;
        const scroller = document.getElementById(PLAYER_SCROLL_ID);
        if (!scroller) return undefined;
        const frozen = scroller.scrollTop;
        const hold = () => {
            if (scroller.scrollTop !== frozen) scroller.scrollTop = frozen;
        };
        scroller.addEventListener('scroll', hold);
        return () => scroller.removeEventListener('scroll', hold);
    }, [open]);

    const loadPlaylists = async () => {
        try {
            const data = await fetchMediaPlayerPlaylists();
            setPlaylists(Array.isArray(data.items) ? data.items : []);
        } catch {
            setPlaylists([]);
        }
    };

    const toast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        onToast?.(message, type);
    };

    const openFileInfo = () => {
        setOpen(false);
        setMode('main');
        setNewPlaylistName('');
        try {
            delete document.documentElement.dataset.tvMenuOpen;
        } catch {
            /* ignore */
        }
        setFileInfoItem(item);
        if ((item.mediaInfo || []).length) {
            setFileInfoLoading(false);
            return;
        }
        setFileInfoLoading(true);
        void fetchMediaPlayerItem(item.ratingKey, { core: true })
            .then((data) => {
                if (data?.item) setFileInfoItem(data.item);
            })
            .catch(() => {
                toast(t('mediaPlayerPage.actionError'), 'error');
            })
            .finally(() => setFileInfoLoading(false));
    };

    const choose = (action: () => void | Promise<void>) => {
        close();
        void Promise.resolve()
            .then(action)
            .catch(() => {
                toast(t('mediaPlayerPage.actionError'), 'error');
            });
    };

    const watchToggle = canWatchToggle ? (
        <button
            type="button"
            role="menuitem"
            data-tv-item="1"
            data-tv-menu-item="1"
            className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left font-semibold hover:bg-white/10 disabled:opacity-50"
            onClick={() => {
                const next = !item.watched;
                choose(async () => {
                    await setMediaPlayerWatched(item.ratingKey, next);
                    onWatchedChange?.(item, next);
                    toast(next ? t('mediaPlayerPage.markedWatched') : t('mediaPlayerPage.markedUnwatched'));
                });
            }}
        >
            {item.watched
                ? <EyeOff className="h-4 w-4 shrink-0 opacity-80" />
                : <Eye className="h-4 w-4 shrink-0 opacity-80" />}
            {item.watched ? t('mediaPlayerPage.markUnwatched') : t('mediaPlayerPage.markWatched')}
        </button>
    ) : null;

    const menuInner = mode === 'main' ? (
        <>
            {isTv ? watchToggle : null}
            {canPlayNext ? (
                <button
                    type="button"
                    role="menuitem"
                    data-tv-item="1"
                    data-tv-menu-item="1"
                    className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left font-semibold hover:bg-white/10 disabled:opacity-50"
                    onClick={() => choose(() => {
                        onPlayNext?.(item);
                        toast(t('mediaPlayerPage.playNextQueued', { title: item.title }));
                    })}
                >
                    <ListVideo className="h-4 w-4 shrink-0 opacity-80" />
                    {t('mediaPlayerPage.playNext')}
                </button>
            ) : null}
            {canPlaylist ? (
                <button
                    type="button"
                    role="menuitem"
                    data-tv-item="1"
                    data-tv-menu-item="1"
                    className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left font-semibold hover:bg-white/10 disabled:opacity-50"
                    onClick={() => {
                        setMode('playlist');
                        void loadPlaylists();
                    }}
                >
                    <ListPlus className="h-4 w-4 shrink-0 opacity-80" />
                    <span className="min-w-0 flex-1 truncate">{t('mediaPlayerPage.addToPlaylist')}</span>
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" />
                </button>
            ) : null}
            {isTv ? null : watchToggle}
            {showRemoveFromContinueWatching ? (
                <button
                    type="button"
                    role="menuitem"
                    data-tv-item="1"
                    data-tv-menu-item="1"
                    className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left font-semibold hover:bg-white/10 disabled:opacity-50"
                    onClick={() => choose(async () => {
                        await removeMediaPlayerProgress(item.ratingKey);
                        onRemovedFromContinueWatching?.(item);
                        toast(t('mediaPlayerPage.removedFromContinueWatching'));
                    })}
                >
                    <XCircle className="h-4 w-4 shrink-0 opacity-80" />
                    {t('mediaPlayerPage.removeFromContinueWatching')}
                </button>
            ) : null}
            {canPickAudio ? (
                <button
                    type="button"
                    role="menuitem"
                    data-tv-item="1"
                    data-tv-menu-item="1"
                    className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left font-semibold hover:bg-white/10"
                    onClick={() => {
                        setOpen(false);
                        setMode('main');
                        try {
                            delete document.documentElement.dataset.tvMenuOpen;
                        } catch {
                            /* ignore */
                        }
                        setTrackPicker('audio');
                    }}
                >
                    <Volume2 className="h-4 w-4 shrink-0 opacity-80" />
                    {t('mediaPlayerPage.selectAudio')}
                </button>
            ) : null}
            {canPickSubtitles ? (
                <button
                    type="button"
                    role="menuitem"
                    data-tv-item="1"
                    data-tv-menu-item="1"
                    className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left font-semibold hover:bg-white/10"
                    onClick={() => {
                        setOpen(false);
                        setMode('main');
                        try {
                            delete document.documentElement.dataset.tvMenuOpen;
                        } catch {
                            /* ignore */
                        }
                        setTrackPicker('subtitles');
                    }}
                >
                    <Captions className="h-4 w-4 shrink-0 opacity-80" />
                    {t('mediaPlayerPage.selectSubtitles')}
                </button>
            ) : null}
            {canFileInfo ? (
                <button
                    type="button"
                    role="menuitem"
                    data-tv-item="1"
                    data-tv-menu-item="1"
                    className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left font-semibold hover:bg-white/10"
                    onClick={openFileInfo}
                >
                    <Info className="h-4 w-4 shrink-0 opacity-80" />
                    {t('mediaPlayerPage.fileInfo')}
                </button>
            ) : null}
            {isAdmin ? (
                <>
                    <div className="my-1.5 border-t border-white/10" />
                    {canDownload ? (
                        <button
                            type="button"
                            role="menuitem"
                            data-tv-item="1"
                            data-tv-menu-item="1"
                            className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left font-semibold hover:bg-white/10 disabled:opacity-50"
                            onClick={() => choose(async () => {
                                await startMediaPlayerDownload(item.ratingKey);
                                toast(t('mediaPlayerPage.downloadStarted'));
                            })}
                        >
                            <Download className="h-4 w-4 shrink-0 opacity-80" />
                            {t('mediaPlayerPage.download')}
                        </button>
                    ) : null}
                    <button
                        type="button"
                        role="menuitem"
                        data-tv-item="1"
                        data-tv-menu-item="1"
                        className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left font-semibold text-red-300 hover:bg-red-500/15 disabled:opacity-50"
                        onClick={() => {
                            close();
                            const ok = window.confirm(t('mediaPlayerPage.deleteConfirm', { title: item.title }));
                            if (!ok) return;
                            void deleteMediaPlayerItem(item.ratingKey).then(() => {
                                onDeleted?.(item);
                                toast(t('mediaPlayerPage.deletedTitle', { title: item.title }));
                            }).catch(() => {
                                toast(t('mediaPlayerPage.actionError'), 'error');
                            });
                        }}
                    >
                        <Trash2 className="h-4 w-4 shrink-0 opacity-80" />
                        {t('mediaPlayerPage.delete')}
                    </button>
                </>
            ) : null}
        </>
    ) : (
        <div className="flex max-h-72 flex-col">
            <button
                type="button"
                data-tv-item="1"
                data-tv-menu-item="1"
                className="flex items-center gap-2 px-3.5 py-2 text-left text-xs font-bold uppercase tracking-wider text-muted hover:bg-white/5"
                onClick={() => setMode('main')}
            >
                {t('mediaPlayerPage.back')}
            </button>
            <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar">
                {playlists.map((playlist) => (
                    <button
                        key={playlist.ratingKey}
                        type="button"
                        data-tv-item="1"
                        data-tv-menu-item="1"
                        className="flex w-full items-center gap-2 px-3.5 py-2 text-left font-semibold hover:bg-white/10 disabled:opacity-50"
                        onClick={() => choose(async () => {
                            await addMediaPlayerPlaylistItem(playlist.ratingKey, item.ratingKey);
                            toast(t('mediaPlayerPage.addedToPlaylist', { name: playlist.title }));
                        })}
                    >
                        <span className="truncate">{playlist.title}</span>
                    </button>
                ))}
            </div>
            <form
                className="flex gap-1 border-t border-white/10 p-2"
                onSubmit={(event) => {
                    event.preventDefault();
                    const title = newPlaylistName.trim();
                    if (!title) return;
                    choose(async () => {
                        const created = await createMediaPlayerPlaylist(title, item.ratingKey);
                        toast(t('mediaPlayerPage.addedToPlaylist', { name: created.item?.title || title }));
                    });
                }}
            >
                <input
                    value={newPlaylistName}
                    onChange={(event) => setNewPlaylistName(event.target.value)}
                    placeholder={t('mediaPlayerPage.playlistName')}
                    className="min-w-0 flex-1 rounded-lg border border-white/15 bg-white/5 px-2 py-1.5 text-xs text-white"
                />
                <button type="submit" className="rounded-lg bg-plex px-2 py-1.5 text-[10px] font-black text-black">
                    {t('mediaPlayerPage.createPlaylist')}
                </button>
            </form>
        </div>
    );

    const menuShell = open ? (
        <div
            ref={menuRef}
            role="menu"
            data-tv-item-menu="1"
            className={variant === 'toolbar'
                ? 'absolute left-0 top-[calc(100%+6px)] z-[400] min-w-[220px] overflow-hidden rounded-lg bg-[#1a1f2a] py-1.5 text-sm text-white shadow-[0_12px_40px_rgba(0,0,0,0.55)]'
                : 'fixed z-[400] min-w-[220px] overflow-hidden rounded-lg bg-[#1a1f2a] py-1.5 text-sm text-white shadow-[0_12px_40px_rgba(0,0,0,0.55)]'}
            style={variant === 'toolbar' ? { width: MENU_WIDTH } : { top: pos.top, left: pos.left, width: MENU_WIDTH }}
            onClick={(event) => event.stopPropagation()}
            onContextMenu={(event) => event.preventDefault()}
        >
            {menuInner}
        </div>
    ) : null;

    const menu = variant === 'toolbar' || !menuShell
        ? menuShell
        : createPortal(menuShell, document.body);

    return (
        <div className={variant === 'toolbar' ? 'relative' : ''}>
            <button
                ref={triggerRef}
                type="button"
                tabIndex={hideTrigger ? -1 : undefined}
                data-tv-item={variant === 'toolbar' && !hideTrigger ? '1' : undefined}
                data-tv-action={variant === 'toolbar' && !hideTrigger ? '1' : undefined}
                aria-hidden={hideTrigger ? true : undefined}
                aria-label={t('mediaPlayerPage.moreActions')}
                aria-haspopup="menu"
                aria-expanded={open}
                className={hideTrigger
                    ? 'sr-only'
                    : variant === 'toolbar'
                    ? 'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white transition-colors hover:border-plex/40 hover:bg-white/10'
                    : 'pointer-events-auto absolute bottom-1.5 right-1.5 z-30 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white opacity-100 transition hover:bg-black md:opacity-0 md:group-hover:opacity-100'}
                onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    if (open) close();
                    else openAt();
                }}
            >
                <MoreVertical className="h-4 w-4" />
            </button>
            {menu}
            {fileInfoItem ? (
                <PlayerFileInfo
                    item={fileInfoItem}
                    loading={fileInfoLoading}
                    mediaIndex={mediaIndex}
                    audioStreamId={audioStreamId}
                    onClose={() => setFileInfoItem(null)}
                />
            ) : null}
            {trackPicker ? (
                <div
                    className="fixed inset-0 z-[3500] flex items-center justify-center bg-black/70 p-4"
                    role="dialog"
                    aria-modal="true"
                    data-tv-track-dialog="1"
                >
                    <div className="flex max-h-[min(78vh,44rem)] w-full max-w-lg flex-col rounded-2xl border border-white/10 bg-card p-5 shadow-2xl">
                        <p className="shrink-0 text-xs font-black uppercase tracking-widest text-muted">
                            {trackPicker === 'audio' ? t('mediaPlayerPage.selectAudio') : t('mediaPlayerPage.selectSubtitles')}
                        </p>
                        <h2 className="mt-2 shrink-0 truncate text-lg font-bold text-text">{item.title}</h2>
                        <div
                            className="mt-4 min-h-0 flex-1 overflow-y-auto overscroll-contain hide-scrollbar"
                            data-tv-rail="1"
                            data-tv-overlay-scroll="1"
                        >
                            <div className="flex flex-col gap-2 pr-1">
                                {(trackPicker === 'audio'
                                    ? audioTracks
                                    : [{ id: '0', label: t('mediaPlayerPage.subtitlesOff') }, ...subtitleTracks]
                                ).map((row) => {
                                    const selected = trackPicker === 'audio'
                                        ? String(row.id) === String(audioStreamId || audioTracks[0]?.id)
                                        : String(row.id) === String(subtitleStreamId || '0');
                                    return (
                                        <button
                                            key={row.id}
                                            type="button"
                                            data-tv-item="1"
                                            data-tv-action="1"
                                            data-tv-track-primary={selected ? '1' : undefined}
                                            onClick={() => {
                                                if (trackPicker === 'audio') onAudioChange?.(row.id);
                                                else onSubtitleChange?.(row.id);
                                                setTrackPicker(null);
                                            }}
                                            className={`rounded-xl border px-4 py-3 text-left text-sm font-bold outline-none ${
                                                selected
                                                    ? 'border-plex/50 bg-plex/15 text-text'
                                                    : 'border-white/10 bg-white/5 text-text hover:border-plex/40 hover:bg-white/10'
                                            }`}
                                        >
                                            {row.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <button
                            type="button"
                            data-tv-item="1"
                            data-tv-action="1"
                            onClick={() => setTrackPicker(null)}
                            className="mt-3 shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold text-muted hover:text-text outline-none"
                        >
                            {t('common.close')}
                        </button>
                    </div>
                </div>
            ) : null}
        </div>
    );
});

PlayerItemMenu.displayName = 'PlayerItemMenu';
