import type { CSSProperties } from 'react';
import type { SnowfallPreset } from '@hdcodedev/snowfall';

/**
 * Fairytale night scene. The artwork is a static file (public/night-scene.svg), painted
 * once. On top of it sit invisible ledges carrying data-snowfall, placed over the sills,
 * chimney cap, door lintel, fence rail, lamp cap and ground, so real snow piles up on the art.
 * The only animation is the chimney smoke: many faint, overlapping puffs on one curved path,
 * staggered evenly so they blend into a continuous plume.
 */

/** Scene size in SVG units; overlays are positioned in these units. */
const SCENE_WIDTH = 1600;
const SCENE_HEIGHT = 900;

/** Flat surfaces in the artwork where snow should settle (x, y, width, height). */
const LEDGES = [
  { name: 'chimney cap', x: 897, y: 447, w: 62, h: 10 },
  { name: 'left sill', x: 652, y: 704, w: 90, h: 8 },
  { name: 'right sill', x: 858, y: 704, w: 90, h: 8 },
  { name: 'door lintel', x: 760, y: 652, w: 80, h: 8 },
  { name: 'fence rail', x: 180, y: 752, w: 205, h: 7 },
  { name: 'lamp cap', x: 1044, y: 514, w: 22, h: 3 },
  { name: 'ground', x: 0, y: 785, w: 1600, h: 115 },
];

// Seconds for one puff to rise and fade. The path per preset is the scene-smoke-<preset>
// keyframes in globals.css: upright when gentle, bent low and sideways in a blizzard.
const SMOKE_DURATION: Record<SnowfallPreset, number> = {
  gentle: 11,
  steady: 9,
  blizzard: 5,
  off: 12,
};

/** Chimney mouth and puff size in scene units; keep size in sync with the keyframes in globals.css. */
const SMOKE_ORIGIN = { x: 906, y: 428, size: 44 };
/** Enough overlapping puffs that the plume reads as one continuous column. */
const SMOKE_PUFFS = 16;

/** Position a box given in scene units as percentages of the scene. */
const place = (x: number, y: number, w: number, h: number): CSSProperties => ({
  left: `${(x / SCENE_WIDTH) * 100}%`,
  top: `${(y / SCENE_HEIGHT) * 100}%`,
  width: `${(w / SCENE_WIDTH) * 100}%`,
  height: `${(h / SCENE_HEIGHT) * 100}%`,
});

export default function NightScene({ preset }: { preset: SnowfallPreset }) {
  const duration = SMOKE_DURATION[preset];
  const { x, y, size } = SMOKE_ORIGIN;

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="scene">
        <div className="absolute inset-0 bg-[url(/night-scene.svg)] bg-cover" />

        {LEDGES.map((l) => (
          <div key={l.name} data-snowfall="top" className="absolute" style={place(l.x, l.y, l.w, l.h)} />
        ))}

        {Array.from({ length: SMOKE_PUFFS }, (_, i) => (
          <div
            key={i}
            className="scene-smoke"
            style={{
              ...place(x, y, size, size),
              animationName: `scene-smoke-${preset}`,
              animationDuration: `${duration}s`,
              animationDelay: `${(-i * duration) / SMOKE_PUFFS}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
