"""
Integration tests for user endpoints:
  GET  /user/profile
  PUT  /user/profile
  PUT  /user/net-calorie-mode
  GET  /user/stats
"""

from datetime import date, timedelta

import pytest
from fastapi.testclient import TestClient

import app.store as store
from app.main import app

client = TestClient(app)

PROFILE_PAYLOAD = {
    "sex": "female",
    "age": 20,
    "height_cm": 163.0,
    "weight_kg": 42.0,
    "goal": "build_muscle",
    "activity_level": "lightly_active",
    "net_calorie_mode": "fixed",
    "calorie_surplus": 400,
    "dietary_restrictions": [],
    "allergies": [],
    "training_phase": "phase_1",
}


@pytest.fixture(autouse=True)
def reset_store():
    store.clear_all()
    yield
    store.clear_all()


class TestGetProfile:
    def test_get_profile_returns_200(self):
        response = client.get("/user/profile")
        assert response.status_code == 200

    def test_get_profile_has_profile_and_targets(self):
        response = client.get("/user/profile")
        data = response.json()
        assert "profile" in data
        assert "targets" in data

    def test_get_profile_targets_have_calorie_fields(self):
        response = client.get("/user/profile")
        targets = response.json()["targets"]
        # Wire contract is camelCase.
        assert "bmr" in targets
        assert "tdee" in targets
        assert "calories" in targets
        assert "proteinG" in targets
        assert "carbsG" in targets
        assert "fatG" in targets
        # New effective + water fields (PRD Sections 2, 11.4).
        assert "effectiveCalories" in targets
        assert "effectiveProteinG" in targets
        assert "waterGoalOz" in targets

    def test_get_profile_bootstraps_defaults_on_first_call(self):
        """Profile should auto-create with sensible defaults on first GET."""
        response = client.get("/user/profile")
        profile = response.json()["profile"]
        assert profile["sex"] == "female"
        assert profile["weightKg"] == 42.0


class TestUpdateProfile:
    def test_update_profile_returns_200(self):
        # First GET to ensure profile exists
        client.get("/user/profile")
        response = client.put("/user/profile", json=PROFILE_PAYLOAD)
        assert response.status_code == 200

    def test_update_profile_reflects_new_values(self):
        client.get("/user/profile")
        # Request accepts snake_case (populate_by_name); response is camelCase.
        updated = {**PROFILE_PAYLOAD, "weight_kg": 45.0, "age": 21}
        response = client.put("/user/profile", json=updated)
        data = response.json()
        assert data["profile"]["weightKg"] == 45.0
        assert data["profile"]["age"] == 21

    def test_update_profile_recalculates_targets(self):
        """After updating weight, calorie target should change."""
        client.get("/user/profile")
        resp1 = client.put("/user/profile", json={**PROFILE_PAYLOAD, "weight_kg": 42.0})
        target_before = resp1.json()["targets"]["calories"]

        resp2 = client.put("/user/profile", json={**PROFILE_PAYLOAD, "weight_kg": 55.0})
        target_after = resp2.json()["targets"]["calories"]

        # Heavier weight → higher BMR → higher target
        assert target_after > target_before


class TestSetNetCalorieMode:
    def test_set_mode_returns_200(self):
        client.get("/user/profile")
        response = client.put("/user/net-calorie-mode", json={"mode": "eat_back"})
        assert response.status_code == 200

    def test_set_mode_returns_correct_mode(self):
        client.get("/user/profile")
        response = client.put("/user/net-calorie-mode", json={"mode": "eat_back"})
        assert response.json()["netCalorieMode"] == "eat_back"

    def test_set_mode_all_valid_modes(self):
        client.get("/user/profile")
        for mode in ("fixed", "eat_back", "net"):
            response = client.put("/user/net-calorie-mode", json={"mode": mode})
            assert response.status_code == 200
            assert response.json()["netCalorieMode"] == mode

    def test_set_mode_invalid_mode_returns_422(self):
        client.get("/user/profile")
        response = client.put("/user/net-calorie-mode", json={"mode": "invalid_mode"})
        assert response.status_code == 422

    def test_set_mode_without_profile_returns_404(self):
        """When no profile exists (fresh store), 404 is expected."""
        response = client.put("/user/net-calorie-mode", json={"mode": "fixed"})
        assert response.status_code == 404


class TestGetStats:
    def test_stats_returns_200(self):
        response = client.get("/user/stats")
        assert response.status_code == 200

    def test_stats_has_required_fields(self):
        response = client.get("/user/stats")
        data = response.json()
        assert "period" in data
        assert "avgCalories" in data
        assert "avgProteinG" in data
        assert "daysProteinHit" in data
        assert "daysCalorieHit" in data


class TestLutealAdjustment:
    """
    Proves Critical #1 is fixed: apply_luteal is wired into _derive_targets, so a
    luteal-phase last_period_start raises the effective targets (PRD Section 2 / 11.4).
    """

    def _luteal_payload(self) -> dict:
        # Day ~19 of a default 28-day cycle (ovulation ~day 14) → luteal phase.
        luteal_start = (date.today() - timedelta(days=18)).isoformat()
        return {**PROFILE_PAYLOAD, "last_period_start": luteal_start}

    def test_luteal_profile_sets_is_luteal_true(self):
        client.get("/user/profile")
        response = client.put("/user/profile", json=self._luteal_payload())
        targets = response.json()["targets"]
        assert targets["isLuteal"] is True

    def test_luteal_effective_calories_is_base_plus_200(self):
        client.get("/user/profile")
        response = client.put("/user/profile", json=self._luteal_payload())
        targets = response.json()["targets"]
        assert targets["effectiveCalories"] == targets["calories"] + 200
        assert targets["lutealCalorieBonus"] == 200

    def test_luteal_effective_protein_is_base_plus_12(self):
        client.get("/user/profile")
        response = client.put("/user/profile", json=self._luteal_payload())
        targets = response.json()["targets"]
        assert targets["effectiveProteinG"] == targets["proteinG"] + 12
        assert targets["lutealProteinBonus"] == 12

    def test_non_luteal_profile_has_no_bonus(self):
        client.get("/user/profile")
        # Day ~5 → follicular, no adjustment.
        follicular_start = (date.today() - timedelta(days=4)).isoformat()
        payload = {**PROFILE_PAYLOAD, "last_period_start": follicular_start}
        response = client.put("/user/profile", json=payload)
        targets = response.json()["targets"]
        assert targets["isLuteal"] is False
        assert targets["effectiveCalories"] == targets["calories"]
        assert targets["effectiveProteinG"] == targets["proteinG"]

    def test_no_period_start_defaults_to_non_luteal(self):
        client.get("/user/profile")
        response = client.put("/user/profile", json=PROFILE_PAYLOAD)
        targets = response.json()["targets"]
        assert targets["isLuteal"] is False
        assert targets["effectiveCalories"] == targets["calories"]


class TestSetWaterGoal:
    """PUT /user/water-goal accepts a JSON body {oz} (not a query param)."""

    def test_water_goal_body_returns_200(self):
        client.get("/user/profile")
        response = client.put("/user/water-goal", json={"oz": 80.0})
        assert response.status_code == 200

    def test_water_goal_reflected_in_targets(self):
        client.get("/user/profile")
        client.put("/user/water-goal", json={"oz": 80.0})
        targets = client.get("/user/profile").json()["targets"]
        assert targets["waterGoalOz"] == 80.0

    def test_water_goal_without_profile_returns_404(self):
        response = client.put("/user/water-goal", json={"oz": 80.0})
        assert response.status_code == 404
