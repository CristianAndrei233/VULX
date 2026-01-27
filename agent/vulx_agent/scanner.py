"""
VULX Scanner Module
===================
Core scanning functionality for the VULX agent.
"""

import asyncio
import os
import json
import subprocess
import tempfile
import uuid
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional, List, Dict, Any, Callable
import aiohttp
import structlog

logger = structlog.get_logger()


class ScanType(Enum):
    """Scan type options"""
    QUICK = "quick"       # Nuclei only
    STANDARD = "standard" # Nuclei + Schemathesis
    FULL = "full"        # All engines including ZAP


@dataclass
class ScanConfig:
    """Scan configuration"""
    target_url: str
    openapi_spec: Optional[str] = None
    scan_type: ScanType = ScanType.STANDARD
    auth_token: Optional[str] = None
    auth_headers: Dict[str, str] = field(default_factory=dict)
    exclude_paths: List[str] = field(default_factory=lambda: ["/health", "/metrics"])
    rate_limit: int = 100
    timeout: int = 30
    vulx_api_key: Optional[str] = None
    vulx_api_url: str = "https://api.vulx.io"
    vulx_project_id: Optional[str] = None


class VulxScanner:
    """
    VULX Security Scanner

    Orchestrates scanning engines:
    - Nuclei for CVE/misconfiguration detection
    - Schemathesis for API fuzzing
    - OWASP ZAP for full DAST
    """

    def __init__(self, config: ScanConfig):
        self.config = config
        self.scan_id = str(uuid.uuid4())
        self._progress_callbacks: List[Callable] = []

    def on_progress(self, callback: Callable[[str, int, str], None]):
        """Register progress callback"""
        self._progress_callbacks.append(callback)

    def _notify_progress(self, status: str, percent: int, message: str):
        """Notify progress callbacks"""
        for callback in self._progress_callbacks:
            try:
                callback(status, percent, message)
            except Exception:
                pass

    async def scan(self) -> Dict[str, Any]:
        """
        Execute security scan.

        Returns:
            Scan results with findings
        """
        started_at = datetime.utcnow()
        findings: List[Dict] = []
        engines_used: List[str] = []

        logger.info("Starting scan", target=self.config.target_url, scan_type=self.config.scan_type.value)

        try:
            # Phase 1: Quick scan with Nuclei
            self._notify_progress("Nuclei", 10, "Running vulnerability detection")
            nuclei_findings = await self._run_nuclei()
            findings.extend(nuclei_findings)
            engines_used.append("nuclei")
            logger.info("Nuclei complete", findings=len(nuclei_findings))

            if self.config.scan_type in [ScanType.STANDARD, ScanType.FULL]:
                # Phase 2: API Fuzzing with Schemathesis
                if self.config.openapi_spec:
                    self._notify_progress("Schemathesis", 40, "Running API fuzzing")
                    schema_findings = await self._run_schemathesis()
                    findings.extend(schema_findings)
                    engines_used.append("schemathesis")
                    logger.info("Schemathesis complete", findings=len(schema_findings))

            if self.config.scan_type == ScanType.FULL:
                # Phase 3: Full DAST with ZAP
                self._notify_progress("ZAP", 60, "Running deep DAST scan")
                zap_findings = await self._run_zap()
                findings.extend(zap_findings)
                engines_used.append("zap")
                logger.info("ZAP complete", findings=len(zap_findings))

            # Deduplicate and enrich findings
            self._notify_progress("Analyzing", 90, "Processing results")
            findings = self._deduplicate_findings(findings)
            findings = self._enrich_findings(findings)

            completed_at = datetime.utcnow()
            duration = int((completed_at - started_at).total_seconds())

            # Calculate summary
            summary = self._calculate_summary(findings)
            risk_score = self._calculate_risk_score(findings)
            compliance_summary = self._get_compliance_summary(findings)

            self._notify_progress("Complete", 100, "Scan finished")

            return {
                "scan_id": self.scan_id,
                "target_url": self.config.target_url,
                "scan_type": self.config.scan_type.value,
                "status": "COMPLETED",
                "started_at": started_at.isoformat(),
                "completed_at": completed_at.isoformat(),
                "duration_seconds": duration,
                "findings": findings,
                "summary": summary,
                "engines_used": engines_used,
                "risk_score": risk_score,
                "compliance_summary": compliance_summary
            }

        except Exception as e:
            logger.error("Scan failed", error=str(e))
            return {
                "scan_id": self.scan_id,
                "target_url": self.config.target_url,
                "scan_type": self.config.scan_type.value,
                "status": "FAILED",
                "error": str(e),
                "findings": findings,
                "summary": {"error": str(e)}
            }

    async def _run_nuclei(self) -> List[Dict]:
        """Run Nuclei vulnerability scanner"""
        findings = []

        try:
            with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
                results_path = f.name

            cmd = [
                "nuclei",
                "-target", self.config.target_url,
                "-json-export", results_path,
                "-severity", "critical,high,medium,low",
                "-silent",
                "-no-color",
                "-rate-limit", str(self.config.rate_limit)
            ]

            # Add auth headers
            if self.config.auth_token:
                cmd.extend(["-header", f"Authorization: Bearer {self.config.auth_token}"])

            for header, value in self.config.auth_headers.items():
                cmd.extend(["-header", f"{header}: {value}"])

            # Run nuclei
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )

            await asyncio.wait_for(process.communicate(), timeout=600)

            # Parse results
            if os.path.exists(results_path):
                with open(results_path, 'r') as f:
                    for line in f:
                        line = line.strip()
                        if line:
                            try:
                                result = json.loads(line)
                                finding = self._nuclei_to_finding(result)
                                if finding:
                                    findings.append(finding)
                            except json.JSONDecodeError:
                                continue
                os.unlink(results_path)

        except FileNotFoundError:
            logger.warning("Nuclei not found, skipping")
        except asyncio.TimeoutError:
            logger.warning("Nuclei scan timed out")
        except Exception as e:
            logger.error("Nuclei error", error=str(e))

        return findings

    async def _run_schemathesis(self) -> List[Dict]:
        """Run Schemathesis API fuzzing"""
        findings = []

        if not self.config.openapi_spec:
            return findings

        try:
            cmd = [
                "schemathesis", "run",
                self.config.openapi_spec,
                "--base-url", self.config.target_url,
                "--hypothesis-max-examples", "50",
                "--workers", "2",
                "--request-timeout", str(self.config.timeout * 1000),
                "--no-color"
            ]

            # Add auth
            if self.config.auth_token:
                cmd.extend(["--header", f"Authorization: Bearer {self.config.auth_token}"])

            for header, value in self.config.auth_headers.items():
                cmd.extend(["--header", f"{header}: {value}"])

            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )

            stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=900)

            # Parse output for failures
            output = stdout.decode() if stdout else ""
            for line in output.split("\n"):
                if "FAILED" in line or "ERROR" in line:
                    findings.append({
                        "id": f"schema-{uuid.uuid4().hex[:8]}",
                        "engine": "schemathesis",
                        "type": "API Fuzzing Failure",
                        "severity": "MEDIUM",
                        "confidence": "HIGH",
                        "title": "API endpoint returned unexpected response",
                        "description": line.strip(),
                        "endpoint": "/",
                        "method": "GET",
                        "owasp_category": "API8:2023 - Security Misconfiguration"
                    })

        except FileNotFoundError:
            logger.warning("Schemathesis not found, skipping")
        except asyncio.TimeoutError:
            logger.warning("Schemathesis scan timed out")
        except Exception as e:
            logger.error("Schemathesis error", error=str(e))

        return findings

    async def _run_zap(self) -> List[Dict]:
        """Run OWASP ZAP DAST scan"""
        findings = []

        # ZAP requires more complex setup
        # This is a simplified version for the agent
        try:
            # Check if ZAP API is available
            zap_port = os.environ.get("ZAP_PORT", "8090")
            zap_url = f"http://localhost:{zap_port}"

            async with aiohttp.ClientSession() as session:
                # Quick spider
                async with session.get(
                    f"{zap_url}/JSON/spider/action/scan/",
                    params={"url": self.config.target_url}
                ) as resp:
                    if resp.status != 200:
                        logger.warning("ZAP spider failed")
                        return findings

                # Wait for spider
                await asyncio.sleep(30)

                # Get alerts
                async with session.get(
                    f"{zap_url}/JSON/core/view/alerts/",
                    params={"baseurl": self.config.target_url}
                ) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        for alert in data.get("alerts", []):
                            finding = self._zap_to_finding(alert)
                            if finding:
                                findings.append(finding)

        except Exception as e:
            logger.warning("ZAP scan skipped", error=str(e))

        return findings

    def _nuclei_to_finding(self, result: Dict) -> Optional[Dict]:
        """Convert Nuclei result to finding"""
        try:
            info = result.get("info", {})
            severity_map = {"critical": "CRITICAL", "high": "HIGH", "medium": "MEDIUM", "low": "LOW", "info": "INFO"}

            return {
                "id": f"nuclei-{result.get('template-id', uuid.uuid4().hex[:8])}",
                "engine": "nuclei",
                "type": result.get("template-id", "Unknown"),
                "severity": severity_map.get(info.get("severity", "info").lower(), "INFO"),
                "confidence": "HIGH",
                "title": info.get("name", result.get("template-id", "Unknown")),
                "description": info.get("description", ""),
                "endpoint": result.get("matched-at", "/"),
                "method": result.get("type", "GET").upper(),
                "remediation": info.get("remediation"),
                "cwe_id": f"CWE-{info.get('classification', {}).get('cwe-id', [''])[0]}" if info.get("classification", {}).get("cwe-id") else None,
                "references": info.get("reference", [])
            }
        except Exception:
            return None

    def _zap_to_finding(self, alert: Dict) -> Optional[Dict]:
        """Convert ZAP alert to finding"""
        try:
            risk_map = {"Informational": "INFO", "Low": "LOW", "Medium": "MEDIUM", "High": "HIGH"}

            return {
                "id": f"zap-{alert.get('alertRef', uuid.uuid4().hex[:8])}",
                "engine": "zap",
                "type": alert.get("name", "Unknown"),
                "severity": risk_map.get(alert.get("risk", ""), "INFO"),
                "confidence": alert.get("confidence", "MEDIUM"),
                "title": alert.get("name", "Unknown"),
                "description": alert.get("description", ""),
                "endpoint": alert.get("url", "/"),
                "method": alert.get("method", "GET"),
                "parameter": alert.get("param"),
                "evidence": alert.get("evidence"),
                "remediation": alert.get("solution"),
                "cwe_id": f"CWE-{alert.get('cweid')}" if alert.get("cweid") else None
            }
        except Exception:
            return None

    def _deduplicate_findings(self, findings: List[Dict]) -> List[Dict]:
        """Remove duplicate findings"""
        seen = set()
        unique = []

        for finding in findings:
            key = (finding.get("type"), finding.get("endpoint"), finding.get("method"))
            if key not in seen:
                seen.add(key)
                unique.append(finding)

        return unique

    def _enrich_findings(self, findings: List[Dict]) -> List[Dict]:
        """Add compliance mappings and remediation"""
        owasp_mappings = {
            "sql": "API1:2023 - Broken Object Level Authorization",
            "xss": "API8:2023 - Security Misconfiguration",
            "auth": "API2:2023 - Broken Authentication",
            "ssrf": "API7:2023 - Server Side Request Forgery"
        }

        for finding in findings:
            title_lower = finding.get("title", "").lower()
            for keyword, owasp in owasp_mappings.items():
                if keyword in title_lower:
                    finding["owasp_category"] = owasp
                    break

        return findings

    def _calculate_summary(self, findings: List[Dict]) -> Dict[str, Any]:
        """Calculate summary statistics"""
        by_severity = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0, "INFO": 0}

        for finding in findings:
            severity = finding.get("severity", "INFO")
            by_severity[severity] = by_severity.get(severity, 0) + 1

        return {
            "total": len(findings),
            "by_severity": by_severity,
            "critical_count": by_severity["CRITICAL"],
            "high_count": by_severity["HIGH"],
            "actionable": by_severity["CRITICAL"] + by_severity["HIGH"]
        }

    def _calculate_risk_score(self, findings: List[Dict]) -> int:
        """Calculate risk score 0-100"""
        weights = {"CRITICAL": 25, "HIGH": 15, "MEDIUM": 5, "LOW": 2, "INFO": 0}
        total = sum(weights.get(f.get("severity", "INFO"), 0) for f in findings)
        return min(100, total)

    def _get_compliance_summary(self, findings: List[Dict]) -> Dict[str, Any]:
        """Get basic compliance impact summary"""
        affected_frameworks = set()

        for finding in findings:
            if finding.get("severity") in ["CRITICAL", "HIGH"]:
                affected_frameworks.update(["soc2", "pci_dss", "hipaa", "gdpr"])
            elif finding.get("severity") == "MEDIUM":
                affected_frameworks.update(["soc2", "pci_dss"])

        return {
            "frameworks_affected": list(affected_frameworks),
            "total_controls_affected": len(affected_frameworks) * 3  # Estimate
        }
