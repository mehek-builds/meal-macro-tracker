"""
Integration tests for cycle endpoints:
  GET  /cycle/state
  POST /cycle/manual
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


class TestGetCycleState:
    def test_get_state_returns_200(self):
        response = client.get("/cycle/state")
        assert response.status_code == 200

    def test_get_state_has_required_fields(self):
        response = client.get("/cycle/state")
        data = response.json()
        # Response is camelCase (CamelModel).
        assert "cycleDay" in data
        assert "phase" in data
        assert "estimatedCycleLength" in data
        assert "nearOvulation" in data
        assert "lutealCalorieBonus" in data
        assert "lutealProteinBonus" in data

    def test_get_state_no_data_returns_unknown_phase(self):
        response = client.get("/cycle/state")
        data = response.json()
        # Without any stored period starts, phase should be 'unknown'
        assert data["phase"] == "unknown"
        assert data["cycleDay"] == 0


class TestManualCycle:
    def test_manual_cycle_returns_200(self):
        # Use a period start from 10 days ago to get a known cycle day
        period_start = (date.today() - timedelta(days=10)).isoformat()
        response = client.post("/cycle/manual", json={"period_starts": [period_start]})
        assert response.status_code == 200

    def test_manual_cycle_returns_cycle_state(self):
        period_start = (date.today() - timedelta(days=10)).isoformat()
        response = client.post("/cycle/manual", json={"period_starts": [period_start]})
        data = response.json()
        assert "cycleDay" in data
        assert "phase" in data

    def test_manual_cycle_day_matches_days_since_start(self):
        """cycleDay = today - period_start + 1 (1-indexed)."""
        period_start = (date.today() - timedelta(days=9)).isoformat()
        response = client.post("/cycle/manual", json={"period_starts": [period_start]})
        data = response.json()
        # 9 days ago → cycleDay = 10
        assert data["cycleDay"] == 10

    def test_manual_cycle_luteal_phase_detected(self):
        """Day 15 is past estimated ovulation (day 14 for 28-day cycle) → luteal."""
        period_start = (date.today() - timedelta(days=15)).isoformat()
        response = client.post("/cycle/manual", json={"period_starts": [period_start]})
        data = response.json()
        assert data["phase"] == "luteal"
        assert data["lutealCalorieBonus"] > 0

    def test_manual_cycle_follicular_phase_detected(self):
        """Day 5 is before estimated ovulation → follicular."""
        period_start = (date.today() - timedelta(days=4)).isoformat()
        response = client.post("/cycle/manual", json={"period_starts": [period_start]})
        data = response.json()
        assert data["phase"] == "follicular"

    def test_manual_cycle_replaces_previous_entry(self):
        """Calling /cycle/manual twice should replace the first entry, not accumulate."""
        old_start = (date.today() - timedelta(days=20)).isoformat()
        new_start = (date.today() - timedelta(days=5)).isoformat()

        client.post("/cycle/manual", json={"period_starts": [old_start]})
        response = client.post("/cycle/manual", json={"period_starts": [new_start]})

        data = response.json()
        # cycleDay should reflect 5+1=6, not 20+1=21
        assert data["cycleDay"] == 6

    def test_manual_cycle_updates_state_on_get(self):
        period_start = (date.today() - timedelta(days=10)).isoformat()
        client.post("/cycle/manual", json={"period_starts": [period_start]})

        response = client.get("/cycle/state")
        data = response.json()
        assert data["phase"] != "unknown"
        assert data["cycleDay"] > 0
