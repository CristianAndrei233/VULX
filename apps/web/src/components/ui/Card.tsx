import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'elevated' | 'glass' | 'bordered';
    padding?: 'none' | 'sm' | 'md' | 'lg';
    hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
    children,
    variant = 'default',
    padding = 'md',
    hoverable = false,
    className,
    ...props
}) => {
    // Industrial Card Style: White bg, industrial border, rounded-industrial
    const baseStyles = 'rounded-industrial transition-all duration-200 bg-white';

    const variants = {
        default: 'border border-industrial-border shadow-sm',
        elevated: 'border border-industrial-border shadow-md',
        glass: 'bg-white/95 backdrop-blur border border-industrial-border shadow-sm',
        bordered: 'border-2 border-industrial-border',
    };

    const paddings = {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
    };

    const hoverStyles = hoverable
        ? 'hover:border-gray-300 hover:shadow-md cursor-pointer'
        : '';

    return (
        <div
            className={twMerge(
                clsx(baseStyles, variants[variant], paddings[padding], hoverStyles, className)
            )}
            {...props}
        >
            {children}
        </div>
    );
};

// Card Header Component
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    title?: string;
    subtitle?: string;
    action?: React.ReactNode;
    icon?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
    title,
    subtitle,
    action,
    icon,
    children,
    className,
    ...props
}) => (
    <div
        className={twMerge('flex items-start justify-between mb-5 pb-3 border-b border-gray-100', className)}
        {...props}
    >
        <div className="flex items-center gap-3">
            {icon && (
                <div className="p-2 rounded bg-paper text-slate-600 border border-gray-200">
                    {icon}
                </div>
            )}
            <div>
                {title && (
                    <h3 className="text-base font-bold text-slate-900 uppercase tracking-wide">{title}</h3>
                )}
                {subtitle && (
                    <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
                )}
                {children}
            </div>
        </div>
        {action && <div className="flex-shrink-0 ml-4">{action}</div>}
    </div>
);

// Card Content Component
export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
    children,
    className,
    ...props
}) => (
    <div className={twMerge('', className)} {...props}>
        {children}
    </div>
);

// Card Footer Component
export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
    children,
    className,
    ...props
}) => (
    <div
        className={twMerge(
            'mt-4 pt-4 border-t border-slate-100 flex items-center justify-end gap-3',
            className
        )}
        {...props}
    >
        {children}
    </div>
);
