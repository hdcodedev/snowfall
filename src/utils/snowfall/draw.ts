import { Snowflake, ElementSurface } from './types';
import { VAL_BOTTOM } from './constants';

const ACC_FILL_STYLE = 'rgba(255, 255, 255, 0.95)';
const ACC_SHADOW_COLOR = 'rgba(200, 230, 255, 0.6)';



export const drawSnowflake = (ctx: CanvasRenderingContext2D, flake: Snowflake) => {
    // Flakes are tracked in World Space.
    // The Canvas Context is translated by (-scrollX, -scrollY), effectively viewing the World.
    // So we can draw flakes directly at their World (x, y) coordinates.

    // Core
    ctx.beginPath();
    ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.globalAlpha = flake.opacity;
    ctx.fill();

    // Glow effect
    ctx.beginPath();
    ctx.arc(flake.x, flake.y, flake.radius * 1.5, 0, Math.PI * 2);
    ctx.globalAlpha = flake.opacity * 0.2;
    ctx.fill();

    // Reset alpha for safety
    ctx.globalAlpha = 1.0;
};

export const drawAccumulations = (
    ctx: CanvasRenderingContext2D,
    elementRects: ElementSurface[]
) => {
    ctx.fillStyle = ACC_FILL_STYLE;
    ctx.shadowColor = ACC_SHADOW_COLOR;
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = -1;
    // Explicitly reset alpha as we modified it in drawSnowflake
    ctx.globalAlpha = 1.0;

    const currentScrollX = window.scrollX;
    const currentScrollY = window.scrollY;

    ctx.beginPath();

    // Iterate over all accumulation surfaces to build the single path
    for (const item of elementRects) {
        const { rect, acc } = item;

        if (!acc.heights.some(h => h > 0.1)) continue;

        // Convert Viewport Rect to World Space for Drawing (match Context)
        const dx = currentScrollX;
        const dy = currentScrollY;

        const isBottom = acc.type === VAL_BOTTOM;
        const baseY = isBottom ? rect.bottom - 1 : rect.top + 1;

        let first = true;
        const step = 2;
        const len = acc.heights.length;

        // Draw the uneven top surface of the snow
        for (let x = 0; x < len; x += step) {
            const height = acc.heights[x] || 0;
            const px = rect.left + x + dx;
            const py = baseY - height + (acc.curveOffsets[x] || 0) + dy;
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
            const px = rect.left + x + dx;
            const py = baseY - height + (acc.curveOffsets[x] || 0) + dy;
            ctx.lineTo(px, py);
        }

        // Draw the bottom edge (aligned with element border) to close the shape
        for (let x = len - 1; x >= 0; x -= step) {
            const px = rect.left + x + dx;
            const py = baseY + (acc.curveOffsets[x] || 0) + dy;
            ctx.lineTo(px, py);
        }

        const startX = 0;
        const startPx = rect.left + startX + dx;
        const startPy = baseY + (acc.curveOffsets[startX] || 0) + dy;
        ctx.lineTo(startPx, startPy);
    }

    // Fill all accumulations in one pass to batch shadow rendering
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
};

export const drawSideAccumulations = (
    ctx: CanvasRenderingContext2D,
    elementRects: ElementSurface[]
) => {
    ctx.fillStyle = ACC_FILL_STYLE;
    ctx.shadowColor = ACC_SHADOW_COLOR;
    ctx.shadowBlur = 3;
    ctx.globalAlpha = 1.0;

    const currentScrollX = window.scrollX;
    const currentScrollY = window.scrollY;

    ctx.beginPath();

    const drawSide = (sideArray: number[], isLeft: boolean, multipliers: number[], rect: DOMRect, dx: number, dy: number) => {
        const baseX = isLeft ? rect.left : rect.right;

        ctx.moveTo(baseX + dx, rect.top + dy);

        // Draw the uneven side profile
        for (let y = 0; y < sideArray.length; y += 2) {
            const width = sideArray[y] || 0;
            const nextY = Math.min(y + 2, sideArray.length - 1);
            const nextWidth = sideArray[nextY] || 0;

            const gravityMultiplier = multipliers[y] || 0;

            const py = rect.top + y + dy;
            const px = (isLeft ? baseX - (width * gravityMultiplier) : baseX + (width * gravityMultiplier)) + dx;
            const ny = rect.top + nextY + dy;
            const nGravityMultiplier = multipliers[nextY] || 0;
            const nx = (isLeft ? baseX - (nextWidth * nGravityMultiplier) : baseX + (nextWidth * nGravityMultiplier)) + dx;

            ctx.lineTo(px, py);
            ctx.lineTo(nx, ny);
        }

        // Close at the bottom
        ctx.lineTo(baseX + dx, rect.bottom + dy);
    };

    // Scan elements and append their side snow profiles to the current path for batched rendering
    for (const item of elementRects) {
        const { rect, acc } = item;

        if (acc.maxSideHeight === 0) continue;

        const hasLeftSnow = acc.leftSide.some(h => h > 0.3);
        const hasRightSnow = acc.rightSide.some(h => h > 0.3);

        if (!hasLeftSnow && !hasRightSnow) continue;

        const dx = currentScrollX;
        const dy = currentScrollY;

        if (hasLeftSnow) drawSide(acc.leftSide, true, acc.sideGravityMultipliers, rect, dx, dy);
        if (hasRightSnow) drawSide(acc.rightSide, false, acc.sideGravityMultipliers, rect, dx, dy);
    }

    ctx.fill();

    ctx.shadowBlur = 0;
};
