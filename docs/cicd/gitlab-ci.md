# GitLab CI Integration

Set up VULX scanning in your GitLab CI/CD pipelines.

## Quick Setup

Add to your `.gitlab-ci.yml`:

```yaml
stages:
  - test
  - security
  - deploy

vulx-scan:
  stage: security
  image: node:20
  before_script:
    - npm install -g @vulx/cli
  script:
    - vulx scan --project-id $VULX_PROJECT_ID --fail-on HIGH
  variables:
    VULX_API_URL: $VULX_API_URL
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
```

## Configuration

### CI/CD Variables

Configure in **Settings > CI/CD > Variables**:

| Variable | Type | Protected | Masked | Description |
|----------|------|-----------|--------|-------------|
| `VULX_API_URL` | Variable | Yes | No | API endpoint URL |
| `VULX_API_KEY` | Variable | Yes | Yes | API authentication key |
| `VULX_PROJECT_ID` | Variable | No | No | Project ID to scan |

## Pipeline Examples

### Merge Request Scanning

```yaml
vulx-mr-scan:
  stage: security
  image: node:20
  before_script:
    - npm install -g @vulx/cli
  script:
    - vulx scan --project-id $VULX_PROJECT_ID --fail-on HIGH
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
  allow_failure: false
```

### Production Gate

```yaml
stages:
  - build
  - test
  - security
  - deploy

build:
  stage: build
  script:
    - npm run build

test:
  stage: test
  script:
    - npm test

vulx-security-gate:
  stage: security
  image: node:20
  before_script:
    - npm install -g @vulx/cli
  script:
    - vulx scan --project-id $VULX_PROJECT_ID --fail-on CRITICAL
  rules:
    - if: $CI_COMMIT_BRANCH == "main"

deploy-production:
  stage: deploy
  script:
    - ./deploy.sh production
  needs:
    - vulx-security-gate
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
  when: on_success
```

### Scheduled Scanning

```yaml
vulx-scheduled-scan:
  stage: security
  image: node:20
  before_script:
    - npm install -g @vulx/cli
  script:
    - vulx scan --project-id $VULX_PROJECT_ID --fail-on MEDIUM --json > results.json
  artifacts:
    paths:
      - results.json
    expire_in: 30 days
  rules:
    - if: $CI_PIPELINE_SOURCE == "schedule"
```

Create the schedule in **CI/CD > Schedules**.

### Multi-Project Parallel Scanning

```yaml
.vulx-scan-template:
  stage: security
  image: node:20
  before_script:
    - npm install -g @vulx/cli
  script:
    - vulx scan --project-id $PROJECT_ID --fail-on HIGH

scan-api-gateway:
  extends: .vulx-scan-template
  variables:
    PROJECT_ID: proj-gateway

scan-auth-service:
  extends: .vulx-scan-template
  variables:
    PROJECT_ID: proj-auth

scan-user-service:
  extends: .vulx-scan-template
  variables:
    PROJECT_ID: proj-users
```

### With Docker

```yaml
vulx-scan:
  stage: security
  image: docker:24
  services:
    - docker:dind
  before_script:
    - docker run -d --name vulx-cli node:20 sleep infinity
    - docker exec vulx-cli npm install -g @vulx/cli
  script:
    - |
      docker exec \
        -e VULX_API_URL=$VULX_API_URL \
        vulx-cli vulx scan --project-id $VULX_PROJECT_ID --fail-on HIGH
  after_script:
    - docker rm -f vulx-cli
```

## Integration Features

### Security Dashboard Integration

Add security report for GitLab's Security Dashboard:

```yaml
vulx-scan:
  stage: security
  image: node:20
  before_script:
    - npm install -g @vulx/cli
  script:
    - vulx scan --project-id $VULX_PROJECT_ID --json > vulx-results.json
    - node convert-to-gitlab-format.js vulx-results.json > gl-sast-report.json
  artifacts:
    reports:
      sast: gl-sast-report.json
```

### Merge Request Comments

```yaml
vulx-scan:
  stage: security
  image: node:20
  before_script:
    - npm install -g @vulx/cli
  script:
    - |
      if ! vulx scan --project-id $VULX_PROJECT_ID --fail-on HIGH 2>&1 | tee scan-output.txt; then
        curl --request POST \
          --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
          --form "body=:warning: VULX scan found vulnerabilities. See job $CI_JOB_URL for details." \
          "$CI_API_V4_URL/projects/$CI_PROJECT_ID/merge_requests/$CI_MERGE_REQUEST_IID/notes"
        exit 1
      fi
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
```

## Environment-Specific Configuration

```yaml
variables:
  VULX_API_URL: https://api.vulx.io

.vulx-base:
  image: node:20
  before_script:
    - npm install -g @vulx/cli

vulx-scan-dev:
  extends: .vulx-base
  stage: security
  script:
    - vulx scan --project-id $VULX_PROJECT_ID --fail-on CRITICAL
  rules:
    - if: $CI_COMMIT_BRANCH =~ /^feature\//
  allow_failure: true

vulx-scan-staging:
  extends: .vulx-base
  stage: security
  script:
    - vulx scan --project-id $VULX_PROJECT_ID --fail-on HIGH
  rules:
    - if: $CI_COMMIT_BRANCH == "staging"

vulx-scan-production:
  extends: .vulx-base
  stage: security
  script:
    - vulx scan --project-id $VULX_PROJECT_ID --fail-on CRITICAL
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
```

## Troubleshooting

### Common Issues

**Job times out:**
```yaml
vulx-scan:
  timeout: 10 minutes
  script:
    - vulx scan --project-id $VULX_PROJECT_ID --timeout 300000
```

**Variable not found:**
- Check variable is set in CI/CD settings
- Verify variable is not protected (if running on unprotected branch)
- Check for typos in variable names

**Network connectivity:**
```yaml
vulx-scan:
  script:
    - curl -I $VULX_API_URL/health  # Debug connectivity
    - vulx scan --project-id $VULX_PROJECT_ID
```

## Next Steps

- Set up [scheduled pipelines](https://docs.gitlab.com/ee/ci/pipelines/schedules.html)
- Configure [protected branches](https://docs.gitlab.com/ee/user/project/protected_branches.html)
- Add [Slack notifications](/cicd/notifications)
