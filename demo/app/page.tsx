'use client';

import CodeBlock from '@/components/CodeBlock';
import ControlsPanel from '@/components/ControlsPanel';
import ToggleButton from '@/components/ToggleButton';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <ToggleButton />
      <ControlsPanel />

      {/* Main content — offset by sidebar width on desktop */}
      <div className="md:ml-64">

      {/* Hero */}
      <section className="relative min-h-screen flex flex-col justify-center px-8 md:px-16 lg:px-24">
        <div className="max-w-3xl">
          <h1 className="animate-frost-rise font-display text-6xl md:text-8xl lg:text-[10rem] font-light text-frost leading-[0.85] tracking-tight mb-8">
            Snowfall
          </h1>

          <p className="animate-frost-rise delay-300 font-body text-base md:text-lg font-light text-frost-muted max-w-md leading-relaxed mb-10">
            Realistic accumulation on surfaces.
            Wind, melting, and border-radius awareness.
          </p>

          <div className="animate-frost-rise delay-500 flex items-center gap-5">
            <a
              href="#installation"
              data-snowfall="top"
              className="font-body text-sm font-medium text-twilight bg-glacier hover:bg-glacier-bright px-7 py-3 transition-colors duration-300"
            >
              Install
            </a>
          </div>
        </div>
      </section>

      {/* Live demo — snow accumulates on these surfaces */}
      <section className="py-24 md:py-40 px-8 md:px-16 lg:px-24">
        <div className="max-w-3xl">
          <h2 className="animate-frost-rise font-display text-4xl md:text-6xl font-light text-frost leading-[0.95] mb-6">
            Watch it
            <br />
            <span className="text-glacier-dim">accumulate.</span>
          </h2>
          <p className="animate-frost-rise delay-200 font-body text-sm font-light text-frost-muted leading-relaxed mb-16">
            Snow detects surface edges and piles up naturally. Toggle it off and on to reset.
          </p>

          <div className="space-y-6">
            <header
              data-snowfall="bottom"
              className="animate-frost-scale delay-300 frost-surface p-8 md:p-10"
            >
              <h3 className="font-display text-2xl md:text-3xl font-light text-frost mb-3">
                Header
              </h3>
              <p className="font-body text-sm font-light text-frost-muted leading-relaxed">
                Snow clings to the underside — as if drifting beneath an overhang.
              </p>
            </header>

            <footer
              data-snowfall="top"
              className="animate-frost-scale delay-400 frost-surface p-8 md:p-10"
            >
              <h3 className="font-display text-2xl md:text-3xl font-light text-frost mb-3">
                Footer
              </h3>
              <p className="font-body text-sm font-light text-frost-muted leading-relaxed">
                Snow settles on horizontal surfaces and stacks upward naturally.
              </p>
            </footer>

            <div
              data-snowfall="top"
              className="animate-frost-scale delay-500 frost-surface p-8 md:p-10"
            >
              <h3 className="font-display text-2xl md:text-3xl font-light text-frost mb-3">
                Any Element
              </h3>
              <p className="font-body text-sm font-light text-frost-muted leading-relaxed">
                Add <code className="text-glacier text-xs">data-snowfall=&quot;top&quot;</code> to any element. Snow accumulates automatically.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Installation */}
      <section id="installation" className="py-24 md:py-40 px-8 md:px-16 lg:px-24">
        <div className="max-w-2xl">
          <h2 className="animate-frost-rise font-display text-5xl md:text-7xl font-light text-frost leading-[0.9] mb-14">
            Three lines to start.
          </h2>

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
        </div>
      </section>

      {/* Footer */}
      <footer
        data-snowfall="top"
        className="border-t border-thin-ice py-14 md:py-20 px-8 md:px-16 lg:px-24"
      >
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <span className="font-display text-lg font-light text-frost-dim">Snowfall</span>
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
          </div>
        </div>
      </footer>

      </div>
      {/* End main content wrapper */}
    </div>
  );
}
