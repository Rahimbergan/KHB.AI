from datetime import date, datetime, time, timedelta
from decimal import Decimal
from typing import Dict, Any, List, Optional
from sqlalchemy import func
from backend.app.extensions import db
from backend.app.models import SaleOrder, SaleOrderItem, SalesAnalysisRecord
from backend.app.services.financial_calculator import FinancialCalculator, FINANCIAL_DISCLAIMER
from backend.app.utils.dates import get_previous_period


class SalesAnalyzer:
    @staticmethod
    def _get_orders_in_range(start_date: date, end_date: date) -> List[SaleOrder]:
        dt_start = datetime.combine(start_date, time.min)
        dt_end = datetime.combine(end_date, time.max)
        return (
            SaleOrder.query.filter(SaleOrder.order_date >= dt_start, SaleOrder.order_date <= dt_end)
            .order_by(SaleOrder.order_date.asc())
            .all()
        )

    @classmethod
    def analyze_period(cls, start_date: date, end_date: date) -> Dict[str, Any]:
        orders = cls._get_orders_in_range(start_date, end_date)

        completed_orders = [o for o in orders if o.status == "completed"]
        refunded_orders = [o for o in orders if o.status == "refunded"]
        cancelled_orders = [o for o in orders if o.status == "cancelled"]

        total_rev_dec = Decimal("0.00")
        total_cost_dec = Decimal("0.00")
        units_sold = 0

        # Aggregations by product, category, day, hour
        product_stats: Dict[str, Dict[str, Any]] = {}
        category_stats: Dict[str, Dict[str, Any]] = {}
        day_stats: Dict[str, Dict[str, Any]] = {}
        hour_stats: Dict[int, Dict[str, Any]] = {h: {"hour": h, "revenue": 0.0, "orders": 0} for h in range(24)}

        # Prepopulate all days in range so empty days appear
        cur = start_date
        while cur <= end_date:
            day_stats[cur.isoformat()] = {
                "date": cur.isoformat(),
                "revenue": 0.0,
                "orders": 0,
                "units": 0,
                "profit": 0.0,
            }
            cur += timedelta(days=1)

        for order in completed_orders:
            total_rev_dec += Decimal(str(order.total_amount))
            total_cost_dec += Decimal(str(order.total_cost))
            
            day_str = order.order_date.date().isoformat()
            if day_str in day_stats:
                day_stats[day_str]["revenue"] += float(order.total_amount)
                day_stats[day_str]["orders"] += 1
                day_stats[day_str]["profit"] += float(order.total_amount - order.total_cost)

            hour = order.order_date.hour
            hour_stats[hour]["revenue"] += float(order.total_amount)
            hour_stats[hour]["orders"] += 1

            for item in order.items:
                units_sold += item.quantity
                if day_str in day_stats:
                    day_stats[day_str]["units"] += item.quantity

                # Product aggregation
                p_id = item.product_id or item.product_name
                if p_id not in product_stats:
                    product_stats[p_id] = {
                        "product_id": item.product_id,
                        "product_name": item.product_name,
                        "category": item.category,
                        "units": 0,
                        "revenue": 0.0,
                        "profit": 0.0,
                    }
                product_stats[p_id]["units"] += item.quantity
                product_stats[p_id]["revenue"] += float(item.total_price)
                product_stats[p_id]["profit"] += float(item.total_price - item.total_cost)

                # Category aggregation
                cat = item.category or "Other"
                if cat not in category_stats:
                    category_stats[cat] = {
                        "category": cat,
                        "units": 0,
                        "revenue": 0.0,
                        "profit": 0.0,
                    }
                category_stats[cat]["units"] += item.quantity
                category_stats[cat]["revenue"] += float(item.total_price)
                category_stats[cat]["profit"] += float(item.total_price - item.total_cost)

        gross_profit_dec = FinancialCalculator.calculate_gross_profit(total_rev_dec, total_cost_dec)
        gross_margin = FinancialCalculator.calculate_gross_margin_percent(total_rev_dec, total_cost_dec)
        number_of_orders = len(completed_orders)
        aov = FinancialCalculator.calculate_average_order_value(total_rev_dec, number_of_orders)

        # Refunds & Cancellations
        refunds_count = len(refunded_orders)
        refunds_amount = sum(float(o.total_amount) for o in refunded_orders)

        # Top products (by revenue)
        top_products = sorted(product_stats.values(), key=lambda x: x["revenue"], reverse=True)[:10]
        # Top categories
        top_categories = sorted(category_stats.values(), key=lambda x: x["revenue"], reverse=True)

        sales_by_day = list(day_stats.values())
        sales_by_hour = [hour_stats[h] for h in range(24) if hour_stats[h]["orders"] > 0 or 8 <= h <= 22]

        # Calculate Previous Equivalent Period
        prev_start, prev_end = get_previous_period(start_date, end_date)
        prev_orders = cls._get_orders_in_range(prev_start, prev_end)
        prev_completed = [o for o in prev_orders if o.status == "completed"]
        prev_rev = sum(float(o.total_amount) for o in prev_completed)
        prev_cost = sum(float(o.total_cost) for o in prev_completed)
        prev_profit = float(FinancialCalculator.calculate_gross_profit(prev_rev, prev_cost))

        period_comparison = FinancialCalculator.compare_periods(
            {
                "total_revenue": float(total_rev_dec),
                "number_of_orders": number_of_orders,
                "gross_profit": float(gross_profit_dec),
            },
            {
                "total_revenue": prev_rev,
                "number_of_orders": len(prev_completed),
                "gross_profit": prev_profit,
            },
        )
        period_comparison["previous_period_start"] = prev_start.isoformat()
        period_comparison["previous_period_end"] = prev_end.isoformat()

        # Anomaly Detection
        anomalies = cls._detect_anomalies(sales_by_day, refunded_orders, cancelled_orders)

        result = {
            "from_date": start_date.isoformat(),
            "to_date": end_date.isoformat(),
            "currency": "UZS",
            "total_revenue": float(total_rev_dec),
            "total_cost": float(total_cost_dec),
            "gross_profit": float(gross_profit_dec),
            "gross_margin": gross_margin,
            "number_of_orders": number_of_orders,
            "units_sold": units_sold,
            "average_order_value": aov,
            "refunds_count": refunds_count,
            "refunds_amount": refunds_amount,
            "cancelled_count": len(cancelled_orders),
            "top_products": top_products,
            "top_categories": top_categories,
            "sales_by_day": sales_by_day,
            "sales_by_hour": sales_by_hour,
            "previous_period_comparison": period_comparison,
            "anomalies": anomalies,
            "disclaimer": FINANCIAL_DISCLAIMER,
        }
        return result

    @classmethod
    def _detect_anomalies(
        cls,
        sales_by_day: List[Dict[str, Any]],
        refunded_orders: List[SaleOrder],
        cancelled_orders: List[SaleOrder],
    ) -> List[Dict[str, Any]]:
        anomalies = []
        if not sales_by_day:
            return anomalies

        daily_revs = [d["revenue"] for d in sales_by_day if d["revenue"] > 0]
        if daily_revs:
            avg_rev = sum(daily_revs) / len(daily_revs)
            
            for d in sales_by_day:
                rev = d["revenue"]
                day = d["date"]
                if rev == 0 and len(sales_by_day) > 3:
                    anomalies.append({
                        "type": "zero_sales",
                        "severity": "warning",
                        "date": day,
                        "description": f"Zero sales recorded on {day}.",
                    })
                elif avg_rev > 0 and rev > (avg_rev * 1.6):
                    spike_pct = round(((rev - avg_rev) / avg_rev) * 100, 1)
                    anomalies.append({
                        "type": "revenue_spike",
                        "severity": "positive",
                        "date": day,
                        "description": f"Revenue surged by {spike_pct}% above average on {day} ({FinancialCalculator.format_currency(rev)}).",
                    })
                elif avg_rev > 0 and rev < (avg_rev * 0.4) and rev > 0:
                    drop_pct = round(((avg_rev - rev) / avg_rev) * 100, 1)
                    anomalies.append({
                        "type": "revenue_drop",
                        "severity": "alert",
                        "date": day,
                        "description": f"Revenue dropped by {drop_pct}% below average on {day} ({FinancialCalculator.format_currency(rev)}).",
                    })

        if len(refunded_orders) >= 3:
            total_ref = sum(float(o.total_amount) for o in refunded_orders)
            anomalies.append({
                "type": "high_refund_rate",
                "severity": "warning",
                "date": None,
                "description": f"Elevated refund activity: {len(refunded_orders)} refunded orders totaling {FinancialCalculator.format_currency(total_ref)}.",
            })

        return anomalies

