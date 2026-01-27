import yaml
import json
from prance import ResolvingParser

def parse_openapi_spec(spec_content):
    """
    Parses OpenAPI spec content (JSON or YAML) and resolves references.
    """
    try:
        # Try loading as YAML first (JSON is valid YAML)
        spec = yaml.safe_load(spec_content)
        
        # We might need to handle content vs file path for Prance
        # For MVP, let's assume valid structure and use Prance to validate/resolve if possible
        # Or just return the raw dict if we want to be faster/simpler individually
        
        # Prance requires a URL or file usually, but we have content.
        # We can use ResolvingParser with spec_string.
        
        parser = ResolvingParser(spec_string=spec_content)
        return parser.specification
    except Exception as e:
        print(f"Error parsing spec: {e}")
        return None
