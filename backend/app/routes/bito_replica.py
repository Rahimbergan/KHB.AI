from flask import Blueprint, request, jsonify
from backend.app.services.local_bito import LocalBitoService
from backend.app.schemas.sales import SaleOrderCreateSchema
from backend.app.utils.errors import ValidationError

bito_bp = Blueprint("bito_replica", __name__, url_prefix="/api/v1")


def _get_pagination_params():
    page = request.args.get("page", 1, type=int)
    page_size = request.args.get("page_size", 50, type=int)
    search = request.args.get("search", None, type=str)
    from_date = request.args.get("from", None, type=str)
    to_date = request.args.get("to", None, type=str)
    return page, page_size, search, from_date, to_date


# Products
@bito_bp.route("/products", methods=["GET"])
def list_products():
    page, page_size, search, from_date, to_date = _get_pagination_params()
    res = LocalBitoService.get_products(
        page=page, page_size=page_size, search=search, from_date=from_date, to_date=to_date
    )
    return jsonify(res), 200


@bito_bp.route("/products/<product_id>", methods=["GET"])
def get_product(product_id: str):
    res = LocalBitoService.get_product_by_id(product_id)
    return jsonify(res), 200


# Sales
@bito_bp.route("/sales", methods=["GET"])
def list_sales():
    page, page_size, search, from_date, to_date = _get_pagination_params()
    res = LocalBitoService.get_sales(
        page=page, page_size=page_size, search=search, from_date=from_date, to_date=to_date
    )
    return jsonify(res), 200


@bito_bp.route("/sales/<sale_id>", methods=["GET"])
def get_sale(sale_id: str):
    res = LocalBitoService.get_sale_by_id(sale_id)
    return jsonify(res), 200


@bito_bp.route("/sales", methods=["POST"])
def create_sale():
    body = request.get_json(silent=True) or {}
    try:
        validated = SaleOrderCreateSchema(**body)
    except Exception as exc:
        raise ValidationError(f"Invalid sale order data: {str(exc)}") from exc

    created = LocalBitoService.create_sale(validated.model_dump())
    return jsonify(created), 201


# Expenses
@bito_bp.route("/expenses", methods=["GET"])
def list_expenses():
    page, page_size, search, from_date, to_date = _get_pagination_params()
    res = LocalBitoService.get_expenses(
        page=page, page_size=page_size, search=search, from_date=from_date, to_date=to_date
    )
    return jsonify(res), 200


# Inventory
@bito_bp.route("/inventory", methods=["GET"])
def list_inventory():
    page = request.args.get("page", 1, type=int)
    page_size = request.args.get("page_size", 50, type=int)
    search = request.args.get("search", None, type=str)
    res = LocalBitoService.get_inventory(page=page, page_size=page_size, search=search)
    return jsonify(res), 200


# Customers
@bito_bp.route("/customers", methods=["GET"])
def list_customers():
    page = request.args.get("page", 1, type=int)
    page_size = request.args.get("page_size", 50, type=int)
    search = request.args.get("search", None, type=str)
    res = LocalBitoService.get_customers(page=page, page_size=page_size, search=search)
    return jsonify(res), 200

