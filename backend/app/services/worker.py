import os
import re
import time
import threading
from datetime import date, datetime
from typing import Dict, Any, List, Optional

from backend.app.config import Config
from backend.app.services.sales_analyzer import SalesAnalyzer
from backend.app.services.financial_calculator import FinancialCalculator
from backend.app.services.email_service import EmailService
from backend.app.services.telegram_bot import TelegramBotService
from backend.app.services.cache_service import cache
from backend.app.utils.dates import parse_date
from backend.app.utils.logging import logger


def parse_period(period_str: Optional[str]) -> int:
    """
    Parses cycle period string into seconds.
    Supports:
      - 'm' for minutes (e.g. '5m' -> 300s, '10m' -> 600s)
      - 'h' for hours   (e.g. '1h' -> 3600s, '2h' -> 7200s)
      - 's' for seconds (e.g. '30s' -> 30s)
      - 'd' for days    (e.g. '1d' -> 86400s)
    Defaults to 3600 seconds (1 hour) if invalid or empty.
    """
    if not period_str:
        return 3600

    raw = str(period_str).strip().lower()
    match = re.match(r"^(\d+)\s*([smhd]?)$", raw)
    if not match:
        logger.warning(f"Unrecognized WORKER_PERIOD '{period_str}'; defaulting to 1h (3600s).")
        return 3600

    value = int(match.group(1))
    unit = match.group(2) or "s"

    if unit == "s":
        return max(5, value)
    elif unit == "m":
        return max(5, value * 60)
    elif unit == "h":
        return max(5, value * 3600)
    elif unit == "d":
        return max(5, value * 86400)

    return 3600


class ReportWorker:
    """
    Scheduled Worker that reads cycle period (WORKER_PERIOD) from .env,
    preloads operational datasets into Redis for instant response speeds,
    and automatically dispatches reports to users via Email (Gmail SMTP) and Telegram Bot.
    """

    @classmethod
    def get_period_seconds(cls) -> int:
        raw_period = os.getenv("WORKER_PERIOD") or Config.WORKER_PERIOD or "1h"
        return parse_period(raw_period)

    @classmethod
    def run_single_cycle(cls, app, target_date_str: Optional[str] = None) -> Dict[str, Any]:
        """
        Executes a single reporting cycle:
        1. Analyzes latest operations data.
        2. Preloads and warms Redis cache.
        3. Dispatches email reports to WORKER_EMAIL_RECIPIENTS.
        4. Broadcasts Telegram report to active subscribers.
        """
        target_str = target_date_str or "2026-01-31"
        try:
            target_d = parse_date(target_str)
        except Exception:
            target_d = date(2026, 1, 31)

        logger.info(f"ReportWorker cycle started for target date: {target_str}...")

        with app.app_context():
            # 1. Generate Business Analysis
            analysis = SalesAnalyzer.analyze_period(target_d, target_d)
            month_start = target_d.replace(day=1)
            month_analysis = SalesAnalyzer.analyze_period(month_start, target_d)

            payload = {
                "date": target_str,
                "total_revenue": analysis["total_revenue"],
                "gross_profit": analysis["gross_profit"],
                "gross_margin_percent": analysis["gross_margin"],
                "order_count": analysis["number_of_orders"],
                "units_sold": analysis["units_sold"],
                "average_order_value": analysis["average_order_value"],
                "top_products": analysis.get("top_products", [])[:5],
                "month_to_date_revenue": month_analysis.get("total_revenue", 0.0),
                "anomalies": analysis.get("anomalies", []),
                "generated_at": datetime.now().isoformat(),
            }

            # 2. Preload & Cache in Redis so subsequent requests are lightning-fast
            cache.preload_operational_data(target_str, payload, ttl=7200)
            logger.info(f"Preloaded next operational data into cache (backend: {cache.backend_name()})")

            # 3. Dispatch Email Reports
            email_recipients = Config.WORKER_EMAIL_RECIPIENTS
            # Also check env dynamically in case updated
            env_emails = os.getenv("WORKER_EMAIL_RECIPIENTS", "")
            if env_emails:
                for e in env_emails.split(","):
                    if e.strip() and e.strip() not in email_recipients:
                        email_recipients.append(e.strip())

            email_result = {"skipped": True, "reason": "No email recipients configured"}
            if email_recipients:
                logger.info(f"Worker sending email report to {email_recipients}...")
                email_result = EmailService.send_report_email(
                    to_email=email_recipients,
                    report_data=payload,
                    date_str=target_str,
                )

            # 4. Dispatch Telegram Bot Reports
            rev_fmt = FinancialCalculator.format_currency(payload["total_revenue"])
            margin = payload["gross_margin_percent"]
            orders = payload["order_count"]
            aov_fmt = FinancialCalculator.format_currency(payload["average_order_value"])

            top_items_lines = []
            for idx, p in enumerate(payload["top_products"][:3], 1):
                pname = p.get("product_name", "Item")
                prev = FinancialCalculator.format_currency(p.get("revenue", 0))
                punits = p.get("units", 0)
                top_items_lines.append(f"  {idx}. *{pname}* — {punits} pcs (`{prev}`)")
            top_str = "\n".join(top_items_lines)

            tg_message = (
                f"🔔 *Automated Operations Report ({target_str})*\n\n"
                f"• *Revenue:* `{rev_fmt}`\n"
                f"• *Gross Margin:* `{margin}%`\n"
                f"• *Orders:* `{orders}` completed\n"
                f"• *AOV:* `{aov_fmt}`\n\n"
                f"🏆 *Top Sellers:*\n{top_str}\n\n"
                f"> Dispatched automatically by KHB Report Worker. Cached in Redis."
            )

            tg_results = TelegramBotService.broadcast_report(tg_message, app=app)

            summary = {
                "cycle_completed_at": datetime.now().isoformat(),
                "target_date": target_str,
                "cached": True,
                "cache_backend": cache.backend_name(),
                "email_result": email_result,
                "telegram_broadcasts_count": len(tg_results),
            }
            logger.info(f"ReportWorker cycle finished: {summary}")
            return summary

    @classmethod
    def start_worker_loop(cls, app, stop_event: Optional[threading.Event] = None):
        """
        Continuous loop running on WORKER_PERIOD interval.
        """
        period_sec = cls.get_period_seconds()
        raw_period = os.getenv("WORKER_PERIOD") or Config.WORKER_PERIOD or "1h"
        logger.info(f"ReportWorker loop running: period = {raw_period} ({period_sec}s)")

        while stop_event is None or not stop_event.is_set():
            try:
                cls.run_single_cycle(app)
            except Exception as e:
                logger.error(f"Error in ReportWorker cycle: {e}")

            # Re-read period in case updated in environment
            period_sec = cls.get_period_seconds()

            # Sleep in 1-second slices so stop_event responds immediately
            for _ in range(period_sec):
                if stop_event and stop_event.is_set():
                    break
                time.sleep(1.0)

    @classmethod
    def start_background_worker(cls, app) -> threading.Thread:
        """Starts worker loop in a background daemon thread."""
        stop_event = threading.Event()
        t = threading.Thread(
            target=cls.start_worker_loop,
            args=(app, stop_event),
            daemon=True,
            name="KHB-ReportWorker",
        )
        t.start()
        logger.info("ReportWorker background thread launched.")
        return t

