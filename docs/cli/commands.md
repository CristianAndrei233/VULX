# CLI Commands

Complete reference for all VULX CLI commands.

## vulx scan

Run a security scan against a project.

### Synopsis

```bash
vulx scan [options]
```

### Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--project-id <id>` | `-p` | Project ID to scan | Required |
| `--url <url>` | `-u` | API server URL | `http://localhost:3001` |
| `--fail-on <severity>` | | Exit with error on severity | `HIGH` |
| `--timeout <ms>` | `-t` | Scan timeout in milliseconds | `120000` |
| `--json` | | Output results as JSON | `false` |
| `--quiet` | `-q` | Suppress progress output | `false` |

### Examples

**Basic scan:**
```bash
vulx scan --project-id abc123
```

**Custom API endpoint:**
```bash
vulx scan -p abc123 -u https://api.vulx.io
```

**JSON output for scripting:**
```bash
vulx scan -p abc123 --json > results.json
```

**CI/CD with strict threshold:**
```bash
vulx scan -p abc123 --fail-on MEDIUM
```

**Extended timeout for large APIs:**
```bash
vulx scan -p abc123 --timeout 300000
```

---

## vulx projects

List and manage projects.

### vulx projects list

List all projects.

```bash
vulx projects list [options]
```

| Option | Description | Default |
|--------|-------------|---------|
| `--url <url>` | API server URL | `http://localhost:3001` |
| `--json` | Output as JSON | `false` |

**Example:**
```bash
vulx projects list
```

Output:
```
Projects
========

ID                                    Name              Last Scan
------------------------------------  ----------------  --------------------
abc123-def456-ghi789                  My API            2024-01-15 10:30:00
xyz789-uvw456-rst123                  Payment Service   2024-01-14 15:45:00
```

---

## vulx report

Generate and download reports.

### vulx report download

Download a scan report as PDF.

```bash
vulx report download [options]
```

| Option | Description | Default |
|--------|-------------|---------|
| `--project-id <id>` | Project ID | Required |
| `--scan-id <id>` | Scan ID | Latest scan |
| `--output <file>` | Output file path | `report.pdf` |
| `--url <url>` | API server URL | `http://localhost:3001` |

**Examples:**

```bash
# Download latest scan report
vulx report download --project-id abc123

# Download specific scan report
vulx report download --project-id abc123 --scan-id scan_xyz789

# Custom output path
vulx report download -p abc123 --output ./reports/api-scan.pdf
```

---

## vulx config

Manage CLI configuration.

### vulx config set

Set a configuration value.

```bash
vulx config set <key> <value>
```

**Available keys:**
- `api-url` - Default API server URL
- `fail-on` - Default failure threshold
- `timeout` - Default scan timeout

**Examples:**
```bash
vulx config set api-url https://api.vulx.io
vulx config set fail-on CRITICAL
vulx config set timeout 300000
```

### vulx config get

Get a configuration value.

```bash
vulx config get <key>
```

### vulx config list

List all configuration values.

```bash
vulx config list
```

---

## Global Options

These options are available for all commands:

| Option | Description |
|--------|-------------|
| `--help` | Show help for command |
| `--version` | Show CLI version |
| `--verbose` | Enable verbose output |

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Command completed successfully |
| 1 | Command failed (findings above threshold for scan) |
| 2 | Scan failed or timed out |
| 3 | Connection or configuration error |
