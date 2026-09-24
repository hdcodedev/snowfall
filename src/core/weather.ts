import { PRESETS, PresetParams, SnowfallPreset, isPreset } from './presets';

/** Size of the flake pool; presets draw a fraction of it. */
export const MAX_FLAKES = 30000;

export interface WeatherState {
    /** Current horizontal wind, px/s at the nearest depth. */
    wind: number;
    /** Current fall speed, px/s at the nearest depth. */
    fall: number;
    /** Gust signal, roughly -0.9..2.4; above 0 means a gust is blowing. */
    gust: number;
    /** Fraction of the flake pool to draw (0..1), before quality scaling. */
    density: number;
    /** 0..1: eases to 0 when the preset is 'off'. */
    snowing: number;
    /** Integrated wind and fall (px at the nearest depth), so speed changes never make flakes jump. */
    driftX: number;
    driftY: number;
    time: number;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const warnInvalid = (preset: unknown) => {
    // eslint-disable-next-line no-console
    console.warn(`[snowfall] Unknown preset ${JSON.stringify(preset)}. Use 'gentle', 'steady', 'blizzard' or 'off'.`);
};

/**
 * Weather over time: eases between presets like the weather changing, and produces
 * gusts from layered slow waves plus occasional random gust events.
 */
export class Weather {
    /** Parameters to render with this frame (eased toward the current preset). */
    params: PresetParams;
    private base: PresetParams;
    private target: SnowfallPreset;
    private snowing: number;
    private time = 0;
    private driftX = 0;
    private driftY = 0;
    private nextGust = 3;
    private gustEvent: { start: number; duration: number; amplitude: number } | null = null;
    private random: () => number;

    constructor(preset: SnowfallPreset, random: () => number = Math.random) {
        this.random = random;
        if (!isPreset(preset)) {
            warnInvalid(preset);
            preset = 'steady';
        }
        this.target = preset;
        this.base = { ...PRESETS[preset === 'off' ? 'steady' : preset] };
        this.params = { ...this.base };
        this.snowing = preset === 'off' ? 0 : 1;
    }

    get preset(): SnowfallPreset {
        return this.target;
    }

    /** Unknown presets (e.g. a typo from plain JavaScript) are ignored with a warning. */
    setPreset(preset: SnowfallPreset): void {
        if (!isPreset(preset)) {
            warnInvalid(preset);
            return;
        }
        this.target = preset;
    }

    /** True once 'off' has fully faded out. */
    get stopped(): boolean {
        return this.target === 'off' && this.snowing < 0.001;
    }

    gustAt(t: number): number {
        let g = 0.45 * Math.sin(t * 0.23) + 0.3 * Math.sin(t * 0.61 + 1.3) + 0.15 * Math.sin(t * 1.7 + 0.4);
        if (t >= this.nextGust && !this.gustEvent) {
            this.gustEvent = { start: t, duration: 2 + this.random() * 3.5, amplitude: 0.6 + this.random() * 0.9 };
            this.nextGust = t + 5 + this.random() * 9;
        }
        if (this.gustEvent) {
            const k = (t - this.gustEvent.start) / this.gustEvent.duration;
            if (k >= 1) this.gustEvent = null;
            else g += this.gustEvent.amplitude * Math.pow(Math.sin(Math.PI * k), 2);
        }
        return g;
    }

    /** Advance by dt seconds. */
    step(dt: number): WeatherState {
        this.time += dt;

        // Keep the last preset's look while 'off' fades, so snow thins out instead of changing.
        if (this.target !== 'off') {
            const goal = PRESETS[this.target];
            const k = 1 - Math.exp(-dt * 0.8);
            const b = this.base as unknown as Record<string, number>;
            for (const key of Object.keys(goal) as (keyof PresetParams)[]) {
                b[key] = lerp(b[key], goal[key], k);
            }
        }
        Object.assign(this.params, this.base);
        this.snowing = lerp(this.snowing, this.target === 'off' ? 0 : 1, 1 - Math.exp(-dt * 0.9));

        const p = this.params;
        const gust = this.gustAt(this.time);
        const wind = p.wind * (1 + p.gust * gust);
        const fall = p.fall * (1 + 0.12 * p.gust * gust);
        this.driftX += wind * dt;
        this.driftY += fall * dt;
        const density = Math.min(1, (p.count / MAX_FLAKES) * (1 + 0.45 * p.gust * Math.max(0, gust)) * this.snowing);

        return {
            wind, fall, gust, density,
            snowing: this.snowing,
            driftX: this.driftX,
            driftY: this.driftY,
            time: this.time,
        };
    }
}
