import { PhysicsConfig } from '../components/SnowfallProvider';
import { Snowflake, SnowAccumulation, ElementSurface } from './types';
import { getAccumulationSurfaces } from './dom';
import { VAL_BOTTOM, TAU, BUCKET_SIZE } from './constants';

// Precomputed trig lookup table — eliminates Math.sin/Math.cos per flake per frame.
// 512 entries gives ~0.012 rad resolution, visually identical to exact trig.
const TRIG_TABLE_SIZE = 512;
const TRIG_TABLE_MASK = TRIG_TABLE_SIZE - 1; // 511 — for branchless index wrapping
const TRIG_ANGLE_SCALE = TRIG_TABLE_SIZE / TAU; // precomputed to avoid division per lookup
const SIN_TABLE = new Float64Array(TRIG_TABLE_SIZE);
const COS_TABLE = new Float64Array(TRIG_TABLE_SIZE);
for (let i = 0; i < TRIG_TABLE_SIZE; i++) {
    const angle = (i / TRIG_TABLE_SIZE) * TAU;
    SIN_TABLE[i] = Math.sin(angle);
    COS_TABLE[i] = Math.cos(angle);
}

const trigSin = (angle: number): number => {
    const normalized = angle < 0 ? angle % TAU + TAU : angle % TAU;
    return SIN_TABLE[(normalized * TRIG_ANGLE_SCALE | 0) & TRIG_TABLE_MASK];
};

const trigCos = (angle: number): number => {
    const normalized = angle < 0 ? angle % TAU + TAU : angle % TAU;
    return COS_TABLE[(normalized * TRIG_ANGLE_SCALE | 0) & TRIG_TABLE_MASK];
};

// Precomputed falloff table for collision spread — avoids trigCos(normDist * PI) per bucket per collision.
// Index = normalized distance [0..1] mapped to 0..FALLOFF_TABLE_SIZE-1.
// Value = (cos(index/FALLOFF_TABLE_SIZE * PI) + 1) / 2
const FALLOFF_TABLE_SIZE = 64;
const FALLOFF_TABLE = new Float64Array(FALLOFF_TABLE_SIZE);
for (let i = 0; i < FALLOFF_TABLE_SIZE; i++) {
    const normDist = i / (FALLOFF_TABLE_SIZE - 1);
    FALLOFF_TABLE[i] = (Math.cos(normDist * Math.PI) + 1) / 2;
}

/** Look up precomputed falloff curve by normalized distance [0..1]. */
const falloffLookup = (normDist: number): number => {
    const idx = (normDist * (FALLOFF_TABLE_SIZE - 1) + 0.5) | 0;
    return FALLOFF_TABLE[idx < 0 ? 0 : idx >= FALLOFF_TABLE_SIZE ? FALLOFF_TABLE_SIZE - 1 : idx];
};

/** Convert a pixel coordinate to a bucket index. */
const toBucket = (pixel: number): number => (pixel / BUCKET_SIZE) | 0;

export const createSnowflake = (
    worldWidth: number,
    config: PhysicsConfig,
    isBackground = false
): Snowflake => {
    const x = Math.random() * worldWidth;
    const dna = Math.random();

    const noise = {
        speed: (dna * 13) % 1,
        wind: (dna * 7) % 1,
        wobblePhase: (dna * 23) % 1,
        wobbleSpeed: (dna * 5) % 1
    };

    const { MIN, MAX } = config.FLAKE_SIZE;

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

    const radius = profile.sizeMin + dna * profile.sizeRange;
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
    };
};

/**
 * Initialize max heights array for snow accumulation with edge tapering and smoothing.
 * Operates on bucket resolution (ceil(width / BUCKET_SIZE) buckets).
 * Exported for benchmarking.
 */
export const initializeMaxHeights = (
    width: number,
    baseMax: number,
    borderRadius: number,
    isBottom: boolean = false
): Float32Array => {
    const bucketCount = Math.ceil(width / BUCKET_SIZE);
    const maxHeights = new Float32Array(bucketCount);

    for (let b = 0; b < bucketCount; b++) {
        const pixelCenter = b * BUCKET_SIZE + BUCKET_SIZE / 2;
        let edgeFactor = 1.0;
        if (!isBottom && borderRadius > 0) {
            if (pixelCenter < borderRadius) {
                edgeFactor = Math.pow(pixelCenter / borderRadius, 1.2);
            } else if (pixelCenter > width - borderRadius) {
                edgeFactor = Math.pow((width - pixelCenter) / borderRadius, 1.2);
            }
        }
        maxHeights[b] = baseMax * edgeFactor * (0.85 + Math.random() * 0.15);
    }

    const smoothBuf = new Float32Array(bucketCount);
    const smoothPasses = 4;
    for (let p = 0; p < smoothPasses; p++) {
        smoothBuf[0] = maxHeights[0];
        smoothBuf[bucketCount - 1] = maxHeights[bucketCount - 1];
        for (let i = 1; i < bucketCount - 1; i++) {
            smoothBuf[i] = (maxHeights[i - 1] + maxHeights[i] + maxHeights[i + 1]) / 3;
        }
        maxHeights.set(smoothBuf);
    }

    return maxHeights;
};

const calculateCurveOffsets = (width: number, borderRadius: number, isBottom: boolean): Float32Array => {
    const bucketCount = Math.ceil(width / BUCKET_SIZE);
    const offsets = new Float32Array(bucketCount);
    if (borderRadius <= 0 || isBottom) return offsets;

    for (let b = 0; b < bucketCount; b++) {
        const pixelCenter = b * BUCKET_SIZE + BUCKET_SIZE / 2;
        let offset = 0;
        if (pixelCenter < borderRadius) {
            const dist = borderRadius - pixelCenter;
            offset = borderRadius - Math.sqrt(Math.max(0, borderRadius * borderRadius - dist * dist));
        } else if (pixelCenter > width - borderRadius) {
            const dist = pixelCenter - (width - borderRadius);
            offset = borderRadius - Math.sqrt(Math.max(0, borderRadius * borderRadius - dist * dist));
        }
        offsets[b] = offset;
    }
    return offsets;
};

const calculateGravityMultipliers = (height: number): Float32Array => {
    const bucketCount = Math.ceil(height / BUCKET_SIZE);
    const multipliers = new Float32Array(bucketCount);
    for (let b = 0; b < bucketCount; b++) {
        const pixelCenter = b * BUCKET_SIZE + BUCKET_SIZE / 2;
        const ratio = pixelCenter / height;
        multipliers[b] = Math.sqrt(ratio);
    }
    return multipliers;
};

export const initializeAccumulation = (
    accumulationMap: Map<Element, SnowAccumulation>,
    config: PhysicsConfig
) => {
    const elements = getAccumulationSurfaces(config.MAX_SURFACES);
    for (const [el] of accumulationMap.entries()) {
        if (!el.isConnected) {
            accumulationMap.delete(el);
        }
    }

    for (const { el, type } of elements) {
        const rect = el.getBoundingClientRect();
        const styles = window.getComputedStyle(el);
        const existing = accumulationMap.get(el);
        const width = Math.ceil(rect.width);
        const isBottom = type === VAL_BOTTOM;
        const bucketCount = Math.ceil(width / BUCKET_SIZE);

        if (existing && existing.heights.length === bucketCount) {
            existing.type = type;
            if (existing.borderRadius !== undefined) {
                existing.borderRadius = parseFloat(styles.borderTopLeftRadius) || 0;
                existing.curveOffsets = calculateCurveOffsets(width, existing.borderRadius, isBottom);
                const sideBucketCount = Math.ceil(Math.ceil(rect.height) / BUCKET_SIZE);
                if (existing.leftSide.length === sideBucketCount && !existing.sideGravityMultipliers.length) {
                    existing.sideGravityMultipliers = calculateGravityMultipliers(Math.ceil(rect.height));
                }
            }
            continue;
        }

        const height = Math.ceil(rect.height);
        const baseMax = isBottom ? config.MAX_DEPTH.BOTTOM : config.MAX_DEPTH.TOP;
        const borderRadius = parseFloat(styles.borderTopLeftRadius) || 0;
        const sideBucketCount = Math.ceil(height / BUCKET_SIZE);

        const maxHeights = initializeMaxHeights(width, baseMax, borderRadius, isBottom);

        accumulationMap.set(el, {
            heights: existing?.heights.length === bucketCount ? existing.heights : new Float32Array(bucketCount),
            maxHeights,
            leftSide: existing?.leftSide.length === sideBucketCount ? existing.leftSide : new Float32Array(sideBucketCount),
            rightSide: existing?.rightSide.length === sideBucketCount ? existing.rightSide : new Float32Array(sideBucketCount),
            maxSideHeight: isBottom ? 0 : config.MAX_DEPTH.SIDE,
            leftMax: existing?.leftSide.length === sideBucketCount ? existing.leftMax : 0,
            rightMax: existing?.rightSide.length === sideBucketCount ? existing.rightMax : 0,
            maxHeight: existing?.maxHeight || 0,
            borderRadius,
            curveOffsets: calculateCurveOffsets(width, borderRadius, isBottom),
            sideGravityMultipliers: calculateGravityMultipliers(height),
            type,
            _smoothTemp: existing?._smoothTemp?.length === bucketCount ? existing._smoothTemp : new Float32Array(bucketCount),
            dirtyMin: existing?.dirtyMin ?? bucketCount,
            dirtyMax: existing?.dirtyMax ?? 0,
            bucketSize: BUCKET_SIZE,
            _cacheCanvas: existing?._cacheCanvas ?? null,
            _cacheCtx: existing?._cacheCtx ?? null,
            _cacheMaxHeight: existing?._cacheMaxHeight ?? -1,
        });
    }
};

const markDirty = (acc: SnowAccumulation, bucketIdx: number): void => {
    if (bucketIdx < acc.dirtyMin) acc.dirtyMin = bucketIdx;
    if (bucketIdx > acc.dirtyMax) acc.dirtyMax = bucketIdx;
};

/**
 * Accumulate snow on a side array and return the new max height.
 * Operates at bucket resolution.
 */
export const accumulateSide = (
    sideArray: Float32Array,
    rectHeight: number,
    localYPixel: number,
    maxSideHeight: number,
    borderRadius: number,
    sideRate: number,
    currentMax: number
): number => {
    const spreadBuckets = Math.max(1, Math.ceil(4 / BUCKET_SIZE));
    const localBucket = toBucket(localYPixel);
    const addHeight = sideRate * (0.8 + Math.random() * 0.4);
    let newMax = currentMax;

    for (let db = -spreadBuckets; db <= spreadBuckets; db++) {
        const b = localBucket + db;
        if (b >= 0 && b < sideArray.length) {
            const pixelCenter = b * BUCKET_SIZE + BUCKET_SIZE / 2;
            const inTop = pixelCenter < borderRadius;
            const inBottom = pixelCenter > rectHeight - borderRadius;
            if (borderRadius > 0 && (inTop || inBottom)) continue;

            const normalizedDist = Math.abs(db) / spreadBuckets;
            const falloff = falloffLookup(normalizedDist);
            const newHeight = Math.min(maxSideHeight, sideArray[b] + addHeight * falloff);
            sideArray[b] = newHeight;
            if (newHeight > newMax) newMax = newHeight;
        }
    }
    return newMax;
};

const updateSnowflakePosition = (flake: Snowflake, dt: number): void => {
    flake.wobble += flake.wobbleSpeed * dt;
    flake.x += (flake.wind + trigSin(flake.wobble) * 0.5) * dt;
    flake.y += (flake.speed + trigCos(flake.wobble * 0.5) * 0.1) * dt;
};

const checkSideCollision = (
    flakeViewportX: number,
    flakeViewportY: number,
    rect: DOMRect,
    acc: SnowAccumulation,
    sideRate: number
): boolean => {
    const isInVerticalBounds = flakeViewportY >= rect.top && flakeViewportY <= rect.bottom;

    if (!isInVerticalBounds || acc.maxSideHeight <= 0) {
        return false;
    }

    const localY = Math.floor(flakeViewportY - rect.top);
    const borderRadius = acc.borderRadius;

    const localBucket = toBucket(localY);
    const pixelCenter = localBucket * BUCKET_SIZE + BUCKET_SIZE / 2;
    const isInTopCorner = pixelCenter < borderRadius;
    const isInBottomCorner = pixelCenter > rect.height - borderRadius;
    const isCorner = borderRadius > 0 && (isInTopCorner || isInBottomCorner);

    if (isCorner) {
        return false;
    }

    // Check left side
    if (flakeViewportX >= rect.left - 5 && flakeViewportX < rect.left + 3) {
        acc.leftMax = accumulateSide(acc.leftSide, rect.height, localY, acc.maxSideHeight, borderRadius, sideRate, acc.leftMax);
        return true;
    }

    // Check right side
    if (flakeViewportX > rect.right - 3 && flakeViewportX <= rect.right + 5) {
        acc.rightMax = accumulateSide(acc.rightSide, rect.height, localY, acc.maxSideHeight, borderRadius, sideRate, acc.rightMax);
        return true;
    }

    return false;
};

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

    const localXPixel = Math.floor(flakeViewportX - rect.left);
    const bucketIdx = toBucket(localXPixel);
    if (bucketIdx < 0 || bucketIdx >= acc.heights.length) return false;

    const currentHeight = acc.heights[bucketIdx];
    const maxHeight = acc.maxHeights[bucketIdx];
    const surfaceY = isBottom ? rect.bottom - currentHeight : rect.top - currentHeight;

    if (flakeViewportY < surfaceY || flakeViewportY >= surfaceY + 10 || currentHeight >= maxHeight) {
        return false;
    }

    if (isBottom && Math.random() >= 0.15) {
        return false;
    }

    const baseSpreadBuckets = Math.max(1, Math.ceil(flake.radius / BUCKET_SIZE));
    const rand1 = Math.random();
    const rand2 = Math.random();
    const spreadBuckets = baseSpreadBuckets + (rand1 < 0.5 ? 0 : 1);
    const accumRate = isBottom ? config.ACCUMULATION.BOTTOM_RATE : config.ACCUMULATION.TOP_RATE;
    const centerOffset = (rand2 * 3 | 0) - 1;

    for (let db = -spreadBuckets; db <= spreadBuckets; db++) {
        if (Math.random() < 0.15) continue;
        const b = bucketIdx + db + centerOffset;
        if (b >= 0 && b < acc.heights.length) {
            const dist = Math.abs(db);
            const pixelMax = acc.maxHeights[b];

            const normDist = dist / spreadBuckets;
            const falloff = falloffLookup(normDist);
            const baseAdd = 0.3 * falloff;

            const randomFactor = 0.8 + ((rand1 + db * 0.1) % 1) * 0.4;
            const addHeight = baseAdd * randomFactor * accumRate;

            if (acc.heights[b] < pixelMax && addHeight > 0) {
                const newH = Math.min(pixelMax, acc.heights[b] + addHeight);
                acc.heights[b] = newH;
                if (newH > acc.maxHeight) acc.maxHeight = newH;
                markDirty(acc, b);
            }
        }
    }

    return true;
};

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

/**
 * Compute the viewport-space bounding box of all surfaces.
 * Used as a cheap pre-filter: flakes outside this box skip all collision checks.
 */
const computeSurfacesBoundingBox = (
    elementRects: ElementSurface[]
): { top: number; bottom: number; left: number; right: number } => {
    let top = Infinity, bottom = -Infinity, left = Infinity, right = -Infinity;
    for (let i = 0; i < elementRects.length; i++) {
        const r = elementRects[i].rect;
        if (r.top < top) top = r.top;
        if (r.bottom > bottom) bottom = r.bottom;
        if (r.left < left) left = r.left;
        if (r.right > right) right = r.right;
    }
    return { top, bottom, left, right };
};

// Vertical padding above/below surfaces for collision — flakes this far from the
// bounding box are guaranteed to not collide with any surface.
const COLLISION_PROXIMITY_Y = 60;
// Horizontal padding for side collisions
const COLLISION_PROXIMITY_X = 10;

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
    const collisionDivisor = Math.max(1, Math.round(1 / config.COLLISION_CHECK_RATE));
    const sideRate = config.ACCUMULATION.SIDE_RATE;

    // Spatial pre-filter: compute bounding box of all surfaces once per frame.
    // Flakes outside this box skip the entire per-surface collision loop.
    const bbox = computeSurfacesBoundingBox(elementRects);
    const bboxTop = bbox.top - COLLISION_PROXIMITY_Y;
    const bboxBottom = bbox.bottom + COLLISION_PROXIMITY_Y;
    const bboxLeft = bbox.left - COLLISION_PROXIMITY_X;
    const bboxRight = bbox.right + COLLISION_PROXIMITY_X;

    let i = snowflakes.length;
    while (i-- > 0) {
        const flake = snowflakes[i];

        updateSnowflakePosition(flake, dt);

        let landed = false;

        if (i % collisionDivisor === frameIndex % collisionDivisor) {
            const flakeViewportX = flake.x - scrollX;
            const flakeViewportY = flake.y - scrollY;

            // Spatial pre-filter: skip all collision checks if flake is far from all surfaces.
            // This eliminates ~90% of collision iterations for typical pages where surfaces
            // occupy a small fraction of the viewport.
            const inProximity = flakeViewportY >= bboxTop &&
                flakeViewportY <= bboxBottom &&
                flakeViewportX >= bboxLeft &&
                flakeViewportX <= bboxRight;

            if (inProximity) {
                for (const item of elementRects) {
                    const { rect, acc } = item;
                    const isBottom = acc.type === VAL_BOTTOM;

                    if (!landed && !isBottom) {
                        landed = checkSideCollision(flakeViewportX, flakeViewportY, rect, acc, sideRate);
                        if (landed) {
                            item.hasChanged = true;
                            break;
                        }
                    }

                    if (!landed) {
                        landed = checkSurfaceCollision(flake, flakeViewportX, flakeViewportY, rect, acc, isBottom, config);
                        if (landed) {
                            item.hasChanged = true;
                            break;
                        }
                    }
                }
            }
        }

        if (shouldRemoveSnowflake(flake, landed, worldWidth, worldHeight)) {
            const lastIdx = snowflakes.length - 1;
            if (i < lastIdx) {
                snowflakes[i] = snowflakes[lastIdx];
            }
            snowflakes.length = lastIdx;
        }
    }
};

// Smoothing runs every SMOOTH_INTERVAL_FRAMES instead of every frame.
// At 60fps, smoothing at 15fps is visually identical for snow surfaces.
const SMOOTH_INTERVAL_FRAMES = 4;
const MELT_INTERVAL_FRAMES = 3;
// Minimum dirty region size (in buckets) to justify smoothing.
// Below this threshold, smoothing produces no visible effect.
const MIN_SMOOTH_DIRTY_SIZE = 6;

export const meltAndSmoothAccumulation = (
    elementRects: ElementSurface[],
    config: PhysicsConfig,
    dt: number,
    frameIndex: number = 0
) => {
    const shouldMelt = frameIndex % MELT_INTERVAL_FRAMES === 0;
    const shouldSmooth = frameIndex % SMOOTH_INTERVAL_FRAMES === 0;
    const meltRate = shouldMelt ? config.MELT_SPEED * dt * MELT_INTERVAL_FRAMES : 0;

    for (const { acc } of elementRects) {
        const len = acc.heights.length;

        if (acc.dirtyMin > acc.dirtyMax) continue;

        const dMin = Math.max(1, acc.dirtyMin);
        const dMax = Math.min(len - 2, acc.dirtyMax);
        const dirtySize = dMax - dMin + 1;

        // Only smooth when dirty region is large enough to matter
        const doSmooth = shouldSmooth && dirtySize >= MIN_SMOOTH_DIRTY_SIZE;

        let newMaxHeight = 0;

        if (doSmooth && meltRate > 0) {
            // Combined smooth + melt pass
            for (let i = dMin; i <= dMax; i++) {
                const h = acc.heights[i];
                if (h > 0.05) {
                    const avg = (acc.heights[i - 1] + acc.heights[i + 1]) / 2;
                    let val = h * 0.99 + avg * 0.01;
                    val -= meltRate;
                    if (val < 0) val = 0;
                    acc.heights[i] = val;
                    if (val > newMaxHeight) newMaxHeight = val;
                } else if (h > 0) {
                    acc.heights[i] = 0;
                }
            }
        } else if (meltRate > 0) {
            // Melt only (no smoothing this frame)
            for (let i = dMin; i <= dMax; i++) {
                const h = acc.heights[i];
                if (h > 0) {
                    const melted = h - meltRate;
                    const clamped = melted > 0 ? melted : 0;
                    acc.heights[i] = clamped;
                    if (clamped > newMaxHeight) newMaxHeight = clamped;
                }
            }
        } else if (doSmooth) {
            // Smooth only (no melting this frame)
            for (let i = dMin; i <= dMax; i++) {
                const h = acc.heights[i];
                if (h > 0.05) {
                    const avg = (acc.heights[i - 1] + acc.heights[i + 1]) / 2;
                    const val = h * 0.99 + avg * 0.01;
                    acc.heights[i] = val;
                    if (val > newMaxHeight) newMaxHeight = val;
                }
            }
        } else {
            // Neither melting nor smoothing — just track maxHeight for the dirty region
            for (let i = dMin; i <= dMax; i++) {
                if (acc.heights[i] > newMaxHeight) newMaxHeight = acc.heights[i];
            }
        }

        // Check boundary buckets for maxHeight
        for (let i = 0; i < Math.min(dMin, len); i++) {
            if (acc.heights[i] > newMaxHeight) newMaxHeight = acc.heights[i];
        }
        for (let i = Math.max(dMax + 1, 0); i < len; i++) {
            if (acc.heights[i] > newMaxHeight) newMaxHeight = acc.heights[i];
        }

        acc.maxHeight = newMaxHeight;

        // Melt sides (only during melt frames, and only if sides have snow)
        if (shouldMelt && (acc.leftMax > 0 || acc.rightMax > 0)) {
            let leftMax = 0;
            let rightMax = 0;
            const sideLen = acc.leftSide.length;
            for (let i = 0; i < sideLen; i++) {
                const l = acc.leftSide[i];
                if (l > 0) {
                    const clamped = l > meltRate ? l - meltRate : 0;
                    acc.leftSide[i] = clamped;
                    if (clamped > leftMax) leftMax = clamped;
                }
                const r = acc.rightSide[i];
                if (r > 0) {
                    const clamped = r > meltRate ? r - meltRate : 0;
                    acc.rightSide[i] = clamped;
                    if (clamped > rightMax) rightMax = clamped;
                }
            }
            acc.leftMax = leftMax;
            acc.rightMax = rightMax;
        }

        // Shrink dirty bounds
        if (shouldMelt) {
            let newMin = acc.dirtyMin;
            let newMax = acc.dirtyMax;
            while (newMin <= newMax && acc.heights[newMin] <= 0.05) newMin++;
            while (newMax >= newMin && acc.heights[newMax] <= 0.05) newMax--;
            acc.dirtyMin = newMin;
            acc.dirtyMax = newMax;
        }
    }
};
