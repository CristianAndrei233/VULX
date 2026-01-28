import { Router } from 'express';
import prisma from '../lib/prisma';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// Validation schemas
const createRuleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  type: z.enum(['path_pattern', 'parameter_pattern', 'response_pattern', 'header_pattern']),
  pattern: z.string().min(1),
  location: z.enum(['endpoint', 'parameter', 'request_body', 'response', 'header']),
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']),
  title: z.string().min(1).max(200),
  findingDescription: z.string().min(1),
  remediation: z.string().optional(),
  owaspCategory: z.string().optional(),
  cweId: z.string().optional(),
});

const updateRuleSchema = createRuleSchema.partial().extend({
  isActive: z.boolean().optional(),
});

// ============================================
// List all custom rules
// ============================================
router.get('/', async (req, res) => {
  try {
    const user = (req as AuthRequest).user!;
    if (!user.organizationId) {
      return res.status(400).json({ error: 'User does not belong to an organization' });
    }

    const rules = await prisma.customRule.findMany({
      where: { organizationId: user.organizationId },
      orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
    });

    res.json(rules);
  } catch (error) {
    console.error('Failed to list rules:', error);
    res.status(500).json({ error: 'Failed to list rules' });
  }
});

// ============================================
// Get single rule
// ============================================
router.get('/:id', async (req, res) => {
  try {
    const user = (req as AuthRequest).user!;
    const { id } = req.params;

    const rule = await prisma.customRule.findFirst({
      where: {
        id,
        organizationId: user.organizationId || '',
      },
    });

    if (!rule) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    res.json(rule);
  } catch (error) {
    console.error('Failed to get rule:', error);
    res.status(500).json({ error: 'Failed to get rule' });
  }
});

// ============================================
// Create new rule
// ============================================
router.post('/', async (req, res) => {
  try {
    const user = (req as AuthRequest).user!;
    if (!user.organizationId) {
      return res.status(400).json({ error: 'User does not belong to an organization' });
    }

    const data = createRuleSchema.parse(req.body);

    // Validate regex pattern
    try {
      new RegExp(data.pattern);
    } catch {
      return res.status(400).json({ error: 'Invalid regex pattern' });
    }

    const rule = await prisma.customRule.create({
      data: {
        ...data,
        organizationId: user.organizationId,
      },
    });

    res.status(201).json(rule);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.issues });
    }
    console.error('Failed to create rule:', error);
    res.status(500).json({ error: 'Failed to create rule' });
  }
});

// ============================================
// Update rule
// ============================================
router.put('/:id', async (req, res) => {
  try {
    const user = (req as AuthRequest).user!;
    const { id } = req.params;

    // Verify ownership
    const existing = await prisma.customRule.findFirst({
      where: {
        id,
        organizationId: user.organizationId || '',
      },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    const data = updateRuleSchema.parse(req.body);

    // Validate regex pattern if provided
    if (data.pattern) {
      try {
        new RegExp(data.pattern);
      } catch {
        return res.status(400).json({ error: 'Invalid regex pattern' });
      }
    }

    const rule = await prisma.customRule.update({
      where: { id },
      data,
    });

    res.json(rule);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.issues });
    }
    console.error('Failed to update rule:', error);
    res.status(500).json({ error: 'Failed to update rule' });
  }
});

// ============================================
// Delete rule
// ============================================
router.delete('/:id', async (req, res) => {
  try {
    const user = (req as AuthRequest).user!;
    const { id } = req.params;

    // Verify ownership
    const existing = await prisma.customRule.findFirst({
      where: {
        id,
        organizationId: user.organizationId || '',
      },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    await prisma.customRule.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Failed to delete rule:', error);
    res.status(500).json({ error: 'Failed to delete rule' });
  }
});

// ============================================
// Test rule against sample spec
// ============================================
router.post('/:id/test', async (req, res) => {
  try {
    const user = (req as AuthRequest).user!;
    const { id } = req.params;
    const { sampleSpec } = req.body;

    // Verify ownership
    const rule = await prisma.customRule.findFirst({
      where: {
        id,
        organizationId: user.organizationId || '',
      },
    });

    if (!rule) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    if (!sampleSpec) {
      return res.status(400).json({ error: 'sampleSpec is required in request body' });
    }

    // Parse the sample spec
    let spec: any;
    try {
      spec = typeof sampleSpec === 'string' ? JSON.parse(sampleSpec) : sampleSpec;
    } catch {
      return res.status(400).json({ error: 'Invalid JSON in sampleSpec' });
    }

    // Test the rule
    const regex = new RegExp(rule.pattern, 'i');
    const matches: any[] = [];

    // Check paths
    if (spec.paths) {
      for (const [path, methods] of Object.entries(spec.paths)) {
        if (rule.location === 'endpoint' && regex.test(path)) {
          matches.push({ location: 'path', value: path });
        }

        // Check operations
        for (const [method, operation] of Object.entries(methods as any)) {
          if (typeof operation !== 'object' || !operation) continue;

          // Check parameters
          if (rule.location === 'parameter' && (operation as any).parameters) {
            for (const param of (operation as any).parameters) {
              if (regex.test(param.name)) {
                matches.push({ location: 'parameter', path, method, value: param.name });
              }
            }
          }

          // Check request body
          if (rule.location === 'request_body' && (operation as any).requestBody) {
            const bodyStr = JSON.stringify((operation as any).requestBody);
            if (regex.test(bodyStr)) {
              matches.push({ location: 'request_body', path, method });
            }
          }

          // Check responses
          if (rule.location === 'response' && (operation as any).responses) {
            const responseStr = JSON.stringify((operation as any).responses);
            if (regex.test(responseStr)) {
              matches.push({ location: 'response', path, method });
            }
          }
        }
      }
    }

    res.json({
      rule: {
        id: rule.id,
        name: rule.name,
        pattern: rule.pattern,
        location: rule.location,
      },
      matchCount: matches.length,
      matches: matches.slice(0, 20), // Limit to 20 matches
      wouldGenerateFindings: matches.length > 0,
    });
  } catch (error) {
    console.error('Failed to test rule:', error);
    res.status(500).json({ error: 'Failed to test rule' });
  }
});

// ============================================
// Toggle rule active status
// ============================================
router.patch('/:id/toggle', async (req, res) => {
  try {
    const user = (req as AuthRequest).user!;
    const { id } = req.params;

    const existing = await prisma.customRule.findFirst({
      where: {
        id,
        organizationId: user.organizationId || '',
      },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    const rule = await prisma.customRule.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });

    res.json(rule);
  } catch (error) {
    console.error('Failed to toggle rule:', error);
    res.status(500).json({ error: 'Failed to toggle rule' });
  }
});

// ============================================
// Export rules as JSON
// ============================================
router.get('/export/json', async (req, res) => {
  try {
    const user = (req as AuthRequest).user!;
    if (!user.organizationId) {
      return res.status(400).json({ error: 'User does not belong to an organization' });
    }

    const rules = await prisma.customRule.findMany({
      where: { organizationId: user.organizationId },
      select: {
        name: true,
        description: true,
        type: true,
        pattern: true,
        location: true,
        severity: true,
        title: true,
        findingDescription: true,
        remediation: true,
        owaspCategory: true,
        cweId: true,
        isActive: true,
      },
    });

    res.setHeader('Content-Disposition', 'attachment; filename=vulx-custom-rules.json');
    res.json({ version: '1.0', exportedAt: new Date().toISOString(), rules });
  } catch (error) {
    console.error('Failed to export rules:', error);
    res.status(500).json({ error: 'Failed to export rules' });
  }
});

// ============================================
// Import rules from JSON
// ============================================
router.post('/import', async (req, res) => {
  try {
    const user = (req as AuthRequest).user!;
    if (!user.organizationId) {
      return res.status(400).json({ error: 'User does not belong to an organization' });
    }

    const { rules } = req.body;
    if (!Array.isArray(rules)) {
      return res.status(400).json({ error: 'rules array is required' });
    }

    const imported: any[] = [];
    const errors: any[] = [];

    for (let i = 0; i < rules.length; i++) {
      try {
        const data = createRuleSchema.parse(rules[i]);
        
        // Validate regex
        try {
          new RegExp(data.pattern);
        } catch {
          errors.push({ index: i, error: 'Invalid regex pattern' });
          continue;
        }

        const rule = await prisma.customRule.create({
          data: {
            ...data,
            organizationId: user.organizationId,
          },
        });
        imported.push(rule);
      } catch (error: any) {
        errors.push({ index: i, error: error.message || 'Validation failed' });
      }
    }

    res.json({
      imported: imported.length,
      failed: errors.length,
      errors: errors.slice(0, 10), // Limit error details
    });
  } catch (error) {
    console.error('Failed to import rules:', error);
    res.status(500).json({ error: 'Failed to import rules' });
  }
});

export default router;
