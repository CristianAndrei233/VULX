"""
Schemathesis API Fuzzing Engine
===============================
Property-based testing and fuzzing for APIs based on OpenAPI schemas.

Capabilities:
- Automatic test generation from OpenAPI specs
- Edge case and boundary testing
- Schema validation
- State machine testing
- Response validation
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
class SchemathesisConfig:
    """Schemathesis configuration"""
    hypothesis_max_examples: int = 100
    hypothesis_deadline: int = 15000  # ms
    workers: int = 4
    request_timeout: int = 30000  # ms
    validate_schema: bool = True
    stateful: bool = True
    checks: List[str] = None

    def __post_init__(self):
        if self.checks is None:
            self.checks = [
                "not_a_server_error",
                "status_code_conformance",
                "content_type_conformance",
                "response_schema_conformance",
                "response_headers_conformance",
                "negative_data_rejection",
                "use_after_free",
            ]


class SchemathesisEngine:
    """
    Schemathesis-based API fuzzing engine.

    Generates test cases from OpenAPI specs to find:
    - Server errors (500s)
    - Schema violations
    - Edge case handling issues
    - State-dependent bugs
    - Data validation bypasses
    """

    # Failure type to severity mapping
    FAILURE_SEVERITY_MAP = {
        "server_error": "HIGH",
        "status_code_conformance": "MEDIUM",
        "content_type_conformance": "LOW",
        "response_schema_conformance": "MEDIUM",
        "response_headers_conformance": "LOW",
        "negative_data_rejection": "HIGH",
        "use_after_free": "CRITICAL",
    }

    # OWASP category mapping
    OWASP_MAP = {
        "server_error": "API8:2023 - Security Misconfiguration",
        "status_code_conformance": "API8:2023 - Security Misconfiguration",
        "response_schema_conformance": "API3:2023 - Broken Object Property Level Authorization",
        "negative_data_rejection": "API8:2023 - Security Misconfiguration",
        "use_after_free": "API1:2023 - Broken Object Level Authorization",
    }

    def __init__(self):
        self.config = SchemathesisConfig()
        self._check_schemathesis_installed()

    def _check_schemathesis_installed(self):
        """Verify Schemathesis is installed"""
        try:
            result = subprocess.run(
                ["schemathesis", "--version"],
                capture_output=True,
                text=True,
                timeout=10
            )
            if result.returncode == 0:
                logger.info(f"Schemathesis found: {result.stdout.strip()}")
            else:
                logger.warning("Schemathesis not found")
        except FileNotFoundError:
            logger.warning("Schemathesis binary not found in PATH")
        except Exception as e:
            logger.warning(f"Error checking Schemathesis: {e}")

    async def scan(
        self,
        target: Any,  # ScanTarget
        auth_context: Optional[Dict] = None
    ) -> List[Any]:  # List[Finding]
        """
        Execute API fuzzing scan.

        Args:
            target: Scan target with OpenAPI spec
            auth_context: Authentication context

        Returns:
            List of Finding objects
        """
        from .orchestrator import Finding

        findings = []

        # Get OpenAPI spec
        spec_source = target.openapi_spec_url or target.openapi_spec_content
        if not spec_source:
            logger.warning("No OpenAPI spec provided for Schemathesis")
            return findings

        try:
            # Create temp file for results
            with tempfile.NamedTemporaryFile(
                mode='w',
                suffix='.json',
                delete=False
            ) as results_file:
                results_path = results_file.name

            # Build Schemathesis command
            cmd = [
                "schemathesis", "run",
                spec_source,
                "--base-url", target.url,
                "--hypothesis-max-examples", str(self.config.hypothesis_max_examples),
                "--hypothesis-deadline", str(self.config.hypothesis_deadline),
                "--workers", str(self.config.workers),
                "--request-timeout", str(self.config.request_timeout),
                "--junit-xml", results_path,
                "--no-color",
            ]

            # Add checks
            for check in self.config.checks:
                cmd.extend(["--checks", check])

            # Enable stateful testing
            if self.config.stateful:
                cmd.append("--stateful=links")

            # Add authentication
            if auth_context:
                if auth_context.get("bearer_token"):
                    cmd.extend([
                        "--header",
                        f"Authorization: Bearer {auth_context['bearer_token']}"
                    ])
                if auth_context.get("headers"):
                    for k, v in auth_context["headers"].items():
                        cmd.extend(["--header", f"{k}: {v}"])
                if auth_context.get("cookies"):
                    cookie_str = "; ".join(
                        f"{k}={v}" for k, v in auth_context["cookies"].items()
                    )
                    cmd.extend(["--header", f"Cookie: {cookie_str}"])

            logger.info(f"Running Schemathesis fuzzing on {target.url}")

            # Run Schemathesis
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )

            stdout, stderr = await asyncio.wait_for(
                process.communicate(),
                timeout=900  # 15 minute timeout
            )

            output = stdout.decode() if stdout else ""
            errors = stderr.decode() if stderr else ""

            # Parse output for failures
            findings.extend(self._parse_output(output, target.url))

            # Also try to parse the JUnit XML if created
            if os.path.exists(results_path):
                findings.extend(self._parse_junit_results(results_path, target.url))
                os.unlink(results_path)

            # Deduplicate findings
            seen = set()
            unique_findings = []
            for f in findings:
                key = (f.type, f.endpoint, f.method)
                if key not in seen:
                    seen.add(key)
                    unique_findings.append(f)

            logger.info(f"Schemathesis found {len(unique_findings)} issues")
            return unique_findings

        except asyncio.TimeoutError:
            logger.error("Schemathesis scan timed out")
        except Exception as e:
            logger.error(f"Schemathesis scan error: {e}", exc_info=True)

        return findings

    def _parse_output(self, output: str, base_url: str) -> List[Any]:
        """Parse Schemathesis CLI output for failures"""
        from .orchestrator import Finding

        findings = []

        try:
            lines = output.split("\n")
            current_failure = None
            current_endpoint = None
            current_method = None

            for line in lines:
                line = line.strip()

                # Detect endpoint being tested
                if " -> " in line and any(m in line for m in ["GET", "POST", "PUT", "DELETE", "PATCH"]):
                    parts = line.split()
                    for i, part in enumerate(parts):
                        if part in ["GET", "POST", "PUT", "DELETE", "PATCH"]:
                            current_method = part
                            if i + 1 < len(parts):
                                current_endpoint = parts[i + 1]
                            break

                # Detect failures
                if "FAILED" in line or "ERROR" in line:
                    failure_type = "server_error"

                    if "status_code" in line.lower():
                        failure_type = "status_code_conformance"
                    elif "content_type" in line.lower():
                        failure_type = "content_type_conformance"
                    elif "schema" in line.lower():
                        failure_type = "response_schema_conformance"
                    elif "500" in line or "Internal Server Error" in line:
                        failure_type = "server_error"

                    if current_endpoint:
                        findings.append(Finding(
                            id=f"schema-{failure_type}-{uuid.uuid4().hex[:8]}",
                            engine="schemathesis",
                            type=f"API Fuzzing: {failure_type.replace('_', ' ').title()}",
                            severity=self.FAILURE_SEVERITY_MAP.get(failure_type, "MEDIUM"),
                            confidence="HIGH",
                            title=f"API endpoint fails {failure_type.replace('_', ' ')} check",
                            description=f"The API endpoint returned unexpected behavior during fuzz testing. This could indicate improper input validation or error handling.",
                            endpoint=current_endpoint,
                            method=current_method or "GET",
                            evidence=line,
                            owasp_category=self.OWASP_MAP.get(failure_type),
                            cwe_id="CWE-20" if "validation" in failure_type else "CWE-754"
                        ))

        except Exception as e:
            logger.error(f"Error parsing Schemathesis output: {e}")

        return findings

    def _parse_junit_results(self, results_path: str, base_url: str) -> List[Any]:
        """Parse JUnit XML results from Schemathesis"""
        from .orchestrator import Finding
        import xml.etree.ElementTree as ET

        findings = []

        try:
            tree = ET.parse(results_path)
            root = tree.getroot()

            for testcase in root.findall(".//testcase"):
                name = testcase.get("name", "")
                classname = testcase.get("classname", "")

                # Parse endpoint and method from test name
                endpoint = "/"
                method = "GET"

                if "[" in name and "]" in name:
                    # Format: "test_api[GET /path]"
                    bracket_content = name[name.find("[")+1:name.find("]")]
                    parts = bracket_content.split()
                    if len(parts) >= 2:
                        method = parts[0]
                        endpoint = parts[1]

                # Check for failures
                failure = testcase.find("failure")
                error = testcase.find("error")

                if failure is not None or error is not None:
                    element = failure if failure is not None else error
                    message = element.get("message", "Test failed")
                    failure_type = element.get("type", "assertion_error")

                    # Determine severity based on failure type
                    severity = "MEDIUM"
                    if "500" in message or "server" in message.lower():
                        severity = "HIGH"
                    elif "schema" in message.lower():
                        severity = "MEDIUM"

                    findings.append(Finding(
                        id=f"schema-{uuid.uuid4().hex[:8]}",
                        engine="schemathesis",
                        type=f"API Fuzzing: {failure_type}",
                        severity=severity,
                        confidence="HIGH",
                        title=f"API test failure: {failure_type}",
                        description=message,
                        endpoint=endpoint,
                        method=method,
                        evidence=element.text if element.text else None,
                        owasp_category="API8:2023 - Security Misconfiguration",
                        cwe_id="CWE-754"
                    ))

        except Exception as e:
            logger.error(f"Error parsing JUnit results: {e}")

        return findings

    async def stateful_scan(
        self,
        target: Any,
        auth_context: Optional[Dict] = None
    ) -> List[Any]:
        """
        Run stateful API testing to find state-dependent bugs.

        This tests sequences of API calls to find issues like:
        - Use-after-delete vulnerabilities
        - Race conditions
        - State corruption
        """
        # Enable extra stateful testing
        original_stateful = self.config.stateful
        self.config.stateful = True

        try:
            return await self.scan(target, auth_context)
        finally:
            self.config.stateful = original_stateful
