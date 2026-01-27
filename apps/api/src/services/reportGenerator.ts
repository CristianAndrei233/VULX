import PDFDocument from 'pdfkit';
import dayjs from 'dayjs';
import prisma from '../lib/prisma';

// ============================================================
// VULX Professional Security Report Generator
// ============================================================

// Brand Colors
const COLORS = {
  primary: '#4F46E5',      // Indigo
  primaryDark: '#3730A3',  // Darker indigo
  secondary: '#0EA5E9',    // Sky blue
  success: '#059669',      // Emerald
  warning: '#D97706',      // Amber
  danger: '#DC2626',       // Red
  dark: '#111827',         // Gray 900
  text: '#374151',         // Gray 700
  textLight: '#6B7280',    // Gray 500
  border: '#E5E7EB',       // Gray 200
  background: '#F9FAFB',   // Gray 50
  white: '#FFFFFF',
};

// Severity Configuration
const SEVERITY_CONFIG: Record<string, { color: string; label: string; priority: number; icon: string }> = {
  CRITICAL: { color: '#DC2626', label: 'Critical', priority: 1, icon: '🔴' },
  HIGH: { color: '#EA580C', label: 'High', priority: 2, icon: '🟠' },
  MEDIUM: { color: '#CA8A04', label: 'Medium', priority: 3, icon: '🟡' },
  LOW: { color: '#2563EB', label: 'Low', priority: 4, icon: '🔵' },
  INFO: { color: '#6B7280', label: 'Info', priority: 5, icon: '⚪' },
};

// OWASP API Security Top 10 (2023)
const OWASP_CATEGORIES = [
  { id: 'API1:2023', name: 'Broken Object Level Authorization', shortName: 'BOLA', risk: 'Critical' },
  { id: 'API2:2023', name: 'Broken Authentication', shortName: 'Auth', risk: 'Critical' },
  { id: 'API3:2023', name: 'Broken Object Property Level Authorization', shortName: 'BOPLA', risk: 'High' },
  { id: 'API4:2023', name: 'Unrestricted Resource Consumption', shortName: 'DoS', risk: 'High' },
  { id: 'API5:2023', name: 'Broken Function Level Authorization', shortName: 'BFLA', risk: 'Critical' },
  { id: 'API6:2023', name: 'Unrestricted Access to Sensitive Business Flows', shortName: 'Business', risk: 'High' },
  { id: 'API7:2023', name: 'Server Side Request Forgery', shortName: 'SSRF', risk: 'High' },
  { id: 'API8:2023', name: 'Security Misconfiguration', shortName: 'Misconfig', risk: 'Medium' },
  { id: 'API9:2023', name: 'Improper Inventory Management', shortName: 'Inventory', risk: 'Medium' },
  { id: 'API10:2023', name: 'Unsafe Consumption of APIs', shortName: 'Unsafe API', risk: 'Medium' },
];

// Helper Functions
const calculateRiskScore = (severityCount: Record<string, number>): number => {
  const weights = { CRITICAL: 40, HIGH: 25, MEDIUM: 10, LOW: 3, INFO: 1 };
  let score = 100;
  Object.entries(severityCount).forEach(([severity, count]) => {
    score -= (weights[severity as keyof typeof weights] || 0) * count;
  });
  return Math.max(0, Math.min(100, score));
};

const getRiskLevel = (score: number): { level: string; color: string; description: string } => {
  if (score >= 90) return { level: 'Excellent', color: COLORS.success, description: 'Your API security posture is excellent.' };
  if (score >= 70) return { level: 'Good', color: '#22C55E', description: 'Minor improvements recommended.' };
  if (score >= 50) return { level: 'Fair', color: COLORS.warning, description: 'Several security concerns need attention.' };
  if (score >= 30) return { level: 'Poor', color: '#F97316', description: 'Significant security risks detected.' };
  return { level: 'Critical', color: COLORS.danger, description: 'Immediate action required.' };
};

export const generateScanReport = async (scanId: string): Promise<Buffer> => {
  const scan = await prisma.scan.findUnique({
    where: { id: scanId },
    include: {
      project: {
        include: {
          organization: true,
        },
      },
      findings: {
        orderBy: [{ severity: 'asc' }, { type: 'asc' }],
      },
    },
  });

  if (!scan || !scan.project) {
    throw new Error('Scan or Project not found');
  }

  // Sort findings by severity priority
  const severityOrder = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'];
  const sortedFindings = [...scan.findings].sort((a, b) => {
    return severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity);
  });

  // Calculate statistics
  const severityCount: Record<string, number> = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, INFO: 0 };
  sortedFindings.forEach((f) => {
    if (severityCount[f.severity] !== undefined) {
      severityCount[f.severity]++;
    }
  });

  const riskScore = calculateRiskScore(severityCount);
  const riskLevel = getRiskLevel(riskScore);
  const totalFindings = sortedFindings.length;

  // Group findings by OWASP category
  const findingsByOwasp = new Map<string, typeof sortedFindings>();
  sortedFindings.forEach((f) => {
    const category = f.owaspCategory?.split(' - ')[0] || 'Unknown';
    if (!findingsByOwasp.has(category)) {
      findingsByOwasp.set(category, []);
    }
    findingsByOwasp.get(category)!.push(f);
  });

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margin: 50,
      size: 'A4',
      bufferPages: true,
      info: {
        Title: `VULX Security Report - ${scan.project.name}`,
        Author: 'VULX SecureAPI Scanner',
        Subject: 'API Security Assessment Report',
        Keywords: 'security, api, owasp, vulnerability, penetration testing',
        Creator: 'VULX SecureAPI Scanner v1.0',
        Producer: 'VULX by SecureAPI',
      },
    });

    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const pageWidth = 495;
    const leftMargin = 50;

    // ============================================================
    // COVER PAGE
    // ============================================================

    // Top gradient bar
    const gradient = doc.linearGradient(0, 0, 595, 0);
    gradient.stop(0, COLORS.primary).stop(1, COLORS.secondary);
    doc.rect(0, 0, 595, 8).fill(gradient);

    // Logo area
    doc.moveDown(4);
    doc.fontSize(48).fillColor(COLORS.primary).text('VULX', { align: 'center' });
    doc.fontSize(14).fillColor(COLORS.textLight).text('SecureAPI Scanner', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor(COLORS.textLight).text('Enterprise API Security Assessment Platform', { align: 'center' });

    doc.moveDown(4);

    // Report title box
    const titleBoxY = doc.y;
    doc.rect(leftMargin, titleBoxY, pageWidth, 100).fillAndStroke(COLORS.background, COLORS.border);

    doc.fontSize(28).fillColor(COLORS.dark);
    doc.text('Security Assessment', leftMargin, titleBoxY + 20, { align: 'center', width: pageWidth });
    doc.fontSize(18).fillColor(COLORS.text);
    doc.text('Report', { align: 'center', width: pageWidth });

    doc.y = titleBoxY + 120;
    doc.moveDown(2);

    // Project information
    doc.fontSize(20).fillColor(COLORS.dark).text(scan.project.name, { align: 'center' });
    if (scan.project.organization) {
      doc.fontSize(12).fillColor(COLORS.textLight).text(scan.project.organization.name, { align: 'center' });
    }

    doc.moveDown(4);

    // Scan metadata
    const metaBoxY = doc.y;
    doc.rect(leftMargin + 100, metaBoxY, pageWidth - 200, 120).fillAndStroke(COLORS.white, COLORS.border);

    doc.fontSize(10).fillColor(COLORS.textLight);
    const metaX = leftMargin + 120;
    doc.text('SCAN DETAILS', metaX, metaBoxY + 15, { width: pageWidth - 240 });

    doc.fontSize(11).fillColor(COLORS.text);
    doc.text(`Scan ID: ${scan.id.substring(0, 8)}...`, metaX, metaBoxY + 35);
    doc.text(`Date: ${dayjs(scan.startedAt).format('MMMM D, YYYY')}`, metaX, metaBoxY + 52);
    doc.text(`Time: ${dayjs(scan.startedAt).format('h:mm A')}`, metaX, metaBoxY + 69);
    doc.text(`Status: ${scan.status}`, metaX, metaBoxY + 86);

    // Risk score badge on cover
    const badgeX = leftMargin + pageWidth - 120;
    const badgeY = metaBoxY + 25;
    doc.circle(badgeX, badgeY + 30, 35).fillAndStroke(riskLevel.color, riskLevel.color);
    doc.fontSize(24).fillColor(COLORS.white).text(String(riskScore), badgeX - 20, badgeY + 15, { width: 40, align: 'center' });
    doc.fontSize(8).text('SCORE', badgeX - 20, badgeY + 42, { width: 40, align: 'center' });

    // Footer on cover
    doc.fontSize(8).fillColor(COLORS.textLight);
    doc.text('CONFIDENTIAL - FOR AUTHORIZED USE ONLY', leftMargin, 750, { align: 'center', width: pageWidth });
    doc.text(`Generated: ${dayjs().format('MMMM D, YYYY [at] h:mm A')}`, { align: 'center', width: pageWidth });

    doc.addPage();

    // ============================================================
    // TABLE OF CONTENTS
    // ============================================================
    doc.fontSize(24).fillColor(COLORS.dark).text('Table of Contents');
    doc.moveDown();

    const tocItems = [
      { title: 'Executive Summary', page: 3 },
      { title: 'Risk Assessment Overview', page: 3 },
      { title: 'OWASP API Security Top 10 Coverage', page: 4 },
      { title: 'Findings Summary', page: 4 },
      { title: 'Detailed Findings', page: 5 },
      { title: 'Remediation Roadmap', page: '—' },
      { title: 'Appendix: Methodology', page: '—' },
    ];

    tocItems.forEach((item, index) => {
      const y = doc.y;
      doc.fontSize(12).fillColor(COLORS.text).text(`${index + 1}. ${item.title}`, leftMargin + 20, y);
      doc.fillColor(COLORS.textLight).text(String(item.page), leftMargin + pageWidth - 40, y, { width: 40, align: 'right' });
      doc.moveDown(0.8);
    });

    doc.addPage();

    // ============================================================
    // EXECUTIVE SUMMARY
    // ============================================================
    doc.fontSize(24).fillColor(COLORS.dark).text('Executive Summary');
    doc.moveDown();

    // Summary stats boxes
    const statsY = doc.y;
    const boxWidth = (pageWidth - 30) / 4;

    // Total Findings Box
    doc.rect(leftMargin, statsY, boxWidth, 70).fillAndStroke(COLORS.primary, COLORS.primary);
    doc.fontSize(28).fillColor(COLORS.white).text(String(totalFindings), leftMargin, statsY + 12, { width: boxWidth, align: 'center' });
    doc.fontSize(10).text('Total Findings', { width: boxWidth, align: 'center' });

    // Critical Box
    doc.rect(leftMargin + boxWidth + 10, statsY, boxWidth, 70).fillAndStroke(SEVERITY_CONFIG.CRITICAL.color, SEVERITY_CONFIG.CRITICAL.color);
    doc.fontSize(28).fillColor(COLORS.white).text(String(severityCount.CRITICAL), leftMargin + boxWidth + 10, statsY + 12, { width: boxWidth, align: 'center' });
    doc.fontSize(10).text('Critical', { width: boxWidth, align: 'center' });

    // High Box
    doc.rect(leftMargin + (boxWidth + 10) * 2, statsY, boxWidth, 70).fillAndStroke(SEVERITY_CONFIG.HIGH.color, SEVERITY_CONFIG.HIGH.color);
    doc.fontSize(28).fillColor(COLORS.white).text(String(severityCount.HIGH), leftMargin + (boxWidth + 10) * 2, statsY + 12, { width: boxWidth, align: 'center' });
    doc.fontSize(10).text('High', { width: boxWidth, align: 'center' });

    // Risk Score Box
    doc.rect(leftMargin + (boxWidth + 10) * 3, statsY, boxWidth, 70).fillAndStroke(riskLevel.color, riskLevel.color);
    doc.fontSize(28).fillColor(COLORS.white).text(String(riskScore), leftMargin + (boxWidth + 10) * 3, statsY + 12, { width: boxWidth, align: 'center' });
    doc.fontSize(10).text('Risk Score', { width: boxWidth, align: 'center' });

    doc.y = statsY + 90;

    // Risk Level Description
    doc.fontSize(14).fillColor(COLORS.dark).text('Overall Risk Assessment');
    doc.moveDown(0.3);

    const riskBoxY = doc.y;
    doc.rect(leftMargin, riskBoxY, pageWidth, 60).fillAndStroke(COLORS.background, COLORS.border);
    doc.rect(leftMargin, riskBoxY, 6, 60).fill(riskLevel.color);

    doc.fontSize(16).fillColor(riskLevel.color).text(`Risk Level: ${riskLevel.level}`, leftMargin + 20, riskBoxY + 12);
    doc.fontSize(11).fillColor(COLORS.text).text(riskLevel.description, leftMargin + 20, riskBoxY + 35, { width: pageWidth - 40 });

    doc.y = riskBoxY + 75;

    // Key Findings Summary
    doc.fontSize(14).fillColor(COLORS.dark).text('Key Findings');
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor(COLORS.text);

    if (severityCount.CRITICAL > 0) {
      doc.fillColor(SEVERITY_CONFIG.CRITICAL.color).text(`• ${severityCount.CRITICAL} Critical vulnerabilities require immediate attention`, leftMargin + 10);
    }
    if (severityCount.HIGH > 0) {
      doc.fillColor(SEVERITY_CONFIG.HIGH.color).text(`• ${severityCount.HIGH} High severity issues should be addressed promptly`, leftMargin + 10);
    }
    if (severityCount.MEDIUM > 0) {
      doc.fillColor(SEVERITY_CONFIG.MEDIUM.color).text(`• ${severityCount.MEDIUM} Medium severity issues for planned remediation`, leftMargin + 10);
    }
    if (severityCount.LOW > 0) {
      doc.fillColor(SEVERITY_CONFIG.LOW.color).text(`• ${severityCount.LOW} Low severity recommendations`, leftMargin + 10);
    }
    if (severityCount.INFO > 0) {
      doc.fillColor(SEVERITY_CONFIG.INFO.color).text(`• ${severityCount.INFO} Informational findings`, leftMargin + 10);
    }
    if (totalFindings === 0) {
      doc.fillColor(COLORS.success).text('• No vulnerabilities detected - excellent security posture!', leftMargin + 10);
    }

    doc.moveDown(2);

    // ============================================================
    // SEVERITY DISTRIBUTION
    // ============================================================
    doc.fontSize(14).fillColor(COLORS.dark).text('Severity Distribution');
    doc.moveDown(0.5);

    // Draw severity bars
    const barMaxWidth = pageWidth - 100;
    const barHeight = 24;
    let barY = doc.y;

    severityOrder.forEach((severity) => {
      const count = severityCount[severity];
      const config = SEVERITY_CONFIG[severity];
      const barWidth = totalFindings > 0 ? (count / totalFindings) * barMaxWidth : 0;

      // Label
      doc.fontSize(10).fillColor(COLORS.text).text(config.label, leftMargin, barY + 5, { width: 60 });

      // Background bar
      doc.rect(leftMargin + 70, barY, barMaxWidth, barHeight).fill('#E5E7EB');

      // Filled bar
      if (barWidth > 0) {
        doc.rect(leftMargin + 70, barY, barWidth, barHeight).fill(config.color);
      }

      // Count
      doc.fontSize(10).fillColor(COLORS.dark).text(String(count), leftMargin + 80 + barMaxWidth, barY + 5);

      barY += barHeight + 8;
    });

    doc.y = barY + 10;

    doc.addPage();

    // ============================================================
    // OWASP API SECURITY TOP 10 COVERAGE
    // ============================================================
    doc.fontSize(24).fillColor(COLORS.dark).text('OWASP API Security Top 10');
    doc.fontSize(12).fillColor(COLORS.textLight).text('Coverage Analysis (2023 Edition)');
    doc.moveDown();

    const tableY = doc.y;
    const colWidths = [80, 250, 80, 75];

    // Header row
    doc.rect(leftMargin, tableY, pageWidth, 30).fill(COLORS.primary);
    doc.fontSize(10).fillColor(COLORS.white);
    doc.text('ID', leftMargin + 10, tableY + 10);
    doc.text('Vulnerability Category', leftMargin + colWidths[0] + 10, tableY + 10);
    doc.text('Status', leftMargin + colWidths[0] + colWidths[1] + 10, tableY + 10);
    doc.text('Findings', leftMargin + colWidths[0] + colWidths[1] + colWidths[2] + 10, tableY + 10);

    let rowY = tableY + 30;
    OWASP_CATEGORIES.forEach((category, index) => {
      const findings = findingsByOwasp.get(category.id) || [];
      const hasFindings = findings.length > 0;
      const bgColor = index % 2 === 0 ? COLORS.white : COLORS.background;

      doc.rect(leftMargin, rowY, pageWidth, 28).fill(bgColor);

      doc.fontSize(9).fillColor(COLORS.text);
      doc.text(category.id, leftMargin + 10, rowY + 9);
      doc.text(category.name, leftMargin + colWidths[0] + 10, rowY + 9, { width: colWidths[1] - 20 });

      if (hasFindings) {
        doc.fillColor(COLORS.danger).text('Issues Found', leftMargin + colWidths[0] + colWidths[1] + 10, rowY + 9);
        doc.fillColor(COLORS.danger).text(String(findings.length), leftMargin + colWidths[0] + colWidths[1] + colWidths[2] + 25, rowY + 9);
      } else {
        doc.fillColor(COLORS.success).text('Passed', leftMargin + colWidths[0] + colWidths[1] + 10, rowY + 9);
        doc.fillColor(COLORS.success).text('0', leftMargin + colWidths[0] + colWidths[1] + colWidths[2] + 25, rowY + 9);
      }

      rowY += 28;
    });

    // Table border
    doc.rect(leftMargin, tableY, pageWidth, rowY - tableY).stroke(COLORS.border);

    doc.y = rowY + 20;

    // Coverage summary
    const passedCount = OWASP_CATEGORIES.filter(c => !(findingsByOwasp.get(c.id)?.length)).length;
    const coveragePercent = Math.round((passedCount / OWASP_CATEGORIES.length) * 100);

    doc.fontSize(12).fillColor(COLORS.dark).text(`Coverage Score: ${coveragePercent}% (${passedCount}/10 categories passed)`);

    doc.addPage();

    // ============================================================
    // DETAILED FINDINGS
    // ============================================================
    doc.fontSize(24).fillColor(COLORS.dark).text('Detailed Findings');
    doc.moveDown();

    if (sortedFindings.length === 0) {
      const noFindingsY = doc.y;
      doc.rect(leftMargin, noFindingsY, pageWidth, 100).fillAndStroke('#ECFDF5', '#A7F3D0');
      doc.fontSize(16).fillColor(COLORS.success).text('✓ No Vulnerabilities Detected', leftMargin + 20, noFindingsY + 25);
      doc.fontSize(12).fillColor(COLORS.text).text(
        'Congratulations! Your API specification passed all security checks. Continue monitoring with regular scans to maintain your security posture.',
        leftMargin + 20,
        noFindingsY + 50,
        { width: pageWidth - 40 }
      );
    } else {
      let findingNumber = 0;

      sortedFindings.forEach((finding) => {
        findingNumber++;

        // Check for page break
        if (doc.y > 620) {
          doc.addPage();
        }

        const findingY = doc.y;
        const config = SEVERITY_CONFIG[finding.severity] || SEVERITY_CONFIG.INFO;

        // Finding header
        doc.rect(leftMargin, findingY, pageWidth, 36).fill(COLORS.background);
        doc.rect(leftMargin, findingY, 6, 36).fill(config.color);

        // Severity badge
        doc.rect(leftMargin + 15, findingY + 8, 70, 20).fill(config.color);
        doc.fontSize(9).fillColor(COLORS.white).text(finding.severity, leftMargin + 15, findingY + 13, { width: 70, align: 'center' });

        // Finding number and type
        doc.fontSize(12).fillColor(COLORS.dark).text(`#${findingNumber} ${finding.type}`, leftMargin + 95, findingY + 12);

        doc.y = findingY + 45;

        // Endpoint
        doc.fontSize(10).fillColor(COLORS.primary);
        const methodColor = finding.method === 'GET' ? '#22C55E' : finding.method === 'POST' ? '#3B82F6' : finding.method === 'DELETE' ? '#EF4444' : '#8B5CF6';
        doc.fillColor(methodColor).text(finding.method, leftMargin, doc.y, { continued: true });
        doc.fillColor(COLORS.text).text(` ${finding.endpoint}`);
        doc.moveDown(0.3);

        // OWASP & CWE references
        if (finding.owaspCategory || finding.cweId) {
          doc.fontSize(9).fillColor(COLORS.textLight);
          const refs = [finding.owaspCategory, finding.cweId].filter(Boolean).join(' | ');
          doc.text(refs, leftMargin);
          doc.moveDown(0.3);
        }

        // Description
        doc.fontSize(10).fillColor(COLORS.text).text(finding.description, leftMargin, doc.y, { width: pageWidth });
        doc.moveDown(0.5);

        // Evidence
        if (finding.evidence) {
          doc.fontSize(9).fillColor(COLORS.warning).text('Evidence:', leftMargin);
          doc.moveDown(0.2);

          const evidenceY = doc.y;
          const evidenceHeight = Math.min(doc.heightOfString(finding.evidence, { width: pageWidth - 20 }) + 16, 80);
          doc.rect(leftMargin, evidenceY, pageWidth, evidenceHeight).fillAndStroke('#FEF3C7', '#FCD34D');
          doc.fontSize(9).fillColor('#92400E').text(finding.evidence, leftMargin + 10, evidenceY + 8, { width: pageWidth - 20 });
          doc.y = evidenceY + evidenceHeight + 8;
        }

        // Remediation
        if (finding.remediation) {
          doc.fontSize(9).fillColor(COLORS.success).text('Recommended Fix:', leftMargin);
          doc.moveDown(0.2);

          const remY = doc.y;
          const remHeight = Math.min(doc.heightOfString(finding.remediation, { width: pageWidth - 20 }) + 16, 120);
          doc.rect(leftMargin, remY, pageWidth, remHeight).fillAndStroke('#ECFDF5', '#A7F3D0');
          doc.fontSize(9).fillColor('#065F46').text(finding.remediation, leftMargin + 10, remY + 8, { width: pageWidth - 20 });
          doc.y = remY + remHeight + 8;
        }

        // Separator
        doc.moveDown(0.5);
        doc.strokeColor(COLORS.border).lineWidth(1).moveTo(leftMargin, doc.y).lineTo(leftMargin + pageWidth, doc.y).stroke();
        doc.moveDown();
      });
    }

    // ============================================================
    // REMEDIATION ROADMAP
    // ============================================================
    doc.addPage();
    doc.fontSize(24).fillColor(COLORS.dark).text('Remediation Roadmap');
    doc.moveDown();

    doc.fontSize(12).fillColor(COLORS.text).text(
      'Based on the findings, we recommend the following prioritized remediation timeline:',
      { width: pageWidth }
    );
    doc.moveDown();

    const phases = [
      {
        name: 'Immediate (24-48 hours)',
        color: SEVERITY_CONFIG.CRITICAL.color,
        items: sortedFindings.filter(f => f.severity === 'CRITICAL').slice(0, 3),
        description: 'Critical vulnerabilities that pose immediate risk to your API security.',
      },
      {
        name: 'Short-term (1-2 weeks)',
        color: SEVERITY_CONFIG.HIGH.color,
        items: sortedFindings.filter(f => f.severity === 'HIGH').slice(0, 3),
        description: 'High-severity issues that should be addressed in your next sprint.',
      },
      {
        name: 'Medium-term (1 month)',
        color: SEVERITY_CONFIG.MEDIUM.color,
        items: sortedFindings.filter(f => f.severity === 'MEDIUM').slice(0, 3),
        description: 'Medium-severity findings for planned remediation cycles.',
      },
      {
        name: 'Ongoing',
        color: COLORS.textLight,
        items: sortedFindings.filter(f => ['LOW', 'INFO'].includes(f.severity)).slice(0, 3),
        description: 'Low-priority items and continuous improvement recommendations.',
      },
    ];

    phases.forEach((phase) => {
      if (doc.y > 680) doc.addPage();

      const phaseY = doc.y;
      doc.rect(leftMargin, phaseY, 8, 70).fill(phase.color);

      doc.fontSize(13).fillColor(COLORS.dark).text(phase.name, leftMargin + 20, phaseY);
      doc.fontSize(10).fillColor(COLORS.textLight).text(phase.description, leftMargin + 20, phaseY + 18, { width: pageWidth - 30 });

      if (phase.items.length > 0) {
        doc.fontSize(9).fillColor(COLORS.text);
        phase.items.forEach((item) => {
          doc.text(`• ${item.type}: ${item.endpoint}`, leftMargin + 30, doc.y + 5);
        });
      } else {
        doc.fontSize(9).fillColor(COLORS.success).text('✓ No items in this category', leftMargin + 30, phaseY + 40);
      }

      doc.y = Math.max(doc.y + 10, phaseY + 80);
    });

    // ============================================================
    // METHODOLOGY APPENDIX
    // ============================================================
    doc.addPage();
    doc.fontSize(24).fillColor(COLORS.dark).text('Appendix: Methodology');
    doc.moveDown();

    doc.fontSize(12).fillColor(COLORS.dark).text('Scanning Methodology');
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor(COLORS.text).text(
      'VULX SecureAPI Scanner performs comprehensive static analysis of OpenAPI/Swagger specifications to identify potential security vulnerabilities. The scanner evaluates API definitions against the OWASP API Security Top 10 (2023) framework.',
      { width: pageWidth }
    );
    doc.moveDown();

    doc.fontSize(12).fillColor(COLORS.dark).text('Risk Scoring');
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor(COLORS.text).text(
      'The risk score is calculated based on the weighted severity of findings:\n' +
      '• Critical: 40 points deducted per finding\n' +
      '• High: 25 points deducted per finding\n' +
      '• Medium: 10 points deducted per finding\n' +
      '• Low: 3 points deducted per finding\n' +
      '• Info: 1 point deducted per finding\n\n' +
      'Starting from a perfect score of 100, the final score represents your overall security posture.',
      { width: pageWidth }
    );
    doc.moveDown();

    doc.fontSize(12).fillColor(COLORS.dark).text('Limitations');
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor(COLORS.text).text(
      'This scan is based on static analysis of API specifications and may not detect all runtime vulnerabilities. We recommend complementing these results with dynamic testing, penetration testing, and regular security audits.',
      { width: pageWidth }
    );
    doc.moveDown(2);

    doc.fontSize(12).fillColor(COLORS.dark).text('About VULX');
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor(COLORS.text).text(
      'VULX SecureAPI Scanner is an enterprise API security assessment platform designed to help development teams identify and remediate security vulnerabilities early in the development lifecycle. For more information, visit our documentation.',
      { width: pageWidth }
    );

    // ============================================================
    // FOOTER ON ALL PAGES
    // ============================================================
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);

      // Skip footer on cover page
      if (i === 0) continue;

      // Footer line
      doc.strokeColor(COLORS.border).lineWidth(1);
      doc.moveTo(leftMargin, 780).lineTo(leftMargin + pageWidth, 780).stroke();

      // Footer content
      doc.fontSize(8).fillColor(COLORS.textLight);
      doc.text('VULX SecureAPI Scanner', leftMargin, 788);
      doc.text(`${scan.project.name}`, leftMargin + 150, 788, { width: 200, align: 'center' });
      doc.text(`Page ${i + 1} of ${pages.count}`, leftMargin + pageWidth - 80, 788, { width: 80, align: 'right' });

      // Header on pages (except cover)
      if (i > 0) {
        doc.rect(0, 0, 595, 4).fill(COLORS.primary);
      }
    }

    doc.end();
  });
};

export default generateScanReport;
