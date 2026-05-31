"""
Food database endpoints (PRD Sections 4.5, 8, 16).

POST /foods/custom   - create a custom food
GET  /foods/search   - search (stub: queries custom foods + canned results)
"""

from __future__ import annotations

from fastapi import APIRouter

import app.store as store
from app.models.nutrition import CustomFood, FoodSearchResult
from app.services.rag import fuzzy_lookup

router = APIRouter(prefix="/foods", tags=["foods"])

COLLECTION = "custom_foods"


@router.post("/custom", response_model=CustomFood, status_code=201)
def create_custom_food(food: CustomFood) -> CustomFood:
    """Save a custom food definition."""
    saved = store.insert(COLLECTION, food.model_dump())
    return CustomFood(**saved)


@router.get("/search", response_model=list[FoodSearchResult])
def search_foods(q: str, weight_grams: float = 100.0) -> list[FoodSearchResult]:
    """
    Fuzzy search against the food database.
    Currently: searches custom foods in-memory, then falls through to RAG stub.
    TODO(Section 7.6 / 8): real pgvector similarity search against USDA + IFCT embeddings.
    """
    results: list[FoodSearchResult] = []

    # Search custom foods
    q_lower = q.lower()
    for r in store.list_all(COLLECTION):
        if q_lower in r.get("name", "").lower():
            results.append(FoodSearchResult(
                id=r["id"],
                name=r["name"],
                source="custom",
                calories_per_100g=r.get("calories_per_100g", 0),
                protein_per_100g=r.get("protein_per_100g", 0),
                carbs_per_100g=r.get("carbs_per_100g", 0),
                fat_per_100g=r.get("fat_per_100g", 0),
            ))

    # Fall back to RAG stub for a single representative result
    if not results:
        stub = fuzzy_lookup(q, weight_grams)
        results.append(FoodSearchResult(
            id="stub-0",
            name=stub["food_name"],
            source="stub",
            calories_per_100g=stub["calories"] / (weight_grams / 100),
            protein_per_100g=stub["protein_g"] / (weight_grams / 100),
            carbs_per_100g=stub["carbs_g"] / (weight_grams / 100),
            fat_per_100g=stub["fat_g"] / (weight_grams / 100),
        ))

    return results
