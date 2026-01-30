import { useState } from 'react';
import { ArrowLeft, ArrowRight, User, Terminal } from 'lucide-react';
import { useOnboarding } from '../../context/OnboardingContext';
import { Button } from '../../components/ui';

export function Profile() {
  const { nextStep, prevStep, user, setUser } = useOnboarding();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});

  const validate = () => {
    const newErrors: { name?: string; email?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Identity required';
    }

    if (!email.trim()) {
      newErrors.email = 'Network address required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid endpoint format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setUser({ name, email });
      nextStep();
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-8 font-sans overflow-hidden relative">
      <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-primary-100 rounded-full blur-[120px] opacity-60" />

      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-zinc-900 rounded-[24px] mb-6 shadow-xl border border-zinc-800">
            <User className="w-10 h-10 text-primary-500" />
          </div>
          <h1 className="text-4xl font-black text-zinc-900 mb-2 tracking-tight uppercase">Provision Agent</h1>
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Level 1 Clearance Required</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 p-10 bg-white/60 backdrop-blur-md rounded-[40px] border border-zinc-200 shadow-2xl">
          <div className="space-y-2">
            <label htmlFor="name" className="block text-[11px] font-black text-zinc-400 uppercase tracking-widest ml-1">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-6 py-4 bg-white border rounded-2xl text-zinc-900 font-bold placeholder-zinc-300 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/50 transition-all ${errors.name ? 'border-red-500' : 'border-zinc-200 shadow-sm'}`}
              placeholder="Operator Name"
            />
            {errors.name && (
              <p className="mt-1 text-[10px] font-black text-red-600 uppercase tracking-tight ml-1">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="block text-[11px] font-black text-zinc-400 uppercase tracking-widest ml-1">
              Network Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-6 py-4 bg-white border rounded-2xl text-zinc-900 font-bold placeholder-zinc-300 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/50 transition-all ${errors.email ? 'border-red-500' : 'border-zinc-200 shadow-sm'}`}
              placeholder="agent@nexus.io"
            />
            {errors.email && (
              <p className="mt-1 text-[10px] font-black text-red-600 uppercase tracking-tight ml-1">{errors.email}</p>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={prevStep}
              className="flex-1 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px]"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Abort
            </Button>
            <Button
              type="submit"
              className="flex-1 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary-500/20"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Authorize
            </Button>
          </div>
        </form>

        <div className="mt-12 flex flex-col items-center gap-6">
          <StepIndicator current={2} total={6} />
          <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900/5 rounded-full border border-zinc-200">
            <Terminal className="w-3 h-3 text-zinc-400" />
            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Protocol Sync v2.4</span>
          </div>
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
