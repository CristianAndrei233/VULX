import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    className,
    disabled,
    ...props
}, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed';

    // Industrial Look: Reduced radius, hard shadows for primary
    const variants = {
        primary: 'bg-clay hover:bg-clay-hover text-white shadow-hard border border-transparent active:translate-y-0.5 active:shadow-none',
        secondary: 'bg-white hover:bg-gray-50 text-slate-700 border border-gray-300 shadow-sm active:bg-gray-100',
        ghost: 'text-slate-600 hover:bg-black/5 hover:text-slate-900',
        danger: 'bg-critical hover:bg-red-700 text-white shadow-hard border border-transparent',
        success: 'bg-success hover:bg-emerald-700 text-white shadow-hard border border-transparent',
    };

    const sizes = {
        sm: 'h-8 px-3 text-xs rounded-sm',
        md: 'h-10 px-4 text-sm rounded-sm',
        lg: 'h-12 px-6 text-base rounded-md',
    };

    return (
        <button
            ref={ref}
            className={twMerge(
                clsx(
                    baseStyles,
                    variants[variant],
                    sizes[size],
                    fullWidth && 'w-full',
                    className
                )
            )}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {!isLoading && leftIcon && <div className="mr-2">{leftIcon}</div>}
            {children}
            {!isLoading && rightIcon && <div className="ml-2">{rightIcon}</div>}
        </button>
    );
});
