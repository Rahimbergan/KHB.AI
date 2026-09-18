from flask import jsonify
from backend.app.utils.logging import get_request_id, logger


class AppError(Exception):
    status_code = 500
    error_code = "INTERNAL_SERVER_ERROR"

    def __init__(self, message: str, status_code: int = None, details=None):
        super().__init__(message)
        self.message = message
        if status_code is not None:
            self.status_code = status_code
        self.details = details


class NotFoundError(AppError):
    status_code = 404
    error_code = "NOT_FOUND"


class ValidationError(AppError):
    status_code = 422
    error_code = "VALIDATION_ERROR"


class BadRequestError(AppError):
    status_code = 400
    error_code = "BAD_REQUEST"


class ConflictError(AppError):
    status_code = 409
    error_code = "CONFLICT"


def register_error_handlers(app):
    @app.errorhandler(AppError)
    def handle_app_error(err):
        req_id = get_request_id()
        logger.warning(f"AppError: {err.error_code} - {err.message} [details: {err.details}]")
        return (
            jsonify(
                {
                    "error": err.error_code,
                    "detail": err.message,
                    "details": err.details,
                    "request_id": req_id,
                }
            ),
            err.status_code,
        )

    @app.errorhandler(400)
    def handle_400(err):
        req_id = get_request_id()
        return (
            jsonify(
                {
                    "error": "BAD_REQUEST",
                    "detail": getattr(err, "description", "Bad request"),
                    "request_id": req_id,
                }
            ),
            400,
        )

    @app.errorhandler(404)
    def handle_404(err):
        req_id = get_request_id()
        return (
            jsonify(
                {
                    "error": "NOT_FOUND",
                    "detail": getattr(err, "description", "The requested resource was not found."),
                    "request_id": req_id,
                }
            ),
            404,
        )

    @app.errorhandler(413)
    def handle_413(err):
        req_id = get_request_id()
        return (
            jsonify(
                {
                    "error": "FILE_TOO_LARGE",
                    "detail": "Uploaded file exceeds maximum permitted size.",
                    "request_id": req_id,
                }
            ),
            413,
        )

    @app.errorhandler(Exception)
    def handle_generic_exception(err):
        req_id = get_request_id()
        logger.exception(f"Unhandled Exception: {str(err)}")
        
        # Do not expose stack traces in production
        is_dev = app.config.get("APP_ENV") == "development"
        detail = str(err) if is_dev else "An unexpected error occurred. Please try again later."

        return (
            jsonify(
                {
                    "error": "INTERNAL_SERVER_ERROR",
                    "detail": detail,
                    "request_id": req_id,
                }
            ),
            500,
        )

