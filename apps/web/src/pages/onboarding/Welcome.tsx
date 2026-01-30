import { Shield, Zap, FileText, ArrowRight, Sparkles } from 'lucide-react';
import { useOnboarding } from '../../context/OnboardingContext';
import { Button } from '../../components/ui';

export function Welcome() {
  const { nextStep } = useOnboarding();

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-8 font-sans overflow-hidden relative">
      {/* Decorative Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-primary-100 rounded-full blur-[120px] opacity-60" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-50 rounded-full blur-[140px] opacity-40" />

      <div className="max-w-3xl w-full relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-zinc-950 rounded-[30px] mb-8 shadow-2xl shadow-zinc-950/20 border border-zinc-800 relative group transition-transform hover:scale-110 duration-500">
            <div className="absolute inset-0 bg-primary-500/20 rounded-[30px] blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <Shield className="w-12 h-12 text-primary-500 relative z-10" />
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-50 border border-primary-100 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-primary-600" />
            <span className="text-xs font-black text-primary-700 uppercase tracking-widest">Protocol v2.4 Active</span>
          </div>
          <h1 className="text-6xl font-black text-zinc-900 mb-6 tracking-tighter leading-none">
            Secure your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-500">API Ecosystem</span>
          </h1>
          <p className="text-xl text-zinc-500 font-medium max-w-xl mx-auto leading-relaxed">
            The autonomous security gateway that identifies risks before they reach production.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <Feature
            icon={<Shield className="w-6 h-6" />}
            title="Neural Guard"
            description="Autonomous OWASP Top 10 detection."
          />
          <Feature
            icon={<Zap className="w-6 h-6" />}
            title="Warp Scan"
            description="Protocol analysis in milliseconds."
          />
          <Feature
            icon={<FileText className="w-6 h-6" />}
            title="Audit Matrix"
            description="High-fidelity remediation logs."
          />
        </div>

        <div className="text-center">
          <Button
            onClick={nextStep}
            className="px-12 py-8 text-lg font-black uppercase tracking-[0.2em] rounded-[24px] shadow-2xl shadow-primary-500/30 group"
            rightIcon={<ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />}
          >
            Initiate Sequence
          </Button>
          <div className="mt-8 flex items-center justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-relaxed">System Ready</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-relaxed">2 Min Setup</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex flex-col gap-4 p-8 bg-white/60 backdrop-blur-md rounded-[32px] border border-zinc-200 shadow-sm hover:translate-y-[-8px] transition-all duration-500 group">
      <div className="flex-shrink-0 w-14 h-14 bg-zinc-50 border border-zinc-100 rounded-2xl flex items-center justify-center text-zinc-400 group-hover:bg-primary-500 group-hover:text-white group-hover:border-primary-400 transition-all duration-500 shadow-sm">
        {icon}
      </div>
      <div>
        <h3 className="font-black text-zinc-900 mb-2 uppercase tracking-tight">{title}</h3>
        <p className="text-zinc-500 text-xs font-semibold leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
