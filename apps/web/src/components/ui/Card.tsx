import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
    return (
        <div className={`
      bg-bg-card border border-border-primary rounded-xl overflow-hidden
      ${className}
    `}>
            {children}
        </div>
    );
};

interface CardHeaderProps {
    title: string;
    action?: React.ReactNode;
    icon?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ title, action, icon }) => {
    return (
        <div className="px-6 py-5 border-b border-border-primary flex items-center justify-between">
            <div className="flex items-center gap-3">
                {icon}
                <h3 className="text-lg font-bold text-text-primary">{title}</h3>
            </div>
            {action && <div>{action}</div>}
        </div>
    );
};
