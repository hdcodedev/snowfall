'use client';

import { useSnowfall } from '@hdcodedev/snowfall';
import React, { useId, useState } from 'react';

function Slider({
  label,
  value,
  min,
  max,
  step,
  unit = '',
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (value: number) => void;
}) {
  const reactId = useId();
  const id = `slider-${label.toLowerCase().replace(/\s+/g, '-')}-${reactId}`;
  return (
    <div className="group">
      <div className="flex items-baseline justify-between mb-2">
        <label htmlFor={id} className="font-body text-[10px] text-frost-muted tracking-[0.15em] uppercase">
          {label}
        </label>
        <span className="font-body text-[10px] text-glacier tabular-nums" aria-hidden="true">
          {step < 1 ? value.toFixed(1) : Math.round(value)}
          {unit}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full"
      />
    </div>
  );
}

function Section({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-thin-ice/50 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between py-3 group focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-glacier"
      >
        <span className="font-body text-[10px] uppercase tracking-[0.2em] text-frost-muted group-hover:text-frost transition-colors duration-200">
          {title}
        </span>
        <svg
          className={`w-3 h-3 text-frost-dim transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
        >
          <path strokeLinecap="square" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div className="pb-4 space-y-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default function ControlsPanel() {
  const { physicsConfig, updatePhysicsConfig, resetPhysics } = useSnowfall();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Toggle — visible on mobile, hidden on desktop */}
      <div className="fixed top-8 left-8 md:top-10 md:left-10 z-50 md:hidden">
          <button
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle physics controls"
            className={`
              w-10 h-10 flex items-center justify-center
              border transition-all duration-300
              focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-glacier
              ${isOpen
                ? 'border-glacier/30 bg-glacier/5'
                : 'border-thin-ice bg-twilight/50 hover:bg-surface'
              }
            `}
            style={{ borderRadius: 0 }}
          >
          <svg
            className={`w-[14px] h-[14px] transition-all duration-200 ${
              isOpen ? 'text-glacier' : 'text-frost-dim'
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={1.2}
          >
            <path strokeLinecap="square" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
        </button>
      </div>

      {/* Panel — sidebar on desktop, bottom sheet on mobile */}
      <div
        className={`
          fixed z-40 transition-transform duration-300 ease-out
          ${isOpen ? 'translate-y-0' : 'translate-y-full md:translate-y-0'}
          bottom-0 left-0 right-0 md:top-0 md:left-0 md:bottom-0 md:w-64 md:right-auto
        `}
      >
        <div className="
          bg-abyss/95 md:bg-abyss/80 backdrop-blur-xl
          border-t md:border-r border-thin-ice/30
          h-[60vh] md:h-full
          overflow-y-auto no-scrollbar
        "
        style={{ borderRadius: 0 }}
        >
          {/* Header */}
          <div className="sticky top-0 bg-abyss/95 md:bg-abyss/80 backdrop-blur-xl border-b border-thin-ice/30 px-6 py-4 flex items-center justify-between">
            <h3 className="font-body text-[10px] uppercase tracking-[0.25em] text-frost-muted">
              Snow Settings
            </h3>
            <button
              onClick={resetPhysics}
              className="font-body text-[10px] uppercase tracking-[0.15em] text-frost-dim hover:text-glacier transition-colors duration-200 focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-glacier"
            >
              Restore Defaults
            </button>
          </div>

          <div className="px-6 py-2">
            {/* Flakes */}
            <Section title="Snowflakes" defaultOpen>
              <Slider
                label="Max Count"
                value={physicsConfig.MAX_FLAKES}
                min={0}
                max={1500}
                step={50}
                onChange={(v) => updatePhysicsConfig({ MAX_FLAKES: v })}
              />
              <Slider
                label="Smallest Flake"
                value={physicsConfig.FLAKE_SIZE.MIN}
                min={0.1}
                max={3}
                step={0.1}
                onChange={(v) =>
                  updatePhysicsConfig({
                    FLAKE_SIZE: { MIN: v, MAX: physicsConfig.FLAKE_SIZE.MAX },
                  })
                }
              />
              <Slider
                label="Largest Flake"
                value={physicsConfig.FLAKE_SIZE.MAX}
                min={0.1}
                max={5}
                step={0.1}
                onChange={(v) =>
                  updatePhysicsConfig({
                    FLAKE_SIZE: { MIN: physicsConfig.FLAKE_SIZE.MIN, MAX: v },
                  })
                }
              />
            </Section>

            {/* Environment */}
            <Section title="Environment" defaultOpen>
              <Slider
                label="Wind Strength"
                value={physicsConfig.WIND_STRENGTH}
                min={0}
                max={3}
                step={0.1}
                onChange={(v) => updatePhysicsConfig({ WIND_STRENGTH: v })}
              />
              <Slider
                label="Melting Speed"
                value={physicsConfig.MELT_SPEED * 10000}
                min={0}
                max={10}
                step={0.1}
                unit="x"
                onChange={(v) => updatePhysicsConfig({ MELT_SPEED: v / 10000 })}
              />
              <Slider
                label="Max Surfaces"
                value={physicsConfig.MAX_SURFACES}
                min={0}
                max={50}
                step={1}
                onChange={(v) => updatePhysicsConfig({ MAX_SURFACES: v })}
              />
            </Section>

            {/* Accumulation */}
            <Section title="Accumulation">
              <Slider
                label="Top Surfaces"
                value={physicsConfig.ACCUMULATION.TOP_RATE}
                min={0}
                max={10}
                step={0.5}
                onChange={(v) =>
                  updatePhysicsConfig({
                    ACCUMULATION: { ...physicsConfig.ACCUMULATION, TOP_RATE: v },
                  })
                }
              />
              <Slider
                label="Bottom Surfaces"
                value={physicsConfig.ACCUMULATION.BOTTOM_RATE}
                min={0}
                max={10}
                step={0.5}
                onChange={(v) =>
                  updatePhysicsConfig({
                    ACCUMULATION: { ...physicsConfig.ACCUMULATION, BOTTOM_RATE: v },
                  })
                }
              />
              <Slider
                label="Side Surfaces"
                value={physicsConfig.ACCUMULATION.SIDE_RATE}
                min={0}
                max={5}
                step={0.1}
                onChange={(v) =>
                  updatePhysicsConfig({
                    ACCUMULATION: { ...physicsConfig.ACCUMULATION, SIDE_RATE: v },
                  })
                }
              />
            </Section>

            {/* Depth */}
            <Section title="Snow Depth">
              <Slider
                label="Top Surfaces"
                value={physicsConfig.MAX_DEPTH.TOP}
                min={0}
                max={150}
                step={5}
                unit="px"
                onChange={(v) =>
                  updatePhysicsConfig({
                    MAX_DEPTH: { ...physicsConfig.MAX_DEPTH, TOP: v },
                  })
                }
              />
              <Slider
                label="Bottom Surfaces"
                value={physicsConfig.MAX_DEPTH.BOTTOM}
                min={0}
                max={100}
                step={5}
                unit="px"
                onChange={(v) =>
                  updatePhysicsConfig({
                    MAX_DEPTH: { ...physicsConfig.MAX_DEPTH, BOTTOM: v },
                  })
                }
              />
              <Slider
                label="Side Surfaces"
                value={physicsConfig.MAX_DEPTH.SIDE}
                min={0}
                max={40}
                step={1}
                unit="px"
                onChange={(v) =>
                  updatePhysicsConfig({
                    MAX_DEPTH: { ...physicsConfig.MAX_DEPTH, SIDE: v },
                  })
                }
              />
            </Section>
          </div>
        </div>
      </div>
    </>
  );
}
