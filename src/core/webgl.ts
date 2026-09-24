import { PresetParams } from './presets';
import { MAX_FLAKES, WeatherState } from './weather';
import { MeshBuilder } from './piles';

const FLAKE_VS = `#version 300 es
layout(location=0) in vec2 aCorner;
layout(location=1) in vec4 aSeed;          // x0, y0, depth z, random
uniform vec2 uRes;                          // CSS px
uniform float uTime;
uniform vec2 uDrift;                        // integrated wind (x) and fall (y), px at depth 1
uniform vec2 uVel;                          // current wind / fall velocity, px/s at depth 1
uniform vec2 uScroll;                       // page scroll, px
uniform float uDensity;                     // fraction of flakes visible
uniform float uStreak;                      // seconds of motion blur
uniform vec2 uSize;                         // min / max radius
uniform float uBokeh;                       // share of nearest flakes drawn big and soft
uniform float uTurb;                        // sway / turbulence strength
uniform float uMargin;
out vec2 vLocal;
out float vLen, vR, vSoft, vAlpha;
out vec3 vColor;

void main() {
  float z = aSeed.z;
  float rnd = aSeed.w;
  if (fract(rnd * 13.731) >= uDensity) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }

  float nearBoost = smoothstep(0.9, 1.0, z);
  float par = mix(0.22, 1.0, z) + nearBoost * 0.7;         // parallax: near flakes rush past
  float spd = par * (0.75 + 0.5 * fract(rnd * 5.17));
  // Each flake catches the wind a little differently, so paths are not parallel.
  vec2 k = vec2(spd * (0.65 + 0.7 * fract(rnd * 9.13)), spd);

  vec2 dom = uRes + 2.0 * uMargin;
  float swayAmp = mix(3.0, 16.0, z) * uTurb;
  vec2 sway = vec2(
    sin(uTime * (0.5 + rnd) + rnd * 61.0) * swayAmp,
    sin(uTime * (0.8 + rnd * 0.6) + rnd * 17.0) * swayAmp * 0.35);

  vec2 p = mod(aSeed.xy * dom + uDrift * k + sway - uScroll * par, dom) - uMargin;

  bool bokeh = nearBoost > 0.0 && fract(rnd * 3.71) < uBokeh;
  float r = mix(uSize.x, uSize.y, z * z * z) * (0.7 + 0.6 * fract(rnd * 7.31));
  float soft = 0.6;
  float alpha = mix(0.22, 0.95, z);
  // Out-of-focus flakes right in front of the viewer: modestly larger and faint, not glowing orbs.
  if (bokeh) { r *= 1.6 + nearBoost * 0.5; soft = r * 0.75; alpha *= 0.3; }

  vec2 v = uVel * k;
  float speed = length(v);
  float len = speed * uStreak;
  r *= mix(1.0, 0.6, clamp(len / 12.0, 0.0, 1.0));
  vec2 dir = speed > 0.001 ? v / speed : vec2(0.0, 1.0);
  vec2 nrm = vec2(-dir.y, dir.x);
  float halfL = len * 0.5 + r + soft;
  float halfW = r + soft;
  vec2 pos = p + dir * aCorner.x * halfL + nrm * aCorner.y * halfW;

  vLocal = vec2(aCorner.x * halfL, aCorner.y * halfW);
  vLen = len * 0.5; vR = r; vSoft = soft; vAlpha = alpha;
  vColor = mix(vec3(0.74, 0.8, 0.9), vec3(1.0), z);
  gl_Position = vec4(pos / uRes * vec2(2.0, -2.0) + vec2(-1.0, 1.0), 0.0, 1.0);
}`;

const FLAKE_FS = `#version 300 es
precision mediump float;
in vec2 vLocal;
in float vLen, vR, vSoft, vAlpha;
in vec3 vColor;
out vec4 outColor;
void main() {
  float dx = max(abs(vLocal.x) - vLen, 0.0);
  float d = length(vec2(dx, vLocal.y));
  float a = 1.0 - smoothstep(vR - vSoft, vR + vSoft, d);
  a *= vAlpha / (1.0 + vLen / max(vR, 0.5) * 0.35);       // a streak spreads the same light
  if (a < 0.004) discard;
  outColor = vec4(vColor * a, a);
}`;

const FULLSCREEN_VS = `#version 300 es
const vec2 P[3] = vec2[3](vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0));
void main() { gl_Position = vec4(P[gl_VertexID], 0.0, 1.0); }`;

const FOG_FS = `#version 300 es
precision mediump float;
uniform vec2 uDevRes;
uniform vec2 uDrift;
uniform float uTime, uFog, uGust;
out vec4 outColor;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; } return v; }
void main() {
  vec2 uv = gl_FragCoord.xy / uDevRes;
  vec2 p = vec2(uv.x * uDevRes.x / uDevRes.y, uv.y) * 2.2;
  p -= vec2(uDrift.x * 0.0007, -uDrift.y * 0.0002);
  float n = fbm(p + vec2(0.0, uTime * 0.03));
  float a = clamp(uFog * (0.25 + 0.95 * n) * (0.65 + 0.55 * uGust), 0.0, 0.6);
  outColor = vec4(vec3(0.84, 0.88, 0.94) * a, a);
}`;

const BLIT_FS = `#version 300 es
precision mediump float;
uniform sampler2D uTex;
uniform vec2 uDevRes;
out vec4 outColor;
void main() { outColor = texture(uTex, gl_FragCoord.xy / uDevRes); }`;

const PILE_VS = `#version 300 es
layout(location=0) in vec2 aPos;
layout(location=1) in vec4 aColor;
uniform vec2 uRes;
out vec4 vColor;
void main() {
  vColor = aColor;
  gl_Position = vec4(aPos / uRes * vec2(2.0, -2.0) + vec2(-1.0, 1.0), 0.0, 1.0);
}`;

const PILE_FS = `#version 300 es
precision mediump float;
in vec4 vColor;
out vec4 outColor;
void main() { outColor = vColor; }`;

/** Haze is smooth noise, so it renders at 1/4 resolution (1/16 of the pixels) and is upscaled. */
const FOG_SCALE = 4;
const MARGIN = 80;

interface Program {
    program: WebGLProgram;
    u: Record<string, WebGLUniformLocation | null>;
}

export interface FrameInput {
    width: number;
    height: number;
    scrollX: number;
    scrollY: number;
    weather: WeatherState;
    params: PresetParams;
    /** Fraction of the flake pool to draw, after quality scaling. */
    density: number;
    piles: MeshBuilder;
    /** True when `piles` changed since the last frame and must be re-uploaded. */
    pilesChanged: boolean;
}

/** GPU renderer: flake positions are computed in the vertex shader from a static seed buffer. */
export class WebGLRenderer {
    private gl: WebGL2RenderingContext;
    private flake: Program;
    private fog: Program;
    private blit: Program;
    private pile: Program;
    private flakeVao: WebGLVertexArrayObject;
    private pileVao: WebGLVertexArrayObject;
    private seedBuffer: WebGLBuffer;
    private pileBuffer: WebGLBuffer;
    private buffers: WebGLBuffer[] = [];
    private fogTexture: WebGLTexture;
    private fogFramebuffer: WebGLFramebuffer;
    private fogWidth = 1;
    private fogHeight = 1;
    /** Index of the first "near" flake: far flakes draw behind the haze and piles. */
    private split: number;
    private pileVertices = 0;

    constructor(gl: WebGL2RenderingContext) {
        this.gl = gl;
        this.flake = this.compile(FLAKE_VS, FLAKE_FS);
        this.fog = this.compile(FULLSCREEN_VS, FOG_FS);
        this.blit = this.compile(FULLSCREEN_VS, BLIT_FS);
        this.pile = this.compile(PILE_VS, PILE_FS);

        // Seeds sorted by depth so far flakes draw first, then haze and piles, then near flakes.
        const seeds: number[][] = [];
        for (let i = 0; i < MAX_FLAKES; i++) seeds.push([Math.random(), Math.random(), Math.pow(Math.random(), 1.6), Math.random()]);
        seeds.sort((a, b) => a[2] - b[2]);
        this.split = seeds.findIndex((s) => s[2] >= 0.55);
        if (this.split < 0) this.split = MAX_FLAKES;

        this.flakeVao = gl.createVertexArray()!;
        gl.bindVertexArray(this.flakeVao);
        const corners = this.buffer(new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, corners);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        this.seedBuffer = this.buffer(new Float32Array(seeds.flat()), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribDivisor(1, 1);

        this.pileVao = gl.createVertexArray()!;
        gl.bindVertexArray(this.pileVao);
        this.pileBuffer = this.buffer(null, gl.STREAM_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 24, 0);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 24, 8);
        gl.bindVertexArray(null);

        this.fogTexture = gl.createTexture()!;
        this.fogFramebuffer = gl.createFramebuffer()!;
    }

    resize(deviceWidth: number, deviceHeight: number): void {
        const gl = this.gl;
        this.fogWidth = Math.max(1, Math.ceil(deviceWidth / FOG_SCALE));
        this.fogHeight = Math.max(1, Math.ceil(deviceHeight / FOG_SCALE));
        gl.bindTexture(gl.TEXTURE_2D, this.fogTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, this.fogWidth, this.fogHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fogFramebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.fogTexture, 0);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    render(frame: FrameInput): void {
        const gl = this.gl;
        const deviceWidth = gl.canvas.width;
        const deviceHeight = gl.canvas.height;
        const { weather, params } = frame;

        gl.viewport(0, 0, deviceWidth, deviceHeight);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

        this.drawFlakes(frame, 0, this.split);

        const fogAmount = params.fog * weather.snowing;
        if (fogAmount > 0.001) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.fogFramebuffer);
            gl.viewport(0, 0, this.fogWidth, this.fogHeight);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.useProgram(this.fog.program);
            gl.uniform2f(this.fog.u.uDevRes, this.fogWidth, this.fogHeight);
            gl.uniform2f(this.fog.u.uDrift, weather.driftX, weather.driftY);
            gl.uniform1f(this.fog.u.uTime, weather.time);
            gl.uniform1f(this.fog.u.uFog, fogAmount);
            gl.uniform1f(this.fog.u.uGust, Math.max(0, weather.gust));
            gl.drawArrays(gl.TRIANGLES, 0, 3);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.viewport(0, 0, deviceWidth, deviceHeight);

            gl.useProgram(this.blit.program);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.fogTexture);
            gl.uniform1i(this.blit.u.uTex, 0);
            gl.uniform2f(this.blit.u.uDevRes, deviceWidth, deviceHeight);
            gl.drawArrays(gl.TRIANGLES, 0, 3);
        }

        // Piles sit in the page plane: behind the near flakes, in front of the far ones.
        gl.bindVertexArray(this.pileVao);
        if (frame.pilesChanged) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.pileBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, frame.piles.data.subarray(0, frame.piles.length), gl.STREAM_DRAW);
            this.pileVertices = frame.piles.vertexCount;
        }
        if (this.pileVertices > 0) {
            gl.useProgram(this.pile.program);
            gl.uniform2f(this.pile.u.uRes, frame.width, frame.height);
            gl.drawArrays(gl.TRIANGLES, 0, this.pileVertices);
        }

        this.drawFlakes(frame, this.split, MAX_FLAKES);
        gl.bindVertexArray(null);
    }

    destroy(): void {
        const gl = this.gl;
        for (const b of this.buffers) gl.deleteBuffer(b);
        for (const p of [this.flake, this.fog, this.blit, this.pile]) gl.deleteProgram(p.program);
        gl.deleteVertexArray(this.flakeVao);
        gl.deleteVertexArray(this.pileVao);
        gl.deleteTexture(this.fogTexture);
        gl.deleteFramebuffer(this.fogFramebuffer);
    }

    private drawFlakes(frame: FrameInput, from: number, to: number): void {
        if (to <= from || frame.density <= 0) return;
        const gl = this.gl;
        const { weather, params } = frame;
        const u = this.flake.u;
        gl.useProgram(this.flake.program);
        gl.uniform2f(u.uRes, frame.width, frame.height);
        gl.uniform1f(u.uTime, weather.time);
        gl.uniform2f(u.uDrift, weather.driftX, weather.driftY);
        gl.uniform2f(u.uVel, weather.wind, weather.fall);
        gl.uniform2f(u.uScroll, frame.scrollX, frame.scrollY);
        gl.uniform1f(u.uDensity, frame.density);
        gl.uniform1f(u.uStreak, params.streak);
        gl.uniform2f(u.uSize, params.sizeMin, params.sizeMax);
        gl.uniform1f(u.uBokeh, params.bokeh);
        gl.uniform1f(u.uTurb, params.turb);
        gl.uniform1f(u.uMargin, MARGIN);

        gl.bindVertexArray(this.flakeVao);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.seedBuffer);
        gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 0, from * 16);
        gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, to - from);
    }

    private buffer(data: Float32Array | null, usage: number): WebGLBuffer {
        const gl = this.gl;
        const b = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, b);
        if (data) gl.bufferData(gl.ARRAY_BUFFER, data, usage);
        this.buffers.push(b);
        return b;
    }

    private compile(vs: string, fs: string): Program {
        const gl = this.gl;
        const shader = (type: number, src: string) => {
            const s = gl.createShader(type)!;
            gl.shaderSource(s, src);
            gl.compileShader(s);
            if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(`Snowfall shader: ${gl.getShaderInfoLog(s)}`);
            return s;
        };
        const program = gl.createProgram()!;
        const v = shader(gl.VERTEX_SHADER, vs);
        const f = shader(gl.FRAGMENT_SHADER, fs);
        gl.attachShader(program, v);
        gl.attachShader(program, f);
        gl.linkProgram(program);
        gl.deleteShader(v);
        gl.deleteShader(f);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(`Snowfall shader: ${gl.getProgramInfoLog(program)}`);
        const u: Program['u'] = {};
        const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < count; i++) {
            const info = gl.getActiveUniform(program, i);
            if (info) u[info.name] = gl.getUniformLocation(program, info.name);
        }
        return { program, u };
    }
}
