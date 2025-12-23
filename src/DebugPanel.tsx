'use client';

import { useSnowfall } from './SnowfallProvider';
import { useEffect, useState } from 'react';

export default function DebugPanel({ defaultOpen = true }: { defaultOpen?: boolean }) {
    const { debugMode, toggleDebug, metrics } = useSnowfall();
    const [isMinimized, setIsMinimized] = useState(!defaultOpen);
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
        <div
            data-snowfall="top"
            style={{
                position: 'fixed',
                bottom: '80px',
                left: '24px',
                backgroundColor: 'rgba(15, 23, 42, 0.75)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                color: '#e2e8f0',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                fontSize: '12px',
                padding: isMinimized ? '12px' : '20px',
                borderRadius: '16px',
                zIndex: 10000,
                minWidth: isMinimized ? 'auto' : '300px',
                maxWidth: '100%',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.2s ease',
            }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: isMinimized ? 0 : '16px',
                gap: '16px'
            }}>
                <div style={{ fontWeight: '600', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px' }}>❄️</span>
                    <span style={{
                        background: 'linear-gradient(to right, #60a5fa, #22d3ee)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        fontWeight: '700'
                    }}>DEBUG</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={() => setIsMinimized(!isMinimized)}
                        style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: '#fff',
                            cursor: 'pointer',
                            width: '24px',
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '6px',
                            fontSize: '10px',
                        }}
                    >
                        {isMinimized ? '▲' : '▼'}
                    </button>
                    <button
                        onClick={toggleDebug}
                        style={{
                            background: 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            color: '#f87171',
                            cursor: 'pointer',
                            width: '24px',
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '6px',
                            fontSize: '12px',
                        }}
                    >
                        ✕
                    </button>
                </div>
            </div>

            {!isMinimized && metrics && (
                <>
                    <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                        <div style={{ color: '#94a3b8', marginBottom: '8px', fontSize: '11px', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                            Performance
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span>FPS</span>
                            <span style={{ fontWeight: 'bold', color: metrics.fps < 30 ? '#f87171' : metrics.fps < 50 ? '#facc15' : '#4ade80' }}>
                                {metrics.fps.toFixed(1)}
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span>Frame Time</span>
                            <span style={{ fontFamily: 'monospace' }}>{metrics.frameTime.toFixed(2)}ms</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: metrics.rafGap && metrics.rafGap > 20 ? '#fbbf24' : 'inherit' }}>rAF Gap</span>
                            <span style={{ fontFamily: 'monospace' }}>{metrics.rafGap?.toFixed(1) || 0}ms</span>
                        </div>
                    </div>

                    <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                        <div style={{ color: '#94a3b8', marginBottom: '8px', fontSize: '11px', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                            Detailed Timings
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Clear</span> <span style={{ fontFamily: 'monospace' }}>{metrics.clearTime?.toFixed(2) || 0}ms</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Physics</span> <span style={{ fontFamily: 'monospace' }}>{metrics.physicsTime?.toFixed(2) || 0}ms</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Draw</span> <span style={{ fontFamily: 'monospace' }}>{metrics.drawTime?.toFixed(2) || 0}ms</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Scan</span> <span style={{ fontFamily: 'monospace' }}>{metrics.scanTime.toFixed(2)}ms</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gridColumn: 'span 2' }}><span>Rect Update</span> <span style={{ fontFamily: 'monospace' }}>{metrics.rectUpdateTime.toFixed(2)}ms</span></div>
                        </div>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <div style={{ color: '#94a3b8', marginBottom: '8px', fontSize: '11px', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                            Counts
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span>Snowflakes</span>
                            <span style={{ fontFamily: 'monospace' }}>{metrics.flakeCount} / {metrics.maxFlakes}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Surfaces</span>
                            <span style={{ fontFamily: 'monospace' }}>{metrics.surfaceCount}</span>
                        </div>
                    </div>

                    <button
                        onClick={copyToClipboard}
                        style={{
                            width: '100%',
                            padding: '10px',
                            background: copied ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                            border: copied ? '1px solid rgba(34, 197, 94, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
                            color: copied ? '#4ade80' : '#fff',
                            cursor: 'pointer',
                            borderRadius: '8px',
                            fontSize: '11px',
                            fontWeight: '600',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                        }}
                    >
                        {copied ? '✓ COPIED' : '📋 COPY METRICS'}
                    </button>

                    <div style={{ marginTop: '12px', fontSize: '10px', color: '#64748b', textAlign: 'center' }}>
                        Shift+D to toggle
                    </div>
                </>
            )}
        </div>
    );
}
