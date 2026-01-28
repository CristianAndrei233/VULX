/**
 * Ticket Integration Routes
 * API for creating and syncing tickets from findings
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { createJiraIssue } from '../services/jira';
import { createLinearIssue, getLinearTeams } from '../services/linear';

const router = Router();
const prisma = new PrismaClient();

// Create ticket from finding
const createTicketSchema = z.object({
  findingId: z.string().uuid(),
  integrationId: z.string().uuid(),
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  priority: z.string().optional(),
  projectKey: z.string().optional(), // For Jira
  teamId: z.string().optional(), // For Linear
});

router.post('/create', async (req: Request, res: Response) => {
  try {
    const data = createTicketSchema.parse(req.body);
    const userId = (req as any).user?.id;

    // Get the finding
    const finding = await prisma.finding.findUnique({
      where: { id: data.findingId },
      include: {
        scan: { include: { project: true } },
      },
    });

    if (!finding) {
      return res.status(404).json({ error: 'Finding not found' });
    }

    // Check if ticket already exists
    if (finding.externalTicketId) {
      return res.status(400).json({ 
        error: 'Ticket already exists', 
        ticketId: finding.externalTicketId,
        ticketUrl: finding.externalTicketUrl,
      });
    }

    // Get the integration
    const integration = await prisma.integrationConfig.findUnique({
      where: { id: data.integrationId },
    });

    if (!integration || !integration.isActive) {
      return res.status(404).json({ error: 'Integration not found or inactive' });
    }

    const description = data.description || 
      `**Security Finding from VULX**\n\n` +
      `**Severity:** ${finding.severity}\n` +
      `**Endpoint:** ${finding.method} ${finding.endpoint}\n` +
      `**Category:** ${finding.owaspCategory || 'N/A'}\n\n` +
      `**Description:**\n${finding.description}\n\n` +
      `**Remediation:**\n${finding.remediation || 'See VULX for details'}`;

    let ticket;

    if (integration.type === 'jira') {
      if (!data.projectKey) {
        return res.status(400).json({ error: 'projectKey is required for Jira' });
      }

      ticket = await createJiraIssue(integration, {
        findingId: finding.id,
        projectKey: data.projectKey,
        summary: data.title,
        description,
        issueType: 'Bug',
        priority: data.priority || 'Medium',
      });
    } else if (integration.type === 'linear') {
      if (!data.teamId) {
        return res.status(400).json({ error: 'teamId is required for Linear' });
      }

      const priorityMap: Record<string, number> = {
        urgent: 1, high: 2, medium: 3, low: 4, none: 0,
      };

      ticket = await createLinearIssue(integration, {
        findingId: finding.id,
        teamId: data.teamId,
        title: data.title,
        description,
        priority: priorityMap[data.priority?.toLowerCase() || 'medium'],
      });
    } else {
      return res.status(400).json({ error: 'Unsupported integration type for tickets' });
    }

    res.json({
      success: true,
      ticket,
    });
  } catch (error: any) {
    console.error('Create ticket error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get Linear teams for dropdown
router.get('/linear/teams', async (req: Request, res: Response) => {
  try {
    const { integrationId } = req.query;

    if (!integrationId || typeof integrationId !== 'string') {
      return res.status(400).json({ error: 'integrationId is required' });
    }

    const integration = await prisma.integrationConfig.findUnique({
      where: { id: integrationId },
    });

    if (!integration || integration.type !== 'linear' || !integration.accessToken) {
      return res.status(404).json({ error: 'Linear integration not found' });
    }

    const teams = await getLinearTeams(integration.accessToken);
    res.json(teams);
  } catch (error: any) {
    console.error('Get Linear teams error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get available integrations for ticket creation
router.get('/available', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true },
    });

    if (!user?.organizationId) {
      return res.status(400).json({ error: 'No organization' });
    }

    const integrations = await prisma.integrationConfig.findMany({
      where: {
        organizationId: user.organizationId,
        type: { in: ['jira', 'linear'] },
        isActive: true,
      },
      select: {
        id: true,
        type: true,
        name: true,
        externalUrl: true,
        settings: true,
      },
    });

    res.json(integrations);
  } catch (error: any) {
    console.error('Get available integrations error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
