"""
VULX Result Reporter
====================
Uploads scan results to VULX platform.
"""

import aiohttp
from typing import Dict, Any, Optional
import structlog

logger = structlog.get_logger()


class ResultReporter:
    """Reports scan results to VULX platform"""

    def __init__(self, api_url: str, api_key: str):
        self.api_url = api_url.rstrip("/")
        self.api_key = api_key

    async def verify_auth(self) -> Dict[str, Any]:
        """Verify API key authentication"""
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{self.api_url}/auth/verify",
                headers={"Authorization": f"Bearer {self.api_key}"}
            ) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    return {"valid": False}

    async def upload_results(
        self,
        project_id: str,
        results: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Upload scan results to VULX platform.

        Args:
            project_id: Project ID
            results: Scan results

        Returns:
            Upload response
        """
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{self.api_url}/projects/{project_id}/scans",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                },
                json=results
            ) as response:
                if response.status in [200, 201]:
                    data = await response.json()
                    logger.info("Results uploaded", scan_id=data.get("id"))
                    return data
                else:
                    error = await response.text()
                    logger.error("Upload failed", status=response.status, error=error)
                    raise Exception(f"Upload failed: {error}")

    async def get_project(self, project_id: str) -> Optional[Dict[str, Any]]:
        """Get project details"""
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{self.api_url}/projects/{project_id}",
                headers={"Authorization": f"Bearer {self.api_key}"}
            ) as response:
                if response.status == 200:
                    return await response.json()
                return None
