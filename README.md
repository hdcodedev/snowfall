# @hdcodedev/snowfall

A realistic snowfall effect for React with physics-based accumulation on surfaces. Features melting, wind, and smart surface detection.

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

      {/* Auto-detected: Semantic tags */}
      <header>
        <h1>My Site</h1>
      </header>
      
      {/* Manual: Force accumulation on any element */}
      <div data-snowfall="top">
        <h2>Custom Element</h2>
      </div>
    </SnowfallProvider>
  );
}
```

## Customization

The snowfall physics can be customized by modifying the `SNOW_PHYSICS` constant:

```typescript
const SNOW_PHYSICS = {
  MAX_FLAKES: 500,              // Maximum number of snowflakes
  MELT_SPEED: 0.00005,          // How fast snow melts (lower = lasts longer)
  ACCUMULATION: {
    SIDE_RATE: 1.2,             // Accumulation rate on sides
    TOP_CARD_RATE: 1.9,         // Accumulation rate on card tops
    TOP_HEADER_RATE: 1.2,       // Accumulation rate on header tops
  },
  MAX_DEPTH: {
    CARD_TOP: 50,               // Max snow height on cards (px)
    HEADER_TOP: 25,             // Max snow height on headers (px)
    CARD_SIDE: 8,               // Max snow width on card sides (px)
  }
};
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
  isEnabled: boolean;        // Current enabled state
  toggleSnow: () => void;    // Function to toggle snow on/off
}
```

## Demo

Check out the [live demo](https://snowfall-2026.vercel.app)

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
