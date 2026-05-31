"""
Integration tests for race endpoints:
  POST /races/entry
  GET  /races
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


RACE_PAYLOAD = {
    "name": "Dubai Marathon",
    "date": "2027-01-31",
    "location": "Dubai, UAE",
    "status": "conditional",
    "notes": "Gate 1 + Gate 2 clearance needed",
}


def _post_race(payload: dict = None) -> dict:
    p = payload or RACE_PAYLOAD
    resp = client.post("/races/entry", json=p)
    assert resp.status_code == 201
    return resp.json()


class TestCreateRace:
    def test_create_returns_201(self):
        response = client.post("/races/entry", json=RACE_PAYLOAD)
        assert response.status_code == 201

    def test_create_returns_correct_fields(self):
        data = _post_race()
        assert data["name"] == "Dubai Marathon"
        assert data["date"] == "2027-01-31"
        assert data["status"] == "conditional"

    def test_create_assigns_id(self):
        data = _post_race()
        assert data["id"] is not None


class TestGetRaces:
    def test_get_races_returns_200(self):
        response = client.get("/races")
        assert response.status_code == 200

    def test_get_races_empty_initially(self):
        response = client.get("/races")
        assert response.json() == []

    def test_get_races_contains_created_race(self):
        entry = _post_race()
        response = client.get("/races")
        ids = [r["id"] for r in response.json()]
        assert entry["id"] in ids

    def test_get_races_sorted_by_date_ascending(self):
        _post_race({**RACE_PAYLOAD, "name": "Copenhagen", "date": "2027-05-09"})
        _post_race({**RACE_PAYLOAD, "name": "Dubai", "date": "2027-01-31"})
        response = client.get("/races")
        dates = [r["date"] for r in response.json()]
        assert dates == sorted(dates)

    def test_race_week_active_false_for_far_future(self):
        entry = _post_race({"name": "Far Future Race", "date": "2028-01-01"})
        response = client.get("/races")
        for r in response.json():
            if r["id"] == entry["id"]:
                assert r["race_week_active"] is False
                break

    def test_race_week_active_true_when_within_7_days(self):
        """A race 3 days from now should have race_week_active = True."""
        soon = (date.today() + timedelta(days=3)).isoformat()
        entry = _post_race({"name": "Imminent Race", "date": soon})
        response = client.get("/races")
        for r in response.json():
            if r["id"] == entry["id"]:
                assert r["race_week_active"] is True
                break

    def test_race_week_active_false_for_past_race(self):
        """A race that already passed should not be in race week."""
        past = (date.today() - timedelta(days=1)).isoformat()
        entry = _post_race({"name": "Past Race", "date": past})
        response = client.get("/races")
        for r in response.json():
            if r["id"] == entry["id"]:
                assert r["race_week_active"] is False
                break
