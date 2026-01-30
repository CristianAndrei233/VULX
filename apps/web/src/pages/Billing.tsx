import { useState, useEffect } from 'react';
import { CreditCard, Check, AlertCircle, ExternalLink, Sparkles, Zap, Building2, ChevronRight } from 'lucide-react';
import type { Plan, Subscription } from '../types';
import { Card, CardHeader, Button, Badge } from '../components/ui';
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
    features: ['10 scans per month', '3 projects', 'Basic vulnerability detection', 'PDF reports'],
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
    features: ['100 scans per month', '20 projects', 'Advanced detection', 'CI/CD integration', 'Priority support', 'Custom scan profiles'],
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
    features: ['Unlimited scans', 'Unlimited projects', 'API access', 'Team management', 'Dedicated support', 'SLA guarantees', 'SSO/SAML'],
    isActive: true,
  },
];

const planIcons = {
  free: <Zap className="w-6 h-6" />,
  pro: <Sparkles className="w-6 h-6" />,
  enterprise: <Building2 className="w-6 h-6" />,
};

const planColors = {
  free: { bg: 'bg-zinc-100', text: 'text-zinc-600', border: 'border-zinc-200' },
  pro: { bg: 'bg-primary-500', text: 'text-white', border: 'border-primary-600' },
  enterprise: { bg: 'bg-zinc-900', text: 'text-white', border: 'border-zinc-950' },
};

export function Billing() {
  const [currentPlan] = useState<Plan | null>(PLANS[0]);
  const [subscription] = useState<Subscription | null>(null);
  const [usage] = useState({ scansUsed: 3, projectsUsed: 1 });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // In production, fetch current subscription and usage from API
  }, []);

  const handleUpgrade = async (plan: Plan) => {
    setIsLoading(true);
    try {
      alert(`Redirecting to checkout for ${plan.name} plan...`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setIsLoading(true);
    try {
      alert('Redirecting to subscription management...');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    if (price === 0) return 'Free';
    return `$${(price / 100).toFixed(0)}`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight mb-2">Billing & Performance</h1>
          <p className="text-zinc-500 font-medium">Provision resources and monitor your security consumption.</p>
        </div>
        <div className="flex items-center gap-2 bg-zinc-100 p-1 rounded-xl border border-zinc-200 self-start">
          <button className="px-4 py-1.5 bg-white shadow-sm rounded-lg text-xs font-bold text-zinc-900">Monthly</button>
          <button className="px-4 py-1.5 rounded-lg text-xs font-bold text-zinc-500 hover:text-zinc-700">Yearly <span className="text-emerald-600 ml-1">-20%</span></button>
        </div>
      </div>

      {/* Current Plan & Usage */}
      <div className="grid lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1 relative overflow-hidden border-zinc-200 shadow-lg">
          <div className="absolute top-0 right-0 p-4">
            <Badge variant="primary">ACTIVE</Badge>
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-zinc-900 flex items-center justify-center shadow-xl border border-zinc-700">
                <CreditCard className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-1">Current Tier</h2>
                <p className="text-2xl font-black text-zinc-900 tracking-tight">{currentPlan?.name}</p>
              </div>
            </div>

            <div className="space-y-6 pt-4 border-t border-zinc-100">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-zinc-500">Next invoice</span>
                <span className="text-sm font-black text-zinc-900">{formatPrice(currentPlan?.price || 0)}/mo</span>
              </div>

              {subscription?.cancelAtPeriodEnd && (
                <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-bold text-amber-800 uppercase tracking-tight">
                    Expiring {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </span>
                </div>
              )}

              <Button
                variant="secondary"
                className="w-full py-6 rounded-2xl font-black uppercase tracking-wider text-[11px] shadow-sm"
                onClick={handleManageSubscription}
                disabled={isLoading}
                rightIcon={<ExternalLink className="w-4 h-4" />}
              >
                Manage Portal
              </Button>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-2 border-zinc-200 bg-zinc-50/30">
          <CardHeader title="System Usage Metrics" />
          <div className="grid md:grid-cols-2 gap-8 mt-4">
            <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1">Scans Executed</span>
                  <span className="text-3xl font-black text-zinc-900">
                    {usage.scansUsed} <span className="text-sm text-zinc-400 font-bold">/ {currentPlan?.scansPerMonth === -1 ? '∞' : currentPlan?.scansPerMonth}</span>
                  </span>
                </div>
                <Badge variant="info">{(usage.scansUsed / (currentPlan?.scansPerMonth || 1) * 100).toFixed(0)}%</Badge>
              </div>
              <div className="h-3 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200 p-0.5">
                <div
                  className="h-full bg-primary-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                  style={{
                    width: `${currentPlan?.scansPerMonth === -1 ? 0 : Math.min(100, (usage.scansUsed / (currentPlan?.scansPerMonth || 1)) * 100)}%`,
                  }}
                />
              </div>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-4">Resets in 12 days</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1">Project Slots</span>
                  <span className="text-3xl font-black text-zinc-900">
                    {usage.projectsUsed} <span className="text-sm text-zinc-400 font-bold">/ {currentPlan?.projectLimit === -1 ? '∞' : currentPlan?.projectLimit}</span>
                  </span>
                </div>
                <Badge variant="success">AVAILABLE</Badge>
              </div>
              <div className="h-3 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200 p-0.5">
                <div
                  className="h-full bg-zinc-900 rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${currentPlan?.projectLimit === -1 ? 0 : Math.min(100, (usage.projectsUsed / (currentPlan?.projectLimit || 1)) * 100)}%`,
                  }}
                />
              </div>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-4">Scalable on demand</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Plans */}
      <div className="pt-8">
        <h2 className="text-xl font-black text-zinc-900 tracking-tight mb-8 ml-1 uppercase tracking-widest">Expansion Tiers</h2>
        <div className="grid md:grid-cols-3 gap-8 items-start">
          {PLANS.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isCurrent={currentPlan?.id === plan.id}
              onSelect={() => handleUpgrade(plan)}
              isLoading={isLoading}
              formatPrice={formatPrice}
            />
          ))}
        </div>
      </div>

      {/* FAQ */}
      <Card className="bg-zinc-950 text-white border-none p-10 overflow-hidden relative">
        <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-primary-600/20 rounded-full blur-[100px]" />
        <div className="relative z-10">
          <h3 className="text-2xl font-black tracking-tight mb-8">Frequently Asked Questions</h3>
          <div className="grid md:grid-cols-2 gap-10">
            {[
              { q: 'Can I change plans anytime?', a: 'Yes, tier adjustments are processed in real-time. Pro-rated credits are applied to your next cycle.' },
              { q: 'What happens if I exceed my limits?', a: 'You will receive a notification at 80% usage. Overages are barred unless specifically authorized in settings.' }
            ].map((item, i) => (
              <div key={i} className="space-y-3">
                <p className="font-black text-primary-400 text-xs uppercase tracking-widest">{item.q}</p>
                <p className="text-zinc-400 text-sm leading-relaxed font-medium">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

function PlanCard({
  plan,
  isCurrent,
  onSelect,
  isLoading,
  formatPrice,
}: {
  plan: Plan;
  isCurrent: boolean;
  onSelect: () => void;
  isLoading: boolean;
  formatPrice: (price: number) => string;
}) {
  const isPopular = plan.name === 'Pro';
  const colors = planColors[plan.id as keyof typeof planColors];

  return (
    <Card
      className={clsx(
        'relative transition-all duration-500 overflow-hidden border-zinc-200 group',
        isCurrent ? 'ring-4 ring-primary-500/10 border-primary-500 shadow-xl' : 'hover:border-zinc-400 hover:shadow-lg',
        isPopular ? 'scale-105 z-10 bg-white ring-1 ring-primary-100' : 'bg-white'
      )}

    >
      {isPopular && (
        <div className="bg-primary-500 text-white text-[10px] font-black uppercase tracking-[0.2em] py-1.5 text-center shadow-md">
          Recommended
        </div>
      )}

      <div className="p-8">
        <div className="text-center mb-10">
          <div className={clsx('w-16 h-16 rounded-[22px] mx-auto flex items-center justify-center mb-6 shadow-lg border border-white/20 transition-transform group-hover:rotate-6 duration-500', colors.bg)}>
            <span className={clsx('font-bold', colors.text === 'text-white' ? 'text-white shadow-sm' : 'text-zinc-900')}>
              {planIcons[plan.id as keyof typeof planIcons]}
            </span>
          </div>
          <h3 className="text-2xl font-black text-zinc-900 tracking-tight mb-2 uppercase">{plan.name}</h3>
          <div className="flex items-baseline justify-center gap-1.5">
            <span className="text-5xl font-black text-zinc-900 tracking-tighter">{formatPrice(plan.price)}</span>
            {plan.price > 0 && <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">/ mo</span>}
          </div>
        </div>

        <ul className="space-y-4 mb-10">
          {plan.features.map((feature, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-zinc-600 font-medium">
              <div className="mt-1 w-4 h-4 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
                <Check className="w-2.5 h-2.5 text-emerald-600" />
              </div>
              {feature}
            </li>
          ))}
        </ul>

        <Button
          variant={isCurrent ? 'secondary' : isPopular ? 'primary' : 'secondary'}
          className={clsx(
            "w-full py-6 rounded-2xl font-black uppercase tracking-[0.1em] text-xs transition-all shadow-md group-hover:translate-y-[-2px]",
            isCurrent && "cursor-default border-zinc-200 text-zinc-400"
          )}
          onClick={onSelect}
          disabled={isCurrent || isLoading}
          rightIcon={!isCurrent && <ChevronRight className="w-4 h-4" />}
        >
          {isCurrent ? 'Active Protocol' : plan.price === 0 ? 'Select Tier' : 'Upgrade Now'}
        </Button>
      </div>
    </Card>
  );
}
