export interface Snowflake {
    x: number;
    y: number;
    radius: number;
    speed: number;
    wind: number;
    opacity: number;
    wobble: number;
    wobbleSpeed: number;
}

export type SnowfallSurface = 'top' | 'bottom';

export interface SnowAccumulation {
    heights: number[];
    maxHeights: number[]; // Max height per pixel column
    leftSide: number[];
    rightSide: number[];
    maxSideHeight: number;
    borderRadius: number;
    type: SnowfallSurface;
    isFixed: boolean;
}

export interface ElementSurface {
    el: Element;
    rect: DOMRect;
    acc: SnowAccumulation;
}
