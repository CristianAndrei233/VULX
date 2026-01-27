import { useState } from 'react';
import { ArrowLeft, ArrowRight, User } from 'lucide-react';
import { useOnboarding } from '../../context/OnboardingContext';

export function Profile() {
  const { nextStep, prevStep, user, setUser } = useOnboarding();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});

  const validate = () => {
    const newErrors: { name?: string; email?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600/20 rounded-full mb-4">
            <User className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Tell us about yourself
          </h1>
          <p className="text-slate-400">
            We'll use this to personalize your experience
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-4 py-3 bg-slate-800 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? 'border-red-500' : 'border-slate-700'
              }`}
              placeholder="John Doe"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-400">{errors.name}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-4 py-3 bg-slate-800 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.email ? 'border-red-500' : 'border-slate-700'
              }`}
              placeholder="john@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-400">{errors.email}</p>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={prevStep}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-700 text-white font-medium rounded-lg hover:bg-slate-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              type="submit"
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        <div className="mt-8">
          <StepIndicator current={2} total={5} />
        </div>
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
