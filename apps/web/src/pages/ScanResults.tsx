import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Shield,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Copy,
  Download,
  Filter,
  Search,
  FileText,
  Code,
  Info,
  Bug,
  Zap,
  Target,
  ArrowLeft
} from 'lucide-react';
import type { Scan, Finding } from '../types';
import { format } from 'date-fns';

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
    remediation: 'Implement rate limiting on authentication endpoints. Consider using exponential backoff and account lockout after multiple failed attempts.',
    codeExample: `// Express.js with express-rate-limit
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many login attempts'
});

app.post('/api/auth/login', loginLimiter, loginHandler);`,
    owaspCategory: 'API4:2023 - Unrestricted Resource Consumption',
    cweId: 'CWE-307',
    cvssScore: 7.5,
    complianceMappings: {
      soc2: ['CC6.1', 'CC6.6'],
      pci_dss: ['8.1.6']
    },
    status: 'OPEN',
    references: ['https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html'],
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
    remediation: 'Implement proper authorization checks to ensure users can only access their own resources.',
    codeExample: `// Add authorization check
app.get('/api/users/:id/profile', authenticate, async (req, res) => {
  // Verify the requesting user has access
  if (req.user.id !== req.params.id && !req.user.isAdmin) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  // ... rest of handler
});`,
    owaspCategory: 'API1:2023 - Broken Object Level Authorization',
    cweId: 'CWE-639',
    cvssScore: 8.1,
    complianceMappings: {
      soc2: ['CC6.1'],
      hipaa: ['164.312(a)(1)']
    },
    status: 'OPEN',
    references: ['https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/'],
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
    codeExample: `// Express.js with helmet
const helmet = require('helmet');
app.use(helmet());

// Or manually:
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  next();
});`,
    owaspCategory: 'API8:2023 - Security Misconfiguration',
    cweId: 'CWE-693',
    cvssScore: 5.3,
    complianceMappings: {
      pci_dss: ['6.5.10']
    },
    status: 'OPEN',
    references: ['https://owasp.org/www-project-secure-headers/'],
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
    evidence: 'Error response includes: "Error: Cannot read property \'id\' of undefined\\n    at UserController.getUser (/app/src/controllers/user.js:45:12)"',
    remediation: 'Implement proper error handling that returns generic error messages to clients while logging detailed errors server-side.',
    codeExample: `// Global error handler
app.use((err, req, res, next) => {
  // Log detailed error internally
  console.error(err.stack);

  // Return generic message to client
  res.status(500).json({
    error: 'Internal Server Error',
    requestId: req.id // For correlation
  });
});`,
    owaspCategory: 'API8:2023 - Security Misconfiguration',
    cweId: 'CWE-209',
    cvssScore: 3.7,
    status: 'OPEN',
    references: [],
    createdAt: new Date().toISOString()
  }
];

const severityColors = {
  CRITICAL: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300', badge: 'bg-red-500' },
  HIGH: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300', badge: 'bg-orange-500' },
  MEDIUM: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300', badge: 'bg-yellow-500' },
  LOW: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300', badge: 'bg-blue-500' },
  INFO: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300', badge: 'bg-gray-500' }
};

const engineIcons = {
  zap: <Shield className="w-4 h-4" />,
  nuclei: <Target className="w-4 h-4" />,
  schemathesis: <Bug className="w-4 h-4" />,
  owasp_scanner: <Shield className="w-4 h-4" />
};

// Finding Card Component
const FindingCard: React.FC<{ finding: Finding; isExpanded: boolean; onToggle: () => void }> = ({
  finding,
  isExpanded,
  onToggle
}) => {
  const colors = severityColors[finding.severity];
  const [activeTab, setActiveTab] = useState<'details' | 'evidence' | 'remediation'>('details');

  return (
    <div className={`bg-white rounded-lg border ${colors.border} overflow-hidden`}>
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <span className={`px-2 py-1 text-xs font-bold rounded ${colors.bg} ${colors.text}`}>
            {finding.severity}
          </span>
          <div className="flex items-center space-x-2 text-gray-500">
            {engineIcons[finding.engine]}
            <span className="text-xs uppercase">{finding.engine}</span>
          </div>
          <h3 className="font-medium text-gray-900 text-left">{finding.title}</h3>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-500 font-mono">
            {finding.method} {finding.endpoint}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-200">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            {(['details', 'evidence', 'remediation'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium capitalize ${
                  activeTab === tab
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-4">
            {activeTab === 'details' && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Description</h4>
                  <p className="text-sm text-gray-600">{finding.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">OWASP Category</h4>
                    <p className="text-sm text-gray-600">{finding.owaspCategory || 'N/A'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">CWE ID</h4>
                    <p className="text-sm text-gray-600">
                      {finding.cweId ? (
                        <a
                          href={`https://cwe.mitre.org/data/definitions/${finding.cweId.replace('CWE-', '')}.html`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:underline flex items-center"
                        >
                          {finding.cweId}
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      ) : 'N/A'}
                    </p>
                  </div>
                  {finding.cvssScore && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">CVSS Score</h4>
                      <p className="text-sm text-gray-600">{finding.cvssScore} / 10</p>
                    </div>
                  )}
                  {finding.parameter && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Vulnerable Parameter</h4>
                      <code className="text-sm bg-gray-100 px-2 py-0.5 rounded">{finding.parameter}</code>
                    </div>
                  )}
                </div>

                {finding.complianceMappings && Object.keys(finding.complianceMappings).length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Compliance Mappings</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(finding.complianceMappings).map(([framework, controls]) => (
                        controls && controls.map((control) => (
                          <span
                            key={`${framework}-${control}`}
                            className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded"
                          >
                            {framework.toUpperCase()}: {control}
                          </span>
                        ))
                      ))}
                    </div>
                  </div>
                )}

                {finding.references && finding.references.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">References</h4>
                    <ul className="space-y-1">
                      {finding.references.map((ref, idx) => (
                        <li key={idx}>
                          <a
                            href={ref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-indigo-600 hover:underline flex items-center"
                          >
                            {ref}
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'evidence' && (
              <div className="space-y-4">
                {finding.evidence && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Evidence</h4>
                    <pre className="text-sm bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto">
                      {finding.evidence}
                    </pre>
                  </div>
                )}
                {finding.request && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Request</h4>
                    <pre className="text-sm bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto">
                      {finding.request}
                    </pre>
                  </div>
                )}
                {finding.response && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Response</h4>
                    <pre className="text-sm bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto">
                      {finding.response}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'remediation' && (
              <div className="space-y-4">
                {finding.remediation && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Recommendation</h4>
                    <p className="text-sm text-gray-600">{finding.remediation}</p>
                  </div>
                )}
                {finding.codeExample && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-medium text-gray-700">Code Example</h4>
                      <button
                        onClick={() => navigator.clipboard.writeText(finding.codeExample || '')}
                        className="text-xs text-gray-500 hover:text-gray-700 flex items-center"
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Copy
                      </button>
                    </div>
                    <pre className="text-sm bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto">
                      {finding.codeExample}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const ScanResults: React.FC = () => {
  const { scanId } = useParams();
  const [findings, setFindings] = useState<Finding[]>(sampleFindings);
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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Scan Results</h1>
            <p className="text-gray-500">Scan ID: {scanId || 'demo'}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center">
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </button>
          <button className="px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 flex items-center">
            <FileText className="w-4 h-4 mr-2" />
            Generate Report
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Total Findings</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-red-50 rounded-lg border border-red-200 p-4">
          <p className="text-sm text-red-600">Critical</p>
          <p className="text-2xl font-bold text-red-700">{stats.critical}</p>
        </div>
        <div className="bg-orange-50 rounded-lg border border-orange-200 p-4">
          <p className="text-sm text-orange-600">High</p>
          <p className="text-2xl font-bold text-orange-700">{stats.high}</p>
        </div>
        <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4">
          <p className="text-sm text-yellow-600">Medium</p>
          <p className="text-2xl font-bold text-yellow-700">{stats.medium}</p>
        </div>
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
          <p className="text-sm text-blue-600">Low</p>
          <p className="text-2xl font-bold text-blue-700">{stats.low}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search findings..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Engines</option>
              <option value="zap">ZAP</option>
              <option value="nuclei">Nuclei</option>
              <option value="schemathesis">Schemathesis</option>
            </select>
          </div>
        </div>
      </div>

      {/* Findings List */}
      <div className="space-y-4">
        {filteredFindings.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-12 text-center">
            <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No vulnerabilities found</h3>
            <p className="text-gray-500">Great job! No issues match your current filters.</p>
          </div>
        ) : (
          filteredFindings.map((finding) => (
            <FindingCard
              key={finding.id}
              finding={finding}
              isExpanded={expandedId === finding.id}
              onToggle={() => setExpandedId(expandedId === finding.id ? null : finding.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};
