import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, Sparkles, Zap, Shield, Target } from 'lucide-react';
import { Button } from '../../components/ui';

export function Complete() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-8 font-sans overflow-hidden relative">
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-emerald-950/20 rounded-full blur-[160px] opacity-40" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary-950/20 rounded-full blur-[140px] opacity-30" />

      <div className="max-w-2xl w-full text-center relative z-10">
        <div className="relative inline-block mb-12">
          <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-2xl animate-pulse" />
          <div className="w-24 h-24 bg-emerald-500/10 border border-emerald-500/30 rounded-[32px] flex items-center justify-center relative z-10 scale-125">
            <CheckCircle className="w-12 h-12 text-emerald-500" />
          </div>
          <Sparkles className="absolute -top-4 -right-4 w-10 h-10 text-primary-400 animate-bounce" />
        </div>

        <h1 className="text-5xl font-black text-white mb-6 tracking-tighter uppercase">
          Authorization Granted
        </h1>
        <p className="text-xl text-zinc-400 font-medium mb-12 leading-relaxed">
          Welcome to the VULX Network. Your secure environment is provisioned and ready for autonomous scanning.
        </p>

        <div className="space-y-6">
          <Button
            onClick={() => navigate('/')}
            className="w-full py-8 text-lg font-black uppercase tracking-[0.2em] rounded-[24px] shadow-2xl shadow-primary-500/30 group"
            rightIcon={<ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />}
          >
            Enter Command Center
          </Button>

          <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">
            Redirecting to kernel in {countdown} seconds...
          </p>
        </div>

        <div className="mt-16 p-10 bg-zinc-900/50 backdrop-blur-md rounded-[48px] border border-zinc-800 shadow-2xl flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Operational Directives</span>
            <div className="h-px flex-1 mx-6 bg-zinc-800" />
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          <div className="grid grid-cols-2 gap-8 text-left">
            <QuickTip
              icon={<Shield className="w-4 h-4" />}
              step="01"
              text="Map your API via OpenAPI manifest"
            />
            <QuickTip
              icon={<Zap className="w-4 h-4" />}
              step="02"
              text="Execute autonomous security scan"
            />
            <QuickTip
              icon={<Target className="w-4 h-4" />}
              step="03"
              text="Triage high-fidelity findings"
            />
            <QuickTip
              icon={<ArrowRight className="w-4 h-4" />}
              step="04"
              text="Deploy CI/CD guardrails"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickTip({ icon, step, text }: { icon: React.ReactNode; step: string; text: string }) {
  return (
    <div className="flex gap-4 group">
      <div className="shrink-0 w-8 h-8 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-500 group-hover:text-primary-400 group-hover:border-primary-500/50 transition-all">
        {icon}
      </div>
      <div>
        <span className="block text-[10px] font-black text-primary-500 mb-1">{step}</span>
        <p className="text-xs font-bold text-zinc-400 leading-tight">{text}</p>
      </div>
    </div>
  );
}
