import { PNG } from 'pngjs';
import jpeg from 'jpeg-js';

const isPng = (buffer) => (
    Buffer.isBuffer(buffer)
    && buffer.length >= 8
    && buffer[0] === 0x89
    && buffer[1] === 0x50
    && buffer[2] === 0x4e
    && buffer[3] === 0x47
);

const isJpeg = (buffer) => (
    Buffer.isBuffer(buffer)
    && buffer.length >= 3
    && buffer[0] === 0xff
    && buffer[1] === 0xd8
    && buffer[2] === 0xff
);

const decodeRaster = (buffer) => {
    if (isPng(buffer)) {
        const png = PNG.sync.read(buffer);
        return { width: png.width, height: png.height, data: png.data };
    }
    if (isJpeg(buffer)) {
        const decoded = jpeg.decode(buffer, { useTArray: true, maxMemoryUsageInMB: 64 });
        return { width: decoded.width, height: decoded.height, data: Buffer.from(decoded.data) };
    }
    return null;
};

/** Cover-crop source RGBA into a square of `size`, then apply a circular alpha mask. */
export const makeCircularPwaIconPng = (inputBuffer, size = 192) => {
    const s = Math.max(64, Math.min(1024, Number(size) || 192));
    const decoded = decodeRaster(inputBuffer);
    if (!decoded?.width || !decoded?.height || !decoded?.data?.length) {
        throw new Error('Unsupported image for circular PWA icon');
    }

    const { width: srcW, height: srcH, data: src } = decoded;
    const scale = Math.max(s / srcW, s / srcH);
    const sampleW = srcW * scale;
    const sampleH = srcH * scale;
    const offsetX = (sampleW - s) / 2;
    const offsetY = (sampleH - s) / 2;
    const out = Buffer.alloc(s * s * 4);
    const radius = s / 2;
    const cx = radius - 0.5;
    const cy = radius - 0.5;
    const radiusSq = radius * radius;

    for (let y = 0; y < s; y += 1) {
        for (let x = 0; x < s; x += 1) {
            const dx = x - cx;
            const dy = y - cy;
            const outIdx = (y * s + x) * 4;
            if ((dx * dx) + (dy * dy) > radiusSq) {
                out[outIdx] = 0;
                out[outIdx + 1] = 0;
                out[outIdx + 2] = 0;
                out[outIdx + 3] = 0;
                continue;
            }

            const srcXf = (x + offsetX) / scale;
            const srcYf = (y + offsetY) / scale;
            const x0 = Math.max(0, Math.min(srcW - 1, Math.floor(srcXf)));
            const y0 = Math.max(0, Math.min(srcH - 1, Math.floor(srcYf)));
            const x1 = Math.max(0, Math.min(srcW - 1, x0 + 1));
            const y1 = Math.max(0, Math.min(srcH - 1, y0 + 1));
            const xWeight = srcXf - Math.floor(srcXf);
            const yWeight = srcYf - Math.floor(srcYf);

            const sample = (sx, sy) => {
                const idx = (sy * srcW + sx) * 4;
                return [src[idx], src[idx + 1], src[idx + 2], src[idx + 3]];
            };

            const c00 = sample(x0, y0);
            const c10 = sample(x1, y0);
            const c01 = sample(x0, y1);
            const c11 = sample(x1, y1);

            for (let channel = 0; channel < 4; channel += 1) {
                const top = (c00[channel] * (1 - xWeight)) + (c10[channel] * xWeight);
                const bottom = (c01[channel] * (1 - xWeight)) + (c11[channel] * xWeight);
                out[outIdx + channel] = Math.round((top * (1 - yWeight)) + (bottom * yWeight));
            }
        }
    }

    const png = new PNG({ width: s, height: s });
    out.copy(png.data);
    return PNG.sync.write(png);
};
