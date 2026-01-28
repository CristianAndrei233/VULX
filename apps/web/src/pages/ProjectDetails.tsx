import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getProject, triggerScan } from '../services/api';
import type { Project, Finding } from '../types';
import {
    ArrowLeft,
    Play,
    ChevronDown,
    ChevronRight,
    ExternalLink,
    Shield,
    AlertTriangle,
    Settings,
    Clock,
    FileText,
    Copy,
    CheckCircle
} from 'lucide-react';
import { Button, Card, CardHeader, Badge, StatusBadge, SeverityBadge } from '../components/ui';
import { format } from 'date-fns';
import { clsx } from 'clsx';

interface FindingCardProps {
    finding: Finding;
}

const FindingCard: React.FC<FindingCardProps> = ({ finding }) => {
    const [expanded, setExpanded] = useState(false);
    const [copied, setCopied] = useState(false);

    const severityBorder: Record<string, string> = {
        CRITICAL: 'border-l-red-500',
        HIGH: 'border-l-orange-500',
        MEDIUM: 'border-l-amber-400',
        LOW: 'border-l-blue-500',
        INFO: 'border-l-slate-400'
    };

    const handleCopy = async (text: string) => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={clsx(
            'bg-white rounded-lg border border-slate-200 overflow-hidden transition-all duration-200 hover:shadow-md',
            'border-l-4',
            severityBorder[finding.severity] || 'border-l-slate-400'
        )}>
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full px-4 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors text-left"
                aria-expanded={expanded}
            >
                <div className="flex items-center space-x-3 min-w-0">
                    {expanded ? (
                        <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    )}
                    <SeverityBadge severity={finding.severity} size="sm" />
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{finding.type}</p>
                        <p className="text-xs text-slate-500 truncate mt-0.5">{finding.description}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    <code className="hidden sm:block text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">
                        {finding.method} {finding.endpoint}
                    </code>
                </div>
            </button>

            {expanded && (
                <div className="px-4 pb-4 pt-0 ml-7 space-y-4 animate-fade-in">
                    {/* OWASP Category */}
                    {finding.owaspCategory && (
                        <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5 text-indigo-600">
                                <Shield className="w-3.5 h-3.5" />
                                <span className="text-xs font-medium">{finding.owaspCategory}</span>
                            </div>
                            {finding.cweId && (
                                <a
                                    href={`https://cwe.mitre.org/data/definitions/${finding.cweId.replace('CWE-', '')}.html`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-slate-500 hover:text-indigo-600 flex items-center gap-1"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {finding.cweId}
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            )}
                        </div>
                    )}

                    {/* Evidence */}
                    {finding.evidence && (
                        <Card variant="bordered" padding="sm" className="bg-slate-50">
                            <div className="flex items-center gap-2 mb-2">
                                <AlertTriangle className="w-4 h-4 text-amber-500" />
                                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Evidence</h4>
                            </div>
                            <pre className="text-sm text-slate-600 font-mono whitespace-pre-wrap overflow-x-auto">
                                {finding.evidence}
                            </pre>
                        </Card>
                    )}

                    {/* Remediation */}
                    {finding.remediation && (
                        <Card variant="bordered" padding="sm" className="bg-emerald-50/50 border-emerald-200">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                                    <h4 className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">How to Fix</h4>
                                </div>
                                <button
                                    onClick={() => handleCopy(finding.remediation || '')}
                                    className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
                                >
                                    {copied ? <CheckCircle className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                    {copied ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                            <pre className="text-sm text-slate-700 font-mono whitespace-pre-wrap bg-white rounded p-3 overflow-x-auto">
                                {finding.remediation}
                            </pre>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
};

// Loading Skeleton
const ProjectSkeleton: React.FC = () => (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="h-5 w-5 skeleton rounded" />
                <div className="h-8 w-48 skeleton rounded" />
            </div>
            <div className="flex items-center gap-3">
                <div className="h-10 w-28 skeleton rounded-lg" />
                <div className="h-10 w-28 skeleton rounded-lg" />
            </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="h-64 skeleton rounded-xl" />
            <div className="lg:col-span-3 h-96 skeleton rounded-xl" />
        </div>
    </div>
);

export const ProjectDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [scanning, setScanning] = useState(false);
    const [severityFilter, setSeverityFilter] = useState<string>('ALL');

    const fetchProject = async () => {
        if (!id) return;
        try {
            const projectData = await getProject(id);
            setProject(projectData);
        } catch (error) {
            console.error('Failed to fetch project', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProject();
        const interval = setInterval(() => {
            fetchProject();
        }, 5000);
        return () => clearInterval(interval);
    }, [id]);

    const handleScan = async () => {
        if (!project) return;
        setScanning(true);
        try {
            await triggerScan(project.id);
            await fetchProject();
        } catch (error) {
            console.error('Failed to trigger scan', error);
        } finally {
            setScanning(false);
        }
    };

    if (loading) return <ProjectSkeleton />;
    if (!project) {
        return (
            <div className="text-center py-16">
                <h2 className="text-xl font-semibold text-slate-900 mb-2">Project not found</h2>
                <p className="text-slate-500 mb-4">The project you're looking for doesn't exist.</p>
                <Link to="/">
                    <Button variant="secondary">Go to Dashboard</Button>
                </Link>
            </div>
        );
    }

    const latestScan = project.scans?.[0];

    const severityCounts = latestScan?.findings?.reduce((acc, f) => {
        acc[f.severity] = (acc[f.severity] || 0) + 1;
        return acc;
    }, {} as Record<string, number>) || {};

    const filteredFindings = severityFilter === 'ALL'
        ? latestScan?.findings
        : latestScan?.findings?.filter(f => f.severity === severityFilter);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
                        <p className="text-sm text-slate-500 mt-0.5">
                            {project.targetUrl || project.specUrl || 'No target URL configured'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="primary"
                        leftIcon={<Play className="w-4 h-4" />}
                        onClick={handleScan}
                        isLoading={scanning}
                        disabled={scanning || latestScan?.status === 'PENDING' || latestScan?.status === 'PROCESSING'}
                    >
                        {scanning ? 'Starting...' : 'Start Scan'}
                    </Button>
                    <Link to={`/projects/${project.id}/settings`}>
                        <Button variant="secondary" leftIcon={<Settings className="w-4 h-4" />}>
                            Settings
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                {/* Left Col: Info & Filters */}
                <div className="space-y-6 lg:col-span-1">
                    {/* Project Details Card */}
                    <Card>
                        <CardHeader title="Project Info" />
                        <dl className="space-y-4">
                            <div>
                                <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Created</dt>
                                <dd className="text-sm text-slate-900 mt-1 flex items-center gap-1.5">
                                    <Clock className="w-4 h-4 text-slate-400" />
                                    {format(new Date(project.createdAt), 'PPP')}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Last Scan</dt>
                                <dd className="mt-1">
                                    {latestScan ? (
                                        <div className="space-y-2">
                                            <StatusBadge status={latestScan.status} />
                                            <p className="text-xs text-slate-500">
                                                {format(new Date(latestScan.startedAt), 'PPp')}
                                            </p>
                                            {(latestScan.status === 'COMPLETED' || latestScan.status === 'FAILED') && (
                                                <a
                                                    href={`http://localhost:3001/projects/${project.id}/scans/${latestScan.id}/report`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                                                >
                                                    <FileText className="w-3.5 h-3.5" />
                                                    Download PDF Report
                                                </a>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-sm text-slate-400 italic">Never scanned</span>
                                    )}
                                </dd>
                            </div>
                        </dl>
                    </Card>

                    {/* Severity Filter */}
                    {latestScan?.findings && latestScan.findings.length > 0 && (
                        <Card>
                            <CardHeader title="Filter by Severity" />
                            <div className="space-y-2">
                                {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'].map((sev) =>
                                    severityCounts[sev] ? (
                                        <button
                                            key={sev}
                                            onClick={() => setSeverityFilter(severityFilter === sev ? 'ALL' : sev)}
                                            className={clsx(
                                                'w-full flex items-center justify-between p-2.5 rounded-lg transition-all',
                                                severityFilter === sev
                                                    ? 'bg-indigo-50 ring-2 ring-indigo-500'
                                                    : 'hover:bg-slate-50'
                                            )}
                                        >
                                            <SeverityBadge severity={sev} size="sm" />
                                            <span className="text-sm font-semibold text-slate-700">{severityCounts[sev]}</span>
                                        </button>
                                    ) : null
                                )}
                                {severityFilter !== 'ALL' && (
                                    <button
                                        onClick={() => setSeverityFilter('ALL')}
                                        className="w-full text-center text-sm text-indigo-600 hover:text-indigo-700 font-medium py-2"
                                    >
                                        Show All
                                    </button>
                                )}
                            </div>
                        </Card>
                    )}
                </div>

                {/* Right Col: Findings */}
                <div className="lg:col-span-3 space-y-6">
                    <Card padding="none">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-slate-900">Vulnerability Findings</h3>
                            {latestScan && latestScan.findings && (
                                <span className="text-sm text-slate-500">
                                    {filteredFindings?.length || 0} of {latestScan.findings.length} issues
                                    {severityFilter !== 'ALL' && (
                                        <Badge variant="primary" size="sm" className="ml-2">
                                            {severityFilter}
                                        </Badge>
                                    )}
                                </span>
                            )}
                        </div>
                        <div className="p-4 space-y-3">
                            {filteredFindings?.map((finding, index) => (
                                <div key={finding.id} className="animate-fade-in" style={{ animationDelay: `${index * 30}ms` }}>
                                    <FindingCard finding={finding} />
                                </div>
                            ))}
                            {(!latestScan || !filteredFindings || filteredFindings.length === 0) && (
                                <div className="py-12 text-center">
                                    <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle className="w-8 h-8 text-emerald-500" />
                                    </div>
                                    <h4 className="text-lg font-medium text-slate-900 mb-1">
                                        {latestScan
                                            ? severityFilter !== 'ALL'
                                                ? `No ${severityFilter} vulnerabilities`
                                                : 'No vulnerabilities found'
                                            : 'No scan results yet'}
                                    </h4>
                                    <p className="text-slate-500 text-sm">
                                        {latestScan
                                            ? 'Great job! Your API looks secure.'
                                            : "Click 'Start Scan' to begin scanning."}
                                    </p>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};
