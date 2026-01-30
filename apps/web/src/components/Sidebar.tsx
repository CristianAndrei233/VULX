import React from 'react';
import { Home, Folder, Activity, Zap, FileText, Layers, Settings, ChevronRight, ChevronDown, Shield, BarChart3 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

interface SidebarProps {
    collapsed: boolean;
    setCollapsed: (collapsed: boolean) => void;
    activeView?: string; // For compatibility if passed, but we use router
    setActiveView?: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
    const location = useLocation();
    const navigate = useNavigate();

    const navItems = [
        { id: 'dashboard', icon: Home, label: 'Dashboard', path: '/' },
        { id: 'projects', icon: Folder, label: 'Projects', path: '/projects' },
        { id: 'scans', icon: Activity, label: 'Scan Results', path: '/scans' },
        { id: 'remediation', icon: Zap, label: 'Remediation', path: '/remediation' },
        { id: 'reports', icon: FileText, label: 'Reports', path: '/reports' },
        { id: 'trends', icon: BarChart3, label: 'Trends', path: '/trends' },
        { id: 'integrations', icon: Layers, label: 'Integrations', path: '/integrations' },
        { id: 'settings', icon: Settings, label: 'Settings', path: '/profile' },
    ];

    const handleNavigation = (path: string) => {
        navigate(path);
    };

    const isActive = (path: string) => {
        if (path === '/') {
            return location.pathname === '/' || location.pathname === '/dashboard';
        }
        return location.pathname.startsWith(path);
    };

    return (
        <div className={`
      h-screen bg-bg-primary border-r border-border-secondary flex flex-col transition-all duration-300
      fixed left-0 top-0 z-50
      ${collapsed ? 'w-[72px]' : 'w-[240px]'}
    `}>
            {/* Logo */}
            <div className="p-5 flex items-center gap-3 border-b border-border-secondary h-[72px]">
                <div className="
          w-9 h-9 rounded-xl bg-gradient-to-br from-accent-primary to-accent-secondary
          flex items-center justify-center shrink-0 shadow-lg shadow-accent-primary/20
        ">
                    <Shield size={20} color="#0a0d12" />
                </div>
                {!collapsed && (
                    <span className="text-base font-bold text-text-primary tracking-tight animate-fade-in">
                        VULX
                    </span>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 px-3 flex flex-col gap-1 overflow-y-auto">
                {navItems.map(item => {
                    const active = isActive(item.path);
                    return (
                        <button
                            key={item.id}
                            onClick={() => handleNavigation(item.path)}
                            className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all duration-200 w-full group
                ${active
                                    ? 'bg-accent-primary-muted border-accent-primary-muted text-accent-primary font-semibold'
                                    : 'bg-transparent border-transparent text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
                                }
                ${collapsed ? 'justify-center' : 'justify-start'}
              `}
                        >
                            <item.icon size={18} className={active ? 'text-accent-primary' : 'text-text-secondary group-hover:text-text-primary'} />
                            {!collapsed && <span className="text-[13px]">{item.label}</span>}
                        </button>
                    );
                })}
            </nav>

            {/* Collapse Toggle */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="
          m-4 p-2.5 rounded-lg border border-border-primary bg-transparent 
          text-text-muted hover:text-text-primary hover:bg-bg-elevated hover:border-text-muted
          cursor-pointer flex items-center justify-center transition-all duration-200
        "
            >
                {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} className="-rotate-90" />}
            </button>
        </div>
    );
};
