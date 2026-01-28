import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary' | 'danger' | 'critical' | 'high';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: BadgeVariant;
    size?: BadgeSize;
    icon?: React.ReactNode;
}

export type StatusType = 'COMPLETED' | 'FAILED' | 'RUNNING' | 'PENDING' | 'STOPPED';
export type SeverityType = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export interface StatusBadgeProps {
    status: StatusType | string;
    size?: BadgeSize;
}

export interface SeverityBadgeProps {
    severity: SeverityType | string;
    size?: BadgeSize;
}

const variants: Record<BadgeVariant, string> = {
    default: 'bg-slate-100 text-slate-700 border border-slate-200',
    success: 'bg-success/10 text-success border border-success/20',
    warning: 'bg-warning/10 text-warning border border-warning/20',
    error: 'bg-critical/10 text-critical border border-critical/20',
    info: 'bg-info/10 text-info border border-info/20',

    // Aliases for backward compatibility
    primary: 'bg-slate-100 text-slate-700 border border-slate-200', // mapped to default
    danger: 'bg-critical/10 text-critical border border-critical/20', // mapped to error
    critical: 'bg-critical/10 text-critical border border-critical/20', // mapped to error
    high: 'bg-warning/10 text-warning border border-warning/20', // mapped to warning
};

const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-sm',
    lg: 'px-3 py-1 text-base',
};

export const Badge: React.FC<BadgeProps> = ({
    children,
    variant = 'default',
    size = 'md',
    icon,
    className,
    ...props
}) => {
    return (
        <span
            className={twMerge(
                clsx(
                    'inline-flex items-center font-medium rounded-sm',
                    variants[variant] || variants.default,
                    sizes[size],
                    className
                )
            )}
            {...props}
        >
            {icon && <span className="mr-1.5">{icon}</span>}
            {children}
        </span>
    );
};

// Status Badge Component
export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
    const s = String(status).toUpperCase();
    let variant: BadgeVariant = 'default';

    if (s === 'COMPLETED' || s === 'SUCCESS' || s === 'FINISHED') variant = 'success';
    else if (s === 'FAILED' || s === 'ERROR') variant = 'error';
    else if (s === 'RUNNING' || s === 'IN_PROGRESS' || s === 'SCANNING') variant = 'info';
    else if (s === 'PENDING' || s === 'QUEUED') variant = 'warning';

    return (
        <Badge variant={variant} size={size} className="uppercase tracking-wider font-bold">
            {status}
        </Badge>
    );
};

// Severity Badge Component
export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, size = 'md' }) => {
    const s = String(severity).toUpperCase();
    let variant: BadgeVariant = 'info';

    if (s === 'CRITICAL') variant = 'error';
    else if (s === 'HIGH') variant = 'warning';
    else if (s === 'MEDIUM') variant = 'warning'; // Medium shares warning color
    else if (s === 'LOW') variant = 'success';

    return (
        <Badge variant={variant} size={size} className="uppercase tracking-wider font-bold">
            {severity}
        </Badge>
    );
};
