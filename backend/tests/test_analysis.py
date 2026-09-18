def test_sales_analysis_creation(client):
    payload = {
        "from": "2026-01-01",
        "to": "2026-01-31",
    }
    response = client.post("/api/v1/analysis/sales", json=payload)
    assert response.status_code == 201
    data = response.get_json()

    # Core required calculations
    assert "id" in data
    assert "total_revenue" in data
    assert "number_of_orders" in data
    assert "units_sold" in data
    assert "average_order_value" in data
    assert "gross_profit" in data
    assert "gross_margin" in data
    assert "top_products" in data
    assert "top_categories" in data
    assert "sales_by_day" in data
    assert "previous_period_comparison" in data
    assert "anomalies" in data
    assert "disclaimer" in data

    # Verify retrieval by ID
    analysis_id = data["id"]
    get_res = client.get(f"/api/v1/analysis/sales/{analysis_id}")
    assert get_res.status_code == 200
    assert get_res.get_json()["id"] == analysis_id


def test_sales_analysis_validation_errors(client):
    # Missing dates
    bad_res = client.post("/api/v1/analysis/sales", json={})
    assert bad_res.status_code == 422

    # Inverted dates
    inv_res = client.post("/api/v1/analysis/sales", json={"from": "2026-01-31", "to": "2026-01-01"})
    assert inv_res.status_code == 422

