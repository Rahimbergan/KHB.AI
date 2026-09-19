import os
import sys
from pathlib import Path

# Add repo root and backend directory to sys.path so imports work in all execution contexts
current_dir = Path(__file__).resolve().parent
repo_root = current_dir.parent

if str(repo_root) not in sys.path:
    sys.path.insert(0, str(repo_root))
if str(current_dir) not in sys.path:
    sys.path.insert(0, str(current_dir))

import click
from backend.app import create_app
from backend.app.config import Config
from backend.app.services.local_bito import LocalBitoService
from backend.app.services.worker import ReportWorker
from backend.app.services.telegram_bot import TelegramBotService

app = create_app()


def do_seed():
    with app.app_context():
        LocalBitoService.seed_demo_data()
        print("Demo data seeded successfully.")


def do_worker():
    period_str = os.getenv("WORKER_PERIOD") or Config.WORKER_PERIOD or "1h"
    print(f"Starting KHB Scheduled Report Worker (Cycle: {period_str})...")
    ReportWorker.start_worker_loop(app)


def do_run_cycle(target_date=None):
    print(f"Executing immediate report cycle (date: {target_date or '2026-01-31'})...")
    res = ReportWorker.run_single_cycle(app, target_date_str=target_date)
    print("Cycle completed successfully:")
    print(res)


def do_telegram_bot():
    print("Starting KHB Interactive Telegram Bot Service...")
    TelegramBotService.run_polling(app)


@app.cli.command("seed")
def seed_command():
    """Seeds deterministic demo data for KHB Smart Retail."""
    do_seed()


@app.cli.command("worker")
def worker_command():
    """Runs the scheduled report worker loop based on WORKER_PERIOD."""
    do_worker()


@app.cli.command("run-cycle")
@click.option("--date", default=None, help="Target date YYYY-MM-DD for operations report")
def run_cycle_command(date):
    """Executes a single report cycle, preloads Redis, and dispatches to users."""
    do_run_cycle(date)


@app.cli.command("telegram-bot")
def telegram_bot_command():
    """Starts the interactive Telegram bot polling service."""
    do_telegram_bot()


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] in ("worker", "telegram-bot", "run-cycle", "seed"):
        # Allow running directly via python run.py worker / telegram-bot / run-cycle / seed
        cmd = sys.argv[1]
        if cmd == "worker":
            do_worker()
        elif cmd == "telegram-bot":
            do_telegram_bot()
        elif cmd == "run-cycle":
            target_d = None
            if len(sys.argv) > 2:
                # support both --date=... or value
                val = sys.argv[2]
                target_d = val.replace("--date=", "") if val.startswith("--date=") else val
            do_run_cycle(target_d)
        elif cmd == "seed":
            do_seed()
        sys.exit(0)

    # Launch background worker if configured
    if Config.WORKER_AUTORUN or os.getenv("WORKER_AUTORUN", "").lower() in ("true", "1"):
        print("WORKER_AUTORUN=true detected; launching background report worker thread...")
        ReportWorker.start_background_worker(app)

    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("APP_ENV") == "development"
    print(f"Starting KHB AI Operations Assistant Backend on port {port}...")
    app.run(host="0.0.0.0", port=port, debug=debug)
