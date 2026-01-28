import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProjects } from '../services/api';
import type { Project, Scan, DashboardStats } from '../types';
import { useEnvironment } from '../context/EnvironmentContext';
import {
  Plus,
  Shield,
  Activity,
  AlertTriangle,
  ChevronRight,

  BarChart3,
  Target,
  Zap,
  TrendingUp,
  Clock,
  ExternalLink
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardHeader, Button, Badge, StatusBadge } from '../components/ui';
import { clsx } from 'clsx';

// Enhanced Stats Card Component
const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: number; positive: boolean };
  gradient: string;
  iconBg: string;
}> = ({ title, value, icon, trend, iconBg,
}) => (
    <Card variant="default" padding="md" hoverable className="relative overflow-hidden border-industrial-border">
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {trend && (
              <p className={clsx(
                'mt-2 text-sm font-medium flex items-center gap-1',
                trend.positive ? 'text-severity-success' : 'text-severity-critical'
              )}>
                <TrendingUp className={clsx('w-4 h-4', !trend.positive && 'rotate-180')} />
                {trend.positive ? '+' : ''}{trend.value}% from last month
              </p>
            )}
          </div>
          <div className={clsx('w-12 h-12 rounded-industrial flex items-center justify-center bg-gray-50', iconBg)}>
            {icon}
          </div>
        </div>
      </div>
    </Card>
  );

// Severity Chart Component
const SeverityChart: React.FC<{ stats: DashboardStats }> = ({ stats }) => {
  const total = stats.totalFindings || 1;
  const data = [
    { label: 'Critical', count: stats.criticalFindings, color: 'bg-severity-critical', textColor: 'text-severity-critical' },
    { label: 'High', count: stats.highFindings, color: 'bg-severity-high', textColor: 'text-severity-high' },
    { label: 'Medium', count: stats.mediumFindings, color: 'bg-severity-medium', textColor: 'text-severity-medium' },
    { label: 'Low', count: stats.lowFindings, color: 'bg-severity-low', textColor: 'text-severity-low' },
  ];

  return (
    <Card>
      <CardHeader title="Findings by Severity" />
      <div className="space-y-4">
        {data.map((item) => (
          <div key={item.label}>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium text-slate-700">{item.label}</span>
              <span className={clsx('font-semibold', item.textColor)}>{item.count}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className={clsx(item.color, 'h-full rounded-full transition-all duration-700 ease-out')}
                style={{ width: `${Math.max((item.count / total) * 100, item.count > 0 ? 5 : 0)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

// Recent Scans Component
const RecentScans: React.FC<{ scans: Scan[] }> = ({ scans }) => (
  <Card>
    <CardHeader
      title="Recent Scans"
      action={
        <Link to="/scans" className="text-sm text-industrial-action hover:text-industrial-action-hover font-medium flex items-center gap-1">
          View all <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      }
    />
    <div className="space-y-3">
      {scans.length === 0 ? (
        <div className="py-8 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
            <Activity className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-slate-500 text-sm">No scans yet</p>
          <p className="text-slate-400 text-xs mt-1">Start your first scan!</p>
        </div>
      ) : (
        scans.slice(0, 5).map((scan, index) => (
          <div
            key={scan.id}
            className={clsx(
              'flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors',
              'animate-fade-in'
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-center space-x-3">
              <div className={clsx(
                'w-2.5 h-2.5 rounded-full',
                scan.status === 'COMPLETED' ? 'bg-severity-success' :
                  scan.status === 'PROCESSING' ? 'bg-industrial-action animate-pulse' :
                    scan.status === 'FAILED' ? 'bg-severity-critical' : 'bg-gray-400'
              )} />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {scan.scanType?.charAt(0).toUpperCase() + scan.scanType?.slice(1) || 'Standard'} Scan
                </p>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(new Date(scan.startedAt), { addSuffix: true })}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {scan.findingsCount && (
                <Badge variant="danger" size="sm">
                  {(scan.findingsCount.CRITICAL || 0) + (scan.findingsCount.HIGH || 0)} issues
                </Badge>
              )}
              <StatusBadge status={scan.status} size="sm" />
            </div>
          </div>
        ))
      )}
    </div>
  </Card>
);

// Quick Actions Component
const QuickActions: React.FC = () => (
  <Card className="bg-industrial-surface border-0 text-white">
    <h3 className="text-lg font-semibold mb-4 text-industrial-base">Quick Actions</h3>
    <div className="grid grid-cols-2 gap-3">
      {[
        { to: '/new', icon: <Plus className="w-5 h-5" />, label: 'New Project' },
        { to: '/scan/quick', icon: <Zap className="w-5 h-5" />, label: 'Quick Scan' },

        { to: '/reports', icon: <BarChart3 className="w-5 h-5" />, label: 'Reports' },
      ].map((action) => (
        <Link
          key={action.to}
          to={action.to}
          className="flex items-center space-x-2 p-3 rounded-industrial bg-white/10 hover:bg-white/20 transition-all hover:scale-[1.02] text-industrial-base"
        >
          {action.icon}
          <span className="text-sm font-medium">{action.label}</span>
        </Link>
      ))}
    </div>
  </Card>
);

// Risk Score Gauge
const RiskScoreGauge: React.FC<{ score: number }> = ({ score }) => {
  const getColor = (s: number) => {
    if (s >= 80) return { stroke: '#ef4444', bg: 'bg-red-50', text: 'text-severity-critical' };
    if (s >= 60) return { stroke: '#f97316', bg: 'bg-orange-50', text: 'text-severity-high' };
    if (s >= 40) return { stroke: '#f59e0b', bg: 'bg-amber-50', text: 'text-severity-medium' };
    return { stroke: '#10b981', bg: 'bg-emerald-50', text: 'text-severity-success' };
  };

  const getLabel = (s: number) => {
    if (s >= 80) return 'Critical Risk';
    if (s >= 60) return 'High Risk';
    if (s >= 40) return 'Medium Risk';
    return 'Low Risk';
  };

  const colors = getColor(score);
  const circumference = 2 * Math.PI * 70;
  const offset = circumference - (score / 100) * circumference;

  return (
    <Card className={colors.bg}>
      <CardHeader title="Overall Risk Score" />
      <div className="flex items-center justify-center py-4">
        <div className="relative w-40 h-40">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="80"
              cy="80"
              r="70"
              stroke="#e2e8f0"
              strokeWidth="10"
              fill="none"
            />
            <circle
              cx="80"
              cy="80"
              r="70"
              stroke={colors.stroke}
              strokeWidth="10"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={clsx('text-4xl font-bold', colors.text)}>{score}</span>
            <span className="text-sm text-slate-500 font-medium">{getLabel(score)}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

// Projects List
const ProjectsList: React.FC<{ projects: Project[] }> = ({ projects }) => (
  <Card padding="none">
    <div className="px-6 py-4 border-b border-slate-100">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Projects</h3>
        <Button variant="secondary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
          <Link to="/new">Add Project</Link>
        </Button>
      </div>
    </div>
    <div className="divide-y divide-slate-100">
      {projects.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-slate-400" />
          </div>
          <h4 className="text-lg font-medium text-slate-900 mb-2">No projects yet</h4>
          <p className="text-slate-500 mb-4 text-sm">Create your first project to start scanning APIs</p>
          <Link to="/new">
            <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
              Create Project
            </Button>
          </Link>
        </div>
      ) : (
        projects.map((project, index) => {
          const lastScan = project.scans?.[0];
          return (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="block px-6 py-4 hover:bg-slate-50 transition-colors animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-11 h-11 rounded-industrial bg-industrial-surface flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">{project.name}</h4>
                    <p className="text-xs text-slate-500 truncate max-w-xs">
                      {project.targetUrl || project.specUrl || 'No target URL'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  {lastScan && (
                    <div className="hidden sm:flex items-center space-x-2">
                      <StatusBadge status={lastScan.status} size="sm" />
                      {lastScan.findingsCount && (
                        <div className="flex items-center space-x-1">
                          {(lastScan.findingsCount.CRITICAL || 0) > 0 && (
                            <Badge variant="critical" size="sm">
                              {lastScan.findingsCount.CRITICAL}C
                            </Badge>
                          )}
                          {(lastScan.findingsCount.HIGH || 0) > 0 && (
                            <Badge variant="high" size="sm">
                              {lastScan.findingsCount.HIGH}H
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {!lastScan && (
                    <span className="text-xs text-slate-400 italic">No scans</span>
                  )}
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>
              </div>
            </Link>
          );
        })
      )}
    </div>
  </Card>
);

// Loading Skeleton
const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <div className="h-8 w-48 skeleton mb-2" />
        <div className="h-4 w-64 skeleton" />
      </div>
      <div className="h-10 w-32 skeleton rounded-lg" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-32 skeleton rounded-xl" />
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 h-96 skeleton rounded-xl" />
      <div className="h-96 skeleton rounded-xl" />
    </div>
  </div>
);

export const Dashboard: React.FC = () => {
  const { environment } = useEnvironment();
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
      setLoading(true);
      try {
        const projectsData = await getProjects();
        setProjects(projectsData);

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
  }, [environment]);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Security Dashboard</h1>
          <p className="text-slate-500 mt-1">Monitor your API security posture</p>
        </div>
        <Link to="/scan/new">
          <Button variant="primary" leftIcon={<Zap className="w-4 h-4" />}>
            New Scan
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Projects"
          value={stats.totalProjects}
          icon={<Target className="w-6 h-6 text-industrial-action" />}
          iconBg="bg-industrial-surface/5"
          gradient=""
        />
        <StatCard
          title="Total Scans"
          value={stats.totalScans}
          icon={<Activity className="w-6 h-6 text-severity-success" />}
          trend={{ value: 12, positive: true }}
          iconBg="bg-severity-success/10"
          gradient=""
        />
        <StatCard
          title="Open Findings"
          value={stats.totalFindings - stats.findingsFixed}
          icon={<AlertTriangle className="w-6 h-6 text-severity-medium" />}
          iconBg="bg-severity-medium/10"
          gradient=""
        />
        <StatCard
          title="Critical Issues"
          value={stats.criticalFindings}
          icon={<Shield className="w-6 h-6 text-severity-critical" />}
          iconBg="bg-severity-critical/10"
          gradient=""
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
