import React, { useState, useEffect } from 'react';
import { X, Check, Server, Plus, Code, Trash2, Save } from 'lucide-react';

interface CustomFormatSpecification {
    name: string;
    implementation: string;
    implementationName: string;
    infoLink: string;
    negate: boolean;
    required: boolean;
    fields: { name: string; value: any }[];
}

interface CustomFormat {
    id?: number;
    name: string;
    includeCustomFormatWhenRenaming: boolean;
    specifications: CustomFormatSpecification[];
}

interface Props {
    format?: CustomFormat | null;
    onClose: () => void;
    onSave: (format: CustomFormat) => Promise<void>;
}

export const UpgraderCustomFormatModal: React.FC<Props> = ({ format, onClose, onSave }) => {
    const [name, setName] = useState(format?.name || '');
    const [advanced, setAdvanced] = useState(false);
    const [matchAll, setMatchAll] = useState(true);
    const [keywords, setKeywords] = useState<string[]>([]);
    const [negateKeywords, setNegateKeywords] = useState<string[]>([]);
    const [otherSpecifications, setOtherSpecifications] = useState<any[]>([]);
    const [keywordInput, setKeywordInput] = useState('');
    const [negateInput, setNegateInput] = useState('');
    const [saving, setSaving] = useState(false);
    const [rawJson, setRawJson] = useState('');
    const [error, setError] = useState('');

    const parseSpecificationsToSimple = (specs: any[]) => {
        const kw: string[] = [];
        const nkw: string[] = [];
        const others: any[] = [];
        let isMatchAll = true;

        specs.forEach(s => {
            if (s.implementation === 'ReleaseTitleSpecification') {
                const val = String(s.fields?.find((f: any) => f.name === 'value')?.value || '');
                // Basic cleanup of our naive regexes
                let clean = val.replace(/^\\b/, '').replace(/\\b$/, '').replace(/^\(/, '').replace(/\)$/, '');
                
                if (s.negate) {
                    nkw.push(...clean.split('|').filter(Boolean));
                } else {
                    kw.push(...clean.split('|').filter(Boolean));
                    if (val.includes('|')) isMatchAll = false;
                }
            } else {
                others.push(s);
            }
        });

        setKeywords(kw);
        setNegateKeywords(nkw);
        setMatchAll(isMatchAll);
        setOtherSpecifications(others);
    };

    const buildSpecifications = (): any[] => {
        const specs: any[] = [...otherSpecifications];
        
        if (matchAll) {
            keywords.forEach(kw => {
                specs.push({
                    name: `Match ${kw}`,
                    implementation: 'ReleaseTitleSpecification',
                    implementationName: 'Release Title',
                    infoLink: 'https://wiki.servarr.com/sonarr/settings#custom-formats',
                    negate: false,
                    required: true,
                    fields: [{ name: 'value', value: `\\b${kw}\\b` }]
                });
            });
        } else if (keywords.length > 0) {
            specs.push({
                name: 'Match Any',
                implementation: 'ReleaseTitleSpecification',
                implementationName: 'Release Title',
                infoLink: 'https://wiki.servarr.com/sonarr/settings#custom-formats',
                negate: false,
                required: true,
                fields: [{ name: 'value', value: `\\b(${keywords.join('|')})\\b` }]
            });
        }

        negateKeywords.forEach(kw => {
            specs.push({
                name: `Exclude ${kw}`,
                implementation: 'ReleaseTitleSpecification',
                implementationName: 'Release Title',
                infoLink: 'https://wiki.servarr.com/sonarr/settings#custom-formats',
                negate: true,
                required: true,
                fields: [{ name: 'value', value: `\\b${kw}\\b` }]
            });
        });

        return specs;
    };

    useEffect(() => {
        if (format) {
            try {
                if (format.specifications?.length > 0) {
                    parseSpecificationsToSimple(format.specifications);
                    setAdvanced(false);
                }
            } catch {
                setAdvanced(true);
                setRawJson(JSON.stringify(format.specifications, null, 2));
            }
            setRawJson(JSON.stringify(format.specifications || [], null, 2));
        } else {
            setRawJson('[\n  \n]');
        }
    }, [format]);

    const handleSwitchMode = (toAdvanced: boolean) => {
        setError('');
        if (toAdvanced) {
            const generated = buildSpecifications();
            setRawJson(JSON.stringify(generated, null, 2));
            setAdvanced(true);
        } else {
            try {
                const specs = JSON.parse(rawJson);
                if (Array.isArray(specs)) {
                    parseSpecificationsToSimple(specs);
                    setAdvanced(false);
                } else {
                    setError('Cannot switch to Simple mode: Advanced mode must contain a valid JSON array.');
                }
            } catch (e) {
                setError('Cannot switch to Simple mode: Invalid JSON in Advanced mode.');
            }
        }
    };

    const handleSave = async () => {
        setError('');
        if (!name.trim()) return setError('Name is required');

        let specifications: any[] = [];

        if (advanced) {
            try {
                specifications = JSON.parse(rawJson);
                if (!Array.isArray(specifications)) throw new Error('Must be a JSON array');
            } catch (e: any) {
                return setError(`Invalid JSON: ${e.message}`);
            }
        } else {
            if (keywords.length === 0 && otherSpecifications.length === 0) return setError('At least one keyword or specification is required');
            specifications = buildSpecifications();
        }

        const payload: CustomFormat = {
            id: format?.id,
            name: name.trim(),
            includeCustomFormatWhenRenaming: format?.includeCustomFormatWhenRenaming ?? false,
            specifications
        };

        setSaving(true);
        try {
            await onSave(payload);
        } catch (e: any) {
            setError(e.message || 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-card border border-border shadow-xl rounded-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <h3 className="text-xl font-bold text-text">
                        {format ? 'Edit Custom Format' : 'Create Custom Format'}
                    </h3>
                    <button onClick={onClose} className="text-muted hover:text-text transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto space-y-6 custom-scrollbar">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-semibold text-text mb-2">Format Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. HEVC Only"
                            className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-text focus:outline-none focus:border-plex"
                        />
                    </div>

                    <div className="flex items-center justify-between bg-background border border-border rounded-lg p-1">
                        <button
                            onClick={() => handleSwitchMode(false)}
                            className={`flex-1 text-sm font-medium py-1.5 rounded-md transition-colors ${!advanced ? 'bg-plex text-background' : 'text-muted hover:text-text'}`}
                        >
                            Simple Keywords
                        </button>
                        <button
                            onClick={() => handleSwitchMode(true)}
                            className={`flex-1 text-sm font-medium py-1.5 rounded-md transition-colors ${advanced ? 'bg-plex text-background' : 'text-muted hover:text-text'}`}
                        >
                            Advanced Regex JSON
                        </button>
                    </div>

                    {!advanced ? (
                        <div className="space-y-6">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-semibold text-text">Keywords Must Include</label>
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className={matchAll ? 'text-plex font-bold' : 'text-muted'}>Match All (AND)</span>
                                        <button
                                            onClick={() => setMatchAll(!matchAll)}
                                            className={`w-8 h-4 rounded-full flex items-center p-0.5 transition-colors ${matchAll ? 'bg-plex' : 'bg-border'}`}
                                        >
                                            <div className={`w-3 h-3 bg-white rounded-full shadow-sm transform transition-transform ${matchAll ? 'translate-x-4' : 'translate-x-0'}`} />
                                        </button>
                                        <span className={!matchAll ? 'text-plex font-bold' : 'text-muted'}>Match Any (OR)</span>
                                    </div>
                                </div>
                                
                                <div className="flex gap-2 mb-2">
                                    <input
                                        type="text"
                                        value={keywordInput}
                                        onChange={(e) => setKeywordInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && keywordInput.trim()) {
                                                if (!keywords.includes(keywordInput.trim())) setKeywords([...keywords, keywordInput.trim()]);
                                                setKeywordInput('');
                                            }
                                        }}
                                        placeholder="Type keyword and press Enter (e.g. HEVC, x265)"
                                        className="flex-1 bg-background border border-border rounded-lg px-4 py-2 text-sm text-text focus:outline-none focus:border-plex"
                                    />
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {keywords.map(kw => (
                                        <div key={kw} className="bg-plex/20 border border-plex/30 text-plex px-3 py-1 rounded-full text-sm flex items-center gap-2">
                                            {kw}
                                            <button onClick={() => setKeywords(keywords.filter(k => k !== kw))} className="hover:text-white transition-colors">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                    {keywords.length === 0 && <span className="text-xs text-muted">No keywords added.</span>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-text mb-2">Keywords Must NOT Include (Exclusions)</label>
                                <div className="flex gap-2 mb-2">
                                    <input
                                        type="text"
                                        value={negateInput}
                                        onChange={(e) => setNegateInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && negateInput.trim()) {
                                                if (!negateKeywords.includes(negateInput.trim())) setNegateKeywords([...negateKeywords, negateInput.trim()]);
                                                setNegateInput('');
                                            }
                                        }}
                                        placeholder="Type keyword to exclude and press Enter (e.g. x264)"
                                        className="flex-1 bg-background border border-border rounded-lg px-4 py-2 text-sm text-text focus:outline-none focus:border-plex"
                                    />
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {negateKeywords.map(kw => (
                                        <div key={kw} className="bg-red-500/20 border border-red-500/30 text-red-500 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                                            {kw}
                                            <button onClick={() => setNegateKeywords(negateKeywords.filter(k => k !== kw))} className="hover:text-white transition-colors">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                    {negateKeywords.length === 0 && <span className="text-xs text-muted">No exclusions added.</span>}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col h-64">
                            <label className="block text-sm font-semibold text-text mb-2">Raw JSON Specifications</label>
                            <textarea
                                value={rawJson}
                                onChange={(e) => setRawJson(e.target.value)}
                                className="flex-1 w-full bg-[#1e1e1e] border border-border rounded-lg p-4 text-xs font-mono text-[#d4d4d4] focus:outline-none focus:border-plex resize-none whitespace-pre"
                                spellCheck={false}
                            />
                            <p className="text-xs text-muted mt-2">
                                Edit the raw specifications array. Make sure this is valid JSON matching the Arr custom format specifications schema.
                            </p>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-border flex justify-end gap-3 bg-background/50 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-sm font-semibold text-text hover:bg-white/5 transition-colors"
                        disabled={saving}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-plex text-background px-4 py-2 rounded-lg text-sm font-semibold hover:bg-plex/90 transition-colors flex items-center gap-2"
                    >
                        {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {saving ? 'Saving to Server...' : 'Save & Sync'}
                    </button>
                </div>
            </div>
        </div>
    );
};
