import csv
import json
import math
import random
from datetime import date, datetime, time, timedelta, timezone
from decimal import Decimal
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy import or_

from backend.app.extensions import db
from backend.app.models import (
    Product,
    Customer,
    SaleOrder,
    SaleOrderItem,
    Expense,
    InventoryItem,
    Conversation,
    Message,
    Artifact,
    UploadedFile,
)
from backend.app.utils.dates import parse_date
from backend.app.utils.errors import NotFoundError, ValidationError


class LocalBitoService:
    @staticmethod
    def paginate_query(query, page: int = 1, page_size: int = 50) -> Tuple[List[Any], Dict[str, int]]:
        page = max(1, page)
        page_size = max(1, min(1000, page_size))
        total = query.count()
        pages = math.ceil(total / page_size) if total > 0 else 0
        items = query.offset((page - 1) * page_size).limit(page_size).all()
        pagination = {
            "page": page,
            "page_size": page_size,
            "total": total,
            "pages": pages,
        }
        return items, pagination

    @classmethod
    def get_products(
        cls,
        page: int = 1,
        page_size: int = 50,
        search: Optional[str] = None,
        from_date: Optional[str] = None,
        to_date: Optional[str] = None,
    ) -> Dict[str, Any]:
        q = Product.query.filter(Product.is_active == True)
        if search:
            term = f"%{search.strip()}%"
            q = q.filter(or_(Product.name.ilike(term), Product.sku.ilike(term), Product.category.ilike(term)))
        if from_date:
            q = q.filter(Product.created_at >= datetime.combine(parse_date(from_date), time.min))
        if to_date:
            q = q.filter(Product.created_at <= datetime.combine(parse_date(to_date), time.max))

        q = q.order_by(Product.name.asc())
        items, pagination = cls.paginate_query(q, page, page_size)
        return {"data": [item.to_dict() for item in items], "pagination": pagination}

    @classmethod
    def get_product_by_id(cls, product_id: str) -> Dict[str, Any]:
        p = db.session.get(Product, product_id)
        if not p:
            raise NotFoundError(f"Product with id '{product_id}' not found.")
        return p.to_dict()

    @classmethod
    def get_sales(
        cls,
        page: int = 1,
        page_size: int = 50,
        search: Optional[str] = None,
        from_date: Optional[str] = None,
        to_date: Optional[str] = None,
    ) -> Dict[str, Any]:
        q = SaleOrder.query
        if search:
            term = f"%{search.strip()}%"
            q = q.filter(or_(SaleOrder.order_number.ilike(term), SaleOrder.customer_name.ilike(term)))
        if from_date:
            q = q.filter(SaleOrder.order_date >= datetime.combine(parse_date(from_date), time.min))
        if to_date:
            q = q.filter(SaleOrder.order_date <= datetime.combine(parse_date(to_date), time.max))

        q = q.order_by(SaleOrder.order_date.desc())
        items, pagination = cls.paginate_query(q, page, page_size)
        return {"data": [item.to_dict() for item in items], "pagination": pagination}

    @classmethod
    def get_sale_by_id(cls, sale_id: str) -> Dict[str, Any]:
        s = db.session.get(SaleOrder, sale_id)
        if not s:
            raise NotFoundError(f"Sale order with id '{sale_id}' not found.")
        return s.to_dict()

    @classmethod
    def create_sale(cls, payload: Dict[str, Any]) -> Dict[str, Any]:
        items_data = payload.get("items", [])
        if not items_data:
            raise ValidationError("At least one sale item is required.")

        order_date = datetime.now(timezone.utc)
        if payload.get("order_date"):
            try:
                order_date = datetime.fromisoformat(payload["order_date"])
            except Exception:
                order_date = datetime.combine(parse_date(payload["order_date"]), time(12, 0))

        order_number = f"SO-{datetime.now().strftime('%Y%m%d%H%M%S')}-{random.randint(100, 999)}"
        total_amount = Decimal("0.00")
        total_cost = Decimal("0.00")
        order_items = []

        for item_data in items_data:
            p_id = item_data.get("product_id")
            product = db.session.get(Product, p_id) if p_id else None
            
            p_name = item_data.get("product_name") or (product.name if product else "Custom Item")
            cat = product.category if product else "General"
            qty = int(item_data.get("quantity", 1))
            unit_price = Decimal(str(item_data.get("unit_price") or (product.selling_price if product else 0)))
            unit_cost = Decimal(str(product.cost_price if product else unit_price * Decimal("0.7")))
            
            line_price = unit_price * qty
            line_cost = unit_cost * qty
            
            total_amount += line_price
            total_cost += line_cost

            # Decrement inventory if product tracked
            if product:
                product.stock_quantity = max(0, product.stock_quantity - qty)

            order_items.append(
                SaleOrderItem(
                    product_id=p_id,
                    product_name=p_name,
                    category=cat,
                    quantity=qty,
                    unit_price=unit_price,
                    unit_cost=unit_cost,
                    total_price=line_price,
                    total_cost=line_cost,
                )
            )

        discount = Decimal(str(payload.get("discount_amount", 0)))
        final_amount = max(Decimal("0.00"), total_amount - discount)

        order = SaleOrder(
            order_number=order_number,
            order_date=order_date,
            customer_id=payload.get("customer_id"),
            customer_name=payload.get("customer_name", "Walk-in Customer"),
            status=payload.get("status", "completed"),
            total_amount=final_amount,
            total_cost=total_cost,
            discount_amount=discount,
            payment_method=payload.get("payment_method", "cash"),
            notes=payload.get("notes"),
            items=order_items,
        )

        db.session.add(order)

        # Update customer stats if customer provided
        if payload.get("customer_id"):
            c = db.session.get(Customer, payload["customer_id"])
            if c:
                c.total_orders += 1
                c.total_spent = Decimal(str(c.total_spent)) + final_amount

        db.session.commit()
        return order.to_dict()

    @classmethod
    def get_expenses(
        cls,
        page: int = 1,
        page_size: int = 50,
        search: Optional[str] = None,
        from_date: Optional[str] = None,
        to_date: Optional[str] = None,
    ) -> Dict[str, Any]:
        q = Expense.query
        if search:
            term = f"%{search.strip()}%"
            q = q.filter(or_(Expense.description.ilike(term), Expense.category.ilike(term)))
        if from_date:
            q = q.filter(Expense.expense_date >= datetime.combine(parse_date(from_date), time.min))
        if to_date:
            q = q.filter(Expense.expense_date <= datetime.combine(parse_date(to_date), time.max))

        q = q.order_by(Expense.expense_date.desc())
        items, pagination = cls.paginate_query(q, page, page_size)
        return {"data": [item.to_dict() for item in items], "pagination": pagination}

    @classmethod
    def get_inventory(
        cls,
        page: int = 1,
        page_size: int = 50,
        search: Optional[str] = None,
    ) -> Dict[str, Any]:
        q = InventoryItem.query.join(Product)
        if search:
            term = f"%{search.strip()}%"
            q = q.filter(or_(Product.name.ilike(term), Product.sku.ilike(term), Product.category.ilike(term)))

        q = q.order_by(Product.name.asc())
        items, pagination = cls.paginate_query(q, page, page_size)
        return {"data": [item.to_dict() for item in items], "pagination": pagination}

    @classmethod
    def get_customers(
        cls,
        page: int = 1,
        page_size: int = 50,
        search: Optional[str] = None,
    ) -> Dict[str, Any]:
        q = Customer.query
        if search:
            term = f"%{search.strip()}%"
            q = q.filter(or_(Customer.name.ilike(term), Customer.phone.ilike(term), Customer.email.ilike(term)))

        q = q.order_by(Customer.total_spent.desc())
        items, pagination = cls.paginate_query(q, page, page_size)
        return {"data": [item.to_dict() for item in items], "pagination": pagination}

    @classmethod
    def seed_demo_data(cls):
        """
        Seeds deterministic realistic business data for 'KHB Smart Retail'
        spanning December 2025 through January 31, 2026.
        """
        if Product.query.first() is not None:
            return  # Already seeded

        # Set fixed random seed for 100% deterministic seed data
        rng = random.Random(42)

        # 1. Products catalog
        products_info = [
            # Smartphones & Tablets
            ("PRD-IP15", "Apple iPhone 15 128GB Black", "Smartphones & Tablets", 10200000, 12500000, 18, 5),
            ("PRD-S24", "Samsung Galaxy S24 256GB Gray", "Smartphones & Tablets", 9800000, 11900000, 14, 4),
            ("PRD-RN13", "Xiaomi Redmi Note 13 Pro 8/256GB", "Smartphones & Tablets", 2900000, 3600000, 35, 8),
            ("PRD-IPA", "Apple iPad Air 11-inch M2 128GB", "Smartphones & Tablets", 7400000, 8900000, 12, 3),
            ("PRD-TAB9", "Samsung Galaxy Tab A9+ 64GB", "Smartphones & Tablets", 2300000, 2900000, 22, 6),
            # Laptops & Computers
            ("PRD-MBA3", "MacBook Air 13-inch M3 8/256GB", "Laptops & Computers", 12500000, 14800000, 9, 3),
            ("PRD-TPE14", "Lenovo ThinkPad E14 Gen 5 i5/16GB", "Laptops & Computers", 8200000, 9900000, 15, 4),
            ("PRD-ASUS", "ASUS Vivobook 15 OLED R7/16GB", "Laptops & Computers", 6800000, 8200000, 11, 4),
            ("PRD-MON27", "Dell 27-inch 4K UHD Monitor S2722QC", "Laptops & Computers", 4200000, 5100000, 8, 3),
            # Audio & Accessories
            ("PRD-APP2", "Apple AirPods Pro 2 (USB-C)", "Audio & Accessories", 2600000, 3200000, 40, 10),
            ("PRD-MXM3S", "Logitech MX Master 3S Wireless Mouse", "Audio & Accessories", 1100000, 1450000, 28, 5),
            ("PRD-ANK65", "Anker 735 GaN 65W Fast Charger", "Audio & Accessories", 450000, 650000, 60, 15),
            ("PRD-BSPB", "Baseus Blade 20000mAh 100W Power Bank", "Audio & Accessories", 680000, 950000, 32, 8),
            ("PRD-USBC", "Ugreen Braided USB-C to C 100W Cable 2m", "Audio & Accessories", 80000, 140000, 120, 20),
            # Smart Home & Gadgets
            ("PRD-ROBO", "Xiaomi Robot Vacuum S10+", "Smart Home & Gadgets", 3400000, 4200000, 16, 4),
            ("PRD-AW9", "Apple Watch Series 9 45mm Midnight", "Smart Home & Gadgets", 4700000, 5600000, 10, 3),
            ("PRD-BULB", "Yeelight Smart LED Color Bulb 1S", "Smart Home & Gadgets", 150000, 230000, 50, 12),
            ("PRD-CCTV", "Imou Ranger 2 4MP Security Camera", "Smart Home & Gadgets", 380000, 520000, 25, 6),
        ]

        product_entities = []
        for sku, name, cat, cost, price, stock, min_stock in products_info:
            p = Product(
                sku=sku,
                name=name,
                category=cat,
                cost_price=Decimal(str(cost)),
                selling_price=Decimal(str(price)),
                stock_quantity=stock,
                min_stock_level=min_stock,
                unit="pcs",
                is_active=True,
                created_at=datetime(2025, 12, 1, 9, 0, tzinfo=timezone.utc),
            )
            db.session.add(p)
            product_entities.append(p)
            # Add inventory item
            inv = InventoryItem(
                product=p,
                warehouse="Main Tashkent Warehouse",
                quantity=stock,
                reorder_point=min_stock,
                last_restocked_at=datetime(2026, 1, 15, 10, 0, tzinfo=timezone.utc),
            )
            db.session.add(inv)

        db.session.flush()

        # 2. Seed Customers
        customers_data = [
            ("Azizbek Rahimov", "+998901234567", "azizbek@example.uz", "Toshkent shahri"),
            ("Malika Karimova", "+998935551234", "malika.k@example.uz", "Samarqand viloyati"),
            ("Javokhir Aliev", "+998977778899", "javokhir@company.uz", "Farg'ona viloyati"),
            ("Dilnoza Umarova", "+998912223344", "dilnoza.u@gmail.com", "Andijon viloyati"),
            ("Rustam Khasanov", "+998946660011", "rustam.kh@outlook.com", "Buxoro viloyati"),
            ("Nodira Saidova", "+998903332211", "nodira@tashkent.uz", "Toshkent viloyati"),
            ("Bekzod Ergashev", "+998994445566", "bekzod@namangan.uz", "Namangan viloyati"),
            ("Shoira Mahmudova", "+998951112233", "shoira@qarshi.uz", "Qashqadaryo viloyati"),
            ("Otabek Yusupov", "+998982221144", "otabek@urgench.uz", "Xorazm viloyati"),
        ]
        customer_entities = []
        for name, phone, email, reg in customers_data:
            cust = Customer(name=name, phone=phone, email=email, region=reg)
            db.session.add(cust)
            customer_entities.append(cust)

        db.session.flush()

        # 3. Seed Sales Orders (Dec 1, 2025 to Jan 31, 2026)
        payment_methods = ["payme", "click", "card", "cash"]
        regions_pool = [
            "Toshkent shahri", "Toshkent viloyati", "Samarqand viloyati",
            "Farg'ona viloyati", "Andijon viloyati", "Buxoro viloyati",
            "Namangan viloyati", "Qashqadaryo viloyati", "Xorazm viloyati",
            "Navoiy viloyati", "Surxondaryo viloyati", "Jizzax viloyati"
        ]
        regions_weights = [0.40, 0.12, 0.11, 0.08, 0.07, 0.06, 0.05, 0.04, 0.03, 0.02, 0.01, 0.01]

        start_date = date(2025, 12, 1)
        end_date = date(2026, 1, 31)
        total_days = (end_date - start_date).days + 1

        order_seq = 1000
        for day_offset in range(total_days):
            current_day = start_date + timedelta(days=day_offset)
            
            # Jan 31, 2026 target date: generate rich activity (5-8 orders)
            # Normal days: 2-5 orders
            daily_order_count = rng.randint(4, 7) if current_day.month == 1 else rng.randint(2, 5)
            
            for o_idx in range(daily_order_count):
                order_seq += 1
                hour = rng.randint(9, 20)
                minute = rng.randint(0, 59)
                order_time = datetime.combine(current_day, time(hour, minute), tzinfo=timezone.utc)

                # Select customer or walk-in
                cust = rng.choice(customer_entities) if rng.random() > 0.4 else None
                cust_name = cust.name if cust else "Walk-in Customer"
                order_region = cust.region if cust else rng.choices(regions_pool, weights=regions_weights)[0]

                # Pick 1 to 3 items
                num_items = rng.choices([1, 2, 3], weights=[0.55, 0.35, 0.10])[0]
                chosen_products = rng.sample(product_entities, num_items)

                order_items = []
                order_total = Decimal("0.00")
                order_cost = Decimal("0.00")

                for prod in chosen_products:
                    qty = 1 if "Laptop" in prod.category or "Smartphone" in prod.category else rng.randint(1, 3)
                    item_price = prod.selling_price * qty
                    item_cost = prod.cost_price * qty
                    order_total += item_price
                    order_cost += item_cost

                    order_items.append(
                        SaleOrderItem(
                            product_id=prod.id,
                            product_name=prod.name,
                            category=prod.category,
                            quantity=qty,
                            unit_price=prod.selling_price,
                            unit_cost=prod.cost_price,
                            total_price=item_price,
                            total_cost=item_cost,
                        )
                    )

                # Occasionally refund or cancel
                status = "completed"
                if rng.random() < 0.04 and current_day < date(2026, 1, 28):
                    status = "refunded"
                elif rng.random() < 0.02 and current_day < date(2026, 1, 28):
                    status = "cancelled"

                order = SaleOrder(
                    order_number=f"SO-2026-{order_seq}",
                    order_date=order_time,
                    customer_id=cust.id if cust else None,
                    customer_name=cust_name,
                    region=order_region,
                    status=status,
                    total_amount=order_total,
                    total_cost=order_cost,
                    discount_amount=Decimal("0.00"),
                    payment_method=rng.choice(payment_methods),
                    items=order_items,
                    created_at=order_time,
                )
                db.session.add(order)

                if cust and status == "completed":
                    cust.total_orders += 1
                    cust.total_spent = Decimal(str(cust.total_spent)) + order_total

        # 4. Seed Expenses (Rent, Salaries, Utilities, Marketing, Supplies)
        expenses_data = [
            # December 2025
            (date(2025, 12, 1), "rent", 18000000, "Monthly Store Lease - Tashkent City Mall", "bank_transfer"),
            (date(2025, 12, 5), "salaries", 24000000, "Store Sales Staff & Cashier Payroll (4 persons)", "bank_transfer"),
            (date(2025, 12, 10), "utilities", 2400000, "Electricity, Heating & High-Speed Internet", "bank_transfer"),
            (date(2025, 12, 15), "marketing", 6500000, "Instagram & Telegram Ads Campaign", "card"),
            (date(2025, 12, 20), "supplies", 1200000, "Packaging boxes, thermal receipt paper & bags", "cash"),
            # January 2026
            (date(2026, 1, 2), "rent", 18000000, "Monthly Store Lease - Tashkent City Mall", "bank_transfer"),
            (date(2026, 1, 5), "salaries", 25000000, "Store Sales Staff & Cashier Payroll (4 persons)", "bank_transfer"),
            (date(2026, 1, 10), "utilities", 2600000, "Electricity, Heating & High-Speed Internet", "bank_transfer"),
            (date(2026, 1, 14), "marketing", 8000000, "Winter Sale Promo & Influencer Sponsorship", "card"),
            (date(2026, 1, 22), "supplies", 1500000, "Branded shopping bags and retail accessories", "cash"),
            (date(2026, 1, 30), "marketing", 3500000, "End-of-month flash campaign", "card"),
        ]

        for exp_d, cat, amt, desc, pm in expenses_data:
            exp = Expense(
                expense_date=datetime.combine(exp_d, time(10, 0), tzinfo=timezone.utc),
                category=cat,
                amount=Decimal(str(amt)),
                description=desc,
                payment_method=pm,
            )
            db.session.add(exp)

        # 5. Seed Demo Conversation
        demo_conv = Conversation(
            id="demo",
            title="KHB Business Advisory Session",
            created_at=datetime(2026, 1, 31, 10, 0, tzinfo=timezone.utc),
            updated_at=datetime(2026, 1, 31, 10, 30, tzinfo=timezone.utc),
        )
        db.session.add(demo_conv)

        # 6. Seed Sample Uploaded Documents in DB & uploads/
        sample_doc_content = """COMMERCIAL LEASE AGREEMENT
Landlord: Tashkent Mall Properties LLC
Tenant: KHB Smart Retail LLC
Effective Date: 2026-01-01
Expiration Date: 2027-01-01
Premises: Retail Unit 14B, Floor 1, Amir Timur Avenue, Tashkent

1. RENT AND PAYMENTS
1.1 The Tenant shall pay a monthly base rent of 18,000,000 UZS.
1.2 Rent must be paid no later than the 5th day of each calendar month.
1.3 In the event of late payment, a penalty of 0.5% per day shall apply to the overdue amount.

2. OBLIGATIONS AND COVENANTS
2.1 Tenant agrees to maintain valid comprehensive property insurance at all times.
2.2 Landlord is responsible for structural repairs and central HVAC maintenance.
2.3 Tenant shall not sublease the premises without prior written consent from Landlord.

3. TERMINATION AND LIABILITY
3.1 Either party may terminate with 60 days advance written notice.
3.2 In case of material breach, termination may occur within 14 days of default notice."""

        sample_file = UploadedFile(
            id="sample-lease-agreement",
            filename="commercial_lease_agreement_2026.txt",
            stored_filename="commercial_lease_agreement_2026.txt",
            file_type="txt",
            file_size=len(sample_doc_content.encode("utf-8")),
            extracted_text=sample_doc_content,
            extracted_metadata_json=json.dumps({"type": "txt", "pages": 1}),
        )
        db.session.add(sample_file)

        db.session.commit()
