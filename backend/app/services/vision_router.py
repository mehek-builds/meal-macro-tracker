"""
Vision model router (PRD Section 7.4).

Real path: sends the photo to a vision model (OpenAI GPT-4o preferred, Anthropic
Claude as fallback) with the SCAN_SYSTEM_PROMPT + response schema, and parses the
structured result. Falls back to a canned stub only when no key is configured.

The stub RAG override (fuzzy_lookup) is applied ONLY on the stub path — running it
on real model output would clobber the model's estimates with placeholder numbers.
"""

from __future__ import annotations

import json
import re

from app.models.nutrition import NutritionItem, ScanResult


# ---------- helpers ----------

def _normalize_image(image_b64: str) -> tuple[str, str]:
    """Strip an optional data-URL prefix; return (media_type, base64_data)."""
    media_type = "image/jpeg"
    b64 = image_b64.strip()
    if b64.startswith("data:"):
        header, _, rest = b64.partition(",")
        m = re.match(r"data:(image/[A-Za-z0-9.+-]+);base64", header)
        if m:
            media_type = m.group(1)
        b64 = rest
    return media_type, b64


def _clamp01(x: float) -> float:
    return max(0.0, min(1.0, x))


def _depth_note(depth_data: dict | None) -> str:
    if not depth_data:
        return ""
    return (
        "\n\nLiDAR depth/volume data (use as the PRIMARY basis for portion "
        f"estimation): {json.dumps(depth_data)}"
    )


def _user_text(depth_data: dict | None) -> str:
    from app.prompts.scan import SCAN_RESPONSE_SCHEMA

    return (
        "Analyze this food photo. Return ONLY a single JSON object (no markdown, "
        "no prose) that matches this JSON schema:\n"
        + json.dumps(SCAN_RESPONSE_SCHEMA)
        + _depth_note(depth_data)
    )


def _parse_scan_json(data: dict, model_label: str) -> ScanResult:
    items: list[NutritionItem] = []
    for it in data.get("items", []):
        items.append(
            NutritionItem(
                food_name=it["food_name"],
                portion_description=it.get("portion_description", ""),
                weight_grams=float(it["weight_grams"]),
                calories=float(it["calories"]),
                protein_g=float(it["protein_g"]),
                carbs_g=float(it["carbs_g"]),
                fat_g=float(it["fat_g"]),
                confidence=_clamp01(float(it.get("confidence", 0.7))),
                hidden_calories_warning=it.get("hidden_calories_warning") or None,
            )
        )
    if data.get("overall_confidence") is not None:
        overall = _clamp01(float(data["overall_confidence"]))
    else:
        overall = _clamp01(sum(i.confidence for i in items) / len(items)) if items else 0.0
    notes = data.get("scan_notes") or f"Analyzed by {model_label}."
    return ScanResult(items=items, overall_confidence=overall, scan_notes=notes, stub=False)


def _strip_fences(raw: str) -> str:
    raw = raw.strip()
    if raw.startswith("```"):
        raw = re.sub(r"^```[A-Za-z0-9]*\n?", "", raw)
        raw = re.sub(r"\n?```$", "", raw).strip()
    return raw


# ---------- real model calls ----------

async def _call_openai(image_b64: str, depth_data: dict | None) -> ScanResult:
    """Real vision analysis via OpenAI GPT-4o (PRD Section 7.4/7.5)."""
    from openai import AsyncOpenAI

    from app.config import settings
    from app.prompts.scan import SCAN_SYSTEM_PROMPT

    media_type, b64 = _normalize_image(image_b64)
    client = AsyncOpenAI(api_key=settings.openai_api_key)
    model = settings.vision_model_primary or "gpt-4o"

    resp = await client.chat.completions.create(
        model=model,
        max_tokens=1500,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": SCAN_SYSTEM_PROMPT},
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": _user_text(depth_data)},
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:{media_type};base64,{b64}"},
                    },
                ],
            },
        ],
    )
    data = json.loads(_strip_fences(resp.choices[0].message.content or "{}"))
    return _parse_scan_json(data, model)


async def _call_claude(image_b64: str, depth_data: dict | None) -> ScanResult:
    """Real vision analysis via Anthropic Claude (fallback)."""
    from anthropic import AsyncAnthropic

    from app.config import settings
    from app.prompts.scan import SCAN_SYSTEM_PROMPT

    media_type, b64 = _normalize_image(image_b64)
    client = AsyncAnthropic(api_key=settings.anthropic_api_key)
    model = settings.vision_model_secondary or "claude-sonnet-4-6"

    resp = await client.messages.create(
        model=model,
        max_tokens=1500,
        system=SCAN_SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {"type": "base64", "media_type": media_type, "data": b64},
                    },
                    {"type": "text", "text": _user_text(depth_data)},
                ],
            }
        ],
    )
    raw = "".join(
        block.text for block in resp.content if getattr(block, "type", None) == "text"
    )
    data = json.loads(_strip_fences(raw))
    return _parse_scan_json(data, model)


# ---------- USDA verification ----------

async def _augment_with_usda(result: ScanResult) -> ScanResult:
    """
    Replace the vision model's macro guesses with authoritative USDA FoodData
    Central values, scaled to the model's portion estimate. The model still
    does what it is good at (identifying the food and estimating the portion);
    USDA supplies the trustworthy calories/macros/micros for that food.
    """
    from app.services.usda import lookup_macros_batch

    if not result.items:
        return result

    lookups = await lookup_macros_batch(
        [(it.food_name, it.weight_grams) for it in result.items]
    )
    matched = 0
    for item, looked in zip(result.items, lookups):
        if looked and looked.get("calories") is not None:
            item.calories = looked["calories"]
            item.protein_g = looked.get("protein_g", item.protein_g)
            item.carbs_g = looked.get("carbs_g", item.carbs_g)
            item.fat_g = looked.get("fat_g", item.fat_g)
            for micro in ("iron_mg", "calcium_mg", "magnesium_mg", "zinc_mg"):
                if looked.get(micro) is not None:
                    setattr(item, micro, looked[micro])
            item.data_source = f"usda:{looked.get('fdc_id')}"
            item.matched_food = looked.get("matched_name")
            matched += 1
        else:
            item.data_source = "model_estimate"

    if matched:
        result.scan_notes = (
            f"{result.scan_notes} | {matched}/{len(result.items)} item(s) "
            "verified against USDA FoodData Central."
        ).strip(" |")
    return result


# ---------- public entry point ----------

async def route_food_scan(image_b64: str, depth_data: dict | None) -> ScanResult:
    """
    Route a food scan to a real vision model (OpenAI preferred, Claude fallback),
    then verify the macros against USDA FoodData Central.
    Returns the canned stub only when no API key is configured.
    """
    from app.config import settings

    if settings.openai_api_key:
        try:
            result = await _call_openai(image_b64, depth_data)
            return await _augment_with_usda(result)
        except Exception as exc:
            return ScanResult(
                items=[], overall_confidence=0.0,
                scan_notes=f"openai vision failed: {type(exc).__name__}: {exc}", stub=True,
            )

    if settings.anthropic_api_key:
        try:
            result = await _call_claude(image_b64, depth_data)
            return await _augment_with_usda(result)
        except Exception as exc:
            return ScanResult(
                items=[], overall_confidence=0.0,
                scan_notes=f"claude vision failed: {type(exc).__name__}: {exc}", stub=True,
            )

    # --- No key: canned stub (Section 7.4) ---
    stub_item = NutritionItem(
        food_name="Sample Food (stub)",
        portion_description="100g estimated",
        weight_grams=100, calories=200, protein_g=15, carbs_g=20, fat_g=5,
        confidence=0.0, hidden_calories_warning=None,
    )
    result = ScanResult(
        items=[stub_item], overall_confidence=0.0,
        scan_notes="stub - no API key set, so no model call was made.", stub=True,
    )
    from app.services.rag import fuzzy_lookup
    for item in result.items:
        looked_up = fuzzy_lookup(item.food_name, item.weight_grams)
        item.calories = looked_up["calories"]
        item.protein_g = looked_up["protein_g"]
        item.carbs_g = looked_up["carbs_g"]
        item.fat_g = looked_up["fat_g"]
    return result
