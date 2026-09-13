import React, { useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import { Lock, User, X } from 'lucide-react';

export type PlexHomeProfile = {
    id: string;
    uuid?: string;
    title: string;
    thumb?: string | null;
    restricted?: boolean;
    admin?: boolean;
    protected?: boolean;
};

const isCurrentProfile = (user: PlexHomeProfile, currentUserId?: string | null) => {
    const want = String(currentUserId || '').trim();
    if (!want || !user) return false;
    return [user.id, user.uuid].some((value) => String(value || '').trim() === want);
};

export const PlexHomeSwitchModal: React.FC<{
    open: boolean;
    users: PlexHomeProfile[];
    currentUserId?: string | null;
    busy?: boolean;
    error?: string;
    onSelect: (user: PlexHomeProfile, pin?: string) => void;
    onClose: () => void;
    onViewProfile?: () => void;
}> = ({ open, users, currentUserId, busy, error, onSelect, onClose, onViewProfile }) => {
    const [pinUser, setPinUser] = useState<PlexHomeProfile | null>(null);
    const [pin, setPin] = useState('');

    const profiles = useMemo(
        () => (Array.isArray(users) ? users.filter((user) => user?.id) : []),
        [users],
    );

    if (!open || typeof document === 'undefined') return null;

    const choose = (user: PlexHomeProfile) => {
        if (busy) return;
        if (isCurrentProfile(user, currentUserId)) {
            onClose();
            return;
        }
        if (user.protected) {
            setPinUser(user);
            setPin('');
            return;
        }
        onSelect(user);
    };

    const submitPin = (event?: React.FormEvent) => {
        event?.preventDefault();
        if (!pinUser || busy) return;
        const value = pin.trim();
        if (!value) return;
        onSelect(pinUser, value);
    };

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="plex-home-switch-title">
            <button
                type="button"
                className="absolute inset-0 bg-black/75 backdrop-blur-xl cursor-default"
                aria-label="Close profile switcher"
                onClick={() => { if (!busy) onClose(); }}
            />
            <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
                <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-plex/20 blur-[90px]" />
                <div className="absolute bottom-0 right-0 h-56 w-56 rounded-full bg-amber-500/10 blur-[80px]" />
            </div>

            <div className="relative w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl border border-white/10 bg-[rgb(var(--color-card))]/95 shadow-[0_30px_80px_rgba(0,0,0,0.55)] overflow-hidden animate-fade-in">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-plex/70 to-transparent" />
                <div className="flex items-start justify-between gap-3 px-5 sm:px-8 pt-5 sm:pt-7 pb-2">
                    <div>
                        <p className="text-[11px] font-bold text-plex uppercase tracking-[0.22em] mb-1">Plex Home</p>
                        <h2 id="plex-home-switch-title" className="text-2xl sm:text-3xl font-black text-text tracking-tight">
                            Who&apos;s watching?
                        </h2>
                        <p className="text-sm text-muted mt-1.5 max-w-md">
                            Switch to another profile on this device. PIN-protected profiles need their Home PIN.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => { if (!busy) onClose(); }}
                        className="p-2 rounded-xl text-muted hover:text-text hover:bg-white/5 transition-colors shrink-0"
                        aria-label="Close profile switcher"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="px-5 sm:px-8 pb-6 pt-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                        {profiles.map((user) => {
                            const current = isCurrentProfile(user, currentUserId);
                            return (
                                <button
                                    key={user.id}
                                    type="button"
                                    disabled={busy}
                                    onClick={() => choose(user)}
                                    className={`group relative flex flex-col items-center gap-3 rounded-2xl border px-3 py-5 transition-all duration-200 disabled:opacity-50 ${
                                        current
                                            ? 'border-plex/70 bg-plex/10 shadow-[0_0_32px_rgba(229,160,13,0.18)]'
                                            : 'border-white/10 bg-black/20 hover:border-plex/50 hover:bg-white/5 hover:-translate-y-0.5'
                                    }`}
                                >
                                    {current ? (
                                        <span className="absolute top-2.5 right-2.5 text-[9px] font-black uppercase tracking-[0.14em] text-plex">
                                            Watching
                                        </span>
                                    ) : null}
                                    <span className="relative">
                                        {user.thumb ? (
                                            <img
                                                src={user.thumb}
                                                alt=""
                                                className={`h-[4.5rem] w-[4.5rem] sm:h-24 sm:w-24 rounded-full object-cover border-2 transition ${
                                                    current ? 'border-plex shadow-[0_0_0_4px_rgba(229,160,13,0.2)]' : 'border-white/15 group-hover:border-plex/70'
                                                }`}
                                            />
                                        ) : (
                                            <span className={`flex h-[4.5rem] w-[4.5rem] sm:h-24 sm:w-24 items-center justify-center rounded-full border-2 bg-black/40 text-muted ${
                                                current ? 'border-plex' : 'border-white/15 group-hover:border-plex/70'
                                            }`}>
                                                <User className="h-8 w-8" />
                                            </span>
                                        )}
                                        {user.protected ? (
                                            <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-black/85 text-muted">
                                                <Lock className="h-3.5 w-3.5" />
                                            </span>
                                        ) : null}
                                    </span>
                                    <span className="text-sm font-bold text-text line-clamp-2">{user.title}</span>
                                </button>
                            );
                        })}
                    </div>

                    {pinUser ? (
                        <form
                            onSubmit={submitPin}
                            className="mt-5 rounded-2xl border border-plex/30 bg-black/35 p-4 sm:p-5"
                        >
                            <p className="text-sm font-bold text-text mb-1">Enter PIN for {pinUser.title}</p>
                            <p className="text-xs text-muted mb-3">This is the Plex Home PIN for that profile, not your plex.tv password.</p>
                            <input
                                type="password"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                value={pin}
                                onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 8))}
                                className="w-full bg-black/25 border border-white/15 rounded-xl px-4 py-3 text-center text-lg tracking-[0.4em] text-text outline-none focus:border-plex/70 focus:ring-2 focus:ring-plex/20"
                                placeholder="••••"
                                autoFocus
                                disabled={busy}
                            />
                            <div className="mt-3 flex gap-2">
                                <button
                                    type="button"
                                    className="flex-1 rounded-xl border border-white/10 px-3 py-2.5 text-xs font-bold text-muted hover:text-text"
                                    onClick={() => { setPinUser(null); setPin(''); }}
                                    disabled={busy}
                                >
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 rounded-xl bg-plex px-3 py-2.5 text-xs font-bold text-background disabled:opacity-40"
                                    disabled={busy || pin.trim().length < 4}
                                >
                                    Switch profile
                                </button>
                            </div>
                        </form>
                    ) : null}

                    {error ? (
                        <p className="mt-4 text-sm text-red-300">{error}</p>
                    ) : null}

                    <div className="mt-6 flex items-center justify-center gap-4">
                        {onViewProfile ? (
                            <button
                                type="button"
                                className="text-xs font-bold text-muted hover:text-text transition"
                                onClick={onViewProfile}
                                disabled={busy}
                            >
                                View profile
                            </button>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>,
        document.body,
    );
};
