'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface PhysicsConfig {
    MAX_FLAKES: number;
    MELT_SPEED: number;
    WIND_STRENGTH: number;
    ACCUMULATION: {
        SIDE_RATE: number;
        TOP_RATE: number;
        BOTTOM_RATE: number;
    };
    MAX_DEPTH: {
        TOP: number;
        BOTTOM: number;
        SIDE: number;
    };
    FLAKE_SIZE: {
        MIN: number;
        MAX: number;
    };
    MAX_SURFACES: number;
    COLLISION_CHECK_RATE: number;
}

export const DEFAULT_PHYSICS: PhysicsConfig = {
    MAX_FLAKES: 1000,
    MELT_SPEED: 0.00001,
    WIND_STRENGTH: 1.5,
    ACCUMULATION: {
        SIDE_RATE: 1,
        TOP_RATE: 5,
        BOTTOM_RATE: 5.0,
    },
    MAX_DEPTH: {
        TOP: 100,
        BOTTOM: 50,
        SIDE: 20,
    },
    FLAKE_SIZE: {
        MIN: 0.5,
        MAX: 1.6,
    },
    MAX_SURFACES: 15,
    COLLISION_CHECK_RATE: 0.3  // 30% of snowflakes check collisions per frame
};

export interface PerformanceMetrics {
    fps: number;
    frameTime: number;
    scanTime: number;
    rectUpdateTime: number;
    surfaceCount: number;
    flakeCount: number;
    maxFlakes: number;
    // Detailed metrics
    rafGap: number;       // Time between requestAnimationFrame calls
    clearTime: number;    // Time to clear canvas
    physicsTime: number;  // Time for physics updates
    drawTime: number;     // Time to draw snowflakes and accumulation
}

interface SnowfallContextType {
    isEnabled: boolean;
    toggleSnow: () => void;
    physicsConfig: PhysicsConfig;
    updatePhysicsConfig: (config: Partial<PhysicsConfig>) => void;
    resetPhysics: () => void;
    debugMode: boolean;
    toggleDebug: () => void;
    metrics: PerformanceMetrics | null;
    setMetrics: (metrics: PerformanceMetrics) => void;
}

const SnowfallContext = createContext<SnowfallContextType | undefined>(undefined);

export function SnowfallProvider({ children, initialDebug = false, initialEnabled = true }: { children: ReactNode; initialDebug?: boolean; initialEnabled?: boolean }) {
    const [isEnabled, setIsEnabled] = useState(initialEnabled);
    const [physicsConfig, setPhysicsConfig] = useState<PhysicsConfig>(DEFAULT_PHYSICS);
    const [debugMode, setDebugMode] = useState(initialDebug);
    const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);

    const toggleSnow = () => {
        setIsEnabled((prev) => !prev);
    };

    const toggleDebug = () => {
        setDebugMode((prev) => !prev);
    };

    const updatePhysicsConfig = (config: Partial<PhysicsConfig>) => {
        setPhysicsConfig((prev) => ({
            ...prev,
            ...config,
            ACCUMULATION: {
                ...prev.ACCUMULATION,
                ...(config.ACCUMULATION || {}),
            },
            MAX_DEPTH: {
                ...prev.MAX_DEPTH,
                ...(config.MAX_DEPTH || {}),
            },
            FLAKE_SIZE: {
                ...prev.FLAKE_SIZE,
                ...(config.FLAKE_SIZE || {}),
            },
        }));
    };

    const resetPhysics = () => {
        setPhysicsConfig(DEFAULT_PHYSICS);
    };

    return (
        <SnowfallContext.Provider value={{
            isEnabled,
            toggleSnow,
            physicsConfig,
            updatePhysicsConfig,
            resetPhysics,
            debugMode,
            toggleDebug,
            metrics,
            setMetrics,
        }}>
            {children}
        </SnowfallContext.Provider>
    );
}

export function useSnowfall() {
    const context = useContext(SnowfallContext);
    if (context === undefined) {
        throw new Error('useSnowfall must be used within a SnowfallProvider');
    }
    return context;
}
