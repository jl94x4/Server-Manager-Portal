import React from 'react';
import { Sparkles, X } from 'lucide-react';
import type { ReleaseNotes } from './releaseNotes';

export const WhatsNewModal: React.FC<{
    notes: ReleaseNotes;
    appVersion?: string;
    onDismiss: () => void;
}> = ({ notes, appVersion, onDismiss }) => (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
        <div
            className="modal-glass w-full max-w-2xl max-h-[85vh] flex flex-col animate-slide-up shadow-2xl"
            role="dialog"
            aria-labelledby="whats-new-title"
            aria-modal="true"
        >
            <div className="flex items-start justify-between gap-4 p-5 md:p-6 border-b border-border/60">
                <div className="min-w-0">
                    <div className="flex items-center gap-2 text-plex mb-1">
                        <Sparkles className="w-5 h-5 shrink-0" />
                        <span className="text-xs font-bold uppercase tracking-[0.2em]">What&apos;s new</span>
                    </div>
                    <h2 id="whats-new-title" className="text-xl md:text-2xl font-black text-text tracking-tight">
                        {notes.title || `What's new in v${notes.version}`}
                    </h2>
                    {(notes.date || appVersion) && (
                        <p className="text-muted text-sm mt-1">
                            {notes.date ? new Date(notes.date).toLocaleDateString(undefined, { dateStyle: 'medium' }) : null}
                            {notes.date && appVersion ? ' · ' : ''}
                            {appVersion || (notes.version ? `v${notes.version}` : '')}
                        </p>
                    )}
                </div>
                <button
                    type="button"
                    onClick={onDismiss}
                    className="text-muted hover:text-text transition-colors bg-white/5 rounded-full p-2 shrink-0"
                    aria-label="Close"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="p-5 md:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5">
                {notes.sections.map((section) => (
                    <div key={section.title}>
                        <h3 className="text-sm font-bold text-plex uppercase tracking-wider mb-2">{section.title}</h3>
                        <ul className="space-y-2">
                            {section.items.map((item) => (
                                <li key={item} className="relative pl-4 text-sm text-text/90 leading-relaxed">
                                    <span className="absolute left-0 text-plex select-none" aria-hidden>•</span>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            <div className="p-5 md:p-6 border-t border-border/60 flex flex-col sm:flex-row gap-3 sm:justify-end">
                {notes.changelogUrl && (
                    <a
                        href={notes.changelogUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-secondary px-4 py-2.5 text-sm text-center"
                    >
                        Full changelog
                    </a>
                )}
                <button type="button" className="btn-primary px-4 py-2.5 text-sm" onClick={onDismiss}>
                    Got it
                </button>
            </div>
        </div>
    </div>
);
