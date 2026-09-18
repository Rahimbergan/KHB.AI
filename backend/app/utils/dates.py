from datetime import datetime, date, timedelta
from typing import Tuple, Optional

def parse_date(date_str: Optional[str]) -> Optional[date]:
    if not date_str:
        return None
    try:
        return datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        return None

def get_date_range(from_str: Optional[str], to_str: Optional[str]) -> Tuple[date, date]:
    today = date.today()
    start_date = parse_date(from_str)
    end_date = parse_date(to_str)

    if not end_date:
        end_date = today
    if not start_date:
        start_date = end_date - timedelta(days=30)
    
    return start_date, end_date

def get_previous_period(start: date, end: date) -> Tuple[date, date]:
    duration = (end - start).days + 1
    prev_end = start - timedelta(days=1)
    prev_start = prev_end - timedelta(days=duration - 1)
    return prev_start, prev_end
