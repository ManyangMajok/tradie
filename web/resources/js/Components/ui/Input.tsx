import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: string;
}

export function Input({ error, className = '', ...props }: InputProps) {
    return (
        <input
            {...props}
            className={`block w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                error
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-brand-500'
            } disabled:bg-gray-50 disabled:text-gray-500 ${className}`}
        />
    );
}
