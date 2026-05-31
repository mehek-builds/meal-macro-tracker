"""
Integration tests for water endpoints:
  POST /water/entry
  GET  /water/day/{date}
  DELETE /water/entry/{id}
"""

import pytest
from fastapi.testclient import TestClient

import app.store as store
from app.main import app

client = TestClient(app)

WATER_DATE = "2026-06-01"
WATER_LOGGED_AT = "2026-06-01T08:00:00+00:00"


@pytest.fixture(autouse=True)
def reset_store():
    store.clear_all()
    yield
    store.clear_all()


def _post_water(oz: float, date: str = WATER_DATE) -> dict:
    response = client.post("/water/entry", json={
        "oz": oz,
        "date": date,
        "logged_at": WATER_LOGGED_AT,
    })
    assert response.status_code == 201
    return response.json()


class TestCreateWaterEntry:
    def test_create_returns_201(self):
        response = client.post("/water/entry", json={
            "oz": 16.0,
            "date": WATER_DATE,
            "logged_at": WATER_LOGGED_AT,
        })
        assert response.status_code == 201

    def test_create_returns_oz_and_ml(self):
        entry = _post_water(16.0)
        assert entry["oz"] == 16.0
        # ml is a computed field: 16 * 29.5735 = 473.176
        assert abs(entry["ml"] - 473.2) < 0.5

    def test_create_assigns_id(self):
        entry = _post_water(8.0)
        assert entry["id"] is not None


class TestGetWaterDay:
    def test_get_day_returns_200(self):
        response = client.get(f"/water/day/{WATER_DATE}")
        assert response.status_code == 200

    def test_get_day_contains_logged_entry(self):
        entry = _post_water(16.0)
        summary = client.get(f"/water/day/{WATER_DATE}").json()
        entry_ids = [e["id"] for e in summary["entries"]]
        assert entry["id"] in entry_ids

    def test_get_day_total_oz_is_correct(self):
        _post_water(16.0)
        _post_water(8.0)
        summary = client.get(f"/water/day/{WATER_DATE}").json()
        assert summary["total_oz"] == 24.0

    def test_get_day_remaining_oz_decreases_with_entries(self):
        summary_before = client.get(f"/water/day/{WATER_DATE}").json()
        _post_water(16.0)
        summary_after = client.get(f"/water/day/{WATER_DATE}").json()
        assert summary_after["remaining_oz"] < summary_before["remaining_oz"]

    def test_get_day_has_goal_oz_field(self):
        summary = client.get(f"/water/day/{WATER_DATE}").json()
        assert "goal_oz" in summary
        assert summary["goal_oz"] > 0

    def test_get_day_percent_complete_range(self):
        summary = client.get(f"/water/day/{WATER_DATE}").json()
        assert 0.0 <= summary["percent_complete"] <= 100.0

    def test_get_day_empty_returns_zero_total(self):
        summary = client.get(f"/water/day/{WATER_DATE}").json()
        assert summary["total_oz"] == 0.0
        assert summary["entries"] == []

    def test_get_day_different_date_not_included(self):
        _post_water(16.0, date="2026-06-02")
        summary = client.get(f"/water/day/{WATER_DATE}").json()
        assert summary["total_oz"] == 0.0


class TestDeleteWaterEntry:
    def test_delete_returns_204(self):
        entry = _post_water(16.0)
        response = client.delete(f"/water/entry/{entry['id']}")
        assert response.status_code == 204

    def test_deleted_entry_not_in_summary(self):
        entry = _post_water(16.0)
        client.delete(f"/water/entry/{entry['id']}")
        summary = client.get(f"/water/day/{WATER_DATE}").json()
        entry_ids = [e["id"] for e in summary["entries"]]
        assert entry["id"] not in entry_ids

    def test_delete_nonexistent_returns_404(self):
        response = client.delete("/water/entry/nonexistent-id")
        assert response.status_code == 404
