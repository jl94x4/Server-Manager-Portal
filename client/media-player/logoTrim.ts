/** Detect transparent padding on clear-logo PNGs so we can sit them flush with the poster. */

export type LogoInsets = {
    left: number;
    top: number;
};

const ALPHA = 20;
const BLACK = 18;
const MAX_LEFT = 0.42;
const MAX_TOP = 0.28;
const SAMPLE_WIDTH = 320;
const cache = new Map<string, LogoInsets>();
const inflight = new Map<string, Promise<LogoInsets>>();
const NONE: LogoInsets = { left: 0, top: 0 };

const clamp = (value: number, max: number) => {
    if (!Number.isFinite(value) || value <= 0.012) return 0;
    return Math.min(max, value);
};

/** Column/row needs a few content pixels so a single stray speckle does not stop the trim. */
const hitsNeeded = (size: number) => Math.max(2, Math.ceil(size * 0.02));

/** Transparent or letterbox-black counts as padding; white logos stay content. */
export const isLogoContentPixel = (r: number, g: number, b: number, a: number, alpha = ALPHA) => {
    if (a <= alpha) return false;
    return Math.max(r, g, b) > BLACK;
};

const pixelIsContent = (data: Uint8ClampedArray | Uint8Array, index: number) => (
    isLogoContentPixel(data[index], data[index + 1], data[index + 2], data[index + 3])
);

export const leftOpaqueInset = (
    data: Uint8ClampedArray | Uint8Array,
    width: number,
    height: number,
): number => {
    if (!width || !height || data.length < width * height * 4) return 0;
    const need = hitsNeeded(height);
    for (let x = 0; x < width; x += 1) {
        let hits = 0;
        for (let y = 0; y < height; y += 1) {
            if (pixelIsContent(data, (y * width + x) * 4)) {
                hits += 1;
                if (hits >= need) return clamp(x / width, MAX_LEFT);
            }
        }
    }
    return 0;
};

export const topOpaqueInset = (
    data: Uint8ClampedArray | Uint8Array,
    width: number,
    height: number,
): number => {
    if (!width || !height || data.length < width * height * 4) return 0;
    const need = hitsNeeded(width);
    for (let y = 0; y < height; y += 1) {
        let hits = 0;
        for (let x = 0; x < width; x += 1) {
            if (pixelIsContent(data, (y * width + x) * 4)) {
                hits += 1;
                if (hits >= need) return clamp(y / height, MAX_TOP);
            }
        }
    }
    return 0;
};

const insetsFromRgba = (data: Uint8ClampedArray | Uint8Array, width: number, height: number): LogoInsets => ({
    left: leftOpaqueInset(data, width, height),
    top: topOpaqueInset(data, width, height),
});

export const peekLogoInsets = (url: string): LogoInsets | null => cache.get(url) || null;

const loadImage = (url: string, crossOrigin?: string): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    if (crossOrigin) img.crossOrigin = crossOrigin;
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Logo load failed'));
    img.src = url;
});

const readInsetsFromSource = (source: CanvasImageSource, naturalWidth: number, naturalHeight: number): LogoInsets => {
    const scale = Math.min(1, SAMPLE_WIDTH / Math.max(1, naturalWidth));
    const width = Math.max(1, Math.round(naturalWidth * scale));
    const height = Math.max(1, Math.round(naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return NONE;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(source, 0, 0, width, height);
    return insetsFromRgba(ctx.getImageData(0, 0, width, height).data, width, height);
};

const measureFromUrl = async (url: string): Promise<LogoInsets> => {
    if (typeof document === 'undefined') return NONE;
    try {
        const res = await fetch(url, { credentials: 'include', mode: 'cors' });
        if (!res.ok) throw new Error(`Logo fetch ${res.status}`);
        const blob = await res.blob();
        if (typeof createImageBitmap === 'function') {
            const bitmap = await createImageBitmap(blob);
            try {
                return readInsetsFromSource(bitmap, bitmap.width, bitmap.height);
            } finally {
                bitmap.close();
            }
        }
        const objectUrl = URL.createObjectURL(blob);
        try {
            const img = await loadImage(objectUrl);
            return readInsetsFromSource(img, img.naturalWidth || img.width, img.naturalHeight || img.height);
        } finally {
            URL.revokeObjectURL(objectUrl);
        }
    } catch {
        try {
            const img = await loadImage(url, 'anonymous');
            return readInsetsFromSource(img, img.naturalWidth || img.width, img.naturalHeight || img.height);
        } catch {
            return NONE;
        }
    }
};

export const measureLogoInsets = (url: string): Promise<LogoInsets> => {
    if (!url) return Promise.resolve(NONE);
    const hit = cache.get(url);
    if (hit) return Promise.resolve(hit);
    const pending = inflight.get(url);
    if (pending) return pending;
    const next = measureFromUrl(url)
        .then((insets) => {
            cache.set(url, insets);
            inflight.delete(url);
            return insets;
        })
        .catch(() => {
            inflight.delete(url);
            return NONE;
        });
    inflight.set(url, next);
    return next;
};
