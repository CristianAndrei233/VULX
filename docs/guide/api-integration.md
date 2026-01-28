# API Integration Guide

This guide covers how to integrate VULX into your applications, CI/CD pipelines, and development workflow using the REST API.

## Authentication

All API requests require authentication using your project API key.

### Getting Your API Key

1. Navigate to your project in the web dashboard
2. Go to **Settings** → **API Keys**
3. Generate a key for your environment:
   - **Sandbox**: `v_test_*` prefix
   - **Production**: `v_live_*` prefix

### Using Your API Key

Include the key in the `Authorization` header:

```bash
curl https://api.vulx.io/projects \
  -H "Authorization: Bearer v_live_your_api_key_here"
```

## Core API Endpoints

### Projects

#### List Projects
```bash
GET /api/projects
```

Response:
```json
[
  {
    "id": "proj_xxx",
    "name": "My API",
    "targetUrl": "https://api.example.com",
    "createdAt": "2024-01-15T10:30:00Z",
    "scans": [...]
  }
]
```

#### Get Project Details
```bash
GET /api/projects/{projectId}
```

#### Create Project
```bash
POST /api/projects
Content-Type: application/json

{
  "name": "My API Project",
  "targetUrl": "https://api.example.com",
  "specUrl": "https://api.example.com/openapi.json"
}
```

#### Update Project
```bash
PUT /api/projects/{projectId}
Content-Type: application/json

{
  "name": "Updated Name",
  "scanFrequency": "DAILY"
}
```

#### Delete Project
```bash
DELETE /api/projects/{projectId}
```

### Scanning

#### Trigger a Scan
```bash
POST /api/projects/{projectId}/scans
Content-Type: application/json

{
  "scanType": "standard",
  "targetUrl": "https://api.example.com"
}
```

**Scan Types:**
| Type | Description |
|------|-------------|
| `quick` | Fast basic checks (2-5 min) |
| `standard` | OWASP Top 10 coverage (10-30 min) |
| `full` | Comprehensive all-engine scan (30-60 min) |

Response:
```json
{
  "id": "scan_xxx",
  "status": "PENDING",
  "scanType": "standard",
  "environment": "PRODUCTION",
  "startedAt": "2024-01-15T10:30:00Z"
}
```

#### Get Scan Status
```bash
GET /api/projects/{projectId}
```

Check the `scans` array in the response for scan status.

#### Download Scan Report
```bash
GET /api/projects/{projectId}/scans/{scanId}/report
```

Returns a PDF report.

### API Keys

#### List API Keys
```bash
GET /api/projects/{projectId}/keys
```

#### Generate API Key
```bash
POST /api/projects/{projectId}/keys
Content-Type: application/json

{
  "environment": "PRODUCTION"
}
```

**Note:** Generating a new key revokes the previous key for that environment.

#### Revoke API Key
```bash
DELETE /api/projects/{projectId}/keys/{keyId}
```

### Findings & Remediation

#### Get Remediation Dashboard
```bash
GET /api/remediation/dashboard
```

Response:
```json
{
  "total": 45,
  "open": 12,
  "inProgress": 8,
  "fixed": 20,
  "falsePositive": 3,
  "accepted": 2,
  "bySeverity": {
    "CRITICAL": 2,
    "HIGH": 10,
    "MEDIUM": 18,
    "LOW": 15
  }
}
```

#### List Findings
```bash
GET /api/remediation/findings?status=OPEN&severity=CRITICAL
```

Query Parameters:
- `status`: OPEN, IN_PROGRESS, FIXED, FALSE_POSITIVE, ACCEPTED
- `severity`: CRITICAL, HIGH, MEDIUM, LOW, INFO
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

#### Update Finding Status
```bash
PUT /api/remediation/findings/{findingId}
Content-Type: application/json

{
  "status": "IN_PROGRESS",
  "assignedTo": "developer@example.com",
  "resolutionNotes": "Fixing in PR #123"
}
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Security Scan

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  vulx-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Trigger VULX Scan
        id: scan
        run: |
          RESPONSE=$(curl -s -X POST \
            "https://api.vulx.io/projects/${{ secrets.VULX_PROJECT_ID }}/scans" \
            -H "Authorization: Bearer ${{ secrets.VULX_API_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{"scanType": "standard"}')

          SCAN_ID=$(echo $RESPONSE | jq -r '.id')
          echo "scan_id=$SCAN_ID" >> $GITHUB_OUTPUT

      - name: Wait for Scan Completion
        run: |
          while true; do
            STATUS=$(curl -s \
              "https://api.vulx.io/projects/${{ secrets.VULX_PROJECT_ID }}" \
              -H "Authorization: Bearer ${{ secrets.VULX_API_KEY }}" | \
              jq -r '.scans[0].status')

            if [ "$STATUS" = "COMPLETED" ]; then
              echo "Scan completed!"
              break
            elif [ "$STATUS" = "FAILED" ]; then
              echo "Scan failed!"
              exit 1
            fi

            echo "Scan status: $STATUS - waiting..."
            sleep 30
          done

      - name: Check for Critical Findings
        run: |
          CRITICAL=$(curl -s \
            "https://api.vulx.io/projects/${{ secrets.VULX_PROJECT_ID }}" \
            -H "Authorization: Bearer ${{ secrets.VULX_API_KEY }}" | \
            jq '[.scans[0].findings[] | select(.severity == "CRITICAL")] | length')

          if [ "$CRITICAL" -gt 0 ]; then
            echo "Found $CRITICAL critical vulnerabilities!"
            exit 1
          fi
```

### GitLab CI

```yaml
vulx-scan:
  stage: security
  script:
    - |
      # Trigger scan
      SCAN_RESPONSE=$(curl -s -X POST \
        "https://api.vulx.io/projects/${VULX_PROJECT_ID}/scans" \
        -H "Authorization: Bearer ${VULX_API_KEY}" \
        -H "Content-Type: application/json" \
        -d '{"scanType": "standard"}')

      # Poll for completion
      while true; do
        STATUS=$(curl -s \
          "https://api.vulx.io/projects/${VULX_PROJECT_ID}" \
          -H "Authorization: Bearer ${VULX_API_KEY}" | \
          jq -r '.scans[0].status')

        if [ "$STATUS" = "COMPLETED" ]; then break; fi
        if [ "$STATUS" = "FAILED" ]; then exit 1; fi
        sleep 30
      done

      # Fail on critical findings
      CRITICAL=$(curl -s \
        "https://api.vulx.io/projects/${VULX_PROJECT_ID}" \
        -H "Authorization: Bearer ${VULX_API_KEY}" | \
        jq '[.scans[0].findings[] | select(.severity == "CRITICAL")] | length')

      if [ "$CRITICAL" -gt 0 ]; then
        echo "Found $CRITICAL critical vulnerabilities!"
        exit 1
      fi
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == "main"
```

### Jenkins Pipeline

```groovy
pipeline {
    agent any

    environment {
        VULX_API_KEY = credentials('vulx-api-key')
        VULX_PROJECT_ID = 'your-project-id'
    }

    stages {
        stage('Security Scan') {
            steps {
                script {
                    // Trigger scan
                    def scanResponse = sh(
                        script: """
                            curl -s -X POST \
                              "https://api.vulx.io/projects/${VULX_PROJECT_ID}/scans" \
                              -H "Authorization: Bearer ${VULX_API_KEY}" \
                              -H "Content-Type: application/json" \
                              -d '{"scanType": "standard"}'
                        """,
                        returnStdout: true
                    )

                    // Poll for completion
                    def status = 'PENDING'
                    while (status != 'COMPLETED' && status != 'FAILED') {
                        sleep 30
                        def projectData = sh(
                            script: """
                                curl -s \
                                  "https://api.vulx.io/projects/${VULX_PROJECT_ID}" \
                                  -H "Authorization: Bearer ${VULX_API_KEY}"
                            """,
                            returnStdout: true
                        )
                        status = readJSON(text: projectData).scans[0].status
                    }

                    if (status == 'FAILED') {
                        error 'Security scan failed'
                    }

                    // Check for critical findings
                    def findings = readJSON(text: projectData).scans[0].findings
                    def critical = findings.findAll { it.severity == 'CRITICAL' }

                    if (critical.size() > 0) {
                        error "Found ${critical.size()} critical vulnerabilities"
                    }
                }
            }
        }
    }
}
```

## Webhook Integration

### Receiving Scan Completion Notifications

Configure a webhook URL in your integration settings to receive POST requests when scans complete:

```json
{
  "event": "scan.completed",
  "scan": {
    "id": "scan_xxx",
    "projectId": "proj_xxx",
    "status": "COMPLETED",
    "environment": "PRODUCTION",
    "findings": {
      "total": 12,
      "critical": 0,
      "high": 3,
      "medium": 5,
      "low": 4
    }
  }
}
```

### Webhook Signature Verification

Verify webhook authenticity using the `X-VULX-Signature` header:

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return signature === `sha256=${expected}`;
}
```

## Error Handling

### Common Error Responses

```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired API key"
}
```

| Status Code | Description |
|-------------|-------------|
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Invalid API key |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 429 | Too Many Requests - Rate limited |
| 500 | Server Error - Contact support |

### Rate Limits

- 100 requests per minute per API key
- 10 concurrent scans per project

## SDK Examples

### JavaScript/Node.js

```javascript
const axios = require('axios');

const vulx = axios.create({
  baseURL: 'https://api.vulx.io',
  headers: {
    'Authorization': `Bearer ${process.env.VULX_API_KEY}`,
    'Content-Type': 'application/json'
  }
});

// Trigger a scan
async function triggerScan(projectId, scanType = 'standard') {
  const { data } = await vulx.post(`/projects/${projectId}/scans`, {
    scanType
  });
  return data;
}

// Wait for scan completion
async function waitForScan(projectId) {
  while (true) {
    const { data } = await vulx.get(`/projects/${projectId}`);
    const status = data.scans[0]?.status;

    if (status === 'COMPLETED') return data.scans[0];
    if (status === 'FAILED') throw new Error('Scan failed');

    await new Promise(r => setTimeout(r, 30000));
  }
}
```

### Python

```python
import requests
import time
import os

class VulxClient:
    def __init__(self, api_key=None):
        self.api_key = api_key or os.environ.get('VULX_API_KEY')
        self.base_url = 'https://api.vulx.io'
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        })

    def trigger_scan(self, project_id, scan_type='standard'):
        response = self.session.post(
            f'{self.base_url}/projects/{project_id}/scans',
            json={'scanType': scan_type}
        )
        response.raise_for_status()
        return response.json()

    def wait_for_scan(self, project_id, timeout=3600):
        start = time.time()
        while time.time() - start < timeout:
            response = self.session.get(f'{self.base_url}/projects/{project_id}')
            response.raise_for_status()

            scans = response.json().get('scans', [])
            if scans:
                status = scans[0]['status']
                if status == 'COMPLETED':
                    return scans[0]
                if status == 'FAILED':
                    raise Exception('Scan failed')

            time.sleep(30)

        raise TimeoutError('Scan timed out')

# Usage
client = VulxClient()
scan = client.trigger_scan('proj_xxx', 'full')
result = client.wait_for_scan('proj_xxx')
print(f"Found {len(result['findings'])} findings")
```
