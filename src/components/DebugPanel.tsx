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

    const panelStyle: React.CSSProperties = {
        position: 'fixed',
        bottom: '80px',
        left: '24px',
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        color: '#cbd5e1',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        fontSize: '12px',
        lineHeight: '1.5',
        padding: isMinimized ? '12px' : '20px',
        borderRadius: '12px',
        zIndex: 10000,
        minWidth: isMinimized ? 'auto' : '300px',
        maxWidth: '100%',
        border: '1px solid rgba(148, 163, 184, 0.12)',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2)',
        transition: 'padding 0.2s ease',
    };

    const sectionLabelStyle: React.CSSProperties = {
        color: '#94a3b8',
        marginBottom: '8px',
        fontSize: '10px',
        fontWeight: '600',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
    };

    const rowStyle: React.CSSProperties = {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '4px',
    };

    const valueStyle: React.CSSProperties = {
        fontFamily: 'monospace',
        fontVariantNumeric: 'tabular-nums',
    };

    const buttonBaseStyle: React.CSSProperties = {
        cursor: 'pointer',
        width: '24px',
        height: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '6px',
        fontSize: '10px',
        transition: 'background 0.15s ease, color 0.15s ease',
    };

    return (
        <div data-snowfall="top" style={panelStyle}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: isMinimized ? 0 : '16px',
                gap: '16px',
            }}>
                <span style={{ fontWeight: '600', color: '#e2e8f0', fontSize: '11px', letterSpacing: '0.05em' }}>
                    DEBUG
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                        onClick={() => setIsMinimized(!isMinimized)}
                        aria-label={isMinimized ? 'Expand debug panel' : 'Minimize debug panel'}
                        style={{
                            ...buttonBaseStyle,
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            color: '#94a3b8',
                        }}
                    >
                        {isMinimized ? '+' : '−'}
                    </button>
                    <button
                        onClick={toggleDebug}
                        aria-label="Close debug panel"
                        style={{
                            ...buttonBaseStyle,
                            background: 'rgba(239, 68, 68, 0.12)',
                            border: '1px solid rgba(239, 68, 68, 0.15)',
                            color: '#f87171',
                        }}
                    >
                        ×
                    </button>
                </div>
            </div>

            {!isMinimized && metrics && (
                <>
                    <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid rgba(148, 163, 184, 0.08)' }}>
                        <div style={sectionLabelStyle}>Performance</div>
                        <div style={rowStyle}>
                            <span>FPS</span>
                            <span style={{
                                ...valueStyle,
                                fontWeight: '600',
                                color: metrics.fps < 30 ? '#f87171' : metrics.fps < 50 ? '#facc15' : '#4ade80',
                            }}>
                                {metrics.fps.toFixed(1)}
                            </span>
                        </div>
                        <div style={rowStyle}>
                            <span>Frame Time</span>
                            <span style={valueStyle}>{metrics.frameTime.toFixed(2)}ms</span>
                        </div>
                        <div style={rowStyle}>
                            <span style={{ color: metrics.rafGap > 20 ? '#fbbf24' : 'inherit' }}>Frame Gap</span>
                            <span style={valueStyle}>{metrics.rafGap.toFixed(1)}ms</span>
                        </div>
                    </div>

                    <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid rgba(148, 163, 184, 0.08)' }}>
                        <div style={sectionLabelStyle}>Detailed Timings</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px' }}>
                            <div style={rowStyle}><span>Canvas Clear</span> <span style={valueStyle}>{metrics.clearTime.toFixed(2)}ms</span></div>
                            <div style={rowStyle}><span>Physics Step</span> <span style={valueStyle}>{metrics.physicsTime.toFixed(2)}ms</span></div>
                            <div style={rowStyle}><span>Rendering</span> <span style={valueStyle}>{metrics.drawTime.toFixed(2)}ms</span></div>
                            <div style={rowStyle}><span>DOM Scan</span> <span style={valueStyle}>{metrics.scanTime.toFixed(2)}ms</span></div>
                            <div style={{ ...rowStyle, gridColumn: 'span 2' }}><span>Element Tracking</span> <span style={valueStyle}>{metrics.rectUpdateTime.toFixed(2)}ms</span></div>
                        </div>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <div style={sectionLabelStyle}>Counts</div>
                        <div style={rowStyle}>
                            <span>Snowflakes</span>
                            <span style={valueStyle}>{metrics.flakeCount} / {metrics.maxFlakes}</span>
                        </div>
                        <div style={{ ...rowStyle, marginBottom: 0 }}>
                            <span>Surfaces</span>
                            <span style={valueStyle}>{metrics.surfaceCount}</span>
                        </div>
                    </div>

                    <button
                        onClick={copyToClipboard}
                        aria-label="Copy metrics to clipboard"
                        style={{
                            width: '100%',
                            padding: '8px',
                            background: copied ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                            border: copied ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(148, 163, 184, 0.1)',
                            color: copied ? '#4ade80' : '#94a3b8',
                            cursor: 'pointer',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '500',
                            transition: 'all 0.15s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                        }}
                    >
                        {copied ? 'Copied' : 'Copy Metrics'}
                    </button>

                    <div style={{ marginTop: '12px', fontSize: '10px', color: '#64748b', textAlign: 'center' }}>
                        Shift+D to toggle
                    </div>
                </>
            )}
        </div>
    );
}
