import React, { useCallback, useEffect, useState } from 'react';
import { portalUrl, stripBasePath } from '../shared/basePath';
import { ToastContainer, pushToast as appendToast, type ToastMessage } from '../shared/toast';
import { useDiscoverI18n } from '../discovery/i18n';
import { startMediaPlayerPlayback } from './api';
import { MediaPlayerHome } from './MediaPlayerHome';
import { MediaPlayerLibrary } from './MediaPlayerLibrary';
import { MediaPlayerCollection } from './MediaPlayerCollection';
import { MediaPlayerPlaylist } from './MediaPlayerPlaylist';
import { MediaPlayerDetails } from './MediaPlayerDetails';
import { MediaPlayerPerson } from './MediaPlayerPerson';
import { MediaPlayerVideo } from './MediaPlayerVideo';
import { usePlayerSettings } from './usePlayerSettings';
import { formatClock, shouldOfferResume } from './playerUtils';
import type { PlayerItem, PlayerPlayOptions, PlayerPlaySession, PlayerSection } from './types';

type PlayerPersonRef = { id: string; name: string; thumb?: string | null };
type LibraryTab = 'home' | 'browse' | 'collections';

type PlayerView =
    | { kind: 'home' }
    | { kind: 'library'; sectionKey: string; tab: LibraryTab }
    | { kind: 'collection'; sectionKey: string; ratingKey: string }
    | { kind: 'playlist'; ratingKey: string }
    | { kind: 'item'; ratingKey: string }
    | { kind: 'person'; actorId: string; name?: string; thumb?: string | null };

type PendingResume = {
    item: PlayerItem;
    offsetMs: number;
    mediaIndex?: number;
};

const readPlayerView = (): PlayerView => {
    const href = typeof window !== 'undefined' ? window.location : { pathname: '/media-player', search: '' };
    const parts = stripBasePath(href.pathname)
        .split('/')
        .filter(Boolean);
    const params = new URLSearchParams(href.search || '');
    if (parts[1] === 'library' && parts[2]) {
        if (parts[3] === 'collection' && parts[4]) {
            return { kind: 'collection', sectionKey: parts[2], ratingKey: parts[4] };
        }
        const tab = parts[3] === 'browse' || parts[3] === 'collections' ? parts[3] : 'home';
        return { kind: 'library', sectionKey: parts[2], tab };
    }
    if (parts[1] === 'collection' && parts[2]) {
        return { kind: 'collection', sectionKey: '', ratingKey: parts[2] };
    }
    if (parts[1] === 'playlist' && parts[2]) {
        return { kind: 'playlist', ratingKey: parts[2] };
    }
    if (parts[1] === 'item' && parts[2]) return { kind: 'item', ratingKey: parts[2] };
    if (parts[1] === 'person' && parts[2]) {
        return {
            kind: 'person',
            actorId: decodeURIComponent(parts[2]),
            name: params.get('name') || '',
            thumb: params.get('thumb') || '',
        };
    }
    return { kind: 'home' };
};

const libraryPath = (sectionKey: string, tab: LibraryTab = 'home') => (
    tab === 'home'
        ? `/media-player/library/${encodeURIComponent(sectionKey)}`
        : `/media-player/library/${encodeURIComponent(sectionKey)}/${tab}`
);

export const MediaPlayerDashboard: React.FC = () => {
    const { t } = useDiscoverI18n();
    const [settings] = usePlayerSettings();
    const [view, setView] = useState<PlayerView>(() => readPlayerView());
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const [playSession, setPlaySession] = useState<PlayerPlaySession | null>(null);
    const [startingPlay, setStartingPlay] = useState(false);
    const [pendingResume, setPendingResume] = useState<PendingResume | null>(null);

    const syncFromLocation = useCallback(() => {
        setView(readPlayerView());
    }, []);

    useEffect(() => {
        window.addEventListener('popstate', syncFromLocation);
        window.addEventListener('portal-media-player-navigate', syncFromLocation);
        return () => {
            window.removeEventListener('popstate', syncFromLocation);
            window.removeEventListener('portal-media-player-navigate', syncFromLocation);
        };
    }, [syncFromLocation]);

    const navigate = useCallback((path: string) => {
        window.history.pushState({}, '', portalUrl(path));
        setView(readPlayerView());
        window.dispatchEvent(new Event('portal-media-player-navigate'));
    }, []);

    const openItem = useCallback((item: PlayerItem) => {
        if (!item?.ratingKey) return;
        if (item.type === 'collection') {
            navigate(`/media-player/collection/${encodeURIComponent(item.ratingKey)}`);
            return;
        }
        if (item.type === 'playlist') {
            navigate(`/media-player/playlist/${encodeURIComponent(item.ratingKey)}`);
            return;
        }
        navigate(`/media-player/item/${encodeURIComponent(item.ratingKey)}`);
    }, [navigate]);

    const openLibrary = useCallback((section: PlayerSection, tab: LibraryTab = 'home') => {
        if (!section?.key) return;
        navigate(libraryPath(section.key, tab));
    }, [navigate]);

    const openCollection = useCallback((sectionKey: string, item: PlayerItem) => {
        if (!item?.ratingKey) return;
        navigate(`/media-player/library/${encodeURIComponent(sectionKey)}/collection/${encodeURIComponent(item.ratingKey)}`);
    }, [navigate]);

    const openPerson = useCallback((person: PlayerPersonRef) => {
        const actorId = String(person?.id || person?.name || '').trim();
        if (!actorId) return;
        const qs = new URLSearchParams();
        if (person.name) qs.set('name', person.name);
        if (person.thumb) qs.set('thumb', person.thumb);
        const suffix = qs.toString() ? `?${qs}` : '';
        navigate(`/media-player/person/${encodeURIComponent(actorId)}${suffix}`);
    }, [navigate]);

    const goHome = useCallback(() => navigate('/media-player'), [navigate]);

    const goBack = useCallback(() => {
        if (window.history.length > 1) window.history.back();
        else goHome();
    }, [goHome]);

    const startPlayback = useCallback(async (item: PlayerItem, opts: PlayerPlayOptions = {}) => {
        setStartingPlay(true);
        setPendingResume(null);
        try {
            const session = await startMediaPlayerPlayback(item.ratingKey, {
                offsetMs: opts.offsetMs,
                qualityId: opts.qualityId || settings.defaultQualityId,
                mediaIndex: opts.mediaIndex,
            });
            setPlaySession(session);
        } catch (error: any) {
            setToasts((prev) => appendToast(prev, String(error?.message || t('mediaPlayerPage.playError')), 'error'));
        } finally {
            setStartingPlay(false);
        }
    }, [settings.defaultQualityId, t]);

    const playItem = useCallback(async (item: PlayerItem, opts: PlayerPlayOptions = {}) => {
        if (item?.type === 'playlist' && item.ratingKey) {
            navigate(`/media-player/playlist/${encodeURIComponent(item.ratingKey)}`);
            return;
        }
        if (!item?.canPlay || !item.ratingKey) {
            setToasts((prev) => appendToast(prev, t('mediaPlayerPage.notPlayable'), 'error'));
            return;
        }
        const playableType = item.type === 'movie' || item.type === 'episode' || item.type === 'clip';
        if (!opts.skipResume && playableType && shouldOfferResume(item, opts.offsetMs)) {
            setPendingResume({
                item,
                offsetMs: opts.offsetMs == null ? Number(item.viewOffsetMs || 0) : Number(opts.offsetMs),
                mediaIndex: opts.mediaIndex,
            });
            return;
        }
        await startPlayback(item, opts);
    }, [navigate, startPlayback, t]);

    return (
        <div className="flex flex-col gap-4">
            {view.kind === 'home' ? (
                <MediaPlayerHome onOpenItem={openItem} onOpenLibrary={openLibrary} onPlay={playItem} />
            ) : null}
            {view.kind === 'library' ? (
                <MediaPlayerLibrary
                    sectionKey={view.sectionKey}
                    tab={view.tab}
                    onBack={goHome}
                    onOpenItem={openItem}
                    onOpenLibrary={openLibrary}
                    onOpenCollection={openCollection}
                    onChangeTab={(tab) => navigate(libraryPath(view.sectionKey, tab))}
                    onPlay={playItem}
                />
            ) : null}
            {view.kind === 'collection' ? (
                <MediaPlayerCollection
                    ratingKey={view.ratingKey}
                    onBack={() => (
                        view.sectionKey
                            ? navigate(libraryPath(view.sectionKey, 'collections'))
                            : goBack()
                    )}
                    onOpenItem={openItem}
                    onPlay={playItem}
                />
            ) : null}
            {view.kind === 'playlist' ? (
                <MediaPlayerPlaylist
                    ratingKey={view.ratingKey}
                    onBack={goHome}
                    onOpenItem={openItem}
                    onPlay={playItem}
                />
            ) : null}
            {view.kind === 'item' ? (
                <MediaPlayerDetails
                    ratingKey={view.ratingKey}
                    onBack={goBack}
                    onOpenItem={openItem}
                    onOpenPerson={openPerson}
                    onPlay={playItem}
                    playing={startingPlay}
                />
            ) : null}
            {view.kind === 'person' ? (
                <MediaPlayerPerson
                    actorId={view.actorId}
                    name={view.name}
                    thumb={view.thumb}
                    onBack={goBack}
                    onOpenItem={openItem}
                    onPlay={playItem}
                />
            ) : null}
            {pendingResume ? (
                <div className="fixed inset-0 z-[3500] flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true">
                    <div className="w-full max-w-md rounded-2xl border border-white/10 bg-card p-5 shadow-2xl">
                        <p className="text-xs font-black uppercase tracking-widest text-muted">{t('mediaPlayerPage.resumeTitle')}</p>
                        <h2 className="mt-2 text-lg font-bold text-text">{pendingResume.item.title}</h2>
                        <p className="mt-1 text-sm text-muted">
                            {t('mediaPlayerPage.resumeFrom', { time: formatClock(pendingResume.offsetMs) })}
                        </p>
                        <div className="mt-5 flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => void startPlayback(pendingResume.item, {
                                    offsetMs: pendingResume.offsetMs,
                                    mediaIndex: pendingResume.mediaIndex,
                                    skipResume: true,
                                })}
                                className="rounded-xl bg-plex px-4 py-2.5 text-sm font-black text-black"
                            >
                                {t('mediaPlayerPage.resume')}
                            </button>
                            <button
                                type="button"
                                onClick={() => void startPlayback(pendingResume.item, {
                                    offsetMs: 0,
                                    mediaIndex: pendingResume.mediaIndex,
                                    skipResume: true,
                                })}
                                className="rounded-xl border border-border bg-white/5 px-4 py-2.5 text-sm font-bold text-text"
                            >
                                {t('mediaPlayerPage.startOver')}
                            </button>
                            <button
                                type="button"
                                onClick={() => setPendingResume(null)}
                                className="rounded-xl px-4 py-2.5 text-sm font-bold text-muted hover:text-text"
                            >
                                {t('common.close')}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
            {playSession ? (
                <MediaPlayerVideo
                    session={playSession}
                    onClose={() => setPlaySession(null)}
                    autoplayNext={settings.autoplayNext}
                    onPlayItem={playItem}
                />
            ) : null}
            <ToastContainer toasts={toasts} setToasts={setToasts} />
        </div>
    );
};
