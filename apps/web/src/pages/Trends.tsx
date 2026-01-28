import { useState, useEffect } from 'react';
import api from '../services/api';
import { Card, CardHeader } from '../components/ui';
import {
    TrendingUp,
    TrendingDown,
    Minus,
    Search,
    CheckCircle,
    AlertTriangle,
    Timer,
    BarChart3
} from 'lucide-react';
import { clsx } from 'clsx';

interface TrendSummary {
    currentPeriod: {
        newFindings: number;
        fixedFindings: number;
        totalOpen: number;
        avgRiskScore: number;
    };
    changes: {
        findingsChange: number;
        trend: 'increasing' | 'decreasing' | 'stable';
    };
}

interface RiskDataPoint {
    date: string;
    riskScore: number;
}

interface FindingsDataPoint {
    date: string;
    CRITICAL: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
    INFO: number;
}

interface VelocityData {
    summary: {
        totalFixed: number;
        totalNew: number;
        avgMttrHours: number;
        fixRate: number;
    };
}

const PERIOD_OPTIONS = [
    { value: '7d', label: '7 days' },
    { value: '30d', label: '30 days' },
    { value: '90d', label: '90 days' },
];

const SEVERITY_COLORS: Record<string, string> = {
    CRITICAL: 'bg-severity-critical',
    HIGH: 'bg-severity-high',
    MEDIUM: 'bg-severity-medium',
    LOW: 'bg-severity-low',
    INFO: 'bg-slate-400'
};

export function Trends() {
    const [summary, setSummary] = useState<TrendSummary | null>(null);
    const [riskData, setRiskData] = useState<RiskDataPoint[]>([]);
    const [findingsData, setFindingsData] = useState<FindingsDataPoint[]>([]);
    const [velocity, setVelocity] = useState<VelocityData | null>(null);
    const [period, setPeriod] = useState('30d');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [period]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [summaryRes, riskRes, findingsRes, velocityRes] = await Promise.all([
                api.get('/trends/summary'),
                api.get('/trends/risk-score', { params: { period } }),
                api.get('/trends/findings', { params: { period } }),
                api.get('/trends/velocity', { params: { period } }),
            ]);
            setSummary(summaryRes.data);
            setRiskData(riskRes.data.dataPoints);
            setFindingsData(findingsRes.data.dataPoints);
            setVelocity(velocityRes.data);
        } catch (err) {
            console.error('Failed to fetch trends:', err);
        } finally {
            setLoading(false);
        }
    };

    const TrendIcon = ({ trend, inverted = false }: { trend: string; inverted?: boolean }) => {
        const isGood = inverted ? trend === 'increasing' : trend === 'decreasing';
        if (trend === 'increasing') return <TrendingUp className={clsx('w-4 h-4', isGood ? 'text-severity-success' : 'text-severity-critical')} />;
        if (trend === 'decreasing') return <TrendingDown className={clsx('w-4 h-4', isGood ? 'text-severity-success' : 'text-severity-critical')} />;
        return <Minus className="w-4 h-4 text-slate-400" />;
    };

    if (loading && !summary) {
        return (
            <div className="space-y-6">
                <div className="h-10 w-48 skeleton rounded-lg" />
                <div className="grid grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-32 skeleton rounded-xl" />)}
                </div>
                <div className="h-64 skeleton rounded-xl" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Security Trends</h1>
                    <p className="text-slate-500 mt-1">Historical analysis of your security posture</p>
                </div>
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                    {PERIOD_OPTIONS.map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => setPeriod(opt.value)}
                            className={clsx(
                                'px-4 py-2 text-sm font-medium rounded-md transition-all',
                                period === opt.value
                                    ? 'bg-white shadow-sm text-slate-900'
                                    : 'text-slate-500 hover:text-slate-700'
                            )}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card hoverable className="border-l-4 border-l-severity-low">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">New Findings</p>
                                <p className="text-3xl font-bold text-slate-900 mt-1">{summary.currentPeriod.newFindings}</p>
                                <div className="flex items-center gap-1 mt-2 text-sm">
                                    <TrendIcon trend={summary.changes.trend} />
                                    <span className={clsx(
                                        'font-medium',
                                        summary.changes.trend === 'decreasing' ? 'text-severity-success' :
                                            summary.changes.trend === 'increasing' ? 'text-severity-critical' : 'text-slate-500'
                                    )}>
                                        {Math.abs(summary.changes.findingsChange)}%
                                    </span>
                                </div>
                            </div>
                            <div className="w-10 h-10 rounded-industrial bg-severity-low/10 flex items-center justify-center">
                                <Search className="w-5 h-5 text-severity-low" />
                            </div>
                        </div>
                    </Card>

                    <Card hoverable className="border-l-4 border-l-severity-success">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Fixed This Period</p>
                                <p className="text-3xl font-bold text-severity-success mt-1">{summary.currentPeriod.fixedFindings}</p>
                            </div>
                            <div className="w-10 h-10 rounded-industrial bg-severity-success/10 flex items-center justify-center">
                                <CheckCircle className="w-5 h-5 text-severity-success" />
                            </div>
                        </div>
                    </Card>

                    <Card hoverable className="border-l-4 border-l-severity-medium">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Avg Risk Score</p>
                                <p className="text-3xl font-bold text-slate-900 mt-1">{summary.currentPeriod.avgRiskScore}</p>
                            </div>
                            <div className="w-10 h-10 rounded-industrial bg-severity-medium/10 flex items-center justify-center">
                                <BarChart3 className="w-5 h-5 text-severity-medium" />
                            </div>
                        </div>
                    </Card>

                    <Card hoverable className="border-l-4 border-l-severity-critical">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Total Open</p>
                                <p className="text-3xl font-bold text-severity-critical mt-1">{summary.currentPeriod.totalOpen}</p>
                            </div>
                            <div className="w-10 h-10 rounded-industrial bg-severity-critical/10 flex items-center justify-center">
                                <AlertTriangle className="w-5 h-5 text-severity-critical" />
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Velocity Metrics */}
            {velocity && (
                <Card>
                    <CardHeader title="Fix Velocity" icon={<Timer className="w-5 h-5 text-slate-400" />} />
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white border border-gray-200 rounded-industrial p-4 summary-card">
                            <p className="text-2xl font-bold text-slate-900">{velocity.summary.avgMttrHours}h</p>
                            <p className="text-sm text-slate-500 mt-1">Mean Time to Remediate</p>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-industrial p-4 summary-card">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-2xl font-bold text-slate-900">{velocity.summary.fixRate}%</p>
                            </div>
                            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-industrial-action transition-all"
                                    style={{ width: `${velocity.summary.fixRate}%` }}
                                />
                            </div>
                            <p className="text-sm text-slate-500 mt-2">Fix Rate</p>
                        </div>
                        <div className="bg-severity-success/5 rounded-industrial p-4 border border-severity-success/20">
                            <p className="text-2xl font-bold text-severity-success">{velocity.summary.totalFixed}</p>
                            <p className="text-sm text-severity-success mt-1">Total Fixed</p>
                        </div>
                        <div className="bg-severity-low/5 rounded-industrial p-4 border border-severity-low/20">
                            <p className="text-2xl font-bold text-severity-low">{velocity.summary.totalNew}</p>
                            <p className="text-sm text-severity-low mt-1">Total New</p>
                        </div>
                    </div>
                </Card>
            )}

            {/* Risk Score Chart */}
            {riskData.length > 0 && (
                <Card>
                    <CardHeader title="Risk Score Over Time" />
                    <div className="h-48 flex items-end gap-1.5">
                        {riskData.slice(-21).map((point, idx) => (
                            <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                                <div
                                    className={clsx(
                                        'w-full rounded-t-sm transition-all',
                                        point.riskScore >= 70 ? 'bg-severity-critical' :
                                            point.riskScore >= 40 ? 'bg-severity-high' : 'bg-severity-success'
                                    )}
                                    style={{ height: `${point.riskScore}%` }}
                                    title={`${point.date}: ${point.riskScore}`}
                                />
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-slate-400">
                        <span>{riskData[0]?.date.slice(-5)}</span>
                        <span>{riskData[riskData.length - 1]?.date.slice(-5)}</span>
                    </div>
                </Card>
            )}

            {/* Findings by Severity */}
            {findingsData.length > 0 && (
                <Card>
                    <CardHeader
                        title="Findings by Severity"
                        action={
                            <div className="flex gap-3">
                                {Object.entries(SEVERITY_COLORS).map(([sev, color]) => (
                                    <div key={sev} className="flex items-center gap-1.5">
                                        <div className={clsx('w-2.5 h-2.5 rounded-full', color)} />
                                        <span className="text-xs text-slate-500 capitalize">{sev.toLowerCase()}</span>
                                    </div>
                                ))}
                            </div>
                        }
                    />
                    <div className="h-48 flex items-end gap-1.5">
                        {findingsData.slice(-21).map((point, idx) => {
                            const total = point.CRITICAL + point.HIGH + point.MEDIUM + point.LOW + point.INFO || 1;
                            return (
                                <div key={idx} className="flex-1 flex flex-col rounded-t overflow-hidden" style={{ height: `${Math.min(total * 10, 100)}%` }}>
                                    {point.CRITICAL > 0 && <div className="bg-severity-critical" style={{ flex: point.CRITICAL }} />}
                                    {point.HIGH > 0 && <div className="bg-severity-high" style={{ flex: point.HIGH }} />}
                                    {point.MEDIUM > 0 && <div className="bg-severity-medium" style={{ flex: point.MEDIUM }} />}
                                    {point.LOW > 0 && <div className="bg-severity-low" style={{ flex: point.LOW }} />}
                                    {point.INFO > 0 && <div className="bg-slate-400" style={{ flex: point.INFO }} />}
                                </div>
                            );
                        })}
                    </div>
                </Card>
            )}

            {/* Empty State */}
            {riskData.length === 0 && findingsData.length === 0 && (
                <Card className="text-center py-16">
                    <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No trend data yet</h3>
                    <p className="text-slate-500">Run some scans to start seeing your security trends over time.</p>
                </Card>
            )}
        </div>
    );
}
