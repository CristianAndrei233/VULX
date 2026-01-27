# Introduction

VULX is an API security scanner that helps development teams identify vulnerabilities in their APIs before they reach production. By analyzing OpenAPI specifications and performing targeted security tests, VULX detects common API security issues defined in the OWASP API Security Top 10.

## What is VULX?

VULX is a comprehensive API security platform consisting of:

- **Web Dashboard** - A React-based interface for managing projects, viewing scan results, and generating reports
- **REST API** - A backend service that orchestrates scans and manages data
- **Scan Engine** - A Python-based worker that performs the actual security analysis
- **CLI Tool** - A command-line interface for integrating scans into CI/CD pipelines

## Key Features

### Vulnerability Detection

VULX scans for common API security vulnerabilities including:

| Vulnerability | Description |
|--------------|-------------|
| BOLA | Broken Object Level Authorization - accessing resources without proper authorization |
| Broken Authentication | Missing or improperly implemented authentication mechanisms |
| Excessive Data Exposure | APIs returning more data than necessary |
| Rate Limiting | Missing rate limiting allowing abuse |
| Injection | SQL, NoSQL, and command injection vulnerabilities |
| Security Misconfiguration | Insecure headers, CORS misconfigurations |

### OpenAPI Integration

VULX parses your OpenAPI (Swagger) specifications to understand your API structure:

- Supports OpenAPI 2.0 and 3.x specifications
- Parses YAML and JSON formats
- Extracts endpoints, methods, parameters, and authentication requirements

### Comprehensive Reporting

Generate detailed reports including:

- Executive summary of findings
- Detailed vulnerability descriptions
- Severity ratings (Critical, High, Medium, Low, Info)
- Remediation recommendations
- PDF export for stakeholder distribution

## Architecture Overview

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Web App    │────▶│   REST API  │────▶│    Redis    │
│  (React)    │     │  (Express)  │     │   (Queue)   │
└─────────────┘     └─────────────┘     └──────┬──────┘
                           │                    │
                           ▼                    ▼
                    ┌─────────────┐     ┌─────────────┐
                    │ PostgreSQL  │◀────│ Scan Engine │
                    │  (Database) │     │  (Python)   │
                    └─────────────┘     └─────────────┘
```

## Getting Started

Ready to secure your APIs? Check out the [Quick Start Guide](/guide/quick-start) to set up VULX in minutes.
