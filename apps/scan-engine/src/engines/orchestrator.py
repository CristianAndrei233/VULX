"""
VULX DAST Scan Orchestrator
===========================
Enterprise-grade security scanning orchestration layer that coordinates
multiple scanning engines for comprehensive API security testing.

Engines:
- OWASP ZAP: Full DAST scanning (SQL injection, XSS, etc.)
- Nuclei: Fast CVE and misconfiguration detection
- Schemathesis: API fuzzing and logic testing

Architecture:
- Runs as Docker containers for isolation
- Supports authenticated scanning
- Maps findings to compliance frameworks
"""

import asyncio
import logging
import json
import time
from dataclasses import dataclass, field, asdict
from typing import Optional, List, Dict, Any
from enum import Enum
from datetime import datetime
import uuid

from .zap_engine import ZAPEngine
from .nuclei_engine import NucleiEngine
from .schemathesis_engine import SchemathesisEngine
from .auth_handler import AuthHandler, AuthConfig
from ..compliance.mapper import ComplianceMapper
from ..remediation.engine import RemediationEngine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ScanType(Enum):
    QUICK = "quick"           # Nuclei only - fast CVE check
    STANDARD = "standard"     # Nuclei + Schemathesis
    FULL = "full"            # All engines including ZAP
    CONTINUOUS = "continuous" # Scheduled recurring scans


class ScanStatus(Enum):
    QUEUED = "QUEUED"
    INITIALIZING = "INITIALIZING"
    AUTHENTICATING = "AUTHENTICATING"
    SCANNING_QUICK = "SCANNING_QUICK"
    SCANNING_FUZZING = "SCANNING_FUZZING"
    SCANNING_DAST = "SCANNING_DAST"
    ANALYZING = "ANALYZING"
    GENERATING_REPORT = "GENERATING_REPORT"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


@dataclass
class ScanTarget:
    """Target configuration for security scan"""
    url: str
    openapi_spec_url: Optional[str] = None
    openapi_spec_content: Optional[str] = None
    graphql_endpoint: Optional[str] = None
    include_paths: List[str] = field(default_factory=list)
    exclude_paths: List[str] = field(default_factory=lambda: [
        "/health", "/metrics", "/ready", "/live",
        "/.well-known/*", "/favicon.ico"
    ])
    rate_limit: int = 100  # requests per second
    timeout: int = 30000   # ms per request
    max_depth: int = 10    # crawl depth


@dataclass
class Finding:
    """Security vulnerability finding"""
    id: str
    engine: str  # zap, nuclei, schemathesis
    type: str
    severity: str  # CRITICAL, HIGH, MEDIUM, LOW, INFO
    confidence: str  # HIGH, MEDIUM, LOW
    title: str
    description: str
    endpoint: str
    method: str
    parameter: Optional[str] = None
    evidence: Optional[str] = None
    request: Optional[str] = None
    response: Optional[str] = None
    remediation: Optional[str] = None
    code_fix: Optional[str] = None
    cwe_id: Optional[str] = None
    cve_id: Optional[str] = None
    cvss_score: Optional[float] = None
    owasp_category: Optional[str] = None
    compliance_mappings: Dict[str, List[str]] = field(default_factory=dict)
    references: List[str] = field(default_factory=list)
    detected_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class ScanResult:
    """Complete scan result with all findings"""
    scan_id: str
    target_url: str
    scan_type: str
    status: str
    started_at: str
    completed_at: Optional[str]
    duration_seconds: int
    findings: List[Finding]
    summary: Dict[str, Any]
    engines_used: List[str]
    auth_method: Optional[str]
    coverage: Dict[str, Any]
    compliance_summary: Dict[str, Any]
    risk_score: int

    def to_dict(self) -> Dict[str, Any]:
        result = asdict(self)
        result['findings'] = [f.to_dict() if hasattr(f, 'to_dict') else f for f in self.findings]
        return result


class ScanOrchestrator:
    """
    Main orchestration engine for VULX security scanning.

    Coordinates multiple scanning engines and provides:
    - Unified scanning interface
    - Authentication handling
    - Result aggregation and deduplication
    - Compliance mapping
    - Auto-remediation suggestions
    """

    def __init__(
        self,
        zap_api_key: Optional[str] = None,
        zap_host: str = "localhost",
        zap_port: int = 8080,
        nuclei_templates_path: str = "/opt/nuclei-templates",
        redis_url: Optional[str] = None,
        db_url: Optional[str] = None
    ):
        self.zap_engine = ZAPEngine(
            api_key=zap_api_key,
            host=zap_host,
            port=zap_port
        )
        self.nuclei_engine = NucleiEngine(
            templates_path=nuclei_templates_path
        )
        self.schemathesis_engine = SchemathesisEngine()
        self.auth_handler = AuthHandler()
        self.compliance_mapper = ComplianceMapper()
        self.remediation_engine = RemediationEngine()

        self.redis_url = redis_url
        self.db_url = db_url

        self._status_callbacks: List[callable] = []

    def on_status_change(self, callback: callable):
        """Register callback for scan status changes"""
        self._status_callbacks.append(callback)

    async def _update_status(self, scan_id: str, status: ScanStatus, progress: int = 0, message: str = ""):
        """Update scan status and notify callbacks"""
        for callback in self._status_callbacks:
            try:
                await callback(scan_id, status.value, progress, message)
            except Exception as e:
                logger.error(f"Status callback error: {e}")

    async def scan(
        self,
        target: ScanTarget,
        scan_type: ScanType = ScanType.STANDARD,
        auth_config: Optional[AuthConfig] = None,
        scan_id: Optional[str] = None
    ) -> ScanResult:
        """
        Execute a comprehensive security scan.

        Args:
            target: Target configuration
            scan_type: Type of scan to perform
            auth_config: Authentication configuration
            scan_id: Optional scan ID (generated if not provided)

        Returns:
            ScanResult with all findings
        """
        scan_id = scan_id or str(uuid.uuid4())
        started_at = datetime.utcnow()
        all_findings: List[Finding] = []
        engines_used: List[str] = []
        auth_method = None

        logger.info(f"Starting {scan_type.value} scan for {target.url}")

        try:
            await self._update_status(scan_id, ScanStatus.INITIALIZING, 5, "Initializing scan engines")

            # Handle authentication if configured
            auth_context = None
            if auth_config:
                await self._update_status(scan_id, ScanStatus.AUTHENTICATING, 10, "Authenticating to target")
                auth_context = await self.auth_handler.authenticate(auth_config)
                auth_method = auth_config.method.value
                logger.info(f"Authentication successful using {auth_method}")

            # Phase 1: Quick scan with Nuclei (always runs)
            await self._update_status(scan_id, ScanStatus.SCANNING_QUICK, 15, "Running quick vulnerability scan")
            nuclei_findings = await self.nuclei_engine.scan(
                target=target,
                auth_context=auth_context,
                severity_filter=["critical", "high", "medium", "low"]
            )
            all_findings.extend(nuclei_findings)
            engines_used.append("nuclei")
            logger.info(f"Nuclei scan complete: {len(nuclei_findings)} findings")

            if scan_type in [ScanType.STANDARD, ScanType.FULL, ScanType.CONTINUOUS]:
                # Phase 2: API Fuzzing with Schemathesis
                if target.openapi_spec_url or target.openapi_spec_content:
                    await self._update_status(scan_id, ScanStatus.SCANNING_FUZZING, 35, "Running API fuzzing tests")
                    schema_findings = await self.schemathesis_engine.scan(
                        target=target,
                        auth_context=auth_context
                    )
                    all_findings.extend(schema_findings)
                    engines_used.append("schemathesis")
                    logger.info(f"Schemathesis scan complete: {len(schema_findings)} findings")

            if scan_type in [ScanType.FULL, ScanType.CONTINUOUS]:
                # Phase 3: Full DAST with OWASP ZAP
                await self._update_status(scan_id, ScanStatus.SCANNING_DAST, 55, "Running deep DAST scan")
                zap_findings = await self.zap_engine.scan(
                    target=target,
                    auth_context=auth_context,
                    openapi_spec=target.openapi_spec_url or target.openapi_spec_content
                )
                all_findings.extend(zap_findings)
                engines_used.append("zap")
                logger.info(f"ZAP scan complete: {len(zap_findings)} findings")

            # Phase 4: Analyze and enrich findings
            await self._update_status(scan_id, ScanStatus.ANALYZING, 85, "Analyzing and enriching findings")

            # Deduplicate findings
            all_findings = self._deduplicate_findings(all_findings)

            # Add compliance mappings
            for finding in all_findings:
                finding.compliance_mappings = self.compliance_mapper.map_finding(finding)

            # Add remediation suggestions
            for finding in all_findings:
                remediation = self.remediation_engine.get_remediation(finding)
                finding.remediation = remediation.description
                finding.code_fix = remediation.code_example

            # Calculate metrics
            completed_at = datetime.utcnow()
            duration = int((completed_at - started_at).total_seconds())

            summary = self._calculate_summary(all_findings)
            coverage = self._calculate_coverage(target, all_findings, engines_used)
            compliance_summary = self.compliance_mapper.get_summary(all_findings)
            risk_score = self._calculate_risk_score(all_findings)

            await self._update_status(scan_id, ScanStatus.COMPLETED, 100, "Scan completed successfully")

            return ScanResult(
                scan_id=scan_id,
                target_url=target.url,
                scan_type=scan_type.value,
                status=ScanStatus.COMPLETED.value,
                started_at=started_at.isoformat(),
                completed_at=completed_at.isoformat(),
                duration_seconds=duration,
                findings=all_findings,
                summary=summary,
                engines_used=engines_used,
                auth_method=auth_method,
                coverage=coverage,
                compliance_summary=compliance_summary,
                risk_score=risk_score
            )

        except Exception as e:
            logger.error(f"Scan failed: {str(e)}", exc_info=True)
            await self._update_status(scan_id, ScanStatus.FAILED, 0, str(e))

            return ScanResult(
                scan_id=scan_id,
                target_url=target.url,
                scan_type=scan_type.value,
                status=ScanStatus.FAILED.value,
                started_at=started_at.isoformat(),
                completed_at=datetime.utcnow().isoformat(),
                duration_seconds=int((datetime.utcnow() - started_at).total_seconds()),
                findings=[],
                summary={"error": str(e)},
                engines_used=engines_used,
                auth_method=auth_method,
                coverage={},
                compliance_summary={},
                risk_score=0
            )

    def _deduplicate_findings(self, findings: List[Finding]) -> List[Finding]:
        """Remove duplicate findings based on type, endpoint, and parameter"""
        seen = set()
        unique = []

        for finding in findings:
            key = (finding.type, finding.endpoint, finding.method, finding.parameter)
            if key not in seen:
                seen.add(key)
                unique.append(finding)
            else:
                # Keep the finding with higher severity
                for i, existing in enumerate(unique):
                    existing_key = (existing.type, existing.endpoint, existing.method, existing.parameter)
                    if existing_key == key:
                        if self._severity_rank(finding.severity) > self._severity_rank(existing.severity):
                            unique[i] = finding
                        break

        return unique

    def _severity_rank(self, severity: str) -> int:
        """Convert severity to numeric rank for comparison"""
        ranks = {"CRITICAL": 5, "HIGH": 4, "MEDIUM": 3, "LOW": 2, "INFO": 1}
        return ranks.get(severity.upper(), 0)

    def _calculate_summary(self, findings: List[Finding]) -> Dict[str, Any]:
        """Calculate summary statistics for findings"""
        severity_counts = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0, "INFO": 0}
        by_type = {}
        by_endpoint = {}
        by_engine = {}

        for finding in findings:
            severity_counts[finding.severity] = severity_counts.get(finding.severity, 0) + 1
            by_type[finding.type] = by_type.get(finding.type, 0) + 1
            by_endpoint[finding.endpoint] = by_endpoint.get(finding.endpoint, 0) + 1
            by_engine[finding.engine] = by_engine.get(finding.engine, 0) + 1

        return {
            "total": len(findings),
            "by_severity": severity_counts,
            "by_type": by_type,
            "by_endpoint": dict(sorted(by_endpoint.items(), key=lambda x: x[1], reverse=True)[:10]),
            "by_engine": by_engine,
            "critical_count": severity_counts["CRITICAL"],
            "high_count": severity_counts["HIGH"],
            "actionable": severity_counts["CRITICAL"] + severity_counts["HIGH"]
        }

    def _calculate_coverage(
        self,
        target: ScanTarget,
        findings: List[Finding],
        engines_used: List[str]
    ) -> Dict[str, Any]:
        """Calculate scan coverage metrics"""
        endpoints_tested = set(f.endpoint for f in findings)
        methods_tested = set(f.method for f in findings)

        return {
            "endpoints_discovered": len(endpoints_tested),
            "http_methods_tested": list(methods_tested),
            "engines_used": engines_used,
            "authenticated": target is not None,
            "depth_reached": target.max_depth,
            "owasp_categories_covered": list(set(
                f.owasp_category for f in findings if f.owasp_category
            ))
        }

    def _calculate_risk_score(self, findings: List[Finding]) -> int:
        """
        Calculate overall risk score (0-100).
        Higher score = more risk
        """
        if not findings:
            return 0

        weights = {
            "CRITICAL": 25,
            "HIGH": 15,
            "MEDIUM": 5,
            "LOW": 2,
            "INFO": 0
        }

        total_weight = sum(weights.get(f.severity, 0) for f in findings)

        # Cap at 100
        return min(100, total_weight)


# Singleton instance for worker usage
_orchestrator: Optional[ScanOrchestrator] = None

def get_orchestrator(**kwargs) -> ScanOrchestrator:
    """Get or create the scan orchestrator singleton"""
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = ScanOrchestrator(**kwargs)
    return _orchestrator
