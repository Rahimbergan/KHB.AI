import io


def test_file_upload_and_extraction(client):
    csv_content = b"Product,Quantity,Unit Price\nApple iPhone 15,2,12500000\nAirPods Pro 2,5,3200000\n"
    data = {
        "file": (io.BytesIO(csv_content), "january_inventory.csv"),
    }
    response = client.post(
        "/api/v1/files",
        data=data,
        content_type="multipart/form-data",
    )
    assert response.status_code == 201
    file_info = response.get_json()
    assert file_info["filename"] == "january_inventory.csv"
    assert file_info["file_type"] == "csv"
    file_id = file_info["id"]

    # Retrieve detail
    detail_res = client.get(f"/api/v1/files/{file_id}")
    assert detail_res.status_code == 200
    detail = detail_res.get_json()
    assert "Apple iPhone 15" in detail["extracted_text"]

    # Test download
    dl_res = client.get(f"/api/v1/files/{file_id}/download")
    assert dl_res.status_code == 200
    assert b"Apple iPhone 15" in dl_res.data

    # Test analyze file
    analyze_res = client.post(f"/api/v1/files/{file_id}/analyze", json={})
    assert analyze_res.status_code == 200
    analysis = analyze_res.get_json()
    assert "summary" in analysis
    assert "disclaimer" in analysis
    assert "informational document analysis, not legal advice" in analysis["disclaimer"]


def test_file_upload_validation(client):
    # Prohibited extension
    bad_data = {
        "file": (io.BytesIO(b"malicious script"), "hack.exe"),
    }
    bad_res = client.post(
        "/api/v1/files",
        data=bad_data,
        content_type="multipart/form-data",
    )
    assert bad_res.status_code == 422

    # Missing file parameter
    empty_res = client.post("/api/v1/files", data={})
    assert empty_res.status_code == 400

