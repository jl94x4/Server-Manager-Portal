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
        <details ref={detailsRef} className="relative inline-block group ml-2 mt-0.5">
            <summary className="list-none inline-flex items-center gap-1 cursor-pointer text-xs text-plex hover:text-plex-hover font-semibold select-none">
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-plex/60 text-[10px] leading-none">?</span>
                Hint
            </summary>
            <div className="absolute z-20 mt-2 left-0 w-[min(420px,80vw)] bg-card border border-border rounded-lg px-3 py-2 text-xs text-muted shadow-xl">
                {children}
            </div>
        </details>
    );
};
