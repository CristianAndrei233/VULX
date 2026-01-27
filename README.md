<p align="center">
  <img src="assets/logo.png" alt="VULX Logo" width="400">
</p>

<h1 align="center">VULX SecureAPI Scanner</h1>

<p align="center">
  <strong>Enterprise-Grade API Security Assessment Platform</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#documentation">Documentation</a> •
  <a href="#cli">CLI</a> •
  <a href="#api-reference">API Reference</a> •
  <a href="#contributing">Contributing</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/OWASP-API%20Top%2010-orange?style=for-the-badge" alt="OWASP API Top 10">
  <img src="https://img.shields.io/badge/OpenAPI-3.0-green?style=for-the-badge" alt="OpenAPI 3.0">
  <img src="https://img.shields.io/badge/license-MIT-blue?style=for-the-badge" alt="License">
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen?style=for-the-badge" alt="PRs Welcome">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Redis-DC382D?style=flat-square&logo=redis&logoColor=white" alt="Redis">
  <img src="https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker">
</p>

---

## Overview

**VULX** is a comprehensive API security scanner that analyzes OpenAPI/Swagger specifications against the **OWASP API Security Top 10 (2023)** framework. It helps development teams identify and remediate security vulnerabilities early in the development lifecycle.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌──────────┐  │
│   │   OpenAPI   │────▶│  VULX API   │────▶│ Scan Engine │────▶│  Report  │  │
│   │    Spec     │     │   Server    │     │  (Python)   │     │   PDF    │  │
│   └─────────────┘     └─────────────┘     └─────────────┘     └──────────┘  │
│                              │                   │                          │
│                              ▼                   ▼                          │
│                       ┌─────────────┐     ┌─────────────┐                   │
│                       │  PostgreSQL │     │    Redis    │                   │
│                       │  (Storage)  │     │   (Queue)   │                   │
│                       └─────────────┘     └─────────────┘                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Features

### Security Analysis

| Category | OWASP ID | Description |
|----------|----------|-------------|
| Broken Object Level Authorization | API1:2023 | Detects endpoints vulnerable to BOLA attacks |
| Broken Authentication | API2:2023 | Identifies weak or missing authentication |
| Broken Object Property Level Authorization | API3:2023 | Finds mass assignment vulnerabilities |
| Unrestricted Resource Consumption | API4:2023 | Checks for missing rate limiting & pagination |
| Broken Function Level Authorization | API5:2023 | Detects unprotected admin endpoints |
| Unrestricted Access to Sensitive Business Flows | API6:2023 | Identifies critical business flow risks |
| Server-Side Request Forgery | API7:2023 | Finds SSRF-vulnerable parameters |
| Security Misconfiguration | API8:2023 | Detects debug endpoints & verbose errors |
| Improper Inventory Management | API9:2023 | Identifies deprecated/unversioned APIs |
| Unsafe Consumption of APIs | API10:2023 | Analyzes third-party API integration risks |

### Platform Capabilities

- **Static Analysis** - Analyze OpenAPI 3.x and Swagger 2.0 specifications
- **Professional PDF Reports** - Executive summaries with risk scores and remediation roadmaps
- **CI/CD Integration** - Native support for GitHub Actions, GitLab CI, and Jenkins
- **CLI Tool** - Powerful command-line interface for automation
- **Web Dashboard** - Modern React-based UI for managing projects and viewing results
- **Team Collaboration** - Organization support with role-based access
- **Subscription Management** - Integrated Stripe billing for SaaS deployment

---

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.10+
- PostgreSQL 14+
- Redis 6+
- Docker & Docker Compose (recommended)

### Installation

#### 1. Clone the repository

```bash
git clone https://github.com/your-org/vulx.git
cd vulx
```

#### 2. Start infrastructure services

```bash
docker-compose up -d
```

#### 3. Install dependencies

```bash
npm install
```

#### 4. Configure environment

```bash
# API configuration
cp apps/api/.env.example apps/api/.env

# Edit with your settings
nano apps/api/.env
```

Required environment variables:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/vulx
REDIS_URL=redis://localhost:6379
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

#### 5. Initialize database

```bash
cd apps/api
npx prisma migrate dev
npx prisma db seed
```

#### 6. Start the platform

```bash
# Terminal 1: API Server
npm run dev:api

# Terminal 2: Web Dashboard
npm run dev:web

# Terminal 3: Scan Engine
cd apps/scan-engine
python -m src.worker
```

#### 7. Access the platform

- **Web Dashboard**: http://localhost:5173
- **API Server**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api-docs

---

## CLI

The VULX CLI enables seamless integration into your development workflow and CI/CD pipelines.

### Installation

```bash
npm install -g @vulx/cli
```

### Authentication

```bash
vulx auth login
```

### Running Scans

```bash
# Basic scan
vulx scan --project-id <PROJECT_ID>

# With failure threshold
vulx scan --project-id <PROJECT_ID> --fail-on HIGH

# Show remediation guidance
vulx scan --project-id <PROJECT_ID> --show-remediation

# JSON output for CI/CD
vulx scan --project-id <PROJECT_ID> --json
```

### Example Output

```
  ╔═══════════════════════════════════════════════════════════╗
  ║                    VULX Security Scan                     ║
  ╠═══════════════════════════════════════════════════════════╣
  ║  Project: Payment Gateway API                             ║
  ║  Scan ID: a1b2c3d4                                        ║
  ║  Status:  COMPLETED                                       ║
  ╚═══════════════════════════════════════════════════════════╝

  ┌─────────────────────────────────────────────────────────────┐
  │ FINDINGS SUMMARY                                            │
  ├─────────────────────────────────────────────────────────────┤
  │  🔴 CRITICAL    2                                           │
  │  🟠 HIGH        5                                           │
  │  🟡 MEDIUM      8                                           │
  │  🔵 LOW         3                                           │
  │  ⚪ INFO        1                                           │
  ├─────────────────────────────────────────────────────────────┤
  │  TOTAL         19                                           │
  └─────────────────────────────────────────────────────────────┘
```

---

## CI/CD Integration

### GitHub Actions

```yaml
name: API Security Scan

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
          VULX_API_KEY: ${{ secrets.VULX_API_KEY }}
        run: |
          vulx scan \
            --project-id ${{ vars.PROJECT_ID }} \
            --fail-on HIGH \
            --json > scan-results.json

      - name: Upload Results
        uses: actions/upload-artifact@v4
        with:
          name: security-scan-results
          path: scan-results.json
```

### GitLab CI

```yaml
security-scan:
  image: node:20
  stage: test
  script:
    - npm install -g @vulx/cli
    - vulx scan --project-id $PROJECT_ID --fail-on HIGH
  artifacts:
    reports:
      junit: scan-results.xml
```

### Jenkins

```groovy
pipeline {
    agent any

    environment {
        VULX_API_KEY = credentials('vulx-api-key')
    }

    stages {
        stage('Security Scan') {
            steps {
                sh 'npm install -g @vulx/cli'
                sh 'vulx scan --project-id ${PROJECT_ID} --fail-on HIGH'
            }
        }
    }
}
```

---

## API Reference

### Base URL

```
https://api.vulx.io/v1
```

### Authentication

All API requests require an API key passed in the `Authorization` header:

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" https://api.vulx.io/v1/projects
```

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/projects` | List all projects |
| `POST` | `/projects` | Create a new project |
| `GET` | `/projects/:id` | Get project details |
| `POST` | `/projects/:id/scans` | Trigger a new scan |
| `GET` | `/projects/:id/scans/:scanId` | Get scan results |
| `GET` | `/projects/:id/scans/:scanId/report` | Download PDF report |

### Example: Trigger a Scan

```bash
curl -X POST https://api.vulx.io/v1/projects/abc123/scans \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json"
```

**Response:**

```json
{
  "id": "scan_xyz789",
  "projectId": "abc123",
  "status": "PENDING",
  "startedAt": "2024-01-15T10:30:00Z"
}
```

For complete API documentation, visit: **http://localhost:3001/api-docs**

---

## Project Structure

```
vulx/
├── apps/
│   ├── api/                    # Express.js REST API
│   │   ├── src/
│   │   │   ├── routes/         # API route handlers
│   │   │   ├── services/       # Business logic & report generator
│   │   │   └── lib/            # Shared utilities
│   │   └── prisma/             # Database schema & migrations
│   │
│   ├── web/                    # React 19 + Vite dashboard
│   │   ├── src/
│   │   │   ├── components/     # Reusable UI components
│   │   │   ├── pages/          # Route pages
│   │   │   └── services/       # API client
│   │   └── public/             # Static assets
│   │
│   └── scan-engine/            # Python security scanner
│       └── src/
│           ├── scanners/       # OWASP vulnerability detectors
│           ├── parser.py       # OpenAPI spec parser
│           └── worker.py       # Redis job processor
│
├── packages/
│   └── cli/                    # @vulx/cli npm package
│       └── src/
│           └── commands/       # CLI commands
│
├── docs/                       # VitePress documentation
│   └── guide/                  # User guides
│
└── infra/                      # Infrastructure configs
    └── docker/                 # Docker configurations
```

---

## Documentation

Comprehensive documentation is available at [docs.vulx.io](https://docs.vulx.io) or locally:

```bash
npm run dev:docs
```

### Guides

- [Introduction](docs/guide/introduction.md) - Overview and features
- [Quick Start](docs/guide/quick-start.md) - Get up and running
- [Core Concepts](docs/guide/core-concepts.md) - Understanding VULX

### CLI Reference

- [Getting Started](docs/cli/getting-started.md) - CLI installation
- [Commands](docs/cli/commands.md) - Complete command reference
- [Configuration](docs/cli/configuration.md) - Configuration options

### CI/CD Integration

- [GitHub Actions](docs/cicd/github-actions.md)
- [GitLab CI](docs/cicd/gitlab-ci.md)
- [Jenkins](docs/cicd/jenkins.md)

---

## PDF Report

VULX generates comprehensive, professional PDF security reports including:

- **Executive Summary** - High-level risk overview with scores
- **OWASP Coverage Matrix** - Compliance against API Security Top 10
- **Detailed Findings** - Each vulnerability with evidence and remediation
- **Remediation Roadmap** - Prioritized timeline for fixes
- **Methodology Appendix** - Scanning approach and risk scoring

---

## Development

### Running Tests

```bash
# API tests
cd apps/api && npm test

# Web tests
cd apps/web && npm test

# Scanner tests
cd apps/scan-engine && pytest
```

### Building for Production

```bash
# Build all packages
npm run build

# Build documentation
npm run build:docs
```

### Database Management

```bash
# Run migrations
npx prisma migrate deploy

# Generate client
npx prisma generate

# Open Prisma Studio
npx prisma studio
```

---

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm test`
5. Commit: `git commit -m 'feat: add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `chore:` Maintenance tasks
- `refactor:` Code refactoring
- `test:` Test additions/changes

---

## Security

If you discover a security vulnerability, please email security@vulx.io instead of using the issue tracker.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Support

- **Documentation**: [docs.vulx.io](https://docs.vulx.io)
- **Issues**: [GitHub Issues](https://github.com/your-org/vulx/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/vulx/discussions)
- **Email**: support@vulx.io

---

<p align="center">
  <strong>Built with security in mind</strong>
</p>

<p align="center">
  <sub>Made with ❤️ by the VULX Team</sub>
</p>
