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
}
