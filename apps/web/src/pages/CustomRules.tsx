import { useState, useEffect } from 'react';
import api from '../services/api';
import { Card, Button, Badge, SeverityBadge } from '../components/ui';
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
    FileText,
    Shield,
    Database,
    Zap,
    Cpu
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
                setSuccess('Logic sequence updated');
            } else {
                await api.post('/rules', formData);
                setSuccess('Logic sequence deployed');
            }
            resetForm();
            fetchRules();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to commit logic');
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
        if (!confirm('Purge this logic sequence?')) return;
        try {
            await api.delete(`/rules/${id}`);
            fetchRules();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Purge failed');
        }
    };

    const handleToggle = async (rule: CustomRule) => {
        try {
            await api.put(`/rules/${rule.id}`, { isActive: !rule.isActive });
            fetchRules();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Toggle failed');
        }
    };

    const handleTest = async () => {
        if (!formData.pattern || !formData.testInput) {
            setError('Missing pattern or telemetry input');
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
            setError(err.response?.data?.error || 'Simulation failed');
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
            <div className="max-w-4xl mx-auto space-y-10 animate-pulse p-8">
                <div className="h-10 w-64 bg-zinc-200 rounded-2xl mb-12" />
                <div className="grid md:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-64 bg-zinc-100 rounded-[40px]" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-12 animate-fade-in relative pb-20">
            {/* Background Blur */}
            <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] bg-primary-100/30 rounded-full blur-[100px] -z-10" />

            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-8">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Cpu className="w-4 h-4 text-zinc-400" />
                        <span className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">Neural Logic Matrix</span>
                    </div>
                    <h1 className="text-3xl font-black text-zinc-900 tracking-tight uppercase">Custom Heuristics</h1>
                </div>
                <Button className="px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary-500/20" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowForm(true)}>
                    Inject Logic
                </Button>
            </div>

            {/* Messages */}
            {error && (
                <div className="bg-red-50 border border-red-100 rounded-3xl p-6 text-red-700 font-black text-[11px] uppercase tracking-widest flex items-center gap-4 animate-shake">
                    <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center text-red-600">!</div>
                    {error}
                </div>
            )}
            {success && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6 text-emerald-700 font-black text-[11px] uppercase tracking-widest flex items-center gap-4 animate-fade-in">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">✓</div>
                    {success}
                </div>
            )}

            {/* Form Overlay */}
            {showForm && (
                <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center z-[100] p-6 overflow-y-auto">
                    <Card className="w-full max-w-3xl my-8 animate-scale-in p-10 border-zinc-200 bg-white rounded-[48px] shadow-2xl">
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <h2 className="text-2xl font-black text-zinc-900 tracking-tight uppercase">{editingRule ? 'Modify Logic' : 'Provision Logic'}</h2>
                                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mt-1">Heuristic Pattern Definition</p>
                            </div>
                            <button onClick={resetForm} className="w-10 h-10 flex items-center justify-center bg-zinc-50 text-zinc-400 hover:text-zinc-900 rounded-xl transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="block text-[11px] font-black text-zinc-400 uppercase tracking-widest ml-1">Logic Identifier</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="EXPOSURE_PROTOCOL_7"
                                        required
                                        className="w-full px-6 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-zinc-900 font-bold placeholder-zinc-300 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/50 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[11px] font-black text-zinc-400 uppercase tracking-widest ml-1">Threat Level</label>
                                    <select
                                        value={formData.severity}
                                        onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                                        className="w-full px-6 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-zinc-900 font-bold focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/50 transition-all appearance-none"
                                    >
                                        {SEVERITY_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[11px] font-black text-zinc-400 uppercase tracking-widest ml-1">Protocol Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Define the scope and impact of this heuristic encounter..."
                                    rows={2}
                                    className="w-full px-6 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-zinc-900 font-bold placeholder-zinc-300 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/50 transition-all resize-none"
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="block text-[11px] font-black text-zinc-400 uppercase tracking-widest ml-1">Extraction Methodology</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {PATTERN_TYPES.map(pt => (
                                        <button
                                            key={pt.value}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, patternType: pt.value as any })}
                                            className={clsx(
                                                'flex flex-col items-center gap-3 p-5 rounded-[24px] border-2 transition-all duration-300',
                                                formData.patternType === pt.value
                                                    ? 'border-zinc-900 bg-zinc-900 text-primary-400 shadow-lg shadow-zinc-900/20'
                                                    : 'border-zinc-100 bg-white text-zinc-400 hover:border-zinc-200'
                                            )}
                                        >
                                            {pt.icon}
                                            <span className="text-[9px] font-black uppercase tracking-widest">{pt.label.split(' ')[0]}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="block text-[11px] font-black text-zinc-400 uppercase tracking-widest ml-1">Target Dimension</label>
                                    <select
                                        value={formData.target}
                                        onChange={(e) => setFormData({ ...formData, target: e.target.value as any })}
                                        className="w-full px-6 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-zinc-900 font-bold focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/50 transition-all appearance-none"
                                    >
                                        {TARGETS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[11px] font-black text-zinc-400 uppercase tracking-widest ml-1">Neural Pattern</label>
                                    <input
                                        type="text"
                                        value={formData.pattern}
                                        onChange={(e) => setFormData({ ...formData, pattern: e.target.value })}
                                        placeholder={formData.patternType === 'regex' ? 'sk_live_[a-zA-Z0-9]+' : 'leak_detector'}
                                        required
                                        className="w-full px-6 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-zinc-900 font-mono text-sm focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/50 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[11px] font-black text-zinc-400 uppercase tracking-widest ml-1">Dispatched Alert Message</label>
                                <input
                                    type="text"
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    placeholder="THREAT_FOUND: Critical data entropy detected in response body"
                                    className="w-full px-6 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-zinc-900 font-bold placeholder-zinc-300 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/50 transition-all"
                                />
                            </div>

                            {/* Simulation Hub */}
                            <div className="bg-zinc-950 rounded-[32px] p-8 border border-zinc-800 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-[0.05] group-hover:scale-110 transition-transform duration-700">
                                    <Zap className="w-20 h-20 text-primary-400" />
                                </div>
                                <label className="block text-[11px] font-black text-zinc-500 uppercase tracking-widest ml-1 mb-4 relative z-10">Simulation Sandbox</label>
                                <textarea
                                    value={formData.testInput}
                                    onChange={(e) => setFormData({ ...formData, testInput: e.target.value })}
                                    placeholder="Paste raw telemetry data for diagnostic simulation..."
                                    rows={4}
                                    className="w-full px-6 py-4 bg-black/50 border border-zinc-800 rounded-2xl text-primary-400 font-mono text-sm focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/50 transition-all resize-none relative z-10"
                                />
                                <div className="flex items-center justify-between mt-6 relative z-10">
                                    <Button
                                        type="button"
                                        className="px-8 py-4 rounded-xl font-black uppercase tracking-widest text-[9px] shadow-lg shadow-primary-500/20"
                                        leftIcon={<Play className="w-4 h-4" />}
                                        onClick={handleTest}
                                    >
                                        Run Simulation
                                    </Button>
                                    {testResult && (
                                        <div className={clsx(
                                            'flex items-center gap-3 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl transition-all animate-fade-in',
                                            testResult.matches ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-red-500 text-white shadow-red-500/20'
                                        )}>
                                            {testResult.matches ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                            {testResult.matches ? 'Pattern Recognized' : 'Noise Floor Only'}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4 border-t border-zinc-100">
                                <Button type="button" variant="secondary" onClick={resetForm} className="flex-1 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] bg-zinc-50 border-zinc-100 text-zinc-400 hover:text-zinc-900">Abort</Button>
                                <Button type="submit" className="flex-1 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary-500/20">
                                    {editingRule ? 'Commit Changes' : 'Inject Logic'}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}

            {/* Heuristics Matrix */}
            {rules.length === 0 ? (
                <Card className="text-center py-24 border-zinc-200 bg-zinc-50/50 rounded-[48px]">
                    <div className="w-20 h-20 rounded-[32px] bg-white border border-zinc-200 flex items-center justify-center mx-auto mb-8 shadow-sm">
                        <Database className="w-10 h-10 text-zinc-200" />
                    </div>
                    <h3 className="text-2xl font-black text-zinc-900 tracking-tight uppercase mb-4">Neural Logic Empty</h3>
                    <p className="text-zinc-500 font-medium mb-10 max-w-sm mx-auto leading-relaxed">No custom heuristics detected. Inject logic sequences to identify hyper-specific threat patterns.</p>
                    <Button className="px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-[11px]" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowForm(true)}>
                        Deploy First Rule
                    </Button>
                </Card>
            ) : (
                <div className="grid md:grid-cols-2 gap-8">
                    {rules.map(rule => (
                        <Card
                            key={rule.id}
                            className={clsx(
                                'p-8 rounded-[40px] border-zinc-200 shadow-xl transition-all duration-500 group relative overflow-hidden',
                                !rule.isActive && 'opacity-40 grayscale pointer-events-none'
                            )}
                        >
                            <div className="absolute top-0 right-0 p-6 opacity-[0.05] group-hover:scale-110 transition-transform duration-700">
                                <Shield className="w-20 h-20 text-zinc-900" />
                            </div>

                            <div className="relative z-10 flex flex-col gap-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-xl font-black text-zinc-900 tracking-tight uppercase truncate">{rule.name}</h3>
                                            <SeverityBadge severity={rule.severity as any} className="font-black text-[8px] uppercase tracking-widest px-3" />
                                        </div>
                                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Protocol Index: {rule.id.slice(0, 8)}</p>
                                    </div>
                                    <button
                                        onClick={() => handleToggle(rule)}
                                        className="w-12 h-12 flex items-center justify-center bg-zinc-50 rounded-2xl hover:bg-zinc-100 transition-all pointer-events-auto shadow-inner"
                                    >
                                        {rule.isActive ? (
                                            <ToggleRight className="w-8 h-8 text-emerald-500" />
                                        ) : (
                                            <ToggleLeft className="w-8 h-8 text-zinc-300" />
                                        )}
                                    </button>
                                </div>

                                <p className="text-xs font-medium text-zinc-500 leading-relaxed min-h-[3rem] line-clamp-2">{rule.description || 'No meta-description provided for this heuristic.'}</p>

                                <div className="flex flex-wrap gap-2">
                                    <Badge variant="neutral" size="sm" className="font-black uppercase tracking-widest text-[8px] bg-zinc-100 border-none px-4 py-2">
                                        {PATTERN_TYPES.find(p => p.value === rule.patternType)?.label.split(' ')[0]}
                                    </Badge>
                                    <Badge variant="primary" size="sm" className="font-black uppercase tracking-widest text-[8px] px-4 py-2">
                                        TARGET: {rule.target}
                                    </Badge>
                                </div>

                                <div className="bg-zinc-950 rounded-2xl p-5 group-hover:bg-zinc-950 transition-colors shadow-inner border border-zinc-900">
                                    <code className="text-xs font-mono text-primary-400 break-all tracking-tighter">{rule.pattern}</code>
                                </div>

                                <div className="flex gap-3 pt-6 border-t border-zinc-100 pointer-events-auto">
                                    <Button
                                        variant="secondary"
                                        className="flex-1 py-4 rounded-xl font-black uppercase tracking-widest text-[9px] bg-zinc-50 border-zinc-100 text-zinc-500 hover:text-zinc-900 hover:bg-white hover:shadow-lg transition-all"
                                        leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                                        onClick={() => handleEdit(rule)}
                                    >
                                        Modify Logic
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={() => handleDelete(rule.id)}
                                        className="w-14 py-4 rounded-xl bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all border border-red-100/50 shadow-sm"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
