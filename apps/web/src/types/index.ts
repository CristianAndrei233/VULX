export interface User {
  id: string;
  email: string;
  name?: string;
  stripeCustomerId?: string;
  onboardingCompleted: boolean;
  organizationId?: string;
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
