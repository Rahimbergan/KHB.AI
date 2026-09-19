from datetime import date, datetime, time
from decimal import Decimal
from typing import Dict, Any, List, Optional
from backend.app.models import SaleOrder
from backend.app.services.data_cleaner import DataCleaner
from backend.app.services.financial_calculator import FinancialCalculator


class RegionalAnalyzer:
    """
    Analyzes sales performance across Uzbekistan's 14 administrative divisions.
    Calculates revenue, margin, order density, share percentage, and growth per region.
    """

    @classmethod
    def analyze_regions(cls, start_date: date, end_date: date) -> Dict[str, Any]:
        """
        Aggregates completed sales by Uzbekistan region for the given period.
        """
        dt_start = datetime.combine(start_date, time.min)
        dt_end = datetime.combine(end_date, time.max)

        orders = (
            SaleOrder.query.filter(SaleOrder.order_date >= dt_start, SaleOrder.order_date <= dt_end)
            .filter(SaleOrder.status == "completed")
            .all()
        )

        total_revenue_all = Decimal("0.00")
        total_orders_all = len(orders)

        # Initialize regional dictionary for all 14 official regions
        regional_stats: Dict[str, Dict[str, Any]] = {}
        for reg in DataCleaner.UZBEKISTAN_REGIONS:
            regional_stats[reg] = {
                "region": reg,
                "revenue": Decimal("0.00"),
                "cost": Decimal("0.00"),
                "orders": 0,
                "units": 0,
                "products": {},
            }

        for o in orders:
            reg = DataCleaner.normalize_region(getattr(o, "region", None))
            if reg not in regional_stats:
                regional_stats[reg] = {
                    "region": reg,
                    "revenue": Decimal("0.00"),
                    "cost": Decimal("0.00"),
                    "orders": 0,
                    "units": 0,
                    "products": {},
                }

            rev = Decimal(str(o.total_amount))
            cost = Decimal(str(o.total_cost))

            regional_stats[reg]["revenue"] += rev
            regional_stats[reg]["cost"] += cost
            regional_stats[reg]["orders"] += 1
            total_revenue_all += rev

            for item in o.items:
                regional_stats[reg]["units"] += item.quantity
                pname = item.product_name
                regional_stats[reg]["products"][pname] = (
                    regional_stats[reg]["products"].get(pname, 0) + item.quantity
                )

        # Build formatted list
        regions_list = []
        for reg_name, stats in regional_stats.items():
            r_rev = stats["revenue"]
            r_cost = stats["cost"]
            r_profit = r_rev - r_cost
            r_orders = stats["orders"]
            r_margin = (
                round(float((r_profit / r_rev) * Decimal("100.0")), 2)
                if r_rev > 0
                else 0.0
            )
            r_share = (
                round(float((r_rev / total_revenue_all) * Decimal("100.0")), 2)
                if total_revenue_all > 0
                else 0.0
            )
            r_aov = round(float(r_rev) / r_orders, 2) if r_orders > 0 else 0.0

            # Top product in region
            top_prod = None
            if stats["products"]:
                sorted_p = sorted(stats["products"].items(), key=lambda x: x[1], reverse=True)
                top_prod = {"product_name": sorted_p[0][0], "units_sold": sorted_p[0][1]}

            regions_list.append({
                "region": reg_name,
                "revenue": float(r_rev),
                "formatted_revenue": FinancialCalculator.format_currency(float(r_rev)),
                "gross_profit": float(r_profit),
                "gross_margin_percent": r_margin,
                "orders_count": r_orders,
                "units_sold": stats["units"],
                "market_share_percent": r_share,
                "average_order_value": r_aov,
                "formatted_aov": FinancialCalculator.format_currency(r_aov),
                "top_product": top_prod,
            })

        # Rank regions by revenue
        regions_list.sort(key=lambda x: x["revenue"], reverse=True)

        active_regions = [r for r in regions_list if r["orders_count"] > 0]
        top_region = regions_list[0] if regions_list else None

        # Generate summary in Uzbek & English
        if active_regions:
            uzbek_summary = (
                f"O'zbekiston hududlari bo'yicha jami savdo tushumi: {FinancialCalculator.format_currency(float(total_revenue_all))}. "
                f"Eng yuqori ko'rsatkich {top_region['region']} hissasiga to'g'ri kelmoqda "
                f"({top_region['market_share_percent']}% ulush, {top_region['formatted_revenue']}). "
                f"Faol viloyatlar soni: {len(active_regions)} ta."
            )
        else:
            uzbek_summary = "Tanlangan davr uchun viloyatlar bo'yicha operatsiyalar mavjud emas."

        return {
            "from_date": start_date.isoformat(),
            "to_date": end_date.isoformat(),
            "total_revenue": float(total_revenue_all),
            "formatted_total_revenue": FinancialCalculator.format_currency(float(total_revenue_all)),
            "total_orders": total_orders_all,
            "active_regions_count": len(active_regions),
            "regions": regions_list,
            "top_region": top_region,
            "uzbek_summary": uzbek_summary,
        }

