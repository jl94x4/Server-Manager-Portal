import React, { useLayoutEffect, useRef, useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { ChevronDown } from 'lucide-react';
import { getFixedDropdownPosition, type DropdownPosition } from './ui';

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
    const [menuPos, setMenuPos] = useState<DropdownPosition | null>(null);

    const updatePosition = useCallback(() => {
        if (!buttonRef.current) return;
        const rect = buttonRef.current.getBoundingClientRect();
        setMenuPos(getFixedDropdownPosition(rect, { width: 160, itemCount: options.length, align: 'right' }));
    }, [options.length]);

    useLayoutEffect(() => {
        if (!open) {
            setMenuPos(null);
            return;
        }
        updatePosition();
        if (!buttonRef.current) return;
        const onReflow = () => updatePosition();
        window.addEventListener('resize', onReflow);
        window.addEventListener('scroll', onReflow, true);
        return () => {
            window.removeEventListener('resize', onReflow);
            window.removeEventListener('scroll', onReflow, true);
        };
    }, [open, updatePosition]);

    const menu = open && menuPos ? ReactDOM.createPortal(
        <>
            <div className="fixed inset-0 z-[9998]" onClick={onClose} />
            <div
                className="fixed z-[9999] bg-card border border-border rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] overflow-hidden flex flex-col py-1"
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
        </>,
        document.body,
    ) : null;

    return (
        <>
            <button ref={buttonRef} type="button" onClick={onToggle} className={buttonClassName}>
                <span>{options.find((opt) => opt.value === value)?.label || fallbackLabel}</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180 text-plex' : 'text-muted'}`} />
            </button>
            {menu}
        </>
    );
};
