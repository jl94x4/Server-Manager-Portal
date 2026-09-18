/**
 * Bridge to native ExoPlayer (Android / Android TV) via Capacitor plugin.
 */

import { Capacitor, registerPlugin } from '@capacitor/core';

export type NativePlayerOpenOptions = {
    url: string;
    title?: string;
    offsetMs?: number;
    headers?: Record<string, string>;
    onClose?: (result: { ended: boolean; positionMs: number }) => void;
};

type NativeMediaPlayerBridge = {
    isAvailable: () => boolean | Promise<boolean>;
    open: (opts: {
        url: string;
        title?: string;
        offsetMs?: number;
        headers?: Record<string, string>;
    }) => Promise<{ ended: boolean; positionMs: number }>;
};

type CapNativeMediaPlayerPlugin = {
    isAvailable(): Promise<{ value: boolean }>;
    open(opts: {
        url: string;
        title?: string;
        offsetMs?: number;
        headers?: Record<string, string>;
    }): Promise<{ ended: boolean; positionMs: number }>;
};

declare global {
    interface Window {
        NativeMediaPlayer?: NativeMediaPlayerBridge;
    }
}

const CapNativeMediaPlayer = registerPlugin<CapNativeMediaPlayerPlugin>('NativeMediaPlayer');

/** Install window.NativeMediaPlayer when running inside Capacitor Android. */
export const installNativeMediaPlayerBridge = () => {
    if (typeof window === 'undefined') return;
    if (!Capacitor.isNativePlatform()) return;

    window.NativeMediaPlayer = {
        isAvailable: async () => {
            try {
                const result = await CapNativeMediaPlayer.isAvailable();
                return !!result?.value;
            } catch {
                return false;
            }
        },
        open: async (opts) => {
            const result = await CapNativeMediaPlayer.open({
                url: opts.url,
                title: opts.title,
                offsetMs: opts.offsetMs || 0,
                headers: opts.headers,
            });
            return {
                ended: !!result?.ended,
                positionMs: Math.max(0, Math.floor(Number(result?.positionMs) || 0)),
            };
        },
    };
};

export const isNativePlayerAvailable = async (): Promise<boolean> => {
    if (typeof window === 'undefined') return false;
    if (window.__PLEX_CLIENT__?.nativePlayer === false) return false;
    if (!window.NativeMediaPlayer) installNativeMediaPlayerBridge();
    const bridge = window.NativeMediaPlayer;
    if (!bridge?.isAvailable || !bridge?.open) return false;
    try {
        return !!(await bridge.isAvailable());
    } catch {
        return false;
    }
};

/**
 * Open stream in ExoPlayer when the Capacitor plugin is present.
 * Returns null when native playback is unavailable (caller should use WebView <video>).
 */
export const openNativePlayer = async (
    opts: NativePlayerOpenOptions,
): Promise<{ ended: boolean; positionMs: number } | null> => {
    if (!(await isNativePlayerAvailable())) return null;
    const bridge = window.NativeMediaPlayer!;
    const result = await bridge.open({
        url: opts.url,
        title: opts.title,
        offsetMs: opts.offsetMs || 0,
        headers: opts.headers,
    });
    opts.onClose?.(result);
    return result;
};
