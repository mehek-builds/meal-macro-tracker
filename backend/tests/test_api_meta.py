"""
Integration tests for meta endpoints: GET /health and GET /
"""

import pytest
from fastapi.testclient import TestClient

import app.store as store
from app.main import app

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_store():
    store.clear_all()
    yield
    store.clear_all()


class TestHealth:
    def test_health_returns_200(self):
        response = client.get("/health")
        assert response.status_code == 200

    def test_health_returns_status_ok(self):
        response = client.get("/health")
        data = response.json()
        assert data["status"] == "ok"

    def test_health_returns_version(self):
        response = client.get("/health")
        data = response.json()
        assert "version" in data


class TestRoot:
    def test_root_returns_200(self):
        response = client.get("/")
        assert response.status_code == 200

    def test_root_returns_message(self):
        response = client.get("/")
        data = response.json()
        assert "message" in data

    def test_root_returns_docs_link(self):
        response = client.get("/")
        data = response.json()
        assert "docs" in data
