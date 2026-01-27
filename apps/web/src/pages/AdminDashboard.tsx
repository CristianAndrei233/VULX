import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

export const AdminDashboard = () => {
    const { user } = useAuth();

    if (user?.role !== 'ADMIN') {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
            <p className="mt-4 text-gray-600">Welcome, Administrator. Here you can manage the system.</p>

            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {/* Stats placeholders */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                        <dd className="mt-1 text-3xl font-semibold text-gray-900">--</dd>
                    </div>
                </div>
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <dt className="text-sm font-medium text-gray-500 truncate">Active Scans</dt>
                        <dd className="mt-1 text-3xl font-semibold text-gray-900">--</dd>
                    </div>
                </div>
            </div>
        </div>
    );
};
