import React, { useEffect, useState } from 'react';
import { measureLogoInsets, peekLogoInsets } from './logoTrim';

type Props = {
    src: string;
    alt: string;
    className?: string;
    onError?: () => void;
};

export const PlayerClearLogo: React.FC<Props> = ({ src, alt, className, onError }) => {
    const [insets, setInsets] = useState(() => peekLogoInsets(src));

    useEffect(() => {
        const cached = peekLogoInsets(src);
        if (cached) {
            setInsets(cached);
            return undefined;
        }
        let cancelled = false;
        setInsets(null);
        measureLogoInsets(src).then((next) => {
            if (!cancelled) setInsets(next);
        });
        return () => { cancelled = true; };
    }, [src]);

    const ready = insets != null;
    const left = insets?.left || 0;
    const top = insets?.top || 0;
    const shift = left > 0 || top > 0;

    return (
        <img
            src={src}
            alt={alt}
            className={className}
            onError={() => onError?.()}
            style={{
                opacity: ready ? 1 : 0,
                transform: shift ? `translate(-${(left * 100).toFixed(2)}%, -${(top * 100).toFixed(2)}%)` : undefined,
            }}
        />
    );
};
