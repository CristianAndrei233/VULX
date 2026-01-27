import React from 'react';
import { cn } from '../lib/utils';

interface StatusBadgeProps {
    status: string;
    type?: 'severity' | 'status';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'status' }) => {
    const normalized = status.toUpperCase();

    let colorClass = 'bg-gray-100 text-gray-800';

    if (type === 'status') {
        switch (normalized) {
            case 'COMPLETED': colorClass = 'bg-green-100 text-green-800'; break;
            case 'PROCESSING': colorClass = 'bg-blue-100 text-blue-800'; break;
            case 'FAILED': colorClass = 'bg-red-100 text-red-800'; break;
            case 'PENDING': colorClass = 'bg-yellow-100 text-yellow-800'; break;
        }
    } else {
        // Severity
        switch (normalized) {
            case 'CRITICAL': colorClass = 'bg-red-800 text-white'; break;
            case 'HIGH': colorClass = 'bg-red-100 text-red-800'; break;
            case 'MEDIUM': colorClass = 'bg-orange-100 text-orange-800'; break;
            case 'LOW': colorClass = 'bg-yellow-100 text-yellow-800'; break;
            case 'INFO': colorClass = 'bg-blue-100 text-blue-800'; break;
        }
    }

    return (
        <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium", colorClass)}>
            {status}
        </span>
    );
};
