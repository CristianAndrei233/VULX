/**
 * Linear Integration Service
 * Handles creating and syncing issues with Linear
 */

import axios from 'axios';
import { PrismaClient, IntegrationConfig } from '@prisma/client';

const prisma = new PrismaClient();

const LINEAR_API = 'https://api.linear.app/graphql';

interface LinearIssuePayload {
  findingId: string;
  teamId: string;
  title: string;
  description: string;
  priority?: number; // 0 = No priority, 1 = Urgent, 2 = High, 3 = Medium, 4 = Low
  labels?: string[];
}

interface LinearTicket {
  id: string;
  identifier: string;
  url: string;
  state: string;
}

/**
 * Create a Linear issue from a finding
 */
export async function createLinearIssue(
  integration: IntegrationConfig,
  payload: LinearIssuePayload
): Promise<LinearTicket | null> {
  if (!integration.accessToken) {
    throw new Error('Linear integration missing access token');
  }

  const mutation = `
    mutation CreateIssue($input: IssueCreateInput!) {
      issueCreate(input: $input) {
        success
        issue {
          id
          identifier
          url
          state {
            name
          }
        }
      }
    }
  `;

  try {
    const response = await axios.post(
      LINEAR_API,
      {
        query: mutation,
        variables: {
          input: {
            teamId: payload.teamId,
            title: payload.title,
            description: payload.description,
            priority: payload.priority ?? 3,
            labelIds: payload.labels,
          },
        },
      },
      {
        headers: {
          Authorization: integration.accessToken,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.errors) {
      throw new Error(response.data.errors[0].message);
    }

    const issue = response.data.data.issueCreate.issue;
    const ticket: LinearTicket = {
      id: issue.id,
      identifier: issue.identifier,
      url: issue.url,
      state: issue.state.name,
    };

    // Update finding with ticket info
    await prisma.finding.update({
      where: { id: payload.findingId },
      data: {
        externalTicketId: ticket.identifier,
        externalTicketUrl: ticket.url,
        externalTicketStatus: ticket.state,
      },
    });

    return ticket;
  } catch (error: any) {
    console.error('Linear issue creation failed:', error.response?.data || error.message);
    throw new Error(`Failed to create Linear issue: ${error.message}`);
  }
}

/**
 * Get Linear issue status
 */
export async function getLinearIssueStatus(
  integration: IntegrationConfig,
  issueId: string
): Promise<string> {
  if (!integration.accessToken) {
    throw new Error('Linear integration missing access token');
  }

  const query = `
    query Issue($id: String!) {
      issue(id: $id) {
        state {
          name
        }
      }
    }
  `;

  try {
    const response = await axios.post(
      LINEAR_API,
      {
        query,
        variables: { id: issueId },
      },
      {
        headers: {
          Authorization: integration.accessToken,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.data.issue.state.name;
  } catch (error: any) {
    console.error('Linear status fetch failed:', error.message);
    return 'Unknown';
  }
}

/**
 * Get Linear teams for configuration
 */
export async function getLinearTeams(accessToken: string): Promise<Array<{ id: string; name: string }>> {
  const query = `
    query Teams {
      teams {
        nodes {
          id
          name
        }
      }
    }
  `;

  try {
    const response = await axios.post(
      LINEAR_API,
      { query },
      {
        headers: {
          Authorization: accessToken,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.data.teams.nodes;
  } catch (error: any) {
    console.error('Failed to fetch Linear teams:', error.message);
    return [];
  }
}

/**
 * Sync ticket statuses for all findings with Linear tickets
 */
export async function syncLinearStatuses(organizationId: string): Promise<void> {
  const integration = await prisma.integrationConfig.findFirst({
    where: {
      organizationId,
      type: 'linear',
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
      const status = await getLinearIssueStatus(integration, finding.externalTicketId);
      
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
