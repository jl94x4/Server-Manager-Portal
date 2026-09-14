import React, { useCallback, useEffect, useState } from 'react';
import { portalUrl, stripBasePath } from '../shared/basePath';
import { ToastContainer, pushToast as appendToast, type ToastMessage } from '../shared/toast';
import { useDiscoverI18n } from '../discovery/i18n';
import { startMediaPlayerPlayback } from './api';
import { MediaPlayerHome } from './MediaPlayerHome';
import { MediaPlayerLibrary } from './MediaPlayerLibrary';
import { MediaPlayerDetails } from './MediaPlayerDetails';
import { MediaPlayerVideo } from './MediaPlayerVideo';
import type { PlayerItem, PlayerPlaySession, PlayerSection } from './types';

type PlayerView =
    | { kind: 'home' }
    | { kind: 'library'; sectionKey: string }
    | { kind: 'item'; ratingKey: string };

const readPlayerView = (): PlayerView => {
    const parts = stripBasePath(typeof window !== 'undefined' ? window.location.pathname : '/media-player')
        .split('/')
        .filter(Boolean);
    if (parts[1] === 'library' && parts[2]) return { kind: 'library', sectionKey: parts[2] };
    if (parts[1] === 'item' && parts[2]) return { kind: 'item', ratingKey: parts[2] };
    return { kind: 'home' };
};

export const MediaPlayerDashboard: React.FC = () => {
    const { t } = useDiscoverI18n();
    const [view, setView] = useState<PlayerView>(() => readPlayerView());
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const [playSession, setPlaySession] = useState<PlayerPlaySession | null>(null);
    const [startingPlay, setStartingPlay] = useState(false);

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
        navigate(`/media-player/item/${encodeURIComponent(item.ratingKey)}`);
    }, [navigate]);

    const openLibrary = useCallback((section: PlayerSection) => {
        if (!section?.key) return;
        navigate(`/media-player/library/${encodeURIComponent(section.key)}`);
    }, [navigate]);

    const goHome = useCallback(() => navigate('/media-player'), [navigate]);

    const playItem = useCallback(async (item: PlayerItem) => {
        if (!item?.canPlay || !item.ratingKey) {
            setToasts((prev) => appendToast(prev, t('mediaPlayerPage.notPlayable'), 'error'));
            return;
        }
        setStartingPlay(true);
        try {
            const session = await startMediaPlayerPlayback(item.ratingKey, item.viewOffsetMs || 0);
            setPlaySession(session);
        } catch (error: any) {
            setToasts((prev) => appendToast(prev, String(error?.message || t('mediaPlayerPage.playError')), 'error'));
        } finally {
            setStartingPlay(false);
        }
    }, [t]);

    return (
        <div className="flex flex-col gap-4">
            {view.kind === 'home' ? (
                <MediaPlayerHome onOpenItem={openItem} onOpenLibrary={openLibrary} />
            ) : null}
            {view.kind === 'library' ? (
                <MediaPlayerLibrary
                    sectionKey={view.sectionKey}
                    onBack={goHome}
                    onOpenItem={openItem}
                    onOpenLibrary={openLibrary}
                />
            ) : null}
            {view.kind === 'item' ? (
                <MediaPlayerDetails
                    ratingKey={view.ratingKey}
                    onBack={() => {
                        if (window.history.length > 1) window.history.back();
                        else goHome();
                    }}
                    onOpenItem={openItem}
                    onPlay={playItem}
                    playing={startingPlay}
                />
            ) : null}
            {playSession ? (
                <MediaPlayerVideo session={playSession} onClose={() => setPlaySession(null)} />
            ) : null}
            <ToastContainer toasts={toasts} setToasts={setToasts} />
        </div>
    );
};
