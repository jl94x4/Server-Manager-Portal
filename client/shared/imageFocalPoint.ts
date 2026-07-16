/** Focal-point helpers for hero/backdrop crops (face-aware when supported). */

export type FocalPoint = { x: number; y: number };

const DEFAULT_FOCAL: FocalPoint = { x: 50, y: 28 };
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
        return new Ctor({ fastMode: true, maxDetectedFaces: 5 });
    } catch {
        return null;
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

/** Prefer face centers; pull slightly upward so heads aren't cropped in short banners. */
const focalFromFaces = (
    faces: Array<{ boundingBox: DOMRectReadOnly }>,
    width: number,
    height: number,
): FocalPoint | null => {
    if (!faces.length || !width || !height) return null;

    let totalWeight = 0;
    let sumX = 0;
    let sumY = 0;
    let topMost = height;

    for (const face of faces) {
        const box = face.boundingBox;
        const w = Math.max(1, box.width);
        const h = Math.max(1, box.height);
        const weight = w * h;
        sumX += (box.x + w / 2) * weight;
        sumY += (box.y + h / 2) * weight;
        topMost = Math.min(topMost, box.y);
        totalWeight += weight;
    }
    if (!totalWeight) return null;

    const centerX = (sumX / totalWeight / width) * 100;
    const centerY = (sumY / totalWeight / height) * 100;
    const topY = (topMost / height) * 100;

    // Anchor a bit above face center so foreheads stay in frame on short heroes.
    const y = clamp(Math.min(centerY - 6, topY + 12), 12, 42);
    return {
        x: clamp(centerX, 20, 80),
        y,
    };
};

export const formatBackgroundPosition = (focal: FocalPoint = DEFAULT_FOCAL) => (
    `${focal.x}% ${focal.y}%`
);

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
