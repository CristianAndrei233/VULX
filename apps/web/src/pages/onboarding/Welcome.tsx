import { Shield, Zap, FileText, ArrowRight } from 'lucide-react';
import { useOnboarding } from '../../context/OnboardingContext';

export function Welcome() {
  const { nextStep } = useOnboarding();

  return (
    <div className="min-h-screen bg-industrial-base flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-industrial-action rounded-industrial mb-6">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to VULX
          </h1>
          <p className="text-xl text-gray-600">
            The API security scanner that helps you find vulnerabilities before attackers do.
          </p>
        </div>

        <div className="grid gap-6 mb-12">
          <Feature
            icon={<Shield className="w-6 h-6" />}
            title="OWASP API Top 10 Detection"
            description="Scan for broken authentication, BOLA, excessive data exposure, and more."
          />
          <Feature
            icon={<Zap className="w-6 h-6" />}
            title="Fast OpenAPI Scanning"
            description="Analyze your API specifications in seconds, not hours."
          />
          <Feature
            icon={<FileText className="w-6 h-6" />}
            title="Detailed Reports"
            description="Get comprehensive PDF reports with remediation guidance."
          />
        </div>

        <div className="text-center">
          <button
            onClick={nextStep}
            className="inline-flex items-center gap-2 px-8 py-4 bg-industrial-action text-white font-semibold rounded-industrial hover:bg-industrial-action-hover transition-colors"
          >
            Get Started
            <ArrowRight className="w-5 h-5" />
          </button>
          <p className="mt-4 text-sm text-gray-400">
            Takes less than 2 minutes to set up
          </p>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex gap-4 p-4 bg-white rounded-industrial border border-gray-200">
      <div className="flex-shrink-0 w-12 h-12 bg-industrial-action/10 rounded-industrial flex items-center justify-center text-industrial-action">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-white mb-1">{title}</h3>
        <p className="text-slate-400 text-sm">{description}</p>
      </div>
    </div>
  );
}
