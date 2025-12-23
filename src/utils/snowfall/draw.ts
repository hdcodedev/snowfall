import { Snowflake, ElementSurface } from './types';
import { VAL_BOTTOM } from './constants';

export const drawSnowflake = (ctx: CanvasRenderingContext2D, flake: Snowflake) => {
    // Flakes are tracked in World Space.
    // The Canvas Context is translated by (-scrollX, -scrollY), effectively viewing the World.
    // So we can draw flakes directly at their World (x, y) coordinates.
    ctx.beginPath();
    ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${flake.opacity})`;
    ctx.fill();

    // Glow effect
    ctx.beginPath();
    ctx.arc(flake.x, flake.y, flake.radius * 1.5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${flake.opacity * 0.2})`;
    ctx.fill();
};

export const drawAccumulations = (
    ctx: CanvasRenderingContext2D,
    elementRects: ElementSurface[]
) => {
    const setupCtx = (c: CanvasRenderingContext2D) => {
        c.fillStyle = 'rgba(255, 255, 255, 0.95)';
        c.shadowColor = 'rgba(200, 230, 255, 0.6)';
        c.shadowBlur = 4;
        c.shadowOffsetY = -1;
    };
    setupCtx(ctx);

    const currentScrollX = window.scrollX;
    const currentScrollY = window.scrollY;

    for (const item of elementRects) {
        const { rect, acc } = item;

        if (!acc.heights.some(h => h > 0.1)) continue;

        // Convert Viewport Rect to World Space for Drawing (match Context)
        // The Canvas Context is translated by (-scrollX, -scrollY) to simulate a camera.
        // We need to draw in World coordinates.
        // Element Rects are in Viewport Coordinates (from getBoundingClientRect).
        // World Coordinate = Viewport Coordinate + Scroll Offset.
        const dx = currentScrollX;
        const dy = currentScrollY;

        const isBottom = acc.type === VAL_BOTTOM;
        const baseY = isBottom ? rect.bottom - 1 : rect.top + 1;
        const borderRadius = acc.borderRadius;

        const getCurveOffset = (xPos: number) => {
            if (borderRadius <= 0 || isBottom) return 0;
            let offset = 0;
            if (xPos < borderRadius) {
                const dist = borderRadius - xPos;
                offset = borderRadius - Math.sqrt(Math.max(0, borderRadius * borderRadius - dist * dist));
            } else if (xPos > rect.width - borderRadius) {
                const dist = xPos - (rect.width - borderRadius);
                offset = borderRadius - Math.sqrt(Math.max(0, borderRadius * borderRadius - dist * dist));
            }
            return offset;
        };

        ctx.beginPath();
        let first = true;
        const step = 2;
        const len = acc.heights.length;

        for (let x = 0; x < len; x += step) {
            const height = acc.heights[x] || 0;
            const px = rect.left + x + dx;
            const py = baseY - height + getCurveOffset(x) + dy;
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
            const py = baseY - height + getCurveOffset(x) + dy;
            ctx.lineTo(px, py);
        }

        for (let x = len - 1; x >= 0; x -= step) {
            const px = rect.left + x + dx;
            const py = baseY + getCurveOffset(x) + dy;
            ctx.lineTo(px, py);
        }

        const startX = 0;
        const startPx = rect.left + startX + dx;
        const startPy = baseY + getCurveOffset(startX) + dy;
        ctx.lineTo(startPx, startPy);

        ctx.closePath();
        ctx.fill();
    }

    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
};

export const drawSideAccumulations = (
    ctx: CanvasRenderingContext2D,
    elementRects: ElementSurface[]
) => {
    const setupCtx = (c: CanvasRenderingContext2D) => {
        c.fillStyle = 'rgba(255, 255, 255, 0.95)';
        c.shadowColor = 'rgba(200, 230, 255, 0.6)';
        c.shadowBlur = 3;
    };
    setupCtx(ctx);

    const currentScrollX = window.scrollX;
    const currentScrollY = window.scrollY;

    for (const item of elementRects) {
        const { rect, acc } = item;

        if (acc.maxSideHeight === 0) continue;

        const hasLeftSnow = acc.leftSide.some(h => h > 0.3);
        const hasRightSnow = acc.rightSide.some(h => h > 0.3);

        if (!hasLeftSnow && !hasRightSnow) continue;

        const dx = currentScrollX;
        const dy = currentScrollY;

        const drawSide = (sideArray: number[], isLeft: boolean) => {
            ctx.beginPath();
            const baseX = isLeft ? rect.left : rect.right;

            ctx.moveTo(baseX + dx, rect.top + dy);

            for (let y = 0; y < sideArray.length; y += 2) {
                const width = sideArray[y] || 0;
                const nextY = Math.min(y + 2, sideArray.length - 1);
                const nextWidth = sideArray[nextY] || 0;

                const heightRatio = y / sideArray.length;
                const gravityMultiplier = Math.pow(heightRatio, 1.5);

                const py = rect.top + y + dy;
                const px = (isLeft ? baseX - (width * gravityMultiplier) : baseX + (width * gravityMultiplier)) + dx;
                const ny = rect.top + nextY + dy;
                const nRatio = nextY / sideArray.length;
                const nGravityMultiplier = Math.pow(nRatio, 1.5);
                const nx = (isLeft ? baseX - (nextWidth * nGravityMultiplier) : baseX + (nextWidth * nGravityMultiplier)) + dx;

                ctx.lineTo(px, py);
                ctx.lineTo(nx, ny);
            }

            // Close at the bottom
            ctx.lineTo(baseX + dx, rect.bottom + dy);
            ctx.closePath();
            ctx.fill();
        };

        if (hasLeftSnow) drawSide(acc.leftSide, true);
        if (hasRightSnow) drawSide(acc.rightSide, false);
    }

    ctx.shadowBlur = 0;
};
