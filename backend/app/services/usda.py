"""
USDA FoodData Central client (PRD Section 8).

Real nutrition lookup against the official USDA FoodData Central API
(https://fdc.nal.usda.gov/api-guide.html). Given a food name + portion weight,
returns authoritative per-100g macros/micros scaled to the portion.

No API key needed to start: defaults to the public DEMO_KEY (rate-limited to
~30 req/hour, 50/day). Set USDA_API_KEY in .env for a real key (free, instant
at https://fdc.nal.usda.gov/api-key-signup.html).
"""

from __future__ import annotations

import asyncio

import httpx

SEARCH_URL = "https://api.nal.usda.gov/fdc/v1/foods/search"

# Comma-separated — the API rejects repeated `dataType` params with HTTP 400.
# Branded is excluded on purpose: it returns per-serving barcode products that
# pollute generic meal queries (use it only on the future /scan/barcode path).
_DATA_TYPE = "Foundation,SR Legacy,Survey (FNDDS)"

# Prefer canonical single-ingredient datasets over FNDDS prepared dishes, so a
# query like "broccoli" matches "Broccoli, raw" rather than "Fried broccoli".
_DATA_TYPE_RANK = {"Foundation": 0, "SR Legacy": 1, "Survey (FNDDS)": 2}

# USDA nutrient numbers (stable across datasets) -> our field names.
# Macros are per 100 g in Foundation / SR Legacy / Survey (FNDDS) datasets.
_NUTRIENT_NUMBERS = {
    "208": "calories",     # Energy (kcal)
    "203": "protein_g",    # Protein
    "204": "fat_g",        # Total lipid (fat)
    "205": "carbs_g",      # Carbohydrate, by difference
    "303": "iron_mg",      # Iron, Fe
    "301": "calcium_mg",   # Calcium, Ca
    "304": "magnesium_mg",  # Magnesium, Mg
    "309": "zinc_mg",      # Zinc, Zn
}

_TIMEOUT = httpx.Timeout(8.0, connect=4.0)
_MAX_ATTEMPTS = 3


def _api_key() -> str:
    from app.config import settings

    return settings.usda_api_key or "DEMO_KEY"


def _extract_per_100g(food: dict) -> dict[str, float]:
    """Pull our tracked nutrients (per 100 g) out of a search hit."""
    out: dict[str, float] = {}
    for fn in food.get("foodNutrients", []):
        number = str(fn.get("nutrientNumber") or "")
        field = _NUTRIENT_NUMBERS.get(number)
        if not field:
            continue
        # Energy can appear as both KCAL and KJ — only take the kcal row.
        if field == "calories" and str(fn.get("unitName", "")).upper() != "KCAL":
            continue
        value = fn.get("value")
        if value is not None:
            out[field] = float(value)
    return out


async def _search(food_name: str) -> list[dict]:
    """Hit the FDC search endpoint with retry/backoff; return the foods list."""
    params = {
        "api_key": _api_key(),
        "query": food_name,
        "pageSize": 10,
        "dataType": _DATA_TYPE,
        "requireAllWords": "false",
    }
    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        for attempt in range(_MAX_ATTEMPTS):
            try:
                resp = await client.get(SEARCH_URL, params=params)
                if resp.status_code == 200:
                    return resp.json().get("foods") or []
                # 429 / transient 400 (DEMO_KEY throttle) / 5xx -> back off and retry.
                if resp.status_code in (400, 429, 500, 502, 503) and attempt < _MAX_ATTEMPTS - 1:
                    await asyncio.sleep(0.6 * (2**attempt))
                    continue
                return []
            except Exception:
                if attempt < _MAX_ATTEMPTS - 1:
                    await asyncio.sleep(0.6 * (2**attempt))
                    continue
                return []
    return []


async def lookup_macros(food_name: str, weight_grams: float) -> dict | None:
    """
    Search USDA FoodData Central for `food_name` and return macros/micros
    scaled to `weight_grams`. Returns None when there is no usable match.
    """
    foods = await _search(food_name)

    # Keep results that actually carry calories, preserving USDA's relevance order.
    candidates = [
        (i, f, p)
        for i, f in enumerate(foods)
        if "calories" in (p := _extract_per_100g(f))
    ]
    if not candidates:
        return None

    # Prefer canonical datasets (Foundation/SR Legacy) over FNDDS prepared dishes,
    # then fall back to USDA relevance order within the same dataset tier.
    candidates.sort(key=lambda c: (_DATA_TYPE_RANK.get(c[1].get("dataType"), 3), c[0]))
    _, food, per_100g = candidates[0]

    scale = weight_grams / 100.0
    result: dict = {
        "matched_name": food.get("description", food_name),
        "fdc_id": food.get("fdcId"),
        "data_type": food.get("dataType"),
        "source": "usda",
    }
    for field, per100 in per_100g.items():
        result[field] = round(per100 * scale, 1)
    return result


async def lookup_macros_batch(
    items: list[tuple[str, float]],
) -> list[dict | None]:
    """Concurrently look up many (food_name, weight_grams) pairs."""
    return await asyncio.gather(*(lookup_macros(name, w) for name, w in items))
