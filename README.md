# [@hdcodedev/snowfall](https://next-snowfall.vercel.app)

[![npm version](https://img.shields.io/npm/v/@hdcodedev/snowfall.svg)](https://www.npmjs.com/package/@hdcodedev/snowfall)


A realistic snowfall effect for React with physics-based accumulation on surfaces. Features melting, wind, and smart surface detection.

<img width="1391" height="843" alt="Screenshot 2026-03-29 at 19 18 18" src="https://github.com/user-attachments/assets/b7a420c6-0fb2-4255-afec-29e60444d198" />


## Features

- **Realistic Physics** - Wind, wobble, and varied snowflake speeds
- **Surface Accumulation** - Snow naturally piles up on elements
- **Melting Effect** - Gradual melting over time
- **Border-Radius Aware** - Respects rounded corners
- **Auto-Detection** - Automatically finds and accumulates on semantic elements
- **High Performance** - Smooth 60 FPS with adaptive optimizations
- **Toggleable** - Enable/disable on demand
- **Responsive** - Adapts to viewport and element changes

## Installation

```bash
npm install @hdcodedev/snowfall
```

or

```bash
yarn add @hdcodedev/snowfall
```

## Quick Start

Snowfall automatically detects HTML elements like `<header>` and `<footer>` and accumulates snow on their edges. You can also mark any element manually.

### Basic Usage

```tsx
import { Snowfall, SnowfallProvider } from '@hdcodedev/snowfall';

export default function App() {
  return (
    <SnowfallProvider>
      <Snowfall />

      {/* Auto-detected: Headers accumulate snow on BOTTOM */}
      <header>
        <h1>My Site</h1>
      </header>
      
      {/* Auto-detected: Footers accumulate snow on TOP (natural piling) */}
      <footer>
        <p>© 2025</p>
      </footer>
      
      {/* Manual: Force accumulation on any element */}
      <div data-snowfall="top">
        <h2>Custom Element</h2>
      </div>
      
      {/* Disable accumulation on specific elements */}
      <div data-snowfall="ignore">
        <p>No snow here</p>
      </div>
    </SnowfallProvider>
  );
}
```

### Surface Types

Use the `data-snowfall` attribute to control where snow accumulates on an element:

- **`data-snowfall="top"`** — Snow piles up on the top edge (default for `<footer>` and most elements)
- **`data-snowfall="bottom"`** — Snow hangs from the bottom edge (default for `<header>` and `role="banner"`)
- **`data-snowfall="ignore"`** — No snow accumulates on this element

## Customization

You can customize how snow behaves via the `SnowfallProvider`:

```tsx
import { SnowfallProvider, DEFAULT_PHYSICS } from '@hdcodedev/snowfall';

const customPhysics = {
  ...DEFAULT_PHYSICS,
  MAX_FLAKES: 500,              // Maximum number of snowflakes
  MELT_SPEED: 0.00005,          // How fast snow melts (lower = lasts longer)
  WIND_STRENGTH: 1.5,           // Wind intensity
  ACCUMULATION: {
    SIDE_RATE: 1.0,             // Accumulation rate on sides
    TOP_RATE: 5.0,              // Accumulation rate on top surfaces
    BOTTOM_RATE: 5.0,           // Accumulation rate on bottom surfaces (headers)
  },
  MAX_DEPTH: {
    TOP: 100,                   // Max snow height on top surfaces (px)
    BOTTOM: 50,                 // Max snow height on bottom surfaces (px)
    SIDE: 20,                   // Max snow width on sides (px)
  },
  FLAKE_SIZE: {
    MIN: 0.5,                   // Minimum flake radius
    MAX: 1.6,                   // Maximum flake radius
  }
};
```

## API

### `<SnowfallProvider>`

Wraps your app to manage snowfall state. Place it at the root of your component tree.

### `<Snowfall />`

Renders the snowfall canvas. Must be placed inside `SnowfallProvider`. Snow accumulates on detected elements automatically.

### `useSnowfall()`

Hook to control snowfall at runtime. Must be used inside `SnowfallProvider`.

**Returns:**
```typescript
{
  isEnabled: boolean;                           // Whether snow is currently falling
  toggleSnow: () => void;                       // Start or stop the snowfall
  physicsConfig: PhysicsConfig;                 // Current snow behavior settings
  updatePhysicsConfig: (config: Partial<PhysicsConfig>) => void;  // Change settings at runtime
  resetPhysics: () => void;                     // Restore default settings
}
```

## Tips

- Snow is drawn on a transparent layer that doesn't block clicks, scrolling, or other interactions
- Snow accumulation works best on static or slowly-changing layouts
- The component uses `'use client'` directive for Next.js 13+ App Router compatibility

## Performance Optimizations

Key optimizations for smooth 60 FPS performance:

- **Smart Collision Checks**: Only 30% of snowflakes check for collisions each frame (configurable via `COLLISION_CHECK_RATE`), reducing CPU load while maintaining visual quality
- **Adaptive Spawn Rate**: Automatically reduces snowflake count when FPS drops below 40
- **Offscreen Skipping**: Only processes accumulation for elements visible in the viewport
- **Efficient FPS Tracking**: Uses a second-bucket approach to avoid per-frame memory allocations

**For slower devices, reduce the load:**
```tsx
const customPhysics = {
  ...DEFAULT_PHYSICS,
  MAX_FLAKES: 200,             // Fewer snowflakes
  COLLISION_CHECK_RATE: 0.1,   // Check fewer flakes per frame
  MAX_SURFACES: 15,            // Fewer surfaces to track
};
```

## License
[MIT](LICENSE)
