import React from 'react';
import { Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    icon?: React.ElementType;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    isLoading?: boolean;
    fullWidth?: boolean;
    glow?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    icon: Icon,
    leftIcon,
    rightIcon,
    isLoading = false,
    className = '',
    disabled,
    fullWidth,
    glow,
    ...props
}) => {
    const baseStyles = 'inline-flex items-center justify-center gap-2 rounded-lg font-semibold cursor-pointer transition-all duration-200 font-sans disabled:opacity-50 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bg-primary';

    const variants = {
        primary: 'bg-accent-primary text-bg-primary border border-transparent hover:bg-accent-primary/90 focus:ring-accent-primary',
        secondary: 'bg-bg-card text-text-primary border border-border-primary hover:bg-bg-elevated focus:ring-border-primary',
        ghost: 'bg-transparent text-text-secondary border-none hover:text-text-primary hover:bg-bg-elevated focus:ring-text-secondary',
        danger: 'bg-severity-critical text-white border border-transparent hover:bg-severity-critical/90 focus:ring-severity-critical',
        success: 'bg-severity-success text-white border border-transparent hover:bg-severity-success/90 focus:ring-severity-success',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base',
    };

    return (
        <button
            className={clsx(
                baseStyles,
                variants[variant],
                sizes[size],
                fullWidth && 'w-full',
                glow && variant === 'primary' && 'shadow-lg shadow-accent-primary/25 hover:shadow-accent-primary/40',
                className
            )}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && <Loader2 className="animate-spin" size={size === 'sm' ? 14 : 18} />}
            {!isLoading && Icon && <Icon size={size === 'sm' ? 14 : 18} />}
            {!isLoading && leftIcon}
            {children}
            {!isLoading && rightIcon}
        </button>
    );
};
