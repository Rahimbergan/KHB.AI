from flask import Blueprint, jsonify
from backend.app.extensions import db
from backend.app.services.claude_client import ClaudeClient

health_bp = Blueprint("health", __name__)


@health_bp.route("/health", methods=["GET"])
def health_check():
    db_status = "connected"
    try:
        db.session.execute(db.text("SELECT 1"))
    except Exception as exc:
        db_status = f"error: {str(exc)}"

    claude = ClaudeClient()
    claude_info = {
        "available": claude.is_available(),
        "model": claude.model,
    }

    return (
        jsonify(
            {
                "status": "ok" if db_status == "connected" else "degraded",
                "version": "1.0.0",
                "service": "AI Business Operations Assistant API",
                "database": db_status,
                "claude": claude_info,
            }
        ),
        200 if db_status == "connected" else 503,
    )

