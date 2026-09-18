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

from backend.app import create_app
from backend.app.services.local_bito import LocalBitoService

app = create_app()


@app.cli.command("seed")
def seed_command():
    """Seeds deterministic demo data for KHB Smart Retail."""
    with app.app_context():
        LocalBitoService.seed_demo_data()
        print("Demo data seeded successfully.")


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("APP_ENV") == "development"
    print(f"Starting KHB AI Operations Assistant Backend on port {port}...")
    app.run(host="0.0.0.0", port=port, debug=debug)

