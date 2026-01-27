# CLI Configuration

Configure the VULX CLI for your environment.

## Configuration Methods

The CLI reads configuration from multiple sources (in order of priority):

1. Command-line arguments (highest priority)
2. Environment variables
3. Configuration file
4. Default values (lowest priority)

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VULX_API_URL` | API server URL | `https://api.vulx.io` |
| `VULX_PROJECT_ID` | Default project ID | `abc123-def456` |
| `VULX_FAIL_ON` | Failure threshold | `HIGH` |
| `VULX_TIMEOUT` | Scan timeout (ms) | `120000` |
| `VULX_API_KEY` | API authentication key | `vx_live_abc123` |

### Example: Shell Configuration

Add to your `~/.bashrc` or `~/.zshrc`:

```bash
export VULX_API_URL=https://api.vulx.io
export VULX_API_KEY=vx_live_your_api_key_here
export VULX_FAIL_ON=HIGH
```

## Configuration File

Create a `.vulxrc` file in your project root or home directory:

```json
{
  "apiUrl": "https://api.vulx.io",
  "projectId": "abc123-def456",
  "failOn": "HIGH",
  "timeout": 120000
}
```

Or use YAML format (`.vulxrc.yml`):

```yaml
apiUrl: https://api.vulx.io
projectId: abc123-def456
failOn: HIGH
timeout: 120000
```

### Configuration File Locations

The CLI searches for configuration files in this order:

1. `.vulxrc` or `.vulxrc.yml` in current directory
2. `.vulxrc` or `.vulxrc.yml` in project root (nearest `package.json`)
3. `~/.vulxrc` or `~/.vulxrc.yml` in home directory
4. `/etc/vulx/config` (system-wide, Linux/macOS)

## Per-Project Configuration

For monorepos or multi-project setups, create a `.vulxrc` in each project directory:

```
my-monorepo/
├── .vulxrc                    # Default settings
├── services/
│   ├── api/
│   │   └── .vulxrc           # API service config
│   └── auth/
│       └── .vulxrc           # Auth service config
```

## CI/CD Configuration

### GitHub Actions

Use secrets for sensitive values:

```yaml
- name: Run VULX Scan
  env:
    VULX_API_URL: ${{ secrets.VULX_API_URL }}
    VULX_API_KEY: ${{ secrets.VULX_API_KEY }}
  run: vulx scan --project-id ${{ vars.VULX_PROJECT_ID }}
```

### GitLab CI

```yaml
vulx-scan:
  script:
    - vulx scan --project-id $VULX_PROJECT_ID
  variables:
    VULX_API_URL: $VULX_API_URL
    VULX_API_KEY: $VULX_API_KEY
```

## Configuration Precedence Example

Given:
- Environment: `VULX_FAIL_ON=CRITICAL`
- Config file: `failOn: HIGH`
- Command line: `--fail-on MEDIUM`

The CLI will use `MEDIUM` (command line has highest priority).

## Validating Configuration

Check your current configuration:

```bash
vulx config list
```

Output:
```
VULX CLI Configuration
======================

Source          Key          Value
--------------  -----------  -------------------------
command line    fail-on      MEDIUM
environment     api-url      https://api.vulx.io
config file     project-id   abc123-def456
default         timeout      120000
```

## Security Best Practices

1. **Never commit API keys** - Use environment variables or secrets management
2. **Use project-specific configs** - Avoid global configs with sensitive data
3. **Rotate API keys regularly** - Especially in CI/CD environments
4. **Restrict key permissions** - Use read-only keys where possible

```bash
# Good: API key from environment
VULX_API_KEY=$(vault read -field=value secret/vulx/api-key) vulx scan -p abc123

# Bad: API key in config file committed to repo
# Don't do this!
```
