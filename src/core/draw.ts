import { Snowflake, SnowAccumulation, ElementSurface } from './types';
import { VAL_BOTTOM, TAU } from './constants';

const ACC_FILL_STYLE = 'rgba(255, 255, 255, 0.95)';

// Minimum change in maxHeight (px) before re-rendering the offscreen cache.
// At 0.5px, the cache re-renders roughly every 10-15 frames during active accumulation.
const CACHE_RENDER_THRESHOLD = 0.5;


export const drawSnowflakes = (ctx: CanvasRenderingContext2D, flakes: Snowflake[]) => {
    if (flakes.length === 0) return;

    ctx.globalAlpha = 1.0;
    ctx.fillStyle = '#FFFFFF';

    ctx.beginPath();

    for (let i = 0, len = flakes.length; i < len; i++) {
        const flake = flakes[i];
        if (flake.radius < 2) {
            ctx.rect(flake.x - flake.radius, flake.y - flake.radius, flake.radius * 2, flake.radius * 2);
        } else {
            ctx.moveTo(flake.x + flake.radius, flake.y);
            ctx.arc(flake.x, flake.y, flake.radius, 0, TAU);
        }
    }

    ctx.fill();
};

/**
 * Interpolate a bucketed value at a pixel position.
 */
const interpolateBucket = (arr: Float32Array, pixelX: number, bucketSize: number): number => {
    const exactBucket = pixelX / bucketSize;
    const b = exactBucket | 0;
    if (b >= arr.length - 1) return arr[arr.length - 1] || 0;
    const t = exactBucket - b;
    return arr[b] * (1 - t) + arr[b + 1] * t;
};

/**
 * Ensure the offscreen canvas for a surface is large enough.
 * Returns the 2D context, creating or resizing the canvas if needed.
 */
const ensureCacheCanvas = (
    acc: SnowAccumulation,
    pixelWidth: number,
    maxHeight: number
): CanvasRenderingContext2D => {
    const neededHeight = Math.ceil(maxHeight) + 10;

    if (acc._cacheCanvas && acc._cacheCtx) {
        if (acc._cacheCanvas.width < pixelWidth || acc._cacheCanvas.height < neededHeight) {
            acc._cacheCanvas.width = pixelWidth;
            acc._cacheCanvas.height = neededHeight;
        }
    } else {
        const canvas = document.createElement('canvas');
        canvas.width = pixelWidth;
        canvas.height = neededHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Failed to create cache canvas context');
        acc._cacheCanvas = canvas;
        acc._cacheCtx = ctx;
    }

    return acc._cacheCtx;
};

/**
 * Render a single surface's accumulation to its offscreen cache canvas.
 * Cache coordinates: (0,0) = top-left of the snow region.
 * The element edge is at local y = ceil(maxHeight) + 5.
 */
const renderAccumulationCache = (
    acc: SnowAccumulation,
    pixelWidth: number,
    isBottom: boolean
): void => {
    const maxHeight = acc.maxHeight;
    const ctx = ensureCacheCanvas(acc, pixelWidth, maxHeight);
    const canvas = acc._cacheCanvas!;
    const canvasW = canvas.width;
    const canvasH = canvas.height;

    ctx.clearRect(0, 0, canvasW, canvasH);

    const bucketSize = acc.bucketSize;
    const elementEdgeY = Math.ceil(maxHeight) + 5;

    // Draw the snow surface path
    ctx.beginPath();
    const pixelStep = 3;
    let first = true;

    for (let px = 0; px < pixelWidth; px += pixelStep) {
        const height = interpolateBucket(acc.heights, px, bucketSize);
        const curveOffset = interpolateBucket(acc.curveOffsets, px, bucketSize);
        const y = elementEdgeY - height + curveOffset;
        if (first) {
            ctx.moveTo(px, y);
            first = false;
        } else {
            ctx.lineTo(px, y);
        }
    }

    const lastPx = pixelWidth - 1;
    if ((lastPx % pixelStep) !== 0) {
        const height = interpolateBucket(acc.heights, lastPx, bucketSize);
        const curveOffset = interpolateBucket(acc.curveOffsets, lastPx, bucketSize);
        ctx.lineTo(lastPx, elementEdgeY - height + curveOffset);
    }

    // Close at element edge
    for (let px = pixelWidth - 1; px >= 0; px -= pixelStep) {
        const curveOffset = interpolateBucket(acc.curveOffsets, px, bucketSize);
        ctx.lineTo(px, elementEdgeY + curveOffset);
    }

    ctx.closePath();
    ctx.fillStyle = ACC_FILL_STYLE;
    ctx.shadowColor = 'rgba(200, 230, 255, 0.6)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = isBottom ? 1 : -1;
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    acc._cacheMaxHeight = maxHeight;
};

export const drawAccumulations = (
    ctx: CanvasRenderingContext2D,
    elementRects: ElementSurface[],
    scrollX: number,
    scrollY: number
) => {
    ctx.globalAlpha = 1.0;

    for (const item of elementRects) {
        const { rect, acc } = item;

        if (acc.maxHeight <= 0.1) continue;

        const isBottom = acc.type === VAL_BOTTOM;
        const pixelWidth = acc.heights.length * acc.bucketSize;

        // Re-render cache if accumulation changed significantly
        if (!acc._cacheCanvas || Math.abs(acc.maxHeight - acc._cacheMaxHeight) > CACHE_RENDER_THRESHOLD) {
            renderAccumulationCache(acc, pixelWidth, isBottom);
        }

        // Blit cached canvas to main canvas
        const cacheCanvas = acc._cacheCanvas;
        if (!cacheCanvas) continue;

        const elementEdgeY = Math.ceil(acc._cacheMaxHeight) + 5;
        const worldLeft = rect.left + scrollX;

        if (isBottom) {
            const worldTop = rect.bottom + scrollY - elementEdgeY;
            ctx.drawImage(cacheCanvas, worldLeft, worldTop);
        } else {
            const worldTop = rect.top + scrollY - elementEdgeY;
            ctx.drawImage(cacheCanvas, worldLeft, worldTop);
        }
    }
};

export const drawSideAccumulations = (
    ctx: CanvasRenderingContext2D,
    elementRects: ElementSurface[],
    scrollX: number,
    scrollY: number
) => {
    ctx.globalAlpha = 1.0;
    ctx.beginPath();

    let hasAnyPath = false;

    const drawSide = (sideArray: Float32Array, isLeft: boolean, multipliers: Float32Array, rect: DOMRect, dx: number, dy: number, bucketSize: number) => {
        const baseX = isLeft ? rect.left : rect.right;
        const worldBaseX = baseX + dx;
        const worldTop = rect.top + dy;
        const worldBottom = rect.bottom + dy;
        const dir = isLeft ? -1 : 1;
        const pixelHeight = sideArray.length * bucketSize;

        ctx.moveTo(worldBaseX, worldTop);

        const pixelStep = 3;
        for (let py = 0; py < pixelHeight; py += pixelStep) {
            const width = interpolateBucket(sideArray, py, bucketSize);
            const gm = interpolateBucket(multipliers, py, bucketSize);
            ctx.lineTo(worldBaseX + (width * gm * dir), worldTop + py);
        }

        const lastPy = pixelHeight - 1;
        if ((lastPy % pixelStep) !== 0) {
            const width = interpolateBucket(sideArray, lastPy, bucketSize);
            const gm = interpolateBucket(multipliers, lastPy, bucketSize);
            ctx.lineTo(worldBaseX + (width * gm * dir), worldTop + lastPy);
        }

        ctx.lineTo(worldBaseX, worldBottom);
    };

    for (const item of elementRects) {
        const { rect, acc } = item;

        if (acc.maxSideHeight === 0) continue;

        const hasLeftSnow = acc.leftMax > 0.3;
        const hasRightSnow = acc.rightMax > 0.3;

        if (!hasLeftSnow && !hasRightSnow) continue;

        if (hasLeftSnow) { drawSide(acc.leftSide, true, acc.sideGravityMultipliers, rect, scrollX, scrollY, acc.bucketSize); hasAnyPath = true; }
        if (hasRightSnow) { drawSide(acc.rightSide, false, acc.sideGravityMultipliers, rect, scrollX, scrollY, acc.bucketSize); hasAnyPath = true; }
    }

    if (!hasAnyPath) return;

    ctx.fillStyle = ACC_FILL_STYLE;
    ctx.fill();
};
