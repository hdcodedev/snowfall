'use client';

import { useEffect, useRef, useState } from 'react';
import { useSnowfall } from './SnowfallProvider';
import { Snowflake, SnowAccumulation } from '../core/types';
import { initializeAccumulation } from '../core/physics';
import { usePerformanceMetrics } from '../hooks/usePerformanceMetrics';
import { useSnowfallCanvas } from '../hooks/useSnowfallCanvas';
import { useAnimationLoop } from '../hooks/useAnimationLoop';

export default function Snowfall() {
    const { isEnabled, physicsConfig, setMetrics } = useSnowfall();
    const isEnabledRef = useRef(isEnabled);
    const physicsConfigRef = useRef(physicsConfig);
    const setMetricsRef = useRef(setMetrics);
    const [isMounted, setIsMounted] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    const snowflakesRef = useRef<Snowflake[]>([]);
    const accumulationRef = useRef<Map<Element, SnowAccumulation>>(new Map());

    // Canvas setup
    const { canvasRef, dprRef, resizeCanvas } = useSnowfallCanvas();

    // Performance metrics tracking
    const { metricsRef, updateFps, getCurrentFps, buildMetrics } = usePerformanceMetrics();

    // Animation loop
    const { start: startAnimation, stop: stopAnimation, markRectsDirty } = useAnimationLoop({
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
    });

    useEffect(() => {
        requestAnimationFrame(() => setIsMounted(true));
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

        resizeCanvas();

        snowflakesRef.current = [];

        // Separate observer for snow accumulation surfaces
        const surfaceObserver = new ResizeObserver((entries) => {
            // Check if any accumulation element actually changed size
            let needsUpdate = false;
            for (const entry of entries) {
                if (entry.target.isConnected) {
                    needsUpdate = true;
                    break;
                }
            }
            if (needsUpdate) {
                // Re-run initialization to adapt to new sizes
                initAccumulationWrapper();
            }
        });

        const initAccumulationWrapper = () => {
            const scanStart = performance.now();
            initializeAccumulation(accumulationRef.current, physicsConfigRef.current);

            // Sync observer with current surfaces
            surfaceObserver.disconnect();
            for (const [el] of accumulationRef.current) {
                surfaceObserver.observe(el);
            }

            metricsRef.current.scanTime = performance.now() - scanStart;
            // Mark rects dirty so they get recalculated on next frame
            markRectsDirty();
        };
        initAccumulationWrapper();

        // Delay visibility slightly to ensure smooth fade-in after canvas is ready
        requestAnimationFrame(() => {
            if (isMounted) setIsVisible(true);
        });

        // Start the animation loop
        startAnimation();

        const handleResize = () => {
            resizeCanvas();
            accumulationRef.current.clear();
            initAccumulationWrapper();
            markRectsDirty();
        };

        window.addEventListener('resize', handleResize);

        // Observe window/body resize
        const windowResizeObserver = new ResizeObserver(() => {
            resizeCanvas();
        });
        windowResizeObserver.observe(document.body);

        // Observe DOM mutations to detect new/removed elements
        const mutationObserver = new MutationObserver((mutations) => {
            // Check if any mutations actually added or removed nodes
            let hasStructuralChange = false;
            for (const mutation of mutations) {
                if (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0) {
                    hasStructuralChange = true;
                    break;
                }
            }
            if (hasStructuralChange) {
                const scanStart = performance.now();
                initializeAccumulation(accumulationRef.current, physicsConfigRef.current);
                metricsRef.current.scanTime = performance.now() - scanStart;
                markRectsDirty();
            }
        });
        mutationObserver.observe(document.body, {
            childList: true,
            subtree: true,
        });

        return () => {
            stopAnimation();
            window.removeEventListener('resize', handleResize);
            windowResizeObserver.disconnect();
            mutationObserver.disconnect();
            surfaceObserver.disconnect();
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
