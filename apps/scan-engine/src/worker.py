"""
VULX Scan Engine Worker
Processes scan jobs from Redis queue and runs OWASP API Top 10 security analysis.
"""

import json
import redis
import time
import os
import psycopg2
from src.parser import parse_openapi_spec
from src.scanners.owasp_scanner import OWASPScanner

# Redis connection
REDIS_HOST = os.environ.get('REDIS_HOST', 'localhost')
REDIS_PORT = int(os.environ.get('REDIS_PORT', 6379))
redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=0)

# Postgres connection
DB_HOST = os.environ.get('DB_HOST', 'localhost')
DB_NAME = os.environ.get('DB_NAME', 'vulx_db')
DB_USER = os.environ.get('DB_USER', 'vulx')
DB_PASS = os.environ.get('DB_PASS', 'vulx_password')


def get_db_connection():
    """Create a new database connection."""
    return psycopg2.connect(
        host=DB_HOST,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASS
    )


def process_scan(scan_id: str, spec_content: str):
    """
    Process a scan job by running OWASP API Top 10 security checks.

    Args:
        scan_id: UUID of the scan record
        spec_content: OpenAPI specification content (YAML or JSON)
    """
    print(f"[SCAN] Processing scan {scan_id}")

    conn = get_db_connection()
    cur = conn.cursor()

    # Update status to PROCESSING
    cur.execute(
        'UPDATE "Scan" SET status = %s WHERE id = %s',
        ('PROCESSING', scan_id)
    )
    conn.commit()

    try:
        # Fetch project info for deduplication
        cur.execute('SELECT "projectId", "environment" FROM "Scan" WHERE id = %s', (scan_id,))
        project_row = cur.fetchone()
        
        project_id = None
        environment = 'PRODUCTION'
        
        if project_row:
            project_id, environment = project_row

        # Parse the OpenAPI specification
        print(f"[SCAN] Parsing OpenAPI specification...")
        spec = parse_openapi_spec(spec_content)

        if not spec:
            raise Exception("Failed to parse OpenAPI specification")

        # Initialize the OWASP scanner
        print(f"[SCAN] Running OWASP API Top 10 security checks...")
        scanner = OWASPScanner(spec)
        findings = scanner.scan()

        print(f"[SCAN] Found {len(findings)} potential security issues")

        # Categorize findings by severity for logging
        severity_counts = {}
        for f in findings:
            sev = f['severity']
            severity_counts[sev] = severity_counts.get(sev, 0) + 1

        print(f"[SCAN] Severity breakdown: {severity_counts}")

        # --- ROBUST DEDUPLICATION LOGIC ---
        # Fetch findings from ALL previous completed scans for this project+environment
        # This ensures we never duplicate findings and properly track their lifecycle
        previous_findings = {}  # (type, method, endpoint) -> { id, status, notes, assignedTo, scanId }

        if project_id:
            try:
                # Find ALL findings for this project+environment across all scans
                # We use the most recent state of each unique finding
                cur.execute("""
                    SELECT DISTINCT ON (f.type, f.method, f.endpoint)
                        f.id, f.type, f.method, f.endpoint, f.status,
                        f."resolutionNotes", f."assignedTo", f."scanId",
                        f."createdAt"
                    FROM "Finding" f
                    JOIN "Scan" s ON f."scanId" = s.id
                    WHERE s."projectId" = %s
                      AND s.environment = %s
                      AND s.status = 'COMPLETED'
                    ORDER BY f.type, f.method, f.endpoint, f."createdAt" DESC
                """, (project_id, environment))

                for r in cur.fetchall():
                    # Key: type, method, endpoint (normalized)
                    key = (r[1], r[2].upper() if r[2] else '', r[3])
                    previous_findings[key] = {
                        'id': r[0],
                        'status': r[4],
                        'resolutionNotes': r[5],
                        'assignedTo': r[6],
                        'scanId': r[7]
                    }

                print(f"[SCAN] Found {len(previous_findings)} unique findings from previous scans")
            except Exception as e:
                print(f"[SCAN] Warning: Failed to fetch previous findings: {e}")

        # Save findings to database with deduplication
        # Track: new findings created, existing findings linked, regressions detected
        new_findings_count = 0
        linked_findings_count = 0
        regression_count = 0

        for finding in findings:
            f_key = (finding['type'], finding['method'].upper(), finding['endpoint'])

            # Check if this finding already exists in this project
            if f_key in previous_findings:
                prev = previous_findings[f_key]
                linked_findings_count += 1

                # Determine if this is a regression (was FIXED, now found again)
                if prev['status'] == 'FIXED':
                    regression_count += 1
                    # Create a new finding marked as regression
                    cur.execute("""
                        INSERT INTO "Finding" (
                            id, "scanId", type, severity, description,
                            endpoint, method, remediation, "owaspCategory",
                            "cweId", evidence, "createdAt",
                            status, "resolutionNotes", "assignedTo"
                        )
                        VALUES (
                            gen_random_uuid(), %s, %s, %s, %s,
                            %s, %s, %s, %s,
                            %s, %s, NOW(),
                            'OPEN', %s, %s
                        )
                    """, (
                        scan_id,
                        finding['type'],
                        finding['severity'],
                        finding['description'],
                        finding['endpoint'],
                        finding['method'],
                        finding.get('remediation', ''),
                        finding.get('owasp_category', ''),
                        finding.get('cwe_id'),
                        finding.get('evidence'),
                        f"REGRESSION: Previously fixed, found again in scan. Original notes: {prev['resolutionNotes'] or 'None'}",
                        prev['assignedTo']
                    ))
                    print(f"[SCAN] Regression detected: {finding['type']} on {finding['method']} {finding['endpoint']}")
                elif prev['status'] in ('FALSE_POSITIVE', 'ACCEPTED'):
                    # Skip findings that were marked as false positive or accepted
                    # They should not reappear in new scans
                    print(f"[SCAN] Skipping {prev['status']} finding: {finding['type']} on {finding['endpoint']}")
                    continue
                else:
                    # OPEN or IN_PROGRESS - link to current scan with inherited state
                    cur.execute("""
                        INSERT INTO "Finding" (
                            id, "scanId", type, severity, description,
                            endpoint, method, remediation, "owaspCategory",
                            "cweId", evidence, "createdAt",
                            status, "resolutionNotes", "assignedTo"
                        )
                        VALUES (
                            gen_random_uuid(), %s, %s, %s, %s,
                            %s, %s, %s, %s,
                            %s, %s, NOW(),
                            %s, %s, %s
                        )
                    """, (
                        scan_id,
                        finding['type'],
                        finding['severity'],
                        finding['description'],
                        finding['endpoint'],
                        finding['method'],
                        finding.get('remediation', ''),
                        finding.get('owasp_category', ''),
                        finding.get('cwe_id'),
                        finding.get('evidence'),
                        prev['status'],
                        prev['resolutionNotes'],
                        prev['assignedTo']
                    ))
            else:
                # New finding - create fresh entry
                new_findings_count += 1
                cur.execute("""
                    INSERT INTO "Finding" (
                        id, "scanId", type, severity, description,
                        endpoint, method, remediation, "owaspCategory",
                        "cweId", evidence, "createdAt",
                        status, "resolutionNotes", "assignedTo"
                    )
                    VALUES (
                        gen_random_uuid(), %s, %s, %s, %s,
                        %s, %s, %s, %s,
                        %s, %s, NOW(),
                        'OPEN', NULL, NULL
                    )
                """, (
                    scan_id,
                    finding['type'],
                    finding['severity'],
                    finding['description'],
                    finding['endpoint'],
                    finding['method'],
                    finding.get('remediation', ''),
                    finding.get('owasp_category', ''),
                    finding.get('cwe_id'),
                    finding.get('evidence')
                ))

        print(f"[SCAN] Deduplication summary: {new_findings_count} new, {linked_findings_count} existing, {regression_count} regressions")

        # Update scan status to COMPLETED
        cur.execute(
            'UPDATE "Scan" SET status = %s, "completedAt" = NOW() WHERE id = %s',
            ('COMPLETED', scan_id)
        )
        conn.commit()

        # Trigger notifications for scan completion
        try:
            import urllib.request
            api_url = os.environ.get('API_URL', 'http://localhost:3001')
            req = urllib.request.Request(
                f"{api_url}/api/internal/notify-scan-complete",
                data=json.dumps({'scanId': scan_id}).encode('utf-8'),
                headers={'Content-Type': 'application/json'}
            )
            urllib.request.urlopen(req, timeout=5)
            print(f"[SCAN] Notification triggered for scan {scan_id}")
        except Exception as notify_error:
            print(f"[SCAN] Warning: Failed to trigger notification: {notify_error}")

        print(f"[SCAN] Scan {scan_id} completed successfully with {len(findings)} findings")

    except Exception as e:
        print(f"[SCAN] Scan {scan_id} failed: {e}")
        import traceback
        traceback.print_exc()

        cur.execute(
            'UPDATE "Scan" SET status = %s WHERE id = %s',
            ('FAILED', scan_id)
        )
        conn.commit()

    finally:
        cur.close()
        conn.close()


def run_worker():
    """
    Main worker loop - continuously polls Redis queue for scan jobs.
    """
    print("=" * 60)
    print("VULX Scan Engine Worker")
    print("=" * 60)
    print(f"Redis: {REDIS_HOST}:{REDIS_PORT}")
    print(f"Database: {DB_HOST}/{DB_NAME}")
    print("=" * 60)
    print("[WORKER] Started, waiting for scan jobs on 'vulx:scan-queue'...")

    while True:
        try:
            # Wait for job from Redis queue (blocking pop with 5s timeout)
            task = redis_client.blpop("vulx:scan-queue", timeout=5)

            if task:
                queue_name, job_data_raw = task
                job_data = json.loads(job_data_raw)

                scan_id = job_data.get('scanId')
                spec_content = job_data.get('specContent')

                if scan_id and spec_content:
                    process_scan(scan_id, spec_content)
                else:
                    print(f"[WORKER] Invalid job data received: missing scanId or specContent")

        except redis.ConnectionError as e:
            print(f"[WORKER] Redis connection error: {e}")
            print("[WORKER] Retrying in 5 seconds...")
            time.sleep(5)

        except json.JSONDecodeError as e:
            print(f"[WORKER] Failed to parse job data: {e}")

        except Exception as e:
            print(f"[WORKER] Unexpected error: {e}")
            import traceback
            traceback.print_exc()
            time.sleep(1)


if __name__ == "__main__":
    run_worker()
