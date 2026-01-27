"""
Authentication Handler
======================
Handles various authentication methods for authenticated scanning.

Supported Methods:
- Bearer Token (API Key, JWT)
- Basic Auth
- OAuth2 (Client Credentials, Authorization Code)
- Cookie/Session-based
- Custom Headers
- AWS Signature V4
"""

import asyncio
import logging
import base64
import json
import time
import hashlib
import hmac
from datetime import datetime
from typing import Optional, Dict, Any, List
from dataclasses import dataclass, field
from enum import Enum
import aiohttp
import urllib.parse

logger = logging.getLogger(__name__)


class AuthMethod(Enum):
    """Supported authentication methods"""
    NONE = "none"
    BEARER_TOKEN = "bearer_token"
    BASIC_AUTH = "basic_auth"
    API_KEY = "api_key"
    OAUTH2_CLIENT_CREDENTIALS = "oauth2_client_credentials"
    OAUTH2_PASSWORD = "oauth2_password"
    OAUTH2_AUTHORIZATION_CODE = "oauth2_authorization_code"
    SESSION_COOKIE = "session_cookie"
    CUSTOM_HEADERS = "custom_headers"
    AWS_SIGNATURE_V4 = "aws_signature_v4"


@dataclass
class AuthConfig:
    """Authentication configuration"""
    method: AuthMethod = AuthMethod.NONE

    # Bearer/API Key
    bearer_token: Optional[str] = None
    api_key: Optional[str] = None
    api_key_header: str = "X-API-Key"
    api_key_location: str = "header"  # header, query, cookie

    # Basic Auth
    username: Optional[str] = None
    password: Optional[str] = None

    # OAuth2
    oauth2_client_id: Optional[str] = None
    oauth2_client_secret: Optional[str] = None
    oauth2_token_url: Optional[str] = None
    oauth2_authorization_url: Optional[str] = None
    oauth2_scope: Optional[str] = None
    oauth2_audience: Optional[str] = None

    # Session/Cookie
    login_url: Optional[str] = None
    login_body: Optional[Dict] = None
    login_method: str = "POST"
    session_cookie_name: Optional[str] = None
    csrf_token_name: Optional[str] = None

    # Custom Headers
    custom_headers: Dict[str, str] = field(default_factory=dict)

    # AWS
    aws_access_key: Optional[str] = None
    aws_secret_key: Optional[str] = None
    aws_region: Optional[str] = None
    aws_service: Optional[str] = None

    # Token refresh
    token_refresh_url: Optional[str] = None
    refresh_token: Optional[str] = None
    token_expiry_buffer: int = 60  # seconds before expiry to refresh


@dataclass
class AuthContext:
    """Authentication context passed to scan engines"""
    method: str
    bearer_token: Optional[str] = None
    api_key: Optional[str] = None
    api_key_header: Optional[str] = None
    cookies: Dict[str, str] = field(default_factory=dict)
    headers: Dict[str, str] = field(default_factory=dict)
    query_params: Dict[str, str] = field(default_factory=dict)
    expires_at: Optional[float] = None
    refresh_token: Optional[str] = None

    def is_expired(self) -> bool:
        """Check if token is expired or about to expire"""
        if self.expires_at is None:
            return False
        return time.time() >= self.expires_at - 60  # 60 second buffer

    def to_dict(self) -> Dict[str, Any]:
        return {
            "method": self.method,
            "bearer_token": self.bearer_token,
            "api_key": self.api_key,
            "cookies": self.cookies,
            "headers": self.headers,
            "query_params": self.query_params
        }


class AuthHandler:
    """
    Handles authentication for security scanning.

    Supports various authentication methods and handles:
    - Token acquisition
    - Token refresh
    - Session management
    - Custom authentication flows
    """

    def __init__(self):
        self.session: Optional[aiohttp.ClientSession] = None
        self._token_cache: Dict[str, AuthContext] = {}

    async def _get_session(self) -> aiohttp.ClientSession:
        """Get or create HTTP session"""
        if self.session is None or self.session.closed:
            self.session = aiohttp.ClientSession()
        return self.session

    async def authenticate(self, config: AuthConfig) -> AuthContext:
        """
        Perform authentication and return context.

        Args:
            config: Authentication configuration

        Returns:
            AuthContext with credentials for scanning
        """
        logger.info(f"Authenticating using method: {config.method.value}")

        if config.method == AuthMethod.NONE:
            return AuthContext(method="none")

        elif config.method == AuthMethod.BEARER_TOKEN:
            return self._handle_bearer_token(config)

        elif config.method == AuthMethod.BASIC_AUTH:
            return self._handle_basic_auth(config)

        elif config.method == AuthMethod.API_KEY:
            return self._handle_api_key(config)

        elif config.method == AuthMethod.OAUTH2_CLIENT_CREDENTIALS:
            return await self._handle_oauth2_client_credentials(config)

        elif config.method == AuthMethod.OAUTH2_PASSWORD:
            return await self._handle_oauth2_password(config)

        elif config.method == AuthMethod.SESSION_COOKIE:
            return await self._handle_session_cookie(config)

        elif config.method == AuthMethod.CUSTOM_HEADERS:
            return self._handle_custom_headers(config)

        elif config.method == AuthMethod.AWS_SIGNATURE_V4:
            return self._handle_aws_signature(config)

        else:
            raise ValueError(f"Unsupported auth method: {config.method}")

    def _handle_bearer_token(self, config: AuthConfig) -> AuthContext:
        """Handle Bearer token authentication"""
        return AuthContext(
            method="bearer_token",
            bearer_token=config.bearer_token,
            headers={"Authorization": f"Bearer {config.bearer_token}"}
        )

    def _handle_basic_auth(self, config: AuthConfig) -> AuthContext:
        """Handle Basic authentication"""
        credentials = f"{config.username}:{config.password}"
        encoded = base64.b64encode(credentials.encode()).decode()

        return AuthContext(
            method="basic_auth",
            headers={"Authorization": f"Basic {encoded}"}
        )

    def _handle_api_key(self, config: AuthConfig) -> AuthContext:
        """Handle API Key authentication"""
        context = AuthContext(
            method="api_key",
            api_key=config.api_key,
            api_key_header=config.api_key_header
        )

        if config.api_key_location == "header":
            context.headers[config.api_key_header] = config.api_key
        elif config.api_key_location == "query":
            context.query_params[config.api_key_header] = config.api_key
        elif config.api_key_location == "cookie":
            context.cookies[config.api_key_header] = config.api_key

        return context

    async def _handle_oauth2_client_credentials(self, config: AuthConfig) -> AuthContext:
        """Handle OAuth2 Client Credentials flow"""
        session = await self._get_session()

        data = {
            "grant_type": "client_credentials",
            "client_id": config.oauth2_client_id,
            "client_secret": config.oauth2_client_secret,
        }

        if config.oauth2_scope:
            data["scope"] = config.oauth2_scope
        if config.oauth2_audience:
            data["audience"] = config.oauth2_audience

        try:
            async with session.post(
                config.oauth2_token_url,
                data=data,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            ) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise ValueError(f"OAuth2 token request failed: {error_text}")

                token_data = await response.json()

                access_token = token_data.get("access_token")
                expires_in = token_data.get("expires_in", 3600)
                refresh_token = token_data.get("refresh_token")

                return AuthContext(
                    method="oauth2_client_credentials",
                    bearer_token=access_token,
                    headers={"Authorization": f"Bearer {access_token}"},
                    expires_at=time.time() + expires_in,
                    refresh_token=refresh_token
                )

        except Exception as e:
            logger.error(f"OAuth2 authentication failed: {e}")
            raise

    async def _handle_oauth2_password(self, config: AuthConfig) -> AuthContext:
        """Handle OAuth2 Resource Owner Password flow"""
        session = await self._get_session()

        data = {
            "grant_type": "password",
            "username": config.username,
            "password": config.password,
            "client_id": config.oauth2_client_id,
        }

        if config.oauth2_client_secret:
            data["client_secret"] = config.oauth2_client_secret
        if config.oauth2_scope:
            data["scope"] = config.oauth2_scope

        try:
            async with session.post(
                config.oauth2_token_url,
                data=data
            ) as response:
                if response.status != 200:
                    raise ValueError(f"OAuth2 password grant failed: {await response.text()}")

                token_data = await response.json()

                return AuthContext(
                    method="oauth2_password",
                    bearer_token=token_data["access_token"],
                    headers={"Authorization": f"Bearer {token_data['access_token']}"},
                    expires_at=time.time() + token_data.get("expires_in", 3600),
                    refresh_token=token_data.get("refresh_token")
                )

        except Exception as e:
            logger.error(f"OAuth2 password auth failed: {e}")
            raise

    async def _handle_session_cookie(self, config: AuthConfig) -> AuthContext:
        """Handle session-based cookie authentication"""
        session = await self._get_session()

        try:
            # Perform login request
            login_data = config.login_body or {
                "username": config.username,
                "password": config.password
            }

            async with session.request(
                config.login_method,
                config.login_url,
                json=login_data if config.login_method.upper() in ["POST", "PUT"] else None,
                params=login_data if config.login_method.upper() == "GET" else None,
                allow_redirects=True
            ) as response:
                if response.status >= 400:
                    raise ValueError(f"Login failed with status {response.status}")

                # Extract cookies
                cookies = {}
                for cookie in session.cookie_jar:
                    cookies[cookie.key] = cookie.value

                # Check for specific session cookie
                if config.session_cookie_name and config.session_cookie_name not in cookies:
                    # Try to find it in response headers
                    for cookie_header in response.headers.getall("Set-Cookie", []):
                        if config.session_cookie_name in cookie_header:
                            # Parse cookie value
                            parts = cookie_header.split(";")[0].split("=")
                            if len(parts) >= 2:
                                cookies[parts[0].strip()] = parts[1].strip()

                # Handle CSRF token if needed
                headers = {}
                if config.csrf_token_name:
                    # Look for CSRF token in cookies or response body
                    csrf_token = cookies.get(config.csrf_token_name)
                    if csrf_token:
                        headers["X-CSRF-Token"] = csrf_token

                return AuthContext(
                    method="session_cookie",
                    cookies=cookies,
                    headers=headers
                )

        except Exception as e:
            logger.error(f"Session authentication failed: {e}")
            raise

    def _handle_custom_headers(self, config: AuthConfig) -> AuthContext:
        """Handle custom header authentication"""
        return AuthContext(
            method="custom_headers",
            headers=config.custom_headers.copy()
        )

    def _handle_aws_signature(self, config: AuthConfig) -> AuthContext:
        """
        Handle AWS Signature V4 authentication.

        Note: This provides the credentials; actual signing happens per-request.
        """
        return AuthContext(
            method="aws_signature_v4",
            headers={
                "x-vulx-aws-access-key": config.aws_access_key,
                "x-vulx-aws-secret-key": config.aws_secret_key,
                "x-vulx-aws-region": config.aws_region or "us-east-1",
                "x-vulx-aws-service": config.aws_service or "execute-api"
            }
        )

    async def refresh_token(self, context: AuthContext, config: AuthConfig) -> AuthContext:
        """Refresh an expired token"""
        if not context.refresh_token or not config.token_refresh_url:
            raise ValueError("No refresh token or refresh URL available")

        session = await self._get_session()

        data = {
            "grant_type": "refresh_token",
            "refresh_token": context.refresh_token,
            "client_id": config.oauth2_client_id
        }

        if config.oauth2_client_secret:
            data["client_secret"] = config.oauth2_client_secret

        async with session.post(config.token_refresh_url, data=data) as response:
            if response.status != 200:
                raise ValueError(f"Token refresh failed: {await response.text()}")

            token_data = await response.json()

            return AuthContext(
                method=context.method,
                bearer_token=token_data["access_token"],
                headers={"Authorization": f"Bearer {token_data['access_token']}"},
                expires_at=time.time() + token_data.get("expires_in", 3600),
                refresh_token=token_data.get("refresh_token", context.refresh_token)
            )

    async def close(self):
        """Cleanup resources"""
        if self.session:
            await self.session.close()


class AuthRecorder:
    """
    Records authentication flows for replay.

    Used to capture complex auth flows that can be replayed during scanning.
    """

    def __init__(self):
        self.recorded_requests: List[Dict] = []
        self.recorded_cookies: Dict[str, str] = {}
        self.recorded_headers: Dict[str, str] = {}

    def record_request(
        self,
        method: str,
        url: str,
        headers: Dict[str, str],
        body: Optional[str] = None,
        response_status: int = 200,
        response_headers: Dict[str, str] = None,
        response_body: Optional[str] = None
    ):
        """Record an authentication request"""
        self.recorded_requests.append({
            "method": method,
            "url": url,
            "headers": headers,
            "body": body,
            "response": {
                "status": response_status,
                "headers": response_headers or {},
                "body": response_body
            }
        })

        # Extract cookies from response
        if response_headers:
            for key, value in response_headers.items():
                if key.lower() == "set-cookie":
                    cookie_parts = value.split(";")[0].split("=")
                    if len(cookie_parts) >= 2:
                        self.recorded_cookies[cookie_parts[0].strip()] = cookie_parts[1].strip()

    def export_config(self) -> Dict[str, Any]:
        """Export recorded auth flow as config"""
        return {
            "requests": self.recorded_requests,
            "cookies": self.recorded_cookies,
            "headers": self.recorded_headers
        }

    async def replay(self) -> AuthContext:
        """Replay recorded auth flow"""
        async with aiohttp.ClientSession() as session:
            for request in self.recorded_requests:
                async with session.request(
                    request["method"],
                    request["url"],
                    headers=request["headers"],
                    data=request.get("body")
                ) as response:
                    # Update cookies from response
                    for cookie in session.cookie_jar:
                        self.recorded_cookies[cookie.key] = cookie.value

            return AuthContext(
                method="recorded_flow",
                cookies=self.recorded_cookies,
                headers=self.recorded_headers
            )
