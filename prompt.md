# MVP Product Build Prompt

You are a senior full-stack engineer. Build a runnable MVP for an AI business operations assistant for small businesses.

The product combines:

1. A local Bito-compatible backend replica for business data.
2. A CRM-style web application for business owners.
3. An AI webchat where users ask questions and request actions.
4. Claude-style artifacts: generated tables, charts, KPI cards, reports, and interactive visualizations linked to the conversation and backend data.

Do not implement or depend on the real Bito API. The hackathon demo must work entirely locally with seeded data.

## Product Goal

Help small businesses that cannot afford dedicated accountants, economists, lawyers, or data analysts.

The user must be able to:

- See daily sales reports.
- Analyze sales and business performance.
- Ask questions about the business in natural language.
- Upload spreadsheets, receipts, invoices, contracts, and other files.
- Ask the system to summarize or extract information from uploaded files.
- Ask for analysis of juridical/legal documents.
- See calculations, assumptions, sources, charts, and recommendations.
- Return to previous conversations and reports.

Clearly state that legal, tax, and accounting outputs are informational and not certified professional advice.

## Architecture

Build two decoupled applications in one repository:

```text
backend/   Python Flask REST API and AI orchestration
frontend/  React TypeScript CRM and webchat application
```

The frontend communicates with the backend only through HTTP JSON APIs. Do not put business logic, financial calculations, or Claude API keys in the frontend.

## Backend Technology

- Python 3.11+
- Flask
- Flask-CORS
- SQLAlchemy with SQLite
- Pydantic for request and response validation
- Anthropic Python SDK for Claude
- python-dotenv
- pytest
- Gunicorn-compatible entry point
- Type hints throughout

## Frontend Technology

- React
- TypeScript
- Vite
- React Router
- TanStack Query for server state
- Recharts or another maintained chart library
- Tailwind CSS or a similarly maintainable styling system
- lucide-react for icons
- Vitest and React Testing Library for focused tests

Use a restrained CRM/workspace visual language: dense but readable information, clear navigation, strong table and chart hierarchy, responsive layout, accessible controls, and complete loading, empty, and error states. The main screen must be the working dashboard and chat workspace, not a marketing landing page.

## Local Bito-Compatible Replica

Create a local module named `local_bito` or an equivalent service that exposes only the minimum endpoints required by this MVP. It should resemble the useful shape of the provided Bito OpenAPI document, but it must not call the real Bito service.

Use deterministic SQLite seed data for one demo business. Include products, product categories, sales orders, sale order items, expenses, purchases, inventory or stock levels, customers, uploaded files, and daily report data.

Implement these backend endpoints:

### Local Bito data endpoints

- `GET /api/v1/products`
- `GET /api/v1/products/<product_id>`
- `GET /api/v1/sales`
- `GET /api/v1/sales/<sale_id>`
- `POST /api/v1/sales`
- `GET /api/v1/expenses`
- `GET /api/v1/inventory`
- `GET /api/v1/customers`

All list endpoints must support `from`, `to`, `page`, `page_size`, and `search` where relevant.

Return a consistent envelope:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "page_size": 50,
    "total": 0,
    "pages": 0
  }
}
```

### Reports and analysis endpoints

- `GET /api/v1/reports/daily-sales?date=YYYY-MM-DD`
- `GET /api/v1/reports/daily-sales?from=YYYY-MM-DD&to=YYYY-MM-DD`
- `POST /api/v1/analysis/sales`
- `GET /api/v1/analysis/sales/<analysis_id>`

Sales analysis must calculate total revenue, number of orders, units sold, average order value, gross profit, gross margin, top products, top categories, sales by day, sales by hour if available, refunds or cancelled orders, comparison with the previous equivalent period, and unusual changes or anomalies.

### Chat endpoints

- `POST /api/v1/conversations`
- `GET /api/v1/conversations`
- `GET /api/v1/conversations/<conversation_id>`
- `POST /api/v1/conversations/<conversation_id>/messages`
- `DELETE /api/v1/conversations/<conversation_id>`

The message endpoint must accept:

```json
{
  "content": "Why were sales lower yesterday?",
  "attachment_ids": [],
  "context": {
    "date": "2026-01-31",
    "dashboard_filters": {}
  }
}
```

It must return a structured assistant message:

```json
{
  "message": {
    "id": "uuid",
    "role": "assistant",
    "content": "string",
    "created_at": "ISO-8601"
  },
  "artifacts": [],
  "sources": [],
  "usage": {
    "used_claude": false
  }
}
```

### Files and documents

Implement:

- `POST /api/v1/files`
- `GET /api/v1/files`
- `GET /api/v1/files/<file_id>`
- `GET /api/v1/files/<file_id>/download`
- `POST /api/v1/files/<file_id>/analyze`

Support at minimum PDF, TXT, CSV, and XLSX if practical; support DOCX if practical. Store files locally under configurable `UPLOAD_DIR` and metadata in SQLite. Validate size and extension, use safe filenames, prevent path traversal, and never execute uploads. Extract text or tabular data where possible.

File analysis must support requests such as summarizing a document, extracting dates, parties, amounts, obligations and deadlines, finding risks or missing information, comparing two documents, and explaining a document in simple language.

For juridical-document analysis, always include:

```text
This is an informational document analysis, not legal advice. A qualified lawyer should review important decisions.
```

### Artifacts endpoint

- `GET /api/v1/artifacts/<artifact_id>`

Persist generated artifacts so the frontend can render them after refresh.

## Artifact Contract

The AI may return artifacts alongside text. Every artifact must be validated and safely rendered by the frontend.

Use this shape:

```json
{
  "id": "uuid",
  "type": "metric|table|bar_chart|line_chart|pie_chart|markdown|report|document_extract",
  "title": "Daily sales",
  "description": "Sales for the selected period",
  "data": {},
  "config": {},
  "source_ids": [],
  "created_at": "ISO-8601"
}
```

Supported artifact examples:

```json
{
  "type": "metric",
  "data": {
    "value": 1250000,
    "formatted_value": "1,250,000 UZS",
    "change_percent": 12.4,
    "trend": "up"
  }
}
```

```json
{
  "type": "line_chart",
  "data": {
    "x_key": "date",
    "series": [
      {"key": "revenue", "label": "Revenue", "color": "#2563eb"}
    ],
    "rows": []
  }
}
```

```json
{
  "type": "table",
  "data": {
    "columns": ["product", "units", "revenue"],
    "rows": []
  }
}
```

The frontend must render artifacts as real visual components, not raw JSON. Include loading, empty, invalid-artifact, and error states. Provide expand, download, or save actions where practical.

## AI Agent Pipeline

Implement separate services:

1. **Data Analyst Agent**: reads local business data, uploaded tables, and user context; normalizes data; detects missing values, duplicates, anomalies, and date issues.
2. **Accountant/Economist Agent**: uses deterministic local calculations first; interprets revenue, expenses, margins, cash flow, break-even, and trends; labels assumptions and missing information.
3. **Document Analyst Agent**: extracts and summarizes uploaded documents; identifies parties, dates, amounts, duties, deadlines, risks, and unanswered questions; does not present legal conclusions as facts.
4. **Main Advisor Agent**: combines relevant results and the user request, answers directly, produces structured artifacts when useful, and provides concrete next actions.

Use Claude through one backend client service. Read `ANTHROPIC_API_KEY` from the environment, use a configurable model, set timeouts, handle API failures, request JSON-compatible output, and validate structured results with Pydantic.

If Claude is unavailable, the system must still serve all local endpoints, calculate daily reports and sales analysis deterministically, answer common questions using deterministic templates, generate local chart/table artifacts, and return `used_claude: false`.

Never send API keys or unnecessary sensitive data to Claude. Do not log secrets or full private documents.

Every financial report must include:

```text
This report is an informational business estimate, not legal, tax, or certified accounting advice.
```

## Required Backend Structure

```text
backend/
  app/
    __init__.py
    config.py
    extensions.py
    models.py
    routes/
      health.py
      bito_replica.py
      reports.py
      analysis.py
      conversations.py
      files.py
      artifacts.py
    services/
      local_bito.py
      financial_calculator.py
      sales_analyzer.py
      document_extractor.py
      document_analyzer.py
      claude_client.py
      agent_orchestrator.py
      artifact_service.py
    schemas/
      api.py
      sales.py
      chat.py
      files.py
      artifacts.py
    utils/
      errors.py
      dates.py
      logging.py
  tests/
  run.py
  requirements.txt
  .env.example
  README.md
  Dockerfile
  pytest.ini
```

## Required Frontend Screens

Build a decoupled React application in `frontend/` with these screens:

### App shell

Include responsive sidebar navigation, current business context, date-range control, global search or command entry where practical, connection and AI status, and a user-menu placeholder.

### Dashboard / CRM overview

Show today's revenue, order count, average order value, gross margin, comparison with the previous period, sales trend chart, top products table, recent activity, alerts, and recommended actions. Load all values from the backend; do not hardcode them in components.

### Sales screen

Include a filterable and sortable sales table, daily sales chart, product/category performance, status and refund indicators, a button to run sales analysis, and analysis results with generated artifacts.

### Documents screen

Include drag-and-drop or file-picker upload, file list with type/size/status/date, document metadata preview, analyze-document action, extracted fields, summary, risks, and deadlines.

### Webchat screen

Make this a serious AI workspace rather than a basic messaging demo. Include a conversation list, message history, composer with attachment upload, suggested prompts, loading state, markdown rendering, inline artifact cards beside relevant messages, source references, timestamps, retry and error states, and conversation persistence after refresh.

Suggested prompts:

- `Give me today's sales report.`
- `Why did sales fall compared with yesterday?`
- `Show my top five products this month.`
- `Find unusual expenses in the selected period.`
- `Summarize this contract and list important deadlines.`
- `What should the owner do next week?`

### Artifact experience

Render metric cards, tables, charts, markdown reports, and document extracts from the backend artifact contract. Make artifacts responsive, clear, connected to their source message, and exportable or saveable where practical.

## Frontend API Layer

Create a typed API client with separate modules for dashboard/reports, sales, conversations, files, and artifacts. Use TanStack Query for fetching, caching, invalidation, and loading states. Put the API base URL in `VITE_API_BASE_URL`; do not hardcode localhost in components.

## Data Models

Use Pydantic models on the backend and matching TypeScript types on the frontend for product, sale, sale item, expense, inventory item, daily report, sales analysis, conversation, message, uploaded file, document analysis, artifact, and API error.

Use `Decimal` for backend money calculations and serialize money consistently as numeric values plus currency metadata.

## Security and Reliability

- Validate request bodies, query parameters, file names, file sizes, and file types.
- Add global JSON error handling.
- Do not expose stack traces in production mode.
- Add request IDs to logs.
- Never log API keys, authorization headers, or raw sensitive documents.
- Configure CORS from an environment variable.
- Use safe local file names and prevent path traversal.
- Keep legal and financial disclaimers visible in relevant outputs.
- No authentication or multi-tenant billing is required for this hackathon MVP.

## Environment Variables

Backend `.env.example`:

```env
APP_ENV=development
DATABASE_URL=sqlite:///app.db
UPLOAD_DIR=./uploads
ANTHROPIC_API_KEY=
CLAUDE_MODEL=claude-sonnet-4-20250514
CORS_ORIGINS=http://localhost:5173
```

Frontend `.env.example`:

```env
VITE_API_BASE_URL=http://localhost:5000
```

## Tests and Documentation

Create backend unit and API tests for calculations, seeded local Bito endpoints, daily reports, sales analysis, file validation, Claude fallback, health, chat, files, and artifacts. Create frontend tests for API behavior, dashboard loading, chat rendering, upload state, and artifact rendering. Also create backend/frontend READMEs, Docker configuration if practical, deterministic seed data, and curl examples.

The backend README must explain how to create a virtual environment, install dependencies, configure `.env`, run without Bito or Claude, enable Claude later, run tests, and call the important endpoints.

## Acceptance Criteria

The complete demo must work without Bito access and without `ANTHROPIC_API_KEY`.

Backend:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
pytest
python run.py
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

These operations must work locally:

```bash
curl http://localhost:5000/health
curl 'http://localhost:5000/api/v1/reports/daily-sales?date=2026-01-31'
curl -X POST http://localhost:5000/api/v1/analysis/sales \
  -H 'Content-Type: application/json' \
  -d '{"from":"2026-01-01","to":"2026-01-31"}'
curl -X POST http://localhost:5000/api/v1/conversations/demo/messages \
  -H 'Content-Type: application/json' \
  -d '{"content":"Show me my top products this month.","attachment_ids":[]}'
```

The frontend must be able to open the dashboard, show daily sales and KPI data, show sales analysis charts, upload a document, open the webchat, send a question, display a response and at least one generated artifact, and display deterministic results when Claude is not configured.

## Implementation Rules

- Start by creating the backend and frontend structure.
- Seed realistic demo data.
- Implement deterministic functionality before Claude integration.
- Do not call or depend on the real Bito API.
- Do not invent unsupported external integrations.
- Keep backend and frontend independently runnable.
- Run backend and frontend tests and fix failures before finishing.
- Run a production frontend build and verify the backend imports successfully.
- At the end, report created files, run commands, test results, available endpoints, and remaining limitations.
