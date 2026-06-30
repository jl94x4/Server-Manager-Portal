import React, { useState, useEffect } from 'react';
import type { ToastMessage } from './types';

export const MAX_VISIBLE_TOASTS = 3;

export const pushToast = (prev: ToastMessage[], message: string, type: 'success' | 'error'): ToastMessage[] => {
    const next = [...prev, { id: Date.now() + Math.random(), message, type }];
    return next.length > MAX_VISIBLE_TOASTS ? next.slice(-MAX_VISIBLE_TOASTS) : next;
};

const Toast: React.FC<{ message: string; type: 'success' | 'error'; onDismiss: () => void }> = ({ message, type, onDismiss }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const animTimer = setTimeout(() => setIsVisible(true), 50);
        const timer = setTimeout(onDismiss, 5000);
        return () => {
            clearTimeout(animTimer);
            clearTimeout(timer);
        };
    }, [onDismiss]);

    return (
        <div
            className={`px-3 py-2 rounded-lg text-white text-sm font-medium shadow-lg transition-all duration-300 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
                } ${type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
        >
            {message}
        </div>
    );
};

export const ToastContainer: React.FC<{ toasts: ToastMessage[]; setToasts: React.Dispatch<React.SetStateAction<ToastMessage[]>> }> = ({ toasts, setToasts }) => (
    <div className="fixed z-[2000] flex flex-col-reverse gap-1.5 w-[min(18rem,calc(100vw-2rem))] bottom-5 left-1/2 -translate-x-1/2 md:bottom-auto md:left-auto md:translate-x-0 md:top-4 md:right-4">
        {toasts.map(toast => (
            <Toast key={toast.id} {...toast} onDismiss={() => setToasts(t => t.filter(item => item.id !== toast.id))} />
        ))}
    </div>
);

export const Loader: React.FC<{ isLoading: boolean }> = ({ isLoading }) => {
    if (!isLoading) return null;
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-[3000]">
            <div className="border-4 border-border border-t-plex rounded-full w-12 h-12 animate-spin shadow-[0_0_15px_rgba(229,160,13,0.5)]"></div>
        </div>
    );
};

export type { ToastMessage };
