from datetime import date, datetime
from decimal import Decimal
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.models import Sale, SaleItem, Expense, Product

DISCLAIMER_FINANCIAL = "This report is an informational business estimate, not legal, tax, or certified accounting advice."

class FinancialCalculator:
    @staticmethod
    def calculate_daily_sales(db: Session, target_date: date) -> Dict[str, Any]:
        start_dt = datetime.combine(target_date, datetime.min.time())
        end_dt = datetime.combine(target_date, datetime.max.time())

        sales = db.query(Sale).filter(
            Sale.sale_date >= start_dt,
            Sale.sale_date <= end_dt
        ).all()

        completed_sales = [s for s in sales if s.status == "completed"]
        refunded_sales = [s for s in sales if s.status == "refunded"]
        cancelled_sales = [s for s in sales if s.status == "cancelled"]

        total_revenue = sum([float(s.net_amount) for s in completed_sales])
        total_discount = sum([float(s.discount_amount) for s in completed_sales])
        refund_amount = sum([float(s.net_amount) for s in refunded_sales])

        total_cost = 0.0
        total_units = 0
        hourly_distribution = {h: 0.0 for h in range(24)}
        product_breakdown = {}

        for sale in completed_sales:
            hour = sale.sale_date.hour if sale.sale_date else 12
            hourly_distribution[hour] += float(sale.net_amount)

            for item in sale.items:
                total_cost += float(item.cost_price or 0)
                total_units += item.quantity
                p_name = item.product.name if item.product else "Noma'lum"
                if p_name not in product_breakdown:
                    product_breakdown[p_name] = {"units": 0, "revenue": 0.0}
                product_breakdown[p_name]["units"] += item.quantity
                product_breakdown[p_name]["revenue"] += float(item.total_price)

        gross_profit = total_revenue - total_cost
        gross_margin = (gross_profit / total_revenue * 100) if total_revenue > 0 else 0.0
        aov = (total_revenue / len(completed_sales)) if completed_sales else 0.0

        top_products = sorted(
            [{"name": k, "units": v["units"], "revenue": v["revenue"]} for k, v in product_breakdown.items()],
            key=lambda x: x["revenue"],
            reverse=True
        )[:5]

        return {
            "date": target_date.isoformat(),
            "currency": "UZS",
            "orders_count": len(completed_sales),
            "refunded_count": len(refunded_sales),
            "cancelled_count": len(cancelled_sales),
            "total_revenue": round(total_revenue, 2),
            "total_cost": round(total_cost, 2),
            "gross_profit": round(gross_profit, 2),
            "gross_margin": round(gross_margin, 2),
            "average_order_value": round(aov, 2),
            "total_units_sold": total_units,
            "refund_amount": round(refund_amount, 2),
            "hourly_sales": [{"hour": f"{h:02d}:00", "revenue": round(amt, 2)} for h, amt in hourly_distribution.items() if 8 <= h <= 22],
            "top_products": top_products,
            "disclaimer": DISCLAIMER_FINANCIAL
        }
