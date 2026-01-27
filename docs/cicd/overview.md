# CI/CD Integration Overview

Integrate VULX into your continuous integration and deployment pipelines to catch API security vulnerabilities early in the development process.

## Why CI/CD Integration?

Integrating VULX into your CI/CD pipeline provides:

- **Shift-left security** - Catch vulnerabilities before they reach production
- **Automated scanning** - No manual intervention required
- **Gated deployments** - Block releases with critical vulnerabilities
- **Audit trail** - Historical record of security scans
- **Team awareness** - Immediate feedback to developers

## Integration Approaches

### 1. CLI-Based Integration (Recommended)

Use the VULX CLI in your pipeline scripts:

```bash
npm install -g @vulx/cli
vulx scan --project-id $PROJECT_ID --fail-on HIGH
```

**Pros:**
- Simple setup
- Works with any CI system
- Full control over scan parameters

### 2. Direct API Integration

Call the VULX API directly for advanced use cases:

```bash
# Trigger scan
SCAN_ID=$(curl -X POST "https://api.vulx.io/projects/$PROJECT_ID/scans" | jq -r '.id')

# Poll for completion
while true; do
  STATUS=$(curl "https://api.vulx.io/projects/$PROJECT_ID/scans/$SCAN_ID" | jq -r '.status')
  if [ "$STATUS" = "COMPLETED" ]; then break; fi
  sleep 5
done

# Check findings
CRITICAL=$(curl "https://api.vulx.io/projects/$PROJECT_ID/scans/$SCAN_ID" | jq '.findings | map(select(.severity == "CRITICAL")) | length')
if [ "$CRITICAL" -gt 0 ]; then exit 1; fi
```

### 3. GitHub Action (Coming Soon)

```yaml
- uses: vulx/scan-action@v1
  with:
    project-id: ${{ vars.VULX_PROJECT_ID }}
    api-key: ${{ secrets.VULX_API_KEY }}
    fail-on: HIGH
```

## Pipeline Stages

### Recommended Pipeline Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    Build     │────▶│     Test     │────▶│  VULX Scan   │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
                     ┌──────────────┐     ┌───────▼───────┐
                     │    Deploy    │◀────│   Gate Check  │
                     └──────────────┘     └───────────────┘
```

### Stage Details

1. **Build** - Compile code, generate OpenAPI spec
2. **Test** - Run unit and integration tests
3. **VULX Scan** - Security analysis of API specification
4. **Gate Check** - Pass/fail based on findings
5. **Deploy** - Only proceeds if gate passes

## Failure Thresholds

Configure when scans should fail your pipeline:

| Threshold | Fails On | Use Case |
|-----------|----------|----------|
| `CRITICAL` | Only critical findings | Production deployments |
| `HIGH` | Critical + High | Staging deployments |
| `MEDIUM` | Critical + High + Medium | Development branches |
| `LOW` | All except Info | Security-focused teams |

### Recommended Configuration

```yaml
# Production: Strict
production:
  fail-on: CRITICAL

# Staging: Moderate
staging:
  fail-on: HIGH

# Development: Permissive
development:
  fail-on: CRITICAL
  continue-on-error: true  # Don't block, but report
```

## Scan Timing

### When to Scan

| Event | Recommended |
|-------|-------------|
| Pull Request | Yes - scan changed APIs |
| Merge to main | Yes - scan all APIs |
| Nightly | Yes - comprehensive scan |
| Pre-deployment | Yes - final gate check |

### Optimizing Scan Time

1. **Parallel scans** - Run multiple project scans in parallel
2. **Incremental scanning** - Only scan changed specifications
3. **Caching** - Cache dependencies for faster CLI startup

## Handling Results

### Success Actions

- Proceed to deployment
- Update security dashboard
- Generate compliance report

### Failure Actions

- Block deployment
- Notify security team
- Create issue/ticket
- Post to Slack/Teams

### Example: Slack Notification

```bash
if ! vulx scan -p $PROJECT_ID --fail-on HIGH; then
  curl -X POST $SLACK_WEBHOOK -d '{
    "text": "VULX scan failed for '"$PROJECT_NAME"'",
    "attachments": [{
      "color": "danger",
      "text": "High severity vulnerabilities detected"
    }]
  }'
  exit 1
fi
```

## Supported CI/CD Platforms

- [GitHub Actions](/cicd/github-actions)
- [GitLab CI](/cicd/gitlab-ci)
- [Jenkins](/cicd/jenkins)
- CircleCI
- Azure DevOps
- Bitbucket Pipelines
- Any platform supporting Node.js or Docker

## Getting Started

Choose your CI/CD platform:

1. [GitHub Actions](/cicd/github-actions) - Recommended for GitHub repositories
2. [GitLab CI](/cicd/gitlab-ci) - For GitLab repositories
3. [Jenkins](/cicd/jenkins) - For self-hosted CI/CD
