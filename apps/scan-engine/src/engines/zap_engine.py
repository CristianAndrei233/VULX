"""
OWASP ZAP Integration Engine
============================
Full DAST scanning using OWASP Zed Attack Proxy.

Capabilities:
- Active scanning (SQL injection, XSS, etc.)
- Passive scanning (security headers, cookies)
- Ajax spider for modern SPAs
- OpenAPI import for targeted scanning
- Authenticated scanning
"""

import asyncio
import logging
import json
import time
import subprocess
import os
from typing import Optional, List, Dict, Any
from dataclasses import dataclass
import aiohttp
import uuid

logger = logging.getLogger(__name__)


@dataclass
class ZAPConfig:
    """ZAP scanner configuration"""
    host: str = "localhost"
    port: int = 8080
    api_key: Optional[str] = None
    memory_limit: str = "4g"
    scan_policy: str = "Default Policy"
    ajax_spider: bool = True
    max_duration: int = 3600  # seconds
    thread_count: int = 5


class ZAPEngine:
    """
    OWASP ZAP DAST Engine

    Provides full dynamic application security testing including:
    - SQL Injection detection
    - Cross-Site Scripting (XSS)
    - Path Traversal
    - Remote Code Execution
    - Server-Side Request Forgery
    - Authentication bypass
    - And 100+ other vulnerability checks
    """

    # ZAP alert risk levels mapped to our severity
    RISK_MAP = {
        "Informational": "INFO",
        "Low": "LOW",
        "Medium": "MEDIUM",
        "High": "HIGH",
        "Critical": "CRITICAL"
    }

    # ZAP confidence levels
    CONFIDENCE_MAP = {
        "False Positive": "LOW",
        "Low": "LOW",
        "Medium": "MEDIUM",
        "High": "HIGH",
        "Confirmed": "HIGH"
    }

    # OWASP category mapping for ZAP alerts
    OWASP_MAP = {
        "SQL Injection": "API1:2023 - Broken Object Level Authorization",
        "Cross Site Scripting": "API8:2023 - Security Misconfiguration",
        "Path Traversal": "API8:2023 - Security Misconfiguration",
        "Remote File Inclusion": "API8:2023 - Security Misconfiguration",
        "External Redirect": "API8:2023 - Security Misconfiguration",
        "Session ID in URL": "API2:2023 - Broken Authentication",
        "Weak Authentication": "API2:2023 - Broken Authentication",
        "Missing Anti-CSRF": "API8:2023 - Security Misconfiguration",
        "Insecure HTTP Method": "API5:2023 - Broken Function Level Authorization",
        "Server Side Request Forgery": "API7:2023 - Server Side Request Forgery",
        "Mass Assignment": "API3:2023 - Broken Object Property Level Authorization",
        "Rate Limiting": "API4:2023 - Unrestricted Resource Consumption",
    }

    def __init__(
        self,
        api_key: Optional[str] = None,
        host: str = "localhost",
        port: int = 8080
    ):
        self.config = ZAPConfig(
            host=host,
            port=port,
            api_key=api_key or os.environ.get("ZAP_API_KEY", "")
        )
        self.base_url = f"http://{self.config.host}:{self.config.port}"
        self.session: Optional[aiohttp.ClientSession] = None
        self._zap_process: Optional[subprocess.Popen] = None

    async def _get_session(self) -> aiohttp.ClientSession:
        """Get or create HTTP session"""
        if self.session is None or self.session.closed:
            self.session = aiohttp.ClientSession()
        return self.session

    async def _zap_request(
        self,
        component: str,
        operation: str,
        params: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Make a request to ZAP API"""
        session = await self._get_session()
        params = params or {}

        if self.config.api_key:
            params["apikey"] = self.config.api_key

        url = f"{self.base_url}/JSON/{component}/action/{operation}/"

        try:
            async with session.get(url, params=params) as response:
                return await response.json()
        except Exception as e:
            logger.error(f"ZAP API error: {e}")
            raise

    async def _zap_view(
        self,
        component: str,
        view: str,
        params: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Get data from ZAP API"""
        session = await self._get_session()
        params = params or {}

        if self.config.api_key:
            params["apikey"] = self.config.api_key

        url = f"{self.base_url}/JSON/{component}/view/{view}/"

        try:
            async with session.get(url, params=params) as response:
                return await response.json()
        except Exception as e:
            logger.error(f"ZAP API error: {e}")
            raise

    async def start_zap(self) -> bool:
        """Start ZAP daemon if not running"""
        try:
            # Check if ZAP is already running
            session = await self._get_session()
            async with session.get(f"{self.base_url}/JSON/core/view/version/") as resp:
                if resp.status == 200:
                    data = await resp.json()
                    logger.info(f"ZAP already running: version {data.get('version')}")
                    return True
        except:
            pass

        # Start ZAP in daemon mode
        logger.info("Starting ZAP daemon...")
        cmd = [
            "zap.sh", "-daemon",
            "-host", self.config.host,
            "-port", str(self.config.port),
            "-config", f"api.key={self.config.api_key}",
            "-config", "api.addrs.addr.name=.*",
            "-config", "api.addrs.addr.regex=true"
        ]

        try:
            self._zap_process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )

            # Wait for ZAP to start
            for _ in range(60):  # 60 second timeout
                await asyncio.sleep(1)
                try:
                    session = await self._get_session()
                    async with session.get(f"{self.base_url}/JSON/core/view/version/") as resp:
                        if resp.status == 200:
                            logger.info("ZAP daemon started successfully")
                            return True
                except:
                    continue

            logger.error("ZAP failed to start within timeout")
            return False

        except Exception as e:
            logger.error(f"Failed to start ZAP: {e}")
            return False

    async def stop_zap(self):
        """Stop ZAP daemon"""
        try:
            await self._zap_request("core", "shutdown")
        except:
            pass

        if self._zap_process:
            self._zap_process.terminate()
            self._zap_process = None

    async def scan(
        self,
        target: Any,  # ScanTarget
        auth_context: Optional[Dict] = None,
        openapi_spec: Optional[str] = None
    ) -> List[Any]:  # List[Finding]
        """
        Execute full DAST scan with ZAP.

        Args:
            target: Scan target configuration
            auth_context: Authentication context (tokens, cookies)
            openapi_spec: OpenAPI specification URL or content

        Returns:
            List of Finding objects
        """
        from .orchestrator import Finding

        findings = []
        scan_id = str(uuid.uuid4())[:8]

        try:
            # Ensure ZAP is running
            if not await self.start_zap():
                raise RuntimeError("Failed to start ZAP")

            # Create new session
            await self._zap_request("core", "newSession", {"name": scan_id})

            # Configure authentication if provided
            if auth_context:
                await self._configure_authentication(auth_context)

            # Import OpenAPI spec if provided
            if openapi_spec:
                await self._import_openapi(openapi_spec, target.url)

            # Set scan scope
            await self._zap_request("context", "newContext", {"contextName": "vulx"})
            await self._zap_request("context", "includeInContext", {
                "contextName": "vulx",
                "regex": f"{target.url}.*"
            })

            # Exclude paths
            for path in target.exclude_paths:
                try:
                    await self._zap_request("context", "excludeFromContext", {
                        "contextName": "vulx",
                        "regex": f".*{path.replace('*', '.*')}.*"
                    })
                except:
                    pass

            # Spider the target
            logger.info(f"Starting spider on {target.url}")
            spider_result = await self._zap_request("spider", "scan", {
                "url": target.url,
                "maxChildren": 100,
                "recurse": "true",
                "contextName": "vulx"
            })
            spider_id = spider_result.get("scan", "0")

            # Wait for spider to complete
            while True:
                status = await self._zap_view("spider", "status", {"scanId": spider_id})
                progress = int(status.get("status", 0))
                if progress >= 100:
                    break
                await asyncio.sleep(2)

            logger.info("Spider complete")

            # Run Ajax Spider if enabled (for SPAs)
            if self.config.ajax_spider:
                logger.info("Starting Ajax spider")
                await self._zap_request("ajaxSpider", "scan", {
                    "url": target.url,
                    "inScope": "true"
                })

                # Wait for ajax spider
                while True:
                    status = await self._zap_view("ajaxSpider", "status")
                    if status.get("status") == "stopped":
                        break
                    await asyncio.sleep(2)

                logger.info("Ajax spider complete")

            # Run active scan
            logger.info("Starting active scan")
            scan_result = await self._zap_request("ascan", "scan", {
                "url": target.url,
                "recurse": "true",
                "inScopeOnly": "true",
                "scanPolicyName": self.config.scan_policy
            })
            active_scan_id = scan_result.get("scan", "0")

            # Wait for active scan with timeout
            start_time = time.time()
            while True:
                if time.time() - start_time > self.config.max_duration:
                    logger.warning("Active scan timeout, stopping...")
                    await self._zap_request("ascan", "stop", {"scanId": active_scan_id})
                    break

                status = await self._zap_view("ascan", "status", {"scanId": active_scan_id})
                progress = int(status.get("status", 0))

                if progress >= 100:
                    break

                await asyncio.sleep(5)

            logger.info("Active scan complete")

            # Get alerts
            alerts_response = await self._zap_view("core", "alerts", {
                "baseurl": target.url,
                "start": "0",
                "count": "10000"
            })
            alerts = alerts_response.get("alerts", [])

            # Convert alerts to findings
            for alert in alerts:
                finding = self._alert_to_finding(alert)
                if finding:
                    findings.append(finding)

            logger.info(f"ZAP scan found {len(findings)} issues")

        except Exception as e:
            logger.error(f"ZAP scan error: {e}", exc_info=True)

        return findings

    async def _configure_authentication(self, auth_context: Dict):
        """Configure ZAP with authentication context"""
        if auth_context.get("bearer_token"):
            # Add Authorization header
            await self._zap_request("replacer", "addRule", {
                "description": "Auth Header",
                "enabled": "true",
                "matchType": "REQ_HEADER",
                "matchRegex": "false",
                "matchString": "Authorization",
                "replacement": f"Bearer {auth_context['bearer_token']}",
                "initiators": ""
            })

        if auth_context.get("cookies"):
            # Set cookies
            for name, value in auth_context["cookies"].items():
                await self._zap_request("httpsessions", "setSessionTokenValue", {
                    "session": "default",
                    "sessionToken": name,
                    "tokenValue": value
                })

        if auth_context.get("headers"):
            # Add custom headers
            for header, value in auth_context["headers"].items():
                await self._zap_request("replacer", "addRule", {
                    "description": f"Custom Header: {header}",
                    "enabled": "true",
                    "matchType": "REQ_HEADER",
                    "matchRegex": "false",
                    "matchString": header,
                    "replacement": value,
                    "initiators": ""
                })

    async def _import_openapi(self, spec: str, target_url: str):
        """Import OpenAPI specification into ZAP"""
        try:
            if spec.startswith("http"):
                # Import from URL
                await self._zap_request("openapi", "importUrl", {
                    "url": spec,
                    "hostOverride": target_url
                })
            else:
                # Import from content (file)
                await self._zap_request("openapi", "importFile", {
                    "file": spec,
                    "hostOverride": target_url
                })
            logger.info("OpenAPI spec imported successfully")
        except Exception as e:
            logger.warning(f"Failed to import OpenAPI spec: {e}")

    def _alert_to_finding(self, alert: Dict) -> Optional[Any]:
        """Convert ZAP alert to Finding object"""
        from .orchestrator import Finding

        try:
            severity = self.RISK_MAP.get(alert.get("risk", ""), "INFO")
            confidence = self.CONFIDENCE_MAP.get(alert.get("confidence", ""), "MEDIUM")

            # Parse URL for endpoint
            url = alert.get("url", "")
            endpoint = url.split("?")[0] if url else ""
            if endpoint:
                # Extract path from URL
                from urllib.parse import urlparse
                parsed = urlparse(endpoint)
                endpoint = parsed.path or "/"

            # Get OWASP category
            alert_name = alert.get("name", "")
            owasp_category = None
            for key, value in self.OWASP_MAP.items():
                if key.lower() in alert_name.lower():
                    owasp_category = value
                    break

            return Finding(
                id=f"zap-{alert.get('alertRef', uuid.uuid4().hex[:8])}",
                engine="zap",
                type=alert_name,
                severity=severity,
                confidence=confidence,
                title=alert_name,
                description=alert.get("description", ""),
                endpoint=endpoint,
                method=alert.get("method", "GET"),
                parameter=alert.get("param"),
                evidence=alert.get("evidence"),
                request=alert.get("request"),
                response=alert.get("response"),
                remediation=alert.get("solution"),
                cwe_id=f"CWE-{alert.get('cweid')}" if alert.get("cweid") else None,
                owasp_category=owasp_category,
                references=alert.get("reference", "").split("\n") if alert.get("reference") else []
            )
        except Exception as e:
            logger.error(f"Error converting ZAP alert: {e}")
            return None

    async def quick_scan(self, url: str) -> List[Any]:
        """Run a quick passive scan (no active attacks)"""
        from .orchestrator import Finding

        findings = []

        try:
            if not await self.start_zap():
                return findings

            # Just spider and collect passive alerts
            await self._zap_request("spider", "scan", {"url": url})

            # Wait a bit for passive scanner
            await asyncio.sleep(10)

            alerts = await self._zap_view("core", "alerts", {"baseurl": url})

            for alert in alerts.get("alerts", []):
                finding = self._alert_to_finding(alert)
                if finding:
                    findings.append(finding)

        except Exception as e:
            logger.error(f"Quick scan error: {e}")

        return findings

    async def close(self):
        """Cleanup resources"""
        if self.session:
            await self.session.close()
