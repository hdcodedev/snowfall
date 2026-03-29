'use client';

import { useSnowfall } from '@hdcodedev/snowfall';

export default function ToggleButton() {
  const { isEnabled, toggleSnow } = useSnowfall();

  return (
    <div className="fixed top-6 right-6 md:top-8 md:right-8 z-50">
      <button
        onClick={toggleSnow}
        aria-label={isEnabled ? 'Pause snowfall' : 'Resume snowfall'}
        className={`
          group relative w-10 h-10 flex items-center justify-center
          border rounded-sm backdrop-blur-sm
          transition-all duration-300
          ${isEnabled
            ? 'border-champagne/40 bg-champagne/5 hover:bg-champagne/10'
            : 'border-pearl-dim bg-surface/50 hover:bg-surface'
          }
        `}
      >
        <svg
          className={`w-4 h-4 transition-all duration-300 ${
            isEnabled
              ? 'text-champagne'
              : 'text-frost-dim group-hover:text-frost-muted'
          }`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" />
          <circle cx="12" cy="12" r="3" />
          <path d="M12 3l1.5 2.5M12 3l-1.5 2.5M12 21l1.5-2.5M12 21l-1.5-2.5M3 12l2.5 1.5M3 12l2.5-1.5M21 12l-2.5 1.5M21 12l-2.5-1.5" />
        </svg>

        {/* Subtle glow when active */}
        {isEnabled && (
          <div className="absolute inset-0 rounded-sm bg-champagne/5 animate-pulse" />
        )}
      </button>
    </div>
  );
}
