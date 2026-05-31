"""
Integration tests for food database endpoints:
  POST /foods/custom
  GET  /foods/search
"""

import pytest
from fastapi.testclient import TestClient

import app.store as store
from app.main import app

client = TestClient(app)

CUSTOM_FOOD_PAYLOAD = {
    "name": "Homemade Dal",
    "calories_per_100g": 120.0,
    "protein_per_100g": 7.5,
    "carbs_per_100g": 18.0,
    "fat_per_100g": 2.5,
    "notes": "Red lentil dal with tadka",
}


@pytest.fixture(autouse=True)
def reset_store():
    store.clear_all()
    yield
    store.clear_all()


def _post_custom_food(payload: dict = None) -> dict:
    p = payload or CUSTOM_FOOD_PAYLOAD
    resp = client.post("/foods/custom", json=p)
    assert resp.status_code == 201
    return resp.json()


class TestCreateCustomFood:
    def test_create_returns_201(self):
        response = client.post("/foods/custom", json=CUSTOM_FOOD_PAYLOAD)
        assert response.status_code == 201

    def test_create_returns_correct_fields(self):
        data = _post_custom_food()
        assert data["name"] == "Homemade Dal"
        assert data["calories_per_100g"] == 120.0
        assert data["protein_per_100g"] == 7.5

    def test_create_assigns_id(self):
        data = _post_custom_food()
        assert data["id"] is not None


class TestSearchFoods:
    def test_search_returns_200(self):
        response = client.get("/foods/search", params={"q": "dal"})
        assert response.status_code == 200

    def test_search_returns_list(self):
        response = client.get("/foods/search", params={"q": "dal"})
        assert isinstance(response.json(), list)

    def test_search_finds_custom_food_by_name(self):
        _post_custom_food()
        response = client.get("/foods/search", params={"q": "dal"})
        names = [r["name"] for r in response.json()]
        assert any("Dal" in n or "dal" in n.lower() for n in names)

    def test_search_custom_food_has_correct_source(self):
        _post_custom_food()
        response = client.get("/foods/search", params={"q": "Homemade Dal"})
        results = response.json()
        custom_results = [r for r in results if r["source"] == "custom"]
        assert len(custom_results) >= 1

    def test_search_fallback_to_stub_when_no_custom_match(self):
        """When there is no custom food match, the RAG stub result is returned."""
        response = client.get("/foods/search", params={"q": "chicken breast"})
        data = response.json()
        assert len(data) >= 1
        # At minimum one stub result should come back
        sources = [r["source"] for r in data]
        assert any(s in ("stub", "custom") for s in sources)

    def test_search_with_weight_grams_param(self):
        """weight_grams query param is accepted."""
        response = client.get("/foods/search", params={"q": "oats", "weight_grams": 50.0})
        assert response.status_code == 200

    def test_search_case_insensitive_match(self):
        _post_custom_food()
        response = client.get("/foods/search", params={"q": "HOMEMADE"})
        names = [r["name"].lower() for r in response.json()]
        assert any("homemade" in n for n in names)
