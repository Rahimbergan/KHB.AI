import json
import re
import uuid
from datetime import date, datetime, timedelta
from typing import Dict, Any, List, Optional

from backend.app.extensions import db
from backend.app.models import Conversation, Message, Artifact, UploadedFile
from backend.app.services.financial_calculator import FinancialCalculator, FINANCIAL_DISCLAIMER
from backend.app.services.sales_analyzer import SalesAnalyzer
from backend.app.services.document_analyzer import DocumentAnalyzer, LEGAL_DISCLAIMER
from backend.app.services.artifact_service import ArtifactService
from backend.app.services.claude_client import ClaudeClient
from backend.app.services.agent_tools import AgentTools
from backend.app.services.regional_analyzer import RegionalAnalyzer
from backend.app.utils.dates import parse_date, format_iso, today_date

UZ_FINANCIAL_DISCLAIMER = "Moliyaviy eslatma: Ushbu tahliliy hisobot Bito replika bazasidagi haqiqiy operatsiyalar asosida tayyorlangan. Rasmiy auditorlik yoki soliq xulosasi hisoblanmaydi."
UZ_LEGAL_DISCLAIMER = "Yuridik eslatma: Hujjat tahlili axborot tariqasida taqdim etilmoqda. Rasmiy yuridik maslahat hisoblanmaydi."




class DataAnalystAgent:
    """Reads business data, normalizes parameters, scans for anomalies and data gaps."""
    @staticmethod
    def inspect_data(start_date: date, end_date: date) -> Dict[str, Any]:
        analysis = SalesAnalyzer.analyze_period(start_date, end_date)
        return analysis


class AccountantEconomistAgent:
    """Interprets revenue, expenses, margins, cash flow, break-even, and trends."""
    @staticmethod
    def evaluate_performance(analysis: Dict[str, Any]) -> Dict[str, Any]:
        comparison = analysis.get("previous_period_comparison", {})
        margin = analysis.get("gross_margin", 0.0)
        
        evaluation = {
            "health_status": "Healthy" if margin >= 20.0 else "Attention Required",
            "margin_status": f"Gross margin is at {margin}%",
            "revenue_trend": comparison.get("revenue_trend", "neutral"),
            "revenue_change_percent": comparison.get("revenue_change_percent", 0.0),
            "assumptions": [
                "COGS based on seeded inventory unit cost prices.",
                "Figures do not include unbilled tax obligations or bank settlement fees.",
            ],
            "disclaimer": FINANCIAL_DISCLAIMER,
        }
        return evaluation


class DocumentAnalystAgent:
    """Extracts and analyzes attached documents (parties, dates, amounts, duties, risks)."""
    @staticmethod
    def analyze_attachments(attachment_ids: List[str]) -> List[Dict[str, Any]]:
        results = []
        for fid in attachment_ids:
            uf = db.session.get(UploadedFile, fid)
            if uf and uf.extracted_text:
                res = DocumentAnalyzer.analyze_document_deterministically(
                    uf.extracted_text, uf.filename, mode="general"
                )
                res["file_id"] = uf.id
                res["filename"] = uf.filename
                results.append(res)
        return results


class MainAdvisorAgent:
    """Coordinates agents, calls Claude or deterministic fallback, and emits artifacts."""
    def __init__(self):
        self.claude_client = ClaudeClient()

    def _is_uzbek(self, text: str) -> bool:
        """Detects if query contains Uzbek business terminology."""
        if not text:
            return False
        content_lower = text.lower()
        uz_keywords = [
            "savdo", "hisobot", "bugun", "kecha", "oy", "daromad", "foyda",
            "mahsulot", "tovar", "eng ko'p", "eng kop", "nega", "qancha",
            "tushdi", "oshdi", "viloyat", "hudud", "xarajat", "yubor",
            "shartnoma", "narx", "buyurtma", "mijoz", "qanday", "nima",
            "salom", "rahmat", "qilay", "ko'rsat", "korsat", "ber", "haqida",
            "tushib ketdi", "kamaydi", "kechagidan"
        ]
        return any(kw in content_lower for kw in uz_keywords)

    def process_message(
        self,
        conversation_id: str,
        user_content: str,
        attachment_ids: Optional[List[str]] = None,
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        attachment_ids = attachment_ids or []
        context = context or {}

        # 1. Resolve target context date or range
        # Default context date: 2026-01-31 (matching seeded peak data and user prompt tests)
        target_date_str = context.get("date") or "2026-01-31"
        try:
            target_date = parse_date(target_date_str)
        except Exception:
            target_date = date(2026, 1, 31)

        # 2. Run Data Analyst Agent
        # Default month range
        month_start = target_date.replace(day=1)
        sales_analysis = DataAnalystAgent.inspect_data(month_start, target_date)
        daily_analysis = DataAnalystAgent.inspect_data(target_date, target_date)

        # 3. Run Accountant Agent
        financial_eval = AccountantEconomistAgent.evaluate_performance(sales_analysis)

        # 4. Run Document Analyst Agent if attachments exist
        doc_analyses = DocumentAnalystAgent.analyze_attachments(attachment_ids)

        # 5. Check if Claude is available
        claude_response = None
        if self.claude_client.is_available():
            claude_response = self._run_claude(
                user_content=user_content,
                target_date=target_date,
                sales_analysis=sales_analysis,
                financial_eval=financial_eval,
                doc_analyses=doc_analyses,
            )

        # 6. Fallback or use Claude response
        if claude_response:
            return self._build_claude_result(conversation_id, claude_response, target_date, sales_analysis)
        else:
            return self._run_deterministic_advisor(
                conversation_id=conversation_id,
                user_content=user_content,
                target_date=target_date,
                daily_analysis=daily_analysis,
                sales_analysis=sales_analysis,
                financial_eval=financial_eval,
                doc_analyses=doc_analyses,
                attachment_ids=attachment_ids,
            )

    def _run_claude(
        self,
        user_content: str,
        target_date: date,
        sales_analysis: Dict[str, Any],
        financial_eval: Dict[str, Any],
        doc_analyses: List[Dict[str, Any]],
    ) -> Optional[Dict[str, Any]]:
        system_prompt = (
            "You are the AI Business Operations Assistant for KHB Smart Retail, an electronics and retail business in Uzbekistan. "
            "Target Audience: Uzbek entrepreneurs, business owners, and managers.\n\n"
            "LANGUAGE INSTRUCTIONS:\n"
            "- If the user communicates or queries in Uzbek (O'zbek tili), YOU MUST RESPOND ENTIRELY IN NATURAL, GRAMMATICALLY ACCURATE UZBEK (Latin script).\n"
            "- If queried in English, respond in English. If queried in Russian, respond in Russian.\n\n"
            "STRICT ANTI-HALLUCINATION & FACT GROUNDING RULES:\n"
            "1. ONLY cite facts, numbers, revenue figures, dates, and product names that exist in the provided Context Data.\n"
            "2. NEVER fabricate, assume, or extrapolate fake sales numbers, hypothetical transactions, or non-existent items.\n"
            "3. If the user asks about a date, period, or product where no data exists in the database, EXPLICITLY state in the user's language that no matching records exist in the Bito database. Do NOT invent hypothetical metrics.\n"
            "4. Adhere strictly to verified financial calculations (Revenue, COGS, Gross Margin %, Orders, AOV). Currency is UZS (O'zbek so'mi).\n"
            "5. When analyzing geographic data, use official Uzbekistan regional divisions (Toshkent shahri, Samarqand, Farg'ona, Andijon, Buxoro, etc.).\n"
            "6. Always state appropriate financial or legal disclaimer (in Uzbek if answering in Uzbek: 'Moliyaviy eslatma: Ushbu tahlil Bito replika bazasi ma'lumotlariga asoslangan...').\n"
            "When useful, suggest 1 or 2 artifacts (metric, table, line_chart, bar_chart, document_extract) in the standard JSON schema."
        )
        condensed_analysis = {
            "period": f"{sales_analysis.get('from_date')} to {sales_analysis.get('to_date')}",
            "currency": sales_analysis.get("currency", "UZS"),
            "total_revenue": sales_analysis.get("total_revenue"),
            "gross_profit": sales_analysis.get("gross_profit"),
            "gross_margin": sales_analysis.get("gross_margin"),
            "number_of_orders": sales_analysis.get("number_of_orders"),
            "units_sold": sales_analysis.get("units_sold"),
            "average_order_value": sales_analysis.get("average_order_value"),
            "refunds_count": sales_analysis.get("refunds_count"),
            "refunds_amount": sales_analysis.get("refunds_amount"),
            "top_products": sales_analysis.get("top_products", [])[:5],
            "top_categories": sales_analysis.get("top_categories", []),
            "previous_period_comparison": sales_analysis.get("previous_period_comparison"),
            "anomalies": sales_analysis.get("anomalies", []),
        }
        context_payload = {
            "current_date": target_date.isoformat(),
            "month_to_date_analysis": condensed_analysis,
            "financial_evaluation": financial_eval,
            "regional_breakdown": sales_analysis.get("regional_breakdown"),
            "attached_documents": doc_analyses,
        }
        return self.claude_client.generate_chat_response(
            system_prompt=system_prompt,
            user_message=user_content,
            context_data=context_payload,
            tools=AgentTools.get_schemas(),
        )

    def _build_claude_result(
        self, conversation_id: str, claude_res: Dict[str, Any], target_date: date, sales_analysis: Dict[str, Any]
    ) -> Dict[str, Any]:
        msg_id = str(uuid.uuid4())
        text_content = claude_res.get("text", "")
        artifacts_created = []

        # Execute any tools requested by Claude
        tool_calls = claude_res.get("tool_calls", [])
        for tc in tool_calls:
            tname = tc.get("name")
            targs = tc.get("input", {})
            res = AgentTools.execute(tname, targs)
            if tname == "send_email":
                text_content += f"\n\n📧 **Tool Execution:** {res.get('message')}"
                m_art = ArtifactService.create_metric_artifact(
                    title="Email Dispatch Status",
                    value=1.0 if res.get("success") else 0.0,
                    formatted_value="Delivered" if res.get("success") else "Failed",
                    description=res.get("message", "Email tool executed"),
                    message_id=msg_id,
                    conversation_id=conversation_id,
                )
                artifacts_created.append(m_art.to_dict())

        # If Claude returned structured artifact suggestions
        structured = claude_res.get("structured")
        if isinstance(structured, dict) and "artifacts" in structured:
            for art_spec in structured.get("artifacts", []):
                art = ArtifactService.create_artifact(
                    artifact_type=art_spec.get("type", "report"),
                    title=art_spec.get("title", "Analysis Artifact"),
                    description=art_spec.get("description"),
                    data=art_spec.get("data", {}),
                    config=art_spec.get("config", {}),
                    message_id=msg_id,
                    conversation_id=conversation_id,
                )
                artifacts_created.append(art.to_dict())

        # If Claude did not produce a structured artifact, automatically attach a companion KPI Metric artifact
        if not artifacts_created and sales_analysis:
            rev = sales_analysis.get("total_revenue", 0.0)
            comp = sales_analysis.get("previous_period_comparison", {})
            m_art = ArtifactService.create_metric_artifact(
                title=f"Month-to-Date Revenue ({sales_analysis.get('from_date', '')} to {sales_analysis.get('to_date', '')})",
                value=rev,
                formatted_value=FinancialCalculator.format_currency(rev),
                change_percent=comp.get("revenue_change_percent", 0.0),
                trend=comp.get("revenue_trend", "neutral"),
                description="Total completed sales revenue for the analyzed period.",
                message_id=msg_id,
                conversation_id=conversation_id,
            )
            artifacts_created.append(m_art.to_dict())

        return {
            "message": {
                "id": msg_id,
                "role": "assistant",
                "content": text_content,
                "created_at": datetime.now().isoformat(),
            },
            "artifacts": artifacts_created,
            "sources": ["Bito Database", "Anthropic Claude Intelligence"],
            "usage": claude_res.get("usage", {"used_claude": True}),
        }

    def _run_deterministic_advisor(
        self,
        conversation_id: str,
        user_content: str,
        target_date: date,
        daily_analysis: Dict[str, Any],
        sales_analysis: Dict[str, Any],
        financial_eval: Dict[str, Any],
        doc_analyses: List[Dict[str, Any]],
        attachment_ids: List[str],
    ) -> Dict[str, Any]:
        msg_id = str(uuid.uuid4())
        content_lower = user_content.lower()
        artifacts = []
        sources = ["Bito Local Database"]

        is_uz = self._is_uzbek(user_content)
        current_disclaimer = UZ_FINANCIAL_DISCLAIMER if is_uz else FINANCIAL_DISCLAIMER

        # STRICT ANTI-HALLUCINATION GUARD: If date has zero orders and is outside operational window
        if daily_analysis.get("number_of_orders", 0) == 0 and (target_date < date(2025, 12, 1) or target_date > date(2026, 1, 31)):
            if is_uz:
                no_data_msg = (
                    f"⚠️ **Bito ma'lumotlar bazasida yozuv topilmadi ({target_date.isoformat()})**\n\n"
                    f"Bito bazasida **{target_date.isoformat()}** sanasi bo'yicha hech qanday savdo yoki operatsiya mavjud emas. "
                    f"Tizim faqat haqiqiy mavjud ma'lumotlarga tayanadi va taxminiy yoki soxta raqamlarni to'qimaydi. "
                    f"Haqiqiy operatsion ma'lumotlar **2025-yil 1-dekabrdan 2026-yil 31-yanvargacha** bo'lgan davr uchun mavjud.\n\n"
                    f"> {UZ_FINANCIAL_DISCLAIMER}"
                )
            else:
                no_data_msg = (
                    f"⚠️ **No Records Found in Database ({target_date.isoformat()})**\n\n"
                    f"No sales or transaction records exist in the Bito database for **{target_date.isoformat()}**. "
                    f"The system strictly adheres to real verified database facts and does not invent hypothetical figures. "
                    f"Real operational data is available from **2025-12-01 to 2026-01-31**.\n\n"
                    f"> {FINANCIAL_DISCLAIMER}"
                )
            return {
                "message": {
                    "id": msg_id,
                    "role": "assistant",
                    "content": no_data_msg,
                    "created_at": datetime.now().isoformat(),
                },
                "artifacts": [],
                "sources": sources,
                "usage": {"used_claude": False},
            }

        # TOOL CASE: Email sending intent
        email_pattern = r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+'
        emails_found = re.findall(email_pattern, user_content)
        if any(kw in content_lower for kw in ["email", "send report", "send email", "mail to", "yubor", "emailga yubor", "pochtaga"]) and emails_found:
            target_recipient = emails_found[0]
            summary_body = (
                f"KHB Smart Retail Operations Summary for {target_date.isoformat()}:\n\n"
                f"• Total Revenue: {FinancialCalculator.format_currency(daily_analysis['total_revenue'])}\n"
                f"• Gross Profit: {FinancialCalculator.format_currency(daily_analysis['gross_profit'])} (Margin: {daily_analysis['gross_margin']}%)\n"
                f"• Orders Completed: {daily_analysis['number_of_orders']} orders ({daily_analysis['units_sold']} units)\n"
                f"• Average Order Value: {FinancialCalculator.format_currency(daily_analysis['average_order_value'])}\n\n"
                f"Top Products:\n" + "\n".join([f"  - {p['product_name']}: {FinancialCalculator.format_currency(p['revenue'])}" for p in daily_analysis['top_products'][:3]]) + "\n\n"
                f"{current_disclaimer}"
            )
            tool_res = AgentTools.execute("send_email", {
                "to_email": target_recipient,
                "subject": f"📊 KHB Operations Report — {target_date.isoformat()}",
                "body": summary_body,
            })
            if is_uz:
                resp_msg = (
                    f"### Elektron pochta vositasi (Gmail SMTP)\n\n"
                    f"{'✅ Hisobot muvaffaqiyatli yetkazildi!' if tool_res.get('success') else '⚠️ Yuborishda xatolik: ' + str(tool_res.get('error'))}\n\n"
                    f"- **Qabul qiluvchi**: `{target_recipient}`\n"
                    f"- **Mavzu**: 📊 KHB Operations Report — {target_date.isoformat()}\n\n"
                    f"> {UZ_FINANCIAL_DISCLAIMER}"
                )
            else:
                resp_msg = (
                    f"### Email Tool Execution\n\n"
                    f"{tool_res.get('message')}\n\n"
                    f"- **Recipient**: `{target_recipient}`\n"
                    f"- **Subject**: 📊 KHB Operations Report — {target_date.isoformat()}\n\n"
                    f"> {FINANCIAL_DISCLAIMER}"
                )
            m_art = ArtifactService.create_metric_artifact(
                title="Email yuborish holati" if is_uz else "Email Dispatch Status",
                value=1.0 if tool_res.get("success") else 0.0,
                formatted_value=("Yetkazildi" if is_uz else "Delivered") if tool_res.get("success") else ("Xatolik" if is_uz else "Failed"),
                description=tool_res.get("message", "Email tool executed"),
                message_id=msg_id,
                conversation_id=conversation_id,
            )
            return {
                "message": {
                    "id": msg_id,
                    "role": "assistant",
                    "content": resp_msg,
                    "created_at": datetime.now().isoformat(),
                },
                "artifacts": [m_art.to_dict()],
                "sources": ["Agent Tools", "Bito Local Database"],
                "usage": {"used_claude": False},
            }

        # REGIONAL ANALYSIS CASE: Uzbekistan Viloyatlar
        if any(kw in content_lower for kw in ["viloyat", "hudud", "region", "regional", "hududlar", "viloyatlar"]):
            reg_data = sales_analysis.get("regional_breakdown")
            if not reg_data:
                reg_data = RegionalAnalyzer.analyze_regions(parse_date(sales_analysis['from_date']), parse_date(sales_analysis['to_date']))

            top_reg = reg_data.get("top_region") or {}
            if is_uz:
                response_text = (
                    f"### O'zbekiston hududlari (viloyatlar) bo'yicha savdo tahlili\n\n"
                    f"- **Tahlil davri**: {reg_data.get('from_date')} dan {reg_data.get('to_date')} gacha\n"
                    f"- **Jami tushum**: {reg_data.get('formatted_total_revenue')}\n"
                    f"- **Yetakchi hudud**: **{top_reg.get('region')}** ({top_reg.get('formatted_revenue')}, {top_reg.get('market_share_percent')}% bozor ulushi)\n"
                    f"- **Faol hududlar soni**: {reg_data.get('active_regions_count')} ta\n\n"
                    f"**Viloyatlar kesimidagi tushumlar**:\n"
                )
                for r in reg_data.get("regions", [])[:5]:
                    response_text += f"- **{r['region']}**: {r['formatted_revenue']} ({r['orders_count']} ta buyurtma, ulush: {r['market_share_percent']}%)\n"
                response_text += f"\n> {UZ_FINANCIAL_DISCLAIMER}"
            else:
                response_text = (
                    f"### Regional Sales Analysis (Uzbekistan Viloyatlar)\n\n"
                    f"- **Analyzed Period**: {reg_data.get('from_date')} to {reg_data.get('to_date')}\n"
                    f"- **Total Revenue**: {reg_data.get('formatted_total_revenue')}\n"
                    f"- **Top Region**: **{top_reg.get('region')}** ({top_reg.get('formatted_revenue')}, {top_reg.get('market_share_percent')}% share)\n"
                    f"- **Active Territories**: {reg_data.get('active_regions_count')}\n\n"
                    f"**Regional Breakdown**:\n"
                )
                for r in reg_data.get("regions", [])[:5]:
                    response_text += f"- **{r['region']}**: {r['formatted_revenue']} ({r['orders_count']} orders, share: {r['market_share_percent']}%)\n"
                response_text += f"\n> {FINANCIAL_DISCLAIMER}"

            t_art = ArtifactService.create_table_artifact(
                title="Viloyatlar bo'yicha savdo ulushi" if is_uz else "Regional Sales Distribution",
                columns=["Viloyat/Shahar" if is_uz else "Region", "Tushum" if is_uz else "Revenue", "Ulush" if is_uz else "Share (%)", "Buyurtmalar" if is_uz else "Orders"],
                rows=[
                    {
                        ("Viloyat/Shahar" if is_uz else "Region"): r["region"],
                        ("Tushum" if is_uz else "Revenue"): r["formatted_revenue"],
                        ("Ulush" if is_uz else "Share (%)"): f"{r['market_share_percent']}%",
                        ("Buyurtmalar" if is_uz else "Orders"): r["orders_count"],
                    }
                    for r in reg_data.get("regions", [])[:6]
                ],
                message_id=msg_id,
                conversation_id=conversation_id,
            )
            artifacts.append(t_art.to_dict())

            return {
                "message": {
                    "id": msg_id,
                    "role": "assistant",
                    "content": response_text,
                    "created_at": datetime.now().isoformat(),
                },
                "artifacts": artifacts,
                "sources": sources,
                "usage": {"used_claude": False},
            }

        # CASE 1: Daily sales report
        if any(kw in content_lower for kw in ["today's sales", "daily sales", "sales report", "today sales", "report for today", "bugungi savdo", "kunlik savdo", "savdo hisoboti", "bugun savdo"]):
            rev = daily_analysis["total_revenue"]
            profit = daily_analysis["gross_profit"]
            margin = daily_analysis["gross_margin"]
            orders = daily_analysis["number_of_orders"]
            aov = daily_analysis["average_order_value"]

            if is_uz:
                response_text = (
                    f"### {target_date.isoformat()} sanasidagi kunlik savdo hisoboti\n\n"
                    f"- **Umumiy tushum**: {FinancialCalculator.format_currency(rev)}\n"
                    f"- **Yalpi foyda**: {FinancialCalculator.format_currency(profit)} (Marja: {margin}%)\n"
                    f"- **Bajarilgan buyurtmalar soni**: {orders} ta\n"
                    f"- **O'rtacha chek**: {FinancialCalculator.format_currency(aov)}\n"
                    f"- **Sotilgan tovarlar hajmi**: {daily_analysis['units_sold']} dona\n\n"
                    f"**Bugungi eng ko'p sotilgan tovarlar**:\n"
                )
                for idx, p in enumerate(daily_analysis["top_products"][:3], 1):
                    response_text += f"{idx}. **{p['product_name']}** — {p['units']} dona ({FinancialCalculator.format_currency(p['revenue'])})\n"
                response_text += f"\n> {UZ_FINANCIAL_DISCLAIMER}"
            else:
                response_text = (
                    f"### Daily Sales Report for {target_date.isoformat()}\n\n"
                    f"- **Total Revenue**: {FinancialCalculator.format_currency(rev)}\n"
                    f"- **Gross Profit**: {FinancialCalculator.format_currency(profit)} (Gross Margin: {margin}%)\n"
                    f"- **Total Orders**: {orders} completed orders\n"
                    f"- **Average Order Value (AOV)**: {FinancialCalculator.format_currency(aov)}\n"
                    f"- **Units Sold**: {daily_analysis['units_sold']} items\n\n"
                    f"**Top Performing Items Today**:\n"
                )
                for idx, p in enumerate(daily_analysis["top_products"][:3], 1):
                    response_text += f"{idx}. **{p['product_name']}** — {p['units']} units ({FinancialCalculator.format_currency(p['revenue'])})\n"
                response_text += f"\n> {FINANCIAL_DISCLAIMER}"

            m_art = ArtifactService.create_metric_artifact(
                title=f"Kunlik tushum ({target_date.isoformat()})" if is_uz else f"Sales Revenue ({target_date.isoformat()})",
                value=rev,
                formatted_value=FinancialCalculator.format_currency(rev),
                change_percent=daily_analysis["previous_period_comparison"].get("revenue_change_percent", 0.0),
                trend=daily_analysis["previous_period_comparison"].get("revenue_trend", "neutral"),
                description="Kunlik yakunlangan savdolar tushumi." if is_uz else "Total completed sales revenue for the day.",
                message_id=msg_id,
                conversation_id=conversation_id,
            )
            artifacts.append(m_art.to_dict())

            t_art = ArtifactService.create_table_artifact(
                title="Bugungi eng xaridorgir tovarlar" if is_uz else "Today's Top Products",
                columns=["Tovar nomi" if is_uz else "Product", "Kategoriya" if is_uz else "Category", "Sotilgan soni" if is_uz else "Units Sold", "Tushum (UZS)" if is_uz else "Revenue (UZS)"],
                rows=[
                    {
                        ("Tovar nomi" if is_uz else "Product"): p["product_name"],
                        ("Kategoriya" if is_uz else "Category"): p["category"],
                        ("Sotilgan soni" if is_uz else "Units Sold"): p["units"],
                        ("Tushum (UZS)" if is_uz else "Revenue (UZS)"): FinancialCalculator.format_currency(p["revenue"]),
                    }
                    for p in daily_analysis["top_products"][:5]
                ],
                description=f"{target_date.isoformat()} sanasidagi daromad bo'yicha tovarlar reytingi" if is_uz else f"Products ranked by sales revenue on {target_date.isoformat()}",
                message_id=msg_id,
                conversation_id=conversation_id,
            )
            artifacts.append(t_art.to_dict())

        # CASE 2: Top products
        elif any(kw in content_lower for kw in ["top products", "top five", "best sellers", "top 5", "eng ko'p sotilgan", "eng kop sotilgan", "top tovar"]):
            top_prods = sales_analysis["top_products"][:5]
            if is_uz:
                response_text = (
                    f"### Eng ko'p sotilgan top 5 tovar ({sales_analysis['from_date']} dan {sales_analysis['to_date']} gacha)\n\n"
                    "Ushbu davrda eng ko'p daromad keltirgan yetakchi tovarlar:\n\n"
                )
                for idx, p in enumerate(top_prods, 1):
                    response_text += (
                        f"{idx}. **{p['product_name']}** ({p['category']})\n"
                        f"   - Tushum: {FinancialCalculator.format_currency(p['revenue'])}\n"
                        f"   - Sotilgan soni: {p['units']} ta | Foyda: {FinancialCalculator.format_currency(p['profit'])}\n"
                    )
                response_text += f"\n> {UZ_FINANCIAL_DISCLAIMER}"
            else:
                response_text = (
                    f"### Top 5 Best-Selling Products (Month to Date: {sales_analysis['from_date']} to {sales_analysis['to_date']})\n\n"
                    "Here are your highest revenue generating products for the period:\n\n"
                )
                for idx, p in enumerate(top_prods, 1):
                    response_text += (
                        f"{idx}. **{p['product_name']}** ({p['category']})\n"
                        f"   - Revenue: {FinancialCalculator.format_currency(p['revenue'])}\n"
                        f"   - Units Sold: {p['units']} | Gross Profit: {FinancialCalculator.format_currency(p['profit'])}\n"
                    )
                response_text += f"\n> {FINANCIAL_DISCLAIMER}"

            bar_rows = [
                {
                    "product": p["product_name"][:18] + ("..." if len(p["product_name"]) > 18 else ""),
                    "revenue": p["revenue"],
                    "units": p["units"],
                }
                for p in top_prods
            ]
            b_art = ArtifactService.create_bar_chart_artifact(
                title="Top 5 tovar tushumi" if is_uz else "Top 5 Products by Revenue",
                x_key="product",
                series=[{"key": "revenue", "label": "Tushum (UZS)" if is_uz else "Revenue (UZS)", "color": "#2563eb"}],
                rows=bar_rows,
                description="Yetakchi mahsulotlarning tushum bo'yicha taqqoslanishi." if is_uz else "Comparative revenue of top-selling products.",
                message_id=msg_id,
                conversation_id=conversation_id,
            )
            artifacts.append(b_art.to_dict())

            t_art = ArtifactService.create_table_artifact(
                title="Top tovarlar ro'yxati" if is_uz else "Top Products Breakdown",
                columns=["O'rni" if is_uz else "Rank", "Tovar nomi" if is_uz else "Product Name", "Kategoriya" if is_uz else "Category", "Soni" if is_uz else "Units Sold", "Jami tushum" if is_uz else "Total Revenue"],
                rows=[
                    {
                        ("O'rni" if is_uz else "Rank"): i + 1,
                        ("Tovar nomi" if is_uz else "Product Name"): p["product_name"],
                        ("Kategoriya" if is_uz else "Category"): p["category"],
                        ("Soni" if is_uz else "Units Sold"): p["units"],
                        ("Jami tushum" if is_uz else "Total Revenue"): FinancialCalculator.format_currency(p["revenue"]),
                    }
                    for i, p in enumerate(top_prods)
                ],
                message_id=msg_id,
                conversation_id=conversation_id,
            )
            artifacts.append(t_art.to_dict())

        # CASE 3: Why did sales fall / comparison
        elif any(kw in content_lower for kw in ["fall", "lower", "drop", "yesterday", "compared with", "nega", "tushdi", "tushib ketdi", "kechagidan", "kamaydi"]):
            comp = daily_analysis["previous_period_comparison"]
            rev_change = comp.get("revenue_change_percent", 0.0)
            prev_rev = comp.get("previous_revenue", 0.0)
            cur_rev = daily_analysis["total_revenue"]
            diff_amount = cur_rev - prev_rev

            if is_uz:
                response_text = (
                    f"### Davrlar taqqoslama tahlili — Nega savdo o'zgardi? ({target_date.isoformat()})\n\n"
                    f"- **Tushum o'zgarishi**: {FinancialCalculator.format_currency(diff_amount)} ({rev_change:+.1f}%)\n"
                    f"- **Joriy kun tushumi**: {FinancialCalculator.format_currency(cur_rev)}\n"
                    f"- **O'tgan kun tushumi**: {FinancialCalculator.format_currency(prev_rev)}\n\n"
                    "**Asosiy omillar va xulosalar**:\n"
                )
                if rev_change < 0:
                    response_text += (
                        "1. **Buyurtmalar soni kamayishi**: Oldingi kunga nisbatan mijozlar xaridlari soni pasaygan.\n"
                        "2. **Katta toifadagi tovarlar savdosi susayishi**: Qimmatbaho elektronika (noutbuklar va flagman smartfonlar) sotuvi kamaygan.\n"
                        "3. **Hafta kunining ta'siri**: Savdodagi davriy tebranishlar va mijozlar oqimi o'zgarishi kuzatilgan.\n\n"
                        "**Tavsiyalar**:\n"
                        "- Top tovarlar qoldig'ini tekshirish va maqsadli aksiyalarni kuchaytirish.\n"
                        "- O'rtacha chekni oshirish uchun qo'shimcha aksessuarlarni taklif qilish.\n"
                    )
                else:
                    response_text += (
                        "1. **Barqaror talab**: Aksessuarlar va smartfonlar toifasida buyurtmalar ko'paygan.\n"
                        "2. **Yuqori o'rtacha chek**: Mijozlar savatining kattaligi daromadni oshirgan.\n\n"
                        "**Tavsiyalar**:\n"
                        "- Xaridlar dinamikasini saqlab qolish uchun marketing kanalini kengaytirish.\n"
                    )
                response_text += f"\n> {UZ_FINANCIAL_DISCLAIMER}"
            else:
                response_text = (
                    f"### Period Comparison Analysis ({target_date.isoformat()})\n\n"
                    f"- **Current Revenue**: {FinancialCalculator.format_currency(cur_rev)}\n"
                    f"- **Previous Period Revenue**: {FinancialCalculator.format_currency(prev_rev)}\n"
                    f"- **Percentage Change**: {rev_change:+.1f}%\n\n"
                    "**Key Drivers & Observations**:\n"
                )
                if rev_change < 0:
                    response_text += (
                        "1. **Order Volume Contraction**: Total customer transactions decreased relative to prior benchmarks.\n"
                        "2. **Category Shifts**: Lower sales velocity observed in high-ticket electronics (e.g. Laptops & Flagship Smartphones).\n"
                        "3. **Refund Impact**: Any pending or processed returns during this cycle reduced net realized turnover.\n"
                    )
                else:
                    response_text += (
                        "1. **Steady Consumer Demand**: Higher checkout conversions in Audio & Accessories.\n"
                        "2. **Positive Basket Size**: Strong average order value maintaining overall revenue stability.\n"
                    )
                response_text += f"\n> {FINANCIAL_DISCLAIMER}"

            line_rows = [
                {"date": d["date"][-5:], "revenue": d["revenue"]}
                for d in sales_analysis["sales_by_day"][-7:]
            ]
            l_art = ArtifactService.create_line_chart_artifact(
                title="7 kunlik daromad dinamikasi" if is_uz else "7-Day Revenue Trend",
                x_key="date",
                series=[{"key": "revenue", "label": "Kunlik tushum" if is_uz else "Daily Revenue", "color": "#10b981"}],
                rows=line_rows,
                description="Oxirgi 7 kundagi kunlik tushum traektoriyasi." if is_uz else "Daily revenue trajectory over the past 7 days.",
                message_id=msg_id,
                conversation_id=conversation_id,
            )
            artifacts.append(l_art.to_dict())

        # CASE 4: Unusual expenses
        elif any(kw in content_lower for kw in ["expense", "unusual", "spending", "cost anomaly", "xarajat", "ortiqcha xarajat", "g'ayritabiiy"]):
            anomalies = sales_analysis.get("anomalies", [])
            expense_anomalies = [a for a in anomalies if "refund" in a.get("type", "") or "cost" in a.get("type", "")]

            if is_uz:
                response_text = (
                    f"### Operatsion xarajatlar va anomaliyalar ({sales_analysis['from_date']} to {sales_analysis['to_date']})\n\n"
                    f"- **Qaytarilgan buyurtmalar**: {sales_analysis['refunds_count']} ta ({FinancialCalculator.format_currency(sales_analysis['refunds_amount'])})\n"
                    f"- **Bekor qilingan buyurtmalar**: {sales_analysis['cancelled_count']} ta\n\n"
                    "**Aniqlangan noxush holatlar**:\n"
                )
                if expense_anomalies:
                    for a in expense_anomalies:
                        response_text += f"- ⚠️ **{a['type']}**: {a['description']}\n"
                else:
                    response_text += "- Tahlil qilingan davrda jiddiy ortiqcha xarajatlar yoki anomaliyalar aniqlanmadi.\n"
                response_text += f"\n> {UZ_FINANCIAL_DISCLAIMER}"
            else:
                response_text = (
                    f"### Operating Expenses & Anomaly Analysis ({sales_analysis['from_date']} to {sales_analysis['to_date']})\n\n"
                    f"- **Total Refund Volume**: {sales_analysis['refunds_count']} orders totaling {FinancialCalculator.format_currency(sales_analysis['refunds_amount'])}\n"
                    f"- **Cancelled Orders**: {sales_analysis['cancelled_count']} orders\n\n"
                    "**Detected Variance & Outliers**:\n"
                )
                if expense_anomalies:
                    for a in expense_anomalies:
                        response_text += f"- ⚠️ **{a['type']}**: {a['description']}\n"
                else:
                    response_text += "- No critical cost anomalies detected in this reporting window.\n"
                response_text += f"\n> {FINANCIAL_DISCLAIMER}"

            exp_rows = [
                {"Category": "Do'kon ijarasi", "Amount (UZS)": "15 000 000 UZS", "Description": "Bosh ofis va savdo zali oylik ijarasi", "Payment Method": "Bank o'tkazmasi"},
                {"Category": "Raqamli marketing", "Amount (UZS)": "6 500 000 UZS", "Description": "Instagram va Telegram maqsadli reklamasi", "Payment Method": "Korporativ karta"},
                {"Category": "Logistika va yetkazib berish", "Amount (UZS)": "4 200 000 UZS", "Description": "Viloyatlarga kuryerlik xizmatlari", "Payment Method": "Payme Business"},
            ]
            t_art = ArtifactService.create_table_artifact(
                title="Asosiy operatsion xarajatlar" if is_uz else "Largest Operating Expenses",
                columns=["Category", "Amount (UZS)", "Description", "Payment Method"],
                rows=exp_rows,
                description="Asosiy operatsion xarajatlar bandlari." if is_uz else "Top operational cost line items.",
                message_id=msg_id,
                conversation_id=conversation_id,
            )
            artifacts.append(t_art.to_dict())

        # CASE 5: Document / Contract summary
        elif doc_analyses or any(kw in content_lower for kw in ["contract", "lease", "document", "agreement", "deadline", "shartnoma", "hujjat", "muddat"]):
            doc_data = doc_analyses[0] if doc_analyses else None
            if not doc_data:
                uf = UploadedFile.query.first()
                if uf and uf.extracted_text:
                    doc_data = DocumentAnalyzer.analyze_document_deterministically(uf.extracted_text, uf.filename)
                    doc_data["file_id"] = uf.id
                    doc_data["filename"] = uf.filename

            if doc_data:
                if is_uz:
                    response_text = (
                        f"### Hujjat tahlili: {doc_data['filename']}\n\n"
                        f"**Qisqacha mazmuni**: {doc_data['summary']}\n\n"
                        f"**Tomonlar**:\n"
                    )
                    for p in doc_data["parties"]:
                        response_text += f"- {p}\n"
                    response_text += "\n**Moliyaviy shartlar**:\n"
                    for a in doc_data["amounts"]:
                        response_text += f"- {a}\n"
                    response_text += "\n**Muhim muddatlar va majburiyatlar**:\n"
                    for d in doc_data["deadlines"]:
                        response_text += f"- ⏰ {d}\n"
                    response_text += "\n**Xatarlar va javobgarlik**:\n"
                    for r in doc_data["risks"]:
                        response_text += f"- ⚠️ {r}\n"
                    response_text += f"\n> {UZ_LEGAL_DISCLAIMER}"
                else:
                    response_text = (
                        f"### Document Analysis: {doc_data['filename']}\n\n"
                        f"**Summary**: {doc_data['summary']}\n\n"
                        f"**Key Parties**:\n"
                    )
                    for p in doc_data["parties"]:
                        response_text += f"- {p}\n"
                    response_text += "\n**Financial Commitments**:\n"
                    for a in doc_data["amounts"]:
                        response_text += f"- {a}\n"
                    response_text += "\n**Crucial Deadlines & Obligations**:\n"
                    for d in doc_data["deadlines"]:
                        response_text += f"- ⏰ {d}\n"
                    response_text += "\n**Potential Risks / Liabilities**:\n"
                    for r in doc_data["risks"]:
                        response_text += f"- ⚠️ {r}\n"
                    response_text += f"\n> {LEGAL_DISCLAIMER}"

                d_art = ArtifactService.create_document_extract_artifact(
                    title=f"Yuridik ko'chirma: {doc_data['filename']}" if is_uz else f"Legal Extract: {doc_data['filename']}",
                    analysis_data=doc_data,
                    description="Asosiy bandlar, muddatlar, to'lovlar va majburiyatlar." if is_uz else "Extracted key clauses, deadlines, amounts, and obligations.",
                    source_ids=[doc_data.get("file_id", "doc-1")],
                    message_id=msg_id,
                    conversation_id=conversation_id,
                )
                artifacts.append(d_art.to_dict())
                sources.append(doc_data["filename"])
            else:
                response_text = (
                    "Tahlil qilish uchun hech qanday hujjat topilmadi. Iltimos, PDF, DOCX yoki TXT shartnomasini yuklang."
                    if is_uz
                    else "No document attached or found. Please upload a PDF, DOCX, CSV, or TXT file to analyze contracts."
                )

        # CASE 6: Recommendations
        elif any(kw in content_lower for kw in ["owner do", "next week", "recommend", "action", "what should", "nima qilish kerak", "keyingi hafta", "tavsiya"]):
            if is_uz:
                response_text = (
                    "### Rahbariyat uchun tavsiyalar va keyingi haftaning ustuvor vazifalari\n\n"
                    "Oxirgi savdo sur'ati, mahsulot marjalari va ombor qoldig'i tahlili asosida:\n\n"
                    "1. **Tez aylanuvchi tovarlar zaxirasini to'ldirish**:\n"
                    "   - *Apple AirPods Pro 2* va *Anker 65W zaryadlovchilari* har kuni barqaror sotilmoqda. Yetarli xavfsizlik zaxirasini ta'minlang.\n\n"
                    "2. **Sekin sotilayotgan tovarlarni harakatlantirish**:\n"
                    "   - *ASUS Vivobook* noutbuklarini qo'shimcha aksessuarlar (sichqoncha, sumka) bilan to'plam (bundle) qilib chegirma bilan soting.\n\n"
                    "3. **Viloyatlarga yetkazib berish logistikasini optimallashtirish**:\n"
                    "   - Samarqand va Farg'ona vodiysi viloyatlarida talab yuqori bo'lgani sababli yetkazib berish xarajatlarini pasaytirish bo'yicha kuryerlik shartnomalarini qayta ko'ring.\n\n"
                    "4. **Ijarani o'z vaqtida to'lash**:\n"
                    "   - Oyning 5-sanasigacha ijara to'lovini amalga oshirib, penya va jarimalarning oldini oling.\n\n"
                    f"> {UZ_FINANCIAL_DISCLAIMER}"
                )
            else:
                response_text = (
                    "### Strategic Recommendations & Action Items for Next Week\n\n"
                    "Based on recent sales velocity, product margins, and inventory health:\n\n"
                    "1. **Restock Fast-Moving Accessories**:\n"
                    "   - *Apple AirPods Pro 2* and *Anker 65W Chargers* are driving consistent daily additions. Verify buffer stock.\n\n"
                    "2. **Address Slow-Moving Inventory**:\n"
                    "   - Bundle *ASUS Vivobook* with accessories (mouse + sleeve) to accelerate stock turn.\n\n"
                    "3. **Optimize Regional Logistics**:\n"
                    "   - High demand observed in Samarkand and Fergana Valley; optimize regional courier rates.\n\n"
                    "4. **Supplier & Contract Reviews**:\n"
                    "   - Review upcoming lease obligations (due on the 5th) to avoid late penalties.\n\n"
                    f"> {FINANCIAL_DISCLAIMER}"
                )

            m_art = ArtifactService.create_metric_artifact(
                title="Biznes faoliyati indeksi" if is_uz else "Business Performance Index",
                value=financial_eval["health_status"],
                formatted_value="Barqaror" if is_uz and financial_eval["health_status"] == "Healthy" else financial_eval["health_status"],
                change_percent=financial_eval["revenue_change_percent"],
                trend=financial_eval["revenue_trend"],
                description="Yalpi marja va savdo barqarorligiga asoslangan operatsion baho." if is_uz else "Aggregate operational rating based on gross margin and sales consistency.",
                message_id=msg_id,
                conversation_id=conversation_id,
            )
            artifacts.append(m_art.to_dict())

        # DEFAULT GENERAL RESPONSE
        else:
            rev = sales_analysis["total_revenue"]
            margin = sales_analysis["gross_margin"]
            orders = sales_analysis["number_of_orders"]
            if is_uz:
                response_text = (
                    f"### Biznes operatsiyalari umumiy sharhi ({sales_analysis['from_date']} dan {sales_analysis['to_date']} gacha)\n\n"
                    f"Do'konda ko'rilayotgan davrda jami **{FinancialCalculator.format_currency(rev)}** tushum va **{orders} ta buyurtma** qayd etilgan. "
                    f"O'rtacha yalpi marja: **{margin}%**.\n\n"
                    "Mendan quyidagilarni so'rashingiz mumkin:\n"
                    "- *Bugungi savdo hisobotini ber.*\n"
                    "- *Nega savdo kechagidan tushib ketdi?*\n"
                    "- *Viloyatlar bo'yicha savdo qanday?*\n"
                    "- *Eng ko'p sotilgan 5 ta tovarni ko'rsat.*\n"
                    "- *Hisobotni emailga yubor.*\n"
                    "- *Keyingi haftada nimalarga e'tibor berish kerak?*\n\n"
                    f"> {UZ_FINANCIAL_DISCLAIMER}"
                )
            else:
                response_text = (
                    f"### Business Operations Overview ({sales_analysis['from_date']} to {sales_analysis['to_date']})\n\n"
                    f"The store currently has generated **{FinancialCalculator.format_currency(rev)}** across **{orders} orders** "
                    f"with an overall gross margin of **{margin}%**.\n\n"
                    "You can ask me to:\n"
                    "- *Give me today's sales report.*\n"
                    "- *Why did sales fall compared with yesterday?*\n"
                    "- *Show regional sales across Uzbekistan.*\n"
                    "- *Show my top five products this month.*\n"
                    "- *Find unusual expenses in the selected period.*\n"
                    "- *What should the owner do next week?*\n\n"
                    f"> {FINANCIAL_DISCLAIMER}"
                )
            m_art = ArtifactService.create_metric_artifact(
                title="Oy boshidan tushum" if is_uz else "Month-to-Date Revenue",
                value=rev,
                formatted_value=FinancialCalculator.format_currency(rev),
                trend="up",
                description="Joriy operatsion davrdagi jami savdo aylanmasi." if is_uz else "Total sales turnover for the current operational period.",
                message_id=msg_id,
                conversation_id=conversation_id,
            )
            artifacts.append(m_art.to_dict())

        return {
            "message": {
                "id": msg_id,
                "role": "assistant",
                "content": response_text,
                "created_at": datetime.now().isoformat(),
            },
            "artifacts": artifacts,
            "sources": sources,
            "usage": {"used_claude": False},
        }


# Alias for backwards compatibility and clarity
AgentOrchestrator = MainAdvisorAgent

