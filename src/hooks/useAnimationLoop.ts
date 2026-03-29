'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Snowflake, SnowAccumulation } from '../core/types';
import { PhysicsConfig } from '../components/SnowfallProvider';
import { getElementRects, ElementSurface } from '../core/dom';
import { createSnowflake, meltAndSmoothAccumulation, updateSnowflakes } from '../core/physics';
import { drawAccumulations, drawSideAccumulations, drawSnowflakes } from '../core/draw';

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
    const animateRef = useRef<(currentTime: number) => void>(() => {});
    const lastTimeRef = useRef(0);
    const lastMetricsUpdateRef = useRef(0);
    const elementRectsRef = useRef<ElementSurface[]>([]);
    const visibleRectsRef = useRef<ElementSurface[]>([]);
    // Dirty flag for rect updates - only recalculate when needed (resize, element changes)
    const dirtyRectsRef = useRef(true);
    // Frame counter for deterministic collision distribution
    const frameIndexRef = useRef(0);

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
            animationIdRef.current = requestAnimationFrame(animateRef.current);
            return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            animationIdRef.current = requestAnimationFrame(animateRef.current);
            return;
        }

        if (lastTimeRef.current === 0) {
            lastTimeRef.current = currentTime;
            animationIdRef.current = requestAnimationFrame(animateRef.current);
            return;
        }

        const deltaTime = Math.min(currentTime - lastTimeRef.current, 50);

        // Two performance.now() calls per frame — derive all sub-timings from deltas.
        // This eliminates ~8 timer calls per frame (~0.5ms/sec saved at 60fps).
        const frameStart = performance.now();
        updateFps(frameStart);

        // Track detailed performance metrics
        metricsRef.current.rafGap = currentTime - lastTimeRef.current;

        lastTimeRef.current = currentTime;
        const dt = deltaTime / 16.67;
        const frameIndex = frameIndexRef.current++;

        // Reset transform to clear the entire viewport-sized canvas
        const dpr = dprRef.current;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

        // Translate the context to Simulate Scrolling
        const scrollX = window.scrollX;
        const scrollY = window.scrollY;
        ctx.translate(-scrollX, -scrollY);

        // Timing checkpoint: clear phase complete
        const clearEnd = performance.now();
        metricsRef.current.clearTime = clearEnd - frameStart;

        const snowflakes = snowflakesRef.current;

        // Only update element rects when dirty (resize, element added/removed)
        // For fixed/sticky elements, getBoundingClientRect values don't change on scroll
        if (dirtyRectsRef.current) {
            const rectStart = clearEnd;
            elementRectsRef.current = getElementRects(accumulationRef.current);
            metricsRef.current.rectUpdateTime = performance.now() - rectStart;
            dirtyRectsRef.current = false;
        }

        // Physics
        const physicsStart = performance.now();
        meltAndSmoothAccumulation(elementRectsRef.current, physicsConfigRef.current, dt, frameIndex);
        const docEl = document.documentElement;
        const worldWidth = docEl.scrollWidth;
        const worldHeight = docEl.scrollHeight;

        updateSnowflakes(
            snowflakes,
            elementRectsRef.current,
            physicsConfigRef.current,
            dt,
            worldWidth,
            worldHeight,
            frameIndex
        );
        const physicsEnd = performance.now();
        metricsRef.current.physicsTime = physicsEnd - physicsStart;

        // Draw Snowflakes (batched for performance)
        drawSnowflakes(ctx, snowflakes);

        // Spawn new snowflakes with adaptive rate based on performance
        if (isEnabledRef.current && snowflakes.length < physicsConfigRef.current.MAX_FLAKES) {
            const minFlakeFloor = Math.min(80, physicsConfigRef.current.MAX_FLAKES);
            const shouldForceSpawn = snowflakes.length < minFlakeFloor;
            const currentFps = getCurrentFps();
            const isVisible = document.visibilityState === 'visible';
            const isUnderFpsThreshold = isVisible && currentFps > 0 && currentFps < 40;

            // Adaptive spawn rate: reduce load only when visible and actually under target FPS.
            const shouldSpawn = shouldForceSpawn || !isUnderFpsThreshold || Math.random() < 0.2;

            if (shouldSpawn) {
                const isBackground = Math.random() < 0.4;
                snowflakes.push(createSnowflake(worldWidth, physicsConfigRef.current, isBackground));
            }
        }

        // Draw Accumulation
        // Viewport culling: Filter to only visible elements before drawing
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const visibleRects = visibleRectsRef.current;
        visibleRects.length = 0;
        for (const item of elementRectsRef.current) {
            const { rect } = item;
            if (
                rect.right >= 0 &&
                rect.left <= viewportWidth &&
                rect.bottom >= 0 &&
                rect.top <= viewportHeight
            ) {
                visibleRects.push(item);
            }
        }

        // Only call draw functions if there are visible elements
        if (visibleRects.length > 0) {
            drawAccumulations(ctx, visibleRects, scrollX, scrollY);
            drawSideAccumulations(ctx, visibleRects, scrollX, scrollY);
        }

        // Single performance.now() at frame end — derive drawTime from total minus prior phases
        const frameEnd = performance.now();
        metricsRef.current.drawTime = frameEnd - physicsEnd;
        metricsRef.current.frameTime = frameEnd - frameStart;

        // Update metrics every 500ms
        if (currentTime - lastMetricsUpdateRef.current > 500) {
            setMetricsRef.current(buildMetrics(
                accumulationRef.current.size,
                snowflakes.length,
                physicsConfigRef.current.MAX_FLAKES
            ));
            lastMetricsUpdateRef.current = currentTime;
        }

        animationIdRef.current = requestAnimationFrame(animateRef.current);
    }, [params]);

    useEffect(() => {
        animateRef.current = animate;
    }, [animate]);

    const start = useCallback(() => {
        lastTimeRef.current = 0;
        lastMetricsUpdateRef.current = 0;
        animationIdRef.current = requestAnimationFrame(animateRef.current);
    }, []);

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
