def test_claude_fallback_when_unconfigured(client):
    # Prompt 1: Why did sales fall
    res1 = client.post(
        "/api/v1/conversations/demo/messages",
        json={"content": "Why did sales fall compared with yesterday?", "context": {"date": "2026-01-31"}},
    )
    assert res1.status_code == 200
    d1 = res1.get_json()
    assert d1["usage"]["used_claude"] is False
    assert len(d1["artifacts"]) >= 1

    # Prompt 2: Expenses inquiry
    res2 = client.post(
        "/api/v1/conversations/demo/messages",
        json={"content": "Find unusual expenses in the selected period.", "context": {"date": "2026-01-31"}},
    )
    assert res2.status_code == 200
    d2 = res2.get_json()
    assert d2["usage"]["used_claude"] is False
    assert "Operating Expenses" in d2["message"]["content"]
    assert len(d2["artifacts"]) >= 1

    # Prompt 3: Recommendations
    res3 = client.post(
        "/api/v1/conversations/demo/messages",
        json={"content": "What should the owner do next week?", "context": {"date": "2026-01-31"}},
    )
    assert res3.status_code == 200
    d3 = res3.get_json()
    assert d3["usage"]["used_claude"] is False
    assert "Recommendations" in d3["message"]["content"]

    # Prompt 4: Contract summary
    res4 = client.post(
        "/api/v1/conversations/demo/messages",
        json={"content": "Summarize this contract and list important deadlines.", "context": {"date": "2026-01-31"}},
    )
    assert res4.status_code == 200
    d4 = res4.get_json()
    assert d4["usage"]["used_claude"] is False
    assert "Document Analysis" in d4["message"]["content"]
    assert any(art["type"] == "document_extract" for art in d4["artifacts"])

