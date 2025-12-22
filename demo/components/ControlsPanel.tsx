'use client';

import { useSnowfall } from '@hdcodedev/snowfall';
import React from 'react';

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
    const { physicsConfig, updatePhysicsConfig } = useSnowfall();

    return (
        <div className="fixed inset-y-0 right-4 z-[10] w-80 pointer-events-none flex flex-col justify-end pb-20 pt-32">
            <div className="pointer-events-auto relative flex flex-col w-full max-h-full bg-white/5 dark:bg-black/5 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-lg shadow-xl overflow-hidden">
                <div className="overflow-y-auto no-scrollbar p-4 pt-20 pb-20 space-y-4">
                    <div className="flex items-center mb-4">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Physics Controls</h3>
                    </div>

                    {/* Snowflake Controls */}
                    <div className="space-y-3">
                        <ControlRow label={`Max Flakes: ${physicsConfig.MAX_FLAKES}`}>
                            <WinterSlider
                                min="0"
                                max="1000"
                                step="50"
                                value={physicsConfig.MAX_FLAKES}
                                onChange={(e) => updatePhysicsConfig({ MAX_FLAKES: parseInt(e.target.value) })}
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

                            <ControlRow label={`Top Card Rate: ${physicsConfig.ACCUMULATION.TOP_CARD_RATE.toFixed(1)}`}>
                                <WinterSlider
                                    min="0"
                                    max="5"
                                    step="0.1"
                                    value={physicsConfig.ACCUMULATION.TOP_CARD_RATE}
                                    onChange={(e) => updatePhysicsConfig({
                                        ACCUMULATION: { ...physicsConfig.ACCUMULATION, TOP_CARD_RATE: parseFloat(e.target.value) }
                                    })}
                                />
                            </ControlRow>

                            <ControlRow label={`Top Header Rate: ${physicsConfig.ACCUMULATION.TOP_HEADER_RATE.toFixed(1)}`}>
                                <WinterSlider
                                    min="0"
                                    max="5"
                                    step="0.1"
                                    value={physicsConfig.ACCUMULATION.TOP_HEADER_RATE}
                                    onChange={(e) => updatePhysicsConfig({
                                        ACCUMULATION: { ...physicsConfig.ACCUMULATION, TOP_HEADER_RATE: parseFloat(e.target.value) }
                                    })}
                                />
                            </ControlRow>
                        </div>
                    </div>

                    {/* Max Depths */}
                    <div className="pt-3 border-t border-white/30 dark:border-gray-700/30">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Max Depths (px)</h4>

                        <div className="space-y-3">
                            <ControlRow label={`Card Top: ${physicsConfig.MAX_DEPTH.CARD_TOP}`}>
                                <WinterSlider
                                    min="0"
                                    max="100"
                                    step="5"
                                    value={physicsConfig.MAX_DEPTH.CARD_TOP}
                                    onChange={(e) => updatePhysicsConfig({
                                        MAX_DEPTH: { ...physicsConfig.MAX_DEPTH, CARD_TOP: parseInt(e.target.value) }
                                    })}
                                />
                            </ControlRow>

                            <ControlRow label={`Header Top: ${physicsConfig.MAX_DEPTH.HEADER_TOP}`}>
                                <WinterSlider
                                    min="0"
                                    max="50"
                                    step="5"
                                    value={physicsConfig.MAX_DEPTH.HEADER_TOP}
                                    onChange={(e) => updatePhysicsConfig({
                                        MAX_DEPTH: { ...physicsConfig.MAX_DEPTH, HEADER_TOP: parseInt(e.target.value) }
                                    })}
                                />
                            </ControlRow>

                            <ControlRow label={`Card Side: ${physicsConfig.MAX_DEPTH.CARD_SIDE}`}>
                                <WinterSlider
                                    min="0"
                                    max="20"
                                    step="1"
                                    value={physicsConfig.MAX_DEPTH.CARD_SIDE}
                                    onChange={(e) => updatePhysicsConfig({
                                        MAX_DEPTH: { ...physicsConfig.MAX_DEPTH, CARD_SIDE: parseInt(e.target.value) }
                                    })}
                                />
                            </ControlRow>
                        </div>
                    </div>
                </div>
                <div className="absolute top-0 left-0 right-0 h-20 backdrop-blur-lg bg-gradient-to-b from-white/95 via-white/60 to-transparent dark:from-black/95 dark:via-black/60 dark:to-transparent pointer-events-none rounded-t-lg" />
                <div className="absolute bottom-0 left-0 right-0 h-20 backdrop-blur-lg bg-gradient-to-t from-white/95 via-white/60 to-transparent dark:from-black/95 dark:via-black/60 dark:to-transparent pointer-events-none rounded-b-lg" />
            </div>
        </div>
    );
}
