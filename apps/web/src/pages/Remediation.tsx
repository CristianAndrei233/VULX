import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Card, CardHeader, Button, SeverityBadge } from '../components/ui';
import {
    TrendingUp,
    CheckCircle,
    Clock,
    AlertTriangle,
    Filter,
    ExternalLink,
    Ticket,
    GitCompare,
    ArrowRight
} from 'lucide-react';
import { clsx } from 'clsx';

interface RemediationStats {
    total: number;
    open: number;
    inProgress: number;
    fixed: number;
    falsePositive: number;
    accepted: number;
    bySeverity: {
        critical: number;
        high: number;
        medium: number;
        low: number;
        info: number;
    };
    fixedLast30Days: number;
}

interface Finding {
    id: string;
    title: string;
    description: string;
    severity: string;
    status: string;
    endpoint: string;
    method: string;
    createdAt: string;
    ticketId?: string;
    ticketUrl?: string;
    ticketStatus?: string;
    scan?: {
        id: string;
        project?: {
            id: string;
            name: string;
        };
    };
}

interface ScanComparison {
    newFindings: Finding[];
    fixedFindings: Finding[];
    unchangedCount: number;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    OPEN: { label: 'Open', color: 'text-red-700', bg: 'bg-red-100' },
    IN_PROGRESS: { label: 'In Progress', color: 'text-amber-700', bg: 'bg-amber-100' },
    FIXED: { label: 'Fixed', color: 'text-emerald-700', bg: 'bg-emerald-100' },
    FALSE_POSITIVE: { label: 'False Positive', color: 'text-slate-700', bg: 'bg-slate-100' },
    ACCEPTED: { label: 'Accepted', color: 'text-purple-700', bg: 'bg-purple-100' },
};

const TICKET_STATUS_COLORS: Record<string, string> = {
    'Open': 'bg-blue-100 text-blue-700',
    'In Progress': 'bg-amber-100 text-amber-700',
    'Done': 'bg-emerald-100 text-emerald-700',
    'Closed': 'bg-slate-100 text-slate-700',
    'Todo': 'bg-indigo-100 text-indigo-700',
};

export function Remediation() {
    const [stats, setStats] = useState<RemediationStats | null>(null);
    const [findings, setFindings] = useState<Finding[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [severityFilter, setSeverityFilter] = useState('all');
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'findings' | 'comparison'>('findings');
    const [comparison, setComparison] = useState<ScanComparison | null>(null);
    const [comparisonLoading, setComparisonLoading] = useState(false);
    const [scanIds, setScanIds] = useState({ before: '', after: '' });

    useEffect(() => {
        fetchData();
    }, [statusFilter, severityFilter]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsRes, findingsRes] = await Promise.all([
                api.get('/remediation/dashboard'),
                api.get('/remediation/findings', {
                    params: {
                        status: statusFilter !== 'all' ? statusFilter : undefined,
                        severity: severityFilter !== 'all' ? severityFilter : undefined,
                    },
                }),
            ]);
            setStats(statsRes.data);
            setFindings(findingsRes.data.findings);
            setPagination(findingsRes.data.pagination);
        } catch (err) {
            console.error('Failed to fetch remediation data:', err);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id: string, status: string) => {
        setUpdatingId(id);
        try {
            await api.patch(`/remediation/findings/${id}/status`, { status });
            fetchData();
        } catch (err) {
            console.error('Failed to update status:', err);
        } finally {
            setUpdatingId(null);
        }
    };

    const fetchComparison = async () => {
        if (!scanIds.before || !scanIds.after) return;
        setComparisonLoading(true);
        try {
            const res = await api.get('/remediation/compare', {
                params: { scan1: scanIds.before, scan2: scanIds.after },
            });
            setComparison({
                newFindings: res.data.newFindings || [],
                fixedFindings: res.data.resolvedFindings || [],
                unchangedCount: res.data.diff?.persisting || 0,
            });
        } catch (err) {
            console.error('Failed to fetch comparison:', err);
        } finally {
            setComparisonLoading(false);
        }
    };

    if (loading && !stats) {
        return (
            <div className="space-y-6">
                <div className="h-10 w-64 skeleton rounded-lg" />
                <div className="grid grid-cols-5 gap-4">
                    {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-24 skeleton rounded-xl" />)}
                </div>
                <div className="h-64 skeleton rounded-xl" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Remediation Dashboard</h1>
                <p className="text-slate-500 mt-1">Track and manage vulnerability remediation</p>
            </div>

            {/* Stats Grid */}
            {stats && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    <Card hoverable>
                        <p className="text-sm font-medium text-slate-500">Total Findings</p>
                        <p className="text-3xl font-bold text-slate-900 mt-1">{stats.total}</p>
                    </Card>
                    <Card hoverable className="border-l-4 border-l-red-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-red-600">Open</p>
                                <p className="text-3xl font-bold text-red-700 mt-1">{stats.open}</p>
                            </div>
                            <AlertTriangle className="w-8 h-8 text-red-200" />
                        </div>
                    </Card>
                    <Card hoverable className="border-l-4 border-l-amber-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-amber-600">In Progress</p>
                                <p className="text-3xl font-bold text-amber-700 mt-1">{stats.inProgress}</p>
                            </div>
                            <Clock className="w-8 h-8 text-amber-200" />
                        </div>
                    </Card>
                    <Card hoverable className="border-l-4 border-l-emerald-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-emerald-600">Fixed</p>
                                <p className="text-3xl font-bold text-emerald-700 mt-1">{stats.fixed}</p>
                            </div>
                            <CheckCircle className="w-8 h-8 text-emerald-200" />
                        </div>
                    </Card>
                    <Card hoverable className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-indigo-100">Fixed (30d)</p>
                                <p className="text-3xl font-bold mt-1">{stats.fixedLast30Days}</p>
                            </div>
                            <TrendingUp className="w-8 h-8 text-white/30" />
                        </div>
                    </Card>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('findings')}
                    className={clsx(
                        'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                        activeTab === 'findings'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                    )}
                >
                    <Filter className="w-4 h-4 inline mr-1.5" />
                    Findings
                </button>
                <button
                    onClick={() => setActiveTab('comparison')}
                    className={clsx(
                        'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                        activeTab === 'comparison'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                    )}
                >
                    <GitCompare className="w-4 h-4 inline mr-1.5" />
                    Scan Comparison
                </button>
            </div>

            {activeTab === 'findings' && (
                <>
                    {/* Severity Breakdown */}
                    {stats && (
                        <Card>
                            <CardHeader title="Open by Severity" />
                            <div className="space-y-3">
                                {Object.entries(stats.bySeverity).map(([severity, count]) => {
                                    const percentage = stats.open > 0 ? (count / stats.open) * 100 : 0;
                                    const colors: Record<string, string> = {
                                        critical: 'bg-red-500',
                                        high: 'bg-orange-500',
                                        medium: 'bg-amber-400',
                                        low: 'bg-blue-500',
                                        info: 'bg-slate-400'
                                    };
                                    return (
                                        <div key={severity} className="flex items-center gap-4">
                                            <span className="w-20 text-sm font-medium text-slate-600 capitalize">{severity}</span>
                                            <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={clsx('h-full rounded-full transition-all', colors[severity])}
                                                    style={{ width: `${Math.min(percentage, 100)}%` }}
                                                />
                                            </div>
                                            <span className="w-10 text-sm font-semibold text-slate-700 text-right">{count}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>
                    )}

                    {/* Filters */}
                    <Card>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4 text-slate-400" />
                                <span className="text-sm font-medium text-slate-600">Filters:</span>
                            </div>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                            >
                                <option value="all">All Statuses</option>
                                <option value="OPEN">Open</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="FIXED">Fixed</option>
                                <option value="FALSE_POSITIVE">False Positive</option>
                                <option value="ACCEPTED">Accepted</option>
                            </select>
                            <select
                                value={severityFilter}
                                onChange={(e) => setSeverityFilter(e.target.value)}
                                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                            >
                                <option value="all">All Severities</option>
                                <option value="CRITICAL">Critical</option>
                                <option value="HIGH">High</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="LOW">Low</option>
                                <option value="INFO">Info</option>
                            </select>
                        </div>
                    </Card>

                    {/* Findings Table */}
                    <Card padding="none" className="overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Severity</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Finding</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Project</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Ticket</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {findings.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-5 py-12 text-center">
                                                <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                                                <p className="text-sm font-medium text-slate-900">No findings match your filters</p>
                                                <p className="text-xs text-slate-500 mt-1">Try adjusting the filters above</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        findings.map(finding => {
                                            const statusConfig = STATUS_CONFIG[finding.status] || STATUS_CONFIG.OPEN;
                                            const ticketStatusClass = finding.ticketStatus
                                                ? TICKET_STATUS_COLORS[finding.ticketStatus] || 'bg-slate-100 text-slate-700'
                                                : '';
                                            return (
                                                <tr key={finding.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-5 py-3">
                                                        <SeverityBadge severity={finding.severity as any} size="sm" />
                                                    </td>
                                                    <td className="px-5 py-3">
                                                        <p className="text-sm font-medium text-slate-900 truncate max-w-xs">
                                                            {finding.title || finding.description?.substring(0, 50)}
                                                        </p>
                                                        <p className="text-xs text-slate-500 mt-0.5">
                                                            <code>{finding.method}</code> {finding.endpoint}
                                                        </p>
                                                    </td>
                                                    <td className="px-5 py-3">
                                                        {finding.scan?.project ? (
                                                            <Link
                                                                to={`/projects/${finding.scan.project.id}`}
                                                                className="text-sm text-indigo-600 hover:underline flex items-center gap-1"
                                                            >
                                                                {finding.scan.project.name}
                                                                <ExternalLink className="w-3 h-3" />
                                                            </Link>
                                                        ) : (
                                                            <span className="text-sm text-slate-400">—</span>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-3">
                                                        <span className={clsx('text-xs font-semibold px-2 py-1 rounded-full', statusConfig.bg, statusConfig.color)}>
                                                            {statusConfig.label}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3">
                                                        {finding.ticketId ? (
                                                            <a
                                                                href={finding.ticketUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1.5 text-xs"
                                                            >
                                                                <Ticket className="w-3.5 h-3.5 text-indigo-500" />
                                                                <span className="text-indigo-600 hover:underline">{finding.ticketId}</span>
                                                                {finding.ticketStatus && (
                                                                    <span className={clsx('px-1.5 py-0.5 rounded text-xs font-medium', ticketStatusClass)}>
                                                                        {finding.ticketStatus}
                                                                    </span>
                                                                )}
                                                            </a>
                                                        ) : (
                                                            <span className="text-xs text-slate-400">No ticket</span>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-3">
                                                        <select
                                                            className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                            value={finding.status}
                                                            disabled={updatingId === finding.id}
                                                            onChange={(e) => updateStatus(finding.id, e.target.value)}
                                                        >
                                                            <option value="OPEN">Open</option>
                                                            <option value="IN_PROGRESS">In Progress</option>
                                                            <option value="FIXED">Fixed</option>
                                                            <option value="FALSE_POSITIVE">False Positive</option>
                                                            <option value="ACCEPTED">Accepted</option>
                                                        </select>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {/* Pagination Info */}
                    {pagination && pagination.totalPages > 1 && (
                        <div className="text-center text-sm text-slate-500">
                            Showing {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                        </div>
                    )}
                </>
            )}

            {activeTab === 'comparison' && (
                <div className="space-y-6">
                    {/* Scan Selection */}
                    <Card>
                        <CardHeader title="Compare Scans" subtitle="See what changed between two scans" />
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4 mt-4">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-slate-600 mb-1">Before Scan ID</label>
                                <input
                                    type="text"
                                    value={scanIds.before}
                                    onChange={(e) => setScanIds(s => ({ ...s, before: e.target.value }))}
                                    placeholder="Enter scan ID..."
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                />
                            </div>
                            <ArrowRight className="w-5 h-5 text-slate-400 hidden sm:block self-center" />
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-slate-600 mb-1">After Scan ID</label>
                                <input
                                    type="text"
                                    value={scanIds.after}
                                    onChange={(e) => setScanIds(s => ({ ...s, after: e.target.value }))}
                                    placeholder="Enter scan ID..."
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                />
                            </div>
                            <Button
                                onClick={fetchComparison}
                                disabled={!scanIds.before || !scanIds.after || comparisonLoading}
                            >
                                {comparisonLoading ? 'Comparing...' : 'Compare'}
                            </Button>
                        </div>
                    </Card>

                    {/* Comparison Results */}
                    {comparison && (
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* New Findings */}
                            <Card className="border-l-4 border-l-red-500">
                                <CardHeader
                                    title={`New Findings (${comparison.newFindings.length})`}
                                    subtitle="Vulnerabilities introduced in the new scan"
                                />
                                {comparison.newFindings.length === 0 ? (
                                    <div className="text-center py-6">
                                        <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                                        <p className="text-sm text-slate-500">No new vulnerabilities!</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2 mt-4">
                                        {comparison.newFindings.slice(0, 10).map(f => (
                                            <div key={f.id} className="flex items-center gap-3 p-2 bg-red-50 rounded-lg">
                                                <SeverityBadge severity={f.severity as any} size="sm" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-slate-900 truncate">{f.title}</p>
                                                    <p className="text-xs text-slate-500">{f.endpoint}</p>
                                                </div>
                                            </div>
                                        ))}
                                        {comparison.newFindings.length > 10 && (
                                            <p className="text-xs text-slate-500 text-center pt-2">
                                                +{comparison.newFindings.length - 10} more
                                            </p>
                                        )}
                                    </div>
                                )}
                            </Card>

                            {/* Fixed Findings */}
                            <Card className="border-l-4 border-l-emerald-500">
                                <CardHeader
                                    title={`Fixed Findings (${comparison.fixedFindings.length})`}
                                    subtitle="Vulnerabilities resolved since last scan"
                                />
                                {comparison.fixedFindings.length === 0 ? (
                                    <div className="text-center py-6">
                                        <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                                        <p className="text-sm text-slate-500">No fixes detected</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2 mt-4">
                                        {comparison.fixedFindings.slice(0, 10).map(f => (
                                            <div key={f.id} className="flex items-center gap-3 p-2 bg-emerald-50 rounded-lg">
                                                <SeverityBadge severity={f.severity as any} size="sm" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-slate-900 truncate">{f.title}</p>
                                                    <p className="text-xs text-slate-500">{f.endpoint}</p>
                                                </div>
                                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                                            </div>
                                        ))}
                                        {comparison.fixedFindings.length > 10 && (
                                            <p className="text-xs text-slate-500 text-center pt-2">
                                                +{comparison.fixedFindings.length - 10} more
                                            </p>
                                        )}
                                    </div>
                                )}
                            </Card>
                        </div>
                    )}

                    {comparison && (
                        <Card className="bg-slate-50">
                            <div className="text-center">
                                <p className="text-sm text-slate-600">
                                    <span className="font-semibold">{comparison.unchangedCount}</span> findings unchanged between scans
                                </p>
                            </div>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
}
