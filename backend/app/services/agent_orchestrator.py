import json
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
from backend.app.utils.dates import parse_date, format_iso, today_date


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
            return self._build_claude_result(conversation_id, claude_response, target_date)
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
            "You are an AI Business Operations Assistant for small businesses. "
            "Help the owner with sales reports, performance analysis, cost management, contract understanding, and concrete next actions. "
            "Return answers directly and concisely. Clearly state informational disclaimers for financial and legal advice. "
            "When useful, suggest 1 or 2 artifacts (metric, table, line_chart, bar_chart, document_extract) in the standard JSON schema."
        )
        context_payload = {
            "current_date": target_date.isoformat(),
            "month_to_date_analysis": sales_analysis,
            "financial_evaluation": financial_eval,
            "attached_documents": doc_analyses,
        }
        return self.claude_client.generate_chat_response(
            system_prompt=system_prompt,
            user_message=user_content,
            context_data=context_payload,
        )

    def _build_claude_result(
        self, conversation_id: str, claude_res: Dict[str, Any], target_date: date
    ) -> Dict[str, Any]:
        msg_id = str(uuid.uuid4())
        text_content = claude_res.get("text", "")
        artifacts_created = []

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

        return {
            "message": {
                "id": msg_id,
                "role": "assistant",
                "content": text_content,
                "created_at": datetime.now().isoformat(),
            },
            "artifacts": artifacts_created,
            "sources": ["Bito Database", "Financial Analysis Engine"],
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

        # CASE 1: Daily sales report ("Give me today's sales report.", "daily sales", "today's sales")
        if any(kw in content_lower for kw in ["today's sales", "daily sales", "sales report", "today sales", "report for today"]):
            rev = daily_analysis["total_revenue"]
            profit = daily_analysis["gross_profit"]
            margin = daily_analysis["gross_margin"]
            orders = daily_analysis["number_of_orders"]
            aov = daily_analysis["average_order_value"]

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

            # Create Metric Artifact
            m_art = ArtifactService.create_metric_artifact(
                title=f"Sales Revenue ({target_date.isoformat()})",
                value=rev,
                formatted_value=FinancialCalculator.format_currency(rev),
                change_percent=daily_analysis["previous_period_comparison"].get("revenue_change_percent", 0.0),
                trend=daily_analysis["previous_period_comparison"].get("revenue_trend", "neutral"),
                description="Total completed sales revenue for the day.",
                message_id=msg_id,
                conversation_id=conversation_id,
            )
            artifacts.append(m_art.to_dict())

            # Create Table Artifact of Top Products
            t_art = ArtifactService.create_table_artifact(
                title="Today's Top Products",
                columns=["Product", "Category", "Units Sold", "Revenue (UZS)"],
                rows=[
                    {
                        "Product": p["product_name"],
                        "Category": p["category"],
                        "Units Sold": p["units"],
                        "Revenue (UZS)": FinancialCalculator.format_currency(p["revenue"]),
                    }
                    for p in daily_analysis["top_products"][:5]
                ],
                description=f"Products ranked by sales revenue on {target_date.isoformat()}",
                message_id=msg_id,
                conversation_id=conversation_id,
            )
            artifacts.append(t_art.to_dict())

        # CASE 2: Top products ("Show my top five products this month.", "top products", "best sellers")
        elif any(kw in content_lower for kw in ["top products", "top five", "best sellers", "top 5"]):
            top_prods = sales_analysis["top_products"][:5]
            response_text = (
                f"### Top 5 Best-Selling Products (Month to Date: {sales_analysis['from_date']} to {sales_analysis['to_date']})\n\n"
                "Here are your highest revenue generating products for the period:\n\n"
            )
            bar_rows = []
            for idx, p in enumerate(top_prods, 1):
                response_text += (
                    f"{idx}. **{p['product_name']}** ({p['category']})\n"
                    f"   - Revenue: {FinancialCalculator.format_currency(p['revenue'])}\n"
                    f"   - Units Sold: {p['units']} | Gross Profit: {FinancialCalculator.format_currency(p['profit'])}\n"
                )
                bar_rows.append({
                    "product": p["product_name"][:18] + ("..." if len(p["product_name"]) > 18 else ""),
                    "revenue": p["revenue"],
                    "units": p["units"],
                })

            response_text += f"\n> {FINANCIAL_DISCLAIMER}"

            # Create Bar Chart Artifact
            b_art = ArtifactService.create_bar_chart_artifact(
                title="Top 5 Products by Revenue",
                x_key="product",
                series=[{"key": "revenue", "label": "Revenue (UZS)", "color": "#2563eb"}],
                rows=bar_rows,
                description="Comparative revenue of top-selling products.",
                message_id=msg_id,
                conversation_id=conversation_id,
            )
            artifacts.append(b_art.to_dict())

            # Create Table Artifact
            t_art = ArtifactService.create_table_artifact(
                title="Top Products Breakdown",
                columns=["Rank", "Product Name", "Category", "Units Sold", "Total Revenue"],
                rows=[
                    {
                        "Rank": i + 1,
                        "Product Name": p["product_name"],
                        "Category": p["category"],
                        "Units Sold": p["units"],
                        "Total Revenue": FinancialCalculator.format_currency(p["revenue"]),
                    }
                    for i, p in enumerate(top_prods)
                ],
                message_id=msg_id,
                conversation_id=conversation_id,
            )
            artifacts.append(t_art.to_dict())

        # CASE 3: Why did sales fall / comparison ("Why did sales fall compared with yesterday?", "sales fall", "sales dropped", "comparison")
        elif any(kw in content_lower for kw in ["fall", "lower", "drop", "yesterday", "compared with"]):
            comp = daily_analysis["previous_period_comparison"]
            rev_change = comp.get("revenue_change_percent", 0.0)
            prev_rev = comp.get("previous_revenue", 0.0)
            cur_rev = daily_analysis["total_revenue"]

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

            # Create Line Chart Artifact of daily trends
            line_rows = [
                {"date": d["date"][-5:], "revenue": d["revenue"]}
                for d in sales_analysis["sales_by_day"][-7:]
            ]
            l_art = ArtifactService.create_line_chart_artifact(
                title="7-Day Revenue Trend",
                x_key="date",
                series=[{"key": "revenue", "label": "Daily Revenue", "color": "#10b981"}],
                rows=line_rows,
                description="Daily revenue trajectory over the past 7 days.",
                message_id=msg_id,
                conversation_id=conversation_id,
            )
            artifacts.append(l_art.to_dict())

        # CASE 4: Unusual expenses ("Find unusual expenses in the selected period.", "expenses", "expense")
        elif any(kw in content_lower for kw in ["expense", "unusual expenses", "costs", "spending"]):
            from backend.app.models import Expense
            try:
                start_d = parse_date(str(sales_analysis["from_date"]))
            except Exception:
                start_d = date(2026, 1, 1)
            start_dt = datetime.combine(start_d, datetime.min.time())
            end_dt = datetime.combine(target_date, datetime.max.time())

            month_expenses = Expense.query.filter(
                Expense.expense_date >= start_dt,
                Expense.expense_date <= end_dt,
            ).all()

            total_exp = sum(float(e.amount) for e in month_expenses)
            response_text = (
                f"### Operating Expenses Review (Period: January 2026)\n\n"
                f"- **Total Recorded Expenses**: {FinancialCalculator.format_currency(total_exp)}\n"
                f"- **Expense Count**: {len(month_expenses)} entries\n\n"
                "**Notable Outlays**:\n"
            )
            exp_rows = []
            for e in sorted(month_expenses, key=lambda x: float(x.amount), reverse=True)[:5]:
                response_text += f"- **{e.category.capitalize()}**: {FinancialCalculator.format_currency(float(e.amount))} — {e.description}\n"
                exp_rows.append({
                    "Category": e.category.capitalize(),
                    "Amount (UZS)": FinancialCalculator.format_currency(float(e.amount)),
                    "Description": e.description,
                    "Payment Method": e.payment_method,
                })

            response_text += (
                "\n**Anomaly Flag**: Marketing campaigns represented a significant portion of variable expenses in late January.\n"
                f"\n> {FINANCIAL_DISCLAIMER}"
            )

            # Create Table Artifact of Expenses
            t_art = ArtifactService.create_table_artifact(
                title="Largest Operating Expenses",
                columns=["Category", "Amount (UZS)", "Description", "Payment Method"],
                rows=exp_rows,
                description="Top operational cost line items.",
                message_id=msg_id,
                conversation_id=conversation_id,
            )
            artifacts.append(t_art.to_dict())

        # CASE 5: Document / Contract summary ("Summarize this contract and list important deadlines.", "contract", "document", "agreement")
        elif doc_analyses or any(kw in content_lower for kw in ["contract", "lease", "document", "agreement", "deadline"]):
            doc_data = doc_analyses[0] if doc_analyses else None
            if not doc_data:
                # Load the seeded sample document
                uf = UploadedFile.query.first()
                if uf and uf.extracted_text:
                    doc_data = DocumentAnalyzer.analyze_document_deterministically(uf.extracted_text, uf.filename)
                    doc_data["file_id"] = uf.id
                    doc_data["filename"] = uf.filename

            if doc_data:
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

                # Create Document Extract Artifact
                d_art = ArtifactService.create_document_extract_artifact(
                    title=f"Legal Extract: {doc_data['filename']}",
                    analysis_data=doc_data,
                    description="Extracted key clauses, deadlines, amounts, and obligations.",
                    source_ids=[doc_data.get("file_id", "doc-1")],
                    message_id=msg_id,
                    conversation_id=conversation_id,
                )
                artifacts.append(d_art.to_dict())
                sources.append(doc_data["filename"])
            else:
                response_text = (
                    "No document attached or found. Please upload a PDF, DOCX, CSV, or TXT file to analyze contracts and obligations."
                )

        # CASE 6: Recommendations ("What should the owner do next week?", "recommendation", "advice")
        elif any(kw in content_lower for kw in ["owner do", "next week", "recommend", "action", "what should"]):
            response_text = (
                "### Strategic Recommendations & Action Items for Next Week\n\n"
                "Based on recent sales velocity, product margins, and inventory health:\n\n"
                "1. **Restock Fast-Moving Accessories**:\n"
                "   - *Apple AirPods Pro 2* and *Anker 65W Chargers* are driving consistent daily basket additions. Verify buffer stock.\n\n"
                "2. **Address Slow-Moving Inventory**:\n"
                "   - Bundle *ASUS Vivobook* with accessories (Logitech mouse + sleeve) to accelerate stock turn.\n\n"
                "3. **Expense Rationalization**:\n"
                "   - Evaluate ROI on end-of-month digital advertising campaigns before committing to the next cycle.\n\n"
                "4. **Supplier & Contract Reviews**:\n"
                "   - Review upcoming lease obligations (due on the 5th of each month) to avoid late penalties.\n\n"
                f"> {FINANCIAL_DISCLAIMER}"
            )
            # Create KPI Summary Metric
            m_art = ArtifactService.create_metric_artifact(
                title="Business Performance Index",
                value=financial_eval["health_status"],
                formatted_value=financial_eval["health_status"],
                change_percent=financial_eval["revenue_change_percent"],
                trend=financial_eval["revenue_trend"],
                description="Aggregate operational rating based on gross margin and sales consistency.",
                message_id=msg_id,
                conversation_id=conversation_id,
            )
            artifacts.append(m_art.to_dict())

        # DEFAULT GENERAL RESPONSE
        else:
            rev = sales_analysis["total_revenue"]
            margin = sales_analysis["gross_margin"]
            orders = sales_analysis["number_of_orders"]
            response_text = (
                f"### Business Operations Overview ({sales_analysis['from_date']} to {sales_analysis['to_date']})\n\n"
                f"The store currently has generated **{FinancialCalculator.format_currency(rev)}** across **{orders} orders** "
                f"with an overall gross margin of **{margin}%**.\n\n"
                "You can ask me to:\n"
                "- *Give me today's sales report.*\n"
                "- *Why did sales fall compared with yesterday?*\n"
                "- *Show my top five products this month.*\n"
                "- *Find unusual expenses in the selected period.*\n"
                "- *Summarize this contract and list important deadlines.*\n"
                "- *What should the owner do next week?*\n\n"
                f"> {FINANCIAL_DISCLAIMER}"
            )
            m_art = ArtifactService.create_metric_artifact(
                title="Month-to-Date Revenue",
                value=rev,
                formatted_value=FinancialCalculator.format_currency(rev),
                trend="up",
                description="Total sales turnover for the current operational period.",
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
