import React, { useState } from 'react';
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
  Info
} from 'lucide-react';
import type { Finding } from '../types';
import { Card, Button, Badge, SeverityBadge } from '../components/ui';
import { clsx } from 'clsx';

// Sample data for demonstration
const sampleFindings: Finding[] = [
  {
    id: '1',
    scanId: 'scan-1',
    engine: 'zap',
    type: 'SQL_INJECTION',
    severity: 'CRITICAL',
    confidence: 'HIGH',
    title: 'SQL Injection in User Query',
    description: 'The application appears to be vulnerable to SQL injection attacks. The user ID parameter is being concatenated directly into the SQL query without proper sanitization.',
    endpoint: '/api/users/{id}',
    method: 'GET',
    parameter: 'id',
    evidence: "Input: ' OR '1'='1' -- \nResponse contains multiple user records",
    request: "GET /api/users/' OR '1'='1' -- HTTP/1.1\nHost: api.example.com",
    response: "HTTP/1.1 200 OK\n{\"users\": [...multiple records...]}",
    remediation: 'Use parameterized queries or prepared statements instead of string concatenation.',
    codeExample: `// Before (Vulnerable)
const query = \`SELECT * FROM users WHERE id = '\${userId}'\`;

// After (Safe)
const query = 'SELECT * FROM users WHERE id = $1';
const result = await db.query(query, [userId]);`,
    owaspCategory: 'API8:2023 - Security Misconfiguration',
    cweId: 'CWE-89',
    cvssScore: 9.8,
    complianceMappings: {
      soc2: ['CC6.1'],
      pci_dss: ['6.5.1'],
      gdpr: ['Art. 32']
    },
    status: 'OPEN',
    references: ['https://owasp.org/www-community/attacks/SQL_Injection'],
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    scanId: 'scan-1',
    engine: 'nuclei',
    type: 'BROKEN_AUTHENTICATION',
    severity: 'HIGH',
    confidence: 'HIGH',
    title: 'Missing Rate Limiting on Login Endpoint',
    description: 'The login endpoint does not implement rate limiting, making it vulnerable to brute force attacks.',
    endpoint: '/api/auth/login',
    method: 'POST',
    evidence: 'Successfully sent 100 login attempts within 10 seconds without being blocked.',
    remediation: 'Implement rate limiting on authentication endpoints.',
    codeExample: `const rateLimit = require('express-rate-limit');
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts'
});
app.post('/api/auth/login', loginLimiter, loginHandler);`,
    owaspCategory: 'API4:2023 - Unrestricted Resource Consumption',
    cweId: 'CWE-307',
    cvssScore: 7.5,
    status: 'OPEN',
    references: [],
    createdAt: new Date().toISOString()
  },
  {
    id: '3',
    scanId: 'scan-1',
    engine: 'schemathesis',
    type: 'BOLA',
    severity: 'HIGH',
    confidence: 'MEDIUM',
    title: 'Broken Object Level Authorization',
    description: 'User can access other users\' data by changing the ID parameter in the request.',
    endpoint: '/api/users/{id}/profile',
    method: 'GET',
    parameter: 'id',
    evidence: 'Authenticated as user_123, successfully accessed profile of user_456',
    remediation: 'Implement proper authorization checks.',
    owaspCategory: 'API1:2023 - Broken Object Level Authorization',
    cweId: 'CWE-639',
    cvssScore: 8.1,
    status: 'OPEN',
    references: [],
    createdAt: new Date().toISOString()
  },
  {
    id: '4',
    scanId: 'scan-1',
    engine: 'zap',
    type: 'SECURITY_MISCONFIGURATION',
    severity: 'MEDIUM',
    confidence: 'HIGH',
    title: 'Missing Security Headers',
    description: 'Several important security headers are missing from API responses.',
    endpoint: '/api/*',
    method: 'GET',
    evidence: 'Missing headers: X-Content-Type-Options, X-Frame-Options, Content-Security-Policy',
    remediation: 'Add security headers to all API responses.',
    owaspCategory: 'API8:2023 - Security Misconfiguration',
    cweId: 'CWE-693',
    cvssScore: 5.3,
    status: 'OPEN',
    references: [],
    createdAt: new Date().toISOString()
  },
  {
    id: '5',
    scanId: 'scan-1',
    engine: 'nuclei',
    type: 'INFORMATION_DISCLOSURE',
    severity: 'LOW',
    confidence: 'HIGH',
    title: 'Verbose Error Messages',
    description: 'Error responses include stack traces and internal implementation details.',
    endpoint: '/api/users/invalid',
    method: 'GET',
    evidence: 'Error response includes stack trace',
    remediation: 'Implement proper error handling.',
    owaspCategory: 'API8:2023 - Security Misconfiguration',
    cweId: 'CWE-209',
    cvssScore: 3.7,
    status: 'OPEN',
    references: [],
    createdAt: new Date().toISOString()
  }
];

const engineIcons: Record<string, React.ReactNode> = {
  zap: <Shield className="w-4 h-4" />,
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
    CRITICAL: 'border-l-red-500',
    HIGH: 'border-l-orange-500',
    MEDIUM: 'border-l-amber-400',
    LOW: 'border-l-blue-500',
    INFO: 'border-l-slate-400'
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card
      variant="default"
      padding="none"
      className={clsx(
        'border-l-4 overflow-hidden transition-all',
        severityBorder[finding.severity] || 'border-l-slate-400'
      )}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
          )}
          <SeverityBadge severity={finding.severity} size="sm" />
          <div className="flex items-center gap-2 text-slate-400">
            {engineIcons[finding.engine]}
            <span className="text-xs uppercase font-medium">{finding.engine}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">{finding.title}</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-3 flex-shrink-0 ml-4">
          <code className="text-xs font-mono bg-slate-100 px-2.5 py-1 rounded-md text-slate-600">
            {finding.method} {finding.endpoint}
          </code>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-slate-100 animate-fade-in">
          {/* Tabs */}
          <div className="flex border-b border-slate-100 bg-slate-50/50">
            {(['details', 'evidence', 'remediation'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={clsx(
                  'px-5 py-3 text-sm font-medium capitalize transition-colors',
                  activeTab === tab
                    ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-5">
            {activeTab === 'details' && (
              <div className="space-y-5">
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">Description</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">{finding.description}</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <h4 className="text-xs font-medium text-slate-500 uppercase mb-1">OWASP</h4>
                    <p className="text-sm text-slate-700 font-medium">{finding.owaspCategory || 'N/A'}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <h4 className="text-xs font-medium text-slate-500 uppercase mb-1">CWE</h4>
                    {finding.cweId ? (
                      <a
                        href={`https://cwe.mitre.org/data/definitions/${finding.cweId.replace('CWE-', '')}.html`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-indigo-600 hover:underline flex items-center gap-1 font-medium"
                      >
                        {finding.cweId}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <p className="text-sm text-slate-700">N/A</p>
                    )}
                  </div>
                  {finding.cvssScore && (
                    <div className="bg-slate-50 rounded-industrial p-3">
                      <h4 className="text-xs font-medium text-slate-500 uppercase mb-1">CVSS Score</h4>
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
                    <div className="bg-slate-50 rounded-lg p-3">
                      <h4 className="text-xs font-medium text-slate-500 uppercase mb-1">Parameter</h4>
                      <code className="text-sm bg-white px-2 py-0.5 rounded border border-slate-200">{finding.parameter}</code>
                    </div>
                  )}
                </div>

                {finding.complianceMappings && Object.keys(finding.complianceMappings).length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-2">Compliance Mappings</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(finding.complianceMappings).map(([framework, controls]) =>
                        controls?.map((control) => (
                          <Badge key={`${framework}-${control}`} variant="info" size="sm">
                            {framework.toUpperCase()}: {control}
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'evidence' && (
              <div className="space-y-4">
                {finding.evidence && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      Evidence
                    </h4>
                    <pre className="text-sm bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto font-mono">
                      {finding.evidence}
                    </pre>
                  </div>
                )}
                {finding.request && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-2">Request</h4>
                    <pre className="text-sm bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto font-mono">
                      {finding.request}
                    </pre>
                  </div>
                )}
                {finding.response && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-2">Response</h4>
                    <pre className="text-sm bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto font-mono">
                      {finding.response}
                    </pre>
                  </div>
                )}
                {!finding.evidence && !finding.request && !finding.response && (
                  <div className="text-center py-8">
                    <Info className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">No evidence data available</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'remediation' && (
              <div className="space-y-4">
                {finding.remediation && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-emerald-800 mb-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Recommendation
                    </h4>
                    <p className="text-sm text-emerald-700">{finding.remediation}</p>
                  </div>
                )}
                {finding.codeExample && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-slate-700">Code Example</h4>
                      <button
                        onClick={() => handleCopy(finding.codeExample || '')}
                        className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 px-2 py-1 hover:bg-slate-100 rounded"
                      >
                        <Copy className="w-3 h-3" />
                        {copied ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <pre className="text-sm bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto font-mono">
                      {finding.codeExample}
                    </pre>
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

// Stat Card Component
const StatCard: React.FC<{
  label: string;
  value: number;
  severity?: 'critical' | 'high' | 'medium' | 'low' | 'info';
}> = ({ label, value, severity }) => {
  const colors = {
    critical: 'bg-red-50 border-red-200 text-severity-critical',
    high: 'bg-orange-50 border-orange-200 text-severity-high',
    medium: 'bg-teal-50 border-teal-200 text-severity-medium',
    low: 'bg-emerald-50 border-emerald-200 text-severity-low',
    info: 'bg-slate-50 border-slate-200 text-slate-700'
  };

  return (
    <div className={clsx(
      'rounded-industrial border p-4 transition-transform hover:scale-[1.02] bg-white',
      severity ? colors[severity] : 'bg-white border-slate-200'
    )}>
      <p className="text-sm font-medium opacity-80">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  );
};

export const ScanResults: React.FC = () => {
  const { scanId } = useParams();
  const [findings] = useState<Finding[]>(sampleFindings);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterEngine, setFilterEngine] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link to="/" className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Scan Results</h1>
            <p className="text-slate-500 text-sm mt-0.5">Scan ID: {scanId || 'demo'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" leftIcon={<Download className="w-4 h-4" />}>
            Export PDF
          </Button>
          <Button variant="primary" leftIcon={<FileText className="w-4 h-4" />}>
            Generate Report
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard label="Total Findings" value={stats.total} />
        <StatCard label="Critical" value={stats.critical} severity="critical" />
        <StatCard label="High" value={stats.high} severity="high" />
        <StatCard label="Medium" value={stats.medium} severity="medium" />
        <StatCard label="Low" value={stats.low} severity="low" />
      </div>

      {/* Filters */}
      <Card className="bg-white">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search findings..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            />
          </div>
          <div className="flex items-center gap-3">
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
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
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
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
          <Card className="py-12 text-center">
            <CheckCircle className="w-12 h-12 mx-auto text-emerald-500 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No vulnerabilities found</h3>
            <p className="text-slate-500">Great job! No issues match your current filters.</p>
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
