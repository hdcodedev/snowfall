export type SnowfallPreset = 'gentle' | 'steady' | 'blizzard' | 'off';

/** Internal tuning for a preset. Speeds are px/s at the nearest depth. */
export interface PresetParams {
    /** Flakes on screen (before gusts and quality scaling). */
    count: number;
    /** Average wind, px/s. Positive blows right. */
    wind: number;
    /** How strongly gusts swing the wind (0 = steady wind). */
    gust: number;
    /** Fall speed, px/s. */
    fall: number;
    /** Seconds of motion blur; stretches fast flakes into streaks. */
    streak: number;
    /** Haze strength. */
    fog: number;
    /** Sway / turbulence multiplier. */
    turb: number;
    /** Radius of the farthest / nearest flakes, px. */
    sizeMin: number;
    sizeMax: number;
    /** Share of the nearest flakes drawn large and out of focus. */
    bokeh: number;
    /** Pile fill per second while snowing (1 = full); e.g. 1 / 360 fills in 6 minutes. */
    accum: number;
    /** Max pile depth, px. */
    depth: number;
    /** How strongly wind drifts snow to the sheltered side. */
    drift: number;
}

export const PRESETS: Record<Exclude<SnowfallPreset, 'off'>, PresetParams> = {
    gentle: {
        count: 1800, wind: 22, gust: 0.35, fall: 75, streak: 0, fog: 0, turb: 1,
        sizeMin: 0.6, sizeMax: 3, bokeh: 0.02, accum: 1 / 720, depth: 16, drift: 0.15,
    },
    steady: {
        count: 6500, wind: 70, gust: 0.5, fall: 115, streak: 0.004, fog: 0.05, turb: 1.2,
        sizeMin: 0.5, sizeMax: 3.6, bokeh: 0.04, accum: 1 / 360, depth: 28, drift: 0.3,
    },
    blizzard: {
        count: 16000, wind: 520, gust: 0.9, fall: 170, streak: 0.011, fog: 0.42, turb: 2.4,
        sizeMin: 0.4, sizeMax: 3.4, bokeh: 0.08, accum: 1 / 150, depth: 42, drift: 0.6,
    },
};

export const isPreset = (value: unknown): value is SnowfallPreset =>
    value === 'off' || (typeof value === 'string' && value in PRESETS);
