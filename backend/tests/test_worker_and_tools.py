import pytest
from unittest.mock import patch, MagicMock
from backend.app.services.worker import parse_period, ReportWorker
from backend.app.services.cache_service import cache, InMemoryCache
from backend.app.services.agent_tools import AgentTools
from backend.app.services.email_service import EmailService
from backend.app.services.telegram_bot import TelegramBotService
from backend.app.models import TelegramSubscriber
from backend.app.extensions import db


def test_parse_period():
    assert parse_period("5m") == 300
    assert parse_period("10m") == 600
    assert parse_period("1h") == 3600
    assert parse_period("2h") == 7200
    assert parse_period("30s") == 30
    assert parse_period("1d") == 86400
    assert parse_period("300") == 300
    # Invalid fallback
    assert parse_period("invalid") == 3600
    assert parse_period("") == 3600


def test_cache_service():
    mem = InMemoryCache()
    mem.set("test_k", "val", ttl=10)
    assert mem.get("test_k") == "val"
    assert mem.delete("test_k") is True
    assert mem.get("test_k") is None

    # Global cache instance test
    cache.set_json("unit:test:json", {"status": "ok", "count": 42}, ttl=60)
    data = cache.get_json("unit:test:json")
    assert data is not None
    assert data["status"] == "ok"
    assert data["count"] == 42
    cache.delete("unit:test:json")

    # Operational preload
    cache.preload_operational_data("unit-test-date", {"total_revenue": 50000000}, ttl=60)
    pre = cache.get_preloaded_operational_data("unit-test-date")
    assert pre is not None
    assert pre["total_revenue"] == 50000000
    cache.delete("khb:operational:unit-test-date")
    cache.delete("khb:operational:latest")


def test_agent_tools_schema():
    schemas = AgentTools.get_schemas()
    names = [s["name"] for s in schemas]
    assert "send_email" in names
    assert "get_sales_kpi" in names
    assert "get_top_products" in names


def test_agent_tools_execution(app):
    with app.app_context():
        # KPI tool
        kpi_res = AgentTools.execute("get_sales_kpi", {"date": "2026-01-31"})
        assert kpi_res["tool"] == "get_sales_kpi"
        assert "data" in kpi_res
        assert "total_revenue" in kpi_res["data"]

        # Top products tool
        top_res = AgentTools.execute("get_top_products", {"date": "2026-01-31", "limit": 3})
        assert top_res["tool"] == "get_top_products"
        assert isinstance(top_res["data"], list)

        # Send email without credentials returns graceful status
        email_res = AgentTools.execute("send_email", {
            "to_email": "test@khb.uz",
            "subject": "Test Report",
            "body": "Daily Summary",
        })
        assert email_res["tool"] == "send_email"
        assert "recipients" in email_res


def test_email_service_mock_smtp():
    with patch("smtplib.SMTP") as mock_smtp:
        instance = MagicMock()
        mock_smtp.return_value.__enter__.return_value = instance

        with patch.object(EmailService, "get_smtp_config", return_value={
            "user": "khb@gmail.com",
            "password": "app_password_123",
            "host": "smtp.gmail.com",
            "port": 587,
            "use_tls": True,
            "from": "khb@gmail.com",
            "configured": True,
        }):
            res = EmailService.send_email(
                to_email="manager@khb.uz",
                subject="Operations Report",
                text_content="Here is your report.",
            )
            assert res["success"] is True
            assert res["recipients"] == ["manager@khb.uz"]
            instance.starttls.assert_called_once()
            instance.login.assert_called_once_with("khb@gmail.com", "app_password_123")
            instance.sendmail.assert_called_once()


def test_telegram_subscriber_model(app):
    with app.app_context():
        sub = TelegramSubscriber(
            chat_id="123456789",
            username="khb_owner",
            first_name="Rahim",
            is_active=True,
        )
        db.session.add(sub)
        db.session.commit()

        loaded = TelegramSubscriber.query.filter_by(chat_id="123456789").first()
        assert loaded is not None
        assert loaded.username == "khb_owner"
        d = loaded.to_dict()
        assert d["chat_id"] == "123456789"
        assert d["is_active"] is True


def test_report_worker_single_cycle(app):
    with app.app_context():
        res = ReportWorker.run_single_cycle(app, target_date_str="2026-01-31")
        assert res["target_date"] == "2026-01-31"
        assert res["cached"] is True
        assert "cache_backend" in res

        # Verify Redis/memory cache got preloaded
        preloaded = cache.get_preloaded_operational_data("2026-01-31")
        assert preloaded is not None
        assert "total_revenue" in preloaded
        assert preloaded["total_revenue"] > 0
