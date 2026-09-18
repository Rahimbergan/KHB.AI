import uuid
import json
from datetime import datetime, date
from decimal import Decimal
from sqlalchemy import (
    Column, String, Integer, Float, DateTime, Date, ForeignKey, Text, Boolean, Numeric
)
from sqlalchemy.orm import relationship
from backend.app.extensions import Base

def generate_uuid():
    return str(uuid.uuid4())

class Category(Base):
    __tablename__ = "categories"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    products = relationship("Product", back_populates="category")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class Product(Base):
    __tablename__ = "products"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    sku = Column(String(100), nullable=True, unique=True)
    category_id = Column(String(36), ForeignKey("categories.id"), nullable=True)
    cost_price = Column(Numeric(14, 2), default=0.0)
    selling_price = Column(Numeric(14, 2), default=0.0)
    stock_quantity = Column(Integer, default=0)
    unit = Column(String(50), default="dona")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    category = relationship("Category", back_populates="products")
    sale_items = relationship("SaleItem", back_populates="product")
    inventory = relationship("InventoryItem", back_populates="product", uselist=False)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "sku": self.sku,
            "category_id": self.category_id,
            "category_name": self.category.name if self.category else None,
            "cost_price": float(self.cost_price or 0),
            "selling_price": float(self.selling_price or 0),
            "stock_quantity": self.stock_quantity,
            "unit": self.unit,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class Customer(Base):
    __tablename__ = "customers"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    email = Column(String(100), nullable=True)
    address = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    sales = relationship("Sale", back_populates="customer")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "phone": self.phone,
            "email": self.email,
            "address": self.address,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class Sale(Base):
    __tablename__ = "sales"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    sale_number = Column(String(50), nullable=False, unique=True)
    customer_id = Column(String(36), ForeignKey("customers.id"), nullable=True)
    sale_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    total_amount = Column(Numeric(14, 2), default=0.0)
    discount_amount = Column(Numeric(14, 2), default=0.0)
    net_amount = Column(Numeric(14, 2), default=0.0)
    payment_method = Column(String(50), default="cash") # cash, card, transfer
    status = Column(String(50), default="completed") # completed, refunded, cancelled
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    customer = relationship("Customer", back_populates="sales")
    items = relationship("SaleItem", back_populates="sale", cascade="all, delete-orphan")

    def to_dict(self, include_items=True):
        res = {
            "id": self.id,
            "sale_number": self.sale_number,
            "customer_id": self.customer_id,
            "customer_name": self.customer.name if self.customer else "Anonim mijoz",
            "sale_date": self.sale_date.isoformat() if self.sale_date else None,
            "total_amount": float(self.total_amount or 0),
            "discount_amount": float(self.discount_amount or 0),
            "net_amount": float(self.net_amount or 0),
            "payment_method": self.payment_method,
            "status": self.status,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
        if include_items:
            res["items"] = [item.to_dict() for item in self.items]
        return res

class SaleItem(Base):
    __tablename__ = "sale_items"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    sale_id = Column(String(36), ForeignKey("sales.id"), nullable=False)
    product_id = Column(String(36), ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, default=1)
    unit_price = Column(Numeric(14, 2), default=0.0)
    total_price = Column(Numeric(14, 2), default=0.0)
    cost_price = Column(Numeric(14, 2), default=0.0)

    sale = relationship("Sale", back_populates="items")
    product = relationship("Product", back_populates="sale_items")

    def to_dict(self):
        return {
            "id": self.id,
            "sale_id": self.sale_id,
            "product_id": self.product_id,
            "product_name": self.product.name if self.product else "Noma'lum mahsulot",
            "quantity": self.quantity,
            "unit_price": float(self.unit_price or 0),
            "total_price": float(self.total_price or 0),
            "cost_price": float(self.cost_price or 0)
        }

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    category = Column(String(100), nullable=False) # Ijara, Oylik, Kommunal, Marketing, Boshqa
    amount = Column(Numeric(14, 2), default=0.0)
    description = Column(Text, nullable=True)
    expense_date = Column(Date, default=date.today, nullable=False)
    payment_method = Column(String(50), default="transfer")
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "category": self.category,
            "amount": float(self.amount or 0),
            "description": self.description,
            "expense_date": self.expense_date.isoformat() if self.expense_date else None,
            "payment_method": self.payment_method,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class InventoryItem(Base):
    __tablename__ = "inventory"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    product_id = Column(String(36), ForeignKey("products.id"), nullable=False, unique=True)
    current_stock = Column(Integer, default=0)
    min_stock_threshold = Column(Integer, default=5)
    location = Column(String(100), default="Asosiy ombor")
    last_updated = Column(DateTime, default=datetime.utcnow)

    product = relationship("Product", back_populates="inventory")

    def to_dict(self):
        return {
            "id": self.id,
            "product_id": self.product_id,
            "product_name": self.product.name if self.product else None,
            "sku": self.product.sku if self.product else None,
            "category_name": self.product.category.name if self.product and self.product.category else None,
            "current_stock": self.current_stock,
            "min_stock_threshold": self.min_stock_threshold,
            "location": self.location,
            "is_low_stock": self.current_stock <= self.min_stock_threshold,
            "last_updated": self.last_updated.isoformat() if self.last_updated else None
        }

class FileRecord(Base):
    __tablename__ = "files"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    original_name = Column(String(255), nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, default=0)
    mime_type = Column(String(100), nullable=True)
    status = Column(String(50), default="ready") # uploaded, processing, ready, error
    extracted_text = Column(Text, nullable=True)
    analysis_data = Column(Text, nullable=True) # JSON string
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "original_name": self.original_name,
            "filename": self.filename,
            "file_size": self.file_size,
            "mime_type": self.mime_type,
            "status": self.status,
            "analysis_data": json.loads(self.analysis_data) if self.analysis_data else None,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(255), default="Yangi muloqot")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan", order_by="Message.created_at")
    artifacts = relationship("Artifact", back_populates="conversation", cascade="all, delete-orphan")

    def to_dict(self, include_messages=False):
        res = {
            "id": self.id,
            "title": self.title,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "message_count": len(self.messages) if self.messages else 0
        }
        if include_messages:
            res["messages"] = [m.to_dict() for m in self.messages]
        return res

class Message(Base):
    __tablename__ = "messages"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    conversation_id = Column(String(36), ForeignKey("conversations.id"), nullable=False)
    role = Column(String(20), nullable=False) # user, assistant, system
    content = Column(Text, nullable=False)
    attachment_ids = Column(Text, nullable=True) # JSON list
    sources = Column(Text, nullable=True) # JSON list
    created_at = Column(DateTime, default=datetime.utcnow)

    conversation = relationship("Conversation", back_populates="messages")
    artifacts = relationship("Artifact", back_populates="message")

    def to_dict(self):
        return {
            "id": self.id,
            "conversation_id": self.conversation_id,
            "role": self.role,
            "content": self.content,
            "attachment_ids": json.loads(self.attachment_ids) if self.attachment_ids else [],
            "sources": json.loads(self.sources) if self.sources else [],
            "artifacts": [a.to_dict() for a in self.artifacts] if self.artifacts else [],
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class Artifact(Base):
    __tablename__ = "artifacts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    conversation_id = Column(String(36), ForeignKey("conversations.id"), nullable=True)
    message_id = Column(String(36), ForeignKey("messages.id"), nullable=True)
    type = Column(String(50), nullable=False) # metric, table, bar_chart, line_chart, pie_chart, markdown, report, document_extract
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    data = Column(Text, nullable=False) # JSON object
    config = Column(Text, nullable=True) # JSON object
    source_ids = Column(Text, nullable=True) # JSON list
    created_at = Column(DateTime, default=datetime.utcnow)

    conversation = relationship("Conversation", back_populates="artifacts")
    message = relationship("Message", back_populates="artifacts")

    def to_dict(self):
        return {
            "id": self.id,
            "conversation_id": self.conversation_id,
            "message_id": self.message_id,
            "type": self.type,
            "title": self.title,
            "description": self.description,
            "data": json.loads(self.data) if self.data else {},
            "config": json.loads(self.config) if self.config else {},
            "source_ids": json.loads(self.source_ids) if self.source_ids else [],
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
