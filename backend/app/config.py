import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent

# Load .env file from backend root if present
load_dotenv(BASE_DIR / ".env")


class Config:
    APP_ENV = os.getenv("APP_ENV", "development")
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-insecure-secret-key-replace-in-prod")
    
    # Database
    db_url = os.getenv("DATABASE_URL", "sqlite:///app.db")
    if db_url.startswith("sqlite:///") and not db_url.startswith("sqlite:////"):
        # Ensure relative sqlite path resolves inside backend/instance/ or backend/
        rel_path = db_url.replace("sqlite:///", "")
        if not os.path.isabs(rel_path):
            instance_dir = BASE_DIR / "instance"
            instance_dir.mkdir(parents=True, exist_ok=True)
            SQLALCHEMY_DATABASE_URI = f"sqlite:///{instance_dir / rel_path}"
        else:
            SQLALCHEMY_DATABASE_URI = db_url
    else:
        SQLALCHEMY_DATABASE_URI = db_url
        
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # File storage
    upload_dir_str = os.getenv("UPLOAD_DIR", "./uploads")
    if not os.path.isabs(upload_dir_str):
        UPLOAD_DIR = str((BASE_DIR / upload_dir_str).resolve())
    else:
        UPLOAD_DIR = upload_dir_str
    Path(UPLOAD_DIR).mkdir(parents=True, exist_ok=True)

    MAX_CONTENT_LENGTH = 25 * 1024 * 1024  # 25 MB max upload
    ALLOWED_EXTENSIONS = {"pdf", "txt", "csv", "xlsx", "xls", "docx"}
    
    # Anthropic Claude
    ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "").strip()
    CLAUDE_MODEL = os.getenv("CLAUDE_MODEL", "claude-sonnet-4-20250514")
    CLAUDE_TIMEOUT_SECONDS = int(os.getenv("CLAUDE_TIMEOUT_SECONDS", "30"))

    # Gmail SMTP / Email Settings
    SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com").strip()
    SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
    GMAIL_USER = (os.getenv("GMAIL_USER") or os.getenv("SMTP_USER") or "").strip()
    GMAIL_APP_PASSWORD = (os.getenv("GMAIL_APP_PASSWORD") or os.getenv("SMTP_PASSWORD") or "").strip()
    SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "true").lower() in ("true", "1", "yes")
    EMAIL_FROM = (os.getenv("EMAIL_FROM") or GMAIL_USER or "reports@khb-retail.uz").strip()

    # Telegram Bot
    TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
    tg_chats_raw = os.getenv("TELEGRAM_REPORT_CHAT_IDS", "")
    TELEGRAM_REPORT_CHAT_IDS = [c.strip() for c in tg_chats_raw.split(",") if c.strip()]

    # Periodic Worker
    # Format e.g. "5m", "1h", "30s", "2h"
    WORKER_PERIOD = os.getenv("WORKER_PERIOD", "1h").strip()
    worker_emails_raw = os.getenv("WORKER_EMAIL_RECIPIENTS", "")
    WORKER_EMAIL_RECIPIENTS = [e.strip() for e in worker_emails_raw.split(",") if e.strip()]
    WORKER_AUTORUN = os.getenv("WORKER_AUTORUN", "false").lower() in ("true", "1", "yes")

    # Redis Cache Settings
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0").strip()
    REDIS_HOST = os.getenv("REDIS_HOST", "localhost").strip()
    REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
    REDIS_DB = int(os.getenv("REDIS_DB", "0"))
    REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", None)

    # CORS
    cors_raw = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000")
    CORS_ORIGINS = [orig.strip() for orig in cors_raw.split(",") if orig.strip()]
    
    # Business defaults
    DEFAULT_CURRENCY = "UZS"
    DEFAULT_BUSINESS_NAME = "KHB Smart Retail"


class TestConfig(Config):
    TESTING = True
    APP_ENV = "testing"
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    UPLOAD_DIR = "/tmp/khb_test_uploads"
    # Tests must exercise the deterministic path regardless of developer credentials.
    ANTHROPIC_API_KEY = ""
    GMAIL_USER = ""
    GMAIL_APP_PASSWORD = ""
    TELEGRAM_BOT_TOKEN = ""
    WORKER_PERIOD = "5m"
