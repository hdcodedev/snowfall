'use client';

import { useSnowfall } from '@hdcodedev/snowfall';

export default function ControlsPanel() {
    const { physicsConfig, updatePhysicsConfig } = useSnowfall();

    return (
        <div className="fixed inset-y-0 right-4 z-[10] w-80 pointer-events-none flex flex-col justify-end pb-18 pt-32">
            <div className="pointer-events-auto w-full max-h-full overflow-y-auto no-scrollbar bg-white/5 dark:bg-black/5 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-lg shadow-xl p-4 space-y-4">
                <div className="flex items-center mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Physics Controls</h3>
                </div>

                {/* Snowflake Controls */}
                <div className="space-y-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                            Max Flakes: {physicsConfig.MAX_FLAKES}
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="1000"
                            step="50"
                            value={physicsConfig.MAX_FLAKES}
                            onChange={(e) => updatePhysicsConfig({ MAX_FLAKES: parseInt(e.target.value) })}
                            className="w-full"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                            Melt Speed: {(physicsConfig.MELT_SPEED * 10000).toFixed(1)}
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="10"
                            step="0.1"
                            value={physicsConfig.MELT_SPEED * 10000}
                            onChange={(e) => updatePhysicsConfig({ MELT_SPEED: parseFloat(e.target.value) / 10000 })}
                            className="w-full"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                            Wind Strength: {physicsConfig.WIND_STRENGTH.toFixed(1)}
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="3"
                            step="0.1"
                            value={physicsConfig.WIND_STRENGTH}
                            onChange={(e) => updatePhysicsConfig({ WIND_STRENGTH: parseFloat(e.target.value) })}
                            className="w-full"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                            Flake Size Min: {physicsConfig.FLAKE_SIZE?.MIN?.toFixed(1) || 0.5}
                        </label>
                        <input
                            type="range"
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
                            className="w-full"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                            Flake Size Max: {physicsConfig.FLAKE_SIZE?.MAX?.toFixed(1) || 2.5}
                        </label>
                        <input
                            type="range"
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
                            className="w-full"
                        />
                    </div>
                </div>

                {/* Accumulation Rates */}
                <div className="pt-3 border-t border-white/30 dark:border-gray-700/30">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Accumulation Rates</h4>

                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">
                                Side Rate: {physicsConfig.ACCUMULATION.SIDE_RATE.toFixed(1)}
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="5"
                                step="0.1"
                                value={physicsConfig.ACCUMULATION.SIDE_RATE}
                                onChange={(e) => updatePhysicsConfig({
                                    ACCUMULATION: { ...physicsConfig.ACCUMULATION, SIDE_RATE: parseFloat(e.target.value) }
                                })}
                                className="w-full"
                            />
                        </div>

                        <div>
                            <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">
                                Card Top Rate: {physicsConfig.ACCUMULATION.TOP_CARD_RATE.toFixed(1)}
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="5"
                                step="0.1"
                                value={physicsConfig.ACCUMULATION.TOP_CARD_RATE}
                                onChange={(e) => updatePhysicsConfig({
                                    ACCUMULATION: { ...physicsConfig.ACCUMULATION, TOP_CARD_RATE: parseFloat(e.target.value) }
                                })}
                                className="w-full"
                            />
                        </div>

                        <div>
                            <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">
                                Header Top Rate: {physicsConfig.ACCUMULATION.TOP_HEADER_RATE.toFixed(1)}
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="5"
                                step="0.1"
                                value={physicsConfig.ACCUMULATION.TOP_HEADER_RATE}
                                onChange={(e) => updatePhysicsConfig({
                                    ACCUMULATION: { ...physicsConfig.ACCUMULATION, TOP_HEADER_RATE: parseFloat(e.target.value) }
                                })}
                                className="w-full"
                            />
                        </div>
                    </div>
                </div>

                {/* Max Depths */}
                <div className="pt-3 border-t border-white/30 dark:border-gray-700/30">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Max Depths (px)</h4>

                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">
                                Card Top: {physicsConfig.MAX_DEPTH.CARD_TOP}
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                step="5"
                                value={physicsConfig.MAX_DEPTH.CARD_TOP}
                                onChange={(e) => updatePhysicsConfig({
                                    MAX_DEPTH: { ...physicsConfig.MAX_DEPTH, CARD_TOP: parseInt(e.target.value) }
                                })}
                                className="w-full"
                            />
                        </div>

                        <div>
                            <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">
                                Header Top: {physicsConfig.MAX_DEPTH.HEADER_TOP}
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="50"
                                step="5"
                                value={physicsConfig.MAX_DEPTH.HEADER_TOP}
                                onChange={(e) => updatePhysicsConfig({
                                    MAX_DEPTH: { ...physicsConfig.MAX_DEPTH, HEADER_TOP: parseInt(e.target.value) }
                                })}
                                className="w-full"
                            />
                        </div>

                        <div>
                            <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">
                                Card Side: {physicsConfig.MAX_DEPTH.CARD_SIDE}
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="20"
                                step="1"
                                value={physicsConfig.MAX_DEPTH.CARD_SIDE}
                                onChange={(e) => updatePhysicsConfig({
                                    MAX_DEPTH: { ...physicsConfig.MAX_DEPTH, CARD_SIDE: parseInt(e.target.value) }
                                })}
                                className="w-full"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
