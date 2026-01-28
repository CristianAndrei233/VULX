import { useState, useEffect } from 'react';
import { CreditCard, Check, AlertCircle, ExternalLink, Sparkles, Zap, Building2 } from 'lucide-react';
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
  free: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
  pro: { bg: 'bg-indigo-100', text: 'text-indigo-600', border: 'border-indigo-500' },
  enterprise: { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-500' },
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
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Billing & Subscription</h1>
        <p className="text-slate-500">Manage your subscription and view your usage</p>
      </div>

      {/* Current Plan & Usage */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-purple-50 opacity-50" />
          <div className="relative">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">Current Plan</h2>
                <p className="text-sm text-slate-500">
                  <span className="font-semibold text-indigo-600">{currentPlan?.name}</span>
                  {' '}-{' '}
                  {formatPrice(currentPlan?.price || 0)}/month
                </p>
              </div>
            </div>

            {subscription?.cancelAtPeriodEnd && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span className="text-sm text-amber-700">
                  Subscription ends on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </span>
              </div>
            )}

            <Button
              variant="secondary"
              size="sm"
              onClick={handleManageSubscription}
              disabled={isLoading}
              rightIcon={<ExternalLink className="w-4 h-4" />}
            >
              Manage Subscription
            </Button>
          </div>
        </Card>

        <Card>
          <CardHeader title="Usage This Month" />
          <div className="space-y-5">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-600">Scans</span>
                <span className="text-slate-900 font-semibold">
                  {usage.scansUsed} / {currentPlan?.scansPerMonth === -1 ? '∞' : currentPlan?.scansPerMonth}
                </span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${currentPlan?.scansPerMonth === -1 ? 0 : Math.min(100, (usage.scansUsed / (currentPlan?.scansPerMonth || 1)) * 100)}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-600">Projects</span>
                <span className="text-slate-900 font-semibold">
                  {usage.projectsUsed} / {currentPlan?.projectLimit === -1 ? '∞' : currentPlan?.projectLimit}
                </span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${currentPlan?.projectLimit === -1 ? 0 : Math.min(100, (usage.projectsUsed / (currentPlan?.projectLimit || 1)) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Plans */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Available Plans</h2>
        <div className="grid md:grid-cols-3 gap-6">
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
      <Card className="bg-slate-50">
        <h3 className="font-semibold text-slate-900 mb-3">Frequently Asked Questions</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium text-slate-700">Can I change plans anytime?</p>
            <p className="text-slate-500 mt-1">Yes, you can upgrade or downgrade at any time. Changes take effect immediately.</p>
          </div>
          <div>
            <p className="font-medium text-slate-700">What happens if I exceed my limits?</p>
            <p className="text-slate-500 mt-1">You'll be notified and can upgrade your plan or wait until the next billing cycle.</p>
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
        'relative transition-all duration-200',
        isCurrent ? 'ring-2 ring-indigo-500' : '',
        isPopular ? 'md:-mt-4 md:mb-4 shadow-xl' : ''
      )}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge variant="primary" className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-0">
            Most Popular
          </Badge>
        </div>
      )}

      {isCurrent && (
        <Badge variant="success" className="absolute top-4 right-4" size="sm">
          Current
        </Badge>
      )}

      <div className="text-center mb-6">
        <div className={clsx('w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-4', colors.bg)}>
          <span className={colors.text}>
            {planIcons[plan.id as keyof typeof planIcons]}
          </span>
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-1">{plan.name}</h3>
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-4xl font-bold text-slate-900">{formatPrice(plan.price)}</span>
          {plan.price > 0 && <span className="text-slate-500">/month</span>}
        </div>
      </div>

      <ul className="space-y-3 mb-6">
        {plan.features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
            <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            {feature}
          </li>
        ))}
      </ul>

      <Button
        variant={isCurrent ? 'ghost' : isPopular ? 'primary' : 'secondary'}
        className="w-full"
        onClick={onSelect}
        disabled={isCurrent || isLoading}
      >
        {isCurrent ? 'Current Plan' : plan.price === 0 ? 'Downgrade' : 'Upgrade'}
      </Button>
    </Card>
  );
}
