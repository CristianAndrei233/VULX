import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Card, Button, SeverityBadge, StatCard } from '../components/ui';
import {
    TrendingUp,
    CheckCircle,
    Clock,
    AlertTriangle,
    Filter,
    ExternalLink,
    Ticket,
    GitCompare,
    ArrowRight,
    Activity,
    Search
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
    OPEN: { label: 'Open', color: 'text-severity-critical', bg: 'bg-severity-critical/10' },
    IN_PROGRESS: { label: 'In Progress', color: 'text-severity-high', bg: 'bg-severity-high/10' },
    FIXED: { label: 'Fixed', color: 'text-severity-success', bg: 'bg-severity-success/10' },
    FALSE_POSITIVE: { label: 'False Positive', color: 'text-text-muted', bg: 'bg-bg-tertiary' },
    ACCEPTED: { label: 'Accepted', color: 'text-severity-medium', bg: 'bg-severity-medium/10' },
};

const TICKET_STATUS_COLORS: Record<string, string> = {
    'Open': 'bg-accent-primary/10 text-accent-primary',
    'In Progress': 'bg-severity-high/10 text-severity-high',
    'Done': 'bg-severity-success/10 text-severity-success',
    'Closed': 'bg-bg-tertiary text-text-muted',
    'Todo': 'bg-bg-elevated text-text-secondary',
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
            <div className="space-y-6 animate-pulse">
                <div className="h-10 w-64 bg-bg-elevated rounded-lg" />
                <div className="grid grid-cols-5 gap-4">
                    {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-24 bg-bg-elevated rounded-xl" />)}
                </div>
                <div className="h-64 bg-bg-elevated rounded-xl" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-text-primary">Remediation</h1>
                <p className="text-text-muted mt-1">Track and manage remediation, compare scans, and sync with tickets.</p>
            </div>

            {/* Stats Grid */}
            {stats && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    <StatCard icon={Activity} label="Total Findings" value={stats.total} />
                    <StatCard icon={AlertTriangle} label="Open" value={stats.open} />
                    <StatCard icon={Clock} label="In Progress" value={stats.inProgress} />
                    <StatCard icon={CheckCircle} label="Fixed" value={stats.fixed} />
                    <StatCard icon={TrendingUp} label="Fixed (30d)" value={stats.fixedLast30Days} trendUp trend="+5%" />
                </div>
            )}

            {/* Tabs */}
            <div className="flex border-b border-border-secondary">
                <button
                    onClick={() => setActiveTab('findings')}
                    className={clsx(
                        'px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-2',
                        activeTab === 'findings'
                            ? 'border-accent-primary text-accent-primary'
                            : 'border-transparent text-text-muted hover:text-text-primary'
                    )}
                >
                    <Filter className="w-4 h-4" />
                    Findings
                </button>
                <button
                    onClick={() => setActiveTab('comparison')}
                    className={clsx(
                        'px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-2',
                        activeTab === 'comparison'
                            ? 'border-accent-primary text-accent-primary'
                            : 'border-transparent text-text-muted hover:text-text-primary'
                    )}
                >
                    <GitCompare className="w-4 h-4" />
                    Compare Scans
                </button>
            </div>

            {activeTab === 'findings' && (
                <div className="space-y-6 animate-fade-in">
                    {/* Severity Breakdown */}
                    {stats && (
                        <Card>
                            <div className="mb-4">
                                <h3 className="text-base font-semibold text-text-primary">Open by Severity</h3>
                            </div>
                            <div className="space-y-4">
                                {Object.entries(stats.bySeverity).map(([severity, count]) => {
                                    const percentage = stats.open > 0 ? (count / stats.open) * 100 : 0;
                                    const colors: Record<string, string> = {
                                        critical: 'bg-severity-critical',
                                        high: 'bg-severity-high',
                                        medium: 'bg-severity-medium',
                                        low: 'bg-severity-low',
                                        info: 'bg-severity-info'
                                    };
                                    return (
                                        <div key={severity} className="flex items-center gap-4">
                                            <span className="w-20 text-xs font-semibold text-text-secondary uppercase tracking-wider">{severity}</span>
                                            <div className="flex-1 h-2 bg-bg-tertiary rounded-full overflow-hidden">
                                                <div
                                                    className={clsx('h-full rounded-full transition-all duration-500', colors[severity] || 'bg-text-muted')}
                                                    style={{ width: `${Math.min(percentage, 100)}%` }}
                                                />
                                            </div>
                                            <span className="w-10 text-sm font-bold text-text-primary text-right">{count}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>
                    )}

                    {/* Filters */}
                    <Card>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 p-1">
                            <div className="flex items-center gap-3 text-text-muted px-2">
                                <Filter className="w-4 h-4" />
                                <span className="text-sm font-medium">Filters:</span>
                            </div>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-4 py-2 bg-bg-tertiary border border-border-secondary rounded-lg focus:outline-none focus:ring-1 focus:ring-accent-primary text-sm transition-all text-text-primary placeholder:text-text-muted"
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
                                className="px-4 py-2 bg-bg-tertiary border border-border-secondary rounded-lg focus:outline-none focus:ring-1 focus:ring-accent-primary text-sm transition-all text-text-primary placeholder:text-text-muted"
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
                    <Card className="overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-bg-tertiary/50 border-b border-border-secondary">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Severity</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Finding</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Project</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Ticket</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-secondary">
                                    {findings.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center">
                                                <div className="w-16 h-16 rounded-full bg-bg-tertiary flex items-center justify-center mx-auto mb-4">
                                                    <CheckCircle className="w-8 h-8 text-severity-success" />
                                                </div>
                                                <p className="text-sm font-medium text-text-primary">No findings match your filters</p>
                                                <p className="text-xs text-text-muted mt-1">Try adjusting the filters above</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        findings.map(finding => {
                                            const statusConfig = STATUS_CONFIG[finding.status] || STATUS_CONFIG.OPEN;
                                            const ticketStatusClass = finding.ticketStatus
                                                ? TICKET_STATUS_COLORS[finding.ticketStatus] || 'bg-bg-tertiary text-text-muted'
                                                : '';
                                            return (
                                                <tr key={finding.id} className="hover:bg-bg-tertiary/30 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <SeverityBadge severity={finding.severity.toLowerCase() as any} />
                                                    </td>
                                                    <td className="px-6 py-4 max-w-sm">
                                                        <p className="text-sm font-medium text-text-primary truncate">
                                                            {finding.title || finding.description?.substring(0, 50)}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <code className="text-xs font-mono bg-bg-tertiary px-1.5 py-0.5 rounded text-text-secondary border border-border-secondary">{finding.method}</code>
                                                            <span className="text-xs text-text-muted truncate">{finding.endpoint}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {finding.scan?.project ? (
                                                            <Link
                                                                to={`/projects/${finding.scan.project.id}`}
                                                                className="text-sm text-accent-primary hover:underline flex items-center gap-1 font-medium"
                                                            >
                                                                {finding.scan.project.name}
                                                                <ExternalLink className="w-3 h-3" />
                                                            </Link>
                                                        ) : (
                                                            <span className="text-sm text-text-muted">—</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={clsx('text-xs font-bold px-2.5 py-1 rounded-full border border-transparent', statusConfig.bg, statusConfig.color)}>
                                                            {statusConfig.label}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {finding.ticketId ? (
                                                            <a
                                                                href={finding.ticketUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1.5 text-xs group"
                                                            >
                                                                <Ticket className="w-3.5 h-3.5 text-text-muted group-hover:text-accent-primary transition-colors" />
                                                                <span className="text-text-secondary group-hover:text-accent-primary transition-colors font-mono">{finding.ticketId}</span>
                                                                {finding.ticketStatus && (
                                                                    <span className={clsx('px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider', ticketStatusClass)}>
                                                                        {finding.ticketStatus}
                                                                    </span>
                                                                )}
                                                            </a>
                                                        ) : (
                                                            <span className="text-xs text-text-muted italic">No ticket</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <select
                                                            className="text-xs bg-bg-base border border-border-secondary rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-accent-primary text-text-secondary"
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
                        <div className="flex items-center justify-between text-sm text-text-muted">
                            <span>
                                Showing <span className="font-medium text-text-primary">{(pagination.page - 1) * pagination.limit + 1}</span> - <span className="font-medium text-text-primary">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="font-medium text-text-primary">{pagination.total}</span>
                            </span>
                            <div className="flex gap-2">
                                <Button variant="secondary" size="sm" disabled={pagination.page === 1} onClick={() => { }}>Previous</Button>
                                <Button variant="secondary" size="sm" disabled={pagination.page === pagination.totalPages} onClick={() => { }}>Next</Button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'comparison' && (
                <div className="space-y-6 animate-fade-in">
                    {/* Scan Selection */}
                    <Card>
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-text-primary">Compare Scans</h3>
                            <p className="text-sm text-text-muted">Analyze changes between two separate scans to track progress.</p>
                        </div>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4">
                            <div className="flex-1">
                                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Before Scan ID</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                    <input
                                        type="text"
                                        value={scanIds.before}
                                        onChange={(e) => setScanIds(s => ({ ...s, before: e.target.value }))}
                                        placeholder="Enter scan ID..."
                                        className="w-full pl-9 pr-4 py-2.5 bg-bg-base border border-border-secondary rounded-xl focus:outline-none focus:ring-1 focus:ring-accent-primary text-sm transition-all text-text-primary placeholder:text-text-muted"
                                    />
                                </div>
                            </div>
                            <ArrowRight className="w-5 h-5 text-text-muted hidden sm:block self-center mb-1" />
                            <div className="flex-1">
                                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">After Scan ID</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                    <input
                                        type="text"
                                        value={scanIds.after}
                                        onChange={(e) => setScanIds(s => ({ ...s, after: e.target.value }))}
                                        placeholder="Enter scan ID..."
                                        className="w-full pl-9 pr-4 py-2.5 bg-bg-base border border-border-secondary rounded-xl focus:outline-none focus:ring-1 focus:ring-accent-primary text-sm transition-all text-text-primary placeholder:text-text-muted"
                                    />
                                </div>
                            </div>
                            <Button
                                onClick={fetchComparison}
                                disabled={!scanIds.before || !scanIds.after || comparisonLoading}
                                className="mb-px h-[42px]"
                            >
                                {comparisonLoading ? 'Comparing...' : 'Compare Scans'}
                            </Button>
                        </div>
                    </Card>

                    {/* Comparison Results */}
                    {comparison && (
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* New Findings */}
                            <Card className="border-t-4 border-t-severity-critical">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="text-base font-bold text-text-primary">New Findings</h3>
                                        <p className="text-xs text-text-muted">Vulnerabilities introduced</p>
                                    </div>
                                    <span className="bg-severity-critical/10 text-severity-critical px-2 py-1 rounded-md text-xs font-bold">{comparison.newFindings.length}</span>
                                </div>
                                {comparison.newFindings.length === 0 ? (
                                    <div className="text-center py-8">
                                        <CheckCircle className="w-10 h-10 text-severity-success mx-auto mb-3" />
                                        <p className="text-sm font-medium text-text-primary">No new vulnerabilities!</p>
                                        <p className="text-xs text-text-muted">Great job keeping the code secure.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {comparison.newFindings.slice(0, 10).map(f => (
                                            <div key={f.id} className="flex items-center gap-3 p-3 bg-bg-tertiary/50 border border-border-secondary rounded-lg">
                                                <SeverityBadge severity={f.severity.toLowerCase() as any} />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-text-primary truncate">{f.title}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <code className="text-[10px] bg-bg-base border border-border-secondary px-1 py-px rounded text-text-muted">{f.method}</code>
                                                        <p className="text-xs text-text-muted truncate">{f.endpoint}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {comparison.newFindings.length > 10 && (
                                            <button className="w-full text-center text-xs text-text-muted hover:text-text-primary py-2 transition-colors">
                                                +{comparison.newFindings.length - 10} more findings
                                            </button>
                                        )}
                                    </div>
                                )}
                            </Card>

                            {/* Fixed Findings */}
                            <Card className="border-t-4 border-t-severity-success">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="text-base font-bold text-text-primary">Fixed Findings</h3>
                                        <p className="text-xs text-text-muted">Vulnerabilities resolved</p>
                                    </div>
                                    <span className="bg-severity-success/10 text-severity-success px-2 py-1 rounded-md text-xs font-bold">{comparison.fixedFindings.length}</span>
                                </div>
                                {comparison.fixedFindings.length === 0 ? (
                                    <div className="text-center py-8">
                                        <div className="w-10 h-10 rounded-full bg-bg-tertiary flex items-center justify-center mx-auto mb-3">
                                            <AlertTriangle className="w-5 h-5 text-text-muted" />
                                        </div>
                                        <p className="text-sm font-medium text-text-primary">No fixes detected</p>
                                        <p className="text-xs text-text-muted">No resolved vulnerabilities in this period.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {comparison.fixedFindings.slice(0, 10).map(f => (
                                            <div key={f.id} className="flex items-center gap-3 p-3 bg-severity-success/5 border border-severity-success/20 rounded-lg">
                                                <div className="w-6 h-6 rounded-full bg-severity-success/20 flex items-center justify-center flex-shrink-0">
                                                    <CheckCircle className="w-3.5 h-3.5 text-severity-success" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-text-primary truncate">{f.title}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <SeverityBadge severity={f.severity.toLowerCase() as any} />
                                                        <p className="text-xs text-text-muted truncate">{f.endpoint}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {comparison.fixedFindings.length > 10 && (
                                            <button className="w-full text-center text-xs text-text-muted hover:text-text-primary py-2 transition-colors">
                                                +{comparison.fixedFindings.length - 10} more findings
                                            </button>
                                        )}
                                    </div>
                                )}
                            </Card>
                        </div>
                    )}

                    {comparison && (
                        <Card className="bg-bg-tertiary/30 border-dashed">
                            <div className="text-center py-2">
                                <p className="text-sm text-text-secondary">
                                    <span className="font-bold text-text-primary">{comparison.unchangedCount}</span> findings remained unchanged between these scans.
                                </p>
                            </div>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
}

