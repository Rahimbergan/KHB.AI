import pytest
from datetime import date
from decimal import Decimal
from unittest.mock import patch, MagicMock

from backend.app.services.data_cleaner import DataCleaner
from backend.app.services.regional_analyzer import RegionalAnalyzer
from backend.app.services.agent_orchestrator import AgentOrchestrator
from backend.app.services.telegram_bot import TelegramBotService


# ---------------------------------------------------------------------------
# 1. DataCleaner Tests
# ---------------------------------------------------------------------------

def test_clean_phone_valid():
    """Verify phone normalization for various valid Uzbek mobile and landline numbers."""
    cases = [
        ("+998901234567", "+998901234567"),
        ("998901234567", "+998901234567"),
        ("901234567", "+998901234567"),
        ("90 123 45 67", "+998901234567"),
        ("+998 (93) 123-45-67", "+998931234567"),
        ("8 94 123 45 67", "+998941234567"),
        ("+998 71 200 00 00", "+998712000000"),
        ("33 999 88 77", "+998339998877"),
        ("88 555 44 33", "+998885554433"),
        ("77 111 22 33", "+998771112233"),
    ]
    for raw, expected in cases:
        assert DataCleaner.clean_phone(raw) == expected, f"Failed for raw: {raw}"


def test_clean_phone_invalid():
    """Verify phone normalization handles invalid inputs safely."""
    invalid_cases = [
        "",
        None,
        "not-a-phone",
        "12345",
        "+998123456789",  # Invalid operator prefix 12
        "000000000000",
    ]
    for raw in invalid_cases:
        res = DataCleaner.clean_phone(raw)
        assert res is None or res.startswith("+998")


def test_normalize_region_canonical():
    """Canonical region names should pass through unchanged."""
    for reg in DataCleaner.UZBEKISTAN_REGIONS:
        assert DataCleaner.normalize_region(reg) == reg


def test_normalize_region_aliases():
    """Common aliases and Cyrillic forms must resolve to canonical regions."""
    alias_tests = [
        ("Tashkent", "Toshkent shahri"),
        ("Ташкент", "Toshkent shahri"),
        ("Ташкентская область", "Toshkent viloyati"),
        ("Tashkent Region", "Toshkent viloyati"),
        ("Samarkand", "Samarqand viloyati"),
        ("Самарканд", "Samarqand viloyati"),
        ("Samarqand", "Samarqand viloyati"),
        ("Fergana", "Farg'ona viloyati"),
        ("Фергана", "Farg'ona viloyati"),
        ("Fargona", "Farg'ona viloyati"),
        ("Bukhara", "Buxoro viloyati"),
        ("Бухара", "Buxoro viloyati"),
        ("Andijan", "Andijon viloyati"),
        ("Андижан", "Andijon viloyati"),
        ("Namangan", "Namangan viloyati"),
        ("Наманган", "Namangan viloyati"),
        ("Khorezm", "Xorazm viloyati"),
        ("Хорезм", "Xorazm viloyati"),
        ("Qashqadaryo", "Qashqadaryo viloyati"),
        ("Кашкадарья", "Qashqadaryo viloyati"),
        ("Surxondaryo", "Surxondaryo viloyati"),
        ("Karakalpakstan", "Qoraqalpog'iston Respublikasi"),
        ("Каракалпакстан", "Qoraqalpog'iston Respublikasi"),
        ("Nukus", "Qoraqalpog'iston Respublikasi"),
        ("Unknown Place", "Toshkent shahri"),  # Default fallback
        ("", "Toshkent shahri"),
        (None, "Toshkent shahri"),
    ]
    for raw, expected in alias_tests:
        assert DataCleaner.normalize_region(raw) == expected, f"Failed for alias: {raw}"


def test_clean_currency():
    """Verify currency cleaning and decimal conversion."""
    assert DataCleaner.clean_currency("1,250,000 UZS") == Decimal("1250000.00")
    assert DataCleaner.clean_currency("50 000 so'm") == Decimal("50000.00")
    assert DataCleaner.clean_currency("$450.50") == Decimal("450.50")
    assert DataCleaner.clean_currency("-15000") == Decimal("-15000.00")
    assert DataCleaner.clean_currency(Decimal("75000.25")) == Decimal("75000.25")
    assert DataCleaner.clean_currency(None, default=Decimal("0.00")) == Decimal("0.00")
    assert DataCleaner.clean_currency("invalid") == Decimal("0.00")


def test_clean_customer_data():
    """Verify customer dictionary cleansing."""
    raw = {
        "name": "  Alisher   Navoiy  ",
        "phone": "90 123 45 67",
        "email": " ALISHER@gmail.com ",
        "region": "Самарканд",
    }
    cleaned = DataCleaner.clean_customer_data(raw)
    assert cleaned["name"] == "Alisher Navoiy"
    assert cleaned["phone"] == "+998901234567"
    assert cleaned["email"] == "alisher@gmail.com"
    assert cleaned["region"] == "Samarqand viloyati"


# ---------------------------------------------------------------------------
# 2. RegionalAnalyzer & API Endpoint Tests
# ---------------------------------------------------------------------------

def test_regional_analyzer_aggregation(app):
    """RegionalAnalyzer should correctly aggregate sales orders by region."""
    with app.app_context():
        res = RegionalAnalyzer.analyze_regions(date(2026, 1, 1), date(2026, 1, 31))

        assert res["total_revenue"] > 0
        assert res["total_orders"] > 0
        assert res["active_regions_count"] > 0
        assert "uzbek_summary" in res
        assert "O'zbekiston hududlari" in res["uzbek_summary"]
        assert len(res["regions"]) == len(DataCleaner.UZBEKISTAN_REGIONS)

        # Verify active regions have positive revenue and formatted values
        active = [r for r in res["regions"] if r["orders_count"] > 0]
        assert len(active) >= 3
        for r in active:
            assert r["revenue"] > 0
            assert "formatted_revenue" in r
            assert "market_share_percent" in r
            assert r["market_share_percent"] >= 0


def test_regional_analysis_api_endpoint(client):
    """GET /api/v1/analysis/regional should return valid regional metrics."""
    res = client.get("/api/v1/analysis/regional?from=2026-01-01&to=2026-01-31")
    assert res.status_code == 200
    data = res.get_json()

    assert "total_revenue" in data
    assert "formatted_total_revenue" in data
    assert "regions" in data
    assert "uzbek_summary" in data
    assert "active_regions_count" in data


def test_sales_analysis_includes_regional_breakdown(client):
    """POST /api/v1/analysis/sales should include regional_breakdown."""
    payload = {"from": "2026-01-01", "to": "2026-01-31"}
    res = client.post("/api/v1/analysis/sales", json=payload)
    assert res.status_code == 201
    data = res.get_json()

    assert "regional_breakdown" in data
    assert data["regional_breakdown"]["total_orders"] > 0
    assert len(data["regional_breakdown"]["regions"]) > 0


# ---------------------------------------------------------------------------
# 3. Anti-Hallucination Guardrail Tests
# ---------------------------------------------------------------------------

def test_anti_hallucination_guardrail_unseeded_date(app):
    """
    AgentOrchestrator must explicitly refuse to invent figures when queried
    about dates outside the real Bito operational data window.
    """
    with app.app_context():
        orchestrator = AgentOrchestrator()
        # Querying a future date with no records in local Bito DB
        res = orchestrator.process_message(
            conversation_id="test_anti_hallucination",
            user_content="What was the total revenue on 2024-05-15?",
            context={"date": "2024-05-15"},
        )
        content = res["message"]["content"]

        # Must NOT fabricate numbers and must explicitly cite missing data
        assert "no records found in database" in content.lower() or "not invent" in content.lower()
        assert "bito" in content.lower()


def test_anti_hallucination_guardrail_uzbek(app):
    """
    AgentOrchestrator must provide the anti-hallucination notice in Uzbek
    when user queries in Uzbek for non-existent dates.
    """
    with app.app_context():
        orchestrator = AgentOrchestrator()
        res = orchestrator.process_message(
            conversation_id="test_uzbek_anti_hallucination",
            user_content="2024-01-10 sanasidagi savdo hisobotini ko'rsating",
            context={"date": "2024-01-10"},
        )
        content = res["message"]["content"]

        # Must state no records found in Uzbek
        assert "topilmadi" in content or "mavjud emas" in content
        assert "Bito" in content


# ---------------------------------------------------------------------------
# 4. Uzbek Language Intelligence Tests
# ---------------------------------------------------------------------------

def test_is_uzbek_detection():
    """Verify Uzbek language detection on common business prompts."""
    orchestrator = AgentOrchestrator()
    uzbek_prompts = [
        "Bugungi savdo hisoboti qanday?",
        "Nega kecha savdo tushib ketdi?",
        "Viloyatlar bo'yicha savdo qanday?",
        "Eng ko'p sotilgan tovarlar ro'yxati",
        "Hisobotni emailga yuboring",
        "Toshkent shahridagi tushum qancha?",
    ]
    for prompt in uzbek_prompts:
        assert orchestrator._is_uzbek(prompt), f"Failed to detect Uzbek for: {prompt}"

    english_prompts = [
        "Give me today's sales report",
        "Why did sales fall compared with yesterday?",
        "Show my top 5 products",
        "Send email report to manager@khb.uz",
    ]
    for prompt in english_prompts:
        assert not orchestrator._is_uzbek(prompt), f"False positive Uzbek for: {prompt}"


def test_agent_uzbek_sales_report(app):
    """Verify deterministic response in Uzbek for sales report."""
    with app.app_context():
        orchestrator = AgentOrchestrator()
        res = orchestrator.process_message(
            conversation_id="test_uz_sales",
            user_content="Bugungi savdo hisoboti",
            context={"date": "2026-01-31"},
        )
        content = res["message"]["content"]

        assert "kunlik savdo hisoboti" in content.lower()
        assert "umumiy tushum" in content.lower()
        assert "yalpi foyda" in content.lower()
        assert "bito replika bazasi" in content.lower() or "bito" in content.lower()


def test_agent_uzbek_regional_query(app):
    """Verify deterministic response in Uzbek for regional query."""
    with app.app_context():
        orchestrator = AgentOrchestrator()
        res = orchestrator.process_message(
            conversation_id="test_uz_reg",
            user_content="Viloyatlar bo'yicha savdo tahlili qanday?",
            context={"date": "2026-01-31"},
        )
        content = res["message"]["content"]

        assert "o'zbekiston hududlari" in content.lower()
        assert "viloyatlar kesimidagi tushumlar" in content.lower()
        assert "bito" in content.lower()


def test_agent_uzbek_why_sales_dropped(app):
    """Verify deterministic response in Uzbek for comparative trend inquiry."""
    with app.app_context():
        orchestrator = AgentOrchestrator()
        res = orchestrator.process_message(
            conversation_id="test_uz_why",
            user_content="Nega savdo kechagidan tushib ketdi?",
            context={"date": "2026-01-31"},
        )
        content = res["message"]["content"]

        assert "tushum o'zgarishi" in content.lower()
        assert "asosiy omillar" in content.lower()
        assert "tavsiyalar" in content.lower()


# ---------------------------------------------------------------------------
# 5. Telegram Bot Uzbek Commands Tests
# ---------------------------------------------------------------------------

def test_telegram_uzbek_start_command(app):
    """Verify /start command sends bilingual welcome text with Uzbek commands."""
    with patch.object(TelegramBotService, "send_message") as mock_send:
        msg = {
            "chat": {"id": 12345},
            "from": {"username": "rustam", "first_name": "Rustam"},
            "text": "/start",
        }
        TelegramBotService.handle_message(msg, app=app)

        mock_send.assert_called_once()
        sent_text = mock_send.call_args[0][1]
        assert "KHB Smart Retail tizimiga xush kelibsiz" in sent_text
        assert "/hisobot" in sent_text
        assert "/hududlar" in sent_text


def test_telegram_uzbek_hisobot_command(app):
    """Verify /hisobot command formats report in Uzbek."""
    with patch.object(TelegramBotService, "send_message") as mock_send:
        msg = {
            "chat": {"id": 12345},
            "from": {"username": "rustam", "first_name": "Rustam"},
            "text": "/hisobot 2026-01-31",
        }
        TelegramBotService.handle_message(msg, app=app)

        mock_send.assert_called_once()
        sent_text = mock_send.call_args[0][1]
        assert "KHB Savdo va Operatsiyalar Hisoboti" in sent_text or "uchun Savdo Hisoboti" in sent_text
        assert "Umumiy Tushum" in sent_text


def test_telegram_uzbek_hududlar_command(app):
    """Verify /hududlar command sends regional breakdown in Uzbek."""
    with patch.object(TelegramBotService, "send_message") as mock_send:
        msg = {
            "chat": {"id": 12345},
            "from": {"username": "rustam", "first_name": "Rustam"},
            "text": "/hududlar",
        }
        TelegramBotService.handle_message(msg, app=app)

        mock_send.assert_called_once()
        sent_text = mock_send.call_args[0][1]
        assert "O'zbekiston Hududlari Bo'yicha Savdo Tahlili" in sent_text
        assert "Hududlar reytingi" in sent_text
