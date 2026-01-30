import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Shield,
  Bug,
  Target,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Copy,
  Download,
  FileText,
  Search,
  CheckCircle,
  AlertTriangle,
  Info,
  Zap,
  Activity
} from 'lucide-react';
import type { Finding, Scan } from '../types';
import { Card, Button, SeverityBadge, StatCard } from '../components/ui';
import { clsx } from 'clsx';
import { getScan, getScanFindings } from '../services/api';

const engineIcons: Record<string, React.ReactNode> = {
  zap: <Zap className="w-4 h-4" />,
  nuclei: <Target className="w-4 h-4" />,
  schemathesis: <Bug className="w-4 h-4" />,
  owasp_scanner: <Shield className="w-4 h-4" />
};

// Finding Card Component
const FindingCard: React.FC<{
  finding: Finding;
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ finding, isExpanded, onToggle }) => {
  const [activeTab, setActiveTab] = useState<'details' | 'evidence' | 'remediation'>('details');
  const [copied, setCopied] = useState(false);

  const severityBorder: Record<string, string> = {
    CRITICAL: 'border-l-severity-critical',
    HIGH: 'border-l-severity-high',
    MEDIUM: 'border-l-severity-medium',
    LOW: 'border-l-severity-low',
    INFO: 'border-l-severity-info'
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card
      className={clsx(
        'border-l-4 overflow-hidden transition-all duration-200 p-0',
        severityBorder[finding.severity] || 'border-l-text-muted',
        isExpanded ? 'shadow-md' : 'hover:border-border-secondary'
      )}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-bg-tertiary/50 transition-colors text-left"
      >
        <div className="flex items-center gap-4 min-w-0">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-text-muted flex-shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 text-text-muted flex-shrink-0" />
          )}
          <SeverityBadge severity={finding.severity.toLowerCase() as any} />
          <div className="flex items-center gap-2 text-text-muted">
            {engineIcons[finding.engine] || <Shield size={16} />}
            <span className="text-xs uppercase font-semibold tracking-wider">{finding.engine}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text-primary truncate">{finding.title}</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-3 flex-shrink-0 ml-4">
          <code className="text-xs font-mono bg-bg-elevated border border-border-secondary px-2.5 py-1 rounded text-text-muted">
            {finding.method} {finding.endpoint}
          </code>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-border-secondary animate-fade-in bg-bg-card/50">
          {/* Tabs */}
          <div className="flex border-b border-border-secondary bg-bg-tertiary/30">
            {(['details', 'evidence', 'remediation'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={clsx(
                  'px-5 py-3 text-sm font-medium capitalize transition-all relative',
                  activeTab === tab
                    ? 'text-accent-primary'
                    : 'text-text-muted hover:text-text-primary'
                )}
              >
                {tab}
                {activeTab === tab && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-primary" />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'details' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Description</h4>
                  <p className="text-sm text-text-secondary leading-relaxed">{finding.description}</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-bg-elevated border border-border-secondary rounded-lg p-3">
                    <h4 className="text-[11px] font-semibold text-text-muted uppercase mb-1">OWASP</h4>
                    <p className="text-sm text-text-primary font-medium">{finding.owaspCategory || 'N/A'}</p>
                  </div>
                  <div className="bg-bg-elevated border border-border-secondary rounded-lg p-3">
                    <h4 className="text-[11px] font-semibold text-text-muted uppercase mb-1">CWE</h4>
                    {finding.cweId ? (
                      <a
                        href={`https://cwe.mitre.org/data/definitions/${finding.cweId.replace('CWE-', '')}.html`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-accent-primary hover:underline flex items-center gap-1 font-semibold"
                      >
                        {finding.cweId}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <p className="text-sm text-text-primary">N/A</p>
                    )}
                  </div>
                  {finding.cvssScore !== undefined && (
                    <div className="bg-bg-elevated border border-border-secondary rounded-lg p-3">
                      <h4 className="text-[11px] font-semibold text-text-muted uppercase mb-1">CVSS Score</h4>
                      <p className={clsx(
                        'text-sm font-bold',
                        finding.cvssScore >= 9 ? 'text-severity-critical' :
                          finding.cvssScore >= 7 ? 'text-severity-high' :
                            finding.cvssScore >= 4 ? 'text-severity-medium' : 'text-severity-low'
                      )}>
                        {finding.cvssScore} / 10
                      </p>
                    </div>
                  )}
                  {finding.parameter && (
                    <div className="bg-bg-elevated border border-border-secondary rounded-lg p-3">
                      <h4 className="text-[11px] font-semibold text-text-muted uppercase mb-1">Parameter</h4>
                      <code className="text-xs bg-bg-tertiary px-1.5 py-0.5 rounded text-text-primary border border-border-secondary font-mono">{finding.parameter}</code>
                    </div>
                  )}
                </div>

                {finding.complianceMappings && Object.keys(finding.complianceMappings).length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Compliance Mappings</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(finding.complianceMappings).map(([framework, controls]) =>
                        controls?.map((control) => (
                          <span key={`${framework}-${control}`} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-bg-elevated text-text-secondary border border-border-secondary">
                            {framework.toUpperCase()}: {control}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'evidence' && (
              <div className="space-y-6">
                {finding.evidence && (
                  <div>
                    <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-severity-medium" />
                      Evidence
                    </h4>
                    <pre className="text-xs bg-bg-base border border-border-secondary text-text-secondary p-4 rounded-lg overflow-x-auto font-mono leading-relaxed">
                      {finding.evidence}
                    </pre>
                  </div>
                )}
                {finding.request && (
                  <div>
                    <h4 className="text-sm font-semibold text-text-primary mb-3">Request</h4>
                    <pre className="text-xs bg-bg-base border border-border-secondary text-text-secondary p-4 rounded-lg overflow-x-auto font-mono leading-relaxed">
                      {finding.request}
                    </pre>
                  </div>
                )}
                {finding.response && (
                  <div>
                    <h4 className="text-sm font-semibold text-text-primary mb-3">Response</h4>
                    <pre className="text-xs bg-bg-base border border-border-secondary text-text-secondary p-4 rounded-lg overflow-x-auto font-mono leading-relaxed">
                      {finding.response}
                    </pre>
                  </div>
                )}
                {!finding.evidence && !finding.request && !finding.response && (
                  <div className="text-center py-12 border-2 border-dashed border-border-secondary rounded-xl">
                    <Info className="w-10 h-10 text-text-muted mx-auto mb-3 opacity-50" />
                    <p className="text-sm text-text-muted">No evidence data available</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'remediation' && (
              <div className="space-y-6">
                {finding.remediation && (
                  <div className="bg-severity-low/10 border border-severity-low/20 rounded-xl p-5">
                    <h4 className="text-sm font-semibold text-severity-low mb-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Recommendation
                    </h4>
                    <p className="text-sm text-text-secondary">{finding.remediation}</p>
                  </div>
                )}
                {finding.codeExample && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-text-primary">Code Example</h4>
                      <button
                        onClick={() => handleCopy(finding.codeExample || '')}
                        className="text-xs text-text-muted hover:text-text-primary flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-bg-elevated rounded-md transition-colors border border-transparent hover:border-border-secondary"
                      >
                        <Copy className="w-3 h-3" />
                        {copied ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <pre className="text-xs bg-bg-base border border-border-secondary text-text-secondary p-4 rounded-lg overflow-x-auto font-mono leading-relaxed">
                      {finding.codeExample}
                    </pre>
                  </div>
                )}
                {!finding.remediation && !finding.codeExample && (
                  <div className="text-center py-12 border-2 border-dashed border-border-secondary rounded-xl">
                    <Info className="w-10 h-10 text-text-muted mx-auto mb-3 opacity-50" />
                    <p className="text-sm text-text-muted">No remediation guidance available</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

// Loading Skeleton
const ScanResultsSkeleton: React.FC = () => (
  <div className="p-8 space-y-6">
    <div className="flex items-center gap-4">
      <div className="h-12 w-12 bg-bg-elevated rounded-xl animate-pulse" />
      <div>
        <div className="h-6 w-48 bg-bg-elevated rounded animate-pulse mb-2" />
        <div className="h-4 w-32 bg-bg-elevated rounded animate-pulse" />
      </div>
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-28 bg-bg-elevated rounded-xl animate-pulse" />
      ))}
    </div>
    <div className="h-16 bg-bg-elevated rounded-xl animate-pulse" />
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-24 bg-bg-elevated rounded-xl animate-pulse" />
      ))}
    </div>
  </div>
);

export const ScanResults: React.FC = () => {
  const { scanId } = useParams();
  const [scan, setScan] = useState<Scan | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterEngine, setFilterEngine] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch real data from API
  useEffect(() => {
    const fetchData = async () => {
      if (!scanId) {
        setError('No scan ID provided');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [scanData, findingsData] = await Promise.all([
          getScan(scanId),
          getScanFindings(scanId)
        ]);
        setScan(scanData);
        setFindings(findingsData);
      } catch (err) {
        console.error('Failed to load scan results:', err);
        setError('Failed to load scan results. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [scanId]);

  // Filter findings
  const filteredFindings = findings.filter(f => {
    if (filterSeverity !== 'all' && f.severity !== filterSeverity) return false;
    if (filterEngine !== 'all' && f.engine !== filterEngine) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        f.title.toLowerCase().includes(query) ||
        f.description.toLowerCase().includes(query) ||
        f.endpoint.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Calculate summary stats
  const stats = {
    total: findings.length,
    critical: findings.filter(f => f.severity === 'CRITICAL').length,
    high: findings.filter(f => f.severity === 'HIGH').length,
    medium: findings.filter(f => f.severity === 'MEDIUM').length,
    low: findings.filter(f => f.severity === 'LOW').length
  };

  if (loading) return <ScanResultsSkeleton />;

  if (error) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/scans" className="p-2 hover:bg-bg-elevated rounded-lg text-text-muted hover:text-text-primary transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-text-primary">Scan Results</h1>
        </div>
        <Card className="py-12 text-center border-severity-critical/20 bg-severity-critical/5">
          <AlertTriangle className="w-12 h-12 mx-auto text-severity-critical mb-4" />
          <h3 className="text-lg font-bold text-severity-critical mb-2">Error Loading Results</h3>
          <p className="text-text-secondary max-w-md mx-auto mb-6">{error}</p>
          <Link to="/scans">
            <Button variant="secondary">Back to Scans</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1400px] space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link to="/scans" className="p-2 hover:bg-bg-elevated rounded-xl text-text-muted hover:text-text-primary transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">Scan Results</h1>
            <p className="text-text-muted text-sm mt-0.5 font-medium">
              {scan?.scanType?.charAt(0).toUpperCase()}{scan?.scanType?.slice(1)} Scan • <span className="font-mono text-xs opacity-70">ID: {scanId?.slice(0, 8)}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" icon={Download}>
            Export PDF
          </Button>
          <Button variant="primary" icon={FileText}>
            Generate Report
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard icon={Activity} label="Total Findings" value={stats.total} />
        <StatCard icon={AlertTriangle} label="Critical" value={stats.critical} />
        <StatCard icon={AlertTriangle} label="High" value={stats.high} />
        <StatCard icon={AlertTriangle} label="Medium" value={stats.medium} />
        <StatCard icon={Info} label="Low" value={stats.low} />
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 p-1">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search findings by title, description, or endpoint..."
              className="w-full pl-10 pr-4 py-2.5 bg-bg-base border border-border-secondary rounded-xl focus:outline-none focus:ring-1 focus:ring-accent-primary text-sm transition-all focus:border-accent-primary text-text-primary placeholder:text-text-muted"
            />
          </div>
          <div className="flex items-center gap-3">
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="px-4 py-2.5 bg-bg-base border border-border-secondary rounded-xl focus:outline-none focus:ring-1 focus:ring-accent-primary text-sm transition-all text-text-primary focus:border-accent-primary"
            >
              <option value="all">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
            <select
              value={filterEngine}
              onChange={(e) => setFilterEngine(e.target.value)}
              className="px-4 py-2.5 bg-bg-base border border-border-secondary rounded-xl focus:outline-none focus:ring-1 focus:ring-accent-primary text-sm transition-all text-text-primary focus:border-accent-primary"
            >
              <option value="all">All Engines</option>
              <option value="zap">ZAP</option>
              <option value="nuclei">Nuclei</option>
              <option value="schemathesis">Schemathesis</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Findings List */}
      <div className="space-y-3">
        {filteredFindings.length === 0 ? (
          <Card className="py-20 text-center border-dashed border-2 border-border-secondary bg-transparent">
            <CheckCircle className="w-16 h-16 mx-auto text-severity-low mb-6 opacity-80" />
            <h3 className="text-xl font-bold text-text-primary mb-2">
              {findings.length === 0 ? 'No Vulnerabilities Found' : 'No Matching Results'}
            </h3>
            <p className="text-text-muted max-w-sm mx-auto">
              {findings.length === 0
                ? 'Great job! This scan didn\'t detect any security issues.'
                : 'Try adjusting your filters to see more results.'}
            </p>
          </Card>
        ) : (
          filteredFindings.map((finding, index) => (
            <div key={finding.id} className="animate-fade-in" style={{ animationDelay: `${index * 30}ms` }}>
              <FindingCard
                finding={finding}
                isExpanded={expandedId === finding.id}
                onToggle={() => setExpandedId(expandedId === finding.id ? null : finding.id)}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
};
