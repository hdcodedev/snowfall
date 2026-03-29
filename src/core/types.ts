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
    heights: number[];
    maxHeights: number[];
    leftSide: number[];
    rightSide: number[];
    maxSideHeight: number;
    leftMax: number;
    rightMax: number;
    /** Cached max of heights[] — avoids scanning the array every frame in draw path */
    maxHeight: number;
    borderRadius: number;
    curveOffsets: number[];
    sideGravityMultipliers: number[];
    type: SnowfallSurface;
    _smoothTemp: number[];
}

export interface ElementSurface {
    el: Element;
    rect: DOMRect;
    acc: SnowAccumulation;
}
