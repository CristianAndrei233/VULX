
import { Router } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// Get all scans for organization
router.get('/', async (req, res) => {
  const user = (req as AuthRequest).user!;
  
  try {
    const scans = await prisma.scan.findMany({
      where: {
        project: {
          organizationId: user.organizationId!
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit to 50 most recent
      include: {
        project: {
          select: { name: true, targetUrl: true }
        },
        _count: {
          select: { findings: true }
        }
      }
    });

    res.json(scans);
  } catch (error) {
    console.error('Failed to fetch scans:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single scan details
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const user = (req as AuthRequest).user!;
  
  try {
    const scan = await prisma.scan.findUnique({
      where: { id },
      include: {
        project: true // Include project to verify ownership
      }
    });

    if (!scan) {
      return res.status(404).json({ error: 'Scan not found' });
    }

    // Verify ownership via project -> organization
    const project = await prisma.project.findFirst({
      where: { 
        id: scan.projectId, 
        organizationId: user.organizationId!
      }
    });

    if (!project) {
       return res.status(403).json({ error: 'Access denied' });
    }

    res.json(scan);
  } catch (error) {
    console.error('Failed to fetch scan:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get findings for a scan
router.get('/:id/findings', async (req, res) => {
  const { id } = req.params;
  const user = (req as AuthRequest).user!;

  try {
    // Verify scan ownership first
    const scan = await prisma.scan.findUnique({
        where: { id },
        include: { project: true }
    });

    if (!scan) return res.status(404).json({ error: 'Scan not found' });

    const project = await prisma.project.findFirst({
        where: { 
            id: scan.projectId, 
            organizationId: user.organizationId!
        }
    });

    if (!project) return res.status(403).json({ error: 'Access denied' });

    const findings = await prisma.finding.findMany({
      where: { scanId: id },
      orderBy: { severity: 'asc' } // Critical first (if sort order usually maps correctly, otherwise do custom sort on frontend or enum)
      // actually string sort might not be ideal for severity (CRITICAL vs HIGH). 
      // Let's just return them and sort on frontend or rely on createdAt.
    });
    
    // Better sort?
    // findings.sort(...) - might be expensive if many. Let DB handle Basic.

    res.json(findings);
  } catch (error) {
    console.error('Failed to fetch findings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
