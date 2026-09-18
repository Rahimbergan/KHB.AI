import json
from typing import Dict, Any, Optional
from anthropic import Anthropic, APIError, APITimeoutError, RateLimitError, AuthenticationError
from backend.app.config import Config
from backend.app.utils.logging import logger


class ClaudeClient:
    def __init__(self):
        self.api_key = Config.ANTHROPIC_API_KEY
        self.model = Config.CLAUDE_MODEL
        self.timeout = Config.CLAUDE_TIMEOUT_SECONDS
        self._client = None

        if self.api_key:
            try:
                self._client = Anthropic(api_key=self.api_key, timeout=self.timeout)
            except Exception as e:
                logger.warning(f"Failed to initialize Anthropic client: {e}")
                self._client = None

    def is_available(self) -> bool:
        return bool(self._client and self.api_key)

    def generate_chat_response(
        self,
        system_prompt: str,
        user_message: str,
        context_data: Optional[Dict[str, Any]] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Sends request to Claude API requesting structured JSON output.
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
            response = self._client.messages.create(
                model=self.model,
                max_tokens=4000,
                system=system_prompt,
                messages=[{"role": "user", "content": prompt_payload}],
            )

            response_text = ""
            for block in response.content:
                if hasattr(block, "text"):
                    response_text += block.text

            # Parse JSON if output is structured, or return as response text
            parsed_json = None
            try:
                # Look for ```json ... ``` blocks if any
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
                "usage": usage_info,
            }

        except (AuthenticationError, RateLimitError, APITimeoutError, APIError) as api_err:
            logger.error(f"Claude API request failed: {type(api_err).__name__} - {str(api_err)}")
            return None
        except Exception as exc:
            logger.error(f"Unexpected error calling Claude API: {str(exc)}")
            return None

