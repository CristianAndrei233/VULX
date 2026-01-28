import { Router } from 'express';
import prisma from '../lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { sendTestNotification } from '../services/notifications';

const router = Router();

// Validation schemas
const createIntegrationSchema = z.object({
  type: z.enum(['slack', 'discord', 'teams', 'jira', 'linear']),
  name: z.string().min(1).max(100),
  webhookUrl: z.string().url().optional(),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  externalUrl: z.string().url().optional(),
  settings: z.any().optional(),
  events: z.array(z.string()).optional(),
});

const updateIntegrationSchema = createIntegrationSchema.partial().extend({
  isActive: z.boolean().optional(),
});

// ============================================
// List all integrations for the organization
// ============================================
router.get('/', async (req, res) => {
  try {
    const user = (req as AuthRequest).user!;
    if (!user.organizationId) {
      return res.status(400).json({ error: 'User does not belong to an organization' });
    }

    const integrations = await prisma.integrationConfig.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        name: true,
        webhookUrl: true,
        externalUrl: true,
        events: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        // Don't expose tokens
      },
    });

    // Mask webhook URLs for security
    const maskedIntegrations = integrations.map((i) => ({
      ...i,
      webhookUrl: i.webhookUrl ? maskUrl(i.webhookUrl) : null,
    }));

    res.json(maskedIntegrations);
  } catch (error) {
    console.error('Failed to list integrations:', error);
    res.status(500).json({ error: 'Failed to list integrations' });
  }
});

// ============================================
// Get single integration by ID
// ============================================
router.get('/:id', async (req, res) => {
  try {
    const user = (req as AuthRequest).user!;
    const { id } = req.params;

    const integration = await prisma.integrationConfig.findFirst({
      where: {
        id,
        organizationId: user.organizationId || '',
      },
      select: {
        id: true,
        type: true,
        name: true,
        webhookUrl: true,
        externalUrl: true,
        events: true,
        settings: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!integration) {
      return res.status(404).json({ error: 'Integration not found' });
    }

    res.json({
      ...integration,
      webhookUrl: integration.webhookUrl ? maskUrl(integration.webhookUrl) : null,
    });
  } catch (error) {
    console.error('Failed to get integration:', error);
    res.status(500).json({ error: 'Failed to get integration' });
  }
});

// ============================================
// Create new integration
// ============================================
router.post('/', async (req, res) => {
  try {
    const user = (req as AuthRequest).user!;
    if (!user.organizationId) {
      return res.status(400).json({ error: 'User does not belong to an organization' });
    }

    const data = createIntegrationSchema.parse(req.body);

    // Validate webhook URL is provided for webhook-based integrations
    if (['slack', 'discord', 'teams'].includes(data.type) && !data.webhookUrl) {
      return res.status(400).json({ error: 'Webhook URL is required for this integration type' });
    }

    const integration = await prisma.integrationConfig.create({
      data: {
        ...data,
        organizationId: user.organizationId,
      },
    });

    res.status(201).json({
      id: integration.id,
      type: integration.type,
      name: integration.name,
      events: integration.events,
      isActive: integration.isActive,
      createdAt: integration.createdAt,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.issues });
    }
    console.error('Failed to create integration:', error);
    res.status(500).json({ error: 'Failed to create integration' });
  }
});

// ============================================
// Update integration
// ============================================
router.put('/:id', async (req, res) => {
  try {
    const user = (req as AuthRequest).user!;
    const { id } = req.params;

    // Verify ownership
    const existing = await prisma.integrationConfig.findFirst({
      where: {
        id,
        organizationId: user.organizationId || '',
      },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Integration not found' });
    }

    const data = updateIntegrationSchema.parse(req.body);

    const integration = await prisma.integrationConfig.update({
      where: { id },
      data,
    });

    res.json({
      id: integration.id,
      type: integration.type,
      name: integration.name,
      events: integration.events,
      isActive: integration.isActive,
      updatedAt: integration.updatedAt,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.issues });
    }
    console.error('Failed to update integration:', error);
    res.status(500).json({ error: 'Failed to update integration' });
  }
});

// ============================================
// Delete integration
// ============================================
router.delete('/:id', async (req, res) => {
  try {
    const user = (req as AuthRequest).user!;
    const { id } = req.params;

    // Verify ownership
    const existing = await prisma.integrationConfig.findFirst({
      where: {
        id,
        organizationId: user.organizationId || '',
      },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Integration not found' });
    }

    await prisma.integrationConfig.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Failed to delete integration:', error);
    res.status(500).json({ error: 'Failed to delete integration' });
  }
});

// ============================================
// Test integration (send test notification)
// ============================================
router.post('/:id/test', async (req, res) => {
  try {
    const user = (req as AuthRequest).user!;
    const { id } = req.params;

    // Verify ownership
    const existing = await prisma.integrationConfig.findFirst({
      where: {
        id,
        organizationId: user.organizationId || '',
      },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Integration not found' });
    }

    const success = await sendTestNotification(id);

    if (success) {
      res.json({ success: true, message: 'Test notification sent successfully' });
    } else {
      res.status(500).json({ success: false, error: 'Failed to send test notification' });
    }
  } catch (error: any) {
    console.error('Failed to test integration:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to send test notification' });
  }
});

// ============================================
// Helper functions
// ============================================

function maskUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const pathParts = parsed.pathname.split('/');
    if (pathParts.length > 2) {
      // Mask most of the webhook ID
      const lastPart = pathParts[pathParts.length - 1];
      if (lastPart.length > 8) {
        pathParts[pathParts.length - 1] = lastPart.substring(0, 4) + '****' + lastPart.substring(lastPart.length - 4);
      }
    }
    parsed.pathname = pathParts.join('/');
    return parsed.toString();
  } catch {
    return '****';
  }
}

export default router;
