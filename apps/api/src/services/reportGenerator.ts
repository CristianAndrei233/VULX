import PDFDocument from 'pdfkit';
import dayjs from 'dayjs';
import prisma from '../lib/prisma';

export const generateScanReport = async (scanId: string): Promise<Buffer> => {
  const scan = await prisma.scan.findUnique({
    where: { id: scanId },
    include: { 
      project: true, 
      findings: true 
    }
  });

  if (!scan || !scan.project) {
    throw new Error('Scan or Project not found');
  }

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers: Buffer[] = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    // Header
    doc.fontSize(24).text('VULX Security Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Project: ${scan.project.name}`);
    doc.text(`Scan ID: ${scan.id}`);
    doc.text(`Date: ${dayjs(scan.startedAt).format('MMMM D, YYYY h:mm A')}`);
    doc.moveDown();
    
    // Executive Summary
    doc.fontSize(18).text('Executive Summary');
    doc.moveDown(0.5);
    
    const findingsCount = scan.findings.length;
    doc.fontSize(12).text(`Total Findings: ${findingsCount}`);
    
    const severityCount: Record<string, number> = {
        CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, INFO: 0
    };
    
    scan.findings.forEach(f => {
        if (severityCount[f.severity] !== undefined) {
            severityCount[f.severity]++;
        }
    });

    Object.entries(severityCount).forEach(([severity, count]) => {
        if (count > 0) {
            doc.text(`${severity}: ${count}`);
        }
    });
    
    doc.moveDown(2);

    // Detailed Findings
    doc.fontSize(18).text('Detailed Findings');
    doc.moveDown();

    if (scan.findings.length === 0) {
        doc.fontSize(12).text('No vulnerabilities found. Good job!');
    } else {
        scan.findings.forEach((finding, index) => {
            doc.fontSize(14).text(`${index + 1}. [${finding.severity}] ${finding.type}`);
            doc.fontSize(12).font('Helvetica-Bold').text(`${finding.method} ${finding.endpoint}`);
            doc.font('Helvetica').text(finding.description);
            doc.moveDown();
        });
    }

    doc.end();
  });
};
