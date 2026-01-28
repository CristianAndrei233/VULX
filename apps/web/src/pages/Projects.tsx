import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProjects } from '../services/api';
import type { Project } from '../types';
import { useEnvironment } from '../context/EnvironmentContext';
import {
  Plus,
  Shield,
  Search,
  ChevronRight,
  Clock,
  AlertTriangle,
  CheckCircle,
  FolderOpen,
  Filter,
  Grid3X3,
  List,
  Loader2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Card, Button, Badge, StatusBadge } from '../components/ui';
import { clsx } from 'clsx';

type ViewMode = 'grid' | 'list';
type FilterStatus = 'all' | 'active' | 'clean' | 'issues';

export const Projects: React.FC = () => {
  const { environment } = useEnvironment();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      try {
        const data = await getProjects();
        setProjects(data);
      } catch (error) {
        console.error('Failed to fetch projects', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [environment]);

  // Filter and search projects
  const filteredProjects = projects.filter((project) => {
    // Search filter
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.targetUrl?.toLowerCase().includes(searchQuery.toLowerCase()));

    // Status filter
    const lastScan = project.scans?.[0];
    const hasIssues = lastScan?.findings && lastScan.findings.length > 0;
    const hasCritical = lastScan?.findings?.some(f => f.severity === 'CRITICAL' || f.severity === 'HIGH');

    let matchesFilter = true;
    if (filterStatus === 'active') {
      matchesFilter = lastScan?.status === 'PROCESSING' || lastScan?.status === 'PENDING';
    } else if (filterStatus === 'clean') {
      matchesFilter = lastScan && !hasIssues;
    } else if (filterStatus === 'issues') {
      matchesFilter = hasIssues || false;
    }

    return matchesSearch && matchesFilter;
  });

  // Get stats
  const stats = {
    total: projects.length,
    withIssues: projects.filter(p => p.scans?.[0]?.findings && p.scans[0].findings.length > 0).length,
    clean: projects.filter(p => p.scans?.[0] && (!p.scans[0].findings || p.scans[0].findings.length === 0)).length,
    neverScanned: projects.filter(p => !p.scans || p.scans.length === 0).length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-industrial-action" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Projects</h1>
          <p className="text-slate-500 mt-1">
            {environment === 'SANDBOX' ? 'Sandbox' : 'Production'} environment - {stats.total} projects
          </p>
        </div>
        <Link to="/new">
          <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
            New Project
          </Button>
        </Link>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => setFilterStatus('all')}
          className={clsx(
            'p-4 rounded-lg border transition-all text-left',
            filterStatus === 'all'
              ? 'border-industrial-action bg-industrial-action/5'
              : 'border-slate-200 hover:border-slate-300 bg-white'
          )}
        >
          <div className="flex items-center gap-2 text-slate-600 mb-1">
            <FolderOpen className="w-4 h-4" />
            <span className="text-sm font-medium">All Projects</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
        </button>

        <button
          onClick={() => setFilterStatus('issues')}
          className={clsx(
            'p-4 rounded-lg border transition-all text-left',
            filterStatus === 'issues'
              ? 'border-severity-high bg-severity-high/5'
              : 'border-slate-200 hover:border-slate-300 bg-white'
          )}
        >
          <div className="flex items-center gap-2 text-severity-high mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">With Issues</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.withIssues}</p>
        </button>

        <button
          onClick={() => setFilterStatus('clean')}
          className={clsx(
            'p-4 rounded-lg border transition-all text-left',
            filterStatus === 'clean'
              ? 'border-severity-success bg-severity-success/5'
              : 'border-slate-200 hover:border-slate-300 bg-white'
          )}
        >
          <div className="flex items-center gap-2 text-severity-success mb-1">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Clean</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.clean}</p>
        </button>

        <div className="p-4 rounded-lg border border-slate-200 bg-white">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">Never Scanned</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.neverScanned}</p>
        </div>
      </div>

      {/* Search and View Toggle */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search projects by name or URL..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-industrial-action focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2 border border-slate-200 rounded-lg p-1 bg-white">
          <button
            onClick={() => setViewMode('grid')}
            className={clsx(
              'p-2 rounded-md transition-colors',
              viewMode === 'grid' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'
            )}
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={clsx(
              'p-2 rounded-md transition-colors',
              viewMode === 'list' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'
            )}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Projects Grid/List */}
      {filteredProjects.length === 0 ? (
        <Card className="py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="w-8 h-8 text-slate-400" />
          </div>
          {projects.length === 0 ? (
            <>
              <h4 className="text-lg font-medium text-slate-900 mb-2">No projects yet</h4>
              <p className="text-slate-500 mb-4">Create your first project to start scanning APIs</p>
              <Link to="/new">
                <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
                  Create Project
                </Button>
              </Link>
            </>
          ) : (
            <>
              <h4 className="text-lg font-medium text-slate-900 mb-2">No matching projects</h4>
              <p className="text-slate-500">Try adjusting your search or filter criteria</p>
            </>
          )}
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project, index) => {
            const lastScan = project.scans?.[0];
            const criticalCount = lastScan?.findings?.filter(f => f.severity === 'CRITICAL').length || 0;
            const highCount = lastScan?.findings?.filter(f => f.severity === 'HIGH').length || 0;
            const totalIssues = lastScan?.findings?.length || 0;

            return (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="block animate-fade-in"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <Card hoverable className="h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-industrial-surface flex items-center justify-center">
                        <Shield className="w-5 h-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-slate-900 truncate">{project.name}</h3>
                        <p className="text-xs text-slate-500 truncate max-w-[180px]">
                          {project.targetUrl || 'No target URL'}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  </div>

                  <div className="space-y-3">
                    {lastScan ? (
                      <>
                        <div className="flex items-center justify-between">
                          <StatusBadge status={lastScan.status} size="sm" />
                          <span className="text-xs text-slate-500">
                            {formatDistanceToNow(new Date(lastScan.startedAt), { addSuffix: true })}
                          </span>
                        </div>
                        {totalIssues > 0 ? (
                          <div className="flex items-center gap-2">
                            {criticalCount > 0 && (
                              <Badge variant="critical" size="sm">{criticalCount} Critical</Badge>
                            )}
                            {highCount > 0 && (
                              <Badge variant="high" size="sm">{highCount} High</Badge>
                            )}
                            {totalIssues - criticalCount - highCount > 0 && (
                              <Badge variant="default" size="sm">
                                +{totalIssues - criticalCount - highCount} more
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-severity-success">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">No issues found</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center gap-2 text-slate-400">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">Never scanned</span>
                      </div>
                    )}
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card padding="none">
          <div className="divide-y divide-slate-100">
            {filteredProjects.map((project, index) => {
              const lastScan = project.scans?.[0];
              const criticalCount = lastScan?.findings?.filter(f => f.severity === 'CRITICAL').length || 0;
              const highCount = lastScan?.findings?.filter(f => f.severity === 'HIGH').length || 0;

              return (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors animate-fade-in"
                  style={{ animationDelay: `${index * 20}ms` }}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-industrial-surface flex items-center justify-center flex-shrink-0">
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-900 truncate">{project.name}</h3>
                      <p className="text-sm text-slate-500 truncate">
                        {project.targetUrl || 'No target URL'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {lastScan ? (
                      <>
                        <div className="hidden md:flex items-center gap-2">
                          {criticalCount > 0 && (
                            <Badge variant="critical" size="sm">{criticalCount}C</Badge>
                          )}
                          {highCount > 0 && (
                            <Badge variant="high" size="sm">{highCount}H</Badge>
                          )}
                        </div>
                        <StatusBadge status={lastScan.status} size="sm" />
                        <span className="text-sm text-slate-500 hidden lg:block w-24 text-right">
                          {formatDistanceToNow(new Date(lastScan.startedAt), { addSuffix: true })}
                        </span>
                      </>
                    ) : (
                      <span className="text-sm text-slate-400 italic">Never scanned</span>
                    )}
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
};
