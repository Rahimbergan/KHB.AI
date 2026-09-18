from backend.app.services.artifact_service import ArtifactService


def test_artifact_retrieval_and_contract(client, db_session):
    # Create an artifact
    art = ArtifactService.create_metric_artifact(
        title="Test Metric",
        value=1500000,
        formatted_value="1,500,000 UZS",
        change_percent=12.5,
        trend="up",
        description="Test metric description",
    )
    db_session.commit()

    response = client.get(f"/api/v1/artifacts/{art.id}")
    assert response.status_code == 200
    data = response.get_json()

    # Verify contract shape
    assert data["id"] == art.id
    assert data["type"] == "metric"
    assert data["title"] == "Test Metric"
    assert data["description"] == "Test metric description"
    assert data["data"]["value"] == 1500000
    assert data["data"]["formatted_value"] == "1,500,000 UZS"
    assert data["data"]["change_percent"] == 12.5
    assert data["data"]["trend"] == "up"
    assert "config" in data
    assert "source_ids" in data
    assert "created_at" in data


def test_artifact_not_found(client):
    res = client.get("/api/v1/artifacts/non-existent-artifact-uuid")
    assert res.status_code == 404

