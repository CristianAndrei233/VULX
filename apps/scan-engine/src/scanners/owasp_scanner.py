"""
OWASP API Security Top 10 (2023) Scanner
Comprehensive static analysis of OpenAPI specifications for security vulnerabilities.
"""

import re
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
import uuid


@dataclass
class Finding:
    """Represents a security finding/vulnerability."""
    type: str
    severity: str  # CRITICAL, HIGH, MEDIUM, LOW, INFO
    description: str
    endpoint: str
    method: str
    remediation: str
    owasp_category: str
    cwe_id: Optional[str] = None
    evidence: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class OWASPScanner:
    """
    Scans OpenAPI specifications for OWASP API Security Top 10 vulnerabilities.

    OWASP API Security Top 10 (2023):
    - API1: Broken Object Level Authorization (BOLA)
    - API2: Broken Authentication
    - API3: Broken Object Property Level Authorization
    - API4: Unrestricted Resource Consumption
    - API5: Broken Function Level Authorization
    - API6: Unrestricted Access to Sensitive Business Flows
    - API7: Server-Side Request Forgery (SSRF)
    - API8: Security Misconfiguration
    - API9: Improper Inventory Management
    - API10: Unsafe Consumption of APIs
    """

    # Patterns for detecting sensitive data
    SENSITIVE_FIELDS = [
        'password', 'passwd', 'secret', 'token', 'apikey', 'api_key', 'api-key',
        'auth', 'credential', 'private', 'ssn', 'social_security', 'credit_card',
        'card_number', 'cvv', 'pin', 'bank_account', 'routing_number', 'access_token',
        'refresh_token', 'bearer', 'jwt', 'session', 'cookie'
    ]

    # Patterns for detecting ID parameters (potential BOLA)
    ID_PATTERNS = [
        r'\{.*id\}', r'\{.*Id\}', r'\{.*ID\}',
        r'\{user.*\}', r'\{account.*\}', r'\{order.*\}',
        r'\{customer.*\}', r'\{profile.*\}', r'\{document.*\}',
        r'\{file.*\}', r'\{record.*\}', r'\{item.*\}'
    ]

    # Patterns for admin/privileged endpoints
    ADMIN_PATTERNS = [
        'admin', 'manage', 'management', 'internal', 'system', 'config',
        'configuration', 'settings', 'control', 'super', 'root', 'master',
        'privileged', 'staff', 'operator', 'debug', 'test', 'dev'
    ]

    # Patterns for sensitive business flows
    BUSINESS_FLOW_PATTERNS = [
        'payment', 'pay', 'checkout', 'purchase', 'buy', 'order', 'transaction',
        'transfer', 'withdraw', 'deposit', 'refund', 'invoice', 'billing',
        'subscription', 'upgrade', 'downgrade', 'cancel', 'delete', 'remove',
        'approve', 'reject', 'verify', 'confirm', 'reset', 'change-password',
        'change_password', 'forgot-password', 'forgot_password', 'signup', 'register'
    ]

    # Patterns for potential SSRF
    SSRF_PATTERNS = [
        'url', 'uri', 'link', 'callback', 'webhook', 'redirect', 'return_url',
        'returnUrl', 'return-url', 'next', 'destination', 'target', 'fetch',
        'proxy', 'forward', 'load', 'image_url', 'imageUrl', 'image-url',
        'file_url', 'fileUrl', 'file-url', 'resource', 'source'
    ]

    # Common weak authentication patterns
    WEAK_AUTH_PATTERNS = [
        'basic', 'apiKey', 'api_key'
    ]

    def __init__(self, spec: Dict[str, Any]):
        """
        Initialize the scanner with an OpenAPI specification.

        Args:
            spec: Parsed OpenAPI specification dictionary
        """
        self.spec = spec
        self.findings: List[Finding] = []
        self.openapi_version = spec.get('openapi', spec.get('swagger', '2.0'))
        self.security_definitions = self._get_security_definitions()
        self.global_security = spec.get('security', [])

    def _get_security_definitions(self) -> Dict[str, Any]:
        """Get security definitions from spec (handles both OpenAPI 2.0 and 3.x)."""
        if 'securityDefinitions' in self.spec:
            return self.spec['securityDefinitions']
        elif 'components' in self.spec and 'securitySchemes' in self.spec['components']:
            return self.spec['components']['securitySchemes']
        return {}

    def scan(self) -> List[Dict[str, Any]]:
        """
        Run all OWASP API Top 10 checks on the specification.

        Returns:
            List of findings as dictionaries
        """
        paths = self.spec.get('paths', {})

        for path, path_item in paths.items():
            if not isinstance(path_item, dict):
                continue

            for method, operation in path_item.items():
                if method.lower() in ['get', 'post', 'put', 'patch', 'delete', 'head', 'options']:
                    if isinstance(operation, dict):
                        self._scan_endpoint(path, method.upper(), operation)

        # Run spec-level checks
        self._check_global_security()
        self._check_inventory_management()

        return [f.to_dict() for f in self.findings]

    def _scan_endpoint(self, path: str, method: str, operation: Dict[str, Any]):
        """Scan a single endpoint for vulnerabilities."""
        # API1: Broken Object Level Authorization (BOLA)
        self._check_bola(path, method, operation)

        # API2: Broken Authentication
        self._check_authentication(path, method, operation)

        # API3: Broken Object Property Level Authorization
        self._check_property_authorization(path, method, operation)

        # API4: Unrestricted Resource Consumption
        self._check_resource_consumption(path, method, operation)

        # API5: Broken Function Level Authorization
        self._check_function_authorization(path, method, operation)

        # API6: Unrestricted Access to Sensitive Business Flows
        self._check_sensitive_flows(path, method, operation)

        # API7: Server-Side Request Forgery (SSRF)
        self._check_ssrf(path, method, operation)

        # API8: Security Misconfiguration
        self._check_security_misconfiguration(path, method, operation)

        # API10: Unsafe Consumption of APIs
        self._check_unsafe_api_consumption(path, method, operation)

    # ============================================================
    # API1: Broken Object Level Authorization (BOLA)
    # ============================================================
    def _check_bola(self, path: str, method: str, operation: Dict[str, Any]):
        """
        Check for potential Broken Object Level Authorization vulnerabilities.
        Detects endpoints with ID parameters that might allow unauthorized object access.
        """
        for pattern in self.ID_PATTERNS:
            if re.search(pattern, path, re.IGNORECASE):
                # Check if there's any security defined
                has_security = self._endpoint_has_security(operation)

                severity = 'HIGH' if not has_security else 'MEDIUM'
                security_note = ' No authentication/authorization defined for this endpoint.' if not has_security else ''

                self.findings.append(Finding(
                    type='BOLA',
                    severity=severity,
                    description=f'Endpoint contains object identifier parameter that may be vulnerable to BOLA attacks. '
                               f'Attackers could manipulate the ID to access unauthorized resources.{security_note}',
                    endpoint=path,
                    method=method,
                    remediation=(
                        '1. Implement object-level authorization checks in your business logic.\n'
                        '2. Verify the authenticated user has permission to access the requested resource.\n'
                        '3. Use indirect references (e.g., user-specific indices) instead of direct database IDs.\n'
                        '4. Example (Node.js):\n'
                        '   const resource = await Resource.findById(req.params.id);\n'
                        '   if (resource.ownerId !== req.user.id) {\n'
                        '     return res.status(403).json({ error: "Forbidden" });\n'
                        '   }'
                    ),
                    owasp_category='API1:2023 - Broken Object Level Authorization',
                    cwe_id='CWE-639',
                    evidence=f'Path parameter pattern detected: {path}'
                ))
                break  # Only report once per endpoint

    # ============================================================
    # API2: Broken Authentication
    # ============================================================
    def _check_authentication(self, path: str, method: str, operation: Dict[str, Any]):
        """Check for broken or missing authentication."""
        has_security = self._endpoint_has_security(operation)

        # Check if it's a sensitive endpoint without auth
        is_sensitive = any(
            pattern in path.lower()
            for pattern in self.BUSINESS_FLOW_PATTERNS + self.ADMIN_PATTERNS
        )

        if not has_security:
            severity = 'CRITICAL' if is_sensitive else 'HIGH'
            self.findings.append(Finding(
                type='AUTH_MISSING',
                severity=severity,
                description=f'No authentication defined for {"sensitive " if is_sensitive else ""}endpoint. '
                           f'This may allow unauthorized access to the API.',
                endpoint=path,
                method=method,
                remediation=(
                    '1. Add security requirements to this endpoint in your OpenAPI spec.\n'
                    '2. Implement proper authentication (OAuth2, JWT, API keys with proper scoping).\n'
                    '3. Example OpenAPI security:\n'
                    '   security:\n'
                    '     - bearerAuth: []\n'
                    '4. Validate tokens server-side and check expiration.\n'
                    '5. Use HTTPS to protect credentials in transit.'
                ),
                owasp_category='API2:2023 - Broken Authentication',
                cwe_id='CWE-306'
            ))
        else:
            # Check for weak authentication schemes
            security_schemes = self._get_endpoint_security_schemes(operation)
            for scheme_name, scheme in security_schemes.items():
                scheme_type = scheme.get('type', '').lower()

                if scheme_type == 'http' and scheme.get('scheme', '').lower() == 'basic':
                    self.findings.append(Finding(
                        type='WEAK_AUTH',
                        severity='MEDIUM',
                        description='Basic authentication is used. While functional, it transmits credentials '
                                   'in easily decodable format and lacks modern security features.',
                        endpoint=path,
                        method=method,
                        remediation=(
                            '1. Upgrade to token-based authentication (JWT, OAuth2).\n'
                            '2. If Basic auth is required, ensure HTTPS is enforced.\n'
                            '3. Implement rate limiting to prevent brute force attacks.\n'
                            '4. Consider adding MFA for sensitive operations.'
                        ),
                        owasp_category='API2:2023 - Broken Authentication',
                        cwe_id='CWE-287'
                    ))

                if scheme_type == 'apikey':
                    api_key_in = scheme.get('in', '')
                    if api_key_in == 'query':
                        self.findings.append(Finding(
                            type='APIKEY_IN_QUERY',
                            severity='MEDIUM',
                            description='API key is passed in query string. This can expose the key in '
                                       'browser history, server logs, and referrer headers.',
                            endpoint=path,
                            method=method,
                            remediation=(
                                '1. Move API key to request header instead of query parameter.\n'
                                '2. Example: Use "Authorization: Bearer <key>" or custom header.\n'
                                '3. Ensure keys are not logged by your server.\n'
                                '4. Implement key rotation policies.'
                            ),
                            owasp_category='API2:2023 - Broken Authentication',
                            cwe_id='CWE-598'
                        ))

    # ============================================================
    # API3: Broken Object Property Level Authorization
    # ============================================================
    def _check_property_authorization(self, path: str, method: str, operation: Dict[str, Any]):
        """Check for mass assignment and excessive data exposure vulnerabilities."""
        # Check request body for mass assignment (POST, PUT, PATCH)
        if method in ['POST', 'PUT', 'PATCH']:
            request_body = operation.get('requestBody', {})
            if self._has_sensitive_properties_in_schema(request_body):
                self.findings.append(Finding(
                    type='MASS_ASSIGNMENT',
                    severity='HIGH',
                    description='Request body may accept sensitive properties that should not be user-controllable. '
                               'This could allow attackers to modify privileged fields.',
                    endpoint=path,
                    method=method,
                    remediation=(
                        '1. Create separate DTOs for input that only include allowed fields.\n'
                        '2. Explicitly whitelist properties that users can modify.\n'
                        '3. Never bind request data directly to database models.\n'
                        '4. Example (Node.js):\n'
                        '   const allowed = ["name", "email"]; // whitelist\n'
                        '   const safeData = _.pick(req.body, allowed);\n'
                        '5. Remove sensitive fields (role, isAdmin, etc.) from input schemas.'
                    ),
                    owasp_category='API3:2023 - Broken Object Property Level Authorization',
                    cwe_id='CWE-915'
                ))

        # Check responses for excessive data exposure
        responses = operation.get('responses', {})
        for status_code, response in responses.items():
            if str(status_code).startswith('2'):  # Success responses
                if self._response_may_expose_sensitive_data(response):
                    self.findings.append(Finding(
                        type='EXCESSIVE_DATA_EXPOSURE',
                        severity='MEDIUM',
                        description='Response may expose sensitive data fields. Review the response schema '
                                   'to ensure only necessary data is returned.',
                        endpoint=path,
                        method=method,
                        remediation=(
                            '1. Return only the data necessary for the client.\n'
                            '2. Use response DTOs to filter out sensitive fields.\n'
                            '3. Implement field-level filtering based on user roles.\n'
                            '4. Never return password hashes, tokens, or internal IDs.\n'
                            '5. Example: Remove fields like "passwordHash", "internalId" from responses.'
                        ),
                        owasp_category='API3:2023 - Broken Object Property Level Authorization',
                        cwe_id='CWE-213'
                    ))
                    break

    # ============================================================
    # API4: Unrestricted Resource Consumption
    # ============================================================
    def _check_resource_consumption(self, path: str, method: str, operation: Dict[str, Any]):
        """Check for lack of rate limiting and resource constraints."""
        # Check for pagination parameters on GET endpoints
        if method == 'GET':
            parameters = operation.get('parameters', [])
            has_pagination = any(
                p.get('name', '').lower() in ['limit', 'page', 'pagesize', 'page_size', 'per_page', 'offset']
                for p in parameters
            )

            # Check if it might return a list (heuristic based on path and operation)
            might_return_list = not any(
                re.search(pattern, path, re.IGNORECASE)
                for pattern in [r'\{[^}]+\}$']  # Doesn't end with ID parameter
            ) or 'list' in path.lower() or path.endswith('s')

            if might_return_list and not has_pagination:
                self.findings.append(Finding(
                    type='NO_PAGINATION',
                    severity='MEDIUM',
                    description='List endpoint may lack pagination controls. This could allow attackers '
                               'to request excessive data, causing performance issues or denial of service.',
                    endpoint=path,
                    method=method,
                    remediation=(
                        '1. Implement pagination with limit and offset/cursor parameters.\n'
                        '2. Set reasonable default and maximum limits.\n'
                        '3. Example: GET /users?limit=20&page=1 (max limit: 100)\n'
                        '4. Return total count in response headers or body.\n'
                        '5. Consider cursor-based pagination for large datasets.'
                    ),
                    owasp_category='API4:2023 - Unrestricted Resource Consumption',
                    cwe_id='CWE-770'
                ))

        # Check for file upload endpoints without size limits
        if method in ['POST', 'PUT']:
            request_body = operation.get('requestBody', {})
            content = request_body.get('content', {})

            for content_type in content:
                if 'multipart' in content_type or 'octet-stream' in content_type:
                    self.findings.append(Finding(
                        type='FILE_UPLOAD_NO_LIMIT',
                        severity='MEDIUM',
                        description='File upload endpoint detected. Ensure proper size limits and '
                                   'file type validation are implemented to prevent resource exhaustion.',
                        endpoint=path,
                        method=method,
                        remediation=(
                            '1. Implement file size limits (e.g., max 10MB).\n'
                            '2. Validate file types against a whitelist.\n'
                            '3. Scan uploaded files for malware.\n'
                            '4. Store files outside web root.\n'
                            '5. Example (Express.js):\n'
                            '   const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } });'
                        ),
                        owasp_category='API4:2023 - Unrestricted Resource Consumption',
                        cwe_id='CWE-400'
                    ))
                    break

        # General rate limiting check
        # Since rate limiting is typically not in OpenAPI spec, flag all modifying operations
        if method in ['POST', 'PUT', 'DELETE', 'PATCH']:
            self.findings.append(Finding(
                type='RATE_LIMIT_RECOMMENDED',
                severity='LOW',
                description='Ensure rate limiting is implemented for this modifying endpoint to prevent '
                           'abuse and denial of service attacks.',
                endpoint=path,
                method=method,
                remediation=(
                    '1. Implement rate limiting per user/IP.\n'
                    '2. Use sliding window or token bucket algorithms.\n'
                    '3. Return 429 Too Many Requests when limit exceeded.\n'
                    '4. Include rate limit headers: X-RateLimit-Limit, X-RateLimit-Remaining.\n'
                    '5. Example (Express.js):\n'
                    '   const limiter = rateLimit({ windowMs: 60000, max: 100 });\n'
                    '   app.use("/api/", limiter);'
                ),
                owasp_category='API4:2023 - Unrestricted Resource Consumption',
                cwe_id='CWE-770'
            ))

    # ============================================================
    # API5: Broken Function Level Authorization
    # ============================================================
    def _check_function_authorization(self, path: str, method: str, operation: Dict[str, Any]):
        """Check for administrative or privileged endpoints with potential authorization issues."""
        path_lower = path.lower()

        for pattern in self.ADMIN_PATTERNS:
            if pattern in path_lower:
                has_security = self._endpoint_has_security(operation)

                if not has_security:
                    self.findings.append(Finding(
                        type='ADMIN_NO_AUTH',
                        severity='CRITICAL',
                        description=f'Administrative endpoint "{path}" has no authentication defined. '
                                   f'This could allow unauthorized access to privileged functions.',
                        endpoint=path,
                        method=method,
                        remediation=(
                            '1. Require authentication for all admin endpoints.\n'
                            '2. Implement role-based access control (RBAC).\n'
                            '3. Verify user has admin/appropriate role before processing.\n'
                            '4. Log all access attempts to admin functions.\n'
                            '5. Consider IP whitelisting for sensitive admin operations.'
                        ),
                        owasp_category='API5:2023 - Broken Function Level Authorization',
                        cwe_id='CWE-285'
                    ))
                else:
                    self.findings.append(Finding(
                        type='ADMIN_ENDPOINT',
                        severity='INFO',
                        description=f'Administrative endpoint detected. Ensure proper role-based '
                                   f'access control is implemented beyond just authentication.',
                        endpoint=path,
                        method=method,
                        remediation=(
                            '1. Implement role checks (e.g., isAdmin, hasRole("admin")).\n'
                            '2. Use principle of least privilege.\n'
                            '3. Separate admin APIs on different subdomain if possible.\n'
                            '4. Implement audit logging for all admin actions.'
                        ),
                        owasp_category='API5:2023 - Broken Function Level Authorization',
                        cwe_id='CWE-285'
                    ))
                break

    # ============================================================
    # API6: Unrestricted Access to Sensitive Business Flows
    # ============================================================
    def _check_sensitive_flows(self, path: str, method: str, operation: Dict[str, Any]):
        """Check for sensitive business flows that need additional protection."""
        path_lower = path.lower()

        for pattern in self.BUSINESS_FLOW_PATTERNS:
            if pattern in path_lower:
                has_security = self._endpoint_has_security(operation)

                severity = 'HIGH' if not has_security else 'MEDIUM'

                self.findings.append(Finding(
                    type='SENSITIVE_FLOW',
                    severity=severity,
                    description=f'Sensitive business flow endpoint detected ({pattern}). '
                               f'This endpoint may require additional protection against automated abuse.',
                    endpoint=path,
                    method=method,
                    remediation=(
                        '1. Implement CAPTCHA or proof-of-work for user-facing flows.\n'
                        '2. Add velocity checks (e.g., max 3 password resets per hour).\n'
                        '3. Require step-up authentication for sensitive operations.\n'
                        '4. Implement transaction signing for financial operations.\n'
                        '5. Monitor for anomalous patterns (e.g., bulk purchases).\n'
                        '6. Consider adding confirmation steps (email/SMS verification).'
                    ),
                    owasp_category='API6:2023 - Unrestricted Access to Sensitive Business Flows',
                    cwe_id='CWE-799'
                ))
                break

    # ============================================================
    # API7: Server-Side Request Forgery (SSRF)
    # ============================================================
    def _check_ssrf(self, path: str, method: str, operation: Dict[str, Any]):
        """Check for potential SSRF vulnerabilities."""
        parameters = operation.get('parameters', [])

        for param in parameters:
            param_name = param.get('name', '').lower()

            for ssrf_pattern in self.SSRF_PATTERNS:
                if ssrf_pattern in param_name:
                    self.findings.append(Finding(
                        type='SSRF_RISK',
                        severity='HIGH',
                        description=f'Parameter "{param.get("name")}" may be used to fetch external resources. '
                                   f'This could be exploited for Server-Side Request Forgery attacks.',
                        endpoint=path,
                        method=method,
                        remediation=(
                            '1. Validate and sanitize all URL inputs.\n'
                            '2. Use allowlist for permitted domains/IPs.\n'
                            '3. Block requests to internal networks (10.x, 172.16.x, 192.168.x, localhost).\n'
                            '4. Disable unnecessary URL schemes (file://, gopher://, etc.).\n'
                            '5. Use a dedicated service/proxy for external requests.\n'
                            '6. Example validation:\n'
                            '   const url = new URL(input);\n'
                            '   if (!ALLOWED_DOMAINS.includes(url.hostname)) throw new Error("Blocked");'
                        ),
                        owasp_category='API7:2023 - Server Side Request Forgery',
                        cwe_id='CWE-918',
                        evidence=f'Suspicious parameter: {param.get("name")}'
                    ))
                    break

        # Check request body for URL fields
        request_body = operation.get('requestBody', {})
        if self._has_url_properties_in_schema(request_body):
            self.findings.append(Finding(
                type='SSRF_BODY_RISK',
                severity='MEDIUM',
                description='Request body contains URL-like properties. Ensure proper validation '
                           'to prevent SSRF attacks.',
                endpoint=path,
                method=method,
                remediation=(
                    '1. Validate all URL inputs against an allowlist.\n'
                    '2. Never fetch URLs provided by users without validation.\n'
                    '3. Use URL parser to extract and validate hostname.\n'
                    '4. Block private IP ranges and localhost.\n'
                    '5. Set timeouts for external requests.'
                ),
                owasp_category='API7:2023 - Server Side Request Forgery',
                cwe_id='CWE-918'
            ))

    # ============================================================
    # API8: Security Misconfiguration
    # ============================================================
    def _check_security_misconfiguration(self, path: str, method: str, operation: Dict[str, Any]):
        """Check for security misconfigurations."""
        path_lower = path.lower()

        # Check for debug/test endpoints
        debug_patterns = ['debug', 'test', 'dev', 'staging', 'swagger', 'docs', 'graphql', 'playground']
        for pattern in debug_patterns:
            if pattern in path_lower:
                self.findings.append(Finding(
                    type='DEBUG_ENDPOINT',
                    severity='MEDIUM' if pattern not in ['swagger', 'docs', 'graphql'] else 'LOW',
                    description=f'Development/debug endpoint detected. Ensure this is disabled '
                               f'or properly protected in production.',
                    endpoint=path,
                    method=method,
                    remediation=(
                        '1. Disable debug endpoints in production.\n'
                        '2. Use environment variables to control endpoint availability.\n'
                        '3. If needed, protect with authentication and IP whitelisting.\n'
                        '4. Remove Swagger/API docs from production or protect them.\n'
                        '5. Set DEBUG=false and proper NODE_ENV in production.'
                    ),
                    owasp_category='API8:2023 - Security Misconfiguration',
                    cwe_id='CWE-489'
                ))
                break

        # Check for verbose error responses
        responses = operation.get('responses', {})
        for status_code, response in responses.items():
            if str(status_code).startswith('5'):  # Server errors
                desc = response.get('description', '').lower()
                if any(word in desc for word in ['stack', 'trace', 'debug', 'internal']):
                    self.findings.append(Finding(
                        type='VERBOSE_ERROR',
                        severity='LOW',
                        description='Error response may expose internal details. Ensure production errors '
                                   'do not leak stack traces or internal information.',
                        endpoint=path,
                        method=method,
                        remediation=(
                            '1. Use generic error messages in production.\n'
                            '2. Log detailed errors server-side, not in responses.\n'
                            '3. Return standardized error format: { "error": "Something went wrong" }\n'
                            '4. Include correlation ID for debugging without exposing details.'
                        ),
                        owasp_category='API8:2023 - Security Misconfiguration',
                        cwe_id='CWE-209'
                    ))
                    break

    # ============================================================
    # API9: Improper Inventory Management
    # ============================================================
    def _check_inventory_management(self):
        """Check for API versioning and inventory issues."""
        paths = self.spec.get('paths', {})

        # Check for deprecated endpoints
        for path, path_item in paths.items():
            if not isinstance(path_item, dict):
                continue

            for method, operation in path_item.items():
                if not isinstance(operation, dict):
                    continue

                if operation.get('deprecated', False):
                    self.findings.append(Finding(
                        type='DEPRECATED_ENDPOINT',
                        severity='LOW',
                        description='Deprecated endpoint still documented. Consider removing from '
                                   'production or setting a sunset date.',
                        endpoint=path,
                        method=method.upper(),
                        remediation=(
                            '1. Set a sunset date and communicate to API consumers.\n'
                            '2. Return deprecation headers: Deprecation, Sunset.\n'
                            '3. Monitor usage and remove when safe.\n'
                            '4. Redirect old endpoints to new versions if applicable.'
                        ),
                        owasp_category='API9:2023 - Improper Inventory Management',
                        cwe_id='CWE-1059'
                    ))

        # Check for version inconsistencies
        version_patterns = [r'/v\d+/', r'/api/v\d+/', r'/version\d+/']
        versions_found = set()

        for path in paths.keys():
            for pattern in version_patterns:
                match = re.search(pattern, path)
                if match:
                    versions_found.add(match.group())

        if len(versions_found) > 1:
            self.findings.append(Finding(
                type='MULTIPLE_API_VERSIONS',
                severity='INFO',
                description=f'Multiple API versions detected: {", ".join(versions_found)}. '
                           f'Ensure old versions are properly maintained or deprecated.',
                endpoint='/api',
                method='*',
                remediation=(
                    '1. Maintain documentation for all supported versions.\n'
                    '2. Set deprecation timelines for old versions.\n'
                    '3. Apply security patches to all supported versions.\n'
                    '4. Consider API gateway for version routing.'
                ),
                owasp_category='API9:2023 - Improper Inventory Management',
                cwe_id='CWE-1059'
            ))

    # ============================================================
    # API10: Unsafe Consumption of APIs
    # ============================================================
    def _check_unsafe_api_consumption(self, path: str, method: str, operation: Dict[str, Any]):
        """Check for potential issues with consuming external APIs."""
        description = operation.get('description', '').lower()
        summary = operation.get('summary', '').lower()

        external_indicators = ['external', 'third-party', '3rd party', 'integration',
                              'webhook', 'callback', 'partner', 'provider']

        if any(indicator in description or indicator in summary for indicator in external_indicators):
            self.findings.append(Finding(
                type='EXTERNAL_API_CONSUMPTION',
                severity='LOW',
                description='Endpoint appears to interact with external/third-party APIs. '
                           'Ensure proper validation of external data.',
                endpoint=path,
                method=method,
                remediation=(
                    '1. Validate and sanitize all data from external APIs.\n'
                    '2. Implement timeouts for external requests.\n'
                    '3. Use circuit breaker pattern for resilience.\n'
                    '4. Log and monitor external API responses.\n'
                    '5. Have fallback behavior for external API failures.\n'
                    '6. Validate TLS certificates of external services.'
                ),
                owasp_category='API10:2023 - Unsafe Consumption of APIs',
                cwe_id='CWE-20'
            ))

    # ============================================================
    # Global/Spec-Level Checks
    # ============================================================
    def _check_global_security(self):
        """Check global security configuration."""
        if not self.global_security and not self.security_definitions:
            self.findings.append(Finding(
                type='NO_GLOBAL_SECURITY',
                severity='HIGH',
                description='No global security scheme defined in the API specification. '
                           'All endpoints may be accessible without authentication.',
                endpoint='/api',
                method='*',
                remediation=(
                    '1. Define security schemes in your OpenAPI spec.\n'
                    '2. Apply global security requirement.\n'
                    '3. Example OpenAPI 3.0:\n'
                    '   components:\n'
                    '     securitySchemes:\n'
                    '       bearerAuth:\n'
                    '         type: http\n'
                    '         scheme: bearer\n'
                    '   security:\n'
                    '     - bearerAuth: []'
                ),
                owasp_category='API2:2023 - Broken Authentication',
                cwe_id='CWE-306'
            ))

        # Check servers for HTTPS
        servers = self.spec.get('servers', [])
        for server in servers:
            url = server.get('url', '')
            if url.startswith('http://') and 'localhost' not in url and '127.0.0.1' not in url:
                self.findings.append(Finding(
                    type='HTTP_SERVER',
                    severity='HIGH',
                    description=f'Non-HTTPS server URL defined: {url}. '
                               f'API traffic should be encrypted.',
                    endpoint='/api',
                    method='*',
                    remediation=(
                        '1. Use HTTPS for all production API traffic.\n'
                        '2. Obtain TLS certificate (Let\'s Encrypt is free).\n'
                        '3. Redirect HTTP to HTTPS.\n'
                        '4. Use HSTS header to enforce HTTPS.'
                    ),
                    owasp_category='API8:2023 - Security Misconfiguration',
                    cwe_id='CWE-319'
                ))

    # ============================================================
    # Helper Methods
    # ============================================================
    def _endpoint_has_security(self, operation: Dict[str, Any]) -> bool:
        """Check if an endpoint has security defined."""
        # Check operation-level security
        if 'security' in operation:
            # Empty array means explicitly no security
            return len(operation['security']) > 0
        # Fall back to global security
        return len(self.global_security) > 0

    def _get_endpoint_security_schemes(self, operation: Dict[str, Any]) -> Dict[str, Any]:
        """Get security schemes applied to an endpoint."""
        schemes = {}

        # Get security requirements
        security = operation.get('security', self.global_security)

        for requirement in security:
            for scheme_name in requirement.keys():
                if scheme_name in self.security_definitions:
                    schemes[scheme_name] = self.security_definitions[scheme_name]

        return schemes

    def _has_sensitive_properties_in_schema(self, request_body: Dict[str, Any]) -> bool:
        """Check if a request body schema contains potentially sensitive properties."""
        content = request_body.get('content', {})

        for content_type, media_type in content.items():
            schema = media_type.get('schema', {})
            properties = self._get_all_properties(schema)

            for prop_name in properties:
                if any(sensitive in prop_name.lower() for sensitive in
                       ['role', 'admin', 'privilege', 'permission', 'level', 'type',
                        'status', 'verified', 'approved', 'active', 'enabled']):
                    return True

        return False

    def _response_may_expose_sensitive_data(self, response: Dict[str, Any]) -> bool:
        """Check if a response may expose sensitive data."""
        content = response.get('content', {})

        for content_type, media_type in content.items():
            schema = media_type.get('schema', {})
            properties = self._get_all_properties(schema)

            for prop_name in properties:
                if any(sensitive in prop_name.lower() for sensitive in self.SENSITIVE_FIELDS):
                    return True

        return False

    def _has_url_properties_in_schema(self, request_body: Dict[str, Any]) -> bool:
        """Check if a request body contains URL-like properties."""
        content = request_body.get('content', {})

        for content_type, media_type in content.items():
            schema = media_type.get('schema', {})
            properties = self._get_all_properties(schema)

            for prop_name in properties:
                if any(ssrf in prop_name.lower() for ssrf in self.SSRF_PATTERNS):
                    return True

        return False

    def _get_all_properties(self, schema: Dict[str, Any], depth: int = 0) -> List[str]:
        """Recursively get all property names from a schema."""
        if depth > 5:  # Prevent infinite recursion
            return []

        properties = []

        # Direct properties
        if 'properties' in schema:
            properties.extend(schema['properties'].keys())
            for prop_schema in schema['properties'].values():
                if isinstance(prop_schema, dict):
                    properties.extend(self._get_all_properties(prop_schema, depth + 1))

        # Array items
        if 'items' in schema:
            properties.extend(self._get_all_properties(schema['items'], depth + 1))

        # AllOf, OneOf, AnyOf
        for keyword in ['allOf', 'oneOf', 'anyOf']:
            if keyword in schema:
                for sub_schema in schema[keyword]:
                    properties.extend(self._get_all_properties(sub_schema, depth + 1))

        return properties
