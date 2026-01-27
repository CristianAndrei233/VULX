# Quick Start

Get VULX up and running in just a few minutes.

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js 18 or higher
- Python 3.10 or higher
- Docker and Docker Compose
- Git

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/vulx.git
cd vulx
```

### 2. Start the Database Services

VULX uses PostgreSQL for data storage and Redis for job queuing:

```bash
docker-compose up -d
```

This starts:
- PostgreSQL on port 5432
- Redis on port 6379

### 3. Configure Environment Variables

Create a `.env` file in the `apps/api` directory:

```env
DATABASE_URL="postgresql://vulx:vulx@localhost:5432/vulx"
REDIS_URL="redis://localhost:6379"
PORT=3001
```

### 4. Install Dependencies

```bash
# Install Node.js dependencies
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
cd ../..
```

### 6. Start the Services

In separate terminal windows, start each service:

```bash
# Terminal 1: Start the API
npm run dev:api

# Terminal 2: Start the Web Dashboard
npm run dev:web

# Terminal 3: Start the Scan Engine
cd apps/scan-engine
python src/worker.py
```

## Your First Scan

### Using the Web Dashboard

1. Open your browser to `http://localhost:5173`
2. Click "New Project" to create a project
3. Enter your project name and OpenAPI specification URL
4. Click "Create Project"
5. On the project page, click "Run Scan"
6. View the results once the scan completes

### Using the CLI

Install the CLI globally:

```bash
npm install -g @vulx/cli
```

Run a scan:

```bash
vulx scan --project-id <your-project-id>
```

## Sample OpenAPI Specification

For testing, you can use this sample specification:

```yaml
openapi: 3.0.0
info:
  title: Sample API
  version: 1.0.0
paths:
  /users:
    get:
      summary: List users
      responses:
        '200':
          description: Success
  /users/{id}:
    get:
      summary: Get user by ID
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Success
  /admin/users:
    get:
      summary: Admin user list
      responses:
        '200':
          description: Success
```

## Next Steps

- Learn about [Core Concepts](/guide/core-concepts)
- Set up [CI/CD Integration](/cicd/overview)
- Explore the [CLI Commands](/cli/commands)
