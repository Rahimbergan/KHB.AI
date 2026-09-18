import logging
import uuid
from flask import g, request

def setup_logger():
    logging.basicConfig(
        level=logging.INFO,
        format="[%(asctime)s] [%(levelname)s] [ReqID: %(request_id)s] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

class RequestIdFilter(logging.Filter):
    def filter(self, record):
        record.request_id = getattr(g, "request_id", "system")
        return True

logger = logging.getLogger("khb_ai")
logger.addFilter(RequestIdFilter())
