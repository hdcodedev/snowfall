'use client';

import React, { useState, useEffect } from 'react';

interface ResponsiveSnowCardProps {
    children: React.ReactNode;
    className?: string;
}

export default function ResponsiveSnowCard({ children, className }: ResponsiveSnowCardProps) {
    const [snowfallType, setSnowfallType] = useState('top');

    useEffect(() => {
        const mediaQuery = window.matchMedia('(max-width: 768px)');

        const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
            setSnowfallType(e.matches ? 'ignore' : 'top');
        };

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
