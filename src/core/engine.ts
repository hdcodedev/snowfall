import { SnowfallPreset } from './presets';
import { Weather, MAX_FLAKES } from './weather';
import { Pile, MeshBuilder, createPile, updatePile, writePileMesh, hasSnow, BUCKET } from './piles';
import { getAccumulationSurfaces } from './dom';
import { ATTR_SNOWFALL } from './constants';
import { WebGLRenderer } from './webgl';
import { Canvas2DRenderer, PileDraw, MAX_2D_FLAKES } from './canvas2d';

/** Most elements that collect snow at once. */
const MAX_SURFACES = 24;
/** Piles change slowly; their profiles update this often (seconds). */
const PILE_INTERVAL = 0.1;
/** Highest render scale; flakes are soft, so full Retina resolution buys nothing visible. */
const MAX_SCALE = 1.5;
/** Seconds after starting or changing preset before quality control reacts (startup/hydration hitches). */
const WARMUP = 2;

export interface SnowEngineStats {
    renderer: 'webgl' | 'canvas2d' | 'none';
    fps: number;
    flakes: number;
    surfaces: number;
    scale: number;
    /** Share of the preset's flakes drawn after quality control (1 = all). */
    density: number;
}

/**
 * Framework-agnostic snowfall runtime. Owns the canvas, animation loop, DOM observers
 * and all state; the React component is a thin wrapper around it.
 */
export class SnowEngine {
    private canvas: HTMLCanvasElement;
    private weather: Weather;
    private webgl: WebGLRenderer | null = null;
    private gl: WebGL2RenderingContext | null = null;
    private canvas2d: Canvas2DRenderer | null = null;
    private ctx2d: CanvasRenderingContext2D | null = null;
    private piles = new Map<Element, Pile>();
    private mesh = new MeshBuilder();
    private meshKey = '';
    private pilesChanged = true;
    private pileClock = PILE_INTERVAL;
    private width = 0;
    private height = 0;
    private dpr = 1;
    private rafId = 0;
    private scanId = 0;
    private running = false;
    private destroyed = false;
    private lastTime = 0;
    private quality = { scale: MAX_SCALE, density: 1, warmup: WARMUP, windowTime: 0, windowFrames: 0, goodWindows: 0 };
    private fps = { frames: 0, since: 0, value: 0 };
    private lastDensity = 0;
    private resizeObserver: ResizeObserver;
    private mutationObserver: MutationObserver;

    constructor(canvas: HTMLCanvasElement, preset: SnowfallPreset = 'steady') {
        this.canvas = canvas;
        this.weather = new Weather(preset);
        this.initRenderer();

        this.resizeObserver = new ResizeObserver(() => this.scheduleScan());
        this.mutationObserver = new MutationObserver((mutations) => {
            for (const m of mutations) {
                if (m.type === 'attributes') return this.scheduleScan();
                for (const node of m.addedNodes) if (node.nodeType === 1 && node !== canvas) return this.scheduleScan();
                for (const node of m.removedNodes) if (node.nodeType === 1 && node !== canvas) return this.scheduleScan();
            }
        });
        this.mutationObserver.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: [ATTR_SNOWFALL],
        });

        window.addEventListener('resize', this.handleResize);
        document.addEventListener('visibilitychange', this.handleVisibility);
        canvas.addEventListener('webglcontextlost', this.handleContextLost);
        canvas.addEventListener('webglcontextrestored', this.handleContextRestored);

        this.handleResize();
        this.scan();
        this.start();
    }

    setPreset(preset: SnowfallPreset): void {
        if (preset === this.weather.preset) return;
        this.weather.setPreset(preset);
        this.quality.warmup = WARMUP;
        this.start();
    }

    get stats(): SnowEngineStats {
        return {
            renderer: this.webgl ? 'webgl' : this.canvas2d ? 'canvas2d' : 'none',
            fps: this.fps.value,
            flakes: Math.round(Math.min(this.lastDensity * MAX_FLAKES, this.webgl ? MAX_FLAKES : MAX_2D_FLAKES)),
            surfaces: this.piles.size,
            scale: this.dpr,
            density: this.quality.density,
        };
    }

    destroy(): void {
        this.destroyed = true;
        this.running = false;
        cancelAnimationFrame(this.rafId);
        cancelAnimationFrame(this.scanId);
        this.resizeObserver.disconnect();
        this.mutationObserver.disconnect();
        window.removeEventListener('resize', this.handleResize);
        document.removeEventListener('visibilitychange', this.handleVisibility);
        this.canvas.removeEventListener('webglcontextlost', this.handleContextLost);
        this.canvas.removeEventListener('webglcontextrestored', this.handleContextRestored);
        this.webgl?.destroy();
        this.webgl = null;
        this.piles.clear();
    }

    // ─── Setup ──────────────────────────────────────────────────────────────

    private initRenderer(): void {
        const gl = this.canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false });
        if (gl) {
            try {
                this.webgl = new WebGLRenderer(gl);
                this.gl = gl;
                return;
            } catch {
                this.webgl = null;
            }
        }
        // A canvas holding a WebGL context cannot give a 2D one, so the fallback only
        // applies when WebGL2 is unavailable from the start.
        this.ctx2d = gl ? null : this.canvas.getContext('2d');
        this.canvas2d = this.ctx2d ? new Canvas2DRenderer(this.ctx2d) : null;
    }

    private handleContextLost = (event: Event): void => {
        event.preventDefault();
        this.webgl = null;
        this.running = false;
        cancelAnimationFrame(this.rafId);
    };

    private handleContextRestored = (): void => {
        if (!this.gl) return;
        this.webgl = new WebGLRenderer(this.gl);
        this.handleResize();
        this.start();
    };

    private handleResize = (): void => {
        this.dpr = Math.min(window.devicePixelRatio || 1, this.quality.scale);
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = Math.round(this.width * this.dpr);
        this.canvas.height = Math.round(this.height * this.dpr);
        this.webgl?.resize(this.canvas.width, this.canvas.height);
        this.pilesChanged = true;
    };

    private handleVisibility = (): void => {
        // Don't fast-forward through the time spent in a background tab.
        this.lastTime = 0;
        if (document.visibilityState === 'visible') this.start();
    };

    private scheduleScan(): void {
        if (this.scanId || this.destroyed) return;
        this.scanId = requestAnimationFrame(() => {
            this.scanId = 0;
            this.scan();
        });
    }

    /** Find surfaces and (re)build their piles, keeping snow that already settled. */
    private scan(): void {
        if (this.destroyed) return;
        const next = new Map<Element, Pile>();
        this.resizeObserver.disconnect();
        for (const { el, type } of getAccumulationSurfaces(MAX_SURFACES)) {
            const rect = el.getBoundingClientRect();
            const radius = parseFloat(window.getComputedStyle(el).borderTopLeftRadius) || 0;
            const existing = this.piles.get(el);
            const unchanged = existing &&
                existing.type === type &&
                existing.radius === radius &&
                Math.abs(existing.width - rect.width) < BUCKET / 2 &&
                Math.abs(existing.height - rect.height) < BUCKET / 2;
            next.set(el, unchanged ? existing : createPile(type, rect.width, rect.height, radius, existing));
            this.resizeObserver.observe(el);
        }
        this.piles = next;
        this.pilesChanged = true;
        // Fresh piles need a profile before they are drawn.
        this.pileClock = PILE_INTERVAL;
    }

    // ─── Loop ───────────────────────────────────────────────────────────────

    private start(): void {
        if (this.running || this.destroyed || (!this.webgl && !this.canvas2d)) return;
        this.running = true;
        this.quality.warmup = WARMUP;
        this.lastTime = 0;
        this.rafId = requestAnimationFrame(this.tick);
    }

    private tick = (now: number): void => {
        if (!this.running || this.destroyed) return;
        if (document.visibilityState !== 'visible') {
            this.running = false;
            return;
        }
        const dt = this.lastTime ? Math.min(0.05, (now - this.lastTime) / 1000) : 1 / 60;
        this.lastTime = now;

        this.governQuality(dt);
        const weather = this.weather.step(dt);
        const params = this.weather.params;
        const density = weather.density * this.quality.density;
        this.lastDensity = density;

        this.pileClock += dt;
        if (this.pileClock >= PILE_INTERVAL) {
            for (const pile of this.piles.values()) updatePile(pile, this.pileClock, params, weather.snowing, weather.wind);
            this.pileClock = 0;
            this.pilesChanged = true;
        }

        const windDir = Math.sign(weather.wind) || 1;
        const scrollX = window.scrollX;
        const scrollY = window.scrollY;

        if (this.webgl) {
            this.webgl.render({
                width: this.width,
                height: this.height,
                scrollX,
                scrollY,
                weather,
                params,
                density,
                piles: this.mesh,
                pilesChanged: this.buildPileMesh(windDir),
            });
        } else if (this.canvas2d) {
            this.canvas2d.render(this.width, this.height, this.dpr, scrollX, scrollY, weather, params, density, this.visiblePiles(), windDir);
        }

        this.countFps(now);

        // Idle: snow is off and everything has melted, so stop the loop entirely.
        if (this.weather.stopped && ![...this.piles.values()].some(hasSnow)) {
            this.clear();
            this.running = false;
            return;
        }
        this.rafId = requestAnimationFrame(this.tick);
    };

    private visiblePiles(): PileDraw[] {
        const out: PileDraw[] = [];
        for (const [el, pile] of this.piles) {
            if (!el.isConnected || !hasSnow(pile)) continue;
            const rect = el.getBoundingClientRect();
            if (rect.bottom < -100 || rect.top > this.height + 100) continue;
            out.push({ pile, rect });
        }
        return out;
    }

    /** Rebuild pile triangles only when piles grew or the page moved. Returns whether it rebuilt. */
    private buildPileMesh(windDir: number): boolean {
        const draws = this.visiblePiles();
        let key = `${this.width}x${this.height}|${windDir}`;
        for (const { rect } of draws) key += `;${rect.left | 0},${rect.top | 0}`;
        if (!this.pilesChanged && key === this.meshKey) return false;
        this.meshKey = key;
        this.pilesChanged = false;
        this.mesh.reset();
        for (const { pile, rect } of draws) writePileMesh(pile, rect, windDir, this.mesh);
        return true;
    }

    /**
     * Judge 1-second windows: if the average frame is slow, lower render scale, then flake
     * count; after a few good windows, restore them. Single hitches (GC, tab switches,
     * dev-server hydration) are ignored so they never throttle a healthy device.
     */
    private governQuality(dt: number): void {
        const q = this.quality;
        if (q.warmup > 0) {
            q.warmup -= dt;
            return;
        }
        if (dt > 0.1) return;
        q.windowTime += dt;
        q.windowFrames++;
        if (q.windowTime < 1) return;

        const avgMs = (q.windowTime / q.windowFrames) * 1000;
        q.windowTime = 0;
        q.windowFrames = 0;

        if (avgMs > 20) {
            q.goodWindows = 0;
            if (q.scale > 1) {
                q.scale = Math.max(1, q.scale - 0.25);
                this.handleResize();
            } else {
                q.density = Math.max(0.35, q.density * 0.8);
            }
        } else if (avgMs < 17.8 && ++q.goodWindows >= 3) {
            q.goodWindows = 0;
            if (q.density < 1) {
                q.density = Math.min(1, q.density * 1.25);
            } else if (q.scale < MAX_SCALE) {
                q.scale = Math.min(MAX_SCALE, q.scale + 0.25);
                this.handleResize();
            }
        }
    }

    private countFps(now: number): void {
        const f = this.fps;
        f.frames++;
        if (!f.since) f.since = now;
        if (now - f.since >= 500) {
            f.value = Math.round((f.frames * 1000) / (now - f.since));
            f.frames = 0;
            f.since = now;
        }
    }

    private clear(): void {
        if (this.gl) {
            this.gl.clearColor(0, 0, 0, 0);
            this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        } else if (this.ctx2d) {
            this.ctx2d.setTransform(1, 0, 0, 1, 0, 0);
            this.ctx2d.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
}
