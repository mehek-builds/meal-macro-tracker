"""
RAG nutrition lookup — STUB (PRD Section 7.6).

Real implementation requires:
  - pgvector + Supabase Postgres (pip install -e ".[data]")
  - Pre-embedded USDA FoodData Central (300K+ foods) with text-embedding-3-small
  - Optional: IFCT index for South Asian dishes (PRD Section 8)
  - Redis-style in-memory cache keyed by food_name (24h TTL)
"""

from __future__ import annotations

# Canned per-100g values used by the stub (representative chicken breast)
_STUB_PER_100G: dict[str, float] = {
    "calories": 165.0,
    "protein_g": 31.0,
    "carbs_g": 0.0,
    "fat_g": 3.6,
}


def fuzzy_lookup(food_name: str, weight_grams: float) -> dict:
    """
    Return scaled nutrition data for `food_name` at `weight_grams` portion.

    STUB: always returns canned per-100g values scaled to weight_grams.
    The note field flags this for the caller.

    Real flow (PRD Section 7.6):
      1. Embed food_name with text-embedding-3-small
      2. pgvector similarity search against USDA / IFCT embeddings
      3. Scale per-100g values to weight_grams
      4. Cache result for 24h
    """
    # TODO(Section 7.6): replace with real pgvector similarity search
    scale = weight_grams / 100.0
    return {
        "food_name": food_name,
        "weight_grams": weight_grams,
        "calories": round(_STUB_PER_100G["calories"] * scale, 1),
        "protein_g": round(_STUB_PER_100G["protein_g"] * scale, 1),
        "carbs_g": round(_STUB_PER_100G["carbs_g"] * scale, 1),
        "fat_g": round(_STUB_PER_100G["fat_g"] * scale, 1),
        "source": "stub",
        "note": (
            "stub - canned per-100g values scaled to portion. "
            "Real lookup uses pgvector USDA/IFCT embeddings (Section 7.6 TODO)."
        ),
    }
