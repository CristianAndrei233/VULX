# Core Concepts

Understanding VULX's fundamental concepts will help you get the most out of the platform.

## Projects

A **Project** represents an API you want to scan. Each project contains:

- **Name**: A descriptive name for the API
- **OpenAPI Specification**: Either a URL to fetch or inline content
- **Scans**: Historical scan results for this project

Projects belong to an **Organization**, allowing teams to collaborate on API security.

## Scans

A **Scan** is a single security analysis run against a project. Scans have the following statuses:

| Status | Description |
|--------|-------------|
| `PENDING` | Scan is queued and waiting to be processed |
| `PROCESSING` | Scan engine is actively analyzing the API |
| `COMPLETED` | Scan finished successfully |
| `FAILED` | Scan encountered an error |

Each scan produces a list of **Findings** - identified vulnerabilities or issues.

## Findings

A **Finding** represents a discovered security issue. Each finding includes:

### Severity Levels

| Level | Description | Action |
|-------|-------------|--------|
| `CRITICAL` | Severe vulnerability requiring immediate attention | Fix immediately |
| `HIGH` | Significant security risk | Fix before deployment |
| `MEDIUM` | Moderate risk that should be addressed | Plan remediation |
| `LOW` | Minor issue with limited impact | Fix when convenient |
| `INFO` | Informational, best practice recommendations | Consider implementing |

### Finding Properties

- **Type**: The vulnerability category (e.g., `BOLA`, `AUTH_MISSING`)
- **Endpoint**: The affected API endpoint path
- **Method**: The HTTP method (GET, POST, PUT, DELETE, etc.)
- **Description**: Detailed explanation of the vulnerability

## Vulnerability Types

VULX detects various vulnerability types based on the OWASP API Security Top 10:

### API1: Broken Object Level Authorization (BOLA)

APIs that don't properly validate that a user has permission to access a specific object.

**Example**: A user can access `/api/users/123` even if they shouldn't have access to user 123's data.

### API2: Broken Authentication

Missing or improperly implemented authentication mechanisms.

**Example**: An endpoint that should require authentication accepts unauthenticated requests.

### API3: Excessive Data Exposure

APIs that expose more data than necessary, relying on clients to filter sensitive information.

**Example**: A user profile endpoint returns password hashes or internal IDs.

### API4: Lack of Resources & Rate Limiting

APIs without proper rate limiting, allowing abuse and DoS attacks.

**Example**: An authentication endpoint with no rate limiting allows brute force attacks.

### API5: Broken Function Level Authorization

APIs that don't properly restrict access to administrative functions.

**Example**: A regular user can access `/admin/delete-user` endpoints.

## Scan Flow

```
1. Create Project with OpenAPI spec
         │
         ▼
2. Trigger Scan
         │
         ▼
3. Scan queued in Redis
         │
         ▼
4. Scan Engine picks up job
         │
         ▼
5. Parse OpenAPI specification
         │
         ▼
6. Analyze endpoints for vulnerabilities
         │
         ▼
7. Store findings in database
         │
         ▼
8. Scan marked COMPLETED
         │
         ▼
9. View results in dashboard or CLI
```

## Reports

VULX generates PDF reports containing:

1. **Executive Summary**: High-level overview of findings by severity
2. **Scan Details**: Project information and scan metadata
3. **Findings List**: Detailed breakdown of each vulnerability
4. **Remediation Guidance**: Recommendations for fixing issues

Reports can be downloaded from the dashboard or generated via the API.
