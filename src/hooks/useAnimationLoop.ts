'use client';

import { useRef, useCallback } from 'react';
import { Snowflake, SnowAccumulation } from '../utils/snowfall/types';
import { PhysicsConfig } from '../SnowfallProvider';
import { getElementRects, ElementSurface } from '../utils/snowfall/dom';
import { createSnowflake, meltAndSmoothAccumulation, updateSnowflakes } from '../utils/snowfall/physics';
import { drawAccumulations, drawSideAccumulations, drawSnowflakes } from '../utils/snowfall/draw';

interface UseAnimationLoopParams {
    canvasRef: { current: HTMLCanvasElement | null };
    dprRef: { current: number };
    snowflakesRef: { current: Snowflake[] };
    accumulationRef: { current: Map<Element, SnowAccumulation> };
    isEnabledRef: { current: boolean };
    physicsConfigRef: { current: PhysicsConfig };
    metricsRef: {
        current: {
            scanTime: number;
            rectUpdateTime: number;
            frameTime: number;
            rafGap: number;
            clearTime: number;
            physicsTime: number;
            drawTime: number;
        }
    };
    updateFps: (now: number) => void;
    getCurrentFps: () => number;
    buildMetrics: (surfaceCount: number, flakeCount: number, maxFlakes: number) => any;
    setMetricsRef: { current: (metrics: any) => void };
}

/**
 * Custom hook for the RAF animation loop.
 * Handles all rendering, physics, and drawing logic.
 */
export function useAnimationLoop(params: UseAnimationLoopParams) {
    const animationIdRef = useRef<number>(0);
    const lastTimeRef = useRef(0);
    const lastMetricsUpdateRef = useRef(0);
    const elementRectsRef = useRef<ElementSurface[]>([]);
    // Dirty flag for rect updates - only recalculate when needed (resize, element changes)
    const dirtyRectsRef = useRef(true);

    const animate = useCallback((currentTime: number) => {
        const {
            canvasRef,
            dprRef,
            snowflakesRef,
            accumulationRef,
            isEnabledRef,
            physicsConfigRef,
            metricsRef,
            updateFps,
            getCurrentFps,
            buildMetrics,
            setMetricsRef,
        } = params;

        const canvas = canvasRef.current;
        if (!canvas) {
            animationIdRef.current = requestAnimationFrame(animate);
            return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            animationIdRef.current = requestAnimationFrame(animate);
            return;
        }

        if (lastTimeRef.current === 0) {
            lastTimeRef.current = currentTime;
            animationIdRef.current = requestAnimationFrame(animate);
            return;
        }

        const deltaTime = Math.min(currentTime - lastTimeRef.current, 50);

        // Track FPS using second-bucket approach (zero allocations per frame)
        const now = performance.now();
        updateFps(now);

        // Track detailed performance metrics
        metricsRef.current.rafGap = currentTime - lastTimeRef.current;

        lastTimeRef.current = currentTime;
        const dt = deltaTime / 16.67;

        const frameStartTime = performance.now();

        // Time canvas clear
        const clearStart = performance.now();

        // Reset transform to clear the entire viewport-sized canvas
        const dpr = dprRef.current;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

        // Translate the context to Simulate Scrolling
        const scrollX = window.scrollX;
        const scrollY = window.scrollY;
        ctx.translate(-scrollX, -scrollY);

        metricsRef.current.clearTime = performance.now() - clearStart;

        const snowflakes = snowflakesRef.current;

        // Only update element rects when dirty (resize, element added/removed)
        // For fixed/sticky elements, getBoundingClientRect values don't change on scroll
        if (dirtyRectsRef.current) {
            const rectStart = performance.now();
            elementRectsRef.current = getElementRects(accumulationRef.current);
            metricsRef.current.rectUpdateTime = performance.now() - rectStart;
            dirtyRectsRef.current = false;
        }

        // Time physics
        const physicsStart = performance.now();
        meltAndSmoothAccumulation(elementRectsRef.current, physicsConfigRef.current, dt);
        updateSnowflakes(
            snowflakes,
            elementRectsRef.current,
            physicsConfigRef.current,
            dt,
            document.documentElement.scrollWidth,
            document.documentElement.scrollHeight
        );
        metricsRef.current.physicsTime = performance.now() - physicsStart;

        // Draw Snowflakes (batched for performance)
        const drawStart = performance.now();
        drawSnowflakes(ctx, snowflakes);

        // Spawn new snowflakes with adaptive rate based on performance
        if (isEnabledRef.current && snowflakes.length < physicsConfigRef.current.MAX_FLAKES) {
            const currentFps = getCurrentFps();

            // Adaptive spawn rate: reduce load when FPS is low to prevent death spirals
            const shouldSpawn = currentFps >= 40 || Math.random() < 0.2;

            if (shouldSpawn) {
                const isBackground = Math.random() < 0.4;
                snowflakes.push(createSnowflake(document.documentElement.scrollWidth, physicsConfigRef.current, isBackground));
            }
        }

        // Draw Accumulation
        // Viewport culling: Filter to only visible elements before drawing
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const visibleRects = elementRectsRef.current.filter(({ rect }) =>
            rect.right >= 0 && rect.left <= viewportWidth &&
            rect.bottom >= 0 && rect.top <= viewportHeight
        );

        // Only call draw functions if there are visible elements
        if (visibleRects.length > 0) {
            drawAccumulations(ctx, visibleRects, scrollX, scrollY);
            drawSideAccumulations(ctx, visibleRects, scrollX, scrollY);
        }

        metricsRef.current.drawTime = performance.now() - drawStart;
        metricsRef.current.frameTime = performance.now() - frameStartTime;

        // Update metrics every 500ms
        if (currentTime - lastMetricsUpdateRef.current > 500) {
            setMetricsRef.current(buildMetrics(
                accumulationRef.current.size,
                snowflakes.length,
                physicsConfigRef.current.MAX_FLAKES
            ));
            lastMetricsUpdateRef.current = currentTime;
        }

        animationIdRef.current = requestAnimationFrame(animate);
    }, [params]);

    const start = useCallback(() => {
        lastTimeRef.current = 0;
        lastMetricsUpdateRef.current = 0;
        animationIdRef.current = requestAnimationFrame(animate);
    }, [animate]);

    const stop = useCallback(() => {
        cancelAnimationFrame(animationIdRef.current);
    }, []);

    // Mark rects dirty - call on resize or when accumulation elements change
    const markRectsDirty = useCallback(() => {
        dirtyRectsRef.current = true;
    }, []);

    return {
        start,
        stop,
        markRectsDirty,
    };
}
