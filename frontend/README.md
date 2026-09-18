# KHB AI — Frontend

Modern React + TypeScript + Vite CRM and Webchat workspace for the AI Business Operations Assistant.

---

## Features

- **Dashboard / CRM Overview**: Live KPIs (revenue, profit, gross margin, AOV), daily sales trend chart (Month to Date), top products breakdown, and operations alerts.
- **Sales Orders & Analytics**: Filterable, sortable sales table with status tags, plus one-click deep sales performance analysis comparing against previous periods and detecting anomalies.
- **Documents & Contract Intelligence**: Upload documents (PDF, CSV, XLSX, DOCX, TXT), preview metadata, download files, and run AI analysis extracting dates, amounts, obligations, deadlines, and liability risks with legal disclaimers.
- **AI Operations Webchat**: Full conversational workspace with chat history persistence in SQLite, suggested prompt chips, markdown rendering, inline visual artifacts (charts, tables, metric cards, legal extracts), and source tracking.

---

## Quick Start

```bash
cd frontend
npm install
npm run dev
```

The application will start on `http://localhost:5173`. Ensure the backend server is running on `http://localhost:5000`.

### Production Build

```bash
npm run build
npm run preview
```

