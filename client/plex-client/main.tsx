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
} from './config';
import { installNativeMediaPlayerBridge } from './nativePlayer';

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

    useEffect(() => {
        let cancelled = false;
        const boot = async () => {
            bootstrapPlexClientConfig();
            // Await native leanback flag before first paint so density isn't phone-sized.
            await detectAndApplyTvUi();
            if (cancelled) return;
            installNativeMediaPlayerBridge();
            setReady(true);
            // Re-apply after React mounts #root children (transform target must exist).
            requestAnimationFrame(() => {
                if (typeof window.__SMP_APPLY_TV_SCALE__ === 'function') {
                    window.__SMP_APPLY_TV_SCALE__();
                }
            });
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

    useEffect(() => {
        if (!ready) return;
        const id = requestAnimationFrame(() => {
            if (typeof window.__SMP_APPLY_TV_SCALE__ === 'function') {
                window.__SMP_APPLY_TV_SCALE__();
            }
        });
        return () => cancelAnimationFrame(id);
    }, [ready, authed, checking]);

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
