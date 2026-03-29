export interface Snowflake {
    x: number;
    y: number;
    radius: number;
    speed: number;
    wind: number;
    wobble: number;
    wobbleSpeed: number;
}

export type SnowfallSurface = 'top' | 'bottom';

export interface SnowAccumulation {
    /** Per-bucket snow height (Float32Array, length = ceil(width / BUCKET_SIZE)) */
    heights: Float32Array;
    /** Per-bucket max allowed height */
    maxHeights: Float32Array;
    /** Per-bucket left side snow width */
    leftSide: Float32Array;
    /** Per-bucket right side snow width */
    rightSide: Float32Array;
    maxSideHeight: number;
    leftMax: number;
    rightMax: number;
    /** Cached max of heights[] — avoids scanning the array every frame in draw path */
    maxHeight: number;
    borderRadius: number;
    /** Curve offsets per bucket */
    curveOffsets: Float32Array;
    /** Side gravity multipliers per bucket row */
    sideGravityMultipliers: Float32Array;
    type: SnowfallSurface;
    /** Ping-pong buffer for smoothing (Float32Array, same length as heights) */
    _smoothTemp: Float32Array;
    /** Leftmost bucket index with snow (dirty region lower bound) */
    dirtyMin: number;
    /** Rightmost bucket index with snow (dirty region upper bound) */
    dirtyMax: number;
    /** Number of screen pixels per bucket — used for interpolation in drawing */
    bucketSize: number;
    /** Offscreen canvas cache for top/bottom accumulation drawing */
    _cacheCanvas: HTMLCanvasElement | null;
    _cacheCtx: CanvasRenderingContext2D | null;
    /** maxHeight value when cache was last rendered */
    _cacheMaxHeight: number;
}

export interface ElementSurface {
    el: Element;
    rect: DOMRect;
    acc: SnowAccumulation;
    /** Set to true when a collision occurs on this surface — used to skip no-op rect refreshes */
    hasChanged: boolean;
}
