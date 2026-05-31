"""
Integration tests for user endpoints:
  GET  /user/profile
  PUT  /user/profile
  PUT  /user/net-calorie-mode
  GET  /user/stats
"""

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
        assert "bmr" in targets
        assert "tdee" in targets
        assert "calorie_target" in targets
        assert "protein_g" in targets
        assert "carbs_g" in targets
        assert "fat_g" in targets

    def test_get_profile_bootstraps_defaults_on_first_call(self):
        """Profile should auto-create with sensible defaults on first GET."""
        response = client.get("/user/profile")
        profile = response.json()["profile"]
        assert profile["sex"] == "female"
        assert profile["weight_kg"] == 42.0


class TestUpdateProfile:
    def test_update_profile_returns_200(self):
        # First GET to ensure profile exists
        client.get("/user/profile")
        response = client.put("/user/profile", json=PROFILE_PAYLOAD)
        assert response.status_code == 200

    def test_update_profile_reflects_new_values(self):
        client.get("/user/profile")
        updated = {**PROFILE_PAYLOAD, "weight_kg": 45.0, "age": 21}
        response = client.put("/user/profile", json=updated)
        data = response.json()
        assert data["profile"]["weight_kg"] == 45.0
        assert data["profile"]["age"] == 21

    def test_update_profile_recalculates_targets(self):
        """After updating weight, calorie target should change."""
        client.get("/user/profile")
        resp1 = client.put("/user/profile", json={**PROFILE_PAYLOAD, "weight_kg": 42.0})
        target_before = resp1.json()["targets"]["calorie_target"]

        resp2 = client.put("/user/profile", json={**PROFILE_PAYLOAD, "weight_kg": 55.0})
        target_after = resp2.json()["targets"]["calorie_target"]

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
        assert response.json()["net_calorie_mode"] == "eat_back"

    def test_set_mode_all_valid_modes(self):
        client.get("/user/profile")
        for mode in ("fixed", "eat_back", "net"):
            response = client.put("/user/net-calorie-mode", json={"mode": mode})
            assert response.status_code == 200
            assert response.json()["net_calorie_mode"] == mode

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
        assert "avg_calories" in data
        assert "avg_protein_g" in data
        assert "days_protein_hit" in data
        assert "days_calorie_hit" in data
