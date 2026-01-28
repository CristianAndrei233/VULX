import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AlertCircle, CheckCircle } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    success?: string;
    hint?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    (
        {
            label,
            error,
            success,
            hint,
            leftIcon,
            rightIcon,
            className,
            id,
            ...props
        },
        ref
    ) => {
        const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

        const inputStyles = `
      w-full px-4 py-2.5 rounded-lg
      bg-white border text-slate-900
      placeholder:text-slate-400
      transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-offset-0
    `;

        const stateStyles = error
            ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
            : success
                ? 'border-emerald-300 focus:border-emerald-500 focus:ring-emerald-100'
                : 'border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-indigo-100';

        const iconPadding = leftIcon ? 'pl-11' : '';
        const rightIconPadding = rightIcon || error || success ? 'pr-11' : '';

        return (
            <div className="w-full">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="block text-sm font-medium text-slate-700 mb-1.5"
                    >
                        {label}
                    </label>
                )}
                <div className="relative">
                    {leftIcon && (
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                            {leftIcon}
                        </div>
                    )}
                    <input
                        ref={ref}
                        id={inputId}
                        className={twMerge(
                            clsx(inputStyles, stateStyles, iconPadding, rightIconPadding, className)
                        )}
                        {...props}
                    />
                    {(rightIcon || error || success) && (
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                            {error ? (
                                <AlertCircle className="w-5 h-5 text-red-500" />
                            ) : success ? (
                                <CheckCircle className="w-5 h-5 text-emerald-500" />
                            ) : (
                                <span className="text-slate-400">{rightIcon}</span>
                            )}
                        </div>
                    )}
                </div>
                {(error || success || hint) && (
                    <p
                        className={clsx('mt-1.5 text-sm', {
                            'text-red-600': error,
                            'text-emerald-600': success,
                            'text-slate-500': hint && !error && !success,
                        })}
                    >
                        {error || success || hint}
                    </p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';

// Textarea Component
export interface TextareaProps
    extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ label, error, hint, className, id, ...props }, ref) => {
        const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;

        const textareaStyles = `
      w-full px-4 py-3 rounded-lg
      bg-white border text-slate-900
      placeholder:text-slate-400
      transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-offset-0
      resize-none
    `;

        const stateStyles = error
            ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
            : 'border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-indigo-100';

        return (
            <div className="w-full">
                {label && (
                    <label
                        htmlFor={textareaId}
                        className="block text-sm font-medium text-slate-700 mb-1.5"
                    >
                        {label}
                    </label>
                )}
                <textarea
                    ref={ref}
                    id={textareaId}
                    className={twMerge(clsx(textareaStyles, stateStyles, className))}
                    {...props}
                />
                {(error || hint) && (
                    <p
                        className={clsx('mt-1.5 text-sm', {
                            'text-red-600': error,
                            'text-slate-500': hint && !error,
                        })}
                    >
                        {error || hint}
                    </p>
                )}
            </div>
        );
    }
);

Textarea.displayName = 'Textarea';
