'use client';

// Main components
export { default as Snowfall } from './Snowfall';
export { SnowfallProvider, useSnowfall, DEFAULT_PHYSICS } from './SnowfallProvider';
export { default as DebugPanel } from './DebugPanel';

// Types
export type { PhysicsConfig, PerformanceMetrics } from './SnowfallProvider';
