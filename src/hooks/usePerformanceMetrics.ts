'use client';

import { useRef, useCallback } from 'react';
import { PerformanceMetrics } from '../SnowfallProvider';

/**
 * Custom hook for tracking performance metrics with zero per-frame allocations.
 * Uses a second-bucket approach for FPS calculation instead of array filtering.
 */
export function usePerformanceMetrics() {
    // FPS tracking - second-bucket approach (zero allocations per frame)
    const lastFpsSecondRef = useRef(0);
    const framesInSecondRef = useRef(0);
    const currentFpsRef = useRef(0);

    // Detailed timing metrics
    const metricsRef = useRef({
        scanTime: 0,
        rectUpdateTime: 0,
        frameTime: 0,
        rafGap: 0,
        clearTime: 0,
        physicsTime: 0,
        drawTime: 0,
    });

    /**
     * Update FPS counter - call once per frame.
     * Uses second-bucket approach to avoid per-frame array allocations.
     */
    const updateFps = useCallback((now: number) => {
        const currentSecond = Math.floor(now / 1000);
        if (currentSecond !== lastFpsSecondRef.current) {
            // New second started - store the count from previous second
            currentFpsRef.current = framesInSecondRef.current;
            framesInSecondRef.current = 1;
            lastFpsSecondRef.current = currentSecond;
        } else {
            framesInSecondRef.current++;
        }
    }, []);

    /**
     * Get current FPS value.
     */
    const getCurrentFps = useCallback(() => {
        return currentFpsRef.current || framesInSecondRef.current;
    }, []);

    /**
     * Build metrics object for reporting to context.
     */
    const buildMetrics = useCallback((
        surfaceCount: number,
        flakeCount: number,
        maxFlakes: number
    ): PerformanceMetrics => {
        return {
            fps: currentFpsRef.current || framesInSecondRef.current,
            frameTime: metricsRef.current.frameTime,
            scanTime: metricsRef.current.scanTime,
            rectUpdateTime: metricsRef.current.rectUpdateTime,
            surfaceCount,
            flakeCount,
            maxFlakes,
            rafGap: metricsRef.current.rafGap,
            clearTime: metricsRef.current.clearTime,
            physicsTime: metricsRef.current.physicsTime,
            drawTime: metricsRef.current.drawTime,
        };
    }, []);

    return {
        metricsRef,
        updateFps,
        getCurrentFps,
        buildMetrics,
    };
}
