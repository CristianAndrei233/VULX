import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
    icon: React.ElementType;
    label: string;
    value: string | number;
    trend?: string;
    trendUp?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({ icon: Icon, label, value, trend, trendUp }) => (
    <div className="
    bg-gradient-to-br from-bg-card to-bg-tertiary
    border border-border-primary rounded-xl p-5
    flex flex-col gap-3
  ">
        <div className="flex items-center justify-between">
            <div className="
        w-10 h-10 rounded-lg bg-accent-primary-muted
        flex items-center justify-center
      ">
                <Icon size={20} className="text-accent-primary" />
            </div>
            {trend && (
                <div className={`
          flex items-center gap-1 text-xs font-medium
          ${trendUp ? 'text-accent-primary' : 'text-severity-critical'}
        `}>
                    {trendUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {trend}
                </div>
            )}
        </div>
        <div>
            <div className="text-2xl font-bold text-text-primary tracking-tight">{value}</div>
            <div className="text-[13px] text-text-muted mt-0.5 font-medium">{label}</div>
        </div>
    </div>
);
