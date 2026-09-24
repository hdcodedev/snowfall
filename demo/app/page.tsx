'use client';

import type { SnowfallPreset } from '@hdcodedev/snowfall';
import NightScene from '@/components/NightScene';
import { useDemoSnow } from '@/components/DemoSnow';
import { useWindSound } from '@/components/useWindSound';

const PRESETS: { value: SnowfallPreset; label: string }[] = [
  { value: 'gentle', label: 'Gentle' },
  { value: 'steady', label: 'Steady' },
  { value: 'blizzard', label: 'Blizzard' },
  { value: 'off', label: 'Off' },
];

export default function Home() {
  const { preset, setPreset } = useDemoSnow();
  const wind = useWindSound(preset);

  return (
    <main className="relative h-dvh w-full overflow-hidden">
      <NightScene preset={preset} />

      {/* The scene speaks for itself; the heading stays for screen readers and search. */}
      <h1 className="sr-only">Snowfall: cozy, cinematic snow for React</h1>

      {/* Links */}
      <nav className="absolute right-6 top-6 md:right-12 md:top-12 flex items-baseline gap-5 text-[11px] uppercase tracking-[0.2em] text-cream-muted">
        <span className="font-display text-lg normal-case italic tracking-normal text-moon">Snowfall</span>
        <a href="https://github.com/hdcodedev/snowfall" target="_blank" rel="noopener noreferrer" className="hover:text-ember transition-colors">GitHub</a>
        <a href="https://www.npmjs.com/package/@hdcodedev/snowfall" target="_blank" rel="noopener noreferrer" className="hover:text-ember transition-colors">npm</a>
      </nav>

      {/* Preset picker and wind sound */}
      <div className="absolute inset-x-0 bottom-6 md:bottom-10 flex flex-wrap items-center justify-center gap-2 px-4">
        <div
          role="radiogroup"
          aria-label="Snow preset"
          data-snowfall="top"
          className="animate-rise delay-400 flex gap-1 rounded-full border border-rim bg-night/80 p-1 shadow-2xl"
        >
          {PRESETS.map((p) => {
            const selected = p.value === preset;
            return (
              <button
                key={p.value}
                role="radio"
                aria-checked={selected}
                onClick={() => setPreset(p.value)}
                className={`rounded-full px-4 md:px-5 py-2 text-xs md:text-sm transition-colors focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-ember ${
                  selected ? 'bg-ember text-night font-medium' : 'text-cream hover:text-ember'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
        <button
          onClick={wind.toggle}
          aria-pressed={wind.enabled}
          aria-label={wind.enabled ? 'Turn wind sound off' : 'Turn wind sound on'}
          className={`animate-rise delay-400 rounded-full border border-rim bg-night/80 px-4 md:px-5 py-2 text-xs md:text-sm shadow-2xl transition-colors focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-ember ${
            wind.enabled ? 'text-ember' : 'text-cream hover:text-ember'
          }`}
        >
          {wind.enabled ? 'Sound on' : 'Sound off'}
        </button>
      </div>
    </main>
  );
}
