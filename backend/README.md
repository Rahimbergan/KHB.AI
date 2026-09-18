# AI Business Operations Assistant — Backend

Production-ready, local Bito-compatible backend and multi-agent AI orchestration pipeline designed for small business operations. Built with Python, Flask, SQLAlchemy, SQLite, Pydantic, and Anthropic Claude SDK with a 100% offline deterministic fallback engine.

---

## Features

- **Local Bito Replica API**: High-fidelity local replica of the Bito 2.0 Integration API for products, sales orders, expenses, inventory, and customers with deterministic seed data.
- **Precision Financial Calculator**: `Decimal`-based monetary calculations for gross profit, gross margin, average order value (AOV), comparative period deltas, and disclaimers.
- **Comprehensive Sales Analyzer**: Period sales analytics, top products, top categories, day/hour breakdowns, refund/cancellation tracking, and automated anomaly detection.
- **Document Extraction & Analysis Engine**: Multi-format document parser (PDF, CSV, XLSX, DOCX, TXT) extracting text, structured tables, parties, monetary terms, obligations, deadlines, and risk factors with legal disclaimers.
- **Multi-Agent Pipeline**:
  - **Data Analyst Agent**: Inspects business data, normalizes parameters, flags anomalies and data gaps.
  - **Accountant/Economist Agent**: Evaluates performance, margins, cash flow indicators, and labels assumptions.
  - **Document Analyst Agent**: Parses attached files, contracts, and receipts.
  - **Main Advisor Agent**: Combines outputs into actionable business advice and generates Claude-style visual artifacts.
- **Claude Integration & Offline Fallback**:
  - Fully functional without an Anthropic API key (`used_claude: false`), utilizing deterministic intelligent business templates.
  - Automatically enhances analysis and answers when `ANTHROPIC_API_KEY` is provided (`used_claude: true`).
- **Claude-Style Visual Artifacts**: Standardized contract emitting metric cards, line charts, bar charts, tables, reports, and legal document extracts.

---

## Quick Start

### 1. Prerequisites
- Python 3.11+
- Virtual environment support (`python3 -m venv`)

### 2. Environment Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

### 3. Run Automated Tests

```bash
pytest
```

All 26 tests across calculations, Bito replica, reports, sales analysis, file extraction, chat pipeline, and offline fallbacks will run against an in-memory SQLite database.

### 4. Start the Application

```bash
python run.py
```

The application will bind to `http://0.0.0.0:5000` and automatically seed realistic demo data for **"KHB Smart Retail"** (Tashkent, Uzbekistan, currency UZS) spanning December 2025 through January 31, 2026.

Alternatively, run with Gunicorn in production:

```bash
gunicorn --bind 0.0.0.0:5000 --workers 2 run:app
```

---

## Configuration (`.env`)

| Variable | Default | Description |
|---|---|---|
| `APP_ENV` | `development` | Environment (`development`, `testing`, `production`) |
| `DATABASE_URL` | `sqlite:///app.db` | SQLAlchemy SQLite database path |
| `UPLOAD_DIR` | `./uploads` | Local directory for document uploads |
| `ANTHROPIC_API_KEY` | *(empty)* | Optional Anthropic API key for Claude |
| `CLAUDE_MODEL` | `claude-sonnet-4-20250514` | Claude model name |
| `CLAUDE_TIMEOUT_SECONDS`| `30` | Claude API timeout in seconds |
| `CORS_ORIGINS` | `http://localhost:5173` | Allowed CORS origins (comma-separated) |
| `SECRET_KEY` | *(random dev key)* | Secret key for session security |

---

## Acceptance Criteria Operations

You can test the server using standard `curl` commands:

### 1. Health Check
```bash
curl http://localhost:5000/health
```
Response:
```json
{
  "claude": {
    "available": false,
    "model": "claude-sonnet-4-20250514"
  },
  "database": "connected",
  "service": "AI Business Operations Assistant API",
  "status": "ok",
  "version": "1.0.0"
}
```

### 2. Daily Sales Report (2026-01-31)
```bash
curl 'http://localhost:5000/api/v1/reports/daily-sales?date=2026-01-31'
```
Response includes revenue, cost, profit, margin percentage, order count, top products, payment breakdown, and informational disclaimer:
> *"This report is an informational business estimate, not legal, tax, or certified accounting advice."*

### 3. Sales Analysis for January 2026
```bash
curl -X POST http://localhost:5000/api/v1/analysis/sales \
  -H 'Content-Type: application/json' \
  -d '{"from":"2026-01-01","to":"2026-01-31"}'
```
Returns comprehensive metrics, period comparison against December 2025, and anomaly detection.

### 4. Webchat Message & Artifact Generation
```bash
curl -X POST http://localhost:5000/api/v1/conversations/demo/messages \
  -H 'Content-Type: application/json' \
  -d '{"content":"Show me my top products this month.","attachment_ids":[]}'
```
Returns structured assistant message, bar chart artifact, table breakdown artifact, sources, and `used_claude: false`.

### 5. Other Sample Chat Inquiries
```bash
# Inquire about falling sales / period comparison
curl -X POST http://localhost:5000/api/v1/conversations/demo/messages \
  -H 'Content-Type: application/json' \
  -d '{"content":"Why did sales fall compared with yesterday?","context":{"date":"2026-01-31"}}'

# Inquire about unusual operating expenses
curl -X POST http://localhost:5000/api/v1/conversations/demo/messages \
  -H 'Content-Type: application/json' \
  -d '{"content":"Find unusual expenses in the selected period.","context":{"date":"2026-01-31"}}'

# Inquire about contract deadlines and obligations
curl -X POST http://localhost:5000/api/v1/conversations/demo/messages \
  -H 'Content-Type: application/json' \
  -d '{"content":"Summarize this contract and list important deadlines."}'

# Request owner recommendations
curl -X POST http://localhost:5000/api/v1/conversations/demo/messages \
  -H 'Content-Type: application/json' \
  -d '{"content":"What should the owner do next week?"}'
```

---

## API Reference

### Local Bito Replica Endpoints
- `GET /api/v1/products`: List products (supports `page`, `page_size`, `search`, `from`, `to`)
- `GET /api/v1/products/<product_id>`: Product detail
- `GET /api/v1/sales`: List sales orders (supports `page`, `page_size`, `search`, `from`, `to`)
- `GET /api/v1/sales/<sale_id>`: Sale order detail with items
- `POST /api/v1/sales`: Create new sales order (updates stock)
- `GET /api/v1/expenses`: List expenses (supports `page`, `page_size`, `search`, `from`, `to`)
- `GET /api/v1/inventory`: List inventory items with low-stock alerts
- `GET /api/v1/customers`: List customers ranked by total spend

### Reports & Analytics
- `GET /api/v1/reports/daily-sales?date=YYYY-MM-DD`: Single-day sales report
- `GET /api/v1/reports/daily-sales?from=YYYY-MM-DD&to=YYYY-MM-DD`: Date range report
- `POST /api/v1/analysis/sales`: Compute period sales analysis
- `GET /api/v1/analysis/sales/<analysis_id>`: Retrieve stored analysis

### Conversations & Chat
- `POST /api/v1/conversations`: Create conversation
- `GET /api/v1/conversations`: List conversations
- `GET /api/v1/conversations/<conversation_id>`: Conversation history and messages
- `DELETE /api/v1/conversations/<conversation_id>`: Delete conversation
- `POST /api/v1/conversations/<conversation_id>/messages`: Send message, runs agent pipeline

### Files & Documents
- `POST /api/v1/files`: Upload file (multipart/form-data key `file`)
- `GET /api/v1/files`: List uploaded documents
- `GET /api/v1/files/<file_id>`: Document metadata and text preview
- `GET /api/v1/files/<file_id>/download`: Download file
- `POST /api/v1/files/<file_id>/analyze`: Analyze document with legal disclaimer

### Visual Artifacts
- `GET /api/v1/artifacts/<artifact_id>`: Retrieve artifact by ID

---

## Deterministic Seed Data

The database automatically seeds on first launch with:
- **Business**: KHB Smart Retail (Retail Electronics, Tashkent)
- **Products**: 18 items across 4 categories (Smartphones, Laptops, Audio, Smart Home)
- **Sales Orders**: 280+ completed/refunded orders spanning Dec 1, 2025 – Jan 31, 2026
- **Expenses**: Monthly lease, payroll, utilities, and marketing
- **Documents**: Pre-seeded commercial lease agreement in `instance/` / `uploads/`
- **Conversation**: Pre-seeded `demo` conversation

