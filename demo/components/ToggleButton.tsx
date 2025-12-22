'use client';

import { useSnowfall } from '@hdcodedev/snowfall';

export default function ToggleButton() {
    const { isEnabled, toggleSnow } = useSnowfall();

    return (
        <div className="fixed top-10 right-4 w-80 flex justify-center pointer-events-none">
            <button
                onClick={toggleSnow}
                className="pointer-events-auto w-28 h-14 flex items-center justify-center bg-white/10 hover:bg-white/20 dark:bg-black/10 dark:hover:bg-black/20 border border-white/30 dark:border-gray-700/30 rounded-lg backdrop-blur-md shadow-lg transition-all hover:shadow-xl"
            >
                <span className={`text-3xl block transition-all ${isEnabled ? 'opacity-100' : 'opacity-40 grayscale'}`}>
                    ❄️
                </span>
            </button>
        </div>
    );
}
