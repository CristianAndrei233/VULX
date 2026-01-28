import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { getProjects } from '../services/api';
import type { Project } from '../types';
import {
  Shield,
  Zap,
  Clock,
  Settings,
  Key,
  Globe,
  FileJson,
  Lock,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
  Target,
  Play,
  Info
} from 'lucide-react';
import api from '../services/api';

type AuthMethod = 'none' | 'bearer_token' | 'basic_auth' | 'oauth2_client_credentials' | 'session_cookie' | 'api_key';
type ScanType = 'quick' | 'standard' | 'full';

interface ScanConfig {
  targetUrl: string;
  specUrl?: string;
  scanType: ScanType;
  authMethod: AuthMethod;
  authConfig: {
    bearerToken?: string;
    username?: string;
    password?: string;
    oauth2ClientId?: string;
    oauth2ClientSecret?: string;
    oauth2TokenUrl?: string;
    oauth2Scope?: string;
    loginUrl?: string;
    loginBody?: string;
    sessionCookieName?: string;
    apiKeyHeader?: string;
    apiKeyValue?: string;
  };
  engines: {
    zap: boolean;
    nuclei: boolean;
    schemathesis: boolean;
  };
  customHeaders?: string;
}

const scanTypes: { type: ScanType; name: string; description: string; duration: string; engines: string[] }[] = [
  {
    type: 'quick',
    name: 'Quick Scan',
    description: 'Fast vulnerability check using Nuclei templates',
    duration: '2-5 min',
    engines: ['Nuclei']
  },
  {
    type: 'standard',
    name: 'Standard Scan',
    description: 'Comprehensive scan with ZAP and Nuclei',
    duration: '10-30 min',
    engines: ['ZAP', 'Nuclei']
  },
  {
    type: 'full',
    name: 'Full Scan',
    description: 'Complete security audit with all engines including API fuzzing',
    duration: '30-60 min',
    engines: ['ZAP', 'Nuclei', 'Schemathesis']
  }
];

const authMethods: { method: AuthMethod; name: string; icon: React.ReactNode }[] = [
  { method: 'none', name: 'No Authentication', icon: <Globe className="w-5 h-5" /> },
  { method: 'bearer_token', name: 'Bearer Token', icon: <Key className="w-5 h-5" /> },
  { method: 'api_key', name: 'API Key', icon: <Key className="w-5 h-5" /> },
  { method: 'basic_auth', name: 'Basic Auth', icon: <Lock className="w-5 h-5" /> },
  { method: 'oauth2_client_credentials', name: 'OAuth2 Client Credentials', icon: <Shield className="w-5 h-5" /> },
  { method: 'session_cookie', name: 'Session Cookie', icon: <Lock className="w-5 h-5" /> },
];

export const ScanConfig: React.FC = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [loadingProjects, setLoadingProjects] = useState(false);

  // Initialize config
  const [config, setConfig] = useState<ScanConfig>({
    targetUrl: '',
    specUrl: '',
    scanType: 'standard',
    authMethod: 'none',
    authConfig: {},
    engines: {
      zap: true,
      nuclei: true,
      schemathesis: false
    },
    customHeaders: ''
  });

  // Fetch projects if no projectId param (Quick Scan mode)
  React.useEffect(() => {
    if (!projectId) {
      const fetchProjects = async () => {
        setLoadingProjects(true);
        try {
          const data = await getProjects();
          setProjects(data);
          if (data.length > 0) {
            setSelectedProjectId(data[0].id);
            // Pre-fill target URL from project
            setConfig(prev => ({ ...prev, targetUrl: data[0].targetUrl || data[0].specUrl || '' }));
          }
        } catch (err) {
          console.error(err);
          setError('Failed to load projects');
        } finally {
          setLoadingProjects(false);
        }
      };
      fetchProjects();
    } else {
      setSelectedProjectId(projectId);
    }
  }, [projectId]);

  // Update target when project selection changes
  const handleProjectChange = (id: string) => {
    setSelectedProjectId(id);
    const proj = projects.find(p => p.id === id);
    if (proj) {
      setConfig(prev => ({ ...prev, targetUrl: proj.targetUrl || proj.specUrl || '' }));
    }
  };

  const updateConfig = <K extends keyof ScanConfig>(key: K, value: ScanConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const updateAuthConfig = (key: string, value: string) => {
    setConfig(prev => ({
      ...prev,
      authConfig: { ...prev.authConfig, [key]: value }
    }));
  };

  const handleScanTypeChange = (type: ScanType) => {
    updateConfig('scanType', type);
    // Auto-select engines based on scan type
    updateConfig('engines', {
      zap: type !== 'quick',
      nuclei: true,
      schemathesis: type === 'full'
    });
  };

  const handleStartScan = async () => {
    const activeProjectId = projectId || selectedProjectId;

    if (!activeProjectId) {
      setError('Please select a project');
      return;
    }

    if (!config.targetUrl) {
      setError('Target URL is required');
      return;
    }

    setIsStarting(true);
    setError(null);

    try {
      const response = await api.post(`/projects/${activeProjectId}/scans`, {
        projectId: activeProjectId,
        ...config,
        environment: localStorage.getItem('vulx_environment') || 'PRODUCTION'
      });

      navigate(`/scans/${response.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to start scan');
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configure Scan</h1>
        <p className="mt-1 text-gray-500">Set up your security scan parameters</p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Project Selection (Visible only if no projectId in URL) */}
      {!projectId && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2 text-indigo-600" />
            Select Project
          </h2>

          {loadingProjects ? (
            <div className="text-gray-500">Loading projects...</div>
          ) : projects.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-gray-500 mb-4">You need a project to start a scan.</p>
              <Link
                to="/new"
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Create New Project
              </Link>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => handleProjectChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.targetUrl || 'No target defined'})
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">Select which project this scan belongs to.</p>
            </div>
          )}
        </div>
      )}

      {/* Target Configuration */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Globe className="w-5 h-5 mr-2 text-indigo-600" />
          Target Configuration
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target URL <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              value={config.targetUrl}
              onChange={(e) => updateConfig('targetUrl', e.target.value)}
              placeholder="https://api.example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <p className="mt-1 text-xs text-gray-500">The base URL of the API you want to scan</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              OpenAPI Specification URL
            </label>
            <div className="flex space-x-2">
              <input
                type="url"
                value={config.specUrl}
                onChange={(e) => updateConfig('specUrl', e.target.value)}
                placeholder="https://api.example.com/openapi.json"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center">
                <FileJson className="w-4 h-4 mr-2" />
                Upload
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">Optional: Provide an OpenAPI/Swagger spec for more accurate scanning</p>
          </div>
        </div>
      </div>

      {/* Scan Type Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Zap className="w-5 h-5 mr-2 text-indigo-600" />
          Scan Type
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {scanTypes.map((scanType) => (
            <button
              key={scanType.type}
              onClick={() => handleScanTypeChange(scanType.type)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${config.scanType === scanType.type
                ? 'border-indigo-600 bg-indigo-50'
                : 'border-gray-200 hover:border-gray-300'
                }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-900">{scanType.name}</span>
                {config.scanType === scanType.type && (
                  <CheckCircle className="w-5 h-5 text-indigo-600" />
                )}
              </div>
              <p className="text-sm text-gray-500 mb-3">{scanType.description}</p>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center text-gray-400">
                  <Clock className="w-3 h-3 mr-1" />
                  {scanType.duration}
                </span>
                <div className="flex space-x-1">
                  {scanType.engines.map((engine) => (
                    <span
                      key={engine}
                      className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded"
                    >
                      {engine}
                    </span>
                  ))}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Authentication Configuration */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Lock className="w-5 h-5 mr-2 text-indigo-600" />
          Authentication
        </h2>

        {/* Auth Method Selection */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          {authMethods.map((auth) => (
            <button
              key={auth.method}
              onClick={() => updateConfig('authMethod', auth.method)}
              className={`p-3 rounded-lg border text-left transition-all flex items-center space-x-2 ${config.authMethod === auth.method
                ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
            >
              {auth.icon}
              <span className="text-sm font-medium">{auth.name}</span>
            </button>
          ))}
        </div>

        {/* Auth Configuration Fields */}
        {config.authMethod !== 'none' && (
          <div className="space-y-4 pt-4 border-t border-gray-100">
            {config.authMethod === 'bearer_token' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bearer Token
                </label>
                <input
                  type="password"
                  value={config.authConfig.bearerToken || ''}
                  onChange={(e) => updateAuthConfig('bearerToken', e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIs..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                />
              </div>
            )}

            {config.authMethod === 'api_key' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Header Name
                  </label>
                  <input
                    type="text"
                    value={config.authConfig.apiKeyHeader || 'X-API-Key'}
                    onChange={(e) => updateAuthConfig('apiKeyHeader', e.target.value)}
                    placeholder="X-API-Key"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API Key Value
                  </label>
                  <input
                    type="password"
                    value={config.authConfig.apiKeyValue || ''}
                    onChange={(e) => updateAuthConfig('apiKeyValue', e.target.value)}
                    placeholder="your-api-key"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                  />
                </div>
              </>
            )}

            {config.authMethod === 'basic_auth' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={config.authConfig.username || ''}
                    onChange={(e) => updateAuthConfig('username', e.target.value)}
                    placeholder="username"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={config.authConfig.password || ''}
                    onChange={(e) => updateAuthConfig('password', e.target.value)}
                    placeholder="password"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            )}

            {config.authMethod === 'oauth2_client_credentials' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Client ID
                    </label>
                    <input
                      type="text"
                      value={config.authConfig.oauth2ClientId || ''}
                      onChange={(e) => updateAuthConfig('oauth2ClientId', e.target.value)}
                      placeholder="client-id"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Client Secret
                    </label>
                    <input
                      type="password"
                      value={config.authConfig.oauth2ClientSecret || ''}
                      onChange={(e) => updateAuthConfig('oauth2ClientSecret', e.target.value)}
                      placeholder="client-secret"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Token URL
                  </label>
                  <input
                    type="url"
                    value={config.authConfig.oauth2TokenUrl || ''}
                    onChange={(e) => updateAuthConfig('oauth2TokenUrl', e.target.value)}
                    placeholder="https://auth.example.com/oauth/token"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Scope (optional)
                  </label>
                  <input
                    type="text"
                    value={config.authConfig.oauth2Scope || ''}
                    onChange={(e) => updateAuthConfig('oauth2Scope', e.target.value)}
                    placeholder="read write"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </>
            )}

            {config.authMethod === 'session_cookie' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Login URL
                  </label>
                  <input
                    type="url"
                    value={config.authConfig.loginUrl || ''}
                    onChange={(e) => updateAuthConfig('loginUrl', e.target.value)}
                    placeholder="https://api.example.com/auth/login"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Login Body (JSON)
                  </label>
                  <textarea
                    value={config.authConfig.loginBody || ''}
                    onChange={(e) => updateAuthConfig('loginBody', e.target.value)}
                    placeholder='{"username": "test@example.com", "password": "password123"}'
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Session Cookie Name
                  </label>
                  <input
                    type="text"
                    value={config.authConfig.sessionCookieName || ''}
                    onChange={(e) => updateAuthConfig('sessionCookieName', e.target.value)}
                    placeholder="session_id"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Advanced Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <button
          onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
        >
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Settings className="w-5 h-5 mr-2 text-indigo-600" />
            Advanced Settings
          </h2>
          {isAdvancedOpen ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {isAdvancedOpen && (
          <div className="px-6 pb-6 pt-2 space-y-4 border-t border-gray-100">
            {/* Engine Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Scan Engines
              </label>
              <div className="space-y-2">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={config.engines.nuclei}
                    onChange={(e) => updateConfig('engines', { ...config.engines, nuclei: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Nuclei - CVE & misconfiguration detection</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={config.engines.zap}
                    onChange={(e) => updateConfig('engines', { ...config.engines, zap: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">OWASP ZAP - Dynamic application security testing</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={config.engines.schemathesis}
                    onChange={(e) => updateConfig('engines', { ...config.engines, schemathesis: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Schemathesis - API fuzzing (requires OpenAPI spec)</span>
                </label>
              </div>
            </div>

            {/* Custom Headers */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Custom Headers (JSON)
              </label>
              <textarea
                value={config.customHeaders}
                onChange={(e) => updateConfig('customHeaders', e.target.value)}
                placeholder='{"X-Custom-Header": "value", "X-Another-Header": "value"}'
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-700">
          <p className="font-medium">Important</p>
          <p className="mt-1">
            Ensure you have authorization to scan the target. VULX performs active security testing
            that sends requests to the target server. Only scan systems you own or have explicit
            permission to test.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-4">
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleStartScan}
          disabled={isStarting || !config.targetUrl}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isStarting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Starting Scan...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Start Scan
            </>
          )}
        </button>
      </div>
    </div>
  );
};
