import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createProject } from '../services/api';
import { ArrowLeft, Upload, Link2, FileCode, CheckCircle, Shield, Globe, Zap } from 'lucide-react';
import { Button, Card, Input, Textarea, Badge } from '../components/ui';
import { clsx } from 'clsx';

export const CreateProject: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        specContent: '',
        specUrl: '',
        organizationId: '550e8400-e29b-41d4-a716-446655440000',
    });
    const [importMode, setImportMode] = useState<'url' | 'paste'>('url');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (!formData.name) throw new Error("Identifier required");
            await createProject({
                ...formData,
                specContent: importMode === 'paste' ? formData.specContent : undefined,
                specUrl: importMode === 'url' ? formData.specUrl : undefined
            });
            navigate('/');
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.error || err.message || 'Protocol initialization failed');
        } finally {
            setLoading(false);
        }
    };

    const steps = [
        { label: 'Identity', complete: !!formData.name },
        { label: 'Manifest', complete: (importMode === 'url' && !!formData.specUrl) || (importMode === 'paste' && !!formData.specContent) },
        { label: 'Authorize', complete: false },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-10 animate-fade-in relative">
            {/* Background Decorative Blur */}
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary-100/30 rounded-full blur-[120px] -z-10" />

            {/* Back Button */}
            <Link
                to="/"
                className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-zinc-900 transition-all group"
            >
                <div className="w-8 h-8 rounded-xl bg-white border border-zinc-200 flex items-center justify-center group-hover:bg-zinc-900 group-hover:text-white group-hover:border-zinc-900 transition-all shadow-sm">
                    <ArrowLeft className="w-4 h-4" />
                </div>
                Return to Matrix
            </Link>

            {/* Progress Matrix */}
            <div className="flex items-center justify-center gap-12 bg-white/40 backdrop-blur-md p-6 rounded-[32px] border border-zinc-200 inline-flex mx-auto shadow-sm">
                {steps.map((step, index) => (
                    <React.Fragment key={step.label}>
                        <div className="flex items-center gap-3">
                            <div className={clsx(
                                'w-10 h-10 rounded-2xl flex items-center justify-center text-[11px] font-black transition-all duration-500 border-2',
                                step.complete
                                    ? 'bg-emerald-500 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                                    : index === steps.findIndex(s => !s.complete)
                                        ? 'bg-zinc-900 border-zinc-800 text-primary-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                                        : 'bg-white border-zinc-100 text-zinc-300'
                            )}>
                                {step.complete ? <CheckCircle className="w-5 h-5" /> : `0${index + 1}`}
                            </div>
                            <span className={clsx(
                                'text-[11px] font-black uppercase tracking-widest hidden sm:block',
                                step.complete || index === steps.findIndex(s => !s.complete)
                                    ? 'text-zinc-900'
                                    : 'text-zinc-300'
                            )}>
                                {step.label}
                            </span>
                        </div>
                        {index < steps.length - 1 && (
                            <div className={clsx(
                                'w-12 h-0.5 rounded-full',
                                step.complete ? 'bg-emerald-500' : 'bg-zinc-100'
                            )} />
                        )}
                    </React.Fragment>
                ))}
            </div>

            {/* Main Form Matrix */}
            <Card className="p-12 border-zinc-200 shadow-2xl rounded-[48px] relative overflow-hidden">
                <div className="mb-10 relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center">
                            <Shield className="w-5 h-5 text-primary-400" />
                        </div>
                        <Badge variant="primary" size="sm" className="font-black uppercase tracking-widest">New Deployment</Badge>
                    </div>
                    <h1 className="text-4xl font-black text-zinc-900 tracking-tighter uppercase mb-2">Initialize Node</h1>
                    <p className="text-zinc-500 font-medium max-w-md">Sync your API manifest to establish an autonomous security perimeter.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-10 relative z-10">
                    {/* Project Name */}
                    <Input
                        label="Node Identifier"
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. CORE-PROD-AUTH"
                        className="py-6 px-8 rounded-3xl"
                        hint="Unique descriptor for the target API ecosystem"
                    />

                    {/* Import Method Toggle */}
                    <div className="space-y-4">
                        <label className="block text-[11px] font-black text-zinc-400 uppercase tracking-widest ml-1">
                            Ingestion Layer
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setImportMode('url')}
                                className={clsx(
                                    'flex flex-col items-center justify-center gap-3 p-8 rounded-[32px] border-2 transition-all duration-500',
                                    importMode === 'url'
                                        ? 'border-primary-500 bg-primary-50/50 text-primary-600 shadow-lg shadow-primary-500/10'
                                        : 'border-zinc-100 bg-zinc-50/50 hover:border-zinc-300 text-zinc-400'
                                )}
                            >
                                <Globe className={clsx("w-8 h-8 transition-all", importMode === 'url' ? "text-primary-500 scale-110" : "text-zinc-300")} />
                                <span className="font-black text-[10px] uppercase tracking-[0.2em]">Network URL</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setImportMode('paste')}
                                className={clsx(
                                    'flex flex-col items-center justify-center gap-3 p-8 rounded-[32px] border-2 transition-all duration-500',
                                    importMode === 'paste'
                                        ? 'border-primary-500 bg-primary-50/50 text-primary-600 shadow-lg shadow-primary-500/10'
                                        : 'border-zinc-100 bg-zinc-50/50 hover:border-zinc-300 text-zinc-400'
                                )}
                            >
                                <FileCode className={clsx("w-8 h-8 transition-all", importMode === 'paste' ? "text-primary-500 scale-110" : "text-zinc-300")} />
                                <span className="font-black text-[10px] uppercase tracking-[0.2em]">Manifest Code</span>
                            </button>
                        </div>
                    </div>

                    {/* URL Input or Textarea */}
                    <div className="animate-fade-in">
                        {importMode === 'url' ? (
                            <Input
                                label="Manifest Endpoint"
                                type="url"
                                leftIcon={<Link2 className="w-4 h-4" />}
                                placeholder="https://api.nexus.io/v1/openapi.json"
                                value={formData.specUrl}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, specUrl: e.target.value })}
                                className="py-6 pl-14 rounded-3xl"
                                hint="Deep-sync protocol for remote spec resolution"
                            />
                        ) : (
                            <Textarea
                                label="Manifest Raw Data"
                                rows={10}
                                placeholder={`openapi: 3.0.0\ninfo:\n  title: Nexus Protocol\n  version: 2.4.0`}
                                value={formData.specContent}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, specContent: e.target.value })}
                                hint="Direct kernel injection for locally stored manifests"
                                className="font-mono text-xs p-8 rounded-[32px] border-zinc-200"
                            />
                        )}
                    </div>

                    {/* Error Hub */}
                    {error && (
                        <div className="flex items-center gap-4 p-6 bg-red-50 border border-red-100 text-red-700 rounded-3xl animate-shake">
                            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-red-600 text-xs font-black">!</span>
                            </div>
                            <p className="text-[11px] font-black uppercase tracking-tight">{error}</p>
                        </div>
                    )}

                    {/* Commit Actions */}
                    <div className="flex items-center justify-end gap-4 pt-8 border-t border-zinc-100">
                        <Button variant="ghost" type="button" onClick={() => navigate('/')} className="px-8 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] text-zinc-400 hover:text-zinc-900">
                            Abort
                        </Button>
                        <Button
                            type="submit"
                            isLoading={loading}
                            className="px-12 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary-500/20"
                            leftIcon={<Upload className="w-4 h-4" />}
                        >
                            {loading ? 'Initializing...' : 'Commit Node'}
                        </Button>
                    </div>
                </form>
            </Card>

            {/* Support Matrix */}
            <div className="grid md:grid-cols-2 gap-8">
                <Card className="bg-zinc-900 border-none text-white p-8 rounded-[32px] relative overflow-hidden group cursor-help">
                    <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-primary-500/20 rounded-full blur-[40px] group-hover:bg-primary-500/30 transition-all duration-700" />
                    <div className="relative z-10">
                        <h3 className="text-lg font-black tracking-tight mb-2 uppercase">Protocol Specifications</h3>
                        <p className="text-[11px] font-medium text-zinc-400 mb-6 leading-relaxed">
                            VULX Core supports OAS 2.0 (Swagger) and 3.x manifests in JSON or YAML. Automated conversion logic applied during ingestion.
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <a
                                href="https://petstore.swagger.io/v2/swagger.json"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[9px] font-black bg-white/5 px-4 py-2 rounded-xl border border-white/10 text-primary-400 hover:bg-white/10 transition-all uppercase tracking-widest"
                            >
                                Sample Node →
                            </a>
                        </div>
                    </div>
                </Card>

                <Card className="bg-white border-zinc-200 p-8 rounded-[32px] group">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-all">
                            <Zap className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-black tracking-tight uppercase">Instant Scan</h3>
                    </div>
                    <p className="text-[11px] font-medium text-zinc-500 mb-6 leading-relaxed">
                        Nodes are initialized with an immediate validation sequence. Security findings will populate the audit matrix within seconds.
                    </p>
                    <div className="h-1 flex-1 bg-zinc-100 rounded-full overflow-hidden">
                        <div className="h-full bg-primary-500 w-1/3 group-hover:w-full transition-all duration-1000 ease-out" />
                    </div>
                </Card>
            </div>
        </div>
    );
};
