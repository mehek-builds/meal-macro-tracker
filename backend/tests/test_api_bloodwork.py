"""
Integration tests for bloodwork endpoints:
  POST /bloodwork/entry
  GET  /bloodwork/history
  GET  /bloodwork/retests/upcoming
"""

import pytest
from datetime import date, timedelta
from fastapi.testclient import TestClient

import app.store as store
from app.main import app

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_store():
    store.clear_all()
    yield
    store.clear_all()


def _post_bloodwork(payload: dict) -> dict:
    resp = client.post("/bloodwork/entry", json=payload)
    assert resp.status_code == 201
    return resp.json()


BASE_PAYLOAD = {
    "date": "2026-06-01",
    "marker_name": "Vitamin D (25-OH)",
    "value": 29.2,
    "unit": "ng/mL",
    "ref_range_low": 20.0,
    "ref_range_high": 80.0,
    "status": "low",
    "retest_date": None,
    "notes": "Below optimal range",
}


class TestCreateBloodworkEntry:
    def test_create_returns_201(self):
        response = client.post("/bloodwork/entry", json=BASE_PAYLOAD)
        assert response.status_code == 201

    def test_create_returns_correct_fields(self):
        data = _post_bloodwork(BASE_PAYLOAD)
        assert data["marker_name"] == "Vitamin D (25-OH)"
        assert data["value"] == 29.2
        assert data["status"] == "low"

    def test_create_assigns_id(self):
        data = _post_bloodwork(BASE_PAYLOAD)
        assert data["id"] is not None


class TestGetBloodworkHistory:
    def test_history_returns_200(self):
        response = client.get("/bloodwork/history")
        assert response.status_code == 200

    def test_history_empty_initially(self):
        response = client.get("/bloodwork/history")
        assert response.json() == []

    def test_history_contains_created_entry(self):
        entry = _post_bloodwork(BASE_PAYLOAD)
        response = client.get("/bloodwork/history")
        ids = [r["id"] for r in response.json()]
        assert entry["id"] in ids

    def test_history_sorted_ascending_by_date(self):
        _post_bloodwork({**BASE_PAYLOAD, "date": "2026-09-01"})
        _post_bloodwork({**BASE_PAYLOAD, "date": "2026-06-01"})
        response = client.get("/bloodwork/history")
        dates = [r["date"] for r in response.json()]
        assert dates == sorted(dates)

    def test_history_filtered_by_marker(self):
        _post_bloodwork(BASE_PAYLOAD)
        _post_bloodwork({
            "date": "2026-06-01",
            "marker_name": "Ferritin",
            "value": 32.0,
            "unit": "ng/mL",
            "status": "normal",
        })
        response = client.get("/bloodwork/history", params={"marker": "Ferritin"})
        data = response.json()
        assert all(r["marker_name"] == "Ferritin" for r in data)
        assert len(data) == 1

    def test_history_filter_no_match_returns_empty(self):
        _post_bloodwork(BASE_PAYLOAD)
        response = client.get("/bloodwork/history", params={"marker": "B12"})
        assert response.json() == []


class TestUpcomingRetests:
    def test_upcoming_retests_returns_200(self):
        response = client.get("/bloodwork/retests/upcoming")
        assert response.status_code == 200

    def test_upcoming_retests_empty_initially(self):
        response = client.get("/bloodwork/retests/upcoming")
        assert response.json() == []

    def test_upcoming_retests_includes_near_future_date(self):
        soon = (date.today() + timedelta(days=10)).isoformat()
        entry = _post_bloodwork({**BASE_PAYLOAD, "retest_date": soon})
        response = client.get("/bloodwork/retests/upcoming")
        ids = [r["id"] for r in response.json()]
        assert entry["id"] in ids

    def test_upcoming_retests_excludes_past_date(self):
        past = (date.today() - timedelta(days=5)).isoformat()
        entry = _post_bloodwork({**BASE_PAYLOAD, "retest_date": past})
        response = client.get("/bloodwork/retests/upcoming")
        ids = [r["id"] for r in response.json()]
        assert entry["id"] not in ids

    def test_upcoming_retests_excludes_beyond_30_days(self):
        far = (date.today() + timedelta(days=45)).isoformat()
        entry = _post_bloodwork({**BASE_PAYLOAD, "retest_date": far})
        response = client.get("/bloodwork/retests/upcoming")
        ids = [r["id"] for r in response.json()]
        assert entry["id"] not in ids

    def test_upcoming_retests_excludes_null_retest_date(self):
        entry = _post_bloodwork({**BASE_PAYLOAD, "retest_date": None})
        response = client.get("/bloodwork/retests/upcoming")
        ids = [r["id"] for r in response.json()]
        assert entry["id"] not in ids
