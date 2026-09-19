from flask import Flask
from backend.app.config import Config
from backend.app.extensions import db, cors
from backend.app.utils.logging import init_logging
from backend.app.utils.errors import register_error_handlers


def create_app(config_class=Config) -> Flask:
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize logging and request ID tracking
    init_logging(app)

    # Initialize extensions
    db.init_app(app)
    cors.init_app(app, resources={r"/*": {"origins": app.config.get("CORS_ORIGINS", "*")}})

    # Register error handlers
    register_error_handlers(app)

    # Register Blueprints
    from backend.app.routes.health import health_bp
    from backend.app.routes.bito_replica import bito_bp
    from backend.app.routes.reports import reports_bp
    from backend.app.routes.analysis import analysis_bp
    from backend.app.routes.conversations import conversations_bp
    from backend.app.routes.files import files_bp
    from backend.app.routes.artifacts import artifacts_bp

    app.register_blueprint(health_bp)
    app.register_blueprint(bito_bp)
    app.register_blueprint(reports_bp)
    app.register_blueprint(analysis_bp)
    app.register_blueprint(conversations_bp)
    app.register_blueprint(files_bp)
    app.register_blueprint(artifacts_bp)

    # Initialize database tables and seed if necessary
    with app.app_context():
        db.create_all()
        _auto_migrate_schema(app)
        # Automatically seed demo data if in dev or prod and unseeded
        if not app.config.get("TESTING"):
            try:
                from backend.app.services.local_bito import LocalBitoService
                LocalBitoService.seed_demo_data()
            except Exception as e:
                app.logger.warning(f"Seed initialization note: {e}")

    return app


def _auto_migrate_schema(app: Flask):
    """
    Safely ensures any added columns in SQLAlchemy models exist in SQLite tables.
    Runs on startup without needing external migration frameworks.
    """
    try:
        from sqlalchemy import text
        with db.engine.connect() as conn:
            tables_res = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table'")).fetchall()
            existing_tables = {t[0] for t in tables_res}

            columns_to_ensure = [
                ("customers", "region", "VARCHAR(128)", "'Toshkent shahri'"),
                ("sale_orders", "region", "VARCHAR(128)", "'Toshkent shahri'"),
            ]

            for table, col_name, col_type, default_val in columns_to_ensure:
                if table in existing_tables:
                    col_info = conn.execute(text(f"PRAGMA table_info({table})")).fetchall()
                    existing_cols = {c[1] for c in col_info}
                    if col_name not in existing_cols:
                        app.logger.info(f"Adding missing column {col_name} to table {table}...")
                        conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col_name} {col_type} DEFAULT {default_val}"))
                        conn.commit()
    except Exception as e:
        app.logger.warning(f"Auto-migration note: {e}")

