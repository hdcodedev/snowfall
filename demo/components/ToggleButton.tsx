'use client';

import { useSnowfall } from '@hdcodedev/snowfall';

export default function ToggleButton() {
    const { isEnabled, toggleSnow } = useSnowfall();

    return (
        <div className="fixed top-4 right-4 md:top-10 md:w-80 w-auto flex justify-end md:justify-center pointer-events-none z-50">
            <button
                onClick={toggleSnow}
                className="pointer-events-auto w-14 h-14 md:w-28 md:h-14 flex items-center justify-center bg-white/10 hover:bg-white/20 dark:bg-black/10 dark:hover:bg-black/20 border border-white/30 dark:border-gray-700/30 rounded-lg backdrop-blur-md shadow-lg transition-all hover:shadow-xl"
            >
                <span className={`text-2xl md:text-3xl block transition-all ${isEnabled ? 'opacity-100' : 'opacity-40 grayscale'}`}>
                    ❄️
                </span>
            </button>
        </div>
    );
}
