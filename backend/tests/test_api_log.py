"""
Integration tests for food log endpoints:
  POST /log/entry
  GET  /log/day/{date}
  PUT  /log/entry/{id}
  DELETE /log/entry/{id}
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


# Wire contract is camelCase with a nested `item` (NutritionItem).
ENTRY_PAYLOAD = {
    "date": "2026-06-01",
    "meal": "breakfast",
    "source": "photo_scan",
    "item": {
        "foodName": "Oatmeal",
        "portionDescription": "1 bowl",
        "weightGrams": 100.0,
        "calories": 350.0,
        "proteinG": 12.0,
        "carbsG": 60.0,
        "fatG": 7.0,
        "confidence": 0.9,
    },
}


class TestCreateLogEntry:
    def test_create_entry_returns_201(self):
        response = client.post("/log/entry", json=ENTRY_PAYLOAD)
        assert response.status_code == 201

    def test_create_entry_returns_body(self):
        response = client.post("/log/entry", json=ENTRY_PAYLOAD)
        data = response.json()
        assert data["item"]["foodName"] == "Oatmeal"
        assert data["item"]["calories"] == 350.0
        assert data["date"] == "2026-06-01"
        assert data["source"] == "photo_scan"

    def test_create_entry_assigns_id(self):
        response = client.post("/log/entry", json=ENTRY_PAYLOAD)
        data = response.json()
        assert data["id"] is not None
        assert isinstance(data["id"], str)


class TestGetLogDay:
    def test_get_day_returns_created_entry(self):
        post_resp = client.post("/log/entry", json=ENTRY_PAYLOAD)
        entry_id = post_resp.json()["id"]

        get_resp = client.get("/log/day/2026-06-01")
        assert get_resp.status_code == 200
        ids = [e["id"] for e in get_resp.json()]
        assert entry_id in ids

    def test_get_day_returns_empty_for_different_date(self):
        client.post("/log/entry", json=ENTRY_PAYLOAD)
        response = client.get("/log/day/2026-07-01")
        assert response.status_code == 200
        assert response.json() == []

    def test_get_day_returns_multiple_entries(self):
        payload2 = {
            **ENTRY_PAYLOAD,
            "meal": "lunch",
            "item": {**ENTRY_PAYLOAD["item"], "foodName": "Chicken"},
        }
        client.post("/log/entry", json=ENTRY_PAYLOAD)
        client.post("/log/entry", json=payload2)

        response = client.get("/log/day/2026-06-01")
        assert len(response.json()) == 2


class TestUpdateLogEntry:
    def test_update_entry_returns_200(self):
        post_resp = client.post("/log/entry", json=ENTRY_PAYLOAD)
        entry_id = post_resp.json()["id"]

        updated_payload = {
            **ENTRY_PAYLOAD,
            "id": entry_id,
            "item": {**ENTRY_PAYLOAD["item"], "foodName": "Porridge", "calories": 400.0},
        }
        put_resp = client.put(f"/log/entry/{entry_id}", json=updated_payload)
        assert put_resp.status_code == 200

    def test_update_entry_reflects_new_values(self):
        post_resp = client.post("/log/entry", json=ENTRY_PAYLOAD)
        entry_id = post_resp.json()["id"]

        updated_payload = {
            **ENTRY_PAYLOAD,
            "id": entry_id,
            "item": {**ENTRY_PAYLOAD["item"], "foodName": "Porridge", "calories": 400.0},
        }
        put_resp = client.put(f"/log/entry/{entry_id}", json=updated_payload)
        data = put_resp.json()
        assert data["item"]["foodName"] == "Porridge"
        assert data["item"]["calories"] == 400.0

    def test_update_nonexistent_entry_returns_404(self):
        updated_payload = {
            **ENTRY_PAYLOAD,
            "item": {**ENTRY_PAYLOAD["item"], "foodName": "Ghost Food"},
        }
        response = client.put("/log/entry/nonexistent-id", json=updated_payload)
        assert response.status_code == 404


class TestDeleteLogEntry:
    def test_delete_entry_returns_204(self):
        post_resp = client.post("/log/entry", json=ENTRY_PAYLOAD)
        entry_id = post_resp.json()["id"]

        del_resp = client.delete(f"/log/entry/{entry_id}")
        assert del_resp.status_code == 204

    def test_deleted_entry_absent_from_day_query(self):
        post_resp = client.post("/log/entry", json=ENTRY_PAYLOAD)
        entry_id = post_resp.json()["id"]

        client.delete(f"/log/entry/{entry_id}")
        get_resp = client.get("/log/day/2026-06-01")
        ids = [e["id"] for e in get_resp.json()]
        assert entry_id not in ids

    def test_delete_nonexistent_entry_returns_404(self):
        response = client.delete("/log/entry/nonexistent-id")
        assert response.status_code == 404
