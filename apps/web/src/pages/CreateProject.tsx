import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createProject } from '../services/api';
import { ArrowLeft, Upload, Link2, FileCode, CheckCircle } from 'lucide-react';
import { Button, Card, Input, Textarea } from '../components/ui';
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
            if (!formData.name) throw new Error("Name is required");
            await createProject({
                ...formData,
                specContent: importMode === 'paste' ? formData.specContent : undefined,
                specUrl: importMode === 'url' ? formData.specUrl : undefined
            });
            navigate('/');
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.error || err.message || 'Failed to create project');
        } finally {
            setLoading(false);
        }
    };

    const steps = [
        { label: 'Project Info', complete: !!formData.name },
        { label: 'API Spec', complete: (importMode === 'url' && !!formData.specUrl) || (importMode === 'paste' && !!formData.specContent) },
        { label: 'Create', complete: false },
    ];

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Back Button */}
            <Link
                to="/"
                className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
            </Link>

            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-2">
                {steps.map((step, index) => (
                    <React.Fragment key={step.label}>
                        <div className="flex items-center gap-2">
                            <div className={clsx(
                                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                                step.complete
                                    ? 'bg-emerald-500 text-white'
                                    : index === steps.findIndex(s => !s.complete)
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-slate-100 text-slate-400'
                            )}>
                                {step.complete ? <CheckCircle className="w-4 h-4" /> : index + 1}
                            </div>
                            <span className={clsx(
                                'text-sm font-medium hidden sm:block',
                                step.complete || index === steps.findIndex(s => !s.complete)
                                    ? 'text-slate-900'
                                    : 'text-slate-400'
                            )}>
                                {step.label}
                            </span>
                        </div>
                        {index < steps.length - 1 && (
                            <div className={clsx(
                                'w-12 h-0.5',
                                step.complete ? 'bg-emerald-500' : 'bg-slate-200'
                            )} />
                        )}
                    </React.Fragment>
                ))}
            </div>

            {/* Main Form Card */}
            <Card className="p-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-900">Create New Project</h1>
                    <p className="text-slate-500 mt-1">Import your OpenAPI specification to start scanning.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Project Name */}
                    <Input
                        label="Project Name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="My API Project"
                        hint="Give your project a memorable name"
                    />

                    {/* Import Method Toggle */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-3">
                            Import Method
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setImportMode('url')}
                                className={clsx(
                                    'flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all',
                                    importMode === 'url'
                                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                                )}
                            >
                                <Link2 className="w-5 h-5" />
                                <span className="font-medium">From URL</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setImportMode('paste')}
                                className={clsx(
                                    'flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all',
                                    importMode === 'paste'
                                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                                )}
                            >
                                <FileCode className="w-5 h-5" />
                                <span className="font-medium">Paste Spec</span>
                            </button>
                        </div>
                    </div>

                    {/* URL Input or Textarea */}
                    {importMode === 'url' ? (
                        <Input
                            label="OpenAPI Specification URL"
                            type="url"
                            leftIcon={<Link2 className="w-4 h-4" />}
                            placeholder="https://petstore.swagger.io/v2/swagger.json"
                            value={formData.specUrl}
                            onChange={(e) => setFormData({ ...formData, specUrl: e.target.value })}
                            hint="We'll automatically fetch and parse the spec from this URL"
                        />
                    ) : (
                        <Textarea
                            label="OpenAPI Spec Content"
                            rows={12}
                            placeholder={`{
  "openapi": "3.0.0",
  "info": {
    "title": "My API",
    "version": "1.0.0"
  },
  ...
}`}
                            value={formData.specContent}
                            onChange={(e) => setFormData({ ...formData, specContent: e.target.value })}
                            hint="Paste the raw content of your swagger.json or openapi.yaml"
                            className="font-mono text-sm"
                        />
                    )}

                    {/* Error Display */}
                    {error && (
                        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl">
                            <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-red-600 text-xs font-bold">!</span>
                            </div>
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                        <Button variant="ghost" type="button" onClick={() => navigate('/')}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            isLoading={loading}
                            leftIcon={<Upload className="w-4 h-4" />}
                        >
                            {loading ? 'Creating...' : 'Create Project'}
                        </Button>
                    </div>
                </form>
            </Card>

            {/* Help Section */}
            <Card className="bg-slate-50 border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-2">Need help?</h3>
                <p className="text-sm text-slate-600 mb-3">
                    VULX supports OpenAPI 2.0 (Swagger) and 3.x specifications in JSON or YAML format.
                </p>
                <div className="flex flex-wrap gap-2">
                    <a
                        href="https://petstore.swagger.io/v2/swagger.json"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-white px-3 py-1.5 rounded-full border border-slate-200 text-indigo-600 hover:bg-indigo-50 transition-colors"
                    >
                        Try Petstore API →
                    </a>
                    <a
                        href="https://swagger.io/specification/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-white px-3 py-1.5 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                        OpenAPI Docs →
                    </a>
                </div>
            </Card>
        </div>
    );
};
