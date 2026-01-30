import { useState } from 'react';
import { ArrowLeft, ArrowRight, Building, Globe } from 'lucide-react';
import { useOnboarding } from '../../context/OnboardingContext';
import { Button } from '../../components/ui';

export function Organization() {
  const { nextStep, prevStep, organizationName, setOrganizationName } = useOnboarding();
  const [name, setName] = useState(organizationName);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Protocol identifier required');
      return;
    }

    setOrganizationName(name);
    nextStep();
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-8 font-sans overflow-hidden relative">
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-50 rounded-full blur-[140px] opacity-40" />

      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-zinc-900 rounded-[28px] mb-6 shadow-xl border border-zinc-800">
            <Building className="w-10 h-10 text-primary-500" />
          </div>
          <h1 className="text-4xl font-black text-zinc-900 mb-2 tracking-tight uppercase">Base Operations</h1>
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Establish Global Entity Matrix</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 p-10 bg-white/60 backdrop-blur-md rounded-[44px] border border-zinc-200 shadow-2xl">
          <div className="space-y-2">
            <label htmlFor="orgName" className="block text-[11px] font-black text-zinc-400 uppercase tracking-widest ml-1">
              Organization Descriptor
            </label>
            <div className="relative group">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300 group-focus-within:text-primary-500 transition-colors" />
              <input
                type="text"
                id="orgName"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError('');
                }}
                className={`w-full pl-11 pr-6 py-4 bg-white border rounded-2xl text-zinc-900 font-bold placeholder-zinc-300 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/50 transition-all ${error ? 'border-red-500' : 'border-zinc-200 shadow-sm'}`}
                placeholder="Nexus Corp"
              />
            </div>
            {error && (
              <p className="mt-1 text-[10px] font-black text-red-600 uppercase tracking-tight ml-1">{error}</p>
            )}
            <p className="mt-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-relaxed text-center italic opacity-60">
              Unique identifier for your secure workspace
            </p>
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={prevStep}
              className="flex-1 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px]"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Back
            </Button>
            <Button
              type="submit"
              className="flex-1 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary-500/20"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sync
            </Button>
          </div>
        </form>

        <div className="mt-12">
          <StepIndicator current={3} total={6} />
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
          className={`h-1 rounded-full transition-all duration-700 ${i + 1 <= current ? 'bg-primary-500 w-8 shadow-[0_0_8px_rgba(99,102,241,0.5)]' : 'bg-zinc-200 w-4 opacity-40'
            }`}
        />
      ))}
    </div>
  );
}
