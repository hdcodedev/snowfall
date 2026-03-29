'use client';

import CodeBlock from '@/components/CodeBlock';
import ControlsPanel from '@/components/ControlsPanel';
import ToggleButton from '@/components/ToggleButton';
import { useSnowfall } from '@hdcodedev/snowfall';
import { version as pkgVersion } from '../../package.json';

function FeatureRow({
  index,
  title,
  description,
  align = 'left',
}: {
  index: number;
  title: string;
  description: string;
  align?: 'left' | 'right';
}) {
  const isRight = align === 'right';
  const paddedIndex = String(index).padStart(2, '0');

  return (
    <div
      data-snowfall="top"
      className={`
        ${isRight ? 'md:ml-auto md:text-right' : ''}
        max-w-2xl
      `}
    >
      <div className={`
        flex items-baseline gap-4 mb-3
        ${isRight ? 'md:flex-row-reverse md:justify-end' : ''}
      `}>
        <span className="font-display text-4xl md:text-5xl font-light text-glacier-ghost tabular-nums leading-none">
          {paddedIndex}
        </span>
        <h3 className="font-display text-2xl md:text-3xl font-light text-frost tracking-tight">
          {title}
        </h3>
      </div>
      <p className={`
        font-body text-sm md:text-base font-light text-frost-muted leading-relaxed
        ${isRight ? 'md:ml-auto' : ''} max-w-md
      `}>
        {description}
      </p>
    </div>
  );
}

function SnowDepthMeter({ label, depth }: { label: string; depth: number }) {
  const clampedDepth = Math.min(Math.max(depth, 0), 100);
  return (
    <div className="flex items-center gap-3">
      <span className="font-body text-[10px] text-frost-dim uppercase tracking-[0.2em] w-14 shrink-0">
        {label}
      </span>
      <div className="flex-1 h-px bg-thin-ice relative overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-glacier to-glacier-dim transition-all duration-700 ease-out"
          style={{ width: `${clampedDepth}%` }}
        />
      </div>
      <span className="font-body text-[10px] text-glacier tabular-nums w-8 text-right">
        {depth}px
      </span>
    </div>
  );
}

function StatBlock({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="font-display text-3xl md:text-4xl font-light text-frost tabular-nums">
        {value}
      </div>
      <div className="font-body text-[10px] uppercase tracking-[0.2em] text-frost-dim mt-1">
        {label}
      </div>
    </div>
  );
}

export default function Home() {
  const { isEnabled, physicsConfig, metrics } = useSnowfall();

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <ToggleButton />
      <ControlsPanel />

      {/* Main content — offset by sidebar width on desktop */}
      <div className="md:ml-64">

      {/* ═══════════════════════════════════════════════════════════════
          AMBIENT AURORA GLOW
          ═══════════════════════════════════════════════════════════════ */}
      <div
        className="aurora-glow animate-aurora"
        style={{ top: '-200px', right: '-100px' }}
      />
      <div
        className="aurora-glow animate-aurora"
        style={{ bottom: '20%', left: '-200px', animationDelay: '4s', width: '500px', height: '500px' }}
      />

      {/* ═══════════════════════════════════════════════════════════════
          HERO
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col justify-center px-8 md:px-16 lg:px-24">
        <div className="max-w-3xl">
          <p className="animate-frost-rise font-body text-[10px] md:text-xs uppercase tracking-[0.35em] text-glacier-dim mb-8 md:mb-10">
            Physics-Based Snow for React
          </p>

          <h1 className="animate-frost-rise delay-150 font-display text-6xl md:text-8xl lg:text-[10rem] font-light text-frost leading-[0.85] tracking-tight mb-8">
            Snowfall
          </h1>

          <div className="animate-crystal-line delay-400 crystal-divider max-w-[240px] mb-8" />

          <p className="animate-frost-rise delay-500 font-body text-base md:text-lg font-light text-frost-muted max-w-md leading-relaxed mb-4">
            Realistic accumulation on surfaces.
            Wind, melting, and border-radius awareness.
          </p>

          <div className="animate-frost-rise delay-700 flex items-center gap-3 text-frost-dim">
            <span className="w-8 h-px bg-glacier-ghost" />
            <span className="font-body text-[10px] uppercase tracking-[0.25em]">
              v{pkgVersion}
            </span>
          </div>

          <div className="animate-frost-rise delay-700 mt-10 flex items-center gap-5">
            <a
              href="#installation"
              data-snowfall="top"
              className="group relative font-body text-sm font-medium text-twilight bg-glacier hover:bg-glacier-bright px-7 py-3 transition-all duration-300 overflow-hidden"
            >
              <span className="relative z-10">Install</span>
              <div className="absolute inset-0 bg-gradient-to-r from-glacier-bright to-glacier opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </a>
            <a
              href="#features"
              data-snowfall="top"
              className="font-body text-sm font-medium text-frost-muted hover:text-frost border border-thin-ice hover:border-crack px-7 py-3 transition-all duration-300"
            >
              Explore
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="animate-frost-fade delay-1600 absolute bottom-10 left-8 md:left-16 lg:left-24 flex items-center gap-3">
          <span className="font-body text-[10px] uppercase tracking-[0.25em] text-frost-dim">
            Scroll
          </span>
          <div className="w-12 h-px bg-gradient-to-r from-glacier-ghost to-transparent" />
        </div>

        {/* Decorative vertical line — right side */}
        <div className="animate-frost-fade delay-1200 absolute top-1/3 right-12 md:right-20 hidden lg:block">
          <div className="w-px h-32 bg-gradient-to-b from-transparent via-glacier-ghost to-transparent" />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          STATS STRIP — minimal, horizontal
          ═══════════════════════════════════════════════════════════════ */}
      <section className="border-y border-thin-ice py-10 md:py-14 px-8 md:px-16 lg:px-24">
        <div className="max-w-4xl mx-auto flex items-center justify-between md:justify-around">
          <StatBlock
            value={metrics ? metrics.fps.toFixed(0) : '--'}
            label="FPS"
          />
          <div className="w-px h-10 bg-thin-ice" />
          <StatBlock value="0" label="Dependencies" />
          <div className="w-px h-10 bg-thin-ice hidden md:block" />
          <div className="hidden md:block">
            <StatBlock value="2" label="Lines to Add" />
          </div>
          <div className="w-px h-10 bg-thin-ice" />
          <StatBlock
            value={metrics ? `${metrics.flakeCount}` : '--'}
            label="Flakes"
          />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          FEATURES — Editorial, asymmetric, numbered
          ═══════════════════════════════════════════════════════════════ */}
      <section id="features" className="py-24 md:py-40 px-8 md:px-16 lg:px-24">
        <div className="max-w-5xl">
          <div className="animate-frost-rise mb-20 md:mb-32 flex items-end gap-6">
            <div>
              <p className="font-body text-[10px] uppercase tracking-[0.35em] text-glacier-dim mb-4">
                Capabilities
              </p>
              <h2 className="font-display text-4xl md:text-6xl font-light text-frost leading-[0.95]">
                Every detail,
                <br />
                <span className="text-glacier-dim">considered.</span>
              </h2>
            </div>
            <div className="hidden md:block flex-1 h-px bg-gradient-to-r from-thin-ice to-transparent mb-4" />
          </div>

          <div className="space-y-20 md:space-y-28">
            <div className="animate-frost-rise delay-200">
              <FeatureRow
                index={1}
                title="Surface Accumulation"
                description="Snow naturally piles up on headers, footers, and custom elements. It respects border-radius and accumulates with realistic density curves."
                align="left"
              />
            </div>

            <div className="animate-frost-rise delay-300">
              <FeatureRow
                index={2}
                title="Wind & Wobble"
                description="Each flake drifts with individual wind response and organic wobble. No two flakes follow the same path."
                align="right"
              />
            </div>

            <div className="animate-frost-rise delay-400">
              <FeatureRow
                index={3}
                title="Melting"
                description="Accumulated snow gradually melts over time. Control the speed to create anything from a brief flurry to a lasting blanket."
                align="left"
              />
            </div>

            <div className="animate-frost-rise delay-500">
              <FeatureRow
                index={4}
                title="60 FPS Performance"
                description="Probabilistic collision detection, adaptive spawn rates, and viewport culling keep the experience smooth on any device."
                align="right"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          LIVE DEMO — Frosted surface cards
          ═══════════════════════════════════════════════════════════════ */}
      <section className="py-24 md:py-40 px-8 md:px-16 lg:px-24">
        <div className="max-w-5xl mx-auto">
          <div className="animate-frost-rise mb-16 md:mb-24">
            <p className="font-body text-[10px] uppercase tracking-[0.35em] text-glacier-dim mb-4">
              Live Demo
            </p>
            <h2 className="font-display text-4xl md:text-6xl font-light text-frost leading-[0.95] mb-6">
              Watch it
              <br />
              <span className="text-copper-dim">accumulate.</span>
            </h2>
            <p className="font-body text-sm font-light text-frost-muted max-w-lg leading-relaxed">
              Snow detects surface edges and piles up naturally. Toggle it off and on to reset the accumulation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
            {/* Header surface — snow on bottom */}
            <header
              data-snowfall="bottom"
              className="animate-frost-scale delay-200 frost-surface p-8 md:p-10 transition-all duration-300"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-2 h-2 rounded-full bg-glacier animate-shimmer" />
                <p className="font-body text-[10px] uppercase tracking-[0.25em] text-glacier-dim">
                  Header Surface
                </p>
              </div>
              <h3 className="font-display text-2xl md:text-3xl font-light text-frost mb-3">
                Bottom of Header
              </h3>
              <p className="font-body text-sm font-light text-frost-muted leading-relaxed">
                Snow clings to the underside — as if drifting beneath an overhang.
              </p>
            </header>

            {/* Footer surface — snow on top */}
            <footer
              data-snowfall="top"
              className="animate-frost-scale delay-300 frost-surface p-8 md:p-10 transition-all duration-300"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-2 h-2 rounded-full bg-copper animate-shimmer" style={{ animationDelay: '2s' }} />
                <p className="font-body text-[10px] uppercase tracking-[0.25em] text-copper-dim">
                  Footer Surface
                </p>
              </div>
              <h3 className="font-display text-2xl md:text-3xl font-light text-frost mb-3">
                Top of Footer
              </h3>
              <p className="font-body text-sm font-light text-frost-muted leading-relaxed">
                Snow settles on horizontal surfaces and stacks upward naturally.
              </p>
            </footer>

            {/* Custom surface — full width */}
            <div
              data-snowfall="top"
              className="animate-frost-scale delay-400 frost-surface p-8 md:p-10 md:col-span-2 transition-all duration-300"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-2 h-2 rounded-full bg-lavender animate-shimmer" style={{ animationDelay: '4s' }} />
                    <p className="font-body text-[10px] uppercase tracking-[0.25em] text-lavender-dim">
                      Custom Surface
                    </p>
                  </div>
                  <h3 className="font-display text-2xl md:text-3xl font-light text-frost mb-3">
                    Any Element
                  </h3>
                  <p className="font-body text-sm font-light text-frost-muted leading-relaxed max-w-md">
                    Add <code className="text-glacier text-xs">data-snowfall=&quot;top&quot;</code> or <code className="text-glacier text-xs">&quot;bottom&quot;</code> to any element. Snow accumulates automatically.
                  </p>
                </div>

                <div className="shrink-0 space-y-3 min-w-[220px] pt-2">
                  <SnowDepthMeter
                    label="Top"
                    depth={physicsConfig.MAX_DEPTH.TOP}
                  />
                  <SnowDepthMeter
                    label="Bottom"
                    depth={physicsConfig.MAX_DEPTH.BOTTOM}
                  />
                  <SnowDepthMeter
                    label="Side"
                    depth={physicsConfig.MAX_DEPTH.SIDE}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          INSTALLATION — Minimal, precise
          ═══════════════════════════════════════════════════════════════ */}
      <section id="installation" className="py-24 md:py-40 px-8 md:px-16 lg:px-24">
        <div className="max-w-2xl">
          <div className="animate-frost-rise mb-14">
            <p className="font-body text-[10px] uppercase tracking-[0.35em] text-glacier-dim mb-4">
              Get Started
            </p>
            <h2 className="font-display text-5xl md:text-7xl font-light text-frost leading-[0.9]">
              Three lines to start.
            </h2>
          </div>

          <div className="animate-frost-scale delay-200 space-y-4">
            <div data-snowfall="top">
              <CodeBlock
                code="npm install @hdcodedev/snowfall"
                className="frost-surface"
                language="bash"
              />
            </div>

            <div>
              <CodeBlock
                code={`import { Snowfall, SnowfallProvider } from '@hdcodedev/snowfall';

function App() {
  return (
    <SnowfallProvider>
      <Snowfall />
      <header>My Site</header>
    </SnowfallProvider>
  );
}`}
                className="frost-surface"
                language="tsx"
              />
            </div>
          </div>

          <div className="animate-frost-rise delay-500 mt-10">
            <a
              href="https://github.com/hdcodedev/snowfall"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-3 font-body text-sm text-frost-muted hover:text-glacier transition-colors duration-300"
            >
              <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span>View on GitHub</span>
              <span className="w-6 h-px bg-frost-dim group-hover:bg-glacier transition-colors duration-300" />
            </a>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          FOOTER — Minimal, architectural
          ═══════════════════════════════════════════════════════════════ */}
      <footer
        data-snowfall="top"
        className="border-t border-thin-ice py-14 md:py-20 px-8 md:px-16 lg:px-24"
      >
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <span className="font-display text-lg font-light text-frost-dim">Snowfall</span>
            <span className="w-8 h-px bg-thin-ice" />
            <span className="font-body text-[10px] uppercase tracking-[0.2em] text-frost-dim">
              MIT
            </span>
          </div>

          <div className="flex items-center gap-6">
            <a
              href="https://github.com/hdcodedev/snowfall"
              target="_blank"
              rel="noopener noreferrer"
              className="font-body text-[10px] uppercase tracking-[0.2em] text-frost-dim hover:text-glacier transition-colors duration-300"
            >
              GitHub
            </a>
            <a
              href="https://www.npmjs.com/package/@hdcodedev/snowfall"
              target="_blank"
              rel="noopener noreferrer"
              className="font-body text-[10px] uppercase tracking-[0.2em] text-frost-dim hover:text-glacier transition-colors duration-300"
            >
              npm
            </a>
            <span className="font-body text-[10px] text-frost-dim">
              by{' '}
              <a
                href="https://github.com/hdcodedev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-copper-dim hover:text-copper transition-colors duration-300"
              >
                hdcodedev
              </a>
            </span>
          </div>
        </div>
      </footer>

      </div>
      {/* End main content wrapper */}

      {/* Snow state indicator — bottom-left, architectural */}
      <div className="fixed bottom-5 left-8 md:left-16 lg:left-24 z-50 flex items-center gap-3 pointer-events-none">
        <div
          className={`w-1.5 h-1.5 transition-all duration-500 ${
            isEnabled
              ? 'bg-glacier shadow-[0_0_6px_oklch(0.72_0.12_240)]'
              : 'bg-frost-dim'
          }`}
          style={{ borderRadius: 0 }}
        />
        <span className="font-body text-[10px] uppercase tracking-[0.2em] text-frost-dim">
          {isEnabled ? 'Snowing' : 'Paused'}
        </span>
      </div>
    </div>
  );
}
