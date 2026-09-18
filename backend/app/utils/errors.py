from flask import jsonify

class APIError(Exception):
    def __init__(self, message: str, status_code: int = 400, details: dict = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.details = details or {}

    def to_dict(self):
        return {
            "error": {
                "message": self.message,
                "status_code": self.status_code,
                "details": self.details,
            }
        }

def handle_api_error(error: APIError):
    response = jsonify(error.to_dict())
    response.status_code = error.status_code
    return response

def handle_500_error(error):
    response = jsonify({
        "error": {
            "message": "Internal server error occurred",
            "status_code": 500,
            "details": str(error) if False else {},
        }
    })
    response.status_code = 500
    return response
