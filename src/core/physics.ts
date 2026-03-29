import { PhysicsConfig } from '../components/SnowfallProvider';
import { Snowflake, SnowAccumulation, SnowfallSurface, ElementSurface } from './types';
import { getAccumulationSurfaces } from './dom';
import { VAL_BOTTOM, TAU } from './constants';

// Precomputed trig lookup table — eliminates Math.sin/Math.cos per flake per frame.
// 512 entries gives ~0.012 rad resolution, visually identical to exact trig.
const TRIG_TABLE_SIZE = 512;
const SIN_TABLE = new Float64Array(TRIG_TABLE_SIZE);
const COS_TABLE = new Float64Array(TRIG_TABLE_SIZE);
for (let i = 0; i < TRIG_TABLE_SIZE; i++) {
    const angle = (i / TRIG_TABLE_SIZE) * TAU;
    SIN_TABLE[i] = Math.sin(angle);
    COS_TABLE[i] = Math.cos(angle);
}

const trigSin = (angle: number): number => {
    const idx = ((angle % TAU + TAU) % TAU) * (TRIG_TABLE_SIZE / TAU) | 0;
    return SIN_TABLE[idx & (TRIG_TABLE_SIZE - 1)];
};

const trigCos = (angle: number): number => {
    const idx = ((angle % TAU + TAU) % TAU) * (TRIG_TABLE_SIZE / TAU) | 0;
    return COS_TABLE[idx & (TRIG_TABLE_SIZE - 1)];
};

export const createSnowflake = (
    worldWidth: number,
    config: PhysicsConfig,
    isBackground = false
): Snowflake => {
    // Two random calls per flake:
    // 1) horizontal position
    // 2) DNA seed for all other traits
    const x = Math.random() * worldWidth;
    const dna = Math.random();

    // Pseudo-random trait extraction from DNA
    const noise = {
        speed: (dna * 13) % 1,
        wind: (dna * 7) % 1,
        wobblePhase: (dna * 23) % 1,
        wobbleSpeed: (dna * 5) % 1
    };

    const { MIN, MAX } = config.FLAKE_SIZE;
    const sizeRatio = dna;

    // Background vs foreground tuning
    const profile = isBackground
        ? {
            sizeMin: MIN * 0.6,
            sizeRange: (MAX - MIN) * 0.4,
            speedBase: 0.2,
            speedScale: 0.3,
            noiseSpeedScale: 0.2,
            windScale: config.WIND_STRENGTH * 0.625,
            wobbleBase: 0.005,
            wobbleScale: 0.015
        }
        : {
            sizeMin: MIN,
            sizeRange: MAX - MIN,
            speedBase: 0.5,
            speedScale: 0.5,
            noiseSpeedScale: 0.3,
            windScale: config.WIND_STRENGTH,
            wobbleBase: 0.01,
            wobbleScale: 0.02
        };

    const radius = profile.sizeMin + sizeRatio * profile.sizeRange;
    const initialWobble = noise.wobblePhase * TAU;

    return {
        x: x,
        y: window.scrollY - 5,
        radius: radius,
        speed:
            radius * profile.speedScale +
            noise.speed * profile.noiseSpeedScale +
            profile.speedBase,
        wind: (noise.wind - 0.5) * profile.windScale,
        wobble: initialWobble,
        wobbleSpeed: noise.wobbleSpeed * profile.wobbleScale + profile.wobbleBase,
        sizeRatio: sizeRatio,
        isBackground: isBackground
    };
};

/**
 * Initialize max heights array for snow accumulation with edge tapering and smoothing.
 * Exported for benchmarking.
 */
export const initializeMaxHeights = (
    width: number,
    baseMax: number,
    borderRadius: number,
    isBottom: boolean = false
): number[] => {
    const maxHeights = new Array(width);
    for (let i = 0; i < width; i++) {
        let edgeFactor = 1.0;
        if (!isBottom && borderRadius > 0) {
            if (i < borderRadius) {
                edgeFactor = Math.pow(i / borderRadius, 1.2);
            } else if (i > width - borderRadius) {
                edgeFactor = Math.pow((width - i) / borderRadius, 1.2);
            }
        }
        maxHeights[i] = baseMax * edgeFactor * (0.85 + Math.random() * 0.15);
    }

    // Ping-pong buffer for smoothing — avoids allocating a new array each pass
    const smoothBuf = new Array(width);
    const smoothPasses = 4;
    for (let p = 0; p < smoothPasses; p++) {
        smoothBuf[0] = maxHeights[0];
        smoothBuf[width - 1] = maxHeights[width - 1];
        for (let i = 1; i < width - 1; i++) {
            smoothBuf[i] = (maxHeights[i - 1] + maxHeights[i] + maxHeights[i + 1]) / 3;
        }
        // Swap: copy smoothed result back into maxHeights
        for (let i = 0; i < width; i++) {
            maxHeights[i] = smoothBuf[i];
        }
    }

    return maxHeights;
};

const calculateCurveOffsets = (width: number, borderRadius: number, isBottom: boolean): number[] => {
    const offsets = new Array(width).fill(0);
    if (borderRadius <= 0 || isBottom) return offsets;

    for (let x = 0; x < width; x++) {
        let offset = 0;
        if (x < borderRadius) {
            const dist = borderRadius - x;
            offset = borderRadius - Math.sqrt(Math.max(0, borderRadius * borderRadius - dist * dist));
        } else if (x > width - borderRadius) {
            const dist = x - (width - borderRadius);
            offset = borderRadius - Math.sqrt(Math.max(0, borderRadius * borderRadius - dist * dist));
        }
        offsets[x] = offset;
    }
    return offsets;
};

const calculateGravityMultipliers = (height: number): number[] => {
    const multipliers = new Array(height);
    for (let i = 0; i < height; i++) {
        const ratio = i / height;
        multipliers[i] = Math.sqrt(ratio);
    }
    return multipliers;
};

export const initializeAccumulation = (
    accumulationMap: Map<Element, SnowAccumulation>,
    config: PhysicsConfig
) => {
    // Scan DOM for new valid surfaces
    const elements = getAccumulationSurfaces(config.MAX_SURFACES);
    // Prune disconnected elements
    for (const [el] of accumulationMap.entries()) {
        if (!el.isConnected) {
            accumulationMap.delete(el);
        }
    }

    // Batch all DOM reads BEFORE any writes to avoid layout thrashing.
    // getBoundingClientRect forces layout; getComputedStyle forces style recalc.
    // Interleaving them per-element causes N layout recalculations.
    // Batching gives us 1 layout + 1 style recalc total.
    const reads: { el: Element; type: SnowfallSurface; rect: DOMRect; styles: CSSStyleDeclaration; existing: SnowAccumulation | undefined }[] = [];
    for (const { el, type } of elements) {
        reads.push({
            el,
            type,
            rect: el.getBoundingClientRect(),
            styles: window.getComputedStyle(el),
            existing: accumulationMap.get(el),
        });
    }

    // Now do all writes using the batched reads
    for (const { el, type, rect, styles, existing } of reads) {
        const width = Math.ceil(rect.width);
        const isBottom = type === VAL_BOTTOM;

        if (existing && existing.heights.length === width) {
            existing.type = type;
            if (existing.borderRadius !== undefined) {
                existing.borderRadius = parseFloat(styles.borderTopLeftRadius) || 0;
                existing.curveOffsets = calculateCurveOffsets(width, existing.borderRadius, isBottom);
                // Initialize gravity multipliers if height matches but they're missing
                if (existing.leftSide.length === Math.ceil(rect.height) && !existing.sideGravityMultipliers) {
                    existing.sideGravityMultipliers = calculateGravityMultipliers(existing.leftSide.length);
                }
            }
            continue;
        }

        const height = Math.ceil(rect.height);
        const baseMax = isBottom ? config.MAX_DEPTH.BOTTOM : config.MAX_DEPTH.TOP;

        const borderRadius = parseFloat(styles.borderTopLeftRadius) || 0;

        const maxHeights = initializeMaxHeights(width, baseMax, borderRadius, isBottom);

        accumulationMap.set(el, {
            heights: existing?.heights.length === width ? existing.heights : new Array(width).fill(0),
            maxHeights,
            leftSide: existing?.leftSide.length === height ? existing.leftSide : new Array(height).fill(0),
            rightSide: existing?.rightSide.length === height ? existing.rightSide : new Array(height).fill(0),
            maxSideHeight: isBottom ? 0 : config.MAX_DEPTH.SIDE,
            leftMax: existing?.leftSide.length === height ? existing.leftMax : 0,
            rightMax: existing?.rightSide.length === height ? existing.rightMax : 0,
            maxHeight: existing?.maxHeight || 0,
            borderRadius,
            curveOffsets: calculateCurveOffsets(width, borderRadius, isBottom),
            sideGravityMultipliers: calculateGravityMultipliers(height),
            type,
            _smoothTemp: existing?._smoothTemp || [],
        });
    }
};

/**
 * Accumulate snow on a side array and return the new max height.
 * The caller should update acc.leftMax or acc.rightMax with the returned value.
 */
export const accumulateSide = (
    sideArray: number[],
    rectHeight: number,
    localY: number,
    maxSideHeight: number,
    borderRadius: number,
    config: PhysicsConfig,
    currentMax: number
): number => {
    const spread = 4;
    // Single random call instead of per-iteration
    const addHeight = config.ACCUMULATION.SIDE_RATE * (0.8 + Math.random() * 0.4);
    let newMax = currentMax;

    for (let dy = -spread; dy <= spread; dy++) {
        const y = localY + dy;
        if (y >= 0 && y < sideArray.length) {
            const inTop = y < borderRadius;
            const inBottom = y > rectHeight - borderRadius;
            if (borderRadius > 0 && (inTop || inBottom)) continue;

            const normalizedDist = Math.abs(dy) / spread;
            const falloff = (trigCos(normalizedDist * Math.PI) + 1) / 2;
            const newHeight = Math.min(maxSideHeight, sideArray[y] + addHeight * falloff);
            sideArray[y] = newHeight;
            if (newHeight > newMax) newMax = newHeight;
        }
    }
    return newMax;
};

/**
 * Update snowflake position and animation state.
 * This must happen every frame for smooth animation.
 */
const updateSnowflakePosition = (flake: Snowflake, dt: number): void => {
    flake.wobble += flake.wobbleSpeed * dt;

    // Calculate position with wobble effect using precomputed trig LUT
    flake.x += (flake.wind + trigSin(flake.wobble) * 0.5) * dt;
    flake.y += (flake.speed + trigCos(flake.wobble * 0.5) * 0.1) * dt;
};

/**
 * Check and handle side collisions (left/right edges of elements).
 * Returns true if snowflake landed on a side.
 */
const checkSideCollision = (
    flakeViewportX: number,
    flakeViewportY: number,
    rect: DOMRect,
    acc: SnowAccumulation,
    config: PhysicsConfig
): boolean => {
    const isInVerticalBounds = flakeViewportY >= rect.top && flakeViewportY <= rect.bottom;

    if (!isInVerticalBounds || acc.maxSideHeight <= 0) {
        return false;
    }

    const localY = Math.floor(flakeViewportY - rect.top);
    const borderRadius = acc.borderRadius;

    const isInTopCorner = localY < borderRadius;
    const isInBottomCorner = localY > rect.height - borderRadius;
    const isCorner = borderRadius > 0 && (isInTopCorner || isInBottomCorner);

    if (isCorner) {
        return false;
    }

    // Check left side
    if (flakeViewportX >= rect.left - 5 && flakeViewportX < rect.left + 3) {
        acc.leftMax = accumulateSide(acc.leftSide, rect.height, localY, acc.maxSideHeight, borderRadius, config, acc.leftMax);
        return true;
    }

    // Check right side
    if (flakeViewportX > rect.right - 3 && flakeViewportX <= rect.right + 5) {
        acc.rightMax = accumulateSide(acc.rightSide, rect.height, localY, acc.maxSideHeight, borderRadius, config, acc.rightMax);
        return true;
    }

    return false;
};

/**
 * Check and handle top/bottom surface collisions.
 * Returns true if snowflake landed on the surface.
 */
const checkSurfaceCollision = (
    flake: Snowflake,
    flakeViewportX: number,
    flakeViewportY: number,
    rect: DOMRect,
    acc: SnowAccumulation,
    isBottom: boolean,
    config: PhysicsConfig
): boolean => {
    if (flakeViewportX < rect.left || flakeViewportX > rect.right) {
        return false;
    }

    const localX = Math.floor(flakeViewportX - rect.left);
    const currentHeight = acc.heights[localX] || 0;
    const maxHeight = acc.maxHeights[localX] || 5;
    const surfaceY = isBottom ? rect.bottom - currentHeight : rect.top - currentHeight;

    if (flakeViewportY < surfaceY || flakeViewportY >= surfaceY + 10 || currentHeight >= maxHeight) {
        return false;
    }

    // For bottom surfaces, probabilistically skip accumulation (85% chance).
    // Hoisted before spread computation to avoid wasted work.
    if (isBottom && Math.random() >= 0.15) {
        return false;
    }

    // Precompute all random values once instead of calling Math.random() 5+ times.
    // This reduces random calls from ~(2 + spread*2) to exactly 3 per collision.
    const baseSpread = Math.ceil(flake.radius);
    const rand1 = Math.random();
    const rand2 = Math.random();
    const spread = baseSpread + (rand1 < 0.5 ? 0 : 1);
    const accumRate = isBottom ? config.ACCUMULATION.BOTTOM_RATE : config.ACCUMULATION.TOP_RATE;
    const centerOffset = (rand2 * 3 | 0) - 1; // -1, 0, or 1

    // Deterministic skip: use position-based pattern instead of random per pixel.
    // Skips ~15% of pixels in a distributed pattern (visually identical to random).
    const skipPattern = 6; // skip every 7th pixel (≈14.3%)

    for (let dx = -spread; dx <= spread; dx++) {
        // Deterministic skip based on position — eliminates Math.random() from inner loop
        if (((localX + dx) & skipPattern) === 0) continue;
        const idx = localX + dx + centerOffset;
        if (idx >= 0 && idx < acc.heights.length) {
            const dist = Math.abs(dx);
            const pixelMax = acc.maxHeights[idx] || 5;

            const normDist = dist / spread;
            const falloff = (trigCos(normDist * Math.PI) + 1) / 2;
            const baseAdd = 0.3 * falloff;

            // Use precomputed rand value with position-based variation instead of new random
            const randomFactor = 0.8 + ((rand1 + dx * 0.1) % 1) * 0.4;
            const addHeight = baseAdd * randomFactor * accumRate;

            if (acc.heights[idx] < pixelMax && addHeight > 0) {
                const newH = Math.min(pixelMax, acc.heights[idx] + addHeight);
                acc.heights[idx] = newH;
                if (newH > acc.maxHeight) acc.maxHeight = newH;
            }
        }
    }

    return true;
};

/**
 * Check if snowflake should be removed (out of bounds or landed).
 */
const shouldRemoveSnowflake = (
    flake: Snowflake,
    landed: boolean,
    worldWidth: number,
    worldHeight: number
): boolean => {
    return landed ||
        flake.y > worldHeight + 10 ||
        flake.x < -20 ||
        flake.x > worldWidth + 20;
};

export const updateSnowflakes = (
    snowflakes: Snowflake[],
    elementRects: ElementSurface[],
    config: PhysicsConfig,
    dt: number,
    worldWidth: number,
    worldHeight: number,
    scrollX: number,
    scrollY: number,
    frameIndex: number = 0
) => {
    // Scroll used for World -> Viewport mapping for collision.
    // Flakes are in World Space, DOM Rects are in Viewport Space.
    // Passed from animation loop which already reads these values.

    // Deterministic collision check: spread checks across frames instead of Math.random().
    // Each frame, only flakes whose index matches (frameIndex % divisor) check collisions.
    const collisionDivisor = Math.max(1, Math.round(1 / config.COLLISION_CHECK_RATE));

    let i = snowflakes.length;
    while (i-- > 0) {
        const flake = snowflakes[i];

        // Always update position and animation (cheap, must happen every frame)
        updateSnowflakePosition(flake, dt);

        let landed = false;

        // Deterministic collision detection: only a subset of flakes check per frame
        if (i % collisionDivisor === frameIndex % collisionDivisor) {
            // Map flake from World Space to Viewport Space for collision detection
            const flakeViewportX = flake.x - scrollX;
            const flakeViewportY = flake.y - scrollY;

            for (const item of elementRects) {
                const { rect, acc } = item;
                const isBottom = acc.type === VAL_BOTTOM;

                // Check side collisions (left/right edges)
                if (!landed && !isBottom) {
                    landed = checkSideCollision(flakeViewportX, flakeViewportY, rect, acc, config);
                    if (landed) break;
                }

                // Check top/bottom surface collisions
                if (!landed) {
                    landed = checkSurfaceCollision(flake, flakeViewportX, flakeViewportY, rect, acc, isBottom, config);
                    if (landed) break;
                }
            }
        }

        // Remove snowflake if it landed or went out of bounds.
        // Swap-and-pop: O(1) removal instead of O(n) splice.
        if (shouldRemoveSnowflake(flake, landed, worldWidth, worldHeight)) {
            const lastIdx = snowflakes.length - 1;
            if (i < lastIdx) {
                snowflakes[i] = snowflakes[lastIdx];
            }
            snowflakes.length = lastIdx;
        }
    }
};

export const meltAndSmoothAccumulation = (
    elementRects: ElementSurface[],
    config: PhysicsConfig,
    dt: number,
    frameIndex: number = 0
) => {
    // Smooth only every 3 frames — visual difference is imperceptible, saves ~66% of smoothing work
    const shouldSmooth = frameIndex % 3 === 0;

    for (const { acc } of elementRects) {
        const meltRate = config.MELT_SPEED * dt;
        const len = acc.heights.length;

        // Smooth in-place using persistent temp buffer (avoids allocating [...acc.heights] every frame)
        if (shouldSmooth && len > 2) {
            // Reuse or grow temp buffer
            if (acc._smoothTemp.length < len) {
                acc._smoothTemp = new Array(len);
            }

            // Read from heights, write smoothed values to temp
            acc._smoothTemp[0] = acc.heights[0];
            for (let i = 1; i < len - 1; i++) {
                if (acc.heights[i] > 0.05) {
                    const avg = (acc.heights[i - 1] + acc.heights[i + 1]) / 2;
                    acc._smoothTemp[i] = acc.heights[i] * 0.99 + avg * 0.01;
                } else {
                    acc._smoothTemp[i] = acc.heights[i];
                }
            }
            acc._smoothTemp[len - 1] = acc.heights[len - 1];

            // Copy back in-place
            for (let i = 0; i < len; i++) {
                acc.heights[i] = acc._smoothTemp[i];
            }
        }

        // Melt
        let newMaxHeight = 0;
        for (let i = 0; i < len; i++) {
            const h = acc.heights[i];
            if (h > 0) {
                // Clamp to 0 to avoid tiny negative floats lingering
                const melted = h - meltRate;
                const clamped = melted > 0 ? melted : 0;
                acc.heights[i] = clamped;
                if (clamped > newMaxHeight) newMaxHeight = clamped;
            }
        }
        acc.maxHeight = newMaxHeight;
        // Melt sides and update max values
        let leftMax = 0;
        let rightMax = 0;
        const sideLen = acc.leftSide.length;
        for (let i = 0; i < sideLen; i++) {
            const l = acc.leftSide[i];
            if (l > 0) {
                const melted = l - meltRate;
                const clamped = melted > 0 ? melted : 0;
                acc.leftSide[i] = clamped;
                if (clamped > leftMax) leftMax = clamped;
            }
            const r = acc.rightSide[i];
            if (r > 0) {
                const melted = r - meltRate;
                const clamped = melted > 0 ? melted : 0;
                acc.rightSide[i] = clamped;
                if (clamped > rightMax) rightMax = clamped;
            }
        }
        acc.leftMax = leftMax;
        acc.rightMax = rightMax;
    }
};
