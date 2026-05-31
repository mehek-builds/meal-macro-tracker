"""
Integration tests for supplement endpoints:
  GET  /supplements/today
  POST /supplements/log
  POST /supplements/log — conflict path (Vitamin D3 then iron within 2 hours)
  PUT  /supplements/{id}/retest
"""

import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timedelta, timezone

import app.store as store
from app.main import app
from app.services.supplements import PROTOCOL

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_store():
    store.clear_all()
    yield
    store.clear_all()


def _get_supplement_id(name: str) -> str:
    """Seed defaults and return the store id of the named supplement."""
    # GET /supplements/today triggers _ensure_defaults
    client.get("/supplements/today")
    all_defs = store.list_all("supplement_defs")
    for d in all_defs:
        if d["name"] == name:
            return d["id"]
    raise ValueError(f"Supplement '{name}' not found in seeded definitions")


class TestGetTodaySupplements:
    def test_today_returns_200(self):
        response = client.get("/supplements/today")
        assert response.status_code == 200

    def test_today_returns_list(self):
        response = client.get("/supplements/today")
        data = response.json()
        assert isinstance(data, list)

    def test_today_seeds_all_protocol_supplements(self):
        response = client.get("/supplements/today")
        names = {item["name"] for item in response.json()}
        protocol_names = {p["name"] for p in PROTOCOL}
        assert protocol_names == names

    def test_today_initially_none_taken(self):
        response = client.get("/supplements/today")
        for item in response.json():
            assert item["taken_today"] is False
            assert item["taken_at"] is None


class TestLogSupplement:
    def test_log_returns_201(self):
        d3_id = _get_supplement_id("vitamin_d3")
        taken_at = "2026-06-01T13:00:00+00:00"
        response = client.post("/supplements/log", json={
            "supplement_id": d3_id,
            "taken_at": taken_at,
        })
        assert response.status_code == 201

    def test_log_returns_entry_and_conflicts(self):
        d3_id = _get_supplement_id("vitamin_d3")
        taken_at = "2026-06-01T13:00:00+00:00"
        response = client.post("/supplements/log", json={
            "supplement_id": d3_id,
            "taken_at": taken_at,
        })
        data = response.json()
        assert "entry" in data
        assert "conflicts" in data
        assert isinstance(data["conflicts"], list)

    def test_log_no_conflict_when_first_entry(self):
        d3_id = _get_supplement_id("vitamin_d3")
        taken_at = "2026-06-01T13:00:00+00:00"
        response = client.post("/supplements/log", json={
            "supplement_id": d3_id,
            "taken_at": taken_at,
        })
        data = response.json()
        assert data["conflicts"] == []

    def test_log_nonexistent_supplement_returns_404(self):
        response = client.post("/supplements/log", json={
            "supplement_id": "does-not-exist",
            "taken_at": "2026-06-01T13:00:00+00:00",
        })
        assert response.status_code == 404

    def test_supplement_marked_taken_after_log(self):
        d3_id = _get_supplement_id("vitamin_d3")
        taken_at = "2026-06-01T13:00:00+00:00"
        # Manually set today's date in the taken_at so /today endpoint checks match
        # We use today's actual date so the filter picks it up
        today = datetime.now(timezone.utc).date().isoformat()
        taken_at_today = f"{today}T13:00:00+00:00"
        client.post("/supplements/log", json={
            "supplement_id": d3_id,
            "taken_at": taken_at_today,
        })
        today_resp = client.get("/supplements/today")
        for item in today_resp.json():
            if item["id"] == d3_id:
                assert item["taken_today"] is True
                break


class TestSupplementConflict:
    """
    Core conflict path: log Vitamin D3, then log iron within 2 hours.
    The response for the iron log must contain a non-empty conflicts list.
    """

    def test_iron_within_2h_of_d3_returns_conflict(self):
        d3_id = _get_supplement_id("vitamin_d3")
        iron_id = _get_supplement_id("iron")

        d3_time = "2026-06-01T13:30:00+00:00"
        # Iron logged 1 hour after D3 — within the 2h conflict window
        iron_time = "2026-06-01T14:30:00+00:00"

        client.post("/supplements/log", json={
            "supplement_id": d3_id,
            "taken_at": d3_time,
        })

        iron_resp = client.post("/supplements/log", json={
            "supplement_id": iron_id,
            "taken_at": iron_time,
        })

        assert iron_resp.status_code == 201
        data = iron_resp.json()
        assert len(data["conflicts"]) >= 1
        assert "Iron" in data["conflicts"][0] or "iron" in data["conflicts"][0].lower()

    def test_iron_within_2h_of_d3_returns_next_safe_time(self):
        d3_id = _get_supplement_id("vitamin_d3")
        iron_id = _get_supplement_id("iron")

        d3_time = "2026-06-01T13:30:00+00:00"
        iron_time = "2026-06-01T14:30:00+00:00"

        client.post("/supplements/log", json={
            "supplement_id": d3_id,
            "taken_at": d3_time,
        })

        iron_resp = client.post("/supplements/log", json={
            "supplement_id": iron_id,
            "taken_at": iron_time,
        })

        data = iron_resp.json()
        # next_safe_time should be D3 time + 2h = 15:30
        assert data["next_safe_time"] is not None
        safe_dt = datetime.fromisoformat(data["next_safe_time"])
        expected_safe = datetime.fromisoformat("2026-06-01T13:30:00+00:00") + timedelta(hours=2)
        assert safe_dt == expected_safe

    def test_iron_after_2h_of_d3_no_conflict(self):
        d3_id = _get_supplement_id("vitamin_d3")
        iron_id = _get_supplement_id("iron")

        d3_time = "2026-06-01T13:30:00+00:00"
        # Iron logged exactly 2 hours after D3 — boundary, no conflict
        iron_time = "2026-06-01T15:30:00+00:00"

        client.post("/supplements/log", json={
            "supplement_id": d3_id,
            "taken_at": d3_time,
        })

        iron_resp = client.post("/supplements/log", json={
            "supplement_id": iron_id,
            "taken_at": iron_time,
        })

        data = iron_resp.json()
        assert data["conflicts"] == []


class TestUpdateRetestDate:
    def test_retest_update_returns_200(self):
        d3_id = _get_supplement_id("vitamin_d3")
        response = client.put(f"/supplements/{d3_id}/retest", json={
            "retest_date": "2026-07-15",
            "notes": "Check if D levels normalized",
        })
        assert response.status_code == 200

    def test_retest_update_returns_correct_data(self):
        d3_id = _get_supplement_id("vitamin_d3")
        response = client.put(f"/supplements/{d3_id}/retest", json={
            "retest_date": "2026-07-15",
            "notes": "Check if D levels normalized",
        })
        data = response.json()
        assert data["retest_date"] == "2026-07-15"
        assert data["id"] == d3_id

    def test_retest_update_nonexistent_returns_404(self):
        response = client.put("/supplements/nonexistent-id/retest", json={
            "retest_date": "2026-07-15",
            "notes": "",
        })
        assert response.status_code == 404
