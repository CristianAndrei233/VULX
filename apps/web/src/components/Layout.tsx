import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import api from '../services/api';
import {
    LayoutDashboard,
    Scan,
    Settings,
    Shield,
    Menu,
    X,
    LogOut,
    User,
    Terminal,
    Bell,
    Globe
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useEnvironment } from '../context/EnvironmentContext';
import { clsx } from 'clsx'; // Ideally import from tailwind-merge util if available

const NAV_ITEMS = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { label: 'Projects', icon: Shield, path: '/projects' },
    { label: 'Scans', icon: Scan, path: '/scans' },
    { label: 'Remediation', icon: Shield, path: '/remediation' },
    { label: 'Trends', icon: Terminal, path: '/trends' },
    { label: 'Integrations', icon: Globe, path: '/integrations' },
    { label: 'Settings', icon: Settings, path: '/profile' },
];

const EnvironmentToggle = () => {
    const { environment, toggleEnvironment } = useEnvironment();
    const isProd = environment === 'PRODUCTION';

    return (
        <button
            onClick={toggleEnvironment}
            className={clsx(
                "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-all",
                isProd
                    ? "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
            )}
        >
            <Globe className="w-3.5 h-3.5" />
            {isProd ? 'PRODUCTION' : 'SANDBOX'}
        </button>
    );
};

export const Layout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const location = useLocation();
    const { logout, user } = useAuth();
    const { environment } = useEnvironment();

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const { data } = await api.get('/notifications');
                setUnreadCount(data.unreadCount);
            } catch (error) {
                console.error('Failed to fetch notifications', error);
            }
        };

        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, [environment]); // Re-fetch when environment changes

    return (
        <div className="flex h-screen bg-industrial-base text-gray-900 font-sans">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar - Clean Industrial Enterprise */}
            <aside
                className={clsx(
                    "fixed inset-y-0 left-0 z-50 w-64 bg-industrial-surface text-industrial-base transition-transform duration-300 transform lg:translate-x-0 lg:static flex flex-col border-r border-industrial-surface-hover",
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* Logo Area */}
                <div className="h-16 flex items-center px-6 border-b border-industrial-surface-hover">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-industrial bg-industrial-action flex items-center justify-center font-bold text-white shadow-sm">
                            V
                        </div>
                        <span className="text-lg font-bold tracking-tight text-white">VULX</span>
                    </div>
                    <button
                        className="ml-auto lg:hidden text-gray-400 hover:text-white"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
                    {NAV_ITEMS.map((item) => {
                        const isActive = item.path === '/'
                            ? location.pathname === '/' || location.pathname === '/dashboard'
                            : location.pathname.startsWith(item.path);
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={clsx(
                                    "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-industrial transition-colors",
                                    isActive
                                        ? "bg-industrial-surface-hover text-white shadow-sm border-l-2 border-industrial-action"
                                        : "text-gray-400 hover:text-white hover:bg-industrial-surface-hover/50"
                                )}
                            >
                                <Icon className={clsx("w-5 h-5", isActive ? "text-industrial-action" : "text-gray-500 group-hover:text-gray-300")} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* User Footer */}
                <div className="p-4 border-t border-industrial-surface-hover bg-industrial-surface-hover/20">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-full bg-industrial-surface-hover flex items-center justify-center border border-gray-700">
                            <User className="w-4 h-4 text-gray-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{user?.name || 'User'}</p>
                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-gray-400 hover:text-white hover:bg-industrial-surface-hover rounded-industrial transition-colors"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-industrial-base">
                {/* Desktop Header for Global Controls */}
                <header className="hidden lg:flex h-16 bg-white border-b border-gray-200 items-center justify-between px-8">
                    <div className="text-xl font-bold text-gray-800">
                        {NAV_ITEMS.find(item => location.pathname.startsWith(item.path))?.label || 'Dashboard'}
                    </div>
                    <div className="flex items-center gap-4">
                        <EnvironmentToggle />
                        <Link to="/notifications" className="relative p-2 text-gray-500 hover:text-industrial-action transition-colors rounded-full hover:bg-gray-100">
                            <Bell className="w-5 h-5" />
                            {unreadCount > 0 && (
                                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                            )}
                        </Link>
                    </div>
                </header>

                {/* Mobile Header */}
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:hidden">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-md"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <div className="font-bold text-gray-900">VULX</div>
                    <div className="w-8" /> {/* Spacer */}
                </header>

                {/* Content Scroller */}
                <div className="flex-1 overflow-auto p-4 md:p-8">
                    <div className="max-w-7xl mx-auto animate-fade-in">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
};
