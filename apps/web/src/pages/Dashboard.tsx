import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProjects } from '../services/api';
import type { Project, Scan, DashboardStats } from '../types';
import {
  Plus,
  Shield,
  AlertTriangle,
  Activity,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
  Terminal,
  BarChart3,
  Target,
  Zap
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { format, formatDistanceToNow } from 'date-fns';

// Severity color mapping
const severityColors = {
  CRITICAL: { bg: 'bg-red-100', text: 'text-red-800', bar: 'bg-red-500' },
  HIGH: { bg: 'bg-orange-100', text: 'text-orange-800', bar: 'bg-orange-500' },
  MEDIUM: { bg: 'bg-yellow-100', text: 'text-yellow-800', bar: 'bg-yellow-500' },
  LOW: { bg: 'bg-blue-100', text: 'text-blue-800', bar: 'bg-blue-500' },
  INFO: { bg: 'bg-gray-100', text: 'text-gray-800', bar: 'bg-gray-400' },
};

// Stats Card Component
const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: number; positive: boolean };
  color?: string;
}> = ({ title, value, icon, trend, color = 'indigo' }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
        {trend && (
          <p className={`mt-1 text-sm ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.positive ? '+' : ''}{trend.value}% from last month
          </p>
        )}
      </div>
      <div className={`p-3 rounded-lg bg-${color}-100`}>
        {icon}
      </div>
    </div>
  </div>
);

// Severity Bar Chart Component
const SeverityChart: React.FC<{ stats: DashboardStats }> = ({ stats }) => {
  const total = stats.totalFindings || 1;
  const data = [
    { label: 'Critical', count: stats.criticalFindings, color: 'bg-red-500' },
    { label: 'High', count: stats.highFindings, color: 'bg-orange-500' },
    { label: 'Medium', count: stats.mediumFindings, color: 'bg-yellow-500' },
    { label: 'Low', count: stats.lowFindings, color: 'bg-blue-500' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Findings by Severity</h3>
      <div className="space-y-4">
        {data.map((item) => (
          <div key={item.label}>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium text-gray-700">{item.label}</span>
              <span className="text-gray-500">{item.count}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5">
              <div
                className={`${item.color} h-2.5 rounded-full transition-all duration-500`}
                style={{ width: `${Math.max((item.count / total) * 100, item.count > 0 ? 5 : 0)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Recent Scans Component
const RecentScans: React.FC<{ scans: Scan[] }> = ({ scans }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold text-gray-900">Recent Scans</h3>
      <Link to="/scans" className="text-sm text-indigo-600 hover:text-indigo-800">
        View all
      </Link>
    </div>
    <div className="space-y-3">
      {scans.length === 0 ? (
        <p className="text-gray-500 text-sm py-4 text-center">No scans yet. Start your first scan!</p>
      ) : (
        scans.slice(0, 5).map((scan) => (
          <div
            key={scan.id}
            className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className={`w-2 h-2 rounded-full ${
                scan.status === 'COMPLETED' ? 'bg-green-500' :
                scan.status === 'PROCESSING' ? 'bg-blue-500 animate-pulse' :
                scan.status === 'FAILED' ? 'bg-red-500' : 'bg-gray-400'
              }`} />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {scan.scanType?.charAt(0).toUpperCase() + scan.scanType?.slice(1) || 'Standard'} Scan
                </p>
                <p className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(scan.startedAt), { addSuffix: true })}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {scan.findingsCount && (
                <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">
                  {(scan.findingsCount.CRITICAL || 0) + (scan.findingsCount.HIGH || 0)} issues
                </span>
              )}
              <StatusBadge status={scan.status} />
            </div>
          </div>
        ))
      )}
    </div>
  </div>
);

// Quick Actions Component
const QuickActions: React.FC = () => (
  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-sm p-6 text-white">
    <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
    <div className="grid grid-cols-2 gap-3">
      <Link
        to="/new"
        className="flex items-center space-x-2 p-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
      >
        <Plus className="w-5 h-5" />
        <span className="text-sm font-medium">New Project</span>
      </Link>
      <Link
        to="/scan/quick"
        className="flex items-center space-x-2 p-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
      >
        <Zap className="w-5 h-5" />
        <span className="text-sm font-medium">Quick Scan</span>
      </Link>
      <Link
        to="/cli"
        className="flex items-center space-x-2 p-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
      >
        <Terminal className="w-5 h-5" />
        <span className="text-sm font-medium">Open CLI</span>
      </Link>
      <Link
        to="/reports"
        className="flex items-center space-x-2 p-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
      >
        <BarChart3 className="w-5 h-5" />
        <span className="text-sm font-medium">Reports</span>
      </Link>
    </div>
  </div>
);

// Risk Score Gauge
const RiskScoreGauge: React.FC<{ score: number }> = ({ score }) => {
  const getColor = (s: number) => {
    if (s >= 80) return 'text-red-500';
    if (s >= 60) return 'text-orange-500';
    if (s >= 40) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getLabel = (s: number) => {
    if (s >= 80) return 'Critical';
    if (s >= 60) return 'High Risk';
    if (s >= 40) return 'Medium Risk';
    return 'Low Risk';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Risk Score</h3>
      <div className="flex items-center justify-center">
        <div className="relative w-40 h-40">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="80"
              cy="80"
              r="70"
              stroke="#e5e7eb"
              strokeWidth="12"
              fill="none"
            />
            <circle
              cx="80"
              cy="80"
              r="70"
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
              className={getColor(score)}
              strokeDasharray={`${(score / 100) * 440} 440`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-4xl font-bold ${getColor(score)}`}>{score}</span>
            <span className="text-sm text-gray-500">{getLabel(score)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Projects List
const ProjectsList: React.FC<{ projects: Project[] }> = ({ projects }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
    <div className="px-6 py-4 border-b border-gray-100">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Projects</h3>
        <Link
          to="/new"
          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Project
        </Link>
      </div>
    </div>
    <div className="divide-y divide-gray-100">
      {projects.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <Target className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h4>
          <p className="text-gray-500 mb-4">Create your first project to start scanning APIs</p>
          <Link
            to="/new"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Project
          </Link>
        </div>
      ) : (
        projects.map((project) => {
          const lastScan = project.scans?.[0];
          return (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="block px-6 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 truncate">
                        {project.name}
                      </h4>
                      <p className="text-xs text-gray-500 truncate">
                        {project.targetUrl || project.specUrl || 'No target URL'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  {lastScan && (
                    <div className="hidden sm:flex items-center space-x-2">
                      <StatusBadge status={lastScan.status} />
                      {lastScan.findingsCount && (
                        <div className="flex items-center space-x-1">
                          {(lastScan.findingsCount.CRITICAL || 0) > 0 && (
                            <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-red-100 text-red-700">
                              {lastScan.findingsCount.CRITICAL}C
                            </span>
                          )}
                          {(lastScan.findingsCount.HIGH || 0) > 0 && (
                            <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-orange-100 text-orange-700">
                              {lastScan.findingsCount.HIGH}H
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {!lastScan && (
                    <span className="text-xs text-gray-400">No scans</span>
                  )}
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </Link>
          );
        })
      )}
    </div>
  </div>
);

export const Dashboard: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    totalScans: 0,
    activeScans: 0,
    totalFindings: 0,
    criticalFindings: 0,
    highFindings: 0,
    mediumFindings: 0,
    lowFindings: 0,
    avgRiskScore: 0,
    scansThisMonth: 0,
    findingsFixed: 0,
    recentScans: [],
    topVulnerabilities: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const projectsData = await getProjects();
        setProjects(projectsData);

        // Calculate stats from projects
        const allScans = projectsData.flatMap(p => p.scans || []);
        const allFindings = allScans.flatMap(s => s.findings || []);

        setStats({
          totalProjects: projectsData.length,
          totalScans: allScans.length,
          activeScans: allScans.filter(s => s.status === 'PROCESSING').length,
          totalFindings: allFindings.length,
          criticalFindings: allFindings.filter(f => f.severity === 'CRITICAL').length,
          highFindings: allFindings.filter(f => f.severity === 'HIGH').length,
          mediumFindings: allFindings.filter(f => f.severity === 'MEDIUM').length,
          lowFindings: allFindings.filter(f => f.severity === 'LOW').length,
          avgRiskScore: allScans.reduce((acc, s) => acc + (s.riskScore || 0), 0) / (allScans.length || 1),
          scansThisMonth: allScans.filter(s => {
            const scanDate = new Date(s.startedAt);
            const now = new Date();
            return scanDate.getMonth() === now.getMonth() && scanDate.getFullYear() === now.getFullYear();
          }).length,
          findingsFixed: allFindings.filter(f => f.status === 'FIXED').length,
          recentScans: allScans.sort((a, b) =>
            new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
          ).slice(0, 5),
          topVulnerabilities: [],
        });
      } catch (error) {
        console.error('Failed to fetch data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Security Dashboard</h1>
          <p className="text-gray-500 mt-1">Monitor your API security posture</p>
        </div>
        <Link
          to="/scan/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
        >
          <Zap className="w-4 h-4 mr-2" />
          New Scan
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Projects"
          value={stats.totalProjects}
          icon={<Target className="w-6 h-6 text-indigo-600" />}
        />
        <StatCard
          title="Total Scans"
          value={stats.totalScans}
          icon={<Activity className="w-6 h-6 text-green-600" />}
          trend={{ value: 12, positive: true }}
        />
        <StatCard
          title="Open Findings"
          value={stats.totalFindings - stats.findingsFixed}
          icon={<AlertTriangle className="w-6 h-6 text-orange-600" />}
        />
        <StatCard
          title="Critical Issues"
          value={stats.criticalFindings}
          icon={<Shield className="w-6 h-6 text-red-600" />}
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Projects */}
        <div className="lg:col-span-2 space-y-6">
          <ProjectsList projects={projects} />
          <RecentScans scans={stats.recentScans} />
        </div>

        {/* Right Column - Stats & Actions */}
        <div className="space-y-6">
          <QuickActions />
          <RiskScoreGauge score={Math.round(stats.avgRiskScore)} />
          <SeverityChart stats={stats} />
        </div>
      </div>
    </div>
  );
};
