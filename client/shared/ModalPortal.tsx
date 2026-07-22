import React from 'react';
import { createPortal } from 'react-dom';

type Props = {
    open: boolean;
    children: React.ReactNode;
};

/** Render modals on document.body so they sit above the mobile nav (z-50). */
export const ModalPortal: React.FC<Props> = ({ open, children }) => {
    if (!open || typeof document === 'undefined') return null;
    return createPortal(children, document.body);
};
