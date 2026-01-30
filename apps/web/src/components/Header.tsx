import React from 'react';
import { Search, Bell, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useEnvironment } from '../context/EnvironmentContext';

interface HeaderProps {
    collapsed: boolean;
}

const EnvironmentToggle = () => {
    const { environment, toggleEnvironment } = useEnvironment();
    const isProd = environment === 'PRODUCTION';

    return (
        <button
            onClick={toggleEnvironment}
            className={`
                flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 border
                ${isProd
                    ? "bg-severity-critical-bg text-severity-critical border-severity-critical/30 hover:border-severity-critical"
                    : "bg-accent-primary-muted text-accent-primary border-accent-primary/30 hover:border-accent-primary"
                }
            `}
        >
            <span className={`
                w-1.5 h-1.5 rounded-full animate-pulse
                ${isProd ? "bg-severity-critical" : "bg-accent-primary"}
            `} />
            {isProd ? 'PRODUCTION' : 'SANDBOX'}
        </button>
    );
};

export const Header: React.FC<HeaderProps> = ({ collapsed }) => {
    const { user } = useAuth();
    // Mock notification count - In real app, fetch from context/api
    const unreadCount = 2; // Example static

    return (
        <header className={`
      h-16 bg-bg-secondary border-b border-border-secondary
      flex items-center justify-between px-6 sticky top-0 z-40 transition-all duration-300
      ${collapsed ? 'ml-[72px]' : 'ml-[240px]'}
    `}>
            {/* Search */}
            <div className="flex items-center gap-3 bg-bg-tertiary border border-border-primary rounded-lg px-4 py-2 w-[320px] transition-colors focus-within:border-accent-primary/50">
                <Search size={16} className="text-text-muted" />
                <input
                    placeholder="Search projects, scans..."
                    className="bg-transparent border-none text-text-primary text-[13px] outline-none w-full font-sans placeholder:text-text-muted"
                />
                <span className="text-[11px] text-text-muted px-1.5 py-0.5 bg-bg-card rounded border border-border-primary">⌘K</span>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
                <EnvironmentToggle />

                <button className="
          w-9 h-9 rounded-lg border border-border-primary bg-transparent text-text-secondary
          flex items-center justify-center relative hover:text-text-primary hover:bg-bg-elevated transition-colors
        ">
                    <Bell size={18} />
                    {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-severity-critical shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                    )}
                </button>

                <div className="flex items-center gap-2.5 py-1.5 pl-2 pr-3 bg-bg-tertiary rounded-lg border border-border-primary hover:border-text-muted transition-colors cursor-pointer group">
                    <div className="
            w-7 h-7 rounded-md bg-gradient-to-br from-accent-primary to-severity-low
            flex items-center justify-center text-xs font-bold text-white shadow-sm
          ">
                        {user?.name ? user.name.substring(0, 2).toUpperCase() : 'CD'}
                    </div>
                    <div>
                        <div className="text-[13px] font-medium text-text-primary leading-none mb-0.5 group-hover:text-accent-primary transition-colors">
                            {user?.name || 'User'}
                        </div>
                        <div className="text-[11px] text-text-muted leading-none">Pro Plan</div>
                    </div>
                    <ChevronDown size={14} className="text-text-muted group-hover:text-text-primary transition-colors" />
                </div>
            </div>
        </header>
    );
};
