import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Check } from 'lucide-react';
import type { CustomSelectProps } from './types';

export const CustomSelect: React.FC<CustomSelectProps> = ({ id, value, onChange, options, className, compact = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [dropPos, setDropPos] = useState<{ top: number; left: number; width: number } | null>(null);
    const triggerRef = useRef<HTMLDivElement>(null);
    const dropRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const t = triggerRef.current;
            const d = dropRef.current;
            if (t && !t.contains(event.target as Node) && d && !d.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const openDropdown = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setDropPos({ top: rect.bottom + window.scrollY + 6, left: rect.left + window.scrollX, width: rect.width });
        }
        setIsOpen(v => !v);
    };

    const selectedOption = options.find(opt => String(opt.value) === String(value)) || options[0];

    const dropdown = isOpen && dropPos ? ReactDOM.createPortal(
        <div
            ref={dropRef}
            style={{ position: 'absolute', top: dropPos.top, left: dropPos.left, minWidth: dropPos.width, zIndex: 99999 }}
            className="bg-[#1e2329] border border-border rounded-lg shadow-2xl py-1 max-h-64 overflow-y-auto custom-scrollbar"
        >
            {options.map(opt => (
                <div
                    key={String(opt.value)}
                    className={`px-4 py-2.5 cursor-pointer hover:bg-white/10 transition-colors whitespace-nowrap text-sm ${String(value) === String(opt.value) ? 'bg-plex/10 text-plex font-bold' : 'text-text'}`}
                    onMouseDown={e => { e.preventDefault(); onChange(String(opt.value)); setIsOpen(false); }}
                >
                    {opt.label}
                </div>
            ))}
        </div>,
        document.body
    ) : null;

    return (
        <div className={`relative ${className || ''}`} ref={triggerRef} id={id}>
            <div
                className={`flex justify-between items-center w-full cursor-pointer h-full rounded-lg border bg-background text-text transition-all ${compact ? 'px-3 py-2' : 'px-4 py-3'} ${isOpen ? 'border-plex ring-1 ring-plex' : 'border-border hover:border-plex/50'}`}
                onClick={openDropdown}
            >
                <span className={`truncate mr-4 font-medium ${compact ? 'text-xs' : 'text-sm'}`}>{selectedOption?.label || 'Select...'}</span>
                <span className={`text-[10px] transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
            </div>
            {dropdown}
        </div>
    );
};

export const StyledCheckbox: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; label: string }> = ({ checked, onChange, label }) => (
    <label className="flex items-center gap-2 text-xs text-muted">
        <span className="relative inline-flex h-4 w-4 items-center justify-center">
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="peer sr-only"
            />
            <span className="h-4 w-4 rounded border border-border bg-background transition-colors peer-checked:border-plex peer-checked:bg-plex/20" />
            <Check className="pointer-events-none absolute h-3 w-3 text-plex opacity-0 transition-opacity peer-checked:opacity-100" />
        </span>
        {label}
    </label>
);

export const ConfirmModal: React.FC<{ isOpen: boolean; message: string; onConfirm: () => void; onCancel: () => void; }> = ({ isOpen, message, onConfirm, onCancel }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div className="modal-glass animate-slide-up">
                <h3 className="text-xl font-black mb-4 text-text tracking-tight">Are you sure?</h3>
                <p className="text-muted mb-8 text-sm leading-relaxed">{message}</p>
                <div className="flex gap-3 justify-end">
                    <button type="button" className="btn-secondary px-4 py-2.5 text-sm" onClick={onCancel}>Cancel</button>
                    <button type="button" className="btn-primary px-4 py-2.5 text-sm" onClick={onConfirm}>Confirm</button>
                </div>
            </div>
        </div>
    );
};
