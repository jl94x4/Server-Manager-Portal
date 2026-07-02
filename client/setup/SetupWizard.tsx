import React, { useState, useEffect } from 'react';
import {
    Settings, Sparkles, ChevronRight, ChevronLeft, Check, Palette, Mail, Layers, Server, PartyPopper,
} from 'lucide-react';
import { apiFetch } from '../shared/api';
import { IntegrationTestButton } from '../shared/IntegrationTestButton';
import { CustomSelect } from '../shared/ui';
import type { PlexServer } from '../shared/types';

const STEPS = [
    { id: 'welcome', label: 'Welcome', icon: Sparkles },
    { id: 'plex', label: 'Plex', icon: Server },
    { id: 'branding', label: 'Branding', icon: Palette },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'integrations', label: 'Integrations', icon: Layers },
    { id: 'finish', label: 'Finish', icon: PartyPopper },
] as const;

type StepId = (typeof STEPS)[number]['id'];

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

    const inputClass = 'w-full p-3 rounded-lg bg-background border border-border text-text focus:border-plex outline-none transition-colors';
    const labelClass = 'text-sm font-bold text-muted uppercase tracking-wider';

    return (
        <div className="w-full max-w-3xl mx-auto px-4 py-8 md:py-12">
            <div className="bg-card rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-plex to-[#e5a00d]" />

                <div className="px-4 md:px-8 pt-6 pb-2 overflow-x-auto">
                    <div className="flex items-center gap-1 min-w-max">
                        {STEPS.map((s, i) => {
                            const Icon = s.icon;
                            const active = s.id === step;
                            const done = i < stepIndex;
                            return (
                                <React.Fragment key={s.id}>
                                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold transition-colors ${active ? 'text-plex bg-plex/10' : done ? 'text-green-400' : 'text-muted'}`}>
                                        {done ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                                        <span className="hidden sm:inline">{s.label}</span>
                                    </div>
                                    {i < STEPS.length - 1 && <div className={`w-4 h-px ${done ? 'bg-green-400/50' : 'bg-border'}`} />}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>

                <div className="p-5 md:p-8 lg:p-10">
                    {error && (
                        <div className="p-4 bg-status-expiring/20 border border-status-expiring/50 rounded-lg text-status-expiring mb-6 text-sm">{error}</div>
                    )}

                    {step === 'welcome' && (
                        <div className="text-center">
                            <div className="w-16 h-16 bg-plex/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-plex/20">
                                <Settings className="w-8 h-8 text-plex" />
                            </div>
                            <h1 className="text-3xl font-bold text-text mb-3">Welcome to Server Manager Portal</h1>
                            <p className="text-muted mb-6 max-w-lg mx-auto leading-relaxed">
                                This quick setup wizard will connect your Plex server, customize your portal, and optionally wire up email and media stack integrations.
                            </p>
                            <ul className="text-left text-sm text-muted space-y-2 max-w-md mx-auto mb-8">
                                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-plex flex-shrink-0" /> Sign in with Plex as the server owner</li>
                                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-plex flex-shrink-0" /> Brand your portal (name, color, logo)</li>
                                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-plex flex-shrink-0" /> Optional SMTP for expiry alerts</li>
                                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-plex flex-shrink-0" /> Optional Sonarr, Radarr & Tautulli</li>
                            </ul>
                        </div>
                    )}

                    {step === 'plex' && (
                        <div className="flex flex-col gap-5">
                            <div>
                                <h2 className="text-2xl font-bold text-text mb-1">Plex Connection</h2>
                                <p className="text-muted text-sm">Sign in with your Plex account as the <strong className="text-text">server owner</strong> to connect your server.</p>
                            </div>

                            {!token ? (
                                <>
                                    <button
                                        type="button"
                                        onClick={handlePlexSignIn}
                                        disabled={isLoading}
                                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-plex text-background rounded-lg font-bold text-sm hover:bg-plex-hover transition-colors disabled:opacity-50 w-fit"
                                    >
                                        <img src="/static/logo.png" alt="" className="w-4 h-4 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                        {isLoading ? 'Redirecting to Plex…' : 'Sign in with Plex'}
                                    </button>
                                    <p className="text-xs text-muted">Uses secure Plex OAuth. We&apos;ll fetch your owned servers automatically.</p>
                                </>
                            ) : (
                                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-3">
                                    <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                                    <div>
                                        <p className="text-green-400 font-bold text-sm">Signed in as {plexUsername || 'Plex User'}</p>
                                        <p className="text-muted text-xs mt-0.5">{servers.length} owned server{servers.length !== 1 ? 's' : ''} found</p>
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
                                        className="ml-auto text-xs text-muted hover:text-text underline"
                                    >
                                        Sign out
                                    </button>
                                </div>
                            )}

                            {servers.length > 0 ? (
                                <div className="flex flex-col gap-2">
                                    <label className={labelClass}>Select Server</label>
                                    <CustomSelect value={serverIdentifier} onChange={setServerIdentifier} options={servers.map((s) => ({ label: `${s.name} (${s.identifier})`, value: s.identifier }))} />
                                </div>
                            ) : token ? (
                                <div className="flex flex-col gap-3">
                                    <label className={labelClass}>Server Identifier</label>
                                    <input type="text" className={inputClass} value={serverIdentifier} onChange={(e) => setServerIdentifier(e.target.value)} placeholder="No servers returned — enter identifier manually" />
                                    <div className="text-xs text-muted p-3 rounded-lg bg-background/60 border border-border space-y-1">
                                        <p className="font-semibold text-text">How to find Server Identifier manually:</p>
                                        <p>1) Open: <code className="bg-background px-1 rounded">http://YOUR_PLEX_IP:32400/identity?X-Plex-Token=YOUR_TOKEN</code></p>
                                        <p>2) Copy <code className="bg-background px-1 rounded">machineIdentifier</code> from the response.</p>
                                    </div>
                                </div>
                            ) : null}

                            <div className="flex flex-col gap-1.5">
                                <label className={labelClass}>
                                    Direct Plex URL <span className="text-muted font-normal normal-case">(required in Docker)</span>
                                </label>
                                <input
                                    type="url"
                                    className={inputClass}
                                    value={plexServerUrl}
                                    onChange={(e) => setPlexServerUrl(e.target.value)}
                                    placeholder="http://192.168.1.6:32400"
                                />
                                <p className="text-xs text-muted">Your Plex server&apos;s LAN address. Required when Plex.tv discovery fails from inside the container.</p>
                            </div>

                            <IntegrationTestButton
                                type="plex"
                                payload={{ token, serverIdentifier, plexServerUrl: plexServerUrl || undefined }}
                                disabled={!token || !serverIdentifier}
                            />

                            <div className="border-t border-border pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowManualToken(!showManualToken)}
                                    className="text-sm text-muted hover:text-text transition-colors"
                                >
                                    {showManualToken ? '▾ Hide manual token entry' : '▸ Enter Plex token manually'}
                                </button>
                                {showManualToken && (
                                    <div className="mt-4 flex flex-col gap-4">
                                        <div className="p-4 bg-plex/5 border border-plex/20 rounded-xl text-sm text-muted">
                                            <strong className="text-plex">Tip:</strong> Log into Plex Web, open any library item XML, and find <code className="bg-background px-1 rounded">X-Plex-Token=...</code> in the URL.
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className={labelClass}>Plex Token</label>
                                            <div className="flex gap-2">
                                                <input type="password" className={inputClass} value={token} onChange={(e) => setToken(e.target.value)} placeholder="X-Plex-Token" />
                                                <button type="button" onClick={handleFetchServers} disabled={isLoading || !token} className="px-4 bg-plex/20 text-plex rounded-lg font-bold hover:bg-plex/30 whitespace-nowrap transition-colors disabled:opacity-50">
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
                        <div className="flex flex-col gap-5">
                            <div>
                                <h2 className="text-2xl font-bold text-text mb-1">Portal Branding</h2>
                                <p className="text-muted text-sm">How your portal looks to users. You can change these later in Settings.</p>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className={labelClass}>Public Domain / URL</label>
                                <input type="text" className={inputClass} value={publicDomain} onChange={(e) => setPublicDomain(e.target.value)} placeholder="https://portal.yourdomain.com" />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className={labelClass}>Primary Color</label>
                                <div className="flex gap-3 items-center">
                                    <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-12 h-12 rounded-lg border border-border cursor-pointer bg-transparent" />
                                    <input type="text" className={inputClass} value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} placeholder="#E5A00D" />
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className={labelClass}>Custom Logo URL (optional)</label>
                                <input type="text" className={inputClass} value={customLogoUrl} onChange={(e) => setCustomLogoUrl(e.target.value)} placeholder="https://… or /static/logo.png" />
                            </div>
                        </div>
                    )}

                    {step === 'email' && (
                        <div className="flex flex-col gap-5">
                            <div>
                                <h2 className="text-2xl font-bold text-text mb-1">Email Notifications</h2>
                                <p className="text-muted text-sm">Optional — send expiry reminders and newsletters. Skip if you&apos;ll configure later.</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2 md:col-span-2">
                                    <label className={labelClass}>SMTP Host</label>
                                    <input type="text" className={inputClass} value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} placeholder="smtp.mailgun.org" />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className={labelClass}>Port</label>
                                    <input type="number" className={inputClass} value={smtpPort} onChange={(e) => setSmtpPort(Number(e.target.value))} />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className={labelClass}>Secure (TLS)</label>
                                    <label className="flex items-center gap-2 cursor-pointer mt-2">
                                        <input type="checkbox" checked={smtpSecure} onChange={(e) => setSmtpSecure(e.target.checked)} className="w-4 h-4 accent-plex" />
                                        <span className="text-sm text-text">Use SSL/TLS</span>
                                    </label>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className={labelClass}>SMTP User</label>
                                    <input type="text" className={inputClass} value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className={labelClass}>SMTP Password</label>
                                    <input type="password" className={inputClass} value={smtpPass} onChange={(e) => setSmtpPass(e.target.value)} />
                                </div>
                                <div className="flex flex-col gap-2 md:col-span-2">
                                    <label className={labelClass}>From Address</label>
                                    <input type="text" className={inputClass} value={smtpFrom} onChange={(e) => setSmtpFrom(e.target.value)} placeholder="Plex Server &lt;noreply@domain.com&gt;" />
                                </div>
                            </div>
                            {smtpHost && smtpUser && smtpPass && (
                                <div className="border-t border-border pt-4 flex flex-col gap-3">
                                    <label className={labelClass}>Send Test Email</label>
                                    <div className="flex gap-2">
                                        <input type="email" className={inputClass} value={testRecipient} onChange={(e) => setTestRecipient(e.target.value)} placeholder="you@example.com" />
                                        <button type="button" onClick={handleTestEmail} disabled={isLoading} className="px-4 bg-border text-text rounded-lg font-bold hover:bg-white/10 whitespace-nowrap transition-colors disabled:opacity-50">
                                            Test
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 'integrations' && (
                        <div className="flex flex-col gap-6">
                            <div>
                                <h2 className="text-2xl font-bold text-text mb-1">Media Stack</h2>
                                <p className="text-muted text-sm">All optional — powers analytics, maintenance rules, and media stack pages.</p>
                            </div>
                            {[
                                { label: 'Sonarr', url: sonarrUrl, setUrl: setSonarrUrl, key: sonarrApiKey, setKey: setSonarrApiKey, type: 'sonarr' as const, placeholder: 'http://localhost:8989' },
                                { label: 'Radarr', url: radarrUrl, setUrl: setRadarrUrl, key: radarrApiKey, setKey: setRadarrApiKey, type: 'radarr' as const, placeholder: 'http://localhost:7878' },
                                { label: 'Tautulli', url: tautulliUrl, setUrl: setTautulliUrl, key: tautulliApiKey, setKey: setTautulliApiKey, type: 'tautulli' as const, placeholder: 'http://localhost:8181' },
                            ].map(({ label, url, setUrl, key, setKey, type, placeholder }) => (
                                <div key={type} className="border border-border rounded-xl p-4 flex flex-col gap-3">
                                    <h3 className="font-bold text-plex">{label}</h3>
                                    <input type="text" className={inputClass} value={url} onChange={(e) => setUrl(e.target.value)} placeholder={placeholder} />
                                    <input type="password" className={inputClass} value={key} onChange={(e) => setKey(e.target.value)} placeholder="API Key" />
                                    <IntegrationTestButton type={type} payload={{ [`${type}Url`]: url, [`${type}ApiKey`]: key }} disabled={!url || !key} />
                                </div>
                            ))}
                            <div className="border border-border rounded-xl p-4 flex flex-col gap-3">
                                <h3 className="font-bold text-plex">Request App</h3>
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
                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30">
                                <PartyPopper className="w-8 h-8 text-green-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-text mb-3">Ready to Launch</h2>
                            <p className="text-muted mb-6 max-w-md mx-auto">
                                Your Plex server{sonarrUrl ? ', Sonarr' : ''}{radarrUrl ? ', Radarr' : ''}{tautulliUrl ? ', Tautulli' : ''} will be saved.
                                {smtpHost ? ' Email notifications enabled.' : ' You can add email later in Settings.'}
                            </p>
                            <div className="text-left bg-background/50 border border-border rounded-xl p-4 text-sm space-y-1 max-w-sm mx-auto">
                                <p><span className="text-muted">Server:</span> <strong className="text-text">{serverIdentifier || '—'}</strong></p>
                                <p><span className="text-muted">Portal URL:</span> <strong className="text-text">{publicDomain || '—'}</strong></p>
                                <p><span className="text-muted">Accent:</span> <span className="inline-block w-4 h-4 rounded align-middle border border-white/20" style={{ backgroundColor: primaryColor }} /> <strong className="text-text">{primaryColor}</strong></p>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between gap-4 mt-8 pt-6 border-t border-border">
                        <button type="button" onClick={goBack} disabled={stepIndex === 0 || isLoading}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm text-muted hover:text-text hover:bg-white/5 transition-colors disabled:opacity-30">
                            <ChevronLeft className="w-4 h-4" /> Back
                        </button>
                        {step === 'finish' ? (
                            <button type="button" onClick={handleComplete} disabled={isLoading || !token || !serverIdentifier}
                                className="flex items-center gap-2 px-6 py-3 bg-plex text-background rounded-lg font-bold hover:bg-plex-hover transition-colors disabled:opacity-50">
                                {isLoading ? 'Saving…' : 'Complete Setup'} <Check className="w-4 h-4" />
                            </button>
                        ) : (
                            <button type="button" onClick={goNext} disabled={!canGoNext || isLoading}
                                className="flex items-center gap-2 px-6 py-3 bg-plex text-background rounded-lg font-bold hover:bg-plex-hover transition-colors disabled:opacity-50">
                                Continue <ChevronRight className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
