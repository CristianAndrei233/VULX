import { Router } from 'express';
import prisma from '../lib/prisma';
import { addScanJob } from '../services/queue';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { generateScanReport } from '../services/reportGenerator';

const router = Router();

const CreateProjectSchema = z.object({
  name: z.string().min(1),
  specContent: z.string().optional(),
});

// List projects for the user's organization
router.get('/', async (req, res) => {
  const user = (req as AuthRequest).user!;
  
  if (!user.organizationId) {
    return res.json([]); // No org, no projects
  }

  const projects = await prisma.project.findMany({
    where: { organizationId: user.organizationId },
    orderBy: { createdAt: 'desc' },
    include: { scans: { take: 1, orderBy: { startedAt: 'desc' } } }
  });
  res.json(projects);
});

router.post('/', async (req, res) => {
  try {
    const user = (req as AuthRequest).user!;
    if (!user.organizationId) {
      return res.status(400).json({ error: 'User does not belong to an organization' });
    }

    const { name, specContent } = CreateProjectSchema.parse(req.body);
    
    const project = await prisma.project.create({
      data: {
        name,
        organizationId: user.organizationId,
        specContent,
      },
    });

    res.json(project);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.issues });
    }
    res.status(400).json({ error: 'Invalid request', details: String(error) });
  }
});

router.post('/:projectId/scans', async (req, res) => {
  const { projectId } = req.params;
  const user = (req as AuthRequest).user!;

  try {
    const project = await prisma.project.findFirst({ 
        where: { id: projectId, organizationId: user.organizationId || '' } 
    });

    if (!project || !project.specContent) {
      return res.status(404).json({ error: 'Project not found or missing spec' });
    }

    const scan = await prisma.scan.create({
      data: {
        projectId,
        status: 'PENDING',
      },
    });

    await addScanJob(scan.id, project.specContent);

    res.json(scan);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to start scan' });
  }
});

router.get('/:projectId/scans/:scanId/report', async (req, res) => {
  try {
     const { projectId, scanId } = req.params;
     const user = (req as AuthRequest).user!;

     // Verify ownership via project
     const project = await prisma.project.findFirst({
         where: { id: projectId, organizationId: user.organizationId || '' }
     });

     if (!project) return res.status(404).json({ error: 'Project not found' });

     const pdfBuffer = await generateScanReport(scanId);
     
     res.setHeader('Content-Type', 'application/pdf');
     res.setHeader('Content-Disposition', `attachment; filename=vulx-report-${scanId}.pdf`);
     res.send(pdfBuffer);
  } catch (error) {
     console.error(error);
     res.status(500).json({ error: 'Failed to generate report' });
  }
});

router.get('/:projectId', async (req, res) => {
    const { projectId } = req.params;
    const user = (req as AuthRequest).user!;

    const project = await prisma.project.findFirst({ 
        where: { id: projectId, organizationId: user.organizationId || '' },
        include: { scans: { include: { findings: true }, orderBy: { startedAt: 'desc' } } }
    });
    if (!project) return res.status(404).json({ error: "Not found" });
    res.json(project);
});

router.put('/:projectId', async (req, res) => {
    const { projectId } = req.params;
    const { name, specContent, scanFrequency } = req.body;
    const user = (req as AuthRequest).user!;

    try {
        // Ensure exists and owned
        const existing = await prisma.project.findFirst({
            where: { id: projectId, organizationId: user.organizationId || '' }
        });
        if (!existing) return res.status(404).json({ error: "Not found" });

        // Update logic
        const dataToUpdate: any = {};
        if (name) dataToUpdate.name = name;
        if (specContent) dataToUpdate.specContent = specContent;
        if (scanFrequency) {
            dataToUpdate.scanFrequency = scanFrequency;
            
            // Calculate nextScanAt if enabling scheduling
            if (scanFrequency !== 'MANUAL') {
                 const now = new Date();
                 if (scanFrequency === 'DAILY') now.setDate(now.getDate() + 1);
                 if (scanFrequency === 'WEEKLY') now.setDate(now.getDate() + 7);
                 dataToUpdate.nextScanAt = now;
            } else {
                dataToUpdate.nextScanAt = null;
            }
        }

        const project = await prisma.project.update({
            where: { id: projectId },
            data: dataToUpdate
        });
        res.json(project);
    } catch (error) {
        console.error('Failed to update project', error);
        res.status(500).json({ error: 'Failed to update project' });
    }
});

router.delete('/:projectId', async (req, res) => {
    const { projectId } = req.params;
    const user = (req as AuthRequest).user!;

    try {
        const existing = await prisma.project.findFirst({
            where: { id: projectId, organizationId: user.organizationId || '' }
        });
        if (!existing) return res.status(404).json({ error: "Not found" });

        const deleteFindings = prisma.finding.deleteMany({
            where: { scan: { projectId } }
        });
        const deleteScans = prisma.scan.deleteMany({
            where: { projectId }
        });
        const deleteProject = prisma.project.delete({
            where: { id: projectId }
        });

        await prisma.$transaction([deleteFindings, deleteScans, deleteProject]);

        res.status(204).send();
    } catch (error) {
        console.error('Failed to delete project', error);
        res.status(500).json({ error: 'Failed to delete project' });
    }
});

export default router;
