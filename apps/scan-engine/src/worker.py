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

        # --- DEDUPLICATION LOGIC ---
        # Fetch findings from the most recent completed scan to preserve state
        previous_states = {} # (type, method, endpoint) -> { status, notes, assignedTo }
        
        if project_id:
            try:
                # Find the last completed scan for this project and environment
                cur.execute("""
                    SELECT id FROM "Scan" 
                    WHERE "projectId" = %s 
                      AND environment = %s
                      AND status = 'COMPLETED'
                      AND id != %s
                    ORDER BY "createdAt" DESC 
                    LIMIT 1
                """, (project_id, environment, scan_id))
                
                last_scan_row = cur.fetchone()
                
                if last_scan_row:
                    last_scan_id = last_scan_row[0]
                    print(f"[SCAN] found previous scan {last_scan_id}, inheriting finding states...")
                    
                    cur.execute("""
                        SELECT type, method, endpoint, status, "resolutionNotes", "assignedTo"
                        FROM "Finding"
                        WHERE "scanId" = %s
                    """, (last_scan_id,))
                    
                    for r in cur.fetchall():
                        # Key: type, method, endpoint
                        # Ensure method is normalized (e.g., uppercase)
                        key = (r[0], r[1].upper() if r[1] else '', r[2])
                        previous_states[key] = {
                            'status': r[3],
                            'resolutionNotes': r[4],
                            'assignedTo': r[5]
                        }
            except Exception as e:
                print(f"[SCAN] Warning: Failed to fetch previous findings: {e}")

        # Save findings to database
        for finding in findings:
            # Determine status based on history
            status = 'OPEN'
            resolution_notes = None
            assigned_to = None
            
            f_key = (finding['type'], finding['method'].upper(), finding['endpoint'])
            
            if f_key in previous_states:
                prev = previous_states[f_key]
                # If previously fixed but found again -> OPEN (Regression)
                # If previously FALSE_POSITIVE -> Keep FALSE_POSITIVE
                # If previously ACCEPTED -> Keep ACCEPTED
                # If previously OPEN -> Keep OPEN
                
                if prev['status'] == 'FIXED':
                    status = 'OPEN'
                    # We could auto-append a note here, but keeping it simple for now
                else:
                    status = prev['status']
                    resolution_notes = prev['resolutionNotes']
                    assigned_to = prev['assignedTo']

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
                status,
                resolution_notes,
                assigned_to
            ))

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
