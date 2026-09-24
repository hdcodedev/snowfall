import { describe, it, expect } from 'vitest';
import { createPile, updatePile, writePileMesh, noise1d, hasSnow, MeshBuilder, BUCKET } from '../../src/core/piles';
import { PRESETS } from '../../src/core/presets';

const rect = { left: 100, top: 300, right: 500, bottom: 500 };
const grow = (seconds: number, wind = 70, snowing = 1, preset = PRESETS.steady, pile = createPile('top', 400, 200, 12)) => {
    for (let t = 0; t < seconds; t += 0.1) updatePile(pile, 0.1, preset, snowing, wind);
    return pile;
};

describe('noise1d', () => {
    it('stays in [0, 1] and is smooth', () => {
        const n = noise1d(500, 5);
        for (let i = 0; i < n.length; i++) {
            expect(n[i]).toBeGreaterThanOrEqual(0);
            expect(n[i]).toBeLessThanOrEqual(1);
            if (i > 0) expect(Math.abs(n[i] - n[i - 1])).toBeLessThan(0.15);
        }
    });
});

describe('updatePile', () => {
    it('grows while snowing and never exceeds the preset depth by much', () => {
        const pile = grow(1200);
        expect(pile.fill).toBe(1);
        const max = Math.max(...pile.heights);
        expect(max).toBeGreaterThan(PRESETS.steady.depth * 0.4);
        expect(max).toBeLessThan(PRESETS.steady.depth * 1.5);
    });

    it('grows faster in a blizzard than in gentle snow', () => {
        const gentle = grow(60, 22, 1, PRESETS.gentle);
        const blizzard = grow(60, 520, 1, PRESETS.blizzard);
        expect(blizzard.fill).toBeGreaterThan(gentle.fill * 2);
    });

    it('builds up slowly: gentle is only about a twelfth full after a minute', () => {
        const pile = grow(60, 22, 1, PRESETS.gentle);
        expect(pile.fill).toBeGreaterThan(0.05);
        expect(pile.fill).toBeLessThan(0.12);
    });

    it('melts slowly: a full pile is still there after a minute of no snow', () => {
        const pile = grow(1200);
        grow(60, 70, 0, PRESETS.steady, pile);
        expect(pile.fill).toBeGreaterThan(0.75);
    });

    it('melts away when snowing stops', () => {
        const pile = grow(1200);
        grow(1200, 70, 0, PRESETS.steady, pile);
        expect(hasSnow(pile)).toBe(false);
        expect(Math.max(...pile.heights)).toBe(0);
    });

    it('drifts deeper on the lee side (wind blowing right)', () => {
        // Seeded so noise cannot outweigh the drift.
        let seed = 7;
        const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
        const pile = grow(600, 300, 1, PRESETS.blizzard, createPile('top', 400, 200, 12, undefined, random));
        const n = pile.heights.length;
        const avg = (from: number, to: number) => {
            let s = 0;
            for (let i = from; i < to; i++) s += pile.heights[i];
            return s / (to - from);
        };
        expect(avg(Math.floor(n * 0.6), n - 4)).toBeGreaterThan(avg(4, Math.floor(n * 0.4)));
    });

    it('tapers to nothing at rounded corners', () => {
        const pile = grow(1200);
        expect(pile.heights[0]).toBe(0);
        expect(pile.heights[pile.heights.length - 1]).toBeLessThan(0.5);
    });

    it('only coats walls when the wind is strong', () => {
        expect(grow(300, 30).side).toBe(0);
        expect(grow(300, 400).side).toBeGreaterThan(0);
    });

    it('bottom piles hang thinner and never coat walls', () => {
        const pile = grow(600, 500, 1, PRESETS.steady, createPile('bottom', 400, 80, 0));
        expect(Math.max(...pile.heights)).toBeLessThan(PRESETS.steady.depth * 0.5);
        expect(Math.max(...pile.sideWidths)).toBe(0);
    });

    it('keeps settled snow when rebuilt after a resize', () => {
        const pile = grow(300);
        const resized = createPile('top', 800, 200, 12, pile);
        expect(resized.fill).toBe(pile.fill);
        expect(resized.heights.length).toBe(Math.ceil(800 / BUCKET) + 1);
    });
});

describe('small elements', () => {
    it('get proportionally small piles', () => {
        const pile = grow(600, 70, 1, PRESETS.blizzard, createPile('top', 40, 40, 0));
        expect(Math.max(...pile.heights)).toBeLessThanOrEqual(40 * 0.2 * 1.5);
    });
});

describe('writePileMesh', () => {
    it('emits nothing for an empty pile', () => {
        const mesh = new MeshBuilder();
        writePileMesh(createPile('top', 400, 200, 0), rect, 1, mesh);
        expect(mesh.vertexCount).toBe(0);
    });

    it('emits triangles above the top edge for a grown pile', () => {
        const mesh = new MeshBuilder();
        writePileMesh(grow(300), rect, 1, mesh);
        expect(mesh.vertexCount).toBeGreaterThan(0);
        expect(mesh.vertexCount % 3).toBe(0);
        for (let i = 0; i < mesh.length; i += 6) {
            const x = mesh.data[i];
            const y = mesh.data[i + 1];
            const a = mesh.data[i + 5];
            expect(x).toBeGreaterThanOrEqual(rect.left - 20);
            expect(x).toBeLessThanOrEqual(rect.right + 20);
            expect(y).toBeLessThanOrEqual(rect.bottom);
            // Premultiplied: color channels never exceed alpha.
            expect(mesh.data[i + 2]).toBeLessThanOrEqual(a + 1e-6);
        }
    });

    it('grows its buffer instead of overflowing', () => {
        const mesh = new MeshBuilder();
        const pile = grow(300, 400, 1, PRESETS.steady, createPile('top', 4000, 2000, 0));
        for (let i = 0; i < 5; i++) writePileMesh(pile, { left: 0, top: 3000, right: 4000, bottom: 5000 }, 1, mesh);
        expect(mesh.length).toBeLessThanOrEqual(mesh.data.length);
        expect(mesh.vertexCount).toBeGreaterThan(1000);
    });
});
