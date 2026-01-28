# Web Interface Guide

This guide covers how to use the VULX web dashboard to manage your API security scanning operations.

## Dashboard Overview

The **Security Dashboard** provides a high-level overview of your organization's API security posture.

### Key Components

1. **Stats Cards** - Quick metrics showing:
   - Total Projects
   - Total Scans
   - Open Findings
   - Critical Issues

2. **Environment Indicator** - Shows which environment (Production/Sandbox) you're currently viewing

3. **Projects Requiring Attention** - Lists projects with critical or high severity findings

4. **Recent Scans** - Shows the latest scan activity across all projects

5. **Risk Score Gauge** - Visual representation of overall security risk

6. **Severity Chart** - Breakdown of findings by severity level

### Environment Switching

VULX supports **two separate environments** for enterprise workflows:

- **PRODUCTION** - For live/production API endpoints
- **SANDBOX** - For testing, staging, or development environments

Click the environment toggle in the header to switch between environments. All data is separated by environment:
- Scans are filtered by environment
- Findings are tracked separately
- API keys are environment-specific

## Projects Page

The **Projects** page is your central hub for managing all security scanning projects.

### Project List Features

- **Search** - Filter projects by name or URL
- **Status Filters** - Filter by:
  - All Projects
  - With Issues (have critical/high findings)
  - Clean (no issues found)
  - Never Scanned
- **View Modes** - Toggle between grid and list views

### Creating a New Project

1. Click **"New Project"** button
2. Enter project details:
   - **Name** - A descriptive name for your project
   - **Target URL** - The base URL of your API
   - **OpenAPI Spec** - Upload or provide URL to your OpenAPI/Swagger specification
3. Click **Create Project**

## Project Details

When you open a project, you'll see:

### Project Info Card
- Creation date
- Last scan status and date
- Link to download PDF reports

### Starting a Scan

1. Click the **"Start Scan"** button
2. Select your scan type:

| Scan Type | Duration | Coverage | Best For |
|-----------|----------|----------|----------|
| **Quick** | 2-5 min | Basic checks | Pre-commit validation |
| **Standard** | 10-30 min | OWASP Top 10 | CI/CD pipelines |
| **Full** | 30-60 min | All engines | Release gates, compliance |

3. Click **"Start [Scan Type]"** to begin

### Vulnerability Findings

Findings are displayed with:
- **Severity Badge** - CRITICAL, HIGH, MEDIUM, LOW, INFO
- **Type** - The vulnerability category
- **Endpoint** - Affected API endpoint
- **Evidence** - Technical details of the issue
- **Remediation** - How to fix the vulnerability

Click any finding to expand details including:
- OWASP category mapping
- CWE reference links
- Copy-able remediation code

### Filtering Findings

Use the severity filter panel to focus on specific severity levels.

## Scan History

Each project maintains a complete scan history. You can:
- View all past scans
- Compare findings between scans
- Track regression (issues that were fixed but reappeared)
- Download PDF reports for any completed scan

## Project Settings

Configure your project settings:

### General Settings
- Rename project
- Update target URL
- Upload new OpenAPI specification

### Scan Schedule
- **Manual** - Scan only when triggered
- **Daily** - Automatic daily scans
- **Weekly** - Automatic weekly scans

### API Keys

Generate environment-specific API keys for CI/CD integration:

```bash
# Production key format
v_live_xxxxxxxxxxxxxxxxxx

# Sandbox key format
v_test_xxxxxxxxxxxxxxxxxx
```

**Security Notes:**
- Each environment can have only ONE active key
- Generating a new key revokes the previous one
- Keys are shown only once at creation time

## Remediation Tracking

The **Remediation** page helps track fix progress:

### Finding Statuses
- **OPEN** - Newly discovered, needs attention
- **IN_PROGRESS** - Being worked on
- **FIXED** - Issue has been resolved
- **FALSE_POSITIVE** - Not a real issue
- **ACCEPTED** - Known issue, accepted risk

### Tracking Progress
- Assign findings to team members
- Add resolution notes
- Link to external tickets (Jira, Linear)
- View fix velocity metrics

## Integrations

Connect VULX to your existing tools:

### Notifications
- **Slack** - Channel notifications for scan results
- **Discord** - Server notifications
- **Microsoft Teams** - Team channel alerts
- **Email** - Direct email notifications

### Issue Tracking
- **Jira** - Automatic ticket creation
- **Linear** - Issue synchronization

### Configuration
1. Navigate to **Integrations**
2. Select your integration
3. Provide required credentials/webhooks
4. Configure notification preferences

## Trends & Analytics

The **Trends** page provides historical insights:

- Risk score over time
- Mean Time to Remediate (MTTR)
- Finding trends by severity
- Fix velocity tracking

## Best Practices

1. **Use Sandbox for Testing** - Test your CI/CD integration in sandbox before production

2. **Schedule Regular Scans** - Set up automated scans for continuous security monitoring

3. **Address Critical Issues First** - Focus on CRITICAL and HIGH severity findings

4. **Track Remediation** - Use status updates to maintain visibility on fix progress

5. **Integrate with CI/CD** - Block deployments when critical issues are found

6. **Review False Positives** - Mark false positives to reduce noise in future scans
