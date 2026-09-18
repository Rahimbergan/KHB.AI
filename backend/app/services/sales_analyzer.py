from datetime import date, datetime, timedelta
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.models import Sale, SaleItem, Expense, Product, Category
from backend.app.services.financial_calculator import DISCLAIMER_FINANCIAL

class SalesAnalyzer:
    @staticmethod
    def analyze_period(db: Session, start_date: date, end_date: date) -> Dict[str, Any]:
        start_dt = datetime.combine(start_date, datetime.min.time())
        end_dt = datetime.combine(end_date, datetime.max.time())

        # Current period sales
        sales = db.query(Sale).filter(
            Sale.sale_date >= start_dt,
            Sale.sale_date <= end_dt
        ).all()

        completed = [s for s in sales if s.status == "completed"]
        refunded = [s for s in sales if s.status == "refunded"]
        cancelled = [s for s in sales if s.status == "cancelled"]

        total_revenue = sum([float(s.net_amount) for s in completed])
        total_cost = 0.0
        total_units = 0

        # Day-by-day mapping
        days_diff = (end_date - start_date).days + 1
        daily_sales_map = {(start_date + timedelta(days=i)).isoformat(): 0.0 for i in range(days_diff)}
        category_map = {}
        product_map = {}

        for s in completed:
            day_str = s.sale_date.date().isoformat()
            if day_str in daily_sales_map:
                daily_sales_map[day_str] += float(s.net_amount)

            for item in s.items:
                total_cost += float(item.cost_price or 0)
                total_units += item.quantity
                
                # Product stats
                p_name = item.product.name if item.product else "Noma'lum"
                if p_name not in product_map:
                    product_map[p_name] = {"units": 0, "revenue": 0.0}
                product_map[p_name]["units"] += item.quantity
                product_map[p_name]["revenue"] += float(item.total_price)

                # Category stats
                cat_name = item.product.category.name if item.product and item.product.category else "Boshqa"
                if cat_name not in category_map:
                    category_map[cat_name] = {"revenue": 0.0, "units": 0}
                category_map[cat_name]["revenue"] += float(item.total_price)
                category_map[cat_name]["units"] += item.quantity

        gross_profit = total_revenue - total_cost
        gross_margin = (gross_profit / total_revenue * 100) if total_revenue > 0 else 0.0
        aov = (total_revenue / len(completed)) if completed else 0.0

        # Previous period comparison
        prev_end = start_date - timedelta(days=1)
        prev_start = prev_end - timedelta(days=days_diff - 1)
        prev_start_dt = datetime.combine(prev_start, datetime.min.time())
        prev_end_dt = datetime.combine(prev_end, datetime.max.time())

        prev_sales = db.query(Sale).filter(
            Sale.sale_date >= prev_start_dt,
            Sale.sale_date <= prev_end_dt,
            Sale.status == "completed"
        ).all()

        prev_revenue = sum([float(s.net_amount) for s in prev_sales])
        revenue_change_pct = ((total_revenue - prev_revenue) / prev_revenue * 100) if prev_revenue > 0 else 0.0

        # Anomalies check (e.g. days with revenue > 1.8x average or < 0.4x average)
        daily_values = list(daily_sales_map.values())
        avg_daily = sum(daily_values) / len(daily_values) if daily_values else 0.0
        anomalies = []
        for day_str, val in daily_sales_map.items():
            if avg_daily > 0 and val > avg_daily * 1.8:
                anomalies.append({
                    "date": day_str,
                    "type": "spike",
                    "description": f"Yuqori savdo ko'rsatkichi: o'rtacha {round(avg_daily):,} UZS o'rniga {round(val):,} UZS qayd etildi."
                })
            elif avg_daily > 0 and val < avg_daily * 0.35 and val > 0:
                anomalies.append({
                    "date": day_str,
                    "type": "drop",
                    "description": f"Kutilmagan pasayish: o'rtacha {round(avg_daily):,} UZS o'rniga {round(val):,} UZS qayd etildi."
                })

        top_products = sorted(
            [{"name": k, "units": v["units"], "revenue": round(v["revenue"], 2)} for k, v in product_map.items()],
            key=lambda x: x["revenue"],
            reverse=True
        )[:10]

        top_categories = sorted(
            [{"category": k, "revenue": round(v["revenue"], 2), "units": v["units"]} for k, v in category_map.items()],
            key=lambda x: x["revenue"],
            reverse=True
        )

        timeline = [{"date": d, "revenue": round(val, 2)} for d, val in daily_sales_map.items()]

        return {
            "period": {
                "from": start_date.isoformat(),
                "to": end_date.isoformat(),
                "days": days_diff
            },
            "previous_period": {
                "from": prev_start.isoformat(),
                "to": prev_end.isoformat(),
                "revenue": round(prev_revenue, 2)
            },
            "metrics": {
                "total_revenue": round(total_revenue, 2),
                "revenue_change_percent": round(revenue_change_pct, 2),
                "trend": "up" if revenue_change_pct >= 0 else "down",
                "orders_count": len(completed),
                "units_sold": total_units,
                "average_order_value": round(aov, 2),
                "gross_profit": round(gross_profit, 2),
                "gross_margin": round(gross_margin, 2),
                "refunded_count": len(refunded),
                "cancelled_count": len(cancelled),
            },
            "top_products": top_products,
            "top_categories": top_categories,
            "timeline": timeline,
            "anomalies": anomalies,
            "currency": "UZS",
            "disclaimer": DISCLAIMER_FINANCIAL
        }
