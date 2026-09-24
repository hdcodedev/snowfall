import { PresetParams } from './presets';

/**
 * Procedural snow piles. There is no per-flake collision: a pile grows from how hard it
 * is snowing, shaped by noise and wind (deeper on the lee side, a lip at the lee edge,
 * scoured on the windward edge). Walls facing the wind collect a thin layer.
 */

export type PileType = 'top' | 'bottom';

/** Horizontal (and vertical, for walls) resolution of a pile profile, px. */
export const BUCKET = 4;

export interface Pile {
    type: PileType;
    width: number;
    height: number;
    radius: number;
    /** 0..1 how full the pile is; grows while snowing, melts otherwise. */
    fill: number;
    /** 0..1 how much snow clings to the windward wall. */
    side: number;
    base: Float32Array;
    growth: Float32Array;
    sideNoise: Float32Array;
    /** Snow height per bucket along the edge (computed by updatePile). */
    heights: Float32Array;
    /** Snow width per bucket down the windward wall. */
    sideWidths: Float32Array;
}

/** Smooth 1D value noise in [0, 1], `octaves` layers from coarse (48px) to fine. */
export const noise1d = (n: number, octaves: number, random: () => number = Math.random): Float32Array => {
    const out = new Float32Array(n);
    let amplitude = 1;
    let total = 0;
    for (let o = 0; o < octaves; o++) {
        const step = Math.max(2, Math.round(48 / Math.pow(2, o)));
        const points = Array.from({ length: Math.ceil(n / step) + 2 }, random);
        for (let i = 0; i < n; i++) {
            const x = i / step;
            const j = Math.floor(x);
            const f = x - j;
            const u = f * f * (3 - 2 * f);
            out[i] += amplitude * (points[j] * (1 - u) + points[j + 1] * u);
        }
        total += amplitude;
        amplitude *= 0.5;
    }
    for (let i = 0; i < n; i++) out[i] /= total;
    return out;
};

const smoothstep = (e0: number, e1: number, x: number) => {
    const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
    return t * t * (3 - 2 * t);
};

export const createPile = (
    type: PileType,
    width: number,
    height: number,
    radius: number,
    previous?: Pile,
    random: () => number = Math.random
): Pile => {
    const n = Math.ceil(width / BUCKET) + 1;
    const sideN = Math.ceil(height / BUCKET) + 1;
    return {
        type,
        width,
        height,
        radius,
        // Keep accumulated snow across resizes and re-scans.
        fill: previous?.fill ?? 0,
        side: previous?.side ?? 0,
        base: noise1d(n, 5, random),
        growth: noise1d(n, 2, random),
        sideNoise: noise1d(sideN, 3, random),
        heights: new Float32Array(n),
        sideWidths: new Float32Array(sideN),
    };
};

/** Melt rates (fill per second) when it is not snowing: a full pile melts in about 5 minutes. */
const MELT = 1 / 300;
const SIDE_MELT = 1 / 240;

/**
 * Grow or melt a pile over dt seconds and recompute its profile.
 * `snowing` is 0..1, `wind` is the current wind in px/s (sign = direction).
 */
export const updatePile = (pile: Pile, dt: number, params: PresetParams, snowing: number, wind: number): void => {
    const windDir = Math.sign(wind) || 1;
    const drift = Math.abs(params.drift);
    const windward = Math.min(1.2, Math.abs(wind) / 400);
    const isSnowing = snowing > 0.5;

    pile.fill = Math.min(1, Math.max(0, pile.fill + dt * (isSnowing ? params.accum * snowing : -MELT)));
    pile.side = Math.min(1, Math.max(0, pile.side + dt * (isSnowing && windward > 0.2 ? params.accum * windward * 0.8 : -SIDE_MELT)));

    const { heights, sideWidths, base, growth, sideNoise, width: w, height: h, radius } = pile;
    const r = Math.max(radius, 3);
    // Small elements (buttons, badges) get proportionally small piles.
    const maxDepth = Math.min(params.depth, w * 0.2);

    for (let i = 0; i < heights.length; i++) {
        const px = Math.min(w, i * BUCKET);
        const f = Math.min(1, pile.fill * (0.65 + 0.7 * growth[i]));
        // Depth grows linearly with time, like real snowfall (no fast-looking first seconds).
        let depth = maxDepth * f * (0.35 + 0.65 * base[i]);
        if (pile.type === 'bottom') {
            heights[i] = depth * 0.4;
            continue;
        }
        const lee = windDir > 0 ? px / w : 1 - px / w;
        depth *= 1 + drift * (lee - 0.5) * 0.5;
        depth += drift * maxDepth * 0.18 * Math.pow(f, 1.3) * Math.exp(-(1 - lee) * w / 30);
        depth *= 0.6 + 0.4 * Math.sqrt(smoothstep(0, 0.04 + 0.12 * drift, lee));
        heights[i] = depth * smoothstep(0, r, px) * smoothstep(0, r, w - px);
    }

    for (let i = 0; i < sideWidths.length; i++) {
        const py = Math.min(h, i * BUCKET);
        const inCorner = py < radius || py > h - radius;
        sideWidths[i] = inCorner || pile.type === 'bottom'
            ? 0
            : maxDepth * 0.28 * pile.side * (0.35 + 0.65 * py / h) * (0.5 + 0.5 * sideNoise[i]);
    }
};

export const hasSnow = (pile: Pile) => pile.fill > 0.001 || pile.side > 0.001;

// ─── Mesh ───────────────────────────────────────────────────────────────────

/** Growable vertex buffer: x, y, then premultiplied r, g, b, a (6 floats per vertex). */
export class MeshBuilder {
    data = new Float32Array(6 * 6 * 2048);
    length = 0;

    reset(): void {
        this.length = 0;
    }

    get vertexCount(): number {
        return this.length / 6;
    }

    reserve(vertices: number): void {
        const needed = this.length + vertices * 6;
        if (needed <= this.data.length) return;
        const bigger = new Float32Array(Math.max(this.data.length * 2, needed));
        bigger.set(this.data.subarray(0, this.length));
        this.data = bigger;
    }

    vertex(x: number, y: number, c: readonly number[]): void {
        const d = this.data;
        const i = this.length;
        d[i] = x; d[i + 1] = y; d[i + 2] = c[0]; d[i + 3] = c[1]; d[i + 4] = c[2]; d[i + 5] = c[3];
        this.length = i + 6;
    }

    /** Two triangles spanning (x0, a0)-(x0, b0) to (x1, a1)-(x1, b1); color ca at a, cb at b. */
    quad(x0: number, a0: number, b0: number, x1: number, a1: number, b1: number, ca: readonly number[], cb: readonly number[]): void {
        this.vertex(x0, a0, ca); this.vertex(x0, b0, cb); this.vertex(x1, a1, ca);
        this.vertex(x1, a1, ca); this.vertex(x0, b0, cb); this.vertex(x1, b1, cb);
    }
}

// Premultiplied colors.
const SHADE = [0.78, 0.84, 0.91, 1] as const;
const WHITE = [1, 1, 1, 1] as const;
const CLEAR = [0, 0, 0, 0] as const;
const WALL = [0.93 * 0.92, 0.95 * 0.92, 0.98 * 0.92, 0.92] as const;
/** Soft edge width in px, used instead of antialiasing. */
const FEATHER = 1;

export interface Rect {
    left: number;
    top: number;
    right: number;
    bottom: number;
}

/** Append a pile's triangles at the element's current viewport position. */
export const writePileMesh = (pile: Pile, rect: Rect, windDir: number, mesh: MeshBuilder): void => {
    const { heights, sideWidths, width, height } = pile;
    mesh.reserve((heights.length + sideWidths.length) * 12);

    const bottom = pile.type === 'bottom';
    const edge = bottom ? rect.bottom : rect.top;
    const dir = bottom ? 1 : -1;
    const atEdge = bottom ? WHITE : SHADE;
    const atSurface = bottom ? SHADE : WHITE;

    for (let i = 0; i < heights.length - 1; i++) {
        const h0 = heights[i];
        const h1 = heights[i + 1];
        if (h0 < 0.05 && h1 < 0.05) continue;
        const x0 = rect.left + Math.min(width, i * BUCKET);
        const x1 = rect.left + Math.min(width, (i + 1) * BUCKET);
        const t0 = edge + dir * h0;
        const t1 = edge + dir * h1;
        mesh.quad(x0, edge, t0, x1, edge, t1, atEdge, atSurface);
        mesh.quad(x0, t0, t0 + dir * FEATHER, x1, t1, t1 + dir * FEATHER, atSurface, CLEAR);
    }

    if (bottom || pile.side <= 0.01) return;
    const x = windDir > 0 ? rect.left : rect.right;
    const out = -windDir;
    for (let i = 0; i < sideWidths.length - 1; i++) {
        const w0 = sideWidths[i];
        const w1 = sideWidths[i + 1];
        if (w0 < 0.05 && w1 < 0.05) continue;
        const y0 = rect.top + Math.min(height, i * BUCKET);
        const y1 = rect.top + Math.min(height, (i + 1) * BUCKET);
        const xa0 = x + out * w0;
        const xa1 = x + out * w1;
        mesh.vertex(x, y0, WALL); mesh.vertex(xa0, y0, WALL); mesh.vertex(x, y1, WALL);
        mesh.vertex(x, y1, WALL); mesh.vertex(xa0, y0, WALL); mesh.vertex(xa1, y1, WALL);
        mesh.vertex(xa0, y0, WALL); mesh.vertex(xa0 + out * FEATHER, y0, CLEAR); mesh.vertex(xa1, y1, WALL);
        mesh.vertex(xa1, y1, WALL); mesh.vertex(xa0 + out * FEATHER, y0, CLEAR); mesh.vertex(xa1 + out * FEATHER, y1, CLEAR);
    }
};
