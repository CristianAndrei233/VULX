import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { Users, Activity, Shield, AlertTriangle, TrendingUp, Settings } from 'lucide-react';
import { Card, CardHeader, Button, Badge } from '../components/ui';

export const AdminDashboard = () => {
    const { user } = useAuth();

    if (user?.role !== 'ADMIN') {
        return <Navigate to="/" replace />;
    }

    const stats = [
        { label: 'Total Users', value: '156', icon: <Users className="w-5 h-5" />, trend: '+12%', color: 'bg-indigo-100 text-indigo-600' },
        { label: 'Active Scans', value: '8', icon: <Activity className="w-5 h-5" />, trend: 'Live', color: 'bg-emerald-100 text-emerald-600' },
        { label: 'Total Projects', value: '342', icon: <Shield className="w-5 h-5" />, trend: '+28%', color: 'bg-purple-100 text-purple-600' },
        { label: 'Critical Issues', value: '23', icon: <AlertTriangle className="w-5 h-5" />, trend: '-5%', color: 'bg-red-100 text-red-600' },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
                    <p className="text-slate-500 mt-1">System overview and management</p>
                </div>
                <Button variant="secondary" leftIcon={<Settings className="w-4 h-4" />}>
                    System Settings
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => (
                    <Card key={stat.label} hoverable>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                                <p className="text-3xl font-bold text-slate-900 mt-1">{stat.value}</p>
                                <div className="flex items-center gap-1 mt-2">
                                    <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                                    <span className="text-sm text-emerald-600 font-medium">{stat.trend}</span>
                                </div>
                            </div>
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                                {stat.icon}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Recent Users */}
                <Card>
                    <CardHeader title="Recent Users" action={<Button variant="ghost" size="sm">View All</Button>} />
                    <div className="space-y-3">
                        {[
                            { name: 'John Smith', email: 'john@company.com', role: 'USER', time: '2 min ago' },
                            { name: 'Sarah Johnson', email: 'sarah@startup.io', role: 'ADMIN', time: '15 min ago' },
                            { name: 'Mike Chen', email: 'mike@tech.dev', role: 'USER', time: '1 hour ago' },
                        ].map((user, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium">
                                        {user.name[0]}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">{user.name}</p>
                                        <p className="text-xs text-slate-500">{user.email}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <Badge variant={user.role === 'ADMIN' ? 'primary' : 'default'} size="sm">
                                        {user.role}
                                    </Badge>
                                    <p className="text-xs text-slate-400 mt-1">{user.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* System Health */}
                <Card>
                    <CardHeader title="System Health" />
                    <div className="space-y-4">
                        {[
                            { name: 'API Server', status: 'Healthy', uptime: '99.9%', color: 'bg-emerald-500' },
                            { name: 'Scan Engine', status: 'Healthy', uptime: '99.7%', color: 'bg-emerald-500' },
                            { name: 'Database', status: 'Healthy', uptime: '100%', color: 'bg-emerald-500' },
                            { name: 'Worker Queue', status: 'Warning', uptime: '98.2%', color: 'bg-amber-500' },
                        ].map((service, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2.5 h-2.5 rounded-full ${service.color}`} />
                                    <span className="text-sm font-medium text-slate-900">{service.name}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-sm text-slate-500">{service.uptime} uptime</span>
                                    <Badge variant={service.status === 'Healthy' ? 'success' : 'warning'} size="sm">
                                        {service.status}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
};
