import React, { useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MediaPlayerDashboard } from '../media-player/MediaPlayerDashboard';
import { PLAYER_APP_BASE } from '../media-player/paths';
import { apiFetch } from '../shared/api';
import { PlexClientAuthScreen } from './AuthScreen';
import {
    bootstrapPlexClientConfig,
    clearPlexClientSession,
    detectAndApplyTvUi,
    getSessionToken,
    isAndroidTvUi,
} from './config';
import { installNativeMediaPlayerBridge } from './nativePlayer';
import { useTvRemote } from './useTvRemote';

const ensurePlayerRoute = () => {
    try {
        const path = window.location.pathname || '/';
        if (path === '/' || path === '') {
            window.history.replaceState({}, '', PLAYER_APP_BASE);
        }
    } catch {
        /* ignore */
    }
};

const PlexClientApp: React.FC = () => {
    const [ready, setReady] = useState(false);
    const [authed, setAuthed] = useState(false);
    const [checking, setChecking] = useState(true);
    const [tvReady, setTvReady] = useState(false);

    useTvRemote(ready && tvReady);

    useEffect(() => {
        let cancelled = false;
        const boot = async () => {
            bootstrapPlexClientConfig();
            const tv = await detectAndApplyTvUi();
            if (cancelled) return;
            setTvReady(tv || isAndroidTvUi());
            installNativeMediaPlayerBridge();
            setReady(true);
            const token = getSessionToken();
            if (!token) {
                setChecking(false);
                return;
            }
            try {
                const data = await apiFetch('/api/auth/session');
                if (cancelled) return;
                if (data?.authenticated) {
                    ensurePlayerRoute();
                    setAuthed(true);
                } else clearPlexClientSession();
            } catch {
                if (!cancelled) clearPlexClientSession();
            } finally {
                if (!cancelled) setChecking(false);
            }
        };
        void boot();
        return () => { cancelled = true; };
    }, []);

    const onAuthenticated = useCallback(() => {
        ensurePlayerRoute();
        setAuthed(true);
    }, []);

    if (!ready || checking) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400">
                Loading…
            </div>
        );
    }

    if (!authed) {
        return <PlexClientAuthScreen onAuthenticated={onAuthenticated} />;
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100">
            <MediaPlayerDashboard />
        </div>
    );
};

const container = document.getElementById('root');
if (container) {
    createRoot(container).render(<PlexClientApp />);
}
