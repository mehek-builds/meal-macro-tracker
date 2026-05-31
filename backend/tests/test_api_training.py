"""
Integration tests for training mode endpoint:
  PUT /training/mode
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


def _bootstrap_profile():
    """Ensure a user profile exists so training/mode doesn't 404."""
    client.get("/user/profile")


class TestSetTrainingMode:
    def test_set_mode_muscle_gain_returns_200(self):
        _bootstrap_profile()
        response = client.put("/training/mode", json={"mode": "muscle_gain"})
        assert response.status_code == 200

    def test_set_mode_marathon_returns_200(self):
        _bootstrap_profile()
        response = client.put("/training/mode", json={"mode": "marathon"})
        assert response.status_code == 200

    def test_set_mode_both_returns_200(self):
        _bootstrap_profile()
        response = client.put("/training/mode", json={"mode": "both"})
        assert response.status_code == 200

    def test_set_mode_returns_training_mode_field(self):
        _bootstrap_profile()
        response = client.put("/training/mode", json={"mode": "marathon"})
        data = response.json()
        assert data["trainingMode"] == "marathon"

    def test_set_mode_all_valid_modes(self):
        _bootstrap_profile()
        for mode in ("muscle_gain", "marathon", "both"):
            response = client.put("/training/mode", json={"mode": mode})
            assert response.status_code == 200
            assert response.json()["trainingMode"] == mode

    def test_set_mode_invalid_returns_422(self):
        _bootstrap_profile()
        response = client.put("/training/mode", json={"mode": "crossfit"})
        assert response.status_code == 422

    def test_set_mode_without_profile_returns_404(self):
        """Without a user profile, endpoint should return 404."""
        response = client.put("/training/mode", json={"mode": "marathon"})
        assert response.status_code == 404
