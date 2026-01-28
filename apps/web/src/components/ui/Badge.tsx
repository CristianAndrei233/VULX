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
    default: 'bg-industrial-code text-gray-700 border border-gray-200',
    success: 'bg-severity-success/10 text-severity-success border border-severity-success/20',
    warning: 'bg-severity-high/10 text-severity-high border border-severity-high/20',
    error: 'bg-severity-critical/10 text-severity-critical border border-severity-critical/20',
    info: 'bg-severity-medium/10 text-severity-medium border border-severity-medium/20',

    // Aliases
    primary: 'bg-industrial-code text-gray-700 border border-gray-200',
    danger: 'bg-severity-critical/10 text-severity-critical border border-severity-critical/20',
    critical: 'bg-severity-critical/10 text-severity-critical border border-severity-critical/20',
    high: 'bg-severity-high/10 text-severity-high border border-severity-high/20',
};

const sizes = {
    sm: 'px-2 py-0.5 text-xs rounded-industrial',
    md: 'px-2.5 py-0.5 text-sm rounded-industrial',
    lg: 'px-3 py-1 text-base rounded-industrial',
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
                    'inline-flex items-center font-medium',
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
    else if (s === 'MEDIUM') variant = 'info'; // Medium checks to info (Teal)
    else if (s === 'LOW') variant = 'success'; // Low checks to Moss

    return (
        <Badge variant={variant} size={size} className="uppercase tracking-wider font-bold">
            {severity}
        </Badge>
    );
};
