def test_conversation_crud(client):
    # Create conversation
    create_res = client.post("/api/v1/conversations", json={"title": "Test Chat"})
    assert create_res.status_code == 201
    conv = create_res.get_json()
    conv_id = conv["id"]
    assert conv["title"] == "Test Chat"

    # List conversations
    list_res = client.get("/api/v1/conversations")
    assert list_res.status_code == 200
    ids = [c["id"] for c in list_res.get_json()]
    assert conv_id in ids

    # Get conversation details
    get_res = client.get(f"/api/v1/conversations/{conv_id}")
    assert get_res.status_code == 200
    assert "messages" in get_res.get_json()

    # Delete conversation
    del_res = client.delete(f"/api/v1/conversations/{conv_id}")
    assert del_res.status_code == 200

    # Verify deleted
    check_res = client.get(f"/api/v1/conversations/{conv_id}")
    assert check_res.status_code == 404


def test_send_message_acceptance_criteria(client):
    """Verifies: curl -X POST http://localhost:5000/api/v1/conversations/demo/messages ..."""
    payload = {
        "content": "Show me my top products this month.",
        "attachment_ids": [],
        "context": {
            "date": "2026-01-31",
            "dashboard_filters": {},
        },
    }
    response = client.post("/api/v1/conversations/demo/messages", json=payload)
    assert response.status_code == 200
    data = response.get_json()

    # Check response envelope
    assert "message" in data
    assert data["message"]["role"] == "assistant"
    assert len(data["message"]["content"]) > 0
    assert "artifacts" in data
    assert len(data["artifacts"]) >= 1
    assert "sources" in data
    assert "usage" in data
    assert data["usage"]["used_claude"] is False

    # Check artifact structure
    art = data["artifacts"][0]
    assert "id" in art
    assert "type" in art
    assert "title" in art
    assert "data" in art


def test_send_message_daily_report(client):
    payload = {
        "content": "Give me today's sales report.",
        "context": {"date": "2026-01-31"},
    }
    response = client.post("/api/v1/conversations/demo/messages", json=payload)
    assert response.status_code == 200
    data = response.get_json()
    assert "Sales Report" in data["message"]["content"]
    assert len(data["artifacts"]) >= 1

