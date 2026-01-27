import { useState } from 'react';
import { ArrowLeft, ArrowRight, Building } from 'lucide-react';
import { useOnboarding } from '../../context/OnboardingContext';

export function Organization() {
  const { nextStep, prevStep, organizationName, setOrganizationName } = useOnboarding();
  const [name, setName] = useState(organizationName);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Organization name is required');
      return;
    }

    setOrganizationName(name);
    nextStep();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600/20 rounded-full mb-4">
            <Building className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Create your organization
          </h1>
          <p className="text-slate-400">
            Organizations help you manage projects and collaborate with your team
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="orgName" className="block text-sm font-medium text-slate-300 mb-2">
              Organization Name
            </label>
            <input
              type="text"
              id="orgName"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              className={`w-full px-4 py-3 bg-slate-800 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                error ? 'border-red-500' : 'border-slate-700'
              }`}
              placeholder="Acme Inc."
            />
            {error && (
              <p className="mt-1 text-sm text-red-400">{error}</p>
            )}
            <p className="mt-2 text-sm text-slate-500">
              This can be your company name, team name, or personal workspace
            </p>
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
          <StepIndicator current={3} total={5} />
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
