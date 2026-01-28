import React, { useState } from 'react';
import { X, Zap, Shield, Search, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from './ui';
import { clsx } from 'clsx';

export type ScanType = 'quick' | 'standard' | 'full';

interface ScanTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (scanType: ScanType) => void;
  isLoading?: boolean;
  projectName?: string;
}

const SCAN_TYPES = [
  {
    id: 'quick' as ScanType,
    name: 'Quick Scan',
    icon: Zap,
    duration: '2-5 min',
    description: 'Fast security check for rapid feedback. Ideal for pre-commit validation.',
    engines: ['OWASP Scanner'],
    checks: [
      'Basic authentication issues',
      'Common misconfigurations',
      'Exposed sensitive data'
    ],
    color: 'emerald',
    recommended: false
  },
  {
    id: 'standard' as ScanType,
    name: 'Standard Scan',
    icon: Shield,
    duration: '10-30 min',
    description: 'Comprehensive security analysis covering OWASP API Top 10. Best for CI/CD pipelines.',
    engines: ['OWASP Scanner', 'Nuclei Templates'],
    checks: [
      'OWASP API Security Top 10',
      'Authentication & Authorization',
      'Data exposure analysis',
      'Rate limiting checks',
      'Injection vulnerabilities'
    ],
    color: 'indigo',
    recommended: true
  },
  {
    id: 'full' as ScanType,
    name: 'Full Scan',
    icon: Search,
    duration: '30-60 min',
    description: 'Deep security audit with all engines. Recommended for release gates and compliance.',
    engines: ['OWASP Scanner', 'Nuclei', 'Schemathesis', 'ZAP'],
    checks: [
      'Complete OWASP coverage',
      'API fuzzing & property testing',
      'CVE detection',
      'Business logic flaws',
      'Compliance mapping (SOC2, PCI-DSS, HIPAA)'
    ],
    color: 'amber',
    recommended: false
  }
];

export const ScanTypeModal: React.FC<ScanTypeModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  projectName
}) => {
  const [selectedType, setSelectedType] = useState<ScanType>('standard');

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(selectedType);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Start Security Scan</h2>
            {projectName && (
              <p className="text-sm text-slate-500 mt-0.5">Project: {projectName}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <p className="text-slate-600 mb-6">
            Choose a scan type based on your needs. Each scan type offers different levels of depth and coverage.
          </p>

          <div className="space-y-4">
            {SCAN_TYPES.map((scanType) => {
              const Icon = scanType.icon;
              const isSelected = selectedType === scanType.id;

              const colorClasses = {
                emerald: {
                  border: isSelected ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-slate-200 hover:border-emerald-300',
                  icon: 'bg-emerald-100 text-emerald-600',
                  badge: 'bg-emerald-100 text-emerald-700'
                },
                indigo: {
                  border: isSelected ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-slate-200 hover:border-indigo-300',
                  icon: 'bg-indigo-100 text-indigo-600',
                  badge: 'bg-indigo-100 text-indigo-700'
                },
                amber: {
                  border: isSelected ? 'border-amber-500 ring-2 ring-amber-200' : 'border-slate-200 hover:border-amber-300',
                  icon: 'bg-amber-100 text-amber-600',
                  badge: 'bg-amber-100 text-amber-700'
                }
              }[scanType.color];

              return (
                <button
                  key={scanType.id}
                  onClick={() => setSelectedType(scanType.id)}
                  disabled={isLoading}
                  className={clsx(
                    'w-full p-5 rounded-xl border-2 transition-all text-left',
                    colorClasses.border,
                    isLoading && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className={clsx('p-3 rounded-lg', colorClasses.icon)}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-900">{scanType.name}</h3>
                        {scanType.recommended && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-full">
                            Recommended
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 mb-3">{scanType.description}</p>

                      <div className="flex items-center gap-4 mb-3">
                        <div className="flex items-center gap-1.5 text-sm text-slate-500">
                          <Clock className="w-4 h-4" />
                          <span>{scanType.duration}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {scanType.engines.map((engine) => (
                            <span
                              key={engine}
                              className={clsx('text-xs px-2 py-0.5 rounded-full', colorClasses.badge)}
                            >
                              {engine}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        {scanType.checks.map((check, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm text-slate-600">
                            <CheckCircle className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span>{check}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Selection indicator */}
                    <div className={clsx(
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1',
                      isSelected
                        ? 'border-indigo-500 bg-indigo-500'
                        : 'border-slate-300'
                    )}>
                      {isSelected && (
                        <CheckCircle className="w-3 h-3 text-white" />
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <AlertTriangle className="w-4 h-4" />
            <span>Scan will use current environment settings</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirm}
              isLoading={isLoading}
              leftIcon={<Zap className="w-4 h-4" />}
            >
              Start {SCAN_TYPES.find(t => t.id === selectedType)?.name}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
