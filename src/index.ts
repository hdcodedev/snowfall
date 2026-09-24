'use client';

export { default as Snowfall } from './components/Snowfall';
export type { SnowfallProps } from './components/Snowfall';
export type { SnowfallPreset } from './core/presets';

// Framework-agnostic runtime, for non-React use
export { SnowEngine } from './core/engine';
