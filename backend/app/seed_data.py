import random
import json
from datetime import datetime, date, timedelta
from decimal import Decimal
from backend.app.extensions import SessionLocal, Base, engine
from backend.app.models import (
    Category, Product, Customer, Sale, SaleItem, Expense, InventoryItem,
    Conversation, Message, Artifact
)

def seed_database(force=False):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if not force and db.query(Product).count() > 0:
            print("Database already seeded.")
            return

        print("Seeding database...")
        # Clear existing
        db.query(Artifact).delete()
        db.query(Message).delete()
        db.query(Conversation).delete()
        db.query(SaleItem).delete()
        db.query(Sale).delete()
        db.query(InventoryItem).delete()
        db.query(Product).delete()
        db.query(Category).delete()
        db.query(Customer).delete()
        db.query(Expense).delete()
        db.commit()

        # 1. Categories
        categories_data = [
            ("Smartfonlar", "Eng so'nggi rusumdagi smartfon va telefonlar"),
            ("Noutbuklar va Kompyuterlar", "Biznes va dasturlash uchun noutbuklar"),
            ("Aksessuarlar", "Garnitura, zaryadlovchi va kabellar"),
            ("Ofis texnikasi", "Monitorlar, klaviaturalar va routerlar"),
            ("Aqlli uy jihozlari", "Kamera, sensorlar va aqlli chiroqlar"),
        ]
        categories = []
        for name, desc in categories_data:
            cat = Category(name=name, description=desc)
            db.add(cat)
            categories.append(cat)
        db.commit()

        # 2. Products
        products_data = [
            ("iPhone 15 Pro 128GB", "IPH-15P-128", categories[0], 12000000, 14500000, 18),
            ("Samsung Galaxy S24 Ultra", "SAM-S24U", categories[0], 13000000, 15800000, 12),
            ("Xiaomi Redmi Note 13 Pro", "XIA-RN13P", categories[0], 2800000, 3600000, 35),
            ("MacBook Air 13 M2 256GB", "MAC-A-M2", categories[1], 11500000, 13800000, 10),
            ("Lenovo ThinkPad E14 Gen 5", "LEN-TP-E14", categories[1], 7500000, 9200000, 8),
            ("Asus ROG Zephyrus G16", "ASU-ROG-G16", categories[1], 17000000, 20500000, 4),
            ("AirPods Pro 2 (USB-C)", "APP-PRO2", categories[2], 2200000, 2800000, 25),
            ("Baseus 65W GaN Quvvatlagich", "BAS-65W", categories[2], 220000, 350000, 60),
            ("Ugreen 10-in-1 Type-C Hub", "UGR-HUB10", categories[2], 380000, 580000, 30),
            ("Dell 27 2K IPS Monitor (S2722DC)", "DEL-27-2K", categories[3], 2700000, 3450000, 7),
            ("Keychron K2 Pro Simsiz Klaviatura", "KEY-K2-PRO", categories[3], 850000, 1250000, 15),
            ("Logitech MX Master 3S Sichqoncha", "LOG-MX-M3S", categories[3], 900000, 1300000, 14),
            ("TP-Link Archer AX73 Wi-Fi 6 Router", "TPL-AX73", categories[3], 780000, 1100000, 16),
            ("Xiaomi Smart Camera C400 2.5K", "XIA-CAM-C400", categories[4], 380000, 550000, 22),
            ("Aqara Smart Hub M2", "AQA-HUB-M2", categories[4], 520000, 740000, 3), # Low stock!
        ]

        products = []
        for name, sku, cat, cost, sell, stock in products_data:
            p = Product(
                name=name,
                sku=sku,
                category_id=cat.id,
                cost_price=Decimal(cost),
                selling_price=Decimal(sell),
                stock_quantity=stock,
                unit="dona",
                is_active=True
            )
            db.add(p)
            products.append(p)
        db.commit()

        # 3. Inventory Items
        for p in products:
            inv = InventoryItem(
                product_id=p.id,
                current_stock=p.stock_quantity,
                min_stock_threshold=5,
                location="Asosiy ombor (Toshkent)",
                last_updated=datetime.utcnow()
            )
            db.add(inv)
        db.commit()

        # 4. Customers
        customers_data = [
            ("Alisher Usmonov", "+998 90 123 45 67", "alisher@gmail.com", "Toshkent sh., Yunusobod t."),
            ("Dilnoza Karimova", "+998 93 345 67 89", "dilnoza.k@mail.ru", "Toshkent sh., Mirzo Ulug'bek t."),
            ("Javohir Rahimov", "+998 97 789 12 34", "jrahimov@inbox.uz", "Samarqand sh., Registon k."),
            ("Shaxzoda Rustamova", "+998 99 876 54 32", "shaxzoda@itpark.uz", "Toshkent sh., Chilonzor t."),
            ("Bobur Mirzayev", "+998 91 555 44 33", "bobur_m@gmail.com", "Farg'ona sh., Mustaqillik sh."),
            ("Kamola Sobirova", "+998 90 999 88 77", "kamola.s@yahoo.com", "Buxoro sh., Bahouddin Naqshband k."),
            ("Umidjon Qodirov", "+998 94 432 10 98", "umid_q@gmail.com", "Toshkent sh., Shayxontohur t."),
            ("Malika Azimova", "+998 98 111 22 33", "malika.a@outlook.com", "Andijon sh., Amir Temur shox k."),
        ]
        customers = []
        for name, phone, email, addr in customers_data:
            c = Customer(name=name, phone=phone, email=email, address=addr)
            db.add(c)
            customers.append(c)
        db.commit()

        # 5. Sales & Sale Items for the last 60 days
        random.seed(42)
        today = date.today()
        sale_idx = 1001

        payment_methods = ["cash", "card", "transfer"]
        
        for day_offset in range(59, -1, -1):
            curr_day = today - timedelta(days=day_offset)
            # Sales count per day: 3 to 7
            daily_orders_count = random.randint(3, 7)
            if curr_day.weekday() in [5, 6]: # Weekend boost
                daily_orders_count += random.randint(2, 4)

            for order_i in range(daily_orders_count):
                hour = random.randint(9, 21)
                minute = random.randint(0, 59)
                sale_time = datetime.combine(curr_day, datetime.min.time()).replace(hour=hour, minute=minute)

                customer = random.choice(customers) if random.random() > 0.3 else None
                # Pick 1 to 3 items
                items_count = random.choices([1, 2, 3], weights=[0.6, 0.3, 0.1])[0]
                selected_products = random.sample(products, items_count)

                sale_items = []
                total_sale = Decimal(0)

                for prod in selected_products:
                    qty = 1 if float(prod.selling_price) > 5000000 else random.randint(1, 3)
                    unit_pr = prod.selling_price
                    tot_pr = unit_pr * qty
                    c_pr = prod.cost_price * qty
                    total_sale += tot_pr

                    item = SaleItem(
                        product_id=prod.id,
                        quantity=qty,
                        unit_price=unit_pr,
                        total_price=tot_pr,
                        cost_price=c_pr
                    )
                    sale_items.append(item)

                discount = Decimal(0)
                if total_sale > 10000000 and random.random() < 0.25:
                    discount = Decimal(random.choice([100000, 200000, 300000, 500000]))
                net_sale = max(Decimal(0), total_sale - discount)

                status = "completed"
                # Rare refund/cancellation
                if random.random() < 0.03:
                    status = "refunded" if random.random() < 0.6 else "cancelled"

                sale = Sale(
                    sale_number=f"SO-2026-{sale_idx}",
                    customer_id=customer.id if customer else None,
                    sale_date=sale_time,
                    total_amount=total_sale,
                    discount_amount=discount,
                    net_amount=net_sale,
                    payment_method=random.choice(payment_methods),
                    status=status,
                    notes="Mijoz do'kondan olib ketdi" if random.random() > 0.4 else "Yetkazib berish bilan",
                    items=sale_items
                )
                db.add(sale)
                sale_idx += 1
        db.commit()

        # 6. Expenses for 2 months
        expense_templates = [
            ("Do'kon va ofis ijarasi", "Ijara", 15000000, "transfer"),
            ("Xodimlar ish haqi va bonuslar", "Oylik maosh", 24000000, "transfer"),
            ("Elektr energiyasi va kommunal to'lovlar", "Kommunal", 1400000, "transfer"),
            ("Internet va aloqa xizmatlari", "Kommunal", 450000, "transfer"),
            ("Instagram va Telegram target reklamasi", "Marketing", 3500000, "card"),
            ("Do'kon uchun kantselyariya va xo'jalik mollari", "Boshqa", 680000, "cash"),
            ("Kuryerlik va yetkazib berish xarajatlari", "Logistika", 2100000, "card"),
        ]

        # Month 1 expenses
        first_month_date = today - timedelta(days=45)
        for desc, cat, amt, pmethod in expense_templates:
            db.add(Expense(
                category=cat,
                amount=Decimal(amt),
                description=desc,
                expense_date=first_month_date.replace(day=random.randint(5, 25)),
                payment_method=pmethod
            ))

        # Current month expenses
        curr_month_date = today - timedelta(days=10)
        for desc, cat, amt, pmethod in expense_templates:
            # slightly vary amounts
            variation = random.uniform(0.95, 1.08)
            db.add(Expense(
                category=cat,
                amount=Decimal(int(amt * variation)),
                description=desc,
                expense_date=curr_month_date.replace(day=random.randint(1, min(25, today.day))),
                payment_method=pmethod
            ))
        db.commit()

        # 7. Demo Conversation & Artifact
        conv = Conversation(
            id="demo",
            title="Biznes faoliyati va savdo tahlili"
        )
        db.add(conv)
        db.commit()

        msg1 = Message(
            conversation_id=conv.id,
            role="user",
            content="Bugungi va oxirgi oylik savdo hisobotini ko'rsatib bering.",
            attachment_ids="[]",
            sources="[]"
        )
        db.add(msg1)
        db.commit()

        msg2 = Message(
            conversation_id=conv.id,
            role="assistant",
            content=(
                "Assalomu alaykum! Do'koningiz savdo ko'rsatkichlari tahlili tayyor.\n\n"
                "Bugun umumiy tushum yaxshi sur'atda ketmoqda. Smartfonlar va noutbuklar kategoriyasida eng yuqori talab kuzatilmoqda.\n\n"
                "> [!NOTE]\n"
                "> Ushbu hisobot dastlabki operatsion hisob-kitob bo'lib, rasmiy soliq yoki audit hisoboti emas.\n"
            ),
            attachment_ids="[]",
            sources=json.dumps([{"title": "Bito Savdo Reyestri", "url": "/api/v1/sales"}])
        )
        db.add(msg2)
        db.commit()

        # Demo artifact
        art1 = Artifact(
            conversation_id=conv.id,
            message_id=msg2.id,
            type="metric",
            title="Oylik jami tushum",
            description="Oxirgi 30 kunlik operatsion tushum",
            data=json.dumps({
                "value": 184500000,
                "formatted_value": "184,500,000 UZS",
                "change_percent": 14.8,
                "trend": "up",
                "subtitle": "O'tgan davrga nisbatan +14.8% o'sish"
            }),
            config=json.dumps({"currency": "UZS"}),
            source_ids=json.dumps(["sales_summary"])
        )
        db.add(art1)
        db.commit()

        print(f"Seeding complete! {len(products)} products, {sale_idx - 1001} sales created.")

    except Exception as e:
        db.rollback()
        print("Error during seeding:", e)
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database(force=True)
