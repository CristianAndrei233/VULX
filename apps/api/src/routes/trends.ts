import { Router } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// ============================================
// Get Trending Summary
// ============================================
router.get('/summary', async (req, res) => {
  try {
    const user = (req as AuthRequest).user!;
    if (!user.organizationId) {
      return res.status(400).json({ error: 'User does not belong to an organization' });
    }

    // Get current period stats
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    // Current period findings
    const currentFindings = await prisma.finding.count({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        scan: {
          project: { organizationId: user.organizationId },
        },
      },
    });

    // Previous period findings
    const previousFindings = await prisma.finding.count({
      where: {
        createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
        scan: {
          project: { organizationId: user.organizationId },
        },
      },
    });

    // Fixed in current period
    const fixedCurrentPeriod = await prisma.finding.count({
      where: {
        resolvedAt: { gte: thirtyDaysAgo },
        status: 'FIXED',
        scan: {
          project: { organizationId: user.organizationId },
        },
      },
    });

    // Total open findings
    const totalOpen = await prisma.finding.count({
      where: {
        status: 'OPEN',
        scan: {
          project: { organizationId: user.organizationId },
        },
      },
    });

    // Calculate average risk score
    const recentScans = await prisma.scan.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: thirtyDaysAgo },
        project: { organizationId: user.organizationId },
      },
      select: { riskScore: true },
    });

    const avgRiskScore = recentScans.length > 0
      ? Math.round(recentScans.reduce((sum, s) => sum + (s.riskScore || 0), 0) / recentScans.length)
      : 0;

    // Change percentages
    const findingsChange = previousFindings > 0
      ? Math.round(((currentFindings - previousFindings) / previousFindings) * 100)
      : currentFindings > 0 ? 100 : 0;

    res.json({
      currentPeriod: {
        newFindings: currentFindings,
        fixedFindings: fixedCurrentPeriod,
        totalOpen,
        avgRiskScore,
      },
      changes: {
        findingsChange, // positive = more findings (bad), negative = fewer findings (good)
        trend: findingsChange > 0 ? 'increasing' : findingsChange < 0 ? 'decreasing' : 'stable',
      },
    });
  } catch (error) {
    console.error('Failed to get trending summary:', error);
    res.status(500).json({ error: 'Failed to get trending summary' });
  }
});

// ============================================
// Get Risk Score Over Time
// ============================================
router.get('/risk-score', async (req, res) => {
  try {
    const user = (req as AuthRequest).user!;
    if (!user.organizationId) {
      return res.status(400).json({ error: 'User does not belong to an organization' });
    }

    const { period = '30d', projectId } = req.query;
    const days = period === '7d' ? 7 : period === '90d' ? 90 : period === '1y' ? 365 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const where: any = {
      status: 'COMPLETED',
      createdAt: { gte: startDate },
      project: { organizationId: user.organizationId },
    };

    if (projectId) {
      where.projectId = projectId as string;
    }

    const scans = await prisma.scan.findMany({
      where,
      select: {
        id: true,
        createdAt: true,
        riskScore: true,
        project: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by day
    const dailyData: { [date: string]: { total: number; count: number } } = {};
    scans.forEach((scan) => {
      const dateKey = scan.createdAt.toISOString().split('T')[0];
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = { total: 0, count: 0 };
      }
      dailyData[dateKey].total += scan.riskScore || 0;
      dailyData[dateKey].count += 1;
    });

    const dataPoints = Object.entries(dailyData)
      .map(([date, data]) => ({
        date,
        riskScore: Math.round(data.total / data.count),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    res.json({ period, dataPoints });
  } catch (error) {
    console.error('Failed to get risk score trends:', error);
    res.status(500).json({ error: 'Failed to get risk score trends' });
  }
});

// ============================================
// Get Findings By Severity Over Time
// ============================================
router.get('/findings', async (req, res) => {
  try {
    const user = (req as AuthRequest).user!;
    if (!user.organizationId) {
      return res.status(400).json({ error: 'User does not belong to an organization' });
    }

    const { period = '30d', projectId } = req.query;
    const days = period === '7d' ? 7 : period === '90d' ? 90 : period === '1y' ? 365 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const where: any = {
      createdAt: { gte: startDate },
      scan: {
        project: { organizationId: user.organizationId },
      },
    };

    if (projectId) {
      where.scan.projectId = projectId as string;
    }

    const findings = await prisma.finding.findMany({
      where,
      select: {
        createdAt: true,
        severity: true,
      },
    });

    // Group by day and severity
    const dailyData: { [date: string]: { CRITICAL: number; HIGH: number; MEDIUM: number; LOW: number; INFO: number } } = {};
    findings.forEach((finding) => {
      const dateKey = finding.createdAt.toISOString().split('T')[0];
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, INFO: 0 };
      }
      dailyData[dateKey][finding.severity as keyof typeof dailyData[string]] += 1;
    });

    const dataPoints = Object.entries(dailyData)
      .map(([date, data]) => ({
        date,
        ...data,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    res.json({ period, dataPoints });
  } catch (error) {
    console.error('Failed to get findings trends:', error);
    res.status(500).json({ error: 'Failed to get findings trends' });
  }
});

// ============================================
// Get Fix Velocity Metrics
// ============================================
router.get('/velocity', async (req, res) => {
  try {
    const user = (req as AuthRequest).user!;
    if (!user.organizationId) {
      return res.status(400).json({ error: 'User does not belong to an organization' });
    }

    const { period = '30d' } = req.query;
    const days = period === '7d' ? 7 : period === '90d' ? 90 : period === '1y' ? 365 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get resolved findings
    const resolved = await prisma.finding.findMany({
      where: {
        resolvedAt: { gte: startDate },
        status: 'FIXED',
        scan: {
          project: { organizationId: user.organizationId },
        },
      },
      select: {
        createdAt: true,
        resolvedAt: true,
        severity: true,
      },
    });

    // Calculate MTTR (Mean Time To Remediate)
    const mttrData = resolved.map((f) => {
      if (!f.resolvedAt) return 0;
      return (f.resolvedAt.getTime() - f.createdAt.getTime()) / (1000 * 60 * 60); // hours
    });
    const avgMttr = mttrData.length > 0 ? Math.round(mttrData.reduce((a, b) => a + b, 0) / mttrData.length) : 0;

    // Get new findings in same period
    const newFindings = await prisma.finding.count({
      where: {
        createdAt: { gte: startDate },
        scan: {
          project: { organizationId: user.organizationId },
        },
      },
    });

    // Group by week for chart
    const weeklyData: { [week: string]: { fixed: number; new: number } } = {};
    resolved.forEach((f) => {
      if (!f.resolvedAt) return;
      const week = getWeekKey(f.resolvedAt);
      if (!weeklyData[week]) {
        weeklyData[week] = { fixed: 0, new: 0 };
      }
      weeklyData[week].fixed += 1;
    });

    const dataPoints = Object.entries(weeklyData)
      .map(([week, data]) => ({
        week,
        fixed: data.fixed,
        new: data.new,
      }))
      .sort((a, b) => a.week.localeCompare(b.week));

    res.json({
      period,
      summary: {
        totalFixed: resolved.length,
        totalNew: newFindings,
        avgMttrHours: avgMttr,
        fixRate: newFindings > 0 ? Math.round((resolved.length / newFindings) * 100) : 100,
      },
      dataPoints,
    });
  } catch (error) {
    console.error('Failed to get velocity metrics:', error);
    res.status(500).json({ error: 'Failed to get velocity metrics' });
  }
});

// ============================================
// Capture Security Snapshot (internal use)
// ============================================
export async function captureSecuritySnapshot(organizationId: string, projectId?: string): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const where: any = {
    scan: {
      project: { organizationId },
    },
  };

  if (projectId) {
    where.scan.projectId = projectId;
  }

  const findings = await prisma.finding.findMany({
    where,
    select: {
      severity: true,
      status: true,
    },
  });

  const recentScans = await prisma.scan.findMany({
    where: {
      status: 'COMPLETED',
      project: { organizationId },
      ...(projectId ? { projectId } : {}),
    },
    select: { riskScore: true },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  const avgRiskScore = recentScans.length > 0
    ? Math.round(recentScans.reduce((sum, s) => sum + (s.riskScore || 0), 0) / recentScans.length)
    : 0;

  await prisma.securitySnapshot.upsert({
    where: {
      organizationId_projectId_date: {
        organizationId,
        projectId: projectId || '',
        date: today,
      },
    },
    create: {
      organizationId,
      projectId: projectId || null,
      date: today,
      totalFindings: findings.length,
      criticalCount: findings.filter((f) => f.severity === 'CRITICAL').length,
      highCount: findings.filter((f) => f.severity === 'HIGH').length,
      mediumCount: findings.filter((f) => f.severity === 'MEDIUM').length,
      lowCount: findings.filter((f) => f.severity === 'LOW').length,
      infoCount: findings.filter((f) => f.severity === 'INFO').length,
      openCount: findings.filter((f) => f.status === 'OPEN').length,
      fixedCount: findings.filter((f) => f.status === 'FIXED').length,
      riskScore: avgRiskScore,
      newFindings: 0, // Would need comparison to previous day
      resolvedCount: 0,
    },
    update: {
      totalFindings: findings.length,
      criticalCount: findings.filter((f) => f.severity === 'CRITICAL').length,
      highCount: findings.filter((f) => f.severity === 'HIGH').length,
      mediumCount: findings.filter((f) => f.severity === 'MEDIUM').length,
      lowCount: findings.filter((f) => f.severity === 'LOW').length,
      infoCount: findings.filter((f) => f.severity === 'INFO').length,
      openCount: findings.filter((f) => f.status === 'OPEN').length,
      fixedCount: findings.filter((f) => f.status === 'FIXED').length,
      riskScore: avgRiskScore,
    },
  });
}

// Helper function
function getWeekKey(date: Date): string {
  const year = date.getFullYear();
  const weekNum = Math.ceil((date.getDate() - date.getDay() + 1) / 7);
  return `${year}-W${weekNum.toString().padStart(2, '0')}`;
}

export default router;
