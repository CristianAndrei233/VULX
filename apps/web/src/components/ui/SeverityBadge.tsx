import React from 'react';

type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface SeverityBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    severity: Severity;
    badgeCount?: number;
}

export const SeverityBadge = ({ severity, badgeCount, className, ...props }: SeverityBadgeProps) => {
    const config = {
        critical: {
            bg: 'bg-severity-critical-bg',
            color: 'text-severity-critical',
            label: 'Critical',
            dot: 'bg-severity-critical'
        },
        high: {
            bg: 'bg-severity-high-bg',
            color: 'text-severity-high',
            label: 'High',
            dot: 'bg-severity-high'
        },
        medium: {
            bg: 'bg-severity-medium-bg',
            color: 'text-severity-medium',
            label: 'Medium',
            dot: 'bg-severity-medium'
        },
        low: {
            bg: 'bg-severity-low-bg',
            color: 'text-severity-low',
            label: 'Low',
            dot: 'bg-severity-low'
        },
        info: {
            bg: 'bg-severity-info-bg',
            color: 'text-severity-info',
            label: 'Info',
            dot: 'bg-severity-info'
        },
    };

    const c = config[severity] || config.info;

    return (
        <span className={`
      inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold tracking-wide
      ${c.bg} ${c.color}
      ${className || ''}
    `} {...props}>
            <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
            {c.label}{badgeCount !== undefined && ` (${badgeCount})`}
        </span>
    );
};
