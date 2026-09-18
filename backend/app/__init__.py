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
        # Automatically seed demo data if in dev or prod and unseeded
        if not app.config.get("TESTING"):
            try:
                from backend.app.services.local_bito import LocalBitoService
                LocalBitoService.seed_demo_data()
            except Exception as e:
                app.logger.warning(f"Seed initialization note: {e}")

    return app

