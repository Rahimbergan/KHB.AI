# KHB Assistant — New Features Guide (Tools, Telegram Bot, Worker & Redis)

This document explains the newly added enterprise features:
1. **AI Agent Tools**: Email sender via `smtplib` using Gmail SMTP API.
2. **Interactive Telegram Bot**: Full bot interface that users can interact with instead of or alongside the web app.
3. **Scheduled Report Worker**: Configurable periodic worker (`WORKER_PERIOD`, e.g. `5m`, `1h`) that generates and sends reports via email and Telegram bot.
4. **High-Speed Redis Caching**: Preloads next period datasets into Redis for instant sub-millisecond responses.

---

## 1. Environment Configuration (`.env`)

Add the following environment variables to `/home/rahimbergan/batman/Khb/backend/.env`:

```bash
# -------------------------------------------------------------
# GMAIL SMTP CONFIGURATION (Email Sender Tool & Worker)
# -------------------------------------------------------------
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USE_TLS=true
# Your Google account email address:
GMAIL_USER=your_company@gmail.com
# 16-character Google App Password (create at https://myaccount.google.com/apppasswords):
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
EMAIL_FROM=reports@khb-retail.uz

# -------------------------------------------------------------
# TELEGRAM BOT CONFIGURATION
# -------------------------------------------------------------
# Token obtained from @BotFather on Telegram:
TELEGRAM_BOT_TOKEN=8123456789:AAHxxxxxxxxx_xxxxxxxxxxxx
# Optional comma-separated chat IDs to receive reports automatically without /subscribe:
TELEGRAM_REPORT_CHAT_IDS=123456789,987654321

# -------------------------------------------------------------
# SCHEDULED REPORT WORKER CONFIGURATION
# -------------------------------------------------------------
# Cycle period: m = minutes, h = hours, s = seconds
# Examples:
#   WORKER_PERIOD=5m   -> sends report & preloads cache every 5 minutes
#   WORKER_PERIOD=30m  -> sends report every 30 minutes
#   WORKER_PERIOD=1h   -> sends report every 1 hour
WORKER_PERIOD=5m

# Comma-separated list of recipient emails for automated worker reports:
WORKER_EMAIL_RECIPIENTS=owner@khb.uz,finance@khb.uz

# Automatically start worker background thread with the Flask web server:
WORKER_AUTORUN=false

# -------------------------------------------------------------
# REDIS CACHE CONFIGURATION
# -------------------------------------------------------------
REDIS_URL=redis://localhost:6379/0
# Note: If Redis server is offline, the app automatically falls back
# to a thread-safe in-memory cache without crashing.
```

> [!TIP]
> **Generating a Gmail App Password:**
> 1. Go to your Google Account -> **Security**.
> 2. Enable **2-Step Verification** (if not already enabled).
> 3. Search for **App passwords** (or visit [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)).
> 4. Create an app named "KHB Assistant" and copy the generated 16-character password into `GMAIL_APP_PASSWORD`.

---

## 2. Feature 1: AI Agent Tools & Email Sender

The AI Agent (both Claude Sonnet and the deterministic intelligence engine) now possesses execution tools.

### How to use in Web Chat or Telegram:
Ask the assistant naturally in the chat window:
- *"Send today's sales report to director@company.uz"*
- *"Email January summary to investor@khb.uz"*
- *"Send the operational report to accountant@khb.uz with subject Q1 Review"*

### What happens behind the scenes:
1. The AI Agent detects the email dispatch intent and extracts recipient, subject, and report body.
2. Invokes the `send_email` tool via [`EmailService`](file:///home/rahimbergan/batman/Khb/backend/app/services/email_service.py).
3. Connects securely to `smtp.gmail.com:587` with STARTTLS encryption.
4. Generates an executive dual-format report:
   - **HTML version**: Styled KPI cards, revenue breakdown, and top-products table.
   - **Plain text version**: Clean terminal/email reader fallback.
5. Returns delivery confirmation and emits an **Email Dispatch Status** visual artifact into the chat!

---

## 3. Feature 2: Interactive Telegram Bot

Users can now interact with the KHB Assistant directly from Telegram on mobile or desktop without opening the browser.

### How to Start the Telegram Bot:
In a terminal, run:
```bash
cd /home/rahimbergan/batman/Khb/backend
.venv/bin/python run.py telegram-bot
```

### Supported Telegram Commands:
| Command | Description |
|---|---|
| `/start` | Welcome greeting, quick overview, and command list. |
| `/help` | Detailed instructions and tips. |
| `/report [YYYY-MM-DD]` | Instant operations report for the given date (default: `2026-01-31`). |
| `/top` | Top 5 best-selling products today by revenue and unit volume. |
| `/kpi` | High-level scorecard: Revenue, Gross Profit, Gross Margin, Orders, and AOV. |
| `/subscribe` | **Subscribes your Telegram chat** to receive automated reports sent by the worker. |
| `/unsubscribe` | Stops automated periodic reports for your chat. |

### Conversational Natural Language via Telegram:
Users can also send normal questions to the bot:
- *"Why did sales fall yesterday compared to the previous day?"*
- *"What should the owner focus on next week?"*
- *"Email today's sales summary to rahim@khb.uz"*

The bot routes your message through the multi-agent pipeline (`AgentOrchestrator`) and replies with formatted analysis and tool execution results.

---

## 4. Feature 3: Scheduled Report Worker (`WORKER_PERIOD`)

The worker automates recurring business intelligence delivery and preloads hot data into Redis.

### How Period Parsing Works:
The `WORKER_PERIOD` parameter in `.env` accepts:
- `m` = minutes (e.g. `WORKER_PERIOD=5m` -> 300 seconds)
- `h` = hours (e.g. `WORKER_PERIOD=1h` -> 3600 seconds)
- `s` = seconds (e.g. `WORKER_PERIOD=30s` -> 30 seconds)
- `d` = days (e.g. `WORKER_PERIOD=1d` -> 86400 seconds)

### What the Worker Does on Each Cycle:
1. **Preloads Next Operational Data into Redis**: Precalculates revenue, profit, margins, top products, and anomalies and caches them under key `khb:operational:<date>`.
2. **Dispatches Email Reports**: Sends professional HTML + text reports to all addresses listed in `WORKER_EMAIL_RECIPIENTS`.
3. **Broadcasts to Telegram**: Sends instant KPI notifications to all `/subscribe` users.
4. **Sleeps**: Waits for `WORKER_PERIOD` before executing the next cycle.

### How to Run the Worker:
1. **Standalone Worker Loop**:
   ```bash
   cd /home/rahimbergan/batman/Khb/backend
   .venv/bin/python run.py worker
   ```
2. **Execute Single Immediate Cycle (Testing / One-Off)**:
   ```bash
   cd /home/rahimbergan/batman/Khb/backend
   .venv/bin/python run.py run-cycle
   # Or for a specific target date:
   .venv/bin/python run.py run-cycle --date 2026-01-31
   ```
3. **Run in Background with Flask Server**:
   Set `WORKER_AUTORUN=true` in `.env`. When you start `python run.py`, the worker starts automatically as a background daemon thread.

---

## 5. Feature 4: High-Performance Redis Caching

The caching layer ([`cache_service.py`](file:///home/rahimbergan/batman/Khb/backend/app/services/cache_service.py)) speeds up user and bot queries from ~150ms down to < 2ms.

- **Preloaded Cache Keys**:
  - `khb:operational:<date>`: Full daily and month-to-date business metrics.
  - `khb:operational:latest`: Most recent precomputed snapshot.
- **Resilient Fallback**:
  - If Redis is running at `REDIS_URL`, data is stored in Redis.
  - If Redis server is not running, the system automatically uses a thread-safe in-memory cache with TTL. **No crashes, no downtime.**

---

## 6. Feature 5: Data Cleaning & Uzbekistan Data Hygiene (`DataCleaner`)

The system includes automated data hygiene services ([`data_cleaner.py`](file:///home/rahimbergan/batman/Khb/backend/app/services/data_cleaner.py)) specifically built for the Uzbek market:

1. **Uzbek Phone Number Normalization**:
   - Cleans inputs like `90 123 45 67`, `+998 (93) 123-45-67`, `8 94 123 45 67` into canonical `+998901234567` (or formatted `+998 90 123 45 67`).
   - Validates official 2-digit Uzbek operator codes (`90`, `91`, `93`, `94`, `95`, `97`, `98`, `99`, `33`, `88`, `77`, `71`, `78`).
2. **Canonical Region Mapping (14 Administrative Divisions)**:
   - Resolves aliases, Russian transliterations, Cyrillic inputs (`Ташкент`, `Самарканд`, `Бухара`, `Фергана`, `Каракалпакстан`) to official canonical names (e.g. `Toshkent shahri`, `Samarqand viloyati`, `Farg'ona viloyati`, `Qoraqalpog'iston Respublikasi`).
3. **Currency Sanitization**:
   - Parses complex text formats like `1,250,000 UZS`, `50 000 so'm`, `$450.50` into exact `Decimal` amounts, safely handling thousands separators and decimal points.
4. **Entity Cleaning**:
   - Clean customer and order payloads with `clean_customer_data()` and `clean_sale_order_payload()`.

---

## 7. Feature 6: Regional Sales Analysis Across Uzbekistan (`RegionalAnalyzer`)

Measures sales penetration and operational performance across all 14 official territories:

- **Metrics Calculated**: Revenue per region, gross margin %, order volume, units sold, market share %, and average order value (AOV).
- **API Endpoint**: `GET /api/v1/analysis/regional?from=YYYY-MM-DD&to=YYYY-MM-DD`.
- **Integrated Sales Report**: `POST /api/v1/analysis/sales` automatically includes a `regional_breakdown` field.
- **Telegram Bot Command**: Use `/hududlar` to see top regional rankings instantly.

---

## 8. Feature 7: Anti-Hallucination Guardrails & Native Uzbek Language

Designed specifically for Uzbek retail business owners:

1. **Strict Anti-Hallucination Policy**:
   - Grounded strictly in real verified records from the local Bito replica database (`2025-12-01` to `2026-01-31`).
   - When queried about unseeded or non-existent dates, the agent refuses to fabricate hypothetical numbers, explicitly stating missing database records.
2. **Native Uzbek Language Conversational Intelligence**:
   - Automatic language detection for Uzbek queries containing terms like `savdo`, `hisobot`, `bugun`, `kecha`, `viloyat`, `hudud`, `tushum`, `foyda`, `nega`.
   - Localized Uzbek response generation, comparative analysis, and Uzbek financial disclaimers (`UZ_FINANCIAL_DISCLAIMER`).
3. **Bilingual Telegram Commands**:
   - `/hisobot [SANA]` — Savdo va operatsiyalar hisoboti (Uzbek format).
   - `/hududlar` — Viloyatlar kesimidagi savdo tahlili.
   - `/obuna` — Avtomatik davriy hisobotlarga ulanish.
   - `/bekor` — Obunani bekor qilish.
   - `/yordam` — Botdan foydalanish yo'riqnomasi.

---

## 9. Quick Cheat Sheet & Testing Commands

| Purpose | Command |
|---|---|
| Run full pytest test suite (51 tests) | `.venv/bin/pytest tests` |
| Test single report cycle | `.venv/bin/python run.py run-cycle` |
| Start Telegram bot listener | `.venv/bin/python run.py telegram-bot` |
| Start periodic background worker | `.venv/bin/python run.py worker` |
| Start Flask API server | `.venv/bin/python run.py` |
| Build Frontend UI | `cd ../frontend && npm run build` |
| Start Frontend UI Dev Server | `cd ../frontend && npm run dev` |


