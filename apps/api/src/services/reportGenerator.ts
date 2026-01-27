import PDFDocument from 'pdfkit';
import dayjs from 'dayjs';
import prisma from '../lib/prisma';

// Color definitions for severity levels
const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: '#DC2626', // red-600
  HIGH: '#EA580C',     // orange-600
  MEDIUM: '#CA8A04',   // yellow-600
  LOW: '#2563EB',      // blue-600
  INFO: '#6B7280',     // gray-500
};

export const generateScanReport = async (scanId: string): Promise<Buffer> => {
  const scan = await prisma.scan.findUnique({
    where: { id: scanId },
    include: {
      project: true,
      findings: {
        orderBy: [
          { severity: 'asc' }, // CRITICAL first (alphabetically)
          { type: 'asc' }
        ]
      }
    }
  });

  if (!scan || !scan.project) {
    throw new Error('Scan or Project not found');
  }

  // Sort findings by severity priority
  const severityOrder = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'];
  const sortedFindings = [...scan.findings].sort((a, b) => {
    return severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity);
  });

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margin: 50,
      size: 'A4',
      info: {
        Title: `VULX Security Report - ${scan.project.name}`,
        Author: 'VULX SecureAPI Scanner',
        Subject: 'API Security Scan Report',
        Keywords: 'security, api, owasp, vulnerability',
        Creator: 'VULX SecureAPI Scanner',
        Producer: 'PDFKit'
      },
      bufferPages: true
    });
    const buffers: Buffer[] = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    // ============================================================
    // Cover Page
    // ============================================================
    doc.fontSize(32).fillColor('#4F46E5').text('VULX', { align: 'center' });
    doc.fontSize(14).fillColor('#6B7280').text('SecureAPI Scanner', { align: 'center' });
    doc.moveDown(2);

    doc.fontSize(24).fillColor('#111827').text('API Security Report', { align: 'center' });
    doc.moveDown(2);

    doc.fontSize(16).fillColor('#374151').text(scan.project.name, { align: 'center' });
    doc.moveDown(4);

    doc.fontSize(12).fillColor('#6B7280');
    doc.text(`Scan ID: ${scan.id}`, { align: 'center' });
    doc.text(`Date: ${dayjs(scan.startedAt).format('MMMM D, YYYY [at] h:mm A')}`, { align: 'center' });
    doc.text(`Status: ${scan.status}`, { align: 'center' });

    doc.addPage();

    // ============================================================
    // Executive Summary
    // ============================================================
    doc.fontSize(20).fillColor('#111827').text('Executive Summary');
    doc.moveDown();

    // Draw a summary box
    const summaryY = doc.y;
    doc.rect(50, summaryY, 495, 120).fillAndStroke('#F9FAFB', '#E5E7EB');
    doc.fillColor('#111827');

    doc.y = summaryY + 15;
    doc.x = 70;

    const findingsCount = sortedFindings.length;
    doc.fontSize(14).text(`Total Findings: ${findingsCount}`, 70);
    doc.moveDown(0.5);

    // Severity counts
    const severityCount: Record<string, number> = {
      CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, INFO: 0
    };

    sortedFindings.forEach(f => {
      if (severityCount[f.severity] !== undefined) {
        severityCount[f.severity]++;
      }
    });

    doc.fontSize(12);
    severityOrder.forEach(severity => {
      const count = severityCount[severity];
      if (count > 0) {
        doc.fillColor(SEVERITY_COLORS[severity]).text(`● ${severity}: ${count}`, 70, doc.y, { continued: false });
      }
    });

    doc.y = summaryY + 130;
    doc.x = 50;
    doc.moveDown();

    // Risk Assessment
    doc.fontSize(16).fillColor('#111827').text('Risk Assessment');
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor('#374151');

    if (severityCount.CRITICAL > 0) {
      doc.text('⚠️ CRITICAL RISK: Immediate action required. Critical vulnerabilities detected that could lead to severe security breaches.');
    } else if (severityCount.HIGH > 0) {
      doc.text('⚠️ HIGH RISK: Prompt attention needed. High-severity vulnerabilities should be addressed as soon as possible.');
    } else if (severityCount.MEDIUM > 0) {
      doc.text('⚡ MODERATE RISK: Medium-severity issues detected. Plan remediation within your next development cycle.');
    } else if (severityCount.LOW > 0 || severityCount.INFO > 0) {
      doc.text('✓ LOW RISK: Only low-severity or informational findings detected. Review at your convenience.');
    } else {
      doc.text('✓ NO ISSUES: No vulnerabilities detected in this scan. Continue monitoring with regular scans.');
    }

    doc.moveDown(2);

    // ============================================================
    // OWASP API Security Top 10 Coverage
    // ============================================================
    doc.fontSize(16).fillColor('#111827').text('OWASP API Security Top 10 Coverage');
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#6B7280');
    doc.text('This scan checks for the OWASP API Security Top 10 (2023) vulnerabilities:');
    doc.moveDown(0.5);

    const owaspCategories = [
      'API1:2023 - Broken Object Level Authorization',
      'API2:2023 - Broken Authentication',
      'API3:2023 - Broken Object Property Level Authorization',
      'API4:2023 - Unrestricted Resource Consumption',
      'API5:2023 - Broken Function Level Authorization',
      'API6:2023 - Unrestricted Access to Sensitive Business Flows',
      'API7:2023 - Server Side Request Forgery',
      'API8:2023 - Security Misconfiguration',
      'API9:2023 - Improper Inventory Management',
      'API10:2023 - Unsafe Consumption of APIs'
    ];

    owaspCategories.forEach(category => {
      const hasFindings = sortedFindings.some(f => f.owaspCategory?.includes(category.split(' - ')[0]));
      const marker = hasFindings ? '⚠️' : '✓';
      const color = hasFindings ? '#DC2626' : '#059669';
      doc.fillColor(color).text(`${marker} ${category}`, 60);
    });

    doc.addPage();

    // ============================================================
    // Detailed Findings
    // ============================================================
    doc.fontSize(20).fillColor('#111827').text('Detailed Findings');
    doc.moveDown();

    if (sortedFindings.length === 0) {
      doc.fontSize(12).fillColor('#059669').text('✓ No vulnerabilities found. Excellent work!');
      doc.moveDown();
      doc.fillColor('#374151').text('Your API specification passed all security checks. Continue to monitor your API security with regular scans.');
    } else {
      sortedFindings.forEach((finding, index) => {
        // Check if we need a new page
        if (doc.y > 650) {
          doc.addPage();
        }

        // Finding header with severity badge
        const badgeColor = SEVERITY_COLORS[finding.severity] || '#6B7280';
        const headerY = doc.y;

        // Severity badge background
        doc.rect(50, headerY, 70, 18).fill(badgeColor);
        doc.fillColor('#FFFFFF').fontSize(10).text(finding.severity, 55, headerY + 4, { width: 60, align: 'center' });

        // Finding type
        doc.fillColor('#111827').fontSize(14).text(`${finding.type}`, 130, headerY + 2);

        doc.y = headerY + 25;

        // Endpoint
        doc.fontSize(11).fillColor('#4F46E5').text(`${finding.method} ${finding.endpoint}`, 50);
        doc.moveDown(0.3);

        // OWASP Category and CWE
        if (finding.owaspCategory || finding.cweId) {
          doc.fontSize(9).fillColor('#6B7280');
          const metaText = [
            finding.owaspCategory,
            finding.cweId ? `${finding.cweId}` : null
          ].filter(Boolean).join(' | ');
          doc.text(metaText, 50);
          doc.moveDown(0.3);
        }

        // Description
        doc.fontSize(11).fillColor('#374151').text(finding.description, 50, doc.y, { width: 495 });
        doc.moveDown(0.5);

        // Evidence (if present)
        if (finding.evidence) {
          doc.fontSize(10).fillColor('#92400E').text('Evidence:', 50);
          doc.fontSize(10).fillColor('#78350F').text(finding.evidence, 60, doc.y, { width: 485 });
          doc.moveDown(0.5);
        }

        // Remediation
        if (finding.remediation) {
          doc.fontSize(10).fillColor('#065F46').text('How to Fix:', 50);
          doc.moveDown(0.3);

          // Draw remediation box
          const remY = doc.y;
          const remHeight = doc.heightOfString(finding.remediation, { width: 475 }) + 20;
          doc.rect(50, remY, 495, Math.min(remHeight, 200)).fillAndStroke('#ECFDF5', '#A7F3D0');

          doc.fillColor('#064E3B').fontSize(9).text(finding.remediation, 60, remY + 10, {
            width: 475,
            height: 190
          });

          doc.y = remY + Math.min(remHeight, 200) + 10;
        }

        doc.moveDown();

        // Separator line
        if (index < sortedFindings.length - 1) {
          doc.strokeColor('#E5E7EB').lineWidth(1);
          doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
          doc.moveDown();
        }
      });
    }

    // ============================================================
    // Footer on each page
    // ============================================================
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);

      // Footer line
      doc.strokeColor('#E5E7EB').lineWidth(1);
      doc.moveTo(50, 780).lineTo(545, 780).stroke();

      // Footer text
      doc.fontSize(8).fillColor('#9CA3AF');
      doc.text(
        `Generated by VULX SecureAPI Scanner | ${dayjs().format('MMMM D, YYYY')} | Page ${i + 1} of ${pages.count}`,
        50,
        790,
        { align: 'center', width: 495 }
      );
    }

    doc.end();
  });
};
