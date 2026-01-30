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
  specUrl: z.string().url().optional(),
  targetUrl: z.string().url().optional(),
});

// List projects for the user's organization
router.get('/', async (req, res) => {
  const user = (req as AuthRequest).user!;
  
  if (!user.organizationId) {
    return res.json([]); // No org, no projects
  }

  const environment = req.environment || 'PRODUCTION';

  const projects = await prisma.project.findMany({
    where: { organizationId: user.organizationId },
    orderBy: { createdAt: 'desc' },
    include: { 
        scans: { 
            where: { environment },
            take: 1, 
            orderBy: { startedAt: 'desc' },
            include: { findings: true }
        } 
    }
  });

  // Calculate stats based on environmental scans
  const projectsWithStats = projects.map((p: any) => {
    const lastScan = p.scans[0];
    // Filter findings by environment just in case, though scan filter should handle it
    const relevantFindings = lastScan?.findings?.filter((f: any) => f.environment === environment) || [];
    
    return {
        ...p,
        scans: p.scans, // already filtered
        stats: {
             lastScanAt: lastScan?.startedAt,
             findingsCount: relevantFindings.length,
             criticalCount: relevantFindings.filter((f: any) => f.severity === 'CRITICAL').length
        }
    };
  });

  res.json(projectsWithStats);
});

router.post('/', async (req, res) => {
  try {
    const user = (req as AuthRequest).user!;
    let orgId = user.organizationId;

    if (!orgId) {
      // Auto-fix: Find existing org or create default
      const existingOrg = await prisma.organization.findFirst({
        where: { users: { some: { id: user.id } } }
      });

      if (existingOrg) {
        orgId = existingOrg.id;
      } else {
        const newOrg = await prisma.organization.create({
          data: {
            name: `My Organization`,
            users: { connect: { id: user.id } }
          }
        });
        orgId = newOrg.id;
        // Update user to have this as primary org
        await prisma.user.update({
          where: { id: user.id },
          data: { organizationId: orgId }
        });
      }
    }

    let { name, specContent, specUrl, targetUrl } = CreateProjectSchema.parse(req.body);

    // Auto-fetch spec if URL provided but content missing
    if (!specContent && specUrl) {
      try {
        console.log(`Fetching spec from ${specUrl}...`);
        const response = await fetch(specUrl);
        if (response.ok) {
          const text = await response.text();
          if (text.trim().startsWith('{') || text.includes('openapi:') || text.includes('swagger:')) {
            specContent = text;
          }
        }
      } catch (e) {
        console.warn('Failed to auto-fetch spec during creation:', e);
        // Continue creating project without content, user can add later
      }
    }
    
    const project = await prisma.project.create({
      data: {
        name,
        organizationId: orgId,
        specContent,
        specUrl,
        targetUrl,
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

// Generate API Key for specific environment
router.post('/:projectId/keys', async (req, res) => {
  const { projectId } = req.params;
  const { environment } = req.body; // SANDBOX or PRODUCTION
  const user = (req as AuthRequest).user!;

  if (!['SANDBOX', 'PRODUCTION'].includes(environment)) {
    return res.status(400).json({ error: 'Invalid environment' });
  }

  try {
    const project = await prisma.project.findFirst({
        where: { id: projectId, organizationId: user.organizationId || '' }
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // Enforce Single Key Policy: Delete existing keys for this environment
    await prisma.apiKey.deleteMany({
        where: { projectId, type: environment }
    });

    // Generate Key
    const prefix = environment === 'SANDBOX' ? 'v_test_' : 'v_live_';
    const randomPart = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const key = `${prefix}${randomPart}`;

    const apiKey = await prisma.apiKey.create({
      data: {
        key,
        type: environment,
        projectId,
      }
    });

    res.json(apiKey);
  } catch (error) {
    console.error('Failed to generate key', error);
    res.status(500).json({ error: 'Failed to generate key' });
  }
});

// List keys for a project
router.get('/:projectId/keys', async (req, res) => {
    const { projectId } = req.params;
    const user = (req as AuthRequest).user!;

    const project = await prisma.project.findFirst({ 
        where: { id: projectId, organizationId: user.organizationId || '' }
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const keys = await prisma.apiKey.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' }
    });

    res.json(keys);
});

// Delete an API Key
router.delete('/:projectId/keys/:keyId', async (req, res) => {
    const { projectId, keyId } = req.params;
    const user = (req as AuthRequest).user!;

    try {
        const project = await prisma.project.findFirst({ 
            where: { id: projectId, organizationId: user.organizationId || '' }
        });
        if (!project) return res.status(404).json({ error: 'Project not found' });

        await prisma.apiKey.delete({
            where: { id: keyId, projectId } // Ensure ownership via projectId
        });

        res.status(204).send();
    } catch (error) {
        console.error('Failed to delete key', error);
        res.status(500).json({ error: 'Failed to delete key' });
    }
});

router.post('/:projectId/scans', async (req, res) => {
  const { projectId } = req.params;
  const user = (req as AuthRequest).user!;
  
  // Use environment from middleware (default PRODUCTION if not set)
  const environment = req.environment || 'PRODUCTION';
  const { specUrl, targetUrl, scanType, authMethod } = req.body;

  try {
    const project = await prisma.project.findFirst({ 
        where: { id: projectId, organizationId: user.organizationId || '' } 
    });

    if (!project) {
        return res.status(404).json({ error: 'Project not found' });
    }

    // Attempt to fetch spec if missing
    if (!project.specContent && specUrl) {
        try {
            console.log(`Fetching spec from ${specUrl}...`);
            const response = await fetch(specUrl);
            if (!response.ok) throw new Error(`Failed to fetch spec: ${response.statusText}`);
            const text = await response.text();
            
            // Basic validation - is it JSON or YAML?
            if (!text.trim().startsWith('{') && !text.includes('openapi:') && !text.includes('swagger:')) {
                 throw new Error("Invalid spec format. Must be JSON or YAML.");
            }

            // Update project with fetched spec
            await prisma.project.update({
                where: { id: projectId },
                data: { specContent: text, specUrl }
            });
            project.specContent = text; // Update local reference
        } catch (error: any) {
            console.error(error);
            return res.status(400).json({ error: `Failed to fetch value spec from URL: ${error.message}` });
        }
    }

    if (!project.specContent) {
      return res.status(404).json({ error: 'Project not found or missing spec. Please upload a spec or provide a valid Spec URL.' });
    }

    const scan = await prisma.scan.create({
      data: {
        projectId,
        status: 'PENDING',
        environment,
        scanType: scanType || 'standard',
        targetUrl: targetUrl || project.targetUrl,
        authMethod: authMethod || 'none'
      },
    });

    await addScanJob(scan.id, project.specContent);

    res.json(scan);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to start scan' });
  }
});

// Get all scans for a project (History)
router.get('/:projectId/scans', async (req, res) => {
  const { projectId } = req.params;
  const user = (req as AuthRequest).user!;
  
  try {
    const project = await prisma.project.findFirst({
        where: { id: projectId, organizationId: user.organizationId || '' }
    });

    if (!project) return res.status(404).json({ error: 'Project not found' });

    const scans = await prisma.scan.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
        include: {
            _count: {
                select: { findings: true }
            }
        }
    });

    res.json(scans);
  } catch (error) {
    console.error('Failed to fetch project scans:', error);
    res.status(500).json({ error: 'Failed to fetch scans' });
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
    const environment = req.environment || 'PRODUCTION';

    const project = await prisma.project.findFirst({ 
        where: { id: projectId, organizationId: user.organizationId || '' },
        include: { 
            scans: { 
                where: { environment }, // [NEW] Filter by environment
                include: { findings: true }, 
                orderBy: { startedAt: 'desc' } 
            } 
        }
    });

    // Also get the API Keys for this environment (optional, or fetch separately)
    // const keys = await prisma.apiKey.findMany({ where: { projectId, type: environment } });

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
        const deleteKeys = prisma.apiKey.deleteMany({ // [NEW] Delete keys
            where: { projectId }
        });
        const deleteProject = prisma.project.delete({
            where: { id: projectId }
        });

        await prisma.$transaction([deleteFindings, deleteScans, deleteKeys, deleteProject]);

        res.status(204).send();
    } catch (error) {
        console.error('Failed to delete project', error);
        res.status(500).json({ error: 'Failed to delete project' });
    }
});

export default router;
