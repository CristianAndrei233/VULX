# Introduction to VULX

VULX is an **enterprise-grade Dynamic Application Security Testing (DAST) platform** designed for modern API-first applications. It combines multiple industry-leading security engines to provide comprehensive vulnerability detection, compliance mapping, and automated remediation guidance.

## What Makes VULX Different?

Unlike basic static analyzers, VULX performs **real penetration testing** against your live APIs using the same techniques employed by security professionals and malicious actors. This means:

- **Real Attack Simulation** - Active testing with actual HTTP requests
- **Authentication-Aware Scanning** - Tests authenticated endpoints with OAuth2, sessions, API keys
- **Multi-Engine Analysis** - Combines ZAP, Nuclei, and Schemathesis for comprehensive coverage
- **Compliance Mapping** - Auto-maps findings to SOC2, PCI-DSS, HIPAA, GDPR, ISO 27001
- **Auto-Remediation** - Generates fix code in Python, JavaScript, Java, and Go

## Core Components

### 1. Web Dashboard
A modern React-based interface for:
- Managing projects and scan configurations
- Viewing real-time scan progress
- Analyzing vulnerability findings with severity breakdown
- Generating compliance reports
- Configuring authentication methods
- Embedded CLI terminal for power users

### 2. REST API
The backend service (Express/TypeScript) that:
- Orchestrates scan workflows
- Manages authentication configurations
- Stores and retrieves scan results
- Generates PDF reports
- Exposes webhooks for CI/CD integration

### 3. Scan Engine
A Python-based worker that integrates:

| Engine | Purpose | Capabilities |
|--------|---------|--------------|
| **OWASP ZAP** | Web Application Scanner | Spider, AJAX Spider, Active Scan, Passive Analysis |
| **Nuclei** | Template-Based Scanner | CVE Detection, Misconfigurations, Exposures |
| **Schemathesis** | API Fuzzer | Property-Based Testing, Schema Validation |

### 4. Docker Agent
A containerized scanner for CI/CD pipelines:
```bash
docker run --rm \
  -e VULX_API_KEY=your_key \
  -e TARGET_URL=https://api.example.com \
  -e OPENAPI_SPEC_URL=https://api.example.com/openapi.json \
  vulx-scanner
```

### 5. CLI Tool
Command-line interface for developers:
```bash
# Quick scan
vulx scan --target https://api.example.com

# Full scan with OpenAPI spec
vulx scan --target https://api.example.com \
  --spec ./openapi.yaml \
  --auth bearer:$API_TOKEN

# Generate compliance report
vulx report --scan-id abc123 --format pdf --framework soc2
```

## Security Capabilities

### Vulnerability Detection

VULX detects vulnerabilities across the OWASP API Security Top 10:

| Category | Description | Detection Method |
|----------|-------------|------------------|
| **API1:2023** | Broken Object Level Authorization | ID manipulation, horizontal privilege escalation tests |
| **API2:2023** | Broken Authentication | Token analysis, session management testing |
| **API3:2023** | Broken Object Property Level Authorization | Mass assignment, excessive data exposure |
| **API4:2023** | Unrestricted Resource Consumption | Rate limiting bypass, DoS vectors |
| **API5:2023** | Broken Function Level Authorization | Vertical privilege escalation, admin endpoint access |
| **API6:2023** | Unrestricted Access to Sensitive Business Flows | Business logic abuse |
| **API7:2023** | Server Side Request Forgery | SSRF payload injection |
| **API8:2023** | Security Misconfiguration | Headers, CORS, error handling |
| **API9:2023** | Improper Inventory Management | Shadow APIs, deprecated endpoints |
| **API10:2023** | Unsafe Consumption of APIs | Third-party API risks |

### Additional Detections

- SQL Injection (SQLi)
- Cross-Site Scripting (XSS)
- XML External Entity (XXE)
- Command Injection
- Path Traversal
- CVE-based vulnerabilities
- Sensitive data exposure
- Insecure headers

## Authentication Support

VULX handles complex authentication scenarios:

```yaml
# Bearer Token
auth:
  method: bearer_token
  token: "eyJhbGciOiJIUzI1NiIs..."

# OAuth2 Client Credentials
auth:
  method: oauth2_client_credentials
  client_id: "your-client-id"
  client_secret: "your-secret"
  token_url: "https://auth.example.com/oauth/token"
  scope: "read write"

# Session/Cookie Authentication
auth:
  method: session_cookie
  login_url: "https://api.example.com/auth/login"
  login_body:
    username: "test@example.com"
    password: "testpass123"
  session_cookie_name: "session_id"

# API Key
auth:
  method: api_key
  header: "X-API-Key"
  value: "your-api-key"
```

## Compliance Frameworks

Automatic mapping to regulatory requirements:

| Framework | Focus | Controls Mapped |
|-----------|-------|-----------------|
| **SOC 2** | Security & Availability | CC6.1, CC6.6, CC6.7, CC7.1, CC7.2 |
| **PCI DSS** | Payment Card Security | 6.5.1-6.5.10, 2.2.4, 6.6 |
| **HIPAA** | Healthcare Data | 164.312(a), 164.312(c), 164.312(e) |
| **GDPR** | Data Protection | Art. 5, Art. 25, Art. 32 |
| **ISO 27001** | Information Security | A.9.4, A.12.6, A.14.1, A.14.2 |

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        VULX Platform                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │  Web Dashboard│    │  REST API    │    │  PostgreSQL  │      │
│  │  (React 19)   │───▶│  (Express)   │───▶│  (Database)  │      │
│  └──────────────┘    └──────┬───────┘    └──────────────┘      │
│                             │                                    │
│                             ▼                                    │
│                      ┌──────────────┐                           │
│                      │    Redis     │                           │
│                      │   (Queue)    │                           │
│                      └──────┬───────┘                           │
│                             │                                    │
│         ┌───────────────────┼───────────────────┐               │
│         ▼                   ▼                   ▼               │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐        │
│  │  OWASP ZAP   │   │    Nuclei    │   │ Schemathesis │        │
│  │   Engine     │   │    Engine    │   │   Engine     │        │
│  └──────────────┘   └──────────────┘   └──────────────┘        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CI/CD Integration                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │  GitHub  │  │  GitLab  │  │  Jenkins │  │  Docker  │        │
│  │  Actions │  │    CI    │  │ Pipeline │  │  Agent   │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

## Scan Types

| Type | Duration | Engines | Use Case |
|------|----------|---------|----------|
| **Quick** | ~2-5 min | Nuclei only | Pre-commit checks, rapid feedback |
| **Standard** | ~10-30 min | ZAP + Nuclei | Daily CI/CD scans |
| **Full** | ~30-60 min | All engines | Release gates, compliance audits |

## Getting Started

Ready to secure your APIs? Continue to the [Quick Start Guide](./quick-start.md) to set up VULX in under 5 minutes.

## Support & Resources

- **Documentation**: You're here!
- **API Reference**: `/api-docs` (Swagger UI)
- **GitHub Issues**: Report bugs and request features
- **Enterprise Support**: Contact sales@vulx.io
