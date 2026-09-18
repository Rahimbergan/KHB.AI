def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.get_json()
    assert data["status"] == "ok"
    assert data["version"] == "1.0.0"
    assert data["database"] == "connected"
    assert "claude" in data
    assert "available" in data["claude"]

