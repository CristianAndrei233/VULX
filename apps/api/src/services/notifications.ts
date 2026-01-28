import axios from 'axios';
import prisma from '../lib/prisma';

/**
 * Notification Service
 * Handles sending notifications to Slack, Discord, and Microsoft Teams
 */

interface ScanNotificationPayload {
  scanId: string;
  projectName: string;
  status: string;
  riskScore: number;
  findings: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  duration: number;
  scanUrl: string;
}

// ============================================
// Slack Notifications
// ============================================

export async function sendSlackNotification(webhookUrl: string, payload: ScanNotificationPayload): Promise<boolean> {
  const color = getStatusColor(payload.riskScore);
  const emoji = payload.status === 'COMPLETED' ? '✅' : '❌';

  const slackPayload = {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${emoji} VULX Scan ${payload.status}`,
          emoji: true,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Project:*\n${payload.projectName}`,
          },
          {
            type: 'mrkdwn',
            text: `*Risk Score:*\n${payload.riskScore}/100`,
          },
        ],
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Findings:*\n🔴 ${payload.findings.critical} Critical | 🟠 ${payload.findings.high} High | 🟡 ${payload.findings.medium} Medium`,
          },
          {
            type: 'mrkdwn',
            text: `*Duration:*\n${formatDuration(payload.duration)}`,
          },
        ],
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'View Results',
              emoji: true,
            },
            url: payload.scanUrl,
            style: 'primary',
          },
        ],
      },
    ],
    attachments: [
      {
        color: color,
        blocks: [],
      },
    ],
  };

  try {
    await axios.post(webhookUrl, slackPayload);
    return true;
  } catch (error) {
    console.error('Failed to send Slack notification:', error);
    return false;
  }
}

// ============================================
// Discord Notifications
// ============================================

export async function sendDiscordNotification(webhookUrl: string, payload: ScanNotificationPayload): Promise<boolean> {
  const color = getStatusColorDecimal(payload.riskScore);
  const emoji = payload.status === 'COMPLETED' ? '✅' : '❌';

  const discordPayload = {
    embeds: [
      {
        title: `${emoji} VULX Scan ${payload.status}`,
        color: color,
        fields: [
          {
            name: '📁 Project',
            value: payload.projectName,
            inline: true,
          },
          {
            name: '📊 Risk Score',
            value: `${payload.riskScore}/100`,
            inline: true,
          },
          {
            name: '⏱️ Duration',
            value: formatDuration(payload.duration),
            inline: true,
          },
          {
            name: '🔍 Findings',
            value: `🔴 **${payload.findings.critical}** Critical\n🟠 **${payload.findings.high}** High\n🟡 **${payload.findings.medium}** Medium\n🔵 **${payload.findings.low}** Low`,
            inline: false,
          },
        ],
        url: payload.scanUrl,
        timestamp: new Date().toISOString(),
        footer: {
          text: 'VULX Security Scanner',
        },
      },
    ],
  };

  try {
    await axios.post(webhookUrl, discordPayload);
    return true;
  } catch (error) {
    console.error('Failed to send Discord notification:', error);
    return false;
  }
}

// ============================================
// Microsoft Teams Notifications
// ============================================

export async function sendTeamsNotification(webhookUrl: string, payload: ScanNotificationPayload): Promise<boolean> {
  const color = getStatusColor(payload.riskScore);
  const emoji = payload.status === 'COMPLETED' ? '✅' : '❌';

  const teamsPayload = {
    '@type': 'MessageCard',
    '@context': 'http://schema.org/extensions',
    themeColor: color.replace('#', ''),
    summary: `VULX Scan ${payload.status} - ${payload.projectName}`,
    sections: [
      {
        activityTitle: `${emoji} VULX Scan ${payload.status}`,
        activitySubtitle: payload.projectName,
        facts: [
          {
            name: 'Risk Score',
            value: `${payload.riskScore}/100`,
          },
          {
            name: 'Critical',
            value: String(payload.findings.critical),
          },
          {
            name: 'High',
            value: String(payload.findings.high),
          },
          {
            name: 'Medium',
            value: String(payload.findings.medium),
          },
          {
            name: 'Duration',
            value: formatDuration(payload.duration),
          },
        ],
        markdown: true,
      },
    ],
    potentialAction: [
      {
        '@type': 'OpenUri',
        name: 'View Results',
        targets: [
          {
            os: 'default',
            uri: payload.scanUrl,
          },
        ],
      },
    ],
  };

  try {
    await axios.post(webhookUrl, teamsPayload);
    return true;
  } catch (error) {
    console.error('Failed to send Teams notification:', error);
    return false;
  }
}

// ============================================
// Orchestrator - Send to all configured integrations
// ============================================

export async function notifyScanComplete(scanId: string): Promise<void> {
  try {
    const scan = await prisma.scan.findUnique({
      where: { id: scanId },
      include: {
        project: {
          include: {
            organization: {
              include: {
                integrations: {
                  where: {
                    isActive: true,
                    events: { has: 'scan_completed' },
                  },
                },
              },
            },
          },
        },
        findings: true,
      },
    });

    if (!scan || !scan.project) {
      console.error('Scan or project not found for notification:', scanId);
      return;
    }

    const integrations = scan.project.organization.integrations;
    if (integrations.length === 0) {
      return; // No integrations configured
    }

    // Calculate findings by severity
    const findingsCount = {
      critical: scan.findings.filter((f) => f.severity === 'CRITICAL').length,
      high: scan.findings.filter((f) => f.severity === 'HIGH').length,
      medium: scan.findings.filter((f) => f.severity === 'MEDIUM').length,
      low: scan.findings.filter((f) => f.severity === 'LOW').length,
      info: scan.findings.filter((f) => f.severity === 'INFO').length,
    };

    const payload: ScanNotificationPayload = {
      scanId: scan.id,
      projectName: scan.project.name,
      status: scan.status,
      riskScore: scan.riskScore || 0,
      findings: findingsCount,
      duration: scan.durationSecs || 0,
      scanUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/projects/${scan.projectId}/scans/${scan.id}`,
    };

    // Check if we should notify based on severity threshold
    const hasCriticalFindings = findingsCount.critical > 0;

    for (const integration of integrations) {
      // Check if this integration wants critical_finding events
      const wantsCriticalOnly = integration.events.includes('critical_finding') && !integration.events.includes('scan_completed');
      if (wantsCriticalOnly && !hasCriticalFindings) {
        continue;
      }

      if (!integration.webhookUrl) {
        continue;
      }

      try {
        switch (integration.type) {
          case 'slack':
            await sendSlackNotification(integration.webhookUrl, payload);
            break;
          case 'discord':
            await sendDiscordNotification(integration.webhookUrl, payload);
            break;
          case 'teams':
            await sendTeamsNotification(integration.webhookUrl, payload);
            break;
        }
      } catch (error) {
        console.error(`Failed to send ${integration.type} notification:`, error);
      }
    }

    // Mark notification as sent
    await prisma.scan.update({
      where: { id: scanId },
      data: { notificationSent: true },
    });
  } catch (error) {
    console.error('Error in notifyScanComplete:', error);
  }
}

// ============================================
// Test notification
// ============================================

export async function sendTestNotification(integrationId: string): Promise<boolean> {
  const integration = await prisma.integrationConfig.findUnique({
    where: { id: integrationId },
    include: { organization: true },
  });

  if (!integration || !integration.webhookUrl) {
    throw new Error('Integration not found or missing webhook URL');
  }

  const testPayload: ScanNotificationPayload = {
    scanId: 'test-scan-id',
    projectName: 'Test Project',
    status: 'COMPLETED',
    riskScore: 45,
    findings: {
      critical: 1,
      high: 3,
      medium: 5,
      low: 2,
      info: 1,
    },
    duration: 120,
    scanUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/test`,
  };

  switch (integration.type) {
    case 'slack':
      return sendSlackNotification(integration.webhookUrl, testPayload);
    case 'discord':
      return sendDiscordNotification(integration.webhookUrl, testPayload);
    case 'teams':
      return sendTeamsNotification(integration.webhookUrl, testPayload);
    default:
      throw new Error(`Unsupported integration type: ${integration.type}`);
  }
}

// ============================================
// Utility functions
// ============================================

function getStatusColor(riskScore: number): string {
  if (riskScore >= 80) return '#dc2626'; // Red
  if (riskScore >= 60) return '#f97316'; // Orange
  if (riskScore >= 40) return '#eab308'; // Yellow
  if (riskScore >= 20) return '#22c55e'; // Green
  return '#3b82f6'; // Blue
}

function getStatusColorDecimal(riskScore: number): number {
  if (riskScore >= 80) return 14423074; // Red
  if (riskScore >= 60) return 16348950; // Orange
  if (riskScore >= 40) return 15386376; // Yellow
  if (riskScore >= 20) return 2278109; // Green
  return 3899134; // Blue
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}
