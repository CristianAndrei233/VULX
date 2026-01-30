import { useEffect, useState } from 'react';
import { Card, Button } from '../components/ui';
import api from '../services/api';
import { Bell, Check, Info, AlertTriangle, AlertOctagon, Activity, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { clsx } from 'clsx';

interface Alert {
    id: string;
    title: string;
    message: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
    type: string;
    isRead: boolean;
    createdAt: string;
}

export const Notifications = () => {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchNotifications = async () => {
        try {
            const { data } = await api.get('/notifications');
            setAlerts(data.alerts);
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        } finally {
            setIsLoading(false);
        }
    };

    const markAllRead = async () => {
        try {
            await api.put('/notifications/read-all');
            setAlerts(alerts.map(a => ({ ...a, isRead: true })));
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const getIcon = (severity: string) => {
        switch (severity) {
            case 'CRITICAL': return <AlertOctagon className="w-5 h-5 text-red-600" />;
            case 'HIGH': return <AlertTriangle className="w-5 h-5 text-orange-600" />;
            case 'MEDIUM': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
            case 'LOW': return <Info className="w-5 h-5 text-blue-600" />;
            default: return <Bell className="w-5 h-5 text-zinc-400" />;
        }
    };

    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto space-y-8 animate-pulse p-8">
                <div className="h-10 w-64 bg-zinc-200 rounded-2xl mb-12" />
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-24 bg-zinc-100 rounded-[32px]" />
                ))}
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-12 animate-fade-in relative pb-20">
            {/* Background Blur */}
            <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] bg-primary-100/30 rounded-full blur-[100px] -z-10" />

            <div className="flex items-center justify-between flex-wrap gap-8">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Activity className="w-4 h-4 text-zinc-400" />
                        <span className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">System Signal Log</span>
                    </div>
                    <h1 className="text-3xl font-black text-zinc-900 tracking-tight uppercase">Audit Transmissions</h1>
                </div>
                {alerts.length > 0 && (
                    <Button variant="secondary" className="px-6 py-4 rounded-xl font-black uppercase tracking-widest text-[9px] bg-white border-zinc-200" onClick={markAllRead} leftIcon={<Check className="w-4 h-4" />}>
                        Flush Buffer
                    </Button>
                )}
            </div>

            <div className="space-y-4">
                {alerts.length === 0 ? (
                    <Card className="text-center py-24 border-zinc-200 bg-zinc-50/50 rounded-[48px]">
                        <div className="w-20 h-20 rounded-[32px] bg-white border border-zinc-200 flex items-center justify-center mx-auto mb-8 shadow-sm">
                            <Shield className="w-10 h-10 text-emerald-500 opacity-20" />
                        </div>
                        <h3 className="text-2xl font-black text-zinc-900 tracking-tight uppercase mb-4">Integrity Maintained</h3>
                        <p className="text-zinc-500 font-medium max-w-sm mx-auto leading-relaxed">System buffer is currently empty. No new security transmissions detected.</p>
                    </Card>
                ) : (
                    <div className="grid gap-3">
                        {alerts.map((alert, index) => (
                            <div
                                key={alert.id}
                                className={clsx(
                                    'p-6 rounded-[32px] border transition-all duration-300 flex gap-6 group hover:translate-x-1',
                                    alert.isRead
                                        ? 'bg-white border-zinc-200 grayscale-0 opacity-80'
                                        : 'bg-zinc-900 border-zinc-800 text-white shadow-xl shadow-primary-500/5'
                                )}
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <div className={clsx(
                                    'shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110',
                                    alert.isRead ? 'bg-zinc-50 border border-zinc-100' : 'bg-white/5 border border-white/10 group-hover:bg-white/10'
                                )}>
                                    {getIcon(alert.severity)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h4 className={clsx(
                                            'text-sm font-black uppercase tracking-tight truncate',
                                            alert.isRead ? 'text-zinc-900' : 'text-white'
                                        )}>
                                            {alert.title}
                                        </h4>
                                        {!alert.isRead && (
                                            <div className="w-2 h-2 bg-primary-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,1)] animate-pulse" />
                                        )}
                                        <span className="text-[10px] font-black text-zinc-400 ml-auto uppercase opacity-60">
                                            {format(new Date(alert.createdAt), 'HH:mm • MMM d')}
                                        </span>
                                    </div>
                                    <p className={clsx(
                                        'text-xs font-medium leading-relaxed max-w-2xl',
                                        alert.isRead ? 'text-zinc-500' : 'text-zinc-400'
                                    )}>
                                        {alert.message}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
