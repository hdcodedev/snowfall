import { PresetParams } from './presets';
import { MAX_FLAKES, WeatherState } from './weather';
import { BUCKET, Pile, Rect } from './piles';

/** Flakes the 2D fallback simulates at most; it has no GPU to lean on. */
export const MAX_2D_FLAKES = 1500;
const MARGIN = 40;
const LAYER_ALPHA = [0.35, 0.6, 0.9];

export interface PileDraw {
    pile: Pile;
    rect: Rect;
}

/**
 * Fallback for browsers without WebGL2: the same closed-form flake motion computed in JS
 * for a smaller pool, no streaks or haze, and piles drawn as 2D paths.
 */
export class Canvas2DRenderer {
    private ctx: CanvasRenderingContext2D;
    private seeds: Float32Array;

    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
        this.seeds = new Float32Array(MAX_2D_FLAKES * 4);
        for (let i = 0; i < this.seeds.length; i += 4) {
            this.seeds[i] = Math.random();
            this.seeds[i + 1] = Math.random();
            this.seeds[i + 2] = Math.pow(Math.random(), 1.6);
            this.seeds[i + 3] = Math.random();
        }
    }

    render(
        width: number,
        height: number,
        dpr: number,
        scrollX: number,
        scrollY: number,
        weather: WeatherState,
        params: PresetParams,
        density: number,
        piles: PileDraw[],
        windDir: number
    ): void {
        const ctx = this.ctx;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, width, height);

        // Same share of the pool as WebGL, rescaled to the smaller 2D pool.
        const share = Math.min(1, (density * MAX_FLAKES) / MAX_2D_FLAKES);
        const domW = width + 2 * MARGIN;
        const domH = height + 2 * MARGIN;
        const s = this.seeds;
        const t = weather.time;
        const mod = (a: number, n: number) => ((a % n) + n) % n;

        this.drawPiles(piles, windDir);

        ctx.fillStyle = '#ffffff';
        for (let layer = 0; layer < LAYER_ALPHA.length; layer++) {
            const zMin = layer / LAYER_ALPHA.length;
            const zMax = (layer + 1) / LAYER_ALPHA.length;
            ctx.globalAlpha = LAYER_ALPHA[layer];
            ctx.beginPath();
            for (let i = 0; i < s.length; i += 4) {
                const z = s[i + 2];
                const rnd = s[i + 3];
                if (z < zMin || z >= zMax || ((rnd * 13.731) % 1) >= share) continue;
                const par = 0.22 + 0.78 * z;
                const spd = par * (0.75 + 0.5 * ((rnd * 5.17) % 1));
                const kx = spd * (0.65 + 0.7 * ((rnd * 9.13) % 1));
                const sway = (3 + 13 * z) * params.turb;
                const x = mod(s[i] * domW + weather.driftX * kx + Math.sin(t * (0.5 + rnd) + rnd * 61) * sway - scrollX * par, domW) - MARGIN;
                const y = mod(s[i + 1] * domH + weather.driftY * spd - scrollY * par, domH) - MARGIN;
                const r = params.sizeMin + (params.sizeMax - params.sizeMin) * z * z * z;
                ctx.rect(x - r, y - r, r * 2, r * 2);
            }
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    private drawPiles(piles: PileDraw[], windDir: number): void {
        const ctx = this.ctx;
        ctx.fillStyle = '#eef3fa';
        ctx.beginPath();
        for (const { pile, rect } of piles) {
            const { heights, sideWidths, width, height } = pile;
            const bottom = pile.type === 'bottom';
            const edge = bottom ? rect.bottom : rect.top;
            const dir = bottom ? 1 : -1;
            ctx.moveTo(rect.left, edge);
            for (let i = 0; i < heights.length; i++) {
                ctx.lineTo(rect.left + Math.min(width, i * BUCKET), edge + dir * heights[i]);
            }
            ctx.lineTo(rect.right, edge);
            ctx.closePath();

            if (bottom || pile.side <= 0.01) continue;
            const x = windDir > 0 ? rect.left : rect.right;
            ctx.moveTo(x, rect.top);
            for (let i = 0; i < sideWidths.length; i++) {
                ctx.lineTo(x - windDir * sideWidths[i], rect.top + Math.min(height, i * BUCKET));
            }
            ctx.lineTo(x, rect.bottom);
            ctx.closePath();
        }
        ctx.fill();
    }
}
