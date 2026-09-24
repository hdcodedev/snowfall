'use client';

import type { SnowfallPreset } from '@hdcodedev/snowfall';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Wind generated in the browser with the Web Audio API: no audio files, nothing to license.
 * Pink noise through a band filter and a brightness filter makes the whoosh; a narrow
 * resonant filter adds a howl. A slow gust signal moves volume, tone and howl.
 * Demo-only: the library itself never makes sound.
 */

interface WindProfile {
    /** Overall loudness (0-1). */
    volume: number;
    /** Center of the whoosh, Hz: lower is softer and deeper. */
    tone: number;
    /** Low-pass cutoff, Hz: higher is brighter and harsher. */
    brightness: number;
    /** How much gusts swell the volume (0 = steady). */
    gustDepth: number;
    /** How fast gusts come and go. */
    gustSpeed: number;
    /** Loudness of the whistling howl. */
    howl: number;
}

const PROFILES: Record<Exclude<SnowfallPreset, 'off'>, WindProfile> = {
    gentle: { volume: 0.1, tone: 340, brightness: 900, gustDepth: 0.3, gustSpeed: 0.6, howl: 0 },
    steady: { volume: 0.18, tone: 470, brightness: 1600, gustDepth: 0.45, gustSpeed: 0.85, howl: 0.012 },
    blizzard: { volume: 0.32, tone: 640, brightness: 3200, gustDepth: 0.7, gustSpeed: 1.4, howl: 0.07 },
};

const TICK_MS = 100;
/** Seconds for volume and tone to follow a change; also the preset crossfade speed. */
const SMOOTHING = 0.35;

/** A few seconds of pink noise (Paul Kellet's filter): softer than white noise, closer to wind. */
function pinkNoise(ctx: AudioContext, seconds: number): AudioBuffer {
    const length = Math.floor(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.969 * b2 + white * 0.153852;
        b3 = 0.8665 * b3 + white * 0.3104856;
        b4 = 0.55 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.016898;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
    }
    return buffer;
}

interface WindGraph {
    ctx: AudioContext;
    master: GainNode;
    whooshGain: GainNode;
    whooshBand: BiquadFilterNode;
    whooshLow: BiquadFilterNode;
    howlGain: GainNode;
    howlBand: BiquadFilterNode;
}

function buildGraph(): WindGraph {
    const ctx = new AudioContext();
    const noise = ctx.createBufferSource();
    noise.buffer = pinkNoise(ctx, 6);
    noise.loop = true;

    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    const whooshBand = ctx.createBiquadFilter();
    whooshBand.type = 'bandpass';
    whooshBand.Q.value = 0.7;
    const whooshLow = ctx.createBiquadFilter();
    whooshLow.type = 'lowpass';
    const whooshGain = ctx.createGain();
    noise.connect(whooshBand).connect(whooshLow).connect(whooshGain).connect(master);

    const howlBand = ctx.createBiquadFilter();
    howlBand.type = 'bandpass';
    howlBand.Q.value = 14;
    const howlGain = ctx.createGain();
    howlGain.gain.value = 0;
    noise.connect(howlBand).connect(howlGain).connect(master);

    noise.start();
    return { ctx, master, whooshGain, whooshBand, whooshLow, howlGain, howlBand };
}

/** Gust signal in roughly [0, 1]: layered slow waves plus occasional stronger gusts. */
function makeGusts() {
    let next = 4;
    let event: { start: number; duration: number; amplitude: number } | null = null;
    return (t: number, speed: number) => {
        const s = t * speed;
        let g = 0.5 + 0.25 * Math.sin(s * 0.37) + 0.15 * Math.sin(s * 0.91 + 1.3) + 0.1 * Math.sin(s * 2.3 + 0.4);
        if (t >= next && !event) {
            event = { start: t, duration: 2.5 + Math.random() * 3, amplitude: 0.25 + Math.random() * 0.35 };
            next = t + (6 + Math.random() * 10) / speed;
        }
        if (event) {
            const k = (t - event.start) / event.duration;
            if (k >= 1) event = null;
            else g += event.amplitude * Math.sin(Math.PI * k) ** 2;
        }
        return Math.min(1, Math.max(0, g));
    };
}

/** Off by default; the button's click turns it on (browsers only allow audio after a user gesture). */
export function useWindSound(preset: SnowfallPreset) {
    const [enabled, setEnabled] = useState(false);
    const graphRef = useRef<WindGraph | null>(null);
    const presetRef = useRef(preset);
    const suspendTimer = useRef(0);

    useEffect(() => {
        presetRef.current = preset;
    }, [preset]);

    // Follow the preset and the gusts while sound is on.
    useEffect(() => {
        const graph = graphRef.current;
        if (!enabled || !graph) return;
        const { ctx } = graph;
        const gustAt = makeGusts();
        // Eased copy of the current profile so preset changes crossfade.
        const current = { ...PROFILES[presetRef.current === 'off' ? 'gentle' : presetRef.current], volume: 0 };

        const tick = () => {
            const target = presetRef.current;
            const goal = target === 'off' ? { ...current, volume: 0, howl: 0 } : PROFILES[target];
            for (const key of Object.keys(goal) as (keyof WindProfile)[]) {
                current[key] += (goal[key] - current[key]) * 0.08;
            }
            const now = ctx.currentTime;
            const gust = gustAt(now, current.gustSpeed);
            const level = current.volume * (1 - current.gustDepth + current.gustDepth * gust);
            graph.whooshGain.gain.setTargetAtTime(level, now, SMOOTHING);
            graph.whooshBand.frequency.setTargetAtTime(current.tone * (0.8 + 0.5 * gust), now, SMOOTHING);
            graph.whooshLow.frequency.setTargetAtTime(current.brightness * (0.7 + 0.6 * gust), now, SMOOTHING);
            graph.howlBand.frequency.setTargetAtTime(420 + 520 * gust, now, SMOOTHING);
            graph.howlGain.gain.setTargetAtTime(current.howl * gust * gust, now, SMOOTHING);
        };
        tick();
        const id = window.setInterval(tick, TICK_MS);
        return () => window.clearInterval(id);
    }, [enabled]);

    // Pause in background tabs; nobody wants wind from a tab they can't see.
    useEffect(() => {
        const onVisibility = () => {
            const graph = graphRef.current;
            if (!graph || !enabled) return;
            if (document.visibilityState === 'hidden') void graph.ctx.suspend();
            else void graph.ctx.resume();
        };
        document.addEventListener('visibilitychange', onVisibility);
        return () => document.removeEventListener('visibilitychange', onVisibility);
    }, [enabled]);

    useEffect(() => () => {
        window.clearTimeout(suspendTimer.current);
        void graphRef.current?.ctx.close();
        graphRef.current = null;
    }, []);

    /** Must be called from a click: browsers only allow audio after a user gesture. */
    const toggle = useCallback(() => {
        const graph = graphRef.current ?? (graphRef.current = buildGraph());
        const now = graph.ctx.currentTime;
        window.clearTimeout(suspendTimer.current);
        if (enabled) {
            // Fade out, then pause the audio thread entirely.
            graph.master.gain.setTargetAtTime(0, now, 0.2);
            suspendTimer.current = window.setTimeout(() => void graph.ctx.suspend(), 800);
        } else {
            void graph.ctx.resume();
            graph.master.gain.setTargetAtTime(1, now, 0.4);
        }
        setEnabled(!enabled);
    }, [enabled]);

    return { enabled, toggle };
}
