import { Router } from 'express';
import prisma from '../lib/prisma';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// ============================================
// Get Remediation Dashboard Stats
// ============================================
router.get('/dashboard', async (req, res) => {
  try {
    const user = (req as AuthRequest).user!;
    if (!user.organizationId) {
      return res.status(400).json({ error: 'User does not belong to an organization' });
    }

    // Get all findings for the organization's projects
    const findings = await prisma.finding.findMany({
      where: {
        scan: {
          project: {
            organizationId: user.organizationId,
          },
        },
      },
      select: {
        id: true,
        status: true,
        severity: true,
        createdAt: true,
        resolvedAt: true,
      },
    });

    // Aggregate stats
    const stats = {
      total: findings.length,
      open: findings.filter((f) => f.status === 'OPEN').length,
      inProgress: findings.filter((f) => f.status === 'IN_PROGRESS').length,
      fixed: findings.filter((f) => f.status === 'FIXED').length,
      falsePositive: findings.filter((f) => f.status === 'FALSE_POSITIVE').length,
      accepted: findings.filter((f) => f.status === 'ACCEPTED').length,
      bySeverity: {
        critical: findings.filter((f) => f.severity === 'CRITICAL' && f.status === 'OPEN').length,
        high: findings.filter((f) => f.severity === 'HIGH' && f.status === 'OPEN').length,
        medium: findings.filter((f) => f.severity === 'MEDIUM' && f.status === 'OPEN').length,
        low: findings.filter((f) => f.severity === 'LOW' && f.status === 'OPEN').length,
        info: findings.filter((f) => f.severity === 'INFO' && f.status === 'OPEN').length,
      },
      // Calculate fix velocity (findings fixed in last 30 days)
      fixedLast30Days: findings.filter((f) => {
        if (!f.resolvedAt) return false;
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return f.resolvedAt >= thirtyDaysAgo;
      }).length,
    };

    res.json(stats);
  } catch (error) {
    console.error('Failed to get remediation dashboard:', error);
    res.status(500).json({ error: 'Failed to get remediation dashboard' });
  }
});

// ============================================
// Get All Findings (with filtering)
// ============================================
router.get('/findings', async (req, res) => {
  try {
    const user = (req as AuthRequest).user!;
    if (!user.organizationId) {
      return res.status(400).json({ error: 'User does not belong to an organization' });
    }

    const { status, severity, projectId, page = '1', limit = '50' } = req.query;

    const where: any = {
      scan: {
        project: {
          organizationId: user.organizationId,
        },
      },
    };

    if (status && status !== 'all') {
      where.status = status;
    }
    if (severity && severity !== 'all') {
      where.severity = severity;
    }
    if (projectId) {
      where.scan = {
        ...where.scan,
        projectId: projectId as string,
      };
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [findings, total] = await Promise.all([
      prisma.finding.findMany({
        where,
        include: {
          scan: {
            select: {
              id: true,
              project: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          history: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: [
          { severity: 'asc' }, // CRITICAL first
          { createdAt: 'desc' },
        ],
        skip,
        take: parseInt(limit as string),
      }),
      prisma.finding.count({ where }),
    ]);

    res.json({
      findings,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Failed to get findings:', error);
    res.status(500).json({ error: 'Failed to get findings' });
  }
});

// ============================================
// Update Finding Status
// ============================================
const updateStatusSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'ACCEPTED', 'FIXED', 'FALSE_POSITIVE']),
  notes: z.string().optional(),
});

router.patch('/findings/:id/status', async (req, res) => {
  try {
    const user = (req as AuthRequest).user!;
    const { id } = req.params;
    const data = updateStatusSchema.parse(req.body);

    // Verify access
    const finding = await prisma.finding.findFirst({
      where: {
        id,
        scan: {
          project: {
            organizationId: user.organizationId || '',
          },
        },
      },
    });

    if (!finding) {
      return res.status(404).json({ error: 'Finding not found' });
    }

    const previousStatus = finding.status;

    // Update finding
    const updateData: any = {
      status: data.status,
    };

    if (data.status === 'FIXED') {
      updateData.fixedAt = new Date();
      updateData.resolvedAt = new Date();
      updateData.resolvedBy = user.id;
    }

    if (data.notes) {
      updateData.resolutionNotes = data.notes;
    }

    const [updatedFinding] = await prisma.$transaction([
      prisma.finding.update({
        where: { id },
        data: updateData,
      }),
      prisma.findingHistory.create({
        data: {
          findingId: id,
          action: 'status_changed',
          fromValue: previousStatus,
          toValue: data.status,
          userId: user.id,
          notes: data.notes,
        },
      }),
    ]);

    res.json(updatedFinding);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.issues });
    }
    console.error('Failed to update finding status:', error);
    res.status(500).json({ error: 'Failed to update finding status' });
  }
});

// ============================================
// Assign Finding to User
// ============================================
router.post('/findings/:id/assign', async (req, res) => {
  try {
    const user = (req as AuthRequest).user!;
    const { id } = req.params;
    const { assignTo, dueDate } = req.body;

    // Verify access
    const finding = await prisma.finding.findFirst({
      where: {
        id,
        scan: {
          project: {
            organizationId: user.organizationId || '',
          },
        },
      },
    });

    if (!finding) {
      return res.status(404).json({ error: 'Finding not found' });
    }

    const previousAssigned = finding.assignedTo;

    const [updatedFinding] = await prisma.$transaction([
      prisma.finding.update({
        where: { id },
        data: {
          assignedTo: assignTo,
          dueDate: dueDate ? new Date(dueDate) : null,
          status: finding.status === 'OPEN' ? 'IN_PROGRESS' : finding.status,
        },
      }),
      prisma.findingHistory.create({
        data: {
          findingId: id,
          action: 'assigned',
          fromValue: previousAssigned || 'unassigned',
          toValue: assignTo,
          userId: user.id,
        },
      }),
    ]);

    res.json(updatedFinding);
  } catch (error) {
    console.error('Failed to assign finding:', error);
    res.status(500).json({ error: 'Failed to assign finding' });
  }
});

// ============================================
// Get Finding History
// ============================================
router.get('/findings/:id/history', async (req, res) => {
  try {
    const user = (req as AuthRequest).user!;
    const { id } = req.params;

    // Verify access
    const finding = await prisma.finding.findFirst({
      where: {
        id,
        scan: {
          project: {
            organizationId: user.organizationId || '',
          },
        },
      },
    });

    if (!finding) {
      return res.status(404).json({ error: 'Finding not found' });
    }

    const history = await prisma.findingHistory.findMany({
      where: { findingId: id },
      orderBy: { createdAt: 'desc' },
    });

    res.json(history);
  } catch (error) {
    console.error('Failed to get finding history:', error);
    res.status(500).json({ error: 'Failed to get finding history' });
  }
});

// ============================================
// Compare Two Scans
// ============================================
router.get('/compare', async (req, res) => {
  try {
    const user = (req as AuthRequest).user!;
    const { scan1, scan2 } = req.query;

    if (!scan1 || !scan2) {
      return res.status(400).json({ error: 'Both scan1 and scan2 query parameters are required' });
    }

    // Verify access to both scans
    const scans = await prisma.scan.findMany({
      where: {
        id: { in: [scan1 as string, scan2 as string] },
        project: {
          organizationId: user.organizationId || '',
        },
      },
      include: {
        findings: true,
        project: {
          select: { name: true },
        },
      },
    });

    if (scans.length !== 2) {
      return res.status(404).json({ error: 'One or both scans not found' });
    }

    const [scanA, scanB] = scans[0].createdAt < scans[1].createdAt ? [scans[0], scans[1]] : [scans[1], scans[0]];

    // Calculate differences
    const findingsA = new Set(scanA.findings.map((f) => `${f.type}:${f.endpoint}:${f.method}`));
    const findingsB = new Set(scanB.findings.map((f) => `${f.type}:${f.endpoint}:${f.method}`));

    const newFindings = scanB.findings.filter((f) => !findingsA.has(`${f.type}:${f.endpoint}:${f.method}`));
    const resolvedFindings = scanA.findings.filter((f) => !findingsB.has(`${f.type}:${f.endpoint}:${f.method}`));
    const persistingFindings = scanB.findings.filter((f) => findingsA.has(`${f.type}:${f.endpoint}:${f.method}`));

    const countBySeverity = (findings: any[]) => ({
      critical: findings.filter((f) => f.severity === 'CRITICAL').length,
      high: findings.filter((f) => f.severity === 'HIGH').length,
      medium: findings.filter((f) => f.severity === 'MEDIUM').length,
      low: findings.filter((f) => f.severity === 'LOW').length,
      info: findings.filter((f) => f.severity === 'INFO').length,
    });

    res.json({
      scanA: {
        id: scanA.id,
        date: scanA.createdAt,
        totalFindings: scanA.findings.length,
        bySeverity: countBySeverity(scanA.findings),
        riskScore: scanA.riskScore,
      },
      scanB: {
        id: scanB.id,
        date: scanB.createdAt,
        totalFindings: scanB.findings.length,
        bySeverity: countBySeverity(scanB.findings),
        riskScore: scanB.riskScore,
      },
      diff: {
        new: newFindings.length,
        resolved: resolvedFindings.length,
        persisting: persistingFindings.length,
        newBySeverity: countBySeverity(newFindings),
        resolvedBySeverity: countBySeverity(resolvedFindings),
      },
      newFindings,
      resolvedFindings,
    });
  } catch (error) {
    console.error('Failed to compare scans:', error);
    res.status(500).json({ error: 'Failed to compare scans' });
  }
});

export default router;
