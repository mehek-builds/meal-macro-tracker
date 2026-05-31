"""
Integration tests for exercise endpoints:
  POST /exercise/entry
  GET  /exercise/day/{date}
  GET  /exercise/summary/{date}
  DELETE /exercise/entry/{id}
"""

import pytest
from fastapi.testclient import TestClient

import app.store as store
from app.main import app

client = TestClient(app)

EXERCISE_DATE = "2026-06-01"

WORKOUT_PAYLOAD = {
    "date": EXERCISE_DATE,
    "type": "Running",
    "duration_minutes": 30,
    "calories_burned": 300,
    "avg_heart_rate": 145,
    "source": "manual",
    "notes": "Morning run",
}


@pytest.fixture(autouse=True)
def reset_store():
    store.clear_all()
    yield
    store.clear_all()


def _post_workout(payload: dict = None) -> dict:
    p = payload or WORKOUT_PAYLOAD
    resp = client.post("/exercise/entry", json=p)
    assert resp.status_code == 201
    return resp.json()


class TestCreateExerciseEntry:
    def test_create_returns_201(self):
        response = client.post("/exercise/entry", json=WORKOUT_PAYLOAD)
        assert response.status_code == 201

    def test_create_returns_correct_fields(self):
        data = _post_workout()
        # Response is camelCase (CamelModel).
        assert data["type"] == "Running"
        assert data["durationMinutes"] == 30
        assert data["date"] == EXERCISE_DATE

    def test_create_assigns_id(self):
        data = _post_workout()
        assert data["id"] is not None

    def test_create_auto_estimates_calories_when_none_provided(self):
        """When calories_burned is omitted and type is in MET table, backend estimates calories."""
        payload = {
            "date": EXERCISE_DATE,
            "type": "Running",
            "duration_minutes": 60,
            "source": "manual",
            "notes": "",
        }
        response = client.post("/exercise/entry", json=payload)
        assert response.status_code == 201
        data = response.json()
        # Should have a non-None caloriesBurned (estimated via MET)
        assert data["caloriesBurned"] is not None
        assert data["caloriesBurned"] > 0


class TestGetExerciseDay:
    def test_get_day_returns_200(self):
        response = client.get(f"/exercise/day/{EXERCISE_DATE}")
        assert response.status_code == 200

    def test_get_day_contains_created_entry(self):
        entry = _post_workout()
        response = client.get(f"/exercise/day/{EXERCISE_DATE}")
        ids = [w["id"] for w in response.json()]
        assert entry["id"] in ids

    def test_get_day_empty_for_different_date(self):
        _post_workout()
        response = client.get("/exercise/day/2026-07-01")
        assert response.json() == []

    def test_get_day_returns_multiple_entries(self):
        _post_workout()
        second = {**WORKOUT_PAYLOAD, "type": "Cycling", "duration_minutes": 45}
        _post_workout(second)
        response = client.get(f"/exercise/day/{EXERCISE_DATE}")
        assert len(response.json()) == 2


class TestGetExerciseSummary:
    def test_summary_returns_200(self):
        response = client.get(f"/exercise/summary/{EXERCISE_DATE}")
        assert response.status_code == 200

    def test_summary_has_required_fields(self):
        response = client.get(f"/exercise/summary/{EXERCISE_DATE}")
        data = response.json()
        # Response is camelCase (CamelModel).
        assert "totalActiveCalories" in data
        assert "totalDurationMinutes" in data
        assert "workouts" in data
        assert "netCalorieResult" in data

    def test_summary_totals_calories_correctly(self):
        _post_workout({"date": EXERCISE_DATE, "type": "Running",
                       "duration_minutes": 30, "calories_burned": 300, "source": "manual"})
        _post_workout({"date": EXERCISE_DATE, "type": "Cycling",
                       "duration_minutes": 45, "calories_burned": 250, "source": "manual"})
        response = client.get(f"/exercise/summary/{EXERCISE_DATE}")
        data = response.json()
        assert data["totalActiveCalories"] == 550
        assert data["totalDurationMinutes"] == 75

    def test_summary_empty_day_returns_zero_calories(self):
        response = client.get(f"/exercise/summary/{EXERCISE_DATE}")
        data = response.json()
        assert data["totalActiveCalories"] == 0
        assert data["totalDurationMinutes"] == 0

    def test_summary_contains_net_calorie_result(self):
        response = client.get(f"/exercise/summary/{EXERCISE_DATE}")
        data = response.json()
        # netCalorieResult is a raw service dict; its inner keys stay snake_case.
        assert data["netCalorieResult"] is not None
        assert isinstance(data["netCalorieResult"], dict)


class TestDeleteExerciseEntry:
    def test_delete_returns_204(self):
        entry = _post_workout()
        response = client.delete(f"/exercise/entry/{entry['id']}")
        assert response.status_code == 204

    def test_deleted_entry_not_in_day_query(self):
        entry = _post_workout()
        client.delete(f"/exercise/entry/{entry['id']}")
        response = client.get(f"/exercise/day/{EXERCISE_DATE}")
        ids = [w["id"] for w in response.json()]
        assert entry["id"] not in ids

    def test_delete_nonexistent_returns_404(self):
        response = client.delete("/exercise/entry/nonexistent-id")
        assert response.status_code == 404
