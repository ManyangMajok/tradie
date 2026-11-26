import React from 'react';
import { Loader2 } from 'lucide-react';
import { ActionIcon, type ActionIconName } from './ActionIcon';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant;
    size?: Size;
    loading?: boolean;
    icon?: ActionIconName;
    children: React.ReactNode;
}

const variantClasses: Record<Variant, string> = {
    primary: 'bg-gray-900 text-white hover:bg-gray-700 disabled:bg-gray-400',
    secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:bg-gray-50',
    ghost: 'text-gray-700 hover:bg-gray-100 disabled:text-gray-400',
    destructive: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300',
};

const sizeClasses: Record<Size, string> = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
};

export function Button({
    variant = 'primary',
    size = 'md',
    loading = false,
    icon,
    disabled,
    children,
    className = '',
    ...props
}: ButtonProps) {
    return (
        <button
            {...props}
            disabled={disabled || loading}
            aria-busy={loading || undefined}
            className={`inline-flex items-center justify-center gap-2 rounded-full font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        >
            {loading ? <Loader2 aria-hidden="true" className="size-4 shrink-0 animate-spin motion-reduce:animate-none" /> : icon ? <ActionIcon name={icon} /> : null}
            {children}
        </button>
    );
}
