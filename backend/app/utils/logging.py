import logging
import uuid
from flask import request, g, has_request_context

logger = logging.getLogger("khb_backend")

# Sensitive header keys to sanitize
SENSITIVE_HEADERS = {"authorization", "x-api-key", "api-key", "cookie", "token"}


def init_logging(app):
    level = logging.DEBUG if app.config.get("APP_ENV") == "development" else logging.INFO
    logging.basicConfig(
        level=level,
        format="%(asctime)s [%(levelname)s] [req_id=%(request_id)s] %(name)s: %(message)s",
    )

    # Custom log filter to inject request_id
    class RequestIdFilter(logging.Filter):
        def filter(self, record):
            if has_request_context():
                record.request_id = getattr(g, "request_id", "-")
            else:
                record.request_id = "-"
            return True

    for handler in logging.root.handlers:
        handler.addFilter(RequestIdFilter())

    @app.before_request
    def set_request_id():
        # Read from incoming header or generate UUID4
        req_id = request.headers.get("X-Request-ID")
        if not req_id:
            req_id = str(uuid.uuid4())
        g.request_id = req_id

    @app.after_request
    def add_request_id_header(response):
        if hasattr(g, "request_id"):
            response.headers["X-Request-ID"] = g.request_id
        return response


def get_request_id() -> str:
    return getattr(g, "request_id", str(uuid.uuid4()))


def sanitize_headers(headers: dict) -> dict:
    sanitized = {}
    for k, v in headers.items():
        if k.lower() in SENSITIVE_HEADERS:
            sanitized[k] = "[REDACTED]"
        else:
            sanitized[k] = v
    return sanitized
