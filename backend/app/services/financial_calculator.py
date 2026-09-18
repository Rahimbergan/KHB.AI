from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, Any, Optional

FINANCIAL_DISCLAIMER = (
    "This report is an informational business estimate, not legal, tax, or certified accounting advice."
)


class FinancialCalculator:
    @staticmethod
    def to_decimal(val: Any) -> Decimal:
        if val is None:
            return Decimal("0.00")
        if isinstance(val, Decimal):
            return val
        try:
            return Decimal(str(val))
        except Exception:
            return Decimal("0.00")

    @classmethod
    def calculate_gross_profit(cls, revenue: Any, cost: Any) -> Decimal:
        rev = cls.to_decimal(revenue)
        c = cls.to_decimal(cost)
        return (rev - c).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    @classmethod
    def calculate_gross_margin_percent(cls, revenue: Any, cost: Any) -> float:
        rev = cls.to_decimal(revenue)
        if rev <= Decimal("0"):
            return 0.0
        profit = cls.calculate_gross_profit(rev, cost)
        margin = (profit / rev) * Decimal("100")
        return float(margin.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))

    @classmethod
    def calculate_average_order_value(cls, revenue: Any, order_count: int) -> float:
        if order_count <= 0:
            return 0.0
        rev = cls.to_decimal(revenue)
        aov = rev / Decimal(str(order_count))
        return float(aov.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))

    @classmethod
    def calculate_change_percent(cls, current: Any, previous: Any) -> float:
        cur = cls.to_decimal(current)
        prev = cls.to_decimal(previous)
        if prev == Decimal("0"):
            if cur == Decimal("0"):
                return 0.0
            return 100.0 if cur > 0 else -100.0
        change = ((cur - prev) / abs(prev)) * Decimal("100")
        return float(change.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))

    @classmethod
    def format_currency(cls, amount: Any, currency: str = "UZS") -> str:
        d = cls.to_decimal(amount)
        # Format with thousands comma separator
        int_part = int(d)
        formatted = f"{int_part:,}".replace(",", " ")
        return f"{formatted} {currency}"

    @classmethod
    def compare_periods(
        cls, current_metrics: Dict[str, Any], previous_metrics: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Calculates changes between current and previous equivalent period."""
        cur_rev = current_metrics.get("total_revenue", 0.0)
        prev_rev = previous_metrics.get("total_revenue", 0.0)
        cur_orders = current_metrics.get("number_of_orders", 0)
        prev_orders = previous_metrics.get("number_of_orders", 0)
        cur_profit = current_metrics.get("gross_profit", 0.0)
        prev_profit = previous_metrics.get("gross_profit", 0.0)

        rev_change = cls.calculate_change_percent(cur_rev, prev_rev)
        orders_change = cls.calculate_change_percent(cur_orders, prev_orders)
        profit_change = cls.calculate_change_percent(cur_profit, prev_profit)

        return {
            "previous_revenue": prev_rev,
            "revenue_change_amount": float(cls.to_decimal(cur_rev) - cls.to_decimal(prev_rev)),
            "revenue_change_percent": rev_change,
            "revenue_trend": "up" if rev_change > 0 else ("down" if rev_change < 0 else "neutral"),
            "previous_orders": prev_orders,
            "orders_change_percent": orders_change,
            "previous_gross_profit": prev_profit,
            "profit_change_percent": profit_change,
        }

