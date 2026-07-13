import { useEffect } from 'react';

export const useDynamicTheme = (imageUrl: string | null | undefined) => {
    useEffect(() => {
        const checkTheme = () => {
            const isDynamic = document.documentElement.getAttribute('data-theme') === 'dynamic';
            
            if (!isDynamic || !imageUrl) {
                if (!isDynamic) {
                    document.documentElement.style.removeProperty('--color-plex');
                    document.documentElement.style.removeProperty('--color-plex-hover');
                }
                return;
            }

            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                if (!ctx) return;
                
                canvas.width = 1;
                canvas.height = 1;
                ctx.drawImage(img, 0, 0, 1, 1);
                
                let [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
                
                const maxColor = Math.max(r, g, b);
                const minColor = Math.min(r, g, b);
                const saturation = maxColor === 0 ? 0 : (maxColor - minColor) / maxColor;
                
                if (saturation < 0.3) {
                    r = Math.min(255, r + 40);
                    g = Math.min(255, g + 20);
                    b = Math.max(0, b - 20);
                }

                if (maxColor < 100) {
                    const boost = 150 / Math.max(maxColor, 1);
                    r = Math.min(255, Math.round(r * boost));
                    g = Math.min(255, Math.round(g * boost));
                    b = Math.min(255, Math.round(b * boost));
                }

                document.documentElement.style.setProperty('--color-plex', `${r} ${g} ${b}`);
                
                const rH = Math.min(255, r + 40);
                const gH = Math.min(255, g + 40);
                const bH = Math.min(255, b + 40);
                document.documentElement.style.setProperty('--color-plex-hover', `${rH} ${gH} ${bH}`);
            };
            img.src = imageUrl;
        };

        // Run immediately
        checkTheme();

        // Listen for changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((m) => {
                if (m.attributeName === 'data-theme') {
                    checkTheme();
                }
            });
        });
        
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

        return () => {
            observer.disconnect();
            document.documentElement.style.removeProperty('--color-plex');
            document.documentElement.style.removeProperty('--color-plex-hover');
        };
    }, [imageUrl]);
};
