# Snowfall demo

The demo site for [`@hdcodedev/snowfall`](../README.md): a cozy night scene with preset buttons and generated wind sound.

```bash
npm install && npm run build   # in the repository root: builds the library the demo links to
cd demo && npm install && npm run dev
```

The scene artwork is a static file, `public/night-scene.svg`. Snow settles on the invisible ledges listed in `components/NightScene.tsx`; update their coordinates if you move things in the artwork.
