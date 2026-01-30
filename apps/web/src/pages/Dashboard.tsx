import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProjects } from '../services/api';
import type { DashboardStats } from '../types';
import { useEnvironment } from '../context/EnvironmentContext';
import {
  Shield,
  Activity,
  Clock,
  Folder,
  TrendingUp,
  Terminal,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  Button,
  SeverityBadge,
  SecurityScoreRing,
  StatCard,
} from '../components/ui';

// Dashboard View
export const Dashboard: React.FC = () => {
  const { environment } = useEnvironment();
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

  const [avgScanTime, setAvgScanTime] = useState<string>('0m');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const projectsData = await getProjects();
        // setProjects(projectsData); // Not used directly in this view yet

        const allScans = projectsData.flatMap(p => p.scans || []);
        const allFindings = allScans.flatMap(s => s.findings || []);

        // Calculate Average Scan Time
        const completedScans = allScans.filter(s => s.status === 'COMPLETED' && s.durationSecs);
        if (completedScans.length > 0) {
          const totalDuration = completedScans.reduce((acc, s) => acc + (s.durationSecs || 0), 0);
          const avgDuration = totalDuration / completedScans.length;
          setAvgScanTime(`${Math.round(avgDuration / 60)}m`); // Simple minutes format
        }

        setStats({
          totalProjects: projectsData.length,
          totalScans: allScans.length,
          activeScans: allScans.filter(s => s.status === 'PROCESSING').length,
          totalFindings: allFindings.length,
          criticalFindings: allFindings.filter(f => f.severity === 'CRITICAL').length,
          highFindings: allFindings.filter(f => f.severity === 'HIGH').length,
          mediumFindings: allFindings.filter(f => f.severity === 'MEDIUM').length,
          lowFindings: allFindings.filter(f => f.severity === 'LOW').length,
          avgRiskScore: Math.round(allScans.length > 0 ? (allScans.reduce((acc, s) => acc + (s.riskScore || 0), 0) / allScans.length) : 100), // Default to 100 if no scans
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

  const { recentScans } = stats;

  return (
    <div className="p-8 max-w-[1400px]">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary mb-2 tracking-tight">
          Good morning, Monitor
        </h1>
        <p className="text-sm text-text-secondary">
          Here's your API security overview for today.
        </p>
      </div>

      {/* Security Overview Card */}
      <div className="
        bg-gradient-to-br from-bg-card to-bg-tertiary
        border border-border-primary rounded-2xl p-8 mb-6
        grid grid-cols-1 lg:grid-cols-3 gap-10 items-center
      ">
        <div className="flex flex-col items-center gap-4">
          <SecurityScoreRing score={stats.avgRiskScore} />
          <div className="text-center">
            <div className="text-sm font-semibold text-text-primary">Overall Security Score</div>
            <div className="text-xs text-text-muted mt-1 flex items-center justify-center gap-1">
              <TrendingUp size={12} />
              Calculated from all projects
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-text-primary">Vulnerability Summary</h3>
            <span className="text-xs text-text-muted">Across {stats.totalProjects} projects</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { severity: 'critical', count: stats.criticalFindings, label: 'Critical' },
              { severity: 'high', count: stats.highFindings, label: 'High' },
              { severity: 'medium', count: stats.mediumFindings, label: 'Medium' },
              { severity: 'low', count: stats.lowFindings, label: 'Low' },
            ].map(item => (
              <div key={item.severity} className="bg-bg-elevated rounded-xl p-4 text-center">
                <div className={`
                  text-3xl font-bold tracking-tight
                  ${item.severity === 'critical' ? 'text-severity-critical' :
                    item.severity === 'high' ? 'text-severity-high' :
                      item.severity === 'medium' ? 'text-severity-medium' : 'text-severity-low'}
                `}>
                  {loading ? '-' : item.count}
                </div>
                <div className="text-xs text-text-muted mt-1">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Folder} label="Active Projects" value={stats.totalProjects} trend="+2" trendUp />
        <StatCard icon={Activity} label="Total Scans" value={stats.totalScans} trend="+12%" trendUp />
        <StatCard icon={Shield} label="Issues Fixed" value={stats.findingsFixed} trend="+5" trendUp />
        <StatCard icon={Clock} label="Avg. Scan Time" value={avgScanTime} trend="-8%" trendUp />
      </div>

      {/* Recent Scans */}
      <div className="bg-bg-card border border-border-primary rounded-xl overflow-hidden">
        <div className="px-6 py-5 border-b border-border-secondary flex items-center justify-between">
          <h3 className="text-[15px] font-semibold text-text-primary">Recent Scans</h3>
          <Link to="/scans">
            <Button variant="ghost" size="sm">View All <ChevronRight size={14} /></Button>
          </Link>
        </div>

        <div className="divide-y divide-border-secondary">
          {loading ? (
            <div className="p-6 text-center text-text-muted">Loading scans...</div>
          ) : recentScans.length === 0 ? (
            <div className="p-6 text-center text-text-muted">
              No recent scans found.
              <Link to="/scan/new" className="text-accent-primary ml-1 hover:underline">Start a scan</Link>
            </div>
          ) : (
            recentScans.map((scan) => (
              <Link
                key={scan.id}
                to={`/scans/${scan.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-bg-card-hover transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-bg-elevated flex items-center justify-center group-hover:bg-bg-tertiary transition-colors">
                    <Terminal size={18} className="text-text-muted group-hover:text-text-primary transition-colors" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-text-primary">
                      {/* We don't have project name directly on scan in stats, might be missing unless backend populates it. 
                            If missing, usually existing dashboard logic had it or we might need to populate it map.
                            Assuming `scan.projectId` is available, usually we need to lookup project name.
                            For now, let's display scan type or ID as fallback.
                         */}
                      {/* Existing logic implies scan obj has what we need. Let's use scan type/id */}
                      Scan {scan.id.slice(0, 8)}
                    </div>
                    <div className="text-xs text-text-muted">
                      {formatDistanceToNow(new Date(scan.startedAt))} ago
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {scan.status === 'PROCESSING' || scan.status === 'PENDING' ? (
                    <div className="flex items-center gap-2">
                      <RefreshCw size={14} className="text-accent-primary animate-spin" />
                      <span className="text-[13px] text-accent-primary">Scanning...</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex gap-2">
                        {(scan.findingsCount?.CRITICAL || 0) > 0 && <SeverityBadge severity="critical" badgeCount={scan.findingsCount?.CRITICAL} />}
                        {(scan.findingsCount?.HIGH || 0) > 0 && <SeverityBadge severity="high" badgeCount={scan.findingsCount?.HIGH} />}
                        {(scan.findingsCount?.MEDIUM || 0) > 0 && <SeverityBadge severity="medium" badgeCount={scan.findingsCount?.MEDIUM} />}
                      </div>
                      <div className={`
                        w-12 h-12 rounded-full border-[3px] flex items-center justify-center text-sm font-bold
                        ${(scan.riskScore || 100) >= 80 ? 'border-accent-primary text-accent-primary'
                          : (scan.riskScore || 100) >= 60 ? 'border-severity-medium text-severity-medium'
                            : 'border-severity-high text-severity-high'}
                      `}>
                        {scan.riskScore || 100}
                      </div>
                    </>
                  )}
                  <ChevronRight size={18} className="text-text-muted group-hover:text-text-primary transition-colors" />
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

