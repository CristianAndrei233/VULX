import cron from 'node-cron';
import prisma from '../lib/prisma';
import { addScanJob } from './queue';
import { sendScanCompleteEmail } from './mailer';

// Check for scheduled scans every hour
export function initScheduler() {
  console.log('Initializing VULX Scheduler...');
  
  // 1. Run scheduled scans every hour
  cron.schedule('0 * * * *', async () => {
    console.log('Running scheduled scan check...');
    const now = new Date();
    const projects = await prisma.project.findMany({
      where: {
        scanFrequency: { not: 'MANUAL' },
        nextScanAt: { lte: now }
      }
    });

    console.log(`Found ${projects.length} projects due for scanning.`);

    for (const project of projects) {
        if (!project.specContent) continue;
        try {
            const scan = await prisma.scan.create({
                data: { projectId: project.id, status: 'PENDING' }
            });
            await addScanJob(scan.id, project.specContent);
            
            const nextRun = new Date();
            if (project.scanFrequency === 'DAILY') nextRun.setDate(nextRun.getDate() + 1);
            else if (project.scanFrequency === 'WEEKLY') nextRun.setDate(nextRun.getDate() + 7);

            await prisma.project.update({
                where: { id: project.id },
                data: { nextScanAt: nextRun }
            });
        } catch (error) {
            console.error(`Failed to trigger scan for project ${project.id}`, error);
        }
    }
  });

  // 2. Check for completed scans to notify users (Every minute)
  cron.schedule('* * * * *', async () => {
      const completedScans = await prisma.scan.findMany({
          where: {
              status: 'COMPLETED',
              notificationSent: false
          },
          include: {
              project: {
                  include: {
                      organization: {
                          include: { users: true }
                      }
                  }
              },
              findings: true
          }
      });

      for (const scan of completedScans) {
          try {
              // Notify all users in the organization
              const users = scan.project.organization.users;
              const findingCount = scan.findings.length;
              
              for (const user of users) {
                  await sendScanCompleteEmail(user.email, scan.project.name, scan.id, findingCount);
              }

              await prisma.scan.update({
                  where: { id: scan.id },
                  data: { notificationSent: true }
              });
              console.log(`Sent notifications for scan ${scan.id}`);
          } catch (error) {
              console.error(`Failed to send notifications for scan ${scan.id}`, error);
          }
      }
  });

  // 3. Capture security snapshots daily at midnight
  cron.schedule('0 0 * * *', async () => {
    console.log('Capturing daily security snapshots...');
    await captureAllSnapshots();
  });

  // Run initial snapshot capture on startup
  setTimeout(() => {
    captureAllSnapshots().catch(err => console.error('Initial snapshot capture failed:', err));
  }, 5000);
}

/**
 * Capture security snapshot for a single organization
 */
async function captureSecuritySnapshot(organizationId: string): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if snapshot already exists
  const existing = await prisma.securitySnapshot.findFirst({
    where: { organizationId, date: today },
  });

  if (existing) return;

  // Get all findings for this organization
  const findings = await prisma.finding.findMany({
    where: {
      scan: { project: { organizationId } },
    },
    select: {
      severity: true,
      status: true,
      createdAt: true,
      resolvedAt: true,
    },
  });

  const openFindings = findings.filter(f => f.status === 'OPEN');
  const fixedFindings = findings.filter(f => f.status === 'FIXED');

  const bySeverity = {
    critical: openFindings.filter(f => f.severity === 'CRITICAL').length,
    high: openFindings.filter(f => f.severity === 'HIGH').length,
    medium: openFindings.filter(f => f.severity === 'MEDIUM').length,
    low: openFindings.filter(f => f.severity === 'LOW').length,
    info: openFindings.filter(f => f.severity === 'INFO').length,
  };

  // Risk score calculation
  const riskScore = Math.min(100, Math.round(
    (bySeverity.critical * 25 + bySeverity.high * 15 + bySeverity.medium * 8 + bySeverity.low * 2) /
    Math.max(findings.length, 1) * 10
  ));

  // MTTR calculation
  const fixedWithTime = fixedFindings.filter(f => f.resolvedAt);
  const mttrHours = fixedWithTime.length > 0
    ? Math.round(fixedWithTime.reduce((sum, f) => {
        return sum + (new Date(f.resolvedAt!).getTime() - new Date(f.createdAt).getTime()) / 3600000;
      }, 0) / fixedWithTime.length)
    : 0;

  // Daily metrics
  const yesterday = new Date(Date.now() - 86400000);
  const newToday = findings.filter(f => new Date(f.createdAt) >= yesterday).length;
  const fixedToday = fixedFindings.filter(f => f.resolvedAt && new Date(f.resolvedAt) >= yesterday).length;

  await prisma.securitySnapshot.create({
    data: {
      organizationId,
      date: today,
      totalFindings: findings.length,
      openCount: openFindings.length,
      fixedCount: fixedFindings.length,
      riskScore,
      criticalCount: bySeverity.critical,
      highCount: bySeverity.high,
      mediumCount: bySeverity.medium,
      lowCount: bySeverity.low,
      infoCount: bySeverity.info,
      mttr: mttrHours,
      newFindings: newToday,
      resolvedCount: fixedToday,
    },
  });

  console.log(`Snapshot created for org ${organizationId}`);
}

/**
 * Capture snapshots for all organizations
 */
async function captureAllSnapshots(): Promise<void> {
  const organizations = await prisma.organization.findMany({ select: { id: true } });
  
  for (const org of organizations) {
    try {
      await captureSecuritySnapshot(org.id);
    } catch (error) {
      console.error(`Snapshot failed for org ${org.id}:`, error);
    }
  }
}

