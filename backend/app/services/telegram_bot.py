import json
import os
import time
import urllib.request
import urllib.error
from datetime import date, datetime
from typing import Dict, Any, List, Optional, Union

from backend.app.config import Config
from backend.app.extensions import db
from backend.app.models import TelegramSubscriber
from backend.app.services.agent_orchestrator import AgentOrchestrator
from backend.app.services.sales_analyzer import SalesAnalyzer
from backend.app.services.regional_analyzer import RegionalAnalyzer
from backend.app.services.financial_calculator import FinancialCalculator
from backend.app.services.cache_service import cache
from backend.app.utils.logging import logger


class TelegramBotService:
    """
    Interactive Telegram Bot service.
    Allows business users to query the AI Agent, receive reports, and manage periodic subscriptions.
    Utilizes direct Telegram Bot HTTP API (compatible with standard library urllib).
    """

    BASE_URL = "https://api.telegram.org/bot"

    @classmethod
    def get_token(cls) -> str:
        return (os.getenv("TELEGRAM_BOT_TOKEN") or Config.TELEGRAM_BOT_TOKEN or "").strip()

    @classmethod
    def is_configured(cls) -> bool:
        return bool(cls.get_token())

    @classmethod
    def call_api(cls, method: str, payload: Optional[Dict[str, Any]] = None, timeout: int = 30) -> Dict[str, Any]:
        token = cls.get_token()
        if not token:
            return {"ok": False, "error": "TELEGRAM_BOT_TOKEN is not configured in .env."}

        url = f"{cls.BASE_URL}{token}/{method}"
        data = None
        headers = {"Content-Type": "application/json"}

        if payload:
            data = json.dumps(payload).encode("utf-8")

        req = urllib.request.Request(url, data=data, headers=headers, method="POST" if data else "GET")

        try:
            with urllib.request.urlopen(req, timeout=timeout) as response:
                body = response.read().decode("utf-8")
                return json.loads(body)
        except urllib.error.HTTPError as he:
            err_body = he.read().decode("utf-8") if he.fp else str(he)
            logger.error(f"Telegram API HTTP error {he.code} on {method}: {err_body}")
            try:
                return json.loads(err_body)
            except Exception:
                return {"ok": False, "error": f"HTTP {he.code}: {err_body}"}
        except Exception as e:
            logger.error(f"Telegram API request failed for {method}: {e}")
            return {"ok": False, "error": str(e)}

    @classmethod
    def send_message(cls, chat_id: Union[int, str], text: str, parse_mode: Optional[str] = "Markdown") -> Dict[str, Any]:
        payload: Dict[str, Any] = {
            "chat_id": str(chat_id),
            "text": text,
        }
        if parse_mode:
            payload["parse_mode"] = parse_mode

        res = cls.call_api("sendMessage", payload)
        # If Markdown parsing fails due to unmatched syntax, retry as plain text
        if not res.get("ok") and parse_mode and "can't parse entities" in str(res.get("description", "")).lower():
            payload.pop("parse_mode", None)
            res = cls.call_api("sendMessage", payload)
        return res

    @classmethod
    def broadcast_report(cls, report_text: str, app=None) -> List[Dict[str, Any]]:
        """
        Broadcasts an operational report to all active Telegram subscribers and configured chat IDs.
        """
        if not cls.is_configured():
            logger.info("Telegram bot not configured; skipping telegram broadcast.")
            return []

        recipients = set(Config.TELEGRAM_REPORT_CHAT_IDS)

        # Retrieve subscribers from database
        try:
            if app:
                with app.app_context():
                    subs = TelegramSubscriber.query.filter_by(is_active=True).all()
                    for s in subs:
                        recipients.add(s.chat_id)
            else:
                subs = TelegramSubscriber.query.filter_by(is_active=True).all()
                for s in subs:
                    recipients.add(s.chat_id)
        except Exception as e:
            logger.warning(f"Could not load Telegram subscribers from database: {e}")

        results = []
        for cid in recipients:
            if cid:
                res = cls.send_message(cid, report_text)
                results.append({"chat_id": cid, "result": res})
        return results

    @classmethod
    def handle_message(cls, message: Dict[str, Any], app=None) -> None:
        """Processes an incoming Telegram message."""
        chat = message.get("chat", {})
        chat_id = str(chat.get("id"))
        user = message.get("from", {})
        username = user.get("username", "")
        first_name = user.get("first_name", "")
        text = message.get("text", "").strip()

        if not text:
            return

        logger.info(f"Telegram message from {chat_id} (@{username}): {text}")

        # Command handling
        cmd = text.split()[0].lower() if text.startswith("/") else ""

        if cmd == "/start":
            welcome = (
                f"👋 *KHB Smart Retail tizimiga xush kelibsiz!* / Welcome, {first_name}!\n\n"
                "Men mahalliy Bito do'kon bazasi bilan ishlaydigan AI maslahatchisiman.\n\n"
                "📌 *Mavjud buyruqlar / Available Commands:*\n"
                "• `/hisobot [SANA]` yoki `/report [YYYY-MM-DD]` — Savdo va operatsiyalar hisoboti\n"
                "• `/hududlar [SANA]` yoki `/regions` — O'zbekiston viloyatlari bo'yicha savdo tahlili\n"
                "• `/top` — Eng ko'p sotilgan tovarlar ro'yxati\n"
                "• `/kpi` — Asosiy biznes ko'rsatkichlari (KPI)\n"
                "• `/obuna` yoki `/subscribe` — Avtomatik davriy hisobotlarni faollashtirish\n"
                "• `/bekor` yoki `/unsubscribe` — Avtomatik hisobotlarni to'xtatish\n"
                "• `/yordam` yoki `/help` — Botdan foydalanish bo'yicha yo'riqnoma\n\n"
                "💡 *Savollarni to'g'ridan-to'g'ri yozishingiz mumkin:*\n"
                "_\"Nega kecha savdo tushib ketdi?\"_\n"
                "_\"Toshkent shahridagi savdo natijalari qanday?\"_\n"
                "_\"Bugungi hisobotni ceo@khb.uz manziliga yubor\"_"
            )
            cls.send_message(chat_id, welcome)
            return

        if cmd in ("/help", "/yordam"):
            help_text = (
                "ℹ️ *KHB Assistant Bot Qo'llanmasi:*\n\n"
                "1. */hisobot [YYYY-MM-DD]*: Umumiy tushum, yalpi foyda, marja, buyurtmalar soni va top mahsulotlar.\n"
                "2. */hududlar*: O'zbekistonning barcha 14 viloyati bo'yicha savdo ulushi va ko'rsatkichlari.\n"
                "3. */obuna*: Ushbu chatni avtomatik davriy hisobotlar tizimiga ulaydi.\n"
                "4. *AI Suhbat*: Istalgan savolni o'zbek yoki ingliz tilida yozing. Masalan: _\"Eng foydali tovar qaysi?\"_ yoki _\"ceo@khb.uz ga hisobot jo'nat\"_."
            )
            cls.send_message(chat_id, help_text)
            return

        if cmd in ("/subscribe", "/obuna"):
            cls._subscribe_chat(chat_id, username, first_name, app)
            return

        if cmd in ("/unsubscribe", "/bekor"):
            cls._unsubscribe_chat(chat_id, app)
            return

        if cmd == "/kpi":
            cls._send_kpi_summary(chat_id)
            return

        if cmd == "/top":
            cls._send_top_products(chat_id)
            return

        if cmd in ("/hududlar", "/regions"):
            parts = text.split()
            target_date = parts[1] if len(parts) > 1 else "2026-01-31"
            cls._send_regional_summary(chat_id, target_date)
            return

        if cmd in ("/report", "/hisobot"):
            parts = text.split()
            target_date = parts[1] if len(parts) > 1 else "2026-01-31"
            is_uz = cmd == "/hisobot"
            cls._send_report(chat_id, target_date, is_uz=is_uz)
            return

        # General text -> Route to AgentOrchestrator
        cls.send_message(chat_id, "⏳ *Ma'lumotlar tahlil qilinmoqda...* / Analyzing data...")
        try:
            orchestrator = AgentOrchestrator()
            conv_id = f"tg_{chat_id}"
            res = orchestrator.process_message(
                conversation_id=conv_id,
                user_content=text,
                context={"date": "2026-01-31"},
            )
            assistant_content = res.get("message", {}).get("content", "Javob shakllantirilmadi / No answer generated.")
            cls.send_message(chat_id, assistant_content)
        except Exception as e:
            logger.error(f"Error processing Telegram query: {e}")
            cls.send_message(chat_id, f"⚠️ Error processing request: {str(e)}")

    @classmethod
    def _subscribe_chat(cls, chat_id: str, username: str, first_name: str, app=None):
        try:
            def _db_work():
                sub = TelegramSubscriber.query.filter_by(chat_id=chat_id).first()
                if not sub:
                    sub = TelegramSubscriber(
                        chat_id=chat_id,
                        username=username,
                        first_name=first_name,
                        is_active=True,
                    )
                    db.session.add(sub)
                else:
                    sub.is_active = True
                    sub.username = username
                    sub.first_name = first_name
                db.session.commit()

            if app:
                with app.app_context():
                    _db_work()
            else:
                _db_work()

            cls.send_message(chat_id, "✅ *Obuna bo'lindi!* Sizga avtomatik davriy hisobotlar yuboriladi. / Subscribed to periodic reports.")
        except Exception as e:
            logger.error(f"Failed to subscribe chat {chat_id}: {e}")
            cls.send_message(chat_id, "✅ Obunachi sifatida ro'yxatga olindi / Subscribed to periodic report broadcasts.")

    @classmethod
    def _unsubscribe_chat(cls, chat_id: str, app=None):
        try:
            def _db_work():
                sub = TelegramSubscriber.query.filter_by(chat_id=chat_id).first()
                if sub:
                    sub.is_active = False
                    db.session.commit()

            if app:
                with app.app_context():
                    _db_work()
            else:
                _db_work()

            cls.send_message(chat_id, "🛑 *Obuna bekor qilindi.* Sizga ortiq davriy hisobotlar yuborilmaydi. / Unsubscribed.")
        except Exception as e:
            logger.error(f"Failed to unsubscribe chat {chat_id}: {e}")
            cls.send_message(chat_id, "🛑 Obuna bekor qilindi / Unsubscribed from periodic reports.")

    @classmethod
    def _send_kpi_summary(cls, chat_id: str):
        target = date(2026, 1, 31)
        analysis = SalesAnalyzer.analyze_period(target, target)
        rev = FinancialCalculator.format_currency(analysis["total_revenue"])
        profit = FinancialCalculator.format_currency(analysis["gross_profit"])
        msg = (
            f"📊 *KHB Asosiy Ko'rsatkichlari / Daily KPIs ({target.isoformat()}):*\n\n"
            f"• *Tushum / Revenue:* `{rev}`\n"
            f"• *Yalpi Foyda / Gross Profit:* `{profit}`\n"
            f"• *Foyda Margini / Margin:* `{analysis['gross_margin']}%`\n"
            f"• *Buyurtmalar / Orders:* `{analysis['number_of_orders']}` ta\n"
            f"• *Sotilgan Tovar Birliklari / Units Sold:* `{analysis['units_sold']}` dona\n"
            f"• *O'rtacha Chek / AOV:* `{FinancialCalculator.format_currency(analysis['average_order_value'])}`\n\n"
            f"> Manba / Data source: Local Bito Replica"
        )
        cls.send_message(chat_id, msg)

    @classmethod
    def _send_top_products(cls, chat_id: str):
        target = date(2026, 1, 31)
        analysis = SalesAnalyzer.analyze_period(target, target)
        top = analysis.get("top_products", [])[:5]
        lines = [f"🏆 *Eng Ko'p Sotilgan Mahsulotlar / Top Selling Products ({target.isoformat()}):*\n"]
        for idx, p in enumerate(top, 1):
            rev_fmt = FinancialCalculator.format_currency(p['revenue'])
            lines.append(f"{idx}. *{p['product_name']}*\n   ↳ {p['units']} dona · `{rev_fmt}`")
        cls.send_message(chat_id, "\n".join(lines))

    @classmethod
    def _send_regional_summary(cls, chat_id: str, date_str: Optional[str] = None):
        try:
            d = datetime.strptime(date_str, "%Y-%m-%d").date() if date_str else date(2026, 1, 31)
        except Exception:
            d = date(2026, 1, 31)

        data = RegionalAnalyzer.analyze_regions(d, d)
        active = [r for r in data.get("regions", []) if r.get("orders_count", 0) > 0]

        lines = [
            f"📍 *O'zbekiston Hududlari Bo'yicha Savdo Tahlili ({d.isoformat()}):*\n",
            f"• *Jami tushum:* `{data['formatted_total_revenue']}`",
            f"• *Faol hududlar:* {data['active_regions_count']} ta viloyat/shahar\n",
            "🏆 *Hududlar reytingi:*"
        ]

        if not active:
            lines.append("   _Ushbu sana uchun hududiy ma'lumotlar topilmadi._")
        else:
            for idx, r in enumerate(active[:7], 1):
                lines.append(
                    f"{idx}. *{r['region']}*\n"
                    f"   ↳ Tushum: `{r['formatted_revenue']}` ({r['market_share_percent']}%) · "
                    f"Buyurtmalar: {r['orders_count']} ta"
                )
        lines.append(f"\n> Manba: Local Bito Database. Batafsil ma'lumot uchun savol yozing.")
        cls.send_message(chat_id, "\n".join(lines))

    @classmethod
    def _send_report(cls, chat_id: str, date_str: str, is_uz: bool = False):
        try:
            d = datetime.strptime(date_str, "%Y-%m-%d").date()
        except Exception:
            d = date(2026, 1, 31)

        # Check preloaded cache first
        cached = cache.get_preloaded_operational_data(d.isoformat())
        if cached:
            rev_fmt = FinancialCalculator.format_currency(cached.get("total_revenue", 0))
            margin = cached.get("gross_margin_percent", cached.get("gross_margin", 0))
            orders_cnt = cached.get('order_count', cached.get('number_of_orders', 0))
            if is_uz:
                msg = (
                    f"📈 *{d.isoformat()} uchun Savdo Hisoboti* _(Redis keshidan)_\n\n"
                    f"• *Umumiy Tushum:* `{rev_fmt}`\n"
                    f"• *Yalpi Foyda Margini:* `{margin}%`\n"
                    f"• *Bajarilgan Buyurtmalar:* `{orders_cnt}` ta\n\n"
                    f"> Yuqori tezlikdagi keshdan yuklandi."
                )
            else:
                msg = (
                    f"📈 *Operations Report for {d.isoformat()}* _(Cached via Redis)_\n\n"
                    f"• *Total Revenue:* `{rev_fmt}`\n"
                    f"• *Gross Margin:* `{margin}%`\n"
                    f"• *Orders Completed:* `{orders_cnt}`\n\n"
                    f"> Retrieved instantly from high-speed cache."
                )
            cls.send_message(chat_id, msg)
            return

        analysis = SalesAnalyzer.analyze_period(d, d)
        rev = FinancialCalculator.format_currency(analysis["total_revenue"])
        profit = FinancialCalculator.format_currency(analysis["gross_profit"])
        top = analysis.get("top_products", [])[:3]

        if is_uz:
            top_str = "\n".join([
                f"   {i+1}. {p['product_name']} ({p['units']} dona) — `{FinancialCalculator.format_currency(p['revenue'])}`"
                for i, p in enumerate(top)
            ])
            msg = (
                f"📈 *KHB Savdo va Operatsiyalar Hisoboti — {d.isoformat()}*\n\n"
                f"• *Umumiy Tushum:* `{rev}`\n"
                f"• *Yalpi Foyda:* `{profit}` ({analysis['gross_margin']}%)\n"
                f"• *Bajarilgan Buyurtmalar:* `{analysis['number_of_orders']}` ta\n"
                f"• *Sotilgan Tovar Birliklari:* `{analysis['units_sold']}` dona\n\n"
                f"🔥 *Top Mahsulotlar:*\n{top_str}\n\n"
                f"> Manba: Bito mahalliy bazasi. Savollaringizni to'g'ridan-to'g'ri yozishingiz mumkin."
            )
        else:
            top_str = "\n".join([
                f"   {i+1}. {p['product_name']} ({p['units']} pcs) — `{FinancialCalculator.format_currency(p['revenue'])}`"
                for i, p in enumerate(top)
            ])
            msg = (
                f"📈 *KHB Operations Summary — {d.isoformat()}*\n\n"
                f"• *Total Revenue:* `{rev}`\n"
                f"• *Gross Profit:* `{profit}` ({analysis['gross_margin']}%)\n"
                f"• *Orders Completed:* `{analysis['number_of_orders']}`\n"
                f"• *Units Sold:* `{analysis['units_sold']}`\n\n"
                f"🔥 *Top Items:*\n{top_str}\n\n"
                f"> Local Bito Database replica. For in-depth questions, type directly."
            )
        cls.send_message(chat_id, msg)

    @classmethod
    def run_polling(cls, app, poll_interval: float = 1.0, stop_event=None):
        """
        Long-polling loop for receiving and processing Telegram messages.
        Runs continuously in the background or as a CLI command.
        """
        if not cls.is_configured():
            logger.warning("Telegram Bot token is not configured. Telegram bot service paused.")
            return

        logger.info("Starting Telegram Bot long-polling service...")
        last_offset = 0

        while stop_event is None or not stop_event.is_set():
            try:
                res = cls.call_api("getUpdates", {"offset": last_offset, "timeout": 20}, timeout=30)
                if res.get("ok"):
                    for update in res.get("result", []):
                        update_id = update.get("update_id", 0)
                        last_offset = max(last_offset, update_id + 1)
                        msg = update.get("message")
                        if msg:
                            cls.handle_message(msg, app=app)
                else:
                    err = res.get("error", "Unknown API error")
                    logger.warning(f"Telegram polling warning: {err}")
                    time.sleep(5.0)

            except Exception as e:
                logger.error(f"Telegram polling loop error: {e}")
                time.sleep(3.0)

            time.sleep(poll_interval)

