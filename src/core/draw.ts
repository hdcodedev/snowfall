import { Snowflake, ElementSurface } from './types';
import { VAL_BOTTOM, TAU } from './constants';

const ACC_FILL_STYLE = 'rgba(255, 255, 255, 0.95)';
const ACC_SHADOW_FILL = 'rgba(200, 220, 245, 0.3)';
const OPACITY_BUCKETS = [0.3, 0.5, 0.7, 0.9];


export const drawSnowflakes = (ctx: CanvasRenderingContext2D, flakes: Snowflake[]) => {
    if (flakes.length === 0) return;

    ctx.fillStyle = '#FFFFFF';

    // Draw glow pass grouped by opacity to reduce state changes and fill calls.
    for (const alpha of OPACITY_BUCKETS) {
        let hasPath = false;

        for (const flake of flakes) {
            if (flake.isBackground || flake.glowOpacity !== alpha) continue;
            if (!hasPath) {
                ctx.globalAlpha = alpha;
                ctx.beginPath();
                hasPath = true;
            }
            ctx.moveTo(flake.x + flake.glowRadius, flake.y);
            ctx.arc(flake.x, flake.y, flake.glowRadius, 0, TAU);
        }

        if (hasPath) {
            ctx.fill();
        }
    }

    // Draw core pass grouped by opacity as well.
    for (const alpha of OPACITY_BUCKETS) {
        let hasPath = false;

        for (const flake of flakes) {
            if (flake.opacity !== alpha) continue;
            if (!hasPath) {
                ctx.globalAlpha = alpha;
                ctx.beginPath();
                hasPath = true;
            }
            ctx.moveTo(flake.x + flake.radius, flake.y);
            ctx.arc(flake.x, flake.y, flake.radius, 0, TAU);
        }

        if (hasPath) {
            ctx.fill();
        }
    }

    ctx.globalAlpha = 1.0;
};

export const drawAccumulations = (
    ctx: CanvasRenderingContext2D,
    elementRects: ElementSurface[],
    scrollX: number,
    scrollY: number
) => {
    ctx.globalAlpha = 1.0;
    ctx.beginPath();

    let hasAnyPath = false;

    // Iterate over all accumulation surfaces to build the single path
    for (const item of elementRects) {
        const { rect, acc } = item;

        if (acc.maxHeight <= 0.1) continue;

        const isBottom = acc.type === VAL_BOTTOM;
        const baseY = isBottom ? rect.bottom - 1 : rect.top + 1;

        // Precompute world-space coordinates (hoist additions out of loops)
        const worldLeft = rect.left + scrollX;
        const worldBaseY = baseY + scrollY;

        let first = true;
        const step = 2;
        const len = acc.heights.length;

        // Draw the uneven top surface of the snow
        for (let x = 0; x < len; x += step) {
            const height = acc.heights[x] || 0;
            const px = worldLeft + x;
            const py = worldBaseY - height + (acc.curveOffsets[x] || 0);
            if (first) {
                ctx.moveTo(px, py);
                first = false;
            } else {
                ctx.lineTo(px, py);
            }
        }

        if ((len - 1) % step !== 0) {
            const x = len - 1;
            const height = acc.heights[x] || 0;
            const px = worldLeft + x;
            const py = worldBaseY - height + (acc.curveOffsets[x] || 0);
            ctx.lineTo(px, py);
        }

        // Draw the bottom edge (aligned with element border) to close the shape
        for (let x = len - 1; x >= 0; x -= step) {
            const px = worldLeft + x;
            const py = worldBaseY + (acc.curveOffsets[x] || 0);
            ctx.lineTo(px, py);
        }

        const startX = 0;
        const startPx = worldLeft + startX;
        const startPy = worldBaseY + (acc.curveOffsets[startX] || 0);
        ctx.lineTo(startPx, startPy);
        hasAnyPath = true;
    }

    if (!hasAnyPath) return;

    // Shadow pass: offset fill with low-opacity tint for depth effect.
    // Reuses the same path — avoids shadowBlur which is extremely expensive on Canvas 2D.
    ctx.save();
    ctx.translate(0, 1);
    ctx.fillStyle = ACC_SHADOW_FILL;
    ctx.fill();
    ctx.restore();

    // Main fill pass
    ctx.fillStyle = ACC_FILL_STYLE;
    ctx.fill();
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

    const drawSide = (sideArray: number[], isLeft: boolean, multipliers: number[], rect: DOMRect, dx: number, dy: number) => {
        const baseX = isLeft ? rect.left : rect.right;

        // Precompute world-space coordinates
        const worldBaseX = baseX + dx;
        const worldTop = rect.top + dy;
        const worldBottom = rect.bottom + dy;
        const dir = isLeft ? -1 : 1;
        const lastIdx = sideArray.length - 1;

        ctx.moveTo(worldBaseX, worldTop);

        // Draw the uneven side profile
        for (let y = 0; y < sideArray.length; y += 2) {
            const width = sideArray[y] || 0;
            const nextY = y + 2 < lastIdx ? y + 2 : lastIdx;
            const nextWidth = sideArray[nextY] || 0;

            const gravityMultiplier = multipliers[y] || 0;

            const py = worldTop + y;
            const px = worldBaseX + (width * gravityMultiplier * dir);
            const ny = worldTop + nextY;
            const nGravityMultiplier = multipliers[nextY] || 0;
            const nx = worldBaseX + (nextWidth * nGravityMultiplier * dir);

            ctx.lineTo(px, py);
            ctx.lineTo(nx, ny);
        }

        // Close at the bottom
        ctx.lineTo(worldBaseX, worldBottom);
    };

    // Scan elements and append their side snow profiles to the current path for batched rendering
    for (const item of elementRects) {
        const { rect, acc } = item;

        if (acc.maxSideHeight === 0) continue;

        const hasLeftSnow = acc.leftMax > 0.3;
        const hasRightSnow = acc.rightMax > 0.3;

        if (!hasLeftSnow && !hasRightSnow) continue;

        if (hasLeftSnow) { drawSide(acc.leftSide, true, acc.sideGravityMultipliers, rect, scrollX, scrollY); hasAnyPath = true; }
        if (hasRightSnow) { drawSide(acc.rightSide, false, acc.sideGravityMultipliers, rect, scrollX, scrollY); hasAnyPath = true; }
    }

    if (!hasAnyPath) return;

    // Single fill — side profiles are too thin for a 1px shadow offset to be visible
    ctx.fillStyle = ACC_FILL_STYLE;
    ctx.fill();
};
