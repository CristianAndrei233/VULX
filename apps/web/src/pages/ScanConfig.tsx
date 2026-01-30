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
import { Card, Button, Input } from '../components/ui';
import { clsx } from 'clsx';

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
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Configure Scan</h1>
        <p className="mt-1 text-zinc-500">Set up your security scan parameters for a new assessment.</p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-center space-x-3 text-sm">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      )}

      {/* Project Selection (Visible only if no projectId in URL) */}
      {!projectId && (
        <Card>
          <h2 className="text-lg font-semibold text-zinc-900 mb-6 flex items-center">
            <div className="p-2 bg-indigo-50 rounded-lg mr-3">
              <Target className="w-5 h-5 text-primary-600" />
            </div>
            Select Project
          </h2>

          {loadingProjects ? (
            <div className="text-zinc-500 py-4 flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              Loading projects...
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-8 bg-zinc-50 rounded-lg border border-zinc-100 border-dashed">
              <p className="text-zinc-500 mb-4">You need a project to start a scan.</p>
              <Link to="/new">
                <Button variant="primary" leftIcon={<Target className="w-4 h-4" />}>
                  Create New Project
                </Button>
              </Link>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                Project <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedProjectId}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleProjectChange(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-md focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all text-zinc-900"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.targetUrl || 'No target defined'})
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-zinc-500">Select which project this scan belongs to.</p>
            </div>
          )}
        </Card>
      )}

      {/* Target Configuration */}
      <Card>
        <h2 className="text-lg font-semibold text-zinc-900 mb-6 flex items-center">
          <div className="p-2 bg-emerald-50 rounded-lg mr-3">
            <Globe className="w-5 h-5 text-emerald-600" />
          </div>
          Target Configuration
        </h2>

        <div className="space-y-6">
          <Input
            label="Target URL"
            required
            type="url"
            value={config.targetUrl}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateConfig('targetUrl', e.target.value)}
            placeholder="https://api.example.com"
            hint="The base URL of the API you want to scan"
          />

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              OpenAPI Specification URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={config.specUrl}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateConfig('specUrl', e.target.value)}
                placeholder="https://api.example.com/openapi.json"
                className="flex-1 px-4 py-2.5 bg-white border border-zinc-200 rounded-md focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all text-zinc-900"
              />
              <Button variant="secondary" leftIcon={<FileJson className="w-4 h-4" />}>
                Upload
              </Button>
            </div>
            <p className="mt-1.5 text-xs text-zinc-500">Optional: Provide an OpenAPI/Swagger spec for more accurate scanning</p>
          </div>
        </div>
      </Card>

      {/* Scan Type Selection */}
      <Card>
        <h2 className="text-lg font-semibold text-zinc-900 mb-6 flex items-center">
          <div className="p-2 bg-amber-50 rounded-lg mr-3">
            <Zap className="w-5 h-5 text-amber-600" />
          </div>
          Scan Type
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {scanTypes.map((scanType) => (
            <button
              key={scanType.type}
              onClick={() => handleScanTypeChange(scanType.type)}
              className={clsx(
                "p-4 rounded-xl border-2 text-left transition-all relative overflow-hidden",
                config.scanType === scanType.type
                  ? "border-primary-600 bg-primary-50/30 ring-1 ring-primary-600/20"
                  : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/50 bg-white"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={clsx("font-semibold", config.scanType === scanType.type ? "text-primary-900" : "text-zinc-900")}>
                  {scanType.name}
                </span>
                {config.scanType === scanType.type && (
                  <CheckCircle className="w-5 h-5 text-primary-600" />
                )}
              </div>
              <p className="text-sm text-zinc-500 mb-4 leading-relaxed">{scanType.description}</p>
              <div className="flex items-center justify-between text-xs pt-3 border-t border-zinc-100/50">
                <span className="flex items-center text-zinc-400 font-medium">
                  <Clock className="w-3.5 h-3.5 mr-1.5" />
                  {scanType.duration}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {scanType.engines.map((engine) => (
                  <span
                    key={engine}
                    className="px-2 py-0.5 bg-white border border-zinc-100 text-zinc-500 rounded text-[10px] font-medium shadow-sm"
                  >
                    {engine}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* Authentication Configuration */}
      <Card>
        <h2 className="text-lg font-semibold text-zinc-900 mb-6 flex items-center">
          <div className="p-2 bg-purple-50 rounded-lg mr-3">
            <Lock className="w-5 h-5 text-purple-600" />
          </div>
          Authentication
        </h2>

        {/* Auth Method Selection */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          {authMethods.map((auth) => (
            <button
              key={auth.method}
              onClick={() => updateConfig('authMethod', auth.method)}
              className={clsx(
                "p-3 rounded-lg border text-left transition-all flex items-center space-x-2.5",
                config.authMethod === auth.method
                  ? "border-primary-600 bg-primary-50 text-primary-700 ring-1 ring-primary-600/10"
                  : "border-zinc-200 hover:border-zinc-300 text-zinc-700 bg-white hover:bg-zinc-50"
              )}
            >
              <span className={config.authMethod === auth.method ? "text-primary-600" : "text-zinc-400"}>
                {auth.icon}
              </span>
              <span className="text-sm font-medium">{auth.name}</span>
            </button>
          ))}
        </div>

        {/* Auth Configuration Fields */}
        {config.authMethod !== 'none' && (
          <div className="space-y-4 pt-6 border-t border-zinc-100 animate-fade-in">
            {config.authMethod === 'bearer_token' && (
              <Input
                label="Bearer Token"
                type="password"
                value={config.authConfig.bearerToken || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateAuthConfig('bearerToken', e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIs..."
                className="font-mono text-sm"
              />
            )}

            {config.authMethod === 'api_key' && (
              <>
                <Input
                  label="Header Name"
                  value={config.authConfig.apiKeyHeader || 'X-API-Key'}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateAuthConfig('apiKeyHeader', e.target.value)}
                  placeholder="X-API-Key"
                />
                <Input
                  label="API Key Value"
                  type="password"
                  value={config.authConfig.apiKeyValue || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateAuthConfig('apiKeyValue', e.target.value)}
                  placeholder="your-api-key"
                  className="font-mono text-sm"
                />
              </>
            )}

            {config.authMethod === 'basic_auth' && (
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Username"
                  value={config.authConfig.username || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateAuthConfig('username', e.target.value)}
                  placeholder="username"
                />
                <Input
                  label="Password"
                  type="password"
                  value={config.authConfig.password || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateAuthConfig('password', e.target.value)}
                  placeholder="password"
                />
              </div>
            )}

            {config.authMethod === 'oauth2_client_credentials' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Client ID"
                    value={config.authConfig.oauth2ClientId || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateAuthConfig('oauth2ClientId', e.target.value)}
                    placeholder="client-id"
                  />
                  <Input
                    label="Client Secret"
                    type="password"
                    value={config.authConfig.oauth2ClientSecret || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateAuthConfig('oauth2ClientSecret', e.target.value)}
                    placeholder="client-secret"
                  />
                </div>
                <Input
                  label="Token URL"
                  type="url"
                  value={config.authConfig.oauth2TokenUrl || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateAuthConfig('oauth2TokenUrl', e.target.value)}
                  placeholder="https://auth.example.com/oauth/token"
                />
                <Input
                  label="Scope (optional)"
                  value={config.authConfig.oauth2Scope || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateAuthConfig('oauth2Scope', e.target.value)}
                  placeholder="read write"
                />
              </>
            )}

            {config.authMethod === 'session_cookie' && (
              <>
                <Input
                  label="Login URL"
                  type="url"
                  value={config.authConfig.loginUrl || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateAuthConfig('loginUrl', e.target.value)}
                  placeholder="https://api.example.com/auth/login"
                />
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                    Login Body (JSON)
                  </label>
                  <textarea
                    value={config.authConfig.loginBody || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateAuthConfig('loginBody', e.target.value)}
                    placeholder='{"username": "test@example.com", "password": "password123"}'
                    rows={3}
                    className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-md focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all text-zinc-900 font-mono text-sm"
                  />
                </div>
                <Input
                  label="Session Cookie Name"
                  value={config.authConfig.sessionCookieName || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateAuthConfig('sessionCookieName', e.target.value)}
                  placeholder="session_id"
                />
              </>
            )}
          </div>
        )}
      </Card>

      {/* Advanced Settings */}
      <Card className="overflow-hidden p-0">
        <button
          onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
          className="w-full px-6 py-5 flex items-center justify-between hover:bg-zinc-50 transition-colors"
        >
          <h2 className="text-lg font-semibold text-zinc-900 flex items-center">
            <div className="p-2 bg-zinc-100 rounded-lg mr-3">
              <Settings className="w-5 h-5 text-zinc-600" />
            </div>
            Advanced Settings
          </h2>
          {isAdvancedOpen ? (
            <ChevronUp className="w-5 h-5 text-zinc-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-zinc-400" />
          )}
        </button>

        {isAdvancedOpen && (
          <div className="px-6 pb-8 pt-2 space-y-6 border-t border-zinc-100">
            {/* Engine Selection */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-3">
                Scan Engines
              </label>
              <div className="space-y-3">
                <label className="flex items-center space-x-3 p-3 border border-zinc-100 rounded-lg hover:bg-zinc-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={config.engines.nuclei}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateConfig('engines', { ...config.engines, nuclei: e.target.checked })}
                    className="w-4 h-4 text-primary-600 border-zinc-300 rounded focus:ring-primary-500"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-zinc-900">Nuclei</span>
                    <span className="text-xs text-zinc-500">Fast CVE & misconfiguration detection</span>
                  </div>
                </label>
                <label className="flex items-center space-x-3 p-3 border border-zinc-100 rounded-lg hover:bg-zinc-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={config.engines.zap}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateConfig('engines', { ...config.engines, zap: e.target.checked })}
                    className="w-4 h-4 text-primary-600 border-zinc-300 rounded focus:ring-primary-500"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-zinc-900">OWASP ZAP</span>
                    <span className="text-xs text-zinc-500">Dynamic application security testing (DAST)</span>
                  </div>
                </label>
                <label className="flex items-center space-x-3 p-3 border border-zinc-100 rounded-lg hover:bg-zinc-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={config.engines.schemathesis}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateConfig('engines', { ...config.engines, schemathesis: e.target.checked })}
                    className="w-4 h-4 text-primary-600 border-zinc-300 rounded focus:ring-primary-500"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-zinc-900">Schemathesis</span>
                    <span className="text-xs text-zinc-500">Advanced API fuzzing (OpenAPI spec recommended)</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Custom Headers */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                Custom Headers (JSON)
              </label>
              <textarea
                value={config.customHeaders}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateConfig('customHeaders', e.target.value)}
                placeholder='{"X-Custom-Header": "value", "X-Another-Header": "value"}'
                rows={3}
                className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-md focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all text-zinc-900 font-mono text-sm"
              />
            </div>
          </div>
        )}
      </Card>

      {/* Info Box */}
      <div className="bg-primary-50/50 border border-primary-100 rounded-lg p-5 flex items-start space-x-4">
        <div className="p-1.5 bg-primary-100 rounded-full flex-shrink-0">
          <Info className="w-5 h-5 text-primary-700" />
        </div>
        <div className="text-sm text-zinc-600">
          <p className="font-semibold text-zinc-900 mb-1">Authorization Required</p>
          <p className="leading-relaxed">
            Ensure you have authorization to scan the target. VULX performs active security testing
            that sends requests to the target server. Only scan systems you own or have explicit
            permission to test.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-4 pt-4">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleStartScan}
          disabled={isStarting || !config.targetUrl}
          isLoading={isStarting}
          leftIcon={!isStarting && <Play className="w-4 h-4" />}
          size="lg"
        >
          Start Scan
        </Button>
      </div>
    </div>
  );
};
