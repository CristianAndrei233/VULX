import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProject, triggerScan } from '../services/api';
import type { Project } from '../types';
import { ArrowLeft, Play } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { format } from 'date-fns';

export const ProjectDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [scanning, setScanning] = useState(false);

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
            // Simple polling for demo
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

    if (loading) return <div className="p-12 text-center">Loading...</div>;
    if (!project) return <div className="p-12 text-center">Project not found</div>;

    const latestScan = project.scans?.[0]; // Assuming backend returns sorted scans or we sort here
    // Backend returns desc sorted scans from the list endpoint, but the detail endpoint needs to include scans too.
    // We need to verify the detail endpoint includes scans.

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
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Left Col: Stats & Info */}
                <div className="space-y-6 lg:col-span-1">
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
                </div>

                {/* Right Col: Findings */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white shadow sm:rounded-lg">
                        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">Vulnerability Findings</h3>
                            {latestScan && latestScan.findings && (
                                <span className="text-sm text-gray-500">{latestScan.findings.length} issues found</span>
                            )}
                        </div>
                        <ul className="divide-y divide-gray-200">
                            {latestScan?.findings?.map((finding) => (
                                <li key={finding.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <StatusBadge status={finding.severity} type="severity" />
                                            <p className="text-sm font-medium text-gray-900">{finding.type}</p>
                                        </div>
                                        <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600">
                                            {finding.method} {finding.endpoint}
                                        </span>
                                    </div>
                                    <p className="mt-2 text-sm text-gray-600">{finding.description}</p>
                                </li>
                            ))}
                            {(!latestScan || !latestScan.findings || latestScan.findings.length === 0) && (
                                <li className="px-4 py-12 text-center text-gray-500">
                                    {latestScan ? "No vulnerabilities found." : "No scan results yet."}
                                </li>
                            )}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};
