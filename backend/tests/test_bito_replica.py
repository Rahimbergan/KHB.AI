def test_list_products(client):
    response = client.get("/api/v1/products?page=1&page_size=10")
    assert response.status_code == 200
    data = response.get_json()
    assert "data" in data
    assert "pagination" in data
    assert data["pagination"]["page"] == 1
    assert data["pagination"]["page_size"] == 10
    assert data["pagination"]["total"] >= 10
    assert len(data["data"]) == 10

    # Verify envelope fields
    prod = data["data"][0]
    assert "id" in prod
    assert "sku" in prod
    assert "name" in prod
    assert "cost_price" in prod
    assert "selling_price" in prod


def test_get_product_by_id(client):
    list_res = client.get("/api/v1/products?page=1&page_size=1")
    first_id = list_res.get_json()["data"][0]["id"]

    response = client.get(f"/api/v1/products/{first_id}")
    assert response.status_code == 200
    prod = response.get_json()
    assert prod["id"] == first_id

    # Test non-existent product
    nf_res = client.get("/api/v1/products/non-existent-id-12345")
    assert nf_res.status_code == 404


def test_list_sales_and_filtering(client):
    response = client.get("/api/v1/sales?from=2026-01-01&to=2026-01-31&page=1&page_size=20")
    assert response.status_code == 200
    data = response.get_json()
    assert "data" in data
    assert len(data["data"]) > 0
    assert "pagination" in data
    assert data["pagination"]["total"] > 0


def test_create_sale(client):
    # Fetch a product to purchase
    prod_res = client.get("/api/v1/products?page=1&page_size=1")
    prod = prod_res.get_json()["data"][0]

    payload = {
        "customer_name": "Test Customer",
        "payment_method": "payme",
        "items": [
            {
                "product_id": prod["id"],
                "quantity": 2,
                "unit_price": prod["selling_price"],
            }
        ],
    }
    response = client.post("/api/v1/sales", json=payload)
    assert response.status_code == 201
    sale = response.get_json()
    assert sale["customer_name"] == "Test Customer"
    assert sale["status"] == "completed"
    assert len(sale["items"]) == 1
    assert sale["items"][0]["quantity"] == 2


def test_list_expenses(client):
    response = client.get("/api/v1/expenses")
    assert response.status_code == 200
    data = response.get_json()
    assert "data" in data
    assert len(data["data"]) > 0
    assert "category" in data["data"][0]
    assert "amount" in data["data"][0]


def test_list_inventory(client):
    response = client.get("/api/v1/inventory")
    assert response.status_code == 200
    data = response.get_json()
    assert "data" in data
    assert len(data["data"]) > 0
    assert "is_low_stock" in data["data"][0]


def test_list_customers(client):
    response = client.get("/api/v1/customers")
    assert response.status_code == 200
    data = response.get_json()
    assert "data" in data
    assert len(data["data"]) > 0
    assert "total_spent" in data["data"][0]

