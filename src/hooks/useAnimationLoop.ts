'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Snowflake, SnowAccumulation } from '../core/types';
import { PhysicsConfig, PerformanceMetrics } from '../components/SnowfallProvider';
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
    buildMetrics: (surfaceCount: number, flakeCount: number, maxFlakes: number) => PerformanceMetrics;
    setMetricsRef: { current: (metrics: PerformanceMetrics) => void };
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
    // Cached layout values — avoid reading scrollWidth/scrollHeight/innerWidth/innerHeight every frame
    const worldSizeRef = useRef({ width: 0, height: 0 });
    const viewportRef = useRef({ width: 0, height: 0 });
    // Cache 2D context — getContext('2d') is a DOM API call with overhead
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
    // Precomputed inverse DPR for multiplication instead of division per frame
    const invDprRef = useRef(1);
    // Store params in ref so animate doesn't need params as a dependency
    const paramsRef = useRef(params);

    // Sync params ref outside of render (via effect) to satisfy lint rules
    useEffect(() => {
        paramsRef.current = params;
    });

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
        } = paramsRef.current;

        const canvas = canvasRef.current;
        if (!canvas) {
            animationIdRef.current = requestAnimationFrame(animateRef.current);
            return;
        }

        // Use cached 2D context — getContext('2d') is a DOM call with measurable overhead
        const ctx = ctxRef.current || canvas.getContext('2d');
        if (!ctx) {
            animationIdRef.current = requestAnimationFrame(animateRef.current);
            return;
        }
        if (!ctxRef.current) ctxRef.current = ctx;

        if (lastTimeRef.current === 0) {
            lastTimeRef.current = currentTime;
            animationIdRef.current = requestAnimationFrame(animateRef.current);
            return;
        }

        const deltaTime = Math.min(currentTime - lastTimeRef.current, 50);

        // Track FPS and RAF gap from the RAF timestamp (no extra performance.now() call)
        updateFps(currentTime);
        metricsRef.current.rafGap = currentTime - lastTimeRef.current;

        lastTimeRef.current = currentTime;
        const dt = deltaTime / 16.67;
        const frameIndex = frameIndexRef.current++;

        // Reset transform to clear the entire viewport-sized canvas
        const dpr = dprRef.current;
        const invDpr = invDprRef.current;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, canvas.width * invDpr, canvas.height * invDpr);

        // Translate the context to Simulate Scrolling
        const scrollX = window.scrollX;
        const scrollY = window.scrollY;
        ctx.translate(-scrollX, -scrollY);

        // Use cached viewport/document dimensions — only updated on resize via markRectsDirty.
        // Reading scrollWidth/scrollHeight and innerWidth/innerHeight every frame causes layout thrashing.
        const worldWidth = worldSizeRef.current.width;
        const worldHeight = worldSizeRef.current.height;
        const viewportWidth = viewportRef.current.width;
        const viewportHeight = viewportRef.current.height;

        const snowflakes = snowflakesRef.current;

        // Only update element rects when dirty (resize, element added/removed)
        // For fixed/sticky elements, getBoundingClientRect values don't change on scroll
        if (dirtyRectsRef.current) {
            elementRectsRef.current = getElementRects(accumulationRef.current);
            dirtyRectsRef.current = false;
        }

        // Physics
        meltAndSmoothAccumulation(elementRectsRef.current, physicsConfigRef.current, dt, frameIndex);

        updateSnowflakes(
            snowflakes,
            elementRectsRef.current,
            physicsConfigRef.current,
            dt,
            worldWidth,
            worldHeight,
            scrollX,
            scrollY,
            frameIndex
        );

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
                snowflakes.push(createSnowflake(worldWidth, physicsConfigRef.current, isBackground, scrollY));
            }
        }

        // Draw Accumulation
        // Viewport culling: Filter to only visible elements before drawing (uses cached viewport size)
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
    }, []);

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
        // Also refresh cached layout values that cause layout thrashing when read every frame
        worldSizeRef.current.width = document.documentElement.scrollWidth;
        worldSizeRef.current.height = document.documentElement.scrollHeight;
        viewportRef.current.width = window.innerWidth;
        viewportRef.current.height = window.innerHeight;
        // Precompute inverse DPR for multiplication in the hot path
        invDprRef.current = 1 / (paramsRef.current.dprRef.current || 1);
    }, []);

    return {
        start,
        stop,
        markRectsDirty,
    };
}
