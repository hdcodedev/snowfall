# [@hdcodedev/snowfall](https://next-snowfall.vercel.app)


A realistic snowfall effect for React with physics-based accumulation on surfaces. Features melting, wind, and smart surface detection.

![ScreenRecording2025-12-23at00 07 30-ezgif com-optimize](https://github.com/user-attachments/assets/49c4a537-7f04-4043-806e-21478f419dd7)



## Features

- **Realistic Physics** - Wind, wobble, and varied snowflake speeds
- **Surface Accumulation** - Snow naturally accumulates on elements
- **Melting Effect** - Snow gradually melts over time
- **Border-Radius Aware** - Respects rounded corners
- **Smart Detection** - Automatically detects and accumulates on specified elements
- **Optimized Performance** - Efficient canvas rendering with ResizeObserver
- **Toggleable** - Built-in provider for enabling/disabling
- **Responsive** - Adapts to viewport and element size changes

## Installation

```bash
npm install @hdcodedev/snowfall
```

or

```bash
yarn add @hdcodedev/snowfall
```

## Quick Start

Snowfall automatically detects semantic tags (like `<header>`) and styled elements. You can also force accumulation manually.

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

- **`data-snowfall="top"`** (default for most elements): Snow accumulates on the top edge, piling downward
- **`data-snowfall="bottom"`** (default for `<header>` tags): Snow accumulates on the bottom edge
- **`data-snowfall="ignore"`**: Prevents snow accumulation on the element

By default:
- `<header>` and `role="banner"` → Bottom accumulation
- `<footer>` and other elements → Top accumulation (natural piling)

## Customization

You can customize physics via the `SnowfallProvider`:

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

// Then use it in your provider - see API section below
```

## API

### `<SnowfallProvider>`

Wraps your app to provide snowfall context.

**Props:** None

### `<Snowfall />`

The main snowfall canvas component. Must be used within `SnowfallProvider`.

**Props:** None

### `useSnowfall()`

Hook to access snowfall controls. Must be used within `SnowfallProvider`.

**Returns:**
```typescript
{
  isEnabled: boolean;                           // Current enabled state
  toggleSnow: () => void;                       // Function to toggle snow on/off
  physicsConfig: PhysicsConfig;                 // Current physics configuration
  updatePhysicsConfig: (config: Partial<PhysicsConfig>) => void;  // Update physics
  resetPhysics: () => void;                     // Reset to default physics
}
```

## Tips

- The snowfall canvas has `pointer-events: none`, so it won't interfere with user interactions
- Snow accumulation works best on static or slowly-changing layouts
- The component uses `'use client'` directive for Next.js 13+ App Router compatibility
- For best performance, limit the number of accumulation surfaces

## Development

```bash
# Install dependencies
npm install

# Build the library
npm run build

# Run in development mode
npm run dev

# Run the demo
cd demo && npm run dev
```

## License

Copyright © 2025 hdcodedev.

Licensed under the [Apache 2.0 License](LICENSE).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Show Your Support

If you like this project, please consider giving it a star on GitHub!

## Issues

Found a bug? Please [open an issue](https://github.com/hdcodedev/snowfall/issues) on GitHub.
