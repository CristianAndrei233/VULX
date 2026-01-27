import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, Sparkles } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="relative inline-block mb-8">
          <div className="w-24 h-24 bg-green-600/20 rounded-full flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-green-400" />
          </div>
          <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-yellow-400 animate-pulse" />
        </div>

        <h1 className="text-4xl font-bold text-white mb-4">
          You're all set!
        </h1>
        <p className="text-xl text-slate-300 mb-8">
          Welcome to VULX. Your account is ready and you can start scanning your APIs for vulnerabilities.
        </p>

        <div className="space-y-4">
          <button
            onClick={() => navigate('/')}
            className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
            <ArrowRight className="w-5 h-5" />
          </button>

          <p className="text-sm text-slate-500">
            Redirecting automatically in {countdown} seconds...
          </p>
        </div>

        <div className="mt-12 p-6 bg-slate-800/50 rounded-xl border border-slate-700">
          <h3 className="font-semibold text-white mb-4">Quick Start Tips</h3>
          <ul className="text-left space-y-3 text-sm text-slate-400">
            <li className="flex gap-2">
              <span className="text-blue-400">1.</span>
              Create a project with your OpenAPI specification
            </li>
            <li className="flex gap-2">
              <span className="text-blue-400">2.</span>
              Run your first security scan
            </li>
            <li className="flex gap-2">
              <span className="text-blue-400">3.</span>
              Review findings and download the report
            </li>
            <li className="flex gap-2">
              <span className="text-blue-400">4.</span>
              Set up CI/CD integration for continuous security
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
