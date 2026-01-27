"""
VULX Security Scanner Agent
===========================
Enterprise DAST scanner for CI/CD pipelines.

This agent runs security scans in your infrastructure and reports
results to the VULX platform. It includes:

- OWASP ZAP for dynamic application security testing
- Nuclei for CVE and misconfiguration detection
- Schemathesis for API fuzzing

Usage:
    vulx-agent scan --target https://api.example.com
    vulx-agent scan --target https://api.example.com --spec https://api.example.com/openapi.json
"""

__version__ = "1.0.0"
__author__ = "VULX Security Team"
