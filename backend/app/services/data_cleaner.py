import re
from decimal import Decimal
from typing import Dict, Any, List, Optional, Tuple


class DataCleaner:
    """
    Data hygiene and cleaning service tailored for Uzbek retail operations.
    Handles phone normalization, regional standardization, currency parsing,
    and anti-anomaly validation.
    """

    # Official 14 administrative divisions of Uzbekistan
    UZBEKISTAN_REGIONS = [
        "Toshkent shahri",
        "Toshkent viloyati",
        "Samarqand viloyati",
        "Farg'ona viloyati",
        "Andijon viloyati",
        "Namangan viloyati",
        "Buxoro viloyati",
        "Qashqadaryo viloyati",
        "Surxondaryo viloyati",
        "Xorazm viloyati",
        "Navoiy viloyati",
        "Jizzax viloyati",
        "Sirdaryo viloyati",
        "Qoraqalpog'iston Respublikasi",
    ]

    # Alias mapping for fuzzy and bilingual (Cyrillic, Russian, English) inputs
    REGION_ALIASES = {
        # Tashkent City
        "toshkent shahri": "Toshkent shahri",
        "tashkent": "Toshkent shahri",
        "tashkent city": "Toshkent shahri",
        "ташкент": "Toshkent shahri",
        "г. ташкент": "Toshkent shahri",
        "город ташкент": "Toshkent shahri",
        "toshkent sh.": "Toshkent shahri",
        "toshkent": "Toshkent shahri",

        # Tashkent Region
        "toshkent viloyati": "Toshkent viloyati",
        "tashkent region": "Toshkent viloyati",
        "ташкентская область": "Toshkent viloyati",
        "toshkent vil.": "Toshkent viloyati",
        "chirchiq": "Toshkent viloyati",
        "olmaliq": "Toshkent viloyati",
        "angren": "Toshkent viloyati",

        # Samarkand
        "samarqand": "Samarqand viloyati",
        "samarqand viloyati": "Samarqand viloyati",
        "samarkand": "Samarqand viloyati",
        "самарканд": "Samarqand viloyati",
        "самаркандская область": "Samarqand viloyati",

        # Fergana
        "farg'ona": "Farg'ona viloyati",
        "fargona": "Farg'ona viloyati",
        "farg'ona viloyati": "Farg'ona viloyati",
        "fergana": "Farg'ona viloyati",
        "фергана": "Farg'ona viloyati",
        "qo'qon": "Farg'ona viloyati",
        "kokand": "Farg'ona viloyati",

        # Andijan
        "andijon": "Andijon viloyati",
        "andijon viloyati": "Andijon viloyati",
        "andijan": "Andijon viloyati",
        "андижан": "Andijon viloyati",
        "asaka": "Andijon viloyati",

        # Namangan
        "namangan": "Namangan viloyati",
        "namangan viloyati": "Namangan viloyati",
        "наманган": "Namangan viloyati",
        "chust": "Namangan viloyati",

        # Bukhara
        "buxoro": "Buxoro viloyati",
        "buxoro viloyati": "Buxoro viloyati",
        "bukhara": "Buxoro viloyati",
        "бухара": "Buxoro viloyati",
        "g'ijduvon": "Buxoro viloyati",

        # Kashkadarya
        "qashqadaryo": "Qashqadaryo viloyati",
        "qashqadaryo viloyati": "Qashqadaryo viloyati",
        "kashkadarya": "Qashqadaryo viloyati",
        "кашкадарья": "Qashqadaryo viloyati",
        "qarshi": "Qashqadaryo viloyati",
        "karshi": "Qashqadaryo viloyati",
        "shahrisabz": "Qashqadaryo viloyati",

        # Surkhandarya
        "surxondaryo": "Surxondaryo viloyati",
        "surxondaryo viloyati": "Surxondaryo viloyati",
        "surkhandarya": "Surxondaryo viloyati",
        "сурхандарья": "Surxondaryo viloyati",
        "termiz": "Surxondaryo viloyati",
        "termez": "Surxondaryo viloyati",

        # Khorezm
        "xorazm": "Xorazm viloyati",
        "xorazm viloyati": "Xorazm viloyati",
        "khorezm": "Xorazm viloyati",
        "хорезм": "Xorazm viloyati",
        "urganch": "Xorazm viloyati",
        "urgench": "Xorazm viloyati",
        "xiva": "Xorazm viloyati",
        "khiva": "Xorazm viloyati",

        # Navoi
        "navoiy": "Navoiy viloyati",
        "navoiy viloyati": "Navoiy viloyati",
        "navoi": "Navoiy viloyati",
        "навои": "Navoiy viloyati",
        "zarafshon": "Navoiy viloyati",

        # Jizzakh
        "jizzax": "Jizzax viloyati",
        "jizzax viloyati": "Jizzax viloyati",
        "jizzakh": "Jizzax viloyati",
        "джизак": "Jizzax viloyati",

        # Sirdaryo
        "sirdaryo": "Sirdaryo viloyati",
        "sirdaryo viloyati": "Sirdaryo viloyati",
        "syrdarya": "Sirdaryo viloyati",
        "сырдарья": "Sirdaryo viloyati",
        "guliston": "Sirdaryo viloyati",

        # Karakalpakstan
        "qoraqalpog'iston": "Qoraqalpog'iston Respublikasi",
        "qoraqalpog'iston respublikasi": "Qoraqalpog'iston Respublikasi",
        "karakalpakstan": "Qoraqalpog'iston Respublikasi",
        "каракалпакстан": "Qoraqalpog'iston Respublikasi",
        "nukus": "Qoraqalpog'iston Respublikasi",
        "нукус": "Qoraqalpog'iston Respublikasi",
    }

    # Valid Uzbekistan mobile operator codes (2 digits)
    UZ_MOBILE_OPERATORS = {"90", "91", "93", "94", "95", "97", "98", "99", "33", "88", "77", "71", "78"}

    @classmethod
    def normalize_region(cls, raw: Optional[str]) -> str:
        """
        Standardizes region strings into official Uzbekistan territorial divisions.
        Defaults to 'Toshkent shahri' if unrecognized or empty.
        """
        if not raw:
            return "Toshkent shahri"

        cleaned = raw.strip().lower()
        cleaned = re.sub(r"['`’ʼ‘]", "'", cleaned)

        # Direct match in alias dictionary
        if cleaned in cls.REGION_ALIASES:
            return cls.REGION_ALIASES[cleaned]

        # Partial token match
        for alias, canonical in cls.REGION_ALIASES.items():
            if alias in cleaned or cleaned in alias:
                return canonical

        return "Toshkent shahri"

    @classmethod
    def clean_phone(cls, raw_phone: Optional[str], format_display: bool = False) -> Optional[str]:
        """
        Cleans and standardizes Uzbek mobile phone numbers.
        Converts inputs like '90 123 45 67', '+998(90)123-45-67' into '+998901234567'
        or formatted '+998 90 123 45 67'.
        Returns None if invalid or empty.
        """
        if not raw_phone:
            return None

        # Extract only digits
        digits = re.sub(r"\D", "", str(raw_phone))
        if not digits:
            return None

        # Handle various input formats
        if len(digits) == 9:
            # 901234567 -> 998901234567
            digits = "998" + digits
        elif len(digits) == 10 and digits.startswith("8"):
            # 8901234567 -> 998901234567
            digits = "998" + digits[1:]
        elif len(digits) == 12 and digits.startswith("998"):
            pass
        else:
            return None

        # Validate operator prefix
        operator_code = digits[3:5]
        if operator_code not in cls.UZ_MOBILE_OPERATORS:
            return None

        if format_display:
            # Format: +998 90 123 45 67
            return f"+{digits[:3]} {digits[3:5]} {digits[5:8]} {digits[8:10]} {digits[10:]}"

        return f"+{digits}"

    @classmethod
    def clean_currency(cls, raw_value: Any, default: Optional[Decimal] = None, allow_negative: bool = True) -> Decimal:
        """
        Sanitizes currency input strings into clean Decimals.
        Handles '1,250,000 UZS', '50 000 so'm', '$450.50', '-15,000'.
        """
        if raw_value is None:
            return default if default is not None else Decimal("0.00")

        if isinstance(raw_value, (int, float, Decimal)):
            val = Decimal(str(raw_value))
            if not allow_negative and val < 0:
                return Decimal("0.00")
            return val.quantize(Decimal("0.01"))

        raw_str = str(raw_value).strip()
        is_negative = raw_str.startswith("-")

        # Strip spaces and currency symbols
        val_str = re.sub(r"[^\d.,]", "", raw_str)
        if not val_str:
            return default if default is not None else Decimal("0.00")

        # Handle separators
        if "," in val_str and "." in val_str:
            if val_str.rfind(",") > val_str.rfind("."):
                val_str = val_str.replace(".", "").replace(",", ".")
            else:
                val_str = val_str.replace(",", "")
        elif "," in val_str:
            if val_str.count(",") > 1:
                val_str = val_str.replace(",", "")
            else:
                parts = val_str.split(",")
                if len(parts[1]) == 3:  # thousands separator: e.g. '250,000'
                    val_str = val_str.replace(",", "")
                else:
                    val_str = val_str.replace(",", ".")
        elif "." in val_str:
            if val_str.count(".") > 1:
                val_str = val_str.replace(".", "")

        try:
            val = Decimal(val_str)
            if is_negative and allow_negative:
                val = -val
            elif not allow_negative and val < 0:
                val = Decimal("0.00")
            return val.quantize(Decimal("0.01"))
        except Exception:
            return default if default is not None else Decimal("0.00")

    @classmethod
    def clean_customer_data(cls, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validates and cleans a customer dictionary before database insertion.
        """
        name = re.sub(r"\s+", " ", str(data.get("name", ""))).strip()
        if not name:
            name = "Mijoz (Noma'lum)"

        phone = cls.clean_phone(data.get("phone", "")) or ""
        email = str(data.get("email", "")).strip().lower() if data.get("email") else None
        if email and "@" not in email:
            email = None

        region = cls.normalize_region(data.get("region"))

        return {
            "name": name,
            "phone": phone,
            "email": email,
            "region": region,
        }

    @classmethod
    def clean_sale_order_payload(cls, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validates order structure, cleans amounts, normalizes region, and recalculates totals.
        """
        customer_name = str(payload.get("customer_name", "")).strip() or "Walk-in Customer"
        region = cls.normalize_region(payload.get("region"))
        status = str(payload.get("status", "completed")).strip().lower()
        if status not in ("completed", "refunded", "cancelled", "pending"):
            status = "completed"

        payment_method = str(payload.get("payment_method", "cash")).strip().lower()
        if payment_method not in ("cash", "card", "payme", "click", "uzum", "bank_transfer"):
            payment_method = "cash"

        items = payload.get("items", [])
        cleaned_items = []
        total_amount = Decimal("0.00")
        total_cost = Decimal("0.00")

        for item in items:
            pname = str(item.get("product_name", "")).strip()
            if not pname:
                continue
            qty = max(1, int(item.get("quantity", 1)))
            u_price = cls.clean_currency(item.get("unit_price", 0))
            u_cost = cls.clean_currency(item.get("unit_cost", 0))

            t_price = u_price * Decimal(str(qty))
            t_cost = u_cost * Decimal(str(qty))

            total_amount += t_price
            total_cost += t_cost

            cleaned_items.append({
                "product_id": item.get("product_id"),
                "product_name": pname,
                "category": str(item.get("category", "General")).strip(),
                "quantity": qty,
                "unit_price": float(u_price),
                "unit_cost": float(u_cost),
                "total_price": float(t_price),
                "total_cost": float(t_cost),
            })

        return {
            "order_number": str(payload.get("order_number", "")).strip(),
            "customer_name": customer_name,
            "region": region,
            "status": status,
            "payment_method": payment_method,
            "total_amount": float(total_amount),
            "total_cost": float(total_cost),
            "items": cleaned_items,
            "notes": str(payload.get("notes", "")).strip() if payload.get("notes") else None,
        }

    @classmethod
    def clean_batch_records(cls, rows: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Deduplicates and cleans imported or uploaded data rows.
        """
        seen_identifiers = set()
        cleaned_rows = []
        duplicates_count = 0
        corrections_count = 0

        for row in rows:
            # Check identifier (order number or id or product name)
            ident = row.get("order_number") or row.get("id") or row.get("sku") or row.get("name")
            if ident:
                ident_str = str(ident).strip().lower()
                if ident_str in seen_identifiers:
                    duplicates_count += 1
                    continue
                seen_identifiers.add(ident_str)

            cleaned_row = dict(row)
            # Normalize region if present
            if "region" in cleaned_row:
                orig_reg = cleaned_row["region"]
                norm_reg = cls.normalize_region(orig_reg)
                if orig_reg != norm_reg:
                    corrections_count += 1
                cleaned_row["region"] = norm_reg

            # Normalize phone if present
            if "phone" in cleaned_row:
                orig_phone = cleaned_row["phone"]
                norm_phone = cls.clean_phone(orig_phone)
                if orig_phone != norm_phone:
                    corrections_count += 1
                cleaned_row["phone"] = norm_phone

            # Normalize amount/price if present
            for price_key in ["total_amount", "unit_price", "cost_price", "selling_price"]:
                if price_key in cleaned_row:
                    cleaned_row[price_key] = float(cls.clean_currency(cleaned_row[price_key]))

            cleaned_rows.append(cleaned_row)

        return {
            "total_input": len(rows),
            "cleaned_rows": cleaned_rows,
            "duplicates_removed": duplicates_count,
            "corrections_made": corrections_count,
        }
