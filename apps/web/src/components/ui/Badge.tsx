import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Badge Variants
export type BadgeVariant =
    | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info'
    | 'critical' | 'high' | 'medium' | 'low' | 'neutral';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: BadgeVariant;
    size?: 'xs' | 'sm' | 'md';
    pulse?: boolean;
    icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
    children,
    variant = 'primary',
    size = 'sm',
    pulse = false,
    icon,
    className,
    ...props
}) => {
    const baseStyles = 'inline-flex items-center font-semibold rounded-full transition-all duration-200';

    const variants: Record<BadgeVariant, string> = {
        primary: 'bg-primary-100 text-primary-700 border border-primary-200',
        secondary: 'bg-stone-100 text-stone-700 border border-stone-200',
        success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        warning: 'bg-amber-50 text-amber-700 border border-amber-200',
        danger: 'bg-rose-50 text-rose-700 border border-rose-200',
        info: 'bg-sky-50 text-sky-700 border border-sky-200',
        critical: 'bg-gradient-to-r from-rose-500 to-rose-600 text-white border-0 shadow-sm',
        high: 'bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 shadow-sm',
        medium: 'bg-gradient-to-r from-amber-400 to-amber-500 text-amber-900 border-0 shadow-sm',
        low: 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-0 shadow-sm',
        neutral: 'bg-stone-100 text-stone-600 border border-stone-200',
    };

    const sizes = {
        xs: 'px-1.5 py-0.5 text-[10px] gap-1',
        sm: 'px-2.5 py-1 text-xs gap-1.5',
        md: 'px-3 py-1.5 text-sm gap-2',
    };

    const pulseStyles = pulse ? 'animate-pulse' : '';

    return (
        <span
            className={twMerge(
                clsx(baseStyles, variants[variant], sizes[size], pulseStyles, className)
            )}
            {...props}
        >
            {icon && <span className="flex-shrink-0">{icon}</span>}
            {children}
        </span>
    );
};

// Status Badge Component
export type StatusType = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'ACTIVE' | 'INACTIVE';

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    status: StatusType | string;
    size?: 'xs' | 'sm' | 'md';
    showDot?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
    status,
    size = 'sm',
    showDot = true,
    className,
    ...props
}) => {
    const statusConfig: Record<string, { variant: BadgeVariant; label: string; dotColor: string }> = {
        PENDING: { variant: 'neutral', label: 'Pending', dotColor: 'bg-stone-400' },
        PROCESSING: { variant: 'primary', label: 'Processing', dotColor: 'bg-primary-500 animate-pulse' },
        COMPLETED: { variant: 'success', label: 'Completed', dotColor: 'bg-emerald-500' },
        FAILED: { variant: 'danger', label: 'Failed', dotColor: 'bg-rose-500' },
        ACTIVE: { variant: 'success', label: 'Active', dotColor: 'bg-emerald-500' },
        INACTIVE: { variant: 'neutral', label: 'Inactive', dotColor: 'bg-stone-400' },
    };

    const config = statusConfig[status] || { variant: 'neutral' as BadgeVariant, label: status, dotColor: 'bg-stone-400' };

    return (
        <Badge variant={config.variant} size={size} className={className} {...props}>
            {showDot && (
                <span className={clsx('w-1.5 h-1.5 rounded-full', config.dotColor)} />
            )}
            {config.label}
        </Badge>
    );
};


