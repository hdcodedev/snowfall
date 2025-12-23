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
        if (!isMounted) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resizeCanvas = () => {
            if (canvasRef.current) {
                const newHeight = Math.max(document.documentElement.scrollHeight, window.innerHeight);
                const newWidth = Math.max(document.documentElement.scrollWidth, window.innerWidth);

                if (canvasRef.current.height !== newHeight || canvasRef.current.width !== newWidth) {
                    canvasRef.current.width = newWidth;
                    canvasRef.current.height = newHeight;
                }
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
        let lastRectUpdate = 0;
        let lastMetricsUpdate = 0;
        let cachedElementRects: ReturnType<typeof getElementRects> = [];

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
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            metricsRef.current.clearTime = performance.now() - clearStart;

            const snowflakes = snowflakesRef.current;

            // PERFORMANCE: Only update element rects every 100ms instead of every frame
            // getBoundingClientRect() is expensive, especially on Safari
            if (currentTime - lastRectUpdate > 100) {
                const rectStart = performance.now();
                cachedElementRects = getElementRects(accumulationRef.current);
                metricsRef.current.rectUpdateTime = performance.now() - rectStart;
                lastRectUpdate = currentTime;
            }

            // Time physics
            const physicsStart = performance.now();
            meltAndSmoothAccumulation(cachedElementRects, physicsConfigRef.current, dt);
            updateSnowflakes(snowflakes, cachedElementRects, physicsConfigRef.current, dt, canvas.width, canvas.height);
            metricsRef.current.physicsTime = performance.now() - physicsStart;

            // Draw Snowflakes
            const drawStart = performance.now();
            for (const flake of snowflakes) {
                drawSnowflake(ctx, flake);
            }

            // Spawn new snowflakes
            if (isEnabledRef.current && snowflakes.length < physicsConfigRef.current.MAX_FLAKES) {
                const isBackground = Math.random() < 0.4;
                snowflakes.push(createSnowflake(canvas.width, physicsConfigRef.current, isBackground));
            }

            // Draw Accumulation
            drawAccumulations(ctx, ctx, cachedElementRects);
            drawSideAccumulations(ctx, ctx, cachedElementRects);
            metricsRef.current.drawTime = performance.now() - drawStart;
            metricsRef.current.frameTime = performance.now() - frameStartTime;

            // Update metrics every 500ms
            if (currentTime - lastMetricsUpdate > 500) {
                setMetrics({
                    fps: fpsFrames.current.length,
                    frameTime: metricsRef.current.frameTime,
                    scanTime: metricsRef.current.scanTime,
                    rectUpdateTime: metricsRef.current.rectUpdateTime,
                    surfaceCount: accumulationRef.current.size,
                    flakeCount: snowflakes.length,
                    maxFlakes: physicsConfigRef.current.MAX_FLAKES,
                    isSafari: false,
                    isRetina: false,
                    glowEnabled: true,
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

        // OPTIMIZATION: Use requestIdleCallback for non-urgent updates when available
        // Increased interval from 3s to 5s to reduce CPU usage
        const scheduleUpdate = () => {
            if (typeof requestIdleCallback !== 'undefined') {
                requestIdleCallback(initAccumulationWrapper, { timeout: 5000 });
            } else {
                initAccumulationWrapper();
            }
        };

        const checkInterval = setInterval(scheduleUpdate, 5000);

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
                    position: 'absolute',
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
