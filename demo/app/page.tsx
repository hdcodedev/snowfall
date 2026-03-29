'use client';

import CodeBlock from '@/components/CodeBlock';
import ControlsPanel from '@/components/ControlsPanel';
import ToggleButton from '@/components/ToggleButton';
import { useSnowfall } from '@hdcodedev/snowfall';

function FeatureItem({
  title,
  description,
  align = 'left',
  delay = '',
}: {
  title: string;
  description: string;
  align?: 'left' | 'right';
  delay?: string;
}) {
  return (
    <div
      data-snowfall="top"
      className={`animate-fade-up ${delay} ${align === 'right' ? 'md:ml-auto md:text-right' : ''} max-w-xl`}
    >
      <h3 className="font-display text-2xl md:text-3xl font-medium text-frost tracking-tight mb-3">
        {title}
      </h3>
      <p className="font-body text-sm md:text-base font-light text-frost-muted leading-relaxed">
        {description}
      </p>
    </div>
  );
}

function SnowDepthMeter({ label, depth }: { label: string; depth: number }) {
  const clampedDepth = Math.min(Math.max(depth, 0), 100);
  return (
    <div className="flex items-center gap-3">
      <span className="font-body text-xs text-frost-dim uppercase tracking-widest w-16 shrink-0">
        {label}
      </span>
      <div className="flex-1 h-px bg-pearl-dim relative">
        <div
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-champagne to-champagne-dim transition-all duration-500"
          style={{ width: `${clampedDepth}%` }}
        />
      </div>
      <span className="font-body text-xs text-champagne tabular-nums w-10 text-right">
        {depth}px
      </span>
    </div>
  );
}

export default function Home() {
  const { isEnabled, physicsConfig } = useSnowfall();

  return (
    <div className="min-h-screen flex flex-col relative">
      <ToggleButton />
      <ControlsPanel />

      {/* ═══════════════════════════════════════════════════════════════
          HERO
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 md:px-12">
        <div className="text-center max-w-3xl mx-auto">
          <p className="animate-fade-up font-body text-xs md:text-sm uppercase tracking-[0.3em] text-champagne-dim mb-6 md:mb-8">
            Physics-Based Snow for React
          </p>

          <h1 className="animate-fade-up delay-100 font-display text-5xl md:text-7xl lg:text-8xl font-medium text-frost leading-[0.95] mb-6 md:mb-8">
            Snowfall
          </h1>

          <div className="animate-line-extend delay-300 luxury-divider max-w-[200px] mx-auto mb-6 md:mb-8" />

          <p className="animate-fade-up delay-400 font-body text-base md:text-lg font-light text-frost-muted max-w-md mx-auto leading-relaxed">
            Realistic accumulation on surfaces.
            <br className="hidden md:block" />
            Wind, melting, and border-radius awareness.
          </p>

          <div className="animate-fade-up delay-600 mt-10 md:mt-12 flex items-center justify-center gap-4">
            <a
              href="#installation"
              data-snowfall="top"
              className="font-body text-sm font-medium text-midnight bg-champagne hover:bg-champagne-dim px-6 py-3 rounded-sm transition-colors duration-200"
            >
              Install
            </a>
            <a
              href="#features"
              data-snowfall="top"
              className="font-body text-sm font-medium text-frost-muted hover:text-frost border border-pearl-dim hover:border-frost-dim px-6 py-3 rounded-sm transition-all duration-200"
            >
              Explore
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="animate-fade-in delay-1400 absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <span className="font-body text-[10px] uppercase tracking-[0.25em] text-frost-dim">
            Scroll
          </span>
          <div className="w-px h-8 bg-gradient-to-b from-frost-dim to-transparent" />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          FEATURES — Editorial layout, snow accumulates on these
          ═══════════════════════════════════════════════════════════════ */}
      <section id="features" className="py-24 md:py-40 px-6 md:px-12">
        <div className="max-w-4xl mx-auto">
          <div className="animate-fade-up mb-16 md:mb-24">
            <p className="font-body text-xs uppercase tracking-[0.3em] text-champagne-dim mb-4">
              Capabilities
            </p>
            <h2 className="font-display text-3xl md:text-5xl font-medium text-frost">
              Every detail, considered.
            </h2>
          </div>

          <div className="space-y-16 md:space-y-24">
            <FeatureItem
              title="Surface Accumulation"
              description="Snow naturally piles up on headers, footers, and custom elements. It respects border-radius and accumulates with realistic density curves."
              align="left"
              delay="delay-200"
            />

            <FeatureItem
              title="Wind & Wobble"
              description="Each flake drifts with individual wind response and organic wobble. No two flakes follow the same path."
              align="right"
              delay="delay-300"
            />

            <FeatureItem
              title="Melting"
              description="Accumulated snow gradually melts over time. Control the speed to create anything from a brief flurry to a lasting blanket."
              align="left"
              delay="delay-400"
            />

            <FeatureItem
              title="60 FPS Performance"
              description="Probabilistic collision detection, adaptive spawn rates, and viewport culling keep the experience smooth on any device."
              align="right"
              delay="delay-500"
            />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          LIVE SURFACES — Snow accumulates visibly here
          ═══════════════════════════════════════════════════════════════ */}
      <section className="py-24 md:py-40 px-6 md:px-12">
        <div className="max-w-5xl mx-auto">
          <div className="animate-fade-up mb-16 md:mb-20">
            <p className="font-body text-xs uppercase tracking-[0.3em] text-champagne-dim mb-4">
              Live Demo
            </p>
            <h2 className="font-display text-3xl md:text-5xl font-medium text-frost mb-4">
              Watch it accumulate.
            </h2>
            <p className="font-body text-sm font-light text-frost-muted max-w-lg">
              Snow detects surface edges and piles up naturally. Toggle it off and on to reset.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {/* Header element — snow on bottom */}
            <header
              data-snowfall="bottom"
              className="animate-scale-in delay-200 bg-surface border border-pearl-dim p-8 md:p-10 rounded-sm"
            >
              <p className="font-body text-[10px] uppercase tracking-[0.25em] text-champagne mb-3">
                Header Surface
              </p>
              <h3 className="font-display text-xl md:text-2xl text-frost mb-2">
                Bottom Edge
              </h3>
              <p className="font-body text-sm font-light text-frost-muted leading-relaxed">
                Snow accumulates on the underside — as if drifting beneath an overhang.
              </p>
            </header>

            {/* Footer element — snow on top */}
            <footer
              data-snowfall="top"
              className="animate-scale-in delay-300 bg-surface border border-pearl-dim p-8 md:p-10 rounded-sm"
            >
              <p className="font-body text-[10px] uppercase tracking-[0.25em] text-champagne mb-3">
                Footer Surface
              </p>
              <h3 className="font-display text-xl md:text-2xl text-frost mb-2">
                Top Edge
              </h3>
              <p className="font-body text-sm font-light text-frost-muted leading-relaxed">
                Natural piling — snow settles on horizontal surfaces and stacks upward.
              </p>
            </footer>

            {/* Custom element — snow on top, wider */}
            <div
              data-snowfall="top"
              className="animate-scale-in delay-400 bg-surface border border-pearl-dim p-8 md:p-10 rounded-sm md:col-span-2"
            >
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                <div>
                  <p className="font-body text-[10px] uppercase tracking-[0.25em] text-champagne mb-3">
                    Custom Surface
                  </p>
                  <h3 className="font-display text-xl md:text-2xl text-frost mb-2">
                    Any Element
                  </h3>
                  <p className="font-body text-sm font-light text-frost-muted leading-relaxed max-w-md">
                    Add <code className="text-ice text-xs font-mono">data-snowfall=&quot;top&quot;</code> or <code className="text-ice text-xs font-mono">&quot;bottom&quot;</code> to any element. The library handles the rest.
                  </p>
                </div>

                <div className="shrink-0 space-y-2 min-w-[200px]">
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
          INSTALLATION
          ═══════════════════════════════════════════════════════════════ */}
      <section id="installation" className="py-24 md:py-40 px-6 md:px-12">
        <div className="max-w-2xl mx-auto">
          <div className="animate-fade-up mb-12">
            <p className="font-body text-xs uppercase tracking-[0.3em] text-champagne-dim mb-4">
              Get Started
            </p>
            <h2 className="font-display text-3xl md:text-5xl font-medium text-frost">
              Three lines.
            </h2>
          </div>

          <div className="animate-scale-in delay-200 space-y-4">
            <div data-snowfall="top">
              <CodeBlock
                code="npm install @hdcodedev/snowfall"
                className="bg-surface border border-pearl-dim"
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
                className="bg-surface border border-pearl-dim"
                language="tsx"
              />
            </div>
          </div>

          <div className="animate-fade-up delay-500 mt-8">
            <a
              href="https://github.com/hdcodedev/snowfall"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-body text-sm text-frost-muted hover:text-champagne transition-colors duration-200"
            >
              <svg className="w-4 h-4" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          FOOTER
          ═══════════════════════════════════════════════════════════════ */}
      <footer
        data-snowfall="top"
        className="py-16 md:py-24 px-6 md:px-12 border-t border-pearl-dim"
      >
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-body text-xs text-frost-dim">
            Built by{' '}
            <a
              href="https://github.com/hdcodedev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-champagne-dim hover:text-champagne transition-colors"
            >
              hdcodedev
            </a>
          </p>
          <p className="font-body text-xs text-frost-dim">
            Apache-2.0 License
          </p>
        </div>
      </footer>

      {/* Snow state indicator — subtle, bottom-left */}
      <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 pointer-events-none">
        <div
          className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
            isEnabled ? 'bg-champagne' : 'bg-frost-dim'
          }`}
        />
        <span className="font-body text-[10px] uppercase tracking-[0.2em] text-frost-dim">
          {isEnabled ? 'Snowing' : 'Paused'}
        </span>
      </div>
    </div>
  );
}
