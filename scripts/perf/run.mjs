#!/usr/bin/env node
// Frame-rate test for the snowfall engine in real Chrome.
//
//   npm run perf                      Retina-sized run of every preset, fails below thresholds
//   npm run perf -- --smoke           Short run; only checks that every preset renders without errors (CI)
//   npm run perf -- --smoke --canvas2d  Same, with WebGL disabled, to exercise the Canvas 2D fallback
//   npm run perf -- --seconds 30 --presets blizzard --screenshots perf-shots
//
// Needs a machine with a GPU for meaningful numbers. Set CHROME_PATH to use a specific Chrome.

import { build } from 'esbuild';
import { spawn, execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtempSync, readFileSync, rmSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const MAX_SCALE = 1.5; // engine's highest render scale

// ─── Options ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const option = (name, fallback) => {
    const i = args.indexOf(`--${name}`);
    return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const smoke = flag('smoke');
/** Disable WebGL in Chrome so the engine must use its Canvas 2D fallback. */
const canvas2d = flag('canvas2d');
const opts = {
    presets: option('presets', 'gentle,steady,blizzard').split(','),
    seconds: Number(option('seconds', smoke ? 3 : 20)),
    warmup: smoke ? 2 : 4,
    width: smoke ? 1280 : 1728,
    height: smoke ? 800 : 1080,
    deviceScale: smoke ? 1 : 2,
    screenshots: option('screenshots', null),
    thresholds: !smoke && !flag('no-thresholds'),
};

const THRESHOLDS = {
    medianFps: 55,
    p10Fps: 45,
    /** Share of seconds the engine may spend at reduced render scale or flake count. */
    maxReducedShare: 0.2,
};

// ─── Helpers ────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function findChrome() {
    if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
    const mac = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    if (process.platform === 'darwin' && existsSync(mac)) return mac;
    for (const name of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser']) {
        try {
            return execFileSync('which', [name], { encoding: 'utf8' }).trim();
        } catch {
            // try the next one
        }
    }
    throw new Error('Chrome not found. Set CHROME_PATH.');
}

async function bundlePage() {
    const result = await build({
        entryPoints: [join(HERE, 'page.ts')],
        bundle: true,
        format: 'esm',
        target: 'es2020',
        write: false,
        logLevel: 'silent',
    });
    return result.outputFiles[0].text;
}

function serve(html, js) {
    return new Promise((resolve) => {
        const server = createServer((req, res) => {
            if (req.url?.startsWith('/page.js')) {
                res.writeHead(200, { 'content-type': 'text/javascript' });
                res.end(js);
            } else {
                res.writeHead(200, { 'content-type': 'text/html' });
                res.end(html);
            }
        });
        server.listen(0, '127.0.0.1', () => resolve(server));
    });
}

function launchChrome(url, profileDir) {
    const gpuFlags = process.platform === 'darwin'
        ? ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist']
        : smoke
            // CI runners have no GPU: allow software WebGL so the smoke test can render.
            ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']
            : ['--enable-gpu', '--ignore-gpu-blocklist'];
    const chrome = spawn(findChrome(), [
        '--headless=new',
        '--remote-debugging-port=0',
        `--user-data-dir=${profileDir}`,
        `--window-size=${opts.width},${opts.height}`,
        `--force-device-scale-factor=${opts.deviceScale}`,
        '--disable-background-timer-throttling',
        '--disable-renderer-backgrounding',
        '--disable-backgrounding-occluded-windows',
        '--no-first-run',
        '--no-default-browser-check',
        ...(process.getuid?.() === 0 ? ['--no-sandbox'] : []),
        ...gpuFlags,
        ...(canvas2d ? ['--disable-webgl'] : []),
        url,
    ], { stdio: ['ignore', 'ignore', 'pipe'] });

    const port = new Promise((resolve, reject) => {
        let stderr = '';
        const timer = setTimeout(() => reject(new Error(`Chrome did not start:\n${stderr}`)), 20000);
        chrome.stderr.on('data', (chunk) => {
            stderr += chunk;
            const match = stderr.match(/DevTools listening on ws:\/\/[^:]+:(\d+)\//);
            if (match) {
                clearTimeout(timer);
                resolve(Number(match[1]));
            }
        });
        chrome.on('exit', (code) => reject(new Error(`Chrome exited (${code}):\n${stderr}`)));
    });
    return { chrome, port };
}

/** Minimal DevTools protocol client for one page. */
async function connect(port) {
    let target;
    for (let i = 0; i < 50 && !target; i++) {
        const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
        target = list.find((t) => t.type === 'page' && t.url.startsWith('http'));
        if (!target) await sleep(100);
    }
    if (!target) throw new Error('Test page did not open');

    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
        ws.onopen = resolve;
        ws.onerror = reject;
    });
    let nextId = 0;
    const pending = new Map();
    const errors = [];
    ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && pending.has(msg.id)) {
            pending.get(msg.id)(msg);
            pending.delete(msg.id);
        } else if (msg.method === 'Runtime.exceptionThrown') {
            const d = msg.params.exceptionDetails;
            errors.push(d.exception?.description ?? d.text);
        } else if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
            errors.push(msg.params.args.map((a) => a.value ?? a.description).join(' '));
        }
    };
    const send = (method, params = {}) => new Promise((resolve) => {
        const id = ++nextId;
        pending.set(id, resolve);
        ws.send(JSON.stringify({ id, method, params }));
    });
    const evaluate = async (expression) => {
        const res = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
        if (res.result?.exceptionDetails) throw new Error(res.result.exceptionDetails.exception?.description ?? 'evaluate failed');
        return res.result?.result?.value;
    };
    await send('Runtime.enable');
    return { send, evaluate, errors, close: () => ws.close() };
}

const percentile = (sorted, p) => sorted[Math.min(sorted.length - 1, Math.floor(p * (sorted.length - 1)))];

function summarize(preset, samples) {
    const fps = samples.map((s) => s.fps).sort((a, b) => a - b);
    const topScale = Math.min(MAX_SCALE, opts.deviceScale);
    const reduced = samples.filter((s) => s.scale < topScale - 0.01 || s.density < 0.99).length;
    return {
        preset,
        renderer: samples.at(-1)?.renderer ?? 'none',
        median: percentile(fps, 0.5),
        p10: percentile(fps, 0.1),
        min: fps[0],
        flakes: Math.max(...samples.map((s) => s.flakes)),
        reducedShare: samples.length ? reduced / samples.length : 1,
        samples: samples.length,
    };
}

function check(result) {
    const problems = [];
    if (result.renderer === 'none') problems.push('nothing rendered');
    if (canvas2d && result.renderer !== 'canvas2d') problems.push(`expected the canvas2d fallback, got ${result.renderer}`);
    if (result.flakes <= 0) problems.push('no flakes drawn');
    if (!opts.thresholds) return problems;
    if (result.median < THRESHOLDS.medianFps) problems.push(`median ${result.median} fps < ${THRESHOLDS.medianFps}`);
    if (result.p10 < THRESHOLDS.p10Fps) problems.push(`worst 10% ${result.p10} fps < ${THRESHOLDS.p10Fps}`);
    if (result.reducedShare > THRESHOLDS.maxReducedShare) {
        problems.push(`reduced quality ${Math.round(result.reducedShare * 100)}% of the time > ${THRESHOLDS.maxReducedShare * 100}%`);
    }
    return problems;
}

// ─── Run ────────────────────────────────────────────────────────────────────

const [js, html] = await Promise.all([bundlePage(), Promise.resolve(readFileSync(join(HERE, 'page.html'), 'utf8'))]);
const server = await serve(html, js);
const url = `http://127.0.0.1:${server.address().port}/`;
const profileDir = mkdtempSync(join(tmpdir(), 'snowfall-perf-'));
const { chrome, port } = launchChrome(url, profileDir);

let failed = false;
try {
    const page = await connect(await port);
    for (let i = 0; i < 100 && !(await page.evaluate('!!window.__perf?.ready')); i++) await sleep(100);

    console.log(`\nSnowfall perf · ${opts.width}×${opts.height} @${opts.deviceScale}x · ${opts.seconds}s per preset${smoke ? ' · smoke' : ''}${canvas2d ? ' · canvas2d fallback' : ''}\n`);
    const results = [];
    for (const preset of opts.presets) {
        await page.evaluate(`window.__perf.setPreset(${JSON.stringify(preset)})`);
        await sleep(opts.warmup * 1000);
        await page.evaluate('window.__perf.samples.length = 0');
        await sleep(opts.seconds * 1000 + 200);
        const samples = await page.evaluate('window.__perf.samples.slice()');
        const result = summarize(preset, samples);
        result.problems = check(result);
        results.push(result);

        if (opts.screenshots) {
            mkdirSync(opts.screenshots, { recursive: true });
            const shot = await page.send('Page.captureScreenshot', { format: 'png' });
            writeFileSync(join(opts.screenshots, `${preset}.png`), Buffer.from(shot.result.data, 'base64'));
        }
    }

    const rows = [['preset', 'renderer', 'median fps', 'worst 10%', 'min', 'max flakes', 'reduced quality', 'result']];
    for (const r of results) {
        rows.push([
            r.preset, r.renderer, String(r.median), String(r.p10), String(r.min),
            String(r.flakes), `${Math.round(r.reducedShare * 100)}%`,
            r.problems.length ? `FAIL: ${r.problems.join('; ')}` : 'ok',
        ]);
    }
    const widths = rows[0].map((_, c) => Math.max(...rows.map((row) => row[c].length)));
    for (const row of rows) console.log(row.map((cell, c) => cell.padEnd(widths[c])).join('  '));

    if (page.errors.length) {
        console.log(`\nPage errors:\n${page.errors.map((e) => `  ${e}`).join('\n')}`);
        failed = true;
    }
    failed ||= results.some((r) => r.problems.length > 0);
    console.log(failed ? '\nFAILED' : '\nPASSED');
    page.close();
} catch (error) {
    console.error(error);
    failed = true;
} finally {
    chrome.kill();
    server.close();
    await sleep(300);
    rmSync(profileDir, { recursive: true, force: true });
}
process.exit(failed ? 1 : 0);
