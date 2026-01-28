import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getProject, deleteProject, getApiKeys, generateApiKey, deleteApiKey, updateProject } from '../services/api';
import type { Project, ApiKey } from '../types';
import {
    ArrowLeft,
    Trash2,
    Key,
    Copy,
    Check,
    Eye,
    EyeOff,
    RefreshCw,
    Save,
    AlertTriangle,
    Globe,
    Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardHeader, Button } from '../components/ui';
import { clsx } from 'clsx';

export const ProjectSettings: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);

    // API Keys State
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
    const [newKey, setNewKey] = useState<string | null>(null);
    const [generatingKey, setGeneratingKey] = useState(false);
    const [copied, setCopied] = useState(false);
    const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});

    // Form State
    const [targetUrl, setTargetUrl] = useState('');
    const [scanFrequency, setScanFrequency] = useState<'MANUAL' | 'DAILY' | 'WEEKLY'>('MANUAL');
    const [saving, setSaving] = useState(false);

    const fetchProjectData = async () => {
        if (!id) return;
        try {
            const [projectData, keysData] = await Promise.all([
                getProject(id),
                getApiKeys(id)
            ]);
            setProject(projectData);
            setApiKeys(keysData);
            setTargetUrl(projectData.targetUrl || '');
            setScanFrequency(projectData.scanFrequency || 'MANUAL');
        } catch (error) {
            console.error('Failed to fetch project settings', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjectData();
    }, [id]);

    const handleUpdateProject = async () => {
        if (!project) return;
        setSaving(true);
        try {
            await updateProject(project.id, { targetUrl, scanFrequency });
            await fetchProjectData();
            alert('Settings saved successfully');
        } catch (error) {
            console.error('Failed to update project', error);
            alert('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteProject = async () => {
        if (!project) return;
        if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
            return;
        }

        setDeleting(true);
        try {
            await deleteProject(project.id);
            navigate('/');
        } catch (error) {
            console.error('Failed to delete project', error);
            alert('Failed to delete project');
        } finally {
            setDeleting(false);
        }
    };

    const handleGenerateKey = async (environment: 'SANDBOX' | 'PRODUCTION') => {
        if (!project) return;

        const existingKey = apiKeys.find(k => k.type === environment);
        if (existingKey) {
            if (!window.confirm(`Are you sure? This will REVOKE the existing ${environment} key immediately.`)) {
                return;
            }
        }

        setGeneratingKey(true);
        try {
            const newApiKey = await generateApiKey(project.id, environment);
            setNewKey(newApiKey.key);
            setVisibleKeys({});
            await fetchProjectData();
        } catch (error) {
            console.error('Failed to generate key', error);
            alert('Failed to generate API Key');
        } finally {
            setGeneratingKey(false);
        }
    };

    const handleDeleteKey = async (keyId: string) => {
        if (!project || !window.confirm('Are you sure you want to delete this API Key?')) return;
        try {
            await deleteApiKey(project.id, keyId);
            await fetchProjectData();
        } catch (error) {
            console.error('Failed to delete key', error);
        }
    };

    const toggleKeyVisibility = (keyId: string) => {
        setVisibleKeys(prev => ({ ...prev, [keyId]: !prev[keyId] }));
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="h-8 w-48 skeleton rounded mb-4" />
                <div className="h-64 skeleton rounded-xl" />
                <div className="h-64 skeleton rounded-xl" />
            </div>
        );
    }

    if (!project) {
        return (
            <div className="text-center py-16">
                <h2 className="text-xl font-semibold text-slate-900">Project not found</h2>
                <Link to="/" className="text-indigo-600 hover:underline mt-2 inline-block">
                    Return to Dashboard
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(`/projects/${id}`)}
                    className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Project Settings</h1>
                    <p className="text-slate-500 text-sm mt-0.5">Configure {project.name}</p>
                </div>
            </div>

            {/* General Settings */}
            <Card>
                <CardHeader
                    title="General Configuration"
                    icon={<Globe className="w-5 h-5 text-slate-400" />}
                />
                <div className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Target URL</label>
                        <input
                            type="url"
                            value={targetUrl}
                            onChange={(e) => setTargetUrl(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            placeholder="https://api.example.com"
                        />
                        <p className="mt-1.5 text-xs text-slate-500">The base URL used for vulnerability scans.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Scan Frequency</label>
                        <div className="grid grid-cols-3 gap-3">
                            {(['MANUAL', 'DAILY', 'WEEKLY'] as const).map((freq) => (
                                <button
                                    key={freq}
                                    type="button"
                                    onClick={() => setScanFrequency(freq)}
                                    className={clsx(
                                        'px-4 py-3 rounded-xl border-2 font-medium text-sm transition-all',
                                        scanFrequency === freq
                                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                            : 'border-slate-200 hover:border-slate-300 text-slate-600'
                                    )}
                                >
                                    {freq === 'MANUAL' ? '🎯 Manual' : freq === 'DAILY' ? '📅 Daily' : '📆 Weekly'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-slate-100">
                        <Button
                            variant="primary"
                            onClick={handleUpdateProject}
                            isLoading={saving}
                            leftIcon={<Save className="w-4 h-4" />}
                        >
                            Save Changes
                        </Button>
                    </div>
                </div>
            </Card>

            {/* API Keys */}
            <Card>
                <CardHeader
                    title="Integration & API Keys"
                    icon={<Key className="w-5 h-5 text-slate-400" />}
                />
                <p className="text-sm text-slate-500 mb-6">Manage API keys for CI/CD integration.</p>

                {newKey && (
                    <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="text-sm font-semibold text-emerald-800">New API Key Generated</h4>
                                <p className="text-xs text-emerald-600 mt-1">
                                    Copy this key now. You won't be able to see it again!
                                </p>
                            </div>
                            <button
                                onClick={() => setNewKey(null)}
                                className="text-emerald-600 hover:text-emerald-800 text-xs font-medium"
                            >
                                Dismiss
                            </button>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                            <code className="flex-1 bg-white border border-emerald-300 rounded-lg px-3 py-2 font-mono text-sm break-all">
                                {newKey}
                            </code>
                            <button
                                onClick={() => copyToClipboard(newKey)}
                                className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
                            >
                                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                    {(['PRODUCTION', 'SANDBOX'] as const).map(env => {
                        const existing = apiKeys.find(k => k.type === env);
                        const isProd = env === 'PRODUCTION';

                        return (
                            <div
                                key={env}
                                className={clsx(
                                    'rounded-xl p-5 border-2',
                                    isProd ? 'bg-indigo-50/50 border-indigo-200' : 'bg-emerald-50/50 border-emerald-200'
                                )}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <span className={clsx(
                                            'w-2.5 h-2.5 rounded-full',
                                            isProd ? 'bg-indigo-500' : 'bg-emerald-500'
                                        )} />
                                        <h4 className="text-sm font-semibold text-slate-900">{env}</h4>
                                    </div>
                                    {existing && (
                                        <span className="text-xs text-slate-500">
                                            <Clock className="w-3 h-3 inline mr-1" />
                                            {format(new Date(existing.createdAt), 'MMM d, yyyy')}
                                        </span>
                                    )}
                                </div>

                                {existing ? (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <div className="relative flex-1">
                                                <input
                                                    type={visibleKeys[existing.id] ? "text" : "password"}
                                                    readOnly
                                                    value={existing.key}
                                                    className="w-full text-xs font-mono border border-slate-200 rounded-lg px-3 py-2 bg-white pr-10"
                                                />
                                                <button
                                                    onClick={() => toggleKeyVisibility(existing.id)}
                                                    className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-slate-600"
                                                >
                                                    {visibleKeys[existing.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => copyToClipboard(existing.key)}
                                                className="p-2 text-slate-400 hover:text-indigo-600 bg-white border border-slate-200 rounded-lg transition-colors"
                                            >
                                                <Copy className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteKey(existing.id)}
                                                className="p-2 text-slate-400 hover:text-red-600 bg-white border border-slate-200 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="w-full"
                                            onClick={() => handleGenerateKey(env)}
                                            disabled={generatingKey}
                                            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                                        >
                                            Rotate Key
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <p className="text-xs text-slate-500 mb-4">No active key configured</p>
                                        <Button
                                            variant={isProd ? 'primary' : 'success'}
                                            size="sm"
                                            className="w-full"
                                            onClick={() => handleGenerateKey(env)}
                                            disabled={generatingKey}
                                            leftIcon={<Key className="w-3.5 h-3.5" />}
                                        >
                                            Generate Key
                                        </Button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </Card>

            {/* Danger Zone */}
            <Card className="border-red-200 bg-red-50/50">
                <CardHeader
                    title="Danger Zone"
                    icon={<AlertTriangle className="w-5 h-5 text-red-500" />}
                />
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="text-sm font-semibold text-red-800">Delete Project</h4>
                        <p className="text-sm text-red-600 mt-1">
                            Permanently delete this project and all scans, findings, and history.
                        </p>
                    </div>
                    <Button
                        variant="danger"
                        onClick={handleDeleteProject}
                        isLoading={deleting}
                        leftIcon={<Trash2 className="w-4 h-4" />}
                    >
                        Delete Project
                    </Button>
                </div>
            </Card>
        </div>
    );
};
