import React from 'react';
import { Wrench } from 'lucide-react';

interface LogoProps {
    className?: string;
    showTagline?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
    sm: { icon: 'h-7 w-7', text: 'text-lg', tagline: 'text-[10px]' },
    md: { icon: 'h-8 w-8', text: 'text-xl', tagline: 'text-xs' },
    lg: { icon: 'h-10 w-10', text: 'text-2xl', tagline: 'text-sm' },
};

export function Logo({ className = '', showTagline = false, size = 'md' }: LogoProps) {
    const s = sizeMap[size];
    return (
        <span className={`inline-flex items-center gap-2 ${className}`}>
            <span className={`relative flex items-center justify-center rounded-full bg-brand-500 ${s.icon}`}>
                <Wrench className="h-4 w-4 text-white" aria-hidden="true" />
            </span>
            <span className="flex flex-col leading-tight">
                <span className={`font-extrabold tracking-tight text-navy-700 ${s.text}`}>
                    Trade<span className="text-brand-500">Finder</span>
                </span>
                {showTagline && (
                    <span className={`text-gray-400 ${s.tagline}`}>Find trusted local fundis near you</span>
                )}
            </span>
        </span>
    );
}
