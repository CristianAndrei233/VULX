import { useState } from 'react';
import { ArrowLeft, ArrowRight, FolderPlus, Link, FileCode, Shield } from 'lucide-react';
import { useOnboarding } from '../../context/OnboardingContext';
import { Button } from '../../components/ui';
import { clsx } from 'clsx';

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
      newErrors.name = 'Project identifier required';
    }

    if (inputMethod === 'url' && !specUrl.trim()) {
      newErrors.spec = 'Specification endpoint required';
    } else if (inputMethod === 'paste' && !specContent.trim()) {
      newErrors.spec = 'Payload content required';
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
      setErrors({ spec: 'Protocol failed. Retrying...' });
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
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-8 font-sans overflow-hidden relative">
      {/* Dark Ambient Visuals */}
      <div className="absolute top-[-10%] left-[-5%] w-[50%] h-[50%] bg-primary-950/30 rounded-full blur-[140px] opacity-40" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-indigo-950/20 rounded-full blur-[120px] opacity-30" />
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
        backgroundSize: '40px 40px'
      }} />

      <div className="max-w-xl w-full relative z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-500/10 rounded-[28px] mb-6 shadow-xl border border-primary-500/20">
            <FolderPlus className="w-10 h-10 text-primary-500" />
          </div>
          <h1 className="text-4xl font-black text-white mb-2 tracking-tight uppercase">Init Project</h1>
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Define Target API Specification</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 p-10 bg-zinc-900 border border-zinc-800 rounded-[44px] shadow-2xl">
          <div className="space-y-2">
            <label htmlFor="projectName" className="block text-[11px] font-black text-zinc-500 uppercase tracking-widest ml-1">
              Project Identifier
            </label>
            <input
              type="text"
              id="projectName"
              value={projectName}
              onChange={(e) => {
                setProjectName(e.target.value);
                setErrors(prev => ({ ...prev, name: undefined }));
              }}
              className={clsx(
                "w-full px-6 py-4 bg-zinc-950 border rounded-2xl text-white font-bold placeholder-zinc-700 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/50 transition-all",
                errors.name ? "border-red-900" : "border-zinc-800 shadow-inner"
              )}
              placeholder="e.g. Nexus-Gateway"
            />
            {errors.name && (
              <p className="mt-1 text-[10px] font-black text-red-500 uppercase tracking-tight ml-1">{errors.name}</p>
            )}
          </div>

          <div className="space-y-4">
            <label className="block text-[11px] font-black text-zinc-500 uppercase tracking-widest ml-1">
              OpenAPI Manifest Method
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setInputMethod('url')}
                className={clsx(
                  "flex-1 flex items-center justify-center gap-3 px-4 py-4 rounded-2xl border-2 transition-all duration-300 font-black text-[10px] uppercase tracking-widest",
                  inputMethod === 'url'
                    ? "bg-primary-500/10 border-primary-500 text-primary-400 shadow-lg shadow-primary-500/10"
                    : "bg-zinc-950 border-zinc-800 text-zinc-600 hover:border-zinc-700"
                )}
              >
                <Link className="w-4 h-4" />
                Network URL
              </button>
              <button
                type="button"
                onClick={() => setInputMethod('paste')}
                className={clsx(
                  "flex-1 flex items-center justify-center gap-3 px-4 py-4 rounded-2xl border-2 transition-all duration-300 font-black text-[10px] uppercase tracking-widest",
                  inputMethod === 'paste'
                    ? "bg-primary-500/10 border-primary-500 text-primary-400 shadow-lg shadow-primary-500/10"
                    : "bg-zinc-950 border-zinc-800 text-zinc-600 hover:border-zinc-700"
                )}
              >
                <FileCode className="w-4 h-4" />
                Raw Payload
              </button>
            </div>

            {inputMethod === 'url' ? (
              <div className="relative group">
                <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700 group-focus-within:text-primary-500 transition-colors" />
                <input
                  type="url"
                  value={specUrl}
                  onChange={(e) => {
                    setSpecUrl(e.target.value);
                    setErrors(prev => ({ ...prev, spec: undefined }));
                  }}
                  className={clsx(
                    "w-full pl-11 pr-6 py-4 bg-zinc-950 border rounded-2xl text-white font-bold placeholder-zinc-700 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/50 transition-all",
                    errors.spec ? "border-red-900" : "border-zinc-800 shadow-inner"
                  )}
                  placeholder="https://schema.nexus.io/v1"
                />
              </div>
            ) : (
              <textarea
                value={specContent}
                onChange={(e) => {
                  setSpecContent(e.target.value);
                  setErrors(prev => ({ ...prev, spec: undefined }));
                }}
                rows={6}
                className={clsx(
                  "w-full px-6 py-4 bg-zinc-950 border rounded-2xl text-primary-400 font-mono text-[11px] placeholder-zinc-800 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/50 transition-all",
                  errors.spec ? "border-red-900" : "border-zinc-800 shadow-inner"
                )}
                placeholder="openapi: 3.0.0..."
              />
            )}
            {errors.spec && (
              <p className="mt-1 text-[10px] font-black text-red-500 uppercase tracking-tight ml-1">{errors.spec}</p>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={prevStep}
              className="flex-1 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] border-zinc-800 text-zinc-500 hover:bg-zinc-800"
              disabled={isLoading}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Back
            </Button>
            <Button
              type="submit"
              className="flex-1 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary-500/20"
              disabled={isLoading}
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Commit Data
            </Button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={handleSkip}
              className="text-[10px] font-black text-zinc-600 hover:text-primary-500 transition-colors uppercase tracking-[0.2em]"
              disabled={isLoading}
            >
              Skip Init Sequence
            </button>
          </div>
        </form>

        <div className="mt-12 flex flex-col items-center gap-6">
          <StepIndicator current={5} total={6} />
        </div>
      </div>
    </div>
  );
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex justify-center gap-4">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-1 rounded-full transition-all duration-700 ${i + 1 <= current ? 'bg-primary-500 w-8 shadow-[0_0_8px_rgba(99,102,241,0.5)]' : 'bg-zinc-800 w-4 opacity-40'
            }`}
        />
      ))}
    </div>
  );
}
