import { Command } from 'commander';
import axios from 'axios';
import chalk from 'chalk';
import ora from 'ora';

export const scanCommand = new Command('scan')
  .description('Trigger a scan for a project and wait for results')
  .requiredOption('-p, --project-id <id>', 'Project ID to scan')
  .option('-u, --url <url>', 'VULX API URL', 'http://localhost:3001')
  .option('--fail-on <severity>', 'Fail build on severity (CRITICAL, HIGH, MEDIUM, LOW)', 'HIGH')
  .action(async (options) => {
    const { projectId, url, failOn } = options;
    const spinner = ora('Initializing scan...').start();

    try {
      // 1. Trigger Scan
      const triggerRes = await axios.post(`${url}/projects/${projectId}/scans`);
      const scanId = triggerRes.data.id;
      spinner.text = `Scan started: ${scanId}. Waiting for results...`;

      // 2. Poll for completion
      const POLL_INTERVAL = 2000; // 2 seconds
      const MAX_RETRIES = 60; // 2 minutes
      let attempts = 0;
      let scan: any = null;

      while (attempts < MAX_RETRIES) {
        // We fetch the project details because currently that's where we get the scan list/status details best with findings included
        // Or we can assume there might be a GET /scans/:id endpoint.
        // Let's check the API. We have GET /projects/:id which includes scans.
        // Ideally we should have GET /scans/:id. For now let's use GET /projects/:id
        
        const pollRes = await axios.get(`${url}/projects/${projectId}`);
        // Find our scan
        scan = pollRes.data.scans.find((s: any) => s.id === scanId);

        if (scan && (scan.status === 'COMPLETED' || scan.status === 'FAILED')) {
          break;
        }

        attempts++;
        await new Promise(r => setTimeout(r, POLL_INTERVAL));
      }

      if (!scan || (scan.status !== 'COMPLETED' && scan.status !== 'FAILED')) {
        spinner.fail('Scan timed out or execution failed.');
        process.exit(1);
      }

      if (scan.status === 'FAILED') {
         spinner.fail('Scan engine reported failure (e.g., invalid spec).');
         process.exit(1);
      }
      
      spinner.succeed('Scan completed successfully.');

      // 3. Report Findings
      const findings = scan.findings || [];
      console.log(chalk.bold(`\nFound ${findings.length} vulnerabilities:`));

      const severityLevels = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1, 'INFO': 0 };
      const threshold = severityLevels[failOn as keyof typeof severityLevels] || 3;
      
      let failBuild = false;

      findings.forEach((f: any) => {
        const severityColor = 
          f.severity === 'CRITICAL' ? chalk.bgRed.white :
          f.severity === 'HIGH' ? chalk.red :
          f.severity === 'MEDIUM' ? chalk.yellow : chalk.blue;

        console.log(`[${severityColor(f.severity)}] ${f.type} - ${f.method} ${f.endpoint}`);
        console.log(`  ${chalk.gray(f.description)}`);
        
        if (severityLevels[f.severity as keyof typeof severityLevels] >= threshold) {
          failBuild = true;
        }
      });

      console.log('\n');

      if (failBuild) {
        console.error(chalk.red(`Build failed: Found vulnerabilities with severity >= ${failOn}`));
        process.exit(1);
      } else {
        console.log(chalk.green('Security check passed.'));
        process.exit(0);
      }

    } catch (error: any) {
      spinner.fail(`Error: ${error.message}`);
      if (error.response) {
          console.error(error.response.data);
      }
      process.exit(1);
    }
  });
