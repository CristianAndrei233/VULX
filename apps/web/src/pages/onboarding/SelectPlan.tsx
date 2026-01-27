import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useOnboarding } from '../../context/OnboardingContext';
import type { Plan } from '../../types';

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
    price: 4900, // $49.00
    interval: 'month',
    scansPerMonth: 100,
    projectLimit: 20,
    features: [
      '100 scans per month',
      '20 projects',
      'Advanced vulnerability detection',
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
    price: 19900, // $199.00
    interval: 'month',
    scansPerMonth: -1, // unlimited
    projectLimit: -1, // unlimited
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

export function SelectPlan() {
  const { nextStep, prevStep, selectedPlan, setSelectedPlan } = useOnboarding();
  const [selected, setSelected] = useState<Plan | null>(selectedPlan || PLANS[0]);

  const handleSubmit = () => {
    setSelectedPlan(selected);
    nextStep();
  };

  const formatPrice = (price: number) => {
    if (price === 0) return 'Free';
    return `$${(price / 100).toFixed(0)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Choose your plan
          </h1>
          <p className="text-slate-400">
            Start free and upgrade as you grow. All plans include a 14-day trial.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
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
          <button
            type="button"
            onClick={prevStep}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-700 text-white font-medium rounded-lg hover:bg-slate-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <button
            onClick={handleSubmit}
            className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Continue with {selected?.name}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-8">
          <StepIndicator current={4} total={5} />
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

  return (
    <div
      onClick={onSelect}
      className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all ${
        isSelected
          ? 'border-blue-500 bg-slate-800/80'
          : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
      }`}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
          Most Popular
        </div>
      )}

      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-white mb-2">{plan.name}</h3>
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-4xl font-bold text-white">{formatPrice(plan.price)}</span>
          {plan.price > 0 && <span className="text-slate-400">/month</span>}
        </div>
      </div>

      <ul className="space-y-3 mb-6">
        {plan.features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
            <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
            {feature}
          </li>
        ))}
      </ul>

      <div
        className={`w-full py-2 text-center rounded-lg font-medium transition-colors ${
          isSelected
            ? 'bg-blue-600 text-white'
            : 'bg-slate-700 text-slate-300'
        }`}
      >
        {isSelected ? 'Selected' : 'Select Plan'}
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
