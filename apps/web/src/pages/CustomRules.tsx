import { useState, useEffect } from 'react';
import api from '../services/api';
import { Card, CardHeader, Button, Badge, SeverityBadge } from '../components/ui';
import {
    Plus,
    X,
    Edit2,
    Trash2,
    Play,
    CheckCircle,
    XCircle,
    ToggleLeft,
    ToggleRight,
    FileCode,
    Search,
    Target,
    FileText
} from 'lucide-react';
import { clsx } from 'clsx';

interface CustomRule {
    id: string;
    name: string;
    description: string;
    pattern: string;
    patternType: 'regex' | 'contains' | 'exact' | 'json_path';
    target: 'request' | 'response' | 'header' | 'body' | 'url';
    severity: string;
    isActive: boolean;
    message: string;
    createdAt: string;
}

const PATTERN_TYPES = [
    { value: 'regex', label: 'Regular Expression', icon: <FileCode className="w-4 h-4" /> },
    { value: 'contains', label: 'Contains Text', icon: <Search className="w-4 h-4" /> },
    { value: 'exact', label: 'Exact Match', icon: <Target className="w-4 h-4" /> },
    { value: 'json_path', label: 'JSON Path', icon: <FileText className="w-4 h-4" /> },
];

const TARGETS = [
    { value: 'response', label: 'Response Body' },
    { value: 'request', label: 'Request Body' },
    { value: 'header', label: 'Headers' },
    { value: 'url', label: 'URL' },
];

const SEVERITY_OPTIONS = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'];

export function CustomRules() {
    const [rules, setRules] = useState<CustomRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingRule, setEditingRule] = useState<CustomRule | null>(null);
    const [testResult, setTestResult] = useState<{ matches: boolean; details?: string } | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        pattern: '',
        patternType: 'contains' as 'regex' | 'contains' | 'exact' | 'json_path',
        target: 'response' as 'request' | 'response' | 'header' | 'body' | 'url',
        severity: 'MEDIUM',
        message: '',
        testInput: '',
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchRules();
    }, []);

    const fetchRules = async () => {
        try {
            const response = await api.get('/rules');
            setRules(response.data);
        } catch (err) {
            console.error('Failed to fetch rules:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            if (editingRule) {
                await api.put(`/rules/${editingRule.id}`, formData);
                setSuccess('Rule updated successfully!');
            } else {
                await api.post('/rules', formData);
                setSuccess('Rule created successfully!');
            }
            resetForm();
            fetchRules();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to save rule');
        }
    };

    const handleEdit = (rule: CustomRule) => {
        setEditingRule(rule);
        setFormData({
            name: rule.name,
            description: rule.description,
            pattern: rule.pattern,
            patternType: rule.patternType,
            target: rule.target,
            severity: rule.severity,
            message: rule.message,
            testInput: '',
        });
        setShowForm(true);
        setTestResult(null);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this rule?')) return;
        try {
            await api.delete(`/rules/${id}`);
            fetchRules();
            setSuccess('Rule deleted');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to delete rule');
        }
    };

    const handleToggle = async (rule: CustomRule) => {
        try {
            await api.put(`/rules/${rule.id}`, { isActive: !rule.isActive });
            fetchRules();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to toggle rule');
        }
    };

    const handleTest = async () => {
        if (!formData.pattern || !formData.testInput) {
            setError('Please provide both a pattern and test input');
            return;
        }

        try {
            const response = await api.post('/rules/test', {
                pattern: formData.pattern,
                patternType: formData.patternType,
                testInput: formData.testInput,
            });
            setTestResult(response.data);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to test pattern');
        }
    };

    const resetForm = () => {
        setShowForm(false);
        setEditingRule(null);
        setFormData({
            name: '',
            description: '',
            pattern: '',
            patternType: 'contains',
            target: 'response',
            severity: 'MEDIUM',
            message: '',
            testInput: '',
        });
        setTestResult(null);
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-10 w-48 skeleton rounded-lg" />
                <div className="grid md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-48 skeleton rounded-xl" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Custom Scan Rules</h1>
                    <p className="text-slate-500 mt-1">Define custom patterns to detect in your API responses</p>
                </div>
                <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowForm(true)}>
                    Create Rule
                </Button>
            </div>

            {/* Alerts */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    {error}
                </div>
            )}
            {success && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-700 text-sm flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    {success}
                </div>
            )}

            {/* Modal Form */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <Card className="w-full max-w-2xl my-8 animate-fade-in">
                        <CardHeader
                            title={editingRule ? 'Edit Rule' : 'Create Rule'}
                            action={
                                <button onClick={resetForm} className="p-2 hover:bg-slate-100 rounded-lg">
                                    <X className="w-5 h-5 text-slate-500" />
                                </button>
                            }
                        />
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Rule Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g., API Key Exposure"
                                        required
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Severity</label>
                                    <select
                                        value={formData.severity}
                                        onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        {SEVERITY_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="What does this rule detect?"
                                    rows={2}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Pattern Type</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    {PATTERN_TYPES.map(pt => (
                                        <button
                                            key={pt.value}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, patternType: pt.value as any })}
                                            className={clsx(
                                                'flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 text-sm font-medium transition-all',
                                                formData.patternType === pt.value
                                                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                                            )}
                                        >
                                            {pt.icon}
                                            <span className="hidden sm:inline">{pt.label.split(' ')[0]}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Target</label>
                                    <select
                                        value={formData.target}
                                        onChange={(e) => setFormData({ ...formData, target: e.target.value as any })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        {TARGETS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Pattern</label>
                                    <input
                                        type="text"
                                        value={formData.pattern}
                                        onChange={(e) => setFormData({ ...formData, pattern: e.target.value })}
                                        placeholder={formData.patternType === 'regex' ? 'sk_live_[a-zA-Z0-9]+' : 'password'}
                                        required
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Alert Message</label>
                                <input
                                    type="text"
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    placeholder="e.g., Potential API key exposed in response"
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            {/* Test Section */}
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Test Your Pattern</label>
                                <textarea
                                    value={formData.testInput}
                                    onChange={(e) => setFormData({ ...formData, testInput: e.target.value })}
                                    placeholder="Paste sample content to test against..."
                                    rows={3}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-mono text-sm"
                                />
                                <div className="flex items-center justify-between mt-3">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        leftIcon={<Play className="w-4 h-4" />}
                                        onClick={handleTest}
                                    >
                                        Test Pattern
                                    </Button>
                                    {testResult && (
                                        <div className={clsx(
                                            'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium',
                                            testResult.matches ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                        )}>
                                            {testResult.matches ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                            {testResult.matches ? 'Pattern matches!' : 'No match found'}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <Button type="button" variant="secondary" onClick={resetForm}>Cancel</Button>
                                <Button type="submit" variant="primary">
                                    {editingRule ? 'Update Rule' : 'Create Rule'}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}

            {/* Rules List */}
            {rules.length === 0 ? (
                <Card className="text-center py-16">
                    <FileCode className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No custom rules defined</h3>
                    <p className="text-slate-500 mb-6">Create rules to detect custom patterns in your API responses</p>
                    <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowForm(true)}>
                        Create Your First Rule
                    </Button>
                </Card>
            ) : (
                <div className="grid md:grid-cols-2 gap-4">
                    {rules.map(rule => (
                        <Card
                            key={rule.id}
                            className={clsx('transition-all', !rule.isActive && 'opacity-60')}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <h3 className="font-semibold text-slate-900">{rule.name}</h3>
                                    <SeverityBadge severity={rule.severity as any} size="sm" />
                                </div>
                                <button
                                    onClick={() => handleToggle(rule)}
                                    className="text-slate-400 hover:text-slate-600"
                                >
                                    {rule.isActive ? (
                                        <ToggleRight className="w-6 h-6 text-emerald-500" />
                                    ) : (
                                        <ToggleLeft className="w-6 h-6" />
                                    )}
                                </button>
                            </div>

                            <p className="text-sm text-slate-500 mb-3">{rule.description || 'No description'}</p>

                            <div className="flex flex-wrap gap-2 mb-3">
                                <Badge variant="default" size="sm">
                                    {PATTERN_TYPES.find(p => p.value === rule.patternType)?.label}
                                </Badge>
                                <Badge variant="info" size="sm">
                                    {TARGETS.find(t => t.value === rule.target)?.label}
                                </Badge>
                            </div>

                            <div className="bg-slate-50 rounded-lg px-3 py-2 mb-4">
                                <code className="text-xs font-mono text-slate-700 break-all">{rule.pattern}</code>
                            </div>

                            <div className="flex gap-2 pt-3 border-t border-slate-100">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                                    onClick={() => handleEdit(rule)}
                                >
                                    Edit
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                                    onClick={() => handleDelete(rule.id)}
                                    className="text-red-500 hover:bg-red-50"
                                >
                                    Delete
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
