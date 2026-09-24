'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import { SnowEngine } from '../core/engine';
import { SnowfallPreset } from '../core/presets';

export interface SnowfallProps {
    /**
     * 'gentle', 'steady' (default), 'blizzard', or 'off'. Switching eases between them
     * like the weather changing; 'off' stops the snow and lets piles melt.
     */
    preset?: SnowfallPreset;
}

export default function Snowfall({ preset = 'steady' }: SnowfallProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<SnowEngine | null>(null);

    // Latest preset, synced before effects run, so a re-mount (Fast Refresh, Strict Mode)
    // builds the engine with the current preset rather than the first one.
    const latestPreset = useRef(preset);
    useLayoutEffect(() => {
        latestPreset.current = preset;
    });

    useEffect(() => {
        if (!canvasRef.current) return;
        const engine = new SnowEngine(canvasRef.current, latestPreset.current);
        engineRef.current = engine;
        return () => {
            engine.destroy();
            engineRef.current = null;
        };
    }, []);

    useEffect(() => {
        engineRef.current?.setPreset(preset);
    }, [preset]);

    return (
        <canvas
            ref={canvasRef}
            aria-hidden="true"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                pointerEvents: 'none',
                zIndex: 9999,
            }}
        />
    );
}
