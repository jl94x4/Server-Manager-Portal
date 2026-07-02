import React, { useState, useEffect } from 'react';
import {
    Settings, Sparkles, ChevronRight, ChevronLeft, Check, Palette, Mail, Layers, Server, PartyPopper,
} from 'lucide-react';
import { apiFetch } from '../shared/api';
import { IntegrationTestButton } from '../shared/IntegrationTestButton';
import { CustomSelect } from '../shared/ui';
import type { PlexServer } from '../shared/types';

const STEPS = [
    { id: 'welcome', label: 'Welcome', icon: Sparkles, hint: 'Overview & what to expect' },
    { id: 'plex', label: 'Plex', icon: Server, hint: 'Connect your media server' },
    { id: 'branding', label: 'Branding', icon: Palette, hint: 'Colors, logo & domain' },
    { id: 'email', label: 'Email', icon: Mail, hint: 'SMTP alerts & newsletters' },
    { id: 'integrations', label: 'Integrations', icon: Layers, hint: 'Sonarr, Radarr & more' },
    { id: 'finish', label: 'Finish', icon: PartyPopper, hint: 'Review & launch' },
] as const;

type StepId = (typeof STEPS)[number]['id'];

const WELCOME_FEATURES = [
    { icon: Server, title: 'Plex OAuth', desc: 'Secure sign-in as server owner' },
    { icon: Palette, title: 'Your Brand', desc: 'Custom colors, logo & domain' },
    { icon: Mail, title: 'Email Alerts', desc: 'Expiry reminders & newsletters' },
    { icon: Layers, title: 'Media Stack', desc: 'Sonarr, Radarr, Tautulli & requests' },
] as const;

const SETUP_PLEX_STORAGE_KEY = 'setupWizardPlex';

const REQUEST_APP_OPTIONS = [
    { label: 'Disabled', value: 'none' },
    { label: 'Overseerr', value: 'overseerr' },
    { label: 'Jellyseerr', value: 'jellyseerr' },
    { label: 'Ombi', value: 'ombi' },
];

const readStoredSetupPlex = () => {
    try {
        const raw = sessionStorage.getItem(SETUP_PLEX_STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw) as {
            token?: string;
            servers?: PlexServer[];
            serverIdentifier?: string;
            plexServerUrl?: string;
            username?: string;
            step?: StepId;
        };
    } catch {
        return null;
    }
};

export const SetupWizard: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    const storedPlex = readStoredSetupPlex();
    const isOAuthReturn = typeof window !== 'undefined' && window.location.pathname.startsWith('/auth/setup/');

    const [step, setStep] = useState<StepId>(() => {
        if (isOAuthReturn) return 'plex';
        if (storedPlex?.step) return storedPlex.step;
        if (storedPlex?.token) return 'plex';
        return 'welcome';
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [token, setToken] = useState(storedPlex?.token || '');
    const [serverIdentifier, setServerIdentifier] = useState(storedPlex?.serverIdentifier || '');
    const [plexServerUrl, setPlexServerUrl] = useState(storedPlex?.plexServerUrl || '');
    const [servers, setServers] = useState<PlexServer[]>(storedPlex?.servers || []);
    const [plexUsername, setPlexUsername] = useState(storedPlex?.username || '');
    const [showManualToken, setShowManualToken] = useState(false);

    const [publicDomain, setPublicDomain] = useState(typeof window !== 'undefined' ? window.location.origin : '');
    const [primaryColor, setPrimaryColor] = useState('#E5A00D');
    const [customLogoUrl, setCustomLogoUrl] = useState('');

    const [smtpHost, setSmtpHost] = useState('');
    const [smtpPort, setSmtpPort] = useState(587);
    const [smtpUser, setSmtpUser] = useState('');
    const [smtpPass, setSmtpPass] = useState('');
    const [smtpFrom, setSmtpFrom] = useState('');
    const [smtpSecure, setSmtpSecure] = useState(false);
    const [testRecipient, setTestRecipient] = useState('');

    const [sonarrUrl, setSonarrUrl] = useState('');
    const [sonarrApiKey, setSonarrApiKey] = useState('');
    const [radarrUrl, setRadarrUrl] = useState('');
    const [radarrApiKey, setRadarrApiKey] = useState('');
    const [tautulliUrl, setTautulliUrl] = useState('');
    const [tautulliApiKey, setTautulliApiKey] = useState('');
    const [requestAppType, setRequestAppType] = useState('none');
    const [requestAppUrl, setRequestAppUrl] = useState('');
    const [requestAppApiKey, setRequestAppApiKey] = useState('');

    const stepIndex = STEPS.findIndex((s) => s.id === step);
    const canGoNext = step !== 'plex' || (token && serverIdentifier);

    const persistSetupPlex = (patch: Partial<ReturnType<typeof readStoredSetupPlex>>) => {
        const next = {
            token,
            servers,
            serverIdentifier,
            plexServerUrl,
            username: plexUsername,
            step,
            ...patch,
        };
        sessionStorage.setItem(SETUP_PLEX_STORAGE_KEY, JSON.stringify(next));
    };

    useEffect(() => {
        const path = window.location.pathname;
        if (!path.startsWith('/auth/setup/')) return;

        const pinId = path.split('/').filter(Boolean).pop();
        if (!pinId || pinId === 'setup') return;

        const returnPath = sessionStorage.getItem('setupReturnPath') || '/';

        setIsLoading(true);
        setError('');
        setStep('plex');

        apiFetch('/api/setup/plex/callback', {
            method: 'POST',
            body: JSON.stringify({ pinId }),
        }).then((data) => {
            const next = {
                token: data.token,
                servers: data.servers || [],
                serverIdentifier: data.servers?.[0]?.identifier || '',
                username: data.username || '',
                step: 'plex' as StepId,
            };
            sessionStorage.setItem(SETUP_PLEX_STORAGE_KEY, JSON.stringify(next));
            setToken(next.token);
            setServers(next.servers);
            setPlexUsername(next.username);
            setServerIdentifier(next.serverIdentifier);
        }).catch((e) => {
            setError(e instanceof Error ? e.message : 'Plex sign-in failed');
        }).finally(() => {
            sessionStorage.removeItem('setupReturnPath');
            window.history.replaceState({}, '', returnPath);
            setIsLoading(false);
        });
    }, []);

    const handlePlexSignIn = async () => {
        setIsLoading(true);
        setError('');
        try {
            sessionStorage.setItem('setupReturnPath', window.location.pathname + window.location.search);
            sessionStorage.setItem(SETUP_PLEX_STORAGE_KEY, JSON.stringify({ step: 'plex' }));
            const data = await apiFetch('/api/auth/plex/login', { method: 'POST' });
            const clientId = data.clientIdentifier || data.clientId || '';
            const forwardUrl = `${window.location.origin}/auth/setup/${data.id}`;
            const authUrl = `https://app.plex.tv/auth#?clientID=${encodeURIComponent(clientId)}&code=${data.code}&context[device][product]=Server%20Manager%20Portal&forwardUrl=${encodeURIComponent(forwardUrl)}`;
            window.location.href = authUrl;
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to start Plex sign-in');
            setIsLoading(false);
        }
    };

    const handleFetchServers = async () => {
        if (!token) {
            setError('Please enter a Plex token first.');
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            const foundServers = await apiFetch('/api/plex/servers', {
                method: 'POST',
                body: JSON.stringify({ token: token.trim(), plexServerUrl: plexServerUrl || undefined }),
            });
            setServers(foundServers);
            if (foundServers.length > 0) {
                setServerIdentifier(foundServers[0].identifier);
            } else {
                setError('No owned servers found for this token.');
                setServerIdentifier('');
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to fetch servers.');
            setServers([]);
            setServerIdentifier('');
        } finally {
            setIsLoading(false);
        }
    };

    const handleTestEmail = async () => {
        if (!smtpHost || !smtpUser || !smtpPass || !testRecipient) {
            setError('Fill in SMTP host, user, password, and test recipient.');
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            await apiFetch('/api/config/test-email', {
                method: 'POST',
                body: JSON.stringify({ smtpHost, smtpPort, smtpUser, smtpPass, smtpFrom, smtpSecure, testRecipient }),
            });
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Test email failed.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleComplete = async () => {
        setIsLoading(true);
        setError('');
        try {
            await apiFetch('/api/config', {
                method: 'POST',
                body: JSON.stringify({
                    token: token.trim(),
                    serverIdentifier: serverIdentifier.trim(),
                    plexServerUrl: plexServerUrl || undefined,
                    publicDomain,
                    primaryColor,
                    customLogoUrl,
                    smtpHost,
                    smtpPort,
                    smtpUser,
                    smtpPass,
                    smtpFrom,
                    smtpSecure,
                    sonarrUrl,
                    sonarrApiKey,
                    radarrUrl,
                    radarrApiKey,
                    tautulliUrl,
                    tautulliApiKey,
                    requestAppType,
                    requestAppUrl,
                    requestAppApiKey,
                }),
            });
            sessionStorage.removeItem(SETUP_PLEX_STORAGE_KEY);
            sessionStorage.removeItem('setupReturnPath');
            onComplete();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to save configuration.');
            setIsLoading(false);
        }
    };

    const goNext = () => {
        if (stepIndex < STEPS.length - 1) {
            const nextStep = STEPS[stepIndex + 1].id;
            setStep(nextStep);
            if (token) persistSetupPlex({ step: nextStep });
        }
    };
    const goBack = () => {
        if (stepIndex > 0) setStep(STEPS[stepIndex - 1].id);
    };

    const progressPct = Math.round(((stepIndex + 1) / STEPS.length) * 100);
    const inputClass = 'w-full px-4 py-3.5 rounded-xl bg-background/70 border border-white/10 text-text placeholder:text-muted/40 focus:border-plex/50 focus:ring-2 focus:ring-plex/15 outline-none transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]';
    const labelClass = 'text-[11px] font-bold text-muted uppercase tracking-[0.14em]';
    const primaryBtnClass = 'inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-plex to-amber-500 text-background shadow-[0_8px_28px_rgba(229,160,13,0.35)] hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none';
    const sectionCardClass = 'rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-transparent p-5 md:p-6';

    const renderStepNav = (compact = false) => (
        STEPS.map((s, i) => {
            const Icon = s.icon;
            const active = s.id === step;
            const done = i < stepIndex;
            return (
                <div
                    key={s.id}
                    className={`flex items-start gap-3 rounded-xl transition-all duration-300 ${compact ? 'flex-shrink-0 px-3 py-2' : 'p-3'} ${active ? 'bg-plex/10 border border-plex/25 shadow-[0_0_24px_rgba(229,160,13,0.12)]' : done ? 'opacity-90' : 'opacity-50'}`}
                >
                    <div className={`flex-shrink-0 rounded-full flex items-center justify-center border-2 transition-all ${compact ? 'w-8 h-8' : 'w-10 h-10'} ${active ? 'border-plex bg-plex/20 text-plex shadow-[0_0_18px_rgba(229,160,13,0.35)]' : done ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' : 'border-white/10 bg-white/5 text-muted'}`}>
                        {done ? <Check className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} /> : <Icon className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />}
                    </div>
                    {!compact && (
                        <div className="min-w-0 pt-0.5">
                            <p className={`text-sm font-bold leading-tight ${active ? 'text-text' : done ? 'text-emerald-400/90' : 'text-muted'}`}>{s.label}</p>
                            <p className="text-xs text-muted/80 mt-0.5 leading-snug">{s.hint}</p>
                        </div>
                    )}
                    {compact && (
                        <span className={`text-xs font-bold whitespace-nowrap ${active ? 'text-plex' : done ? 'text-emerald-400' : 'text-muted'}`}>{s.label}</span>
                    )}
                </div>
            );
        })
    );

    return (
        <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-10 overflow-hidden">
            {/* Ambient background */}
            <div className="pointer-events-none absolute inset-0 bg-background">
                <div className="absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full bg-plex/10 blur-[120px]" />
                <div className="absolute top-1/3 -right-24 w-[480px] h-[480px] rounded-full bg-amber-500/8 blur-[100px]" />
                <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full bg-plex/5 blur-[90px]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(229,160,13,0.12),transparent)]" />
                <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
            </div>

            <div className="relative z-10 w-full max-w-6xl">
                <div className="rounded-3xl border border-white/10 bg-card/75 backdrop-blur-2xl shadow-[0_32px_100px_-16px_rgba(0,0,0,0.65)] overflow-hidden flex flex-col lg:flex-row min-h-[min(720px,calc(100vh-3rem))]">
                    {/* Sidebar stepper — desktop */}
                    <aside className="hidden lg:flex flex-col w-[320px] xl:w-[360px] flex-shrink-0 border-r border-white/10 bg-gradient-to-b from-plex/[0.08] via-plex/[0.03] to-transparent p-8">
                        <div className="mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-plex/15 border border-plex/30 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(229,160,13,0.2)]">
                                <Settings className="w-6 h-6 text-plex" />
                            </div>
                            <h1 className="text-xl font-black text-text tracking-tight leading-tight">Server Manager Portal</h1>
                            <p className="text-[11px] font-bold text-muted uppercase tracking-[0.2em] mt-2">Initial Setup</p>
                        </div>

                        <nav className="flex-1 space-y-1.5">{renderStepNav()}</nav>

                        <div className="mt-8 pt-6 border-t border-white/10">
                            <div className="flex justify-between text-xs font-semibold text-muted mb-2.5">
                                <span>Setup progress</span>
                                <span className="text-plex">{progressPct}%</span>
                            </div>
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                <div
                                    className="h-full bg-gradient-to-r from-plex via-amber-400 to-orange-500 rounded-full transition-all duration-500 ease-out shadow-[0_0_12px_rgba(229,160,13,0.5)]"
                                    style={{ width: `${progressPct}%` }}
                                />
                            </div>
                            <p className="text-[11px] text-muted/70 mt-3">Step {stepIndex + 1} of {STEPS.length}</p>
                        </div>
                    </aside>

                    {/* Main panel */}
                    <div className="flex-1 flex flex-col min-h-0 min-w-0">
                        {/* Mobile / tablet step strip */}
                        <div className="lg:hidden border-b border-white/10 bg-black/20 px-4 py-4 overflow-x-auto">
                            <div className="flex items-center gap-2 min-w-max">{renderStepNav(true)}</div>
                            <div className="mt-3 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-plex to-amber-400 transition-all duration-500" style={{ width: `${progressPct}%` }} />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 sm:p-8 lg:p-10 xl:p-12">
                            {error && (
                                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 mb-6 text-sm flex items-start gap-3">
                                    <span className="text-red-400 flex-shrink-0 mt-0.5">⚠</span>
                                    <span>{error}</span>
                                </div>
                            )}

                            {step === 'welcome' && (
                                <div>
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-plex/10 border border-plex/25 text-plex text-[11px] font-bold uppercase tracking-widest mb-5">
                                        <Sparkles className="w-3.5 h-3.5" /> First-time setup
                                    </div>
                                    <h2 className="text-3xl sm:text-4xl font-black text-text tracking-tight mb-3 leading-tight">
                                        Welcome to your<br className="hidden sm:block" /> media portal
                                    </h2>
                                    <p className="text-muted text-base sm:text-lg leading-relaxed mb-8 max-w-xl">
                                        A guided setup to connect Plex, brand your portal, and optionally wire up email and your media stack. Takes about five minutes.
                                    </p>
                                    <div className="grid sm:grid-cols-2 gap-3 mb-2">
                                        {WELCOME_FEATURES.map(({ icon: Icon, title, desc }) => (
                                            <div key={title} className={`${sectionCardClass} flex gap-3.5 items-start hover:border-plex/20 transition-colors`}>
                                                <div className="w-11 h-11 rounded-xl bg-plex/10 border border-plex/20 flex items-center justify-center flex-shrink-0">
                                                    <Icon className="w-5 h-5 text-plex" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-text text-sm">{title}</p>
                                                    <p className="text-xs text-muted mt-1 leading-relaxed">{desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                    {step === 'plex' && (
                        <div className="flex flex-col gap-6 max-w-2xl">
                            <div>
                                <p className={labelClass + ' mb-2'}>Step {stepIndex + 1}</p>
                                <h2 className="text-2xl sm:text-3xl font-black text-text tracking-tight mb-2">Plex Connection</h2>
                                <p className="text-muted text-sm sm:text-base leading-relaxed">Sign in with your Plex account as the <strong className="text-text font-semibold">server owner</strong> to connect your library.</p>
                            </div>

                            {!token ? (
                                <div className={`${sectionCardClass} flex flex-col gap-4`}>
                                    <button
                                        type="button"
                                        onClick={handlePlexSignIn}
                                        disabled={isLoading}
                                        className={`${primaryBtnClass} w-full sm:w-auto text-base py-4`}
                                    >
                                        <img src="/static/logo.png" alt="" className="w-5 h-5 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                        {isLoading ? 'Redirecting to Plex…' : 'Sign in with Plex'}
                                    </button>
                                    <p className="text-xs text-muted leading-relaxed">Uses secure Plex OAuth — we&apos;ll fetch your owned servers automatically. No password stored.</p>
                                </div>
                            ) : (
                                <div className="p-4 sm:p-5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                                    <div className="w-11 h-11 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                                        <Check className="w-5 h-5 text-emerald-400" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-emerald-400 font-bold">Signed in as {plexUsername || 'Plex User'}</p>
                                        <p className="text-muted text-sm mt-0.5">{servers.length} owned server{servers.length !== 1 ? 's' : ''} found</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setToken('');
                                            setServers([]);
                                            setServerIdentifier('');
                                            setPlexUsername('');
                                            sessionStorage.removeItem(SETUP_PLEX_STORAGE_KEY);
                                        }}
                                        className="text-xs font-semibold text-muted hover:text-text px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors flex-shrink-0"
                                    >
                                        Sign out
                                    </button>
                                </div>
                            )}

                            {servers.length > 0 ? (
                                <div className="flex flex-col gap-2.5">
                                    <label className={labelClass}>Select Server</label>
                                    <CustomSelect value={serverIdentifier} onChange={setServerIdentifier} options={servers.map((s) => ({ label: `${s.name} (${s.identifier})`, value: s.identifier }))} />
                                </div>
                            ) : token ? (
                                <div className={`${sectionCardClass} flex flex-col gap-4`}>
                                    <div className="flex flex-col gap-2.5">
                                        <label className={labelClass}>Server Identifier</label>
                                        <input type="text" className={inputClass} value={serverIdentifier} onChange={(e) => setServerIdentifier(e.target.value)} placeholder="No servers returned — enter identifier manually" />
                                    </div>
                                    <div className="text-xs text-muted p-4 rounded-xl bg-background/50 border border-white/5 space-y-1.5 leading-relaxed">
                                        <p className="font-semibold text-text">How to find Server Identifier manually:</p>
                                        <p>1) Open: <code className="bg-background px-1.5 py-0.5 rounded text-plex/90">http://YOUR_PLEX_IP:32400/identity?X-Plex-Token=YOUR_TOKEN</code></p>
                                        <p>2) Copy <code className="bg-background px-1.5 py-0.5 rounded">machineIdentifier</code> from the response.</p>
                                    </div>
                                </div>
                            ) : null}

                            <div className="flex flex-col gap-2.5">
                                <label className={labelClass}>
                                    Direct Plex URL <span className="text-muted/70 font-normal normal-case tracking-normal">(required in Docker)</span>
                                </label>
                                <input
                                    type="url"
                                    className={inputClass}
                                    value={plexServerUrl}
                                    onChange={(e) => setPlexServerUrl(e.target.value)}
                                    placeholder="http://192.168.1.6:32400"
                                />
                                <p className="text-xs text-muted leading-relaxed">Your Plex server&apos;s LAN address. Required when Plex.tv discovery fails from inside the container.</p>
                            </div>

                            <IntegrationTestButton
                                type="plex"
                                payload={{ token, serverIdentifier, plexServerUrl: plexServerUrl || undefined }}
                                disabled={!token || !serverIdentifier}
                            />

                            <div className="border-t border-white/10 pt-5">
                                <button
                                    type="button"
                                    onClick={() => setShowManualToken(!showManualToken)}
                                    className="text-sm font-semibold text-muted hover:text-plex transition-colors"
                                >
                                    {showManualToken ? '▾ Hide manual token entry' : '▸ Enter Plex token manually'}
                                </button>
                                {showManualToken && (
                                    <div className={`${sectionCardClass} mt-4 flex flex-col gap-4`}>
                                        <div className="p-4 bg-plex/5 border border-plex/20 rounded-xl text-sm text-muted leading-relaxed">
                                            <strong className="text-plex">Tip:</strong> Log into Plex Web, open any library item XML, and find <code className="bg-background px-1.5 py-0.5 rounded">X-Plex-Token=...</code> in the URL.
                                        </div>
                                        <div className="flex flex-col gap-2.5">
                                            <label className={labelClass}>Plex Token</label>
                                            <div className="flex flex-col sm:flex-row gap-2">
                                                <input type="password" className={inputClass} value={token} onChange={(e) => setToken(e.target.value)} placeholder="X-Plex-Token" />
                                                <button type="button" onClick={handleFetchServers} disabled={isLoading || !token} className="px-5 py-3.5 bg-plex/15 text-plex border border-plex/30 rounded-xl font-bold hover:bg-plex/25 whitespace-nowrap transition-colors disabled:opacity-50">
                                                    Fetch Servers
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {step === 'branding' && (
                        <div className="flex flex-col gap-6 max-w-2xl">
                            <div>
                                <p className={labelClass + ' mb-2'}>Step {stepIndex + 1}</p>
                                <h2 className="text-2xl sm:text-3xl font-black text-text tracking-tight mb-2">Portal Branding</h2>
                                <p className="text-muted text-sm sm:text-base">How your portal looks to users. You can change these anytime in Settings.</p>
                            </div>
                            <div className={`${sectionCardClass} flex flex-col gap-5`}>
                                <div className="flex flex-col gap-2.5">
                                    <label className={labelClass}>Public Domain / URL</label>
                                    <input type="text" className={inputClass} value={publicDomain} onChange={(e) => setPublicDomain(e.target.value)} placeholder="https://portal.yourdomain.com" />
                                </div>
                                <div className="flex flex-col gap-2.5">
                                    <label className={labelClass}>Primary Color</label>
                                    <div className="flex gap-3 items-center">
                                        <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-14 h-14 rounded-xl border border-white/10 cursor-pointer bg-transparent flex-shrink-0" />
                                        <input type="text" className={inputClass} value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} placeholder="#E5A00D" />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2.5">
                                    <label className={labelClass}>Custom Logo URL (optional)</label>
                                    <input type="text" className={inputClass} value={customLogoUrl} onChange={(e) => setCustomLogoUrl(e.target.value)} placeholder="https://… or /static/logo.png" />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'email' && (
                        <div className="flex flex-col gap-6 max-w-2xl">
                            <div>
                                <p className={labelClass + ' mb-2'}>Step {stepIndex + 1}</p>
                                <h2 className="text-2xl sm:text-3xl font-black text-text tracking-tight mb-2">Email Notifications</h2>
                                <p className="text-muted text-sm sm:text-base">Optional — send expiry reminders and newsletters. Skip if you&apos;ll configure later.</p>
                            </div>
                            <div className={`${sectionCardClass} grid grid-cols-1 md:grid-cols-2 gap-5`}>
                                <div className="flex flex-col gap-2.5 md:col-span-2">
                                    <label className={labelClass}>SMTP Host</label>
                                    <input type="text" className={inputClass} value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} placeholder="smtp.mailgun.org" />
                                </div>
                                <div className="flex flex-col gap-2.5">
                                    <label className={labelClass}>Port</label>
                                    <input type="number" className={inputClass} value={smtpPort} onChange={(e) => setSmtpPort(Number(e.target.value))} />
                                </div>
                                <div className="flex flex-col gap-2.5">
                                    <label className={labelClass}>Secure (TLS)</label>
                                    <label className="flex items-center gap-3 cursor-pointer mt-1 p-3.5 rounded-xl bg-background/50 border border-white/5">
                                        <input type="checkbox" checked={smtpSecure} onChange={(e) => setSmtpSecure(e.target.checked)} className="w-4 h-4 accent-plex" />
                                        <span className="text-sm text-text font-medium">Use SSL/TLS</span>
                                    </label>
                                </div>
                                <div className="flex flex-col gap-2.5">
                                    <label className={labelClass}>SMTP User</label>
                                    <input type="text" className={inputClass} value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} />
                                </div>
                                <div className="flex flex-col gap-2.5">
                                    <label className={labelClass}>SMTP Password</label>
                                    <input type="password" className={inputClass} value={smtpPass} onChange={(e) => setSmtpPass(e.target.value)} />
                                </div>
                                <div className="flex flex-col gap-2.5 md:col-span-2">
                                    <label className={labelClass}>From Address</label>
                                    <input type="text" className={inputClass} value={smtpFrom} onChange={(e) => setSmtpFrom(e.target.value)} placeholder="Plex Server &lt;noreply@domain.com&gt;" />
                                </div>
                            </div>
                            {smtpHost && smtpUser && smtpPass && (
                                <div className={`${sectionCardClass} flex flex-col gap-3`}>
                                    <label className={labelClass}>Send Test Email</label>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <input type="email" className={inputClass} value={testRecipient} onChange={(e) => setTestRecipient(e.target.value)} placeholder="you@example.com" />
                                        <button type="button" onClick={handleTestEmail} disabled={isLoading} className="px-5 py-3.5 bg-white/5 border border-white/10 text-text rounded-xl font-bold hover:bg-white/10 whitespace-nowrap transition-colors disabled:opacity-50">
                                            Send Test
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 'integrations' && (
                        <div className="flex flex-col gap-5 max-w-2xl">
                            <div>
                                <p className={labelClass + ' mb-2'}>Step {stepIndex + 1}</p>
                                <h2 className="text-2xl sm:text-3xl font-black text-text tracking-tight mb-2">Media Stack</h2>
                                <p className="text-muted text-sm sm:text-base">All optional — powers analytics, maintenance rules, and media stack pages.</p>
                            </div>
                            {[
                                { label: 'Sonarr', url: sonarrUrl, setUrl: setSonarrUrl, key: sonarrApiKey, setKey: setSonarrApiKey, type: 'sonarr' as const, placeholder: 'http://localhost:8989' },
                                { label: 'Radarr', url: radarrUrl, setUrl: setRadarrUrl, key: radarrApiKey, setKey: setRadarrApiKey, type: 'radarr' as const, placeholder: 'http://localhost:7878' },
                                { label: 'Tautulli', url: tautulliUrl, setUrl: setTautulliUrl, key: tautulliApiKey, setKey: setTautulliApiKey, type: 'tautulli' as const, placeholder: 'http://localhost:8181' },
                            ].map(({ label, url, setUrl, key, setKey, type, placeholder }) => (
                                <div key={type} className={`${sectionCardClass} flex flex-col gap-3.5`}>
                                    <h3 className="font-bold text-plex text-base flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-plex shadow-[0_0_8px_rgba(229,160,13,0.6)]" />
                                        {label}
                                    </h3>
                                    <input type="text" className={inputClass} value={url} onChange={(e) => setUrl(e.target.value)} placeholder={placeholder} />
                                    <input type="password" className={inputClass} value={key} onChange={(e) => setKey(e.target.value)} placeholder="API Key" />
                                    <IntegrationTestButton type={type} payload={{ [`${type}Url`]: url, [`${type}ApiKey`]: key }} disabled={!url || !key} />
                                </div>
                            ))}
                            <div className={`${sectionCardClass} flex flex-col gap-3.5`}>
                                <h3 className="font-bold text-plex text-base flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-plex shadow-[0_0_8px_rgba(229,160,13,0.6)]" />
                                    Request App
                                </h3>
                                <CustomSelect value={requestAppType} onChange={setRequestAppType} options={REQUEST_APP_OPTIONS} />
                                {requestAppType !== 'none' && (
                                    <>
                                        <input type="text" className={inputClass} value={requestAppUrl} onChange={(e) => setRequestAppUrl(e.target.value)} placeholder="http://localhost:5055" />
                                        <input type="password" className={inputClass} value={requestAppApiKey} onChange={(e) => setRequestAppApiKey(e.target.value)} placeholder="API Key" />
                                        <IntegrationTestButton type="requestApp" payload={{ requestAppType, requestAppUrl, requestAppApiKey }} disabled={!requestAppUrl || !requestAppApiKey} />
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {step === 'finish' && (
                        <div className="max-w-lg mx-auto text-center py-4">
                            <div className="w-20 h-20 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-emerald-500/30 shadow-[0_0_40px_rgba(52,211,153,0.15)]">
                                <PartyPopper className="w-10 h-10 text-emerald-400" />
                            </div>
                            <p className={labelClass + ' mb-3'}>Step {stepIndex + 1}</p>
                            <h2 className="text-3xl sm:text-4xl font-black text-text tracking-tight mb-4">Ready to launch</h2>
                            <p className="text-muted text-base leading-relaxed mb-8">
                                Your Plex server{sonarrUrl ? ', Sonarr' : ''}{radarrUrl ? ', Radarr' : ''}{tautulliUrl ? ', Tautulli' : ''} will be saved.
                                {smtpHost ? ' Email notifications enabled.' : ' You can add email later in Settings.'}
                            </p>
                            <div className={`${sectionCardClass} text-left text-sm space-y-3`}>
                                <p className="flex justify-between gap-4 border-b border-white/5 pb-3"><span className="text-muted">Server</span> <strong className="text-text truncate">{serverIdentifier || '—'}</strong></p>
                                <p className="flex justify-between gap-4 border-b border-white/5 pb-3"><span className="text-muted">Portal URL</span> <strong className="text-text truncate">{publicDomain || '—'}</strong></p>
                                <p className="flex justify-between gap-4 items-center"><span className="text-muted">Accent</span> <span className="flex items-center gap-2"><span className="inline-block w-5 h-5 rounded-md border border-white/20 shadow-inner" style={{ backgroundColor: primaryColor }} /><strong className="text-text">{primaryColor}</strong></span></p>
                            </div>
                        </div>
                    )}
                        </div>

                        {/* Footer navigation */}
                        <div className="flex-shrink-0 border-t border-white/10 bg-black/25 backdrop-blur-md px-6 sm:px-8 lg:px-10 xl:px-12 py-5 flex items-center justify-between gap-4">
                            <button type="button" onClick={goBack} disabled={stepIndex === 0 || isLoading}
                                className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm text-muted hover:text-text hover:bg-white/5 border border-transparent hover:border-white/10 transition-all disabled:opacity-30 disabled:pointer-events-none">
                                <ChevronLeft className="w-4 h-4" /> Back
                            </button>
                            <span className="hidden sm:block text-xs font-semibold text-muted/70">
                                {STEPS[stepIndex].label} · {stepIndex + 1}/{STEPS.length}
                            </span>
                            {step === 'finish' ? (
                                <button type="button" onClick={handleComplete} disabled={isLoading || !token || !serverIdentifier}
                                    className={primaryBtnClass}>
                                    {isLoading ? 'Saving…' : 'Complete Setup'} <Check className="w-4 h-4" />
                                </button>
                            ) : (
                                <button type="button" onClick={goNext} disabled={!canGoNext || isLoading}
                                    className={primaryBtnClass}>
                                    Continue <ChevronRight className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
