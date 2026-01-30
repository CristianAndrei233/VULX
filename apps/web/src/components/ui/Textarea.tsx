import React from 'react';
import { clsx } from 'clsx';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    hint?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
    label,
    error,
    hint,
    className,
    disabled,
    ...props
}) => {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-[11px] font-black text-text-muted uppercase tracking-widest mb-2 ml-1">
                    {label}
                </label>
            )}
            <textarea
                className={clsx(
                    'w-full px-4 py-3 bg-bg-base border rounded-xl text-text-primary text-sm font-medium transition-all duration-200 outline-none resize-y min-h-[100px]',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    error
                        ? 'border-severity-critical focus:ring-1 focus:ring-severity-critical'
                        : 'border-border-primary hover:border-text-muted focus:border-accent-primary focus:ring-1 focus:ring-accent-primary',
                    className
                )}
                disabled={disabled}
                {...props}
            />
            {hint && !error && (
                <p className="mt-1.5 ml-1 text-xs text-text-muted">
                    {hint}
                </p>
            )}
            {error && (
                <p className="mt-1.5 ml-1 text-xs text-severity-critical font-medium animate-shake">
                    {error}
                </p>
            )}
        </div>
    );
};
