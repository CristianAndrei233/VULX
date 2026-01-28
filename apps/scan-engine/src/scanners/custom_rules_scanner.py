"""
Custom Rules Scanner
Loads and applies user-defined custom rules from the database.
"""

import re
import json
import os
import psycopg2
from typing import List, Dict, Any, Optional


class CustomRulesScanner:
    """
    Scanner that applies custom user-defined rules to API responses.
    Fetches rules from database and matches them against scan targets.
    """
    
    def __init__(self, organization_id: str):
        """
        Initialize the custom rules scanner.
        
        Args:
            organization_id: UUID of the organization to load rules for
        """
        self.organization_id = organization_id
        self.rules = self._load_rules()
        
    def _get_db_connection(self):
        """Get database connection."""
        return psycopg2.connect(
            host=os.environ.get('DB_HOST', 'localhost'),
            database=os.environ.get('DB_NAME', 'vulx_db'),
            user=os.environ.get('DB_USER', 'vulx'),
            password=os.environ.get('DB_PASS', 'vulx_password')
        )
    
    def _load_rules(self) -> List[Dict[str, Any]]:
        """Load active custom rules from database."""
        try:
            conn = self._get_db_connection()
            cur = conn.cursor()
            
            cur.execute("""
                SELECT id, name, description, pattern, "patternType", 
                       target, severity, message
                FROM "CustomRule"
                WHERE "organizationId" = %s AND "isActive" = true
            """, (self.organization_id,))
            
            rules = []
            for row in cur.fetchall():
                rules.append({
                    'id': row[0],
                    'name': row[1],
                    'description': row[2],
                    'pattern': row[3],
                    'pattern_type': row[4],
                    'target': row[5],
                    'severity': row[6],
                    'message': row[7],
                })
            
            cur.close()
            conn.close()
            
            print(f"[CUSTOM_RULES] Loaded {len(rules)} custom rules for org {self.organization_id}")
            return rules
            
        except Exception as e:
            print(f"[CUSTOM_RULES] Failed to load rules: {e}")
            return []
    
    def scan_content(self, content: str, target_type: str, endpoint: str, method: str) -> List[Dict[str, Any]]:
        """
        Scan content against custom rules.
        
        Args:
            content: The content to scan (response body, headers, etc.)
            target_type: Type of content ('response', 'request', 'header', 'url')
            endpoint: The API endpoint being scanned
            method: HTTP method
            
        Returns:
            List of findings for matched rules
        """
        findings = []
        
        for rule in self.rules:
            # Skip if rule doesn't apply to this target type
            if rule['target'] != target_type and rule['target'] != 'body':
                continue
            
            matched = self._match_pattern(
                content,
                rule['pattern'],
                rule['pattern_type']
            )
            
            if matched:
                findings.append({
                    'type': 'CUSTOM_RULE',
                    'severity': rule['severity'],
                    'title': rule['name'],
                    'description': rule['message'] or rule['description'] or f"Custom rule '{rule['name']}' matched",
                    'endpoint': endpoint,
                    'method': method,
                    'evidence': matched.get('evidence', ''),
                    'owasp_category': 'Custom',
                    'cwe_id': None,
                    'remediation': f"Review this finding based on your custom rule: {rule['description']}",
                    'custom_rule_id': rule['id'],
                })
                
        return findings
    
    def _match_pattern(self, content: str, pattern: str, pattern_type: str) -> Optional[Dict[str, Any]]:
        """
        Match content against a pattern using the specified pattern type.
        
        Args:
            content: Content to search
            pattern: Pattern to match
            pattern_type: Type of matching ('regex', 'contains', 'exact', 'json_path')
            
        Returns:
            Match result dict with 'evidence' if matched, None otherwise
        """
        if not content or not pattern:
            return None
            
        try:
            if pattern_type == 'regex':
                match = re.search(pattern, content, re.IGNORECASE | re.MULTILINE)
                if match:
                    return {'evidence': f"Matched: {match.group(0)[:200]}"}
                    
            elif pattern_type == 'contains':
                if pattern.lower() in content.lower():
                    # Find the match location for context
                    idx = content.lower().find(pattern.lower())
                    start = max(0, idx - 20)
                    end = min(len(content), idx + len(pattern) + 20)
                    context = content[start:end]
                    return {'evidence': f"Found at position {idx}: ...{context}..."}
                    
            elif pattern_type == 'exact':
                if pattern in content:
                    return {'evidence': f"Exact match found for: {pattern[:100]}"}
                    
            elif pattern_type == 'json_path':
                # Simple JSON path matching for common patterns like $.data.secret
                try:
                    data = json.loads(content)
                    value = self._get_json_path(data, pattern)
                    if value is not None:
                        return {'evidence': f"JSON path {pattern} = {str(value)[:100]}"}
                except json.JSONDecodeError:
                    pass
                    
        except Exception as e:
            print(f"[CUSTOM_RULES] Pattern match error: {e}")
            
        return None
    
    def _get_json_path(self, data: Any, path: str) -> Optional[Any]:
        """
        Simple JSON path extraction.
        Supports basic paths like $.key.nested.field
        
        Args:
            data: Parsed JSON data
            path: JSON path string
            
        Returns:
            Value at path if found, None otherwise
        """
        if not path.startswith('$'):
            return None
            
        path = path[1:]  # Remove leading $
        if path.startswith('.'):
            path = path[1:]  # Remove leading .
            
        parts = path.split('.')
        current = data
        
        for part in parts:
            if not part:
                continue
                
            # Handle array indexing like [0]
            if '[' in part and ']' in part:
                key = part[:part.index('[')]
                idx = int(part[part.index('[') + 1:part.index(']')])
                
                if key:
                    if isinstance(current, dict) and key in current:
                        current = current[key]
                    else:
                        return None
                        
                if isinstance(current, list) and len(current) > idx:
                    current = current[idx]
                else:
                    return None
            else:
                if isinstance(current, dict) and part in current:
                    current = current[part]
                else:
                    return None
                    
        return current


def run_custom_rules_scan(organization_id: str, spec: Dict, responses: Dict[str, str]) -> List[Dict]:
    """
    Run custom rules scan on API responses.
    
    Args:
        organization_id: Organization UUID
        spec: Parsed OpenAPI spec
        responses: Dict mapping endpoint/method to response content
        
    Returns:
        List of findings from custom rules
    """
    scanner = CustomRulesScanner(organization_id)
    
    if not scanner.rules:
        return []
    
    all_findings = []
    
    for key, content in responses.items():
        try:
            endpoint, method = key.split('|')
            findings = scanner.scan_content(content, 'response', endpoint, method)
            all_findings.extend(findings)
        except Exception as e:
            print(f"[CUSTOM_RULES] Error scanning {key}: {e}")
    
    return all_findings
