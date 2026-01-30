import React from 'react';

interface SecurityScoreRingProps {
    score: number;
    size?: number;
}

export const SecurityScoreRing: React.FC<SecurityScoreRingProps> = ({ score, size = 160 }) => {
    const strokeWidth = size < 60 ? 4 : 12;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = (score / 100) * circumference;

    const getColorClass = () => {
        if (score >= 80) return 'stroke-emerald-500 text-emerald-500';
        if (score >= 60) return 'stroke-amber-500 text-amber-500';
        if (score >= 40) return 'stroke-orange-500 text-orange-500';
        return 'stroke-rose-500 text-rose-500';
    };

    const colorClass = getColorClass();
    const showLabel = size >= 100;

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90 transform">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    className="stroke-zinc-800"
                    strokeWidth={strokeWidth}
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    className={`${colorClass} transition-all duration-1000 ease-out`}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference - progress}
                    strokeLinecap="round"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className={`font-bold tracking-tighter ${colorClass.split(' ')[1]}`} style={{ fontSize: size * 0.3 }}>
                    {score}
                </div>
                {showLabel && (
                    <div className="text-xs text-zinc-500 uppercase tracking-widest font-medium mt-1">Score</div>
                )}
            </div>
        </div>
    );
};
