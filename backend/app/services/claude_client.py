import os
import json
import requests
from typing import Dict, Any, Optional
from backend.app.config import Config
from backend.app.utils.logging import logger

class ClaudeClient:
    def __init__(self):
        self.api_key = Config.ANTHROPIC_API_KEY
        self.model = Config.CLAUDE_MODEL

    def is_configured(self) -> bool:
        return bool(self.api_key and self.api_key.strip())

    def generate_response(self, system_prompt: str, user_prompt: str) -> Optional[Dict[str, Any]]:
        if not self.is_configured():
            return None

        try:
            headers = {
                "x-api-key": self.api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json"
            }
            payload = {
                "model": self.model,
                "max_tokens": 2048,
                "system": system_prompt,
                "messages": [
                    {"role": "user", "content": user_prompt}
                ]
            }

            resp = requests.post("https://api.anthropic.com/v1/messages", headers=headers, json=payload, timeout=20)
            if resp.status_code == 200:
                data = resp.json()
                content_blocks = data.get("content", [])
                text = "".join([b.get("text", "") for b in content_blocks if b.get("type") == "text"])
                return {
                    "text": text,
                    "used_claude": True,
                    "model": self.model
                }
            else:
                logger.warning(f"Claude API returned status {resp.status_code}: {resp.text}")
                return None
        except Exception as e:
            logger.error(f"Claude client call failed: {e}")
            return None
