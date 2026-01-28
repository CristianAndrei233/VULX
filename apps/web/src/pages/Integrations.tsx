import { useState, useEffect } from 'react';
import api from '../services/api';
import { Card, CardHeader, Button, Badge } from '../components/ui';
import {
    MessageSquare,
    Bell,
    Users,
    Plus,
    X,
    Send,
    Trash2,
    ToggleLeft,
    ToggleRight,

    Ticket,
    ListChecks
} from 'lucide-react';
import { clsx } from 'clsx';

interface Integration {
    id: string;
    type: 'slack' | 'discord' | 'teams' | 'jira' | 'linear';
    name: string;
    webhookUrl?: string;
    externalUrl?: string;
    events: string[];
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

const INTEGRATION_CONFIG: Record<string, { icon: React.ReactNode; label: string; color: string; hint: string }> = {
    slack: {
        icon: <MessageSquare className="w-5 h-5" />,
        label: 'Slack',
        color: 'bg-[#4A154B]',
        hint: 'Create a webhook in Slack → Apps → Incoming Webhooks'
    },
    discord: {
        icon: <MessageSquare className="w-5 h-5" />,
        label: 'Discord',
        color: 'bg-[#5865F2]',
        hint: 'Server Settings → Integrations → Webhooks'
    },
    teams: {
        icon: <Users className="w-5 h-5" />,
        label: 'Microsoft Teams',
        color: 'bg-[#6264A7]',
        hint: 'Channel Settings → Connectors → Incoming Webhook'
    },
    jira: {
        icon: <Ticket className="w-5 h-5" />,
        label: 'Jira',
        color: 'bg-[#0052CC]',
        hint: 'Connect to your Jira instance'
    },
    linear: {
        icon: <ListChecks className="w-5 h-5" />,
        label: 'Linear',
        color: 'bg-[#5E6AD2]',
        hint: 'Issue tracking sync'
    },
};

export function Integrations() {
    const [integrations, setIntegrations] = useState<Integration[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [testing, setTesting] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        type: 'slack' as 'slack' | 'discord' | 'teams',
        name: '',
        webhookUrl: '',
        events: ['scan_completed', 'critical_finding'],
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchIntegrations();
    }, []);

    const fetchIntegrations = async () => {
        try {
            const response = await api.get('/integrations');
            setIntegrations(response.data);
        } catch (err) {
            console.error('Failed to fetch integrations:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            await api.post('/integrations', formData);
            setSuccess('Integration created successfully!');
            setShowForm(false);
            setFormData({ type: 'slack', name: '', webhookUrl: '', events: ['scan_completed', 'critical_finding'] });
            fetchIntegrations();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to create integration');
        }
    };

    const handleTest = async (id: string) => {
        setTesting(id);
        setError('');
        setSuccess('');
        try {
            await api.post(`/integrations/${id}/test`);
            setSuccess('Test notification sent successfully!');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to send test notification');
        } finally {
            setTesting(null);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this integration?')) return;
        try {
            await api.delete(`/integrations/${id}`);
            fetchIntegrations();
            setSuccess('Integration deleted');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to delete integration');
        }
    };

    const handleToggle = async (integration: Integration) => {
        try {
            await api.put(`/integrations/${integration.id}`, { isActive: !integration.isActive });
            fetchIntegrations();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to update integration');
        }
    };

    const handleEventToggle = (event: string) => {
        setFormData(prev => ({
            ...prev,
            events: prev.events.includes(event)
                ? prev.events.filter(e => e !== event)
                : [...prev.events, event],
        }));
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-10 w-48 skeleton rounded-lg" />
                <div className="grid md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-40 skeleton rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Integrations</h1>
                    <p className="text-slate-500 mt-1">Connect VULX with your favorite tools</p>
                </div>
                <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowForm(true)}>
                    Add Integration
                </Button>
            </div>

            {/* Alerts */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
                    {error}
                </div>
            )}
            {success && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-700 text-sm">
                    {success}
                </div>
            )}

            {/* Modal Form */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-lg animate-fade-in">
                        <CardHeader
                            title="Add Integration"
                            action={
                                <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                                    <X className="w-5 h-5 text-slate-500" />
                                </button>
                            }
                        />
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Integration Type</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['slack', 'discord', 'teams'] as const).map(type => {
                                        const config = INTEGRATION_CONFIG[type];
                                        return (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, type })}
                                                className={clsx(
                                                    'flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all',
                                                    formData.type === type
                                                        ? 'border-indigo-500 bg-indigo-50'
                                                        : 'border-slate-200 hover:border-slate-300'
                                                )}
                                            >
                                                <div className={clsx('w-10 h-10 rounded-lg flex items-center justify-center text-white', config.color)}>
                                                    {config.icon}
                                                </div>
                                                <span className="text-sm font-medium text-slate-700">{config.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Security Alerts Channel"
                                    required
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Webhook URL</label>
                                <input
                                    type="url"
                                    value={formData.webhookUrl}
                                    onChange={e => setFormData({ ...formData, webhookUrl: e.target.value })}
                                    placeholder="https://hooks.slack.com/services/..."
                                    required
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                <p className="mt-1.5 text-xs text-slate-500">{INTEGRATION_CONFIG[formData.type].hint}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Notify On</label>
                                <div className="flex flex-wrap gap-3">
                                    {[
                                        { value: 'scan_completed', label: 'Scan Completed' },
                                        { value: 'critical_finding', label: 'Critical Findings' }
                                    ].map(event => (
                                        <label
                                            key={event.value}
                                            className={clsx(
                                                'flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-all',
                                                formData.events.includes(event.value)
                                                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                                                    : 'bg-slate-50 border-slate-200 text-slate-600'
                                            )}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={formData.events.includes(event.value)}
                                                onChange={() => handleEventToggle(event.value)}
                                                className="sr-only"
                                            />
                                            <Bell className="w-4 h-4" />
                                            {event.label}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" variant="primary">
                                    Create Integration
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}

            {/* Active Integrations */}
            {integrations.length === 0 ? (
                <Card className="text-center py-12">
                    <Bell className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No integrations configured</h3>
                    <p className="text-slate-500 mb-6">Add your first integration to get real-time notifications</p>
                    <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowForm(true)}>
                        Add Integration
                    </Button>
                </Card>
            ) : (
                <div className="grid md:grid-cols-2 gap-4">
                    {integrations.map(integration => {
                        const config = INTEGRATION_CONFIG[integration.type];
                        return (
                            <Card
                                key={integration.id}
                                className={clsx('transition-all', !integration.isActive && 'opacity-60')}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={clsx('w-12 h-12 rounded-xl flex items-center justify-center text-white flex-shrink-0', config.color)}>
                                        {config.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-base font-semibold text-slate-900">{integration.name}</h3>
                                            <button
                                                onClick={() => handleToggle(integration)}
                                                className="text-slate-400 hover:text-slate-600"
                                            >
                                                {integration.isActive ? (
                                                    <ToggleRight className="w-6 h-6 text-emerald-500" />
                                                ) : (
                                                    <ToggleLeft className="w-6 h-6" />
                                                )}
                                            </button>
                                        </div>
                                        <p className="text-sm text-slate-500 mt-0.5">{config.label}</p>
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            {integration.events.map(e => (
                                                <Badge key={e} variant="default" size="sm">
                                                    {e.replace('_', ' ')}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="flex-1"
                                        leftIcon={<Send className="w-3.5 h-3.5" />}
                                        onClick={() => handleTest(integration.id)}
                                        disabled={testing === integration.id || !integration.isActive}
                                        isLoading={testing === integration.id}
                                    >
                                        Test
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                                        onClick={() => handleDelete(integration.id)}
                                        className="text-red-500 hover:bg-red-50"
                                    >
                                        Delete
                                    </Button>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Available Integrations Info */}
            <Card>
                <CardHeader title="Available Integrations" />
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(INTEGRATION_CONFIG).map(([key, config]) => {
                        const isComingSoon = key === 'jira' || key === 'linear';
                        return (
                            <div
                                key={key}
                                className={clsx(
                                    'p-4 rounded-xl border',
                                    isComingSoon ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-200 hover:border-indigo-300'
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={clsx('w-10 h-10 rounded-lg flex items-center justify-center text-white', config.color)}>
                                        {config.icon}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-sm font-semibold text-slate-900">{config.label}</h4>
                                            {isComingSoon && <Badge variant="default" size="sm">Coming Soon</Badge>}
                                        </div>
                                        <p className="text-xs text-slate-500 mt-0.5">{config.hint}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>
        </div>
    );
}
