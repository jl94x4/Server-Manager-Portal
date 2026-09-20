import { useEffect } from 'react';
import { isAndroidTvUi } from './config';
import { PLAYER_APP_BASE, PLAYER_NAVIGATE_EVENT } from '../media-player/paths';

const TV_ITEM = '[data-tv-item="1"]';

const isEditableTarget = (target: EventTarget | null) => {
    const el = target as HTMLElement | null;
    if (!el) return false;
    const tag = String(el.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
    return el.isContentEditable === true;
};

const focusableTvItems = (root: ParentNode = document) => (
    Array.from(root.querySelectorAll<HTMLElement>(TV_ITEM)).filter((el) => {
        if (el.hasAttribute('disabled')) return false;
        if (el.getAttribute('aria-hidden') === 'true') return false;
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') return false;
        return el.tabIndex !== -1;
    })
);

const horizontalRailRoot = (el: HTMLElement | null) => {
    let node: HTMLElement | null = el;
    while (node && node !== document.body) {
        const style = window.getComputedStyle(node);
        const overflowX = style.overflowX;
        if (
            (overflowX === 'auto' || overflowX === 'scroll')
            && node.scrollWidth > node.clientWidth + 8
        ) {
            return node;
        }
        node = node.parentElement;
    }
    return null;
};

const focusItem = (el: HTMLElement) => {
    el.focus();
    try {
        el.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    } catch {
        try {
            el.scrollIntoView(false);
        } catch {
            /* ignore */
        }
    }
};

/**
 * Thin leanback remote layer — same web UI, D-pad moves focus / Back goes history.
 * Mount only inside the Capacitor plex-client shell when TV is detected.
 */
export const useTvRemote = (enabled = true) => {
    useEffect(() => {
        if (!enabled || !isAndroidTvUi()) return undefined;

        const onKeyDown = (event: KeyboardEvent) => {
            if (isEditableTarget(event.target)) return;

            if (event.key === 'Escape' || event.key === 'BrowserBack') {
                event.preventDefault();
                if (window.history.length > 1) {
                    window.history.back();
                } else {
                    window.history.replaceState({}, '', PLAYER_APP_BASE);
                    window.dispatchEvent(new Event(PLAYER_NAVIGATE_EVENT));
                }
                return;
            }

            if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;

            const active = document.activeElement as HTMLElement | null;
            const rail = horizontalRailRoot(active);
            if (!rail) return;

            const items = focusableTvItems(rail);
            if (!items.length) return;

            let idx = active ? items.indexOf(active) : -1;
            if (idx < 0 && active) {
                idx = items.findIndex((el) => el.contains(active));
            }
            if (idx < 0) return;

            const nextIdx = event.key === 'ArrowRight' ? idx + 1 : idx - 1;
            if (nextIdx < 0 || nextIdx >= items.length) return;

            event.preventDefault();
            event.stopPropagation();
            focusItem(items[nextIdx]);
        };

        window.addEventListener('keydown', onKeyDown, true);
        return () => window.removeEventListener('keydown', onKeyDown, true);
    }, [enabled]);
};
