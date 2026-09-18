from datetime import date, datetime, time, timedelta, timezone
from typing import Tuple, Optional
from backend.app.utils.errors import ValidationError


def parse_date(date_str: str) -> date:
    """Parses a YYYY-MM-DD string into a date object."""
    try:
        return datetime.strptime(date_str.strip(), "%Y-%m-%d").date()
    except (ValueError, AttributeError) as exc:
        raise ValidationError(f"Invalid date format '{date_str}'. Expected YYYY-MM-DD.") from exc


def parse_datetime(dt_str: str) -> datetime:
    """Parses an ISO format or YYYY-MM-DD string into a timezone-aware or naive datetime."""
    try:
        return datetime.fromisoformat(dt_str.strip())
    except Exception:
        d = parse_date(dt_str)
        return datetime.combine(d, time.min)


def format_iso(dt: Optional[datetime]) -> Optional[str]:
    if not dt:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc).isoformat()
    return dt.isoformat()


def get_date_bounds(d: date) -> Tuple[datetime, datetime]:
    """Returns datetime range for a full day (00:00:00 to 23:59:59.999999)."""
    start = datetime.combine(d, time.min)
    end = datetime.combine(d, time.max)
    return start, end


def get_previous_period(start_date: date, end_date: date) -> Tuple[date, date]:
    """
    Computes an equivalent preceding period of the exact same number of days.
    e.g., if period is 2026-01-01 to 2026-01-31 (31 days),
    preceding period is 31 days immediately before 2026-01-01: 2025-12-01 to 2025-12-31.
    """
    num_days = (end_date - start_date).days + 1
    prev_end = start_date - timedelta(days=1)
    prev_start = prev_end - timedelta(days=num_days - 1)
    return prev_start, prev_end


def today_date() -> date:
    return date.today()

