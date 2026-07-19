import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { CustomSelect } from '../../shared/ui';
import { DISCOVER_LOCALES, useDiscoverI18n } from './index';

export const DiscoverLocaleSelect: React.FC<{
    className?: string;
    showLabel?: boolean;
    /** Boxed select (default) or plain text control for tight nav chrome. */
    variant?: 'select' | 'text';
}> = ({
    className = 'w-36',
    showLabel = true,
    variant = 'select',
}) => {
    const { locale, setLocale, t } = useDiscoverI18n();
    const [menuOpen, setMenuOpen] = useState(false);
    const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const current = DISCOVER_LOCALES.find((item) => item.code === locale) || DISCOVER_LOCALES[0];

    useEffect(() => {
        if (!menuOpen) return undefined;
        const onPointerDown = (event: MouseEvent) => {
            const target = event.target as Node;
            if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
            setMenuOpen(false);
        };
        document.addEventListener('mousedown', onPointerDown);
        return () => document.removeEventListener('mousedown', onPointerDown);
    }, [menuOpen]);

    useEffect(() => {
        if (!menuOpen || !triggerRef.current) {
            setMenuPos(null);
            return;
        }
        const rect = triggerRef.current.getBoundingClientRect();
        setMenuPos({ top: rect.bottom + 4, left: rect.left + rect.width / 2 });
    }, [menuOpen]);

    if (variant === 'text') {
        const menu = menuOpen && menuPos
            ? ReactDOM.createPortal(
                <div
                    ref={menuRef}
                    style={{ position: 'fixed', top: menuPos.top, left: menuPos.left, transform: 'translateX(-50%)', zIndex: 99999 }}
                    className="min-w-[7rem] rounded-md border border-border bg-card shadow-xl py-1"
                >
                    {DISCOVER_LOCALES.map((item) => (
                        <button
                            key={item.code}
                            type="button"
                            onClick={() => {
                                setLocale(item.code);
                                setMenuOpen(false);
                            }}
                            className={`block w-full px-3 py-1.5 text-left text-[10px] font-mono tracking-wider transition-colors ${
                                item.code === locale
                                    ? 'text-plex font-bold bg-plex/10'
                                    : 'text-white/70 hover:text-text hover:bg-white/5'
                            }`}
                        >
                            {item.nativeLabel}
                        </button>
                    ))}
                </div>,
                document.body,
            )
            : null;

        return (
            <div className={className}>
                <button
                    ref={triggerRef}
                    type="button"
                    onClick={() => setMenuOpen((open) => !open)}
                    className="text-[10px] text-white/50 font-mono tracking-wider opacity-80 hover:opacity-100 hover:text-white/80 transition-opacity"
                    title={t('common.language')}
                    aria-label={t('common.language')}
                    aria-expanded={menuOpen}
                >
                    {current.nativeLabel}
                </button>
                {menu}
            </div>
        );
    }

    return (
        <div className={`flex flex-col gap-1 ${className}`}>
            {showLabel && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted px-0.5">
                    {t('common.language')}
                </span>
            )}
            <CustomSelect
                compact
                value={locale}
                onChange={(next) => setLocale(next as typeof locale)}
                options={DISCOVER_LOCALES.map((item) => ({
                    value: item.code,
                    label: item.nativeLabel,
                }))}
                className="w-full"
            />
        </div>
    );
};
