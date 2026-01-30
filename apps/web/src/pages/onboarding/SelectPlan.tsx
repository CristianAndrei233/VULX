import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Sparkles, Zap, Building2 } from 'lucide-react';
import { useOnboarding } from '../../context/OnboardingContext';
import { Button, Badge } from '../../components/ui';
import type { Plan } from '../../types';
import { clsx } from 'clsx';

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    stripePriceId: 'price_free',
    price: 0,
    interval: 'month',
    scansPerMonth: 10,
    projectLimit: 3,
    features: [
      '10 scans per month',
      '3 projects',
      'Basic vulnerability detection',
      'PDF reports',
      'Community support',
    ],
    isActive: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    stripePriceId: 'price_pro_monthly',
    price: 4900,
    interval: 'month',
    scansPerMonth: 100,
    projectLimit: 20,
    features: [
      '100 scans per month',
      '20 projects',
      'Advanced detection',
      'PDF & JSON reports',
      'CI/CD integration',
      'Priority support',
      'Remediation guidance',
    ],
    isActive: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    stripePriceId: 'price_enterprise_monthly',
    price: 19900,
    interval: 'month',
    scansPerMonth: -1,
    projectLimit: -1,
    features: [
      'Unlimited scans',
      'Unlimited projects',
      'All vulnerability types',
      'Custom reports',
      'API access',
      'Team management',
      'Dedicated support',
      'SLA guarantee',
      'On-premise option',
    ],
    isActive: true,
  },
];

const planIcons = {
  free: <Zap className="w-5 h-5" />,
  pro: <Sparkles className="w-5 h-5" />,
  enterprise: <Building2 className="w-5 h-5" />,
};

export function SelectPlan() {
  const { nextStep, prevStep, selectedPlan, setSelectedPlan } = useOnboarding();
  const [selected, setSelected] = useState<Plan | null>(selectedPlan || PLANS[1]); // Default to Pro

  const handleSubmit = () => {
    setSelectedPlan(selected);
    nextStep();
  };

  const formatPrice = (price: number) => {
    if (price === 0) return 'Free';
    return `$${(price / 100).toFixed(0)}`;
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-8 font-sans overflow-hidden relative">
      <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-primary-100/40 rounded-full blur-[140px] opacity-40" />

      <div className="max-w-6xl w-full relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-zinc-900 mb-2 tracking-tight uppercase">Performance Tier</h1>
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Select compute resources for your workspace</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12 items-stretch">
          {PLANS.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isSelected={selected?.id === plan.id}
              onSelect={() => setSelected(plan)}
              formatPrice={formatPrice}
            />
          ))}
        </div>

        <div className="flex gap-4 justify-center">
          <Button
            type="button"
            variant="secondary"
            onClick={prevStep}
            className="px-8 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px]"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back
          </Button>
          <Button
            onClick={handleSubmit}
            className="px-12 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary-500/20"
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Provision {selected?.name} Tier
          </Button>
        </div>

        <div className="mt-12">
          <StepIndicator current={4} total={6} />
        </div>
      </div>
    </div>
  );
}

function PlanCard({
  plan,
  isSelected,
  onSelect,
  formatPrice,
}: {
  plan: Plan;
  isSelected: boolean;
  onSelect: () => void;
  formatPrice: (price: number) => string;
}) {
  const isPopular = plan.name === 'Pro';
  const Icon = planIcons[plan.id as keyof typeof planIcons];

  return (
    <div
      onClick={onSelect}
      className={clsx(
        "relative p-8 rounded-[40px] border-2 cursor-pointer transition-all duration-500 flex flex-col group",
        isSelected
          ? "border-primary-500 bg-white shadow-2xl scale-105 z-20"
          : "border-zinc-200 bg-white/60 backdrop-blur-sm hover:border-zinc-400 hover:scale-[1.02]"
      )}
    >
      {isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <Badge variant="primary" className="py-1 px-4 shadow-lg border-0 font-black">POPULAR CHOICE</Badge>
        </div>
      )}

      <div className="text-center mb-8">
        <div className={clsx(
          "w-12 h-12 rounded-2xl mx-auto flex items-center justify-center mb-6 transition-all duration-500 border shadow-sm",
          isSelected ? "bg-zinc-900 border-zinc-800 text-primary-400 scale-110" : "bg-white border-zinc-100 text-zinc-400"
        )}>
          {Icon}
        </div>
        <h3 className="text-xl font-black text-zinc-900 mb-2 uppercase tracking-tight">{plan.name}</h3>
        <div className="flex items-baseline justify-center gap-1.5">
          <span className="text-4xl font-black text-zinc-900 tracking-tighter">{formatPrice(plan.price)}</span>
          {plan.price > 0 && <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">/ we</span>}
        </div>
      </div>

      <ul className="space-y-4 mb-8 flex-1">
        {plan.features.map((feature, i) => (
          <li key={i} className="flex items-start gap-3 text-[11px] text-zinc-600 font-bold uppercase tracking-tight">
            <Check className={clsx("w-3 h-3 flex-shrink-0 mt-0.5", isSelected ? "text-primary-500" : "text-zinc-300")} />
            {feature}
          </li>
        ))}
      </ul>

      <div
        className={clsx(
          "w-full py-4 text-center rounded-[20px] font-black uppercase text-[10px] tracking-widest transition-all duration-500",
          isSelected
            ? "bg-zinc-900 text-white shadow-lg"
            : "bg-zinc-100 text-zinc-400 group-hover:bg-zinc-200"
        )}
      >
        {isSelected ? 'Provisioning...' : 'Select Tier'}
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
