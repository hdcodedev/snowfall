'use client';

import { useSnowfall } from '@hdcodedev/snowfall';

export default function ToggleButton() {
  const { isEnabled, toggleSnow } = useSnowfall();

  return (
    <div className="fixed top-8 right-8 md:top-10 md:right-10 z-50">
      <button
        onClick={toggleSnow}
        aria-label={isEnabled ? 'Pause snowfall' : 'Resume snowfall'}
        className={`
          group relative w-10 h-10 flex items-center justify-center
          border transition-all duration-300
          active:scale-95
          focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-glacier
          ${isEnabled
            ? 'border-glacier/30 bg-glacier/5 hover:bg-glacier/10'
            : 'border-thin-ice bg-twilight/50 hover:bg-surface'
          }
        `}
        style={{ borderRadius: 0 }}
      >
        {/* Snowflake / Pause icon */}
        <svg
          className={`w-[14px] h-[14px] transition-all duration-300 ${
            isEnabled
              ? 'text-glacier'
              : 'text-frost-dim group-hover:text-frost-muted'
          }`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="square"
          strokeLinejoin="miter"
        >
          {isEnabled ? (
            <>
              {/* Snowflake icon */}
              <path d="M12 2v20" />
              <path d="M2 12h20" />
              <path d="M4.93 4.93l14.14 14.14" />
              <path d="M19.07 4.93L4.93 19.07" />
              <circle cx="12" cy="12" r="2.5" />
              <path d="M12 3l1 2M12 3l-1 2" />
              <path d="M12 21l1-2M12 21l-1-2" />
              <path d="M3 12l2 1M3 12l2-1" />
              <path d="M21 12l-2 1M21 12l-2-1" />
            </>
          ) : (
            <>
              {/* Play icon */}
              <polygon points="6,4 20,12 6,20" fill="currentColor" stroke="none" />
            </>
          )}
        </svg>

        {/* Active glow */}
        {isEnabled && (
          <div
            className="absolute inset-0 bg-glacier/5 animate-shimmer"
            style={{ borderRadius: 0 }}
          />
        )}
      </button>
    </div>
  );
}
