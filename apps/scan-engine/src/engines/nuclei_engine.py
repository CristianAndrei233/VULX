"""
Nuclei Template-Based Scanner Engine
====================================
Fast vulnerability detection using Nuclei templates.

Features:
- CVE detection
- Misconfigurations
- Exposed secrets
- Default credentials
- Technology detection
"""

import asyncio
import logging
import json
import subprocess
import os
import tempfile
import uuid
from typing import Optional, List, Dict, Any
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class NucleiConfig:
    """Nuclei scanner configuration"""
    templates_path: str = "/opt/nuclei-templates"
    rate_limit: int = 150
    bulk_size: int = 25
    concurrency: int = 25
    timeout: int = 10
    retries: int = 1
    severity_filter: List[str] = None

    def __post_init__(self):
        if self.severity_filter is None:
            self.severity_filter = ["critical", "high", "medium", "low"]


class NucleiEngine:
    """
    Nuclei-based vulnerability scanner.

    Uses template-based scanning for fast detection of:
    - Known CVEs
    - Security misconfigurations
    - Exposed files and secrets
    - Default credentials
    - Outdated software
    - API-specific vulnerabilities
    """

    # Severity mapping
    SEVERITY_MAP = {
        "critical": "CRITICAL",
        "high": "HIGH",
        "medium": "MEDIUM",
        "low": "LOW",
        "info": "INFO"
    }

    # OWASP category mapping for common Nuclei findings
    OWASP_MAP = {
        "cve": "API9:2023 - Improper Inventory Management",
        "default-login": "API2:2023 - Broken Authentication",
        "exposed-panels": "API8:2023 - Security Misconfiguration",
        "exposures": "API3:2023 - Broken Object Property Level Authorization",
        "file": "API8:2023 - Security Misconfiguration",
        "misconfiguration": "API8:2023 - Security Misconfiguration",
        "misconfig": "API8:2023 - Security Misconfiguration",
        "takeover": "API8:2023 - Security Misconfiguration",
        "token-spray": "API2:2023 - Broken Authentication",
        "sqli": "API1:2023 - Broken Object Level Authorization",
        "xss": "API8:2023 - Security Misconfiguration",
        "ssrf": "API7:2023 - Server Side Request Forgery",
        "lfi": "API8:2023 - Security Misconfiguration",
        "rce": "API8:2023 - Security Misconfiguration",
        "idor": "API1:2023 - Broken Object Level Authorization",
        "injection": "API8:2023 - Security Misconfiguration",
        "auth-bypass": "API2:2023 - Broken Authentication",
        "rate-limit": "API4:2023 - Unrestricted Resource Consumption",
    }

    # API-specific templates to prioritize
    API_TEMPLATES = [
        "http/vulnerabilities/",
        "http/cves/",
        "http/exposures/",
        "http/misconfiguration/",
        "http/default-logins/",
        "http/exposed-panels/",
        "http/technologies/",
        "http/takeovers/",
    ]

    def __init__(self, templates_path: str = "/opt/nuclei-templates"):
        self.config = NucleiConfig(templates_path=templates_path)
        self._check_nuclei_installed()

    def _check_nuclei_installed(self):
        """Verify Nuclei is installed"""
        try:
            result = subprocess.run(
                ["nuclei", "-version"],
                capture_output=True,
                text=True,
                timeout=10
            )
            if result.returncode == 0:
                logger.info(f"Nuclei found: {result.stdout.strip()}")
            else:
                logger.warning("Nuclei not found or error in version check")
        except FileNotFoundError:
            logger.warning("Nuclei binary not found in PATH")
        except Exception as e:
            logger.warning(f"Error checking Nuclei: {e}")

    async def scan(
        self,
        target: Any,  # ScanTarget
        auth_context: Optional[Dict] = None,
        severity_filter: Optional[List[str]] = None,
        template_tags: Optional[List[str]] = None
    ) -> List[Any]:  # List[Finding]
        """
        Execute Nuclei scan against target.

        Args:
            target: Scan target configuration
            auth_context: Authentication context
            severity_filter: Filter by severity levels
            template_tags: Specific template tags to use

        Returns:
            List of Finding objects
        """
        from .orchestrator import Finding

        findings = []
        severity_filter = severity_filter or self.config.severity_filter

        try:
            # Create temporary file for results
            with tempfile.NamedTemporaryFile(
                mode='w',
                suffix='.json',
                delete=False
            ) as results_file:
                results_path = results_file.name

            # Build Nuclei command
            cmd = [
                "nuclei",
                "-target", target.url,
                "-json-export", results_path,
                "-rate-limit", str(self.config.rate_limit),
                "-bulk-size", str(self.config.bulk_size),
                "-concurrency", str(self.config.concurrency),
                "-timeout", str(self.config.timeout),
                "-retries", str(self.config.retries),
                "-severity", ",".join(severity_filter),
                "-silent",
                "-no-color"
            ]

            # Add templates path if exists
            if os.path.exists(self.config.templates_path):
                cmd.extend(["-templates", self.config.templates_path])

            # Add specific tags if provided
            if template_tags:
                cmd.extend(["-tags", ",".join(template_tags)])

            # Add authentication headers
            if auth_context:
                headers = []
                if auth_context.get("bearer_token"):
                    headers.append(f"Authorization: Bearer {auth_context['bearer_token']}")
                if auth_context.get("headers"):
                    for k, v in auth_context["headers"].items():
                        headers.append(f"{k}: {v}")
                if headers:
                    for header in headers:
                        cmd.extend(["-header", header])

                # Add cookies
                if auth_context.get("cookies"):
                    cookie_str = "; ".join(
                        f"{k}={v}" for k, v in auth_context["cookies"].items()
                    )
                    cmd.extend(["-header", f"Cookie: {cookie_str}"])

            logger.info(f"Running Nuclei scan on {target.url}")
            logger.debug(f"Command: {' '.join(cmd)}")

            # Run Nuclei
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )

            stdout, stderr = await asyncio.wait_for(
                process.communicate(),
                timeout=600  # 10 minute timeout
            )

            if stderr:
                logger.debug(f"Nuclei stderr: {stderr.decode()}")

            # Parse results
            if os.path.exists(results_path):
                with open(results_path, 'r') as f:
                    for line in f:
                        line = line.strip()
                        if line:
                            try:
                                result = json.loads(line)
                                finding = self._result_to_finding(result)
                                if finding:
                                    findings.append(finding)
                            except json.JSONDecodeError:
                                continue

                # Cleanup
                os.unlink(results_path)

            logger.info(f"Nuclei scan found {len(findings)} issues")

        except asyncio.TimeoutError:
            logger.error("Nuclei scan timed out")
        except Exception as e:
            logger.error(f"Nuclei scan error: {e}", exc_info=True)

        return findings

    def _result_to_finding(self, result: Dict) -> Optional[Any]:
        """Convert Nuclei result to Finding object"""
        from .orchestrator import Finding

        try:
            info = result.get("info", {})

            # Get severity
            severity = self.SEVERITY_MAP.get(
                info.get("severity", "info").lower(),
                "INFO"
            )

            # Parse endpoint from matched URL
            matched_at = result.get("matched-at", result.get("host", ""))
            endpoint = "/"
            if matched_at:
                from urllib.parse import urlparse
                parsed = urlparse(matched_at)
                endpoint = parsed.path or "/"

            # Determine OWASP category
            template_id = result.get("template-id", "").lower()
            tags = info.get("tags", [])
            owasp_category = None

            for key, category in self.OWASP_MAP.items():
                if key in template_id or key in str(tags).lower():
                    owasp_category = category
                    break

            # Extract CVE if present
            cve_id = None
            for tag in tags:
                if tag.upper().startswith("CVE-"):
                    cve_id = tag.upper()
                    break

            # Get CWE
            cwe_id = None
            classification = info.get("classification", {})
            if classification.get("cwe-id"):
                cwe_ids = classification["cwe-id"]
                if isinstance(cwe_ids, list) and cwe_ids:
                    cwe_id = f"CWE-{cwe_ids[0]}"
                elif isinstance(cwe_ids, str):
                    cwe_id = f"CWE-{cwe_ids}"

            # Get CVSS score
            cvss_score = None
            if classification.get("cvss-score"):
                try:
                    cvss_score = float(classification["cvss-score"])
                except:
                    pass

            return Finding(
                id=f"nuclei-{result.get('template-id', uuid.uuid4().hex[:8])}-{uuid.uuid4().hex[:4]}",
                engine="nuclei",
                type=result.get("template-id", "Unknown"),
                severity=severity,
                confidence="HIGH",  # Nuclei templates are well-tested
                title=info.get("name", result.get("template-id", "Unknown")),
                description=info.get("description", ""),
                endpoint=endpoint,
                method=result.get("type", "GET").upper(),
                parameter=result.get("matcher-name"),
                evidence=result.get("extracted-results", [None])[0] if result.get("extracted-results") else None,
                request=result.get("request"),
                response=result.get("response"),
                remediation=info.get("remediation"),
                cwe_id=cwe_id,
                cve_id=cve_id,
                cvss_score=cvss_score,
                owasp_category=owasp_category,
                references=info.get("reference", []) if isinstance(info.get("reference"), list) else []
            )

        except Exception as e:
            logger.error(f"Error converting Nuclei result: {e}")
            return None

    async def scan_cves(self, target: Any, auth_context: Optional[Dict] = None) -> List[Any]:
        """Scan specifically for known CVEs"""
        return await self.scan(
            target=target,
            auth_context=auth_context,
            template_tags=["cve"]
        )

    async def scan_misconfigurations(self, target: Any, auth_context: Optional[Dict] = None) -> List[Any]:
        """Scan for security misconfigurations"""
        return await self.scan(
            target=target,
            auth_context=auth_context,
            template_tags=["misconfig", "misconfiguration", "exposure"]
        )

    async def scan_default_credentials(self, target: Any, auth_context: Optional[Dict] = None) -> List[Any]:
        """Scan for default/weak credentials"""
        return await self.scan(
            target=target,
            auth_context=auth_context,
            template_tags=["default-login", "weak-credentials"]
        )

    async def update_templates(self) -> bool:
        """Update Nuclei templates to latest version"""
        try:
            process = await asyncio.create_subprocess_exec(
                "nuclei", "-update-templates",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await process.communicate()
            logger.info("Nuclei templates updated")
            return True
        except Exception as e:
            logger.error(f"Failed to update templates: {e}")
            return False
