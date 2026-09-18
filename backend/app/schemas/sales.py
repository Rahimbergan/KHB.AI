from decimal import Decimal
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class ProductBase(BaseModel):
    sku: str
    name: str
    category: str
    cost_price: Decimal = Field(ge=0)
    selling_price: Decimal = Field(ge=0)
    stock_quantity: int = Field(default=0, ge=0)
    min_stock_level: int = Field(default=5, ge=0)
    unit: str = "pcs"
    is_active: bool = True


class ProductCreateSchema(ProductBase):
    pass


class ProductSchema(ProductBase):
    id: str
    cost_price: float
    selling_price: float
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class SaleOrderItemSchema(BaseModel):
    id: Optional[str] = None
    product_id: Optional[str] = None
    product_name: str
    category: str
    quantity: int = Field(ge=1)
    unit_price: float
    unit_cost: float
    total_price: float
    total_cost: float


class SaleOrderCreateItemSchema(BaseModel):
    product_id: Optional[str] = None
    product_name: Optional[str] = None
    quantity: int = Field(1, ge=1)
    unit_price: Optional[Decimal] = None


class SaleOrderCreateSchema(BaseModel):
    customer_id: Optional[str] = None
    customer_name: str = "Walk-in Customer"
    order_date: Optional[str] = None  # ISO format or YYYY-MM-DD
    payment_method: str = "cash"
    discount_amount: Decimal = Field(default=Decimal("0.00"), ge=0)
    notes: Optional[str] = None
    items: List[SaleOrderCreateItemSchema]


class SaleOrderSchema(BaseModel):
    id: str
    order_number: str
    order_date: str
    customer_id: Optional[str] = None
    customer_name: str
    status: str
    total_amount: float
    total_cost: float
    discount_amount: float
    payment_method: str
    notes: Optional[str] = None
    created_at: Optional[str] = None
    items: List[SaleOrderItemSchema] = []


class ExpenseCreateSchema(BaseModel):
    expense_date: str  # YYYY-MM-DD or ISO
    category: str
    amount: Decimal = Field(gt=0)
    description: str
    payment_method: str = "bank_transfer"


class ExpenseSchema(BaseModel):
    id: str
    expense_date: str
    category: str
    amount: float
    description: str
    payment_method: str
    created_at: Optional[str] = None


class InventoryItemSchema(BaseModel):
    id: str
    product_id: str
    product_name: str
    sku: str
    category: str
    warehouse: str
    quantity: int
    reorder_point: int
    is_low_stock: bool
    last_restocked_at: Optional[str] = None


class CustomerSchema(BaseModel):
    id: str
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    total_orders: int
    total_spent: float
    created_at: Optional[str] = None


class DailySalesItem(BaseModel):
    date: str
    total_revenue: float
    total_cost: float
    gross_profit: float
    gross_margin_percent: float
    order_count: int
    units_sold: int
    average_order_value: float


class DailyReportSchema(BaseModel):
    date: str
    currency: str = "UZS"
    total_revenue: float
    total_cost: float
    gross_profit: float
    gross_margin_percent: float
    order_count: int
    units_sold: int
    average_order_value: float
    top_products: List[Dict[str, Any]]
    top_categories: List[Dict[str, Any]]
    sales_by_payment_method: List[Dict[str, Any]]
    expenses_total: float
    net_estimate: float
    disclaimer: str


class SalesAnalysisRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    from_date: Optional[str] = Field(None, alias="from")
    to_date: Optional[str] = Field(None, alias="to")


class SalesAnalysisSchema(BaseModel):
    id: Optional[str] = None
    from_date: str
    to_date: str
    currency: str = "UZS"
    total_revenue: float
    total_cost: float
    gross_profit: float
    gross_margin: float
    number_of_orders: int
    units_sold: int
    average_order_value: float
    refunds_count: int
    refunds_amount: float
    top_products: List[Dict[str, Any]]
    top_categories: List[Dict[str, Any]]
    sales_by_day: List[Dict[str, Any]]
    sales_by_hour: List[Dict[str, Any]]
    previous_period_comparison: Dict[str, Any]
    anomalies: List[Dict[str, Any]]
    disclaimer: str
    created_at: Optional[str] = None
