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
    <div className="min-h-screen bg-industrial-base flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-industrial-action/10 rounded-full mb-4">
            <Building className="w-8 h-8 text-industrial-action" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create your organization
          </h1>
          <p className="text-gray-500">
            Organizations help you manage projects and collaborate with your team
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="orgName" className="block text-sm font-medium text-gray-700 mb-2">
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
              className={`w-full px-4 py-3 bg-white border rounded-industrial text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-industrial-action ${error ? 'border-severity-critical' : 'border-gray-300'
                }`}
              placeholder="Acme Inc."
            />
            {error && (
              <p className="mt-1 text-sm text-severity-critical">{error}</p>
            )}
            <p className="mt-2 text-sm text-gray-500">
              This can be your company name, team name, or personal workspace
            </p>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={prevStep}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-industrial hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              type="submit"
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-industrial-action text-white font-medium rounded-industrial hover:bg-industrial-action-hover transition-colors"
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
          className={`w-2 h-2 rounded-full transition-colors ${i + 1 <= current ? 'bg-industrial-action' : 'bg-gray-300'
            }`}
        />
      ))}
    </div>
  );
}
