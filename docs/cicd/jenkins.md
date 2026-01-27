# Jenkins Integration

Set up VULX scanning in your Jenkins pipelines.

## Prerequisites

- Jenkins 2.x with Pipeline plugin
- Node.js installed on Jenkins agents
- VULX API access

## Quick Setup

### Declarative Pipeline

Create a `Jenkinsfile`:

```groovy
pipeline {
    agent any

    environment {
        VULX_API_URL = credentials('vulx-api-url')
        VULX_API_KEY = credentials('vulx-api-key')
        VULX_PROJECT_ID = 'your-project-id'
    }

    stages {
        stage('Install VULX CLI') {
            steps {
                sh 'npm install -g @vulx/cli'
            }
        }

        stage('Security Scan') {
            steps {
                sh 'vulx scan --project-id $VULX_PROJECT_ID --fail-on HIGH'
            }
        }
    }

    post {
        failure {
            echo 'Security scan failed! Vulnerabilities detected.'
        }
    }
}
```

## Configuration

### Credentials Setup

1. Go to **Manage Jenkins > Credentials**
2. Add credentials:

| ID | Type | Description |
|----|------|-------------|
| `vulx-api-url` | Secret text | API endpoint URL |
| `vulx-api-key` | Secret text | API authentication key |

### Global Tool Configuration

1. Go to **Manage Jenkins > Tools**
2. Add NodeJS installation:
   - Name: `nodejs-20`
   - Version: 20.x

## Pipeline Examples

### Basic Pipeline

```groovy
pipeline {
    agent any

    tools {
        nodejs 'nodejs-20'
    }

    environment {
        VULX_API_URL = credentials('vulx-api-url')
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm install -g @vulx/cli'
            }
        }

        stage('VULX Security Scan') {
            steps {
                sh '''
                    vulx scan \
                        --project-id ${VULX_PROJECT_ID} \
                        --fail-on HIGH
                '''
            }
        }
    }
}
```

### Full CI/CD Pipeline

```groovy
pipeline {
    agent any

    tools {
        nodejs 'nodejs-20'
    }

    environment {
        VULX_API_URL = credentials('vulx-api-url')
        VULX_PROJECT_ID = 'your-project-id'
    }

    stages {
        stage('Build') {
            steps {
                sh 'npm ci'
                sh 'npm run build'
            }
        }

        stage('Test') {
            steps {
                sh 'npm test'
            }
        }

        stage('Security Scan') {
            steps {
                sh 'npm install -g @vulx/cli'
                sh 'vulx scan --project-id $VULX_PROJECT_ID --fail-on HIGH'
            }
        }

        stage('Deploy to Staging') {
            when {
                branch 'develop'
            }
            steps {
                sh './deploy.sh staging'
            }
        }

        stage('Deploy to Production') {
            when {
                branch 'main'
            }
            steps {
                input message: 'Deploy to production?'
                sh './deploy.sh production'
            }
        }
    }

    post {
        failure {
            slackSend(
                color: 'danger',
                message: "Build failed: ${env.JOB_NAME} #${env.BUILD_NUMBER}"
            )
        }
        success {
            slackSend(
                color: 'good',
                message: "Build succeeded: ${env.JOB_NAME} #${env.BUILD_NUMBER}"
            )
        }
    }
}
```

### Parallel Multi-Project Scanning

```groovy
pipeline {
    agent any

    tools {
        nodejs 'nodejs-20'
    }

    environment {
        VULX_API_URL = credentials('vulx-api-url')
    }

    stages {
        stage('Install CLI') {
            steps {
                sh 'npm install -g @vulx/cli'
            }
        }

        stage('Security Scans') {
            parallel {
                stage('API Gateway') {
                    steps {
                        sh 'vulx scan --project-id proj-gateway --fail-on HIGH'
                    }
                }
                stage('Auth Service') {
                    steps {
                        sh 'vulx scan --project-id proj-auth --fail-on HIGH'
                    }
                }
                stage('User Service') {
                    steps {
                        sh 'vulx scan --project-id proj-users --fail-on HIGH'
                    }
                }
            }
        }
    }
}
```

### With Docker Agent

```groovy
pipeline {
    agent {
        docker {
            image 'node:20'
            args '-u root'
        }
    }

    environment {
        VULX_API_URL = credentials('vulx-api-url')
        VULX_PROJECT_ID = 'your-project-id'
    }

    stages {
        stage('Setup') {
            steps {
                sh 'npm install -g @vulx/cli'
            }
        }

        stage('Scan') {
            steps {
                sh 'vulx scan --project-id $VULX_PROJECT_ID --fail-on HIGH'
            }
        }
    }
}
```

### Scripted Pipeline

```groovy
node {
    def vulxProjectId = 'your-project-id'

    stage('Checkout') {
        checkout scm
    }

    stage('Security Scan') {
        withCredentials([
            string(credentialsId: 'vulx-api-url', variable: 'VULX_API_URL')
        ]) {
            nodejs('nodejs-20') {
                sh 'npm install -g @vulx/cli'

                def scanResult = sh(
                    script: "vulx scan --project-id ${vulxProjectId} --fail-on HIGH --json",
                    returnStatus: true
                )

                if (scanResult != 0) {
                    currentBuild.result = 'UNSTABLE'
                    echo 'Security vulnerabilities detected!'
                }
            }
        }
    }
}
```

## Shared Library

Create a shared library for reusable VULX scanning:

### vars/vulxScan.groovy

```groovy
def call(Map config = [:]) {
    def projectId = config.projectId ?: error('projectId is required')
    def failOn = config.failOn ?: 'HIGH'
    def timeout = config.timeout ?: 120000

    withCredentials([
        string(credentialsId: 'vulx-api-url', variable: 'VULX_API_URL')
    ]) {
        sh "npm install -g @vulx/cli"
        sh """
            vulx scan \
                --project-id ${projectId} \
                --fail-on ${failOn} \
                --timeout ${timeout}
        """
    }
}
```

### Usage

```groovy
@Library('my-shared-library') _

pipeline {
    agent any

    stages {
        stage('Security Scan') {
            steps {
                vulxScan(
                    projectId: 'your-project-id',
                    failOn: 'HIGH'
                )
            }
        }
    }
}
```

## Reporting

### Archive Scan Results

```groovy
stage('Security Scan') {
    steps {
        sh 'vulx scan --project-id $VULX_PROJECT_ID --json > vulx-report.json || true'
        archiveArtifacts artifacts: 'vulx-report.json', fingerprint: true
    }
}
```

### HTML Report

```groovy
stage('Security Scan') {
    steps {
        sh '''
            vulx scan --project-id $VULX_PROJECT_ID --json > vulx-report.json || true
            node generate-html-report.js vulx-report.json > vulx-report.html
        '''
        publishHTML([
            reportDir: '.',
            reportFiles: 'vulx-report.html',
            reportName: 'VULX Security Report'
        ])
    }
}
```

## Troubleshooting

### Common Issues

**Node.js not found:**
- Configure NodeJS in Jenkins tools
- Or install manually: `sh 'curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs'`

**Permission denied:**
```groovy
sh 'npm install -g @vulx/cli --unsafe-perm'
```

**Credential errors:**
- Verify credential IDs match
- Check credential scope (global vs folder)

**Timeout issues:**
```groovy
timeout(time: 10, unit: 'MINUTES') {
    sh 'vulx scan --project-id $VULX_PROJECT_ID --timeout 300000'
}
```

## Next Steps

- Configure [Blue Ocean](https://www.jenkins.io/projects/blueocean/) for better visualization
- Set up [Jenkins shared libraries](https://www.jenkins.io/doc/book/pipeline/shared-libraries/)
- Add [Slack notifications](/cicd/notifications)
