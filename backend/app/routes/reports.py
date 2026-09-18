from datetime import date
from flask import Blueprint, request, jsonify
from backend.app.services.sales_analyzer import SalesAnalyzer
from backend.app.services.financial_calculator import FinancialCalculator, FINANCIAL_DISCLAIMER
from backend.app.utils.dates import parse_date, today_date
from backend.app.models import Expense
from backend.app.utils.errors import ValidationError

reports_bp = Blueprint("reports", __name__, url_prefix="/api/v1/reports")


@reports_bp.route("/daily-sales", methods=["GET"])
def get_daily_sales():
    date_arg = request.args.get("date")
    from_arg = request.args.get("from")
    to_arg = request.args.get("to")

    # If single date provided or default
    if date_arg:
        target_date = parse_date(date_arg)
        start_date = target_date
        end_date = target_date
    elif from_arg and to_arg:
        start_date = parse_date(from_arg)
        end_date = parse_date(to_arg)
        if start_date > end_date:
            raise ValidationError("'from' date cannot be after 'to' date.")
    elif from_arg:
        start_date = parse_date(from_arg)
        end_date = start_date
    else:
        # Default to latest seeded peak operational date
        start_date = date(2026, 1, 31)
        end_date = start_date

    analysis = SalesAnalyzer.analyze_period(start_date, end_date)

    # Calculate payment methods distribution
    from backend.app.models import SaleOrder
    from datetime import datetime, time
    orders = SaleOrder.query.filter(
        SaleOrder.order_date >= datetime.combine(start_date, time.min),
        SaleOrder.order_date <= datetime.combine(end_date, time.max),
        SaleOrder.status == "completed",
    ).all()

    pm_counts = {}
    for o in orders:
        pm = o.payment_method or "cash"
        pm_counts[pm] = pm_counts.get(pm, 0.0) + float(o.total_amount)

    sales_by_payment = [{"method": k, "amount": v} for k, v in pm_counts.items()]

    # Query expenses for the day/range
    expenses = Expense.query.filter(
        Expense.expense_date >= datetime.combine(start_date, time.min),
        Expense.expense_date <= datetime.combine(end_date, time.max),
    ).all()
    expenses_total = sum(float(e.amount) for e in expenses)
    net_estimate = float(analysis["gross_profit"]) - expenses_total

    response_payload = {
        "date": start_date.isoformat() if start_date == end_date else f"{start_date.isoformat()} to {end_date.isoformat()}",
        "from_date": start_date.isoformat(),
        "to_date": end_date.isoformat(),
        "currency": "UZS",
        "total_revenue": analysis["total_revenue"],
        "total_cost": analysis["total_cost"],
        "gross_profit": analysis["gross_profit"],
        "gross_margin_percent": analysis["gross_margin"],
        "order_count": analysis["number_of_orders"],
        "units_sold": analysis["units_sold"],
        "average_order_value": analysis["average_order_value"],
        "top_products": analysis["top_products"],
        "top_categories": analysis["top_categories"],
        "sales_by_payment_method": sales_by_payment,
        "expenses_total": expenses_total,
        "net_estimate": net_estimate,
        "sales_by_day": analysis["sales_by_day"],
        "disclaimer": FINANCIAL_DISCLAIMER,
    }

    return jsonify(response_payload), 200

