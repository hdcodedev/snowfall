'use client';

import React, { useState, useEffect } from 'react';

interface ResponsiveSnowCardProps {
    children: React.ReactNode;
    className?: string;
}

export default function ResponsiveSnowCard({ children, className }: ResponsiveSnowCardProps) {
    // Default to 'top' so it works immediately on desktop (typical SSR assumption)
    // or use 'top' as initial. 'top' is safe.
    const [snowfallType, setSnowfallType] = useState('top');

    useEffect(() => {
        const mediaQuery = window.matchMedia('(max-width: 768px)');

        const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
            // If screen is small (matches max-width: 768px), ignore snow accumulation.
            // Otherwise, accumulate on top.
            setSnowfallType(e.matches ? 'ignore' : 'top');
        };

        // Initialize
        handleChange(mediaQuery);

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    return (
        <div data-snowfall={snowfallType} className={className}>
            {children}
        </div>
    );
}
