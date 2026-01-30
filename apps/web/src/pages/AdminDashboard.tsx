import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { Users, Activity, Shield, AlertTriangle, TrendingUp, Settings, Cpu, Database, Server, Zap } from 'lucide-react';
import { Card, Button, Badge } from '../components/ui';
import { clsx } from 'clsx';

export const AdminDashboard = () => {
    const { user } = useAuth();

    if (user?.role !== 'ADMIN') {
        return <Navigate to="/" replace />;
    }

    const stats = [
        { label: 'Total Users', value: '156', icon: <Users className="w-5 h-5" />, trend: '+12%', color: 'bg-primary-500/10 text-primary-500' },
        { label: 'Active Scans', value: '8', icon: <Activity className="w-5 h-5" />, trend: 'Live', color: 'bg-emerald-500/10 text-emerald-500' },
        { label: 'Total Projects', value: '342', icon: <Shield className="w-5 h-5" />, trend: '+28%', color: 'bg-indigo-500/10 text-indigo-500' },
        { label: 'Critical Issues', value: '23', icon: <AlertTriangle className="w-5 h-5" />, trend: '-5%', color: 'bg-red-500/10 text-red-500' },
    ];

    return (
        <div className="space-y-10 animate-fade-in relative pb-20">
            {/* Background Blur */}
            <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-primary-100/30 rounded-full blur-[100px] -z-10" />

            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-8">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Cpu className="w-4 h-4 text-zinc-400" />
                        <span className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">Global Kernel Control</span>
                    </div>
                    <h1 className="text-3xl font-black text-zinc-900 tracking-tight uppercase">Master Dashboard</h1>
                </div>
                <Button variant="secondary" className="px-6 py-4 rounded-xl font-black uppercase tracking-widest text-[9px] bg-white border-zinc-200" leftIcon={<Settings className="w-4 h-4" />}>
                    Core Config
                </Button>
            </div>

            {/* Stats Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <Card key={stat.label} className="p-8 rounded-[32px] border-zinc-200 shadow-xl group hover:translate-y-[-4px] transition-all duration-300">
                        <div className="flex items-center justify-between mb-6">
                            <div className={clsx('w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-lg', stat.color)}>
                                {stat.icon}
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-50 border border-zinc-100 rounded-xl">
                                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                                <span className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">{stat.trend}</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-[11px] font-black text-zinc-400 uppercase tracking-widest mb-1">{stat.label}</p>
                            <p className="text-4xl font-black text-zinc-900 tracking-tighter">{stat.value}</p>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Main Content Matrix */}
            <div className="grid lg:grid-cols-2 gap-8">
                {/* User Ledger */}
                <Card className="p-10 border-zinc-200 shadow-xl rounded-[40px] flex flex-col gap-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-black text-zinc-900 tracking-tight uppercase">Active Operators</h3>
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-1">Real-time user access ledger</p>
                        </div>
                        <Button variant="ghost" className="text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900">Full Directory</Button>
                    </div>

                    <div className="grid gap-4">
                        {[
                            { name: 'John Smith', email: 'john@company.com', role: 'USER', time: '2 min ago' },
                            { name: 'Sarah Johnson', email: 'sarah@startup.io', role: 'ADMIN', time: '15 min ago' },
                            { name: 'Mike Chen', email: 'mike@tech.dev', role: 'USER', time: '1 hour ago' },
                        ].map((u, i) => (
                            <div key={i} className="flex items-center justify-between p-5 bg-zinc-50 border border-zinc-100/50 rounded-2xl hover:bg-white hover:shadow-lg transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-lg group-hover:scale-110 transition-transform">
                                        {u.name[0]}
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-zinc-900 tracking-tight">{u.name}</p>
                                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">{u.email}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <Badge variant={u.role === 'ADMIN' ? 'primary' : 'neutral'} size="sm" className="font-black uppercase tracking-widest text-[8px]">
                                        {u.role}
                                    </Badge>
                                    <p className="text-[9px] font-black text-zinc-300 mt-1.5 uppercase tracking-widest">{u.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* System Diagnostics */}
                <Card className="p-10 border-zinc-900 bg-zinc-900 shadow-2xl rounded-[40px] flex flex-col gap-8 text-white group overflow-hidden relative">
                    <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-primary-500/20 rounded-full blur-[60px] group-hover:bg-primary-500/30 transition-all duration-1000" />

                    <div className="relative z-10">
                        <h3 className="text-xl font-black text-white tracking-tight uppercase">Kernel Diagnostics</h3>
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">Hardware & Service integrity check</p>
                    </div>

                    <div className="grid gap-6 relative z-10">
                        {[
                            { name: 'API Server', status: 'Healthy', uptime: '99.9%', color: 'bg-emerald-500', icon: <Server className="w-4 h-4" /> },
                            { name: 'Scan Engine', status: 'Healthy', uptime: '99.7%', color: 'bg-emerald-500', icon: <Zap className="w-4 h-4 text-primary-400" /> },
                            { name: 'Mainframe DB', status: 'Healthy', uptime: '100%', color: 'bg-emerald-500', icon: <Database className="w-4 h-4" /> },
                            { name: 'Worker Queue', status: 'Warning', uptime: '98.2%', color: 'bg-amber-500', icon: <Activity className="w-4 h-4" /> },
                        ].map((s, i) => (
                            <div key={i} className="flex items-center justify-between p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-zinc-400">
                                        {s.icon}
                                    </div>
                                    <div>
                                        <p className="text-sm font-black tracking-tight">{s.name}</p>
                                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{s.uptime} AVAILABILITY</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className={clsx('px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg', s.color === 'bg-emerald-500' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30')}>
                                        {s.status}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
};
