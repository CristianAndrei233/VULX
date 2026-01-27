import { Router } from 'express';
import prisma from '../lib/prisma';
import { addScanJob } from '../services/queue';
import { z } from 'zod';

const router = Router();

const CreateProjectSchema = z.object({
  name: z.string().min(1),
  organizationId: z.string().uuid(),
  specContent: z.string().optional(),
});

// List all projects (for demo purposes)
router.get('/', async (req, res) => {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: 'desc' },
    include: { scans: { take: 1, orderBy: { startedAt: 'desc' } } }
  });
  res.json(projects);
});

router.post('/', async (req, res) => {
  try {
    const { name, organizationId, specContent } = CreateProjectSchema.parse(req.body);
    
    // Ensure org exists (in a real app, middleware would handle context)
    let org = await prisma.organization.findUnique({ where: { id: organizationId } });
    if (!org) {
       // Auto-create for demo simplicity if not exists, or return 404
       org = await prisma.organization.create({ data: { id: organizationId, name: 'Default Org' }});
    }

    const project = await prisma.project.create({
      data: {
        name,
        organizationId,
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

  try {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
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

router.get('/:projectId', async (req, res) => {
    const { projectId } = req.params;
    const project = await prisma.project.findUnique({ 
        where: { id: projectId },
        include: { scans: { include: { findings: true }, orderBy: { startedAt: 'desc' } } }
    });
    if (!project) return res.status(404).json({ error: "Not found" });
    res.json(project);
});

export default router;
