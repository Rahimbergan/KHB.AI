import json
import os
from pathlib import Path
from typing import Dict, Any, Optional, List
from dotenv import load_dotenv
from anthropic import Anthropic, APIError, APITimeoutError, RateLimitError, AuthenticationError
from backend.app.config import Config, BASE_DIR
from backend.app.utils.logging import logger


class ClaudeClient:
    def __init__(self):
        # Dynamically ensure .env is loaded if key is not yet in environment
        if not os.getenv("ANTHROPIC_API_KEY"):
            env_file = BASE_DIR / ".env"
            if env_file.exists():
                load_dotenv(env_file, override=True)

        self.api_key = (os.getenv("ANTHROPIC_API_KEY") or Config.ANTHROPIC_API_KEY or "").strip()
        self.model = (os.getenv("CLAUDE_MODEL") or Config.CLAUDE_MODEL or "claude-sonnet-4-20250514").strip()
        self.timeout = int(os.getenv("CLAUDE_TIMEOUT_SECONDS") or Config.CLAUDE_TIMEOUT_SECONDS or "60")
        self._client = None

        if self.api_key:
            try:
                self._client = Anthropic(api_key=self.api_key, timeout=self.timeout)
            except Exception as e:
                logger.warning(f"Failed to initialize Anthropic client: {e}")
                self._client = None

    def is_available(self) -> bool:
        # Re-check key dynamically in case env changed at runtime
        if not self.api_key or not self._client:
            self.__init__()
        return bool(self._client and self.api_key)

    def generate_chat_response(
        self,
        system_prompt: str,
        user_message: str,
        context_data: Optional[Dict[str, Any]] = None,
        tools: Optional[List[Dict[str, Any]]] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Sends request to Claude API requesting structured output or tool invocation.
        Returns parsed dict or None on error/unavailability.
        """
        if not self.is_available():
            return None

        prompt_payload = user_message
        if context_data:
            # Mask or limit sensitive fields before sending
            safe_context = {k: v for k, v in context_data.items() if not k.lower().endswith("key")}
            prompt_payload += f"\n\nContext Data (JSON):\n{json.dumps(safe_context, default=str)}"

        try:
            logger.info(f"Dispatching query to Claude ({self.model})...")
            create_kwargs: Dict[str, Any] = {
                "model": self.model,
                "max_tokens": 2000,
                "system": system_prompt,
                "messages": [{"role": "user", "content": prompt_payload}],
            }
            if tools:
                create_kwargs["tools"] = tools

            response = self._client.messages.create(**create_kwargs)

            response_text = ""
            tool_calls = []

            for block in getattr(response, "content", []):
                if hasattr(block, "text"):
                    response_text += block.text
                elif getattr(block, "type", None) == "tool_use":
                    tool_calls.append({
                        "id": getattr(block, "id", None),
                        "name": getattr(block, "name", None),
                        "input": getattr(block, "input", {}),
                    })

            # If no text but tool_calls exist, generate a friendly narrative
            if not response_text.strip() and not tool_calls:
                logger.warning("Claude returned empty content; using deterministic fallback.")
                return None

            # Parse JSON if output is structured
            parsed_json = None
            try:
                clean_text = response_text.strip()
                if "```json" in clean_text:
                    clean_text = clean_text.split("```json")[1].split("```")[0].strip()
                elif "```" in clean_text:
                    clean_text = clean_text.split("```")[1].split("```")[0].strip()
                parsed_json = json.loads(clean_text)
            except Exception:
                pass

            usage_info = {
                "used_claude": True,
                "model": self.model,
                "input_tokens": getattr(response.usage, "input_tokens", None),
                "output_tokens": getattr(response.usage, "output_tokens", None),
            }

            return {
                "text": response_text,
                "structured": parsed_json,
                "tool_calls": tool_calls,
                "usage": usage_info,
            }

        except (AuthenticationError, RateLimitError, APITimeoutError, APIError) as api_err:
            logger.error(f"Claude API request failed: {type(api_err).__name__} - {str(api_err)}")
            return None
        except Exception as exc:
            logger.error(f"Unexpected error calling Claude API: {str(exc)}")
            return None
