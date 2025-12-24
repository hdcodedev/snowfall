export interface Snowflake {
    x: number;
    y: number;
    radius: number;
    speed: number;
    wind: number;
    opacity: number;
    wobble: number;
    wobbleSpeed: number;
    sizeRatio: number;
    isBackground: boolean;
}

export type SnowfallSurface = 'top' | 'bottom';

export interface SnowAccumulation {
    heights: number[];
    maxHeights: number[];
    leftSide: number[];
    rightSide: number[];
    maxSideHeight: number;
    borderRadius: number;
    curveOffsets: number[];
    type: SnowfallSurface;
}

export interface ElementSurface {
    el: Element;
    rect: DOMRect;
    acc: SnowAccumulation;
}
