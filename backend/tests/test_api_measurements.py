"""
Integration tests for body measurement endpoints:
  POST /measurements/entry
  GET  /measurements/history
"""

import pytest
from fastapi.testclient import TestClient

import app.store as store
from app.main import app

client = TestClient(app)

MEASUREMENT_PAYLOAD = {
    "date": "2026-06-01",
    "upper_arm_cm": 26.5,
    "chest_cm": 82.0,
    "waist_cm": 65.0,
    "hips_cm": 90.0,
    "thigh_cm": 52.0,
    "notes": "Monthly check",
}


@pytest.fixture(autouse=True)
def reset_store():
    store.clear_all()
    yield
    store.clear_all()


def _post_measurement(payload: dict = None) -> dict:
    p = payload or MEASUREMENT_PAYLOAD
    resp = client.post("/measurements/entry", json=p)
    assert resp.status_code == 201
    return resp.json()


class TestCreateMeasurement:
    def test_create_returns_201(self):
        response = client.post("/measurements/entry", json=MEASUREMENT_PAYLOAD)
        assert response.status_code == 201

    def test_create_returns_correct_fields(self):
        data = _post_measurement()
        # Response is camelCase (CamelModel).
        assert data["date"] == "2026-06-01"
        assert data["upperArmCm"] == 26.5
        assert data["waistCm"] == 65.0

    def test_create_assigns_id(self):
        data = _post_measurement()
        assert data["id"] is not None

    def test_create_with_partial_fields(self):
        """Only waist and upper arm provided — others should default to None."""
        payload = {
            "date": "2026-06-15",
            "upper_arm_cm": 27.0,
            "waist_cm": 64.5,
        }
        response = client.post("/measurements/entry", json=payload)
        assert response.status_code == 201
        data = response.json()
        assert data["chestCm"] is None
        assert data["hipsCm"] is None
        assert data["thighCm"] is None


class TestGetMeasurementHistory:
    def test_history_returns_200(self):
        response = client.get("/measurements/history")
        assert response.status_code == 200

    def test_history_empty_initially(self):
        response = client.get("/measurements/history")
        assert response.json() == []

    def test_history_contains_created_entry(self):
        entry = _post_measurement()
        response = client.get("/measurements/history")
        ids = [m["id"] for m in response.json()]
        assert entry["id"] in ids

    def test_history_sorted_by_date_ascending(self):
        _post_measurement({"date": "2026-08-01", "upper_arm_cm": 28.0})
        _post_measurement({"date": "2026-06-01", "upper_arm_cm": 26.5})
        _post_measurement({"date": "2026-07-01", "upper_arm_cm": 27.0})

        response = client.get("/measurements/history")
        dates = [m["date"] for m in response.json()]
        assert dates == sorted(dates)

    def test_history_returns_all_entries(self):
        _post_measurement({"date": "2026-06-01"})
        _post_measurement({"date": "2026-07-01"})
        response = client.get("/measurements/history")
        assert len(response.json()) == 2
