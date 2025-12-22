'use client';

import { useSnowfall } from '@hdcodedev/snowfall';

export default function ToggleButton() {
    const { isEnabled, toggleSnow } = useSnowfall();

    return (
        <button
            onClick={toggleSnow}
            className="fixed top-12 right-4 z-[10000] p-2 bg-white/10 hover:bg-white/20 dark:bg-black/10 dark:hover:bg-black/20 border border-white/30 dark:border-gray-700/30 rounded-lg backdrop-blur-md shadow-lg transition-all hover:shadow-xl"
            title={isEnabled ? "Disable Snow" : "Enable Snow"}
        >
            <span className={`text-2xl block transition-all ${isEnabled ? 'opacity-100' : 'opacity-40 grayscale'}`}>
                ❄️
            </span>
        </button>
    );
}
