import React, { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    ChevronRight,
    Download,
    Eye,
    EyeOff,
    ListPlus,
    ListVideo,
    MoreVertical,
    Trash2,
    XCircle,
} from 'lucide-react';
import { useDiscoverI18n } from './host';
import {
    addMediaPlayerPlaylistItem,
    createMediaPlayerPlaylist,
    deleteMediaPlayerItem,
    fetchMediaPlayerPlaylists,
    removeMediaPlayerProgress,
    setMediaPlayerWatched,
    startMediaPlayerDownload,
} from './api';
import type { PlayerItem } from './types';

export type PlayerItemMenuHandle = {
    openAt: (clientX: number, clientY: number) => void;
};

type Props = {
    item: PlayerItem;
    isAdmin?: boolean;
    playlistsEnabled?: boolean;
    showRemoveFromContinueWatching?: boolean;
    onPlayNext?: (item: PlayerItem) => void;
    onWatchedChange?: (item: PlayerItem, watched: boolean) => void;
    onRemovedFromContinueWatching?: (item: PlayerItem) => void;
    onDeleted?: (item: PlayerItem) => void;
    onToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
};

type MenuMode = 'main' | 'playlist';

const MENU_WIDTH = 220;

export const PlayerItemMenu = forwardRef<PlayerItemMenuHandle, Props>(({
    item,
    isAdmin = false,
    playlistsEnabled = true,
    showRemoveFromContinueWatching = false,
    onPlayNext,
    onWatchedChange,
    onRemovedFromContinueWatching,
    onDeleted,
    onToast,
}, ref) => {
    const { t } = useDiscoverI18n();
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);
    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState<MenuMode>('main');
    const [pos, setPos] = useState({ top: 0, left: 0 });
    const [playlists, setPlaylists] = useState<PlayerItem[]>([]);
    const [newPlaylistName, setNewPlaylistName] = useState('');
    const [busy, setBusy] = useState(false);

    const canWatchToggle = item.type === 'movie' || item.type === 'episode' || item.type === 'show' || item.type === 'season';
    const canPlayNext = !!onPlayNext && item.canPlay !== false
        && (item.type === 'movie' || item.type === 'episode' || item.type === 'clip' || item.type === 'trailer');
    const canPlaylist = playlistsEnabled
        && (item.type === 'movie' || item.type === 'episode' || item.type === 'show' || item.type === 'season');
    const canDownload = isAdmin
        && (item.type === 'movie' || item.type === 'episode' || item.type === 'clip' || item.type === 'trailer');

    const close = () => {
        setOpen(false);
        setMode('main');
        setNewPlaylistName('');
        setBusy(false);
    };

    const placeMenu = (clientX?: number, clientY?: number) => {
        const pad = 8;
        const height = mode === 'playlist' ? 280 : 260;
        const rect = triggerRef.current?.getBoundingClientRect();
        // Prefer explicit click/long-press point; fall back to the ⋯ button.
        const hasPoint = clientX != null && clientY != null && Number.isFinite(clientX) && Number.isFinite(clientY);
        let left = hasPoint ? Number(clientX) : (rect ? rect.left : 0);
        let top = hasPoint ? Number(clientY) : (rect ? rect.bottom + 4 : 0);
        left = Math.min(Math.max(pad, left), window.innerWidth - MENU_WIDTH - pad);
        top = Math.min(Math.max(pad, top), window.innerHeight - height - pad);
        setPos({ top, left });
    };

    const openAt = (clientX?: number, clientY?: number) => {
        setMode('main');
        placeMenu(clientX, clientY);
        setOpen(true);
    };

    useImperativeHandle(ref, () => ({
        openAt: (x, y) => openAt(x, y),
    }), []);

    useLayoutEffect(() => {
        if (!open) return undefined;
        // Re-clamp only; keep the current anchor (do not re-read stale coords as x/y).
        placeMenu(pos.left, pos.top);
        return undefined;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, open]);

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
        window.addEventListener('keydown', onKey);
        window.addEventListener('mousedown', onPointer);
        window.addEventListener('touchstart', onPointer, { passive: true });
        return () => {
            window.removeEventListener('keydown', onKey);
            window.removeEventListener('mousedown', onPointer);
            window.removeEventListener('touchstart', onPointer);
        };
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

    const run = async (action: () => Promise<void>) => {
        if (busy) return;
        setBusy(true);
        try {
            await action();
        } finally {
            setBusy(false);
        }
    };

    const menu = open ? createPortal(
        <div
            ref={menuRef}
            role="menu"
            className="fixed z-[400] min-w-[220px] overflow-hidden rounded-lg bg-[#1a1f2a] py-1.5 text-sm text-white shadow-[0_12px_40px_rgba(0,0,0,0.55)]"
            style={{ top: pos.top, left: pos.left, width: MENU_WIDTH }}
            onClick={(event) => event.stopPropagation()}
            onContextMenu={(event) => event.preventDefault()}
        >
            {mode === 'main' ? (
                <>
                    {canPlayNext ? (
                        <button
                            type="button"
                            role="menuitem"
                            disabled={busy}
                            className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left font-semibold hover:bg-white/10 disabled:opacity-50"
                            onClick={() => {
                                onPlayNext?.(item);
                                toast(t('mediaPlayerPage.playNextQueued', { title: item.title }));
                                close();
                            }}
                        >
                            <ListVideo className="h-4 w-4 shrink-0 opacity-80" />
                            {t('mediaPlayerPage.playNext')}
                        </button>
                    ) : null}
                    {canPlaylist ? (
                        <button
                            type="button"
                            role="menuitem"
                            disabled={busy}
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
                    {canWatchToggle ? (
                        <button
                            type="button"
                            role="menuitem"
                            disabled={busy}
                            className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left font-semibold hover:bg-white/10 disabled:opacity-50"
                            onClick={() => run(async () => {
                                const next = !item.watched;
                                try {
                                    await setMediaPlayerWatched(item.ratingKey, next);
                                    onWatchedChange?.(item, next);
                                    toast(next ? t('mediaPlayerPage.markedWatched') : t('mediaPlayerPage.markedUnwatched'));
                                    close();
                                } catch {
                                    toast(t('mediaPlayerPage.actionError'), 'error');
                                }
                            })}
                        >
                            {item.watched
                                ? <EyeOff className="h-4 w-4 shrink-0 opacity-80" />
                                : <Eye className="h-4 w-4 shrink-0 opacity-80" />}
                            {item.watched ? t('mediaPlayerPage.markUnwatched') : t('mediaPlayerPage.markWatched')}
                        </button>
                    ) : null}
                    {showRemoveFromContinueWatching ? (
                        <button
                            type="button"
                            role="menuitem"
                            disabled={busy}
                            className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left font-semibold hover:bg-white/10 disabled:opacity-50"
                            onClick={() => run(async () => {
                                try {
                                    await removeMediaPlayerProgress(item.ratingKey);
                                    onRemovedFromContinueWatching?.(item);
                                    toast(t('mediaPlayerPage.removedFromContinueWatching'));
                                    close();
                                } catch {
                                    toast(t('mediaPlayerPage.removeFromContinueWatchingError'), 'error');
                                }
                            })}
                        >
                            <XCircle className="h-4 w-4 shrink-0 opacity-80" />
                            {t('mediaPlayerPage.removeFromContinueWatching')}
                        </button>
                    ) : null}
                    {isAdmin ? (
                        <>
                            <div className="my-1.5 border-t border-white/10" />
                            {canDownload ? (
                                <button
                                    type="button"
                                    role="menuitem"
                                    disabled={busy}
                                    className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left font-semibold hover:bg-white/10 disabled:opacity-50"
                                    onClick={() => run(async () => {
                                        try {
                                            await startMediaPlayerDownload(item.ratingKey);
                                            toast(t('mediaPlayerPage.downloadStarted'));
                                            close();
                                        } catch {
                                            toast(t('mediaPlayerPage.downloadError'), 'error');
                                        }
                                    })}
                                >
                                    <Download className="h-4 w-4 shrink-0 opacity-80" />
                                    {t('mediaPlayerPage.download')}
                                </button>
                            ) : null}
                            <button
                                type="button"
                                role="menuitem"
                                disabled={busy}
                                className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left font-semibold text-red-300 hover:bg-red-500/15 disabled:opacity-50"
                                onClick={() => run(async () => {
                                    const ok = window.confirm(t('mediaPlayerPage.deleteConfirm', { title: item.title }));
                                    if (!ok) return;
                                    try {
                                        await deleteMediaPlayerItem(item.ratingKey);
                                        onDeleted?.(item);
                                        toast(t('mediaPlayerPage.deletedTitle', { title: item.title }));
                                        close();
                                    } catch {
                                        toast(t('mediaPlayerPage.actionError'), 'error');
                                    }
                                })}
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
                                disabled={busy}
                                className="flex w-full items-center gap-2 px-3.5 py-2 text-left font-semibold hover:bg-white/10 disabled:opacity-50"
                                onClick={() => run(async () => {
                                    try {
                                        await addMediaPlayerPlaylistItem(playlist.ratingKey, item.ratingKey);
                                        toast(t('mediaPlayerPage.addedToPlaylist', { name: playlist.title }));
                                        close();
                                    } catch {
                                        toast(t('mediaPlayerPage.actionError'), 'error');
                                    }
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
                            void run(async () => {
                                try {
                                    const created = await createMediaPlayerPlaylist(title, item.ratingKey);
                                    toast(t('mediaPlayerPage.addedToPlaylist', { name: created.item?.title || title }));
                                    close();
                                } catch {
                                    toast(t('mediaPlayerPage.actionError'), 'error');
                                }
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
            )}
        </div>,
        document.body,
    ) : null;

    return (
        <>
            <button
                ref={triggerRef}
                type="button"
                aria-label={t('mediaPlayerPage.moreActions')}
                aria-haspopup="menu"
                aria-expanded={open}
                className="pointer-events-auto absolute bottom-1.5 right-1.5 z-30 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white opacity-100 transition hover:bg-black md:opacity-0 md:group-hover:opacity-100"
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
        </>
    );
});

PlayerItemMenu.displayName = 'PlayerItemMenu';
