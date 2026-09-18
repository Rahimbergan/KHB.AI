from decimal import Decimal
from backend.app.services.financial_calculator import FinancialCalculator, FINANCIAL_DISCLAIMER


def test_gross_profit_and_margin():
    rev = Decimal("10000000.00")
    cost = Decimal("7000000.00")
    profit = FinancialCalculator.calculate_gross_profit(rev, cost)
    margin = FinancialCalculator.calculate_gross_margin_percent(rev, cost)

    assert profit == Decimal("3000000.00")
    assert margin == 30.0


def test_average_order_value():
    rev = Decimal("15000000.00")
    orders = 6
    aov = FinancialCalculator.calculate_average_order_value(rev, orders)
    assert aov == 2500000.0

    # Zero orders
    zero_aov = FinancialCalculator.calculate_average_order_value(rev, 0)
    assert zero_aov == 0.0


def test_change_percent():
    pct = FinancialCalculator.calculate_change_percent(120, 100)
    assert pct == 20.0

    pct_drop = FinancialCalculator.calculate_change_percent(80, 100)
    assert pct_drop == -20.0

    # From zero
    pct_from_zero = FinancialCalculator.calculate_change_percent(50, 0)
    assert pct_from_zero == 100.0


def test_format_currency():
    fmt = FinancialCalculator.format_currency(1250000, "UZS")
    assert fmt == "1 250 000 UZS"


def test_financial_disclaimer():
    assert "informational business estimate" in FINANCIAL_DISCLAIMER
    assert "not legal, tax, or certified accounting advice" in FINANCIAL_DISCLAIMER

