'use client';

import { useEffect, useRef, useState } from 'react';
import { useSnowfall } from './SnowfallProvider';
import { Snowflake, SnowAccumulation } from './utils/snowfall/types';
import { getElementRects } from './utils/snowfall/dom';
import { createSnowflake, initializeAccumulation, meltAndSmoothAccumulation, updateSnowflakes } from './utils/snowfall/physics';
import { drawAccumulations, drawSideAccumulations, drawSnowflake } from './utils/snowfall/draw';

export default function Snowfall() {
    const { isEnabled, physicsConfig, setMetrics } = useSnowfall();
    const isEnabledRef = useRef(isEnabled);
    const physicsConfigRef = useRef(physicsConfig);
    const setMetricsRef = useRef(setMetrics);
    const [isMounted, setIsMounted] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const snowflakesRef = useRef<Snowflake[]>([]);
    const accumulationRef = useRef<Map<Element, SnowAccumulation>>(new Map());
    const animationIdRef = useRef<number>(0);

    // Performance metrics tracking
    const fpsFrames = useRef<number[]>([]);
    const metricsRef = useRef({
        scanTime: 0,
        rectUpdateTime: 0,
        frameTime: 0,
        rafGap: 0,
        clearTime: 0,
        physicsTime: 0,
        drawTime: 0,
    });

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        isEnabledRef.current = isEnabled;
    }, [isEnabled]);

    useEffect(() => {
        physicsConfigRef.current = physicsConfig;
    }, [physicsConfig]);

    useEffect(() => {
        setMetricsRef.current = setMetrics;
    }, [setMetrics]);

    useEffect(() => {
        if (!isMounted) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resizeCanvas = () => {
            if (canvasRef.current) {
                // Use viewport dimensions for fixed canvas
                const newWidth = window.innerWidth;
                const newHeight = window.innerHeight;

                // Handle high DPI displays
                const dpr = window.devicePixelRatio || 1;
                canvasRef.current.width = newWidth * dpr;
                canvasRef.current.height = newHeight * dpr;

                // Set CSS size
                canvasRef.current.style.width = `${newWidth}px`;
                canvasRef.current.style.height = `${newHeight}px`;
            }
        };
        resizeCanvas();

        const resizeObserver = new ResizeObserver(() => {
            resizeCanvas();
        });
        resizeObserver.observe(document.body);

        snowflakesRef.current = [];

        const initAccumulationWrapper = () => {
            const scanStart = performance.now();
            initializeAccumulation(accumulationRef.current, physicsConfigRef.current);
            metricsRef.current.scanTime = performance.now() - scanStart;
        };
        initAccumulationWrapper();

        setIsVisible(true);

        let lastTime = 0;
        let lastMetricsUpdate = 0;
        // Holds current frame's element positions
        let elementRects: ReturnType<typeof getElementRects> = [];

        const animate = (currentTime: number) => {
            if (lastTime === 0) {
                lastTime = currentTime;
                animationIdRef.current = requestAnimationFrame(animate);
                return;
            }


            const deltaTime = Math.min(currentTime - lastTime, 50);

            // Always track FPS so we have data when panel opens
            const now = performance.now();
            fpsFrames.current.push(now);
            fpsFrames.current = fpsFrames.current.filter(t => now - t < 1000);

            // Track detailed performance metrics
            metricsRef.current.rafGap = currentTime - lastTime;

            lastTime = currentTime;
            const dt = deltaTime / 16.67;

            const frameStartTime = performance.now();

            // Time canvas clear
            const clearStart = performance.now();

            // Reset transform to clear the entire viewport-sized canvas
            // We use the dpr scaling, so we clear the logical width/height
            const dpr = window.devicePixelRatio || 1;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

            // Translate the context to Simulate Scrolling
            // We move the 'world' up by scrollY, so absolute coordinates draw in the correct place relative to viewport
            const scrollX = window.scrollX;
            const scrollY = window.scrollY;
            ctx.translate(-scrollX, -scrollY);

            metricsRef.current.clearTime = performance.now() - clearStart;

            const snowflakes = snowflakesRef.current;

            // PERFORMANCE: Update element rects EVERY FRAME to track layout changes and animations
            // getBoundingClientRect() is necessary to handle moving/animating elements
            // getBoundingClientRect() is fast enough for the accumulation targets (< 50 elements)
            const rectStart = performance.now();
            elementRects = getElementRects(accumulationRef.current);
            metricsRef.current.rectUpdateTime = performance.now() - rectStart;

            // Time physics
            const physicsStart = performance.now();
            meltAndSmoothAccumulation(elementRects, physicsConfigRef.current, dt);
            updateSnowflakes(
                snowflakes,
                elementRects,
                physicsConfigRef.current,
                dt,
                document.documentElement.scrollWidth,
                document.documentElement.scrollHeight
            );
            metricsRef.current.physicsTime = performance.now() - physicsStart;

            // Draw Snowflakes
            const drawStart = performance.now();
            for (const flake of snowflakes) {
                drawSnowflake(ctx, flake);
            }

            // Spawn new snowflakes
            if (isEnabledRef.current && snowflakes.length < physicsConfigRef.current.MAX_FLAKES) {
                const isBackground = Math.random() < 0.4;
                // createSnowflake uses window.scrollY, so it creates flakes in world space
                snowflakes.push(createSnowflake(document.documentElement.scrollWidth, physicsConfigRef.current, isBackground));
            }

            // Draw Accumulation
            // We draw accumulations in World Space (by adding scroll offset in draw.ts)
            // This aligns perfectly with the translated context and world-space snowflakes.
            drawAccumulations(ctx, elementRects);
            drawSideAccumulations(ctx, elementRects);

            metricsRef.current.drawTime = performance.now() - drawStart;
            metricsRef.current.frameTime = performance.now() - frameStartTime;

            // Update metrics every 500ms
            if (currentTime - lastMetricsUpdate > 500) {
                setMetricsRef.current({
                    fps: fpsFrames.current.length,
                    frameTime: metricsRef.current.frameTime,
                    scanTime: metricsRef.current.scanTime,
                    rectUpdateTime: metricsRef.current.rectUpdateTime,
                    surfaceCount: accumulationRef.current.size,
                    flakeCount: snowflakes.length,
                    maxFlakes: physicsConfigRef.current.MAX_FLAKES,
                    rafGap: metricsRef.current.rafGap,
                    clearTime: metricsRef.current.clearTime,
                    physicsTime: metricsRef.current.physicsTime,
                    drawTime: metricsRef.current.drawTime,
                });
                lastMetricsUpdate = currentTime;
            }

            animationIdRef.current = requestAnimationFrame(animate);
        };

        animationIdRef.current = requestAnimationFrame(animate);

        const handleResize = () => {
            resizeCanvas();
            accumulationRef.current.clear();
            initAccumulationWrapper();
        };

        window.addEventListener('resize', handleResize);

        // Periodic surface scan every 5 seconds to detect DOM changes
        const checkInterval = setInterval(initAccumulationWrapper, 5000);

        return () => {
            cancelAnimationFrame(animationIdRef.current);
            window.removeEventListener('resize', handleResize);
            clearInterval(checkInterval);
            resizeObserver.disconnect();
        };
    }, [isMounted]);

    if (!isMounted) return null;

    return (
        <>
            <canvas
                ref={canvasRef}
                style={{
                    position: 'fixed', // FIXED position to eliminate scroll jitter
                    top: 0,
                    left: 0,
                    pointerEvents: 'none',
                    zIndex: 9999,
                    opacity: isVisible ? 1 : 0,
                    transition: 'opacity 0.3s ease-in',
                    willChange: 'transform',
                }}
                aria-hidden="true"
            />

        </>
    );
}
