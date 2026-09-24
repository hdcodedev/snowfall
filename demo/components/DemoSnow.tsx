'use client';

import { Snowfall, type SnowfallPreset } from '@hdcodedev/snowfall';
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

interface DemoSnowContext {
  preset: SnowfallPreset;
  setPreset: (preset: SnowfallPreset) => void;
}

const Context = createContext<DemoSnowContext | null>(null);

/** Demo-only state: the library itself just takes `<Snowfall preset="..." />`. */
export function DemoSnow({ children }: { children: ReactNode }) {
  const [preset, setPreset] = useState<SnowfallPreset>('gentle');
  const value = useMemo(() => ({ preset, setPreset }), [preset]);

  return (
    <Context.Provider value={value}>
      <Snowfall preset={preset} />
      {children}
    </Context.Provider>
  );
}

export function useDemoSnow() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error('useDemoSnow must be used inside <DemoSnow>');
  return ctx;
}
