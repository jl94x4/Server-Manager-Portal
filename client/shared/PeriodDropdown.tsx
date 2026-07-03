import React, { useLayoutEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

export type PeriodOption = { value: number | string; label: string };

type Props = {
    value: number | string;
    open: boolean;
    onToggle: () => void;
    onClose: () => void;
    onChange: (value: number | string) => void;
    options: PeriodOption[];
    fallbackLabel?: string;
    buttonClassName?: string;
};

export const PeriodDropdown: React.FC<Props> = ({
    value,
    open,
    onToggle,
    onClose,
    onChange,
    options,
    fallbackLabel = 'Last 30 Days',
    buttonClassName = 'flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-1.5 text-sm font-medium text-text focus:outline-none focus:border-plex hover:border-plex/50 transition-colors cursor-pointer',
}) => {
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [menuPos, setMenuPos] = useState({ top: 0, left: 0, width: 160 });

    useLayoutEffect(() => {
        if (!open || !buttonRef.current) return;
        const rect = buttonRef.current.getBoundingClientRect();
        const width = 160;
        setMenuPos({
            top: rect.bottom + 8,
            left: Math.max(8, rect.right - width),
            width,
        });
    }, [open]);

    return (
        <div className="relative">
            <button ref={buttonRef} type="button" onClick={onToggle} className={buttonClassName}>
                <span>{options.find((opt) => opt.value === value)?.label || fallbackLabel}</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180 text-plex' : 'text-muted'}`} />
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-[190]" onClick={onClose} />
                    <div
                        className="fixed z-[200] bg-card border border-border rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] overflow-hidden flex flex-col py-1 animate-in fade-in slide-in-from-top-2 duration-200"
                        style={{ top: menuPos.top, left: menuPos.left, width: menuPos.width }}
                    >
                        {options.map((opt) => (
                            <button
                                key={String(opt.value)}
                                type="button"
                                onClick={() => {
                                    onChange(opt.value);
                                    onClose();
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${value === opt.value ? 'bg-plex/10 text-plex font-bold border-l-2 border-plex' : 'text-text hover:bg-white/5 border-l-2 border-transparent'}`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};
