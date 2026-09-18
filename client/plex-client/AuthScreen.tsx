import React, { useCallback, useEffect, useRef, useState } from 'react';
import { apiFetch } from '../shared/api';
import {
    clearPlexClientPortal,
    getPortalBaseUrl,
    isAndroidTvUi,
    normalizePortalBaseUrl,
    writeStoredPortalBaseUrl,
    writeStoredSessionToken,
} from './config';

type Props = {
    onAuthenticated: () => void;
};

type PinSession = {
    pinId: string;
    code: string;
    oauthState: string;
    clientId: string;
};

type HomeUser = {
    id: string;
    title?: string;
    username?: string;
    thumb?: string | null;
    protected?: boolean;
};

const LINK_URL = 'https://plex.tv/link';

export const PlexClientAuthScreen: React.FC<Props> = ({ onAuthenticated }) => {
    const [portalUrl, setPortalUrl] = useState(getPortalBaseUrl());
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [pin, setPin] = useState<PinSession | null>(null);
    const [checkingPortal, setCheckingPortal] = useState(false);
    const [homeUsers, setHomeUsers] = useState<HomeUser[] | null>(null);
    const [homeSelectToken, setHomeSelectToken] = useState('');
    const [homePin, setHomePin] = useState('');
    const [selectedHomeUserId, setSelectedHomeUserId] = useState<string | null>(null);
    const pollRef = useRef<number | null>(null);
    const isTv = isAndroidTvUi();

    const stopPoll = useCallback(() => {
        if (pollRef.current != null) {
            window.clearInterval(pollRef.current);
            pollRef.current = null;
        }
    }, []);

    useEffect(() => () => stopPoll(), [stopPoll]);

    const finishWithToken = useCallback((sessionToken: string) => {
        writeStoredSessionToken(sessionToken);
        stopPoll();
        setPin(null);
        setHomeUsers(null);
        setHomeSelectToken('');
        onAuthenticated();
    }, [onAuthenticated, stopPoll]);

    const pollCallback = useCallback(async (session: PinSession) => {
        try {
            const data = await apiFetch('/api/auth/plex/callback', {
                method: 'POST',
                body: JSON.stringify({
                    pinId: session.pinId,
                    oauthState: session.oauthState,
                }),
            });
            if (data?.pending) return;
            if (data?.sessionToken) {
                finishWithToken(String(data.sessionToken));
                return;
            }
            if (data?.needsHomeSelect && Array.isArray(data.users)) {
                stopPoll();
                setPin(null);
                setBusy(false);
                setHomeUsers(data.users);
                setHomeSelectToken(String(data.homeSelectToken || ''));
                setSelectedHomeUserId(String(data.rememberUserId || data.users[0]?.id || '') || null);
                setError('');
                return;
            }
        } catch (err: any) {
            const message = String(err?.message || '');
            if (/Waiting for Plex|sign-in did not complete|CSRF/i.test(message)) return;
            setError(message || 'Login failed');
            stopPoll();
            setBusy(false);
        }
    }, [finishWithToken, stopPoll]);

    const applyPortalUrl = (raw: string) => {
        const normalized = normalizePortalBaseUrl(raw);
        if (!normalized.ok) {
            setError(normalized.error);
            return null;
        }
        writeStoredPortalBaseUrl(normalized.url);
        setPortalUrl(normalized.url);
        return normalized.url;
    };

    const startPinLogin = async () => {
        setError('');
        setBusy(true);
        stopPoll();
        setPin(null);
        setHomeUsers(null);
        setHomeSelectToken('');
        setHomePin('');

        const url = applyPortalUrl(portalUrl);
        if (!url) {
            setBusy(false);
            return;
        }

        setCheckingPortal(true);
        try {
            const diagnostics = await apiFetch('/api/auth/diagnostics').catch(() => null);
            if (!diagnostics || diagnostics.configured === undefined) {
                throw new Error('Could not reach a Server Manager Portal at that URL. Check the address and that the portal is online.');
            }
        } catch (err: any) {
            setError(err?.message || 'Portal not reachable');
            setBusy(false);
            setCheckingPortal(false);
            return;
        } finally {
            setCheckingPortal(false);
        }

        try {
            const data = await apiFetch('/api/auth/plex/login', {
                method: 'POST',
                body: JSON.stringify({ skipHomeRemember: true, linkCode: true }),
            });
            const rawCode = String(data.code || '').trim();
            const session: PinSession = {
                pinId: String(data.id),
                code: rawCode.toUpperCase(),
                oauthState: String(data.oauthState || ''),
                clientId: String(data.clientIdentifier || data.clientId || ''),
            };
            if (!session.pinId || !session.oauthState) {
                throw new Error('Portal did not return a PIN session (update SMP if this persists).');
            }
            if (session.code.length > 6) {
                throw new Error('Portal returned a long auth code. Update SMP to a build that supports linkCode PINs.');
            }
            setPin(session);

            if (!isTv) {
                try {
                    window.open(LINK_URL, '_blank', 'noopener,noreferrer');
                } catch {
                    /* restricted WebView */
                }
            }

            pollRef.current = window.setInterval(() => {
                void pollCallback(session);
            }, 2000);
            void pollCallback(session);
        } catch (err: any) {
            setError(err?.message || 'Failed to start Plex login');
            setBusy(false);
        }
    };

    const confirmHomeUser = async () => {
        if (!selectedHomeUserId) {
            setError('Select a Plex Home profile');
            return;
        }
        if (!homeSelectToken) {
            setError('Home selection expired. Start sign-in again.');
            return;
        }
        setBusy(true);
        setError('');
        try {
            const data = await apiFetch('/api/auth/plex/home-switch', {
                method: 'POST',
                body: JSON.stringify({
                    userId: selectedHomeUserId,
                    homeSelectToken,
                    remember: false,
                    ...(homePin.trim() ? { pin: homePin.trim() } : {}),
                }),
            });
            if (data?.sessionToken) {
                finishWithToken(String(data.sessionToken));
                return;
            }
            throw new Error('Portal did not return a session token');
        } catch (err: any) {
            setError(err?.message || 'Could not switch Plex Home profile');
            setBusy(false);
        }
    };

    const changePortal = () => {
        stopPoll();
        setPin(null);
        setHomeUsers(null);
        setHomeSelectToken('');
        setBusy(false);
        setError('');
        clearPlexClientPortal();
        setPortalUrl('');
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-6 text-zinc-100">
            <div className="w-full max-w-md space-y-6">
                <div className="space-y-2 text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-500/90">Server Manager Portal</p>
                    <h1 className="text-3xl font-semibold tracking-tight">Media Player</h1>
                    <p className="text-sm text-zinc-400">
                        Connect to <span className="text-zinc-200">your</span> portal, then sign in with Plex.
                        Works with any SMP install.
                    </p>
                </div>

                {!homeUsers ? (
                    <label className="block space-y-2">
                        <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">Your portal URL</span>
                        <input
                            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-base outline-none focus:border-amber-500"
                            value={portalUrl}
                            onChange={(e) => setPortalUrl(e.target.value)}
                            placeholder="https://portal.example.com"
                            autoCapitalize="off"
                            autoCorrect="off"
                            spellCheck={false}
                            inputMode="url"
                            disabled={busy && !!pin}
                        />
                        <span className="block text-xs text-zinc-500">
                            Ask your server admin for the portal address if you do not host SMP yourself.
                        </span>
                    </label>
                ) : null}

                {pin ? (
                    <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 text-center">
                        <p className="text-sm text-zinc-400">On your phone or computer, open</p>
                        <p className="text-lg font-medium text-amber-400">{LINK_URL}</p>
                        <p className="font-mono text-6xl font-bold tracking-[0.4em] text-white">{pin.code}</p>
                        <p className="text-xs text-zinc-500">Enter this 4-character code, then return here</p>
                    </div>
                ) : null}

                {homeUsers ? (
                    <div className="space-y-4">
                        <p className="text-center text-sm text-zinc-400">Choose a Plex Home profile</p>
                        <div className="max-h-[40vh] space-y-2 overflow-y-auto">
                            {homeUsers.map((user) => {
                                const active = selectedHomeUserId === String(user.id);
                                const label = user.title || user.username || user.id;
                                return (
                                    <button
                                        key={user.id}
                                        type="button"
                                        onClick={() => setSelectedHomeUserId(String(user.id))}
                                        className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                                            active
                                                ? 'border-amber-500 bg-amber-500/10'
                                                : 'border-zinc-800 bg-zinc-900/80 hover:border-zinc-600'
                                        }`}
                                    >
                                        {user.thumb ? (
                                            <img src={user.thumb} alt="" className="h-10 w-10 rounded-full object-cover" />
                                        ) : (
                                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 text-sm font-bold">
                                                {String(label).charAt(0).toUpperCase()}
                                            </span>
                                        )}
                                        <span className="min-w-0 flex-1 truncate font-medium">{label}</span>
                                        {user.protected ? (
                                            <span className="text-[10px] uppercase tracking-wider text-zinc-500">PIN</span>
                                        ) : null}
                                    </button>
                                );
                            })}
                        </div>
                        <label className="block space-y-2">
                            <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">Profile PIN (if required)</span>
                            <input
                                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-base outline-none focus:border-amber-500"
                                value={homePin}
                                onChange={(e) => setHomePin(e.target.value)}
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                placeholder="Optional"
                            />
                        </label>
                    </div>
                ) : null}

                {error ? (
                    <p className="rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-200" role="alert">
                        {error}
                    </p>
                ) : null}

                {homeUsers ? (
                    <button
                        type="button"
                        className="w-full rounded-lg bg-amber-500 px-4 py-3 text-base font-semibold text-zinc-950 hover:bg-amber-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 disabled:opacity-60"
                        onClick={() => void confirmHomeUser()}
                        disabled={busy}
                    >
                        {busy ? 'Signing in…' : 'Continue'}
                    </button>
                ) : (
                    <button
                        type="button"
                        className="w-full rounded-lg bg-amber-500 px-4 py-3 text-base font-semibold text-zinc-950 hover:bg-amber-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 disabled:opacity-60"
                        onClick={() => void startPinLogin()}
                        disabled={busy && !!pin}
                    >
                        {checkingPortal ? 'Checking portal…' : pin ? 'Waiting…' : 'Continue with Plex'}
                    </button>
                )}

                {(pin || homeUsers || getPortalBaseUrl()) ? (
                    <button
                        type="button"
                        className="w-full text-center text-sm text-zinc-500 underline-offset-2 hover:text-zinc-300 hover:underline"
                        onClick={changePortal}
                    >
                        Use a different portal
                    </button>
                ) : null}
            </div>
        </div>
    );
};
