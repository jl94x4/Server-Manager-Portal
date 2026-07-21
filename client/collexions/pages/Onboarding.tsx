import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Server,
    Shield,
    CheckCircle2,
    ArrowRight,
    ChevronRight,
    ChevronLeft,
    Check,
    AlertCircle,
    Info,
    Library,
    Globe
} from 'lucide-react';
import { api } from '../api';
import { AppConfig } from '../types';
import { DEFAULT_CONFIG } from '../constants';

const Onboarding: React.FC = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const [config, setConfig] = useState<Partial<AppConfig>>({
        plex_url: 'http://',
        plex_token: '',
        library_names: [],
        collexions_label: 'Collexions',
        trakt_client_id: '',
        tmdb_api_key: '',
        mdblist_api_key: ''
    });
    const [availableLibraries, setAvailableLibraries] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [importedFromPortal, setImportedFromPortal] = useState<string[]>([]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const defaults = await api.getPortalDefaults();
                if (cancelled) return;
                const imported: string[] = [];
                const updates: Partial<AppConfig> = {};
                const emptyUrl = !config.plex_url || config.plex_url === 'http://';
                if (emptyUrl && defaults.plex_url) {
                    updates.plex_url = defaults.plex_url;
                    imported.push('Plex URL');
                }
                if (!config.plex_token && defaults.plex_token) {
                    updates.plex_token = defaults.plex_token;
                    imported.push('Plex token');
                }
                if (!config.tmdb_api_key && defaults.tmdb_api_key) {
                    updates.tmdb_api_key = defaults.tmdb_api_key;
                    imported.push('TMDB');
                }
                if (Object.keys(updates).length) {
                    setConfig((prev) => ({ ...prev, ...updates }));
                    setImportedFromPortal(imported);
                }
            } catch {
                // Portal defaults are optional; user can still enter values manually.
            }
        })();
        return () => { cancelled = true; };
        // Seed once on mount from portal settings.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const steps = [
        { title: 'Welcome', icon: Shield },
        { title: 'Plex Config', icon: Server },
        { title: 'Libraries', icon: Library },
        { title: 'Integrations', icon: Globe },
        { title: 'Finalize', icon: CheckCircle2 }
    ];

    const getStepType = (index: number) => {
        if (index === 0) return 'welcome';
        if (index === 1) return 'plex';
        if (index === 2) return 'libraries';
        if (index === 3) return 'integrations';
        return 'finalize';
    };

    const updateConfig = (updates: Partial<AppConfig>) => {
        setConfig(prev => ({ ...prev, ...updates }));
    };

    const handleNext = () => {
        setError('');
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
            setError('');
        }
    };

    const testPlexConnection = async () => {
        setLoading(true);
        setError('');
        try {
            const fullConfig = { ...DEFAULT_CONFIG, ...config } as AppConfig;
            await api.saveConfig(fullConfig);
            const libraries = await api.getPlexLibraries();

            const libs = libraries.map((l: any) => l.name);
            if (libs.length > 0) {
                setAvailableLibraries(libs);
                setSuccessMessage('Plex connected successfully!');
                setTimeout(() => setSuccessMessage(''), 3000);
            } else {
                throw new Error('Connected to Plex, but no libraries found.');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to connect to Plex. Check URL and Token.');
        } finally {
            setLoading(false);
        }
    };

    const toggleLibrary = (lib: string) => {
        const current = config.library_names || [];
        if (current.includes(lib)) {
            updateConfig({ library_names: current.filter(l => l !== lib) });
        } else {
            updateConfig({ library_names: [...current, lib] });
        }
    };

    const handleFinish = async () => {
        setLoading(true);
        setError('');
        try {
            if (!config.plex_url || !config.plex_token) {
                throw new Error('Plex URL and Token are required.');
            }
            if (!config.library_names || config.library_names.length === 0) {
                throw new Error('Please select at least one library.');
            }

            const fullConfig = { ...DEFAULT_CONFIG, ...config } as AppConfig;
            await api.saveConfig(fullConfig);
            window.dispatchEvent(new CustomEvent('collexions-onboarding-done'));
            navigate('/', { replace: true });
        } catch (err: any) {
            setError(err.message || 'Failed to save configuration.');
        } finally {
            setLoading(false);
        }
    };

    const renderStep = () => {
        const type = getStepType(currentStep);
        switch (type) {
            case 'welcome':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="text-center space-y-4">
                            <h2 className="text-3xl font-bold text-white">Welcome to ColleXions Manager</h2>
                            <p className="text-slate-400 max-w-md mx-auto">
                                You're just a few steps away from automating your Plex collections and bringing trending content directly to your home screen.
                            </p>
                        </div>
                        {importedFromPortal.length > 0 && (
                            <div className="flex items-start gap-3 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-200 text-sm">
                                <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <p>
                                    Pre-filled from portal settings: <span className="font-semibold">{importedFromPortal.join(', ')}</span>.
                                    Trakt and MDBList still need to be entered if you use them.
                                </p>
                            </div>
                        )}
                        <div className="grid grid-cols-1 gap-4 mt-8">
                            {[
                                { title: 'Automated Sync', desc: 'Sync Trakt and TMDb lists to Plex effortlessly.', color: 'text-plex' },
                                { title: 'Premium UI', desc: 'Manage everything with a beautiful, modern dashboard.', color: 'text-blue-400' },
                                { title: 'Custom Creator', desc: 'Build and pin your own custom collections.', color: 'text-emerald-400' }
                            ].map((feat, i) => (
                                <div key={i} className="flex items-start gap-4 p-4 bg-slate-800/30 rounded-2xl border border-slate-700/50">
                                    <div className={`p-2 rounded-lg bg-slate-900 ${feat.color}`}>
                                        <Check className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white">{feat.title}</h4>
                                        <p className="text-sm text-slate-500">{feat.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'plex':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                        {importedFromPortal.some((label) => label.startsWith('Plex')) && (
                            <div className="flex items-start gap-3 p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-200 text-xs">
                                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                <p>Plex URL/token were copied from portal Settings. Confirm they’re reachable from the Collexions sidecar, then test connection.</p>
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-300 ml-1">Plex Server URL</label>
                            <input
                                type="text"
                                value={config.plex_url}
                                onChange={(e) => updateConfig({ plex_url: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-950/50 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-plex/50 outline-none transition-all"
                                placeholder="e.g. http://192.168.1.10:32400"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-300 ml-1">Plex Token</label>
                            <input
                                type="password"
                                value={config.plex_token}
                                onChange={(e) => updateConfig({ plex_token: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-950/50 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-plex/50 outline-none transition-all"
                                placeholder="Your X-Plex-Token"
                            />
                            <p className="text-[10px] text-slate-500 mt-1 ml-1 flex items-center gap-1">
                                <Info className="w-3 h-3" /> Find this in your Plex browser URL or settings.
                            </p>
                        </div>
                        <button
                            onClick={testPlexConnection}
                            disabled={loading || !config.plex_url || !config.plex_token}
                            className="w-full py-3 bg-slate-800 text-white font-bold rounded-xl border border-slate-700 hover:bg-slate-700 transition-all disabled:opacity-50"
                        >
                            {loading ? 'Connecting...' : 'Test Connection'}
                        </button>
                    </div>
                );
            case 'libraries':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                        <h3 className="text-lg font-bold text-white mb-2">Select Managed Libraries</h3>
                        <p className="text-sm text-slate-400 mb-4">Choose which libraries ColleXions should manage.</p>

                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {availableLibraries.length > 0 ? (
                                availableLibraries.map(lib => (
                                    <button
                                        key={lib}
                                        onClick={() => toggleLibrary(lib)}
                                        className={`w-full px-4 py-2.5 rounded-xl border flex items-center justify-between transition-all ${config.library_names?.includes(lib)
                                            ? 'bg-plex/10 border-plex text-plex'
                                            : 'bg-slate-800/30 border-slate-700 text-slate-400'
                                            }`}
                                    >
                                        <span className="text-sm font-medium">{lib}</span>
                                        {config.library_names?.includes(lib) ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border border-slate-600" />}
                                    </button>
                                ))
                            ) : (
                                <div className="text-center py-8 text-slate-600">
                                    <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p>No libraries found. Did you test connection?</p>
                                    <button onClick={() => setCurrentStep(steps.findIndex(s => s.icon === Server))} className="text-plex text-xs mt-2 underline">Go back to Plex Config</button>
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 'integrations':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="space-y-2">
                            <h3 className="text-lg font-bold text-white">External Integrations</h3>
                            <p className="text-sm text-slate-400">These are optional, but required for trending lists and the Collection Creator.</p>
                        </div>
                        {importedFromPortal.includes('TMDB') && (
                            <div className="flex items-start gap-3 p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-200 text-xs">
                                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                <p>TMDB key was copied from portal Settings. Trakt Client ID and MDBList are not stored in the portal — add those here if needed.</p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2 p-4 bg-slate-900/50 rounded-2xl border border-slate-800">
                                <label className="text-xs font-bold text-plex uppercase tracking-wider">TMDb API Key</label>
                                <input
                                    type="password"
                                    value={config.tmdb_api_key}
                                    onChange={(e) => updateConfig({ tmdb_api_key: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm outline-none focus:border-plex"
                                    placeholder="The Movie Database Key"
                                />
                            </div>
                            <div className="space-y-2 p-4 bg-slate-900/50 rounded-2xl border border-slate-800">
                                <label className="text-xs font-bold text-blue-400 uppercase tracking-wider">Trakt Client ID</label>
                                <input
                                    type="password"
                                    value={config.trakt_client_id}
                                    onChange={(e) => updateConfig({ trakt_client_id: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm outline-none focus:border-blue-400"
                                    placeholder="Trakt.tv App ID"
                                />
                            </div>
                            <div className="space-y-2 p-4 bg-slate-900/50 rounded-2xl border border-slate-800">
                                <label className="text-xs font-bold text-emerald-400 uppercase tracking-wider">MdbList API Key</label>
                                <input
                                    type="password"
                                    value={config.mdblist_api_key}
                                    onChange={(e) => updateConfig({ mdblist_api_key: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm outline-none focus:border-emerald-400"
                                    placeholder="MdbList.com Key"
                                />
                            </div>
                        </div>

                        <div className="p-4 bg-plex/10 border border-plex/20 rounded-2xl flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-plex shrink-0 mt-0.5" />
                            <p className="text-[11px] text-plex/80 leading-relaxed font-medium">
                                <span className="font-bold underline uppercase">Requirement Warning:</span> The <span className="text-white">Collection Creator</span> and all <span className="text-white">Trending/Auto-Sync</span> features will be <span className="text-white">DISABLED</span> until you provide these keys in the Configuration page later.
                            </p>
                        </div>
                    </div>
                );
            case 'finalize':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-300 ml-1">Collexions Label</label>
                            <input
                                type="text"
                                value={config.collexions_label}
                                onChange={(e) => updateConfig({ collexions_label: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-950/50 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-plex/50 outline-none transition-all"
                                placeholder="Default: Collexions"
                            />
                            <p className="text-xs text-slate-500 mt-1">This label will be added to all collections managed by the script.</p>
                        </div>

                        <div className="bg-slate-800/20 border border-slate-700/50 rounded-2xl p-5 space-y-4">
                            <h4 className="text-white font-bold flex items-center gap-2">
                                <Info className="w-4 h-4 text-blue-400" />
                                Next Steps & Advanced Tuning
                            </h4>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                Once you finish, head over to the <span className="text-white font-medium">Configuration</span> page to unlock the full power of ColleXions:
                            </p>
                            <ul className="grid grid-cols-1 gap-2">
                                {[
                                    { text: 'START the background service once you are happy with your configuration', icon: '🚀', highlight: true },
                                    { text: 'Set library exclusions and keyword filters', icon: '🚫' },
                                    { text: 'Enable Special/Holiday collections', icon: '🎄' },
                                    { text: 'Configure categories & custom sorting', icon: '🏷️' }
                                ].map((item, i) => (
                                    <li key={i} className={`flex items-center gap-3 text-xs p-2 rounded-lg border ${item.highlight
                                        ? 'bg-plex/20 border-plex/50 text-plex font-bold'
                                        : 'bg-slate-900/40 border-slate-800/50 text-slate-300'
                                        }`}>
                                        <span>{item.icon}</span>
                                        {item.text}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                            <p className="text-sm text-emerald-200/80 leading-relaxed font-medium">
                                Setup complete! Ready to start managed collections?
                            </p>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-plex/5 rounded-full blur-[140px] -z-10" />
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[140px] -z-10" />

            <div className="w-full max-w-2xl">
                {/* Progress Tracker */}
                <div className="flex justify-between items-center mb-12 px-8 shadow-[0_40px_80px_rgba(0,0,0,0.6)] bg-slate-900/20 p-8 rounded-[2.5rem] border border-white/5 backdrop-blur-2xl">
                    {steps.map((step, i) => {
                        const Icon = step.icon;
                        const active = i <= currentStep;
                        const isLast = i === steps.length - 1;
                        return (
                            <div key={i} className={`flex flex-col items-center gap-3 relative z-10 ${!isLast ? 'flex-1' : ''}`}>
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-700 border-2 ${active ? 'bg-plex border-plex shadow-[0_0_30px_rgba(231,166,26,0.4)] text-white scale-110' : 'bg-slate-950 border-slate-800 text-slate-600'
                                    }`}>
                                    <Icon className="w-7 h-7" />
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-[0.1em] mt-1 ${active ? 'text-plex' : 'text-slate-600'}`}>{step.title}</span>
                                {!isLast && (
                                    <div className="absolute top-7 left-1/2 w-full h-[2px] -z-10 bg-slate-800/50">
                                        <div className={`h-full bg-plex transition-all duration-1000 ease-in-out ${i < currentStep ? 'w-full' : 'w-0'}`} />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/5 p-10 rounded-[2.5rem] shadow-3xl ring-1 ring-white/5">
                    {renderStep()}

                    {error && (
                        <div className="mt-6 flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 animate-in shake duration-500">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                    )}
                    {successMessage && (
                        <div className="mt-6 flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-400 animate-in zoom-in duration-300">
                            <Check className="w-5 h-5 shrink-0" />
                            <p className="text-sm font-medium">{successMessage}</p>
                        </div>
                    )}

                    <div className="flex justify-between mt-10">
                        <button
                            onClick={handleBack}
                            disabled={currentStep === 0 || loading}
                            className="flex items-center gap-2 px-6 py-3 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-all font-bold disabled:opacity-0"
                        >
                            <ChevronLeft className="w-5 h-5" /> Back
                        </button>

                        {currentStep < steps.length - 1 ? (
                            <button
                                onClick={handleNext}
                                disabled={loading || (getStepType(currentStep) === 'plex' && availableLibraries.length === 0)}
                                className="flex items-center gap-2 px-8 py-3 bg-plex text-white rounded-xl hover:scale-105 transition-all font-bold shadow-lg shadow-orange-950/20"
                            >
                                Next <ChevronRight className="w-5 h-5" />
                            </button>
                        ) : (
                            <button
                                onClick={handleFinish}
                                disabled={loading}
                                className="flex items-center gap-2 px-8 py-3 bg-white text-black rounded-xl hover:scale-105 transition-all font-bold shadow-lg shadow-white/10"
                            >
                                {loading ? 'Saving...' : 'Enter Dashboard'} <ArrowRight className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Onboarding;
