import json
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy import (
    Column,
    String,
    Integer,
    Numeric,
    Boolean,
    DateTime,
    Date,
    Text,
    ForeignKey,
)
from sqlalchemy.orm import relationship
from backend.app.extensions import db


def utc_now():
    return datetime.now(timezone.utc)


def gen_uuid():
    return str(uuid.uuid4())


class Product(db.Model):
    __tablename__ = "products"

    id = Column(String(64), primary_key=True, default=gen_uuid)
    sku = Column(String(64), unique=True, index=True, nullable=False)
    name = Column(String(255), index=True, nullable=False)
    category = Column(String(128), index=True, nullable=False)
    cost_price = Column(Numeric(14, 2), nullable=False, default=Decimal("0.00"))
    selling_price = Column(Numeric(14, 2), nullable=False, default=Decimal("0.00"))
    stock_quantity = Column(Integer, default=0, nullable=False)
    min_stock_level = Column(Integer, default=5, nullable=False)
    unit = Column(String(32), default="pcs", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    inventory_items = relationship("InventoryItem", back_populates="product", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "sku": self.sku,
            "name": self.name,
            "category": self.category,
            "cost_price": float(self.cost_price),
            "selling_price": float(self.selling_price),
            "stock_quantity": self.stock_quantity,
            "min_stock_level": self.min_stock_level,
            "unit": self.unit,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class Customer(db.Model):
    __tablename__ = "customers"

    id = Column(String(64), primary_key=True, default=gen_uuid)
    name = Column(String(255), index=True, nullable=False)
    phone = Column(String(64), nullable=True)
    email = Column(String(255), nullable=True)
    region = Column(String(128), default="Toshkent shahri", index=True, nullable=False)
    total_orders = Column(Integer, default=0, nullable=False)
    total_spent = Column(Numeric(14, 2), default=Decimal("0.00"), nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    orders = relationship("SaleOrder", back_populates="customer")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "phone": self.phone,
            "email": self.email,
            "region": self.region,
            "total_orders": self.total_orders,
            "total_spent": float(self.total_spent),
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class SaleOrder(db.Model):
    __tablename__ = "sale_orders"

    id = Column(String(64), primary_key=True, default=gen_uuid)
    order_number = Column(String(64), unique=True, index=True, nullable=False)
    order_date = Column(DateTime, index=True, nullable=False)
    customer_id = Column(String(64), ForeignKey("customers.id"), nullable=True)
    customer_name = Column(String(255), nullable=False)
    region = Column(String(128), default="Toshkent shahri", index=True, nullable=False)
    status = Column(String(32), default="completed", nullable=False)  # completed, refunded, cancelled, pending
    total_amount = Column(Numeric(14, 2), nullable=False, default=Decimal("0.00"))
    total_cost = Column(Numeric(14, 2), nullable=False, default=Decimal("0.00"))
    discount_amount = Column(Numeric(14, 2), default=Decimal("0.00"), nullable=False)
    payment_method = Column(String(64), default="cash", nullable=False)  # cash, card, payme, click, bank_transfer
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    customer = relationship("Customer", back_populates="orders")
    items = relationship("SaleOrderItem", back_populates="sale_order", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "order_number": self.order_number,
            "order_date": self.order_date.isoformat() if self.order_date else None,
            "customer_id": self.customer_id,
            "customer_name": self.customer_name,
            "region": self.region,
            "status": self.status,
            "total_amount": float(self.total_amount),
            "total_cost": float(self.total_cost),
            "discount_amount": float(self.discount_amount),
            "payment_method": self.payment_method,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "items": [item.to_dict() for item in self.items],
        }



class SaleOrderItem(db.Model):
    __tablename__ = "sale_order_items"

    id = Column(String(64), primary_key=True, default=gen_uuid)
    sale_order_id = Column(String(64), ForeignKey("sale_orders.id"), nullable=False)
    product_id = Column(String(64), ForeignKey("products.id"), nullable=True)
    product_name = Column(String(255), nullable=False)
    category = Column(String(128), nullable=False)
    quantity = Column(Integer, default=1, nullable=False)
    unit_price = Column(Numeric(14, 2), nullable=False, default=Decimal("0.00"))
    unit_cost = Column(Numeric(14, 2), nullable=False, default=Decimal("0.00"))
    total_price = Column(Numeric(14, 2), nullable=False, default=Decimal("0.00"))
    total_cost = Column(Numeric(14, 2), nullable=False, default=Decimal("0.00"))

    sale_order = relationship("SaleOrder", back_populates="items")

    def to_dict(self):
        return {
            "id": self.id,
            "product_id": self.product_id,
            "product_name": self.product_name,
            "category": self.category,
            "quantity": self.quantity,
            "unit_price": float(self.unit_price),
            "unit_cost": float(self.unit_cost),
            "total_price": float(self.total_price),
            "total_cost": float(self.total_cost),
        }


class Expense(db.Model):
    __tablename__ = "expenses"

    id = Column(String(64), primary_key=True, default=gen_uuid)
    expense_date = Column(DateTime, index=True, nullable=False)
    category = Column(String(64), index=True, nullable=False)  # rent, salaries, utilities, marketing, supplies, taxes, other
    amount = Column(Numeric(14, 2), nullable=False, default=Decimal("0.00"))
    description = Column(String(255), nullable=False)
    payment_method = Column(String(64), default="bank_transfer", nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "expense_date": self.expense_date.isoformat() if self.expense_date else None,
            "category": self.category,
            "amount": float(self.amount),
            "description": self.description,
            "payment_method": self.payment_method,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class InventoryItem(db.Model):
    __tablename__ = "inventory_items"

    id = Column(String(64), primary_key=True, default=gen_uuid)
    product_id = Column(String(64), ForeignKey("products.id"), nullable=False)
    warehouse = Column(String(128), default="Main Warehouse", nullable=False)
    quantity = Column(Integer, default=0, nullable=False)
    reorder_point = Column(Integer, default=10, nullable=False)
    last_restocked_at = Column(DateTime, nullable=True)

    product = relationship("Product", back_populates="inventory_items")

    def to_dict(self):
        return {
            "id": self.id,
            "product_id": self.product_id,
            "product_name": self.product.name if self.product else "Unknown",
            "sku": self.product.sku if self.product else "",
            "category": self.product.category if self.product else "",
            "warehouse": self.warehouse,
            "quantity": self.quantity,
            "reorder_point": self.reorder_point,
            "is_low_stock": self.quantity <= self.reorder_point,
            "last_restocked_at": self.last_restocked_at.isoformat() if self.last_restocked_at else None,
        }


class Conversation(db.Model):
    __tablename__ = "conversations"

    id = Column(String(64), primary_key=True, default=gen_uuid)
    title = Column(String(255), nullable=False, default="New Conversation")
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan", order_by="Message.created_at")

    def to_dict(self, include_messages=False):
        res = {
            "id": self.id,
            "title": self.title,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_messages:
            res["messages"] = [m.to_dict() for m in self.messages]
        return res


class Message(db.Model):
    __tablename__ = "messages"

    id = Column(String(64), primary_key=True, default=gen_uuid)
    conversation_id = Column(String(64), ForeignKey("conversations.id"), nullable=False)
    role = Column(String(32), nullable=False)  # user, assistant, system
    content = Column(Text, nullable=False)
    context_json = Column(Text, default="{}", nullable=False)
    sources_json = Column(Text, default="[]", nullable=False)
    usage_json = Column(Text, default="{\"used_claude\": false}", nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    conversation = relationship("Conversation", back_populates="messages")
    artifacts = relationship("Artifact", back_populates="message", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "conversation_id": self.conversation_id,
            "role": self.role,
            "content": self.content,
            "context": json.loads(self.context_json or "{}"),
            "sources": json.loads(self.sources_json or "[]"),
            "usage": json.loads(self.usage_json or "{\"used_claude\": false}"),
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "artifacts": [a.to_dict() for a in self.artifacts],
        }


class Artifact(db.Model):
    __tablename__ = "artifacts"

    id = Column(String(64), primary_key=True, default=gen_uuid)
    message_id = Column(String(64), ForeignKey("messages.id"), nullable=True)
    conversation_id = Column(String(64), ForeignKey("conversations.id"), nullable=True)
    type = Column(String(64), nullable=False)  # metric, table, bar_chart, line_chart, pie_chart, markdown, report, document_extract
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    data_json = Column(Text, default="{}", nullable=False)
    config_json = Column(Text, default="{}", nullable=False)
    source_ids_json = Column(Text, default="[]", nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    message = relationship("Message", back_populates="artifacts")

    def to_dict(self):
        return {
            "id": self.id,
            "message_id": self.message_id,
            "conversation_id": self.conversation_id,
            "type": self.type,
            "title": self.title,
            "description": self.description,
            "data": json.loads(self.data_json or "{}"),
            "config": json.loads(self.config_json or "{}"),
            "source_ids": json.loads(self.source_ids_json or "[]"),
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class UploadedFile(db.Model):
    __tablename__ = "uploaded_files"

    id = Column(String(64), primary_key=True, default=gen_uuid)
    filename = Column(String(255), nullable=False)
    stored_filename = Column(String(255), nullable=False)
    file_type = Column(String(32), nullable=False)
    file_size = Column(Integer, nullable=False)
    extracted_text = Column(Text, nullable=True)
    extracted_metadata_json = Column(Text, default="{}", nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    def to_dict(self, include_full_text=False):
        meta = json.loads(self.extracted_metadata_json or "{}")
        res = {
            "id": self.id,
            "filename": self.filename,
            "file_type": self.file_type,
            "file_size": self.file_size,
            "metadata": meta,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        if include_full_text:
            res["extracted_text"] = self.extracted_text
        else:
            # Preview first 300 characters
            preview = (self.extracted_text[:300] + "...") if self.extracted_text and len(self.extracted_text) > 300 else self.extracted_text
            res["extracted_text_preview"] = preview
        return res


class SalesAnalysisRecord(db.Model):
    __tablename__ = "sales_analysis_records"

    id = Column(String(64), primary_key=True, default=gen_uuid)
    from_date = Column(Date, nullable=False)
    to_date = Column(Date, nullable=False)
    result_json = Column(Text, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    def to_dict(self):
        res = json.loads(self.result_json)
        res["id"] = self.id
        res["created_at"] = self.created_at.isoformat() if self.created_at else None
        return res


class TelegramSubscriber(db.Model):
    __tablename__ = "telegram_subscribers"

    id = Column(String(64), primary_key=True, default=gen_uuid)
    chat_id = Column(String(64), unique=True, index=True, nullable=False)
    username = Column(String(128), nullable=True)
    first_name = Column(String(128), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    subscribed_at = Column(DateTime, default=utc_now, nullable=False)
    last_message_at = Column(DateTime, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "chat_id": self.chat_id,
            "username": self.username,
            "first_name": self.first_name,
            "is_active": self.is_active,
            "subscribed_at": self.subscribed_at.isoformat() if self.subscribed_at else None,
            "last_message_at": self.last_message_at.isoformat() if self.last_message_at else None,
        }


