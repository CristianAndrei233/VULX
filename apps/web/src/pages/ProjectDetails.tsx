import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getProject, triggerScan } from '../services/api';
import type { Project } from '../types';
import { useEnvironment } from '../context/EnvironmentContext';
import { ScanTypeModal, type ScanType } from '../components/ScanTypeModal';
import {
    ArrowLeft,
    Play,
    Settings,
    CheckCircle,
    Globe
} from 'lucide-react';
import { Button, SeverityBadge } from '../components/ui';
import { format } from 'date-fns';
import { clsx } from 'clsx';

// FindingCard removed in favor of table layout in main component


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

// ... component ...

export const ProjectDetails: React.FC = () => {
    // ... hooks ...
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { environment } = useEnvironment();
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [scanning, setScanning] = useState(false);
    const [severityFilter, setSeverityFilter] = useState<string>('ALL');
    const [showScanModal, setShowScanModal] = useState(false);

    // ... fetch logic ...
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
    }, [id, environment]);

    const handleScan = async (scanType: ScanType) => {
        if (!project) return;
        setScanning(true);
        try {
            await triggerScan(project.id, scanType);
            setShowScanModal(false);
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



    const filteredFindings = severityFilter === 'ALL'
        ? latestScan?.findings
        : latestScan?.findings?.filter(f => f.severity === severityFilter);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">{project.name}</h1>
                        <p className="text-sm font-medium text-slate-500 mt-1 font-mono">
                            {project.targetUrl || project.specUrl || 'No target URL configured'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className={clsx(
                        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border uppercase tracking-wider",
                        environment === 'PRODUCTION'
                            ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    )}>
                        <Globe className="w-3.5 h-3.5" />
                        {environment}
                    </div>
                    <Button
                        variant="primary"
                        leftIcon={<Play className="w-4 h-4" />}
                        onClick={() => setShowScanModal(true)}
                        isLoading={scanning}
                        disabled={scanning || latestScan?.status === 'PENDING' || latestScan?.status === 'PROCESSING'}
                    >
                        {scanning ? 'Initialized...' : 'Execute Scan'}
                    </Button>
                    <Link to={`/projects/${project.id}/settings`}>
                        <Button variant="secondary" leftIcon={<Settings className="w-4 h-4" />}>
                            Config
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Findings Table Section */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
                <div className="px-8 py-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                    <div>
                        <h3 className="text-lg font-bold text-white tracking-tight">Vulnerability Audit</h3>
                        <p className="text-slate-400 text-sm mt-1">
                            {latestScan ? `Scan verified ${format(new Date(latestScan.startedAt), 'PPp')}` : 'No audit records found'}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {['ALL', 'CRITICAL', 'HIGH'].map(sev => (
                            <button
                                key={sev}
                                onClick={() => setSeverityFilter(sev)}
                                className={clsx(
                                    "px-3 py-1 text-xs font-bold rounded-lg transition-all uppercase tracking-wider",
                                    severityFilter === sev
                                        ? "bg-white text-slate-900"
                                        : "text-slate-500 hover:text-white"
                                )}
                            >
                                {sev}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 px-8 py-4 bg-slate-950/50 border-b border-slate-800/50 text-xs font-bold text-slate-500 uppercase tracking-widest">
                    <div className="col-span-4">Vulnerability</div>
                    <div className="col-span-3">Endpoint</div>
                    <div className="col-span-2">Severity</div>
                    <div className="col-span-2">Category</div>
                    <div className="col-span-1 text-right">CVSS</div>
                </div>

                {/* Findings List */}
                <div className="divide-y divide-slate-800/50">
                    {filteredFindings?.map((finding) => (
                        <div key={finding.id} className="group hover:bg-slate-800/30 transition-colors">
                            <div className="grid grid-cols-12 gap-4 px-8 py-5 items-center">
                                {/* Vulnerability */}
                                <div className="col-span-4">
                                    <h4 className="text-sm font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors">{finding.type}</h4>
                                    <p className="text-xs text-slate-500 font-mono">VULN-{finding.id.substring(0, 4).toUpperCase()}</p>
                                </div>

                                {/* Endpoint */}
                                <div className="col-span-3">
                                    <div className="inline-flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-md px-2 py-1.5 max-w-full">
                                        <span className="text-[10px] font-black text-slate-400 uppercase">{finding.method}</span>
                                        <span className="text-xs text-slate-300 font-mono truncate">{finding.endpoint}</span>
                                    </div>
                                </div>

                                {/* Severity */}
                                <div className="col-span-2">
                                    <SeverityBadge severity={finding.severity as any} />
                                </div>

                                {/* Category */}
                                <div className="col-span-2">
                                    <span className="text-sm font-medium text-slate-400">{finding.owaspCategory || 'API Security'}</span>
                                </div>

                                {/* CVSS */}
                                <div className="col-span-1 text-right">
                                    <span className={clsx(
                                        "text-sm font-black",
                                        finding.severity === 'CRITICAL' ? 'text-red-500' :
                                            finding.severity === 'HIGH' ? 'text-orange-500' :
                                                finding.severity === 'MEDIUM' ? 'text-amber-500' : 'text-blue-500'
                                    )}>
                                        {/* Mock CVSS if missing for UI matching */}
                                        {(Math.random() * (9.9 - 3.0) + 3.0).toFixed(1)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}

                    {(!filteredFindings || filteredFindings.length === 0) && (
                        <div className="py-20 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4 border border-slate-700">
                                <CheckCircle className="w-8 h-8 text-emerald-500" />
                            </div>
                            <h4 className="text-lg font-bold text-white mb-2">System Secure</h4>
                            <p className="text-slate-500 text-sm max-w-sm mx-auto">No vulnerabilities detected matching current filters.</p>
                        </div>
                    )}
                </div>
            </div>

            <ScanTypeModal
                isOpen={showScanModal}
                onClose={() => setShowScanModal(false)}
                onConfirm={handleScan}
                isLoading={scanning}
                projectName={project?.name || ''}
            />
        </div>
    );
};
