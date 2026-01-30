import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
    hint?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    variant?: 'default' | 'filled' | 'glass';
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
    label,
    error,
    helperText,
    hint,
    leftIcon,
    rightIcon,
    variant = 'default',
    className,
    id,
    ...props
}, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    const variants = {
        default: clsx(
            'bg-white border border-stone-200',
            'focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10',
            error && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/10'
        ),
        filled: clsx(
            'bg-stone-50 border border-transparent',
            'focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10',
            error && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/10'
        ),
        glass: clsx(
            'bg-white/50 backdrop-blur-sm border border-white/30',
            'focus:bg-white/70 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10'
        ),
    };

    const displayHint = error || helperText || hint;

    return (
        <div className="w-full">
            {label && (
                <label
                    htmlFor={inputId}
                    className="block text-sm font-medium text-stone-700 mb-1.5"
                >
                    {label}
                </label>
            )}
            <div className="relative">
                {leftIcon && (
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none">
                        {leftIcon}
                    </div>
                )}
                <input
                    ref={ref}
                    id={inputId}
                    className={twMerge(
                        clsx(
                            'w-full rounded-lg px-4 py-2.5 text-sm text-stone-900',
                            'placeholder:text-stone-400',
                            'transition-all duration-200',
                            'outline-none',
                            variants[variant],
                            leftIcon && 'pl-11',
                            rightIcon && 'pr-11',
                            className
                        )
                    )}
                    {...props}
                />
                {rightIcon && (
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400">
                        {rightIcon}
                    </div>
                )}
            </div>
            {displayHint && (
                <p className={clsx(
                    'mt-1.5 text-xs',
                    error ? 'text-rose-600' : 'text-stone-500'
                )}>
                    {error || helperText || hint}
                </p>
            )}
        </div>
    );
});

Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    helperText?: string;
    hint?: string;
    variant?: 'default' | 'filled' | 'glass';
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({
    label,
    error,
    helperText,
    hint,
    variant = 'default',
    className,
    id,
    ...props
}, ref) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;

    const variants = {
        default: clsx(
            'bg-white border border-stone-200',
            'focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10',
            error && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/10'
        ),
        filled: clsx(
            'bg-stone-50 border border-transparent',
            'focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10',
            error && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/10'
        ),
        glass: clsx(
            'bg-white/50 backdrop-blur-sm border border-white/30',
            'focus:bg-white/70 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10'
        ),
    };

    return (
        <div className="w-full">
            {label && (
                <label
                    htmlFor={textareaId}
                    className="block text-sm font-medium text-stone-700 mb-1.5"
                >
                    {label}
                </label>
            )}
            <textarea
                ref={ref}
                id={textareaId}
                className={twMerge(
                    clsx(
                        'w-full rounded-lg px-4 py-3 text-sm text-stone-900',
                        'placeholder:text-stone-400',
                        'transition-all duration-200',
                        'outline-none resize-y min-h-[100px]',
                        variants[variant],
                        className
                    )
                )}
                {...props}
            />
            {(error || helperText || hint) && (
                <p className={clsx(
                    'mt-1.5 text-xs',
                    error ? 'text-rose-600' : 'text-stone-500'
                )}>
                    {error || helperText || hint}
                </p>
            )}
        </div>
    );
});

Textarea.displayName = 'Textarea';
