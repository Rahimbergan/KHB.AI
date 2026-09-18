import os
import sys
from pathlib import Path
import pytest

# Ensure repo and backend root are in python path
backend_dir = Path(__file__).resolve().parent.parent
repo_dir = backend_dir.parent
for p in [str(repo_dir), str(backend_dir)]:
    if p not in sys.path:
        sys.path.insert(0, p)

from backend.app import create_app
from backend.app.config import TestConfig
from backend.app.extensions import db
from backend.app.services.local_bito import LocalBitoService


@pytest.fixture(scope="session")
def app():
    # Use TestConfig with in-memory SQLite database
    app_instance = create_app(config_class=TestConfig)
    
    with app_instance.app_context():
        db.create_all()
        LocalBitoService.seed_demo_data()
        yield app_instance
        db.session.remove()
        db.drop_all()


@pytest.fixture(scope="function")
def client(app):
    return app.test_client()


@pytest.fixture(scope="function")
def db_session(app):
    with app.app_context():
        yield db.session

