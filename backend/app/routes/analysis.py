import json
import uuid
from datetime import date
from flask import Blueprint, request, jsonify
from backend.app.extensions import db
from backend.app.models import SalesAnalysisRecord
from backend.app.services.sales_analyzer import SalesAnalyzer
from backend.app.services.regional_analyzer import RegionalAnalyzer
from backend.app.utils.dates import parse_date
from backend.app.utils.errors import NotFoundError, ValidationError

analysis_bp = Blueprint("analysis", __name__, url_prefix="/api/v1/analysis")


@analysis_bp.route("/sales", methods=["POST"])
def run_sales_analysis():
    body = request.get_json(silent=True) or {}
    from_str = body.get("from") or body.get("from_date")
    to_str = body.get("to") or body.get("to_date")

    if not from_str or not to_str:
        raise ValidationError("Both 'from' and 'to' date parameters are required in format YYYY-MM-DD.")

    start_date = parse_date(from_str)
    end_date = parse_date(to_str)

    if start_date > end_date:
        raise ValidationError("'from' date cannot be after 'to' date.")

    result = SalesAnalyzer.analyze_period(start_date, end_date)

    # Persist analysis record
    rec = SalesAnalysisRecord(
        id=str(uuid.uuid4()),
        from_date=start_date,
        to_date=end_date,
        result_json=json.dumps(result),
    )
    db.session.add(rec)
    db.session.commit()

    return jsonify(rec.to_dict()), 201


@analysis_bp.route("/sales/<analysis_id>", methods=["GET"])
def get_sales_analysis(analysis_id: str):
    rec = db.session.get(SalesAnalysisRecord, analysis_id)
    if not rec:
        raise NotFoundError(f"Sales analysis with id '{analysis_id}' not found.")
    return jsonify(rec.to_dict()), 200


@analysis_bp.route("/regional", methods=["GET"])
def get_regional_analysis():
    """
    Returns regional sales breakdown across Uzbekistan's 14 administrative divisions.
    Accepts query parameters: from / from_date and to / to_date.
    """
    from_str = request.args.get("from") or request.args.get("from_date") or "2026-01-01"
    to_str = request.args.get("to") or request.args.get("to_date") or "2026-01-31"

    start_date = parse_date(from_str)
    end_date = parse_date(to_str)

    if start_date > end_date:
        raise ValidationError("'from' date cannot be after 'to' date.")

    res = RegionalAnalyzer.analyze_regions(start_date, end_date)
    return jsonify(res), 200
