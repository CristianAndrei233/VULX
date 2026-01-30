import { useState, useEffect } from 'react';
import api from '../services/api';
import { Card, Button, Badge } from '../components/ui';
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
    ListChecks,
    Network
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
        hint: 'Incoming Webhooks'
    },
    discord: {
        icon: <MessageSquare className="w-5 h-5" />,
        label: 'Discord',
        color: 'bg-[#5865F2]',
        hint: 'Integrations → Webhooks'
    },
    teams: {
        icon: <Users className="w-5 h-5" />,
        label: 'MS Teams',
        color: 'bg-[#6264A7]',
        hint: 'Incoming Webhook'
    },
    jira: {
        icon: <Ticket className="w-5 h-5" />,
        label: 'Jira',
        color: 'bg-[#0052CC]',
        hint: 'Issue Tracker'
    },
    linear: {
        icon: <ListChecks className="w-5 h-5" />,
        label: 'Linear',
        color: 'bg-[#5E6AD2]',
        hint: 'Workspace Sync'
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
            setSuccess('Integration connected successfully');
            setShowForm(false);
            setFormData({ type: 'slack', name: '', webhookUrl: '', events: ['scan_completed', 'critical_finding'] });
            fetchIntegrations();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to initialize connection');
        }
    };

    const handleTest = async (id: string) => {
        setTesting(id);
        setError('');
        setSuccess('');
        try {
            await api.post(`/integrations/${id}/test`);
            setSuccess('Test successful');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Test failed');
        } finally {
            setTesting(null);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Disconnect this integration?')) return;
        try {
            await api.delete(`/integrations/${id}`);
            fetchIntegrations();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Disconnection failed');
        }
    };

    const handleToggle = async (integration: Integration) => {
        try {
            await api.put(`/integrations/${integration.id}`, { isActive: !integration.isActive });
            fetchIntegrations();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Toggle failed');
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
            <div className="space-y-6 animate-pulse p-8">
                <div className="h-10 w-64 bg-bg-card rounded-lg mb-8" />
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-64 bg-bg-card rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in relative pb-20">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-8">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Integrations</h1>
                    <p className="text-text-secondary mt-1">Connect external tools for automated alerts and reporting</p>
                </div>
                <Button variant="primary" icon={Plus} onClick={() => setShowForm(true)}>
                    Add Integration
                </Button>
            </div>

            {/* In-view messages */}
            {error && (
                <div className="bg-severity-critical-bg border border-severity-critical/20 rounded-lg p-4 text-severity-critical font-medium flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-severity-critical/20 flex items-center justify-center text-severity-critical">!</div>
                    {error}
                </div>
            )}
            {success && (
                <div className="bg-accent-primary-muted border border-accent-primary/20 rounded-lg p-4 text-accent-primary font-medium flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-accent-primary/20 flex items-center justify-center text-accent-primary">✓</div>
                    {success}
                </div>
            )}

            {/* Form Overlay */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6">
                    <Card className="w-full max-w-xl animate-fade-in p-0 overflow-hidden bg-bg-card border-border-primary shadow-2xl">
                        <div className="p-6 border-b border-border-primary flex items-center justify-between bg-bg-tertiary">
                            <div>
                                <h2 className="text-lg font-bold text-text-primary">Add Integration</h2>
                                <p className="text-sm text-text-secondary mt-0.5">Configure a new external connection</p>
                            </div>
                            <button onClick={() => setShowForm(false)} className="text-text-secondary hover:text-text-primary transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-text-secondary uppercase tracking-wider">Protocol Type</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {(['slack', 'discord', 'teams'] as const).map(type => {
                                        const config = INTEGRATION_CONFIG[type];
                                        return (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, type })}
                                                className={clsx(
                                                    'flex flex-col items-center gap-3 p-4 rounded-xl border transition-all duration-200',
                                                    formData.type === type
                                                        ? 'border-accent-primary bg-accent-primary-muted text-accent-primary'
                                                        : 'border-border-primary bg-bg-tertiary text-text-secondary hover:border-text-muted hover:text-text-primary'
                                                )}
                                            >
                                                <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm', config.color)}>
                                                    {config.icon}
                                                </div>
                                                <span className="text-xs font-semibold">{config.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-text-secondary uppercase tracking-wider">Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Critical Alerts Channel"
                                    required
                                    className="w-full px-4 py-2.5 bg-bg-tertiary border border-border-primary rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-text-secondary uppercase tracking-wider">Webhook URL</label>
                                <input
                                    type="url"
                                    value={formData.webhookUrl}
                                    onChange={e => setFormData({ ...formData, webhookUrl: e.target.value })}
                                    placeholder="https://hooks.slack.com/services/..."
                                    required
                                    className="w-full px-4 py-2.5 bg-bg-tertiary border border-border-primary rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary transition-all"
                                />
                                <p className="text-xs text-text-muted">{INTEGRATION_CONFIG[formData.type].hint}</p>
                            </div>

                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-text-secondary uppercase tracking-wider">Event Triggers</label>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { value: 'scan_completed', label: 'Scan Completed' },
                                        { value: 'critical_finding', label: 'Critical Finding' }
                                    ].map(event => (
                                        <label
                                            key={event.value}
                                            className={clsx(
                                                'flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all duration-200 text-xs font-semibold',
                                                formData.events.includes(event.value)
                                                    ? 'bg-accent-primary-muted border-accent-primary text-accent-primary'
                                                    : 'bg-bg-tertiary border-border-primary text-text-muted hover:text-text-primary'
                                            )}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={formData.events.includes(event.value)}
                                                onChange={() => handleEventToggle(event.value)}
                                                className="hidden"
                                            />
                                            {formData.events.includes(event.value) && <Bell className="w-3 h-3" />}
                                            {event.label}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button type="button" variant="ghost" onClick={() => setShowForm(false)} className="flex-1 justify-center">
                                    Cancel
                                </Button>
                                <Button type="submit" variant="primary" className="flex-1 justify-center">
                                    Add Integration
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}

            {/* Integrations Grid */}
            {integrations.length === 0 ? (
                <Card className="text-center py-16 bg-bg-tertiary/50 border-dashed">
                    <div className="w-16 h-16 rounded-full bg-bg-elevated flex items-center justify-center mx-auto mb-6">
                        <Network className="w-8 h-8 text-text-muted" />
                    </div>
                    <h3 className="text-lg font-semibold text-text-primary mb-2">No Active Integrations</h3>
                    <p className="text-text-secondary mb-8 max-w-sm mx-auto">Connect your workspace tools to receive real-time security alerts.</p>
                    <Button variant="secondary" icon={Plus} onClick={() => setShowForm(true)}>
                        Connect Tool
                    </Button>
                </Card>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {integrations.map(integration => {
                        const config = INTEGRATION_CONFIG[integration.type];
                        return (
                            <Card
                                key={integration.id}
                                className={clsx(
                                    'p-6 transition-all duration-300 group hover:shadow-lg hover:border-accent-primary/20 bg-bg-card',
                                    !integration.isActive && 'opacity-60 grayscale'
                                )}
                            >
                                <div className="flex items-start justify-between mb-6">
                                    <div className={clsx('w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md', config.color)}>
                                        {config.icon}
                                    </div>
                                    <button
                                        onClick={() => handleToggle(integration)}
                                        className={clsx(
                                            "w-8 h-8 flex items-center justify-center rounded-lg transition-colors",
                                            integration.isActive ? "text-accent-primary bg-accent-primary-muted" : "text-text-muted bg-bg-tertiary hover:bg-bg-elevated"
                                        )}
                                        title={integration.isActive ? 'Disable' : 'Enable'}
                                    >
                                        {integration.isActive ? (
                                            <ToggleRight className="w-5 h-5" />
                                        ) : (
                                            <ToggleLeft className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>

                                <div className="mb-6">
                                    <h3 className="text-lg font-bold text-text-primary truncate">{integration.name}</h3>
                                    <p className="text-xs text-text-muted font-medium mt-1">{config.label} Integration</p>
                                </div>

                                <div className="flex flex-wrap gap-2 mb-6">
                                    {integration.events.map(e => (
                                        <Badge key={e} variant="neutral" size="xs" className="bg-bg-tertiary border-border-primary text-text-secondary">
                                            {e.replace('_', ' ')}
                                        </Badge>
                                    ))}
                                </div>

                                <div className="flex gap-2 pt-4 border-t border-border-primary">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="flex-1 justify-center text-xs"
                                        icon={Send}
                                        onClick={() => handleTest(integration.id)}
                                        disabled={testing === integration.id || !integration.isActive}
                                    >
                                        {testing === integration.id ? 'Testing...' : 'Test'}
                                    </Button>
                                    <button
                                        onClick={() => handleDelete(integration.id)}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg text-severity-critical hover:bg-severity-critical-bg transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Coming Soon */}
            <Card className="p-8 bg-bg-card border-border-secondary">
                <h2 className="text-base font-bold text-text-primary mb-6 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-accent-secondary"></span>
                    Available Integrations
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(INTEGRATION_CONFIG).map(([key, config]) => {
                        const isComingSoon = key === 'jira' || key === 'linear';
                        return (
                            <div
                                key={key}
                                className={clsx(
                                    'p-4 rounded-xl border flex items-center gap-4 transition-all',
                                    isComingSoon
                                        ? 'bg-bg-tertiary/50 border-border-secondary opacity-60'
                                        : 'bg-bg-tertiary border-border-primary hover:border-accent-primary/30'
                                )}
                            >
                                <div className={clsx('w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-sm', config.color)}>
                                    {config.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-sm font-semibold text-text-primary">{config.label}</h4>
                                        {isComingSoon && <Badge variant="neutral" size="xs" className="text-[10px] px-1.5 py-0">SOON</Badge>}
                                    </div>
                                    <p className="text-xs text-text-muted truncate">{config.hint}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>
        </div>
    );
}
