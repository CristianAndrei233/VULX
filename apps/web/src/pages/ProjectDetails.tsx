import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getProject, triggerScan, deleteProject } from '../services/api';
import type { Project, Finding } from '../types';
import { ArrowLeft, Play, ChevronDown, ChevronRight, ExternalLink, Shield, AlertTriangle, Trash2 } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { format } from 'date-fns';

interface FindingCardProps {
    finding: Finding;
}

const FindingCard: React.FC<FindingCardProps> = ({ finding }) => {
    const [expanded, setExpanded] = useState(false);

    const severityColors: Record<string, string> = {
        CRITICAL: 'border-l-red-600 bg-red-50',
        HIGH: 'border-l-orange-500 bg-orange-50',
        MEDIUM: 'border-l-yellow-500 bg-yellow-50',
        LOW: 'border-l-blue-500 bg-blue-50',
        INFO: 'border-l-gray-400 bg-gray-50'
    };

    return (
        <li className={`border-l-4 ${severityColors[finding.severity] || 'border-l-gray-400'}`}>
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full px-4 py-4 sm:px-6 hover:bg-opacity-75 text-left transition-colors"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        {expanded ? (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                        ) : (
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                        )}
                        <StatusBadge status={finding.severity} type="severity" />
                        <p className="text-sm font-medium text-gray-900">{finding.type}</p>
                    </div>
                    <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600">
                        {finding.method} {finding.endpoint}
                    </span>
                </div>
                <p className="mt-2 ml-7 text-sm text-gray-600">{finding.description}</p>
                {finding.owaspCategory && (
                    <div className="mt-2 ml-7 flex items-center space-x-2">
                        <Shield className="w-3 h-3 text-indigo-500" />
                        <span className="text-xs text-indigo-600">{finding.owaspCategory}</span>
                        {finding.cweId && (
                            <a
                                href={`https://cwe.mitre.org/data/definitions/${finding.cweId.replace('CWE-', '')}.html`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-gray-500 hover:text-indigo-600 flex items-center"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {finding.cweId}
                                <ExternalLink className="w-3 h-3 ml-1" />
                            </a>
                        )}
                    </div>
                )}
            </button>

            {expanded && (
                <div className="px-4 pb-4 sm:px-6 ml-7 space-y-4">
                    {finding.evidence && (
                        <div className="bg-white border border-gray-200 rounded-lg p-3">
                            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2 flex items-center">
                                <AlertTriangle className="w-3 h-3 mr-1 text-amber-500" />
                                Evidence
                            </h4>
                            <p className="text-sm text-gray-600 font-mono">{finding.evidence}</p>
                        </div>
                    )}

                    {finding.remediation && (
                        <div className="bg-white border border-green-200 rounded-lg p-3">
                            <h4 className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">
                                How to Fix
                            </h4>
                            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono bg-gray-50 p-3 rounded overflow-x-auto">
                                {finding.remediation}
                            </pre>
                        </div>
                    )}
                </div>
            )}
        </li>
    );
};

export const ProjectDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [scanning, setScanning] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [severityFilter, setSeverityFilter] = useState<string>('ALL');

    const fetchProject = async () => {
        if (!id) return;
        try {
            const data = await getProject(id);
            setProject(data);
        } catch (error) {
            console.error('Failed to fetch project', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProject();
        // Poll for updates if there is a pending scan
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
            alert('Failed to start scan');
        } finally {
            setScanning(false);
        }
    };

    const handleDelete = async () => {
        if (!project) return;
        if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) return;

        setDeleting(true);
        try {
            await deleteProject(project.id);
            navigate('/');
        } catch (error) {
            console.error('Failed to delete project', error);
            alert('Failed to delete project');
            setDeleting(false);
        }
    };

    if (loading) return <div className="p-12 text-center">Loading...</div>;
    if (!project) return <div className="p-12 text-center">Project not found</div>;

    const latestScan = project.scans?.[0];

    // Calculate severity counts
    const severityCounts = latestScan?.findings?.reduce((acc, f) => {
        acc[f.severity] = (acc[f.severity] || 0) + 1;
        return acc;
    }, {} as Record<string, number>) || {};

    // Filter findings by severity
    const filteredFindings = severityFilter === 'ALL'
        ? latestScan?.findings
        : latestScan?.findings?.filter(f => f.severity === severityFilter);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link to="/" className="text-gray-500 hover:text-gray-700">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                </div>
                <button
                    onClick={handleScan}
                    disabled={scanning || latestScan?.status === 'PENDING' || latestScan?.status === 'PROCESSING'}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                >
                    <Play className="w-4 h-4 mr-2" />
                    {scanning ? 'Starting...' : 'Start Scan'}
                </button>
                <button
                    onClick={handleDelete}
                    disabled={deleting || scanning}
                    className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {deleting ? 'Deleting...' : 'Delete'}
                </button>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Left Col: Stats & Info */}
                <div className="space-y-6 lg:col-span-1">
                    {/* Project Details Card */}
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                        <div className="px-4 py-5 sm:px-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">Project Details</h3>
                        </div>
                        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                            <dl className="sm:divide-y sm:divide-gray-200">
                                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500">Created</dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                        {format(new Date(project.createdAt), 'PPP')}
                                    </dd>
                                </div>
                                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500">Last Scan</dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                        {latestScan ? (
                                            <div className="flex items-center space-x-2">
                                                <StatusBadge status={latestScan.status} />
                                                <span className="text-xs text-gray-500">
                                                    {format(new Date(latestScan.startedAt), 'p')}
                                                </span>
                                                {(latestScan.status === 'COMPLETED' || latestScan.status === 'FAILED') && (
                                                    <a
                                                        href={`http://localhost:3001/projects/${project.id}/scans/${latestScan.id}/report`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-indigo-600 hover:text-indigo-900 border border-indigo-200 rounded px-2 py-0.5"
                                                    >
                                                        PDF Report
                                                    </a>
                                                )}
                                            </div>
                                        ) : 'Never'}
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    </div>

                    {/* Scheduling Card */}
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                        <div className="px-4 py-5 sm:px-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">Scan Schedule</h3>
                            <p className="mt-1 max-w-2xl text-sm text-gray-500">Automate your vulnerability scans.</p>
                        </div>
                        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                            <div className="flex items-center justify-between">
                                <label htmlFor="frequency" className="block text-sm font-medium text-gray-700">Frequency</label>
                                <select
                                    id="frequency"
                                    value={project.scanFrequency || 'MANUAL'}
                                    onChange={async (e) => {
                                        const newFreq = e.target.value as any;
                                        try {
                                            await import('../services/api').then(m => m.updateProject(project.id, { scanFrequency: newFreq }));
                                            await fetchProject();
                                        } catch (err) {
                                            console.error(err);
                                            alert('Failed to update schedule');
                                        }
                                    }}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                >
                                    <option value="MANUAL">Manual Only</option>
                                    <option value="DAILY">Daily</option>
                                    <option value="WEEKLY">Weekly</option>
                                </select>
                            </div>
                            {project.nextScanAt && project.scanFrequency !== 'MANUAL' && (
                                <p className="mt-4 text-sm text-gray-500">
                                    Next scan: <span className="font-medium text-gray-900">{format(new Date(project.nextScanAt), 'PP p')}</span>
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Severity Summary */}
                    {latestScan?.findings && latestScan.findings.length > 0 && (
                        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                            <div className="px-4 py-5 sm:px-6">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">Severity Summary</h3>
                            </div>
                            <div className="border-t border-gray-200 px-4 py-4 space-y-2">
                                {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'].map((sev) => (
                                    severityCounts[sev] ? (
                                        <button
                                            key={sev}
                                            onClick={() => setSeverityFilter(severityFilter === sev ? 'ALL' : sev)}
                                            className={`w-full flex items-center justify-between p-2 rounded transition-colors ${severityFilter === sev ? 'bg-indigo-100 ring-2 ring-indigo-500' : 'hover:bg-gray-50'
                                                }`}
                                        >
                                            <StatusBadge status={sev} type="severity" />
                                            <span className="text-sm font-medium text-gray-700">{severityCounts[sev]}</span>
                                        </button>
                                    ) : null
                                ))}
                                {severityFilter !== 'ALL' && (
                                    <button
                                        onClick={() => setSeverityFilter('ALL')}
                                        className="w-full text-center text-sm text-indigo-600 hover:text-indigo-800 mt-2"
                                    >
                                        Show All
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Col: Findings */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white shadow sm:rounded-lg">
                        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">Vulnerability Findings</h3>
                            {latestScan && latestScan.findings && (
                                <span className="text-sm text-gray-500">
                                    {filteredFindings?.length || 0} of {latestScan.findings.length} issues
                                    {severityFilter !== 'ALL' && ` (filtered: ${severityFilter})`}
                                </span>
                            )}
                        </div>
                        <ul className="divide-y divide-gray-200">
                            {filteredFindings?.map((finding) => (
                                <FindingCard key={finding.id} finding={finding} />
                            ))}
                            {(!latestScan || !filteredFindings || filteredFindings.length === 0) && (
                                <li className="px-4 py-12 text-center text-gray-500">
                                    {latestScan
                                        ? (severityFilter !== 'ALL'
                                            ? `No ${severityFilter} vulnerabilities found.`
                                            : "No vulnerabilities found.")
                                        : "No scan results yet. Click 'Start Scan' to begin."}
                                </li>
                            )}
                        </ul>
                    </div>
                </div>
            </div >
        </div >
    );
};
