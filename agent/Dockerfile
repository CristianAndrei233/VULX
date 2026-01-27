# VULX Security Scanner Agent
# Enterprise DAST scanner with ZAP, Nuclei, and Schemathesis
#
# Usage:
#   docker build -t vulx-scanner .
#   docker run --rm \
#     -e VULX_API_KEY=your_api_key \
#     -e TARGET_URL=https://api.example.com \
#     -e OPENAPI_SPEC_URL=https://api.example.com/openapi.json \
#     vulx-scanner

FROM python:3.11-slim AS base

LABEL maintainer="VULX Security <security@vulx.io>"
LABEL description="VULX Enterprise Security Scanner Agent"
LABEL version="1.0.0"

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    wget \
    unzip \
    git \
    default-jre-headless \
    libxml2-dev \
    libxslt1-dev \
    && rm -rf /var/lib/apt/lists/*

# ============================================
# Install OWASP ZAP
# ============================================
FROM base AS zap-installer

ARG ZAP_VERSION=2.14.0

RUN wget -q https://github.com/zaproxy/zaproxy/releases/download/v${ZAP_VERSION}/ZAP_${ZAP_VERSION}_Linux.tar.gz \
    && tar -xzf ZAP_${ZAP_VERSION}_Linux.tar.gz \
    && mv ZAP_${ZAP_VERSION} /opt/zap \
    && rm ZAP_${ZAP_VERSION}_Linux.tar.gz

# ============================================
# Install Nuclei
# ============================================
FROM base AS nuclei-installer

ARG NUCLEI_VERSION=3.1.0

RUN wget -q https://github.com/projectdiscovery/nuclei/releases/download/v${NUCLEI_VERSION}/nuclei_${NUCLEI_VERSION}_linux_amd64.zip \
    && unzip nuclei_${NUCLEI_VERSION}_linux_amd64.zip \
    && mv nuclei /usr/local/bin/ \
    && rm nuclei_${NUCLEI_VERSION}_linux_amd64.zip

# Download nuclei templates
RUN nuclei -update-templates -silent

# ============================================
# Final Image
# ============================================
FROM base AS final

# Copy ZAP from installer stage
COPY --from=zap-installer /opt/zap /opt/zap
RUN ln -s /opt/zap/zap.sh /usr/local/bin/zap.sh

# Copy Nuclei from installer stage
COPY --from=nuclei-installer /usr/local/bin/nuclei /usr/local/bin/nuclei
COPY --from=nuclei-installer /root/nuclei-templates /opt/nuclei-templates

# Install Schemathesis
RUN pip install --no-cache-dir schemathesis[all]

# Create app directory
WORKDIR /app

# Copy agent code
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Create non-root user for security
RUN useradd -m -s /bin/bash scanner \
    && chown -R scanner:scanner /app \
    && chown -R scanner:scanner /opt/nuclei-templates

USER scanner

# Environment variables
ENV VULX_API_URL=https://api.vulx.io \
    SCAN_TYPE=standard \
    ZAP_PORT=8090 \
    NUCLEI_TEMPLATES_PATH=/opt/nuclei-templates

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import sys; sys.exit(0)"

# Default command
ENTRYPOINT ["python", "-m", "vulx_agent"]
CMD ["scan"]
