import React, { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Shield, LayoutDashboard, Plus, CreditCard, User, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Layout: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            <Link to="/" className="flex-shrink-0 flex items-center">
                                <Shield className="h-8 w-8 text-indigo-600" />
                                <span className="ml-2 text-xl font-bold text-gray-900">VULX</span>
                            </Link>
                            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                                <Link to="/" className="inline-flex items-center px-1 pt-1 border-b-2 border-indigo-500 text-sm font-medium text-gray-900">
                                    <LayoutDashboard className="w-4 h-4 mr-2" />
                                    Dashboard
                                </Link>
                                <Link to="/new" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 text-sm font-medium">
                                    <Plus className="w-4 h-4 mr-2" />
                                    New Project
                                </Link>
                                <Link to="/billing" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 text-sm font-medium">
                                    <CreditCard className="w-4 h-4 mr-2" />
                                    Billing
                                </Link>
                                {user?.role === 'ADMIN' && (
                                    <Link to="/admin" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-purple-600 hover:text-purple-800 text-sm font-medium">
                                        <Settings className="w-4 h-4 mr-2" />
                                        Admin
                                    </Link>
                                )}
                            </div>
                        </div>
                        <div className="hidden sm:ml-6 sm:flex sm:items-center">
                            <div className="ml-3 relative">
                                <div className="flex items-center space-x-4">
                                    <Link to="/profile" className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900">
                                        <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-800">
                                            {user?.name?.[0]?.toUpperCase() || <User className="w-4 h-4" />}
                                        </div>
                                        <span className="ml-2">{user?.name}</span>
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none"
                                        title="Logout"
                                    >
                                        <LogOut className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <Outlet />
            </main>
        </div>
    );
};
