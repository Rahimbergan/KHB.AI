import json
from datetime import date, datetime
from typing import Dict, Any, List, Optional
from backend.app.services.email_service import EmailService
from backend.app.services.cache_service import cache
from backend.app.services.sales_analyzer import SalesAnalyzer
from backend.app.utils.dates import parse_date
from backend.app.utils.logging import logger


class AgentTools:
    """
    Registry of tools accessible by the AI Agent.
    Compatible with Anthropic tool-use schema and deterministic dispatcher.
    """

    TOOLS_SCHEMA = [
        {
            "name": "send_email",
            "description": "Send an operational report, notification, or message to a user or manager via Gmail SMTP.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "to_email": {
                        "type": "string",
                        "description": "Recipient email address or comma-separated list of addresses (e.g. 'ceo@khb.uz')."
                    },
                    "subject": {
                        "type": "string",
                        "description": "Subject line of the email."
                    },
                    "body": {
                        "type": "string",
                        "description": "The textual or markdown content of the email to send."
                    }
                },
                "required": ["to_email", "subject", "body"]
            }
        },
        {
            "name": "get_sales_kpi",
            "description": "Retrieve daily or monthly sales metrics (revenue, orders, margin, profit) for a specific date or period.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "date": {
                        "type": "string",
                        "description": "The target date in YYYY-MM-DD format (defaults to 2026-01-31 if omitted)."
                    }
                }
            }
        },
        {
            "name": "get_top_products",
            "description": "Retrieve the highest performing products by revenue for a specific date.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "date": {
                        "type": "string",
                        "description": "Target date in YYYY-MM-DD format."
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Number of top products to retrieve (default 5)."
                    }
                }
            }
        }
    ]

    @classmethod
    def get_schemas(cls) -> List[Dict[str, Any]]:
        return cls.TOOLS_SCHEMA

    @classmethod
    def execute(cls, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Dispatches and executes the requested tool."""
        logger.info(f"Agent executing tool '{tool_name}' with args: {arguments}")

        if tool_name == "send_email":
            to_email = arguments.get("to_email", "")
            subject = arguments.get("subject", "KHB Assistant Notification")
            body = arguments.get("body", "")

            result = EmailService.send_email(
                to_email=to_email,
                subject=subject,
                text_content=body,
            )
            return {
                "tool": "send_email",
                "success": result.get("success", False),
                "recipients": result.get("recipients", []),
                "error": result.get("error"),
                "message": f"Email successfully dispatched to {result.get('recipients')}" if result.get("success") else f"Failed to send email: {result.get('error')}",
            }

        elif tool_name == "get_sales_kpi":
            target_str = arguments.get("date") or "2026-01-31"
            # Check fast preloaded cache first
            cached = cache.get_preloaded_operational_data(target_str)
            if cached:
                return {"tool": "get_sales_kpi", "source": "redis_cache", "data": cached}

            try:
                target = parse_date(target_str)
            except Exception:
                target = date(2026, 1, 31)

            analysis = SalesAnalyzer.analyze_period(target, target)
            return {"tool": "get_sales_kpi", "source": "bito_db", "data": analysis}

        elif tool_name == "get_top_products":
            target_str = arguments.get("date") or "2026-01-31"
            limit = int(arguments.get("limit") or 5)

            try:
                target = parse_date(target_str)
            except Exception:
                target = date(2026, 1, 31)

            analysis = SalesAnalyzer.analyze_period(target, target)
            top = analysis.get("top_products", [])[:limit]
            return {"tool": "get_top_products", "data": top}

        else:
            return {"tool": tool_name, "success": False, "error": f"Unknown tool '{tool_name}'"}

