'use client';

import { useEffect, useRef, useState } from 'react';
import { useSnowfall } from './SnowfallProvider';
import { Snowflake, SnowAccumulation } from './utils/snowfall/types';
import { getElementRects } from './utils/snowfall/dom';
import { createSnowflake, initializeAccumulation, meltAndSmoothAccumulation, updateSnowflakes } from './utils/snowfall/physics';
import { drawAccumulations, drawSideAccumulations, drawSnowflake } from './utils/snowfall/draw';

export default function Snowfall() {
    const { isEnabled, physicsConfig } = useSnowfall();
    const isEnabledRef = useRef(isEnabled);
    const physicsConfigRef = useRef(physicsConfig);
    const [isMounted, setIsMounted] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fixedCanvasRef = useRef<HTMLCanvasElement>(null);
    const snowflakesRef = useRef<Snowflake[]>([]);
    const accumulationRef = useRef<Map<Element, SnowAccumulation>>(new Map());
    const animationIdRef = useRef<number>(0);

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
        const fixedCanvas = fixedCanvasRef.current;
        if (!canvas || !fixedCanvas) return;

        const ctx = canvas.getContext('2d');
        const fixedCtx = fixedCanvas.getContext('2d');
        if (!ctx || !fixedCtx) return;

        const resizeCanvas = () => {
            if (canvasRef.current && fixedCanvasRef.current) {
                const newHeight = Math.max(document.documentElement.scrollHeight, window.innerHeight);
                const newWidth = Math.max(document.documentElement.scrollWidth, window.innerWidth);

                if (canvasRef.current.height !== newHeight || canvasRef.current.width !== newWidth) {
                    canvasRef.current.width = newWidth;
                    canvasRef.current.height = newHeight;
                }

                // Fixed canvas matches viewport
                if (fixedCanvasRef.current.width !== window.innerWidth || fixedCanvasRef.current.height !== window.innerHeight) {
                    fixedCanvasRef.current.width = window.innerWidth;
                    fixedCanvasRef.current.height = window.innerHeight;
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
            initializeAccumulation(accumulationRef.current, physicsConfigRef.current);
        };
        initAccumulationWrapper();

        setIsVisible(true);

        let lastTime = 0;

        const animate = (currentTime: number) => {
            if (lastTime === 0) {
                lastTime = currentTime;
                animationIdRef.current = requestAnimationFrame(animate);
                return;
            }

            const deltaTime = Math.min(currentTime - lastTime, 50);
            lastTime = currentTime;
            const dt = deltaTime / 16.67;

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            fixedCtx.clearRect(0, 0, fixedCanvas.width, fixedCanvas.height);

            const snowflakes = snowflakesRef.current;
            const elementRects = getElementRects(accumulationRef.current);

            // Physics Update: Melt and Smooth
            meltAndSmoothAccumulation(elementRects, physicsConfigRef.current, dt);

            // Physics Update: Snowflakes & Collisions
            updateSnowflakes(snowflakes, elementRects, physicsConfigRef.current, dt, canvas.width, canvas.height);

            // Draw Snowflakes
            for (const flake of snowflakes) {
                drawSnowflake(ctx, flake);
            }

            // Spawn new snowflakes
            if (isEnabledRef.current && snowflakes.length < physicsConfigRef.current.MAX_FLAKES) {
                const isBackground = Math.random() < 0.4;
                snowflakes.push(createSnowflake(canvas.width, physicsConfigRef.current, isBackground));
            }

            // Draw Accumulation
            drawAccumulations(ctx, fixedCtx, elementRects);
            drawSideAccumulations(ctx, fixedCtx, elementRects);

            animationIdRef.current = requestAnimationFrame(animate);
        };

        animationIdRef.current = requestAnimationFrame(animate);

        const handleResize = () => {
            resizeCanvas();
            accumulationRef.current.clear();
            initAccumulationWrapper();
        };

        window.addEventListener('resize', handleResize);
        const checkInterval = setInterval(initAccumulationWrapper, 3000);

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
                }}
                aria-hidden="true"
            />
            <canvas
                ref={fixedCanvasRef}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    pointerEvents: 'none',
                    zIndex: 9999,
                    opacity: isVisible ? 1 : 0,
                    transition: 'opacity 0.3s ease-in',
                }}
                aria-hidden="true"
            />
        </>
    );
}
