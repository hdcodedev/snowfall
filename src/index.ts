'use client';

// Main components
export { default as Snowfall } from './components/Snowfall';
export { SnowfallProvider, useSnowfall, DEFAULT_PHYSICS } from './components/SnowfallProvider';
export { default as DebugPanel } from './components/DebugPanel';

// Types
export type { PhysicsConfig, PerformanceMetrics } from './components/SnowfallProvider';
