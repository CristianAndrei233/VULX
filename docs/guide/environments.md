# Multi-Environment Setup

VULX provides complete environment separation to support enterprise development workflows. This guide explains how to effectively use Sandbox and Production environments.

## Understanding Environments

### Production Environment
- For scanning **live/production** APIs
- Data represents your actual security posture
- Findings here indicate real vulnerabilities
- Use `v_live_*` API keys

### Sandbox Environment
- For scanning **development, staging, or test** APIs
- Safe space to test integrations
- Experiment without affecting production data
- Use `v_test_*` API keys

## How Environment Separation Works

### Data Isolation

Each environment maintains completely separate:
- **Scans** - Scan history is environment-specific
- **Findings** - Vulnerabilities tracked separately
- **API Keys** - Different keys for each environment
- **Statistics** - Dashboard metrics filtered by environment

### Example Workflow

```
Development → Sandbox Environment
    ↓
Staging → Sandbox Environment
    ↓
Production → Production Environment
```

## Setting Up Environments

### 1. Generate Environment-Specific API Keys

In your project settings, generate separate keys:

```bash
# For CI/CD in staging
VULX_API_KEY=v_test_abc123...

# For CI/CD in production
VULX_API_KEY=v_live_xyz789...
```

### 2. Configure CI/CD Pipeline

**GitHub Actions Example:**

```yaml
# .github/workflows/security-scan.yml
name: API Security Scan

on:
  push:
    branches: [main, develop, staging]

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Determine Environment
        id: env
        run: |
          if [[ "${{ github.ref }}" == "refs/heads/main" ]]; then
            echo "VULX_KEY=${{ secrets.VULX_PRODUCTION_KEY }}" >> $GITHUB_OUTPUT
            echo "ENV=PRODUCTION" >> $GITHUB_OUTPUT
          else
            echo "VULX_KEY=${{ secrets.VULX_SANDBOX_KEY }}" >> $GITHUB_OUTPUT
            echo "ENV=SANDBOX" >> $GITHUB_OUTPUT
          fi

      - name: Run VULX Scan
        run: |
          curl -X POST https://api.vulx.io/projects/$PROJECT_ID/scans \
            -H "Authorization: Bearer ${{ steps.env.outputs.VULX_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{"scanType": "standard"}'
```

### 3. Environment-Aware Scanning

The environment is automatically determined by your API key:

| Key Prefix | Environment | Use Case |
|------------|-------------|----------|
| `v_test_*` | SANDBOX | Development, staging, testing |
| `v_live_*` | PRODUCTION | Production deployments |

## Web Dashboard Usage

### Switching Environments

1. Look for the environment toggle in the header
2. Click to switch between **PRODUCTION** and **SANDBOX**
3. All displayed data will update to reflect the selected environment

### Visual Indicators

- **Production**: Indigo/blue theme indicators
- **Sandbox**: Green/emerald theme indicators

### Environment Banner

The dashboard displays a banner showing:
- Current environment
- Total projects in that environment
- Total scans in that environment

## Best Practices

### 1. Always Test in Sandbox First

Before deploying CI/CD changes:
```bash
# Test your integration
export VULX_API_KEY=v_test_...
vulx scan --target https://staging.api.example.com
```

### 2. Use Different Targets per Environment

```yaml
# config/vulx.yml
environments:
  sandbox:
    target: https://staging.api.example.com
    spec: ./openapi-staging.yaml
  production:
    target: https://api.example.com
    spec: ./openapi.yaml
```

### 3. Environment-Specific Thresholds

Set different scan thresholds for each environment:

```yaml
# Production: Strict
production:
  fail_on: HIGH

# Sandbox: More lenient for testing
sandbox:
  fail_on: CRITICAL
```

### 4. Separate Notification Channels

Configure different notification channels:

- **Sandbox** → `#security-dev` Slack channel
- **Production** → `#security-alerts` + PagerDuty

### 5. Review Cross-Environment Findings

Regularly compare sandbox vs production:
- Are staging issues being addressed before production?
- Do findings differ between environments?
- Is there drift between environments?

## API Reference

### Triggering Environment-Specific Scans

```bash
# Scan in sandbox (using sandbox key)
curl -X POST https://api.vulx.io/projects/{projectId}/scans \
  -H "Authorization: Bearer v_test_xxx" \
  -H "Content-Type: application/json" \
  -d '{"scanType": "standard"}'

# Scan in production (using production key)
curl -X POST https://api.vulx.io/projects/{projectId}/scans \
  -H "Authorization: Bearer v_live_xxx" \
  -H "Content-Type: application/json" \
  -d '{"scanType": "full"}'
```

### Fetching Environment-Specific Data

```bash
# Get sandbox scans
curl https://api.vulx.io/projects/{projectId} \
  -H "Authorization: Bearer v_test_xxx"

# Get production scans
curl https://api.vulx.io/projects/{projectId} \
  -H "Authorization: Bearer v_live_xxx"
```

### Override via Header

For dashboard access, you can override the environment:

```bash
curl https://api.vulx.io/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-VULX-ENVIRONMENT: SANDBOX"
```

## Troubleshooting

### "No scans found" after switching environments
This is expected if you haven't run scans in that environment yet.

### Findings not showing up
Ensure you're viewing the correct environment in the dashboard.

### Wrong API key error
Check that your key prefix matches your intended environment:
- `v_test_*` → Sandbox
- `v_live_*` → Production
