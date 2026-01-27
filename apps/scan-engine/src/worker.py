import json
import redis
import time
import os
import psycopg2
from src.parser import parse_openapi_spec

# Redis connection
redis_client = redis.Redis(host='localhost', port=6379, db=0)

# Postgres connection
DB_HOST = "localhost"
DB_NAME = "vulx_db"
DB_USER = "vulx"
DB_PASS = "vulx_password"

def get_db_connection():
    return psycopg2.connect(
        host=DB_HOST,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASS
    )

def process_scan(scan_id, spec_content):
    print(f"Processing scan {scan_id}")
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Update status to PROCESSING
    cur.execute("UPDATE \"Scan\" SET status = 'PROCESSING' WHERE id = %s", (scan_id,))
    conn.commit()
    
    try:
        spec = parse_openapi_spec(spec_content)
        if not spec:
            raise Exception("Failed to parse OpenAPI spec")
            
        # Mock finding generation logic
        endpoints = spec.get('paths', {})
        findings = []
        
        for path, methods in endpoints.items():
            for method in methods:
                # Dummy check: Look for "admin" in path
                if "admin" in path.lower():
                    findings.append({
                        "id": f"{scan_id}-{path}-{method}", # logic id
                        "type": "SENSITIVE_FLOW",
                        "severity": "HIGH",
                        "description": f"Potential administrative endpoint exposed: {method.upper()} {path}",
                        "endpoint": path,
                        "method": method.upper()
                    })

        # Save findings
        for f in findings:
            cur.execute("""
                INSERT INTO "Finding" (id, "scanId", type, severity, description, endpoint, method, "createdAt")
                VALUES (gen_random_uuid(), %s, %s, %s, %s, %s, %s, NOW())
            """, (scan_id, f['type'], f['severity'], f['description'], f['endpoint'], f['method']))
            
        # Update status to COMPLETED
        cur.execute("UPDATE \"Scan\" SET status = 'COMPLETED', \"completedAt\" = NOW() WHERE id = %s", (scan_id,))
        conn.commit()
        print(f"Scan {scan_id} completed with {len(findings)} findings.")
        
    except Exception as e:
        print(f"Scan failed: {e}")
        cur.execute("UPDATE \"Scan\" SET status = 'FAILED' WHERE id = %s", (scan_id,))
        conn.commit()
    finally:
        cur.close()
        conn.close()

def run_worker():
    print("Worker started, waiting for jobs...")
    while True:
        # BullMQ uses specific key structures, but we can stick to a simpler list for MVP 
        # OR we need to decode BullMQ's format.
        # BullMQ adds jobs to a list, but also manages state in hashes.
        # For simplicity in this heterogenous stack (Node producer, Python consumer), 
        # it's easiest if Python assumes a simple Redis list or Pub/Sub, OR we reverse engineer BullMQ.
        # BUT the plan implied BullMQ. 
        # BullMQ stores jobs in `bull:scan-jobs:wait` (list of IDs) and job data in `bull:scan-jobs:<id>`.
        # That is complex to reimplement in Python without a library.
        
        # ALTERNATIVE: Use a simple shared list "vulx:scan-queue" for this MVP to ensure interoperability easily.
        # I'll update the Node producer to use a simple RPUSH to "vulx:scan-queue" ALONGSIDE or INSTEAD of BullMQ 
        # if I want to keep it simple for now, OR I use a Python BullMQ port.
        # Let's use a simple RPUSH for MVP interoperability.
        
        # Wait for job from 'vulx:scan-queue'
        task = redis_client.blpop("vulx:scan-queue", timeout=5)
        if task:
            queue_name, job_data_raw = task
            job_data = json.loads(job_data_raw)
            process_scan(job_data['scanId'], job_data['specContent'])
            
if __name__ == "__main__":
    run_worker()
