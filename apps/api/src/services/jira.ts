/**
 * Jira Integration Service
 * Handles creating and syncing issues with Jira
 */

import axios from 'axios';
import { PrismaClient, IntegrationConfig } from '@prisma/client';

const prisma = new PrismaClient();

interface JiraIssuePayload {
  findingId: string;
  projectKey: string;
  summary: string;
  description: string;
  issueType: string;
  priority: string;
  labels?: string[];
}

interface JiraTicket {
  id: string;
  key: string;
  self: string;
  status: string;
}

/**
 * Create a Jira issue from a finding
 */
export async function createJiraIssue(
  integration: IntegrationConfig,
  payload: JiraIssuePayload
): Promise<JiraTicket | null> {
  if (!integration.externalUrl || !integration.accessToken) {
    throw new Error('Jira integration missing URL or access token');
  }

  const jiraUrl = integration.externalUrl.replace(/\/$/, '');
  
  try {
    const response = await axios.post(
      `${jiraUrl}/rest/api/3/issue`,
      {
        fields: {
          project: { key: payload.projectKey },
          summary: payload.summary,
          description: {
            type: 'doc',
            version: 1,
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: payload.description }],
              },
            ],
          },
          issuetype: { name: payload.issueType || 'Bug' },
          priority: { name: payload.priority || 'Medium' },
          labels: payload.labels || ['vulx', 'security'],
        },
      },
      {
        headers: {
          Authorization: `Basic ${integration.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const ticket: JiraTicket = {
      id: response.data.id,
      key: response.data.key,
      self: response.data.self,
      status: 'Open',
    };

    // Update finding with ticket info
    await prisma.finding.update({
      where: { id: payload.findingId },
      data: {
        externalTicketId: ticket.key,
        externalTicketUrl: `${jiraUrl}/browse/${ticket.key}`,
        externalTicketStatus: 'Open',
      },
    });

    return ticket;
  } catch (error: any) {
    console.error('Jira issue creation failed:', error.response?.data || error.message);
    throw new Error(`Failed to create Jira issue: ${error.message}`);
  }
}

/**
 * Get status of a Jira issue
 */
export async function getJiraIssueStatus(
  integration: IntegrationConfig,
  issueKey: string
): Promise<string> {
  if (!integration.externalUrl || !integration.accessToken) {
    throw new Error('Jira integration missing URL or access token');
  }

  const jiraUrl = integration.externalUrl.replace(/\/$/, '');

  try {
    const response = await axios.get(
      `${jiraUrl}/rest/api/3/issue/${issueKey}`,
      {
        headers: {
          Authorization: `Basic ${integration.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.fields.status.name;
  } catch (error: any) {
    console.error('Jira status fetch failed:', error.response?.data || error.message);
    return 'Unknown';
  }
}

/**
 * Sync ticket statuses for all findings with Jira tickets
 */
export async function syncJiraStatuses(organizationId: string): Promise<void> {
  const integration = await prisma.integrationConfig.findFirst({
    where: {
      organizationId,
      type: 'jira',
      isActive: true,
    },
  });

  if (!integration) {
    return;
  }

  const findings = await prisma.finding.findMany({
    where: {
      externalTicketId: { not: null },
      scan: {
        project: { organizationId },
      },
    },
  });

  for (const finding of findings) {
    if (!finding.externalTicketId) continue;

    try {
      const status = await getJiraIssueStatus(integration, finding.externalTicketId);
      
      if (status !== finding.externalTicketStatus) {
        await prisma.finding.update({
          where: { id: finding.id },
          data: { externalTicketStatus: status },
        });
      }
    } catch (error) {
      console.error(`Failed to sync status for ${finding.externalTicketId}:`, error);
    }
  }
}
