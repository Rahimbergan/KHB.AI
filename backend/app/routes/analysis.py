import json
import uuid
from flask import Blueprint, request, jsonify
from backend.app.extensions import db
from backend.app.models import SalesAnalysisRecord
from backend.app.services.sales_analyzer import SalesAnalyzer
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
