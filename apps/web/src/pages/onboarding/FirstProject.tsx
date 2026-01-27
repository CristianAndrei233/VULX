import { useState } from 'react';
import { ArrowLeft, ArrowRight, FolderPlus, Link, FileCode } from 'lucide-react';
import { useOnboarding } from '../../context/OnboardingContext';

type InputMethod = 'url' | 'paste';

export function FirstProject() {
  const { nextStep, prevStep, completeOnboarding } = useOnboarding();
  const [projectName, setProjectName] = useState('');
  const [inputMethod, setInputMethod] = useState<InputMethod>('url');
  const [specUrl, setSpecUrl] = useState('');
  const [specContent, setSpecContent] = useState('');
  const [errors, setErrors] = useState<{ name?: string; spec?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const newErrors: { name?: string; spec?: string } = {};

    if (!projectName.trim()) {
      newErrors.name = 'Project name is required';
    }

    if (inputMethod === 'url' && !specUrl.trim()) {
      newErrors.spec = 'OpenAPI specification URL is required';
    } else if (inputMethod === 'paste' && !specContent.trim()) {
      newErrors.spec = 'OpenAPI specification content is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsLoading(true);
    try {
      // In a real app, this would create the project via API
      await new Promise(resolve => setTimeout(resolve, 1000));
      await completeOnboarding();
      nextStep();
    } catch {
      setErrors({ spec: 'Failed to create project. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    setIsLoading(true);
    try {
      await completeOnboarding();
      nextStep();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600/20 rounded-full mb-4">
            <FolderPlus className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Create your first project
          </h1>
          <p className="text-slate-400">
            Connect your API specification to start scanning for vulnerabilities
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="projectName" className="block text-sm font-medium text-slate-300 mb-2">
              Project Name
            </label>
            <input
              type="text"
              id="projectName"
              value={projectName}
              onChange={(e) => {
                setProjectName(e.target.value);
                setErrors(prev => ({ ...prev, name: undefined }));
              }}
              className={`w-full px-4 py-3 bg-slate-800 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? 'border-red-500' : 'border-slate-700'
              }`}
              placeholder="My API"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-400">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              OpenAPI Specification
            </label>
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => setInputMethod('url')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  inputMethod === 'url'
                    ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                <Link className="w-4 h-4" />
                URL
              </button>
              <button
                type="button"
                onClick={() => setInputMethod('paste')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  inputMethod === 'paste'
                    ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                <FileCode className="w-4 h-4" />
                Paste
              </button>
            </div>

            {inputMethod === 'url' ? (
              <input
                type="url"
                value={specUrl}
                onChange={(e) => {
                  setSpecUrl(e.target.value);
                  setErrors(prev => ({ ...prev, spec: undefined }));
                }}
                className={`w-full px-4 py-3 bg-slate-800 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.spec ? 'border-red-500' : 'border-slate-700'
                }`}
                placeholder="https://api.example.com/openapi.yaml"
              />
            ) : (
              <textarea
                value={specContent}
                onChange={(e) => {
                  setSpecContent(e.target.value);
                  setErrors(prev => ({ ...prev, spec: undefined }));
                }}
                rows={8}
                className={`w-full px-4 py-3 bg-slate-800 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm ${
                  errors.spec ? 'border-red-500' : 'border-slate-700'
                }`}
                placeholder="openapi: 3.0.0&#10;info:&#10;  title: My API&#10;  version: 1.0.0&#10;paths:&#10;  /users:&#10;    get:&#10;      ..."
              />
            )}
            {errors.spec && (
              <p className="mt-1 text-sm text-red-400">{errors.spec}</p>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={prevStep}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-700 text-white font-medium rounded-lg hover:bg-slate-600 transition-colors"
              disabled={isLoading}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              type="submit"
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Project'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={handleSkip}
              className="text-sm text-slate-400 hover:text-slate-300 transition-colors"
              disabled={isLoading}
            >
              Skip for now
            </button>
          </div>
        </form>

        <div className="mt-8">
          <StepIndicator current={5} total={5} />
        </div>
      </div>
    </div>
  );
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex justify-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full transition-colors ${
            i + 1 <= current ? 'bg-blue-500' : 'bg-slate-700'
          }`}
        />
      ))}
    </div>
  );
}
