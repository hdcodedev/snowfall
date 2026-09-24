# [@hdcodedev/snowfall](https://next-snowfall.vercel.app)

[![npm version](https://img.shields.io/npm/v/@hdcodedev/snowfall.svg)](https://www.npmjs.com/package/@hdcodedev/snowfall)

> Why? Because some tokens must be burned for fun.

Cinematic snowfall for React. Tens of thousands of GPU-rendered flakes with depth, gusting wind, motion streaks and haze, plus snow that drifts and piles up on your page.

<img width="1391" height="843" alt="Snowfall demo" src="https://github.com/user-attachments/assets/b7a420c6-0fb2-4255-afec-29e60444d198" />

## Installation

```bash
npm install @hdcodedev/snowfall
```

## Usage

```tsx
import { Snowfall } from '@hdcodedev/snowfall';

export default function App() {
  return (
    <>
      <Snowfall preset="steady" />
      <header>My Site</header>
      <footer>© 2026</footer>
    </>
  );
}
```

That's the whole API: one prop.

| Preset | What it looks like |
| --- | --- |
| `gentle` | A light, calm flurry. Snow settles slowly. |
| `steady` | Classic snowfall with soft gusts and depth. The default. |
| `blizzard` | Driving wind, streaks and haze. Deep drifts. |
| `off` | Snow stops and the piles melt away. |

Changing the preset eases between them, like the weather changing.

## Where snow settles

Snow piles up on visible `<header>`, `<footer>`, `<nav>`, `<article>` and `<aside>` elements (ones with a background, border or shadow). Control it with the `data-snowfall` attribute:

- **`data-snowfall="top"`** — snow piles up on the top edge
- **`data-snowfall="bottom"`** — snow hangs from the bottom edge (default for `<header>`)
- **`data-snowfall="ignore"`** — no snow on this element or anything inside it

## Good to know

- **Avoid `backdrop-filter` under the snow.** A blurred panel behind a canvas that changes every frame has to re-blur every frame, which can cost 10+ fps on large screens.
- **No WebGL2:** a simpler Canvas 2D version is used, with fewer flakes and no streaks or haze.
- **Next.js:** the component is marked `'use client'`, so it works in the App Router.

## Performance

60 fps in every preset, measured on a 2019 Intel MacBook Pro. No shiny new laptop required.

| Preset | Median fps | Worst 10% | Flakes on screen | Quality reduced |
| --- | --- | --- | --- | --- |
| `gentle` | 60 | 60 | ~2,400 | never |
| `steady` | 60 | 60 | ~8,600 | never |
| `blizzard` | 60 | 60 | ~22,800 | never |

<sub>Chrome 153, 1728×1080 window at 2× (Retina), 20 s per preset, snow piling on a typical page. Intel Core i9-9880H, Radeon Pro 560X / UHD 630. CPU cost is under 1 ms per frame; the rest is GPU. On weaker devices, render resolution and then flake count step down automatically, so the numbers above are the ceiling, not the promise.</sub>

Measure your own machine:

```bash
npm run perf            # every preset at Retina size in headless Chrome; fails below 55 fps median
npm run perf -- --smoke # quick render check without fps thresholds (used in CI)
```

Options: `--presets blizzard`, `--seconds 30`, `--screenshots <dir>`, `--no-thresholds`, `--canvas2d` (disables WebGL to test the fallback). Needs a machine with a GPU; set `CHROME_PATH` to use a specific Chrome.

## Without React

```ts
import { SnowEngine } from '@hdcodedev/snowfall';

const canvas = document.createElement('canvas');
canvas.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:9999';
document.body.appendChild(canvas);

const snow = new SnowEngine(canvas, 'blizzard');
// snow.setPreset('off');
// snow.destroy();
```

## License
[MIT](LICENSE)
