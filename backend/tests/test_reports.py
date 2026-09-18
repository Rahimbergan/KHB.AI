def test_daily_sales_by_date(client):
    response = client.get("/api/v1/reports/daily-sales?date=2026-01-31")
    assert response.status_code == 200
    data = response.get_json()
    assert data["date"] == "2026-01-31"
    assert "total_revenue" in data
    assert "gross_profit" in data
    assert "gross_margin_percent" in data
    assert "order_count" in data
    assert "top_products" in data
    assert "disclaimer" in data
    assert "not legal, tax, or certified accounting advice" in data["disclaimer"]


def test_daily_sales_by_date_range(client):
    response = client.get("/api/v1/reports/daily-sales?from=2026-01-01&to=2026-01-31")
    assert response.status_code == 200
    data = response.get_json()
    assert "2026-01-01 to 2026-01-31" in data["date"]
    assert data["order_count"] > 0
    assert data["total_revenue"] > 0
    assert "top_categories" in data
    assert "sales_by_payment_method" in data


def test_daily_sales_invalid_dates(client):
    # Invalid date format
    bad_res = client.get("/api/v1/reports/daily-sales?date=not-a-date")
    assert bad_res.status_code == 422

    # from date after to date
    inverted_res = client.get("/api/v1/reports/daily-sales?from=2026-02-01&to=2026-01-01")
    assert inverted_res.status_code == 422

