import { describe, it, expect } from 'vitest';
import { Weather, MAX_FLAKES } from '../../src/core/weather';
import { PRESETS, isPreset } from '../../src/core/presets';

const run = (w: Weather, seconds: number, dt = 1 / 60) => {
    let state = w.step(dt);
    for (let t = dt; t < seconds; t += dt) state = w.step(dt);
    return state;
};

describe('Weather', () => {
    it('starts at the chosen preset', () => {
        const w = new Weather('blizzard', () => 0.5);
        expect(w.params.count).toBe(PRESETS.blizzard.count);
        const s = w.step(1 / 60);
        expect(s.snowing).toBeGreaterThan(0.99);
        expect(s.density).toBeGreaterThan(0);
    });

    it('eases toward a new preset instead of jumping', () => {
        const w = new Weather('gentle', () => 0.5);
        w.setPreset('blizzard');
        w.step(1 / 60);
        expect(w.params.count).toBeLessThan(PRESETS.gentle.count + 200);
        run(w, 10);
        expect(w.params.count).toBeGreaterThan(PRESETS.blizzard.count * 0.99);
    });

    it('fades out when off, keeping the last look, and reports stopped', () => {
        const w = new Weather('steady', () => 0.5);
        w.setPreset('off');
        const s = run(w, 15);
        expect(s.snowing).toBeLessThan(0.001);
        expect(s.density).toBeLessThan(0.001);
        expect(w.stopped).toBe(true);
        expect(w.params.count).toBe(PRESETS.steady.count);
    });

    it('integrates drift so wind changes never make flakes jump', () => {
        const w = new Weather('steady', () => 0.5);
        let prev = w.step(1 / 60);
        for (let i = 0; i < 600; i++) {
            const s = w.step(1 / 60);
            // Per-frame change is bounded by the current speed.
            expect(Math.abs(s.driftX - prev.driftX)).toBeLessThan(Math.abs(s.wind) / 60 + 1e-6);
            expect(s.driftY).toBeGreaterThan(prev.driftY);
            prev = s;
        }
    });

    it('gusts vary the wind around the preset average', () => {
        const w = new Weather('blizzard', Math.random);
        const winds: number[] = [];
        for (let i = 0; i < 60 * 60; i++) winds.push(w.step(1 / 60).wind);
        const min = Math.min(...winds);
        const max = Math.max(...winds);
        expect(max - min).toBeGreaterThan(PRESETS.blizzard.wind * 0.5);
    });

    it('never asks for more flakes than the pool holds', () => {
        const w = new Weather('blizzard', Math.random);
        for (let i = 0; i < 60 * 30; i++) {
            const s = w.step(1 / 60);
            expect(s.density * MAX_FLAKES).toBeLessThanOrEqual(MAX_FLAKES);
        }
    });

    it('ignores unknown presets instead of crashing', () => {
        const warn = console.warn;
        console.warn = () => {};
        try {
            const w = new Weather('hurricane' as never, () => 0.5);
            expect(w.preset).toBe('steady');
            w.setPreset('tornado' as never);
            expect(w.preset).toBe('steady');
            expect(() => run(w, 2)).not.toThrow();
        } finally {
            console.warn = warn;
        }
    });

    it('recognises valid presets', () => {
        expect(isPreset('gentle')).toBe(true);
        expect(isPreset('off')).toBe(true);
        expect(isPreset('hurricane')).toBe(false);
    });
});
