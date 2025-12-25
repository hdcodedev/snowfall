'use client';

import { useRef, useCallback } from 'react';

/**
 * Custom hook for managing the snowfall canvas setup and resizing.
 * Handles DPR scaling for high-density displays.
 */
export function useSnowfallCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    // Cache DPR to avoid reading it every frame (only changes on resize)
    // Initialize with safe default for SSR, actual value set in resizeCanvas
    const dprRef = useRef(1);

    const resizeCanvas = useCallback(() => {
        if (canvasRef.current) {
            // Use viewport dimensions for fixed canvas
            const newWidth = window.innerWidth;
            const newHeight = window.innerHeight;

            // Handle high DPI displays - cache DPR in ref for use in animation loop
            const dpr = window.devicePixelRatio || 1;
            dprRef.current = dpr;
            canvasRef.current.width = newWidth * dpr;
            canvasRef.current.height = newHeight * dpr;

            // Set CSS size
            canvasRef.current.style.width = `${newWidth}px`;
            canvasRef.current.style.height = `${newHeight}px`;
        }
    }, []);

    return {
        canvasRef,
        dprRef,
        resizeCanvas,
    };
}
