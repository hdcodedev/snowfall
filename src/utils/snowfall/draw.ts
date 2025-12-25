import { Snowflake, ElementSurface } from './types';
import { VAL_BOTTOM, TAU } from './constants';

const ACC_FILL_STYLE = 'rgba(255, 255, 255, 0.95)';
const ACC_SHADOW_COLOR = 'rgba(200, 230, 255, 0.6)';


/**
 * Single-pass snowflake rendering for optimal cache locality.
 * Flakes are tracked in World Space.
 * The Canvas Context is translated by (-scrollX, -scrollY), effectively viewing the World.
 * 
 * PERFORMANCE: All glow/core values are pre-calculated at creation time (physics.ts),
 * enabling a simple single-pass render with excellent cache performance.
 */
export const drawSnowflakes = (ctx: CanvasRenderingContext2D, flakes: Snowflake[]) => {
    if (flakes.length === 0) return;

    ctx.fillStyle = '#FFFFFF';

    // Single pass: Draw glow (behind) then core (front) for each flake
    for (const flake of flakes) {
        // Draw glow effect first (behind the core) - skip for background flakes
        if (!flake.isBackground) {
            ctx.globalAlpha = flake.glowOpacity;
            ctx.beginPath();
            ctx.arc(flake.x, flake.y, flake.glowRadius, 0, TAU);
            ctx.fill();
        }

        // Draw core on top
        ctx.globalAlpha = flake.opacity;
        ctx.beginPath();
        ctx.arc(flake.x, flake.y, flake.radius, 0, TAU);
        ctx.fill();
    }

    // Reset alpha once at the end
    ctx.globalAlpha = 1.0;
};

export const drawAccumulations = (
    ctx: CanvasRenderingContext2D,
    elementRects: ElementSurface[],
    scrollX: number,
    scrollY: number
) => {
    ctx.fillStyle = ACC_FILL_STYLE;
    ctx.shadowColor = ACC_SHADOW_COLOR;
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = -1;
    // Explicitly reset alpha as we modified it in drawSnowflake
    ctx.globalAlpha = 1.0;

    ctx.beginPath();

    // Iterate over all accumulation surfaces to build the single path
    for (const item of elementRects) {
        const { rect, acc } = item;

        if (!acc.heights.some(h => h > 0.1)) continue;

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
    }

    // Fill all accumulations in one pass to batch shadow rendering
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
};

export const drawSideAccumulations = (
    ctx: CanvasRenderingContext2D,
    elementRects: ElementSurface[],
    scrollX: number,
    scrollY: number
) => {
    ctx.fillStyle = ACC_FILL_STYLE;
    ctx.shadowColor = ACC_SHADOW_COLOR;
    ctx.shadowBlur = 3;
    ctx.globalAlpha = 1.0;

    ctx.beginPath();

    const drawSide = (sideArray: number[], isLeft: boolean, multipliers: number[], rect: DOMRect, dx: number, dy: number) => {
        const baseX = isLeft ? rect.left : rect.right;

        // Precompute world-space coordinates
        const worldBaseX = baseX + dx;
        const worldTop = rect.top + dy;
        const worldBottom = rect.bottom + dy;

        ctx.moveTo(worldBaseX, worldTop);

        // Draw the uneven side profile
        for (let y = 0; y < sideArray.length; y += 2) {
            const width = sideArray[y] || 0;
            const nextY = Math.min(y + 2, sideArray.length - 1);
            const nextWidth = sideArray[nextY] || 0;

            const gravityMultiplier = multipliers[y] || 0;

            const py = worldTop + y;
            const px = (isLeft ? worldBaseX - (width * gravityMultiplier) : worldBaseX + (width * gravityMultiplier));
            const ny = worldTop + nextY;
            const nGravityMultiplier = multipliers[nextY] || 0;
            const nx = (isLeft ? worldBaseX - (nextWidth * nGravityMultiplier) : worldBaseX + (nextWidth * nGravityMultiplier));

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

        const hasLeftSnow = acc.leftSide.some(h => h > 0.3);
        const hasRightSnow = acc.rightSide.some(h => h > 0.3);

        if (!hasLeftSnow && !hasRightSnow) continue;

        if (hasLeftSnow) drawSide(acc.leftSide, true, acc.sideGravityMultipliers, rect, scrollX, scrollY);
        if (hasRightSnow) drawSide(acc.rightSide, false, acc.sideGravityMultipliers, rect, scrollX, scrollY);
    }

    ctx.fill();

    ctx.shadowBlur = 0;
};
