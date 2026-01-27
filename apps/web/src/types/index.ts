export interface Project {
  id: string;
  name: string;
  specUrl?: string;
  specContent?: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  scans?: Scan[];
}

export interface Scan {
  id: string;
  projectId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  startedAt: string;
  completedAt?: string;
  findings?: Finding[];
}

export interface Finding {
  id: string;
  scanId: string;
  type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  description: string;
  endpoint: string;
  method: string;
  createdAt: string;
}
