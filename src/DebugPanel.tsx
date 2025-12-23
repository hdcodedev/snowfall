'use client';

import { useSnowfall } from './SnowfallProvider';
import { useEffect, useState } from 'react';

export default function DebugPanel() {
    const { debugMode, toggleDebug, metrics } = useSnowfall();
    const [isMinimized, setIsMinimized] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.shiftKey && e.key === 'D') {
                toggleDebug();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [toggleDebug]);

    const copyToClipboard = () => {
        if (metrics) {
            const data = {
                ...metrics,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                canvasSize: {
                    width: window.innerWidth,
                    height: window.innerHeight,
                },
            };
            navigator.clipboard.writeText(JSON.stringify(data, null, 2));
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (!debugMode) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            left: '20px',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            color: '#0f0',
            fontFamily: 'monospace',
            fontSize: '12px',
            padding: isMinimized ? '10px' : '15px',
            borderRadius: '8px',
            zIndex: 10000,
            minWidth: isMinimized ? 'auto' : '320px',
            maxWidth: '400px',
            border: '1px solid #0f0',
            boxShadow: '0 4px 20px rgba(0, 255, 0, 0.3)',
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: isMinimized ? 0 : '10px'
            }}>
                <div style={{ fontWeight: 'bold', color: '#0ff' }}>
                    ❄️ SNOWFALL DEBUG
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={() => setIsMinimized(!isMinimized)}
                        style={{
                            background: 'none',
                            border: '1px solid #0f0',
                            color: '#0f0',
                            cursor: 'pointer',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '10px',
                        }}
                    >
                        {isMinimized ? '▲' : '▼'}
                    </button>
                    <button
                        onClick={toggleDebug}
                        style={{
                            background: 'none',
                            border: '1px solid #f00',
                            color: '#f00',
                            cursor: 'pointer',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '10px',
                        }}
                    >
                        ✕
                    </button>
                </div>
            </div>

            {!isMinimized && metrics && (
                <>
                    <div style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #333' }}>
                        <div style={{ color: '#ff0', marginBottom: '5px', fontWeight: 'bold' }}>
                            ⚡ PERFORMANCE
                        </div>
                        <div>FPS: <span style={{ color: metrics.fps < 30 ? '#f00' : metrics.fps < 50 ? '#ff0' : '#0f0' }}>{metrics.fps.toFixed(1)}</span></div>
                        <div>Frame Time: {metrics.frameTime.toFixed(2)}ms</div>
                        <div style={{ color: '#f80' }}>rAF Gap: {metrics.rafGap?.toFixed(1) || 0}ms {metrics.rafGap && metrics.rafGap > 20 ? '⚠️ THROTTLED!' : ''}</div>
                    </div>

                    <div style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #333' }}>
                        <div style={{ color: '#ff0', marginBottom: '5px', fontWeight: 'bold' }}>
                            🔬 DETAILED TIMINGS
                        </div>
                        <div>Clear: {metrics.clearTime?.toFixed(2) || 0}ms</div>
                        <div>Physics: {metrics.physicsTime?.toFixed(2) || 0}ms</div>
                        <div>Draw: {metrics.drawTime?.toFixed(2) || 0}ms</div>
                        <div>Scan: {metrics.scanTime.toFixed(2)}ms</div>
                        <div>Rect Update: {metrics.rectUpdateTime.toFixed(2)}ms</div>
                    </div>

                    <div style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #333' }}>
                        <div style={{ color: '#ff0', marginBottom: '5px', fontWeight: 'bold' }}>
                            📊 COUNTS
                        </div>
                        <div>Snowflakes: {metrics.flakeCount} / {metrics.maxFlakes}</div>
                        <div>Surfaces: {metrics.surfaceCount}</div>
                    </div>

                    <div style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #333' }}>
                        <div style={{ color: '#ff0', marginBottom: '5px', fontWeight: 'bold' }}>
                            🔧 BROWSER
                        </div>
                        <div>Safari: {metrics.isSafari ? '✓' : '✗'}</div>
                        <div>Retina: {metrics.isRetina ? '✓' : '✗'} ({window.devicePixelRatio}x)</div>
                        <div>Glow: {metrics.glowEnabled ? 'ON' : 'OFF'}</div>
                    </div>

                    <button
                        onClick={copyToClipboard}
                        style={{
                            width: '100%',
                            padding: '8px',
                            background: copied ? '#0a0' : '#000',
                            border: copied ? '1px solid #0f0' : '1px solid #555',
                            color: '#0f0',
                            cursor: 'pointer',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontFamily: 'monospace',
                        }}
                    >
                        {copied ? '✓ COPIED!' : '📋 COPY METRICS'}
                    </button>

                    <div style={{ marginTop: '8px', fontSize: '10px', color: '#666', textAlign: 'center' }}>
                        Shift+D to toggle
                    </div>
                </>
            )}
        </div>
    );
}
