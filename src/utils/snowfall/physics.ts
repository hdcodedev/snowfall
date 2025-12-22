import { PhysicsConfig } from '../../SnowfallProvider';
import { Snowflake, SnowAccumulation, ElementSurface } from './types';
import { getAccumulationSurfaces } from './dom';
import { VAL_BOTTOM } from './constants';

export const createSnowflake = (
    canvasWidth: number,
    config: PhysicsConfig,
    isBackground: boolean = false
): Snowflake => {
    if (isBackground) {
        const radius = Math.random() * 0.8 + 0.3;
        return {
            x: Math.random() * canvasWidth,
            y: window.scrollY - 5,
            radius,
            speed: radius * 0.3 + Math.random() * 0.2 + 0.2,
            wind: (Math.random() - 0.5) * (config.WIND_STRENGTH * 0.625),
            opacity: Math.random() * 0.2 + 0.2,
            wobble: Math.random() * Math.PI * 2,
            wobbleSpeed: Math.random() * 0.015 + 0.005,
        };
    } else {
        const radius = Math.random() * 2 + 0.5;
        return {
            x: Math.random() * canvasWidth,
            y: window.scrollY - 5,
            radius,
            speed: radius * 0.5 + Math.random() * 0.3 + 0.5,
            wind: (Math.random() - 0.5) * config.WIND_STRENGTH,
            opacity: Math.random() * 0.3 + 0.5,
            wobble: Math.random() * Math.PI * 2,
            wobbleSpeed: Math.random() * 0.02 + 0.01,
        };
    }
};

export const initializeAccumulation = (
    accumulationMap: Map<Element, SnowAccumulation>,
    config: PhysicsConfig
) => {
    const elements = getAccumulationSurfaces();
    // Prune disconnected elements
    for (const [el] of accumulationMap.entries()) {
        if (!el.isConnected) {
            accumulationMap.delete(el);
        }
    }

    elements.forEach(({ el, type, isFixed }) => {
        const existing = accumulationMap.get(el);
        const rect = el.getBoundingClientRect();
        const width = Math.ceil(rect.width);
        const isBottom = type === VAL_BOTTOM;

        if (existing && existing.heights.length === width) {
            existing.type = type;
            existing.isFixed = isFixed;
            if (existing.borderRadius !== undefined) {
                const styleBuffer = window.getComputedStyle(el); // Potentially slow in loop, strictly necessary?
                existing.borderRadius = parseFloat(styleBuffer.borderTopLeftRadius) || 0;
            }
            return;
        }

        const height = Math.ceil(rect.height);
        const baseMax = isBottom ? config.MAX_DEPTH.HEADER_TOP : config.MAX_DEPTH.CARD_TOP;

        const styles = window.getComputedStyle(el);
        const borderRadius = parseFloat(styles.borderTopLeftRadius) || 0;

        let maxHeights = new Array(width);
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

        // Smooth maxHeights
        const smoothPasses = 4;
        for (let p = 0; p < smoothPasses; p++) {
            const smoothed = [...maxHeights];
            for (let i = 1; i < width - 1; i++) {
                smoothed[i] = (maxHeights[i - 1] + maxHeights[i] + maxHeights[i + 1]) / 3;
            }
            maxHeights = smoothed;
        }

        accumulationMap.set(el, {
            heights: existing?.heights.length === width ? existing.heights : new Array(width).fill(0),
            maxHeights,
            leftSide: existing?.leftSide.length === height ? existing.leftSide : new Array(height).fill(0),
            rightSide: existing?.rightSide.length === height ? existing.rightSide : new Array(height).fill(0),
            maxSideHeight: isBottom ? 0 : config.MAX_DEPTH.CARD_SIDE,
            borderRadius,
            type,
            isFixed,
        });
    });
};

const accumulateSide = (
    sideArray: number[],
    rectHeight: number,
    localY: number,
    maxSideHeight: number,
    borderRadius: number,
    config: PhysicsConfig
) => {
    const spread = 4;
    const addHeight = config.ACCUMULATION.SIDE_RATE * (0.8 + Math.random() * 0.4);

    for (let dy = -spread; dy <= spread; dy++) {
        const y = localY + dy;
        if (y >= 0 && y < sideArray.length) {
            const inTop = y < borderRadius;
            const inBottom = y > rectHeight - borderRadius;
            if (borderRadius > 0 && (inTop || inBottom)) continue;

            const normalizedDist = Math.abs(dy) / spread;
            const falloff = (Math.cos(normalizedDist * Math.PI) + 1) / 2;
            sideArray[y] = Math.min(maxSideHeight, sideArray[y] + addHeight * falloff);
        }
    }
};

export const updateSnowflakes = (
    snowflakes: Snowflake[],
    elementRects: ElementSurface[],
    config: PhysicsConfig,
    dt: number,
    canvasWidth: number,
    canvasHeight: number
) => {
    for (let i = snowflakes.length - 1; i >= 0; i--) {
        const flake = snowflakes[i];

        flake.wobble += flake.wobbleSpeed * dt;
        flake.x += (flake.wind + Math.sin(flake.wobble) * 0.5) * dt;
        flake.y += (flake.speed + Math.cos(flake.wobble * 0.5) * 0.1) * dt;

        let landed = false;

        for (const { rect, acc } of elementRects) {
            const isBottom = acc.type === VAL_BOTTOM;

            // Side collisions
            if (!landed && acc.maxSideHeight > 0 && !isBottom) {
                const isInVerticalBounds = flake.y >= rect.top && flake.y <= rect.bottom;

                if (isInVerticalBounds) {
                    const localY = Math.floor(flake.y - rect.top);
                    const borderRadius = acc.borderRadius;

                    const isInTopCorner = localY < borderRadius;
                    const isInBottomCorner = localY > rect.height - borderRadius;
                    const isCorner = borderRadius > 0 && (isInTopCorner || isInBottomCorner);

                    if (flake.x >= rect.left - 5 && flake.x < rect.left + 3) {
                        if (!isCorner) {
                            accumulateSide(acc.leftSide, rect.height, localY, acc.maxSideHeight, borderRadius, config);
                            landed = true;
                        }
                    }

                    if (!landed && flake.x > rect.right - 3 && flake.x <= rect.right + 5) {
                        if (!isCorner) {
                            accumulateSide(acc.rightSide, rect.height, localY, acc.maxSideHeight, borderRadius, config);
                            landed = true;
                        }
                    }

                    if (landed) break;
                }
            }

            // Top accumulation
            if (flake.x >= rect.left && flake.x <= rect.right) {
                const localX = Math.floor(flake.x - rect.left);
                const currentHeight = acc.heights[localX] || 0;
                const maxHeight = acc.maxHeights[localX] || 5;

                const surfaceY = isBottom ? rect.bottom - currentHeight : rect.top - currentHeight;

                if (flake.y >= surfaceY && flake.y < surfaceY + 10 && currentHeight < maxHeight) {
                    const shouldAccumulate = isBottom ? Math.random() < 0.15 : true;

                    if (shouldAccumulate) {
                        const baseSpread = Math.ceil(flake.radius);
                        const spread = baseSpread + Math.floor(Math.random() * 2);
                        const accumRate = isBottom ? config.ACCUMULATION.TOP_HEADER_RATE : config.ACCUMULATION.TOP_CARD_RATE;
                        const centerOffset = Math.floor(Math.random() * 3) - 1;

                        for (let dx = -spread; dx <= spread; dx++) {
                            if (Math.random() < 0.15) continue;
                            const idx = localX + dx + centerOffset;
                            if (idx >= 0 && idx < acc.heights.length) {
                                const dist = Math.abs(dx);
                                const pixelMax = acc.maxHeights[idx] || 5;

                                const normDist = dist / spread;
                                const falloff = (Math.cos(normDist * Math.PI) + 1) / 2;
                                const baseAdd = 0.3 * falloff;

                                const randomFactor = 0.8 + Math.random() * 0.4;
                                const addHeight = baseAdd * randomFactor * accumRate;

                                if (acc.heights[idx] < pixelMax && addHeight > 0) {
                                    acc.heights[idx] = Math.min(pixelMax, acc.heights[idx] + addHeight);
                                }
                            }
                        }

                        if (isBottom) {
                            landed = true;
                            break;
                        }
                    }

                    if (!isBottom) {
                        landed = true;
                        break;
                    }
                }
            }
        }

        if (landed || flake.y > canvasHeight + 10 || flake.x < -20 || flake.x > canvasWidth + 20) {
            snowflakes.splice(i, 1);
        }
    }
};

export const meltAndSmoothAccumulation = (
    elementRects: ElementSurface[],
    config: PhysicsConfig,
    dt: number
) => {
    for (const { acc } of elementRects) {
        const meltRate = config.MELT_SPEED * dt;
        const len = acc.heights.length;

        // Smooth
        if (len > 2) {
            for (let i = 1; i < len - 1; i++) {
                if (acc.heights[i] > 0.05) {
                    const avg = (acc.heights[i - 1] + acc.heights[i + 1]) / 2;
                    acc.heights[i] = acc.heights[i] * 0.99 + avg * 0.01;
                }
            }
        }

        // Melt
        for (let i = 0; i < acc.heights.length; i++) {
            if (acc.heights[i] > 0) acc.heights[i] = Math.max(0, acc.heights[i] - meltRate);
        }
        for (let i = 0; i < acc.leftSide.length; i++) {
            if (acc.leftSide[i] > 0) acc.leftSide[i] = Math.max(0, acc.leftSide[i] - meltRate);
            if (acc.rightSide[i] > 0) acc.rightSide[i] = Math.max(0, acc.rightSide[i] - meltRate);
        }
    }
};
