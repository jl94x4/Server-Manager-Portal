/** Focal-point helpers for hero/backdrop crops (face-aware when supported). */

export type FocalPoint = { x: number; y: number };

/** Upper-third bias when FaceDetector is unavailable (typical cinematic backdrops). */
const DEFAULT_FOCAL: FocalPoint = { x: 50, y: 22 };
const focalCache = new Map<string, FocalPoint>();
const inflight = new Map<string, Promise<FocalPoint>>();

type FaceDetectorLike = {
    detect: (image: ImageBitmapSource) => Promise<Array<{ boundingBox: DOMRectReadOnly }>>;
};

const getFaceDetector = (): FaceDetectorLike | null => {
    if (typeof window === 'undefined') return null;
    const Ctor = (window as any).FaceDetector;
    if (typeof Ctor !== 'function') return null;
    try {
        // Accurate mode keeps short heroes from chopping foreheads.
        return new Ctor({ fastMode: false, maxDetectedFaces: 8 });
    } catch {
        try {
            return new Ctor({ fastMode: true, maxDetectedFaces: 5 });
        } catch {
            return null;
        }
    }
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const loadImage = (url: string): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = url;
});

/**
 * Prefer eye-line of the largest / highest faces so short banners keep heads in frame.
 * Ignores tiny or outlier detections that pull the crop toward covered/extra faces.
 */
export const focalFromFaces = (
    faces: Array<{ boundingBox: DOMRectReadOnly }>,
    width: number,
    height: number,
): FocalPoint | null => {
    if (!faces.length || !width || !height) return null;

    const minArea = width * height * 0.004;
    const scored = faces
        .map((face) => {
            const box = face.boundingBox;
            const w = Math.max(1, box.width);
            const h = Math.max(1, box.height);
            const area = w * h;
            const midY = (box.y + h / 2) / height;
            // Prefer larger faces and ones higher in the frame (main subjects).
            const heightBoost = 1 + Math.max(0, 0.6 - midY) * 1.4;
            return { box, w, h, area, score: area * heightBoost };
        })
        .filter((entry) => entry.area >= minArea)
        .sort((a, b) => b.score - a.score);

    const pool = scored.length ? scored : faces.map((face) => {
        const box = face.boundingBox;
        const w = Math.max(1, box.width);
        const h = Math.max(1, box.height);
        return { box, w, h, area: w * h, score: w * h };
    }).sort((a, b) => b.score - a.score);

    // One strong face is enough; at most two so a covered second face can't drag the crop.
    const primary = pool.slice(0, Math.min(2, pool.length));
    let totalWeight = 0;
    let sumX = 0;
    let sumY = 0;
    let topMost = height;

    for (const { box, w, h, area } of primary) {
        // Eye-line sits ~35–40% down a face box, not at geometric center (chin-biased).
        const eyeX = box.x + w / 2;
        const eyeY = box.y + h * 0.36;
        sumX += eyeX * area;
        sumY += eyeY * area;
        topMost = Math.min(topMost, box.y);
        totalWeight += area;
    }
    if (!totalWeight) return null;

    const centerX = (sumX / totalWeight / width) * 100;
    const eyeY = (sumY / totalWeight / height) * 100;
    const topY = (topMost / height) * 100;

    // Pull above the eyes so hair/forehead survive cover crops on short heroes.
    const y = clamp(Math.min(eyeY - 12, topY + 6), 6, 32);
    return {
        x: clamp(centerX, 18, 82),
        y,
    };
};

export const formatBackgroundPosition = (focal: FocalPoint = DEFAULT_FOCAL) => (
    `${focal.x}% ${focal.y}%`
);

/** TV title pages: keep faces in the art column beside the poster (not under it). */
export const formatTvDetailsBackdropPosition = (focal: FocalPoint = DEFAULT_FOCAL) => {
    const x = focal.x < 44 ? clamp(focal.x + 14, 52, 88) : clamp(focal.x + 3, 40, 88);
    const y = clamp(focal.y, 10, 34);
    return `${x}% ${y}%`;
};

/**
 * Resolve a background-position focal point for an image URL.
 * Uses FaceDetector when available; otherwise biases toward the upper third
 * (typical for cinematic backdrops).
 */
export const resolveImageFocalPoint = async (url: string): Promise<FocalPoint> => {
    const key = String(url || '').trim();
    if (!key) return DEFAULT_FOCAL;

    const cached = focalCache.get(key);
    if (cached) return cached;

    const pending = inflight.get(key);
    if (pending) return pending;

    const task = (async () => {
        let focal = DEFAULT_FOCAL;
        try {
            const detector = getFaceDetector();
            if (detector) {
                const img = await loadImage(key);
                const faces = await detector.detect(img);
                const detected = focalFromFaces(faces, img.naturalWidth || img.width, img.naturalHeight || img.height);
                if (detected) focal = detected;
            }
        } catch {
            // CORS / unsupported / detection failure → keep default upper bias
        }
        focalCache.set(key, focal);
        inflight.delete(key);
        return focal;
    })();

    inflight.set(key, task);
    return task;
};

export const prefetchImageFocalPoints = (urls: string[]) => {
    urls.forEach((url) => {
        if (url && !focalCache.has(url) && !inflight.has(url)) {
            void resolveImageFocalPoint(url);
        }
    });
};

const surfaceCache = new Map<string, string>();

/** Space-separated R G B for CSS `rgb(var(--token))` (e.g. `38 41 48`). */
export const DEFAULT_BACKDROP_SURFACE_RGB = '38 41 48';

const DEFAULT_SURFACE = { r: 38, g: 41, b: 48 };
const luma = (r: number, g: number, b: number) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
const clampByte = (value: number) => Math.min(255, Math.max(0, value));
/** Keep overview chrome in the dark range — never a light/white page (Toy Story). */
const MAX_SURFACE_LUMA = 82;
const TARGET_POSTER_SURFACE_LUMA = 54;

/**
 * Dominant poster colour as a dark page surface: weight chromatic pixels,
 * skip near-black/white, then darken while keeping hue (no mix toward gray).
 */
export const posterSurfaceFromRgba = (data: Uint8ClampedArray | Uint8Array): string | null => {
    let rSum = 0;
    let gSum = 0;
    let bSum = 0;
    let wSum = 0;
    for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 20) continue;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const y = luma(r, g, b);
        if (y < 14 || y > 212) continue;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const chroma = max - min;
        if (chroma < 10 && y < 48) continue;
        const sat = max === 0 ? 0 : chroma / max;
        const weight = 0.4 + sat * 2 + chroma / 160;
        rSum += r * weight;
        gSum += g * weight;
        bSum += b * weight;
        wSum += weight;
    }
    if (wSum < 1) return null;

    let r = rSum / wSum;
    let g = gSum / wSum;
    let b = bSum / wSum;
    const avg = (r + g + b) / 3;
    r = clampByte(avg + (r - avg) * 1.38);
    g = clampByte(avg + (g - avg) * 1.38);
    b = clampByte(avg + (b - avg) * 1.38);

    const y = luma(r, g, b);
    if (y > TARGET_POSTER_SURFACE_LUMA && y > 0) {
        const scale = TARGET_POSTER_SURFACE_LUMA / y;
        r *= scale;
        g *= scale;
        b *= scale;
    }
    const y2 = luma(r, g, b);
    if (y2 > MAX_SURFACE_LUMA && y2 > 0) {
        const scale = MAX_SURFACE_LUMA / y2;
        r *= scale;
        g *= scale;
        b *= scale;
    }
    return [Math.round(r), Math.round(g), Math.round(b)].join(' ');
};

/**
 * Average darker pixels along the bottom band of a backdrop so the page surface can match the art.
 * Light pixels are ignored; the result is clamped so the page never goes pale.
 * Returns null when CORS or canvas read fails.
 */
export const sampleBackdropSurfaceColor = async (url: string): Promise<string | null> => {
    const key = String(url || '').trim();
    if (!key) return null;
    const cached = surfaceCache.get(key);
    if (cached) return cached;

    try {
        const img = await loadImage(key);
        const sw = img.naturalWidth || img.width;
        const sh = img.naturalHeight || img.height;
        if (!sw || !sh) return null;

        const canvas = document.createElement('canvas');
        const tw = 64;
        const th = 36;
        canvas.width = tw;
        canvas.height = th;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return null;

        const bandTop = Math.floor(sh * 0.78);
        const bandHeight = Math.max(1, sh - bandTop);
        ctx.drawImage(img, 0, bandTop, sw, bandHeight, 0, 0, tw, th);

        const { data } = ctx.getImageData(0, 0, tw, th);
        const pixels: Array<{ r: number; g: number; b: number; y: number }> = [];
        for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] < 20) continue;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            pixels.push({ r, g, b, y: luma(r, g, b) });
        }
        if (!pixels.length) return null;

        const dark = pixels.filter((p) => p.y <= 125);
        const pool = dark.length >= Math.max(8, pixels.length * 0.08)
            ? dark
            : pixels.sort((a, b) => a.y - b.y).slice(0, Math.max(1, Math.floor(pixels.length * 0.35)));

        let r = 0;
        let g = 0;
        let b = 0;
        for (const p of pool) {
            r += p.r;
            g += p.g;
            b += p.b;
        }
        r /= pool.length;
        g /= pool.length;
        b /= pool.length;

        const y = luma(r, g, b);
        if (y > MAX_SURFACE_LUMA && y > 0) {
            const scale = MAX_SURFACE_LUMA / y;
            r *= scale;
            g *= scale;
            b *= scale;
        }

        const rgb = [
            Math.round(r * 0.92 + DEFAULT_SURFACE.r * 0.08),
            Math.round(g * 0.92 + DEFAULT_SURFACE.g * 0.08),
            Math.round(b * 0.92 + DEFAULT_SURFACE.b * 0.08),
        ].join(' ');
        surfaceCache.set(key, rgb);
        return rgb;
    } catch {
        return null;
    }
};

/** Sample a poster (or any still) for the details page surface colour. */
export const samplePosterSurfaceColor = async (url: string): Promise<string | null> => {
    const key = `poster:${String(url || '').trim()}`;
    if (key === 'poster:') return null;
    const cached = surfaceCache.get(key);
    if (cached) return cached;

    try {
        const img = await loadImage(url);
        const sw = img.naturalWidth || img.width;
        const sh = img.naturalHeight || img.height;
        if (!sw || !sh) return null;

        const canvas = document.createElement('canvas');
        const tw = 32;
        const th = 48;
        canvas.width = tw;
        canvas.height = th;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return null;
        ctx.drawImage(img, 0, 0, tw, th);
        const rgb = posterSurfaceFromRgba(ctx.getImageData(0, 0, tw, th).data);
        if (!rgb) return null;
        surfaceCache.set(key, rgb);
        return rgb;
    } catch {
        return null;
    }
};
