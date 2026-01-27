import { Command } from 'commander';
import axios from 'axios';
import chalk from 'chalk';
import ora from 'ora';

interface Finding {
  id: string;
  type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  description: string;
  endpoint: string;
  method: string;
  remediation?: string;
  owaspCategory?: string;
  cweId?: string;
  evidence?: string;
}

const SEVERITY_LEVELS: Record<string, number> = {
  'CRITICAL': 4,
  'HIGH': 3,
  'MEDIUM': 2,
  'LOW': 1,
  'INFO': 0
};

const getSeverityStyle = (severity: string) => {
  switch (severity) {
    case 'CRITICAL':
      return chalk.bgRed.white.bold;
    case 'HIGH':
      return chalk.red.bold;
    case 'MEDIUM':
      return chalk.yellow.bold;
    case 'LOW':
      return chalk.blue;
    case 'INFO':
      return chalk.gray;
    default:
      return chalk.white;
  }
};

export const scanCommand = new Command('scan')
  .description('Trigger a security scan for a project and wait for results')
  .requiredOption('-p, --project-id <id>', 'Project ID to scan')
  .option('-u, --url <url>', 'VULX API URL', 'http://localhost:3001')
  .option('--fail-on <severity>', 'Fail build on severity threshold (CRITICAL, HIGH, MEDIUM, LOW)', 'HIGH')
  .option('--show-remediation', 'Show remediation guidance for each finding')
  .option('--json', 'Output results as JSON')
  .action(async (options) => {
    const { projectId, url, failOn, showRemediation, json } = options;
    const spinner = json ? null : ora('Initializing scan...').start();

    try {
      // 1. Trigger Scan
      const triggerRes = await axios.post(`${url}/projects/${projectId}/scans`);
      const scanId = triggerRes.data.id;

      if (spinner) {
        spinner.text = `Scan started (${scanId.substring(0, 8)}...). Analyzing API specification...`;
      }

      // 2. Poll for completion
      const POLL_INTERVAL = 2000; // 2 seconds
      const MAX_RETRIES = 60; // 2 minutes total
      let attempts = 0;
      let scan: any = null;

      while (attempts < MAX_RETRIES) {
        const pollRes = await axios.get(`${url}/projects/${projectId}`);
        scan = pollRes.data.scans.find((s: any) => s.id === scanId);

        if (scan && (scan.status === 'COMPLETED' || scan.status === 'FAILED')) {
          break;
        }

        if (spinner && scan?.status === 'PROCESSING') {
          spinner.text = `Processing OWASP API Top 10 security checks...`;
        }

        attempts++;
        await new Promise(r => setTimeout(r, POLL_INTERVAL));
      }

      if (!scan || (scan.status !== 'COMPLETED' && scan.status !== 'FAILED')) {
        if (spinner) spinner.fail('Scan timed out.');
        process.exit(1);
      }

      if (scan.status === 'FAILED') {
        if (spinner) spinner.fail('Scan failed. Check if the OpenAPI spec is valid.');
        process.exit(1);
      }

      if (spinner) spinner.succeed('Scan completed successfully.');

      // 3. Process and Report Findings
      const findings: Finding[] = scan.findings || [];

      // Sort findings by severity
      const sortedFindings = [...findings].sort((a, b) => {
        return (SEVERITY_LEVELS[b.severity] || 0) - (SEVERITY_LEVELS[a.severity] || 0);
      });

      // JSON output mode
      if (json) {
        const output = {
          scanId: scan.id,
          status: scan.status,
          totalFindings: findings.length,
          summary: {
            critical: findings.filter(f => f.severity === 'CRITICAL').length,
            high: findings.filter(f => f.severity === 'HIGH').length,
            medium: findings.filter(f => f.severity === 'MEDIUM').length,
            low: findings.filter(f => f.severity === 'LOW').length,
            info: findings.filter(f => f.severity === 'INFO').length,
          },
          findings: sortedFindings
        };
        console.log(JSON.stringify(output, null, 2));
      } else {
        // Human-readable output
        console.log('');
        console.log(chalk.bold('━'.repeat(60)));
        console.log(chalk.bold('  VULX Security Scan Results'));
        console.log(chalk.bold('━'.repeat(60)));
        console.log('');

        // Summary
        const critical = findings.filter(f => f.severity === 'CRITICAL').length;
        const high = findings.filter(f => f.severity === 'HIGH').length;
        const medium = findings.filter(f => f.severity === 'MEDIUM').length;
        const low = findings.filter(f => f.severity === 'LOW').length;
        const info = findings.filter(f => f.severity === 'INFO').length;

        console.log(chalk.bold(`  Total Findings: ${findings.length}`));
        console.log('');

        if (critical > 0) console.log(`  ${chalk.bgRed.white.bold(' CRITICAL ')} ${critical}`);
        if (high > 0) console.log(`  ${chalk.red.bold(' HIGH     ')} ${high}`);
        if (medium > 0) console.log(`  ${chalk.yellow.bold(' MEDIUM   ')} ${medium}`);
        if (low > 0) console.log(`  ${chalk.blue(' LOW      ')} ${low}`);
        if (info > 0) console.log(`  ${chalk.gray(' INFO     ')} ${info}`);

        console.log('');
        console.log(chalk.bold('━'.repeat(60)));
        console.log('');

        // Detailed Findings
        if (sortedFindings.length > 0) {
          sortedFindings.forEach((f, index) => {
            const severityStyle = getSeverityStyle(f.severity);

            console.log(`${chalk.gray(`[${index + 1}]`)} ${severityStyle(` ${f.severity} `)} ${chalk.bold(f.type)}`);
            console.log(`    ${chalk.cyan(`${f.method} ${f.endpoint}`)}`);
            console.log(`    ${chalk.gray(f.description)}`);

            if (f.owaspCategory) {
              console.log(`    ${chalk.magenta(`OWASP: ${f.owaspCategory}`)}`);
            }

            if (f.cweId) {
              console.log(`    ${chalk.magenta(`CWE: ${f.cweId}`)}`);
            }

            if (f.evidence) {
              console.log(`    ${chalk.yellow(`Evidence: ${f.evidence}`)}`);
            }

            if (showRemediation && f.remediation) {
              console.log('');
              console.log(chalk.green('    How to Fix:'));
              const remLines = f.remediation.split('\n');
              remLines.forEach(line => {
                console.log(chalk.green(`    ${line}`));
              });
            }

            console.log('');
          });
        } else {
          console.log(chalk.green('  ✓ No vulnerabilities found. Your API looks secure!'));
          console.log('');
        }
      }

      // 4. Determine exit code based on threshold
      const threshold = SEVERITY_LEVELS[failOn] ?? 3;
      const failBuild = findings.some(f => (SEVERITY_LEVELS[f.severity] || 0) >= threshold);

      if (failBuild) {
        if (!json) {
          console.log(chalk.red.bold(`✗ Build failed: Found vulnerabilities with severity >= ${failOn}`));
          console.log(chalk.gray(`  Run with --fail-on CRITICAL to only fail on critical issues`));
        }
        process.exit(1);
      } else {
        if (!json) {
          console.log(chalk.green.bold('✓ Security check passed.'));
        }
        process.exit(0);
      }

    } catch (error: any) {
      if (spinner) spinner.fail(`Error: ${error.message}`);
      if (error.response) {
        console.error(json ? JSON.stringify(error.response.data) : error.response.data);
      }
      process.exit(1);
    }
  });
