---
layout: home

hero:
  name: VULX
  text: Enterprise DAST Platform
  tagline: Dynamic Application Security Testing for modern APIs. Real penetration testing with ZAP, Nuclei & Schemathesis.
  image:
    src: /logo.png
    alt: VULX Logo
  actions:
    - theme: brand
      text: Get Started
      link: /guide/introduction
    - theme: alt
      text: Quick Start
      link: /guide/quick-start
    - theme: alt
      text: View on GitHub
      link: https://github.com/your-org/vulx

features:
  - icon: 🎯
    title: Real Penetration Testing
    details: Active security testing using industry-leading engines - OWASP ZAP, Nuclei, and Schemathesis - not just static analysis.
  - icon: 🔐
    title: Authentication-Aware
    details: Full support for Bearer tokens, OAuth2, API keys, session cookies, and basic auth to test protected endpoints.
  - icon: 🛡️
    title: OWASP API Top 10
    details: Comprehensive detection of BOLA, broken authentication, injection attacks, security misconfigurations, and more.
  - icon: 🏢
    title: Multi-Environment Support
    details: Separate Sandbox and Production environments with isolated data, API keys, and scan histories for enterprise workflows.
  - icon: 📋
    title: Compliance Mapping
    details: Automatic mapping of findings to SOC 2, PCI-DSS, HIPAA, GDPR, and ISO 27001 compliance frameworks.
  - icon: 🔧
    title: Smart Deduplication
    details: Intelligent finding tracking across scans. No duplicates, regression detection, and inherited status for repeat issues.
  - icon: 🔄
    title: CI/CD Integration
    details: Docker agent for GitHub Actions, GitLab CI, Jenkins. Fail builds on critical vulnerabilities.
  - icon: 📊
    title: Flexible Scan Types
    details: Quick (2-5min), Standard (10-30min), or Full (30-60min) scans to match your CI/CD speed requirements.
---

## Quick Example

```bash
# Install VULX CLI
npm install -g @vulx/cli

# Run your first scan
vulx scan https://api.example.com --type full

# With authentication
vulx scan https://api.example.com \
  --spec https://api.example.com/openapi.json \
  --auth bearer --token $API_TOKEN

# Generate compliance report
vulx report scan_abc123 --format pdf --framework soc2
```

## Docker Agent

```yaml
# GitHub Actions Example
- name: VULX Security Scan
  uses: vulx/scan-action@v1
  with:
    target: https://api.example.com
    spec: https://api.example.com/openapi.json
    api-key: ${{ secrets.VULX_API_KEY }}
    fail-on: critical,high
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     VULX Platform                            │
├─────────────────────────────────────────────────────────────┤
│  Web Dashboard → REST API → PostgreSQL                       │
│       ↓              ↓                                       │
│  Embedded CLI    Redis Queue                                 │
│                      ↓                                       │
│  ┌──────────┐  ┌──────────┐  ┌─────────────┐               │
│  │ OWASP    │  │  Nuclei  │  │ Schemathesis │               │
│  │   ZAP    │  │ Templates │  │  API Fuzzer  │               │
│  └──────────┘  └──────────┘  └─────────────┘               │
└─────────────────────────────────────────────────────────────┘
```
