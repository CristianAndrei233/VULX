# GitHub Actions Integration

Set up VULX scanning in your GitHub Actions workflows.

## Quick Setup

Add this workflow to `.github/workflows/vulx-scan.yml`:

```yaml
name: VULX Security Scan

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install VULX CLI
        run: npm install -g @vulx/cli

      - name: Run Security Scan
        env:
          VULX_API_URL: ${{ secrets.VULX_API_URL }}
          VULX_API_KEY: ${{ secrets.VULX_API_KEY }}
        run: vulx scan --project-id ${{ vars.VULX_PROJECT_ID }} --fail-on HIGH
```

## Configuration

### Repository Secrets

Add these secrets in **Settings > Secrets and variables > Actions**:

| Secret | Description | Example |
|--------|-------------|---------|
| `VULX_API_URL` | VULX API endpoint | `https://api.vulx.io` |
| `VULX_API_KEY` | API authentication key | `vx_live_abc123...` |

### Repository Variables

Add these variables for non-sensitive configuration:

| Variable | Description | Example |
|----------|-------------|---------|
| `VULX_PROJECT_ID` | Project to scan | `abc123-def456` |
| `VULX_FAIL_ON` | Failure threshold | `HIGH` |

## Workflow Examples

### Basic PR Check

```yaml
name: PR Security Check

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  vulx-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install VULX CLI
        run: npm install -g @vulx/cli

      - name: Run Scan
        env:
          VULX_API_URL: ${{ secrets.VULX_API_URL }}
        run: |
          vulx scan \
            --project-id ${{ vars.VULX_PROJECT_ID }} \
            --fail-on HIGH

      - name: Comment PR on Failure
        if: failure()
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '🚨 VULX security scan detected vulnerabilities. Please review the scan results.'
            })
```

### Production Deployment Gate

```yaml
name: Production Deploy

on:
  push:
    branches: [main]

jobs:
  security-scan:
    runs-on: ubuntu-latest
    outputs:
      scan-passed: ${{ steps.scan.outcome == 'success' }}
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install VULX CLI
        run: npm install -g @vulx/cli

      - name: Run Security Scan
        id: scan
        env:
          VULX_API_URL: ${{ secrets.VULX_API_URL }}
        run: vulx scan --project-id ${{ vars.VULX_PROJECT_ID }} --fail-on CRITICAL

  deploy:
    needs: security-scan
    if: needs.security-scan.outputs.scan-passed == 'true'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Production
        run: echo "Deploying..."
```

### Scheduled Nightly Scan

```yaml
name: Nightly Security Scan

on:
  schedule:
    - cron: '0 2 * * *'  # 2 AM UTC daily

jobs:
  comprehensive-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install VULX CLI
        run: npm install -g @vulx/cli

      - name: Run Comprehensive Scan
        env:
          VULX_API_URL: ${{ secrets.VULX_API_URL }}
        run: |
          vulx scan \
            --project-id ${{ vars.VULX_PROJECT_ID }} \
            --fail-on MEDIUM \
            --json > scan-results.json

      - name: Upload Results
        uses: actions/upload-artifact@v4
        with:
          name: vulx-scan-results
          path: scan-results.json

      - name: Notify on Findings
        if: failure()
        run: |
          curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
            -H 'Content-Type: application/json' \
            -d '{"text": "Nightly VULX scan found vulnerabilities"}'
```

### Multi-Project Scanning

```yaml
name: Multi-Project Scan

on:
  push:
    branches: [main]

jobs:
  scan:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        project:
          - name: API Gateway
            id: proj-gateway
          - name: Auth Service
            id: proj-auth
          - name: User Service
            id: proj-users
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install VULX CLI
        run: npm install -g @vulx/cli

      - name: Scan ${{ matrix.project.name }}
        env:
          VULX_API_URL: ${{ secrets.VULX_API_URL }}
        run: vulx scan --project-id ${{ matrix.project.id }} --fail-on HIGH
```

## Status Badges

Add a scan status badge to your README:

```markdown
![VULX Scan](https://github.com/your-org/your-repo/actions/workflows/vulx-scan.yml/badge.svg)
```

## Troubleshooting

### Common Issues

**Scan timeout:**
```yaml
- name: Run Scan
  run: vulx scan --project-id $PROJECT_ID --timeout 300000
```

**Permission denied:**
```yaml
- name: Install VULX CLI
  run: sudo npm install -g @vulx/cli
```

**API connection failed:**
- Verify `VULX_API_URL` is correct
- Check that the API is accessible from GitHub runners
- Ensure API key has required permissions

## Next Steps

- Configure [Slack notifications](/cicd/notifications)
- Set up [branch protection rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches)
- Review [security best practices](/guide/security-best-practices)
