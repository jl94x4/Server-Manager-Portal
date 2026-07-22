import React from 'react';
import { ScanEye } from 'lucide-react';

type Props = {
    compact?: boolean;
    className?: string;
};

export const NoPosterPlaceholder: React.FC<Props> = ({ compact = false, className = '' }) => (
    <div
        className={`w-full h-full flex flex-col items-center justify-center bg-[#2a303c] text-zinc-500 select-none ${className}`}
        aria-label="Poster not found"
    >
        <ScanEye
            className={compact ? 'w-4 h-4 opacity-45' : 'w-11 h-11 opacity-40'}
            strokeWidth={1.25}
        />
        {!compact && (
            <span className="mt-3 px-3 text-center text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.2em] leading-relaxed text-zinc-500/90">
                Poster Not Found
            </span>
        )}
    </div>
);
