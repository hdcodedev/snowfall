// Perf test page: runs SnowEngine from source over typical page content and records
// one sample per second. Driven by scripts/perf/run.mjs through the DevTools protocol.
import { SnowEngine } from '../../src/core/engine';
import type { SnowfallPreset } from '../../src/core/presets';

export interface PerfSample {
    fps: number;
    scale: number;
    density: number;
    flakes: number;
    renderer: string;
}

declare global {
    interface Window {
        __perf: {
            setPreset(preset: SnowfallPreset): void;
            samples: PerfSample[];
            ready: boolean;
        };
    }
}

const canvas = document.getElementById('snow') as HTMLCanvasElement;
const engine = new SnowEngine(canvas, 'steady');

const perf: Window['__perf'] = {
    setPreset: (preset) => engine.setPreset(preset),
    samples: [],
    ready: true,
};
window.__perf = perf;

// Count real animation frames per second, independently of the engine's own counter.
let frames = 0;
let since = performance.now();
const count = (now: number) => {
    frames++;
    if (now - since >= 1000) {
        const stats = engine.stats;
        perf.samples.push({
            fps: Math.round((frames * 1000) / (now - since)),
            scale: stats.scale,
            density: stats.density,
            flakes: stats.flakes,
            renderer: stats.renderer,
        });
        frames = 0;
        since = now;
    }
    requestAnimationFrame(count);
};
requestAnimationFrame(count);
