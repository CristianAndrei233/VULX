"""
Auto-Remediation Engine
=======================
Provides actionable code fixes and remediation guidance for security findings.

Features:
- Language-specific code examples
- Framework-specific fixes
- Step-by-step remediation guides
- Priority-based fix recommendations
"""

from typing import Dict, Any, Optional, List
from dataclasses import dataclass
from enum import Enum


class Language(Enum):
    """Supported programming languages"""
    PYTHON = "python"
    JAVASCRIPT = "javascript"
    TYPESCRIPT = "typescript"
    JAVA = "java"
    GO = "go"
    CSHARP = "csharp"
    PHP = "php"
    RUBY = "ruby"


class Framework(Enum):
    """Supported frameworks"""
    EXPRESS = "express"
    FASTAPI = "fastapi"
    DJANGO = "django"
    FLASK = "flask"
    SPRING = "spring"
    DOTNET = "dotnet"
    RAILS = "rails"
    LARAVEL = "laravel"
    GIN = "gin"
    NEXTJS = "nextjs"


@dataclass
class Remediation:
    """Remediation guidance for a finding"""
    description: str
    priority: str  # immediate, short_term, medium_term
    effort: str  # low, medium, high
    code_example: Optional[str] = None
    steps: List[str] = None
    references: List[str] = None
    automated_fix_available: bool = False

    def __post_init__(self):
        if self.steps is None:
            self.steps = []
        if self.references is None:
            self.references = []


class RemediationEngine:
    """
    Provides remediation guidance and code fixes for security vulnerabilities.

    Generates:
    - Detailed fix descriptions
    - Code examples in multiple languages
    - Step-by-step remediation guides
    - Framework-specific solutions
    """

    # Remediation templates by vulnerability type
    REMEDIATIONS = {
        # SQL Injection
        "sql_injection": {
            "description": "Use parameterized queries or prepared statements to prevent SQL injection. Never concatenate user input directly into SQL queries.",
            "priority": "immediate",
            "effort": "medium",
            "steps": [
                "Identify all SQL queries that use user input",
                "Replace string concatenation with parameterized queries",
                "Use an ORM or query builder when possible",
                "Implement input validation as defense in depth",
                "Add SQL injection tests to your CI/CD pipeline"
            ],
            "references": [
                "https://cheatsheetseries.owasp.org/cheatsheets/Query_Parameterization_Cheat_Sheet.html",
                "https://cwe.mitre.org/data/definitions/89.html"
            ],
            "code_examples": {
                "python": '''# VULNERABLE CODE - DO NOT USE
query = f"SELECT * FROM users WHERE id = {user_id}"

# SECURE CODE - Use parameterized queries
import psycopg2

# Option 1: Parameterized query
cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))

# Option 2: Using SQLAlchemy ORM
from sqlalchemy import select
user = session.execute(
    select(User).where(User.id == user_id)
).scalar_one()

# Option 3: Using Django ORM
user = User.objects.get(id=user_id)''',

                "javascript": '''// VULNERABLE CODE - DO NOT USE
const query = `SELECT * FROM users WHERE id = ${userId}`;

// SECURE CODE - Use parameterized queries

// Option 1: Using pg (node-postgres)
const result = await pool.query(
  'SELECT * FROM users WHERE id = $1',
  [userId]
);

// Option 2: Using Prisma ORM
const user = await prisma.user.findUnique({
  where: { id: userId }
});

// Option 3: Using Knex query builder
const user = await knex('users')
  .where('id', userId)
  .first();''',

                "java": '''// VULNERABLE CODE - DO NOT USE
String query = "SELECT * FROM users WHERE id = " + userId;

// SECURE CODE - Use PreparedStatement
String sql = "SELECT * FROM users WHERE id = ?";
PreparedStatement stmt = connection.prepareStatement(sql);
stmt.setInt(1, userId);
ResultSet rs = stmt.executeQuery();

// Using JPA/Hibernate
@Query("SELECT u FROM User u WHERE u.id = :id")
User findById(@Param("id") Long id);

// Using Spring Data JPA
User user = userRepository.findById(userId);''',

                "go": '''// VULNERABLE CODE - DO NOT USE
query := fmt.Sprintf("SELECT * FROM users WHERE id = %s", userID)

// SECURE CODE - Use parameterized queries
row := db.QueryRow("SELECT * FROM users WHERE id = $1", userID)

// Using GORM
var user User
db.First(&user, userID)'''
            }
        },

        # Cross-Site Scripting (XSS)
        "xss": {
            "description": "Encode all user-supplied data before rendering in HTML context. Use Content Security Policy (CSP) headers and modern frameworks that auto-escape output.",
            "priority": "immediate",
            "effort": "medium",
            "steps": [
                "Enable automatic output encoding in your framework",
                "Implement Content-Security-Policy headers",
                "Validate and sanitize user input",
                "Use HTTPOnly and Secure flags on cookies",
                "Add XSS tests to your security testing suite"
            ],
            "references": [
                "https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html",
                "https://cwe.mitre.org/data/definitions/79.html"
            ],
            "code_examples": {
                "javascript": '''// VULNERABLE CODE - DO NOT USE
element.innerHTML = userInput;

// SECURE CODE

// Option 1: Use textContent instead of innerHTML
element.textContent = userInput;

// Option 2: Use DOMPurify for HTML content
import DOMPurify from 'dompurify';
element.innerHTML = DOMPurify.sanitize(userInput);

// Option 3: React auto-escapes by default
function Component({ userInput }) {
  return <div>{userInput}</div>; // Safe - auto-escaped
}

// Add CSP headers (Express.js)
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
  }
}));''',

                "python": '''# Django - Auto-escapes by default
# Templates: {{ user_input }} is safe

# If you need to render HTML, mark it safe explicitly
from django.utils.html import escape
safe_content = escape(user_input)

# Flask - Use Jinja2 auto-escaping
# {{ user_input }} is auto-escaped
# {{ user_input|safe }} bypasses escaping - avoid!

# Add CSP headers
from flask import Flask
from flask_talisman import Talisman

app = Flask(__name__)
Talisman(app, content_security_policy={
    'default-src': "'self'",
    'script-src': "'self'"
})'''
            }
        },

        # Broken Object Level Authorization (BOLA/IDOR)
        "bola": {
            "description": "Implement proper authorization checks before accessing any object. Verify the authenticated user has permission to access the requested resource.",
            "priority": "immediate",
            "effort": "medium",
            "steps": [
                "Implement authorization checks on every data access",
                "Use indirect object references (UUIDs) instead of sequential IDs",
                "Verify object ownership before returning data",
                "Implement role-based or attribute-based access control",
                "Log and monitor access attempts"
            ],
            "references": [
                "https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/",
                "https://cwe.mitre.org/data/definitions/639.html"
            ],
            "code_examples": {
                "javascript": '''// VULNERABLE CODE - No authorization check
app.get('/api/orders/:orderId', async (req, res) => {
  const order = await Order.findById(req.params.orderId);
  res.json(order);
});

// SECURE CODE - With authorization check
app.get('/api/orders/:orderId', authenticate, async (req, res) => {
  const order = await Order.findById(req.params.orderId);

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  // Verify the authenticated user owns this order
  if (order.userId !== req.user.id) {
    // Log potential attack
    logger.warn(`Unauthorized access attempt: User ${req.user.id} tried to access order ${order.id}`);
    return res.status(403).json({ error: 'Forbidden' });
  }

  res.json(order);
});

// Even better: Query with user filter
app.get('/api/orders/:orderId', authenticate, async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.orderId,
    userId: req.user.id  // Ensures ownership
  });

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  res.json(order);
});''',

                "python": '''# VULNERABLE CODE - No authorization check
@app.get("/orders/{order_id}")
async def get_order(order_id: int):
    return await Order.get(order_id)

# SECURE CODE - With authorization check
@app.get("/orders/{order_id}")
async def get_order(
    order_id: int,
    current_user: User = Depends(get_current_user)
):
    order = await Order.get(order_id)

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Verify ownership
    if order.user_id != current_user.id:
        logger.warning(
            f"Unauthorized access: User {current_user.id} "
            f"attempted to access order {order_id}"
        )
        raise HTTPException(status_code=403, detail="Forbidden")

    return order

# Better: Use scoped queries
@app.get("/orders/{order_id}")
async def get_order(
    order_id: int,
    current_user: User = Depends(get_current_user)
):
    order = await Order.filter(
        id=order_id,
        user_id=current_user.id  # Scoped to user
    ).first()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    return order'''
            }
        },

        # Broken Authentication
        "broken_auth": {
            "description": "Implement secure authentication mechanisms including strong password policies, MFA, secure session management, and account lockout.",
            "priority": "immediate",
            "effort": "high",
            "steps": [
                "Enforce strong password requirements",
                "Implement multi-factor authentication (MFA)",
                "Use secure session management",
                "Implement account lockout after failed attempts",
                "Use secure password hashing (bcrypt, Argon2)",
                "Implement proper logout functionality"
            ],
            "references": [
                "https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html",
                "https://owasp.org/API-Security/editions/2023/en/0xa2-broken-authentication/"
            ],
            "code_examples": {
                "javascript": '''// Secure password hashing
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 12;

// Hash password before storing
async function hashPassword(password) {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

// Verify password
async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

// Secure session configuration (Express.js)
const session = require('express-session');
const RedisStore = require('connect-redis').default;

app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,        // HTTPS only
    httpOnly: true,      // No JS access
    sameSite: 'strict',  // CSRF protection
    maxAge: 15 * 60 * 1000  // 15 minutes
  }
}));

// Account lockout
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

async function handleLogin(email, password) {
  const user = await User.findByEmail(email);

  if (user.lockedUntil && user.lockedUntil > Date.now()) {
    throw new Error('Account is locked. Try again later.');
  }

  const isValid = await verifyPassword(password, user.passwordHash);

  if (!isValid) {
    user.failedAttempts += 1;
    if (user.failedAttempts >= MAX_ATTEMPTS) {
      user.lockedUntil = Date.now() + LOCKOUT_DURATION;
    }
    await user.save();
    throw new Error('Invalid credentials');
  }

  // Reset on successful login
  user.failedAttempts = 0;
  user.lockedUntil = null;
  await user.save();

  return user;
}''',

                "python": '''# Secure password hashing with Argon2
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

ph = PasswordHasher()

def hash_password(password: str) -> str:
    return ph.hash(password)

def verify_password(password: str, hash: str) -> bool:
    try:
        ph.verify(hash, password)
        return True
    except VerifyMismatchError:
        return False

# JWT with proper configuration
from datetime import datetime, timedelta
from jose import jwt

SECRET_KEY = os.environ["JWT_SECRET"]
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# Rate limiting for login endpoint
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/auth/login")
@limiter.limit("5/minute")  # Max 5 attempts per minute
async def login(credentials: LoginRequest):
    # ... authentication logic
    pass'''
            }
        },

        # Rate Limiting
        "rate_limiting": {
            "description": "Implement rate limiting to prevent abuse, DoS attacks, and brute force attempts. Use sliding window or token bucket algorithms.",
            "priority": "short_term",
            "effort": "low",
            "steps": [
                "Identify endpoints that need rate limiting",
                "Choose appropriate limits based on use case",
                "Implement rate limiting middleware",
                "Return proper 429 status codes with Retry-After header",
                "Monitor and adjust limits based on traffic patterns"
            ],
            "references": [
                "https://owasp.org/API-Security/editions/2023/en/0xa4-unrestricted-resource-consumption/",
                "https://cloud.google.com/architecture/rate-limiting-strategies-techniques"
            ],
            "code_examples": {
                "javascript": '''// Using express-rate-limit
const rateLimit = require('express-rate-limit');

// General API rate limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests',
    retryAfter: '15 minutes'
  }
});

// Strict limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true
});

app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);

// Using Redis for distributed rate limiting
const RedisStore = require('rate-limit-redis');

const distributedLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:'
  }),
  windowMs: 60 * 1000,
  max: 60
});''',

                "python": '''# FastAPI with slowapi
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.get("/api/data")
@limiter.limit("100/minute")
async def get_data():
    return {"data": "..."}

@app.post("/api/auth/login")
@limiter.limit("5/minute")
async def login():
    return {"token": "..."}

# Django with django-ratelimit
from django_ratelimit.decorators import ratelimit

@ratelimit(key='ip', rate='100/m', block=True)
def api_view(request):
    return JsonResponse({"data": "..."})

# Custom user-based rate limiting
@ratelimit(key='user', rate='1000/h', block=True)
def premium_api_view(request):
    return JsonResponse({"data": "..."})'''
            }
        },

        # SSRF
        "ssrf": {
            "description": "Validate and sanitize all user-supplied URLs. Use allowlists for permitted domains and block internal network ranges.",
            "priority": "immediate",
            "effort": "medium",
            "steps": [
                "Implement URL allowlist validation",
                "Block internal IP ranges (10.x, 172.16.x, 192.168.x, 127.x)",
                "Use a dedicated HTTP client with security settings",
                "Disable redirects or validate redirect destinations",
                "Consider using a proxy service for external requests"
            ],
            "references": [
                "https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html",
                "https://owasp.org/API-Security/editions/2023/en/0xa7-server-side-request-forgery/"
            ],
            "code_examples": {
                "python": '''import ipaddress
from urllib.parse import urlparse
import socket

ALLOWED_DOMAINS = ['api.trusted-service.com', 'cdn.example.com']

def is_safe_url(url: str) -> bool:
    """Validate URL is safe to request"""
    try:
        parsed = urlparse(url)

        # Must be HTTPS
        if parsed.scheme != 'https':
            return False

        # Check against allowlist
        if parsed.hostname not in ALLOWED_DOMAINS:
            return False

        # Resolve hostname and check IP
        ip = socket.gethostbyname(parsed.hostname)
        ip_obj = ipaddress.ip_address(ip)

        # Block private/reserved ranges
        if ip_obj.is_private or ip_obj.is_loopback or ip_obj.is_reserved:
            return False

        return True

    except Exception:
        return False

@app.post("/api/fetch-url")
async def fetch_url(url: str):
    if not is_safe_url(url):
        raise HTTPException(
            status_code=400,
            detail="URL not allowed"
        )

    # Use timeout and disable redirects
    async with httpx.AsyncClient(
        timeout=10.0,
        follow_redirects=False
    ) as client:
        response = await client.get(url)

    return {"content": response.text}''',

                "javascript": '''const { URL } = require('url');
const dns = require('dns').promises;
const ipaddr = require('ipaddr.js');

const ALLOWED_DOMAINS = new Set([
  'api.trusted-service.com',
  'cdn.example.com'
]);

async function isUrlSafe(urlString) {
  try {
    const url = new URL(urlString);

    // Must be HTTPS
    if (url.protocol !== 'https:') {
      return false;
    }

    // Check allowlist
    if (!ALLOWED_DOMAINS.has(url.hostname)) {
      return false;
    }

    // Resolve and check IP
    const addresses = await dns.resolve4(url.hostname);
    for (const addr of addresses) {
      const ip = ipaddr.parse(addr);
      const range = ip.range();

      // Block private ranges
      if (['private', 'loopback', 'linkLocal', 'reserved'].includes(range)) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

app.post('/api/fetch-url', async (req, res) => {
  const { url } = req.body;

  if (!await isUrlSafe(url)) {
    return res.status(400).json({ error: 'URL not allowed' });
  }

  // Use axios with security settings
  const response = await axios.get(url, {
    timeout: 10000,
    maxRedirects: 0,  // Disable redirects
    validateStatus: (status) => status < 400
  });

  res.json({ content: response.data });
});'''
            }
        },

        # Security Headers
        "security_headers": {
            "description": "Implement security headers to protect against common attacks like XSS, clickjacking, and MIME sniffing.",
            "priority": "short_term",
            "effort": "low",
            "steps": [
                "Add Content-Security-Policy header",
                "Add X-Content-Type-Options: nosniff",
                "Add X-Frame-Options: DENY",
                "Add Strict-Transport-Security header",
                "Remove server version headers"
            ],
            "references": [
                "https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html",
                "https://securityheaders.com/"
            ],
            "code_examples": {
                "javascript": '''// Express.js with Helmet
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

// Hide Express
app.disable('x-powered-by');''',

                "python": '''# FastAPI with secure headers middleware
from fastapi import FastAPI
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from starlette.middleware.httpsredirect import HTTPSRedirectMiddleware

app = FastAPI()

# Force HTTPS
app.add_middleware(HTTPSRedirectMiddleware)

# Trusted hosts
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["example.com", "*.example.com"]
)

# Security headers middleware
@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)

    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self'; "
        "style-src 'self' 'unsafe-inline'"
    )
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Strict-Transport-Security"] = (
        "max-age=31536000; includeSubDomains; preload"
    )
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = (
        "geolocation=(), microphone=(), camera=()"
    )

    return response'''
            }
        }
    }

    # CWE to remediation type mapping
    CWE_TO_TYPE = {
        "CWE-89": "sql_injection",
        "CWE-79": "xss",
        "CWE-639": "bola",
        "CWE-287": "broken_auth",
        "CWE-306": "broken_auth",
        "CWE-770": "rate_limiting",
        "CWE-918": "ssrf",
        "CWE-16": "security_headers",
        "CWE-693": "security_headers",
    }

    # OWASP to remediation type mapping
    OWASP_TO_TYPE = {
        "API1:2023": "bola",
        "API2:2023": "broken_auth",
        "API3:2023": "bola",  # Similar fix pattern
        "API4:2023": "rate_limiting",
        "API7:2023": "ssrf",
        "API8:2023": "security_headers",
    }

    def __init__(self):
        self.preferred_language = Language.JAVASCRIPT

    def set_preferred_language(self, language: Language):
        """Set preferred language for code examples"""
        self.preferred_language = language

    def get_remediation(
        self,
        finding: Any,
        language: Optional[Language] = None
    ) -> Remediation:
        """
        Get remediation guidance for a finding.

        Args:
            finding: Security finding object
            language: Preferred language for code examples

        Returns:
            Remediation object with fix guidance
        """
        language = language or self.preferred_language
        remediation_type = self._get_remediation_type(finding)

        if remediation_type and remediation_type in self.REMEDIATIONS:
            template = self.REMEDIATIONS[remediation_type]

            code_example = None
            if "code_examples" in template:
                code_example = template["code_examples"].get(
                    language.value,
                    list(template["code_examples"].values())[0]  # Fallback to first
                )

            return Remediation(
                description=template["description"],
                priority=template["priority"],
                effort=template["effort"],
                code_example=code_example,
                steps=template.get("steps", []),
                references=template.get("references", [])
            )

        # Generic remediation
        return Remediation(
            description=f"Review and fix the {finding.type} vulnerability. Implement proper input validation, output encoding, and access controls.",
            priority="short_term",
            effort="medium",
            steps=[
                "Analyze the finding and understand the attack vector",
                "Implement appropriate security controls",
                "Test the fix thoroughly",
                "Add security tests to prevent regression"
            ],
            references=["https://owasp.org/www-project-web-security-testing-guide/"]
        )

    def _get_remediation_type(self, finding: Any) -> Optional[str]:
        """Determine remediation type from finding"""
        # Check CWE
        if finding.cwe_id:
            cwe_clean = finding.cwe_id.replace("CWE-", "")
            cwe_key = f"CWE-{cwe_clean}"
            if cwe_key in self.CWE_TO_TYPE:
                return self.CWE_TO_TYPE[cwe_key]

        # Check OWASP category
        if finding.owasp_category:
            owasp_id = finding.owasp_category.split(" - ")[0]
            if owasp_id in self.OWASP_TO_TYPE:
                return self.OWASP_TO_TYPE[owasp_id]

        # Check finding type keywords
        finding_type_lower = finding.type.lower()
        for key in ["sql", "injection", "sqli"]:
            if key in finding_type_lower:
                return "sql_injection"
        for key in ["xss", "cross-site scripting", "script"]:
            if key in finding_type_lower:
                return "xss"
        for key in ["bola", "idor", "authorization"]:
            if key in finding_type_lower:
                return "bola"
        for key in ["auth", "login", "password"]:
            if key in finding_type_lower:
                return "broken_auth"
        for key in ["rate", "limit", "dos", "throttl"]:
            if key in finding_type_lower:
                return "rate_limiting"
        for key in ["ssrf", "server-side request"]:
            if key in finding_type_lower:
                return "ssrf"

        return None

    def get_all_remediations(
        self,
        findings: List[Any],
        language: Optional[Language] = None
    ) -> Dict[str, List[Remediation]]:
        """
        Get remediations for all findings grouped by type.

        Returns deduplicated remediations.
        """
        language = language or self.preferred_language
        remediations: Dict[str, List[Remediation]] = {
            "immediate": [],
            "short_term": [],
            "medium_term": []
        }

        seen_types = set()

        for finding in findings:
            remediation_type = self._get_remediation_type(finding)
            if remediation_type and remediation_type not in seen_types:
                seen_types.add(remediation_type)
                remediation = self.get_remediation(finding, language)
                remediations[remediation.priority].append(remediation)

        return remediations

    def estimate_fix_effort(self, findings: List[Any]) -> Dict[str, Any]:
        """
        Estimate total effort to fix all findings.

        Returns effort breakdown and recommendations.
        """
        effort_hours = {
            "low": 2,
            "medium": 8,
            "high": 24
        }

        total_hours = 0
        by_priority = {"immediate": 0, "short_term": 0, "medium_term": 0}

        seen_types = set()

        for finding in findings:
            remediation_type = self._get_remediation_type(finding)
            if remediation_type and remediation_type not in seen_types:
                seen_types.add(remediation_type)
                if remediation_type in self.REMEDIATIONS:
                    template = self.REMEDIATIONS[remediation_type]
                    hours = effort_hours[template["effort"]]
                    total_hours += hours
                    by_priority[template["priority"]] += hours

        return {
            "total_estimated_hours": total_hours,
            "by_priority": by_priority,
            "unique_fix_types": len(seen_types),
            "recommendation": self._get_effort_recommendation(total_hours)
        }

    def _get_effort_recommendation(self, hours: int) -> str:
        """Get recommendation based on estimated hours"""
        if hours <= 8:
            return "Fixes can likely be completed in a single sprint"
        elif hours <= 40:
            return "Plan for 1-2 weeks of dedicated security work"
        elif hours <= 80:
            return "Consider dedicating a full sprint to security improvements"
        else:
            return "Significant security debt - consider a phased remediation approach"
