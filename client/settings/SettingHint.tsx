import React, { useEffect, useRef } from 'react';

export const SettingHint: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const detailsRef = useRef<HTMLDetailsElement>(null);

    useEffect(() => {
        const handleOutsideClick = (event: MouseEvent) => {
            if (!detailsRef.current?.open) return;
            if (detailsRef.current.contains(event.target as Node)) return;
            detailsRef.current.open = false;
        };
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key !== 'Escape') return;
            if (detailsRef.current?.open) {
                detailsRef.current.open = false;
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
            document.removeEventListener('keydown', handleEscape);
        };
    }, []);

    return (
        <details ref={detailsRef} className="relative inline-flex align-middle shrink-0 group ml-1.5">
            <summary
                className="list-none inline-flex items-center justify-center cursor-pointer select-none text-plex/80 hover:text-plex transition-colors"
                aria-label="More information"
            >
                <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-current text-[9px] leading-none font-semibold">?</span>
            </summary>
            <div className="absolute z-20 mt-1.5 left-0 w-[min(420px,80vw)] bg-card border border-border rounded-lg px-3 py-2 text-xs text-muted shadow-xl">
                {children}
            </div>
        </details>
    );
};

export const SettingFieldLabel: React.FC<{
    htmlFor?: string;
    children: React.ReactNode;
    hint?: React.ReactNode;
    className?: string;
}> = ({ htmlFor, children, hint, className = '' }) => (
    <label htmlFor={htmlFor} className={`inline-flex items-center gap-1.5 flex-wrap ${className}`}>
        {children}
        {hint}
    </label>
);
