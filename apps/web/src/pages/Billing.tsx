import { useState, useEffect } from 'react';
import { CreditCard, Check, AlertCircle, ExternalLink } from 'lucide-react';
import type { Plan, Subscription } from '../types';

// Mock data - in production, these would come from the API
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
    features: ['100 scans per month', '20 projects', 'Advanced detection', 'CI/CD integration', 'Priority support'],
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
    features: ['Unlimited scans', 'Unlimited projects', 'API access', 'Team management', 'Dedicated support'],
    isActive: true,
  },
];

export function Billing() {
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(PLANS[0]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState({ scansUsed: 3, projectsUsed: 1 });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // In production, fetch current subscription and usage from API
    // For demo, using mock data
  }, []);

  const handleUpgrade = async (plan: Plan) => {
    setIsLoading(true);
    try {
      // In production, this would create a Stripe checkout session
      // const response = await api.post('/billing/create-checkout-session', {
      //   userId: 'current-user-id',
      //   planId: plan.id,
      // });
      // window.location.href = response.data.url;
      alert(`Redirecting to checkout for ${plan.name} plan...`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setIsLoading(true);
    try {
      // In production, create a Stripe billing portal session
      // const response = await api.post('/billing/create-portal-session', {
      //   userId: 'current-user-id',
      // });
      // window.location.href = response.data.url;
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
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Billing & Subscription</h1>
        <p className="text-slate-600">Manage your subscription and view your usage</p>
      </div>

      {/* Current Plan & Usage */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Current Plan</h2>
              <p className="text-sm text-slate-500">
                {currentPlan?.name} - {formatPrice(currentPlan?.price || 0)}/month
              </p>
            </div>
          </div>

          {subscription?.cancelAtPeriodEnd && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <span className="text-sm text-yellow-700">
                Your subscription will end on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </span>
            </div>
          )}

          <button
            onClick={handleManageSubscription}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
            disabled={isLoading}
          >
            Manage Subscription
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Usage This Month</h2>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600">Scans</span>
                <span className="text-slate-900 font-medium">
                  {usage.scansUsed} / {currentPlan?.scansPerMonth === -1 ? '∞' : currentPlan?.scansPerMonth}
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all"
                  style={{
                    width: `${currentPlan?.scansPerMonth === -1 ? 0 : Math.min(100, (usage.scansUsed / (currentPlan?.scansPerMonth || 1)) * 100)}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600">Projects</span>
                <span className="text-slate-900 font-medium">
                  {usage.projectsUsed} / {currentPlan?.projectLimit === -1 ? '∞' : currentPlan?.projectLimit}
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-600 rounded-full transition-all"
                  style={{
                    width: `${currentPlan?.projectLimit === -1 ? 0 : Math.min(100, (usage.projectsUsed / (currentPlan?.projectLimit || 1)) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Plans */}
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

  return (
    <div
      className={`relative bg-white rounded-xl border-2 p-6 ${
        isCurrent ? 'border-blue-500' : 'border-slate-200'
      }`}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
          Most Popular
        </div>
      )}

      {isCurrent && (
        <div className="absolute top-4 right-4 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
          Current
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-xl font-semibold text-slate-900 mb-2">{plan.name}</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-slate-900">{formatPrice(plan.price)}</span>
          {plan.price > 0 && <span className="text-slate-500">/month</span>}
        </div>
      </div>

      <ul className="space-y-3 mb-6">
        {plan.features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
            <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
            {feature}
          </li>
        ))}
      </ul>

      <button
        onClick={onSelect}
        disabled={isCurrent || isLoading}
        className={`w-full py-2.5 rounded-lg font-medium transition-colors ${
          isCurrent
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {isCurrent ? 'Current Plan' : plan.price === 0 ? 'Downgrade' : 'Upgrade'}
      </button>
    </div>
  );
}
