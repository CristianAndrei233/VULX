# Quick Start Guide

Get VULX up and running and perform your first security scan in minutes.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 18+** - JavaScript runtime
- **Python 3.10+** - For the scan engine
- **Docker & Docker Compose** - For containerized services
- **Git** - Version control

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/vulx.git
cd vulx
```

### 2. Start Infrastructure Services

VULX requires PostgreSQL for data storage and Redis for job queuing:

```bash
docker-compose up -d
```

This starts:
- PostgreSQL on port 5432
- Redis on port 6379

### 3. Configure Environment Variables

Create environment files:

**`apps/api/.env`**:
```env
DATABASE_URL="postgresql://vulx:vulx@localhost:5432/vulx"
REDIS_URL="redis://localhost:6379"
PORT=3001
JWT_SECRET="your-secret-key-change-in-production"
```

**`apps/scan-engine/.env`**:
```env
DATABASE_URL="postgresql://vulx:vulx@localhost:5432/vulx"
REDIS_URL="redis://localhost:6379"
ZAP_API_KEY="your-zap-api-key"
```

### 4. Install Dependencies

```bash
# Install Node.js dependencies (from root)
npm install

# Install Python dependencies for scan engine
cd apps/scan-engine
pip install -r requirements.txt
cd ../..
```

### 5. Initialize the Database

```bash
cd apps/api
npx prisma migrate dev
npx prisma db seed  # Optional: seed with sample data
cd ../..
```

### 6. Start All Services

In separate terminal windows:

```bash
# Terminal 1: API Server
npm run dev:api

# Terminal 2: Web Dashboard
npm run dev:web

# Terminal 3: Scan Engine
cd apps/scan-engine
python src/worker.py
```

The dashboard will be available at **http://localhost:5173**

## Your First Scan

### Option 1: Using the Web Dashboard

1. **Open your browser** to `http://localhost:5173`
2. **Register an account** or log in
3. **Create a new project**:
   - Click "New Project" from the dashboard
   - Enter a name for your project
   - Add your target API URL (e.g., `https://api.example.com`)
   - Optionally provide an OpenAPI specification URL
4. **Configure Authentication** (if required):
   - Select the authentication method your API uses
   - Enter the required credentials
5. **Start a Scan**:
   - Click "New Scan" on the project page
   - Select scan type (Quick, Standard, or Full)
   - Click "Start Scan"
6. **View Results**:
   - Watch the scan progress in real-time
   - Review findings with severity ratings
   - Check remediation recommendations

### Option 2: Using the Embedded CLI

1. Navigate to the **CLI** page in the dashboard
2. Run commands directly in the browser terminal:

```bash
# Start a quick scan
vulx scan https://api.example.com

# Full scan with OpenAPI spec
vulx scan https://api.example.com --type full --spec https://api.example.com/openapi.json

# Scan with authentication
vulx scan https://api.example.com --auth bearer --token eyJhbGciOiJIUzI1NiIs...

# View recent scans
vulx scans

# Generate a compliance report
vulx report scan_abc123 --format pdf --framework soc2
```

### Option 3: Using the Docker Agent

For CI/CD integration, use the containerized scanner:

```bash
docker run --rm \
  -e VULX_API_KEY=your_api_key \
  -e TARGET_URL=https://api.example.com \
  -e OPENAPI_SPEC_URL=https://api.example.com/openapi.json \
  -e SCAN_TYPE=standard \
  vulx-scanner
```

## Understanding Scan Types

| Type | Duration | Engines | Best For |
|------|----------|---------|----------|
| **Quick** | 2-5 min | Nuclei | Pre-commit hooks, rapid feedback |
| **Standard** | 10-30 min | ZAP + Nuclei | Daily CI/CD scans |
| **Full** | 30-60 min | All engines | Release gates, compliance audits |

## Configuring Authentication

VULX supports multiple authentication methods:

### Bearer Token
```yaml
auth:
  method: bearer_token
  token: "your-jwt-token"
```

### API Key
```yaml
auth:
  method: api_key
  header: "X-API-Key"
  value: "your-api-key"
```

### Basic Auth
```yaml
auth:
  method: basic_auth
  username: "user"
  password: "pass"
```

### OAuth2 Client Credentials
```yaml
auth:
  method: oauth2_client_credentials
  client_id: "your-client-id"
  client_secret: "your-secret"
  token_url: "https://auth.example.com/oauth/token"
  scope: "read write"
```

### Session Cookie
```yaml
auth:
  method: session_cookie
  login_url: "https://api.example.com/auth/login"
  login_body:
    username: "test@example.com"
    password: "testpass123"
  session_cookie_name: "session_id"
```

## Understanding Results

### Severity Levels

| Level | Color | Risk | Action Required |
|-------|-------|------|-----------------|
| **CRITICAL** | Red | Immediate exploitation possible | Fix immediately |
| **HIGH** | Orange | Significant risk | Fix within 24-48 hours |
| **MEDIUM** | Yellow | Moderate risk | Fix within 1 week |
| **LOW** | Blue | Minor risk | Fix in next sprint |
| **INFO** | Gray | Informational | Review and consider |

### Finding Details

Each finding includes:
- **Description**: What the vulnerability is
- **Evidence**: Proof of the vulnerability
- **Remediation**: How to fix it
- **Code Example**: Sample fix in multiple languages
- **OWASP Category**: Classification in OWASP API Top 10
- **CWE ID**: Common Weakness Enumeration reference
- **Compliance Mappings**: SOC2, PCI-DSS, HIPAA, GDPR controls

## Generating Reports

### PDF Report
```bash
vulx report scan_abc123 --format pdf
```

### Compliance Report
```bash
# SOC 2 Type II
vulx report scan_abc123 --format pdf --framework soc2

# PCI-DSS
vulx report scan_abc123 --format pdf --framework pci_dss

# HIPAA
vulx report scan_abc123 --format pdf --framework hipaa

# GDPR
vulx report scan_abc123 --format pdf --framework gdpr
```

## Test API for Practice

Use our intentionally vulnerable test API to practice:

```bash
# Clone the test API
git clone https://github.com/vulx/vulnerable-api-demo
cd vulnerable-api-demo
docker-compose up -d

# Scan it
vulx scan http://localhost:3000 --spec http://localhost:3000/openapi.json
```

## Next Steps

- Learn about [Core Concepts](./core-concepts.md)
- Set up [CI/CD Integration](../cicd/overview.md)
- Explore the [CLI Commands](../cli/commands.md)
- Configure [Scheduled Scans](../guide/scheduled-scans.md)
- Set up [Notifications](../guide/notifications.md)

## Troubleshooting

### Scan Engine Not Starting
```bash
# Check if ZAP is installed
which zap.sh

# Check Nuclei
nuclei --version

# Verify Python environment
pip list | grep schemathesis
```

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker-compose ps

# Verify connection
psql -h localhost -U vulx -d vulx
```

### Permission Denied Errors
```bash
# Make sure you own or have permission to scan the target
# VULX performs active security testing
```

## Getting Help

- **Documentation**: https://docs.vulx.io
- **GitHub Issues**: https://github.com/vulx/vulx/issues
- **Discord Community**: https://discord.gg/vulx
- **Enterprise Support**: support@vulx.io
