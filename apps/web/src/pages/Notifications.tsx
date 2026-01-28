import { useEffect, useState } from 'react';
import { Card, CardHeader, Badge, Button } from '../components/ui';
import api from '../services/api';
import { Bell, Check, Info, AlertTriangle, XCircle, AlertOctagon } from 'lucide-react';
import { format } from 'date-fns';

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
            case 'MEDIUM': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
            case 'LOW': return <Info className="w-5 h-5 text-blue-600" />;
            default: return <Bell className="w-5 h-5 text-slate-500" />;
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
                    <p className="text-slate-500 mt-1">Stay updated on your security posture</p>
                </div>
                <Button variant="secondary" size="sm" onClick={markAllRead} leftIcon={<Check className="w-4 h-4" />}>
                    Mark all read
                </Button>
            </div>

            <div className="space-y-4">
                {isLoading ? (
                    <div className="text-center py-12 text-slate-500">Loading...</div>
                ) : alerts.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Bell className="w-6 h-6 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900">No notifications</h3>
                        <p className="text-slate-500">You're all caught up!</p>
                    </div>
                ) : (
                    alerts.map(alert => (
                        <div
                            key={alert.id}
                            className={`p-4 rounded-xl border transition-colors flex gap-4 ${alert.isRead ? 'bg-white border-slate-200' : 'bg-indigo-50/50 border-indigo-100'
                                }`}
                        >
                            <div className={`mt-1 flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${alert.isRead ? 'bg-slate-100' : 'bg-white shadow-sm'
                                }`}>
                                {getIcon(alert.severity)}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className={`font-semibold ${alert.isRead ? 'text-slate-900' : 'text-indigo-900'}`}>
                                        {alert.title}
                                    </h4>
                                    {!alert.isRead && (
                                        <span className="w-2 h-2 bg-indigo-500 rounded-full" />
                                    )}
                                    <span className="text-xs text-slate-400 ml-auto">
                                        {format(new Date(alert.createdAt), 'MMM d, h:mm a')}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    {alert.message}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
