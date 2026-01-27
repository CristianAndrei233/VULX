# CLI Getting Started

The VULX CLI enables you to run security scans from the command line, making it perfect for CI/CD integration and local development workflows.

## Installation

### Using npm

```bash
npm install -g @vulx/cli
```

### Using npx (no installation required)

```bash
npx @vulx/cli scan --project-id <id>
```

### From Source

```bash
git clone https://github.com/your-org/vulx.git
cd vulx/packages/cli
npm install
npm link
```

## Verify Installation

```bash
vulx --version
```

## Basic Usage

### Running a Scan

```bash
vulx scan --project-id abc123
```

This will:
1. Connect to the VULX API
2. Trigger a scan for the specified project
3. Poll for completion
4. Display the results

### Specifying API URL

By default, the CLI connects to `http://localhost:3001`. For production:

```bash
vulx scan --project-id abc123 --url https://api.vulx.io
```

### Setting Failure Thresholds

Control when the CLI exits with an error code (useful for CI/CD):

```bash
# Fail on HIGH or CRITICAL findings (default)
vulx scan --project-id abc123 --fail-on HIGH

# Fail only on CRITICAL findings
vulx scan --project-id abc123 --fail-on CRITICAL

# Fail on any finding (MEDIUM or above)
vulx scan --project-id abc123 --fail-on MEDIUM
```

## Output Example

```
VULX Security Scan
==================

Project: My API
Scan ID: scan_xyz789
Status: COMPLETED

Findings Summary
----------------
CRITICAL: 0
HIGH: 2
MEDIUM: 3
LOW: 1

Detailed Findings
-----------------

[HIGH] Broken Authentication
  Endpoint: GET /api/admin/users
  Description: Endpoint lacks authentication requirements

[HIGH] BOLA Detected
  Endpoint: GET /api/users/{id}
  Description: Object-level authorization not enforced

[MEDIUM] Missing Rate Limiting
  Endpoint: POST /api/auth/login
  Description: No rate limiting on authentication endpoint

...

Scan completed with 2 HIGH severity findings.
Exiting with code 1.
```

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Scan completed, no findings above threshold |
| 1 | Scan completed, findings above threshold detected |
| 2 | Scan failed or timed out |
| 3 | Connection or configuration error |

## Environment Variables

Configure the CLI using environment variables:

```bash
export VULX_API_URL=https://api.vulx.io
export VULX_PROJECT_ID=abc123
export VULX_FAIL_ON=HIGH

vulx scan
```

## Next Steps

- See all available [Commands](/cli/commands)
- Configure the CLI with [Configuration Files](/cli/configuration)
- Set up [CI/CD Integration](/cicd/overview)
