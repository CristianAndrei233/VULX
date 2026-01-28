import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Scan,
    Settings,
    Shield,
    Menu,
    X,
    LogOut,
    User,
    Terminal
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { clsx } from 'clsx'; // Ideally import from tailwind-merge util if available

const NAV_ITEMS = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Projects', icon: Shield, path: '/projects' },
    { label: 'Scans', icon: Scan, path: '/scans' },
    { label: 'Remediation', icon: Shield, path: '/remediation' },
    { label: 'Trends', icon: Terminal, path: '/trends' },
    { label: 'Settings', icon: Settings, path: '/settings' },
];

export const Layout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();
    const { logout, user } = useAuth();

    return (
        <div className="flex h-screen bg-paper text-slate-900 font-sans">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar - Iron Forest Theme */}
            <aside
                className={clsx(
                    "fixed inset-y-0 left-0 z-50 w-64 bg-iron text-paper transition-transform duration-300 transform lg:translate-x-0 lg:static flex flex-col border-r border-iron-active",
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* Logo Area */}
                <div className="h-16 flex items-center px-6 border-b border-iron-active/50">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-clay flex items-center justify-center font-bold text-white shadow-hard-sm">
                            V
                        </div>
                        <span className="text-lg font-bold tracking-tight">VULX</span>
                    </div>
                    <button
                        className="ml-auto lg:hidden text-slate-400 hover:text-white"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
                    {NAV_ITEMS.map((item) => {
                        const isActive = location.pathname.startsWith(item.path);
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={clsx(
                                    "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-colors",
                                    isActive
                                        ? "bg-iron-hover text-white shadow-sm border-l-2 border-clay"
                                        : "text-slate-400 hover:text-white hover:bg-iron-hover/50"
                                )}
                            >
                                <Icon className={clsx("w-5 h-5", isActive ? "text-clay" : "text-slate-500 group-hover:text-slate-300")} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* User Footer */}
                <div className="p-4 border-t border-iron-active/50 bg-iron-active/20">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-full bg-iron-hover flex items-center justify-center border border-iron-active">
                            <User className="w-4 h-4 text-slate-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{user?.name || 'User'}</p>
                            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-iron-hover rounded-md transition-colors"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-paper">
                {/* Mobile Header */}
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:hidden">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 -ml-2 text-slate-600 hover:bg-gray-100 rounded-md"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <div className="font-bold text-slate-900">VULX</div>
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
