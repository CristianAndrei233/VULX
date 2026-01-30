import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, AlertTriangle, CheckCircle, ArrowRight, Play, History, Loader2, Search } from 'lucide-react';
import { Card, Button, Badge } from '../components/ui';
import { getAllScans } from '../services/api';
import type { Scan } from '../types';
import { format } from 'date-fns';
import { clsx } from 'clsx';

export const ScansList: React.FC = () => {
    const [scans, setScans] = useState<Scan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchScans = async () => {
            try {
                setLoading(true);
                const data = await getAllScans();
                setScans(data);
            } catch (err) {
                console.error(err);
                setError('Failed to load scan history. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchScans();

        // Auto-refresh every 10s if there are running scans
        const interval = setInterval(fetchScans, 10000);
        return () => clearInterval(interval);
    }, []);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return <Badge variant="success" size="sm" icon={<CheckCircle className="w-3 h-3" />}>Completed</Badge>;
            case 'FAILED':
                return <Badge variant="danger" size="sm" icon={<AlertTriangle className="w-3 h-3" />}>Failed</Badge>;
            case 'PROCESSING':
                return <Badge variant="primary" size="sm" pulse icon={<Loader2 className="w-3 h-3 animate-spin" />}>Processing</Badge>;
            case 'PENDING':
                return <Badge variant="neutral" size="sm" icon={<Clock className="w-3 h-3" />}>Pending</Badge>;
            default:
                return <Badge variant="neutral" size="sm">{status}</Badge>;
        }
    };

    const filteredScans = scans.filter(scan =>
        (scan as any).project?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        scan.targetUrl?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        scan.scanType?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading && scans.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24">
                <div className="w-16 h-16 rounded-2xl bg-bg-elevated flex items-center justify-center mb-6 animate-pulse border border-border-primary">
                    <History className="w-8 h-8 text-accent-primary" />
                </div>
                <div className="h-6 w-48 bg-bg-elevated rounded-lg mb-3 animate-pulse" />
                <div className="h-4 w-32 bg-bg-elevated rounded-lg animate-pulse" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary tracking-tight">Audit History</h1>
                    <p className="text-text-secondary mt-1">Review past security scans and their results.</p>
                </div>

                <Link to="/scan/new">
                    <Button variant="primary" icon={Play}>
                        New Scan
                    </Button>
                </Link>
            </div>

            {error && (
                <div className="bg-severity-critical-bg border border-severity-critical/20 rounded-lg p-4 text-severity-critical font-medium flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {scans.length > 0 && (
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search history by project, URL, or type..."
                        className="w-full pl-10 pr-4 py-2.5 bg-bg-card border border-border-primary rounded-xl focus:outline-none focus:ring-1 focus:ring-accent-primary text-sm transition-all focus:border-accent-primary text-text-primary placeholder:text-text-muted max-w-md"
                    />
                </div>
            )}

            {filteredScans.length === 0 && !loading ? (
                <Card className="py-20 text-center border-dashed border-2 border-border-secondary bg-bg-tertiary/30">
                    <div className="w-20 h-20 rounded-3xl bg-bg-elevated flex items-center justify-center mx-auto mb-6 border border-border-primary">
                        <History className="w-10 h-10 text-text-muted" />
                    </div>
                    <h3 className="text-xl font-bold text-text-primary tracking-tight mb-3">
                        {searchQuery ? 'No matching scans' : 'No Scans Yet'}
                    </h3>
                    <p className="text-text-secondary font-medium mb-8 max-w-md mx-auto">
                        {searchQuery ? 'Try adjusting your search query.' : 'Start your first security scan to identify vulnerabilities in your API infrastructure.'}
                    </p>
                    {!searchQuery && (
                        <Link to="/scan/new">
                            <Button size="md" variant="primary">Start First Scan</Button>
                        </Link>
                    )}
                </Card>
            ) : (
                <div className="rounded-xl border border-border-primary overflow-hidden bg-bg-card">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-bg-tertiary text-text-secondary border-b border-border-primary">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Project</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Findings</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Started</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-primary bg-bg-card text-text-primary">
                                {filteredScans.map((scan) => (
                                    <tr key={scan.id} className="group hover:bg-bg-elevated transition-colors duration-200">
                                        <td className="px-6 py-4">
                                            {getStatusBadge(scan.status)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-semibold mb-0.5">
                                                {(scan as any).project?.name || 'Unknown Project'}
                                            </div>
                                            <div className="text-xs text-text-muted font-mono truncate max-w-[200px]">
                                                {scan.targetUrl}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant="neutral" size="sm" className="bg-bg-tertiary border-border-primary text-text-secondary">
                                                {scan.scanType?.toUpperCase() || 'STANDARD'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            {((scan as any)._count?.findings || 0) > 0 ? (
                                                <Badge variant="danger" size="sm">
                                                    {(scan as any)._count?.findings} Issues
                                                </Badge>
                                            ) : scan.status === 'COMPLETED' ? (
                                                <div className="flex items-center gap-2 text-accent-primary">
                                                    <CheckCircle className="w-4 h-4" />
                                                    <span className="text-xs font-semibold">Clean</span>
                                                </div>
                                            ) : (
                                                <span className="text-text-muted">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-text-muted">
                                                <span className="text-sm font-medium">{format(new Date(scan.createdAt), 'MMM d, HH:mm')}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                to={`/scans/${scan.id}`}
                                                className={clsx(
                                                    "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-xs transition-all duration-200",
                                                    "bg-bg-tertiary text-text-secondary border border-border-primary",
                                                    "hover:bg-accent-primary hover:text-bg-primary hover:border-accent-primary hover:shadow-lg hover:shadow-accent-primary/20"
                                                )}
                                            >
                                                Details
                                                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};
