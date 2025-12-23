'use client';

import { useSnowfall } from '@hdcodedev/snowfall';
import React, { useState } from 'react';

function WinterSlider(props: React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            {...props}
            type="range"
            style={{ '--thumb-icon': `url('/snowflake.svg')` } as React.CSSProperties}
            className={`
                w-full h-1.5 rounded-lg appearance-none cursor-pointer
                bg-gradient-to-r from-blue-200/30 via-white/50 to-blue-200/30
                border border-white/20 backdrop-blur-sm shadow-[0_0_10px_rgba(186,230,253,0.2)]
                
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-6
                [&::-webkit-slider-thumb]:h-6
                [&::-webkit-slider-thumb]:bg-transparent
                [&::-webkit-slider-thumb]:[background-image:var(--thumb-icon)]
                [&::-webkit-slider-thumb]:bg-[length:100%_100%]
                [&::-webkit-slider-thumb]:bg-center
                [&::-webkit-slider-thumb]:bg-no-repeat
                [&::-webkit-slider-thumb]:transition-all
                [&::-webkit-slider-thumb]:hover:scale-125
                [&::-webkit-slider-thumb]:active:scale-95

                [&::-moz-range-thumb]:appearance-none
                [&::-moz-range-thumb]:w-6
                [&::-moz-range-thumb]:h-6
                [&::-moz-range-thumb]:border-none
                [&::-moz-range-thumb]:bg-transparent
                [&::-moz-range-thumb]:[background-image:var(--thumb-icon)]
                [&::-moz-range-thumb]:bg-[length:100%_100%]
                [&::-moz-range-thumb]:bg-center
                [&::-moz-range-thumb]:bg-no-repeat
                [&::-moz-range-thumb]:transition-all
                [&::-moz-range-thumb]:hover:scale-125
                [&::-moz-range-thumb]:active:scale-95
            `}
        />
    );
}

const ControlRow = ({ label, children }: { label: React.ReactNode, children: React.ReactNode }) => (
    <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
            {label}
        </label>
        {children}
    </div>
);

export default function ControlsPanel() {
    const { physicsConfig, updatePhysicsConfig, toggleDebug, debugMode } = useSnowfall();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Mobile Toggle Buttons */}

            {/* Debug Button - Lower Z-Index to stay behind panel */}
            <div className="fixed bottom-24 right-4 z-30 md:hidden">
                <button
                    onClick={toggleDebug}
                    className={`
                        p-4 rounded-full shadow-xl backdrop-blur-md border transition-all text-white
                        ${debugMode
                            ? 'bg-cyan-600 border-cyan-400'
                            : 'bg-white/10 border-white/20 hover:bg-white/20'
                        }
                    `}
                    aria-label="Toggle Debug"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <rect x="8" y="9" width="8" height="11" rx="4" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9V6m0 0V4m0 2h.01M5 15l2-2m-2 4l2 2m12-4l-2-2m2 4l-2 2" />
                    </svg>
                </button>
            </div>

            {/* Main Toggle Button - Higher Z-Index to stay on top of panel */}
            <div className="fixed bottom-4 right-4 z-50 md:hidden">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`
                        p-4 rounded-full shadow-xl backdrop-blur-md border transition-all text-white
                        ${isOpen
                            ? 'bg-blue-600 border-blue-400 rotate-180'
                            : 'bg-white/10 border-white/20 hover:bg-white/20'
                        }
                    `}
                    aria-label="Toggle Controls"
                >
                    {isOpen ? (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    ) : (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                    )}
                </button>
            </div>

            {/* Panel Container */}
            <div className={`
                fixed z-40 transition-transform duration-300 ease-in-out pointer-events-none flex flex-col
                
                /* Mobile Styles: Bottom Sheet */
                bottom-0 left-0 right-0 
                ${isOpen ? 'translate-y-0' : 'translate-y-full'}
                
                /* Desktop Styles: Sidebar */
                md:inset-y-0 md:right-4 md:left-auto md:w-80 md:translate-y-0 md:justify-end md:pb-20 md:pt-32
            `}>
                <div className="pointer-events-auto relative flex flex-col w-full md:w-full h-[70vh] md:h-full md:max-h-full bg-white/10 dark:bg-black/80 md:dark:bg-black/5 backdrop-blur-xl md:backdrop-blur-sm border-t md:border border-white/20 dark:border-gray-700/20 rounded-t-2xl md:rounded-lg shadow-2xl md:shadow-xl overflow-hidden">
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-400/50 rounded-full md:hidden" />

                    <div className="overflow-y-auto no-scrollbar p-6 pt-10 pb-24 md:p-4 md:pt-20 md:pb-20 space-y-4">
                        <div className="flex items-center mb-4">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg md:text-base">Physics Controls</h3>
                        </div>

                        {/* Snowflake Controls */}
                        <div className="space-y-4 md:space-y-3">
                            <ControlRow label={`Max Flakes: ${physicsConfig.MAX_FLAKES}`}>
                                <WinterSlider
                                    min="0"
                                    max="1000"
                                    step="50"
                                    value={physicsConfig.MAX_FLAKES}
                                    onChange={(e) => updatePhysicsConfig({ MAX_FLAKES: parseInt(e.target.value) })}
                                />
                            </ControlRow>

                            <ControlRow label={`Max Surfaces: ${physicsConfig.MAX_SURFACES ?? 5}`}>
                                <WinterSlider
                                    min="0"
                                    max="200"
                                    step="5"
                                    value={physicsConfig.MAX_SURFACES ?? 5}
                                    onChange={(e) => updatePhysicsConfig({ MAX_SURFACES: parseInt(e.target.value) })}
                                />
                            </ControlRow>

                            <ControlRow label={`Melt Speed: ${(physicsConfig.MELT_SPEED * 10000).toFixed(1)}`}>
                                <WinterSlider
                                    min="0"
                                    max="10"
                                    step="0.1"
                                    value={physicsConfig.MELT_SPEED * 10000}
                                    onChange={(e) => updatePhysicsConfig({ MELT_SPEED: parseFloat(e.target.value) / 10000 })}
                                />
                            </ControlRow>

                            <ControlRow label={`Wind Strength: ${physicsConfig.WIND_STRENGTH.toFixed(1)}`}>
                                <WinterSlider
                                    min="0"
                                    max="3"
                                    step="0.1"
                                    value={physicsConfig.WIND_STRENGTH}
                                    onChange={(e) => updatePhysicsConfig({ WIND_STRENGTH: parseFloat(e.target.value) })}
                                />
                            </ControlRow>

                            <ControlRow label={`Flake Size Min: ${physicsConfig.FLAKE_SIZE?.MIN?.toFixed(1) || 0.5}`}>
                                <WinterSlider
                                    min="0.1"
                                    max="3"
                                    step="0.1"
                                    value={physicsConfig.FLAKE_SIZE?.MIN || 0.5}
                                    onChange={(e) => updatePhysicsConfig({
                                        FLAKE_SIZE: {
                                            MIN: parseFloat(e.target.value),
                                            MAX: physicsConfig.FLAKE_SIZE?.MAX || 2.5
                                        }
                                    })}
                                />
                            </ControlRow>

                            <ControlRow label={`Flake Size Max: ${physicsConfig.FLAKE_SIZE?.MAX?.toFixed(1) || 2.5}`}>
                                <WinterSlider
                                    min="0.1"
                                    max="5"
                                    step="0.1"
                                    value={physicsConfig.FLAKE_SIZE?.MAX || 2.5}
                                    onChange={(e) => updatePhysicsConfig({
                                        FLAKE_SIZE: {
                                            MIN: physicsConfig.FLAKE_SIZE?.MIN || 0.5,
                                            MAX: parseFloat(e.target.value)
                                        }
                                    })}
                                />
                            </ControlRow>
                        </div>

                        {/* Accumulation Rates */}
                        <div className="pt-3 border-t border-white/30 dark:border-gray-700/30">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Accumulation Rates</h4>

                            <div className="space-y-3">
                                <ControlRow label={`Side Rate: ${physicsConfig.ACCUMULATION.SIDE_RATE.toFixed(1)}`}>
                                    <WinterSlider
                                        min="0"
                                        max="5"
                                        step="0.1"
                                        value={physicsConfig.ACCUMULATION.SIDE_RATE}
                                        onChange={(e) => updatePhysicsConfig({
                                            ACCUMULATION: { ...physicsConfig.ACCUMULATION, SIDE_RATE: parseFloat(e.target.value) }
                                        })}
                                    />
                                </ControlRow>

                                <ControlRow label={`Top Rate: ${physicsConfig.ACCUMULATION.TOP_RATE.toFixed(1)}`}>
                                    <WinterSlider
                                        min="0"
                                        max="5"
                                        step="0.1"
                                        value={physicsConfig.ACCUMULATION.TOP_RATE}
                                        onChange={(e) => updatePhysicsConfig({
                                            ACCUMULATION: { ...physicsConfig.ACCUMULATION, TOP_RATE: parseFloat(e.target.value) }
                                        })}
                                    />
                                </ControlRow>

                                <ControlRow label={`Bottom Rate: ${physicsConfig.ACCUMULATION.BOTTOM_RATE.toFixed(1)}`}>
                                    <WinterSlider
                                        min="0"
                                        max="5"
                                        step="0.1"
                                        value={physicsConfig.ACCUMULATION.BOTTOM_RATE}
                                        onChange={(e) => updatePhysicsConfig({
                                            ACCUMULATION: { ...physicsConfig.ACCUMULATION, BOTTOM_RATE: parseFloat(e.target.value) }
                                        })}
                                    />
                                </ControlRow>
                            </div>
                        </div>

                        {/* Max Depths */}
                        <div className="pt-3 border-t border-white/30 dark:border-gray-700/30">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Max Depths (px)</h4>

                            <div className="space-y-3">
                                <ControlRow label={`Top: ${physicsConfig.MAX_DEPTH.TOP}`}>
                                    <WinterSlider
                                        min="0"
                                        max="100"
                                        step="5"
                                        value={physicsConfig.MAX_DEPTH.TOP}
                                        onChange={(e) => updatePhysicsConfig({
                                            MAX_DEPTH: { ...physicsConfig.MAX_DEPTH, TOP: parseInt(e.target.value) }
                                        })}
                                    />
                                </ControlRow>

                                <ControlRow label={`Bottom: ${physicsConfig.MAX_DEPTH.BOTTOM}`}>
                                    <WinterSlider
                                        min="0"
                                        max="50"
                                        step="5"
                                        value={physicsConfig.MAX_DEPTH.BOTTOM}
                                        onChange={(e) => updatePhysicsConfig({
                                            MAX_DEPTH: { ...physicsConfig.MAX_DEPTH, BOTTOM: parseInt(e.target.value) }
                                        })}
                                    />
                                </ControlRow>

                                <ControlRow label={`Side: ${physicsConfig.MAX_DEPTH.SIDE}`}>
                                    <WinterSlider
                                        min="0"
                                        max="20"
                                        step="1"
                                        value={physicsConfig.MAX_DEPTH.SIDE}
                                        onChange={(e) => updatePhysicsConfig({
                                            MAX_DEPTH: { ...physicsConfig.MAX_DEPTH, SIDE: parseInt(e.target.value) }
                                        })}
                                    />
                                </ControlRow>
                            </div>
                        </div>
                    </div>
                    <div className="hidden md:block absolute top-0 left-0 right-0 h-20 backdrop-blur-lg bg-gradient-to-b from-white/95 via-white/60 to-transparent dark:from-black/95 dark:via-black/60 dark:to-transparent pointer-events-none rounded-t-lg" />
                    <div className="absolute bottom-0 left-0 right-0 h-20 backdrop-blur-lg bg-gradient-to-t from-white/95 via-white/60 to-transparent dark:from-black/95 dark:via-black/60 dark:to-transparent pointer-events-none rounded-b-lg" />
                </div>
            </div>
        </>
    );
}
