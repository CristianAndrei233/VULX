export interface User {
  id: string;
  email: string;
  name?: string;
  stripeCustomerId?: string;
  onboardingCompleted: boolean;
  organizationId?: string;
  apiKey?: string;
  role: 'ADMIN' | 'USER';
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  stripeSubscriptionId: string;
  stripePriceId: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
  planId: string;
  plan?: Plan;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export interface Plan {
  id: string;
  name: string;
  stripePriceId: string;
  price: number;
  interval: 'month' | 'year';
  scansPerMonth: number;
  projectLimit: number;
  features: string[];
  isActive: boolean;
}

export interface Organization {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  targetUrl?: string;
  specUrl?: string;
  specContent?: string;
  organizationId: string;
  authConfigId?: string;
  authConfig?: AuthConfig;
  scanFrequency: 'MANUAL' | 'DAILY' | 'WEEKLY';
  nextScanAt?: string;
  createdAt: string;
  updatedAt: string;
  scans?: Scan[];
}

export interface AuthConfig {
  id: string;
  name: string;
  method: 'bearer_token' | 'basic_auth' | 'oauth2_client_credentials' | 'session_cookie' | 'api_key';
  organizationId: string;

  // Bearer/API Key
  bearerToken?: string;
  apiKeyHeader?: string;
  apiKeyValue?: string;

  // Basic Auth
  username?: string;
  password?: string;

  // OAuth2
  oauth2ClientId?: string;
  oauth2ClientSecret?: string;
  oauth2TokenUrl?: string;
  oauth2Scope?: string;

  // Session/Cookie
  loginUrl?: string;
  loginBody?: Record<string, unknown>;
  sessionCookieName?: string;

  // Custom Headers
  customHeaders?: Record<string, string>;

  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Scan {
  id: string;
  projectId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  scanType: 'quick' | 'standard' | 'full';
  targetUrl?: string;
  startedAt: string;
  completedAt?: string;
  durationSecs?: number;
  findings?: Finding[];
  riskScore?: number;
  enginesUsed: string[];
  authMethod?: string;
  triggeredBy?: 'user' | 'schedule' | 'ci_cd' | 'api';
  triggeredById?: string;
  ciProvider?: string;
  commitSha?: string;
  branchName?: string;
  pullRequestId?: string;
  findingsCount?: {
    CRITICAL: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
    INFO: number;
  };
  notificationSent: boolean;
  createdAt: string;
}

export interface Finding {
  id: string;
  scanId: string;
  engine: 'owasp_scanner' | 'nuclei' | 'zap' | 'schemathesis';
  type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  endpoint: string;
  method: string;
  parameter?: string;
  evidence?: string;
  request?: string;
  response?: string;
  remediation?: string;
  codeExample?: string;
  owaspCategory?: string;
  cweId?: string;
  cveId?: string;
  cvssScore?: number;
  complianceMappings?: {
    soc2?: string[];
    pci_dss?: string[];
    hipaa?: string[];
    gdpr?: string[];
    iso_27001?: string[];
  };
  status: 'OPEN' | 'ACCEPTED' | 'FIXED' | 'FALSE_POSITIVE';
  fixedAt?: string;
  fixedInScanId?: string;
  references: string[];
  createdAt: string;
}

export interface ScanSchedule {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  cronExpression: string;
  timezone: string;
  scanType: 'quick' | 'standard' | 'full';
  isActive: boolean;
  lastRunAt?: string;
  nextRunAt?: string;
  notifyOnFindings: boolean;
  notifySeverity: string;
  notifyEmails: string[];
  slackWebhookUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Alert {
  id: string;
  userId: string;
  type: 'new_finding' | 'scan_complete' | 'scan_failed' | 'threshold_exceeded';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  title: string;
  message: string;
  projectId?: string;
  scanId?: string;
  findingId?: string;
  isRead: boolean;
  readAt?: string;
  emailSent: boolean;
  slackSent: boolean;
  createdAt: string;
}

export interface ComplianceReport {
  id: string;
  scanId: string;
  framework: 'soc2' | 'pci_dss' | 'hipaa' | 'gdpr' | 'iso_27001';
  status: 'compliant' | 'non_compliant' | 'partial';
  score?: number;
  controlsTotal: number;
  controlsPassed: number;
  controlsFailed: number;
  controlDetails: Array<{
    controlId: string;
    status: 'passed' | 'failed' | 'partial';
    findings: string[];
  }>;
  generatedAt: string;
}

export interface DashboardStats {
  totalProjects: number;
  totalScans: number;
  activeScans: number;
  totalFindings: number;
  criticalFindings: number;
  highFindings: number;
  mediumFindings: number;
  lowFindings: number;
  avgRiskScore: number;
  scansThisMonth: number;
  findingsFixed: number;
  recentScans: Scan[];
  topVulnerabilities: Array<{
    type: string;
    count: number;
    severity: string;
  }>;
}

export interface CLICommand {
  command: string;
  output: string;
  timestamp: string;
  status: 'running' | 'success' | 'error';
}

export interface ApiKey {
  id: string;
  key: string; // Usually masked in list, full on creation
  type: 'SANDBOX' | 'PRODUCTION';
  projectId: string;
  createdAt: string;
}
