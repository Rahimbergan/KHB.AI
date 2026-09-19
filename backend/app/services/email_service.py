import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Dict, Any, List, Optional, Union
from backend.app.config import Config
from backend.app.utils.logging import logger


class EmailService:
    """
    Email service utilizing smtplib with Gmail SMTP API (smtp.gmail.com:587).
    Loads credentials dynamically from environment variables without hardcoding.
    """

    @classmethod
    def get_smtp_config(cls) -> Dict[str, Any]:
        user = (os.getenv("GMAIL_USER") or os.getenv("SMTP_USER") or Config.GMAIL_USER or "").strip()
        password = (os.getenv("GMAIL_APP_PASSWORD") or os.getenv("SMTP_PASSWORD") or Config.GMAIL_APP_PASSWORD or "").strip()
        host = (os.getenv("SMTP_HOST") or Config.SMTP_HOST or "smtp.gmail.com").strip()
        port = int(os.getenv("SMTP_PORT") or Config.SMTP_PORT or 587)
        use_tls = os.getenv("SMTP_USE_TLS", "true").lower() in ("true", "1", "yes")
        email_from = (os.getenv("EMAIL_FROM") or user or "reports@khb-retail.uz").strip()

        return {
            "user": user,
            "password": password,
            "host": host,
            "port": port,
            "use_tls": use_tls,
            "from": email_from,
            "configured": bool(user and password),
        }

    @classmethod
    def send_email(
        cls,
        to_email: Union[str, List[str]],
        subject: str,
        text_content: str,
        html_content: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Dispatches an email via Gmail SMTP using smtplib.
        """
        cfg = cls.get_smtp_config()

        if isinstance(to_email, str):
            # Split comma-separated addresses if any
            recipients = [e.strip() for e in to_email.split(",") if e.strip()]
        else:
            recipients = [e.strip() for e in to_email if e.strip()]

        if not recipients:
            return {"success": False, "recipients": [], "error": "No recipient email addresses provided."}

        if not cfg["configured"]:
            msg = "Gmail SMTP credentials not configured (GMAIL_USER or GMAIL_APP_PASSWORD missing in .env)."
            logger.warning(msg)
            return {
                "success": False,
                "recipients": recipients,
                "error": msg,
                "status": "unconfigured",
            }

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"KHB Smart Retail Assistant <{cfg['from']}>"
        msg["To"] = ", ".join(recipients)

        # Attach text part
        msg.attach(MIMEText(text_content, "plain", "utf-8"))

        # Attach HTML part if provided
        if html_content:
            msg.attach(MIMEText(html_content, "html", "utf-8"))

        try:
            logger.info(f"Connecting to SMTP server {cfg['host']}:{cfg['port']} for {recipients}...")
            if cfg["port"] == 465:
                # SSL direct
                with smtplib.SMTP_SSL(cfg["host"], cfg["port"], timeout=30) as server:
                    server.login(cfg["user"], cfg["password"])
                    server.sendmail(cfg["from"], recipients, msg.as_string())
            else:
                # STARTTLS (default 587)
                with smtplib.SMTP(cfg["host"], cfg["port"], timeout=30) as server:
                    server.ehlo()
                    if cfg["use_tls"]:
                        server.starttls()
                        server.ehlo()
                    server.login(cfg["user"], cfg["password"])
                    server.sendmail(cfg["from"], recipients, msg.as_string())

            logger.info(f"Email successfully sent to {recipients}: '{subject}'")
            return {
                "success": True,
                "recipients": recipients,
                "subject": subject,
                "error": None,
            }

        except smtplib.SMTPAuthenticationError as auth_err:
            err = f"Gmail SMTP Authentication failed: check GMAIL_USER and GMAIL_APP_PASSWORD. {auth_err}"
            logger.error(err)
            return {"success": False, "recipients": recipients, "error": err}
        except smtplib.SMTPConnectError as conn_err:
            err = f"Failed to connect to SMTP host {cfg['host']}:{cfg['port']}: {conn_err}"
            logger.error(err)
            return {"success": False, "recipients": recipients, "error": err}
        except Exception as e:
            err = f"SMTP dispatch error: {str(e)}"
            logger.error(err)
            return {"success": False, "recipients": recipients, "error": err}

    @classmethod
    def send_report_email(
        cls,
        to_email: Union[str, List[str]],
        report_data: Dict[str, Any],
        date_str: str,
    ) -> Dict[str, Any]:
        """
        Formats and sends an operational business sales report email.
        """
        def fmt_curr(val: float) -> str:
            return f"{round(val):,} UZS".replace(",", " ")

        total_rev = report_data.get("total_revenue", 0.0)
        gross_profit = report_data.get("gross_profit", 0.0)
        gross_margin = report_data.get("gross_margin_percent") or report_data.get("gross_margin", 0.0)
        orders = report_data.get("order_count") or report_data.get("number_of_orders", 0)
        units = report_data.get("units_sold", 0)
        aov = report_data.get("average_order_value", 0.0)
        top_prods = report_data.get("top_products", [])[:5]

        subject = f"📊 KHB Smart Retail Operations Report — {date_str}"

        # Text version
        lines = [
            f"KHB SMART RETAIL — OPERATIONS REPORT",
            f"Period / Date: {date_str}",
            "=" * 45,
            f"• Revenue:            {fmt_curr(total_rev)}",
            f"• Gross Profit:       {fmt_curr(gross_profit)}",
            f"• Gross Margin:       {gross_margin}%",
            f"• Orders Completed:   {orders}",
            f"• Units Sold:         {units}",
            f"• Average Order Value:{fmt_curr(aov)}",
            "",
            "TOP SELLING PRODUCTS:",
        ]
        for idx, p in enumerate(top_prods, 1):
            pname = p.get("product_name", p.get("name", "Item"))
            prev = p.get("revenue", 0.0)
            punits = p.get("units", p.get("units_sold", 0))
            lines.append(f"  {idx}. {pname} — {fmt_curr(prev)} ({punits} units)")

        lines.extend([
            "",
            "DISCLAIMER:",
            "Calculations based on local Bito operational data. Not a certified audit report.",
        ])
        text_content = "\n".join(lines)

        # HTML version
        prod_rows = "".join([
            f"""<tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px 14px; font-weight: 600; color: #1e293b;">{p.get('product_name', p.get('name', 'Item'))}</td>
                <td style="padding: 10px 14px; color: #64748b;">{p.get('category', 'Retail')}</td>
                <td style="padding: 10px 14px; text-align: center; color: #1e293b;">{p.get('units', p.get('units_sold', 0))}</td>
                <td style="padding: 10px 14px; text-align: right; font-weight: 700; color: #059669;">{fmt_curr(p.get('revenue', 0.0))}</td>
            </tr>"""
            for p in top_prods
        ])

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>{subject}</title>
        </head>
        <body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a;">
          <div style="max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #059669 0%, #0d9488 100%); padding: 28px; color: #ffffff;">
              <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.9;">KHB Assistant · Automated Operations Dispatch</div>
              <h1 style="margin: 6px 0 0 0; font-size: 22px; font-weight: 700; letter-spacing: -0.02em;">Business Performance Summary</h1>
              <div style="margin-top: 6px; font-size: 13px; opacity: 0.95;">Period: <strong>{date_str}</strong></div>
            </div>

            <!-- Metrics Grid -->
            <div style="padding: 24px;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 24px;">
                <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 14px; border-radius: 12px;">
                  <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #15803d;">Total Revenue</div>
                  <div style="font-size: 20px; font-weight: 800; color: #065f46; margin-top: 4px;">{fmt_curr(total_rev)}</div>
                </div>
                <div style="background: #f0fdfa; border: 1px solid #99f6e4; padding: 14px; border-radius: 12px;">
                  <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #0f766e;">Gross Profit (Margin)</div>
                  <div style="font-size: 20px; font-weight: 800; color: #115e59; margin-top: 4px;">{fmt_curr(gross_profit)} <span style="font-size: 13px; font-weight: 600;">({gross_margin}%)</span></div>
                </div>
                <div style="background: #eff6ff; border: 1px solid #bfdbfe; padding: 14px; border-radius: 12px;">
                  <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #1d4ed8;">Completed Orders</div>
                  <div style="font-size: 20px; font-weight: 800; color: #1e40af; margin-top: 4px;">{orders} <span style="font-size: 12px; font-weight: 500; color: #64748b;">({units} units)</span></div>
                </div>
                <div style="background: #fefce8; border: 1px solid #fef08a; padding: 14px; border-radius: 12px;">
                  <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #a16207;">Average Order Value</div>
                  <div style="font-size: 20px; font-weight: 800; color: #854d0e; margin-top: 4px;">{fmt_curr(aov)}</div>
                </div>
              </div>

              <!-- Top Products Table -->
              <h3 style="font-size: 14px; font-weight: 700; color: #1e293b; margin: 0 0 10px 0;">Top Selling Products</h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 24px;">
                <thead>
                  <tr style="background: #f8fafc; border-bottom: 2px solid #cbd5e1; text-align: left; color: #64748b; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em;">
                    <th style="padding: 8px 14px;">Product</th>
                    <th style="padding: 8px 14px;">Category</th>
                    <th style="padding: 8px 14px; text-align: center;">Units</th>
                    <th style="padding: 8px 14px; text-align: right;">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {prod_rows}
                </tbody>
              </table>

              <!-- Action Prompt -->
              <div style="background: #f1f5f9; padding: 14px; border-radius: 12px; border: 1px solid #e2e8f0; font-size: 12px; color: #334155; line-height: 1.5;">
                💡 <strong>AI Operations Note:</strong> You can interact directly with the KHB Assistant via Telegram bot or the web app for deep multi-turn analysis.
              </div>
            </div>

            <!-- Footer -->
            <div style="background: #f8fafc; padding: 16px 24px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center;">
              Calculations based on local Bito operational data. Not a formal financial statement.
            </div>
          </div>
        </body>
        </html>
        """

        return cls.send_email(to_email, subject, text_content, html_content)

